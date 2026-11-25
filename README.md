# Lumen — landing page

Vite + TypeScript + Tailwind CSS v4 + GSAP (ScrollTrigger) + Lenis + Three.js.

## Rodar
```bash
npm install
npm run dev      # desenvolvimento
npm run build    # gera dist/index.html, um arquivo único
```

## Estrutura
- `index.html` — seções e textos
- `src/main.ts` — animações (loader, rolagem suave, transições entre seções, cursor)
- `src/orbital.ts` — anel excêntrico de partículas em Three.js (hero)
- `src/simulator.ts` — demo interativo singleto/tripleto (probabilidades do circuito)
- `src/terminal.ts` — saída real das duas demonstrações
- `brand/` — logo e símbolo em SVG (escuro, claro, preto, branco, ícone de app)
- `demo_singleto_tripleto.py` e `demo_molecula.py` — os dois códigos em Python

## Para preencher
Nomes e funções das 5 pessoas da equipe (procure por `[` em `index.html`).
