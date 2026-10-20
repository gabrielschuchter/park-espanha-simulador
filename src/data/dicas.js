// Dicas gerais de organização. São pontos de partida, não regras: cada pessoa mora de um jeito.
// As medidas citadas são referências usadas com frequência em projetos residenciais.
// `acao`: botão opcional que leva a uma ferramenta do simulador.

export const DICAS = [
  {
    grupo: 'Antes de começar',
    itens: [
      { t: 'Comece pelo que não muda', p: 'Portas, janelas, pia, tanque e pontos de água costumam definir onde as coisas cabem. Vale marcar onde ficam e só depois posicionar os móveis grandes.' },
      { t: 'Liste o que você já tem', p: 'Cama, sofá, geladeira e máquina de lavar que vão se mudar com você ajudam a testar se o espaço comporta. Use “Móvel sob medida” para colocar as medidas reais de cada um.' },
      { t: 'Imagine uma semana normal', p: 'Pense em quem usa cada cômodo, a que horas e para quê. Uma sala que também é escritório pede outro arranjo que uma sala só de descanso.' },
    ],
  },
  {
    grupo: 'Circulação',
    itens: [
      { t: 'Deixe passagem confortável', p: 'Uma faixa de cerca de 90 cm nos trajetos principais costuma ser confortável. Em trechos curtos, 60 a 70 cm ainda permitem passar, de lado ou com cuidado.', acao: { r: 'Ver uma faixa de 90 cm', k: 'faixa' } },
      { t: 'Considere quem tem mobilidade reduzida', p: 'Uma área livre de cerca de 1,50 m de diâmetro permite girar uma cadeira de rodas. Mesmo que hoje ninguém precise, ela também facilita carregar compras ou mudar móveis de lugar.', acao: { r: 'Ver o giro de 1,50 m', k: 'giro' } },
      { t: 'Teste caminhando', p: 'No modo Passeio dá para andar pelo apartamento na altura dos olhos. Vale percorrer o trajeto da porta de entrada até a cozinha e até o quarto como se estivesse carregando algo.', acao: { r: 'Abrir o passeio', k: 'passeio' } },
    ],
  },
  {
    grupo: 'Sala',
    itens: [
      { t: 'Sofá e TV', p: 'Uma referência comum é sentar a uma distância de 1,5 a 2,5 vezes a diagonal da tela. Em uma TV de 55" (diagonal de 1,40 m), isso dá de 2,1 a 3,5 m. Em salas pequenas, o limite menor costuma funcionar bem.' },
      { t: 'Mesa de centro', p: 'Cerca de 40 a 45 cm entre o sofá e a mesa deixam o café ao alcance sem bater o joelho. Mesas redondas ou com cantos arredondados ajudam onde a passagem é estreita.' },
      { t: 'Um móvel que faz mais de uma coisa', p: 'Sofá-cama, baú com assento, mesa dobrável e nichos na parede ganham espaço em salas pequenas. Teste com “Simular uso” se as portas e gavetas têm onde abrir.' },
    ],
  },
  {
    grupo: 'Cozinha e jantar',
    itens: [
      { t: 'Pia, fogão e geladeira', p: 'Quando os três ficam a poucos passos um do outro, o preparo das refeições costuma render mais. Em cozinhas compactas, uma bancada em L ou em linha resolve bem.' },
      { t: 'Espaço para abrir portas e gavetas', p: 'Geladeira, forno e lava-louças precisam de uma folga à frente, perto de 80 cm. Use “Simular uso” para ver as portas abertas e conferir se algo bate.', acao: { r: 'Abrir tudo', k: 'uso' } },
      { t: 'Mesa e cadeiras', p: 'Entre a borda da mesa e a parede, 75 a 90 cm deixam sentar e levantar sem esforço, e 90 cm ou mais deixam alguém passar atrás da cadeira. Puxe as cadeiras na simulação para ver o espaço real.', acao: { r: 'Puxar cadeiras e sentar pessoas', k: 'sentar' } },
    ],
  },
  {
    grupo: 'Quartos',
    itens: [
      { t: 'Cama e laterais', p: 'Cerca de 50 a 60 cm ao lado da cama permitem arrumá-la e passar. Se a parede for curta, uma lateral encostada e a outra livre ainda funciona.' },
      { t: 'Guarda-roupa', p: 'Porta de correr não precisa de folga à frente, mas deixa só metade do vão aberta por vez. Porta de abrir mostra tudo de uma vez e pede cerca de 50 a 60 cm livres. Escolha pelo que combina melhor com o quarto.' },
    ],
  },
  {
    grupo: 'Luz e conforto',
    itens: [
      { t: 'Luz por camadas', p: 'Uma luz geral no teto somada a pontos de luz mais baixos (abajur, arandela) deixa o ambiente mais agradável à noite do que uma única lâmpada forte. Use o modo Noite para comparar.' },
      { t: 'Cores claras ampliam', p: 'Paredes e piso em tons claros refletem mais luz e costumam fazer o ambiente parecer maior. Um detalhe escuro ou colorido em uma parede só dá personalidade sem pesar.' },
    ],
  },
  {
    grupo: 'Antes de comprar ou encomendar',
    itens: [
      { t: 'Confirme no imóvel', p: 'Este simulador usa as cotas da planta e estimativas para o que não vem nela. Confira as medidas no local antes de fechar qualquer compra, principalmente móveis planejados.' },
      { t: 'Pense na mudança', p: 'Elevador, escada, corredores e portas precisam deixar o móvel passar. Peças grandes e altas, como guarda-roupa e geladeira, às vezes só entram desmontadas ou inclinadas.' },
    ],
  },
];
