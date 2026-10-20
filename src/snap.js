// Encaixe e colisão compartilhados pelo editor 2D, pelo 3D e pelo catálogo.
import { rectCorners, convexOverlap, pointInPoly, wallInfo, wallPoint } from './geom.js';
import { catalogoPorId } from './data/catalogo.js';
import { distancias } from './analysis.js';

export function colide(plan, it, itens) {
  if (catalogoPorId[it.tipo]?.livre) return false;
  const P = rectCorners(it);
  if (!plan.rooms.some((r) => pointInPoly(it.x, it.y, r.poly))) return true;
  if (plan.pieces.some((p) => !p.verga && p.z0 < it.elev + it.h && p.z1 > it.elev && convexOverlap(P, p.poly) > 0.005)) return true;
  if (plan.fixos.some((f) => !f.oculto && it.elev < Math.max(f.h, 0.02) && convexOverlap(P, f.poly) > 0.005)) return true;
  return itens.some((o) => o.uid !== it.uid && !catalogoPorId[o.tipo]?.livre && o.elev < it.elev + it.h && o.elev + o.h > it.elev && convexOverlap(P, rectCorners(o)) > 0.005);
}

// Móveis de parede: gira o móvel com a frente para o cômodo e encosta o fundo na parede mais próxima
function alinharNaParede(plan, it) {
  const folga = 0.22;
  let melhor = null;
  for (const w of plan.tip.walls) {
    const wi = wallInfo(w);
    const portas = plan.openings.filter((o) => o.wall === w.id && o.porta);
    for (const sgn of [1, -1]) {
      const nx = wi.nx * sgn, ny = wi.ny * sgn;
      const sp = wallPoint(w, 0, sgn * w.t / 2);
      const dist = (it.x - sp[0]) * nx + (it.y - sp[1]) * ny;
      const s = (it.x - w.a[0]) * wi.ux + (it.y - w.a[1]) * wi.uy;
      if (s < 0.05 || s > wi.len - 0.05) continue;
      if (portas.some((o) => s > o.s0 - 0.05 && s < o.s1 + 0.05)) continue;
      const ponto = [sp[0] + nx * 0.25 + wi.ux * (s), sp[1] + ny * 0.25];
      void ponto;
      const lado = [sp[0] + wi.ux * s + nx * 0.3, sp[1] + wi.uy * s + ny * 0.3];
      if (!plan.rooms.some((r) => pointInPoly(lado[0], lado[1], r.poly))) continue;
      const gap = dist - it.d / 2;
      if (gap < -0.06 || gap > folga) continue;
      if (!melhor || Math.abs(gap) < melhor.gap) melhor = { gap: Math.abs(gap), nx, ny, sp, s, wi };
    }
  }
  if (!melhor) return false;
  const { nx, ny, sp, wi } = melhor;
  const rot = ((Math.round((Math.atan2(-nx, ny) * 180) / Math.PI) % 360) + 360) % 360;
  it.rot = rot;
  const base = [sp[0] + wi.ux * melhor.s, sp[1] + wi.uy * melhor.s];
  it.x = Math.round((base[0] + nx * (it.d / 2)) * 1000) / 1000;
  it.y = Math.round((base[1] + ny * (it.d / 2)) * 1000) / 1000;
  return true;
}

export function snapItem(plan, itens, it, ignorar) {
  it.x = Math.round(it.x * 100) / 100; it.y = Math.round(it.y * 100) / 100;
  if (ignorar) return false;
  let encostou = false;
  const c = catalogoPorId[it.tipo];
  if (c?.parede && !c?.teto) encostou = alinharNaParede(plan, it);
  const ds = distancias(plan, itens, it);
  let dx = 0, dy = 0;
  const lim = c?.parede ? 0.12 : 0.06;
  for (const d of ds) {
    if (d.dist > 0.002 && d.dist < lim) {
      const ux = d.ate[0] - d.de[0], uy = d.ate[1] - d.de[1], l = Math.hypot(ux, uy);
      const mx = (ux / l) * d.dist, my = (uy / l) * d.dist;
      if (Math.abs(mx) > Math.abs(dx)) dx = mx;
      if (Math.abs(my) > Math.abs(dy)) dy = my;
    }
  }
  if (dx || dy) encostou = true;
  it.x = Math.round((it.x + dx) * 1000) / 1000; it.y = Math.round((it.y + dy) * 1000) / 1000;
  return encostou;
}

// Leva um móvel de parede recém-adicionado até a parede livre mais próxima do ponto dado (fundo encostado, frente para o cômodo)
export function levarParaParede(plan, itens, it) {
  const ponto = [it.x, it.y];
  let melhor = null;
  const base = { ...it };
  for (const w of plan.tip.walls) {
    const wi = wallInfo(w);
    for (const sgn of [1, -1]) {
      const nx = wi.nx * sgn, ny = wi.ny * sgn;
      const sp = wallPoint(w, 0, sgn * w.t / 2);
      const lo = it.w / 2 + 0.06, hi = wi.len - it.w / 2 - 0.06;
      if (hi <= lo) continue;
      const sIdeal = (ponto[0] - w.a[0]) * wi.ux + (ponto[1] - w.a[1]) * wi.uy;
      for (const delta of [0, 0.15, -0.15, 0.3, -0.3, 0.6, -0.6, 1.0, -1.0, 1.6, -1.6]) {
        const s = Math.min(hi, Math.max(lo, sIdeal + delta));
        const lado = [sp[0] + wi.ux * s + nx * 0.3, sp[1] + wi.uy * s + ny * 0.3];
        if (!plan.rooms.some((r) => pointInPoly(lado[0], lado[1], r.poly))) continue;
        const t = { ...base };
        t.rot = ((Math.round((Math.atan2(-nx, ny) * 180) / Math.PI) % 360) + 360) % 360;
        t.x = Math.round((sp[0] + wi.ux * s + nx * (it.d / 2)) * 1000) / 1000;
        t.y = Math.round((sp[1] + wi.uy * s + ny * (it.d / 2)) * 1000) / 1000;
        if (colide(plan, t, itens)) continue;
        const dist = Math.hypot(t.x - ponto[0], t.y - ponto[1]);
        if (!melhor || dist < melhor.dist) melhor = { dist, x: t.x, y: t.y, rot: t.rot };
        break;
      }
    }
  }
  if (!melhor || melhor.dist > 4) return false;
  it.x = melhor.x; it.y = melhor.y; it.rot = melhor.rot;
  return true;
}
