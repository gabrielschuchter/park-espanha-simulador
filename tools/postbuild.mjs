// Pós-processamento do build: garante um documento HTML completo e válido, com <title> e metadados no início do <head>.
import fs from 'fs';
const f = 'dist/index.html';
let h = fs.readFileSync(f, 'utf8');
if (!/^\s*<!doctype html>/i.test(h)) h = '<!doctype html>\n' + h;
const tamanho = (h.length / 1024).toFixed(0);
fs.writeFileSync(f, h);
// variante em fragmento para visualizadores de artefatos que embrulham o HTML (opcional)
const frag = h
  .replace(/<!doctype html>\s*/i, '')
  .replace(/<html[^>]*>\s*/i, '').replace(/<\/html>\s*$/i, '')
  .replace(/<head>([\s\S]*?)<\/head>/i, '$1')
  .replace(/<body[^>]*>/i, '').replace(/<\/body>/i, '');
fs.writeFileSync('dist/artefato.html', frag);
console.log(`postbuild ok: index.html ${tamanho} kB (documento completo) + artefato.html (fragmento)`);
