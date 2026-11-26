import gsap from "gsap";

/* Abertura da Lumen: um fóton percorre um anel que se abre como uma janela.
   Por dentro do anel já se vê o site, e a janela cresce até ocupar a tela inteira. */
export function runLoader(onOpen: () => void) {
  const root = document.getElementById("loader");
  if (!root) { onOpen(); return; }
  const cover = root.querySelector<HTMLElement>(".ld-cover")!;
  const ring = root.querySelector<SVGCircleElement>(".ld-ring")!;
  const tag = root.querySelector<HTMLElement>(".ld-tag");
  const photon = root.querySelector<HTMLElement>(".ld-photon")!;
  document.documentElement.style.overflow = "hidden";
  let opened = false;
  const open = () => { if (!opened) { opened = true; onOpen(); } };
  const finish = () => { open(); root.remove(); document.documentElement.style.overflow = ""; };

  const maxR = Math.hypot(window.innerWidth, window.innerHeight) / 2 + 80;
  const s = { r: 0, a: -Math.PI / 2 };
  const apply = () => {
    cover.style.setProperty("--r", `${s.r}px`);
    const r = s.r.toFixed(1); ring.setAttribute("r", r);
    photon.style.transform = `translate3d(${(Math.cos(s.a) * s.r - 8).toFixed(1)}px, ${(Math.sin(s.a) * s.r - 8).toFixed(1)}px, 0)`;
  };
  apply();
  const tl = gsap.timeline({ onComplete: finish, onUpdate: apply });
  tl.to(s, { a: -Math.PI / 2 + Math.PI * 4.2, duration: 1.75, ease: "power1.inOut" }, 0)
    .to(s, { r: 70, duration: 0.75, ease: "expo.out" }, 0)
    .fromTo(tag, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: "power1.out" }, 0.1)
    .to(tag, { opacity: 0, duration: 0.3, ease: "power1.in" }, 0.62)
    .add(open, 0.8)
    .to(s, { r: maxR, duration: 0.95, ease: "power3.in" }, 0.8);
  setTimeout(finish, 5000);
}
