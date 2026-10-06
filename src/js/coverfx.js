// Desktop-only WebGL layer over the cover: soft drifting candle-light bokeh and
// a warm flicker. Started after the envelope opens; skipped on phones/weak devices.
// Sizes to its parent via ResizeObserver; draws only while visible.
const VERT = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
const FRAG = `precision mediump float;
uniform vec2 r;uniform float t;
float h(float n){return fract(sin(n)*43758.5453);}
void main(){
  vec2 uv=gl_FragCoord.xy/r; vec2 q=uv; q.x*=r.x/r.y;
  vec3 c=vec3(0.);
  for(int i=0;i<26;i++){
    float fi=float(i);
    float sp=.012+h(fi*7.1)*.02;
    vec2 pos=vec2(h(fi*3.3)*r.x/r.y, fract(h(fi*1.7)+t*sp));
    pos.x+=sin(t*.3+fi)*.03;
    float sz=.006+h(fi*9.2)*.022;
    float d=length(q-pos);
    float f=smoothstep(sz,0.,d)*(.35+.65*h(fi*5.5));
    float tw=.6+.4*sin(t*(1.+h(fi)*2.)+fi*3.);
    c+=vec3(1.,.78,.42)*f*tw*.55;
  }
  float flick=.5+.5*sin(t*7.)*sin(t*3.1+1.3)*.4+.1*sin(t*13.);
  float glow=smoothstep(.9,.0,distance(uv,vec2(.5,-.05)))*.10*(.75+.25*flick);
  c+=vec3(1.,.62,.28)*glow;
  gl_FragColor=vec4(c,1.);
}`;

export function initCoverFX(canvas) {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
  if (!gl) return;
  const sh = (type, s) => { const o = gl.createShader(type); gl.shaderSource(o, s); gl.compileShader(o); return o; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uR = gl.getUniformLocation(prog, 'r'), uT = gl.getUniformLocation(prog, 't');

  const scale = .5; // render at half resolution, CSS stretches it
  let visible = true, raf = 0;
  const parent = canvas.parentElement;
  new ResizeObserver(([e]) => {
    const w = Math.max(1, Math.round(e.contentRect.width * scale)), h = Math.max(1, Math.round(e.contentRect.height * scale));
    if (canvas.width === w && canvas.height === h) return;
    canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h);
  }).observe(parent);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; loop(); }).observe(parent);
  document.addEventListener('visibilitychange', loop);

  const t0 = performance.now();
  function frame(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    gl.uniform2f(uR, canvas.width, canvas.height);
    gl.uniform1f(uT, (now - t0) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  function loop() { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); }
  canvas.classList.add('on');
  loop();
}
