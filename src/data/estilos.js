// Biblioteca de estilos de decoração. Cada tema descreve, para cada tipo de cômodo, acabamentos, luz, trocas nos móveis
// que já existem e decoração posicionada a partir de âncoras. Como as plantas Meio, Ponta e PCD têm geometrias diferentes,
// nada aqui usa coordenada absoluta: o motor (src/presets.js) acha o lugar e descarta o que não cabe.
//
// Cores e nomes de cor são livres (não são códigos de marca). Tela não reproduz tinta: confira no leque físico.

const T = (cor, nome, meia) => ({ t: 'tinta', cor, nome, ...(meia ? { meia } : {}) });
const X = (id) => ({ t: 'tex', id });
const MEIA = (id, alt = 1.5) => ({ alt, t: 'tex', id });

// ---------------------------------------------------------------- construtores de cômodo
function sala(o) {
  const poe = [];
  const m = o.mesa;
  if (m) poe.push([m.tipos || ['mesacentro', 'mesalateral', 'mesaapoio'], { a: 'sofa', lado: 'frente', gap: 0.40 }, { cor: m.cor }]);
  if (o.poltrona) poe.push([['poltrona', 'puff'], { livre: 1, a: 'sofa', d: 1.9, olha: 'sofa' }, { cor: o.poltrona }]);
  if (o.puff) poe.push(['puff', { livre: 1, a: 'sofa', d: 1.6, canto: 1, olha: 'sofa' }, { cor: o.puff }]);
  if (o.lateral) poe.push([['mesalateral', 'mesaapoio'], { a: 'sofa', lado: 'dir', gap: 0.04 }, { cor: o.lateral }]);
  if (o.abajur) poe.push(['abajur', { sobre: 1, a: 'rack', l: [0.45, 0] }, { cor: o.abajur }]);
  if (o.luminaria) poe.push(['luminaria', { livre: 1, a: 'sofa', canto: 1 }, { cor: o.luminaria }]);
  if (o.quadro) poe.push([o.quadro.tipo, { par: 1, a: 'sofa', lado: 'fundo' }, { cor: o.quadro.cor }]);
  if (o.espelho) poe.push([o.espelho.tipo, { par: 1, a: 'sofa', lado: 'fundo', dl: 0.9 }, { cor: o.espelho.cor }]);
  if (o.sobreRack) for (const [tp, dx, cor] of o.sobreRack) poe.push([tp, { sobre: 1, a: 'rack', l: [dx, 0] }, cor ? { cor } : {}]);
  for (let i = 0; i < (o.plantas || 0); i++) poe.push([i === 0 ? 'planta' : 'plantapeq', { livre: 1, a: 'sofa', canto: 1, d: 1.2 + i * 1.4 }, { cor: o.vaso || '#e8e3da' }]);
  if (o.estante) poe.push([o.estante.tipo, { par: 1, a: 'sofa', lado: 'frente', dl: 0 }, { cor: o.estante.cor }]);
  if (o.cortina) poe.push(['cortina', { par: 1, perto: 'janela' }, { cor: o.cortina }]);
  if (o.cesto) poe.push(['cesto', { livre: 1, a: 'sofa', canto: 1, d: 1.0 }, { cor: o.cesto }]);
  if (o.teto) for (const [tp, cor] of o.teto) poe.push([tp, { teto: 1, a: o.tetoEm || 'sofa', dx: o.tetoDx || 0 }, cor ? { cor } : {}]);
  if (o.extra) poe.push(...o.extra);
  const troca = {
    sofa: { cor: o.sofa, ...(o.sofaTipo ? { tipo: o.sofaTipo } : {}) },
    rack: { cor: o.rack.cor, ...(o.rack.tipo ? { tipo: o.rack.tipo } : {}) },
  };
  if (o.tv) troca.tv = { tipo: o.tv };
  if (o.tapete) troca.tapete = { cor: o.tapete.cor, ...(o.tapete.tipo ? { tipo: o.tapete.tipo } : {}) };
  if (o.vasoBase) troca.planta = { cor: o.vasoBase };
  return {
    nome: o.nome, desc: o.desc,
    acab: { parede: o.parede, destaque: o.dest || [], piso: o.piso, rodape: o.rodape, teto: o.forro, luz: o.luz },
    troca, tira: o.tira || (o.tapete === null ? ['tapete'] : []), poe,
  };
}

function cozinha(o) {
  const poe = [];
  if (o.aereo) poe.push([o.aereo.tipo, { par: 1, a: 'fix:bancada', lado: 'fundo' }, { cor: o.aereo.cor }]);
  if (o.nicho) poe.push(['nichocoz', { par: 1, a: 'fogao', lado: 'frente', dl: 0 }, { cor: o.nicho }]);
  if (o.coifa) poe.push([o.coifa, { par: 1, a: 'fogao', lado: 'fundo' }, {}]);
  for (const [tp, dx, cor] of o.balcao || []) poe.push([tp, { sobre: 1, a: 'fix:bancada', l: [dx, 0] }, cor ? { cor } : {}]);
  if (o.topoGeladeira) poe.push([o.topoGeladeira[0], { sobre: 1, a: 'geladeira' }, { cor: o.topoGeladeira[1] }]);
  if (o.quadro) poe.push([o.quadro.tipo, { par: 1, a: 'jantar', lado: 'fundo' }, { cor: o.quadro.cor }]);
  if (o.relogio) poe.push(['relogio', { par: 1, a: 'jantar', lado: 'fundo', dl: 0.9 }, { cor: o.relogio }]);
  if (o.armario) poe.push([o.armario.tipo, { par: 1, a: 'geladeira', lado: 'frente' }, { cor: o.armario.cor }]);
  if (o.carrinho) poe.push(['carrinho', { livre: 1, a: 'fix:bancada', canto: 1, d: 1.0 }, { cor: o.carrinho }]);
  if (o.planta) poe.push(['plantapeq', { livre: 1, a: 'jantar', canto: 1, d: 1.1 }, { cor: o.planta }]);
  if (o.pendente) poe.push([o.pendente[0], { teto: 1, a: 'jantar' }, o.pendente[1] ? { cor: o.pendente[1] } : {}]);
  if (o.extra) poe.push(...o.extra);
  const troca = {
    geladeira: { cor: o.geladeira }, fogao: { cor: o.fogao },
    jantar: { cor: o.mesa[0], cor2: o.mesa[1], ...(o.mesaTipo ? { tipo: o.mesaTipo } : {}) },
  };
  return {
    nome: o.nome, desc: o.desc,
    acab: { parede: o.parede, destaque: o.dest || [], piso: o.piso, rodape: o.rodape, teto: o.forro, luz: o.luz },
    fixos: { bancada: o.bancada }, troca, tira: o.tira || [], poe,
  };
}

function quarto(o) {
  const poe = [];
  if (o.tapete) poe.push([o.tapete.tipo || 'tapete', { a: 'cama', l: [0, 0.55] }, { cor: o.tapete.cor, ...(o.tapete.w ? { w: o.tapete.w, d: o.tapete.d } : {}) }]);
  if (o.quadro) poe.push([o.quadro.tipo, { par: 1, a: 'cama', lado: 'fundo' }, { cor: o.quadro.cor }]);
  if (o.painel) poe.push(['painel', { par: 1, a: 'cama', lado: 'fundo' }, { cor: o.painel }]);
  if (o.abajur) poe.push(['abajur', { sobre: 1, a: 'criado', l: [0, 0] }, { cor: o.abajur }]);
  if (o.arandela) poe.push(['arandela', { par: 1, a: 'cama', lado: 'fundo', dl: -0.9 }, { cor: o.arandela }]);
  if (o.arandela) poe.push(['arandela', { par: 1, a: 'cama', lado: 'fundo', dl: 0.9 }, { cor: o.arandela }]);
  if (o.comoda) poe.push([o.comoda.tipo, { par: 1, a: 'cama', lado: 'frente' }, { cor: o.comoda.cor }]);
  if (o.poltrona) poe.push([['poltrona', 'puff'], { livre: 1, a: 'cama', canto: 1, d: 1.6, olha: 'cama' }, { cor: o.poltrona }]);
  if (o.bau) poe.push(['bau', { a: 'cama', lado: 'frente', gap: 0.10 }, { cor: o.bau }]);
  if (o.espelho) poe.push([o.espelho.tipo, { par: 1, a: 'gr', lado: 'frente', dl: o.espelho.dl || 0 }, { cor: o.espelho.cor }]);
  if (o.mesa) {
    poe.push([o.mesa.tipo || 'escrivaninha', { par: 1, perto: 'janela' }, { cor: o.mesa.cor }]);
    poe.push(['cadeiraesc', { a: o.mesa.tipo || 'escrivaninha', lado: 'frente', gap: 0.0 }, { cor: o.mesa.cadeira || '#2b2b2b' }]);
    poe.push(['notebook', { sobre: 1, a: o.mesa.tipo || 'escrivaninha' }, {}]);
  }
  if (o.estante) poe.push([o.estante.tipo, { par: 1, a: 'gr', lado: 'frente', dl: 0 }, { cor: o.estante.cor }]);
  if (o.cortina) poe.push(['cortina', { par: 1, perto: 'janela' }, { cor: o.cortina }]);
  if (o.planta) poe.push([o.planta.tipo || 'plantapeq', { livre: 1, a: 'cama', canto: 1, d: 1.8 }, { cor: o.planta.cor || '#e8e3da' }]);
  if (o.teto) for (const [tp, cor] of o.teto) poe.push([tp, { teto: 1, a: 'cama', dy: 0.2 }, cor ? { cor } : {}]);
  if (o.extra) poe.push(...o.extra);
  const troca = {
    cama: { cor: o.cama[0], cor2: o.cama[1], ...(o.camaTipo ? { tipo: o.camaTipo } : {}) },
    gr: { cor: o.gr }, criado: { cor: o.criado, ...(o.criadoTipo ? { tipo: o.criadoTipo } : {}) },
  };
  return {
    nome: o.nome, desc: o.desc,
    acab: { parede: o.parede, destaque: o.dest || [], piso: o.piso, rodape: o.rodape, teto: o.forro, luz: o.luz },
    troca, tira: o.tira || [], poe,
  };
}

function banho(o) {
  const poe = [];
  if (o.armario) poe.push([o.armario.tipo, { par: 1, a: 'fix:lavatorio', lado: 'fundo' }, { cor: o.armario.cor }]);
  if (o.toalheiro) poe.push([o.toalheiro, { par: 1, a: 'fix:box', lado: 'frente' }, {}]);
  if (o.papeleira) poe.push(['papeleira', { par: 1, a: 'fix:vaso', lado: 'frente', dl: 0.4 }, {}]);
  if (o.prateleira) poe.push(['prateleiravidro', { par: 1, a: 'fix:vaso', lado: 'fundo' }, {}]);
  if (o.coluna) poe.push(['colunabanho', { par: 1, a: 'fix:vaso', lado: 'frente', dl: -0.5 }, { cor: o.coluna }]);
  if (o.cesto) poe.push(['cestoroupa', { livre: 1, canto: 1 }, { cor: o.cesto }]);
  if (o.banquinho) poe.push(['banquinho', { livre: 1, a: 'fix:box', canto: 1, d: 0.9 }, { cor: o.banquinho }]);
  if (o.planta) poe.push(['plantapeq', { livre: 1, a: 'fix:vaso', canto: 1, d: 0.9 }, { cor: o.planta }]);
  if (o.balanca) poe.push(['balanca', { livre: 1, canto: 1, d: 1.5 }, {}]);
  if (o.teto) for (const [tp, cor] of o.teto) poe.push([tp, { teto: 1 }, cor ? { cor } : {}]);
  if (o.extra) poe.push(...o.extra);
  return {
    nome: o.nome, desc: o.desc,
    acab: { parede: o.parede, piso: o.piso, rodape: o.rodape || 'nenhum', teto: o.forro, luz: o.luz },
    fixos: o.fixos, poe,
  };
}

function servico(o) {
  const poe = [];
  if (o.armario) poe.push([o.armario.tipo, { par: 1, a: 'lavar', lado: 'dir', dl: 0 }, { cor: o.armario.cor }]);
  if (o.aereo) poe.push(['aereoserv', { par: 1, a: 'lavar', lado: 'fundo' }, { cor: o.aereo }]);
  if (o.cesto) poe.push(['cesto2', { livre: 1, a: 'lavar', canto: 1, d: 1.0 }, { cor: o.cesto }]);
  if (o.varal) poe.push(['varal', { livre: 1, a: 'lavar', d: 1.6 }, {}]);
  if (o.planta) poe.push(['plantapeq', { livre: 1, a: 'lavar', canto: 1, d: 1.4 }, { cor: o.planta }]);
  if (o.extra) poe.push(...o.extra);
  return {
    nome: o.nome, desc: o.desc,
    acab: { parede: o.parede, piso: o.piso, rodape: o.rodape || 'nenhum', teto: o.forro, luz: o.luz },
    fixos: { tanque: o.tanque }, troca: { lavar: { cor: o.maquina } }, poe,
  };
}

// ---------------------------------------------------------------- temas
export const TEMAS = [
  {
    id: 'aconchegante', nome: 'Intimista e aconchegante', curto: 'Aconchegante',
    frase: 'Madeira, luz quente e plantas. Pensado para ficar em casa.',
    desc: 'Tons de areia e terracota, madeira de freijó, forro de gesso e luz quente em baixa intensidade. Poltrona, abajures e plantas deixam a sala e os quartos com cara de abraço.',
    tags: ['luz quente', 'madeira', 'plantas', 'tapetes'], periodo: 'noite',
    pal: { w: '#e6d5be', m: '#a5774b', t: '#d8cdb9', a: '#b46a4c', g: '#3b2f26' },
    aberturas: { porta: '#e9e1d3', entrada: '#6e4a31', esquadria: '#6b4f3a', macaneta: '#c9a05a' },
    sala: sala({
      nome: 'Sala aconchegante', desc: 'Parede ripada atrás da TV, poltrona terracota, abajur e planta no canto.',
      parede: T('#e6d5be', 'Areia quente'), dest: [['rack', X('ripado-claro')]], piso: 'lam-claro', rodape: 'madeira10',
      forro: { tipo: 'gesso', drop: 0.10, cor: '#efe4d0' }, luz: { temp: 'quente', int: 0.62 },
      sofa: '#d8cdb9', rack: { cor: '#a5774b' }, tapete: { cor: '#cdb89a' }, mesa: { cor: '#a5774b' }, poltrona: '#b46a4c',
      abajur: '#e8e3da', luminaria: '#3b2f26', quadro: { tipo: 'quadrotrio', cor: '#b46a4c' }, plantas: 2, vaso: '#b46a4c',
      sobreRack: [['plantapeq', -0.45, '#e8e3da'], ['vasodeco', 0.05, '#c9a77c']], cortina: '#e8dcc3', teto: [['globo', '#3b2f26']],
    }),
    cozinha: cozinha({
      nome: 'Cozinha aconchegante', desc: 'Tampo de madeira, torneira dourada e armário em freijó.',
      parede: T('#ecdcc4', 'Creme'), piso: 'hex-bege', rodape: 'branco7', forro: { tipo: 'gesso', drop: 0.10, cor: '#efe4d0' }, luz: { temp: 'quente', int: 0.7 },
      bancada: { tampo: 'madeira', armario: 'misto', cor: '#a5774b', torneira: '#c9a05a', cuba: 1 },
      geladeira: '#e8e1d2', fogao: '#e8e1d2', mesa: ['#a5774b', '#6e4a31'],
      aereo: { tipo: 'aereo', cor: '#e9e1d3' }, coifa: 'coifa', balcao: [['cafeteira', -0.35, '#2b2b2b'], ['plantapeq', 0.35, '#e8dcc3']],
      topoGeladeira: ['plantapeq', '#e8dcc3'], quadro: { tipo: 'quadro', cor: '#b46a4c' }, pendente: ['pendente3', '#c9a05a'], planta: '#b46a4c',
    }),
    quarto: [quarto({
      nome: 'Quarto aconchegante', desc: 'Cabeceira acolhedora, arandelas, abajures e tapete macio.',
      parede: T('#e9d8c3', 'Areia'), dest: [['cama', T('#c47a5a', 'Terracota')]], piso: 'lam-original', rodape: 'madeira10',
      forro: { tipo: 'gesso', drop: 0.10, cor: '#efe4d0' }, luz: { temp: 'quente', int: 0.55 },
      cama: ['#e8e3da', '#a5774b'], gr: '#c9a77c', criado: '#a5774b', tapete: { cor: '#cdb89a' }, abajur: '#e8dcc3', arandela: '#3b2f26',
      quadro: { tipo: 'quadrotrio', cor: '#e8e3da' }, poltrona: '#b46a4c', bau: '#a5774b', cortina: '#e8dcc3', planta: { cor: '#b46a4c' },
      espelho: { tipo: 'espelhoredondo', cor: '#a5774b', dl: 0 },
    })],
    banho: banho({
      nome: 'Banheiro aconchegante', desc: 'Azulejo metrô até a meia altura, gabinete de madeira e metais dourados.',
      parede: T('#e6d9c5', 'Areia', MEIA('azulejo-metro', 1.5)), piso: 'hex-bege', forro: { tipo: 'gesso', drop: 0.08, cor: '#efe4d0' }, luz: { temp: 'quente', int: 0.7 },
      fixos: { lavatorio: { modelo: 'gabinete', armario: 'gavetas', corArm: '#a5774b', torneira: '#c9a05a', espelho: true }, vaso: { assento: '#a5774b' }, box: { vidro: 'incolor', perfil: '#c9a05a', metal: '#c9a05a' } },
      toalheiro: 'toalheiro', papeleira: 1, coluna: '#e9e1d3', cesto: '#c9a77c', planta: '#e8dcc3',
    }),
    servico: servico({
      nome: 'Serviço aconchegante', desc: 'Armário de madeira clara, cestos e uma planta que aguenta lavanderia.',
      parede: T('#ecdcc4', 'Creme'), piso: 'cer-bege', luz: { temp: 'neutra', int: 0.9 }, tanque: { modelo: 'ceramica', cor: '#f6f5f2', torneira: '#c9a05a' },
      maquina: '#e9e9e9', armario: { tipo: 'armservico', cor: '#c9a77c' }, aereo: '#c9a77c', cesto: '#c9a77c', planta: '#e8dcc3',
    }),
  },
  {
    id: 'minimalista', nome: 'Minimalista', curto: 'Minimalista',
    frase: 'Poucas peças, superfícies limpas e muita luz.',
    desc: 'Branco e cinza muito claro, porcelanato polido, rodapé invisível e móveis suspensos. A decoração se resume a uma planta e um quadro, e a luz é neutra e uniforme.',
    tags: ['branco', 'limpo', 'suspenso', 'luz neutra'], periodo: 'dia',
    pal: { w: '#f4f2ee', m: '#f1efea', t: '#e2ddd2', a: '#2b2b2b', g: '#2b2b2b' },
    aberturas: { porta: '#f6f4f0', entrada: '#f6f4f0', esquadria: '#f2f2f0', macaneta: '#c9ccd0' },
    sala: sala({
      nome: 'Sala minimalista', desc: 'Rack suspenso branco, sofá claro e um único quadro.',
      parede: T('#f4f2ee', 'Branco gelo'), piso: 'cer-off', rodape: 'nenhum', forro: { tipo: 'gesso', drop: 0.06, cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 1 },
      sofa: '#e8e3da', rack: { tipo: 'racksusp', cor: '#f1efea' }, tapete: { cor: '#e2ddd2' }, mesa: { cor: '#f1efea', tipos: ['mesaapoio', 'mesalateral'] },
      quadro: { tipo: 'quadrogrande', cor: '#2b2b2b' }, luminaria: '#2b2b2b', sobreRack: [['plantapeq', 0, '#f1efea']], plantas: 1, vaso: '#f1efea', teto: [['spots4', null]],
    }),
    cozinha: cozinha({
      nome: 'Cozinha minimalista', desc: 'Tudo branco, tampo claro e quase nada à vista.',
      parede: T('#f4f2ee', 'Branco gelo'), piso: 'cer-off', rodape: 'nenhum', forro: { tipo: 'gesso', drop: 0.06, cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 1 },
      bancada: { tampo: 'branco', armario: 'portas', cor: '#f1efea', torneira: '#c9ccd0', cuba: 1 },
      geladeira: '#e9e9e9', fogao: '#e9e9e9', mesa: ['#f1efea', '#f1efea'], mesaTipo: 'jantar2',
      aereo: { tipo: 'aereo', cor: '#f1efea' }, coifa: 'coifaslim', balcao: [['cafeteira', -0.35, '#e9e9e9']], pendente: ['pendente', '#f1efea'],
    }),
    quarto: [quarto({
      nome: 'Quarto minimalista', desc: 'Cama baixa, criados suspensos e parede lisa.',
      parede: T('#f1efeb', 'Branco gelo'), piso: 'lam-cinza', rodape: 'nenhum', forro: { tipo: 'gesso', drop: 0.06, cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.9 },
      cama: ['#e8e3da', '#e8e3da'], gr: '#f1efea', criado: '#f1efea', criadoTipo: 'criadosusp', tapete: { cor: '#e2ddd2' }, abajur: '#f1efea', cortina: '#f1efea',
      quadro: { tipo: 'quadro', cor: '#2b2b2b' }, teto: [['plafon', null]],
    })],
    banho: banho({
      nome: 'Banheiro minimalista', desc: 'Branco total, vidro incolor e metais cromados.',
      parede: T('#f4f2ee', 'Branco gelo', MEIA('azulejo-branco', 1.5)), piso: 'cer-off', forro: { tipo: 'laje', cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 1 },
      fixos: { lavatorio: { modelo: 'suspenso', torneira: '#c9ccd0' }, vaso: { modelo: 'suspensa' }, box: { modelo: 'fixo', vidro: 'incolor', perfil: '#b9bcc0' } },
      armario: { tipo: 'armariobanho', cor: '#f1efea' }, papeleira: 1,
    }),
    servico: servico({
      nome: 'Serviço minimalista', desc: 'Armário branco fechado e superfícies livres.',
      parede: T('#f4f2ee', 'Branco gelo'), piso: 'cer-off', luz: { temp: 'neutra', int: 1 }, tanque: { modelo: 'ceramica', cor: '#f6f5f2', torneira: '#c9ccd0' },
      maquina: '#e9e9e9', armario: { tipo: 'vassoureiro', cor: '#f1efea' }, aereo: '#f1efea',
    }),
  },
  {
    id: 'contemporaneo', nome: 'Contemporâneo', curto: 'Contemporâneo',
    frase: 'Greige, madeira escura, preto fosco e sanca de luz.',
    desc: 'Paredes greige, ripado de madeira atrás da TV, porcelanato cinza, sanca com LED e detalhes em preto. Sofá grafite, rack de nogueira e um toque de mostarda.',
    tags: ['greige', 'ripado', 'preto fosco', 'sanca LED'], periodo: 'tarde',
    pal: { w: '#d9d3c8', m: '#6e4a31', t: '#6f6a64', a: '#d1a54a', g: '#2b2b2b' },
    aberturas: { porta: '#e9e1d3', entrada: '#2f2e2c', esquadria: '#2b2b2d', macaneta: '#222224' },
    sala: sala({
      nome: 'Sala contemporânea', desc: 'Ripado atrás da TV, sanca com LED, sofá grafite e almofada mostarda.',
      parede: T('#d9d3c8', 'Greige'), dest: [['rack', X('ripado')]], piso: 'cer-cinza', rodape: 'preto7',
      forro: { tipo: 'sanca', drop: 0.12, cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.85 },
      sofa: '#6f6a64', rack: { tipo: 'racksusp', cor: '#6e4a31' }, tv: 'tv65', tapete: { cor: '#b9b4a9' }, mesa: { cor: '#2f2e2c' }, poltrona: '#d1a54a',
      luminaria: '#2b2b2b', quadro: { tipo: 'quadrogrande', cor: '#4f6b5a' }, plantas: 1, vaso: '#2f2e2c', sobreRack: [['vasodeco', 0.3, '#2f2e2c']], cortina: '#d8d3c9',
    }),
    cozinha: cozinha({
      nome: 'Cozinha contemporânea', desc: 'Armários grafite, tampo preto e pendente de cúpula.',
      parede: T('#d9d3c8', 'Greige'), piso: 'cer-cinza', rodape: 'preto7', forro: { tipo: 'sanca', drop: 0.10, cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.9 },
      bancada: { tampo: 'preto', armario: 'gavetas', cor: '#2f2e2c', torneira: '#222224', cuba: 1 },
      geladeira: '#b9bcc0', fogao: '#2b2b2b', mesa: ['#2f2e2c', '#6e4a31'], mesaTipo: 'jantarbanco',
      aereo: { tipo: 'aereoflap', cor: '#2f2e2c' }, coifa: 'coifaslim', balcao: [['cafeteira', -0.35, '#2b2b2b'], ['torradeira', 0.35, '#b9bcc0']], pendente: ['pendente', '#2b2b2b'], quadro: { tipo: 'quadrogrande', cor: '#d1a54a' },
    }),
    quarto: [quarto({
      nome: 'Quarto contemporâneo', desc: 'Painel ripado na cabeceira, criados suspensos e luz indireta.',
      parede: T('#d9d3c8', 'Greige'), piso: 'lam-cinza', rodape: 'preto7', forro: { tipo: 'sanca', drop: 0.10, cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.7 },
      cama: ['#6f6a64', '#6e4a31'], gr: '#6e4a31', criado: '#2f2e2c', criadoTipo: 'criadosusp', tapete: { cor: '#b9b4a9' }, painel: '#6e4a31', abajur: '#2b2b2b', cortina: '#bdb6a9',
      poltrona: '#d1a54a', planta: { cor: '#2f2e2c' },
    })],
    banho: banho({
      nome: 'Banheiro contemporâneo', desc: 'Azulejo grafite, vidro fumê, perfis e metais pretos.',
      parede: T('#d9d3c8', 'Greige', MEIA('azulejo-grafite', 1.5)), piso: 'cer-grafite', forro: { tipo: 'gesso', drop: 0.08, cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.9 },
      fixos: { lavatorio: { modelo: 'apoio', armario: 'gavetas', corArm: '#6e4a31', torneira: '#222224', cor: '#f6f5f2' }, vaso: { cor: '#f6f5f2', assento: '#2b2b2d' }, box: { vidro: 'fume', perfil: '#1c1c1e', metal: '#222224', ducha: 'teto' } },
      armario: { tipo: 'armariobanho', cor: '#2f2e2c' }, toalheiro: 'toalheirotermico', papeleira: 1,
    }),
    servico: servico({
      nome: 'Serviço contemporâneo', desc: 'Tanque com bancada de granito e armários grafite.',
      parede: T('#d9d3c8', 'Greige'), piso: 'cer-grafite', luz: { temp: 'neutra', int: 1 }, tanque: { modelo: 'granito', armario: 'portas', torneira: '#222224' },
      maquina: '#b9bcc0', armario: { tipo: 'armservico', cor: '#2f2e2c' }, aereo: '#2f2e2c', cesto: '#2f2e2c',
    }),
  },
  {
    id: 'industrial', nome: 'Industrial', curto: 'Industrial',
    frase: 'Cimento, tijolinho, metal preto e couro.',
    desc: 'Cimento queimado no piso, tijolinho branco na parede principal, esquadrias pretas, trilho de spots e móveis de metal e madeira escura. Visual de loft.',
    tags: ['cimento', 'tijolinho', 'metal preto', 'loft'], periodo: 'noite',
    pal: { w: '#b9bdbb', m: '#2f2e2c', t: '#7a4b2e', a: '#c47a5a', g: '#2b2b2b' },
    aberturas: { porta: '#2f2e2c', entrada: '#2f2e2c', esquadria: '#2b2b2d', macaneta: '#222224' },
    sala: sala({
      nome: 'Sala industrial', desc: 'Tijolinho atrás do sofá, piso de cimento, trilho de spots e sofá de couro.',
      parede: T('#b9bdbb', 'Cinza médio'), dest: [['sofa', X('tijolo-branco')]], piso: 'cimento', rodape: 'preto7',
      forro: { tipo: 'laje', cor: '#dad8d2' }, luz: { temp: 'neutra', int: 0.85 },
      sofa: '#7a4b2e', rack: { cor: '#2f2e2c' }, tapete: { cor: '#555a58' }, mesa: { cor: '#2f2e2c' }, luminaria: '#2b2b2b',
      quadro: { tipo: 'quadro', cor: '#c47a5a' }, plantas: 1, vaso: '#2b2b2b', cortina: '#7d8580', teto: [['trilho', null]], espelho: { tipo: 'espelho', cor: '#2b2b2b' },
      sobreRack: [['vasodeco', 0.3, '#2b2b2b']],
    }),
    cozinha: cozinha({
      nome: 'Cozinha industrial', desc: 'Armários pretos, tampo de concreto, azulejo metrô e aéreo basculante.',
      parede: X('azulejo-metro'), piso: 'cimento', rodape: 'preto7', forro: { tipo: 'laje', cor: '#dad8d2' }, luz: { temp: 'neutra', int: 0.95 },
      bancada: { tampo: 'concreto', armario: 'misto', cor: '#2f2e2c', torneira: '#222224', cuba: 1 },
      geladeira: '#b9bcc0', fogao: '#2b2b2b', mesa: ['#6e4a31', '#2b2b2b'], mesaTipo: 'mesaalta',
      aereo: { tipo: 'aereovidro', cor: '#2f2e2c' }, coifa: 'coifa', balcao: [['cafeteira', -0.35, '#2b2b2b'], ['liquidificador', 0.35, '#b9bcc0']], pendente: ['pendente', '#2b2b2b'],
      relogio: '#2b2b2b',
    }),
    quarto: [quarto({
      nome: 'Quarto industrial', desc: 'Parede de cimento, arara de roupas à vista e cama de ferro.',
      parede: X('cimento-parede'), piso: 'lam-nogueira', rodape: 'preto7', forro: { tipo: 'laje', cor: '#dad8d2' }, luz: { temp: 'neutra', int: 0.7 },
      cama: ['#7d8580', '#2f2e2c'], gr: '#2f2e2c', criado: '#2f2e2c', tapete: { cor: '#555a58' }, abajur: '#2b2b2b', arandela: '#2b2b2b', cortina: '#7d8580',
      extra: [['arara', { par: 1, a: 'cama', lado: 'frente' }, { cor: '#2b2b2b' }]], planta: { cor: '#2b2b2b' },
    })],
    banho: banho({
      nome: 'Banheiro industrial', desc: 'Azulejo grafite, cimento no piso e metais pretos.',
      parede: T('#b9bdbb', 'Cinza médio', MEIA('azulejo-grafite', 1.5)), piso: 'cimento', forro: { tipo: 'laje', cor: '#dad8d2' }, luz: { temp: 'neutra', int: 0.9 },
      fixos: { lavatorio: { modelo: 'apoio', armario: 'portas', corArm: '#2f2e2c', torneira: '#222224' }, vaso: { assento: '#2b2b2d' }, box: { vidro: 'fume', perfil: '#1c1c1e', metal: '#222224' } },
      armario: { tipo: 'armariobanho', cor: '#2f2e2c' }, toalheiro: 'toalheiro', papeleira: 1, cesto: '#2b2b2b',
    }),
    servico: servico({
      nome: 'Serviço industrial', desc: 'Tanque de inox em bancada e armário de metal.',
      parede: X('cimento-parede'), piso: 'cimento', luz: { temp: 'neutra', int: 1 }, tanque: { modelo: 'inox', armario: 'portas', torneira: '#222224' },
      maquina: '#b9bcc0', armario: { tipo: 'armservico', cor: '#2f2e2c' }, aereo: '#2f2e2c', cesto: '#2b2b2b',
    }),
  },
  {
    id: 'escandinavo', nome: 'Escandinavo', curto: 'Escandinavo',
    frase: 'Branco, madeira clara e verde sálvia.',
    desc: 'Paredes brancas, parede sálvia atrás do sofá, piso de laminado claro, móveis de carvalho com pés finos e muita planta. Luz neutra para o dia e quente à noite.',
    tags: ['madeira clara', 'sálvia', 'plantas', 'hygge'], periodo: 'dia',
    pal: { w: '#fbfaf7', m: '#c9a77c', t: '#c9bfae', a: '#c9d3c3', g: '#39423f' },
    aberturas: { porta: '#f6f4f0', entrada: '#c9a77c', esquadria: '#f2f2f0', macaneta: '#c9ccd0' },
    sala: sala({
      nome: 'Sala escandinava', desc: 'Parede sálvia atrás do sofá, carvalho claro, tapete grande e abajur de mesa.',
      parede: T('#fbfaf7', 'Branco neve'), dest: [['sofa', T('#c9d3c3', 'Verde sálvia')]], piso: 'lam-claro', rodape: 'branco10',
      forro: { tipo: 'laje', cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.9 },
      sofa: '#c9bfae', rack: { cor: '#c9a77c' }, tapete: { cor: '#e8e3da' }, mesa: { cor: '#c9a77c' }, poltrona: '#cfdbe2', abajur: '#f1efea', luminaria: '#2b2b2b',
      quadro: { tipo: 'quadrotrio', cor: '#8c9a6b' }, plantas: 2, vaso: '#f1efea', sobreRack: [['vasodeco', 0.0, '#f1efea']], cortina: '#f1efea', teto: [['globo', '#f1efea']],
    }),
    cozinha: cozinha({
      nome: 'Cozinha escandinava', desc: 'Frentes brancas, tampo de madeira e mesa redonda clara.',
      parede: T('#fbfaf7', 'Branco neve'), piso: 'lam-claro', rodape: 'branco7', forro: { tipo: 'laje', cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.95 },
      bancada: { tampo: 'madeira', armario: 'portas', cor: '#f1efea', torneira: '#c9ccd0', cuba: 1 },
      geladeira: '#e9e9e9', fogao: '#e9e9e9', mesa: ['#f1efea', '#c9a77c'], mesaTipo: 'jantarredonda',
      aereo: { tipo: 'aereo', cor: '#f1efea' }, nicho: '#c9a77c', coifa: 'coifaslim', balcao: [['cafeteira', -0.35, '#f1efea'], ['plantapeq', 0.35, '#f1efea']],
      pendente: ['globo', '#f1efea'], quadro: { tipo: 'quadro', cor: '#8c9a6b' }, planta: '#f1efea',
    }),
    quarto: [quarto({
      nome: 'Quarto escandinavo', desc: 'Cabeceira de madeira clara, roupa de cama neutra e tapete.',
      parede: T('#fbfaf7', 'Branco neve'), dest: [['cama', T('#c9d3c3', 'Verde sálvia')]], piso: 'lam-claro', rodape: 'branco10', forro: { tipo: 'laje', cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.75 },
      cama: ['#f1efea', '#c9a77c'], gr: '#f1efea', criado: '#c9a77c', tapete: { cor: '#e8e3da' }, abajur: '#f1efea', quadro: { tipo: 'quadrogrande', cor: '#8c9a6b' }, poltrona: '#cfdbe2',
      cortina: '#f1efea', planta: { cor: '#f1efea' }, espelho: { tipo: 'espelho', cor: '#c9a77c' },
    })],
    banho: banho({
      nome: 'Banheiro escandinavo', desc: 'Azulejo branco, madeira clara no gabinete e planta.',
      parede: T('#fbfaf7', 'Branco neve', MEIA('azulejo-metro', 1.5)), piso: 'cer-banho', forro: { tipo: 'laje', cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.95 },
      fixos: { lavatorio: { modelo: 'gabinete', armario: 'gavetas', corArm: '#c9a77c', torneira: '#c9ccd0', espelho: true }, vaso: { assento: '#a5774b' }, box: { vidro: 'incolor', perfil: '#b9bcc0' } },
      toalheiro: 'toalheiro', papeleira: 1, cesto: '#c9a77c', planta: '#f1efea',
    }),
    servico: servico({
      nome: 'Serviço escandinavo', desc: 'Branco, madeira clara e cestos de palha.',
      parede: T('#fbfaf7', 'Branco neve'), piso: 'cer-off', luz: { temp: 'neutra', int: 1 }, tanque: { modelo: 'ceramica', cor: '#f6f5f2', torneira: '#c9ccd0' },
      maquina: '#e9e9e9', armario: { tipo: 'armservico', cor: '#c9a77c' }, aereo: '#f1efea', cesto: '#c9a77c', planta: '#f1efea',
    }),
  },
  {
    id: 'sofisticado', nome: 'Sofisticado', curto: 'Sofisticado',
    frase: 'Mármore, azul-marinho, dourado e iluminação em camadas.',
    desc: 'Piso de mármore, parede azul-marinho atrás do sofá, sanca com LED, lustre e metais dourados. Nogueira, linho e espelhos para um ar de hotel boutique.',
    tags: ['mármore', 'azul-marinho', 'dourado', 'sanca LED'], periodo: 'noite',
    pal: { w: '#e9e4da', m: '#6e4a31', t: '#c9bfae', a: '#2f3e56', g: '#c9a05a' },
    aberturas: { porta: '#f6f4f0', entrada: '#6e4a31', esquadria: '#6b4f3a', macaneta: '#c9a05a' },
    sala: sala({
      nome: 'Sala sofisticada', desc: 'Parede azul-marinho, mármore, lustre de cristal e espelho redondo.',
      parede: T('#e9e4da', 'Off-white'), dest: [['sofa', T('#2f3e56', 'Azul-marinho')]], piso: 'marmore', rodape: 'branco15',
      forro: { tipo: 'sanca', drop: 0.12, cor: '#f7f6f3' }, luz: { temp: 'quente', int: 0.75 },
      sofa: '#c9bfae', rack: { cor: '#6e4a31' }, tv: 'tv55', tapete: { cor: '#d8cdb9' }, mesa: { cor: '#6e4a31' }, poltrona: '#d1a54a', abajur: '#e8e3da', luminaria: '#c9a05a',
      espelho: { tipo: 'espelhoredondo', cor: '#c9a05a' }, quadro: { tipo: 'quadrogrande', cor: '#c9a05a' }, plantas: 1, vaso: '#2f3e56', sobreRack: [['vasodeco', 0.3, '#c9a05a']], cortina: '#d8cdb9',
      teto: [['lustre', '#c9a05a']], tetoEm: 'tapete',
    }),
    cozinha: cozinha({
      nome: 'Cozinha sofisticada', desc: 'Frentes azul-petróleo, tampo branco, metais dourados e pendentes.',
      parede: T('#e9e4da', 'Off-white'), piso: 'marmore', rodape: 'branco10', forro: { tipo: 'sanca', drop: 0.10, cor: '#f7f6f3' }, luz: { temp: 'quente', int: 0.8 },
      bancada: { tampo: 'branco', armario: 'misto', cor: '#3f5f6b', torneira: '#c9a05a', cuba: 1 },
      geladeira: '#b9bcc0', fogao: '#2b2b2b', mesa: ['#6e4a31', '#3f5f6b'], mesaTipo: 'jantaroval',
      aereo: { tipo: 'aereovidro', cor: '#3f5f6b' }, coifa: 'coifa', balcao: [['cafeteira', -0.35, '#2b2b2b'], ['panelaarroz', 0.35, '#f1efea']], pendente: ['pendente3', '#c9a05a'], quadro: { tipo: 'quadrogrande', cor: '#c9a05a' },
    }),
    quarto: [quarto({
      nome: 'Quarto sofisticado', desc: 'Cabeceira em painel, arandelas douradas e cortina pesada.',
      parede: T('#e9e4da', 'Off-white'), dest: [['cama', T('#2f3e56', 'Azul-marinho')]], piso: 'parque', rodape: 'branco15', forro: { tipo: 'sanca', drop: 0.10, cor: '#f7f6f3' }, luz: { temp: 'quente', int: 0.55 },
      cama: ['#e8e3da', '#6e4a31'], camaTipo: 'camaqueen', gr: '#6e4a31', criado: '#6e4a31', tapete: { cor: '#d8cdb9' }, abajur: '#e8e3da', arandela: '#c9a05a',
      quadro: { tipo: 'quadrogrande', cor: '#c9a05a' }, comoda: { tipo: 'comoda', cor: '#6e4a31' }, poltrona: '#d1a54a', cortina: '#d8cdb9', espelho: { tipo: 'espelho', cor: '#c9a05a' },
      teto: [['lustre', '#c9a05a']],
    })],
    banho: banho({
      nome: 'Banheiro sofisticado', desc: 'Mármore no piso, vidro fumê, metais dourados e espelho com gabinete.',
      parede: T('#e9e4da', 'Off-white', MEIA('azulejo-branco', 1.5)), piso: 'marmore', forro: { tipo: 'gesso', drop: 0.08, cor: '#f7f6f3' }, luz: { temp: 'quente', int: 0.8 },
      fixos: { lavatorio: { modelo: 'gabinete', armario: 'gavetas', corArm: '#3f5f6b', torneira: '#c9a05a', espelho: true }, vaso: { assento: '#f6f5f2' }, box: { vidro: 'fume', perfil: '#c9a05a', metal: '#c9a05a', ducha: 'teto' } },
      toalheiro: 'toalheirotermico', papeleira: 1, prateleira: 1, cesto: '#c9a77c', planta: '#e8e3da',
    }),
    servico: servico({
      nome: 'Serviço sofisticado', desc: 'Armários fechados em petróleo e tanque de granito.',
      parede: T('#e9e4da', 'Off-white'), piso: 'cer-cinza', luz: { temp: 'neutra', int: 1 }, tanque: { modelo: 'granito', armario: 'portas', torneira: '#c9a05a' },
      maquina: '#b9bcc0', armario: { tipo: 'armservico', cor: '#3f5f6b' }, aereo: '#3f5f6b', cesto: '#c9a77c',
    }),
  },
  {
    id: 'biofilico', nome: 'Natural e biofílico', curto: 'Biofílico',
    frase: 'Verde, madeira crua e plantas em todos os ambientes.',
    desc: 'Verde oliva e sálvia, papel de folhagem, vinílico freijó, cortinas de linho, cestos de palha e muitas plantas. A casa fica com cara de varanda.',
    tags: ['plantas', 'verde', 'linho', 'palha'], periodo: 'dia',
    pal: { w: '#dfe5d3', m: '#a5774b', t: '#7d8461', a: '#5b6b4f', g: '#39423f' },
    aberturas: { porta: '#e9e1d3', entrada: '#7d8461', esquadria: '#f2f2f0', macaneta: '#8c6b4a' },
    sala: sala({
      nome: 'Sala biofílica', desc: 'Papel de folhagem, sofá oliva e plantas de piso, de rack e de canto.',
      parede: T('#dfe5d3', 'Sálvia clara'), dest: [['sofa', X('papel-folha')]], piso: 'vinilico', rodape: 'madeira10',
      forro: { tipo: 'gesso', drop: 0.08, cor: '#f1eee4' }, luz: { temp: 'quente', int: 0.8 },
      sofa: '#7d8461', rack: { cor: '#a5774b' }, tapete: { tipo: 'tapeteredondo', cor: '#c9a77c' }, mesa: { cor: '#a5774b' }, puff: '#c9bfae', cesto: '#c9a77c',
      luminaria: '#39423f', plantas: 3, vaso: '#e8dcc3', sobreRack: [['plantapeq', -0.4, '#e8dcc3'], ['cacto', 0.3, '#b46a4c']], cortina: '#e8e3da', teto: [['globo', '#c9a77c']],
    }),
    cozinha: cozinha({
      nome: 'Cozinha biofílica', desc: 'Azulejo verde, madeira crua e ervas na bancada.',
      parede: T('#dfe5d3', 'Sálvia clara'), piso: 'hex-verde', rodape: 'branco7', forro: { tipo: 'gesso', drop: 0.08, cor: '#f1eee4' }, luz: { temp: 'quente', int: 0.85 },
      bancada: { tampo: 'madeira', armario: 'portas', cor: '#8c9a6b', torneira: '#8c6b4a', cuba: 1 },
      geladeira: '#e8e1d2', fogao: '#e8e1d2', mesa: ['#a5774b', '#7d8461'], mesaTipo: 'jantarredonda',
      aereo: { tipo: 'aereo', cor: '#c9d3c3' }, nicho: '#a5774b', coifa: 'coifa', balcao: [['plantapeq', -0.4, '#e8dcc3'], ['plantapeq', 0.4, '#e8dcc3']], topoGeladeira: ['plantapeq', '#e8dcc3'],
      pendente: ['pendente', '#c9a77c'], planta: '#e8dcc3', quadro: { tipo: 'quadro', cor: '#5b6b4f' },
    }),
    quarto: [quarto({
      nome: 'Quarto biofílico', desc: 'Parede de folhagem na cabeceira, linho e plantas por perto.',
      parede: T('#dfe5d3', 'Sálvia clara'), dest: [['cama', X('papel-folha')]], piso: 'vinilico', rodape: 'madeira10', forro: { tipo: 'gesso', drop: 0.08, cor: '#f1eee4' }, luz: { temp: 'quente', int: 0.6 },
      cama: ['#e8e3da', '#a5774b'], gr: '#c9a77c', criado: '#a5774b', tapete: { tipo: 'tapeteredondo', cor: '#c9a77c' }, abajur: '#e8dcc3', cortina: '#e8e3da',
      poltrona: '#7d8461', planta: { tipo: 'planta', cor: '#e8dcc3' }, bau: '#c9a77c',
    })],
    banho: banho({
      nome: 'Banheiro biofílico', desc: 'Azulejo verde, madeira e uma planta que gosta de umidade.',
      parede: T('#dfe5d3', 'Sálvia clara', MEIA('azulejo-verde', 1.5)), piso: 'hex-verde', forro: { tipo: 'gesso', drop: 0.08, cor: '#f1eee4' }, luz: { temp: 'quente', int: 0.8 },
      fixos: { lavatorio: { modelo: 'gabinete', armario: 'portas', corArm: '#a5774b', torneira: '#8c6b4a', espelho: true }, vaso: { assento: '#a5774b' }, box: { vidro: 'jateado', perfil: '#8c6b4a', metal: '#8c6b4a' } },
      toalheiro: 'toalheiro', papeleira: 1, cesto: '#c9a77c', planta: '#e8dcc3', banquinho: '#a5774b',
    }),
    servico: servico({
      nome: 'Serviço biofílico', desc: 'Verde-claro, madeira e plantas na lavanderia.',
      parede: T('#dfe5d3', 'Sálvia clara'), piso: 'cer-bege', luz: { temp: 'neutra', int: 1 }, tanque: { modelo: 'ceramica', cor: '#f6f5f2', torneira: '#8c6b4a' },
      maquina: '#e9e9e9', armario: { tipo: 'armservico', cor: '#c9d3c3' }, aereo: '#c9d3c3', cesto: '#c9a77c', planta: '#e8dcc3',
    }),
  },
  {
    id: 'terroso', nome: 'Terroso e boho', curto: 'Terroso',
    frase: 'Terracota, palha, argila e peças feitas à mão.',
    desc: 'Parede terracota, piso hexagonal bege, tapete redondo, cestos, espelho redondo e luzes em globo. Cores quentes e texturas naturais.',
    tags: ['terracota', 'palha', 'boho', 'artesanal'], periodo: 'tarde',
    pal: { w: '#e3c6b4', m: '#c9a77c', t: '#b46a4c', a: '#d1a54a', g: '#5b4636' },
    aberturas: { porta: '#e9e1d3', entrada: '#b46a4c', esquadria: '#6b4f3a', macaneta: '#8c6b4a' },
    sala: sala({
      nome: 'Sala terrosa', desc: 'Parede terracota, sofá de tom queimado, tapete redondo e cestos.',
      parede: T('#e3c6b4', 'Argila'), dest: [['sofa', T('#c47a5a', 'Terracota')]], piso: 'hex-bege', rodape: 'branco10',
      forro: { tipo: 'gesso', drop: 0.08, cor: '#f1e6d6' }, luz: { temp: 'quente', int: 0.7 },
      sofa: '#b46a4c', rack: { cor: '#c9a77c' }, tapete: { tipo: 'tapeteredondo', cor: '#e8dcc3' }, mesa: { cor: '#a5774b' }, puff: '#d1a54a', cesto: '#c9a77c',
      espelho: { tipo: 'espelhoredondo', cor: '#a5774b' }, quadro: { tipo: 'quadrotrio', cor: '#d1a54a' }, plantas: 2, vaso: '#c9a77c', abajur: '#e8dcc3', cortina: '#e8dcc3', teto: [['globo', '#c9a77c']],
    }),
    cozinha: cozinha({
      nome: 'Cozinha terrosa', desc: 'Armários em argila, tampo de madeira e banquetas de palha.',
      parede: T('#ecd5c0', 'Pêssego'), piso: 'hex-bege', rodape: 'branco7', forro: { tipo: 'gesso', drop: 0.08, cor: '#f1e6d6' }, luz: { temp: 'quente', int: 0.75 },
      bancada: { tampo: 'madeira', armario: 'portas', cor: '#c47a5a', torneira: '#8c6b4a', cuba: 1 },
      geladeira: '#e8e1d2', fogao: '#e8e1d2', mesa: ['#a5774b', '#c9a77c'],
      aereo: { tipo: 'aereo', cor: '#e3c6b4' }, nicho: '#a5774b', coifa: 'coifa', balcao: [['plantapeq', -0.4, '#c9a77c'], ['panelaarroz', 0.35, '#e8dcc3']],
      pendente: ['globo', '#c9a77c'], quadro: { tipo: 'quadrotrio', cor: '#d1a54a' }, planta: '#c9a77c',
    }),
    quarto: [quarto({
      nome: 'Quarto terroso', desc: 'Cabeceira terracota, tapete de palha e espelho redondo.',
      parede: T('#e9d3c0', 'Pêssego'), dest: [['cama', T('#c47a5a', 'Terracota')]], piso: 'lam-claro', rodape: 'madeira10', forro: { tipo: 'gesso', drop: 0.08, cor: '#f1e6d6' }, luz: { temp: 'quente', int: 0.55 },
      cama: ['#e8dcc3', '#a5774b'], gr: '#c9a77c', criado: '#a5774b', tapete: { tipo: 'tapeteredondo', cor: '#e8dcc3' }, abajur: '#e8dcc3', quadro: { tipo: 'quadrotrio', cor: '#d1a54a' },
      espelho: { tipo: 'espelhoredondo', cor: '#a5774b' }, poltrona: '#d1a54a', bau: '#c9a77c', cortina: '#e8dcc3', planta: { cor: '#c9a77c' },
    })],
    banho: banho({
      nome: 'Banheiro terroso', desc: 'Azulejo em tom de argila, madeira e metais bronze.',
      parede: T('#e3c6b4', 'Argila', MEIA('azulejo-metro', 1.5)), piso: 'hex-bege', forro: { tipo: 'gesso', drop: 0.08, cor: '#f1e6d6' }, luz: { temp: 'quente', int: 0.75 },
      fixos: { lavatorio: { modelo: 'gabinete', armario: 'portas', corArm: '#c47a5a', torneira: '#8c6b4a', espelho: true }, vaso: { cor: '#e9dfcc', assento: '#a5774b' }, box: { vidro: 'jateado', perfil: '#8c6b4a', metal: '#8c6b4a' } },
      toalheiro: 'toalheiro', papeleira: 1, cesto: '#c9a77c', planta: '#c9a77c',
    }),
    servico: servico({
      nome: 'Serviço terroso', desc: 'Cestos de palha, armário claro e cores quentes.',
      parede: T('#ecd5c0', 'Pêssego'), piso: 'hex-bege', luz: { temp: 'neutra', int: 0.95 }, tanque: { modelo: 'ceramica', cor: '#e9dfcc', torneira: '#8c6b4a' },
      maquina: '#e9e9e9', armario: { tipo: 'armservico', cor: '#e8dcc3' }, aereo: '#e8dcc3', cesto: '#c9a77c', planta: '#c9a77c',
    }),
  },
  {
    id: 'colorido', nome: 'Colorido e jovem', curto: 'Colorido',
    frase: 'Azul-petróleo, mostarda e personalidade de sobra.',
    desc: 'Parede azul-petróleo, sofá mostarda, piso xadrez no serviço, quadros grandes e luminárias de cor. Para quem não tem medo de cor.',
    tags: ['cor', 'mostarda', 'petróleo', 'pop'], periodo: 'dia',
    pal: { w: '#f1efeb', m: '#2f2e2c', t: '#d1a54a', a: '#3f6471', g: '#c0392b' },
    aberturas: { porta: '#f6f4f0', entrada: '#3f6471', esquadria: '#2b2b2d', macaneta: '#222224' },
    sala: sala({
      nome: 'Sala colorida', desc: 'Sofá mostarda, parede azul-petróleo e poltrona rosa antigo.',
      parede: T('#f1efeb', 'Branco gelo'), dest: [['sofa', T('#3f6471', 'Azul petróleo')]], piso: 'cer-off', rodape: 'branco10',
      forro: { tipo: 'laje', cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.95 },
      sofa: '#d1a54a', rack: { cor: '#2f2e2c' }, tv: 'tv55', tapete: { tipo: 'tapeteredondo', cor: '#dbb5b0' }, mesa: { cor: '#2f2e2c' }, poltrona: '#dbb5b0', luminaria: '#c0392b',
      quadro: { tipo: 'quadrogrande', cor: '#c0392b' }, plantas: 1, vaso: '#d1a54a', sobreRack: [['vasodeco', 0.3, '#3f6471']], cortina: '#e9d9a8', teto: [['globo', '#c0392b']],
    }),
    cozinha: cozinha({
      nome: 'Cozinha colorida', desc: 'Frentes azul-petróleo, azulejo metrô azul e eletros pretos.',
      parede: X('azulejo-azul'), piso: 'xadrez', rodape: 'branco7', forro: { tipo: 'laje', cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 1 },
      bancada: { tampo: 'branco', armario: 'portas', cor: '#3f5f6b', torneira: '#c9ccd0', cuba: 1 },
      geladeira: '#d1a54a', fogao: '#2b2b2b', mesa: ['#f1efea', '#d1a54a'], mesaTipo: 'jantar2',
      aereo: { tipo: 'aereo60', cor: '#d1a54a' }, coifa: 'coifaslim', balcao: [['cafeteira', -0.35, '#c0392b'], ['torradeira', 0.35, '#d1a54a']], pendente: ['globo', '#c0392b'], quadro: { tipo: 'quadro', cor: '#3f5f6b' },
    }),
    quarto: [quarto({
      nome: 'Quarto colorido', desc: 'Cabeceira azul, roupa de cama listrada e poltrona mostarda.',
      parede: T('#f1efeb', 'Branco gelo'), dest: [['cama', T('#3f6471', 'Azul petróleo')]], piso: 'lam-claro', rodape: 'branco10', forro: { tipo: 'laje', cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.8 },
      cama: ['#e9d9a8', '#3f5f6b'], gr: '#f1efea', criado: '#d1a54a', tapete: { tipo: 'tapeteredondo', cor: '#dbb5b0' }, abajur: '#c0392b', quadro: { tipo: 'quadrogrande', cor: '#d1a54a' },
      poltrona: '#d1a54a', cortina: '#e9d9a8', planta: { cor: '#d1a54a' },
    })],
    banho: banho({
      nome: 'Banheiro colorido', desc: 'Azulejo azul, piso xadrez e metais pretos.',
      parede: T('#f1efeb', 'Branco gelo', MEIA('azulejo-azul', 1.5)), piso: 'xadrez', forro: { tipo: 'laje', cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 1 },
      fixos: { lavatorio: { modelo: 'coluna', cor: '#f6f5f2', torneira: '#222224' }, vaso: { assento: '#d1a54a', cor: '#f6f5f2' }, box: { vidro: 'incolor', perfil: '#1c1c1e', metal: '#222224' } },
      toalheiro: 'toalheiro', papeleira: 1, cesto: '#d1a54a', armario: { tipo: 'armariobanho', cor: '#d8d4cc' },
    }),
    servico: servico({
      nome: 'Serviço colorido', desc: 'Piso xadrez, tanque branco e armário mostarda.',
      parede: T('#f1efeb', 'Branco gelo'), piso: 'xadrez', luz: { temp: 'neutra', int: 1 }, tanque: { modelo: 'ceramica', cor: '#f6f5f2', torneira: '#222224' },
      maquina: '#e9e9e9', armario: { tipo: 'armservico', cor: '#d1a54a' }, aereo: '#3f5f6b', cesto: '#c0392b',
    }),
  },
  {
    id: 'cinema', nome: 'Noite e cinema', curto: 'Cinema',
    frase: 'Paredes escuras, luz baixa e TV grande.',
    desc: 'Grafite e azul-marinho nas paredes, painel ripado escuro atrás de uma TV de 65 polegadas, sanca de LED em baixa intensidade e cortinas pesadas. Feito para ver filme à noite.',
    tags: ['escuro', 'TV grande', 'luz baixa', 'noite'], periodo: 'noite',
    pal: { w: '#5f6a67', m: '#2f2e2c', t: '#2f3e56', a: '#c9a05a', g: '#1b2221' },
    aberturas: { porta: '#2f2e2c', entrada: '#2f2e2c', esquadria: '#2b2b2d', macaneta: '#c9a05a', vidro: 'fume' },
    sala: sala({
      nome: 'Sala de cinema', desc: 'Grafite, painel ripado, TV de 65", sanca de LED e cortina pesada.',
      parede: T('#4d5553', 'Grafite quente'), dest: [['rack', X('ripado')]], piso: 'lam-nogueira', rodape: 'preto7',
      forro: { tipo: 'sanca', drop: 0.12, cor: '#3b403e' }, luz: { temp: 'quente', int: 0.4 },
      sofa: '#2f3e56', sofaTipo: 'sofa4', rack: { tipo: 'racksusp', cor: '#2f2e2c' }, tv: 'tv65', tapete: { cor: '#3b403e' }, mesa: { cor: '#2f2e2c' }, lateral: '#2f2e2c',
      abajur: '#2b2b2b', luminaria: '#c9a05a', quadro: { tipo: 'quadro', cor: '#c9a05a' }, plantas: 1, vaso: '#2f2e2c', cortina: '#2b2b2b', teto: [['spots4', null]], tetoEm: 'tapete',
    }),
    cozinha: cozinha({
      nome: 'Cozinha noturna', desc: 'Frentes pretas, tampo escuro e pendente de cobre.',
      parede: T('#4d5553', 'Grafite quente'), piso: 'cer-grafite', rodape: 'preto7', forro: { tipo: 'gesso', drop: 0.08, cor: '#3b403e' }, luz: { temp: 'quente', int: 0.55 },
      bancada: { tampo: 'preto', armario: 'misto', cor: '#2f2e2c', torneira: '#c9a05a', cuba: 1 },
      geladeira: '#2b2b2b', fogao: '#2b2b2b', mesa: ['#2f2e2c', '#2f3e56'], aereo: { tipo: 'aereo', cor: '#2f2e2c' }, coifa: 'coifa', balcao: [['cafeteira', -0.35, '#c9a05a']],
      pendente: ['pendente3', '#c9a05a'], quadro: { tipo: 'quadro', cor: '#c9a05a' },
    }),
    quarto: [quarto({
      nome: 'Quarto escuro', desc: 'Parede azul-marinho, luz indireta e blackout.',
      parede: T('#2f3e56', 'Azul-marinho'), piso: 'lam-nogueira', rodape: 'preto7', forro: { tipo: 'sanca', drop: 0.10, cor: '#3b403e' }, luz: { temp: 'quente', int: 0.35 },
      cama: ['#c9bfae', '#2f2e2c'], gr: '#2f2e2c', criado: '#2f2e2c', criadoTipo: 'criadosusp', tapete: { cor: '#3b403e' }, abajur: '#c9a05a', arandela: '#c9a05a', cortina: '#2b2b2b',
      quadro: { tipo: 'quadro', cor: '#c9a05a' }, poltrona: '#7d8580',
    })],
    banho: banho({
      nome: 'Banheiro noturno', desc: 'Azulejo grafite, metais dourados e luz quente.',
      parede: T('#4d5553', 'Grafite quente', MEIA('azulejo-grafite', 1.5)), piso: 'cer-grafite', forro: { tipo: 'gesso', drop: 0.08, cor: '#3b403e' }, luz: { temp: 'quente', int: 0.6 },
      fixos: { lavatorio: { modelo: 'apoio', armario: 'gavetas', corArm: '#2f2e2c', torneira: '#c9a05a', cor: '#2b2b2d' }, vaso: { cor: '#2b2b2d', assento: '#2b2b2d' }, box: { vidro: 'fume', perfil: '#c9a05a', metal: '#c9a05a', ducha: 'teto' } },
      toalheiro: 'toalheirotermico', papeleira: 1, armario: { tipo: 'armariobanho', cor: '#2f2e2c' },
    }),
    servico: servico({
      nome: 'Serviço escuro', desc: 'Grafite e inox, prático e discreto.',
      parede: T('#7d8580', 'Grafite claro'), piso: 'cer-grafite', luz: { temp: 'neutra', int: 0.9 }, tanque: { modelo: 'inox', armario: 'portas', torneira: '#222224' },
      maquina: '#b9bcc0', armario: { tipo: 'armservico', cor: '#2f2e2c' }, aereo: '#2f2e2c', cesto: '#2b2b2b',
    }),
  },
  {
    id: 'praiano', nome: 'Praiano', curto: 'Praiano',
    frase: 'Azul névoa, branco, palha e madeira desgastada.',
    desc: 'Azul névoa e branco, listras suaves, vinílico claro, cestos e cortinas de linho. Leve, arejado e com cheiro de maresia.',
    tags: ['azul', 'branco', 'palha', 'leve'], periodo: 'dia',
    pal: { w: '#cfdbe2', m: '#d3b78f', t: '#f1efea', a: '#5d86a1', g: '#39423f' },
    aberturas: { porta: '#f6f4f0', entrada: '#5d86a1', esquadria: '#f2f2f0', macaneta: '#c9ccd0' },
    sala: sala({
      nome: 'Sala praiana', desc: 'Papel listrado azul, sofá claro, tapete de palha e cortina de linho.',
      parede: T('#e9eef0', 'Névoa clara'), dest: [['sofa', X('papel-lista-azul')]], piso: 'lam-claro', rodape: 'branco10',
      forro: { tipo: 'laje', cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.95 },
      sofa: '#f1efea', rack: { cor: '#d3b78f' }, tapete: { cor: '#d9c6a8' }, mesa: { cor: '#d3b78f' }, poltrona: '#5d86a1', puff: '#d3b78f', cesto: '#c9a77c',
      quadro: { tipo: 'quadrotrio', cor: '#5d86a1' }, plantas: 2, vaso: '#f1efea', cortina: '#f1efea', teto: [['globo', '#d3b78f']], luminaria: '#d3b78f',
    }),
    cozinha: cozinha({
      nome: 'Cozinha praiana', desc: 'Azulejo metrô azul, armários brancos e tampo de madeira.',
      parede: X('azulejo-metro'), piso: 'lam-claro', rodape: 'branco7', forro: { tipo: 'laje', cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 1 },
      bancada: { tampo: 'madeira', armario: 'portas', cor: '#f1efea', torneira: '#c9ccd0', cuba: 1 },
      geladeira: '#e9e9e9', fogao: '#e9e9e9', mesa: ['#d3b78f', '#5d86a1'], mesaTipo: 'jantarredonda',
      aereo: { tipo: 'aereo', cor: '#f1efea' }, coifa: 'coifaslim', balcao: [['plantapeq', -0.4, '#f1efea'], ['cafeteira', 0.35, '#e9e9e9']], pendente: ['globo', '#d3b78f'], quadro: { tipo: 'quadro', cor: '#5d86a1' },
    }),
    quarto: [quarto({
      nome: 'Quarto praiano', desc: 'Cabeceira azul névoa, roupa de cama branca e baú de madeira clara.',
      parede: T('#e9eef0', 'Névoa clara'), dest: [['cama', T('#cfdbe2', 'Azul névoa')]], piso: 'lam-claro', rodape: 'branco10', forro: { tipo: 'laje', cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.8 },
      cama: ['#f1efea', '#d3b78f'], gr: '#f1efea', criado: '#d3b78f', tapete: { cor: '#d9c6a8' }, abajur: '#d3b78f', quadro: { tipo: 'quadrotrio', cor: '#5d86a1' }, bau: '#d3b78f',
      poltrona: '#5d86a1', cortina: '#f1efea', planta: { cor: '#f1efea' },
    })],
    banho: banho({
      nome: 'Banheiro praiano', desc: 'Azulejo metrô azul, madeira clara e cortina de box.',
      parede: T('#e9eef0', 'Névoa clara', MEIA('azulejo-azul', 1.5)), piso: 'cer-banho', forro: { tipo: 'laje', cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 1 },
      fixos: { lavatorio: { modelo: 'gabinete', armario: 'portas', corArm: '#d3b78f', torneira: '#c9ccd0', espelho: true }, vaso: { assento: '#f6f5f2' }, box: { modelo: 'cortina' } },
      toalheiro: 'toalheiro', papeleira: 1, cesto: '#d3b78f', planta: '#f1efea',
    }),
    servico: servico({
      nome: 'Serviço praiano', desc: 'Branco e azul névoa, cestos de palha.',
      parede: T('#e9eef0', 'Névoa clara'), piso: 'cer-off', luz: { temp: 'neutra', int: 1 }, tanque: { modelo: 'plastico', cor: '#f6f5f2', torneira: '#c9ccd0' },
      maquina: '#e9e9e9', armario: { tipo: 'armservico', cor: '#f1efea' }, aereo: '#cfdbe2', cesto: '#d3b78f',
    }),
  },
  {
    id: 'rustico', nome: 'Rústico', curto: 'Rústico',
    frase: 'Tijolo aparente, nogueira e luz de lampião.',
    desc: 'Tijolinho aparente, parquê de madeira, móveis de nogueira, mostarda e verde musgo. Detalhes de ferro e luz quente de abajur.',
    tags: ['tijolo', 'nogueira', 'parquê', 'ferro'], periodo: 'tarde',
    pal: { w: '#d8c8b0', m: '#6e4a31', t: '#d1a54a', a: '#b5593d', g: '#2f2e2c' },
    aberturas: { porta: '#6e4a31', entrada: '#6e4a31', esquadria: '#2b2b2d', macaneta: '#8c6b4a' },
    sala: sala({
      nome: 'Sala rústica', desc: 'Tijolinho aparente atrás da TV, parquê e sofá mostarda.',
      parede: T('#d8c8b0', 'Camurça'), dest: [['rack', X('tijolo-terra')]], piso: 'parque', rodape: 'madeira10',
      forro: { tipo: 'gesso', drop: 0.08, cor: '#e8dcc3' }, luz: { temp: 'quente', int: 0.7 },
      sofa: '#d1a54a', rack: { cor: '#6e4a31' }, tapete: { cor: '#b5593d' }, mesa: { cor: '#6e4a31' }, poltrona: '#5b6b4f', abajur: '#e8dcc3', luminaria: '#2f2e2c',
      quadro: { tipo: 'quadro', cor: '#6e4a31' }, plantas: 1, vaso: '#6e4a31', cesto: '#c9a77c', cortina: '#d8c8b0', teto: [['lustrearos', '#2f2e2c']], tetoEm: 'tapete',
      sobreRack: [['cacto', 0.3, '#b5593d']],
    }),
    cozinha: cozinha({
      nome: 'Cozinha rústica', desc: 'Madeira escura, tampo de granito e pendente de ferro.',
      parede: X('tijolo-terra'), piso: 'parque', rodape: 'madeira10', forro: { tipo: 'gesso', drop: 0.08, cor: '#e8dcc3' }, luz: { temp: 'quente', int: 0.75 },
      bancada: { tampo: 'granito', armario: 'misto', cor: '#6e4a31', torneira: '#8c6b4a', cuba: 1 },
      geladeira: '#e8e1d2', fogao: '#2b2b2b', mesa: ['#6e4a31', '#2f2e2c'], mesaTipo: 'jantarbanco',
      aereo: { tipo: 'aereo', cor: '#6e4a31' }, nicho: '#6e4a31', coifa: 'coifa', balcao: [['panelaarroz', -0.35, '#f1efea'], ['cafeteira', 0.35, '#2b2b2b']], pendente: ['pendente', '#2f2e2c'], planta: '#6e4a31',
    }),
    quarto: [quarto({
      nome: 'Quarto rústico', desc: 'Cama de madeira escura, baú aos pés e parede de tijolinho branco.',
      parede: T('#d8c8b0', 'Camurça'), dest: [['cama', X('tijolo-branco')]], piso: 'parque', rodape: 'madeira10', forro: { tipo: 'gesso', drop: 0.08, cor: '#e8dcc3' }, luz: { temp: 'quente', int: 0.55 },
      cama: ['#e8dcc3', '#6e4a31'], gr: '#6e4a31', criado: '#6e4a31', tapete: { cor: '#b5593d' }, abajur: '#e8dcc3', bau: '#6e4a31', poltrona: '#5b6b4f', cortina: '#d8c8b0',
      quadro: { tipo: 'quadro', cor: '#6e4a31' }, planta: { cor: '#6e4a31' },
    })],
    banho: banho({
      nome: 'Banheiro rústico', desc: 'Pastilha verde, madeira escura e metais em bronze.',
      parede: T('#d8c8b0', 'Camurça', MEIA('azulejo-verde', 1.5)), piso: 'cer-banho', forro: { tipo: 'gesso', drop: 0.08, cor: '#e8dcc3' }, luz: { temp: 'quente', int: 0.7 },
      fixos: { lavatorio: { modelo: 'gabinete', armario: 'portas', corArm: '#6e4a31', torneira: '#8c6b4a', espelho: true }, vaso: { assento: '#6e4a31' }, box: { vidro: 'incolor', perfil: '#8c6b4a', metal: '#8c6b4a' } },
      toalheiro: 'toalheiro', papeleira: 1, cesto: '#c9a77c', banquinho: '#6e4a31',
    }),
    servico: servico({
      nome: 'Serviço rústico', desc: 'Madeira escura, tanque de louça e varal.',
      parede: T('#d8c8b0', 'Camurça'), piso: 'cer-bege', luz: { temp: 'neutra', int: 0.95 }, tanque: { modelo: 'ceramica', cor: '#e9dfcc', torneira: '#8c6b4a' },
      maquina: '#e9e9e9', armario: { tipo: 'armservico', cor: '#6e4a31' }, aereo: '#6e4a31', cesto: '#c9a77c',
    }),
  },
];

export const temaPorId = Object.fromEntries(TEMAS.map((t) => [t.id, t]));
