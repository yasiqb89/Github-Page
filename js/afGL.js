const m=`
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
`,h=`
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
`;function R(a,f,e){const t=a.createShader(f);if(a.shaderSource(t,e),a.compileShader(t),!a.getShaderParameter(t,a.COMPILE_STATUS)){const r=a.getShaderInfoLog(t);throw a.deleteShader(t),new Error("shader compile failed: "+r)}return t}function S(a,f,e){const t=a.createProgram();if(a.attachShader(t,R(a,a.VERTEX_SHADER,f)),a.attachShader(t,R(a,a.FRAGMENT_SHADER,e)),a.linkProgram(t),!a.getProgramParameter(t,a.LINK_STATUS)){const r=a.getProgramInfoLog(t);throw a.deleteProgram(t),new Error("program link failed: "+r)}return t}function F(a,f){let e=null;try{const o={alpha:!0,premultipliedAlpha:!0,antialias:!1,depth:!1,stencil:!1,preserveDrawingBuffer:!1};e=a.getContext("webgl2",o)||a.getContext("webgl",o)||a.getContext("experimental-webgl",o)}catch{e=null}if(!e)return{supported:!1};let t;try{t=S(e,m,h)}catch{return{supported:!1}}const r={aPos:e.getAttribLocation(t,"aPos"),aSize:e.getAttribLocation(t,"aSize"),aAlpha:e.getAttribLocation(t,"aAlpha"),uResolution:e.getUniformLocation(t,"uResolution"),uDpr:e.getUniformLocation(t,"uDpr"),uColor:e.getUniformLocation(t,"uColor")},n=4,d=e.createBuffer(),A=new Float32Array(f*n),P=e.createBuffer();e.enable(e.BLEND),e.blendFunc(e.SRC_ALPHA,e.ONE);let s=0,p=0;return{supported:!0,resize(o,i){s=o,p=i,e.viewport(0,0,s,p)},setParticle(o,i,l,u,c){const b=o*n;A[b]=i,A[b+1]=l,A[b+2]=u,A[b+3]=c},drawParticles(o,i,l){e.useProgram(t),e.bindBuffer(e.ARRAY_BUFFER,d),e.bufferData(e.ARRAY_BUFFER,A.subarray(0,o*n),e.DYNAMIC_DRAW);const u=n*4;e.enableVertexAttribArray(r.aPos),e.vertexAttribPointer(r.aPos,2,e.FLOAT,!1,u,0),e.enableVertexAttribArray(r.aSize),e.vertexAttribPointer(r.aSize,1,e.FLOAT,!1,u,8),e.enableVertexAttribArray(r.aAlpha),e.vertexAttribPointer(r.aAlpha,1,e.FLOAT,!1,u,12),e.uniform2f(r.uResolution,s,p),e.uniform1f(r.uDpr,l),e.uniform3f(r.uColor,i[0]/255,i[1]/255,i[2]/255),e.drawArrays(e.POINTS,0,o)},drawDust(o,i,l,u){e.useProgram(t),e.bindBuffer(e.ARRAY_BUFFER,P),e.bufferData(e.ARRAY_BUFFER,o.subarray(0,i*n),e.DYNAMIC_DRAW);const c=n*4;e.enableVertexAttribArray(r.aPos),e.vertexAttribPointer(r.aPos,2,e.FLOAT,!1,c,0),e.enableVertexAttribArray(r.aSize),e.vertexAttribPointer(r.aSize,1,e.FLOAT,!1,c,8),e.enableVertexAttribArray(r.aAlpha),e.vertexAttribPointer(r.aAlpha,1,e.FLOAT,!1,c,12),e.uniform2f(r.uResolution,s,p),e.uniform1f(r.uDpr,u),e.uniform3f(r.uColor,l[0]/255,l[1]/255,l[2]/255),e.drawArrays(e.POINTS,0,i)},clear(){e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT)},warmup(){const o=s,i=p;e.viewport(0,0,1,1),e.useProgram(t),e.bindBuffer(e.ARRAY_BUFFER,d),e.bufferData(e.ARRAY_BUFFER,A.subarray(0,n),e.DYNAMIC_DRAW),e.enableVertexAttribArray(r.aPos),e.vertexAttribPointer(r.aPos,2,e.FLOAT,!1,n*4,0),e.enableVertexAttribArray(r.aSize),e.vertexAttribPointer(r.aSize,1,e.FLOAT,!1,n*4,8),e.enableVertexAttribArray(r.aAlpha),e.vertexAttribPointer(r.aAlpha,1,e.FLOAT,!1,n*4,12),e.uniform2f(r.uResolution,1,1),e.uniform1f(r.uDpr,1),e.uniform3f(r.uColor,0,0,0),e.drawArrays(e.POINTS,0,1),e.clearColor(0,0,0,0),e.clear(e.COLOR_BUFFER_BIT),e.viewport(0,0,o||1,i||1)},dispose(){e.deleteProgram(t),e.deleteBuffer(d),e.deleteBuffer(P)}}}export{F as createFieldGL};
