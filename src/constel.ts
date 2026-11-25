import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* Termos ligados pela logo: a linha se desenha com o scroll e cada símbolo acende quando ela chega. */
export function initConstel(reduced: boolean) {
  const root = document.querySelector<HTMLElement>("#constel");
  if (!root) return;
  const svg = root.querySelector<SVGSVGElement>(".cn-line")!;
  const base = svg.querySelector<SVGPathElement>(".cn-base")!;
  const prog = svg.querySelector<SVGPathElement>(".cn-prog")!;
  const spark = svg.querySelector<SVGCircleElement>(".cn-spark")!;
  const items = Array.from(root.querySelectorAll<HTMLElement>(".cn-item"));
  const nodes = items.map((i) => i.querySelector<HTMLElement>(".cn-node")!);
  const spin = Number(root.dataset.rot || 90);
  let fr: number[] = [];
  let len = 0;
  let spun = items.map(() => false);

  let key = "";
  const build = () => {
    const R = root.getBoundingClientRect();
    const pts = nodes.map((n) => { const r = n.getBoundingClientRect(); return [r.left - R.left + r.width / 2, r.top - R.top + r.height / 2]; });
    /* só refaz a linha quando o desenho mudou de verdade (refresh do scroll chama isto várias vezes) */
    const k = `${R.width | 0}x${R.height | 0}:${pts.map((p) => p.map(Math.round).join(",")).join(";")}`;
    if (k === key) return;
    key = k;
    svg.setAttribute("viewBox", `0 0 ${R.width} ${R.height}`);
    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], ym = (y0 + y1) / 2;
      d += ` C${x0} ${ym} ${x1} ${ym} ${x1} ${y1}`;
    }
    base.setAttribute("d", d); prog.setAttribute("d", d);
    len = prog.getTotalLength();
    prog.style.strokeDasharray = String(len);
    const N = 180, samples: [number, number][] = [];
    for (let k = 0; k <= N; k++) { const p = prog.getPointAtLength((k / N) * len); samples.push([p.x, p.y]); }
    fr = pts.map(([x, y]) => { let best = 0, bd = Infinity; samples.forEach(([sx, sy], k) => { const dd = (sx - x) ** 2 + (sy - y) ** 2; if (dd < bd) { bd = dd; best = k; } }); return best / N; });
  };

  const light = (i: number, on: boolean) => {
    items[i].classList.toggle("is-on", on);
    if (on && !spun[i] && !reduced) {
      spun[i] = true;
      gsap.fromTo(items[i].querySelector(".cn-rot"), { rotation: 0, svgOrigin: "0 0" }, { rotation: spin, svgOrigin: "0 0", duration: 1.1, ease: "power3.out" });
    }
    if (!on) spun[i] = false;
  };

  const update = (p: number) => {
    prog.style.strokeDashoffset = String(len * (1 - p));
    const pt = prog.getPointAtLength(len * p);
    spark.setAttribute("cx", String(pt.x)); spark.setAttribute("cy", String(pt.y));
    spark.style.opacity = p > 0 && p < 1 ? "1" : "0";
    items.forEach((_, i) => light(i, p > 0 && p >= fr[i] - 0.02));
  };

  if (reduced) { build(); update(1); items.forEach((_, i) => light(i, true)); return; }
  /* o ScrollTrigger chama onRefresh ao nascer, então a primeira montagem acontece lá */
  const st = ScrollTrigger.create({ trigger: root, start: "top 55%", end: "bottom 60%", onUpdate: (s) => update(s.progress), onRefresh: (s) => { build(); update(s.progress); } });
  if (!key) { build(); update(st.progress); }
  nodes.forEach((n, i) => {
    n.addEventListener("pointerenter", () => { if (items[i].classList.contains("is-on")) gsap.to(items[i].querySelector(".cn-rot"), { rotation: "+=" + spin, svgOrigin: "0 0", duration: 0.9, ease: "power3.out" }); });
    n.addEventListener("click", () => gsap.to(items[i].querySelector(".cn-rot"), { rotation: "+=" + spin, svgOrigin: "0 0", duration: 0.9, ease: "power3.out" }));
  });
}
