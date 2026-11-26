import "./style.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { initOrbital, type Orbital } from "./orbital";
import { initSimulator } from "./simulator";
import { initTerminal } from "./terminal";
import { runLoader } from "./loader";
import { initCursor } from "./cursor";
import { initConstel } from "./constel";
import { prepareHero, playIntro, heroExit, sectionMotion } from "./embers";

gsap.registerPlugin(ScrollTrigger);

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = <T extends Element>(s: string, r: ParentNode = document) => r.querySelector<T>(s);
const $$ = <T extends Element>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));

/* rolagem suave sincronizada com o ScrollTrigger */
let lenis: Lenis | null = null;
if (!reduced) {
  lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4) });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis!.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}
$$<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    const el = id && id.length > 1 ? $(id) : null;
    if (!el) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(el as HTMLElement, { offset: -40, duration: 1.6 });
    else el.scrollIntoView({ behavior: "auto" });
  });
});

/* orbital 3D do hero: criado depois que a abertura começa; o proxy guarda as chamadas até lá */
let real: Orbital | null = null, wantStart = false;
const orbital: Orbital = {
  reveal() {},
  start() { wantStart = true; real?.start(); },
  pointer(x, y) { real?.pointer(x, y); },
  arc(p) { real?.arc(p); },
};

/* contagem dos números: roda quando eles entram na tela */
function countUp() {
  $$<HTMLElement>("[data-count]").forEach((el) => {
    const end = parseFloat(el.dataset.count || "0");
    const dec = parseInt(el.dataset.dec || "0", 10);
    ScrollTrigger.create({
      trigger: el, start: "top 92%", once: true,
      onEnter: () => {
        const o = { v: 0 };
        gsap.to(o, {
          v: end, duration: 1.8, ease: "power3.out",
          onUpdate: () => (el.textContent = o.v.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec })),
        });
      },
    });
  });
}

/* abertura (sequência de referência): disparada quando a tela de carregamento começa a abrir; rolagem travada até 1,45 s */
if (!reduced) { prepareHero(); lenis?.stop(); setTimeout(() => lenis?.start(), 9000); }
function intro() {
  orbital.start();
  playIntro(() => {});
  setTimeout(() => lenis?.start(), 1450);
}
if (reduced) { document.getElementById("loader")?.remove(); orbital.start(); }
else runLoader(intro);

/* o resto da montagem roda em pedaços pequenos, um por quadro, para a animação da abertura não engasgar */
const steps: Array<() => void> = [
  () => { real = initOrbital($<HTMLCanvasElement>("#orbital")!, reduced); if (wantStart) real.start(); },
  () => initSimulator(),
  () => initTerminal(reduced),
  () => countUp(),
  () => {
    if (reduced) { $$<HTMLElement>(".th-node").forEach((n) => n.classList.add("is-on")); return; }
    /* funil: barra de progresso e destaque do passo ativo */
    const bar = $("#funnel-bar");
    if (bar) gsap.to(bar, { scaleX: 1, ease: "none", scrollTrigger: { trigger: "#funnel", start: "top 70%", end: "bottom 60%", scrub: true } });
    $$<HTMLElement>("[data-step]").forEach((el) => {
      gsap.fromTo(el, { opacity: 0.3 }, { opacity: 1, ease: "none",
        scrollTrigger: { trigger: el, start: "top 85%", end: "top 55%", scrub: true } });
    });
    /* linha de pensamento: o trilho se desenha com o scroll, cada etapa acende e a figura se revela */
    $$<HTMLElement>("[data-thread]").forEach((th) => {
      const fill = th.querySelector<HTMLElement>(".th-rail i");
      if (fill) gsap.fromTo(fill, { scaleY: 0 }, { scaleY: 1, ease: "none",
        scrollTrigger: { trigger: th, start: "top 65%", end: "bottom 65%", scrub: true } });
      th.querySelectorAll<HTMLElement>(".th-step").forEach((step) => {
        const node = step.querySelector<HTMLElement>(".th-node");
        ScrollTrigger.create({ trigger: step, start: "top 62%",
          onEnter: () => node?.classList.add("is-on"), onLeaveBack: () => node?.classList.remove("is-on") });
      });
    });
  },
  /* a navegação troca de tom conforme a seção que está por trás dela */
  () => {
    const nav = $<HTMLElement>("#nav"); if (!nav) return;
    $$<HTMLElement>("main > section, footer").forEach((sec) => {
      const dark = sec.classList.contains("section-dark") || sec.classList.contains("section-red");
      ScrollTrigger.create({ trigger: sec, start: "top 32px", end: "bottom 32px",
        onToggle: (s) => { if (s.isActive) nav.dataset.tone = dark ? "dark" : "light"; } });
    });
  },
  /* movimento de referência: saída do hero ligada à rolagem e entrada das seções */
  () => { if (!reduced) heroExit(orbital); },
  () => { if (!reduced) sectionMotion(); },
  /* cursor com a logo, ímã nos botões e termos interativos */
  () => initCursor(reduced, (x, y) => orbital.pointer(x / innerWidth, y / innerHeight)),
  () => initConstel(reduced),
  /* equipe: a foto "vem para frente" e acompanha o ponteiro */
  () => {
    if (reduced || !matchMedia("(hover: hover)").matches) return;
    $$<HTMLElement>(".member").forEach((m) => {
      const ph = m.querySelector<HTMLElement>(".m-ph");
      if (!ph) return;
      m.addEventListener("pointermove", (e) => {
        const r = ph.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        ph.style.setProperty("--rx", `${(-y * 10).toFixed(2)}deg`);
        ph.style.setProperty("--ry", `${(x * 12).toFixed(2)}deg`);
      });
      m.addEventListener("pointerleave", () => { ph.style.setProperty("--rx", "0deg"); ph.style.setProperty("--ry", "0deg"); });
    });
  },
  () => {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches || reduced) return;
    $$<HTMLElement>("[data-magnet]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        gsap.to(el, { x: (e.clientX - (r.left + r.width / 2)) * 0.25, y: (e.clientY - (r.top + r.height / 2)) * 0.35, duration: 0.4 });
      });
      el.addEventListener("pointerleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1,0.4)" }));
    });
  },
];

let stepsDone = false, loaded = false;
function runSteps(i = 0) {
  if (i >= steps.length) { stepsDone = true; if (loaded) ScrollTrigger.refresh(); return; }
  steps[i]();
  setTimeout(() => requestAnimationFrame(() => runSteps(i + 1)), 0);
}
/* deixa a abertura pintar os primeiros quadros antes de começar a montagem */
requestAnimationFrame(() => requestAnimationFrame(() => runSteps()));

window.addEventListener("load", () => { loaded = true; if (stepsDone) ScrollTrigger.refresh(); });
