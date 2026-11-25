import * as THREE from "three";

export interface Orbital { reveal(): void; pointer(x: number, y: number): void; arc(p: number): void }

/* Cena do hero: o anel excêntrico da marca (a cavidade, "lúmen") feito de partículas rosa,
   com o fóton âmbar assentado na borda mais fina e raios de luz saindo dele. */
export function initOrbital(canvas: HTMLCanvasElement, reduced: boolean): Orbital {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
  camera.position.set(0, 0, 8);

  const rose = new THREE.Color("#ff3d7f");
  const amber = new THREE.Color("#ffc83d");
  const lilac = new THREE.Color("#cdb8ff");
  const gauss = () => (Math.random() + Math.random() + Math.random() + Math.random() - 2) / 2;

  const P: number[] = [], C: number[] = [], S: number[] = [];
  const push = (x: number, y: number, z: number, c: THREE.Color, s: number) => { P.push(x, y, z); C.push(c.r, c.g, c.b); S.push(s); };

  /* anel: raio maior 1,55; espessura do tubo varia com o ângulo (fina no alto à direita, grossa embaixo à esquerda) */
  const R = 1.55, TH = Math.PI / 4;
  for (let i = 0; i < 11000; i++) {
    const th = Math.random() * Math.PI * 2;
    const k = (1 + Math.cos(th - TH + Math.PI)) / 2;        /* 0 na borda fina, 1 na grossa */
    const tube = 0.09 + 0.5 * k;
    const ph = Math.random() * Math.PI * 2, rr = tube * Math.sqrt(Math.random());
    const rad = R + rr * Math.cos(ph);
    push(rad * Math.cos(th), rad * Math.sin(th), rr * Math.sin(ph), rose, 1.0 + Math.random() * 1.7);
  }
  /* fóton: núcleo denso âmbar na borda fina */
  const px = (R + 0.05) * Math.cos(TH), py = (R + 0.05) * Math.sin(TH);
  for (let i = 0; i < 1400; i++) push(px + gauss() * 0.11, py + gauss() * 0.11, gauss() * 0.11, amber, 1.3 + Math.random() * 2);
  /* raios: partículas âmbar que se afastam do fóton, ficando mais raras */
  for (let i = 0; i < 1800; i++) {
    const t = Math.pow(Math.random(), 1.6) * 3.2 + 0.25;
    const spread = (Math.random() < 0.7 ? 0.28 : 1.2) * gauss() * 0.5;
    const ang = TH + spread;
    push(px + Math.cos(ang) * t, py + Math.sin(ang) * t, gauss() * 0.15, amber, 0.9 + Math.random() * 1.1);
  }
  /* poeira lilás ao redor */
  for (let i = 0; i < 700; i++) push(gauss() * 3.4, gauss() * 3.0, gauss() * 1.4, lilac, 0.7 + Math.random() * 0.8);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(P), 3));
  geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(C), 3));
  geo.setAttribute("size", new THREE.BufferAttribute(new Float32Array(S), 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uScale: { value: 1 }, uAlpha: { value: 0 } },
    vertexShader: `
      attribute float size; attribute vec3 color; varying vec3 vC; uniform float uScale;
      void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position,1.0);
        gl_PointSize = size * uScale * (6.0 / -mv.z) * 3.2; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `
      varying vec3 vC; uniform float uAlpha;
      void main(){ float d = length(gl_PointCoord - 0.5); if(d>0.5) discard;
        float a = smoothstep(0.5, 0.0, d); gl_FragColor = vec4(vC, a * 0.75 * uAlpha); }`,
  });
  const group = new THREE.Group();
  group.add(new THREE.Points(geo, mat));
  scene.add(group);

  let w = 1, h = 1, visible = true, mx = 0, my = 0, tx = 0, ty = 0, baseK = 1, intro = 1, arcP = 0;
  function resize() {
    const r = canvas.getBoundingClientRect();
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const wide = w / h > 1.05;
    group.position.set(wide ? 2.4 : 0, wide ? 0.1 : 2.0, 0);
    baseK = wide ? 0.78 : Math.min(1, w / 420) * 0.62;
    mat.uniforms.uScale.value = dpr * (h / 900);
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas); resize();
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);

  setTimeout(() => { if (intro < 1) intro = 1; }, 6000);
  const t0 = performance.now();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const t = (performance.now() - t0) / 1000;
    mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
    const sc = window.scrollY / Math.max(1, h);
    group.rotation.y = (reduced ? 0.35 : Math.sin(t * 0.5) * 0.6) + mx * 0.7 + sc * 0.9;
    group.rotation.x = 0.18 + my * 0.35 - sc * 0.3;
    group.rotation.z = Math.sin(t * 0.3) * 0.05;
    mat.uniforms.uAlpha.value = Math.min(1, intro * 1.5);
    group.scale.setScalar(baseK * (0.55 + 0.45 * intro));
    group.rotation.y -= (1 - intro) * 2.2;
    camera.position.x = arcP * 2.4; camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  frame();

  return {
    reveal() {},
    arc(p) { arcP = p; },
    pointer(x, y) { tx = x - 0.5; ty = y - 0.5; },
  };
}
