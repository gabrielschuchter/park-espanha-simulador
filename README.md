# Simulador Park Espanha

Aplicação web para os moradores do Park Espanha mobiliarem as tipologias Meio e Ponta em escala real, escolherem paredes, piso, forro e luzes, verem o resultado em 3D e caminharem pelo apartamento. Sem cadastro e sem servidor: os projetos ficam no navegador e podem ser exportados em JSON.

Projeto independente, sem fins lucrativos, feito por Gabriel Schuchter. Não tem vínculo com a construtora nem com o condomínio.

## Executar

```bash
npm install
npm run dev      # desenvolvimento em http://localhost:5173
npm run build    # gera dist/index.html (arquivo único, cerca de 870 KB, 250 KB com gzip)
```

`dist/index.html` funciona em qualquer hospedagem estática (Netlify, Vercel, Cloudflare Pages, S3) ou aberto direto do disco. Não depende de serviços externos; as fontes do Google têm alternativas do sistema.

### Publicar no GitHub Pages

Para publicar no GitHub Pages, abra Settings, Pages, escolha "GitHub Actions" como fonte e execute manualmente o workflow `Publicar no GitHub Pages` na aba Actions. O endereço fica em `https://<usuario>.github.io/<repositorio>/`. O `vite.config.js` já usa `base: './'`, então funciona em subpasta.

## O que o simulador faz

- **3D primeiro.** A tela abre na maquete 3D em qualquer aparelho; a planta 2D fica a um toque ("Ver planta"). No celular a barra inferior concentra as ferramentas e o 3D ocupa a tela toda.
- **Mover como em jogo.** No modo Passeio, escolher um móvel no catálogo faz um fantasma aparecer na mira. Ele acompanha o olhar, encaixa no piso, na parede, no teto ou em cima de outro móvel, muda de cor se colidir e aceita ajuste de altura e giro antes de confirmar. Também é possível pegar um móvel já colocado.
- **Catálogo.** 160 itens em sala, quartos, cozinha (armários), eletrodomésticos, mesas e cadeiras, banheiro, serviço, trabalho, iluminação, decoração e uma categoria de medidas de escala (pessoas, cadeira de rodas, gabaritos de circulação). Móvel sob medida e "Meus móveis" continuam disponíveis.
- **Peças da construtora editáveis.** Pia, tanque, bacia, lavatório, box, portas e janelas podem trocar de modelo, cor, vidro e armário, ou ser ocultados. A posição do ponto hidráulico não muda, porque exige obra e autorização.
- **Móveis que abrem.** Portas, gavetas, geladeira e guarda-roupa abrem; cadeiras puxam; pessoas sentadas aparecem à mesa. Há um botão "Simular uso" para a casa toda e controles por móvel no inspetor.
- **Cores de tinta de marca.** Cerca de 60 cores com nome, código e hex exato: Suvinil (RGB das páginas oficiais, entre elas Papel Picado B148 e as Cores do Ano) e uma seleção da Sherwin-Williams. Busca por nome, código ou hex, filtros por marca e família, marcação das mais vendidas e "Cor própria" para qualquer hex. Vale para paredes, móveis de madeira e peças da construtora, e o resumo lista as tintas escolhidas com marca e código. Origem e limites em `docs/HIPOTESES.md`.
- **Câmera.** Maquete: zoom até o ponto sob o cursor ou entre os dedos, pinça com deslocamento, duplo clique ou toque para aproximar (e de novo para voltar). Passeio: olhar suavizado, sensibilidade proporcional ao campo de visão, inércia no toque, aceleração ao andar, joystick com zona morta e corrida na borda, pinça para ajustar o zoom.
- **Zoom.** Botões de aproximar, afastar e centralizar no 3D e na planta, além de pinça e roda do mouse.
- **Dicas.** Uma seção curta de orientações genéricas de organização, sem caráter prescritivo, com atalhos que ligam as ferramentas do simulador.
- **Análise.** Colisões, portas bloqueadas, janelas encobertas, faixas livres e circulação mínima por grade de 5 cm.

## Estrutura

| Arquivo | Papel |
|---|---|
| `src/data/tipologias.js` | Geometria oficial das plantas (paredes, aberturas, cômodos, peças fixas, cotas). Independente da interface |
| `src/data/catalogo.js` | Catálogo de móveis com medidas padrão, faixa livre recomendada, modelo 3D e configuração |
| `src/data/fixos.js` | Opções editáveis das peças da construtora e das aberturas |
| `src/data/dicas.js` | Texto da seção de dicas e os atalhos que cada dica aciona |
| `src/data/acabamentos.js` | Pisos, tintas, revestimentos, texturas de parede, rodapés, tipos de forro, rebaixos e temperaturas de luz |
| `src/geom.js` | Paredes com vãos, retângulos orientados, colisão (SAT), raios de distância |
| `src/analysis.js` | Colisões, portas bloqueadas, janelas encobertas, faixas livres, circulação |
| `src/plan2d.js` | Editor 2D em SVG: arrastar, girar, redimensionar, encaixe em paredes, cotas, distâncias, tinta do piso, botões de luz |
| `src/tetoGeo.js` | Geometria do forro (laje, gesso, sanca, moldura) e altura útil por ponto |
| `src/audio.js` | Efeitos e trilhas geradas em Web Audio (sem arquivos de som) |
| `src/ui/` | Início, painéis das ferramentas, catálogo, peças, exportações, tour e utilitários de interface |
| `src/three/view3d.js` | Cena 3D (Three.js): edição direta, modo carregar móvel, mira, estados de uso, luz de dia, tarde e noite, câmeras maquete, de cima, passeio e forro |
| `src/three/mobiliario.js`, `pessoas3d.js`, `helpers3d.js` | Armários paramétricos, eletrodomésticos, mesas com cadeiras, pessoas e escala |
| `src/three/fixos3d.js` | Pia, tanque, louças e box com opções |
| `src/three/` (demais) | Móveis básicos, texturas procedurais, esquadrias e forros |
| `src/store.js` | Estado, desfazer e refazer, salvamento automático, exportação e importação (`park-espanha/projeto@3`, lê também `@2`) |
| `tools/` | `check-geometry.mjs` e `check-analysis.mjs` (conferência das plantas); testes de navegador com Playwright; `galeria.py` gera a galeria do catálogo para conferência visual |
| `docs/HIPOTESES.md` | O que é medida oficial, o que é estimativa e as incoerências encontradas |

## Decisões

- **Base técnica.** OpenPlan3D (SvelteKit + Firebase) e Blueprint3D (Next.js, modelos OBJ) foram avaliados; ambos são MIT. Os dois são editores de desenho de paredes, o oposto do que este caso pede (planta fixa, só mobiliário), e trariam framework, backend opcional e catálogo de modelos rígidos. O simulador adota a mesma ideia de modelo de dados (paredes por segmento com espessura e aberturas referenciadas na parede) e implementa só o necessário sobre Three.js r170 (MIT). Nenhum código desses projetos foi copiado.
- **Móveis paramétricos.** Cada móvel 3D é gerado a partir de largura, profundidade e altura. Uma cama de 1,38 × 1,88 m e uma de 1,58 × 1,98 m têm colchão, cabeceira e travesseiros proporcionais, sem a distorção de esticar um arquivo .glb. Carregamento instantâneo, sem downloads de modelos.
- **Edição por pincel.** Em Paredes, Piso e Teto o morador escolhe o acabamento no painel e clica na superfície no 3D (ou no cômodo, na planta). O realce azul mostra o que será alterado antes do clique.
- **Luz.** As lâmpadas reais são poucas por limite de desempenho: a cena usa um conjunto de luzes pontuais escolhidas por proximidade e materiais emissivos para o resto. É uma simulação de ambiente, não um cálculo luminotécnico.
- **Som.** Gerado em tempo real (Web Audio), sem arquivos. Só começa depois do primeiro toque ou clique, volume inicial 50%.
- **Planta fixa.** O morador não altera paredes nem a posição das peças entregues pela construtora; elas participam da checagem de colisão. Aparência e modelo das peças podem mudar.
- **Desempenho.** A abertura do editor mostra uma camada de carregamento com etapas, compila os shaders antes do primeiro quadro (em paralelo, quando o navegador permite) e a qualidade se ajusta sozinha se o aparelho não sustentar a taxa de quadros.

## Limites conhecidos

Os testes automatizados rodam em Chromium sem GPU real, então tempos de abertura medidos ali (cerca de 17 s no computador e 10 s no celular simulado, quase tudo compilação de shader em software) não representam aparelhos reais. Não houve teste em iPhone, Android físico nem com caixa de som. Pinça, deslocamento, duplo toque, olhar por toque e joystick foram exercitados com toques sintéticos; a inércia do olhar depois de soltar o dedo não pôde ser medida ali (o render por software atrasa os eventos) e precisa de conferência em aparelho real. As medidas de móveis e de peças da construtora são estimativas de catálogo; ver `docs/HIPOTESES.md`.

## Incluir a planta PCD

Ver `docs/HIPOTESES.md`, seção "Tipologia PCD".
