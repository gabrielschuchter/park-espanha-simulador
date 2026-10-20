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

## Incoerências encontradas

- **Meio:** áreas calculadas pelas cotas fecham com a legenda com diferença máxima de 0,04 m² por cômodo. A soma das áreas úteis é 38,08 m² (legenda) contra 45,68 m² de área privativa, que inclui paredes.
- **Ponta, sala:** legenda informa 9,58 m², mas largura de 2,40 m e paredes de 2,50 m (cozinha) e 2,70 m (sala) resultam em 7,80 m². A diferença, 1,78 m², coincide com a área da circulação, o que sugere dupla contagem na legenda. O simulador segue as cotas e marca a área com asterisco.
- **Ponta, banheiros:** cotas 1,95 × 1,10 m resultam em 2,14 m², contra 2,30 m² na legenda.
- **Ponta, Banheiro 2:** a porta fica na parede compartilhada com o Quarto 2 (lido como suíte). O vão não está cotado.

Para ajustar, edite as coordenadas da parede ou da abertura em `tipologias.js` e rode `node tools/check-geometry.mjs`, que compara áreas, confere se as aberturas cabem nas paredes e gera um desenho de conferência.

## Tipologia PCD

A planta oficial não foi localizada. A entrada `pcd` em `tipologias.js` existe sem geometria e aparece na tela inicial como "em breve". Ao receber a planta:

1. Copie a estrutura de `meio` (paredes, aberturas, cômodos, fixos, cotas) com as medidas da planta PCD e remova `pendente: true`.
2. Mantenha o bloco `requisitos`. A análise passa a exigir passagem livre de 0,90 m (em vez de 0,60 m) e a procurar, em cada cômodo, um círculo livre de 1,50 m de diâmetro alcançável a partir da entrada (critérios de deslocamento e manobra da ABNT NBR 9050).
3. O simulador indica conflitos de uso; não substitui a verificação de acessibilidade por profissional habilitado.
