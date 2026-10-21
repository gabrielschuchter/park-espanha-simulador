// Confere a escala do modelo: cotas da planta x geometria, vãos, peças e móveis de referência.
import { TIPOLOGIAS, TIPOS_ABERTURA } from '../src/data/tipologias.js';
import { CATALOGO } from '../src/data/catalogo.js';
const linhas = [];
for (const t of TIPOLOGIAS) {
  if (t.pendente) continue;
  for (const [rot, x1, y1, x2, y2] of t.cotas || []) {
    const m = Math.hypot(x2 - x1, y2 - y1), v = parseFloat(rot.replace(',', '.'));
    const dif = Math.round((m - v) * 100);
    linhas.push(`${t.id.padEnd(6)} cota ${rot.padEnd(5)} modelo ${m.toFixed(2)}  dif ${dif >= 0 ? '+' : ''}${dif} cm${Math.abs(dif) >= 2 ? '  <<' : ''}`);
  }
  // cômodos: largura e profundidade do retângulo envolvente
  for (const r of t.rooms) {
    const xs = r.poly.map((p) => p[0]), ys = r.poly.map((p) => p[1]);
    linhas.push(`${t.id.padEnd(6)} cômodo ${r.nome.padEnd(20)} ${(Math.max(...xs) - Math.min(...xs)).toFixed(2)} × ${(Math.max(...ys) - Math.min(...ys)).toFixed(2)} m`);
  }
}
console.log(linhas.join('\n'));
console.log('\nVãos adotados:');
for (const [k, v] of Object.entries(TIPOS_ABERTURA)) console.log(`  ${k} ${v.nome}: ${v.largura} × ${v.altura}${v.peitoril != null ? ' peitoril ' + v.peitoril : ''} (${v.src})`);
const ref = ['camacasal', 'camasolteiro', 'sofa3', 'geladeira', 'fogao', 'jantar4', 'grcorrer', 'lavar', 'tv55', 'criado', 'rack'];
console.log('\nMóveis de referência (largura × profundidade × altura, cm):');
for (const id of ref) { const c = CATALOGO.find((x) => x.id === id); if (c) console.log(`  ${c.nome.padEnd(28)} ${Math.round(c.w * 100)} × ${Math.round(c.d * 100)} × ${Math.round(c.h * 100)}`); }
