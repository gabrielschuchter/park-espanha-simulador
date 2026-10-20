// Catálogo de móveis para apartamentos compactos. Medidas em metros (L × P × A).
// `frente`: faixa livre recomendada à frente do móvel (abrir portas, gavetas, sentar).
// `parede`: item fixado na parede (encosta o fundo na parede ao arrastar).
// `livre`: não participa da checagem de colisão (tapetes).
// `teto`: fixado no forro (a altura acompanha o rebaixo do cômodo). `luz`: emite luz (tipo, intensidade, altura relativa).

export const CORES = {
  tecido: [
    ['#6f6a64', 'Grafite'], ['#c9bfae', 'Linho'], ['#7d8461', 'Oliva'],
    ['#b46a4c', 'Terracota'], ['#3f5f6b', 'Petróleo'], ['#d1a54a', 'Mostarda'], ['#e8e3da', 'Off-white'],
  ],
  madeira: [
    ['#c9a77c', 'Carvalho claro'], ['#a5774b', 'Freijó'], ['#6e4a31', 'Nogueira'],
    ['#f1efea', 'Branco'], ['#2f2e2c', 'Preto'], ['#9aa29a', 'Verde-acinzentado'],
  ],
  metal: [['#2b2b2b', 'Preto'], ['#e9e9e9', 'Branco'], ['#b9bcc0', 'Inox']],
};

export const CATEGORIAS = [
  { id: 'sala', nome: 'Sala' },
  { id: 'quarto', nome: 'Quartos' },
  { id: 'cozinha', nome: 'Cozinha e jantar' },
  { id: 'servico', nome: 'Serviço' },
  { id: 'trabalho', nome: 'Trabalho' },
  { id: 'luz', nome: 'Iluminação' },
  { id: 'deco', nome: 'Decoração' },
  { id: 'meu', nome: 'Meus móveis' },
];

const I = (id, cat, nome, w, d, h, modelo, extra = {}) => ({ id, cat, nome, w, d, h, modelo, elev: 0, ...extra });

export const CATALOGO = [
  // Sala
  I('sofa3', 'sala', 'Sofá 3 lugares', 2.20, 0.92, 0.85, 'sofa', { cor: '#c9bfae', paleta: 'tecido', frente: 0.40 }),
  I('sofa2', 'sala', 'Sofá 2 lugares', 1.60, 0.88, 0.85, 'sofa', { cor: '#6f6a64', paleta: 'tecido', frente: 0.40 }),
  I('sofaret', 'sala', 'Sofá retrátil', 2.00, 1.00, 0.95, 'sofa', { cor: '#3f5f6b', paleta: 'tecido', retratil: true, frente: 0.40 }),
  I('sofachaise', 'sala', 'Sofá com chaise', 2.30, 1.50, 0.85, 'sofaChaise', { cor: '#c9bfae', paleta: 'tecido' }),
  I('poltrona', 'sala', 'Poltrona', 0.75, 0.80, 0.85, 'poltrona', { cor: '#b46a4c', paleta: 'tecido' }),
  I('rack', 'sala', 'Rack', 1.80, 0.40, 0.50, 'rack', { cor: '#a5774b', paleta: 'madeira', parede: true }),
  I('tv55', 'sala', 'TV 55"', 1.23, 0.06, 0.71, 'tv', { elev: 1.00, parede: true, cor: '#1c1c1c' }),
  I('painel', 'sala', 'Painel ripado', 1.80, 0.04, 1.80, 'painel', { elev: 0.30, parede: true, cor: '#a5774b', paleta: 'madeira' }),
  I('mesacentro', 'sala', 'Mesa de centro', 0.90, 0.55, 0.40, 'mesaCentro', { cor: '#c9a77c', paleta: 'madeira' }),
  I('mesalateral', 'sala', 'Mesa lateral', 0.45, 0.45, 0.55, 'mesaRedonda', { cor: '#2f2e2c', paleta: 'madeira' }),
  I('estante', 'sala', 'Estante', 0.80, 0.35, 1.80, 'estante', { cor: '#c9a77c', paleta: 'madeira', parede: true }),
  // Quartos
  I('camacasal', 'quarto', 'Cama de casal', 1.38, 1.88, 0.55, 'cama', { cor: '#e8e3da', cor2: '#a5774b', paleta: 'tecido', cabeceira: true }),
  I('camaqueen', 'quarto', 'Cama queen', 1.58, 1.98, 0.55, 'cama', { cor: '#e8e3da', cor2: '#6e4a31', paleta: 'tecido', cabeceira: true }),
  I('camasolteiro', 'quarto', 'Cama de solteiro', 0.88, 1.88, 0.50, 'cama', { cor: '#c9bfae', cor2: '#c9a77c', paleta: 'tecido', cabeceira: true }),
  I('beliche', 'quarto', 'Beliche', 0.98, 1.98, 1.60, 'beliche', { cor: '#f1efea', paleta: 'madeira' }),
  I('berco', 'quarto', 'Berço', 0.72, 1.36, 0.95, 'berco', { cor: '#f1efea', paleta: 'madeira' }),
  I('grcorrer', 'quarto', 'Guarda-roupa de correr', 2.00, 0.60, 2.30, 'guardaRoupa', { cor: '#f1efea', paleta: 'madeira', correr: true, frente: 0.50, parede: true }),
  I('grabrir', 'quarto', 'Guarda-roupa de abrir', 1.40, 0.55, 2.20, 'guardaRoupa', { cor: '#c9a77c', paleta: 'madeira', frente: 0.60, parede: true }),
  I('criado', 'quarto', 'Criado-mudo', 0.45, 0.40, 0.55, 'gaveteiro', { cor: '#c9a77c', paleta: 'madeira', parede: true }),
  I('comoda', 'quarto', 'Cômoda', 1.00, 0.45, 0.85, 'gaveteiro', { cor: '#f1efea', paleta: 'madeira', frente: 0.50, parede: true }),
  I('arsplit', 'quarto', 'Ar-condicionado split', 0.80, 0.22, 0.30, 'split', { elev: 2.15, parede: true, cor: '#f4f4f4' }),
  // Cozinha e jantar
  I('geladeira', 'cozinha', 'Geladeira', 0.70, 0.72, 1.80, 'geladeira', { cor: '#b9bcc0', paleta: 'metal', frente: 0.60, parede: true }),
  I('fogao', 'cozinha', 'Fogão 4 bocas', 0.52, 0.60, 0.85, 'fogao', { cor: '#e9e9e9', paleta: 'metal', frente: 0.70, parede: true }),
  I('balcao', 'cozinha', 'Armário de balcão', 0.80, 0.50, 0.85, 'gaveteiro', { cor: '#f1efea', paleta: 'madeira', frente: 0.60, parede: true, tampo: true }),
  I('aereo', 'cozinha', 'Armário aéreo', 1.20, 0.35, 0.60, 'aereo', { elev: 1.55, cor: '#f1efea', paleta: 'madeira', parede: true }),
  I('microondas', 'cozinha', 'Micro-ondas', 0.48, 0.38, 0.28, 'microondas', { elev: 0.90, cor: '#2b2b2b', paleta: 'metal' }),
  I('jantar4', 'cozinha', 'Mesa com 4 cadeiras', 1.20, 1.40, 0.76, 'jantar', { cor: '#c9a77c', cor2: '#2f2e2c', paleta: 'madeira', lugares: 4 }),
  I('jantarredonda', 'cozinha', 'Mesa redonda com 4 cadeiras', 1.50, 1.50, 0.76, 'jantarRedonda', { cor: '#f1efea', cor2: '#c9a77c', paleta: 'madeira' }),
  I('mesaret', 'cozinha', 'Mesa retangular', 1.20, 0.80, 0.76, 'mesa', { cor: '#c9a77c', paleta: 'madeira' }),
  I('cadeira', 'cozinha', 'Cadeira', 0.45, 0.52, 0.85, 'cadeira', { cor: '#2f2e2c', paleta: 'madeira' }),
  I('banqueta', 'cozinha', 'Banqueta alta', 0.40, 0.40, 0.75, 'banqueta', { cor: '#2f2e2c', paleta: 'metal' }),
  // Serviço
  I('lavar', 'servico', 'Máquina de lavar', 0.60, 0.65, 1.00, 'maquina', { cor: '#e9e9e9', paleta: 'metal', frente: 0.50, parede: true }),
  I('armservico', 'servico', 'Armário de serviço', 0.60, 0.40, 1.80, 'guardaRoupa', { cor: '#f1efea', paleta: 'madeira', frente: 0.50, parede: true }),
  I('varal', 'servico', 'Varal de chão', 1.40, 0.55, 0.95, 'varal', { cor: '#e9e9e9', paleta: 'metal' }),
  // Trabalho
  I('escrivaninha', 'trabalho', 'Escrivaninha', 1.00, 0.50, 0.75, 'mesa', { cor: '#f1efea', cor2: '#2f2e2c', paleta: 'madeira', parede: true, frente: 0.70 }),
  I('cadeiraesc', 'trabalho', 'Cadeira de escritório', 0.60, 0.60, 1.00, 'cadeiraEscritorio', { cor: '#2b2b2b', paleta: 'tecido' }),
  I('prateleira', 'trabalho', 'Prateleira', 0.90, 0.25, 0.04, 'prateleira', { elev: 1.50, parede: true, cor: '#a5774b', paleta: 'madeira' }),
  // Iluminação
  I('plafon', 'luz', 'Plafon redondo', 0.40, 0.40, 0.07, 'plafon', { teto: true, livre: true, cor: '#f4f2ee', paleta: 'metal', luz: { tipo: 'teto', int: 1.0, y: 0 } }),
  I('plafonq', 'luz', 'Plafon quadrado', 0.35, 0.35, 0.08, 'plafonQuad', { teto: true, livre: true, cor: '#f4f2ee', paleta: 'metal', luz: { tipo: 'teto', int: 1.0, y: 0 } }),
  I('painelled', 'luz', 'Painel LED 60×60', 0.60, 0.60, 0.03, 'painelLed', { teto: true, livre: true, cor: '#f4f2ee', luz: { tipo: 'teto', int: 1.1, y: 0 } }),
  I('spot', 'luz', 'Spot embutido', 0.10, 0.10, 0.04, 'spot', { teto: true, livre: true, cor: '#f4f2ee', paleta: 'metal', luz: { tipo: 'teto', int: 0.45, y: 0 } }),
  I('spots4', 'luz', 'Kit com 4 spots', 1.00, 1.00, 0.04, 'kitSpots', { teto: true, livre: true, cor: '#f4f2ee', paleta: 'metal', luz: { tipo: 'teto', int: 1.2, y: 0 } }),
  I('trilho', 'luz', 'Trilho com 3 spots', 1.20, 0.06, 0.14, 'trilho', { teto: true, livre: true, cor: '#2b2b2b', paleta: 'metal', luz: { tipo: 'teto', int: 1.1, y: 0 } }),
  I('lustre', 'luz', 'Lustre de cristal', 0.60, 0.60, 0.55, 'lustreCristal', { teto: true, livre: true, cor: '#c9a05a', paleta: 'metal', luz: { tipo: 'teto', int: 1.3, y: 0.25 } }),
  I('lustrearos', 'luz', 'Lustre de aros', 0.70, 0.70, 0.40, 'lustreAros', { teto: true, livre: true, cor: '#2b2b2b', paleta: 'metal', luz: { tipo: 'teto', int: 1.3, y: 0.25 } }),
  I('pendente', 'luz', 'Pendente cúpula', 0.35, 0.35, 0.90, 'pendente', { teto: true, livre: true, cor: '#2b2b2b', paleta: 'metal', luz: { tipo: 'teto', int: 1.0, y: 0.3 } }),
  I('pendente3', 'luz', 'Pendente trio', 0.90, 0.25, 1.00, 'pendenteTrio', { teto: true, livre: true, cor: '#c9a05a', paleta: 'metal', luz: { tipo: 'teto', int: 1.2, y: 0.3 } }),
  I('globo', 'luz', 'Pendente globo', 0.32, 0.32, 0.85, 'pendenteGlobo', { teto: true, livre: true, cor: '#2b2b2b', paleta: 'metal', luz: { tipo: 'teto', int: 1.0, y: 0.3 } }),
  I('arandela', 'luz', 'Arandela', 0.14, 0.12, 0.22, 'arandela', { elev: 1.70, parede: true, livre: true, cor: '#2b2b2b', paleta: 'metal', luz: { tipo: 'parede', int: 0.55, y: 0.5 } }),
  I('abajur', 'luz', 'Abajur', 0.30, 0.30, 0.46, 'abajur', { elev: 0.55, cor: '#e8e3da', paleta: 'tecido', luz: { tipo: 'piso', int: 0.55, y: 0.7 } }),
  I('luminaria', 'luz', 'Luminária de piso', 0.35, 0.35, 1.60, 'luminaria', { cor: '#2b2b2b', paleta: 'metal', luz: { tipo: 'piso', int: 0.9, y: 0.85 } }),
  I('luminariamesa', 'luz', 'Luminária articulada', 0.22, 0.30, 0.45, 'luminariaMesa', { elev: 0.75, cor: '#2b2b2b', paleta: 'metal', luz: { tipo: 'piso', int: 0.5, y: 0.8 } }),
  // Decoração
  I('tapete', 'deco', 'Tapete', 2.00, 1.40, 0.012, 'tapete', { cor: '#c9bfae', paleta: 'tecido', livre: true }),
  I('tapeteredondo', 'deco', 'Tapete redondo', 1.50, 1.50, 0.012, 'tapeteRedondo', { cor: '#7d8461', paleta: 'tecido', livre: true }),
  I('planta', 'deco', 'Planta grande', 0.45, 0.45, 1.30, 'planta', { cor: '#b46a4c' }),
  I('quadro', 'deco', 'Quadro', 0.60, 0.03, 0.80, 'quadro', { elev: 1.25, parede: true, cor: '#d1a54a' }),
  I('espelho', 'deco', 'Espelho de corpo', 0.60, 0.03, 1.60, 'espelho', { elev: 0.15, parede: true, cor: '#2b2b2b' }),
  I('quadrogrande', 'deco', 'Quadro grande', 1.00, 0.04, 0.70, 'quadro', { elev: 1.20, parede: true, cor: '#4f6b5a' }),
  I('quadrotrio', 'deco', 'Trio de quadros', 1.20, 0.03, 0.55, 'quadroTrio', { elev: 1.30, parede: true, cor: '#b46a4c' }),
  I('espelhoredondo', 'deco', 'Espelho redondo', 0.70, 0.03, 0.70, 'espelhoRedondo', { elev: 1.30, parede: true, cor: '#a5774b', paleta: 'madeira' }),
  I('nicho', 'deco', 'Nicho de parede', 0.60, 0.20, 0.30, 'nicho', { elev: 1.40, parede: true, cor: '#f1efea', paleta: 'madeira' }),
  I('puff', 'deco', 'Puff', 0.45, 0.45, 0.40, 'puff', { cor: '#b46a4c', paleta: 'tecido' }),
  I('vasodeco', 'deco', 'Vaso decorativo', 0.30, 0.30, 0.70, 'vasoDeco', { cor: '#e8e3da', paleta: 'madeira' }),
  I('plantapeq', 'deco', 'Planta pequena', 0.25, 0.25, 0.45, 'planta', { cor: '#e8e3da', paleta: 'madeira' }),
  I('cesto', 'deco', 'Cesto de palha', 0.40, 0.40, 0.35, 'cesto', { cor: '#c9a77c', paleta: 'madeira' }),
  I('cortina', 'deco', 'Cortina', 2.00, 0.12, 2.50, 'cortina', { elev: 0.05, parede: true, cor: '#e8e3da', paleta: 'tecido', livre: true }),
  // Meus móveis
  I('caixa', 'meu', 'Móvel sob medida', 1.00, 0.50, 0.80, 'caixa', { cor: '#c9a77c', paleta: 'madeira', personalizado: true }),
];

export const catalogoPorId = Object.fromEntries(CATALOGO.map((c) => [c.id, c]));
