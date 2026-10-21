// Obra: paredes novas, paredes demolidas e vãos abertos ou fechados.
// A planta oficial nunca é alterada; o projeto guarda só as diferenças em fix._obra e esta função monta
// a tipologia efetiva que o resto do simulador usa (colisão, análise, 2D, 3D, Passeio).
//
// fix._obra = {
//   paredes:   [{ id, a:[x,y], b:[x,y], t, tipo, altura?, cor? }]      paredes novas (eixo a→b)
//   demolidas: [wallId]                                                  paredes da planta retiradas
//   vaos:      [{ id, wall, tipo, de, largura, passagem?, abre?, dobradica? }]  vãos novos
//   fechados:  [openingId]                                               vãos da planta fechados
// }
import { wallInfo, wallPoint, pointInPoly } from './geom.js';

export const TIPOS_PAREDE = {
  alvenaria: { nome: 'Alvenaria', t: 0.14, desc: 'Bloco e reboco, do piso à laje.' },
  drywall: { nome: 'Drywall', t: 0.09, desc: 'Gesso acartonado, mais fina e leve.' },
  meia: { nome: 'Meia-parede', t: 0.12, altura: 1.10, desc: 'Mureta de 1,10 m, separa sem fechar.' },
  vidro: { nome: 'Divisória de vidro', t: 0.06, desc: 'Vidro com perfil preto, do piso à laje.' },
  ripado: { nome: 'Painel ripado', t: 0.06, desc: 'Ripas de madeira, deixa a luz passar.' },
};
export const TIPOS_VAO = {
  porta70: { nome: 'Porta 70', tipo: 'P1', largura: 0.70 },
  porta80: { nome: 'Porta 80', tipo: 'P1', largura: 0.80 },
  porta90: { nome: 'Porta 90 (acessível)', tipo: 'P1A', largura: 0.90 },
  passagem: { nome: 'Passagem livre 90', tipo: 'P1', largura: 0.90, passagem: true },
  passagemLarga: { nome: 'Passagem larga 1,40', tipo: 'P1', largura: 1.40, passagem: true },
  janela: { nome: 'Janela 1,20', tipo: 'J2', largura: 1.20 },
  janelaAlta: { nome: 'Janela alta 60', tipo: 'J1', largura: 0.60 },
};

export const OBRA_VAZIA = () => ({ paredes: [], demolidas: [], vaos: [], fechados: [] });
export const obraDe = (fix) => ({ ...OBRA_VAZIA(), ...(fix?._obra || {}) });
export const temObra = (fix) => { const o = fix?._obra; return !!o && (o.paredes?.length || o.demolidas?.length || o.vaos?.length || o.fechados?.length); };
export const assinaturaObra = (fix) => JSON.stringify(fix?._obra || null);

// Monta a tipologia efetiva. Não muda a original.
export function aplicarObra(tip, fix) {
  const o = obraDe(fix);
  if (!temObra(fix)) return tip;
  const dem = new Set(o.demolidas), fech = new Set(o.fechados);
  const walls = tip.walls.filter((w) => !dem.has(w.id));
  for (const p of o.paredes) {
    const tp = TIPOS_PAREDE[p.tipo] || TIPOS_PAREDE.alvenaria;
    const alt = p.altura ?? tp.altura;
    walls.push({ id: p.id, a: p.a, b: p.b, t: p.t ?? tp.t, obra: p.tipo || 'alvenaria', cor: p.cor, ...(alt ? { altura: alt } : {}) });
  }
  const ids = new Set(walls.map((w) => w.id));
  const openings = tip.openings.filter((op) => ids.has(op.wall) && !fech.has(op.id));
  for (const v of o.vaos) {
    if (!ids.has(v.wall)) continue;
    openings.push({ id: v.id, wall: v.wall, tipo: v.tipo, de: v.de, largura: v.largura, obra: true, ...(v.passagem ? { passagem: true } : {}), abre: v.abre ?? 1, dobradica: v.dobradica || 'a', rotulo: v.passagem ? 'Passagem' : undefined });
  }
  // faixas de piso onde havia parede (sem isso sobraria um vão no chão)
  const remendos = tip.walls.filter((w) => dem.has(w.id)).map((w) => {
    const wi = wallInfo(w), h = w.t / 2;
    return { id: w.id, poly: [wallPoint(w, -0.0, -h), wallPoint(w, wi.len, -h), wallPoint(w, wi.len, h), wallPoint(w, 0, h)] };
  });
  return { ...tip, walls, openings, remendos, obra: true };
}

// Parede da fachada (um dos lados sem cômodo): não pode ser demolida
export function ehExterna(tip, w) {
  const wi = wallInfo(w);
  for (const s of [0.25, 0.5, 0.75]) {
    for (const sg of [1, -1]) {
      const p = wallPoint(w, wi.len * s, sg * (w.t / 2 + 0.12));
      if (!tip.rooms.some((r) => pointInPoly(p[0], p[1], r.poly))) return true;
    }
  }
  return false;
}

// Vão cabe na parede? (longe das pontas e sem sobrepor outro vão)
export function vaoCabe(plan, wallId, de, largura, ignorar = null) {
  const w = plan.tip.walls.find((q) => q.id === wallId); if (!w) return false;
  const L = wallInfo(w).len;
  if (de < 0.08 || de + largura > L - 0.08) return false;
  return !plan.openings.some((op) => op.wall === wallId && op.id !== ignorar && de < op.s1 + 0.1 && de + largura > op.s0 - 0.1);
}

// ---------------------------------------------------------------- encaixe do desenho
// Ponto do cursor → ponto encaixado: pontas de parede, eixo de parede, ângulo a partir do ponto anterior, grade de 5 cm.
export function encaixar(plan, [x, y], anterior = null, { livre = false } = {}) {
  if (livre) return { p: [x, y], tipo: 'livre' };
  const walls = plan.tip.walls;
  // 1. pontas de parede (12 cm)
  let best = null;
  for (const w of walls) for (const q of [w.a, w.b]) {
    const d = Math.hypot(q[0] - x, q[1] - y);
    if (d < 0.12 && (!best || d < best.d)) best = { d, p: [q[0], q[1]], tipo: 'ponta' };
  }
  if (best) return best;
  // 2. ângulo a partir do ponto anterior (múltiplos de 15°, com preferência por 0° e 90°)
  let p = [x, y], tipo = 'grade';
  if (anterior) {
    const dx = x - anterior[0], dy = y - anterior[1], L = Math.hypot(dx, dy);
    if (L > 0.05) {
      const a = Math.atan2(dy, dx), passo = Math.PI / 12;
      const a2 = Math.round(a / passo) * passo;
      const reto = Math.round(a / (Math.PI / 2)) * (Math.PI / 2);
      const usa = Math.abs(a - reto) < 0.12 ? reto : a2;
      const Lr = Math.round(L / 0.05) * 0.05;
      p = [anterior[0] + Math.cos(usa) * Lr, anterior[1] + Math.sin(usa) * Lr];
      tipo = 'angulo';
    }
  } else p = [Math.round(x / 0.05) * 0.05, Math.round(y / 0.05) * 0.05];
  // 3. eixo de parede próxima (encosta a parede nova na existente)
  for (const w of walls) {
    const wi = wallInfo(w);
    const s = (p[0] - w.a[0]) * wi.ux + (p[1] - w.a[1]) * wi.uy;
    if (s < 0 || s > wi.len) continue;
    const off = (p[0] - w.a[0]) * wi.nx + (p[1] - w.a[1]) * wi.ny;
    if (Math.abs(off) < w.t / 2 + 0.1) {
      const q = wallPoint(w, s, 0);
      if (anterior) {
        // mantém a direção travada: anda sobre a reta do desenho até o eixo da parede
        const dx = p[0] - anterior[0], dy = p[1] - anterior[1], L = Math.hypot(dx, dy) || 1;
        const ux = dx / L, uy = dy / L;
        const den = ux * wi.nx + uy * wi.ny;
        if (Math.abs(den) > 0.2) {
          const t = ((w.a[0] - anterior[0]) * wi.nx + (w.a[1] - anterior[1]) * wi.ny) / den;
          if (t > 0.1) return { p: [anterior[0] + ux * t, anterior[1] + uy * t], tipo: 'parede', wall: w.id };
        }
      }
      return { p: q, tipo: 'parede', wall: w.id };
    }
  }
  return { p, tipo };
}

// Parede sob o ponto (para selecionar e abrir vão): distância ao eixo menor que meia espessura + folga
export function paredeNoPonto(plan, [x, y], folga = 0.08) {
  let best = null;
  for (const w of plan.tip.walls) {
    const wi = wallInfo(w);
    const s = (x - w.a[0]) * wi.ux + (y - w.a[1]) * wi.uy;
    if (s < -0.02 || s > wi.len + 0.02) continue;
    const off = Math.abs((x - w.a[0]) * wi.nx + (y - w.a[1]) * wi.ny);
    if (off > w.t / 2 + folga) continue;
    if (!best || off < best.off) best = { w, s, off };
  }
  return best;
}
export function vaoNoPonto(plan, [x, y]) {
  const hit = paredeNoPonto(plan, [x, y], 0.1);
  if (!hit) return null;
  return plan.openings.find((op) => op.wall === hit.w.id && hit.s >= op.s0 - 0.03 && hit.s <= op.s1 + 0.03) || null;
}
