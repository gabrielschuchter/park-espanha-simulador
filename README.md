# Simulador Park Espanha

Aplicação web para os moradores do Park Espanha mobiliarem as tipologias Meio e Ponta em escala real, escolherem paredes, piso, forro e luzes, verem o resultado em 3D e caminharem pelo apartamento. Sem cadastro e sem servidor: os projetos ficam no navegador e podem ser exportados em JSON.

## Executar

```bash
npm install
npm run dev      # desenvolvimento em http://localhost:5173
npm run build    # gera dist/index.html (arquivo único, ~790 KB, 220 KB com gzip)
```

`dist/index.html` funciona em qualquer hospedagem estática (Netlify, Vercel, GitHub Pages, S3) ou aberto direto do disco. Não depende de serviços externos; as fontes do Google têm alternativas do sistema.

## Estrutura

| Arquivo | Papel |
|---|---|
| `src/data/tipologias.js` | Geometria oficial das plantas (paredes, aberturas, cômodos, peças fixas, cotas). Independente da interface |
| `src/data/catalogo.js` | Catálogo de móveis com medidas padrão, faixa livre recomendada e acabamentos |
| `src/geom.js` | Paredes com vãos, retângulos orientados, colisão (SAT), raios de distância |
| `src/analysis.js` | Colisões, portas bloqueadas, janelas encobertas, faixas livres, circulação por grade de 5 cm |
| `src/plan2d.js` | Editor 2D em SVG: arrastar, girar, redimensionar, encaixe em paredes, cotas, distâncias, tinta do piso, botões de luz |
| `src/data/acabamentos.js` | Pisos, tintas, revestimentos, texturas de parede, rodapés, tipos de forro, rebaixos e temperaturas de luz |
| `src/tetoGeo.js` | Geometria do forro (laje, gesso, sanca, moldura) e altura útil por ponto; usada pelo 3D e pelo ajuste dos móveis de teto |
| `src/audio.js` | Efeitos e trilhas geradas em Web Audio (sem arquivos de som), controle de volume, mudo e escolha da trilha |
| `src/ui/` | Início com cartões de projeto, painéis das ferramentas, catálogo, exportações e tour de boas-vindas |
| `src/three/view3d.js` | Cena 3D (Three.js) com edição direta: arrastar e girar móveis, pintar parede, trocar piso e forro, interruptores clicáveis, luz de dia, tarde e noite, câmeras maquete, de cima, passeio e forro |
| `src/three/` (demais) | Móveis paramétricos, texturas procedurais, esquadrias e forros |
| `src/store.js` | Estado, desfazer/refazer, salvamento automático, exportação e importação |
| `tools/` | `check-geometry.mjs` e `check-analysis.mjs` (conferência das plantas), testes de navegador com Playwright |
| `docs/HIPOTESES.md` | O que é medida oficial, o que é estimativa e as incoerências encontradas |

## Decisões

- **Base técnica.** OpenPlan3D (SvelteKit + Firebase) e Blueprint3D (Next.js, modelos OBJ) foram avaliados; ambos são MIT. Os dois são editores de desenho de paredes, o oposto do que este caso pede (planta fixa, só mobiliário), e trariam framework, backend opcional e catálogo de modelos rígidos. O simulador adota a mesma ideia de modelo de dados (paredes por segmento com espessura e aberturas referenciadas na parede) e implementa só o necessário sobre Three.js r170 (MIT). Nenhum código desses projetos foi copiado.
- **Móveis paramétricos.** Cada móvel 3D é gerado a partir de largura, profundidade e altura. Uma cama de 1,38 × 1,88 m e uma de 1,58 × 1,98 m têm colchão, cabeceira e travesseiros proporcionais, sem a distorção de esticar um arquivo .glb. Carregamento instantâneo, sem downloads de modelos.
- **Edição por pincel.** Em Paredes, Piso e Teto o morador escolhe o acabamento no painel e clica na superfície no 3D (ou no cômodo, na planta). O realce azul mostra o que será alterado antes do clique; "Uma parede", "Cômodo" e "Todos" definem o alcance. Banheiros ficam fora de "Todos" para não perder o azulejo de meia altura.
- **Luz.** As lâmpadas reais são poucas por limite de desempenho: a cena usa um conjunto de luzes pontuais escolhidas por proximidade e materiais emissivos para o resto. É uma simulação de ambiente, não um cálculo luminotécnico.
- **Som.** Gerado em tempo real (Web Audio), sem arquivos. Só começa depois do primeiro toque ou clique, volume inicial 50% em curva quadrática suave, com compressor para evitar picos.
- **Planta fixa.** O morador não altera paredes, portas ou peças entregues pela construtora; elas participam da checagem de colisão.

## Incluir a planta PCD

Ver `docs/HIPOTESES.md`, seção "Tipologia PCD".
