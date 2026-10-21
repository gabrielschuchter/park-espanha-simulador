// Motor dos presets de decoração. Não inventa um layout do zero: parte dos móveis que o apartamento já tem
// (ou do layout sugerido), troca modelos e cores, e posiciona a decoração a partir de âncoras (sofá, cama, pia…).
// Tudo que colide, bloqueia porta ou fecha uma passagem é descartado, para o resultado ser sempre habitável.
import { catalogoPorId } from './data/catalogo.js';
import { novoItem, itensSugeridos } from './store.js';
import { pointInPoly, localToPlan, bordasComodo, rectCorners, convexOverlap, bbox } from './geom.js';
import { colide, levarParaParede } from './snap.js';
import { analisar, circulacao } from './analysis.js';
import { tetoY } from './tetoGeo.js';

// Tipo de cada cômodo: define quais presets servem a ele
export const KIND = { sala: 'sala', coz: 'cozinha', circ: 'sala', serv: 'servico', q1: 'quarto', q2: 'quarto', qa: 'quarto', qb: 'quarto', b1: 'banho', b2: 'banho' };
export const kindDoComodo = (r) => KIND[r.id] || (r.banho ? 'banho' : 'sala');
export const NOME_KIND = { sala: 'Sala', cozinha: 'Cozinha e jantar', quarto: 'Quarto', banho: 'Banheiro', servico: 'Serviço e varanda' };

// apelidos que agrupam modelos do catálogo
export const AL = {
  sofa: ['sofa2', 'sofa3', 'sofa4', 'namoradeira', 'sofaret', 'sofachaise', 'sofacanto'],
  rack: ['rack', 'racksusp'], tv: ['tv43', 'tv55', 'tv65'],
  cama: ['camacasal', 'camaqueen', 'camaking', 'camasolteiro', 'beliche'],
  gr: ['grcorrer', 'grcorrer3', 'grabrir', 'grabrir6'], criado: ['criado', 'criadosusp'],
  jantar: ['jantar2', 'jantar4', 'jantar6', 'jantar8', 'jantarredonda', 'redonda6', 'jantaroval', 'jantarbanco', 'mesaalta'],
  geladeira: ['geladeira', 'geladeirauma', 'geladeirasbs', 'frigobar'], fogao: ['fogao', 'fogao5', 'cooktop4', 'cooktopind'],
  planta: ['planta', 'plantapeq'], tapete: ['tapete', 'tapeteredondo'], lavar: ['lavar', 'lavarfrontal', 'lavaseca'],
  luzes: ['plafon', 'plafonq', 'painelled', 'spot', 'spots4', 'trilho', 'lustre', 'lustrearos', 'pendente', 'pendente3', 'globo', 'arandela', 'abajur', 'luminaria', 'luminariamesa'],
};
const casa = (it, alias) => (AL[alias] ? AL[alias].includes(it.tipo) : it.tipo === alias);
const FIXO_KIND = { bancada: 'cozinha', tanque: 'servico', vaso: 'banho', lavatorio: 'banho', box: 'banho' };

const quad = (n) => n * n;
function distSeg(x, y, [ax, ay], [bx, by]) {
  const ex = bx - ax, ey = by - ay, l2 = ex * ex + ey * ey || 1e-9;
  const t = Math.max(0, Math.min(1, ((x - ax) * ex + (y - ay) * ey) / l2));
  return Math.hypot(x - ax - ex * t, y - ay - ey * t);
}
const distPoly = (x, y, P) => { let m = Infinity; for (let i = 0; i < P.length; i++) m = Math.min(m, distSeg(x, y, P[i], P[(i + 1) % P.length])); return m; };
const r2 = (v) => Math.round(v * 100) / 100;
const copia = (o) => JSON.parse(JSON.stringify(o));

export function estilizar(plan, proj, trabalhos, ops = {}) {
  const o = { acab: true, moveis: true, base: 'meus', ...ops };
  const rel = { adicionados: 0, trocados: 0, removidos: 0, descartes: [] };
  const sociais = plan.rooms.filter((r) => r.aberto).map((r) => r.id);
  const roomDe = (x, y) => plan.rooms.find((r) => pointInPoly(x, y, r.poly)) || null;
  let itens = proj.itens;

  // ---- escopo: quais móveis e peças pertencem a cada trabalho
  const kindItem = (it) => {
    const r = roomDe(it.x, it.y); if (!r) return null;
    const k = kindDoComodo(r);
    if (k === 'sala' || k === 'cozinha') return ['eletro', 'cozinha', 'jantar'].includes(catalogoPorId[it.tipo]?.cat) ? 'cozinha' : 'sala';
    return k;
  };
  const noEscopo = (it, t) => {
    if (kindItem(it) !== t.kind) return false;
    const r = roomDe(it.x, it.y);
    return r.id === t.room.id || (t.kind === 'cozinha' && sociais.includes(r.id));
  };
  const fixoNoEscopo = (f, t) => {
    if (FIXO_KIND[f.tipo] !== t.kind) return false;
    const r = roomDe(f.x, f.y); if (!r) return false;
    return r.id === t.room.id || (t.kind === 'cozinha' && sociais.includes(r.id));
  };

  // ---- fase A: base (opcional), remoções e trocas
  if (o.moveis && o.base === 'sugestao') {
    const sug = itensSugeridos(plan.tip.id);
    for (const t of trabalhos) {
      itens = itens.filter((i) => !noEscopo(i, t));
      for (const s of sug) if (noEscopo(s, t) && !itens.some((i) => i.uid === s.uid)) itens.push(s);
    }
  }
  const extras = new Set();
  const descartar = (tipo, motivo) => rel.descartes.push({ tipo, motivo });

  const chavesDe = (lista) => new Set(analisar(plan, lista).filter((a) => a.nivel !== 'info').map((a) => a.uid + a.msg));
  const circPior = (antes, depois) => { const a = circulacao(plan, antes), b = circulacao(plan, depois); return b.bloqueios.length > a.bloqueios.length || b.semGiro.length > a.semGiro.length; };
  const trocar = (it, patch, t) => {
    const outros = () => itens.filter((x) => x.uid !== it.uid);
    const cores = {};
    if (patch.cor) { cores.cor = patch.cor; }
    if (patch.cor2) cores.cor2 = patch.cor2;
    if (patch.nome) cores.nome = patch.nome;
    const tipos = patch.tipo ? [].concat(patch.tipo) : [it.tipo];
    for (const tp of tipos) {
      const cat = catalogoPorId[tp]; if (!cat) continue;
      const cand = tp === it.tipo ? { ...it } : { ...novoItem(tp), uid: it.uid, x: it.x, y: it.y, rot: it.rot, ...(patch.props || {}) };
      if (tp !== it.tipo) {
        // mantém o fundo no mesmo plano (móvel encostado continua encostado)
        const dd = (cand.d - it.d) / 2; const [x, y] = localToPlan(it, 0, dd); cand.x = r2(x); cand.y = r2(y);
        if (cat.parede && cat.elev) cand.elev = cat.elev; else if (!cat.parede) cand.elev = cat.elev || 0;
      }
      Object.assign(cand, cores);
      if (patch.l) { const [x, y] = localToPlan(cand, patch.l[0], patch.l[1]); cand.x = r2(x); cand.y = r2(y); }
      if (patch.r) cand.rot = (((cand.rot || 0) + patch.r) % 360 + 360) % 360;
      if (patch.w) cand.w = patch.w; if (patch.d) cand.d = patch.d;
      if (!roomDe(cand.x, cand.y) || colide(plan, cand, outros())) continue;
      const mudouTipo = tp !== it.tipo;
      if (mudouTipo || patch.w || patch.d || patch.l || patch.r) {
        const antes = chavesDe(itens), dep = chavesDe(itens.map((x) => (x.uid === it.uid ? cand : x)));
        let novo = false; for (const k of dep) if (!antes.has(k)) { novo = true; break; }
        if (novo || circPior(itens, itens.map((x) => (x.uid === it.uid ? cand : x)))) continue;
      }
      Object.assign(it, cand); delete it.corNome;
      rel.trocados++;
      return mudouTipo;
    }
    // não coube: só as cores
    Object.assign(it, cores);
    if (patch.tipo) descartar(patch.tipo, 'não coube no lugar');
    return false;
  };

  if (o.moveis) {
    for (const t of trabalhos) {
      const spec = t.spec;
      for (const alias of spec.tira || []) {
        const antes = itens.length;
        itens = itens.filter((i) => !(noEscopo(i, t) && casa(i, alias)));
        rel.removidos += antes - itens.length;
      }
      for (const [alias, patch] of Object.entries(spec.troca || {})) {
        for (const it of itens.filter((i) => noEscopo(i, t) && casa(i, alias))) trocar(it, patch, t);
      }
    }
  }

  // ---- fase B: decoração a partir das âncoras
  const planoCtx = { itens: () => itens };
  void planoCtx;
  function ancora(alias, t) {
    if (alias.startsWith('fix:')) {
      const tp = alias.slice(4);
      const f = plan.fixos.find((q) => q.tipo === tp && !q.oculto && roomDe(q.x, q.y) && (q.tipo === 'bancada' || q.tipo === 'tanque' ? true : roomDe(q.x, q.y).id === t.room.id));
      return f ? { x: f.x, y: f.y, w: f.w, d: f.d, rot: f.rot || 0, h: f.h, elev: 0, fixo: true } : null;
    }
    return itens.find((i) => noEscopo(i, t) && casa(i, alias)) || null;
  }
  const janelaAlvo = (t) => {
    const ab = plan.openings.find((op) => !op.porta && !op.sem && op.lados.some(([x, y]) => pointInPoly(x, y, t.room.poly)));
    if (!ab) return null;
    return ab.lados.find(([x, y]) => pointInPoly(x, y, t.room.poly)) || ab.centro;
  };
  const bloqueiaPorta = (it) => {
    if (it.elev >= 2.0 || catalogoPorId[it.tipo]?.livre) return false;
    const P = rectCorners(it);
    return plan.openings.some((op) => op.sweep && !op.sem && convexOverlap(P, op.sweep) > 0.02);
  };
  const chaves = (lista) => new Set(analisar(plan, lista).filter((a) => a.nivel !== 'info').map((a) => a.uid + a.msg));

  function colocar(t, tipoOuLista, onde = {}, props = {}) {
    if (Array.isArray(tipoOuLista)) {
      for (const tp of tipoOuLista) if (colocarUm(t, tp, onde, props)) return true;
      return false;
    }
    return colocarUm(t, tipoOuLista, onde, props);
  }
  const olharPara = (it, alvo) => { if (alvo) it.rot = (((Math.atan2(-(alvo[0] - it.x), alvo[1] - it.y) * 180) / Math.PI) % 360 + 360) % 360; };
  function colocarUm(t, tipo, onde = {}, props = {}) {
    const cat = catalogoPorId[tipo]; if (!cat) return false;
    if (onde.falta && itens.some((i) => noEscopo(i, t) && casa(i, onde.falta))) return false;
    if (onde.so && !onde.so.includes(plan.tip.id)) return false;
    const it = novoItem(tipo, props);
    const A = onde.a ? ancora(onde.a, t) : null;
    if (onde.a && !A) { descartar(tipo, `sem ${onde.a}`); return false; }
    const gap = onde.gap ?? 0.04;
    let ok = false;
    const dentro = () => {
      const r = roomDe(it.x, it.y); if (!r) return false;
      return r.id === t.room.id || (t.kind === 'cozinha' && sociais.includes(r.id));
    };
    if (onde.par) {
      const alvo = A ? localToPlan(A, onde.dl || 0, onde.lado === 'frente' ? A.d / 2 + 0.05 : -(A.d / 2 + 0.04))
        : onde.perto === 'janela' ? janelaAlvo(t) : t.room.centro;
      if (!alvo) { descartar(tipo, 'sem janela'); return false; }
      it.x = alvo[0]; it.y = alvo[1];
      ok = levarParaParede(plan, itens, it) && dentro();
      if (ok && props.elev !== undefined) it.elev = props.elev;
    } else if (onde.teto) {
      const c = A ? [A.x, A.y] : t.room.centro;
      it.x = r2(c[0] + (onde.dx || 0)); it.y = r2(c[1] + (onde.dy || 0)); it.rot = A ? A.rot : 0;
      ok = !!roomDe(it.x, it.y);
    } else if (onde.livre) {
      const alvo = A ? [A.x, A.y] : onde.perto === 'janela' ? janelaAlvo(t) || t.room.centro : t.room.centro;
      const bb = bbox(t.room.poly), cands = [];
      const m = Math.max(cat.w, cat.d) / 2 + 0.04;
      for (let x = bb.x0 + m; x <= bb.x1 - m; x += 0.1) for (let y = bb.y0 + m; y <= bb.y1 - m; y += 0.1) {
        if (!pointInPoly(x, y, t.room.poly)) continue;
        const dp = distPoly(x, y, t.room.poly);
        if (dp < m - 0.02) continue;
        const dd = Math.hypot(x - alvo[0], y - alvo[1]);
        const sc = (onde.d !== undefined ? Math.abs(dd - onde.d) : dd) + (onde.canto ? 3 * (dp - m) : 0);
        cands.push([sc, x, y]);
      }
      cands.sort((a, b) => a[0] - b[0]);
      for (const [, x, y] of cands.slice(0, 400)) {
        it.x = r2(x); it.y = r2(y); it.rot = onde.rot ?? 0;
        if (onde.olha) olharPara(it, onde.olha === true ? t.room.centro : (() => { const q = ancora(onde.olha, t); return q ? [q.x, q.y] : t.room.centro; })());
        if (cat.parede) { if (!levarParaParede(plan, itens, it)) continue; }
        if (colide(plan, it, itens) || bloqueiaPorta(it)) continue;
        ok = true; break;
      }
    } else if (A) {
      let lx = onde.l?.[0] ?? 0, ly = onde.l?.[1] ?? 0;
      if (onde.sobre) it.elev = r2((A.elev || 0) + A.h);
      else if (onde.lado === 'fundo') ly = -(A.d / 2 + it.d / 2 + gap);
      else if (onde.lado === 'frente') ly = A.d / 2 + it.d / 2 + gap;
      else if (onde.lado === 'esq') lx = -(A.w / 2 + it.w / 2 + gap);
      else if (onde.lado === 'dir') lx = A.w / 2 + it.w / 2 + gap;
      if (onde.dl) { if (onde.lado === 'esq' || onde.lado === 'dir') ly += onde.dl; else lx += onde.dl; }
      const [x, y] = localToPlan(A, lx, ly);
      it.x = r2(x); it.y = r2(y); it.rot = (((A.rot || 0) + (onde.r || 0)) % 360 + 360) % 360;
      if (props.elev !== undefined) it.elev = props.elev;
      ok = dentro() && !colide(plan, it, itens) && !bloqueiaPorta(it);
    }
    if (!ok) { descartar(tipo, 'sem espaço'); return false; }
    if (cat.parede && !cat.teto && !onde.par && onde.a && !onde.sobre && onde.lado) { /* peça de parede ao lado de outra: aceita como está */ }
    // o que o preset acrescenta não pode criar aviso novo (porta travada, faixa à frente, sobreposição)
    const base = chaves(itens);
    const nova = chaves([...itens, it]);
    for (const k of nova) if (!base.has(k)) { descartar(tipo, 'criaria um aviso'); return false; }
    itens.push(it); extras.add(it.uid); rel.adicionados++;
    return true;
  }

  if (o.moveis) {
    for (const t of trabalhos) for (const ex of t.spec.poe || []) colocar(t, ex[0], ex[1], ex[2]);
  }

  // ---- fase C: circulação. Se o preset fechou uma passagem, tira o último acréscimo até abrir.
  if (o.moveis && extras.size) {
    const sem = itens.filter((i) => !extras.has(i.uid));
    const ref = circulacao(plan, sem), refB = ref.bloqueios.length, refG = ref.semGiro.length;
    let guarda = 40;
    for (;;) {
      const c = circulacao(plan, itens);
      if (c.bloqueios.length <= refB && c.semGiro.length <= refG) break;
      const ult = [...itens].reverse().find((i) => extras.has(i.uid) && !catalogoPorId[i.tipo]?.livre && (i.elev || 0) < 0.2);
      if (!ult || guarda-- < 0) break;
      itens = itens.filter((i) => i.uid !== ult.uid); extras.delete(ult.uid); rel.adicionados--; descartar(ult.tipo, 'fechava uma passagem');
    }
  }

  proj.itens = itens;

  // ---- acabamentos, luz e peças da construtora
  const A = proj.acab;
  const limpaDestaques = (id) => { for (const k of Object.keys(A.destaque)) if (k.startsWith(id + ':')) delete A.destaque[k]; };
  if (o.acab) {
    for (const t of trabalhos) {
      const s = t.spec.acab || {}, id = t.room.id;
      if (s.parede) { A.parede[id] = copia(s.parede); limpaDestaques(id); }
      for (const [alias, fin] of s.destaque || []) {
        const an = ancora(alias, t);
        if (!an) continue;
        const ar = roomDe(an.x, an.y); if (!ar || ar.id !== id) continue;
        const p = localToPlan(an, 0, -(an.d / 2 + 0.05));
        let best = null;
        for (const b of bordasComodo(plan, ar)) {
          if (!b.parede || b.curta) continue;
          const d = distSeg(p[0], p[1], b.p, b.q);
          if (!best || d < best.d) best = { d, i: b.i };
        }
        if (best && best.d < 0.6) A.destaque[`${id}:${best.i}`] = copia(fin);
      }
      if (s.piso) A.piso[id] = s.piso;
      if (s.rodape) A.rodape[id] = s.rodape;
      if (s.teto) A.teto[id] = { tipo: s.teto.tipo, drop: s.teto.drop ?? 0.10, cor: s.teto.cor || '#f7f6f3' };
      if (s.luz) A.luz[id] = { ...(A.luz[id] || {}), on: true, ...s.luz };
      for (const f of plan.fixos) {
        const patch = t.spec.fixos?.[f.tipo];
        if (patch && fixoNoEscopo(f, t)) proj.fix[f.id] = { ...(proj.fix[f.id] || {}), ...patch };
      }
    }
  }
  if (o.acab && ops.aberturas) proj.fix._ab = { ...(proj.fix._ab || {}), ...ops.aberturas };
  // luminárias de teto acompanham o forro novo
  for (const it of itens) if (catalogoPorId[it.tipo]?.teto) it.elev = r2(tetoY(plan, A, it.x, it.y) - it.h);
  rel.total = itens.length;
  void quad;
  return rel;
}

// Monta os trabalhos de um tema para os cômodos pedidos (todos ou só um)
export function trabalhosDoTema(plan, tema, somenteRoom = null) {
  const t = [];
  const quartos = plan.rooms.filter((r) => kindDoComodo(r) === 'quarto');
  for (const room of plan.rooms) {
    if (somenteRoom && room.id !== somenteRoom) continue;
    const kind = kindDoComodo(room);
    let spec = tema[kind];
    if (kind === 'quarto' && Array.isArray(spec)) spec = spec[Math.min(spec.length - 1, quartos.indexOf(room))];
    if (kind === 'sala' && room.id === 'circ') spec = tema.sala ? { acab: tema.sala.acab, troca: {}, poe: [] } : null;
    if (spec) t.push({ room, kind, spec });
  }
  return t;
}
