// ── WebGL point-sprite renderer for the "Inside Focus" ambient field ────────
// Replaces up to 1600 individual ctx.drawImage() calls/frame with one GPU
// draw call. The morph/parallax/cursor-lens physics that COMPUTES each
// particle's (x, y, size, alpha) stays exactly as it was in storyboard.js —
// this module only takes those finished numbers and rasterises them.
//
// Coordinates in: CSS-pixel space (same numbers storyboard.js already
// computes for Canvas2D — bx/by/scale/sx/sy are unchanged). The vertex
// shader applies the DPR scale itself, mirroring what ctx.setTransform(rdpr)
// did implicitly for the 2D path.

const PARTICLE_VS = `
  attribute vec2 aPos;
  attribute float aSize;
  attribute float aAlpha;
  uniform vec2 uResolution;
  uniform float uDpr;
  varying float vAlpha;
  void main() {
    vAlpha = aAlpha;
    vec2 pix = aPos * uDpr;
    vec2 clip = (pix / uResolution) * 2.0 - 1.0;
    gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
    gl_PointSize = aSize * uDpr;
  }
`;
const PARTICLE_FS = `
  precision mediump float;
  uniform vec3 uColor;
  varying float vAlpha;
  void main() {
    vec2 d = gl_PointCoord - vec2(0.5);
    float r = length(d) * 2.0;
    if (r > 1.0) discard;
    float a = pow(smoothstep(1.0, 0.0, r), 1.35) * vAlpha;
    gl_FragColor = vec4(uColor * a, a);
  }
`;
function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error('shader compile failed: ' + log);
  }
  return s;
}
function link(gl, vsSrc, fsSrc) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vsSrc));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fsSrc));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(p);
    gl.deleteProgram(p);
    throw new Error('program link failed: ' + log);
  }
  return p;
}

// Returns { supported:false } if WebGL can't be created (old browser, context
// limit hit, disabled GPU, etc.) — caller falls back to the Canvas2D path.
// IMPORTANT: must be called BEFORE any getContext('2d') on the same canvas —
// a canvas element's context type is fixed on first successful getContext().
export function createFieldGL(canvas, maxParticles) {
  let gl = null;
  try {
    const opts = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false };
    gl = canvas.getContext('webgl2', opts) || canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
  } catch (e) { gl = null; }
  if (!gl) return { supported: false };

  let particleProg;
  try {
    particleProg = link(gl, PARTICLE_VS, PARTICLE_FS);
  } catch (e) {
    return { supported: false };
  }

  const pLoc = {
    aPos: gl.getAttribLocation(particleProg, 'aPos'),
    aSize: gl.getAttribLocation(particleProg, 'aSize'),
    aAlpha: gl.getAttribLocation(particleProg, 'aAlpha'),
    uResolution: gl.getUniformLocation(particleProg, 'uResolution'),
    uDpr: gl.getUniformLocation(particleProg, 'uDpr'),
    uColor: gl.getUniformLocation(particleProg, 'uColor'),
  };

  // Interleaved dynamic buffer: [x, y, size, alpha] per particle.
  const STRIDE = 4;
  const posBuf = gl.createBuffer();
  const cpuBuf = new Float32Array(maxParticles * STRIDE);
  const dustBuf = gl.createBuffer();   // separate buffer for the background dust layer

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);   // additive — mirrors Canvas2D 'lighter'

  let bw = 0, bh = 0;   // backing-store size (canvas.width/height)

  return {
    supported: true,
    resize(width, height) {
      bw = width; bh = height;
      gl.viewport(0, 0, bw, bh);
    },
    // particles: caller fills a view of the shared CPU buffer via setParticle(),
    // then calls drawParticles(count) once.
    setParticle(i, x, y, size, alpha) {
      const o = i * STRIDE;
      cpuBuf[o] = x; cpuBuf[o + 1] = y; cpuBuf[o + 2] = size; cpuBuf[o + 3] = alpha;
    },
    drawParticles(count, color, dpr) {
      gl.useProgram(particleProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, cpuBuf.subarray(0, count * STRIDE), gl.DYNAMIC_DRAW);
      const stride = STRIDE * 4;
      gl.enableVertexAttribArray(pLoc.aPos);
      gl.vertexAttribPointer(pLoc.aPos, 2, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(pLoc.aSize);
      gl.vertexAttribPointer(pLoc.aSize, 1, gl.FLOAT, false, stride, 8);
      gl.enableVertexAttribArray(pLoc.aAlpha);
      gl.vertexAttribPointer(pLoc.aAlpha, 1, gl.FLOAT, false, stride, 12);
      gl.uniform2f(pLoc.uResolution, bw, bh);
      gl.uniform1f(pLoc.uDpr, dpr);
      gl.uniform3f(pLoc.uColor, color[0] / 255, color[1] / 255, color[2] / 255);
      gl.drawArrays(gl.POINTS, 0, count);
    },
    // Background dust — a second, separate point layer (its own buffer) drawn
    // behind the glyph. Same shader / attribute layout as the particles; caller
    // passes an already-filled [x, y, size, alpha] × count buffer.
    drawDust(buf, count, color, dpr) {
      gl.useProgram(particleProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, dustBuf);
      gl.bufferData(gl.ARRAY_BUFFER, buf.subarray(0, count * STRIDE), gl.DYNAMIC_DRAW);
      const stride = STRIDE * 4;
      gl.enableVertexAttribArray(pLoc.aPos);
      gl.vertexAttribPointer(pLoc.aPos, 2, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(pLoc.aSize);
      gl.vertexAttribPointer(pLoc.aSize, 1, gl.FLOAT, false, stride, 8);
      gl.enableVertexAttribArray(pLoc.aAlpha);
      gl.vertexAttribPointer(pLoc.aAlpha, 1, gl.FLOAT, false, stride, 12);
      gl.uniform2f(pLoc.uResolution, bw, bh);
      gl.uniform1f(pLoc.uDpr, dpr);
      gl.uniform3f(pLoc.uColor, color[0] / 255, color[1] / 255, color[2] / 255);
      gl.drawArrays(gl.POINTS, 0, count);
    },
    clear() {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    },
    // Force the driver to fully compile/link/validate the program right now,
    // while the page is still loading and nothing is visible — not on the
    // canvas's first real frame. gl.compileShader/linkProgram queue work; many
    // WebGL driver implementations don't finish the actual pipeline setup
    // until a program is exercised by an honest draw call. Left alone, that
    // first real draw happens exactly when this section scrolls into view
    // (see storyboard.js's IntersectionObserver-gated loop) — a one-time
    // stutter tied precisely to "scroll into Inside Focus," every page load.
    // A throwaway 1×1 draw pays that cost up front instead.
    warmup() {
      const savedBw = bw, savedBh = bh;
      gl.viewport(0, 0, 1, 1);

      gl.useProgram(particleProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
      gl.bufferData(gl.ARRAY_BUFFER, cpuBuf.subarray(0, STRIDE), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(pLoc.aPos);
      gl.vertexAttribPointer(pLoc.aPos, 2, gl.FLOAT, false, STRIDE * 4, 0);
      gl.enableVertexAttribArray(pLoc.aSize);
      gl.vertexAttribPointer(pLoc.aSize, 1, gl.FLOAT, false, STRIDE * 4, 8);
      gl.enableVertexAttribArray(pLoc.aAlpha);
      gl.vertexAttribPointer(pLoc.aAlpha, 1, gl.FLOAT, false, STRIDE * 4, 12);
      gl.uniform2f(pLoc.uResolution, 1, 1);
      gl.uniform1f(pLoc.uDpr, 1);
      gl.uniform3f(pLoc.uColor, 0, 0, 0);
      gl.drawArrays(gl.POINTS, 0, 1);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      // restore whatever real viewport was already set (resize() runs again
      // right after this in storyboard.js anyway, but leave no trace either way)
      gl.viewport(0, 0, savedBw || 1, savedBh || 1);
    },
    dispose() {
      gl.deleteProgram(particleProg);
      gl.deleteBuffer(posBuf);
      gl.deleteBuffer(dustBuf);
    },
  };
}
