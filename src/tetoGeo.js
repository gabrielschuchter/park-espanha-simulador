// Geometria do forro sem dependência do Three.js (usada também pela interface).
import { bordasComodo, pointInPoly, polyArea } from './geom.js';
import { tetoPorId, tetoDe } from './data/acabamentos.js';

export const cache = new WeakMap();

// Desloca cada borda para dentro de d[i] (miter nos vértices)
function deslocar(poly, bordas, d) {
  const n = poly.length, out = [];
  for (let i = 0; i < n; i++) {
    const e0 = bordas[(i - 1 + n) % n], e1 = bordas[i];
    const d0 = d[(i - 1 + n) % n], d1 = d[i];
    const det = e0.nx * e1.ny - e0.ny * e1.nx;
    if (Math.abs(det) < 1e-6) { out.push([poly[i][0] + e1.nx * Math.max(d0, d1), poly[i][1] + e1.ny * Math.max(d0, d1)]); continue; }
    const dx = (d0 * e1.ny - e0.ny * d1) / det, dy = (e0.nx * d1 - d0 * e1.nx) / det;
    out.push([poly[i][0] + dx, poly[i][1] + dy]);
  }
  return out;
}

export function geomForro(plan, room, cfg) {
  if (!cache.has(plan)) cache.set(plan, new Map());
  const mapa = cache.get(plan);
  const chave = `${room.id}|${cfg.tipo}|${cfg.drop}`;
  if (mapa.has(chave)) return mapa.get(chave);
  const H = plan.tip.peDireito, def = tetoPorId[cfg.tipo] || tetoPorId.laje;
  const g = { tipo: cfg.tipo, drop: cfg.drop, H, inner: null, dists: null, bordas: null, faixa: 0 };
  if (cfg.tipo === 'sanca' || cfg.tipo === 'moldura') {
    const bordas = bordasComodo(plan, room);
    const xs = room.poly.map((p) => p[0]), ys = room.poly.map((p) => p[1]);
    const menor = Math.min(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
    const faixa = Math.min(def.faixa, menor * 0.28);
    const dists = bordas.map((b) => (b.parede && !b.curta ? faixa : 0));
    const inner = deslocar(room.poly, bordas, dists);
    if (faixa > 0.05 && polyArea(inner) > 0.25 * polyArea(room.poly) && dists.some((v) => v > 0)) { g.inner = inner; g.dists = dists; g.bordas = bordas; g.faixa = faixa; }
  }
  mapa.set(chave, g);
  return g;
}

// Altura da face inferior do forro no ponto (x, y)
export function tetoY(plan, acab, x, y) {
  const room = plan.rooms.find((r) => pointInPoly(x, y, r.poly));
  const H = plan.tip.peDireito;
  if (!room) return H;
  const cfg = tetoDe(acab, room);
  if (cfg.tipo === 'laje') return H;
  if (cfg.tipo === 'gesso') return H - cfg.drop;
  const g = geomForro(plan, room, cfg);
  if (!g.inner) return H - (cfg.tipo === 'sanca' ? cfg.drop : cfg.drop);
  const dentro = pointInPoly(x, y, g.inner);
  if (cfg.tipo === 'sanca') return dentro ? H - cfg.drop : H;
  return dentro ? H : H - cfg.drop;
}
// Menor altura do forro do cômodo (usada para tabicas entre ambientes integrados)
export function tetoMin(plan, acab, room) {
  const cfg = tetoDe(acab, room), H = plan.tip.peDireito;
  return cfg.tipo === 'laje' ? H : H - cfg.drop;
}

