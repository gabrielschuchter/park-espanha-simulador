// Desenho estático da planta (miniaturas da tela inicial e exportação em SVG/PNG).
import { wallPoint } from '../geom.js';
import { catalogoPorId } from '../data/catalogo.js';
import { pisoDe } from '../data/acabamentos.js';
import { simboloItem } from '../plan2d.js';
import { esc } from './util.js';

const f = (v) => v.toFixed(3);
const ABREV = { 'Serviço + varanda': 'Serv. + varanda', 'Cozinha + jantar': 'Coz. + jantar' };

export const ESTILO_EXPORT = `
.mv-body{fill:color-mix(in srgb,var(--mv) 42%,#fbfbfa);stroke:#1b2221;stroke-width:.012px}
.mv-light{fill:color-mix(in srgb,var(--mv) 18%,#fbfbfa);stroke:#1b2221;stroke-width:.01px}
.mv-cor{fill:color-mix(in srgb,var(--mv) 70%,#fbfbfa)}
.mv-dark{fill:color-mix(in srgb,var(--mv) 60%,#1b2221);stroke:#1b2221;stroke-width:.01px}
.mv-line{fill:none;stroke:#1b2221;stroke-width:.01px}.mv-line.fina{stroke-width:.005px;opacity:.55}.mv-line.cortina{stroke:color-mix(in srgb,var(--mv) 60%,#1b2221);stroke-width:.02px}
.mv-tapete{fill:color-mix(in srgb,var(--mv) 30%,#fbfbfa);stroke:#39423f;stroke-width:.008px;stroke-dasharray:.03 .04}
.mv-folha{fill:color-mix(in srgb,#5f7d45 55%,#fbfbfa);stroke:#1b2221;stroke-width:.005px}
.mv-luz{fill:color-mix(in srgb,#f4c95d 55%,#fbfbfa);stroke:#1b2221;stroke-width:.01px}
.tracejado{stroke-dasharray:.06 .04}
.wall{fill:#2c3533}.wall.guarda{fill:none;stroke:#2c3533;stroke-width:.03px}.wall.sob{opacity:.55}
.rn{font:700 .15px 'Arial Narrow',Arial,sans-serif;fill:#39423f;letter-spacing:.01px;paint-order:stroke;stroke:#fff;stroke-width:.04px}
.ra{font:.11px ui-monospace,Menlo,monospace;fill:#5f6a67;paint-order:stroke;stroke:#fff;stroke-width:.04px}
.tt{font:700 .28px 'Arial Narrow',Arial,sans-serif;fill:#1b2221}.ts{font:.14px ui-monospace,Menlo,monospace;fill:#5f6a67}
.jn{stroke:#2c3533;stroke-width:.012px}.pa{fill:none;stroke:#8a9490;stroke-width:.01px;stroke-dasharray:.04 .04}.pf{stroke:#1b2221;stroke-width:.025px}`;

export function plantaSVG(plan, proj, { nomes = false, pad = 0.4, completo = false, titulo = '', subtitulo = '', classe = 'mini' } = {}) {
  const { x0, y0, x1, y1 } = plan.bb;
  const topo = completo ? 0.85 : 0;
  const w = x1 - x0 + pad * 2, h = y1 - y0 + pad * 2 + topo;
  const T = (x, y) => `${f(x - x0 + pad)},${f(y - y0 + pad + topo)}`;
  const pts = (P) => P.map(([x, y]) => T(x, y)).join(' ');
  let s = `<svg xmlns="http://www.w3.org/2000/svg" class="${classe}" viewBox="0 0 ${f(w)} ${f(h)}" role="img" aria-label="Planta ${esc(plan.tip.nome)}">`;
  if (completo) s += `<style>${ESTILO_EXPORT}</style><rect width="100%" height="100%" fill="#ffffff"/>`;
  if (completo) s += `<text class="tt" x="${f(pad)}" y="${f(0.38)}">${esc(titulo)}</text><text class="ts" x="${f(pad)}" y="${f(0.62)}">${esc(subtitulo)}</text>`;
  for (const r of plan.rooms) s += `<polygon points="${pts(r.poly)}" style="fill:${pisoDe(proj?.acab, r).cor2d}" stroke="none" />`;
  const g0 = `<g transform="translate(${f(pad - x0)} ${f(pad - y0 + topo)})">`;
  if (completo) {
    s += g0;
    for (const o of plan.openings) {
      const wl = o.w, half = wl.t / 2;
      if (!o.porta) {
        for (const k of [-half, 0, half]) { const a = wallPoint(wl, o.s0, k), b = wallPoint(wl, o.s1, k); s += `<line class="jn" x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" />`; }
      } else if (!o.correr) {
        const sweep = o.arc.da > 0 ? 1 : 0;
        s += `<path class="pa" d="M${f(o.closed[0])} ${f(o.closed[1])} A${f(o.largura)} ${f(o.largura)} 0 0 ${sweep} ${f(o.open[0])} ${f(o.open[1])}" /><line class="pf" x1="${f(o.hinge[0])}" y1="${f(o.hinge[1])}" x2="${f(o.open[0])}" y2="${f(o.open[1])}" />`;
      }
    }
    s += '</g>';
  }
  const itens = [...(proj?.itens || [])].sort((a, b) => (catalogoPorId[a.tipo]?.livre ? -1 : 0) - (catalogoPorId[b.tipo]?.livre ? -1 : 0) || (a.elev || 0) - (b.elev || 0));
  for (const it of itens) {
    s += `<g transform="translate(${T(it.x, it.y).replace(',', ' ')}) rotate(${f(it.rot || 0)})" style="--mv:${it.cor}">${simboloItem(it)}</g>`;
  }
  for (const pc of plan.pieces) if (!pc.verga) s += `<polygon points="${pts(pc.poly)}" class="wall${pc.sob ? ' sob' : ''}${pc.w.guarda ? ' guarda' : ''}" />`;
  if (nomes) {
    for (const r of plan.rooms) {
      if (r.id === 'circ' && plan.tip.id === 'ponta') continue;
      const [cx, cy] = r.centro;
      s += `<text class="rn" text-anchor="middle" x="${f(cx - x0 + pad)}" y="${f(cy - y0 + pad + topo)}">${esc(ABREV[r.nome] || r.nome)}</text><text class="ra" text-anchor="middle" x="${f(cx - x0 + pad)}" y="${f(cy - y0 + pad + topo + 0.16)}">${r.area.toFixed(2).replace('.', ',')} m²</text>`;
    }
  }
  return s + '</svg>';
}

export async function svgParaPng(svg, largura = 2400) {
  const m = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const ar = +m[2] / +m[1];
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise((ok, no) => { img.onload = ok; img.onerror = () => no(new Error('svg')); img.src = url; });
    const c = document.createElement('canvas'); c.width = largura; c.height = Math.round(largura * ar);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    g.drawImage(img, 0, 0, c.width, c.height);
    return await new Promise((ok) => c.toBlob(ok, 'image/png'));
  } finally { URL.revokeObjectURL(url); }
}
