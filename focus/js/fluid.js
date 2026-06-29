// WebGL fluid cursor — Pavel Dobryakov's WebGL-Fluid-Simulation (MIT)
// Same algorithm Inspira UI wraps in Vue. Vanilla JS port.
// Screen-blended over the page; black → invisible, bright dye → visible.
export function initFluid(canvas) {
  if (!canvas) return null;
  if (matchMedia('(hover: none)').matches) return null;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return null;

  // ── WebGL context ─────────────────────────────────────────────────
  let gl = canvas.getContext('webgl2');
  const isWebGL2 = !!gl;
  if (!gl) gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return null;

  // ── config ────────────────────────────────────────────────────────
  const SIM_RES          = 128;
  const DYE_RES          = 1024;
  const DENSITY_DISSIP   = 2.8;
  const VELOCITY_DISSIP  = 2.0;
  const PRESSURE_VAL     = 0.1;
  const PRESSURE_ITERS   = 20;
  const CURL             = 3;
  const SPLAT_RADIUS     = 0.22;
  const SPLAT_FORCE      = 6000;

  // ── extensions + texture formats ─────────────────────────────────
  let halfType, linFilter;
  if (isWebGL2) {
    gl.getExtension('EXT_color_buffer_float');
    halfType  = gl.HALF_FLOAT;
    linFilter = gl.LINEAR; // half-float linear filtering is core in WebGL2, no extension needed
  } else {
    const hf   = gl.getExtension('OES_texture_half_float');
    const hfl  = gl.getExtension('OES_texture_half_float_linear');
    gl.getExtension('EXT_color_buffer_half_float');
    halfType  = hf ? hf.HALF_FLOAT_OES : gl.UNSIGNED_BYTE;
    linFilter = hfl ? gl.LINEAR : gl.NEAREST;
  }

  function fboSupported(intFmt, fmt) {
    const t = gl.createTexture(), f = gl.createFramebuffer();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, intFmt, 4, 4, 0, fmt, halfType, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteTexture(t); gl.deleteFramebuffer(f);
    return ok;
  }

  let fmtRGBA, fmtRG, fmtR;
  if (isWebGL2) {
    fmtRGBA = fboSupported(gl.RGBA16F, gl.RGBA) ? { i: gl.RGBA16F, f: gl.RGBA   } : { i: gl.RGBA, f: gl.RGBA };
    fmtRG   = fboSupported(gl.RG16F,   gl.RG  ) ? { i: gl.RG16F,   f: gl.RG     } : fmtRGBA;
    fmtR    = fboSupported(gl.R16F,    gl.RED  ) ? { i: gl.R16F,    f: gl.RED    } : fmtRG;
  } else {
    fmtRGBA = fmtRG = fmtR = { i: gl.RGBA, f: gl.RGBA };
  }

  // ── vertex shader (shared) ────────────────────────────────────────
  const VS = `precision highp float;
    attribute vec2 aPosition;
    varying vec2 vUv;
    varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
    uniform vec2 texelSize;
    void main() {
      vUv = aPosition * 0.5 + 0.5;
      vL = vUv - vec2(texelSize.x, 0.0);
      vR = vUv + vec2(texelSize.x, 0.0);
      vT = vUv + vec2(0.0, texelSize.y);
      vB = vUv - vec2(0.0, texelSize.y);
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }`;

  // ── fragment shaders ──────────────────────────────────────────────
  const FS = {
    clear: `precision mediump float;
      varying vec2 vUv; uniform sampler2D uTexture; uniform float value;
      void main() { gl_FragColor = value * texture2D(uTexture, vUv); }`,

    display: `precision highp float;
      varying vec2 vUv; uniform sampler2D uTexture;
      void main() { gl_FragColor = vec4(texture2D(uTexture, vUv).rgb, 1.0); }`,

    splat: `precision highp float;
      varying vec2 vUv; uniform sampler2D uTarget;
      uniform float aspectRatio; uniform vec3 color; uniform vec2 point; uniform float radius;
      void main() {
        vec2 p = vUv - point; p.x *= aspectRatio;
        vec3 splat = exp(-dot(p,p)/radius) * color;
        gl_FragColor = vec4(texture2D(uTarget,vUv).xyz + splat, 1.0);
      }`,

    advection: `precision highp float;
      varying vec2 vUv; uniform sampler2D uVelocity; uniform sampler2D uSource;
      uniform vec2 texelSize; uniform vec2 dyeTexelSize; uniform float dt; uniform float dissipation;
      vec4 bilerp(sampler2D s, vec2 uv, vec2 ts) {
        vec2 st = uv/ts - 0.5; vec2 iuv = floor(st); vec2 fuv = fract(st);
        vec4 a=texture2D(s,(iuv+vec2(.5,.5))*ts); vec4 b=texture2D(s,(iuv+vec2(1.5,.5))*ts);
        vec4 c=texture2D(s,(iuv+vec2(.5,1.5))*ts); vec4 d=texture2D(s,(iuv+vec2(1.5,1.5))*ts);
        return mix(mix(a,b,fuv.x),mix(c,d,fuv.x),fuv.y);
      }
      void main() {
        vec2 coord = vUv - dt * bilerp(uVelocity,vUv,texelSize).xy * texelSize;
        gl_FragColor = dissipation * bilerp(uSource,coord,dyeTexelSize);
      }`,

    divergence: `precision mediump float;
      varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
      uniform sampler2D uVelocity;
      void main() {
        float L=texture2D(uVelocity,vL).x, R=texture2D(uVelocity,vR).x;
        float T=texture2D(uVelocity,vT).y, B=texture2D(uVelocity,vB).y;
        vec2 C=texture2D(uVelocity,vUv).xy;
        if(vL.x<0.0){L=-C.x;} if(vR.x>1.0){R=-C.x;} if(vT.y>1.0){T=-C.y;} if(vB.y<0.0){B=-C.y;}
        gl_FragColor = vec4(0.5*(R-L+T-B),0,0,1);
      }`,

    curl: `precision mediump float;
      varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
      uniform sampler2D uVelocity;
      void main() {
        float L=texture2D(uVelocity,vL).y, R=texture2D(uVelocity,vR).y;
        float T=texture2D(uVelocity,vT).x, B=texture2D(uVelocity,vB).x;
        gl_FragColor = vec4(0.5*(R-L-T+B),0,0,1);
      }`,

    vorticity: `precision highp float;
      varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
      uniform sampler2D uVelocity; uniform sampler2D uCurl; uniform float curl; uniform float dt;
      void main() {
        float L=texture2D(uCurl,vL).x, R=texture2D(uCurl,vR).x;
        float T=texture2D(uCurl,vT).x, B=texture2D(uCurl,vB).x, C=texture2D(uCurl,vUv).x;
        vec2 force=0.5*vec2(abs(T)-abs(B),abs(R)-abs(L));
        force /= length(force)+0.0001; force *= curl*C; force.y *= -1.0;
        gl_FragColor = vec4(texture2D(uVelocity,vUv).xy+force*dt,0,1);
      }`,

    pressure: `precision mediump float;
      varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
      uniform sampler2D uPressure; uniform sampler2D uDivergence;
      void main() {
        float L=texture2D(uPressure,vL).x, R=texture2D(uPressure,vR).x;
        float T=texture2D(uPressure,vT).x, B=texture2D(uPressure,vB).x;
        float div=texture2D(uDivergence,vUv).x;
        gl_FragColor = vec4((L+R+B+T-div)*0.25,0,0,1);
      }`,

    gradientSubtract: `precision mediump float;
      varying vec2 vUv; varying vec2 vL; varying vec2 vR; varying vec2 vT; varying vec2 vB;
      uniform sampler2D uPressure; uniform sampler2D uVelocity;
      void main() {
        float L=texture2D(uPressure,vL).x, R=texture2D(uPressure,vR).x;
        float T=texture2D(uPressure,vT).x, B=texture2D(uPressure,vB).x;
        vec2 vel=texture2D(uVelocity,vUv).xy - vec2(R-L,T-B);
        gl_FragColor = vec4(vel,0,1);
      }`,
  };

  // ── compile + link ────────────────────────────────────────────────
  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    return s;
  }
  const baseVS = compile(gl.VERTEX_SHADER, VS);

  function makeProgram(fsSrc) {
    const p = gl.createProgram();
    gl.attachShader(p, baseVS);
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fsSrc));
    gl.bindAttribLocation(p, 0, 'aPosition');
    gl.linkProgram(p);
    const u = {};
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i);
      u[info.name] = gl.getUniformLocation(p, info.name);
    }
    return { p, u };
  }

  const P = {};
  for (const [k, src] of Object.entries(FS)) P[k] = makeProgram(src);

  // ── full-screen quad ──────────────────────────────────────────────
  const qbuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, qbuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, -1,1, 1,1, 1,-1]), gl.STATIC_DRAW);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(0);

  function blit(fbo) {
    if (fbo) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.fbo);
      gl.viewport(0, 0, fbo.w, fbo.h);
    } else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
  }

  // ── FBO helpers ───────────────────────────────────────────────────
  function makeFBO(w, h, intFmt, fmt, filter) {
    const tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, intFmt, w, h, 0, fmt, halfType, null);
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.viewport(0, 0, w, h); gl.clear(gl.COLOR_BUFFER_BIT);
    return {
      tex, fbo, w, h,
      attach(id) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, tex); return id; },
    };
  }

  function makePP(w, h, intFmt, fmt, filter) {
    let a = makeFBO(w, h, intFmt, fmt, filter);
    let b = makeFBO(w, h, intFmt, fmt, filter);
    return {
      w, h,
      get read() { return a; },
      get write() { return b; },
      swap() { [a, b] = [b, a]; },
    };
  }

  // ── sim state ─────────────────────────────────────────────────────
  let vel, dye, pres, divFBO, curlFBO;

  function getRes(base) {
    const ar = innerWidth / innerHeight;
    return ar > 1
      ? { w: Math.round(base * ar), h: base }
      : { w: base, h: Math.round(base / ar) };
  }

  function initFBOs() {
    const s = getRes(SIM_RES), d = getRes(DYE_RES);
    vel     = makePP(s.w, s.h, fmtRG.i,   fmtRG.f,   linFilter);
    dye     = makePP(d.w, d.h, fmtRGBA.i, fmtRGBA.f, linFilter);
    pres    = makePP(s.w, s.h, fmtR.i,    fmtR.f,    gl.NEAREST);
    divFBO  = makeFBO(s.w, s.h, fmtR.i,   fmtR.f,    gl.NEAREST);
    curlFBO = makeFBO(s.w, s.h, fmtR.i,   fmtR.f,    gl.NEAREST);
  }

  // ── color (HSL cycling biased toward lime+cyan) ───────────────────
  let hue = 76;
  function nextColor() {
    hue = (hue + 1.8) % 360;
    return hsl(hue / 360, 0.85, 0.55);
  }
  function hsl(h, s, l) {
    const q = l < 0.5 ? l*(1+s) : l+s-l*s, p = 2*l-q;
    const c = (t) => {
      t = ((t % 1) + 1) % 1;
      if (t < 1/6) return p + (q-p)*6*t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q-p)*(2/3-t)*6;
      return p;
    };
    return { r: c(h+1/3), g: c(h), b: c(h-1/3) };
  }

  // ── pointer input ─────────────────────────────────────────────────
  let mx = 0, my = 0, pmx = 0, pmy = 0, moved = false;

  function onMove(e) {
    if (!moved) { pmx = mx = e.clientX; pmy = my = e.clientY; }
    mx = e.clientX; my = e.clientY;
    moved = true;
  }
  addEventListener('mousemove', onMove, { passive: true });
  addEventListener('mouseleave', () => { moved = false; }, { passive: true });

  // ── splat ─────────────────────────────────────────────────────────
  function splat(x, y, dx, dy, col) {
    const { p, u } = P.splat;
    const ar = canvas.width / canvas.height;
    const r  = SPLAT_RADIUS / 100 * (ar > 1 ? ar : 1);
    gl.useProgram(p);
    // velocity splat
    gl.uniform1i(u.uTarget, vel.read.attach(0));
    gl.uniform1f(u.aspectRatio, ar);
    gl.uniform2f(u.point, x / canvas.width, 1 - y / canvas.height);
    gl.uniform3f(u.color, dx, -dy, 0);
    gl.uniform1f(u.radius, r);
    blit(vel.write); vel.swap();
    // dye splat
    gl.uniform1i(u.uTarget, dye.read.attach(0));
    gl.uniform3f(u.color, col.r, col.g, col.b);
    blit(dye.write); dye.swap();
  }

  // ── simulation step ───────────────────────────────────────────────
  function step(dt) {
    gl.disable(gl.BLEND);

    // curl
    { const { p, u } = P.curl; gl.useProgram(p);
      gl.uniform2f(u.texelSize, 1/vel.w, 1/vel.h);
      gl.uniform1i(u.uVelocity, vel.read.attach(0));
      blit(curlFBO); }

    // vorticity confinement
    { const { p, u } = P.vorticity; gl.useProgram(p);
      gl.uniform2f(u.texelSize, 1/vel.w, 1/vel.h);
      gl.uniform1i(u.uVelocity, vel.read.attach(0));
      gl.uniform1i(u.uCurl, curlFBO.attach(1));
      gl.uniform1f(u.curl, CURL); gl.uniform1f(u.dt, dt);
      blit(vel.write); vel.swap(); }

    // divergence
    { const { p, u } = P.divergence; gl.useProgram(p);
      gl.uniform2f(u.texelSize, 1/vel.w, 1/vel.h);
      gl.uniform1i(u.uVelocity, vel.read.attach(0));
      blit(divFBO); }

    // clear pressure
    { const { p, u } = P.clear; gl.useProgram(p);
      gl.uniform1i(u.uTexture, pres.read.attach(0));
      gl.uniform1f(u.value, PRESSURE_VAL);
      blit(pres.write); pres.swap(); }

    // pressure solve (Jacobi)
    { const { p, u } = P.pressure; gl.useProgram(p);
      gl.uniform2f(u.texelSize, 1/vel.w, 1/vel.h);
      gl.uniform1i(u.uDivergence, divFBO.attach(0));
      for (let i = 0; i < PRESSURE_ITERS; i++) {
        gl.uniform1i(u.uPressure, pres.read.attach(1));
        blit(pres.write); pres.swap();
      } }

    // gradient subtract
    { const { p, u } = P.gradientSubtract; gl.useProgram(p);
      gl.uniform2f(u.texelSize, 1/vel.w, 1/vel.h);
      gl.uniform1i(u.uPressure, pres.read.attach(0));
      gl.uniform1i(u.uVelocity, vel.read.attach(1));
      blit(vel.write); vel.swap(); }

    // advect velocity (self-advection)
    { const { p, u } = P.advection; gl.useProgram(p);
      gl.uniform2f(u.texelSize, 1/vel.w, 1/vel.h);
      gl.uniform2f(u.dyeTexelSize, 1/vel.w, 1/vel.h);
      const v0 = vel.read.attach(0);
      gl.uniform1i(u.uVelocity, v0);
      gl.uniform1i(u.uSource, v0);
      gl.uniform1f(u.dt, dt); gl.uniform1f(u.dissipation, VELOCITY_DISSIP);
      blit(vel.write); vel.swap(); }

    // advect dye
    { const { p, u } = P.advection; gl.useProgram(p);
      gl.uniform2f(u.texelSize, 1/vel.w, 1/vel.h);
      gl.uniform2f(u.dyeTexelSize, 1/dye.w, 1/dye.h);
      gl.uniform1i(u.uVelocity, vel.read.attach(0));
      gl.uniform1i(u.uSource, dye.read.attach(1));
      gl.uniform1f(u.dt, dt); gl.uniform1f(u.dissipation, DENSITY_DISSIP);
      blit(dye.write); dye.swap(); }
  }

  // ── render to screen ──────────────────────────────────────────────
  function render() {
    gl.disable(gl.BLEND);
    gl.useProgram(P.display.p);
    gl.uniform1i(P.display.u.uTexture, dye.read.attach(0));
    blit(null);
  }

  // ── resize ────────────────────────────────────────────────────────
  function resize() {
    canvas.width  = innerWidth;
    canvas.height = innerHeight;
    initFBOs();
  }
  addEventListener('resize', resize, { passive: true });

  // ── loop ──────────────────────────────────────────────────────────
  let last = performance.now(), raf;
  function tick() {
    raf = requestAnimationFrame(tick);
    const now = performance.now();
    const dt  = Math.min((now - last) / 1000, 0.016666);
    last = now;

    if (moved) {
      splat(mx, my, (mx - pmx) * SPLAT_FORCE, (my - pmy) * SPLAT_FORCE, nextColor());
      pmx = mx; pmy = my;
      moved = false;
    }

    step(dt);
    render();
  }

  gl.clearColor(0, 0, 0, 1);
  resize();
  tick();

  return {
    dispose() {
      cancelAnimationFrame(raf);
      removeEventListener('resize', resize);
      removeEventListener('mousemove', onMove);
    },
  };
}
