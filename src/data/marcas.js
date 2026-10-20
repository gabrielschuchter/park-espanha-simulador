// Cores de tinta de marcas brasileiras e internacionais vendidas no Brasil.
//
// Como os valores foram obtidos (consulta em 20/10/2026):
//  - Suvinil: valores RGB e códigos publicados na página oficial de cada cor em suvinil.com.br/cores/<nome>.
//    O hex é a conversão direta do RGB, sem ajuste. A lista parte das cores que a própria marca destaca como
//    mais vendidas e das Cores do Ano; "vendida" quer dizer "a marca ou o varejo a cita entre as mais vendidas",
//    não é ranking auditado.
//  - Sherwin-Williams: código SW e hex do banco paintdb.com, que republica os dados da marca. Os nomes estão em inglês
//    (nome internacional); o catálogo brasileiro usa os mesmos códigos SW com nomes próprios, que não consegui confirmar.
//  - Coral e demais marcas: não incluídas, porque não encontrei fonte oficial com RGB acessível. Use "Cor própria"
//    para digitar o hex de qualquer cor.
//
// Aviso importante: tela não reproduz tinta. Brilho, temperatura da luz do ambiente, textura e a base da tinta mudam a cor
// real. Confira sempre no leque físico ou numa amostra aplicada na parede antes de comprar.

export const MARCAS = [
  { id: 'suvinil', nome: 'Suvinil' },
  { id: 'sw', nome: 'Sherwin-Williams' },
];

const hex2 = (n) => n.toString(16).padStart(2, '0');
const toHex = (r, g, b) => `#${hex2(r)}${hex2(g)}${hex2(b)}`;

// [marca, nome, código, [r,g,b], família, nota]
// nota: 'vendida' = citada como das mais vendidas; 'ano23', 'ano24', 'ano25', 'ano26' = cor do ano da marca
const BRUTO = [
  // Brancos
  ['suvinil', 'Branco Neve', 'RM181', [253, 255, 248], 'Brancos', 'vendida'],
  ['sw', 'Pure White', 'SW 7005', [237, 236, 230], 'Brancos', ''],
  ['sw', 'Alabaster', 'SW 7008', [237, 234, 224], 'Brancos', ''],
  ['suvinil', 'Rosa Pastel', 'B528', [242, 229, 226], 'Brancos', 'vendida'],
  // Beges e neutros claros
  ['suvinil', 'Algodão Egípcio', 'F100', [234, 227, 213], 'Beges e neutros', 'vendida'],
  ['suvinil', 'Pergaminho Egípcio', 'R509', [233, 220, 201], 'Beges e neutros', ''],
  ['suvinil', 'Trigo', 'R534', [236, 220, 196], 'Beges e neutros', ''],
  ['suvinil', 'Papel Picado', 'B148', [216, 211, 202], 'Beges e neutros', 'vendida'],
  ['suvinil', 'Crômio', 'B161', [209, 208, 202], 'Beges e neutros', 'vendida'],
  ['suvinil', 'Broto de Feijão', 'B165', [208, 202, 193], 'Beges e neutros', 'vendida'],
  ['suvinil', 'Calopsita', 'A014', [219, 218, 215], 'Beges e neutros', 'vendida'],
  ['suvinil', 'Ouro Branco', 'A162', [218, 216, 208], 'Beges e neutros', 'vendida'],
  ['suvinil', 'Camurça', 'RM005', [204, 185, 151], 'Beges e neutros', ''],
  ['suvinil', 'Areia da Barra', 'A272', [245, 223, 206], 'Beges e neutros', ''],
  ['sw', 'Agreeable Gray', 'SW 7029', [209, 203, 193], 'Beges e neutros', ''],
  ['sw', 'Accessible Beige', 'SW 7036', [209, 199, 184], 'Beges e neutros', ''],
  ['sw', 'Worldly Gray', 'SW 7043', [206, 198, 187], 'Beges e neutros', ''],
  ['sw', 'Universal Khaki', 'SW 6150', [184, 169, 146], 'Beges e neutros', 'ano26'],
  // Cinzas
  ['sw', 'Repose Gray', 'SW 7015', [204, 201, 192], 'Cinzas', ''],
  ['suvinil', 'Banho de Platina', 'N504', [191, 192, 190], 'Cinzas', 'vendida'],
  ['suvinil', 'Elefante', 'D161', [162, 162, 157], 'Cinzas', 'vendida'],
  ['suvinil', 'Cinza Tecnológico', 'N510', [125, 125, 124], 'Cinzas', 'vendida'],
  ['suvinil', 'Tempestade', 'D177', [192, 175, 173], 'Cinzas', 'ano26'],
  ['suvinil', 'Conforto', 'C395', [163, 174, 176], 'Cinzas', 'ano24'],
  ['suvinil', 'Mantra', 'C767', [150, 168, 167], 'Cinzas', 'vendida'],
  // Amarelos e laranjas
  ['suvinil', 'Luz de Inverno', 'A031', [238, 233, 201], 'Amarelos e laranjas', 'vendida'],
  ['suvinil', 'Despertar', 'A610', [248, 235, 187], 'Amarelos e laranjas', 'ano25'],
  ['suvinil', 'Amarelo Real', 'D611', [249, 212, 40], 'Amarelos e laranjas', 'vendida'],
  ['suvinil', 'Sol Nascente', 'E606', [254, 176, 0], 'Amarelos e laranjas', ''],
  ['suvinil', 'Vitamina de Papaia', 'E596', [239, 138, 78], 'Amarelos e laranjas', 'vendida'],
  ['suvinil', 'Calcita Alaranjada', 'Y010', [201, 139, 90], 'Amarelos e laranjas', 'ano23'],
  ['suvinil', 'Peixe Palhaço', 'P587', [228, 114, 61], 'Amarelos e laranjas', ''],
  // Vermelhos e rosas
  ['suvinil', 'Meia-luz', 'D237', [197, 167, 172], 'Vermelhos e rosas', 'vendida'],
  ['suvinil', 'Maravilha', 'P227', [205, 101, 159], 'Vermelhos e rosas', 'vendida'],
  ['suvinil', 'Valentino', 'R581', [198, 38, 45], 'Vermelhos e rosas', 'vendida'],
  ['suvinil', 'Batom de Cereja', 'R104', [145, 67, 86], 'Vermelhos e rosas', ''],
  // Roxos
  ['suvinil', 'Brisa Sublime', 'B681', [207, 198, 229], 'Roxos', ''],
  ['suvinil', 'Flor-de-gerânio', 'D354', [198, 163, 213], 'Roxos', 'vendida'],
  // Azuis
  ['suvinil', 'Azul-bebê', 'B334', [183, 213, 229], 'Azuis', ''],
  ['suvinil', 'Ilhas Gregas', 'C659', [117, 188, 225], 'Azuis', 'vendida'],
  ['suvinil', 'Sossego Noturno', 'D085', [150, 157, 186], 'Azuis', 'ano25'],
  ['suvinil', 'Sino da Igreja', 'E336', [97, 114, 126], 'Azuis', ''],
  ['suvinil', 'Azul-marinho', 'R076', [60, 72, 92], 'Azuis', 'vendida'],
  ['sw', 'Naval', 'SW 6244', [47, 61, 76], 'Azuis', ''],
  // Verdes
  ['suvinil', 'Verde-lavado', 'B055', [217, 225, 206], 'Verdes', 'vendida'],
  ['sw', 'Sea Salt', 'SW 6204', [205, 210, 202], 'Verdes', ''],
  ['suvinil', 'Água de Degelo', 'A064', [200, 224, 217], 'Verdes', ''],
  ['suvinil', 'Brisa da Montanha', 'D060', [165, 203, 199], 'Verdes', ''],
  ['suvinil', 'Folha de Gerânio', 'N808', [139, 195, 106], 'Verdes', ''],
  ['suvinil', 'Verde-trevo', 'D049', [101, 180, 117], 'Verdes', 'vendida'],
  ['suvinil', 'Eclipse', 'P290', [173, 158, 87], 'Verdes', ''],
  ['suvinil', 'Cipó da Amazônia', 'N879', [118, 119, 69], 'Verdes', 'ano26'],
  ['suvinil', 'Lugar Distante', 'N880', [94, 106, 95], 'Verdes', ''],
  ['suvinil', 'Figueira', 'R145', [99, 100, 81], 'Verdes', ''],
  ['suvinil', 'Doce de Figo', 'R727', [85, 79, 49], 'Verdes', ''],
  // Marrons e escuros
  ['suvinil', 'Açúcar Queimado', 'R274', [149, 105, 61], 'Marrons e escuros', ''],
  ['suvinil', 'Marrom-luxo', 'R368', [101, 69, 64], 'Marrons e escuros', 'ano25'],
  ['sw', 'Iron Ore', 'SW 7069', [67, 67, 65], 'Marrons e escuros', ''],
  ['suvinil', 'Preto Absoluto', 'R756', [40, 41, 43], 'Marrons e escuros', ''],
  ['sw', 'Tricorn Black', 'SW 6258', [47, 47, 48], 'Marrons e escuros', ''],
];

export const FAMILIAS = ['Brancos', 'Beges e neutros', 'Cinzas', 'Amarelos e laranjas', 'Vermelhos e rosas', 'Roxos', 'Azuis', 'Verdes', 'Marrons e escuros'];

export const NOTAS = {
  vendida: 'Entre as mais vendidas, segundo a marca ou o varejo',
  ano23: 'Cor do Ano 2023', ano24: 'Cor do Ano 2024', ano25: 'Cor do Ano 2025 (tendência)', ano26: 'Cor do Ano 2026',
};

export const CORES_MARCA = BRUTO.map(([marca, nome, codigo, rgb, familia, nota]) => ({
  id: `${marca}-${codigo.replace(/\s+/g, '').toLowerCase()}`,
  marca, nome, codigo, rgb, hex: toHex(...rgb), familia, nota,
  rotulo: `${MARCAS.find((m) => m.id === marca).nome} ${nome} (${codigo})`,
}));

export const corMarcaPorHex = (hex) => CORES_MARCA.find((c) => c.hex.toLowerCase() === String(hex).toLowerCase()) || null;
