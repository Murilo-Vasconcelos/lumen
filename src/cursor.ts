import gsap from "gsap";

/* cor do destaque do site: o cursor muda para "accent" quando está sobre um fundo dessa cor */
const ACCENT: [number, number, number] = [255, 61, 127];

/* Cursor com a logo: segue o mouse, gira com o movimento e troca de cor conforme o fundo que está embaixo. */
export function initCursor(reduced: boolean, onMove: (x: number, y: number) => void) {
  const cursor = document.getElementById("cursor") as HTMLElement | null;
  if (!cursor || reduced || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const inner = cursor.querySelector<HTMLElement>(".cur-in")!;
  gsap.set(cursor, { xPercent: -50, yPercent: -50 });
  const xTo = gsap.quickTo(cursor, "x", { duration: 0.22, ease: "power3" });
  const yTo = gsap.quickTo(cursor, "y", { duration: 0.22, ease: "power3" });
  const rTo = gsap.quickTo(inner, "rotation", { duration: 0.8, ease: "power3" });

  /* o canvas converte qualquer cor CSS (inclusive color-mix e oklab) em RGBA */
  const probe = document.createElement("canvas");
  probe.width = probe.height = 1;
  const ctx = probe.getContext("2d", { willReadFrequently: true })!;
  const rgba = (css: string): [number, number, number, number] => {
    ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = "#000"; ctx.fillStyle = css; ctx.fillRect(0, 0, 1, 1);
    const d = ctx.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  function backgroundAt(x: number, y: number): [number, number, number] | null {
    for (const el of document.elementsFromPoint(x, y)) {
      if (el.closest("#cursor, #loader, #nav")) continue;
      for (let n: Element | null = el; n; n = n.parentElement) {
        const [r, g, b, a] = rgba(getComputedStyle(n).backgroundColor);
        if (a > 0.6) return [r, g, b];
      }
    }
    return null;
  }
  function themeAt(x: number, y: number) {
    const bg = backgroundAt(x, y);
    if (!bg) return "dark";
    const dist = Math.hypot(bg[0] - ACCENT[0], bg[1] - ACCENT[1], bg[2] - ACCENT[2]);
    if (dist < 110) return "accent";
    return (0.299 * bg[0] + 0.587 * bg[1] + 0.114 * bg[2]) / 255 > 0.55 ? "light" : "dark";
  }

  let lastX = 0, rot = 0, lastCheck = 0, started = false;
  window.addEventListener("pointermove", (e) => {
    if (!started) { started = true; document.documentElement.classList.add("has-cursor"); gsap.set(cursor, { x: e.clientX, y: e.clientY }); lastX = e.clientX; }
    cursor.style.opacity = "1";
    xTo(e.clientX); yTo(e.clientY);
    rot += (e.clientX - lastX) * 0.5; lastX = e.clientX; rTo(rot);
    const now = performance.now();
    if (now - lastCheck > 70) { lastCheck = now; const th = themeAt(e.clientX, e.clientY); if (cursor.dataset.theme !== th) cursor.dataset.theme = th; }
    onMove(e.clientX, e.clientY);
  });
  document.addEventListener("pointerover", (e) => {
    cursor.classList.toggle("big", !!(e.target as Element).closest("a, button, input, [data-magnet]"));
  });
  document.addEventListener("pointerleave", () => (cursor.style.opacity = "0"));
}
