# Hipóteses geométricas e fontes

Referência para ajustes futuros das plantas. Todas as medidas estão em `src/data/tipologias.js`, em metros, com eixo x para a direita e y para baixo (mesma orientação das plantas de vendas).

## Fontes consultadas

| Fonte | O que foi usado |
|---|---|
| Plantas de vendas "Tipologia Meio (45,68 m²)" e "Tipologia Ponta (45,04 m²)", escala 1:75 | Cotas internas, áreas por cômodo, posição de portas (P1, P3A, P5, P8), janelas (J1, J2) e peças sanitárias |
| `MEMORIAL DESCRITIVO PARK ESPANHA.pdf` (Drive) | Acabamentos por ambiente; unidades PCD (001, 101, 201, 301 em todas as torres; também 401 nas torres B e C); tanque na área de serviço; split com condensadora na varanda |
| `Dúvidas gerais` (Drive) | Pé-direito 2,70 m; pia 120 × 55 cm; alvenaria estrutural; piso laminado nos quartos; ralo só na sacada |
| `2737 - Park Espanha - Book` (Drive), p. 25 | Plantas humanizadas, usadas para conferir a leitura das plantas técnicas |

## Medidas documentadas

- Cotas internas dos cômodos (por exemplo, Quarto 1 da Meio 2,20 × 2,75; Quarto 1 da Ponta 2,50 × 2,40; banheiros 1,10 × 1,95).
- Pé-direito 2,70 m.
- Bancada da pia 1,20 × 0,55 m.
- Guarda-corpo da varanda com H = 1,20 m.
- Acabamentos: cerâmico na sala, circulação, cozinha, serviço e banheiros; laminado nos quartos; azulejo do piso ao teto no box e até meia altura nas demais paredes do banheiro; azulejo na parede hidráulica da cozinha; gesso liso com pintura nas demais paredes.

## Estimativas (conferir na vistoria)

| Item | Valor adotado | Raciocínio |
|---|---|---|
| Espessura de parede | 0,15 m; 0,10 m entre os banheiros da Ponta e entre circulação e Quarto 2 da Meio | Bloco estrutural de 14 cm com reboco; as divisórias de 10 cm fecham as cotas totais (3,65 e 3,70 na Meio) |
| Porta P1 (quartos e banheiros) | 0,70 × 2,10 m | Raio do arco no desenho; padrão de habitação econômica |
| Porta P8 (entrada) | 0,80 × 2,10 m | Arco da Ponta mede cerca de 0,85 m; na Meio o arco desenhado é menor, mas a cota 0,70 ali é o degrau entre a circulação e a cozinha, não a porta |
| Porta P3A (varanda da Meio) | 0,70 m de abrir | Arco no desenho |
| Porta P5 (varanda da Ponta) | 1,50 m de correr, duas folhas | Comprimento do trilho desenhado |
| Janela J2 | 1,20 × 1,10 m, peitoril 1,00 m | Largura medida no desenho; altura e peitoril usuais |
| Janela J1 | 0,60 × 0,60 m, peitoril 1,50 m | Basculante usual de banheiro |
| Box, bacia, lavatório, tanque | Posições conforme o desenho, dimensões de catálogo | Planta técnica mostra só o símbolo |
| Mureta entre cozinha e sala da Ponta | 0,50 m de comprimento | Trecho desenhado entre as cotas 2,50 e 2,70 |

## Acabamentos, forro e luz (simulação)

| Item | Valor adotado | Observação |
|---|---|---|
| Pisos, tintas, texturas, azulejos | Catálogo genérico, desenhado por código | Não corresponde a produtos da construtora; cores variam por tela |
| Forro de gesso, sanca, moldura | Rebaixos de 6, 10, 15 e 20 cm; faixa de sanca de 22 a 25 cm | Valores usuais. Rebaixo de forro precisa de aprovação do condomínio e de projeto de instalações |
| Altura do forro | Pé-direito de 2,70 m menos o rebaixo | O pé-direito vem da planta técnica; o rebaixo é escolha do morador |
| Luz | Temperaturas 2700, 3500 e 5000 K; intensidade relativa | Simulação visual. Não calcula lux, uniformidade nem consumo |
| Posição dos pontos de luz e interruptores | Um ponto no centro de cada cômodo; interruptor junto à porta | Estimativa. A planta de elétrica não foi consultada |

## Escala humana e modo Passeio

| Item | Valor adotado | Observação |
|---|---|---|
| Altura dos olhos | 1,62 m | Pessoa de cerca de 1,72 m; média adulta brasileira fica um pouco abaixo, então a vista tende a ser levemente mais alta que a do morador médio |
| Velocidade | 1,4 m/s andando, passo de 0,72 m; correndo, passo de 0,95 m | Marcha normal de adulto. O balanço da câmera acompanha o passo |
| Campo de visão | 64° vertical em tela larga (cerca de 90° horizontal em 16:9); 84° em retrato | Campos acima de 100° horizontal fazem cômodos pequenos parecerem corredores. Em retrato o horizontal cai para cerca de 45°, o que é incômodo; por isso a abertura maior |
| Raio de colisão do corpo | 0,20 m | Ombros de cerca de 0,45 m, com folga para passar em vãos de 0,70 m |
| Pessoa de referência | 1,70 m em pé; sentada com assento a 0,45 m | Itens "Medidas e escala" do catálogo; servem para comparar vãos e alturas |
| Faixa de circulação | 0,60 m mínimo para passagem, 0,90 m recomendado | Valores usuais de ergonomia residencial; a tipologia PCD exige mais (ver abaixo) |

A sensação de apartamento pequeno em primeira pessoa vem em parte da área real (45 m²) e em parte do campo de visão: a versão anterior usava 72° vertical, que exagera a proximidade das paredes. Não há como separar os dois efeitos sem teste com moradores.

## Móveis e peças adicionados na terceira versão

| Item | Valor adotado | Observação |
|---|---|---|
| Armários de cozinha | Balcão 0,60 × 0,90 m; aéreo 0,35 m de profundidade a 1,55 m do piso; torre de forno 0,60 × 2,10 m | Módulos de mercado usuais; marcas variam de 5 a 10 cm |
| Eletrodomésticos | Geladeira duplex 0,70 × 0,75 × 1,80 m; fogão de 4 bocas 0,52 × 0,60 m; lava-louças 0,60 × 0,60 m | Medidas de catálogo de mercado; confira a ficha do modelo escolhido |
| Mesas e cadeiras | Mesa de 4 lugares 1,20 × 0,80 m; cadeira 0,45 × 0,50 m com assento a 0,45 m; recuo da cadeira puxada de 0,35 m | Folga de 0,75 m entre a borda da mesa e a parede costuma ser o mínimo para sentar e levantar |
| Peças da construtora | Aparência editável, posição fixa | A planta técnica só mostra o símbolo; louças e bancada usam dimensões de catálogo |
| Pessoas sentadas | Bonecos esquemáticos | Servem para avaliar espaço, não proporções corporais individuais |

## Cores de tinta de marca

| Item | Valor adotado | Observação |
|---|---|---|
| Suvinil | 49 cores com RGB e código copiados da página oficial de cada cor (suvinil.com.br/cores), consultadas em 20/10/2026 | O hex é a conversão direta do RGB. Onde a busca devolveu um nome parecido, foi registrado o nome oficial devolvido, não o pedido. Palha e Gelo não foram obtidas |
| Sherwin-Williams | 11 cores (Alabaster 7008, Pure White 7005, Agreeable Gray 7029, Repose Gray 7015, Accessible Beige 7036, Worldly Gray 7043, Sea Salt 6204, Universal Khaki 6150, Tricorn Black 6258, Iron Ore 7069, Naval 6244) | Hex do paintdb.com. Nomes em inglês; o catálogo brasileiro usa os mesmos códigos SW, mas os nomes locais não foram confirmados |
| Coral e demais marcas | Não incluídas | Não encontrei fonte oficial com RGB acessível. Inventar ou estimar o hex contraria o pedido de cor exata. "Cor própria" aceita qualquer hex |
| "Mais vendida" e "Cor do ano" | Marca ou varejo cita a cor entre as mais vendidas; Cor do Ano é a escolha anual da marca | Não é ranking auditado e não há série de vendas pública |
| Fidelidade na tela | O swatch mostra o RGB exato; no 3D a cor muda com a luz e o tom do render | No teste, o Papel Picado (216, 211, 202) ao meio-dia apareceu em torno de (215, 207, 197). Tela não reproduz brilho nem textura da tinta |

## Incoerências encontradas

- **Meio:** áreas calculadas pelas cotas fecham com a legenda com diferença máxima de 0,04 m² por cômodo. A soma das áreas úteis é 38,08 m² (legenda) contra 45,68 m² de área privativa, que inclui paredes.
- **Ponta, sala:** legenda informa 9,58 m², mas largura de 2,40 m e paredes de 2,50 m (cozinha) e 2,70 m (sala) resultam em 7,80 m². A diferença, 1,78 m², coincide com a área da circulação, o que sugere dupla contagem na legenda. O simulador segue as cotas e marca a área com asterisco.
- **Ponta, banheiros:** cotas 1,95 × 1,10 m resultam em 2,14 m², contra 2,30 m² na legenda.
- **Ponta, Banheiro 2:** a porta fica na parede compartilhada com o Quarto 2 (lido como suíte). O vão não está cotado.

Para ajustar, edite as coordenadas da parede ou da abertura em `tipologias.js` e rode `node tools/check-geometry.mjs`, que compara áreas, confere se as aberturas cabem nas paredes e gera um desenho de conferência.

## Tipologia PCD

Fonte: planta humanizada da unidade PCD enviada pelo morador em 21/10/2026 (imagem sem escala impressa, sem espessura de parede e sem área). A distribuição coincide com a Ponta, com os dois banheiros fundidos num banheiro acessível.

| Item | Valor adotado | Origem |
|---|---|---|
| Quarto 1 | 2,50 × 2,40 m | Cota da imagem, igual à Ponta |
| Serviço + varanda | 1,20 × 3,40 m | Cota da imagem |
| Cozinha + jantar | 3,40 m de largura; bancada na parede de 2,50 m | Cota da imagem |
| Circulação, sala e quarto 2 | Iguais à Ponta (3,26 na imagem; 3,25 na planta da Ponta) | Diferença de 1 cm atribuída a arredondamento da imagem |
| Banheiro acessível | 2,00 × 2,35 m, um só banheiro | Cota da imagem |
| Portas | 0,90 m em todas as portas internas, no banheiro e na entrada (vão livre de cerca de 0,82 m), na mesma posição da Ponta; a do quarto 1 recua 20 cm para caber | Estimativa: a NBR 9050 pede vão livre mínimo de 0,80 m; a imagem não mostra a largura |
| Móveis sugeridos | Mesa de 2 lugares e guarda-roupas menores que na Ponta | Com a mesa de 4 lugares, a passagem de 0,90 m entre sala e circulação fecha |
| Lavatório | Suspenso, sem coluna, na parede das janelas | Posição medida na imagem |
| Bacia | Junto à parede de baixo, à direita | Posição medida na imagem; barras de apoio não modeladas |
| Área do chuveiro | 0,95 × 0,90 m, com cortina, sem box rígido | Posição medida na imagem; banco articulado não modelado |
| Janelas do banheiro | Duas basculantes na parede externa | Posição medida na imagem |
| Área privativa | ≈ 45,04 m² (valor da Ponta) | Não consta na imagem; a tela mostra "≈" |

A análise usa os critérios da NBR 9050 declarados em `requisitos`: passagem de 0,90 m e círculo de manobra de 1,50 m por cômodo. O simulador indica conflitos de uso; não substitui a verificação de acessibilidade por profissional habilitado. Se a planta técnica da unidade PCD aparecer, ela substitui as medidas lidas na imagem.

## Conferência de escala (21/10/2026)

`tools/auditoria.mjs` compara cada cota da planta com a distância no modelo. Resultado: todas as cotas internas da Meio e da Ponta batem com o modelo com diferença de 0 cm; na PCD a única diferença é o 3,26 da imagem contra 3,25 da Ponta (1 cm).

Convenção das cotas: o número escrito dentro do cômodo é tratado como medida interna, de face a face das paredes, e o modelo coloca as paredes do lado de fora desse número. Não se desconta a espessura da parede. Muitas plantas de vendas medem na alvenaria sem revestimento; onde entra cerâmica com argamassa, cada face perde em geral de 1,5 a 2,5 cm. Não confirmei qual convenção vale nas plantas do Park Espanha (precisa da nota de rodapé da planta ou do memorial).

O que continua estimado e pode explicar diferenças de sensação: espessura das paredes (15 cm), largura das portas internas (70 cm) e da entrada (80 cm), largura e peitoril das janelas (1,20 m a 1,00 m do piso; basculante 0,60 m a 1,50 m), posição das portas ao longo da parede, altura dos olhos no Passeio (1,62 m) e o campo de visão. As medidas dos móveis do catálogo são de mercado (cama de casal 138 × 188 cm, sofá de 3 lugares 220 × 92 cm, geladeira duplex 70 × 72 × 180 cm) e podem ser editadas por móvel.

## Peças e aberturas editáveis

Pia, tanque, bacia, lavatório e box podem ser movidos, girados, ocultados e restaurados; a posição original fica guardada. Portas podem ser retiradas (fica o vão e o batente) e recolocadas; janelas podem ser ocultadas (fica o vão) e recolocadas. Porta retirada deixa de contar nos avisos de giro de porta. Largura e posição dos vãos seguem a planta. Paredes não mudam.
