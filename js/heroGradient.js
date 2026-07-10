function I(t){if(!t)return null;const m=matchMedia("(prefers-reduced-motion: reduce)").matches,F=matchMedia("(hover: none), (pointer: coarse)").matches,_=typeof navigator.deviceMemory=="number"&&navigator.deviceMemory<4;if(F||_)return null;const e=t.getContext("webgl",{antialias:!1,alpha:!0,premultipliedAlpha:!1,powerPreference:"low-power"});if(!e)return null;const R=`
    attribute vec2 p;
    void main(){ gl_Position = vec4(p, 0.0, 1.0); }
  `,S=`
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

      // domain warp \u2014 warp the field by two more fbm fields, drifting in time
      vec2 q = vec2(fbm(p + vec2(0.0, t*1.1)), fbm(p + vec2(5.2, -t)));
      vec2 r = vec2(fbm(p + 3.0*q + vec2(1.7,9.2) + t*0.6),
                    fbm(p + 3.0*q + vec2(8.3,2.8) - t*0.7));
      float f = fbm(p + 2.5*r);

      float field = clamp(f*0.55 + r.x*0.30 + q.y*0.15, 0.0, 1.0);
      vec3 col = ramp(field);

      // glowing filaments \u2014 bright ridges, dark valleys
      float lum = smoothstep(0.18, 0.95, f) * 0.9 + 0.1;
      col *= lum;

      // pool on the right, fade left + bottom (matches the existing glow)
      float mask = smoothstep(0.02, 0.82, uv.x) * smoothstep(0.0, 0.42, uv.y);
      col *= mask * 0.62;

      // dither to kill banding
      col += (hash(gl_FragCoord.xy + u_time) - 0.5) * 0.016;

      gl_FragColor = vec4(max(col, 0.0), 1.0);
    }
  `;function f(r,l){const i=e.createShader(r);return e.shaderSource(i,l),e.compileShader(i),e.getShaderParameter(i,e.COMPILE_STATUS)?i:(console.warn("hero aura shader:",e.getShaderInfoLog(i)),null)}const h=f(e.VERTEX_SHADER,R),u=f(e.FRAGMENT_SHADER,S);if(!h||!u)return null;const o=e.createProgram();if(e.attachShader(o,h),e.attachShader(o,u),e.linkProgram(o),!e.getProgramParameter(o,e.LINK_STATUS))return console.warn("hero aura link:",e.getProgramInfoLog(o)),null;e.useProgram(o);const E=e.createBuffer();e.bindBuffer(e.ARRAY_BUFFER,E),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),e.STATIC_DRAW);const p=e.getAttribLocation(o,"p");e.enableVertexAttribArray(p),e.vertexAttribPointer(p,2,e.FLOAT,!1,0,0);const M=e.getUniformLocation(o,"u_res"),d=e.getUniformLocation(o,"u_time"),T=.7,L=1600;function s(){const r=t.getBoundingClientRect(),l=Math.min(devicePixelRatio||1,2),i=r.width*l,A=r.height*l,b=Math.min(T,L/Math.max(i,A,1)),w=Math.max(2,Math.round(i*b)),y=Math.max(2,Math.round(A*b));(t.width!==w||t.height!==y)&&(t.width=w,t.height=y),e.viewport(0,0,t.width,t.height),e.uniform2f(M,t.width,t.height)}s(),addEventListener("resize",s,{passive:!0});const P=performance.now(),B=1e3/30;let n=null,a=!1,g=0;function v(r){n=a?requestAnimationFrame(v):null,!(r-g<B)&&(g=r,e.uniform1f(d,(r-P)/1e3),e.drawArrays(e.TRIANGLES,0,3))}function C(){a||m||(a=!0,n=requestAnimationFrame(v))}function x(){a=!1,n&&cancelAnimationFrame(n),n=null}e.uniform1f(d,0),e.drawArrays(e.TRIANGLES,0,3);let c=null;return m||(c=new IntersectionObserver(r=>{r[0].isIntersecting?C():x()},{threshold:0}),c.observe(t)),{dispose(){x(),c&&c.disconnect(),removeEventListener("resize",s)}}}export{I as initHeroGradient};
