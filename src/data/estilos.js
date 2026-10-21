// Biblioteca de estilos de decoração.
// Cada tema descreve, por tipo de cômodo, acabamentos, luz, trocas nos móveis que já existem e uma composição de
// decoração escrita em regras ("na frente do sofá", "acima da cama", "no canto perto da janela"). Nada aqui usa
// coordenada: o motor (src/presets.js) acha o lugar em cada planta e só aceita o que passa pela auditoria
// (src/harmonia.js). Nomes de cor são livres, sem código de marca. Tela não reproduz tinta: confira no leque físico.

const T = (cor, nome, meia) => ({ t: 'tinta', cor, nome, ...(meia ? { meia } : {}) });
const X = (id) => ({ t: 'tex', id });
const MEIA = (id, alt = 1.5) => ({ alt, t: 'tex', id });
const P = (tipo, onde, props) => [tipo, onde, props || {}];
const op = (o) => ({ ...o, opcional: true });

// ======================================================================== construtores de cômodo
function sala(o) {
  const poe = [];
  if (o.tapete) poe.push(P(o.tapete.tipo || 'tapete', op({ tapete: 'sofa' }), { cor: o.tapete.cor }));
  if (o.mesa) poe.push(P(o.mesa.tipos || ['mesacentro', 'mesaapoio'], { frente: 'sofa', gap: 0.42 }, { cor: o.mesa.cor }));
  if (o.lateral) poe.push(P(['mesalateral', 'mesaapoio'], [{ lado: 'sofa', qual: 'dir', gap: 0.04 }, { lado: 'sofa', qual: 'esq', gap: 0.04 }], { cor: o.lateral }));
  if (o.abajur) poe.push(P('abajur', op({ sobre: 'lateral', tem: 'lateral' }), { cor: o.abajur }));
  if (o.poltrona) poe.push(P(o.poltrona.tipo || 'poltrona', [{ conversa: 'sofa' }, { canto: 'sofa', diag: true, soCanto: true }], { cor: o.poltrona.cor }));
  if (o.puff) poe.push(P('puff', [{ lado: 'mesacentro', alinhar: 'centro', gap: 0.14 }, { canto: 'sofa', soCanto: true }], { cor: o.puff }));
  if (o.luminaria) poe.push(P('luminaria', { canto: 'sofa', gap: 0.08 }, { cor: o.luminaria }));
  if (o.arte) poe.push(P(o.arte.tipo, [{ acima: 'sofa', folga: o.arte.folga ?? 0.24 }, { parede: 'livre' }], { cor: o.arte.cor }));
  if (o.arte2) poe.push(P(o.arte2.tipo, op({ parede: 'livre' }), { cor: o.arte2.cor }));
  for (const [tp, x, cor] of o.sobreRack || []) poe.push(P(tp, op({ sobre: 'rack', x: [x, x * 0.75, x * 0.5] }), cor ? { cor } : {}));
  if (o.estante) poe.push(P(o.estante.tipo, op({ parede: 'perto:rack' }), { cor: o.estante.cor }));
  if (o.prateleira) {
    poe.push(P('prateleira', op({ acima: 'rack', z: 1.75, dx: [0.45, -0.45, 0.6, -0.6] }), { cor: o.prateleira }));
    poe.push(P('plantapeq', op({ sobre: 'prateleira', tem: 'prateleira' }), { cor: o.vaso || '#e8e3da' }));
  }
  if (o.aparador) {
    poe.push(P(o.aparador.tipo || 'aparador', op({ parede: 'livre' }), { cor: o.aparador.cor }));
    if (o.aparador.arte) poe.push(P(o.aparador.arte.tipo, op({ acima: 'aparador', folga: 0.3, tem: 'aparador' }), { cor: o.aparador.arte.cor }));
    for (const [tp, x, cor] of o.aparador.sobre || []) poe.push(P(tp, op({ sobre: 'aparador', x: [x, x * 0.7], tem: 'aparador' }), cor ? { cor } : {}));
  }
  for (const [tp, onde, cor] of o.plantas || []) poe.push(P(tp, op({ canto: onde, gap: 0.05 }), { cor }));
  if (o.cesto) poe.push(P('cesto', op({ canto: 'sofa', gap: 0.05 }), { cor: o.cesto }));
  for (const [tp, cor] of o.teto || []) poe.push(P(tp, [{ teto: 'mesacentro' }, { teto: 'tapete' }, { teto: 'centro' }], cor ? { cor } : {}));
  if (o.extra) poe.push(...o.extra);
  const troca = { sofa: { cor: o.sofa.cor, ...(o.sofa.cor2 ? { cor2: o.sofa.cor2 } : {}), ...(o.sofa.tipo ? { tipo: o.sofa.tipo } : {}) }, rack: { cor: o.rack.cor, ...(o.rack.tipo ? { tipo: o.rack.tipo } : {}) } };
  if (o.tv) troca.tv = { tipo: o.tv };
  return {
    nome: o.nome, desc: o.desc,
    acab: { parede: o.parede, destaque: o.dest || [], piso: o.piso, rodape: o.rodape, teto: o.forro, luz: o.luz },
    troca, poe, cortinas: o.cortina || null,
  };
}

function cozinha(o) {
  const poe = [];
  if (o.passadeira) poe.push(P('tapete', op({ tapete: 'fix:bancada', w: 1.1, d: 0.5 }), { cor: o.passadeira }));
  if (o.coifa) poe.push(P(o.coifa, op({ acima: 'fogao', z: o.coifa === 'coifaslim' ? 1.6 : 1.62, dx: [0] }), {}));
  if (o.aereo) poe.push(P(o.aereo.tipos || ['aereo', 'aereo60'], op({ acima: 'fix:bancada', z: o.aereo.z ?? 1.55, sobra: 0.6, n: 2 }), { cor: o.aereo.cor }));
  if (o.aereo) poe.push(P(o.aereo.tipos || ['aereo', 'aereo60'], op({ acima: 'geladeira', z: 1.95, dx: [0] }), { cor: o.aereo.cor }));
  if (o.nicho) poe.push(P('nichocoz', op({ parede: 'perto:fogao' }), { cor: o.nicho }));
  for (const [tp, x, cor] of o.balcao || []) poe.push(P(tp, op({ sobre: 'fix:bancada', x: [x, x * 0.85] }), cor ? { cor } : {}));
  if (o.topoGeladeira) poe.push(P(o.topoGeladeira[0], op({ sobre: 'geladeira', x: [0.5, -0.5, 0] }), { cor: o.topoGeladeira[1] }));
  if (o.tapeteJantar) poe.push(P(o.tapeteJantar.tipo || 'tapete', op({ tapete: 'jantar' }), { cor: o.tapeteJantar.cor }));
  if (o.pendente) poe.push(P(o.pendente[0], op({ teto: 'jantar' }), o.pendente[1] ? { cor: o.pendente[1] } : {}));
  if (o.luzBancada) poe.push(P(o.luzBancada, op({ teto: 'fix:bancada' }), {}));
  if (o.arte) poe.push(P(o.arte.tipo, op({ parede: 'perto:jantar' }), { cor: o.arte.cor }));
  if (o.relogio) poe.push(P('relogio', op({ parede: 'perto:jantar' }), { cor: o.relogio }));
  if (o.armario) poe.push(P(o.armario.tipo, op({ parede: 'perto:geladeira' }), { cor: o.armario.cor }));
  if (o.carrinho) poe.push(P('carrinho', op({ canto: 'jantar' }), { cor: o.carrinho }));
  if (o.planta) poe.push(P(o.planta[0] || 'plantapeq', op({ canto: 'jantar' }), { cor: o.planta[1] }));
  if (o.extra) poe.push(...o.extra);
  return {
    nome: o.nome, desc: o.desc,
    acab: { parede: o.parede, destaque: o.dest || [], piso: o.piso, rodape: o.rodape, teto: o.forro, luz: o.luz },
    fixos: { bancada: o.bancada },
    troca: { geladeira: { cor: o.geladeira }, fogao: { cor: o.fogao }, jantar: { cor: o.mesa[0], cor2: o.mesa[1], ...(o.mesaTipo ? { tipo: o.mesaTipo } : {}) } },
    poe,
  };
}

function quarto(o) {
  const poe = [];
  if (o.tapete) poe.push(P(o.tapete.tipo || 'tapete', op({ tapete: 'cama' }), { cor: o.tapete.cor }));
  const criado = o.criadoTipo || 'criado';
  poe.push(P(criado, op({ lado: 'cama', gap: 0.04, qual: 'dir' }), { cor: o.criado }));
  if (!o.umCriado) poe.push(P(criado, op({ lado: 'cama', gap: 0.04, qual: 'esq' }), { cor: o.criado }));
  if (o.abajur) poe.push(P(o.abajurTipo || 'abajur', op({ sobre: 'criado', n: 2 }), { cor: o.abajur }));
  if (o.arandela) poe.push(P('arandela', op({ acima: 'criado', z: 1.2, n: 2, dx: [0, 0.05, -0.05] }), { cor: o.arandela }));
  if (o.arte) poe.push(P(o.arte.tipo, [{ acima: 'cama', folga: o.arte.folga ?? 0.26 }, { parede: 'livre' }], { cor: o.arte.cor }));
  if (o.bau) poe.push(P('bau', op({ frente: 'cama', gap: 0.06 }), { cor: o.bau }));
  if (o.comoda) {
    poe.push(P(o.comoda.tipo || 'comoda', op({ parede: 'oposta:cama' }), { cor: o.comoda.cor }));
    if (o.comoda.acima) poe.push(P(o.comoda.acima.tipo, op({ acima: 'comoda', folga: 0.25, tem: 'comoda' }), { cor: o.comoda.acima.cor }));
    for (const [tp, x, cor] of o.comoda.sobre || []) poe.push(P(tp, op({ sobre: 'comoda', x: [x, x * 0.7], tem: 'comoda' }), cor ? { cor } : {}));
  }
  if (o.mesa) {
    poe.push(P('escrivaninha', [{ parede: 'janela' }, { parede: 'livre' }], { cor: o.mesa.cor }));
    poe.push(P('cadeiraesc', op({ frente: 'escrivaninha', gap: 0.03, r: 180, tem: 'escrivaninha' }), { cor: o.mesa.cadeira || '#2b2b2b' }));
    poe.push(P('notebook', op({ sobre: 'escrivaninha', x: [0, -0.3] }), {}));
    poe.push(P('luminariamesa', op({ sobre: 'escrivaninha', x: [0.85, -0.85] }), { cor: o.mesa.luz || '#2b2b2b' }));
    poe.push(P('prateleira', op({ acima: 'escrivaninha', z: 1.45, dx: [0, 0.2, -0.2], tem: 'escrivaninha' }), { cor: o.mesa.cor }));
    poe.push(P('plantapeq', op({ sobre: 'prateleira', tem: 'prateleira', x: [0.6, -0.6] }), { cor: o.mesa.vaso || '#e8e3da' }));
  }
  if (o.poltrona) {
    poe.push(P('poltrona', op({ canto: 'janela', diag: true, soCanto: true }), { cor: o.poltrona }));
    if (o.luminaria) poe.push(P('luminaria', op({ lado: 'poltrona', alinhar: 'fundo', gap: 0.06, tem: 'poltrona' }), { cor: o.luminaria }));
  }
  if (o.espelho) poe.push(P(o.espelho.tipo || 'espelho', op({ parede: 'livre' }), { cor: o.espelho.cor }));
  if (o.estante) poe.push(P(o.estante.tipo, op({ parede: 'livre' }), { cor: o.estante.cor }));
  if (o.planta) poe.push(P(o.planta.tipo || 'plantapeq', op({ canto: 'janela', gap: 0.05 }), { cor: o.planta.cor || '#e8e3da' }));
  for (const [tp, cor] of o.teto || []) poe.push(P(tp, [{ teto: 'centro' }, { teto: 'cama' }], cor ? { cor } : {}));
  if (o.extra) poe.push(...o.extra);
  const troca = {
    cama: { cor: o.cama[0], cor2: o.cama[1], ...(o.camaTipo ? { tipo: o.camaTipo } : {}) },
    gr: { cor: o.gr }, criado: { cor: o.criado, ...(o.criadoTipo ? { tipo: o.criadoTipo } : {}) },
  };
  return {
    nome: o.nome, desc: o.desc,
    acab: { parede: o.parede, destaque: o.dest || [], piso: o.piso, rodape: o.rodape, teto: o.forro, luz: o.luz },
    troca, poe, cortinas: o.cortina || null,
  };
}

function banho(o) {
  const poe = [];
  if (o.tapete) poe.push(P('tapete', op({ tapete: 'fix:box', w: 0.7, d: 0.45 }), { cor: o.tapete }));
  if (o.espelho) poe.push(P(o.espelho.tipo, op({ acima: 'fix:lavatorio', centro: o.espelho.centro ?? 1.55, dx: [0] }), { cor: o.espelho.cor }));
  if (o.toalheiro) poe.push(P(o.toalheiro, [{ parede: 'perto:fix:box' }], {}));
  poe.push(P('papeleira', op({ parede: 'perto:fix:vaso' }), {}));
  if (o.prateleira) poe.push(P('prateleiravidro', op({ acima: 'fix:vaso', z: 1.25, dx: [0] }), {}));
  if (o.cesto) poe.push(P('cestoroupa', op({ canto: 'livre', soCanto: true }), { cor: o.cesto }));
  if (o.banquinho) poe.push(P('banquinho', op({ canto: 'fix:box', soCanto: true }), { cor: o.banquinho }));
  if (o.planta) poe.push(P('plantapeq', op({ canto: 'fix:vaso', soCanto: true }), { cor: o.planta }));
  for (const [tp, cor] of o.teto || [['plafon', null]]) poe.push(P(tp, op({ teto: 'centro' }), cor ? { cor } : {}));
  return {
    nome: o.nome, desc: o.desc,
    acab: { parede: o.parede, piso: o.piso, rodape: o.rodape || 'nenhum', teto: o.forro, luz: o.luz },
    fixos: o.fixos, poe,
  };
}

function servico(o) {
  const poe = [];
  if (o.aereo) poe.push(P('aereoserv', op({ acima: 'lavar', z: 1.6, sobra: 0.3 }), { cor: o.aereo }));
  if (o.armario) poe.push(P(o.armario.tipo, op({ parede: 'perto:lavar' }), { cor: o.armario.cor }));
  if (o.cesto) poe.push(P('cesto2', op({ lado: 'lavar', gap: 0.05 }), { cor: o.cesto }));
  // canto de varanda: só onde sobra espaço (na Meio o serviço é mínimo e fica sem)
  if (o.varanda) {
    poe.push(P(o.varanda.mesa ? 'mesabistro' : 'cadeiravaranda', op({ canto: 'janela', soCanto: false }), { cor: o.varanda.cor, cor2: o.varanda.cor2 }));
    if (!o.varanda.mesa) poe.push(P('cadeiravaranda', op({ lado: 'cadeiravaranda', alinhar: 'fundo', gap: 0.35 }), { cor: o.varanda.cor }));
    poe.push(P('planta', op({ canto: 'livre', soCanto: true }), { cor: o.varanda.vaso || '#b46a4c' }));
    poe.push(P('plantapeq', op({ canto: 'livre', soCanto: true }), { cor: o.varanda.vaso || '#b46a4c' }));
  }
  if (o.planta) poe.push(P('plantapeq', op({ canto: 'lavar', soCanto: true }), { cor: o.planta }));
  poe.push(P(o.luzTeto || 'plafon', op({ teto: 'centro' }), {}));
  return {
    nome: o.nome, desc: o.desc,
    acab: { parede: o.parede, piso: o.piso, rodape: o.rodape || 'nenhum', teto: o.forro, luz: o.luz },
    fixos: { tanque: o.tanque }, troca: { lavar: { cor: o.maquina } }, poe,
  };
}

function circ(o, salaSpec) {
  const poe = [];
  if (o.arte) poe.push(P(o.arte.tipo, op({ parede: 'livre', n: o.arte.n || 1 }), { cor: o.arte.cor }));
  if (o.arandela) poe.push(P('arandela', op({ parede: 'livre', n: 2 }), { cor: o.arandela }));
  poe.push(P(o.luz || 'plafon', op({ teto: 'centro' }), o.luzCor ? { cor: o.luzCor } : {}));
  return { nome: 'Circulação', desc: '', acab: { ...salaSpec.acab, destaque: [] }, poe };
}

function tema(t) {
  t.circ = circ(t.circ || {}, t.sala);
  return t;
}

// ======================================================================== temas
export const TEMAS = [
  tema({
    id: 'aconchegante', nome: 'Intimista e aconchegante', curto: 'Aconchegante',
    frase: 'Madeira, luz quente baixa, linho e plantas.',
    desc: 'Areia e terracota com freijó, forro de gesso e luz quente em baixa intensidade. Ripado atrás da TV, poltrona de conversa, abajur ao lado do sofá e cortinas de linho até o chão. Pensado para a noite.',
    tags: ['luz quente', 'freijó', 'linho', 'plantas'], periodo: 'noite',
    pal: { w: '#e6d5be', m: '#a5774b', t: '#d8cdb9', a: '#b46a4c', g: '#3b2f26' },
    aberturas: { porta: '#e9e1d3', entrada: '#6e4a31', esquadria: '#6b4f3a', macaneta: '#c9a05a' },
    sala: sala({
      nome: 'Sala aconchegante', desc: 'Ripado de freijó atrás da TV, sofá de linho, poltrona terracota, abajur e duas plantas.',
      parede: T('#e6d5be', 'Areia quente'), dest: [['rack', X('ripado-claro')]], piso: 'lam-claro', rodape: 'madeira10',
      forro: { tipo: 'gesso', drop: 0.10, cor: '#efe4d0' }, luz: { temp: 'quente', int: 0.62 },
      sofa: { cor: '#d8cdb9' }, rack: { cor: '#a5774b' }, tapete: { cor: '#cdb89a' }, mesa: { cor: '#a5774b' }, lateral: '#6e4a31', abajur: '#e8dcc3',
      poltrona: { cor: '#b46a4c' }, luminaria: '#3b2f26', arte: { tipo: 'quadrotrio', cor: '#b46a4c' },
      sobreRack: [['vasodeco', -0.7, '#c9a77c'], ['plantapeq', 0.75, '#e8dcc3']], plantas: [['planta', 'janela', '#b46a4c']],
      cesto: '#c9a77c', cortina: '#e8dcc3', teto: [['lustrearos', '#3b2f26']],
    }),
    cozinha: cozinha({
      nome: 'Cozinha aconchegante', desc: 'Tampo de madeira, armários em freijó, torneira dourada, pendentes de cobre e ervas no balcão.',
      parede: T('#ecdcc4', 'Creme'), piso: 'hex-bege', rodape: 'branco7', forro: { tipo: 'gesso', drop: 0.10, cor: '#efe4d0' }, luz: { temp: 'quente', int: 0.72 },
      bancada: { tampo: 'madeira', armario: 'misto', cor: '#a5774b', torneira: '#c9a05a', cuba: 1 },
      geladeira: '#e8e1d2', fogao: '#e8e1d2', mesa: ['#a5774b', '#6e4a31'], mesaTipo: ['jantarredonda', 'jantar4'],
      aereo: { cor: '#e9e1d3' }, coifa: 'coifa', balcao: [['cafeteira', 0.9, '#2b2b2b'], ['plantapeq', -0.9, '#e8dcc3']],
      passadeira: '#b46a4c', pendente: ['pendente3', '#c9a05a'], arte: { tipo: 'quadro', cor: '#b46a4c' }, planta: ['planta', '#b46a4c'],
    }),
    quarto: [quarto({
      nome: 'Quarto aconchegante', desc: 'Parede terracota na cabeceira, arandelas, abajures, tapete macio e poltrona de leitura.',
      parede: T('#e9d8c3', 'Areia'), dest: [['cama', T('#c47a5a', 'Terracota')]], piso: 'lam-original', rodape: 'madeira10',
      forro: { tipo: 'gesso', drop: 0.10, cor: '#efe4d0' }, luz: { temp: 'quente', int: 0.55 },
      cama: ['#efe6d6', '#a5774b'], gr: '#c9a77c', criado: '#a5774b', tapete: { cor: '#cdb89a' }, abajur: '#e8dcc3', arandela: '#3b2f26',
      arte: { tipo: 'quadrotrio', cor: '#e8e3da' }, bau: '#a5774b', poltrona: '#b46a4c', luminaria: '#3b2f26', cortina: '#e8dcc3',
      planta: { tipo: 'planta', cor: '#b46a4c' }, teto: [['plafon', null]],
    }), quarto({
      nome: 'Quarto 2 aconchegante', desc: 'Cama clara, mesa de trabalho junto à janela, prateleira com planta e luz quente.',
      parede: T('#e9d8c3', 'Areia'), dest: [['cama', T('#d8b79b', 'Argila clara')]], piso: 'lam-original', rodape: 'madeira10',
      forro: { tipo: 'gesso', drop: 0.10, cor: '#efe4d0' }, luz: { temp: 'quente', int: 0.6 },
      cama: ['#efe6d6', '#a5774b'], gr: '#c9a77c', criado: '#a5774b', umCriado: true, abajur: '#e8dcc3', tapete: { cor: '#cdb89a' },
      arte: { tipo: 'quadro', cor: '#b46a4c' }, mesa: { cor: '#a5774b', cadeira: '#6e4a31', luz: '#3b2f26' }, cortina: '#e8dcc3', teto: [['plafon', null]],
    })],
    banho: banho({
      nome: 'Banheiro aconchegante', desc: 'Azulejo metrô até meia altura, gabinete de madeira, metais dourados e espelho redondo.',
      parede: T('#e6d9c5', 'Areia', MEIA('azulejo-metro', 1.5)), piso: 'hex-bege', forro: { tipo: 'gesso', drop: 0.08, cor: '#efe4d0' }, luz: { temp: 'quente', int: 0.7 },
      fixos: { lavatorio: { modelo: 'gabinete', armario: 'gavetas', corArm: '#a5774b', torneira: '#c9a05a', espelho: false }, vaso: { assento: '#a5774b' }, box: { vidro: 'incolor', perfil: '#c9a05a', metal: '#c9a05a' } },
      espelho: { tipo: 'espelhoredondo', cor: '#c9a05a' }, toalheiro: 'toalheiro', tapete: '#cdb89a', cesto: '#c9a77c', planta: '#e8dcc3',
    }),
    servico: servico({
      nome: 'Serviço aconchegante', desc: 'Armário de madeira clara, cestos e, onde cabe, um canto de varanda com poltronas.',
      parede: T('#ecdcc4', 'Creme'), piso: 'cer-bege', luz: { temp: 'quente', int: 0.85 }, tanque: { modelo: 'ceramica', cor: '#f6f5f2', torneira: '#c9a05a' },
      maquina: '#e9e9e9', armario: { tipo: 'armservico', cor: '#c9a77c' }, aereo: '#c9a77c', cesto: '#c9a77c',
      varanda: { cor: '#b46a4c', vaso: '#b46a4c' },
    }),
    circ: { arte: { tipo: 'quadro', cor: '#b46a4c' } },
  }),
  tema({
    id: 'minimalista', nome: 'Minimalista', curto: 'Minimalista',
    frase: 'Poucas peças, superfícies lisas e luz neutra.',
    desc: 'Branco gelo e cinza muito claro, porcelanato polido, rodapé embutido e móveis suspensos. A decoração se resume a um quadro grande, uma planta escultural e spots de luz neutra.',
    tags: ['branco', 'suspenso', 'vazio', 'luz neutra'], periodo: 'dia',
    pal: { w: '#f4f2ee', m: '#f1efea', t: '#e2ddd2', a: '#2b2b2b', g: '#2b2b2b' },
    aberturas: { porta: '#f6f4f0', entrada: '#f6f4f0', esquadria: '#f2f2f0', macaneta: '#c9ccd0' },
    sala: sala({
      nome: 'Sala minimalista', desc: 'Rack suspenso branco, sofá off-white, um quadro grande e uma planta escultural.',
      parede: T('#f4f2ee', 'Branco gelo'), piso: 'cer-off', rodape: 'nenhum', forro: { tipo: 'gesso', drop: 0.06, cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 1 },
      sofa: { cor: '#e8e3da' }, rack: { tipo: 'racksusp', cor: '#f1efea' }, mesa: { cor: '#f1efea', tipos: ['mesaapoio'] },
      arte: { tipo: 'quadrogrande', cor: '#2b2b2b' }, plantas: [['planta', 'janela', '#f1efea']], cortina: '#f4f2ee', teto: [['spots4', null]],
    }),
    cozinha: cozinha({
      nome: 'Cozinha minimalista', desc: 'Tudo branco, tampo branco, aéreo sem puxador e um pendente único sobre a mesa.',
      parede: T('#f4f2ee', 'Branco gelo'), piso: 'cer-off', rodape: 'nenhum', forro: { tipo: 'gesso', drop: 0.06, cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 1 },
      bancada: { tampo: 'branco', armario: 'portas', cor: '#f1efea', torneira: '#c9ccd0', cuba: 1 },
      geladeira: '#e9e9e9', fogao: '#e9e9e9', mesa: ['#f1efea', '#f1efea'], mesaTipo: 'jantar2',
      aereo: { cor: '#f1efea' }, coifa: 'coifaslim', pendente: ['pendente', '#f1efea'],
    }),
    quarto: [quarto({
      nome: 'Quarto minimalista', desc: 'Cama baixa, criados suspensos, parede lisa e um único quadro.',
      parede: T('#f1efeb', 'Branco gelo'), piso: 'lam-cinza', rodape: 'nenhum', forro: { tipo: 'gesso', drop: 0.06, cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.9 },
      cama: ['#e8e3da', '#e8e3da'], gr: '#f1efea', criado: '#f1efea', criadoTipo: 'criadosusp', abajur: '#f1efea', cortina: '#f1efea',
      arte: { tipo: 'quadrogrande', cor: '#2b2b2b' }, teto: [['plafon', null]],
    }), quarto({
      nome: 'Quarto 2 minimalista', desc: 'Mesa branca junto à janela, cadeira preta e nada além do necessário.',
      parede: T('#f1efeb', 'Branco gelo'), piso: 'lam-cinza', rodape: 'nenhum', forro: { tipo: 'gesso', drop: 0.06, cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 1 },
      cama: ['#e8e3da', '#e8e3da'], gr: '#f1efea', criado: '#f1efea', criadoTipo: 'criadosusp', umCriado: true,
      mesa: { cor: '#f1efea', cadeira: '#2b2b2b', luz: '#2b2b2b', vaso: '#f1efea' }, cortina: '#f1efea', teto: [['plafon', null]],
    })],
    banho: banho({
      nome: 'Banheiro minimalista', desc: 'Branco total, vidro fixo incolor, louça suspensa e metais cromados.',
      parede: T('#f4f2ee', 'Branco gelo', MEIA('azulejo-branco', 1.5)), piso: 'cer-off', forro: { tipo: 'laje', cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 1 },
      fixos: { lavatorio: { modelo: 'suspenso', torneira: '#c9ccd0', espelho: false }, vaso: { modelo: 'suspensa' }, box: { modelo: 'fixo', vidro: 'incolor', perfil: '#b9bcc0' } },
      espelho: { tipo: 'armariobanho', cor: '#f1efea', centro: 1.6 }, toalheiro: 'toalheirotermico',
    }),
    servico: servico({
      nome: 'Serviço minimalista', desc: 'Armário branco fechado e superfícies livres.',
      parede: T('#f4f2ee', 'Branco gelo'), piso: 'cer-off', luz: { temp: 'neutra', int: 1 }, tanque: { modelo: 'ceramica', cor: '#f6f5f2', torneira: '#c9ccd0' },
      maquina: '#e9e9e9', armario: { tipo: 'vassoureiro', cor: '#f1efea' }, aereo: '#f1efea',
    }),
    circ: { luz: 'spot' },
  }),
  tema({
    id: 'contemporaneo', nome: 'Contemporâneo', curto: 'Contemporâneo',
    frase: 'Greige, nogueira, preto fosco e sanca de LED.',
    desc: 'Paredes greige, ripado de nogueira atrás da TV, porcelanato cinza, sanca com LED e detalhes em preto fosco. Sofá grafite, poltrona mostarda e cozinha grafite com pendente de cúpula.',
    tags: ['greige', 'ripado', 'preto fosco', 'sanca LED'], periodo: 'tarde',
    pal: { w: '#d9d3c8', m: '#6e4a31', t: '#6f6a64', a: '#d1a54a', g: '#2b2b2b' },
    aberturas: { porta: '#e9e1d3', entrada: '#2f2e2c', esquadria: '#2b2b2d', macaneta: '#222224' },
    sala: sala({
      nome: 'Sala contemporânea', desc: 'Ripado de nogueira atrás da TV de 65", sanca de LED, sofá grafite e poltrona mostarda.',
      parede: T('#d9d3c8', 'Greige'), dest: [['rack', X('ripado')]], piso: 'cer-cinza', rodape: 'preto7',
      forro: { tipo: 'sanca', drop: 0.12, cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.85 },
      sofa: { cor: '#6f6a64' }, rack: { tipo: 'racksusp', cor: '#6e4a31' }, tv: 'tv65', tapete: { cor: '#b9b4a9' }, mesa: { cor: '#2f2e2c' },
      poltrona: { cor: '#d1a54a' }, luminaria: '#2b2b2b', arte: { tipo: 'quadrogrande', cor: '#4f6b5a' },
      sobreRack: [['vasodeco', 0.75, '#2f2e2c']], plantas: [['planta', 'janela', '#2f2e2c']], cortina: '#d8d3c9', teto: [['trilho', null]],
    }),
    cozinha: cozinha({
      nome: 'Cozinha contemporânea', desc: 'Armários grafite com gavetas, tampo preto, aéreo basculante e pendente de cúpula preta.',
      parede: T('#d9d3c8', 'Greige'), piso: 'cer-cinza', rodape: 'preto7', forro: { tipo: 'sanca', drop: 0.10, cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.9 },
      bancada: { tampo: 'preto', armario: 'gavetas', cor: '#2f2e2c', torneira: '#222224', cuba: 1 },
      geladeira: '#b9bcc0', fogao: '#2b2b2b', mesa: ['#2f2e2c', '#6e4a31'], mesaTipo: ['jantarbanco', 'jantar4'],
      aereo: { tipos: ['aereoflap', 'aereo60'], cor: '#2f2e2c', z: 1.7 }, coifa: 'coifaslim', balcao: [['cafeteira', 0.9, '#2b2b2b'], ['torradeira', -0.9, '#b9bcc0']],
      pendente: ['pendente', '#2b2b2b'], arte: { tipo: 'quadrogrande', cor: '#d1a54a' }, passadeira: '#6f6a64',
    }),
    quarto: [quarto({
      nome: 'Quarto contemporâneo', desc: 'Ripado de nogueira na cabeceira, criados suspensos, arandelas pretas e luz indireta.',
      parede: T('#d9d3c8', 'Greige'), dest: [['cama', X('ripado')]], piso: 'lam-cinza', rodape: 'preto7', forro: { tipo: 'sanca', drop: 0.10, cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.7 },
      cama: ['#6f6a64', '#6e4a31'], gr: '#6e4a31', criado: '#2f2e2c', criadoTipo: 'criadosusp', tapete: { cor: '#b9b4a9' }, arandela: '#2b2b2b', cortina: '#bdb6a9',
      poltrona: '#d1a54a', luminaria: '#2b2b2b', planta: { cor: '#2f2e2c' }, teto: [['plafonq', null]],
    }), quarto({
      nome: 'Quarto 2 contemporâneo', desc: 'Mesa de nogueira, cadeira preta, prateleira e cabeceira greige.',
      parede: T('#d9d3c8', 'Greige'), piso: 'lam-cinza', rodape: 'preto7', forro: { tipo: 'gesso', drop: 0.08, cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.9 },
      cama: ['#6f6a64', '#6e4a31'], gr: '#6e4a31', criado: '#2f2e2c', criadoTipo: 'criadosusp', umCriado: true, camaTipo: 'camasolteiro', tapete: { cor: '#b9b4a9' },
      mesa: { cor: '#6e4a31', cadeira: '#2b2b2b', luz: '#2b2b2b' }, arte: { tipo: 'quadro', cor: '#d1a54a' }, cortina: '#bdb6a9', teto: [['plafonq', null]],
    })],
    banho: banho({
      nome: 'Banheiro contemporâneo', desc: 'Azulejo grafite, cuba de apoio sobre gabinete de nogueira, vidro fumê e metais pretos.',
      parede: T('#d9d3c8', 'Greige', MEIA('azulejo-grafite', 1.5)), piso: 'cer-grafite', forro: { tipo: 'gesso', drop: 0.08, cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.9 },
      fixos: { lavatorio: { modelo: 'apoio', armario: 'gavetas', corArm: '#6e4a31', torneira: '#222224', cor: '#f6f5f2', espelho: false }, vaso: { cor: '#f6f5f2', assento: '#2b2b2d' }, box: { vidro: 'fume', perfil: '#1c1c1e', metal: '#222224', ducha: 'teto' } },
      espelho: { tipo: 'espelhoredondo', cor: '#2b2b2b' }, toalheiro: 'toalheirotermico', tapete: '#6f6a64',
    }),
    servico: servico({
      nome: 'Serviço contemporâneo', desc: 'Tanque com bancada de granito, armários grafite e mesa bistrô onde há espaço.',
      parede: T('#d9d3c8', 'Greige'), piso: 'cer-grafite', luz: { temp: 'neutra', int: 1 }, tanque: { modelo: 'granito', armario: 'portas', torneira: '#222224' },
      maquina: '#b9bcc0', armario: { tipo: 'armservico', cor: '#2f2e2c' }, aereo: '#2f2e2c', cesto: '#2f2e2c',
      varanda: { mesa: true, cor: '#2f2e2c', cor2: '#2f2e2c', vaso: '#2f2e2c' },
    }),
    circ: { arte: { tipo: 'quadrogrande', cor: '#d1a54a' }, luz: 'spot' },
  }),
  tema({
    id: 'industrial', nome: 'Industrial', curto: 'Industrial',
    frase: 'Cimento, tijolinho, metal preto e couro.',
    desc: 'Cimento queimado no piso, tijolinho na parede do sofá, laje aparente, trilho de spots, esquadrias pretas e móveis de metal e madeira escura. Sofá de couro caramelo e cozinha com azulejo metrô.',
    tags: ['cimento', 'tijolinho', 'metal preto', 'loft'], periodo: 'noite',
    pal: { w: '#b9bdbb', m: '#2f2e2c', t: '#7a4b2e', a: '#c47a5a', g: '#2b2b2b' },
    aberturas: { porta: '#2f2e2c', entrada: '#2f2e2c', esquadria: '#2b2b2d', macaneta: '#222224' },
    sala: sala({
      nome: 'Sala industrial', desc: 'Tijolinho atrás do sofá de couro, cimento no piso, trilho de spots e estante de metal.',
      parede: T('#b9bdbb', 'Cinza concreto'), dest: [['sofa', X('tijolo-branco')]], piso: 'cimento', rodape: 'preto7',
      forro: { tipo: 'laje', cor: '#dad8d2' }, luz: { temp: 'neutra', int: 0.8 },
      sofa: { cor: '#7a4b2e' }, rack: { cor: '#2f2e2c' }, tapete: { cor: '#555a58' }, mesa: { cor: '#2f2e2c' }, lateral: '#2f2e2c',
      luminaria: '#2b2b2b', arte: { tipo: 'quadrogrande', cor: '#c47a5a' }, estante: { tipo: 'estante', cor: '#2f2e2c' },
      sobreRack: [['vasodeco', 0.75, '#2b2b2b']], plantas: [['planta', 'janela', '#2b2b2b']], cortina: '#7d8580', teto: [['trilho', null]],
    }),
    cozinha: cozinha({
      nome: 'Cozinha industrial', desc: 'Azulejo metrô branco, armários pretos, tampo de concreto, mesa alta com banquetas e pendente de metal.',
      parede: X('azulejo-metro'), piso: 'cimento', rodape: 'preto7', forro: { tipo: 'laje', cor: '#dad8d2' }, luz: { temp: 'neutra', int: 0.95 },
      bancada: { tampo: 'concreto', armario: 'misto', cor: '#2f2e2c', torneira: '#222224', cuba: 1 },
      geladeira: '#b9bcc0', fogao: '#2b2b2b', mesa: ['#6e4a31', '#2b2b2b'], mesaTipo: ['mesaalta', 'jantar4'],
      aereo: { tipos: ['aereovidro', 'aereo60'], cor: '#2f2e2c' }, coifa: 'coifa', balcao: [['cafeteira', 0.9, '#2b2b2b'], ['liquidificador', -0.9, '#b9bcc0']],
      pendente: ['pendente', '#2b2b2b'], relogio: '#2b2b2b', passadeira: '#555a58',
    }),
    quarto: [quarto({
      nome: 'Quarto industrial', desc: 'Parede de cimento, cama grafite, arandelas pretas e cortina cinza.',
      parede: X('cimento-parede'), piso: 'lam-nogueira', rodape: 'preto7', forro: { tipo: 'laje', cor: '#dad8d2' }, luz: { temp: 'quente', int: 0.6 },
      cama: ['#7d8580', '#2f2e2c'], gr: '#2f2e2c', criado: '#2f2e2c', tapete: { cor: '#555a58' }, abajur: '#2b2b2b', arandela: '#2b2b2b', cortina: '#7d8580',
      arte: { tipo: 'quadro', cor: '#c47a5a' }, poltrona: '#7a4b2e', planta: { cor: '#2b2b2b' }, teto: [['pendente', '#2b2b2b']],
    }), quarto({
      nome: 'Quarto 2 industrial', desc: 'Mesa de madeira escura, cadeira preta, prateleira de metal e luminária de mesa.',
      parede: X('cimento-parede'), piso: 'lam-nogueira', rodape: 'preto7', forro: { tipo: 'laje', cor: '#dad8d2' }, luz: { temp: 'neutra', int: 0.8 },
      cama: ['#7d8580', '#2f2e2c'], gr: '#2f2e2c', criado: '#2f2e2c', umCriado: true, camaTipo: 'camasolteiro', mesa: { cor: '#6e4a31', cadeira: '#2b2b2b', luz: '#2b2b2b', vaso: '#2b2b2b' },
      arte: { tipo: 'quadro', cor: '#c47a5a' }, cortina: '#7d8580', teto: [['plafon', null]],
    })],
    banho: banho({
      nome: 'Banheiro industrial', desc: 'Azulejo grafite, cimento no piso, cuba de apoio e metais pretos.',
      parede: T('#b9bdbb', 'Cinza concreto', MEIA('azulejo-grafite', 1.5)), piso: 'cimento', forro: { tipo: 'laje', cor: '#dad8d2' }, luz: { temp: 'neutra', int: 0.9 },
      fixos: { lavatorio: { modelo: 'apoio', armario: 'portas', corArm: '#2f2e2c', torneira: '#222224', espelho: false }, vaso: { assento: '#2b2b2d' }, box: { vidro: 'fume', perfil: '#1c1c1e', metal: '#222224' } },
      espelho: { tipo: 'espelho', cor: '#2b2b2b', centro: 1.45 }, toalheiro: 'toalheiro', cesto: '#2b2b2b',
    }),
    servico: servico({
      nome: 'Serviço industrial', desc: 'Tanque de inox em bancada, armário preto e mesa bistrô de metal.',
      parede: X('cimento-parede'), piso: 'cimento', luz: { temp: 'neutra', int: 1 }, tanque: { modelo: 'inox', armario: 'portas', torneira: '#222224' },
      maquina: '#b9bcc0', armario: { tipo: 'armservico', cor: '#2f2e2c' }, aereo: '#2f2e2c', cesto: '#2b2b2b',
      varanda: { mesa: true, cor: '#2b2b2b', cor2: '#2b2b2b', vaso: '#2b2b2b' },
    }),
    circ: { arte: { tipo: 'quadro', cor: '#c47a5a', n: 2 } },
  }),
  tema({
    id: 'escandinavo', nome: 'Escandinavo', curto: 'Escandinavo',
    frase: 'Branco, carvalho claro e verde sálvia.',
    desc: 'Paredes brancas, sálvia atrás do sofá, laminado claro, carvalho com pés finos, tapete grande e muita planta. Globos de luz, mesa redonda e cortinas brancas leves.',
    tags: ['carvalho', 'sálvia', 'plantas', 'hygge'], periodo: 'dia',
    pal: { w: '#fbfaf7', m: '#c9a77c', t: '#c9bfae', a: '#9fae98', g: '#39423f' },
    aberturas: { porta: '#f6f4f0', entrada: '#c9a77c', esquadria: '#f2f2f0', macaneta: '#c9ccd0' },
    sala: sala({
      nome: 'Sala escandinava', desc: 'Sálvia atrás do sofá, carvalho claro, poltrona azul-névoa, abajur e plantas.',
      parede: T('#fbfaf7', 'Branco neve'), dest: [['sofa', T('#b8c4b0', 'Verde sálvia')]], piso: 'lam-claro', rodape: 'branco10',
      forro: { tipo: 'laje', cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.9 },
      sofa: { cor: '#c9bfae' }, rack: { cor: '#c9a77c' }, tapete: { cor: '#e8e3da' }, mesa: { cor: '#c9a77c' }, lateral: '#c9a77c', abajur: '#f1efea',
      poltrona: { cor: '#cfdbe2' }, arte: { tipo: 'quadrotrio', cor: '#8c9a6b' }, prateleira: '#c9a77c', vaso: '#f1efea',
      sobreRack: [['vasodeco', 0.75, '#f1efea']], plantas: [['planta', 'janela', '#f1efea'], ['plantapeq', 'sofa', '#f1efea']], cortina: '#f6f4f0', teto: [['globo', '#f1efea']],
    }),
    cozinha: cozinha({
      nome: 'Cozinha escandinava', desc: 'Frentes brancas, tampo de madeira, mesa redonda clara e globo de luz.',
      parede: T('#fbfaf7', 'Branco neve'), piso: 'lam-claro', rodape: 'branco7', forro: { tipo: 'laje', cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.95 },
      bancada: { tampo: 'madeira', armario: 'portas', cor: '#f1efea', torneira: '#c9ccd0', cuba: 1 },
      geladeira: '#e9e9e9', fogao: '#e9e9e9', mesa: ['#f1efea', '#c9a77c'], mesaTipo: ['jantarredonda', 'jantar4'],
      aereo: { cor: '#f1efea' }, nicho: '#c9a77c', coifa: 'coifaslim', balcao: [['cafeteira', 0.9, '#f1efea'], ['plantapeq', -0.9, '#f1efea']],
      pendente: ['globo', '#f1efea'], arte: { tipo: 'quadro', cor: '#8c9a6b' }, planta: ['plantapeq', '#f1efea'], passadeira: '#e8e3da',
    }),
    quarto: [quarto({
      nome: 'Quarto escandinavo', desc: 'Sálvia na cabeceira, roupa de cama neutra, carvalho e tapete claro.',
      parede: T('#fbfaf7', 'Branco neve'), dest: [['cama', T('#b8c4b0', 'Verde sálvia')]], piso: 'lam-claro', rodape: 'branco10', forro: { tipo: 'laje', cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.75 },
      cama: ['#f1efea', '#c9a77c'], gr: '#f1efea', criado: '#c9a77c', tapete: { cor: '#e8e3da' }, abajur: '#f1efea', arte: { tipo: 'quadrogrande', cor: '#8c9a6b' },
      poltrona: '#cfdbe2', cortina: '#f6f4f0', planta: { tipo: 'planta', cor: '#f1efea' }, teto: [['globo', '#f1efea']],
    }), quarto({
      nome: 'Quarto 2 escandinavo', desc: 'Cama clara, tapete redondo, mesa de estudo e prateleira com planta.',
      parede: T('#fbfaf7', 'Branco neve'), dest: [['cama', T('#cfdbe2', 'Azul névoa')]], piso: 'lam-claro', rodape: 'branco10', forro: { tipo: 'laje', cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.85 },
      cama: ['#f1efea', '#c9a77c'], gr: '#f1efea', criado: '#c9a77c', umCriado: true, camaTipo: 'camasolteiro', tapete: { tipo: 'tapeteredondo', cor: '#e8e3da' }, abajur: '#f1efea',
      mesa: { cor: '#f1efea', cadeira: '#c9a77c', luz: '#f1efea' }, arte: { tipo: 'quadrotrio', cor: '#cfdbe2' }, cortina: '#f6f4f0', teto: [['globo', '#f1efea']],
    })],
    banho: banho({
      nome: 'Banheiro escandinavo', desc: 'Azulejo metrô branco, gabinete de carvalho, espelho redondo e planta.',
      parede: T('#fbfaf7', 'Branco neve', MEIA('azulejo-metro', 1.5)), piso: 'cer-banho', forro: { tipo: 'laje', cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.95 },
      fixos: { lavatorio: { modelo: 'gabinete', armario: 'gavetas', corArm: '#c9a77c', torneira: '#c9ccd0', espelho: false }, vaso: { assento: '#a5774b' }, box: { vidro: 'incolor', perfil: '#b9bcc0' } },
      espelho: { tipo: 'espelhoredondo', cor: '#c9a77c' }, toalheiro: 'toalheiro', tapete: '#e8e3da', cesto: '#c9a77c', planta: '#f1efea',
    }),
    servico: servico({
      nome: 'Serviço escandinavo', desc: 'Branco, carvalho claro, cestos e poltronas de varanda onde há espaço.',
      parede: T('#fbfaf7', 'Branco neve'), piso: 'cer-off', luz: { temp: 'neutra', int: 1 }, tanque: { modelo: 'ceramica', cor: '#f6f5f2', torneira: '#c9ccd0' },
      maquina: '#e9e9e9', armario: { tipo: 'armservico', cor: '#c9a77c' }, aereo: '#f1efea', cesto: '#c9a77c', varanda: { cor: '#e8e3da', vaso: '#f1efea' },
    }),
    circ: { arte: { tipo: 'quadrotrio', cor: '#8c9a6b' }, luz: 'globo', luzCor: '#f1efea' },
  }),
  tema({
    id: 'sofisticado', nome: 'Sofisticado', curto: 'Sofisticado',
    frase: 'Mármore, azul-marinho, latão e luz em camadas.',
    desc: 'Mármore no piso, azul-marinho atrás do sofá, sanca de LED, lustre e metais em latão. Nogueira, linho cru e espelhos, num tom de hotel boutique.',
    tags: ['mármore', 'azul-marinho', 'latão', 'sanca LED'], periodo: 'noite',
    pal: { w: '#e9e4da', m: '#6e4a31', t: '#c9bfae', a: '#2f3e56', g: '#c9a05a' },
    aberturas: { porta: '#f6f4f0', entrada: '#6e4a31', esquadria: '#6b4f3a', macaneta: '#c9a05a' },
    sala: sala({
      nome: 'Sala sofisticada', desc: 'Azul-marinho atrás do sofá, mármore, sanca, lustre de aros, aparador de nogueira com espelho.',
      parede: T('#e9e4da', 'Off-white'), dest: [['sofa', T('#2f3e56', 'Azul-marinho')]], piso: 'marmore', rodape: 'branco15',
      forro: { tipo: 'sanca', drop: 0.12, cor: '#f7f6f3' }, luz: { temp: 'quente', int: 0.75 },
      sofa: { cor: '#c9bfae' }, rack: { cor: '#6e4a31' }, tv: 'tv55', tapete: { cor: '#d8cdb9' }, mesa: { cor: '#6e4a31' }, lateral: '#c9a05a', abajur: '#e8e3da',
      poltrona: { cor: '#d1a54a' }, arte: { tipo: 'quadrogrande', cor: '#c9a05a' },
      aparador: { tipo: 'aparador', cor: '#6e4a31', arte: { tipo: 'espelhoredondo', cor: '#c9a05a' }, sobre: [['vasodeco', 0.6, '#c9a05a'], ['abajur', -0.6, '#e8e3da']] },
      sobreRack: [['vasodeco', 0.75, '#2f3e56']], cortina: '#d8cdb9', teto: [['lustrearos', '#c9a05a']],
    }),
    cozinha: cozinha({
      nome: 'Cozinha sofisticada', desc: 'Frentes azul-petróleo, tampo branco, metais em latão, aéreo de vidro e pendentes trio.',
      parede: T('#e9e4da', 'Off-white'), piso: 'marmore', rodape: 'branco10', forro: { tipo: 'sanca', drop: 0.10, cor: '#f7f6f3' }, luz: { temp: 'quente', int: 0.8 },
      bancada: { tampo: 'branco', armario: 'misto', cor: '#3f5f6b', torneira: '#c9a05a', cuba: 1 },
      geladeira: '#b9bcc0', fogao: '#2b2b2b', mesa: ['#6e4a31', '#3f5f6b'], mesaTipo: ['jantaroval', 'jantarredonda', 'jantar4'],
      aereo: { tipos: ['aereovidro', 'aereo60'], cor: '#3f5f6b' }, coifa: 'coifa', balcao: [['cafeteira', 0.9, '#2b2b2b']],
      pendente: ['pendente3', '#c9a05a'], arte: { tipo: 'quadrogrande', cor: '#c9a05a' }, tapeteJantar: { cor: '#d8cdb9' },
    }),
    quarto: [quarto({
      nome: 'Quarto sofisticado', desc: 'Azul-marinho na cabeceira, arandelas de latão, cômoda com espelho e cortina pesada.',
      parede: T('#e9e4da', 'Off-white'), dest: [['cama', T('#2f3e56', 'Azul-marinho')]], piso: 'parque', rodape: 'branco15', forro: { tipo: 'sanca', drop: 0.10, cor: '#f7f6f3' }, luz: { temp: 'quente', int: 0.55 },
      cama: ['#e8e3da', '#6e4a31'], camaTipo: 'camaqueen', gr: '#6e4a31', criado: '#6e4a31', tapete: { cor: '#d8cdb9' }, abajur: '#e8e3da', arandela: '#c9a05a',
      arte: { tipo: 'quadrogrande', cor: '#c9a05a' }, comoda: { tipo: 'comoda', cor: '#6e4a31', acima: { tipo: 'espelhoredondo', cor: '#c9a05a' }, sobre: [['vasodeco', 0.6, '#c9a05a']] },
      cortina: '#d8cdb9', teto: [['lustre', '#c9a05a']],
    }), quarto({
      nome: 'Quarto 2 sofisticado', desc: 'Cabeceira marinho, cômoda de nogueira e luz quente baixa.',
      parede: T('#e9e4da', 'Off-white'), dest: [['cama', T('#2f3e56', 'Azul-marinho')]], piso: 'parque', rodape: 'branco15', forro: { tipo: 'gesso', drop: 0.10, cor: '#f7f6f3' }, luz: { temp: 'quente', int: 0.6 },
      cama: ['#e8e3da', '#6e4a31'], gr: '#6e4a31', criado: '#6e4a31', umCriado: true, abajur: '#e8e3da', arte: { tipo: 'quadro', cor: '#c9a05a' },
      comoda: { tipo: 'comoda', cor: '#6e4a31', sobre: [['vasodeco', 0.6, '#c9a05a']] }, cortina: '#d8cdb9', teto: [['plafon', null]],
    })],
    banho: banho({
      nome: 'Banheiro sofisticado', desc: 'Mármore no piso, gabinete petróleo, vidro fumê, latão e espelheira.',
      parede: T('#e9e4da', 'Off-white', MEIA('azulejo-branco', 1.5)), piso: 'marmore', forro: { tipo: 'gesso', drop: 0.08, cor: '#f7f6f3' }, luz: { temp: 'quente', int: 0.8 },
      fixos: { lavatorio: { modelo: 'gabinete', armario: 'gavetas', corArm: '#3f5f6b', torneira: '#c9a05a', espelho: false }, vaso: { assento: '#f6f5f2' }, box: { vidro: 'fume', perfil: '#c9a05a', metal: '#c9a05a', ducha: 'teto' } },
      espelho: { tipo: 'espelhoredondo', cor: '#c9a05a' }, toalheiro: 'toalheirotermico', prateleira: true, tapete: '#d8cdb9', cesto: '#c9a77c',
    }),
    servico: servico({
      nome: 'Serviço sofisticado', desc: 'Armários fechados em petróleo, tanque de granito e poltronas de varanda.',
      parede: T('#e9e4da', 'Off-white'), piso: 'cer-cinza', luz: { temp: 'neutra', int: 1 }, tanque: { modelo: 'granito', armario: 'portas', torneira: '#c9a05a' },
      maquina: '#b9bcc0', armario: { tipo: 'armservico', cor: '#3f5f6b' }, aereo: '#3f5f6b', varanda: { cor: '#d8cdb9', vaso: '#2f3e56' },
    }),
    circ: { arte: { tipo: 'quadro', cor: '#c9a05a', n: 2 }, arandela: '#c9a05a' },
  }),
  tema({
    id: 'biofilico', nome: 'Natural e biofílico', curto: 'Biofílico',
    frase: 'Verde, madeira crua, linho e plantas em todo canto.',
    desc: 'Verde oliva e sálvia, papel de folhagem, vinílico freijó, cortinas de linho, cestos de palha e plantas em todos os ambientes. A casa fica com cara de varanda.',
    tags: ['plantas', 'verde', 'linho', 'palha'], periodo: 'dia',
    pal: { w: '#dfe5d3', m: '#a5774b', t: '#7d8461', a: '#5b6b4f', g: '#39423f' },
    aberturas: { porta: '#e9e1d3', entrada: '#7d8461', esquadria: '#f2f2f0', macaneta: '#8c6b4a' },
    sala: sala({
      nome: 'Sala biofílica', desc: 'Papel de folhagem atrás do sofá oliva, tapete redondo de juta, puff, cesto e três plantas.',
      parede: T('#dfe5d3', 'Sálvia clara'), dest: [['sofa', X('papel-folha')]], piso: 'vinilico', rodape: 'madeira10',
      forro: { tipo: 'gesso', drop: 0.08, cor: '#f1eee4' }, luz: { temp: 'quente', int: 0.8 },
      sofa: { cor: '#7d8461' }, rack: { cor: '#a5774b' }, tapete: { tipo: 'tapeteredondo', cor: '#c9a77c' }, mesa: { cor: '#a5774b' }, puff: '#c9bfae',
      cesto: '#c9a77c', luminaria: '#39423f', prateleira: '#a5774b', vaso: '#e8dcc3',
      sobreRack: [['plantapeq', -0.75, '#e8dcc3'], ['cacto', 0.75, '#b46a4c']], plantas: [['planta', 'janela', '#e8dcc3'], ['planta', 'sofa', '#c9a77c']],
      cortina: '#e8e3da', teto: [['globo', '#c9a77c']],
    }),
    cozinha: cozinha({
      nome: 'Cozinha biofílica', desc: 'Frentes verde-acinzentadas, tampo de madeira, ladrilho hexagonal verde e ervas na bancada.',
      parede: T('#dfe5d3', 'Sálvia clara'), piso: 'hex-verde', rodape: 'branco7', forro: { tipo: 'gesso', drop: 0.08, cor: '#f1eee4' }, luz: { temp: 'quente', int: 0.85 },
      bancada: { tampo: 'madeira', armario: 'portas', cor: '#9aa29a', torneira: '#8c6b4a', cuba: 1 },
      geladeira: '#e8e1d2', fogao: '#e8e1d2', mesa: ['#a5774b', '#7d8461'], mesaTipo: ['jantarredonda', 'jantar4'],
      aereo: { cor: '#c9d3c3' }, nicho: '#a5774b', coifa: 'coifa', balcao: [['plantapeq', -0.9, '#e8dcc3'], ['plantapeq', 0.9, '#e8dcc3']], topoGeladeira: ['plantapeq', '#e8dcc3'],
      pendente: ['pendente', '#c9a77c'], planta: ['planta', '#e8dcc3'], arte: { tipo: 'quadro', cor: '#5b6b4f' },
    }),
    quarto: [quarto({
      nome: 'Quarto biofílico', desc: 'Folhagem na cabeceira, linho, baú de madeira e planta grande perto da janela.',
      parede: T('#dfe5d3', 'Sálvia clara'), dest: [['cama', X('papel-folha')]], piso: 'vinilico', rodape: 'madeira10', forro: { tipo: 'gesso', drop: 0.08, cor: '#f1eee4' }, luz: { temp: 'quente', int: 0.6 },
      cama: ['#e8e3da', '#a5774b'], gr: '#c9a77c', criado: '#a5774b', tapete: { tipo: 'tapeteredondo', cor: '#c9a77c' }, abajur: '#e8dcc3', cortina: '#e8e3da',
      bau: '#c9a77c', planta: { tipo: 'planta', cor: '#e8dcc3' }, teto: [['globo', '#c9a77c']],
    }), quarto({
      nome: 'Quarto 2 biofílico', desc: 'Mesa de madeira crua na janela, prateleira com plantas e cama de linho.',
      parede: T('#dfe5d3', 'Sálvia clara'), piso: 'vinilico', rodape: 'madeira10', forro: { tipo: 'gesso', drop: 0.08, cor: '#f1eee4' }, luz: { temp: 'neutra', int: 0.85 },
      cama: ['#e8e3da', '#a5774b'], gr: '#c9a77c', criado: '#a5774b', umCriado: true, camaTipo: 'camasolteiro', abajur: '#e8dcc3', mesa: { cor: '#a5774b', cadeira: '#7d8461', luz: '#39423f', vaso: '#e8dcc3' },
      planta: { tipo: 'planta', cor: '#e8dcc3' }, cortina: '#e8e3da', teto: [['globo', '#c9a77c']],
    })],
    banho: banho({
      nome: 'Banheiro biofílico', desc: 'Azulejo verde até meia altura, gabinete de madeira, vidro jateado e planta que gosta de umidade.',
      parede: T('#dfe5d3', 'Sálvia clara', MEIA('azulejo-verde', 1.5)), piso: 'hex-verde', forro: { tipo: 'gesso', drop: 0.08, cor: '#f1eee4' }, luz: { temp: 'quente', int: 0.8 },
      fixos: { lavatorio: { modelo: 'gabinete', armario: 'portas', corArm: '#a5774b', torneira: '#8c6b4a', espelho: false }, vaso: { assento: '#a5774b' }, box: { vidro: 'jateado', perfil: '#8c6b4a', metal: '#8c6b4a' } },
      espelho: { tipo: 'espelhoredondo', cor: '#a5774b' }, toalheiro: 'toalheiro', tapete: '#c9a77c', cesto: '#c9a77c', planta: '#e8dcc3', banquinho: '#a5774b',
    }),
    servico: servico({
      nome: 'Serviço biofílico', desc: 'Sálvia, madeira, cestos de palha e varanda com poltronas e plantas.',
      parede: T('#dfe5d3', 'Sálvia clara'), piso: 'cer-bege', luz: { temp: 'neutra', int: 1 }, tanque: { modelo: 'ceramica', cor: '#f6f5f2', torneira: '#8c6b4a' },
      maquina: '#e9e9e9', armario: { tipo: 'armservico', cor: '#c9d3c3' }, aereo: '#c9d3c3', cesto: '#c9a77c', planta: '#e8dcc3', varanda: { cor: '#7d8461', vaso: '#e8dcc3' },
    }),
    circ: { arte: { tipo: 'quadro', cor: '#5b6b4f' } },
  }),
  tema({
    id: 'terroso', nome: 'Terroso e boho', curto: 'Terroso',
    frase: 'Terracota, palha, argila e peças feitas à mão.',
    desc: 'Terracota atrás do sofá, piso hexagonal, tapete redondo, cestos, espelho redondo e globos de luz. Cores quentes e texturas naturais, com cara de casa de praia no interior.',
    tags: ['terracota', 'palha', 'boho', 'artesanal'], periodo: 'tarde',
    pal: { w: '#e3c6b4', m: '#c9a77c', t: '#b46a4c', a: '#d1a54a', g: '#5b4636' },
    aberturas: { porta: '#e9e1d3', entrada: '#b46a4c', esquadria: '#6b4f3a', macaneta: '#8c6b4a' },
    sala: sala({
      nome: 'Sala terrosa', desc: 'Terracota atrás do sofá queimado, tapete redondo, espelho redondo, puff mostarda e cestos.',
      parede: T('#e3c6b4', 'Argila'), dest: [['sofa', T('#c47a5a', 'Terracota')]], piso: 'hex-bege', rodape: 'branco10',
      forro: { tipo: 'gesso', drop: 0.08, cor: '#f1e6d6' }, luz: { temp: 'quente', int: 0.7 },
      sofa: { cor: '#b46a4c' }, rack: { cor: '#c9a77c' }, tapete: { tipo: 'tapeteredondo', cor: '#e8dcc3' }, mesa: { cor: '#a5774b' }, puff: '#d1a54a', cesto: '#c9a77c',
      arte: { tipo: 'espelhoredondo', cor: '#a5774b' }, lateral: '#a5774b', abajur: '#e8dcc3', plantas: [['planta', 'janela', '#c9a77c']],
      sobreRack: [['vasodeco', -0.75, '#b46a4c'], ['cacto', 0.75, '#e8dcc3']], cortina: '#e8dcc3', teto: [['globo', '#c9a77c']],
    }),
    cozinha: cozinha({
      nome: 'Cozinha terrosa', desc: 'Frentes terracota, tampo de madeira, globo sobre a mesa e passadeira de juta.',
      parede: T('#ecd5c0', 'Pêssego'), piso: 'hex-bege', rodape: 'branco7', forro: { tipo: 'gesso', drop: 0.08, cor: '#f1e6d6' }, luz: { temp: 'quente', int: 0.75 },
      bancada: { tampo: 'madeira', armario: 'portas', cor: '#b46a4c', torneira: '#8c6b4a', cuba: 1 },
      geladeira: '#e8e1d2', fogao: '#e8e1d2', mesa: ['#a5774b', '#c9a77c'],
      aereo: { cor: '#e3c6b4' }, nicho: '#a5774b', coifa: 'coifa', balcao: [['plantapeq', -0.9, '#c9a77c'], ['panelaarroz', 0.9, '#e8dcc3']],
      pendente: ['globo', '#c9a77c'], arte: { tipo: 'quadrotrio', cor: '#d1a54a' }, planta: ['planta', '#c9a77c'], passadeira: '#c9a77c',
    }),
    quarto: [quarto({
      nome: 'Quarto terroso', desc: 'Cabeceira terracota, tapete redondo, espelho redondo e baú de palha.',
      parede: T('#e9d3c0', 'Pêssego'), dest: [['cama', T('#c47a5a', 'Terracota')]], piso: 'lam-claro', rodape: 'madeira10', forro: { tipo: 'gesso', drop: 0.08, cor: '#f1e6d6' }, luz: { temp: 'quente', int: 0.55 },
      cama: ['#e8dcc3', '#a5774b'], gr: '#c9a77c', criado: '#a5774b', tapete: { tipo: 'tapeteredondo', cor: '#e8dcc3' }, abajur: '#e8dcc3', arte: { tipo: 'quadrotrio', cor: '#d1a54a' },
      espelho: { tipo: 'espelhoredondo', cor: '#a5774b' }, bau: '#c9a77c', poltrona: '#d1a54a', cortina: '#e8dcc3', planta: { cor: '#c9a77c' }, teto: [['globo', '#c9a77c']],
    }), quarto({
      nome: 'Quarto 2 terroso', desc: 'Argila, palha e uma mesa de apoio junto à janela.',
      parede: T('#e9d3c0', 'Pêssego'), dest: [['cama', T('#d8a58a', 'Argila')]], piso: 'lam-claro', rodape: 'madeira10', forro: { tipo: 'gesso', drop: 0.08, cor: '#f1e6d6' }, luz: { temp: 'quente', int: 0.6 },
      cama: ['#e8dcc3', '#a5774b'], gr: '#c9a77c', criado: '#a5774b', umCriado: true, camaTipo: 'camasolteiro', abajur: '#e8dcc3', mesa: { cor: '#a5774b', cadeira: '#c9a77c', luz: '#5b4636', vaso: '#c9a77c' },
      arte: { tipo: 'quadro', cor: '#b46a4c' }, cortina: '#e8dcc3', teto: [['globo', '#c9a77c']],
    })],
    banho: banho({
      nome: 'Banheiro terroso', desc: 'Azulejo metrô com argila, gabinete terracota, bronze e espelho redondo.',
      parede: T('#e3c6b4', 'Argila', MEIA('azulejo-metro', 1.5)), piso: 'hex-bege', forro: { tipo: 'gesso', drop: 0.08, cor: '#f1e6d6' }, luz: { temp: 'quente', int: 0.75 },
      fixos: { lavatorio: { modelo: 'gabinete', armario: 'portas', corArm: '#b46a4c', torneira: '#8c6b4a', espelho: false }, vaso: { cor: '#e9dfcc', assento: '#a5774b' }, box: { vidro: 'jateado', perfil: '#8c6b4a', metal: '#8c6b4a' } },
      espelho: { tipo: 'espelhoredondo', cor: '#a5774b' }, toalheiro: 'toalheiro', tapete: '#c9a77c', cesto: '#c9a77c', planta: '#c9a77c',
    }),
    servico: servico({
      nome: 'Serviço terroso', desc: 'Cestos de palha, armário claro e varanda com poltronas terracota.',
      parede: T('#ecd5c0', 'Pêssego'), piso: 'hex-bege', luz: { temp: 'neutra', int: 0.95 }, tanque: { modelo: 'ceramica', cor: '#e9dfcc', torneira: '#8c6b4a' },
      maquina: '#e9e9e9', armario: { tipo: 'armservico', cor: '#e8dcc3' }, aereo: '#e8dcc3', cesto: '#c9a77c', varanda: { cor: '#b46a4c', vaso: '#c9a77c' },
    }),
    circ: { arte: { tipo: 'espelhoredondo', cor: '#a5774b' } },
  }),
  tema({
    id: 'colorido', nome: 'Colorido e jovem', curto: 'Colorido',
    frase: 'Azul-petróleo, mostarda, rosa antigo e personalidade.',
    desc: 'Petróleo atrás do sofá mostarda, poltrona rosa antigo, piso xadrez no serviço e no banheiro, quadros grandes e luminárias vermelhas. Para quem não tem medo de cor.',
    tags: ['cor', 'mostarda', 'petróleo', 'pop'], periodo: 'dia',
    pal: { w: '#f1efeb', m: '#2f2e2c', t: '#d1a54a', a: '#3f6471', g: '#c0392b' },
    aberturas: { porta: '#f6f4f0', entrada: '#3f6471', esquadria: '#2b2b2d', macaneta: '#222224' },
    sala: sala({
      nome: 'Sala colorida', desc: 'Sofá mostarda contra parede petróleo, poltrona rosa antigo, quadro vermelho e globo de luz.',
      parede: T('#f1efeb', 'Branco gelo'), dest: [['sofa', T('#3f6471', 'Azul petróleo')]], piso: 'cer-off', rodape: 'branco10',
      forro: { tipo: 'laje', cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.95 },
      sofa: { cor: '#d1a54a' }, rack: { cor: '#2f2e2c' }, tv: 'tv55', tapete: { tipo: 'tapeteredondo', cor: '#dbb5b0' }, mesa: { cor: '#2f2e2c' },
      poltrona: { cor: '#dbb5b0' }, luminaria: '#c0392b', arte: { tipo: 'quadrogrande', cor: '#c0392b' }, estante: { tipo: 'estante', cor: '#3f6471' },
      sobreRack: [['vasodeco', 0.75, '#3f6471']], plantas: [['planta', 'janela', '#d1a54a']], cortina: '#e9d9a8', teto: [['globo', '#c0392b']],
    }),
    cozinha: cozinha({
      nome: 'Cozinha colorida', desc: 'Azulejo azul, frentes petróleo, aéreo mostarda, geladeira amarela e piso xadrez.',
      parede: X('azulejo-azul'), piso: 'xadrez', rodape: 'branco7', forro: { tipo: 'laje', cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 1 },
      bancada: { tampo: 'branco', armario: 'portas', cor: '#3f5f6b', torneira: '#c9ccd0', cuba: 1 },
      geladeira: '#d1a54a', fogao: '#2b2b2b', mesa: ['#f1efea', '#d1a54a'], mesaTipo: ['jantar2', 'jantar4'],
      aereo: { tipos: ['aereo60', 'aereo'], cor: '#d1a54a' }, coifa: 'coifaslim', balcao: [['cafeteira', 0.9, '#c0392b'], ['torradeira', -0.9, '#d1a54a']],
      pendente: ['globo', '#c0392b'], arte: { tipo: 'quadro', cor: '#3f5f6b' }, relogio: '#c0392b',
    }),
    quarto: [quarto({
      nome: 'Quarto colorido', desc: 'Cabeceira petróleo, roupa de cama amarela, poltrona mostarda e abajur vermelho.',
      parede: T('#f1efeb', 'Branco gelo'), dest: [['cama', T('#3f6471', 'Azul petróleo')]], piso: 'lam-claro', rodape: 'branco10', forro: { tipo: 'laje', cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.8 },
      cama: ['#e9d9a8', '#3f5f6b'], gr: '#f1efea', criado: '#d1a54a', tapete: { tipo: 'tapeteredondo', cor: '#dbb5b0' }, abajur: '#c0392b', arte: { tipo: 'quadrogrande', cor: '#d1a54a' },
      poltrona: '#d1a54a', cortina: '#e9d9a8', planta: { cor: '#d1a54a' }, teto: [['globo', '#c0392b']],
    }), quarto({
      nome: 'Quarto 2 colorido', desc: 'Rosa antigo na cabeceira, mesa de estudo, estante petróleo e luminária vermelha.',
      parede: T('#f1efeb', 'Branco gelo'), dest: [['cama', T('#dbb5b0', 'Rosa antigo')]], piso: 'lam-claro', rodape: 'branco10', forro: { tipo: 'laje', cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.9 },
      cama: ['#cfdbe2', '#3f5f6b'], gr: '#f1efea', criado: '#d1a54a', umCriado: true, camaTipo: 'camasolteiro', abajur: '#c0392b', mesa: { cor: '#f1efea', cadeira: '#c0392b', luz: '#c0392b', vaso: '#d1a54a' },
      arte: { tipo: 'quadrotrio', cor: '#3f6471' }, cortina: '#e9d9a8', teto: [['globo', '#d1a54a']],
    })],
    banho: banho({
      nome: 'Banheiro colorido', desc: 'Azulejo azul, piso xadrez, lavatório de coluna e metais pretos.',
      parede: T('#f1efeb', 'Branco gelo', MEIA('azulejo-azul', 1.5)), piso: 'xadrez', forro: { tipo: 'laje', cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 1 },
      fixos: { lavatorio: { modelo: 'coluna', cor: '#f6f5f2', torneira: '#222224', espelho: false }, vaso: { assento: '#d1a54a', cor: '#f6f5f2' }, box: { vidro: 'incolor', perfil: '#1c1c1e', metal: '#222224' } },
      espelho: { tipo: 'espelhoredondo', cor: '#c0392b' }, toalheiro: 'toalheiro', tapete: '#d1a54a', cesto: '#d1a54a',
    }),
    servico: servico({
      nome: 'Serviço colorido', desc: 'Piso xadrez, armário mostarda, aéreo petróleo e mesa bistrô vermelha.',
      parede: T('#f1efeb', 'Branco gelo'), piso: 'xadrez', luz: { temp: 'neutra', int: 1 }, tanque: { modelo: 'ceramica', cor: '#f6f5f2', torneira: '#222224' },
      maquina: '#e9e9e9', armario: { tipo: 'armservico', cor: '#d1a54a' }, aereo: '#3f5f6b', cesto: '#c0392b', varanda: { mesa: true, cor: '#c0392b', cor2: '#c0392b', vaso: '#d1a54a' },
    }),
    circ: { arte: { tipo: 'quadrogrande', cor: '#c0392b' } },
  }),
  tema({
    id: 'cinema', nome: 'Noite e cinema', curto: 'Cinema',
    frase: 'Paredes escuras, luz baixa e TV grande.',
    desc: 'Grafite quente e azul-marinho, ripado escuro atrás de uma TV de 65 polegadas, sanca de LED em baixa intensidade, cortinas blackout e vidro fumê. Feito para ver filme à noite.',
    tags: ['escuro', 'TV grande', 'luz baixa', 'blackout'], periodo: 'noite',
    pal: { w: '#4d5553', m: '#2f2e2c', t: '#2f3e56', a: '#c9a05a', g: '#1b2221' },
    aberturas: { porta: '#2f2e2c', entrada: '#2f2e2c', esquadria: '#2b2b2d', macaneta: '#c9a05a', vidro: 'fume' },
    sala: sala({
      nome: 'Sala de cinema', desc: 'Grafite, ripado escuro, TV de 65", sofá azul-marinho, sanca baixa e blackout.',
      parede: T('#4d5553', 'Grafite quente'), dest: [['rack', X('ripado')]], piso: 'lam-nogueira', rodape: 'preto7',
      forro: { tipo: 'sanca', drop: 0.12, cor: '#3b403e' }, luz: { temp: 'quente', int: 0.4 },
      sofa: { cor: '#2f3e56', tipo: ['sofaret'] }, rack: { tipo: 'racksusp', cor: '#2f2e2c' }, tv: 'tv65', tapete: { cor: '#3b403e' }, mesa: { cor: '#2f2e2c', tipos: ['mesaapoio'] }, lateral: '#2f2e2c',
      abajur: '#c9a05a', luminaria: '#c9a05a', arte: { tipo: 'quadro', cor: '#c9a05a' }, plantas: [['planta', 'janela', '#2f2e2c']], cortina: '#2b2b2b', teto: [['spots4', null]],
    }),
    cozinha: cozinha({
      nome: 'Cozinha noturna', desc: 'Frentes pretas, tampo escuro, eletros pretos e pendentes de latão.',
      parede: T('#4d5553', 'Grafite quente'), piso: 'cer-grafite', rodape: 'preto7', forro: { tipo: 'gesso', drop: 0.08, cor: '#3b403e' }, luz: { temp: 'quente', int: 0.55 },
      bancada: { tampo: 'preto', armario: 'misto', cor: '#2f2e2c', torneira: '#c9a05a', cuba: 1 },
      geladeira: '#2b2b2b', fogao: '#2b2b2b', mesa: ['#2f2e2c', '#2f3e56'], aereo: { cor: '#2f2e2c' }, coifa: 'coifa', balcao: [['cafeteira', 0.9, '#c9a05a']],
      pendente: ['pendente3', '#c9a05a'], arte: { tipo: 'quadro', cor: '#c9a05a' },
    }),
    quarto: [quarto({
      nome: 'Quarto escuro', desc: 'Azul-marinho em todas as paredes, criados suspensos, arandelas de latão e blackout.',
      parede: T('#2f3e56', 'Azul-marinho'), piso: 'lam-nogueira', rodape: 'preto7', forro: { tipo: 'sanca', drop: 0.10, cor: '#3b403e' }, luz: { temp: 'quente', int: 0.35 },
      cama: ['#c9bfae', '#2f2e2c'], gr: '#2f2e2c', criado: '#2f2e2c', criadoTipo: 'criadosusp', tapete: { cor: '#3b403e' }, arandela: '#c9a05a', cortina: '#2b2b2b',
      arte: { tipo: 'quadro', cor: '#c9a05a' }, teto: [['plafon', null]],
    }), quarto({
      nome: 'Quarto 2 noturno', desc: 'Grafite, mesa escura, cadeira preta, luz baixa e blackout.',
      parede: T('#4d5553', 'Grafite quente'), piso: 'lam-nogueira', rodape: 'preto7', forro: { tipo: 'gesso', drop: 0.08, cor: '#3b403e' }, luz: { temp: 'quente', int: 0.45 },
      cama: ['#c9bfae', '#2f2e2c'], gr: '#2f2e2c', criado: '#2f2e2c', umCriado: true, camaTipo: 'camasolteiro', mesa: { cor: '#2f2e2c', cadeira: '#2b2b2b', luz: '#c9a05a', vaso: '#2f2e2c' },
      cortina: '#2b2b2b', teto: [['plafon', null]],
    })],
    banho: banho({
      nome: 'Banheiro noturno', desc: 'Azulejo grafite, louças pretas, metais de latão e luz quente.',
      parede: T('#4d5553', 'Grafite quente', MEIA('azulejo-grafite', 1.5)), piso: 'cer-grafite', forro: { tipo: 'gesso', drop: 0.08, cor: '#3b403e' }, luz: { temp: 'quente', int: 0.6 },
      fixos: { lavatorio: { modelo: 'apoio', armario: 'gavetas', corArm: '#2f2e2c', torneira: '#c9a05a', cor: '#2b2b2d', espelho: false }, vaso: { cor: '#2b2b2d', assento: '#2b2b2d' }, box: { vidro: 'fume', perfil: '#c9a05a', metal: '#c9a05a', ducha: 'teto' } },
      espelho: { tipo: 'espelhoredondo', cor: '#c9a05a' }, toalheiro: 'toalheirotermico', tapete: '#3b403e',
    }),
    servico: servico({
      nome: 'Serviço escuro', desc: 'Grafite e inox, prático e discreto.',
      parede: T('#7d8580', 'Grafite claro'), piso: 'cer-grafite', luz: { temp: 'neutra', int: 0.9 }, tanque: { modelo: 'inox', armario: 'portas', torneira: '#222224' },
      maquina: '#b9bcc0', armario: { tipo: 'armservico', cor: '#2f2e2c' }, aereo: '#2f2e2c', cesto: '#2b2b2b',
    }),
    circ: { arandela: '#c9a05a', luz: 'spot' },
  }),
  tema({
    id: 'praiano', nome: 'Praiano', curto: 'Praiano',
    frase: 'Azul névoa, branco, palha e madeira clara.',
    desc: 'Azul névoa e branco, listras suaves atrás do sofá, laminado claro, cestos de palha, cortinas de linho e luz natural. Leve, arejado e com cheiro de maresia.',
    tags: ['azul', 'branco', 'palha', 'listras'], periodo: 'dia',
    pal: { w: '#cfdbe2', m: '#d3b78f', t: '#f1efea', a: '#5d86a1', g: '#39423f' },
    aberturas: { porta: '#f6f4f0', entrada: '#5d86a1', esquadria: '#f2f2f0', macaneta: '#c9ccd0' },
    sala: sala({
      nome: 'Sala praiana', desc: 'Papel listrado azul atrás do sofá branco, poltrona azul, cestos, tapete de juta e trio de quadros.',
      parede: T('#e9eef0', 'Névoa clara'), dest: [['sofa', X('papel-lista-azul')]], piso: 'lam-claro', rodape: 'branco10',
      forro: { tipo: 'laje', cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.95 },
      sofa: { cor: '#f1efea' }, rack: { cor: '#d3b78f' }, tapete: { cor: '#d9c6a8' }, mesa: { cor: '#d3b78f' }, poltrona: { cor: '#5d86a1' }, cesto: '#c9a77c',
      arte: { tipo: 'quadrotrio', cor: '#5d86a1' }, plantas: [['planta', 'janela', '#f1efea']], sobreRack: [['vasodeco', 0.75, '#5d86a1']], cortina: '#f6f4f0', teto: [['globo', '#d3b78f']],
    }),
    cozinha: cozinha({
      nome: 'Cozinha praiana', desc: 'Azulejo metrô branco, armários brancos, tampo de madeira e mesa redonda azul.',
      parede: X('azulejo-metro'), piso: 'lam-claro', rodape: 'branco7', forro: { tipo: 'laje', cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 1 },
      bancada: { tampo: 'madeira', armario: 'portas', cor: '#f1efea', torneira: '#c9ccd0', cuba: 1 },
      geladeira: '#e9e9e9', fogao: '#e9e9e9', mesa: ['#d3b78f', '#5d86a1'], mesaTipo: ['jantarredonda', 'jantar4'],
      aereo: { cor: '#f1efea' }, coifa: 'coifaslim', balcao: [['plantapeq', -0.9, '#f1efea'], ['cafeteira', 0.9, '#e9e9e9']], pendente: ['globo', '#d3b78f'],
      arte: { tipo: 'quadro', cor: '#5d86a1' }, passadeira: '#cfdbe2',
    }),
    quarto: [quarto({
      nome: 'Quarto praiano', desc: 'Cabeceira azul névoa, roupa de cama branca, baú claro e cortina de linho.',
      parede: T('#e9eef0', 'Névoa clara'), dest: [['cama', T('#cfdbe2', 'Azul névoa')]], piso: 'lam-claro', rodape: 'branco10', forro: { tipo: 'laje', cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.8 },
      cama: ['#f1efea', '#d3b78f'], gr: '#f1efea', criado: '#d3b78f', tapete: { cor: '#d9c6a8' }, abajur: '#d3b78f', arte: { tipo: 'quadrotrio', cor: '#5d86a1' }, bau: '#d3b78f',
      poltrona: '#5d86a1', cortina: '#f6f4f0', planta: { cor: '#f1efea' }, teto: [['globo', '#d3b78f']],
    }), quarto({
      nome: 'Quarto 2 praiano', desc: 'Listras na cabeceira, mesa clara e tapete de juta.',
      parede: T('#e9eef0', 'Névoa clara'), dest: [['cama', X('papel-lista-azul')]], piso: 'lam-claro', rodape: 'branco10', forro: { tipo: 'laje', cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 0.85 },
      cama: ['#f1efea', '#d3b78f'], gr: '#f1efea', criado: '#d3b78f', umCriado: true, camaTipo: 'camasolteiro', abajur: '#d3b78f', tapete: { cor: '#d9c6a8' },
      mesa: { cor: '#d3b78f', cadeira: '#5d86a1', luz: '#f1efea' }, cortina: '#f6f4f0', teto: [['globo', '#d3b78f']],
    })],
    banho: banho({
      nome: 'Banheiro praiano', desc: 'Azulejo azul até meia altura, gabinete claro e cortina de box.',
      parede: T('#e9eef0', 'Névoa clara', MEIA('azulejo-azul', 1.5)), piso: 'cer-banho', forro: { tipo: 'laje', cor: '#f7f6f3' }, luz: { temp: 'neutra', int: 1 },
      fixos: { lavatorio: { modelo: 'gabinete', armario: 'portas', corArm: '#d3b78f', torneira: '#c9ccd0', espelho: false }, vaso: { assento: '#f6f5f2' }, box: { modelo: 'cortina' } },
      espelho: { tipo: 'espelhoredondo', cor: '#d3b78f' }, toalheiro: 'toalheiro', tapete: '#cfdbe2', cesto: '#d3b78f', planta: '#f1efea',
    }),
    servico: servico({
      nome: 'Serviço praiano', desc: 'Branco e azul névoa, cestos de palha e poltronas de varanda.',
      parede: T('#e9eef0', 'Névoa clara'), piso: 'cer-off', luz: { temp: 'neutra', int: 1 }, tanque: { modelo: 'plastico', cor: '#f6f5f2', torneira: '#c9ccd0' },
      maquina: '#e9e9e9', armario: { tipo: 'armservico', cor: '#f1efea' }, aereo: '#cfdbe2', cesto: '#d3b78f', varanda: { cor: '#5d86a1', vaso: '#f1efea' },
    }),
    circ: { arte: { tipo: 'quadro', cor: '#5d86a1', n: 2 }, luz: 'globo', luzCor: '#d3b78f' },
  }),
  tema({
    id: 'rustico', nome: 'Rústico', curto: 'Rústico',
    frase: 'Tijolo aparente, nogueira, parquê e ferro.',
    desc: 'Tijolinho aparente atrás da TV, parquê de madeira, móveis de nogueira, mostarda e verde musgo. Lustre de aros de ferro e luz quente de abajur.',
    tags: ['tijolo', 'nogueira', 'parquê', 'ferro'], periodo: 'tarde',
    pal: { w: '#d8c8b0', m: '#6e4a31', t: '#d1a54a', a: '#b5593d', g: '#2f2e2c' },
    aberturas: { porta: '#6e4a31', entrada: '#6e4a31', esquadria: '#2b2b2d', macaneta: '#8c6b4a' },
    sala: sala({
      nome: 'Sala rústica', desc: 'Tijolinho atrás da TV, parquê, sofá mostarda, poltrona musgo e lustre de ferro.',
      parede: T('#d8c8b0', 'Camurça'), dest: [['rack', X('tijolo-terra')]], piso: 'parque', rodape: 'madeira10',
      forro: { tipo: 'gesso', drop: 0.08, cor: '#e8dcc3' }, luz: { temp: 'quente', int: 0.7 },
      sofa: { cor: '#d1a54a' }, rack: { cor: '#6e4a31' }, tapete: { cor: '#b5593d' }, mesa: { cor: '#6e4a31' }, poltrona: { cor: '#5b6b4f' }, lateral: '#6e4a31', abajur: '#e8dcc3',
      arte: { tipo: 'quadro', cor: '#6e4a31' }, cesto: '#c9a77c', plantas: [['planta', 'janela', '#6e4a31']], sobreRack: [['cacto', 0.75, '#b5593d']],
      cortina: '#d8c8b0', teto: [['lustrearos', '#2f2e2c']],
    }),
    cozinha: cozinha({
      nome: 'Cozinha rústica', desc: 'Tijolinho nas paredes, armários de nogueira, granito e mesa com banco.',
      parede: X('tijolo-terra'), piso: 'parque', rodape: 'madeira10', forro: { tipo: 'gesso', drop: 0.08, cor: '#e8dcc3' }, luz: { temp: 'quente', int: 0.75 },
      bancada: { tampo: 'granito', armario: 'misto', cor: '#6e4a31', torneira: '#8c6b4a', cuba: 1 },
      geladeira: '#e8e1d2', fogao: '#2b2b2b', mesa: ['#6e4a31', '#2f2e2c'], mesaTipo: ['jantarbanco', 'jantar4'],
      aereo: { cor: '#6e4a31' }, nicho: '#6e4a31', coifa: 'coifa', balcao: [['panelaarroz', -0.9, '#f1efea'], ['cafeteira', 0.9, '#2b2b2b']], pendente: ['pendente', '#2f2e2c'],
      planta: ['planta', '#6e4a31'], passadeira: '#b5593d',
    }),
    quarto: [quarto({
      nome: 'Quarto rústico', desc: 'Tijolinho branco na cabeceira, cama de nogueira, baú aos pés e poltrona musgo.',
      parede: T('#d8c8b0', 'Camurça'), dest: [['cama', X('tijolo-branco')]], piso: 'parque', rodape: 'madeira10', forro: { tipo: 'gesso', drop: 0.08, cor: '#e8dcc3' }, luz: { temp: 'quente', int: 0.55 },
      cama: ['#e8dcc3', '#6e4a31'], gr: '#6e4a31', criado: '#6e4a31', tapete: { cor: '#b5593d' }, abajur: '#e8dcc3', bau: '#6e4a31', poltrona: '#5b6b4f', cortina: '#d8c8b0',
      arte: { tipo: 'quadro', cor: '#6e4a31' }, planta: { cor: '#6e4a31' }, teto: [['lustrearos', '#2f2e2c']],
    }), quarto({
      nome: 'Quarto 2 rústico', desc: 'Escrivaninha de nogueira, prateleira com plantas e cadeira de madeira.',
      parede: T('#d8c8b0', 'Camurça'), piso: 'parque', rodape: 'madeira10', forro: { tipo: 'gesso', drop: 0.08, cor: '#e8dcc3' }, luz: { temp: 'quente', int: 0.7 },
      cama: ['#e8dcc3', '#6e4a31'], gr: '#6e4a31', criado: '#6e4a31', umCriado: true, camaTipo: 'camasolteiro', abajur: '#e8dcc3', mesa: { cor: '#6e4a31', cadeira: '#6e4a31', luz: '#2f2e2c', vaso: '#6e4a31' },
      arte: { tipo: 'quadro', cor: '#b5593d' }, cortina: '#d8c8b0', teto: [['plafon', null]],
    })],
    banho: banho({
      nome: 'Banheiro rústico', desc: 'Azulejo verde até meia altura, gabinete de nogueira, bronze e banquinho de madeira.',
      parede: T('#d8c8b0', 'Camurça', MEIA('azulejo-verde', 1.5)), piso: 'cer-banho', forro: { tipo: 'gesso', drop: 0.08, cor: '#e8dcc3' }, luz: { temp: 'quente', int: 0.7 },
      fixos: { lavatorio: { modelo: 'gabinete', armario: 'portas', corArm: '#6e4a31', torneira: '#8c6b4a', espelho: false }, vaso: { assento: '#6e4a31' }, box: { vidro: 'incolor', perfil: '#8c6b4a', metal: '#8c6b4a' } },
      espelho: { tipo: 'espelho', cor: '#6e4a31', centro: 1.45 }, toalheiro: 'toalheiro', tapete: '#b5593d', cesto: '#c9a77c', banquinho: '#6e4a31',
    }),
    servico: servico({
      nome: 'Serviço rústico', desc: 'Madeira escura, tanque de louça e mesa bistrô de ferro.',
      parede: T('#d8c8b0', 'Camurça'), piso: 'cer-bege', luz: { temp: 'neutra', int: 0.95 }, tanque: { modelo: 'ceramica', cor: '#e9dfcc', torneira: '#8c6b4a' },
      maquina: '#e9e9e9', armario: { tipo: 'armservico', cor: '#6e4a31' }, aereo: '#6e4a31', cesto: '#c9a77c', varanda: { mesa: true, cor: '#2f2e2c', cor2: '#6e4a31', vaso: '#b5593d' },
    }),
    circ: { arte: { tipo: 'quadro', cor: '#6e4a31', n: 2 } },
  }),
];

export const temaPorId = Object.fromEntries(TEMAS.map((t) => [t.id, t]));
