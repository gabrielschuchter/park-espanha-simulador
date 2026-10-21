// Geometria 2D da planta. Unidades em metros, y para baixo.
import { TIPOS_ABERTURA } from './data/tipologias.js';

export const EPS = 1e-6;
export const deg = (r) => (r * 180) / Math.PI;
export const rad = (d) => (d * Math.PI) / 180;

export function rotPt(x, y, ang) {
  const c = Math.cos(ang), s = Math.sin(ang);
  return [x * c - y * s, x * s + y * c];
}

// Retângulo orientado de um item {x,y,w,d,rot}. Frente do item = +y local.
export function rectCorners(it, pad = 0) {
  const hw = it.w / 2 + pad, hd = it.d / 2 + pad, a = rad(it.rot || 0);
  return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([x, y]) => {
    const [rx, ry] = rotPt(x, y, a);
    return [it.x + rx, it.y + ry];
  });
}

// Converte ponto local (relativo ao centro, eixos do item) em coordenada de planta
export function localToPlan(it, lx, ly) {
  const [rx, ry] = rotPt(lx, ly, rad(it.rot || 0));
  return [it.x + rx, it.y + ry];
}
export function planToLocal(it, px, py) {
  return rotPt(px - it.x, py - it.y, -rad(it.rot || 0));
}

export function polyArea(p) {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}
export function polyCentroid(p) {
  let cx = 0, cy = 0, a = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i], [x2, y2] = p[(i + 1) % p.length];
    const f = x1 * y2 - x2 * y1;
    a += f; cx += (x1 + x2) * f; cy += (y1 + y2) * f;
  }
  a *= 0.5;
  return [cx / (6 * a), cy / (6 * a)];
}
export function pointInPoly(x, y, p) {
  let inside = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
    const [xi, yi] = p[i], [xj, yj] = p[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
export function bbox(points) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of points) {
    if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y;
  }
  return { x0, y0, x1, y1 };
}

// SAT para polígonos convexos. Retorna profundidade de penetração (>0 se sobrepõe)
export function convexOverlap(A, B) {
  let min = Infinity;
  for (const P of [A, B]) {
    for (let i = 0; i < P.length; i++) {
      const [x1, y1] = P[i], [x2, y2] = P[(i + 1) % P.length];
      let nx = y1 - y2, ny = x2 - x1;
      const l = Math.hypot(nx, ny); if (l < EPS) continue;
      nx /= l; ny /= l;
      let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
      for (const [x, y] of A) { const v = x * nx + y * ny; if (v < a0) a0 = v; if (v > a1) a1 = v; }
      for (const [x, y] of B) { const v = x * nx + y * ny; if (v < b0) b0 = v; if (v > b1) b1 = v; }
      const o = Math.min(a1, b1) - Math.max(a0, b0);
      if (o <= 0) return 0;
      if (o < min) min = o;
    }
  }
  return min;
}

// ---------------------------------------------------------------- paredes
export function wallInfo(w) {
  const dx = w.b[0] - w.a[0], dy = w.b[1] - w.a[1];
  const len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  return { len, ux, uy, nx: -uy, ny: ux, ang: Math.atan2(dy, dx) };
}
export function wallPoint(w, s, off = 0) {
  const i = wallInfo(w);
  return [w.a[0] + i.ux * s + i.nx * off, w.a[1] + i.uy * s + i.ny * off];
}
// Polígono de um trecho [s0,s1] da parede
export function wallSpanPoly(w, s0, s1, extra = 0) {
  const h = w.t / 2 + extra;
  return [wallPoint(w, s0, -h), wallPoint(w, s1, -h), wallPoint(w, s1, h), wallPoint(w, s0, h)];
}

export function openingSpec(o) {
  const base = TIPOS_ABERTURA[o.tipo] || {};
  return {
    largura: o.largura ?? base.largura,
    altura: o.altura ?? base.altura ?? 2.1,
    peitoril: o.peitoril ?? base.peitoril ?? 0,
    nome: base.nome,
    porta: o.tipo.startsWith('P'),
    src: o.src || base.src || 'est',
  };
}

// Prepara a planta: índices, trechos sólidos e aberturas resolvidas
export function preparePlan(tip) {
  const wallsById = Object.fromEntries(tip.walls.map((w) => [w.id, w]));
  const openings = tip.openings.map((o) => {
    const w = wallsById[o.wall];
    const sp = openingSpec(o);
    const wi = wallInfo(w);
    const s0 = o.de, s1 = o.de + sp.largura;
    const o2 = { ...o, ...sp, w, wi, s0, s1 };
    o2.centro = wallPoint(w, (s0 + s1) / 2);
    o2.poly = wallSpanPoly(w, s0, s1, 0.002);
    if (sp.porta && !o.correr) {
      const hingeS = o.dobradica === 'a' ? s0 : s1;
      const freeS = o.dobradica === 'a' ? s1 : s0;
      const side = (o.abre || 1) * (w.t / 2);
      o2.hinge = wallPoint(w, hingeS, side);
      o2.closed = wallPoint(w, freeS, side);
      // folha aberta a 90°, perpendicular à parede
      o2.open = [o2.hinge[0] + wi.nx * (o.abre || 1) * sp.largura, o2.hinge[1] + wi.ny * (o.abre || 1) * sp.largura];
      // setor de giro (polígono)
      const a0 = Math.atan2(o2.closed[1] - o2.hinge[1], o2.closed[0] - o2.hinge[0]);
      const a1 = Math.atan2(o2.open[1] - o2.hinge[1], o2.open[0] - o2.hinge[0]);
      let da = a1 - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
      const pts = [o2.hinge];
      for (let k = 0; k <= 12; k++) {
        const a = a0 + (da * k) / 12;
        pts.push([o2.hinge[0] + Math.cos(a) * sp.largura, o2.hinge[1] + Math.sin(a) * sp.largura]);
      }
      o2.sweep = pts;
      o2.arc = { a0, da };
    }
    if (o.correr) {
      // faixa livre de 50 cm de cada lado do vão de correr
      o2.sweep = [wallPoint(w, s0, -0.55), wallPoint(w, s1, -0.55), wallPoint(w, s1, 0.55), wallPoint(w, s0, 0.55)];
    }
    // pontos de acesso de cada lado (para a análise de circulação)
    o2.lados = [wallPoint(w, (s0 + s1) / 2, -(w.t / 2 + 0.35)), wallPoint(w, (s0 + s1) / 2, w.t / 2 + 0.35)];
    return o2;
  });
  // Trechos sólidos por parede (portas cortam a parede inteira até 2,10 m)
  const pieces = [];
  for (const w of tip.walls) {
    const wi = wallInfo(w);
    const ops = openings.filter((o) => o.wall === w.id).sort((a, b) => a.s0 - b.s0);
    let s = 0;
    for (const o of ops) {
      if (o.s0 > s + EPS) pieces.push({ w, s0: s, s1: o.s0, z0: 0, z1: w.altura ?? tip.peDireito });
      // trecho sob a janela e acima do vão
      if (!o.porta && o.peitoril > 0) pieces.push({ w, s0: o.s0, s1: o.s1, z0: 0, z1: o.peitoril, sob: true });
      const topo = o.porta ? o.altura : o.peitoril + o.altura;
      pieces.push({ w, s0: o.s0, s1: o.s1, z0: topo, z1: w.altura ?? tip.peDireito, verga: true });
      s = o.s1;
    }
    if (s < wi.len - EPS) pieces.push({ w, s0: s, s1: wi.len, z0: 0, z1: w.altura ?? tip.peDireito });
  }
  for (const p of pieces) p.poly = wallSpanPoly(p.w, p.s0, p.s1);
  const allPts = tip.walls.flatMap((w) => wallSpanPoly(w, 0, wallInfo(w).len));
  const bb = bbox(allPts);
  const fixos = (tip.fixos || []).map((f) => ({ ...f, elev: 0, poly: rectCorners(f) }));
  const rooms = tip.rooms.map((r) => ({ ...r, centro: polyCentroid(r.poly), areaGeo: polyArea(r.poly) }));
  return { tip, wallsById, openings, pieces, bb, fixos, rooms };
}

export function roomAt(plan, x, y) {
  return plan.rooms.find((r) => pointInPoly(x, y, r.poly)) || null;
}

// ---------------------------------------------------------------- raios
function raySeg(ox, oy, dx, dy, ax, ay, bx, by) {
  const ex = bx - ax, ey = by - ay;
  const den = dx * ey - dy * ex;
  if (Math.abs(den) < EPS) return Infinity;
  const t = ((ax - ox) * ey - (ay - oy) * ex) / den;
  const u = ((ax - ox) * dy - (ay - oy) * dx) / den;
  if (t >= -4e-3 && u >= -1e-6 && u <= 1 + 1e-6) return Math.max(t, 0);
  return Infinity;
}
export function rayPolys(ox, oy, dx, dy, polys) {
  let best = Infinity, hit = null;
  for (const P of polys) {
    for (let i = 0; i < P.pts.length; i++) {
      const [ax, ay] = P.pts[i], [bx, by] = P.pts[(i + 1) % P.pts.length];
      const t = raySeg(ox, oy, dx, dy, ax, ay, bx, by);
      if (t < best) { best = t; hit = P; }
    }
  }
  return { t: best, hit };
}

// Bordas de um cômodo: direção, normal para dentro, trechos cobertos por parede e aberturas.
// `parede` indica se a borda é uma parede de verdade (e não a divisa virtual entre ambientes integrados).
const cacheBordas = new WeakMap();
export function bordasComodo(plan, r) {
  if (!cacheBordas.has(plan)) cacheBordas.set(plan, new Map());
  const cache = cacheBordas.get(plan);
  if (cache.has(r.id)) return cache.get(r.id);
  const P = r.poly, out = [];
  for (let i = 0; i < P.length; i++) {
    const p = P[i], q = P[(i + 1) % P.length];
    const ex = q[0] - p[0], ey = q[1] - p[1], L = Math.hypot(ex, ey);
    if (L < 0.02) { out.push({ i, p, q, L, ux: 1, uy: 0, nx: 0, ny: 1, cobertos: [], abert: [], parede: false, curta: true }); continue; }
    const ux = ex / L, uy = ey / L;
    let nx = -uy, ny = ux;
    if (!pointInPoly(p[0] + ex / 2 + nx * 0.05, p[1] + ey / 2 + ny * 0.05, P)) { nx = -nx; ny = -ny; }
    const cobertos = [], abert = [];
    for (const w of plan.tip.walls) {
      const wi = wallInfo(w);
      if (Math.abs(wi.ux * uy - wi.uy * ux) > 1e-3) continue;
      const dist = Math.abs((w.a[0] - p[0]) * -uy + (w.a[1] - p[1]) * ux);
      if (Math.abs(dist - w.t / 2) > 0.03) continue;
      const pa = (w.a[0] - p[0]) * ux + (w.a[1] - p[1]) * uy, pb = (w.b[0] - p[0]) * ux + (w.b[1] - p[1]) * uy;
      const a = Math.max(0, Math.min(pa, pb)), b = Math.min(L, Math.max(pa, pb));
      if (b - a > 0.01) cobertos.push([a, b, w.id]);
      for (const o of plan.openings) {
        if (o.wall !== w.id) continue;
        const A0 = wallPoint(w, o.s0), A1 = wallPoint(w, o.s1);
        const s0 = (A0[0] - p[0]) * ux + (A0[1] - p[1]) * uy, s1 = (A1[0] - p[0]) * ux + (A1[1] - p[1]) * uy;
        abert.push({ a: Math.min(s0, s1), b: Math.max(s0, s1), o });
      }
    }
    const ord = [...cobertos].sort((x, y) => x[0] - y[0]);
    let cov = 0, fim = 0;
    for (const [a, b] of ord) { const a2 = Math.max(a, fim); if (b > a2) { cov += b - a2; fim = b; } }
    out.push({ i, p, q, L, ux, uy, nx, ny, cobertos, abert, parede: cov / L >= 0.55 });
  }
  cache.set(r.id, out);
  return out;
}

// Posição efetiva das peças da construtora: a original da planta ou a que o morador escolheu (projeto.fix[id].pos).
// Altera plan.fixos no lugar, guardando a original em f.orig.
export function aplicarFixos(plan, fix) {
  if (!plan) return;
  for (const f of plan.fixos) {
    if (!f.orig) f.orig = { x: f.x, y: f.y, rot: f.rot || 0 };
    const o = fix?.[f.id] || {};
    const p = o.pos || f.orig;
    f.x = p.x; f.y = p.y; f.rot = p.rot ?? f.orig.rot;
    f.poly = rectCorners(f);
    f.oculto = !!o.oculto; f.movido = !!o.pos;
  }
  // portas retiradas e janelas ocultas: o vão continua, sem folha nem caixilho
  for (const o of plan.openings) o.sem = !!fix?.[o.id]?.sem;
}
