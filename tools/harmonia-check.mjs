// Aplica cada estilo em cada planta e lista tudo o que a auditoria estrita (src/harmonia.js) reprova.
// node tools/harmonia-check.mjs [-v] [--svg] [tema]
import { writeFileSync, mkdirSync } from 'node:fs';
import { TIPOLOGIAS } from '../src/data/tipologias.js';
import { preparePlan, rectCorners } from '../src/geom.js';
import { itensSugeridos } from '../src/store.js';
import { ACAB_VAZIO } from '../src/data/acabamentos.js';
import { TEMAS } from '../src/data/estilos.js';
import { estilizar, trabalhosDoTema } from '../src/presets.js';
import { problemas, ehTeto, ehParede, ehTapete } from '../src/harmonia.js';
import { analisar, circulacao } from '../src/analysis.js';
const args = process.argv.slice(2);
const verbose = args.includes('-v'), svg = args.includes('--svg');
const so = args.filter((a) => !a.startsWith('-'));
let total = 0;
mkdirSync('tools/plantas', { recursive: true });
function desenhar(plan, itens, probs, nome) {
  const bb = plan.bb, S = 90, pad = 0.4;
  const W = (bb.x1 - bb.x0 + 2 * pad) * S, H = (bb.y1 - bb.y0 + 2 * pad) * S;
  const T = ([x, y]) => `${((x - bb.x0 + pad) * S).toFixed(1)},${((y - bb.y0 + pad) * S).toFixed(1)}`;
  const poly = (pts, st) => `<polygon points="${pts.map(T).join(' ')}" ${st}/>`;
  const ruins = new Set(probs.map((p) => p.uid));
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" font-family="sans-serif"><rect width="100%" height="100%" fill="#fff"/>`;
  for (const r of plan.rooms) s += poly(r.poly, 'fill="#f4f1ea" stroke="#ddd"');
  for (const p of plan.pieces) s += poly(p.poly, p.verga ? 'fill="#bbb"' : p.sob ? 'fill="#8cc"' : 'fill="#333"');
  for (const o of plan.openings) if (o.sweep) s += poly(o.sweep, 'fill="none" stroke="#c96" stroke-dasharray="3 2"');
  for (const f of plan.fixos) s += poly(f.poly, 'fill="#cde" stroke="#68a"');
  const ordem = [...itens].sort((a, b) => (ehTapete(a) ? -1 : 0) - (ehTapete(b) ? -1 : 0) || a.elev - b.elev);
  for (const it of ordem) {
    const cor = ruins.has(it.uid) ? '#e33' : ehTeto(it) ? '#fc3' : ehParede(it) ? '#39f' : ehTapete(it) ? '#dcc8a8' : it.__base ? '#999' : '#3a3';
    s += poly(rectCorners(it), `fill="${cor}" fill-opacity="${ehTeto(it) ? 0.35 : 0.55}" stroke="${cor}"`);
    const [x, y] = T([it.x, it.y]).split(',');
    s += `<text x="${x}" y="${y}" font-size="9" text-anchor="middle" fill="#000">${it.tipo}</text>`;
  }
  s += '</svg>';
  writeFileSync(`tools/plantas/${nome}.svg`, s);
}
for (const tip of TIPOLOGIAS.filter((t) => !t.pendente)) {
  const plan = preparePlan(tip);
  const base = itensSugeridos(tip.id).map((i) => ({ ...i, __base: true }));
  const pb = problemas(plan, base, ACAB_VAZIO());
  console.log(`\n== ${tip.nome}: base ${base.length} itens, ${pb.length} problemas na base`);
  if (verbose) for (const p of pb) console.log('   base:', p.tipo, '-', p.msg);
  for (const tema of TEMAS) {
    if (so.length && !so.includes(tema.id)) continue;
    const proj = { itens: JSON.parse(JSON.stringify(base)), acab: ACAB_VAZIO(), fix: {}, paredes: {} };
    const rel = estilizar(plan, proj, trabalhosDoTema(plan, tema, null, proj.itens), { aberturas: tema.aberturas });
    const pr = problemas(plan, proj.itens, proj.acab);
    const al = analisar(plan, proj.itens).filter((a) => a.nivel !== 'info');
    const c = circulacao(plan, proj.itens), c0 = circulacao(plan, base);
    const reg = c.bloqueios.length > c0.bloqueios.length || c.semGiro.length > c0.semGiro.length;
    total += pr.length + al.length + (reg ? 1 : 0);
    console.log(`${tema.id.padEnd(14)} itens ${String(proj.itens.length).padStart(2)} (+${rel.adicionados}) problemas ${pr.length} avisos ${al.length}${reg ? ' CIRC' : ''}`);
    if (verbose) { const g = {}; for (const p of pr) { const k = p.tipo + ': ' + p.msg; g[k] = (g[k] || 0) + 1; } for (const [k, n] of Object.entries(g)) console.log('    ', n > 1 ? n + '×' : '  ', k); for (const a of al) console.log('     !', a.msg); }
    if (svg) desenhar(plan, proj.itens, pr, `${tip.id}-${tema.id}`);
  }
}
console.log('\nTOTAL', total);
