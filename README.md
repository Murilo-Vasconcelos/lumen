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


## Identidade visual

Paleta: fundo `#F2F4EF`, texto `#172B28`, vermelho terapêutico `#C53737`, verde de seleção `#24705D`. Tipografia: IBM Plex Sans e IBM Plex Mono. Logos e assinatura (branco sobre vermelho) em `brand/`.
