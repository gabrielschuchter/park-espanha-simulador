// Move <title> e metadados para o início do HTML gerado (lidos nos primeiros bytes).
import fs from 'fs';
const f = 'dist/index.html';
let h = fs.readFileSync(f, 'utf8');
const pegar = (re) => { const m = h.match(re); if (m) h = h.replace(m[0], ''); return m ? m[0] : ''; };
const topo = [
  pegar(/<title>[\s\S]*?<\/title>/),
  pegar(/<meta name="claude:viewport-fit-sides"[^>]*>/),
  pegar(/<meta name="viewport"[^>]*>/),
  pegar(/<meta name="description"[^>]*>/),
].filter(Boolean).join('\n');
fs.writeFileSync(f, topo + '\n' + h);
console.log('postbuild ok:', topo.split('\n').length, 'tags no topo');
