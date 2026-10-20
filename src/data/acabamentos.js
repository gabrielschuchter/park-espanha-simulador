// Catálogo de acabamentos: pisos, revestimentos de parede, rodapés, tipos de forro e temperaturas de luz.
// `draw` + `args` apontam para src/tex/draw.js; `cobre` é o lado, em metros, que cada textura cobre.

const P = (id, nome, grupo, draw, args, cobre, extra = {}) => ({ id, nome, grupo, draw, args, cobre, rough: 0.3, ...extra });

export const PISOS = [
  P('cer-bege', 'Porcelanato bege 60×60', 'Porcelanato', 'ceramico', { cor: '#d9d4cc', n: 2 }, 1.2, { cor2d: '#e9e4db' }),
  P('cer-off', 'Porcelanato off-white polido', 'Porcelanato', 'ceramico', { cor: '#ebe8e1', n: 2, brilho: 6 }, 1.2, { cor2d: '#f1efe9', rough: 0.14 }),
  P('cer-cinza', 'Porcelanato cinza', 'Porcelanato', 'ceramico', { cor: '#b9bbba', n: 2 }, 1.2, { cor2d: '#c8cac9' }),
  P('cer-grafite', 'Porcelanato grafite', 'Porcelanato', 'ceramico', { cor: '#5d6260', n: 2, junta: 'rgba(30,32,31,0.6)' }, 1.2, { cor2d: '#7b807e' }),
  P('cer-banho', 'Cerâmica 40×40 (banheiro)', 'Porcelanato', 'ceramico', { cor: '#d6d6d2', n: 2 }, 0.8, { cor2d: '#e3e4e1' }),
  P('marmore', 'Mármore Carrara', 'Pedra e cimento', 'marmore', {}, 1.2, { cor2d: '#eeeeeb', rough: 0.12 }),
  P('cimento', 'Cimento queimado', 'Pedra e cimento', 'cimento', {}, 2.4, { cor2d: '#b9b9b5', rough: 0.55 }),
  P('lam-original', 'Laminado carvalho (original)', 'Laminado e madeira', 'laminado', { base: '#b8916a' }, 1.2, { cor2d: '#e5d3bc', rough: 0.5 }),
  P('lam-claro', 'Laminado carvalho claro', 'Laminado e madeira', 'laminado', { base: '#d3b78f' }, 1.2, { cor2d: '#efe3cf', rough: 0.5 }),
  P('lam-nogueira', 'Laminado nogueira', 'Laminado e madeira', 'laminado', { base: '#7a5236' }, 1.2, { cor2d: '#c2a58b', rough: 0.5 }),
  P('lam-cinza', 'Laminado cinza', 'Laminado e madeira', 'laminado', { base: '#a39d94' }, 1.2, { cor2d: '#dcd8d1', rough: 0.5 }),
  P('vinilico', 'Vinílico freijó', 'Laminado e madeira', 'laminado', { base: '#a67b4f', fileiras: 8, grao: 0.6 }, 1.2, { cor2d: '#dcc7ac', rough: 0.45 }),
  P('parque', 'Parquê quadriculado', 'Laminado e madeira', 'parque', { base: '#a5774b' }, 1.2, { cor2d: '#d8bd9d', rough: 0.45 }),
  P('hex-bege', 'Hexagonal bege', 'Padrões', 'hexagonal', { c1: '#dccfb8', c2: '#bfae91' }, 0.7, { cor2d: '#e6dcca', rough: 0.4 }),
  P('hex-verde', 'Hexagonal verde e branco', 'Padrões', 'hexagonal', { c1: '#eeece6', c2: '#7f9a86' }, 0.7, { cor2d: '#d3dcd3', rough: 0.4 }),
  P('xadrez', 'Xadrez preto e branco', 'Padrões', 'xadrez', { n: 2 }, 0.6, { cor2d: '#bdbdbb', rough: 0.25 }),
];

export const TINTAS = [
  ['#fbfaf7', 'Branco neve'], ['#f1efeb', 'Branco gelo'], ['#e9e1d3', 'Areia'], ['#d8c8b0', 'Camurça'],
  ['#dfe1de', 'Cinza claro'], ['#b9bdbb', 'Cinza médio'], ['#7d8580', 'Grafite'], ['#2c302f', 'Preto fosco'],
  ['#e3c6b4', 'Argila'], ['#c47a5a', 'Terracota'], ['#e9d9a8', 'Palha'], ['#d6a93f', 'Mostarda'], ['#dbb5b0', 'Rosa antigo'],
  ['#c9d3c3', 'Verde sálvia'], ['#8c9a6b', 'Verde oliva'], ['#5b6b4f', 'Verde musgo'],
  ['#cfdbe2', 'Azul névoa'], ['#3f6471', 'Azul petróleo'], ['#2f3e56', 'Azul marinho'], ['#cfc6dc', 'Lavanda'],
];

export const REVESTIMENTOS = [
  P('azulejo-branco', 'Azulejo branco 30×60', 'Revestimentos', 'azulejo', { cor: '#eeece8', cols: 2, rows: 4 }, 1.2, { cor2d: '#eeece8', rough: 0.25 }),
  P('azulejo-metro', 'Metrô branco 7,5×15', 'Revestimentos', 'azulejo', { cor: '#f1f0ed', cols: 8, rows: 16, brilho: 0.02 }, 1.2, { cor2d: '#f1f0ed', rough: 0.2 }),
  P('azulejo-verde', 'Metrô verde', 'Revestimentos', 'azulejo', { cor: '#7d9d8b', cols: 8, rows: 16, brilho: 0.06 }, 1.2, { cor2d: '#7d9d8b', rough: 0.2 }),
  P('azulejo-azul', 'Metrô azul', 'Revestimentos', 'azulejo', { cor: '#5d86a1', cols: 8, rows: 16, brilho: 0.06 }, 1.2, { cor2d: '#5d86a1', rough: 0.2 }),
  P('azulejo-grafite', 'Metrô grafite', 'Revestimentos', 'azulejo', { cor: '#4b5254', cols: 8, rows: 16, brilho: 0.05, junta: 'rgba(30,32,33,0.7)' }, 1.2, { cor2d: '#4b5254', rough: 0.2 }),
  P('pastilha', 'Pastilha de vidro', 'Revestimentos', 'pastilha', {}, 0.6, { cor2d: '#7bb0b0', rough: 0.15 }),
];

export const TEXTURAS_PAREDE = [
  P('tijolo-branco', 'Tijolinho branco', 'Texturas', 'tijolo', { cor: '#ece8e1', rejunte: '#cfc8bb' }, 1.2, { cor2d: '#e4dfd6', rough: 0.9 }),
  P('tijolo-terra', 'Tijolinho aparente', 'Texturas', 'tijolo', { cor: '#b5593d', rejunte: '#9c8f80', variacao: 0.07 }, 1.2, { cor2d: '#b5593d', rough: 0.9 }),
  P('cimento-parede', 'Cimento queimado', 'Texturas', 'cimento', { cor: '#b3b3af' }, 2.4, { cor2d: '#b3b3af', rough: 0.85 }),
  P('ripado', 'Ripado de madeira', 'Texturas', 'ripado', { base: '#a5774b', fundo: '#26201c' }, 1.2, { cor2d: '#8d6641', rough: 0.55 }),
  P('ripado-claro', 'Ripado carvalho claro', 'Texturas', 'ripado', { base: '#d1b48a', fundo: '#4a3f33' }, 1.2, { cor2d: '#c4a77e', rough: 0.55 }),
  P('madeira-painel', 'Painel de madeira', 'Texturas', 'madeiraPainel', { base: '#9a6f45' }, 1.2, { cor2d: '#9a6f45', rough: 0.5 }),
  P('papel-lista', 'Papel listrado bege', 'Papel de parede', 'papelLista', {}, 1.2, { cor2d: '#e2d8c3', rough: 0.95 }),
  P('papel-lista-azul', 'Papel listrado azul', 'Papel de parede', 'papelLista', { c1: '#e8edf0', c2: '#bcd0db' }, 1.2, { cor2d: '#d3e0e7', rough: 0.95 }),
  P('papel-geo', 'Papel geométrico', 'Papel de parede', 'papelGeo', {}, 1.2, { cor2d: '#6d8087', rough: 0.95 }),
  P('papel-folha', 'Papel folhagem', 'Papel de parede', 'papelFolha', {}, 1.2, { cor2d: '#9fb394', rough: 0.95 }),
];

export const PAREDES_TEX = [...TEXTURAS_PAREDE, ...REVESTIMENTOS];

export const RODAPES = [
  { id: 'nenhum', nome: 'Sem rodapé', alt: 0, cor: '#ffffff' },
  { id: 'branco7', nome: 'Branco 7 cm', alt: 0.07, cor: '#f4f2ee' },
  { id: 'branco10', nome: 'Branco 10 cm', alt: 0.10, cor: '#f4f2ee' },
  { id: 'branco15', nome: 'Branco 15 cm', alt: 0.15, cor: '#f4f2ee' },
  { id: 'madeira10', nome: 'Madeira 10 cm', alt: 0.10, cor: '#8a6240' },
  { id: 'preto7', nome: 'Preto 7 cm', alt: 0.07, cor: '#2b2b2b' },
];

export const TETOS = [
  { id: 'laje', nome: 'Laje lisa', desc: 'Como a construtora entrega.', drop: 0, faixa: 0 },
  { id: 'gesso', nome: 'Forro de gesso', desc: 'Rebaixo liso em todo o cômodo.', drop: 0.10, faixa: 0 },
  { id: 'sanca', nome: 'Sanca com LED', desc: 'Centro rebaixado e faixa de luz indireta junto às paredes.', drop: 0.12, faixa: 0.22 },
  { id: 'moldura', nome: 'Moldura rebaixada', desc: 'Faixa rebaixada junto às paredes, centro na altura da laje.', drop: 0.10, faixa: 0.25 },
];
export const REBAIXOS = [0.06, 0.10, 0.15, 0.20];
export const COR_TETO = [['#f7f6f3', 'Branco'], ['#ebe7de', 'Gelo'], ['#dad8d2', 'Cinza claro'], ['#e8dcc3', 'Creme'], ['#3b403e', 'Grafite']];

export const LUZ_TEMPS = [
  { id: 'quente', nome: 'Quente', k: '2700 K', cor: '#ffb066' },
  { id: 'neutra', nome: 'Neutra', k: '3500 K', cor: '#ffc88e' },
  { id: 'fria', nome: 'Fria', k: '5000 K', cor: '#ffe6d2' },
];
export const tempPorId = Object.fromEntries(LUZ_TEMPS.map((t) => [t.id, t]));

export const pisoPorId = Object.fromEntries(PISOS.map((p) => [p.id, p]));
export const texParedePorId = Object.fromEntries(PAREDES_TEX.map((p) => [p.id, p]));
export const rodapePorId = Object.fromEntries(RODAPES.map((r) => [r.id, r]));
export const tetoPorId = Object.fromEntries(TETOS.map((t) => [t.id, t]));

export const COR_PAREDE_PADRAO = '#f1efeb';

// Valores entregues pela construtora para cada cômodo
export function pisoOriginal(room) { return room.banho ? 'cer-banho' : room.piso === 'laminado' ? 'lam-original' : 'cer-bege'; }
export function paredeOriginal(room) {
  return room.banho
    ? { t: 'tinta', cor: COR_PAREDE_PADRAO, meia: { alt: 1.5, t: 'tex', id: 'azulejo-branco' } }
    : { t: 'tinta', cor: COR_PAREDE_PADRAO };
}
export const LUZ_PADRAO = { on: true, temp: 'quente', int: 1 };
export const TETO_PADRAO = { tipo: 'laje', drop: 0.10, cor: '#f7f6f3' };

// Acesso com valores padrão
export function pisoDe(acab, room) { return pisoPorId[acab?.piso?.[room.id]] || pisoPorId[pisoOriginal(room)]; }
export function paredeDe(acab, room, edge) {
  return acab?.destaque?.[`${room.id}:${edge}`] || acab?.parede?.[room.id] || paredeOriginal(room);
}
export function tetoDe(acab, room) { return { ...TETO_PADRAO, ...(acab?.teto?.[room.id] || {}) }; }
export function luzDe(acab, room) { return { ...LUZ_PADRAO, ...(acab?.luz?.[room.id] || {}) }; }
export function rodapeDe(acab, room) { return rodapePorId[acab?.rodape?.[room.id]] || rodapePorId.nenhum; }

export const ACAB_VAZIO = () => ({ piso: {}, parede: {}, destaque: {}, rodape: {}, teto: {}, luz: {} });
