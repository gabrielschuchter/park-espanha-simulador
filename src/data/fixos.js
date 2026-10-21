// Peças que a construtora entrega (pia, tanque, louças, box) e aberturas (portas e janelas).
// Tudo pode ser trocado no simulador. Mudar a posição de um ponto hidráulico exige obra e,
// em geral, autorização da construtora e do condomínio; por isso a posição original é guardada.

const CORES_LOUCA = [['#f6f5f2', 'Branco'], ['#e9dfcc', 'Bege'], ['#9aa0a6', 'Cinza'], ['#2b2b2d', 'Preto']];
const METAIS = [['#c9ccd0', 'Cromado'], ['#222224', 'Preto'], ['#c9a05a', 'Dourado'], ['#8c6b4a', 'Bronze']];
const PERFIS = [['#b9bcc0', 'Alumínio'], ['#1c1c1e', 'Preto'], ['#c9a05a', 'Dourado'], ['#f4f2ee', 'Branco']];
const FRENTES = [['#f1efea', 'Branco'], ['#c9a77c', 'Carvalho'], ['#6e4a31', 'Nogueira'], ['#9aa29a', 'Verde-acinzentado'], ['#2f2e2c', 'Preto'], ['#3f5f6b', 'Petróleo']];

export const FIX_SCHEMA = {
  bancada: [
    { k: 'tampo', nome: 'Tampo', t: 'chips', op: [['granito', 'Granito'], ['preto', 'Preto'], ['branco', 'Branco'], ['madeira', 'Madeira'], ['inox', 'Inox'], ['concreto', 'Concreto']], padrao: 'granito' },
    { k: 'cuba', nome: 'Cuba', t: 'chips', op: [[1, '1 cuba'], [2, '2 cubas'], [0, 'Sem cuba']], padrao: 1 },
    { k: 'torneira', nome: 'Torneira', t: 'cor', op: METAIS, padrao: '#c9ccd0' },
    { k: 'armario', nome: 'Armário sob a pia', t: 'chips', op: [['nenhum', 'Sem armário'], ['portas', 'Portas'], ['gavetas', 'Gavetas'], ['misto', 'Gavetas e portas']], padrao: 'nenhum' },
    { k: 'cor', nome: 'Cor do armário', t: 'cor', mais: true, op: FRENTES, padrao: '#f1efea', se: (o) => o.armario && o.armario !== 'nenhum' },
    { k: 'escorredor', nome: 'Escorredor embutido', t: 'sw', padrao: false },
  ],
  tanque: [
    { k: 'modelo', nome: 'Modelo', t: 'chips', op: [['ceramica', 'Louça com coluna'], ['inox', 'Inox em bancada'], ['plastico', 'Plástico'], ['granito', 'Bancada com cuba funda']], padrao: 'ceramica' },
    { k: 'cor', nome: 'Cor', t: 'cor', op: CORES_LOUCA, padrao: '#f6f5f2', se: (o) => (o.modelo || 'ceramica') === 'ceramica' || o.modelo === 'plastico' },
    { k: 'torneira', nome: 'Torneira', t: 'cor', op: METAIS, padrao: '#c9ccd0' },
    { k: 'armario', nome: 'Armário sob o tanque', t: 'chips', op: [['nenhum', 'Sem armário'], ['portas', 'Com portas']], padrao: 'nenhum', se: (o) => o.modelo === 'inox' || o.modelo === 'granito' },
  ],
  vaso: [
    { k: 'modelo', nome: 'Modelo', t: 'chips', op: [['acoplada', 'Caixa acoplada'], ['embutida', 'Caixa embutida na parede'], ['suspensa', 'Suspensa']], padrao: 'acoplada' },
    { k: 'cor', nome: 'Cor da louça', t: 'cor', op: CORES_LOUCA, padrao: '#f6f5f2' },
    { k: 'assento', nome: 'Assento', t: 'cor', op: [['#f6f5f2', 'Branco'], ['#a5774b', 'Madeira'], ['#2b2b2d', 'Preto'], ['#e9dfcc', 'Bege']], padrao: '#f6f5f2' },
  ],
  lavatorio: [
    { k: 'modelo', nome: 'Modelo', t: 'chips', op: [['coluna', 'Com coluna'], ['suspenso', 'Suspenso'], ['apoio', 'Cuba de apoio'], ['gabinete', 'Gabinete com cuba']], padrao: 'coluna' },
    { k: 'cor', nome: 'Cor da louça', t: 'cor', op: CORES_LOUCA, padrao: '#f6f5f2' },
    { k: 'torneira', nome: 'Torneira', t: 'cor', op: METAIS, padrao: '#c9ccd0' },
    { k: 'armario', nome: 'Gabinete', t: 'chips', op: [['portas', 'Portas'], ['gavetas', 'Gavetas']], padrao: 'portas', se: (o) => o.modelo === 'gabinete' || o.modelo === 'apoio' },
    { k: 'corArm', nome: 'Cor do gabinete', t: 'cor', mais: true, op: FRENTES, padrao: '#c9a77c', se: (o) => o.modelo === 'gabinete' || o.modelo === 'apoio' },
    { k: 'espelho', nome: 'Espelho sobre a pia', t: 'sw', padrao: false },
  ],
  box: [
    { k: 'modelo', nome: 'Box', t: 'chips', op: [['correr', 'De correr'], ['abrir', 'De abrir'], ['fixo', 'Fixo'], ['cortina', 'Cortina'], ['nenhum', 'Sem box']], padrao: 'correr' },
    { k: 'vidro', nome: 'Vidro', t: 'chips', op: [['incolor', 'Incolor'], ['fume', 'Fumê'], ['jateado', 'Jateado'], ['verde', 'Verde']], padrao: 'incolor', se: (o) => !['cortina', 'nenhum'].includes(o.modelo) },
    { k: 'perfil', nome: 'Perfil', t: 'cor', op: PERFIS, padrao: '#b9bcc0', se: (o) => !['cortina', 'nenhum'].includes(o.modelo) },
    { k: 'ducha', nome: 'Chuveiro', t: 'chips', op: [['parede', 'De parede'], ['teto', 'De teto (chuva)']], padrao: 'parede' },
    { k: 'metal', nome: 'Cor do chuveiro', t: 'cor', op: METAIS, padrao: '#c9ccd0' },
    { k: 'banco', nome: 'Banco no box', t: 'sw', padrao: false },
  ],
};

export const AB_PADRAO = { porta: '#f6f4f0', entrada: '#6e4a31', esquadria: '#f2f2f0', vidro: 'incolor', macaneta: '#c9ccd0' };
export const AB_SCHEMA = [
  { k: 'porta', nome: 'Portas internas', t: 'cor', op: [['#f6f4f0', 'Branco'], ['#e9e1d3', 'Off-white'], ['#c9a77c', 'Carvalho'], ['#6e4a31', 'Nogueira'], ['#2f2e2c', 'Preto'], ['#3f5f6b', 'Petróleo']] },
  { k: 'entrada', nome: 'Porta de entrada', t: 'cor', op: [['#6e4a31', 'Nogueira'], ['#c9a77c', 'Carvalho'], ['#f6f4f0', 'Branco'], ['#2f2e2c', 'Preto'], ['#7d8461', 'Oliva']] },
  { k: 'esquadria', nome: 'Esquadrias das janelas', t: 'cor', op: [['#f2f2f0', 'Branco'], ['#2b2b2d', 'Preto'], ['#6b4f3a', 'Bronze'], ['#b9bcc0', 'Alumínio natural']] },
  { k: 'vidro', nome: 'Vidro das janelas', t: 'chips', op: [['incolor', 'Incolor'], ['fume', 'Fumê'], ['verde', 'Verde'], ['jateado', 'Jateado']] },
  { k: 'macaneta', nome: 'Maçanetas', t: 'cor', op: METAIS },
];

export const VIDROS = {
  incolor: { cor: '#dbe9ef', op: 0.22 }, fume: { cor: '#4a5560', op: 0.42 }, jateado: { cor: '#e8eef0', op: 0.62 }, verde: { cor: '#9fc9b4', op: 0.34 },
};

export function opcoesDe(fix, f) {
  const sch = FIX_SCHEMA[f.tipo] || [];
  const o = {};
  for (const s of sch) o[s.k] = s.padrao;
  return { ...o, ...(f.padrao || {}), ...(fix?.[f.id] || {}) };
}
export const abDe = (fix) => ({ ...AB_PADRAO, ...(fix?._ab || {}) });
// Opções de uma abertura: o padrão geral (_ab) com o que foi mudado só nela (fix[o.id]).
// sem: porta retirada (fica o vão) ou janela oculta; folha: cor da folha desta porta.
export function abDeAbertura(fix, o) {
  const g = abDe(fix), p = fix?.[o.id] || {};
  return { ...g, folha: p.folha || (o.entrada ? g.entrada : g.porta), ...p };
}
export const ABERTURA_SCHEMA = {
  porta: [
    { k: 'folha', nome: 'Cor da porta', t: 'cor', op: [['#f6f4f0', 'Branco'], ['#e9e1d3', 'Off-white'], ['#c9a77c', 'Carvalho'], ['#6e4a31', 'Nogueira'], ['#2f2e2c', 'Preto'], ['#3f5f6b', 'Petróleo'], ['#7d8461', 'Oliva']] },
    { k: 'macaneta', nome: 'Maçaneta', t: 'cor', op: METAIS },
  ],
  correr: [
    { k: 'esquadria', nome: 'Caixilho', t: 'cor', op: [['#f2f2f0', 'Branco'], ['#2b2b2d', 'Preto'], ['#6b4f3a', 'Bronze'], ['#b9bcc0', 'Alumínio natural']] },
    { k: 'vidro', nome: 'Vidro', t: 'chips', op: [['incolor', 'Incolor'], ['fume', 'Fumê'], ['verde', 'Verde'], ['jateado', 'Jateado']] },
  ],
  janela: [
    { k: 'esquadria', nome: 'Caixilho', t: 'cor', op: [['#f2f2f0', 'Branco'], ['#2b2b2d', 'Preto'], ['#6b4f3a', 'Bronze'], ['#b9bcc0', 'Alumínio natural']] },
    { k: 'vidro', nome: 'Vidro', t: 'chips', op: [['incolor', 'Incolor'], ['fume', 'Fumê'], ['verde', 'Verde'], ['jateado', 'Jateado']] },
  ],
};
export const tipoAbertura = (o) => (o.porta ? (o.correr ? 'correr' : 'porta') : 'janela');
