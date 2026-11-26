/* Demonstração 1 do documento: dois elétrons (2 qubits), 0 = spin para cima, 1 = spin para baixo.
   Probabilidades ideais, conferidas contra a execução em AerSimulator (4000 medições, ±1–2 pontos):
   medição comum   → tripleto 01=50% 10=50% | singleto 01=50% 10=50%
   medição girada  → tripleto 00=50% 11=50% | singleto 01=50% 10=50% */
type Estado = "tripleto" | "singleto";
type Medicao = "comum" | "girada";
const KEYS = ["00", "01", "10", "11"] as const;

const PROB: Record<Medicao, Record<Estado, Record<(typeof KEYS)[number], number>>> = {
  comum: {
    tripleto: { "00": 0, "01": 0.5, "10": 0.5, "11": 0 },
    singleto: { "00": 0, "01": 0.5, "10": 0.5, "11": 0 },
  },
  girada: {
    tripleto: { "00": 0.5, "01": 0, "10": 0, "11": 0.5 },
    singleto: { "00": 0, "01": 0.5, "10": 0.5, "11": 0 },
  },
};

export function initSimulator() {
  const btns = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-med]"));
  const verdict = document.getElementById("v-box") as HTMLElement;
  const vTitle = document.getElementById("v-title")!;
  const vSub = document.getElementById("v-sub")!;
  const vCode = document.getElementById("v-code")!;

  const bars: Record<Estado, Record<string, { fill: HTMLElement; pct: HTMLElement }>> = { tripleto: {}, singleto: {} };
  (["tripleto", "singleto"] as Estado[]).forEach((e) => {
    KEYS.forEach((k) => {
      const row = document.querySelector<HTMLElement>(`[data-row="${e}-${k}"]`)!;
      bars[e][k] = { fill: row.querySelector<HTMLElement>("i")!, pct: row.querySelector<HTMLElement>("[data-pct]")! };
    });
  });

  function set(m: Medicao) {
    btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.med === m)));
    (["tripleto", "singleto"] as Estado[]).forEach((e) => KEYS.forEach((k) => {
      const p = PROB[m][e][k];
      const { fill, pct } = bars[e][k];
      fill.style.width = `${p * 100}%`;
      fill.classList.toggle("on", p > 0);
      pct.textContent = `${Math.round(p * 100)}%`;
    }));
    const iguais = KEYS.every((k) => PROB[m].tripleto[k] === PROB[m].singleto[k]);
    verdict.style.background = iguais ? "#172B28" : "#C53737";
    verdict.style.color = iguais ? "#F2F4EF" : "#ffffff";
    vTitle.textContent = iguais ? "Idênticos" : "Distintos";
    vSub.textContent = iguais
      ? "Quem só olha qual elétron está para cima não separa os dois estados."
      : "A fase escondida apareceu. O tripleto mudou; o singleto ficou igual.";
    vCode.textContent = iguais ? "medição comum" : "qc.h(0); qc.h(1)  # gira a base";
  }
  btns.forEach((b) => b.addEventListener("click", () => set(b.dataset.med as Medicao)));
  set("comum");
}
