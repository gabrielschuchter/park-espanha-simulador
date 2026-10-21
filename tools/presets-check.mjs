import { TIPOLOGIAS } from '../src/data/tipologias.js';
import { preparePlan } from '../src/geom.js';
import { itensSugeridos } from '../src/store.js';
import { ACAB_VAZIO } from '../src/data/acabamentos.js';
import { analisar, circulacao } from '../src/analysis.js';
import { TEMAS } from '../src/data/estilos.js';
import { estilizar, trabalhosDoTema } from '../src/presets.js';
const verbose = process.argv.includes('-v');
for (const tip of TIPOLOGIAS.filter((t) => !t.pendente)) {
  const plan = preparePlan(tip);
  const base = itensSugeridos(tip.id);
  const a0 = analisar(plan, base).filter((a) => a.nivel !== 'info').length;
  console.log(`\n== ${tip.nome}: base ${base.length} itens, ${a0} alertas`);
  for (const tema of TEMAS) {
    const proj = { itens: JSON.parse(JSON.stringify(base)), acab: ACAB_VAZIO(), fix: {}, paredes: {} };
    const rel = estilizar(plan, proj, trabalhosDoTema(plan, tema), { aberturas: tema.aberturas });
    const al = analisar(plan, proj.itens).filter((a) => a.nivel !== 'info');
    const c = circulacao(plan, proj.itens), c0 = circulacao(plan, base);
    const reg = c.bloqueios.length > c0.bloqueios.length || c.semGiro.length > c0.semGiro.length;
    console.log(`${tema.id.padEnd(14)} +${String(rel.adicionados).padStart(2)} ~${String(rel.trocados).padStart(2)} -${rel.removidos} descartes ${String(rel.descartes.length).padStart(2)} alertas ${al.length}${al.length > a0 ? ' <<<' : ''}${reg ? ' CIRC<<<' : ''}`);
    if (verbose) { for (const a of al) console.log('    !', a.nivel, a.msg); if (reg) console.log('    circ', c.bloqueios.map((b) => b.rotulo), c.semGiro.length); const g = {}; for (const d of rel.descartes) (g[d.tipo + ': ' + d.motivo] = (g[d.tipo + ': ' + d.motivo] || 0) + 1); console.log('   ', JSON.stringify(g)); }
  }
}
