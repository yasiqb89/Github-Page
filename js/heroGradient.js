// Hero aura — a flowing "liquid silk" gradient rendered on a WebGL canvas
// behind the grid. A fractal-noise field is warped by itself (domain warping)
// and drifts over time, then mapped through the brand palette. Rendered at a
// fraction of native resolution (soft + cheap) and CSS screen-blended, so only
// its light adds over the dark hero. This is the expensive-feeling part: the
// organic motion comes from the warp, not from moving rigid shapes.
export function initHeroGradient(canvas) {
  if (!canvas) return null;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Skip the fullscreen shader on touch / low-memory devices — it's a subtle
  // ambient effect, not worth the GPU/battery cost on phones or low-end devices.
  const coarse = matchMedia('(hover: none), (pointer: coarse)').matches;
  const lowMem = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory < 4;
  if (coarse || lowMem) return null;

  const gl = canvas.getContext('webgl', {
    antialias: false, alpha: true, premultipliedAlpha: false, powerPreference: 'low-power',
  });
  if (!gl) return null;

  const VERT = `
    attribute vec2 p;
    void main(){ gl_Position = vec4(p, 0.0, 1.0); }
  `;

  const FRAG = `
    precision highp float;
    uniform vec2  u_res;
    uniform float u_time;

    float hash(vec2 p){ p = fract(p*vec2(123.34,345.45)); p += dot(p,p+34.345); return fract(p.x*p.y); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      float a = hash(i), b = hash(i+vec2(1.,0.)), c = hash(i+vec2(0.,1.)), d = hash(i+vec2(1.,1.));
      vec2 u = f*f*(3.0-2.0*f);
      return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
    }
    float fbm(vec2 p){
      float v = 0.0, a = 0.5;
      for(int i=0;i<3;i++){ v += a*noise(p); p = p*2.0 + vec2(11.3,7.7); a *= 0.5; }
      return v;
    }

    // smooth multi-stop ramp through the app palette: midnight-blue base, then
    // cyan -> green -> lime, weighted lime-forward like the app's identity ring.
    vec3 ramp(float x){
      vec3 deep = vec3(0.082,0.137,0.192);  // #152331  app midnight
      vec3 cyan = vec3(0.353,0.784,0.980);  // #5AC8FA
      vec3 grn  = vec3(0.482,1.0,0.482);    // #7BFF7B
      vec3 lime = vec3(0.749,1.0,0.278);    // #BFFF47
      vec3 c = mix(vec3(0.0), deep, smoothstep(0.0,0.20,x));
      c = mix(c, cyan, smoothstep(0.16,0.28,x));   // brief cyan hint in dim valleys
      c = mix(c, grn,  smoothstep(0.24,0.50,x));   // green takes over early
      c = mix(c, lime, smoothstep(0.44,1.0,x));    // lime dominates the bright half
      return c;
    }

    void main(){
      vec2 uv = gl_FragCoord.xy / u_res;
      vec2 p  = uv * vec2(u_res.x/u_res.y, 1.0) * 1.6;
      float t = u_time * 0.06;

      // domain warp — warp the field by two more fbm fields, drifting in time
      vec2 q = vec2(fbm(p + vec2(0.0, t*1.1)), fbm(p + vec2(5.2, -t)));
      vec2 r = vec2(fbm(p + 3.0*q + vec2(1.7,9.2) + t*0.6),
                    fbm(p + 3.0*q + vec2(8.3,2.8) - t*0.7));
      float f = fbm(p + 2.5*r);

      float field = clamp(f*0.55 + r.x*0.30 + q.y*0.15, 0.0, 1.0);
      vec3 col = ramp(field);

      // glowing filaments — bright ridges, dark valleys
      float lum = smoothstep(0.18, 0.95, f) * 0.9 + 0.1;
      col *= lum;

      // pool on the right, fade left + bottom (matches the existing glow)
      float mask = smoothstep(0.02, 0.82, uv.x) * smoothstep(0.0, 0.42, uv.y);
      col *= mask * 0.62;

      // dither to kill banding
      col += (hash(gl_FragCoord.xy + u_time) - 0.5) * 0.016;

      gl_FragColor = vec4(max(col, 0.0), 1.0);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('hero aura shader:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('hero aura link:', gl.getProgramInfoLog(prog));
    return null;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'u_res');
  const uTime = gl.getUniformLocation(prog, 'u_time');

  // Render as a fraction of DEVICE pixels, not CSS pixels. The old version
  // scaled CSS px and ignored DPR, so on a 2x display the backing ended up
  // ~1/3.6 of the shown size — and the per-fragment anti-band dither, sampled
  // once per backing pixel, got magnified into visible coarse grain on the
  // upscale. Targeting a fraction of device px keeps the aura soft but caps the
  // upscale near ~1.5-1.8x, so the dither reads as fine noise again. Still
  // cheap: a 3-octave fbm at 30fps, gated to when the hero is on screen.
  const SCALE = 0.7;                  // fraction of device resolution — soft, not blocky
  const BUDGET = 1600;                // max backing long-edge, in device px
  function resize() {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const devW = r.width * dpr, devH = r.height * dpr;
    const s = Math.min(SCALE, BUDGET / Math.max(devW, devH, 1));
    const w = Math.max(2, Math.round(devW * s));
    const h = Math.max(2, Math.round(devH * s));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  }
  resize();
  addEventListener('resize', resize, { passive: true });

  const start = performance.now();
  const FRAME_MS = 1000 / 30;         // ambient drift — 30fps is plenty, halves GPU
  let raf = null, running = false, lastDraw = 0;
  function frame(now) {
    raf = running ? requestAnimationFrame(frame) : null;
    if (now - lastDraw < FRAME_MS) return;
    lastDraw = now;
    gl.uniform1f(uTime, (now - start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function play() { if (running || reduced) return; running = true; raf = requestAnimationFrame(frame); }
  function pause() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }

  // always paint one frame (covers reduced-motion + first paint before play)
  gl.uniform1f(uTime, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  // only animate while the hero is on screen
  let io = null;
  if (!reduced) {
    io = new IntersectionObserver(
      (entries) => { entries[0].isIntersecting ? play() : pause(); },
      { threshold: 0 }
    );
    io.observe(canvas);
  }

  return {
    dispose() {
      pause();
      if (io) io.disconnect();
      removeEventListener('resize', resize);
    },
  };
}
