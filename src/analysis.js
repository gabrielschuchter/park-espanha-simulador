// Verificações de uso: colisões, portas, janelas, faixas livres e circulação.
import { rectCorners, convexOverlap, pointInPoly, localToPlan, rayPolys, bbox, wallSpanPoly, wallInfo } from './geom.js';
import { catalogoPorId } from './data/catalogo.js';

const FRENTE_FIXOS = { bancada: 0.80, tanque: 0.60 };
const PASSAGEM = 0.60; // largura mínima de passagem considerada (m)
const zOverlap = (a0, a1, b0, b1) => Math.min(a1, b1) - Math.max(a0, b0);

export function portaFrase(o) {
  const r = o.rotulo || '';
  if (o.entrada) return 'a porta de entrada';
  if (r.startsWith('Varanda')) return o.correr ? 'a porta de correr da varanda' : 'a porta da varanda';
  return `a porta do ${r.toLowerCase()}`;
}
const nomeCurto = (it) => it.nome || catalogoPorId[it.tipo]?.nome || 'móvel';
const livre = (it) => !!catalogoPorId[it.tipo]?.livre;

export function frontPoly(it, prof) {
  const hw = it.w / 2, hd = it.d / 2;
  return [[-hw, hd], [hw, hd], [hw, hd + prof], [-hw, hd + prof]].map(([x, y]) => localToPlan(it, x, y));
}

export function analisar(plan, itens) {
  const alertas = [];
  const add = (nivel, uid, msg, poly) => alertas.push({ nivel, uid, msg, poly });
  const polys = itens.map((it) => ({ it, poly: rectCorners(it), z0: it.elev, z1: it.elev + it.h }));
  const solidos = plan.pieces.filter((p) => !p.verga);

  for (let i = 0; i < polys.length; i++) {
    const A = polys[i], it = A.it;
    const c = catalogoPorId[it.tipo] || {};
    if (!plan.rooms.some((r) => pointInPoly(it.x, it.y, r.poly))) {
      add('erro', it.uid, `${nomeCurto(it)} está fora do apartamento.`, A.poly);
      continue;
    }
    if (livre(it)) continue;
    // paredes
    for (const p of solidos) {
      if (zOverlap(A.z0, A.z1, p.z0, p.z1) <= 0.01) continue;
      if (convexOverlap(A.poly, p.poly) > 0.012) { add('erro', it.uid, `${nomeCurto(it)} atravessa uma parede.`, A.poly); break; }
    }
    // elementos fixos
    for (const f of plan.fixos) {
      if (zOverlap(A.z0, A.z1, 0, Math.max(f.h, 0.02)) <= 0.005) continue;
      if (convexOverlap(A.poly, f.poly) > 0.012) add('erro', it.uid, `${nomeCurto(it)} ocupa o lugar de: ${f.nome.toLowerCase()}.`, A.poly);
    }
    // outros móveis
    for (let j = i + 1; j < polys.length; j++) {
      const B = polys[j];
      if (livre(B.it) || zOverlap(A.z0, A.z1, B.z0, B.z1) <= 0.01) continue;
      if (convexOverlap(A.poly, B.poly) > 0.012) {
        add('erro', it.uid, `${nomeCurto(it)} está sobreposto a ${nomeCurto(B.it).toLowerCase()}.`, A.poly);
        add('erro', B.it.uid, `${nomeCurto(B.it)} está sobreposto a ${nomeCurto(it).toLowerCase()}.`, B.poly);
      }
    }
    // portas
    if (it.elev < 2.0) {
      for (const o of plan.openings) {
        if (!o.sweep || o.sem) continue; // porta retirada não gira
        if (convexOverlap(A.poly, o.sweep) > 0.02) {
          add('aviso', it.uid, `${nomeCurto(it)} bloqueia ${portaFrase(o)}.`, o.sweep);
        }
      }
    }
    // janelas
    if (it.tipo !== 'cortina') {
      for (const o of plan.openings) {
        if (o.porta || o.sem) continue;
        const topoJ = o.peitoril + o.altura;
        if (A.z1 < o.peitoril + 0.08 || A.z0 > topoJ) continue;
        const faixa = wallSpanPoly(o.w, o.s0 + 0.1, o.s1 - 0.1, 0.25);
        if (convexOverlap(A.poly, faixa) > 0.01) add('info', it.uid, `${nomeCurto(it)} encobre parte da janela.`, null);
      }
    }
    // faixa livre à frente
    if (c.frente && !it.semFrente) {
      const fp = frontPoly(it, c.frente);
      const bate = solidos.some((p) => p.z0 < 1 && convexOverlap(fp, p.poly) > 0.03)
        || plan.fixos.some((f) => f.h > 0.1 && convexOverlap(fp, f.poly) > 0.03)
        || polys.some((B) => B !== A && !livre(B.it) && B.z0 < 1.0 && convexOverlap(fp, B.poly) > 0.03);
      if (bate) add('aviso', it.uid, `Pouco espaço à frente: ${nomeCurto(it).toLowerCase()} pede ${Math.round(c.frente * 100)} cm livres.`, fp);
    }
  }
  // faixa de trabalho dos elementos fixos
  for (const f of plan.fixos) {
    const prof = FRENTE_FIXOS[f.tipo]; if (!prof) continue;
    const fp = frontPoly(f, prof);
    const quem = polys.find((B) => !livre(B.it) && B.z0 < 1.0 && convexOverlap(fp, B.poly) > 0.03);
    if (quem) add('aviso', quem.it.uid, `${nomeCurto(quem.it)} invade a área de uso: ${f.nome.toLowerCase()} pede ${Math.round(prof * 100)} cm livres.`, fp);
  }
  // dedup
  const seen = new Set();
  return alertas.filter((a) => { const k = a.uid + a.msg; if (seen.has(k)) return false; seen.add(k); return true; });
}

// ---------------------------------------------------------------- distâncias do item selecionado
export function distancias(plan, itens, it) {
  const obst = [];
  for (const w of plan.tip.walls) obst.push({ pts: wallSpanPoly(w, 0, wallInfo(w).len), tipo: 'parede' });
  const z0 = it.elev, z1 = it.elev + it.h;
  for (const f of plan.fixos) if (zOverlap(z0, z1, 0, Math.max(f.h, 0.02)) > 0) obst.push({ pts: f.poly, tipo: 'fixo' });
  for (const o of itens) {
    if (o.uid === it.uid || livre(o) || (livre(it))) continue;
    if (zOverlap(z0, z1, o.elev, o.elev + o.h) > 0) obst.push({ pts: rectCorners(o), tipo: 'movel' });
  }
  const hw = it.w / 2, hd = it.d / 2;
  const dirs = [[1, 0, hw, 0], [-1, 0, -hw, 0], [0, 1, 0, hd], [0, -1, 0, -hd]];
  const out = [];
  for (const [lx, ly, ox, oy] of dirs) {
    const o = localToPlan(it, ox, oy);
    const tip = localToPlan(it, ox + lx, oy + ly);
    const dx = tip[0] - o[0], dy = tip[1] - o[1];
    const { t } = rayPolys(o[0], o[1], dx, dy, obst);
    if (t < 8) out.push({ de: o, ate: [o[0] + dx * t, o[1] + dy * t], dist: t, lx, ly });
  }
  return out;
}

// ---------------------------------------------------------------- circulação
export function circulacao(plan, itens) {
  const cell = 0.05;
  const { x0, y0, x1, y1 } = plan.bb;
  const W = Math.ceil((x1 - x0) / cell) + 1, H = Math.ceil((y1 - y0) / cell) + 1;
  const blocked = new Uint8Array(W * H);
  const interior = new Uint8Array(W * H);
  const fill = (poly, arr, val = 1) => {
    const b = bbox(poly);
    const i0 = Math.max(0, Math.floor((b.x0 - x0) / cell)), i1 = Math.min(W - 1, Math.ceil((b.x1 - x0) / cell));
    const j0 = Math.max(0, Math.floor((b.y0 - y0) / cell)), j1 = Math.min(H - 1, Math.ceil((b.y1 - y0) / cell));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      if (pointInPoly(x0 + i * cell, y0 + j * cell, poly)) arr[j * W + i] = val;
    }
  };
  for (const r of plan.rooms) fill(r.poly, interior);
  for (const o of plan.openings) if (o.porta) fill(o.poly, interior);
  for (let k = 0; k < W * H; k++) if (!interior[k]) blocked[k] = 1;
  for (const p of plan.pieces) if (!p.verga && p.z0 < 1) fill(p.poly, blocked);
  for (const f of plan.fixos) if (f.h > 0.1) fill(f.poly, blocked);
  for (const it of itens) if (!livre(it) && it.elev < 1.0) fill(rectCorners(it), blocked);

  // transformada de distância (chamfer 3-4), em metros
  const INF = 1e9, dist = new Float32Array(W * H);
  for (let k = 0; k < W * H; k++) dist[k] = blocked[k] ? 0 : INF;
  const a = cell, b = cell * Math.SQRT2;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = j * W + i; if (!dist[k]) continue;
    let v = dist[k];
    if (i > 0) v = Math.min(v, dist[k - 1] + a);
    if (j > 0) { v = Math.min(v, dist[k - W] + a); if (i > 0) v = Math.min(v, dist[k - W - 1] + b); if (i < W - 1) v = Math.min(v, dist[k - W + 1] + b); }
    dist[k] = v;
  }
  for (let j = H - 1; j >= 0; j--) for (let i = W - 1; i >= 0; i--) {
    const k = j * W + i; if (!dist[k]) continue;
    let v = dist[k];
    if (i < W - 1) v = Math.min(v, dist[k + 1] + a);
    if (j < H - 1) { v = Math.min(v, dist[k + W] + a); if (i < W - 1) v = Math.min(v, dist[k + W + 1] + b); if (i > 0) v = Math.min(v, dist[k + W - 1] + b); }
    dist[k] = v;
  }
  const passagem = plan.tip.requisitos?.passagemMin || PASSAGEM;
  const raio = passagem / 2 - cell * 0.6;
  const ok = (k) => dist[k] >= raio;
  const idx = ([x, y]) => {
    const i = Math.round((x - x0) / cell), j = Math.round((y - y0) / cell);
    return i < 0 || j < 0 || i >= W || j >= H ? -1 : j * W + i;
  };
  // ponto passável mais próximo (até 30 cm)
  const nearestOk = (pt) => {
    const k0 = idx(pt); if (k0 < 0) return -1;
    const i0 = k0 % W, j0 = (k0 / W) | 0;
    let best = -1, bd = Infinity;
    for (let dj = -6; dj <= 6; dj++) for (let di = -6; di <= 6; di++) {
      const i = i0 + di, j = j0 + dj; if (i < 0 || j < 0 || i >= W || j >= H) continue;
      const k = j * W + i; if (!ok(k)) continue;
      const d = di * di + dj * dj; if (d < bd) { bd = d; best = k; }
    }
    return best;
  };
  const entrada = plan.openings.find((o) => o.entrada);
  const reach = new Uint8Array(W * H);
  const inicio = entrada ? [nearestOk(entrada.lados[1]), nearestOk(entrada.lados[0]), nearestOk(entrada.centro)].find((k) => k >= 0) ?? -1 : -1;
  if (inicio >= 0) {
    const q = [inicio]; reach[inicio] = 1;
    while (q.length) {
      const k = q.pop(), i = k % W;
      const nb = [i > 0 ? k - 1 : -1, i < W - 1 ? k + 1 : -1, k - W, k + W];
      for (const n of nb) if (n >= 0 && n < W * H && !reach[n] && ok(n)) { reach[n] = 1; q.push(n); }
    }
  }
  const bloqueios = [];
  for (const o of plan.openings) {
    if (!o.porta || o.entrada) continue;
    // basta alcançar o vão da porta; o giro da folha é verificado à parte
    const k = nearestOk(o.centro);
    const alcan = k >= 0 && reach[k];
    if (!alcan) bloqueios.push(o);
  }
  // cômodos sem porta (abertos) também precisam ser alcançados
  for (const r of plan.rooms) {
    if (r.banho || !r.aberto) continue;
    const k = nearestOk(r.centro);
    let algum = k >= 0 && reach[k];
    if (!algum) {
      // procura qualquer célula alcançável dentro do cômodo
      const bb = bbox(r.poly);
      for (let y = bb.y0 + 0.2; y < bb.y1 && !algum; y += 0.1) for (let x = bb.x0 + 0.2; x < bb.x1; x += 0.1) {
        const kk = idx([x, y]); if (kk >= 0 && reach[kk] && pointInPoly(x, y, r.poly)) { algum = true; break; }
      }
    }
    if (!algum) bloqueios.push({ rotulo: r.nome, room: r });
  }
  // área de giro (usada quando a tipologia declara o critério, ex.: PCD / NBR 9050)
  const semGiro = [];
  const giro = plan.tip.requisitos?.giro360;
  if (giro) {
    for (const r of plan.rooms) {
      let max = 0;
      for (let k = 0; k < W * H; k++) {
        if (!reach[k]) continue;
        const x = x0 + (k % W) * cell, y = y0 + ((k / W) | 0) * cell;
        if (dist[k] > max && pointInPoly(x, y, r.poly)) max = dist[k];
      }
      if (max < giro / 2 - cell) semGiro.push(r);
    }
  }
  return { cell, W, H, x0, y0, dist, blocked, interior, reach, bloqueios, semGiro, passagem };
}
