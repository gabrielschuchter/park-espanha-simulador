// Tipologias do Park Espanha.
// Coordenadas em metros, eixo x para a direita e y para baixo (como a planta impressa).
// Paredes são segmentos de eixo (a → b) com espessura t. Aberturas referenciam a parede
// e são medidas a partir do ponto `a` (início do vão). Ver docs/HIPOTESES.md.
//
// Convenção de origem dos dados:
//   'doc'  = cota ou área lida diretamente na planta oficial ou no memorial
//   'est'  = estimativa técnica (espessura, posição de porta, largura de janela etc.)

export const PE_DIREITO = 2.70; // doc: "Dúvidas gerais", Drive do empreendimento

export const TIPOS_ABERTURA = {
  P1: { nome: 'Porta interna', largura: 0.70, altura: 2.10, src: 'est' },
  P3A: { nome: 'Porta da varanda', largura: 0.70, altura: 2.10, src: 'est' },
  P5: { nome: 'Porta de correr da varanda', largura: 1.50, altura: 2.10, src: 'est' },
  P8: { nome: 'Porta de entrada', largura: 0.80, altura: 2.10, src: 'est' },
  P2: { nome: 'Porta do banheiro acessível', largura: 0.90, altura: 2.10, src: 'est' }, // vão livre ≥ 0,80 m (NBR 9050)
  P1A: { nome: 'Porta interna acessível', largura: 0.90, altura: 2.10, src: 'est' }, // PCD: folha de 90 para vão livre de cerca de 80 cm
  P8A: { nome: 'Porta de entrada acessível', largura: 0.90, altura: 2.10, src: 'est' },
  J1: { nome: 'Janela basculante do banheiro', largura: 0.60, altura: 0.60, peitoril: 1.50, src: 'est' },
  J2: { nome: 'Janela de correr', largura: 1.20, altura: 1.10, peitoril: 1.00, src: 'est' },
};

// Paredes: [id, ax, ay, bx, by, espessura, extras]
function W(id, ax, ay, bx, by, t = 0.15, extra = {}) {
  return { id, a: [ax, ay], b: [bx, by], t, ...extra };
}

// ---------------------------------------------------------------- MEIO
const meio = {
  id: 'meio',
  nome: 'Meio',
  titulo: 'Tipologia Meio',
  areaPrivativa: 45.68,
  resumo: '2 quartos · 2 banheiros · sala e cozinha integradas · varanda de serviço',
  peDireito: PE_DIREITO,
  walls: [
    W('m-esq', -0.075, -0.15, -0.075, 4.10),
    W('m-varanda', -0.15, -0.075, 1.95, -0.075, 0.15, { altura: 1.20, guarda: true }),
    W('m-sala-topo', 1.80, -0.075, 4.30, -0.075),
    W('m-serv-dir', 1.875, -0.15, 1.875, 1.35),
    W('m-serv-baixo', 0, 1.275, 1.95, 1.275),
    W('m-q1-topo', 4.15, -0.625, 6.65, -0.625),
    W('m-sala-q1', 4.225, -0.70, 4.225, 2.35),
    W('m-q1-baixo', 4.15, 2.275, 6.65, 2.275),
    W('m-q1-dir', 6.575, -0.70, 6.575, 2.35),
    W('m-banhos-topo', 6.50, 0.175, 9.15, 0.175),
    W('m-banho-meio', 7.825, 0.10, 7.825, 2.35),
    W('m-banhos-baixo', 6.50, 2.275, 9.15, 2.275),
    W('m-banho-q2', 9.075, 0.05, 9.075, 2.35),
    W('m-q2-topo', 9.00, 0.125, 11.70, 0.125),
    W('m-q2-dir', 11.625, 0.05, 11.625, 3.40),
    W('m-baixo-circ', 4.15, 3.325, 11.70, 3.325),
    W('m-circ-q2', 7.85, 2.35, 7.85, 3.25, 0.10),
    W('m-degrau', 4.225, 3.25, 4.225, 4.10),
    W('m-baixo-sala', -0.15, 4.025, 4.30, 4.025),
  ],
  openings: [
    { id: 'J2-sala', wall: 'm-sala-topo', tipo: 'J2', de: 0.70, src: 'est' },
    { id: 'P3A', wall: 'm-serv-baixo', tipo: 'P3A', de: 0.95, dobradica: 'b', abre: -1, rotulo: 'Varanda' },
    { id: 'J2-q1', wall: 'm-q1-topo', tipo: 'J2', de: 0.65 },
    { id: 'P1-q1', wall: 'm-q1-baixo', tipo: 'P1', de: 1.57, dobradica: 'b', abre: -1, rotulo: 'Quarto 1' },
    { id: 'J1-b1', wall: 'm-banhos-topo', tipo: 'J1', de: 0.40 },
    { id: 'J1-b2', wall: 'm-banhos-topo', tipo: 'J1', de: 1.65 },
    { id: 'P1-b1', wall: 'm-banhos-baixo', tipo: 'P1', de: 0.50, dobradica: 'b', abre: -1, rotulo: 'Banheiro 1' },
    { id: 'P1-b2', wall: 'm-banhos-baixo', tipo: 'P1', de: 1.45, dobradica: 'a', abre: -1, rotulo: 'Banheiro 2' },
    { id: 'J2-q2', wall: 'm-q2-topo', tipo: 'J2', de: 0.75 },
    { id: 'P1-q2', wall: 'm-circ-q2', tipo: 'P1', de: 0.10, dobradica: 'b', abre: -1, rotulo: 'Quarto 2' },
    { id: 'P8', wall: 'm-baixo-sala', tipo: 'P8', de: 3.45, dobradica: 'b', abre: -1, rotulo: 'Entrada', entrada: true },
  ],
  rooms: [
    { id: 'serv', nome: 'Serviço + varanda', piso: 'ceramico', area: 2.16,
      poly: [[0, 0], [1.80, 0], [1.80, 1.20], [0, 1.20]], cotas: [['1,80 × 1,20', 'doc']] },
    { id: 'sala', nome: 'Sala', piso: 'ceramico', area: 8.72,
      poly: [[1.95, 0], [4.15, 0], [4.15, 2.74], [0, 2.74], [0, 1.35], [1.95, 1.35]], aberto: true },
    { id: 'coz', nome: 'Cozinha + jantar', piso: 'ceramico', area: 5.06,
      poly: [[0, 2.74], [4.15, 2.74], [4.15, 3.95], [0, 3.95]], aberto: true },
    { id: 'circ', nome: 'Circulação', piso: 'ceramico', area: 3.29,
      poly: [[4.15, 2.35], [7.80, 2.35], [7.80, 3.25], [4.15, 3.25]], aberto: true },
    { id: 'q1', nome: 'Quarto 1', piso: 'laminado', area: 6.05,
      poly: [[4.30, -0.55], [6.50, -0.55], [6.50, 2.20], [4.30, 2.20]] },
    { id: 'b1', nome: 'Banheiro 1', piso: 'ceramico', area: 2.16, banho: true,
      poly: [[6.65, 0.25], [7.75, 0.25], [7.75, 2.20], [6.65, 2.20]] },
    { id: 'b2', nome: 'Banheiro 2', piso: 'ceramico', area: 2.16, banho: true,
      poly: [[7.90, 0.25], [9.00, 0.25], [9.00, 2.20], [7.90, 2.20]] },
    { id: 'q2', nome: 'Quarto 2', piso: 'laminado', area: 8.48,
      poly: [[9.15, 0.20], [11.55, 0.20], [11.55, 3.25], [7.90, 3.25], [7.90, 2.35], [9.15, 2.35]] },
  ],
  // Elementos fixos entregues pela construtora (não podem ser movidos)
  fixos: [
    { id: 'pia', tipo: 'bancada', nome: 'Pia da cozinha 120 × 55', x: 0.275, y: 2.55, w: 1.20, d: 0.55, rot: 270, h: 0.90, src: 'doc' },
    { id: 'tanque', tipo: 'tanque', nome: 'Tanque', x: 0.27, y: 0.26, w: 0.52, d: 0.50, rot: 0, h: 0.90, src: 'est' },
    { id: 'box1', tipo: 'box', nome: 'Box do chuveiro', x: 7.20, y: 0.65, w: 1.10, d: 0.80, rot: 0, h: 0.02, src: 'est' },
    { id: 'vaso1', tipo: 'vaso', nome: 'Bacia sanitária', x: 6.975, y: 1.85, w: 0.38, d: 0.65, rot: 270, h: 0.40, src: 'est' },
    { id: 'lav1', tipo: 'lavatorio', nome: 'Lavatório', x: 6.85, y: 1.32, w: 0.45, d: 0.40, rot: 270, h: 0.85, src: 'est' },
    { id: 'box2', tipo: 'box', nome: 'Box do chuveiro', x: 8.45, y: 0.65, w: 1.10, d: 0.80, rot: 0, h: 0.02, src: 'est' },
    { id: 'vaso2', tipo: 'vaso', nome: 'Bacia sanitária', x: 8.675, y: 1.85, w: 0.38, d: 0.65, rot: 90, h: 0.40, src: 'est' },
    { id: 'lav2', tipo: 'lavatorio', nome: 'Lavatório', x: 8.80, y: 1.32, w: 0.45, d: 0.40, rot: 90, h: 0.85, src: 'est' },
  ],
  // Cotas oficiais da planta, desenhadas na vista 2D (rótulo, x1,y1,x2,y2, deslocamento)
  cotas: [
    ['1,80', 0, 1.20, 1.80, 1.20, -0.18],
    ['2,20', 1.95, 0, 4.15, 0, 0.22],
    ['4,15', 0, 3.95, 4.15, 3.95, -0.22],
    ['2,35', 4.15, 0, 4.15, 2.35, -0.22],
    ['2,55', 0, 1.35, 0, 3.90, 0.25],
    ['2,20', 4.30, -0.55, 6.50, -0.55, 0.22],
    ['2,75', 4.30, -0.55, 4.30, 2.20, 0.22],
    ['1,10', 6.65, 2.20, 7.75, 2.20, -0.22],
    ['1,10', 7.90, 2.20, 9.00, 2.20, -0.22],
    ['1,95', 6.65, 0.25, 6.65, 2.20, 0.20],
    ['2,40', 9.15, 0.20, 11.55, 0.20, 0.22],
    ['3,05', 11.55, 0.20, 11.55, 3.25, -0.22],
    ['3,65', 4.15, 3.25, 7.80, 3.25, -0.22],
    ['3,70', 7.85, 3.25, 11.55, 3.25, -0.22],
    ['0,90', 7.80, 2.35, 7.80, 3.25, -0.18],
    ['0,70', 4.15, 3.25, 4.15, 3.95, 0.18],
  ],
  pontos: { inicio: [3.70, 3.45], olhar: [2.6, 0.4] },
};

// ---------------------------------------------------------------- PONTA (canto)
const ponta = {
  id: 'ponta',
  nome: 'Ponta',
  titulo: 'Tipologia Ponta',
  areaPrivativa: 45.04,
  resumo: '2 quartos · 2 banheiros · sala e cozinha integradas · varanda de serviço maior',
  peDireito: PE_DIREITO,
  walls: [
    W('p-qa-topo', -0.15, -0.075, 2.65, -0.075),
    W('p-qa-esq', -0.075, -0.15, -0.075, 2.55),
    W('p-qa-dir', 2.575, -0.15, 2.575, 2.55),
    W('p-qa-baixo', -1.15, 2.475, 2.65, 2.475),
    W('p-varanda', 2.50, 0.225, 6.20, 0.225, 0.15, { altura: 1.20, guarda: true }),
    W('p-serv-baixo', 2.65, 1.575, 6.05, 1.575),
    W('p-dir', 6.125, 0.15, 6.125, 7.15),
    W('p-mureta', 5.55, 4.225, 6.05, 4.225),
    W('p-banho-esq', -1.075, 2.40, -1.075, 5.00),
    W('p-banho-meio', -1.00, 3.70, 0.95, 3.70, 0.10),
    W('p-banho-baixo', -1.15, 4.925, 1.10, 4.925),
    W('p-banho-dir', 1.025, 2.55, 1.025, 7.15),
    W('p-qb-topo', 1.10, 3.775, 3.65, 3.775),
    W('p-qb-sala', 3.575, 3.70, 3.575, 7.15),
    W('p-baixo', 0.95, 7.075, 6.20, 7.075),
  ],
  openings: [
    { id: 'J2-qa', wall: 'p-qa-topo', tipo: 'J2', de: 0.80 },
    { id: 'P1-qa', wall: 'p-qa-baixo', tipo: 'P1', de: 2.90, dobradica: 'b', abre: -1, rotulo: 'Quarto 1' },
    { id: 'P5', wall: 'p-serv-baixo', tipo: 'P5', de: 0.65, correr: true, rotulo: 'Varanda' },
    { id: 'P8', wall: 'p-dir', tipo: 'P8', de: 5.90, dobradica: 'b', abre: 1, rotulo: 'Entrada', entrada: true },
    { id: 'J1-b1', wall: 'p-banho-esq', tipo: 'J1', de: 0.40 },
    { id: 'J1-b2', wall: 'p-banho-esq', tipo: 'J1', de: 1.60 },
    { id: 'P1-b1', wall: 'p-banho-dir', tipo: 'P1', de: 0.25, dobradica: 'b', abre: 1, rotulo: 'Banheiro 1' },
    { id: 'P1-b2', wall: 'p-banho-dir', tipo: 'P1', de: 1.45, dobradica: 'a', abre: 1, rotulo: 'Banheiro 2 (suíte)' },
    { id: 'J2-qb', wall: 'p-banho-dir', tipo: 'J2', de: 2.75 },
    { id: 'P1-qb', wall: 'p-qb-topo', tipo: 'P1', de: 0.15, dobradica: 'a', abre: 1, rotulo: 'Quarto 2' },
  ],
  rooms: [
    { id: 'qa', nome: 'Quarto 1', piso: 'laminado', area: 6.00,
      poly: [[0, 0], [2.50, 0], [2.50, 2.40], [0, 2.40]] },
    { id: 'serv', nome: 'Serviço + varanda', piso: 'ceramico', area: 4.12,
      poly: [[2.65, 0.30], [6.05, 0.30], [6.05, 1.50], [2.65, 1.50]] },
    { id: 'coz', nome: 'Cozinha + jantar', piso: 'ceramico', area: 7.14, aberto: true,
      poly: [[2.65, 1.65], [6.05, 1.65], [6.05, 3.75], [3.65, 3.75], [3.65, 3.70], [2.65, 3.70]] },
    { id: 'sala', nome: 'Sala', piso: 'ceramico', area: 9.58, areaGeom: true, aberto: true,
      poly: [[3.65, 3.75], [6.05, 3.75], [6.05, 7.00], [3.65, 7.00]] },
    { id: 'circ', nome: 'Circulação', piso: 'ceramico', area: 1.75, aberto: true,
      poly: [[1.10, 2.55], [2.65, 2.55], [2.65, 3.70], [1.10, 3.70]] },
    { id: 'b1', nome: 'Banheiro 1', piso: 'ceramico', area: 2.30, banho: true,
      poly: [[-1.00, 2.55], [0.95, 2.55], [0.95, 3.65], [-1.00, 3.65]] },
    { id: 'b2', nome: 'Banheiro 2', piso: 'ceramico', area: 2.30, banho: true,
      poly: [[-1.00, 3.75], [0.95, 3.75], [0.95, 4.85], [-1.00, 4.85]] },
    { id: 'qb', nome: 'Quarto 2', piso: 'laminado', area: 7.55,
      poly: [[1.10, 3.85], [3.50, 3.85], [3.50, 7.00], [1.10, 7.00]] },
  ],
  fixos: [
    { id: 'pia', tipo: 'bancada', nome: 'Pia da cozinha 120 × 55', x: 5.775, y: 2.75, w: 1.20, d: 0.55, rot: 90, h: 0.90, src: 'doc' },
    { id: 'tanque', tipo: 'tanque', nome: 'Tanque', x: 5.80, y: 0.56, w: 0.52, d: 0.50, rot: 90, h: 0.90, src: 'est' },
    { id: 'box1', tipo: 'box', nome: 'Box do chuveiro', x: -0.60, y: 3.10, w: 1.10, d: 0.80, rot: 90, h: 0.02, src: 'est' },
    { id: 'vaso1', tipo: 'vaso', nome: 'Bacia sanitária', x: 0.05, y: 2.875, w: 0.38, d: 0.65, rot: 0, h: 0.40, src: 'est' },
    { id: 'lav1', tipo: 'lavatorio', nome: 'Lavatório', x: 0.60, y: 2.75, w: 0.45, d: 0.40, rot: 0, h: 0.85, src: 'est' },
    { id: 'box2', tipo: 'box', nome: 'Box do chuveiro', x: -0.60, y: 4.30, w: 1.10, d: 0.80, rot: 90, h: 0.02, src: 'est' },
    { id: 'vaso2', tipo: 'vaso', nome: 'Bacia sanitária', x: 0.05, y: 4.525, w: 0.38, d: 0.65, rot: 180, h: 0.40, src: 'est' },
    { id: 'lav2', tipo: 'lavatorio', nome: 'Lavatório', x: 0.60, y: 4.65, w: 0.45, d: 0.40, rot: 180, h: 0.85, src: 'est' },
  ],
  cotas: [
    ['2,50', 0, 0, 2.50, 0, 0.22],
    ['2,40', 0, 0, 0, 2.40, 0.22],
    ['3,40', 2.65, 1.50, 6.05, 1.50, -0.20],
    ['1,20', 2.65, 0.30, 2.65, 1.50, 0.20],
    ['0,90', 2.65, 1.65, 2.65, 2.55, 0.18],
    ['1,15', 2.65, 2.55, 2.65, 3.70, -0.20],
    ['1,95', -1.00, 3.65, 0.95, 3.65, -0.20],
    ['1,10', -1.00, 2.55, -1.00, 3.65, 0.22],
    ['1,10', -1.00, 3.75, -1.00, 4.85, 0.22],
    ['2,40', 1.10, 7.00, 3.50, 7.00, -0.22],
    ['3,10', 1.10, 3.90, 1.10, 7.00, 0.20],
    ['3,25', 3.50, 3.75, 3.50, 7.00, -0.20],
    ['2,40', 3.65, 7.00, 6.05, 7.00, -0.22],
    ['2,50', 6.05, 1.65, 6.05, 4.15, -0.22],
    ['2,70', 6.05, 4.30, 6.05, 7.00, -0.22],
  ],
  pontos: { inicio: [5.55, 6.45], olhar: [4.2, 3.0] },
};

// ---------------------------------------------------------------- PCD (pendente)
// Unidades 001, 101, 201, 301 (e 401 nas torres B e C) são PCD segundo o memorial.
// A planta oficial ainda não foi localizada: nenhuma geometria é inventada aqui.
// ---------------------------------------------------------------- PCD
// Base: planta humanizada da unidade PCD enviada pelo morador (sem cotas de parede nem área). É a Ponta com os dois
// banheiros fundidos num banheiro acessível de 2,00 × 2,35 m. Cotas internas lidas na imagem ('doc'); posição de
// louças, janelas e porta do banheiro medidas na imagem ('est'). Ver docs/HIPOTESES.md.
const semBanhos = (l) => l.filter((x) => !['p-banho-esq', 'p-banho-meio', 'p-banho-baixo'].includes(x.id));
const pcd = {
  ...ponta,
  id: 'pcd',
  nome: 'PCD',
  titulo: 'Tipologia PCD',
  areaPrivativa: 45.04, areaEstimada: true,
  resumo: '2 quartos · 1 banheiro acessível · sala e cozinha integradas · unidades 001, 101, 201 e 301',
  walls: [
    ...semBanhos(ponta.walls),
    W('p-banho-esq', -1.125, 2.40, -1.125, 5.05),
    W('p-banho-baixo', -1.20, 4.975, 1.10, 4.975),
  ],
  openings: [
    // portas mais largas que na Ponta: vão livre mínimo de 0,80 m (NBR 9050); a posição ao longo da parede é a mesma
    ...ponta.openings.filter((o) => !['J1-b1', 'J1-b2', 'P1-b1', 'P1-b2'].includes(o.id)).map((o) => (o.tipo === 'P1' ? { ...o, tipo: 'P1A', de: o.id === 'P1-qa' ? o.de - 0.20 : o.de } : o.tipo === 'P8' ? { ...o, tipo: 'P8A', de: o.de - 0.10 } : o)),
    { id: 'J1-b1', wall: 'p-banho-esq', tipo: 'J1', de: 0.45 },
    { id: 'J1-b2', wall: 'p-banho-esq', tipo: 'J1', de: 1.50 },
    { id: 'P2-b', wall: 'p-banho-dir', tipo: 'P2', de: 0.15, dobradica: 'b', abre: 1, rotulo: 'Banheiro' },
  ],
  rooms: [
    ...ponta.rooms.filter((r) => r.id !== 'b1' && r.id !== 'b2'),
    { id: 'b1', nome: 'Banheiro acessível', piso: 'ceramico', area: 4.70, areaGeom: true, banho: true,
      poly: [[-1.05, 2.55], [0.95, 2.55], [0.95, 4.90], [-1.05, 4.90]] },
  ],
  fixos: [
    ...ponta.fixos.filter((f) => ['pia', 'tanque'].includes(f.id)),
    { id: 'lav1', tipo: 'lavatorio', nome: 'Lavatório (sem coluna)', x: -0.85, y: 3.15, w: 0.45, d: 0.40, rot: 270, h: 0.80, src: 'est', padrao: { modelo: 'suspenso' } },
    { id: 'vaso1', tipo: 'vaso', nome: 'Bacia sanitária', x: 0.45, y: 4.575, w: 0.38, d: 0.65, rot: 180, h: 0.46, src: 'est' },
    { id: 'box1', tipo: 'box', nome: 'Área do chuveiro', x: -0.60, y: 4.425, w: 0.95, d: 0.90, rot: 90, h: 0.02, src: 'est', padrao: { modelo: 'cortina' } },
  ],
  cotas: [
    ...ponta.cotas.filter((c) => !['1,95', '1,10'].includes(c[0]) && !(c[0] === '3,25')),
    ['2,00', -1.05, 2.55, 0.95, 2.55, 0.20],
    ['2,35', 0.95, 2.55, 0.95, 4.90, -0.20],
    ['3,26', 3.50, 3.75, 3.50, 7.00, -0.20],
  ],
  requisitos: {
    referencia: 'ABNT NBR 9050',
    giro360: 1.50, // diâmetro de manobra em cadeira de rodas sem deslocamento
    passagemMin: 0.90, // faixa livre em corredores internos
    vaoPortaMin: 0.80,
    moduloReferencia: [0.80, 1.20],
  },
};

export const TIPOLOGIAS = [meio, ponta, pcd];
export const tipologiaPorId = (id) => TIPOLOGIAS.find((t) => t.id === id);
