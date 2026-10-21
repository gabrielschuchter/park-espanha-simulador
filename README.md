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

O arquivo `.github/workflows/pages.yml` compila e publica `dist/` somente quando iniciado manualmente em Actions. No repositório, abra Settings, Pages, e escolha "GitHub Actions" como fonte. O endereço fica em `https://<usuario>.github.io/<repositorio>/`. O `vite.config.js` já usa `base: './'`, então funciona em subpasta.

## O que o simulador faz

- **Passeio no centro, em dois modos.** O simulador abre de pé na entrada, em **Explorar**: só caminhar e olhar, com a tela limpa (sem barra, painéis ou ferramentas) e nenhuma edição possível, nem por clique acidental; apenas o interruptor de luz responde. **Editar** (botão embaixo da tela ou Tab) devolve a seleção, o carregar móvel, a pintura e os cartões de edição. Ao entrar no Passeio o modo volta sempre para Explorar. Passar de um cômodo a outro desliza a câmera em vez de teleportar, e o campo de visão abre um pouco ao correr.
- **Estilos com vitrine ao vivo.** O botão Estilos leva a vista para a maquete e abre uma fileira de estilos embaixo: cada toque aplica o estilo de verdade no 3D, sem entrar no histórico, e dá para comparar um a um (setas do teclado também), escolher entre o apartamento inteiro ou um cômodo, ajustar o que entra (acabamentos, móveis, portas e esquadrias) e partir dos móveis atuais ou do layout sugerido. "Caminhar dentro" entra no Passeio com o estilo aplicado; "Usar este estilo" grava tudo como uma edição só e "Cancelar" devolve o apartamento como estava. São 12 estilos, cada um com versão para sala, cozinha, quarto principal, quarto 2, banheiro, serviço com canto de varanda e circulação.
- **Composição auditada.** A decoração é montada por regras (na frente do sofá, acima da cabeceira, sobre o criado-mudo, no canto perto da janela, pendente sobre a mesa, cortina do forro ao chão em cada janela) e cada peça só entra se passar por uma auditoria 3D estrita (`src/harmonia.js`): nada encostado ou atravessado em outro objeto, quadro e armário só em parede cheia (nunca sobre janela, porta ou fim de parede), nada flutuando sem apoio, nada torto, nada no giro de porta, luminária pendente só sobre mesa ou acima de 2,05 m, nenhum aviso novo da análise e nenhuma passagem fechada. `node tools/harmonia-check.mjs` aplica os 12 estilos nas três plantas e termina com zero problemas.
- **Obra.** Ferramenta para construir paredes (alvenaria, drywall, meia-parede, divisória de vidro, painel ripado) clicando no piso da maquete ou da planta, com encaixe em pontas, no eixo de paredes existentes, em ângulos de 15° e grade de 5 cm; abrir vãos (portas de 70, 80 e 90, passagens livres, janelas) em qualquer parede; demolir paredes internas da planta (as fachadas ficam) e fechar vãos existentes; editar tipo, cor, comprimento e posição das paredes novas e largura, posição e lado de abertura das portas novas. Tudo entra na colisão, na análise, no Passeio e nos estilos, e pode ser desfeito ou restaurado.
- **3D primeiro.** A tela abre na maquete 3D em qualquer aparelho; a planta 2D fica a um toque ("Ver planta"). No celular a barra inferior concentra as ferramentas e o 3D ocupa a tela toda.
- **Mover como em jogo.** No modo Passeio, escolher um móvel no catálogo faz um fantasma aparecer na mira. Ele acompanha o olhar, encaixa no piso, na parede, no teto ou em cima de outro móvel, muda de cor se colidir e aceita ajuste de altura e giro antes de confirmar. Também é possível pegar um móvel já colocado.
- **Catálogo.** 160 itens em sala, quartos, cozinha (armários), eletrodomésticos, mesas e cadeiras, banheiro, serviço, trabalho, iluminação, decoração e uma categoria de medidas de escala (pessoas, cadeira de rodas, gabaritos de circulação). Móvel sob medida e "Meus móveis" continuam disponíveis.
- **Tudo editável menos paredes.** Pia, tanque, bacia, lavatório e box trocam de modelo, cor e armário, e também mudam de lugar (arrastar no 3D ou na planta, ou "Mover" no Passeio), giram, somem e voltam ao lugar original. Portas podem ser retiradas e recolocadas; janelas podem ser ocultadas; cada abertura tem cor e vidro próprios.
- **Cartão de edição.** Clicar numa peça, porta, janela, parede, piso ou teto abre um cartão só daquilo, com X para sair. Na parede, o alcance aparece em frases ("Só esta parede", "Todas as paredes deste cômodo", "Todas as paredes do apartamento") e o 3D realça em azul o que vai mudar.
- **Passeio sem conflito de clique.** No computador, clicar na vista prende o cursor: o mouse olha, o clique age no que está na mira, E pega, Esc solta. No celular, arrastar só olha e quem age são os botões que aparecem ao mirar.
- **Tipologia PCD.** Modelada a partir da planta humanizada (banheiro acessível de 2,00 × 2,35 m); ver HIPOTESES.
- **Móveis que abrem.** Portas, gavetas, geladeira e guarda-roupa abrem; cadeiras puxam; pessoas sentadas aparecem à mesa. Há um botão "Simular uso" para a casa toda e controles por móvel no inspetor.
- **Cores de tinta de marca.** Cerca de 60 cores com nome, código e hex exato: Suvinil (RGB das páginas oficiais, entre elas Papel Picado B148 e as Cores do Ano) e uma seleção da Sherwin-Williams. Busca por nome, código ou hex, filtros por marca e família, marcação das mais vendidas e "Cor própria" para qualquer hex. Vale para paredes, móveis de madeira e peças da construtora, e o resumo lista as tintas escolhidas com marca e código. Origem e limites em `docs/HIPOTESES.md`.
- **Câmera.** Maquete: zoom até o ponto sob o cursor ou entre os dedos, pinça com deslocamento, duplo clique ou toque para aproximar (e de novo para voltar). Passeio: olhar suavizado (cerca de 0,29°/px no mouse e 0,42°/px no dedo, menor quando o zoom fecha o campo de visão), inércia no toque, aceleração ao andar, joystick com zona morta e corrida na borda, pinça para ajustar o zoom.
- **Tudo editável pelo 3D.** No Passeio a mira reconhece móveis, peças da construtora (pia, tanque, bacia, lavatório, box), portas, janelas, paredes, piso e teto, e oferece a ação de editar; com o mouse, passar por cima mostra o nome e clicar abre a edição. Na maquete vale o mesmo para o mouse.
- **Simular uso.** A última ação vale: ligar ou desligar no geral aplica a todos; depois, cada móvel pode ser mudado sozinho, e essa escolha fica até a próxima mudança da mesma opção no geral.
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
| `src/presets.js` | Motor dos estilos: troca modelos e cores dos móveis existentes e monta a decoração por regras de composição; cada peça passa pela auditoria antes de entrar |
| `src/harmonia.js` | Auditoria 3D estrita de composição (sobreposição, parede cheia atrás, apoio, ângulo, giro de porta, altura de cabeça, janela) |
| `src/obra.js` | Paredes novas, demolidas e vãos: monta a tipologia efetiva a partir da oficial e das diferenças guardadas no projeto |
| `src/ui/obra.js` | Ferramenta Obra (desenho, encaixe, prévia e edição) para a planta e a maquete |
| `src/data/estilos.js` | Os 12 estilos e seus presets por cômodo |
| `src/ui/estilos.js` | Vitrine de estilos: pré-visualização ao vivo na maquete, cache dos resultados, confirmar ou cancelar |
| `src/store.js` | Estado, desfazer e refazer, salvamento automático, exportação e importação (`park-espanha/projeto@3`, lê também `@2`) |
| `tools/` | `check-geometry.mjs`, `check-analysis.mjs` e `auditoria.mjs` (conferência das plantas e da escala); testes de navegador com Playwright; `galeria.py` gera a galeria do catálogo para conferência visual |
| `docs/HIPOTESES.md` | O que é medida oficial, o que é estimativa e as incoerências encontradas |

## Decisões

- **Base técnica.** OpenPlan3D (SvelteKit + Firebase) e Blueprint3D (Next.js, modelos OBJ) foram avaliados; ambos são MIT. Os dois são editores de desenho de paredes, o oposto do que este caso pede (planta fixa, só mobiliário), e trariam framework, backend opcional e catálogo de modelos rígidos. O simulador adota a mesma ideia de modelo de dados (paredes por segmento com espessura e aberturas referenciadas na parede) e implementa só o necessário sobre Three.js r170 (MIT). Nenhum código desses projetos foi copiado.
- **Móveis paramétricos.** Cada móvel 3D é gerado a partir de largura, profundidade e altura. Uma cama de 1,38 × 1,88 m e uma de 1,58 × 1,98 m têm colchão, cabeceira e travesseiros proporcionais, sem a distorção de esticar um arquivo .glb. Carregamento instantâneo, sem downloads de modelos.
- **Edição por pincel.** Em Paredes, Piso e Teto o morador escolhe o acabamento no painel e clica na superfície no 3D (ou no cômodo, na planta). O realce azul mostra o que será alterado antes do clique.
- **Luz.** As lâmpadas reais são poucas por limite de desempenho: a cena usa um conjunto de luzes pontuais escolhidas por proximidade e materiais emissivos para o resto. É uma simulação de ambiente, não um cálculo luminotécnico.
- **Som.** Gerado em tempo real (Web Audio), sem arquivos. Só começa depois do primeiro toque ou clique, volume inicial 50%.
- **Paredes fixas.** O morador não altera paredes. Peças da construtora e aberturas são editáveis; as peças participam da checagem de colisão na posição em que estiverem.
- **Desempenho.** A abertura do editor mostra uma camada de carregamento com etapas, compila os shaders antes do primeiro quadro (em paralelo, quando o navegador permite) e a qualidade se ajusta sozinha se o aparelho não sustentar a taxa de quadros.

## Limites conhecidos

Os testes automatizados rodam em Chromium sem GPU real, então tempos de abertura medidos ali (cerca de 17 s no computador e 10 s no celular simulado, quase tudo compilação de shader em software) não representam aparelhos reais. Não houve teste em iPhone, Android físico nem com caixa de som. Pinça, deslocamento, duplo toque, olhar por toque e joystick foram exercitados com toques sintéticos; a inércia do olhar depois de soltar o dedo não pôde ser medida ali (o render por software atrasa os eventos) e precisa de conferência em aparelho real. As medidas de móveis e de peças da construtora são estimativas de catálogo; ver `docs/HIPOTESES.md`.

## Planta PCD

Incluída a partir da planta humanizada. Ver `docs/HIPOTESES.md`, seção "Tipologia PCD", para o que é cota e o que é estimativa.
