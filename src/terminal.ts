/* Saída real das duas demonstrações do documento (AerSimulator com 4000 medições; PySCF/Qiskit Nature para o H2). */
const LINES = [
  "$ python demo_singleto_tripleto.py",
  "",
  "--- medicao comum ---",
  "TRIPLETO : 01=50% 10=50%",
  "SINGLETO : 01=50% 10=50%",
  "",
  "--- medicao girada ---",
  "TRIPLETO : 00=50% 11=50%",
  "SINGLETO : 01=50% 10=50%",
  "",
  "$ python demo_molecula.py",
  "Qubits: 4",
  "Qiskit : S0=-1.137284  T1=-0.530773 Ha  gap=16.50 eV",
  "PySCF  : S0=-1.137284  T1=-0.530773 Ha",
];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const paint = (s: string) => {
  if (s.startsWith("$")) return `<span style="color:#ffc83d">${esc(s)}</span>`;
  if (s.startsWith("---")) return `<span style="color:#9a8db3">${esc(s)}</span>`;
  if (/^TRIPLETO.*00=50%/.test(s)) return esc(s).replace(/(00=50% 11=50%)/, '<span style="color:#ff3d7f;font-weight:500">$1</span>');
  if (s.startsWith("Qiskit")) return esc(s).replace(/(gap=[\d.]+ eV)/, '<span style="color:#ff3d7f;font-weight:500">$1</span>');
  return esc(s);
};

export function initTerminal(reduced: boolean) {
  const el = document.getElementById("term-out")!;
  const full = () => (el.innerHTML = LINES.map(paint).join("\n"));
  full();
  if (reduced) return;
  let played = false;
  new IntersectionObserver((entries) => {
    if (played || !entries[0].isIntersecting) return;
    played = true;
    el.innerHTML = "";
    let li = 0, ci = 0, acc: string[] = [];
    const render = (partial = "") => (el.innerHTML = acc.map(paint).join("\n") + (acc.length ? "\n" : "") + esc(partial) + '<span class="cursor-blink"></span>');
    const tick = () => {
      if (li >= LINES.length) { full(); return; }
      const line = LINES[li];
      ci += 3;
      if (ci >= line.length) { acc.push(line); li++; ci = 0; render(); setTimeout(tick, line.startsWith("$") ? 420 : 160); return; }
      render(line.slice(0, ci));
      setTimeout(tick, 14);
    };
    tick();
  }, { threshold: 0.4 }).observe(document.getElementById("term")!);
}
