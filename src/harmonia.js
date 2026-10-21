// Auditoria estrita de composição: tudo o que um olho humano estranharia num ambiente montado.
// Usada pelo motor dos estilos (cada peça nova precisa passar) e pelos testes (tools/harmonia-check.mjs).
// Mais rígida que analysis.js: considera também peças "livres" (tapete, cortina, luminária de teto, arandela),
// aberturas na altura certa, apoio de objetos e altura de cabeça.
import { catalogoPorId } from './data/catalogo.js';
import { rectCorners, convexOverlap, pointInPoly, wallInfo, wallPoint, localToPlan } from './geom.js';
import { tetoY } from './tetoGeo.js';

const cat = (it) => catalogoPorId[it.tipo] || {};
const TAPETES = new Set(['tapete', 'tapeteredondo', 'gabgiro', 'gabcirc', 'balanca']);
export const ehTapete = (it) => TAPETES.has(it.tipo);
export const ehTeto = (it) => !!cat(it).teto;
export const ehParede = (it) => !!cat(it).parede && !cat(it).teto;
const MESAS = /^(jantar|redonda|mesaalta|mesaret|ilha)/;
const z1 = (it) => it.elev + it.h;
const zOv = (a0, a1, b0, b1) => Math.min(a1, b1) - Math.max(a0, b0);
const ang = (r) => ((Math.round(r) % 360) + 360) % 360;

// faces de parede sólidas: para cada trecho de parede, o retângulo fino de cada lado
function facesDe(plan) {
  if (plan.__faces) return plan.__faces;
  const out = [];
  for (const p of plan.pieces) {
    const w = p.w, wi = wallInfo(w);
    for (const sg of [1, -1]) {
      out.push({ p, w, wi, sg, s0: p.s0, s1: p.s1, z0: p.z0, z1: p.z1, nx: wi.nx * sg, ny: wi.ny * sg, o: wallPoint(w, 0, sg * w.t / 2) });
    }
  }
  plan.__faces = out;
  return out;
}

// Em qual face de parede o fundo do objeto encosta (ou null)
export function faceDoFundo(plan, it) {
  const [bx, by] = localToPlan(it, 0, -it.d / 2);
  const r = (it.rot * Math.PI) / 180;
  const fx = -Math.sin(r), fy = Math.cos(r); // direção da frente (+y local)
  let melhor = null;
  for (const f of facesDe(plan)) {
    if (f.nx * fx + f.ny * fy < 0.98) continue; // a frente do objeto aponta para fora da parede
    const dist = (bx - f.o[0]) * f.nx + (by - f.o[1]) * f.ny;
    if (Math.abs(dist) > 0.035) continue;
    const s = (bx - f.w.a[0]) * f.wi.ux + (by - f.w.a[1]) * f.wi.uy;
    if (s < -0.05 || s > f.wi.len + 0.05) continue; // outra parede na mesma linha
    const fora = s < f.s0 ? f.s0 - s : s > f.s1 ? s - f.s1 : 0;
    const nota = Math.abs(dist) + fora * 10;
    if (!melhor || nota < melhor.nota) melhor = { ...f, s, dist: Math.abs(dist), nota };
  }
  return melhor;
}

// Quanto da largura [s-w/2, s+w/2] na faixa de altura [za,zb] é parede de verdade (0..1)
function coberturaParede(plan, face, s, w, za, zb) {
  const a = s - w / 2, b = s + w / 2;
  const trechos = facesDe(plan).filter((f) => f.w === face.w && f.sg === face.sg && f.z0 <= za + 0.01 && f.z1 >= zb - 0.01)
    .map((f) => [Math.max(a, f.s0), Math.min(b, f.s1)]).filter(([x, y]) => y > x).sort((x, y) => x[0] - y[0]);
  let cob = 0, fim = a;
  for (const [x, y] of trechos) { const x2 = Math.max(x, fim); if (y > x2) { cob += y - x2; fim = y; } }
  return cob / Math.max(w, 1e-6);
}

// O objeto está apoiado em algo (móvel ou peça da construtora) cujo tampo coincide com a base dele?
function apoio(plan, it, itens) {
  const c = [it.x, it.y];
  for (const o of itens) {
    if (o.uid === it.uid || ehTapete(o) || ehTeto(o)) continue;
    if (Math.abs(z1(o) - it.elev) > 0.03) continue;
    if (pointInPoly(c[0], c[1], rectCorners(o, -0.02))) return o;
  }
  for (const f of plan.fixos) {
    if (f.oculto) continue;
    if (Math.abs(f.h - it.elev) > 0.04) continue;
    if (pointInPoly(c[0], c[1], rectCorners(f, -0.02))) return f;
  }
  return null;
}

const comodoDe = (plan, x, y) => plan.rooms.find((r) => pointInPoly(x, y, r.poly)) || null;

// Lista de problemas de cada objeto. `foco`: só avalia esses uids (o resto entra como contexto).
export function problemas(plan, itens, acab, foco = null) {
  const out = [];
  const add = (it, msg) => out.push({ uid: it.uid, tipo: it.tipo, msg });
  const P = new Map(itens.map((it) => [it.uid, rectCorners(it)]));
  const avaliar = foco ? itens.filter((i) => foco.has(i.uid)) : itens;
  const sociais = new Set(plan.rooms.filter((r) => r.aberto).map((r) => r.id));
  const mesmoAmbiente = (a, b) => a && b && (a.id === b.id || (sociais.has(a.id) && sociais.has(b.id)));

  for (const it of avaliar) {
    const c = cat(it), A = P.get(it.uid);
    const rc = comodoDe(plan, it.x, it.y);
    if (!rc) { add(it, 'fora do apartamento'); continue; }
    // 1. inteiro dentro de um ambiente (cantos dentro de cômodos do mesmo ambiente)
    const inset = rectCorners(it, -0.015);
    for (const [x, y] of inset) {
      const r = comodoDe(plan, x, y);
      if (!r || !mesmoAmbiente(r, rc)) { add(it, 'atravessa para outro cômodo ou parede'); break; }
    }
    // 2. paredes sólidas (inclusive para tapete, cortina e luminárias)
    for (const p of plan.pieces) {
      if (zOv(it.elev, z1(it), p.z0, p.z1) <= 0.01) continue;
      if (convexOverlap(rectCorners(it, -0.012), p.poly) > 0.002) { add(it, 'entra na parede'); break; }
    }
    // 3. peças da construtora
    for (const f of plan.fixos) {
      if (f.oculto) continue;
      if (ehTeto(it)) continue;
      if (zOv(it.elev, z1(it), 0, Math.max(f.h, 0.02)) <= 0.005) continue;
      if (convexOverlap(A, f.poly) > 0.004) { add(it, `ocupa ${f.nome.toLowerCase()}`); break; }
    }
    // 4. outros objetos, em 3D
    for (const o of itens) {
      if (o.uid === it.uid) continue;
      if (ehTapete(it) || ehTapete(o)) {
        if (ehTapete(it) && ehTapete(o) && convexOverlap(A, P.get(o.uid)) > 0.02) add(it, 'tapete sobre tapete');
        continue;
      }
      if (zOv(it.elev, z1(it), o.elev, z1(o)) <= 0.01) continue;
      // cortina: o tecido franze e afasta da parede; quadro ou espelho ao lado precisa de folga
      const cortina = it.tipo === 'cortina' || o.tipo === 'cortina';
      const ov = cortina ? convexOverlap(rectCorners(it, it.tipo === 'cortina' ? 0.06 : 0), rectCorners(o, o.tipo === 'cortina' ? 0.06 : 0)) : convexOverlap(A, P.get(o.uid));
      if (ov <= 0.003) continue;
      // cortina pode passar atrás de móvel baixo sob a janela
      if (it.tipo === 'cortina' || o.tipo === 'cortina') {
        const outro = it.tipo === 'cortina' ? o : it;
        if (z1(outro) < 0.95 && outro.elev < 0.5) continue;
      }
      add(it, `encosta em ${(o.nome || o.tipo).toLowerCase()}`); break;
    }
    // 5. objetos de parede: fundo na parede, sem vão atrás, sem passar do fim da parede
    if (ehParede(it)) {
      const face = faceDoFundo(plan, it);
      if (!face) add(it, 'não está encostado numa parede');
      else {
        const zb = Math.max(it.elev + 0.02, Math.min(z1(it) - 0.02, it.elev + it.h));
        const cob = coberturaParede(plan, face, face.s, it.w - 0.02, it.elev + 0.02, zb);
        if (it.tipo === 'cortina') {
          // cortina: precisa de uma janela atrás
          const jan = plan.openings.find((o) => !o.porta && !o.sem && o.wall === face.w.id && face.s > o.s0 - 0.2 && face.s < o.s1 + 0.2);
          if (!jan) add(it, 'cortina sem janela atrás');
          else if (it.w < jan.largura - 0.02) add(it, 'cortina mais estreita que a janela');
          else if (coberturaParede(plan, face, face.s, it.w, 0.05, 2.0) < 0.5 && it.w > jan.largura + 0.6) add(it, 'cortina larga demais');
        } else if (cob < 0.985) add(it, 'fica sobre porta, janela ou fim de parede');
      }
      if (ang(it.rot) % 90 !== 0) add(it, 'torto na parede');
    }
    // 6. luminárias de teto: presas ao forro, altura de cabeça fora de mesa, bancada ou cama
    if (ehTeto(it)) {
      const t = tetoY(plan, acab, it.x, it.y);
      if (Math.abs(z1(it) - t) > 0.03) add(it, 'não está no teto');
      if (it.elev < 2.02) {
        const sob = itens.some((o) => o.uid !== it.uid && (MESAS.test(o.tipo) || /^cama|^ilha|^balcao|^mesacentro/.test(o.tipo)) && pointInPoly(it.x, it.y, rectCorners(o, 0.15)))
          || plan.fixos.some((f) => !f.oculto && (f.tipo === 'bancada') && pointInPoly(it.x, it.y, rectCorners(f, 0.1)));
        if (!sob) add(it, 'pendurado baixo na passagem');
      }
      // luz de teto sobre parede/fixo alto é estranho; e duas luzes de teto encostadas também
      for (const o of itens) {
        if (o.uid === it.uid || !ehTeto(o)) continue;
        if (convexOverlap(rectCorners(it, 0.08), P.get(o.uid)) > 0.001) { add(it, 'luminárias de teto encostadas'); break; }
      }
    }
    // 7. objetos acima do piso que não são de parede nem de teto precisam de apoio
    if (!ehParede(it) && !ehTeto(it) && it.elev > 0.03 && !apoio(plan, it, itens)) add(it, 'flutuando, sem apoio');
    // 8. no chão: rotação em múltiplos de 45° (poltrona e cadeira em diagonal tudo bem; o resto em 90°)
    if (!ehParede(it) && !ehTeto(it)) {
      const a = ang(it.rot);
      const diag = /poltrona|puff|planta|cacto|vaso|cesto|luminaria|abajur|banqueta|cadeira|tapeteredondo|plantapeq|banquinho|cestoroupa|mesaapoio|mesalateral|gab|balanca/.test(it.tipo);
      if (a % 90 !== 0 && !(diag && a % 45 === 0)) add(it, 'em ângulo estranho');
    }
    // 9. porta: nada no giro da folha (tapete fino pode)
    if (!ehTapete(it) && !ehTeto(it) && it.elev < 2.0 && it.tipo !== 'cortina') {
      for (const o of plan.openings) {
        if (!o.sweep || o.sem) continue;
        if (convexOverlap(A, o.sweep) > 0.006) { add(it, 'no giro da porta'); break; }
      }
    }
    // 10. janela: objeto alto na frente da janela (decoração não deve tampar janela)
    if (!ehTapete(it) && !ehTeto(it) && it.tipo !== 'cortina' && !it.__base) {
      for (const o of plan.openings) {
        if (o.porta || o.sem) continue;
        if (z1(it) < o.peitoril + 0.15 || it.elev > o.peitoril + o.altura) continue;
        const faixa = [wallPoint(o.w, o.s0 + 0.05, -(o.w.t / 2 + 0.45)), wallPoint(o.w, o.s1 - 0.05, -(o.w.t / 2 + 0.45)), wallPoint(o.w, o.s1 - 0.05, o.w.t / 2 + 0.45), wallPoint(o.w, o.s0 + 0.05, o.w.t / 2 + 0.45)];
        if (convexOverlap(A, faixa) > 0.01) { add(it, 'tampa a janela'); break; }
      }
    }
  }
  return out;
}

export const temProblema = (plan, itens, acab, uid) => problemas(plan, itens, acab, new Set([uid])).length > 0;
