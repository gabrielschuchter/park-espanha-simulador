import { TIPOLOGIAS } from '../src/data/tipologias.js';
import { preparePlan } from '../src/geom.js';
import { itensSugeridos } from '../src/store.js';
import { analisar, circulacao, distancias } from '../src/analysis.js';
for (const t of TIPOLOGIAS.filter(t=>!t.pendente)) {
  const p = preparePlan(t); const it = itensSugeridos(t.id);
  const t0=performance.now(); const a = analisar(p, it); const c = circulacao(p, it); const ms=performance.now()-t0;
  console.log(`\n== ${t.nome}: ${it.length} itens, ${a.length} alertas, ${ms.toFixed(1)} ms, grade ${c.W}x${c.H}`);
  for (const x of a) console.log(' ', x.nivel, '-', x.msg);
  console.log('  bloqueios:', c.bloqueios.map(b=>b.rotulo));
  const cama = it.find(i=>i.tipo.startsWith('cama'));
  console.log('  distâncias', cama.nome, distancias(p,it,cama).map(d=>`${d.lx},${d.ly}:${(d.dist*100).toFixed(0)}cm`).join(' '));
}
