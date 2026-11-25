import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import type { Orbital } from "./orbital";

gsap.registerPlugin(ScrollTrigger, CustomEase);

/* curvas usadas no movimento de referência */
CustomEase.create("qout", ".25,1,.5,1");   // quart out
CustomEase.create("cout", ".33,1,.68,1");  // cubic out
CustomEase.create("cin", ".32,0,.67,0");   // cubic in

/* "deslizar e assentar": planeio constante e depois assentamento exponencial (1,8 s) */
const f = (t: number) => (t < 0.47 ? 1 - 1.506 * t : 0.293 * Math.exp(-(t - 0.47) / 0.232));
const glide = (x: number) => (x >= 1 ? 1 : 1 - f(x * 1.8));

const $$ = <T extends Element>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll<T>(s));
const LETTER_DELAY = [0, 0.1, 0.27, 0.24, 0.2, 0.37, 0.37]; // ordem de aparição 1, 2, 5, 4, 3, 6

/* prepara máscaras e letras (roda uma vez, antes da abertura) */
export function prepareHero() {
  // links do menu dentro de máscaras
  $$<HTMLAnchorElement>("#nav nav a").forEach((a) => {
    const m = document.createElement("span");
    m.className = "nv-mask";
    a.replaceWith(m);
    m.appendChild(a);
  });
  // letras da palavra de destaque do título
  const word = document.querySelector<HTMLElement>("#hero h1 .serif");
  if (word && !word.dataset.split) {
    const txt = word.textContent || "";
    word.dataset.split = "1";
    word.innerHTML = Array.from(txt).map((c) => `<span class="lt" style="display:inline-block">${c}</span>`).join("");
  }
  const line2 = word?.closest("[data-hero=line]");
  if (line2 && !line2.querySelector(".tail")) {
    const tail = Array.from(line2.childNodes).filter((n) => n !== word);
    const s = document.createElement("span");
    s.className = "tail"; s.style.display = "inline-block"; s.style.whiteSpace = "pre";
    tail.forEach((n) => s.appendChild(n));
    line2.appendChild(s);
  }
  gsap.set("#orbital", { scale: 1.3 });
  gsap.set("#nav nav a", { yPercent: -110 });
  gsap.set(["#nav > .wrap > a:first-child", "#nav > .wrap > a:last-child"], { opacity: 0 });
  gsap.set("[data-hero=line]", { yPercent: -100 });
  gsap.set("[data-hero=body]", { yPercent: 100 });
  gsap.set("[data-hero=card]", { opacity: 0 });
  gsap.set("[data-hero=glyph]", { opacity: 0, x: 10 });
  gsap.set("#hero .lt", { opacity: 0, y: "0.06em" });
}

/* abertura: cena afasta, links caem um a um, título desce da máscara, corpo sobe, letras aparecem */
export function playIntro(onDone: () => void) {
  const tl = gsap.timeline({ onComplete: onDone });
  tl.fromTo("#orbital", { scale: 1.3 }, { scale: 1, duration: 1.35, ease: "qout" }, 0);
  $$("#nav nav a").forEach((a, i) => tl.fromTo(a, { yPercent: -110 }, { yPercent: 0, duration: 0.3, ease: "cout" }, 0.1 * (i + 1)));
  tl.fromTo("#nav > .wrap > a:first-child", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "none" }, 0.05);
  tl.fromTo("#nav > .wrap > a:last-child", { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "none" }, 0.53);
  $$("[data-hero=line]").forEach((l, i) => tl.fromTo(l, { yPercent: -100 }, { yPercent: 0, duration: 0.95, ease: "cout" }, 0.39 + i * 0.04));
  tl.fromTo("[data-hero=body]", { yPercent: 100 }, { yPercent: 0, duration: 0.9, ease: "cout" }, 0.45);
  tl.fromTo("[data-hero=card]", { opacity: 0 }, { opacity: 1, duration: 0.26, ease: "none" }, 0.57);
  tl.fromTo("[data-hero=glyph]", { opacity: 0, x: 10 }, { opacity: 1, x: 0, duration: 0.4, ease: "cout" }, 0.6);
  $$("#hero .lt").forEach((l, i) => tl.fromTo(l, { opacity: 0, y: "0.06em" }, { opacity: 1, y: 0, duration: 0.45, ease: "cout" }, 0.63 + (LETTER_DELAY[i] ?? 0.37)));
  return tl;
}

/* saída do hero ligada à rolagem: título entra na máscara, corpo cai, letras caem uma a uma, câmera faz o arco */
export function heroExit(orbital: Orbital) {
  const lines = $$("[data-hero=line]");
  const wordLine = document.querySelector("#hero h1 .serif")?.closest("[data-hero=line]") as HTMLElement | null;
  const tl = gsap.timeline({
    scrollTrigger: { trigger: "#hero", start: "top top", end: () => "+=" + innerHeight * 0.75, scrub: true, invalidateOnRefresh: true },
  });
  lines.filter((l) => l !== wordLine).forEach((l) => tl.fromTo(l, { yPercent: 0 }, { yPercent: -100, duration: 0.28, ease: "cin", immediateRender: false }, 0));
  tl.fromTo("#hero .tail", { yPercent: 0 }, { yPercent: -100, duration: 0.28, ease: "cin", immediateRender: false }, 0);
  tl.fromTo("[data-hero=body]", { yPercent: 0 }, { yPercent: 100, duration: 0.25, ease: "cin", immediateRender: false }, 0.05);
  $$("#hero .lt").forEach((l, i) => tl.fromTo(l, { y: 0 }, { y: "1.3em", duration: 0.45, ease: "cin", immediateRender: false }, i * 0.065));
  tl.fromTo("[data-hero=card]", { opacity: 1 }, { opacity: 0, duration: 0.13, ease: "none", immediateRender: false }, 0.35);
  const cam = { p: 0 };
  tl.fromTo(cam, { p: 0 }, { p: 1, duration: 0.7, ease: "cout", immediateRender: false, onUpdate: () => orbital.arc(cam.p) }, 0.1);
  tl.set({}, {}, 0.84);
}

/* seções: cada bloco sobe de baixo e assenta, com defasagens como nos cartões de referência */
const LEAF = ".th-text, .th-fig, .th-label, .rows li, .member, [data-step]";
function collect(el: Element): Element[] {
  if (el.matches(LEAF)) return [el];
  if (el.querySelector(LEAF)) return Array.from(el.children).flatMap(collect);
  return [el];
}
export function sectionMotion() {
  const off = () => Math.min(innerHeight * 0.55, 520);
  const sections = $$<HTMLElement>("main > section:not(#hero):not(#termos), footer");
  sections.forEach((sec) => {
    const root = sec.querySelector(":scope > .wrap, :scope > div > .wrap") as HTMLElement | null;
    if (!root) return;
    Array.from(root.children).flatMap(collect).forEach((el) => {
      const isTitle = el.matches("h2, .eyebrow") || !!el.querySelector(":scope > h2");
      const idx = Array.from(el.parentElement!.children).indexOf(el);
      let lag = 0;
      if (el.matches(".th-fig")) lag = 0.15;
      else if (el.matches(".member, .rows li")) lag = Math.min(idx, 2) * 0.15;
      else if (!isTitle) lag = 0.1;
      const natural = () => el.getBoundingClientRect().top + window.scrollY - (Number(gsap.getProperty(el, "y")) || 0);
      const st = { trigger: sec, start: () => natural() - innerHeight * 0.9, once: true, invalidateOnRefresh: true };
      gsap.fromTo(el, { y: off }, { y: 0, duration: 1.8, ease: glide, delay: 0.18 + lag, scrollTrigger: st });
      gsap.set(el, { opacity: 0 });
      gsap.to(el, { opacity: 1, duration: 0.35, ease: "none", delay: 0.18 + lag, scrollTrigger: { ...st } });
    });
  });
}
