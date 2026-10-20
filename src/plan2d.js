// Editor 2D em SVG: planta fixa, móveis editáveis, cotas, distâncias e avisos.
import { rectCorners, wallInfo, wallPoint, rad, deg, localToPlan, planToLocal, pointInPoly } from './geom.js';
import { catalogoPorId } from './data/catalogo.js';
import { store, live, commit, select, edit } from './store.js';
import { distancias } from './analysis.js';
import { snapItem as snapShared } from './snap.js';
import { pisoDe } from './data/acabamentos.js';

const NS = 'http://www.w3.org/2000/svg';
// rótulos como na planta oficial
const ABREV = { 'Serviço + varanda': 'SERV. + VARANDA', 'Cozinha + jantar': 'COZ. + JANTAR', 'Banheiro 1': 'BANHO 1', 'Banheiro 2': 'BANHO 2', 'Circulação': 'CIRCULAÇÃO' };
const f2 = (v) => v.toFixed(3);
const cm = (m) => Math.round(m * 100);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// ------------------------------------------------------------ símbolos dos móveis
export function simboloItem(it) {
  const c = catalogoPorId[it.tipo] || {};
  const { w, d } = it, hw = w / 2, hd = d / 2;
  const R = (x, y, ww, hh, cls = 'mv-body', rx = 0) => `<rect x="${f2(x)}" y="${f2(y)}" width="${f2(Math.max(ww, 0.001))}" height="${f2(Math.max(hh, 0.001))}" rx="${rx}" class="${cls}" />`;
  const Ln = (x1, y1, x2, y2, cls = 'mv-line') => `<line x1="${f2(x1)}" y1="${f2(y1)}" x2="${f2(x2)}" y2="${f2(y2)}" class="${cls}" />`;
  const C = (cx, cy, r, cls = 'mv-body') => `<circle cx="${f2(cx)}" cy="${f2(cy)}" r="${f2(r)}" class="${cls}" />`;
  switch (c.modelo) {
    case 'sofa': case 'poltrona': {
      const b = Math.min(0.18, w * 0.12), e = Math.min(0.2, d * 0.24);
      let s = R(-hw, -hd, w, d, 'mv-body', 0.04) + R(-hw + b, -hd, w - 2 * b, e, 'mv-line') + Ln(-hw + b, -hd + e, -hw + b, hd) + Ln(hw - b, -hd + e, hw - b, hd);
      const n = c.modelo === 'poltrona' ? 1 : (w - 2 * b > 1.7 ? 3 : 2);
      for (let i = 1; i < n; i++) s += Ln(-hw + b + ((w - 2 * b) / n) * i, -hd + e, -hw + b + ((w - 2 * b) / n) * i, hd - 0.04);
      return s;
    }
    case 'sofaChaise': {
      const ds = Math.min(0.95, d), cw = Math.min(0.8, w * 0.38);
      return `<path d="M${-hw} ${-hd} H${hw} V${hd} H${hw - cw} V${-hd + ds} H${-hw} Z" class="mv-body" />` + R(-hw + 0.16, -hd, w - 0.32, 0.2, 'mv-line') + Ln(hw - cw, -hd + 0.2, hw - cw, -hd + ds);
    }
    case 'cama': {
      const cab = 0.06, np = w > 1.1 ? 2 : 1, pw = Math.min(0.6, (w - 0.14) / np);
      let s = R(-hw, -hd, w, d, 'mv-body', 0.02) + R(-hw, -hd, w, cab, 'mv-dark');
      for (let i = 0; i < np; i++) s += R((np === 1 ? -pw / 2 : (i ? 0.03 : -pw - 0.03)), -hd + cab + 0.06, pw, 0.34, 'mv-light', 0.05);
      const yd = -hd + cab + (d - cab) * 0.34;
      s += `<path d="M${-hw} ${f2(yd)} H${hw} V${hd} H${-hw} Z" class="mv-cor" />` + Ln(-hw, yd, hw, yd) + Ln(-hw, yd + 0.12, -hw + 0.12, yd);
      return s;
    }
    case 'beliche': return R(-hw, -hd, w, d) + Ln(-hw, -hd, hw, hd) + Ln(hw, -hd, -hw, hd) + R(-hw, -hd, w, 0.08, 'mv-dark');
    case 'berco': { let s = R(-hw, -hd, w, d); for (let i = 1; i < 8; i++) s += Ln(-hw + (w / 8) * i, -hd, -hw + (w / 8) * i, -hd + 0.06) + Ln(-hw + (w / 8) * i, hd, -hw + (w / 8) * i, hd - 0.06); return s; }
    case 'guardaRoupa': {
      let s = R(-hw, -hd, w, d) + Ln(-hw, -hd, hw, hd, 'mv-line fina');
      if (c.correr) s += Ln(-hw, hd - 0.05, 0.05, hd - 0.05) + Ln(-0.05, hd - 0.1, hw, hd - 0.1);
      else { const n = Math.max(2, Math.round(w / 0.45)); for (let i = 1; i < n; i++) s += Ln(-hw + (w / n) * i, hd - 0.06, -hw + (w / n) * i, hd); }
      return s;
    }
    case 'gaveteiro': case 'rack': return R(-hw, -hd, w, d) + Ln(-hw + 0.03, hd - 0.05, hw - 0.03, hd - 0.05);
    case 'aereo': return R(-hw, -hd, w, d, 'mv-body tracejado');
    case 'estante': { let s = R(-hw, -hd, w, d); s += Ln(-hw, 0, hw, 0, 'mv-line fina'); return s; }
    case 'mesa': case 'mesaCentro': return R(-hw, -hd, w, d, 'mv-body', 0.02);
    case 'mesaRedonda': return `<ellipse rx="${hw}" ry="${hd}" class="mv-body" />`;
    case 'jantar': {
      const td = Math.max(0.6, d - 0.6), nl = w >= 0.9 ? 2 : 1;
      let s = '';
      for (const sg of [-1, 1]) for (let i = 0; i < nl; i++) {
        const cx = nl === 1 ? 0 : (i ? 1 : -1) * w / 4;
        s += R(cx - 0.21, sg > 0 ? td / 2 - 0.02 : -td / 2 - 0.44, 0.42, 0.46, 'mv-light', 0.04);
      }
      return s + R(-hw, -td / 2, w, td, 'mv-body', 0.02);
    }
    case 'jantarRedonda': {
      const r = Math.max(0.35, Math.min(w, d) / 2 - 0.32);
      let s = '';
      for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2; s += `<g transform="translate(${f2(Math.sin(a) * (r + 0.1))} ${f2(Math.cos(a) * (r + 0.1))}) rotate(${-deg(a)})">${R(-0.21, -0.18, 0.42, 0.44, 'mv-light', 0.04)}</g>`; }
      return s + C(0, 0, r);
    }
    case 'cadeira': return R(-hw, -hd, w, d, 'mv-body', 0.03) + Ln(-hw, -hd + 0.05, hw, -hd + 0.05);
    case 'banqueta': return C(0, 0, hw);
    case 'cadeiraEscritorio': return C(0, 0.03, Math.min(hw, hd) * 0.9) + R(-hw + 0.06, -hd, w - 0.12, 0.08, 'mv-dark', 0.03);
    case 'geladeira': return R(-hw, -hd, w, d) + Ln(-hw, -hd, hw, hd, 'mv-line fina') + Ln(hw, -hd, -hw, hd, 'mv-line fina');
    case 'fogao': { let s = R(-hw, -hd, w, d); for (const sx of [-1, 1]) for (const sz of [-1, 1]) s += C(sx * w * 0.24, sz * d * 0.22 - 0.03, Math.min(w, d) * 0.12, 'mv-line'); return s; }
    case 'maquina': return R(-hw, -hd, w, d, 'mv-body', 0.03) + C(0, 0.02, Math.min(w, d) * 0.32, 'mv-line');
    case 'microondas': return R(-hw, -hd, w, d, 'mv-body tracejado');
    case 'tv': case 'quadro': case 'espelho': case 'prateleira': case 'split': case 'painel':
      return R(-hw, -hd, w, Math.max(d, 0.03), 'mv-dark' + (it.elev >= 1.0 ? ' tracejado' : ''));
    case 'tapete': return R(-hw, -hd, w, d, 'mv-tapete', 0.02);
    case 'tapeteRedondo': return `<ellipse rx="${hw}" ry="${hd}" class="mv-tapete" />`;
    case 'planta': { let s = C(0, 0, Math.min(hw, hd) * 0.55, 'mv-body'); for (let i = 0; i < 7; i++) { const a = i * 0.9; s += `<ellipse cx="${f2(Math.cos(a) * hw * 0.55)}" cy="${f2(Math.sin(a) * hd * 0.55)}" rx="${f2(hw * 0.38)}" ry="${f2(hw * 0.16)}" transform="rotate(${f2(deg(a))} ${f2(Math.cos(a) * hw * 0.55)} ${f2(Math.sin(a) * hd * 0.55)})" class="mv-folha" />`; } return s; }
    case 'luminaria': return C(0, 0, Math.min(hw, hd), 'mv-luz') + Ln(-hw * 0.6, 0, hw * 0.6, 0) + Ln(0, -hd * 0.6, 0, hd * 0.6);
    case 'plafon': return C(0, 0, hw, 'mv-luz') + C(0, 0, hw * 0.55, 'mv-line fina');
    case 'plafonQuad': return R(-hw, -hd, w, d, 'mv-luz', 0.02) + R(-hw * 0.6, -hd * 0.6, w * 0.6, d * 0.6, 'mv-line fina');
    case 'painelLed': return R(-hw, -hd, w, d, 'mv-luz') + Ln(-hw, -hd, hw, hd, 'mv-line fina') + Ln(hw, -hd, -hw, hd, 'mv-line fina');
    case 'spot': return C(0, 0, hw * 0.9, 'mv-luz') + C(0, 0, hw * 0.35, 'mv-body');
    case 'kitSpots': { let q = R(-hw, -hd, w, d, 'mv-line fina tracejado'); for (const sx of [-1, 1]) for (const sz of [-1, 1]) q += C(sx * w * 0.32, sz * d * 0.32, 0.05, 'mv-luz'); return q; }
    case 'trilho': return R(-hw, -0.02, w, 0.04, 'mv-dark') + [-1, 0, 1].map((k) => C(k * w * 0.32, 0, 0.05, 'mv-luz')).join('');
    case 'lustreCristal': { let q = C(0, 0, hw, 'mv-luz tracejado'); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; q += C(Math.cos(a) * hw * 0.68, Math.sin(a) * hw * 0.68, 0.045, 'mv-body'); } return q + C(0, 0, hw * 0.22, 'mv-body'); }
    case 'lustreAros': return C(0, 0, hw, 'mv-line') + C(0, 0, hw * 0.7, 'mv-luz') + C(0, 0, hw * 0.4, 'mv-line') + C(0, 0, 0.03, 'mv-body');
    case 'pendente': case 'pendenteGlobo': return C(0, 0, hw, 'mv-luz') + C(0, 0, hw * 0.35, 'mv-body');
    case 'pendenteTrio': return [-1, 0, 1].map((k) => C(k * w * 0.34, 0, Math.min(0.11, hd * 0.9), 'mv-luz')).join('') + Ln(-w * 0.34, 0, w * 0.34, 0, 'mv-line fina');
    case 'arandela': return R(-hw, -hd, w, Math.max(d, 0.03), 'mv-luz', 0.04);
    case 'abajur': return C(0, 0, hw, 'mv-luz') + C(0, 0, hw * 0.4, 'mv-body');
    case 'luminariaMesa': return C(0, 0.04, Math.min(hw, hd) * 0.55, 'mv-body') + Ln(0, 0.04, 0, -hd * 0.8) + C(0, -hd * 0.8, 0.05, 'mv-luz');
    case 'espelhoRedondo': case 'nicho': case 'quadroTrio':
      return R(-hw, -hd, w, Math.max(d, 0.03), 'mv-dark' + (it.elev >= 1.0 ? ' tracejado' : ''));
    case 'puff': return C(0, 0, Math.min(hw, hd), 'mv-body') + C(0, 0, Math.min(hw, hd) * 0.55, 'mv-line fina');
    case 'vasoDeco': return C(0, 0, hw, 'mv-body') + C(0, 0, hw * 0.55, 'mv-line');
    case 'cesto': return C(0, 0, hw, 'mv-body') + C(0, 0, hw * 0.7, 'mv-line fina');
    case 'cortina': { let p = `M${-hw} 0`; const n = Math.max(6, Math.round(w / 0.12)); for (let i = 1; i <= n; i++) p += ` Q${f2(-hw + (w / n) * (i - 0.5))} ${i % 2 ? -hd : hd} ${f2(-hw + (w / n) * i)} 0`; return `<path d="${p}" class="mv-line cortina" />`; }
    case 'varal': return R(-hw, -hd, w, d, 'mv-body tracejado') + Ln(-hw, 0, hw, 0);
    default: return R(-hw, -hd, w, d, 'mv-body', 0.01);
  }
}


export function createPlan2D(host, opts = {}) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'plan-svg');
  svg.setAttribute('role', 'application');
  svg.setAttribute('aria-label', 'Planta do apartamento. Arraste os móveis para reposicionar.');
  host.appendChild(svg);
  svg.innerHTML = `
    <defs>
      <pattern id="pat-hatch" patternUnits="userSpaceOnUse" width="0.08" height="0.08" patternTransform="rotate(45)">
        <path d="M0 0V0.08" class="hatch-line" />
      </pattern>
    </defs>
    <g class="world">
      <g class="l-rooms"></g><g class="l-circ"></g><g class="l-fix"></g><g class="l-open"></g>
      <g class="l-walls"></g><g class="l-alert"></g><g class="l-items"></g><g class="l-dist"></g>
    </g>
    <g class="screen"><g class="l-labels"></g><g class="l-cotas"></g><g class="l-dlabels"></g><g class="l-handles"></g><g class="l-badges"></g></g>`;
  const $ = (c) => svg.querySelector(c);
  const world = $('.world');
  const L = {
    rooms: $('.l-rooms'), circ: $('.l-circ'), fix: $('.l-fix'), open: $('.l-open'), walls: $('.l-walls'),
    alert: $('.l-alert'), items: $('.l-items'), dist: $('.l-dist'),
    labels: $('.l-labels'), cotas: $('.l-cotas'), dlabels: $('.l-dlabels'), handles: $('.l-handles'), badges: $('.l-badges'),
  };

  let plan = null, analise = { alertas: [], circ: null };
  const rotulos = new Map();
  // posiciona o nome do cômodo no ponto mais livre de móveis, perto do centro
  function calcularRotulos() {
    rotulos.clear();
    const obst = [...store.projeto.itens.filter((i) => !catalogoPorId[i.tipo]?.livre).map((i) => rectCorners(i)), ...plan.fixos.map((f) => f.poly)];
    const distPoly = (x, y, P) => {
      if (pointInPoly(x, y, P)) return 0;
      let best = Infinity;
      for (let i = 0; i < P.length; i++) {
        const [ax, ay] = P[i], [bx, by] = P[(i + 1) % P.length];
        const ex = bx - ax, ey = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * ex + (y - ay) * ey) / (ex * ex + ey * ey)));
        best = Math.min(best, Math.hypot(x - ax - ex * t, y - ay - ey * t));
      }
      return best;
    };
    // cotas oficiais também contam como ocupadas, para o nome do cômodo não cair sobre elas
    const postos = flags.cotas ? plan.tip.cotas.map(([, x1, y1, x2, y2, off]) => {
      const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy);
      return [(x1 + x2) / 2 - (dy / l) * off, (y1 + y2) / 2 + (dx / l) * off];
    }) : [];
    const ordem = [...plan.rooms].sort((a, b) => a.areaGeo - b.areaGeo);
    for (const r of ordem) {
      const [cx, cy] = r.centro;
      let best = null, bs = -Infinity;
      const xs = r.poly.map((p) => p[0]), ys = r.poly.map((p) => p[1]);
      for (let x = Math.min(...xs) + 0.35; x <= Math.max(...xs) - 0.35; x += 0.1) {
        for (let y = Math.min(...ys) + 0.2; y <= Math.max(...ys) - 0.2; y += 0.1) {
          if (!pointInPoly(x, y, r.poly)) continue;
          let livre = Math.min(0.55, distPoly(x, y, r.poly.map((p) => p)) || 0.55);
          // distância às bordas do cômodo
          let borda = Infinity;
          for (let i = 0; i < r.poly.length; i++) {
            const [ax, ay] = r.poly[i], [bx, by] = r.poly[(i + 1) % r.poly.length];
            const ex = bx - ax, ey = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * ex + (y - ay) * ey) / (ex * ex + ey * ey)));
            borda = Math.min(borda, Math.hypot(x - ax - ex * t, y - ay - ey * t));
          }
          livre = Math.min(0.55, borda);
          for (const P of obst) { livre = Math.min(livre, distPoly(x, y, P)); if (livre <= 0) break; }
          let sc = livre - 0.18 * Math.hypot(x - cx, y - cy);
          for (const [px, py] of postos) { const dx = Math.abs(x - px), dy = Math.abs(y - py); if (dx < 1.6 && dy < 0.55) sc -= 2; }
          if (sc > bs) { bs = sc; best = [x, y]; }
        }
      }
      rotulos.set(r.id, best || r.centro);
      postos.push(best || r.centro);
    }
  }
  const view = { s: 60, tx: 0, ty: 0, rot: 0 };
  const flags = { cotas: false, circulacao: false, distancias: true, nomes: true };
  let ferramenta = 'moveis', luzEstado = {};
  // rot = 90 gira a vista (planta alongada em tela retrato); textos continuam na horizontal
  const W2S = (x, y) => { const [u, v] = view.rot ? [-y, x] : [x, y]; return [u * view.s + view.tx, v * view.s + view.ty]; };
  const S2W = (sx, sy) => { const u = (sx - view.tx) / view.s, v = (sy - view.ty) / view.s; return view.rot ? [v, -u] : [u, v]; };
  const ptsAttr = (P) => P.map(([x, y]) => `${f2(x)},${f2(y)}`).join(' ');

  // ------------------------------------------------------------ desenho estático
  function desenharPlanta() {
    const { tip } = plan;
    let h = '';
    for (const r of plan.rooms) {
      h += `<polygon points="${ptsAttr(r.poly)}" class="room" data-room="${r.id}" style="fill:${pisoDe(store.projeto?.acab, r).cor2d}" />`;
    }
    for (const r of plan.rooms) h += `<polygon points="${ptsAttr(r.poly)}" class="room-hit" data-room="${r.id}" />`;
    L.rooms.innerHTML = h;
    h = '';
    for (const p of plan.pieces) {
      if (p.verga) continue;
      const cls = p.sob ? 'wall sob' : p.w.guarda ? 'wall guarda' : 'wall';
      h += `<polygon points="${ptsAttr(p.poly)}" class="${cls}" />`;
    }
    L.walls.innerHTML = h;
    h = '';
    for (const o of plan.openings) {
      const w = o.w, half = w.t / 2;
      if (!o.porta) {
        // janela: três linhas paralelas
        for (const k of [-half, 0, half]) {
          const a = wallPoint(w, o.s0, k), b = wallPoint(w, o.s1, k);
          h += `<line x1="${f2(a[0])}" y1="${f2(a[1])}" x2="${f2(b[0])}" y2="${f2(b[1])}" class="janela" />`;
        }
        const a = wallPoint(w, o.s0, -half), b = wallPoint(w, o.s1, half);
        h += `<rect class="janela-box" x="${f2(Math.min(a[0], b[0]))}" y="${f2(Math.min(a[1], b[1]))}" width="${f2(Math.abs(a[0] - b[0]))}" height="${f2(Math.abs(a[1] - b[1]))}" />`;
      } else if (o.correr) {
        const m = (o.s0 + o.s1) / 2;
        for (const [a0, a1, k] of [[o.s0, m + 0.05, -0.03], [m - 0.05, o.s1, 0.03]]) {
          const A = wallPoint(w, a0, k - 0.012), B = wallPoint(w, a1, k + 0.012);
          h += `<rect class="porta-correr" x="${f2(Math.min(A[0], B[0]))}" y="${f2(Math.min(A[1], B[1]))}" width="${f2(Math.abs(A[0] - B[0]))}" height="${f2(Math.abs(A[1] - B[1]))}" />`;
        }
      } else {
        const { hinge, closed, open } = o;
        const r = o.largura;
        const sweep = o.arc.da > 0 ? 1 : 0;
        h += `<path class="porta-arco" d="M${f2(closed[0])} ${f2(closed[1])} A${f2(r)} ${f2(r)} 0 0 ${sweep} ${f2(open[0])} ${f2(open[1])}" />`;
        h += `<line class="porta-folha" x1="${f2(hinge[0])}" y1="${f2(hinge[1])}" x2="${f2(open[0])}" y2="${f2(open[1])}" />`;
        const a = wallPoint(w, o.s0, 0), b = wallPoint(w, o.s1, 0);
        h += `<line class="porta-soleira" x1="${f2(a[0])}" y1="${f2(a[1])}" x2="${f2(b[0])}" y2="${f2(b[1])}" />`;
      }
    }
    L.open.innerHTML = h;
    h = '';
    for (const f of plan.fixos) {
      h += `<g transform="translate(${f2(f.x)} ${f2(f.y)}) rotate(${f.rot || 0})" class="fixo">${simboloFixo(f)}</g>`;
    }
    L.fix.innerHTML = h;
    void tip;
  }

  function simboloFixo(f) {
    const { w, d } = f, hw = w / 2, hd = d / 2;
    const R = `<rect x="${-hw}" y="${-hd}" width="${w}" height="${d}" class="fx-body" />`;
    switch (f.tipo) {
      case 'bancada': return R + `<rect x="${-hw * 0.24 - 0.25}" y="${-hd + 0.08}" width="0.5" height="0.36" rx="0.04" class="fx-line" /><circle cx="${-hw * 0.24}" cy="${-hd + 0.05}" r="0.02" class="fx-line" />`;
      case 'tanque': return R + `<rect x="${-hw + 0.05}" y="${-hd + 0.06}" width="${w - 0.1}" height="${d - 0.12}" rx="0.05" class="fx-line" />`;
      case 'vaso': return `<rect x="${-hw}" y="${-hd}" width="${w}" height="0.18" rx="0.03" class="fx-body" /><ellipse cx="0" cy="${-hd + 0.18 + (d - 0.18) / 2}" rx="${hw}" ry="${(d - 0.18) / 2}" class="fx-body" />`;
      case 'lavatorio': return `<rect x="${-hw}" y="${-hd}" width="${w}" height="${d}" rx="0.08" class="fx-body" /><ellipse cx="0" cy="0.02" rx="${hw * 0.7}" ry="${hd * 0.6}" class="fx-line" />`;
      case 'box': return `<rect x="${-hw}" y="${-hd}" width="${w}" height="${d}" class="fx-box" /><line x1="${-hw}" y1="${-hd}" x2="${hw}" y2="${hd}" class="fx-line fina" /><line x1="${hw}" y1="${-hd}" x2="${-hw}" y2="${hd}" class="fx-line fina" /><circle r="0.04" class="fx-line" />`;
      default: return R;
    }
  }

  const simbolo = simboloItem;

  // ------------------------------------------------------------ desenho dinâmico
  function desenharItens() {
    const itens = store.projeto.itens;
    calcularRotulos();
    const nivel = new Map();
    for (const a of analise.alertas) {
      const n = nivel.get(a.uid);
      if (a.nivel === 'erro' || (a.nivel === 'aviso' && n !== 'erro') || !n) nivel.set(a.uid, a.nivel === 'info' && n ? n : a.nivel);
    }
    // ordem: tapetes, piso, elevados
    const ord = [...itens].sort((a, b) => (catalogoPorId[a.tipo]?.livre ? -1 : 0) - (catalogoPorId[b.tipo]?.livre ? -1 : 0) || (a.elev || 0) - (b.elev || 0));
    let h = '';
    for (const it of ord) {
      const n = nivel.get(it.uid);
      const sel = it.uid === store.sel;
      const style = `--mv:${it.cor}`;
      h += `<g class="item${sel ? ' sel' : ''}${n ? ' n-' + n : ''}${it.elev >= 1.0 ? ' elevado' : ''}" data-uid="${it.uid}" style="${style}" transform="translate(${f2(it.x)} ${f2(it.y)}) rotate(${f2(it.rot || 0)})">`;
      h += `<rect class="hit" x="${f2(-it.w / 2)}" y="${f2(-it.d / 2)}" width="${f2(it.w)}" height="${f2(Math.max(it.d, 0.04))}" />`;
      h += simbolo(it);
      if (n === 'erro') h += `<rect class="mv-erro" x="${f2(-it.w / 2)}" y="${f2(-it.d / 2)}" width="${f2(it.w)}" height="${f2(Math.max(it.d, 0.03))}" />`;
      h += '</g>';
    }
    L.items.innerHTML = h;
    // portas e faixas afetadas pelo item selecionado
    let ha = '';
    for (const a of analise.alertas) {
      if (!a.poly || a.nivel === 'erro') continue;
      if (store.sel && a.uid !== store.sel) continue;
      ha += `<polygon points="${ptsAttr(a.poly)}" class="alerta-area ${a.nivel}" />`;
    }
    L.alert.innerHTML = ha;
  }

  function desenharDistancias() {
    const it = store.projeto.itens.find((i) => i.uid === store.sel);
    let h = '', hl = '';
    if (it && flags.distancias && !drag?.pan) {
      for (const d of distancias(plan, store.projeto.itens, it)) {
        if (d.dist < 0.005 || d.dist > 4) continue;
        const [x1, y1] = d.de, [x2, y2] = d.ate;
        h += `<line x1="${f2(x1)}" y1="${f2(y1)}" x2="${f2(x2)}" y2="${f2(y2)}" class="dist" />`;
        h += `<circle cx="${f2(x2)}" cy="${f2(y2)}" r="0.025" class="dist-pt" />`;
        const [sx, sy] = W2S((x1 + x2) / 2, (y1 + y2) / 2);
        const txt = `${cm(d.dist)} cm`;
        hl += `<g transform="translate(${f2(sx)} ${f2(sy)})"><rect x="-${txt.length * 3.6 + 6}" y="-10" width="${txt.length * 7.2 + 12}" height="20" rx="10" class="dist-tag" /><text class="dist-txt" text-anchor="middle" dy="4">${txt}</text></g>`;
      }
    }
    L.dist.innerHTML = h;
    L.dlabels.innerHTML = hl;
  }

  function desenharTela() {
    // rótulos dos cômodos: nome completo se couber, abreviado se não, e sem sobreposição
    let h = '';
    const sMin = view.s;
    const CURTO = { 'Serviço + varanda': 'SERV.', 'Cozinha + jantar': 'COZ.', 'Circulação': 'CIRC.', 'Banheiro 1': 'WC 1', 'Banheiro 2': 'WC 2' };
    const larg = (t) => t.length * 7.2 + 6;
    const caixas = [];
    const livre = (b) => !caixas.some((c) => Math.abs(c.x - b.x) < (c.w + b.w) / 2 && Math.abs(c.y - b.y) < (c.h + b.h) / 2);
    const ordem = [...plan.rooms].sort((a, b) => (a.banho || a.id === 'circ' ? 1 : 0) - (b.banho || b.id === 'circ' ? 1 : 0) || b.area - a.area);
    for (const r of ordem) {
      if (r.id === 'circ' && plan.tip.id === 'ponta') continue;
      if (!flags.nomes || (sMin < 34 && (r.banho || r.id === 'circ'))) continue;
      const [cx, cy] = W2S(...(rotulos.get(r.id) || r.centro));
      const xs = r.poly.map((q) => q[0]), larguraTela = (Math.max(...xs) - Math.min(...xs)) * sMin;
      const area = `${r.area.toFixed(2).replace('.', ',')} m²`;
      let nome = ABREV[r.nome] || r.nome.toUpperCase();
      const [rx, ry] = rotulos.get(r.id) || r.centro;
      const cabe = (t) => { const hw = larg(t) / 2 / sMin; return pointInPoly(rx - hw, ry, r.poly) && pointInPoly(rx + hw, ry, r.poly); };
      if ((larg(nome) > larguraTela * 0.92 || !cabe(nome)) && CURTO[r.nome]) nome = CURTO[r.nome];
      let comArea = sMin >= 46 && !store.sel;
      let box = { x: cx, y: cy + (comArea ? 6 : 0), w: Math.max(larg(nome), comArea ? 58 : 0), h: comArea ? 28 : 14 };
      if (!livre(box) && CURTO[r.nome]) { nome = CURTO[r.nome]; box = { ...box, w: Math.max(larg(nome), comArea ? 58 : 0) }; }
      if (!livre(box) && comArea) { comArea = false; box = { x: cx, y: cy, w: larg(nome), h: 14 }; }
      if (!livre(box)) continue;
      caixas.push(box);
      h += `<g transform="translate(${f2(cx)} ${f2(cy)})" class="room-label"><text class="rl-nome" text-anchor="middle">${esc(nome)}</text>${comArea ? `<text class="rl-area" text-anchor="middle" dy="13">${area}</text>` : ''}</g>`;
    }
    L.labels.innerHTML = h;
    // cotas oficiais
    let hc = '';
    if (flags.cotas && view.s > 38) {
      for (const [txt, x1, y1, x2, y2, off] of plan.tip.cotas) {
        const dx = x2 - x1, dy = y2 - y1, l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l;
        const a = W2S(x1 + nx * off, y1 + ny * off), b = W2S(x2 + nx * off, y2 + ny * off);
        const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const ang = Math.abs(b[0] - a[0]) > Math.abs(b[1] - a[1]) ? 0 : -90;
        const tk = 4;
        hc += `<line x1="${f2(a[0])}" y1="${f2(a[1])}" x2="${f2(b[0])}" y2="${f2(b[1])}" class="cota" />`;
        for (const p of [a, b]) hc += `<line x1="${f2(p[0] - tk)}" y1="${f2(p[1] + tk)}" x2="${f2(p[0] + tk)}" y2="${f2(p[1] - tk)}" class="cota-tick" />`;
        hc += `<text transform="translate(${f2(m[0])} ${f2(m[1])}) rotate(${ang})" dy="-4" text-anchor="middle" class="cota-txt">${txt}</text>`;
      }
    }
    L.cotas.innerHTML = hc;
    desenharHandles();
    desenharBadges();
  }

  // interruptores no modo Luz: um botão por cômodo
  function desenharBadges() {
    if (ferramenta !== 'luz') { L.badges.innerHTML = ''; return; }
    let h = '';
    for (const r of plan.rooms) {
      if (r.id === 'circ' && plan.tip.id === 'ponta') continue;
      const [cx, cy] = W2S(...(rotulos.get(r.id) || r.centro));
      const on = luzEstado[r.id] !== false;
      h += `<g class="luz-badge${on ? ' on' : ''}" data-room="${r.id}" transform="translate(${f2(cx)} ${f2(cy - 24)})" role="button" aria-label="${on ? 'Apagar' : 'Acender'} ${esc(r.nome)}"><circle r="15" class="lb-c" /><path class="lb-i" d="M-4.5 2.5a5.4 5.4 0 117.2 -4.6c-.9.7-1.5 1.5-1.5 2.6h-4.2c0-1.1-.6-1.9-1.5-2.6M-2.2 5.2h4.4M-1.6 7.4h3.2" transform="translate(0 -2)" /></g>`;
    }
    L.badges.innerHTML = h;
  }

  // alças de seleção (em pixels de tela)
  function desenharHandles() {
    const it = store.projeto?.itens.find((i) => i.uid === store.sel);
    if (!it || drag?.pan || ferramenta === 'paredes' || ferramenta === 'piso' || ferramenta === 'teto') { L.handles.innerHTML = ''; opts.onSelScreen?.(null); return; }
    const hw = it.w / 2, hd = it.d / 2;
    const P = (lx, ly) => W2S(...localToPlan(it, lx, ly));
    let h = '';
    const cs = [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([x, y]) => P(x, y));
    h += `<polygon points="${cs.map((p) => p.map(f2).join(',')).join(' ')}" class="sel-outline" />`;
    const rotPos = P(0, -hd - 26 / view.s);
    const topMid = P(0, -hd);
    h += `<line x1="${f2(topMid[0])}" y1="${f2(topMid[1])}" x2="${f2(rotPos[0])}" y2="${f2(rotPos[1])}" class="sel-stem" />`;
    h += `<g class="handle rot" data-h="rot" transform="translate(${f2(rotPos[0])} ${f2(rotPos[1])})"><circle r="15" class="h-hit" /><circle r="8" class="h-dot" /><path d="M-3.5 -1.5 A4 4 0 1 1 -2 3" class="h-ico" /></g>`;
    // alças de borda só quando o móvel é grande o bastante na tela
    const lado = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    const gr = lado(cs[0], cs[1]) > 78, gp = lado(cs[1], cs[2]) > 78;
    const hs = [['ne', hw, -hd], ['nw', -hw, -hd], ['se', hw, hd], ['sw', -hw, hd]];
    if (gr) hs.push(['s', 0, hd], ['n', 0, -hd]);
    if (gp) hs.push(['e', hw, 0], ['w', -hw, 0]);
    for (const [k, lx, ly] of hs) {
      const [sx, sy] = P(lx, ly);
      const corner = k.length === 2;
      h += `<g class="handle rs ${corner ? 'corner' : 'edge'}" data-h="${k}" transform="translate(${f2(sx)} ${f2(sy)})"><circle r="14" class="h-hit" /><rect x="-5" y="-5" width="10" height="10" rx="${corner ? 2 : 5}" class="h-box" /></g>`;
    }
    // etiqueta de medidas
    const c = P(0, hd + 24 / view.s);
    const dim = `${cm(it.w)} × ${cm(it.d)} cm`;
    h += `<g transform="translate(${f2(c[0])} ${f2(c[1])})" class="dim-wrap"><rect x="-${dim.length * 3.5 + 8}" y="-10" width="${dim.length * 7 + 16}" height="20" rx="10" class="dim-tag" /><text text-anchor="middle" dy="4" class="dim-txt">${dim}</text></g>`;
    L.handles.innerHTML = h;
    if (opts.onSelScreen) {
      const r = svg.getBoundingClientRect();
      const topo = cs.reduce((a, p) => (p[1] < a[1] ? p : a), cs[0]);
      const x = cs.reduce((a, p) => a + p[0], 0) / 4;
      opts.onSelScreen({ x, y: Math.min(topo[1], rotPos[1]) - 6, w: r.width, h: r.height, vis: true });
    }
  }

  function desenharCirculacao() {
    const c = analise.circ;
    if (!flags.circulacao || !c) { L.circ.innerHTML = ''; return; }
    const cv = document.createElement('canvas'); cv.width = c.W; cv.height = c.H;
    const g = cv.getContext('2d'); const img = g.createImageData(c.W, c.H);
    const raio = c.passagem / 2 - c.cell * 0.6;
    const banhos = plan.rooms.filter((r) => r.banho);
    for (let k = 0; k < c.W * c.H; k++) {
      if (!c.interior[k] || c.blocked[k] || c.dist[k] < raio) continue;
      let rgba;
      if (c.reach[k]) rgba = [62, 150, 104, 120];
      else {
        const x = c.x0 + (k % c.W) * c.cell, y = c.y0 + ((k / c.W) | 0) * c.cell;
        if (banhos.some((r) => pointInPoly(x, y, r.poly))) continue;
        rgba = [200, 60, 45, 150];
      }
      img.data.set(rgba, k * 4);
    }
    g.putImageData(img, 0, 0);
    const x = c.x0 - c.cell / 2, y = c.y0 - c.cell / 2;
    L.circ.innerHTML = `<image href="${cv.toDataURL()}" x="${f2(x)}" y="${f2(y)}" width="${f2(c.W * c.cell)}" height="${f2(c.H * c.cell)}" preserveAspectRatio="none" style="image-rendering:pixelated" />`;
  }

  function aplicarView() {
    world.setAttribute('transform', `translate(${f2(view.tx)} ${f2(view.ty)}) scale(${f2(view.s)}) rotate(${view.rot})`);
    svg.style.setProperty('--px', 1 / view.s);
    svg.dataset.det = view.s < 44 ? 'baixo' : 'alto';
    desenharTela();
    desenharDistancias();
    opts.onView?.(view);
  }

  function fit() {
    if (!plan) return;
    const r = svg.getBoundingClientRect();
    const { x0, y0, x1, y1 } = plan.bb;
    const pad = r.width < 600 ? 28 : 64;
    const bw = x1 - x0, bh = y1 - y0;
    const sNormal = Math.min((r.width - pad * 2) / bw, (r.height - pad * 2) / bh);
    const sGirado = Math.min((r.width - pad * 2) / bh, (r.height - pad * 2) / bw);
    view.rot = sGirado > sNormal * 1.25 ? 90 : 0;
    const s = view.rot ? sGirado : sNormal;
    view.s = Math.max(20, Math.min(220, s));
    const [uc, vc] = view.rot ? [-(y0 + y1) / 2, (x0 + x1) / 2] : [(x0 + x1) / 2, (y0 + y1) / 2];
    view.tx = r.width / 2 - uc * view.s;
    view.ty = r.height / 2 - vc * view.s;
    aplicarView();
  }

  function zoomAt(sx, sy, k) {
    const u = (sx - view.tx) / view.s, v = (sy - view.ty) / view.s;
    view.s = Math.max(15, Math.min(400, view.s * k));
    view.tx = sx - u * view.s; view.ty = sy - v * view.s;
    aplicarView();
  }

  // ------------------------------------------------------------ interação
  const pointers = new Map();
  let drag = null;
  const rel = (ev) => { const r = svg.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; };

  function snapItem(it, ignorarSnap) {
    return snapShared(plan, store.projeto.itens, it, ignorarSnap);
  }

  svg.addEventListener('pointerdown', (ev) => {
    if (!plan) return;
    const badge = ev.target.closest?.('.luz-badge');
    if (badge) { ev.preventDefault(); opts.onLuzToggle?.(badge.dataset.room); return; }
    svg.setPointerCapture(ev.pointerId);
    const p = rel(ev);
    pointers.set(ev.pointerId, p);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      if (drag?.kind === 'move' || drag?.kind === 'resize' || drag?.kind === 'rot') commit();
      drag = { kind: 'pinch', d0: Math.hypot(a[0] - b[0], a[1] - b[1]), m0: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], s0: view.s, tx0: view.tx, ty0: view.ty, pan: true };
      return;
    }
    const hEl = ev.target.closest('.handle');
    const itEl = ev.target.closest('.item');
    const sel = store.projeto.itens.find((i) => i.uid === store.sel);
    if (hEl && sel) {
      const k = hEl.dataset.h;
      if (k === 'rot') drag = { kind: 'rot', uid: sel.uid, rot0: sel.rot };
      else drag = { kind: 'resize', uid: sel.uid, k, start: { ...sel } };
    } else if (itEl && ev.button !== 1) {
      const uid = itEl.dataset.uid;
      select(uid);
      const it = store.projeto.itens.find((i) => i.uid === uid);
      const [wx, wy] = S2W(...p);
      drag = { kind: 'move', uid, ox: it.x - wx, oy: it.y - wy, sx: p[0], sy: p[1], moved: false };
    } else {
      drag = { kind: 'pan', sx: p[0], sy: p[1], tx0: view.tx, ty0: view.ty, pan: true, moved: false };
    }
  });

  svg.addEventListener('pointermove', (ev) => {
    if (!pointers.has(ev.pointerId)) {
      // cursor
      return;
    }
    const p = rel(ev);
    pointers.set(ev.pointerId, p);
    if (!drag) return;
    if (drag.kind === 'pinch' && pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const k = d / drag.d0;
      const [wx, wy] = [(drag.m0[0] - drag.tx0) / drag.s0, (drag.m0[1] - drag.ty0) / drag.s0];
      view.s = Math.max(15, Math.min(400, drag.s0 * k));
      view.tx = m[0] - wx * view.s; view.ty = m[1] - wy * view.s;
      aplicarView(); return;
    }
    if (drag.kind === 'pan') {
      if (Math.hypot(p[0] - drag.sx, p[1] - drag.sy) > 3) drag.moved = true;
      view.tx = drag.tx0 + p[0] - drag.sx; view.ty = drag.ty0 + p[1] - drag.sy;
      aplicarView(); return;
    }
    const [wx, wy] = S2W(...p);
    if (drag.kind === 'move') {
      if (!drag.moved && Math.hypot(p[0] - drag.sx, p[1] - drag.sy) < 3) return;
      if (!drag.moved) opts.onPegar?.('move', store.projeto.itens.find((i) => i.uid === drag.uid));
      drag.moved = true;
      let enc = false;
      live((proj) => {
        const it = proj.itens.find((i) => i.uid === drag.uid);
        it.x = wx + drag.ox; it.y = wy + drag.oy;
        enc = snapItem(it, ev.shiftKey || ev.altKey);
        opts.aoMover?.(it);
      });
      if (enc && !drag.encostou) opts.onEncaixe?.();
      drag.encostou = enc;
    } else if (drag.kind === 'rot') {
      live((proj) => {
        const it = proj.itens.find((i) => i.uid === drag.uid);
        let a = deg(Math.atan2(wy - it.y, wx - it.x)) + 90;
        if (!ev.shiftKey) { a = Math.round(a / 15) * 15; } else a = Math.round(a);
        it.rot = ((a % 360) + 360) % 360;
      });
    } else if (drag.kind === 'resize') {
      live((proj) => {
        const it = proj.itens.find((i) => i.uid === drag.uid);
        const s = drag.start;
        const [lx, ly] = planToLocal(s, wx, wy);
        let x0 = -s.w / 2, x1 = s.w / 2, y0 = -s.d / 2, y1 = s.d / 2;
        const r1 = (v) => Math.round(v * 100) / 100;
        if (drag.k.includes('e')) x1 = Math.max(x0 + 0.1, x0 + r1(lx - x0));
        if (drag.k.includes('w')) x0 = Math.min(x1 - 0.1, x1 - r1(x1 - lx));
        if (drag.k.includes('s')) y1 = Math.max(y0 + 0.02, y0 + r1(ly - y0));
        if (drag.k.includes('n')) y0 = Math.min(y1 - 0.02, y1 - r1(y1 - ly));
        const [cx, cy] = localToPlan(s, (x0 + x1) / 2, (y0 + y1) / 2);
        it.w = r1(x1 - x0); it.d = r1(y1 - y0); it.x = cx; it.y = cy;
      });
    }
  });

  const fim = (ev) => {
    pointers.delete(ev.pointerId);
    if (!drag) return;
    if (drag.kind === 'pinch') { if (pointers.size === 0) drag = null; aplicarView(); return; }
    if (drag.kind === 'pan') {
      if (!drag.moved) {
        const sup = ferramenta === 'paredes' || ferramenta === 'piso' || ferramenta === 'teto';
        const [wx, wy] = S2W(...rel(ev));
        const r = plan.rooms.find((q) => pointInPoly(wx, wy, q.poly));
        if (sup && r) opts.onRoomClick?.(r.id, ferramenta);
        else if (!sup) select(null);
      }
      drag = null; aplicarView(); return;
    }
    commit();
    const feito = drag;
    drag = null;
    if (feito.kind !== 'move' || feito.moved) opts.onSoltar?.(feito.kind, store.projeto.itens.find((i) => i.uid === feito.uid));
    desenharTela(); desenharDistancias();
  };
  svg.addEventListener('pointerup', fim);
  svg.addEventListener('pointercancel', fim);
  svg.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const [sx, sy] = rel(ev);
    if (ev.ctrlKey || Math.abs(ev.deltaY) > 0) zoomAt(sx, sy, Math.exp(-ev.deltaY * (ev.ctrlKey ? 0.01 : 0.0018)));
  }, { passive: false });
  svg.addEventListener('dblclick', (ev) => { if (!ev.target.closest('.item')) fit(); });

  const ro = new ResizeObserver(() => { if (plan) { const keep = view.s; if (!host.dataset.fitted) { fit(); host.dataset.fitted = '1'; } else { void keep; aplicarView(); } } });
  ro.observe(host);

  return {
    setPlan(p) { plan = p; host.dataset.fitted = ''; desenharPlanta(); requestAnimationFrame(() => { fit(); host.dataset.fitted = '1'; }); },
    redrawItems() { if (!plan) return; desenharItens(); desenharTela(); desenharDistancias(); },
    setAnalise(a) { analise = a; if (plan) { desenharItens(); desenharCirculacao(); } },
    redrawAcab() {
      if (!plan) return;
      for (const r of plan.rooms) { const el = L.rooms.querySelector(`.room[data-room="${r.id}"]`); if (el) el.style.fill = pisoDe(store.projeto.acab, r).cor2d; }
    },
    setFerramenta(f) { ferramenta = f; svg.dataset.tool = f; if (plan) { desenharItens(); desenharTela(); desenharDistancias(); } },
    setLuzEstado(m) { luzEstado = m; if (plan) desenharBadges(); },
    realcarComodo(id) { L.rooms.querySelectorAll('.room-hit.pulso').forEach((e) => e.classList.remove('pulso')); const e = L.rooms.querySelector(`.room-hit[data-room="${id}"]`); if (e) { void e.getBoundingClientRect(); e.classList.add('pulso'); setTimeout(() => e.classList.remove('pulso'), 600); } },
    setFlag(k, v) { flags[k] = v; if (plan) { desenharCirculacao(); desenharTela(); desenharDistancias(); } },
    flags,
    fit,
    zoom(k) { const r = svg.getBoundingClientRect(); zoomAt(r.width / 2, r.height / 2, k); },
    screenDeltaToWorld(du, dv) { return view.rot ? [dv, -du] : [du, dv]; },
    screenToWorld(clientX, clientY) { const r = svg.getBoundingClientRect(); return S2W(clientX - r.left, clientY - r.top); },
    centroVisivel() { const r = svg.getBoundingClientRect(); return S2W(r.width / 2, r.height / 2); },
    snapItem,
    isInside(x, y) { return plan.rooms.some((r) => pointInPoly(x, y, r.poly)); },
    get view() { return view; },
    svg,
  };
}

// utilitário para posicionar um item novo próximo de um ponto, dentro de um cômodo
export function posicaoLivre(plan, itens, it, [x, y]) {
  const room = plan.rooms.find((r) => pointInPoly(x, y, r.poly)) || plan.rooms.find((r) => !r.banho) || plan.rooms[0];
  if (!pointInPoly(x, y, room.poly)) [x, y] = room.centro;
  it.x = Math.round(x * 100) / 100; it.y = Math.round(y * 100) / 100;
  void itens; void rectCorners; void wallInfo; void rad; void edit;
  return it;
}
