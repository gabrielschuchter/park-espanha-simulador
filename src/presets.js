// Motor dos estilos de decoração.
// Parte dos móveis que o apartamento já tem (ou do layout sugerido), troca modelos e cores e monta a decoração
// por regras de composição: na frente do sofá, ao lado da cama, acima do aparador, no canto, no teto sobre a mesa,
// cortina em cada janela. Cada peça só entra se passar pela auditoria estrita (src/harmonia.js): nada encostado
// em nada, nada sobre janela ou porta, nada flutuando, nada torto, nada no giro de porta, nenhum aviso novo da
// análise e nenhuma passagem fechada. O que não cabe fica de fora, e o relatório diz o quê.
import { catalogoPorId } from './data/catalogo.js';
import { novoItem, itensSugeridos } from './store.js';
import { pointInPoly, localToPlan, bordasComodo, polyCentroid } from './geom.js';
import { colide } from './snap.js';
import { analisar, circulacao } from './analysis.js';
import { tetoY } from './tetoGeo.js';
import { problemas, faceDoFundo, ehTapete, ehTeto } from './harmonia.js';

// ---------------------------------------------------------------- tipos de cômodo
export const KIND = { sala: 'sala', coz: 'cozinha', circ: 'circ', serv: 'servico', q1: 'quarto', q2: 'quarto', qa: 'quarto', qb: 'quarto', b1: 'banho', b2: 'banho' };
export const kindDoComodo = (r) => KIND[r.id] || (r.banho ? 'banho' : 'sala');
export const NOME_KIND = { sala: 'Sala', cozinha: 'Cozinha e jantar', quarto: 'Quarto', banho: 'Banheiro', servico: 'Serviço e varanda', circ: 'Circulação' };

// apelidos que agrupam modelos do catálogo
export const AL = {
  sofa: ['sofa2', 'sofa3', 'sofa4', 'namoradeira', 'sofaret', 'sofachaise', 'sofacanto'],
  rack: ['rack', 'racksusp'], tv: ['tv43', 'tv55', 'tv65'],
  cama: ['camacasal', 'camaqueen', 'camaking', 'camasolteiro', 'beliche'],
  gr: ['grcorrer', 'grcorrer3', 'grabrir', 'grabrir6'], criado: ['criado', 'criadosusp'],
  jantar: ['jantar2', 'jantar4', 'jantar6', 'jantar8', 'jantarredonda', 'redonda6', 'jantaroval', 'jantarbanco', 'mesaalta', 'mesabistro'],
  geladeira: ['geladeira', 'geladeirauma', 'geladeirasbs', 'frigobar'], fogao: ['fogao', 'fogao5', 'cooktop4', 'cooktopind'],
  planta: ['planta', 'plantapeq'], tapete: ['tapete', 'tapeteredondo'], lavar: ['lavar', 'lavarfrontal', 'lavaseca'],
  mesacentro: ['mesacentro'], lateral: ['mesalateral', 'mesaapoio'], comoda: ['comoda', 'comoda6'], aparador: ['aparador', 'buffet'],
  escrivaninha: ['escrivaninha'], poltrona: ['poltrona'],
  luzes: ['plafon', 'plafonq', 'painelled', 'spot', 'spots4', 'trilho', 'lustre', 'lustrearos', 'pendente', 'pendente3', 'globo', 'arandela', 'abajur', 'luminaria', 'luminariamesa'],
};
const casa = (it, alias) => (AL[alias] ? AL[alias].includes(it.tipo) : it.tipo === alias);
const FIXO_KIND = { bancada: 'cozinha', tanque: 'servico', vaso: 'banho', lavatorio: 'banho', box: 'banho' };
const COZ_CAT = new Set(['eletro', 'cozinha', 'jantar']);
// o que o estilo pode tirar do cômodo para pôr a sua versão
const DECORATIVO = new Set(['deco', 'luz']);

const r2 = (v) => Math.round(v * 1000) / 1000;
const copia = (o) => JSON.parse(JSON.stringify(o));
const norm = (a) => ((Math.round(a) % 360) + 360) % 360;
const rotDaNormal = (nx, ny) => norm((Math.atan2(-nx, ny) * 180) / Math.PI);
const frenteDe = (it) => { const r = ((it.rot || 0) * Math.PI) / 180; return [-Math.sin(r), Math.cos(r)]; };
// altura útil do topo de um móvel para pendurar algo acima (a cabeceira da cama passa do colchão)
const topoVisual = (a) => (casa(a, 'cama') ? 1.0 : (a.elev || 0) + a.h);

// ======================================================================== motor
export function estilizar(plan, proj, trabalhos, ops = {}) {
  const o = { acab: true, moveis: true, base: 'meus', ...ops };
  const rel = { adicionados: 0, trocados: 0, removidos: 0, descartes: [] };
  const sociais = new Set(plan.rooms.filter((r) => r.aberto).map((r) => r.id));
  const roomDe = (x, y) => plan.rooms.find((r) => pointInPoly(x, y, r.poly)) || null;
  const A = proj.acab;
  let itens = proj.itens;
  const extras = new Set();

  // ---- escopo
  function kindItem(it) {
    const r = roomDe(it.x, it.y); if (!r) return null;
    if (sociais.has(r.id)) return COZ_CAT.has(catalogoPorId[it.tipo]?.cat) ? 'cozinha' : r.id === 'circ' ? 'circ' : 'sala';
    return kindDoComodo(r);
  }
  function noEscopo(it, t) {
    const r = roomDe(it.x, it.y); if (!r) return false;
    if (t.kind === 'cozinha') return sociais.has(r.id) && kindItem(it) === 'cozinha';
    if (t.kind === 'sala') return sociais.has(r.id) && kindItem(it) === 'sala';
    return r.id === t.room.id;
  }
  function fixoNoEscopo(f, t) {
    if (FIXO_KIND[f.tipo] !== t.kind) return false;
    const r = roomDe(f.x, f.y); if (!r) return false;
    return r.id === t.room.id || (t.kind === 'cozinha' && sociais.has(r.id));
  }
  const dentroDe = (it, t) => {
    const r = roomDe(it.x, it.y); if (!r) return false;
    if (t.kind === 'sala' || t.kind === 'cozinha') return sociais.has(r.id) && (r.id !== 'circ' || t.room.id === 'circ');
    return r.id === t.room.id;
  };

  // ---- acabamentos primeiro: a altura do forro decide onde ficam as luminárias
  const limpaDestaques = (id) => { for (const k of Object.keys(A.destaque)) if (k.startsWith(id + ':')) delete A.destaque[k]; };
  if (o.acab) {
    for (const t of trabalhos) {
      const s = t.spec.acab || {}, id = t.room.id;
      if (s.parede) { A.parede[id] = copia(s.parede); limpaDestaques(id); }
      if (s.piso) A.piso[id] = s.piso;
      if (s.rodape) A.rodape[id] = s.rodape;
      if (s.teto) A.teto[id] = { tipo: s.teto.tipo, drop: s.teto.drop ?? 0.10, cor: s.teto.cor || '#f7f6f3' };
      if (s.luz) A.luz[id] = { ...(A.luz[id] || {}), on: true, ...s.luz };
      for (const f of plan.fixos) {
        const patch = t.spec.fixos?.[f.tipo];
        if (patch && fixoNoEscopo(f, t)) proj.fix[f.id] = { ...(proj.fix[f.id] || {}), ...patch };
      }
    }
    if (ops.aberturas) proj.fix._ab = { ...(proj.fix._ab || {}), ...ops.aberturas };
  }

  // ---- validação de uma peça candidata
  const chavesAnalise = (lista) => new Set(analisar(plan, lista).filter((a) => a.nivel !== 'info').map((a) => a.uid + '|' + a.msg));
  let baseAnalise = null;
  function valido(it, t) {
    if (t && !dentroDe(it, t)) return false;
    if (!catalogoPorId[it.tipo]?.livre && !ehTapete(it) && colide(plan, it, itens)) return false;
    const lista = [...itens, it];
    if (problemas(plan, lista, A, new Set([it.uid])).length) return false;
    if (!baseAnalise) baseAnalise = chavesAnalise(itens);
    for (const k of chavesAnalise(lista)) if (!baseAnalise.has(k)) return false;
    // peça de piso: não pode fechar passagem nem tirar o giro de cadeira de rodas
    if (!ehTapete(it) && !ehTeto(it) && (it.elev || 0) < 0.25 && it.tipo !== 'cortina') {
      if (!baseCirc) baseCirc = circulacao(plan, itens);
      const c = circulacao(plan, lista);
      if (c.bloqueios.length > baseCirc.bloqueios.length || c.semGiro.length > baseCirc.semGiro.length) return false;
    }
    return true;
  }
  let baseCirc = null;
  const aceitar = (it) => { itens.push(it); extras.add(it.uid); rel.adicionados++; baseAnalise = null; baseCirc = null; };
  const descartar = (tipo, motivo) => rel.descartes.push({ tipo, motivo });
  function piorouCirculacao(antes, depois) {
    const a = circulacao(plan, antes), b = circulacao(plan, depois);
    return b.bloqueios.length > a.bloqueios.length || b.semGiro.length > a.semGiro.length;
  }

  // ---- fase A: base (opcional), remoções e trocas
  if (o.moveis && o.base === 'sugestao') {
    const sug = itensSugeridos(plan.tip.id);
    for (const t of trabalhos) {
      itens = itens.filter((i) => !noEscopo(i, t));
      for (const s of sug) if (noEscopo(s, t) && !itens.some((i) => i.uid === s.uid)) itens.push(s);
    }
  }
  if (o.moveis) {
    for (const t of trabalhos) {
      // decoração e luminárias que já existem no cômodo saem: o estilo traz as suas
      const tira = new Set(t.spec.tira || []);
      const antes = itens.length;
      itens = itens.filter((i) => {
        if (!noEscopo(i, t)) return true;
        if (DECORATIVO.has(catalogoPorId[i.tipo]?.cat)) return false;
        for (const al of tira) if (casa(i, al)) return false;
        return true;
      });
      rel.removidos += antes - itens.length;
    }
    baseAnalise = null;
    for (const t of trabalhos) {
      for (const [alias, patch] of Object.entries(t.spec.troca || {})) {
        for (const it of itens.filter((i) => noEscopo(i, t) && casa(i, alias))) trocar(it, patch, t);
      }
    }
  }
  // parede de destaque: a parede atrás da âncora (sofá, cama, rack…)
  if (o.acab) {
    for (const t of trabalhos) {
      for (const [alias, fin] of t.spec.acab?.destaque || []) {
        const an = ancora(alias, t); if (!an) continue;
        const ar = roomDe(an.x, an.y); if (!ar) continue;
        const p = localToPlan(an, 0, -(an.d / 2 + 0.05));
        let best = null;
        for (const b of bordasComodo(plan, ar)) {
          if (!b.parede || b.curta) continue;
          const ex = b.q[0] - b.p[0], ey = b.q[1] - b.p[1], l2 = ex * ex + ey * ey;
          const u = Math.max(0, Math.min(1, ((p[0] - b.p[0]) * ex + (p[1] - b.p[1]) * ey) / l2));
          const d = Math.hypot(p[0] - b.p[0] - ex * u, p[1] - b.p[1] - ey * u);
          if (!best || d < best.d) best = { d, i: b.i };
        }
        if (best && best.d < 0.6) A.destaque[`${ar.id}:${best.i}`] = copia(fin);
      }
    }
  }
  // algum lado do móvel encosta numa parede? (testa um pontinho logo além de cada lateral)
  function faceLateral(c) {
    for (const sg of [1, -1]) {
      const [x, y] = localToPlan(c, sg * (c.w / 2 + 0.06), 0);
      if (!roomDe(x, y) || plan.pieces.some((p) => !p.verga && pointInPoly(x, y, p.poly))) return true;
    }
    return false;
  }
  function trocar(it, patch, t) {
    const cores = {};
    if (patch.cor) cores.cor = patch.cor;
    if (patch.cor2) cores.cor2 = patch.cor2;
    const tipos = patch.tipo ? [].concat(patch.tipo).filter((tp) => catalogoPorId[tp]) : [];
    for (const tp of tipos) {
      if (tp === it.tipo) break;
      const cat = catalogoPorId[tp];
      const base = { ...novoItem(tp), uid: it.uid, x: it.x, y: it.y, rot: it.rot, ...cores };
      base.elev = cat.elev || 0;
      const outros = itens.filter((q) => q.uid !== it.uid);
      // fundo no mesmo plano (móvel encostado continua encostado); se ficou mais estreito, encosta num dos lados
      const dw = (it.w - base.w) / 2;
      const desloc = dw > 0.02 ? [-dw, dw, 0] : [0];
      let cand = null;
      for (const lx of desloc) {
        const c = { ...base };
        const [x, y] = localToPlan(it, lx, (base.d - it.d) / 2); c.x = r2(x); c.y = r2(y);
        if (colide(plan, c, outros) || !dentroDe(c, t)) continue;
        if (problemas(plan, [...outros, c], A, new Set([c.uid])).length) continue;
        // prefere o lado que encosta numa parede (sobra espaço útil do outro)
        const enc = faceLateral(c);
        if (!cand || (enc && !cand.enc)) cand = { ...c, enc };
        if (enc) break;
      }
      if (!cand) continue;
      delete cand.enc;
      // nenhum aviso novo: sobre a própria peça, no máximo os que já existiam; sobre as outras, nenhum
      const antes = analisar(plan, itens).filter((a) => a.nivel !== 'info');
      const depois = analisar(plan, [...outros, cand]).filter((a) => a.nivel !== 'info');
      const kA = new Set(antes.filter((a) => a.uid !== it.uid).map((a) => a.uid + a.msg));
      if (depois.some((a) => a.uid !== it.uid && !kA.has(a.uid + a.msg))) continue;
      if (depois.filter((a) => a.uid === it.uid).length > antes.filter((a) => a.uid === it.uid).length) continue;
      if (piorouCirculacao(itens, [...outros, cand])) continue;
      delete it.corNome;
      Object.assign(it, cand);
      rel.trocados++; baseAnalise = null;
      return;
    }
    if (tipos.length && !tipos.includes(it.tipo)) descartar(tipos[0], 'o modelo maior não coube');
    Object.assign(it, cores); delete it.corNome;
    if (Object.keys(cores).length) rel.trocados++;
  }

  // ---- âncoras
  function ancoras(nome, t) {
    if (!nome) return [];
    if (typeof nome === 'object') return [nome];
    if (nome.startsWith('fix:')) {
      const tp = nome.slice(4);
      return plan.fixos.filter((q) => q.tipo === tp && !q.oculto && fixoNoEscopo(q, t)).map((f) => ({ ...f, elev: 0, fixo: true, uid: 'fix:' + f.id }));
    }
    return itens.filter((i) => (noEscopo(i, t) || (extras.has(i.uid) && dentroDe(i, t))) && casa(i, nome)).sort((a, b) => b.w * b.d - a.w * a.d);
  }
  function ancora(nome, t) { return ancoras(nome, t)[0] || null; }
  // paredes do cômodo: bordas que são parede de verdade, com normal para dentro
  const facesCache = new Map();
  function faces(room) {
    if (facesCache.has(room.id)) return facesCache.get(room.id);
    const f = bordasComodo(plan, room).filter((b) => b.parede && !b.curta && b.L > 0.3).map((b) => ({ ...b, room }));
    facesCache.set(room.id, f);
    return f;
  }
  const facesDoTrabalho = (t) => ((t.kind === 'cozinha' || t.kind === 'sala')
    ? plan.rooms.filter((r) => sociais.has(r.id) && r.id !== 'circ').flatMap((r) => faces(r))
    : faces(t.room));
  function naFace(it, f, s, gap = 0) {
    it.rot = rotDaNormal(f.nx, f.ny);
    it.x = r2(f.p[0] + f.ux * s + f.nx * (it.d / 2 + gap));
    it.y = r2(f.p[1] + f.uy * s + f.ny * (it.d / 2 + gap));
  }
  // trechos livres de uma parede para um objeto ocupando [z0,z1]
  function trechos(f, z0, z1, margem = 0.06) {
    let livres = [[0, f.L]];
    for (const ab of f.abert) {
      const op = ab.o;
      const oz0 = op.porta ? 0 : op.peitoril, oz1 = op.porta ? op.altura : op.peitoril + op.altura;
      if (z1 <= oz0 - 0.02 || z0 >= oz1 + 0.02) continue;
      const a = ab.a - margem, b = ab.b + margem;
      livres = livres.flatMap(([x, y]) => (b <= x || a >= y ? [[x, y]] : [[x, a], [b, y]].filter(([p, q]) => q - p > 0.05)));
    }
    return livres;
  }
  function janelaDe(t) {
    const ab = plan.openings.find((op) => !op.porta && !op.sem && op.lados.some(([x, y]) => pointInPoly(x, y, t.room.poly)));
    return ab ? ab.lados.find(([x, y]) => pointInPoly(x, y, t.room.poly)) : null;
  }

  // ---- regras de posição: cada uma gera candidatos em ordem de preferência
  function* candidatos(it, onde, t) {
    const z0 = it.elev, z1 = it.elev + it.h;
    if (onde.frente) {
      for (const a of ancoras(onde.frente, t)) {
      const g0 = onde.gap ?? 0.4;
      for (const g of [g0, g0 + 0.06, g0 - 0.06, g0 + 0.14]) {
        for (const dx of [0, 0.1, -0.1, 0.2, -0.2]) {
          const [x, y] = localToPlan(a, dx, a.d / 2 + g + it.d / 2);
          it.x = r2(x); it.y = r2(y); it.rot = norm((a.rot || 0) + (onde.r || 0)); yield;
        }
      }
      }
    } else if (onde.lado) {
      for (const a of ancoras(onde.lado, t)) {
      const lados = onde.qual === 'esq' ? [-1] : onde.qual === 'dir' ? [1] : [1, -1];
      const g0 = onde.gap ?? 0.05;
      for (const sg of lados) for (const g of [g0, g0 + 0.05, g0 + 0.12]) {
        const ly = onde.alinhar === 'centro' ? 0 : onde.alinhar === 'frente' ? a.d / 2 - it.d / 2 : -a.d / 2 + it.d / 2 + (onde.recuo || 0);
        const [x, y] = localToPlan(a, sg * (a.w / 2 + g + it.w / 2), ly);
        it.x = r2(x); it.y = r2(y); it.rot = norm(a.rot || 0); yield;
      }
      }
    } else if (onde.sobre) {
      for (const a of ancoras(onde.sobre, t)) {
      it.elev = r2((a.elev || 0) + a.h);
      const xs = onde.x !== undefined ? [].concat(onde.x) : [0, 0.4, -0.4, 0.8, -0.8];
      for (const fx of xs) for (const dy of [onde.y ?? 0, 0.04, -0.04]) {
        const lx = fx * Math.max(0, a.w / 2 - it.w / 2 - 0.03);
        const [x, y] = localToPlan(a, lx, dy);
        it.x = r2(x); it.y = r2(y); it.rot = norm((a.rot || 0) + (onde.r || 0)); yield;
      }
      }
    } else if (onde.acima) {
      for (const a of ancoras(onde.acima, t)) {
      const f = faceDoFundo(plan, a);
      if (!f) continue;
      const base = onde.z !== undefined ? onde.z : onde.centro !== undefined ? onde.centro - it.h / 2 : topoVisual(a) + (onde.folga ?? 0.22);
      const teto = tetoY(plan, A, a.x, a.y);
      it.elev = r2(Math.min(base, teto - it.h - 0.12));
      if (onde.z === undefined && it.elev < topoVisual(a) + 0.05) continue;
      const alcance = Math.max(0, a.w / 2 - it.w / 2 + (onde.sobra ?? 0));
      const dxs = onde.dx !== undefined ? [].concat(onde.dx) : [0, 0.1, -0.1, 0.2, -0.2, 0.35, -0.35, 0.5, -0.5, 0.7, -0.7].filter((v) => Math.abs(v) <= alcance + 0.001);
      const rot = rotDaNormal(f.nx, f.ny);
      for (const dx of dxs) {
        // dx no sentido do eixo x local da âncora
        const r = ((a.rot || 0) * Math.PI) / 180, ex = Math.cos(r), ey = Math.sin(r);
        const sDelta = dx * (ex * f.wi.ux + ey * f.wi.uy);
        const s = f.s + sDelta;
        it.rot = rot;
        it.x = r2(f.o[0] + f.wi.ux * s + f.nx * (it.d / 2 + 0.002));
        it.y = r2(f.o[1] + f.wi.uy * s + f.ny * (it.d / 2 + 0.002));
        yield;
      }
      }
    } else if (onde.parede) {
      // parede livre: no maior trecho, perto de uma âncora, de frente para uma âncora, ou junto da janela
      const fs = facesDoTrabalho(t);
      const modo = String(onde.parede);
      const ref = modo.startsWith('perto:') || modo.startsWith('oposta:') ? ancora(modo.split(':').slice(1).join(':'), t) : null;
      if ((modo.startsWith('perto:') || modo.startsWith('oposta:')) && !ref) return;
      const lista = [];
      for (const f of fs) {
        if (onde.sala && f.room.id !== onde.sala) continue;
        for (const [a, b] of trechos(f, z0, z1)) {
          if (b - a < it.w + 0.04) continue;
          for (let s = a + it.w / 2 + 0.02; s <= b - it.w / 2 - 0.02 + 1e-6; s += 0.05) {
            const px = f.p[0] + f.ux * s, py = f.p[1] + f.uy * s;
            let sc;
            if (modo === 'janela') {
              const jan = f.abert.find((ab) => !ab.o.porta);
              if (!jan) continue;
              sc = Math.abs(s - (jan.a + jan.b) / 2);
            } else if (modo.startsWith('oposta:')) {
              const [fx, fy] = frenteDe(ref);
              const encara = f.nx * fx + f.ny * fy; // -1: a parede olha para a frente da âncora
              const frenteDist = (px - ref.x) * fx + (py - ref.y) * fy;
              if (encara > -0.7 || frenteDist < 0.3) continue;
              sc = Math.abs((px - ref.x) * -fy + (py - ref.y) * fx);
            } else if (ref) sc = Math.hypot(px - ref.x, py - ref.y);
            else sc = -(b - a) * 0.3 + Math.abs(s - (a + b) / 2) * 0.6; // meio de trechos grandes
            lista.push([sc, f, s]);
          }
        }
      }
      lista.sort((x, y) => x[0] - y[0]);
      for (const [, f, s] of lista.slice(0, 200)) { naFace(it, f, s, onde.gap ?? 0.002); yield; }
    } else if (onde.canto) {
      // cantos internos (duas paredes que se encontram), depois encostado numa parede perto da referência
      const ref = onde.canto === 'livre' || onde.canto === true || onde.canto === 'janela' ? null : ancora(onde.canto, t);
      if (!ref && !(onde.canto === 'livre' || onde.canto === true || onde.canto === 'janela')) return;
      const fs = facesDoTrabalho(t);
      const lista = [];
      const g = onde.gap ?? 0.06;
      for (const f1 of fs) for (const f2 of fs) {
        if (f1 === f2 || f1.room !== f2.room) continue;
        if (Math.abs(f1.ux * f2.ux + f1.uy * f2.uy) > 0.05) continue;
        const fim = [f1.p[0] + f1.ux * f1.L, f1.p[1] + f1.uy * f1.L];
        if (Math.hypot(fim[0] - f2.p[0], fim[1] - f2.p[1]) > 0.05) continue;
        const ref2 = ref ? [ref.x, ref.y] : onde.canto === 'janela' ? janelaDe(t) : null;
        lista.push([ref2 ? Math.hypot(fim[0] - ref2[0], fim[1] - ref2[1]) : 0, fim, f1, f2]);
      }
      lista.sort((x, y) => x[0] - y[0]);
      for (const [, fim, f1, f2] of lista) {
        for (const [ra, rb] of [[f1, f2], [f2, f1]]) {
          // ra: parede às costas; rb: parede ao lado
          it.rot = rotDaNormal(ra.nx, ra.ny);
          it.x = r2(fim[0] + ra.nx * (it.d / 2 + g) + rb.nx * (it.w / 2 + g));
          it.y = r2(fim[1] + ra.ny * (it.d / 2 + g) + rb.ny * (it.w / 2 + g));
          yield;
        }
        if (onde.diag) {
          const half = Math.max(it.w, it.d) / 2 + g;
          it.x = r2(fim[0] + (f1.nx + f2.nx) * half); it.y = r2(fim[1] + (f1.ny + f2.ny) * half);
          it.rot = rotDaNormal((f1.nx + f2.nx) / Math.SQRT2, (f1.ny + f2.ny) / Math.SQRT2);
          yield;
        }
      }
      if (onde.soCanto) return;
      yield* candidatos(it, { parede: ref ? 'perto:' + onde.canto : 'livre', gap: 0.04 }, t);
    } else if (onde.teto) {
      const a = onde.teto === 'centro' ? null : ancora(onde.teto, t);
      if (onde.teto !== 'centro' && !a) return;
      const c = a ? [a.x, a.y] : polyCentroid(t.room.poly);
      const sobreMesa = a && (casa(a, 'jantar') || a.fixo);
      const cat0 = catalogoPorId[it.tipo];
      for (const [dx, dy] of [[0, 0], [0.15, 0], [-0.15, 0], [0, 0.15], [0, -0.15], [0.3, 0], [-0.3, 0], [0, 0.3], [0, -0.3]]) {
        it.x = r2(c[0] + dx); it.y = r2(c[1] + dy); it.rot = norm(a ? (a.rot || 0) + (onde.r || 0) : 0);
        const ty = tetoY(plan, A, it.x, it.y);
        let h = cat0.h;
        if (/pendente|globo/.test(it.tipo)) h = sobreMesa ? Math.min(cat0.h, ty - (a.fixo ? 1.75 : topoVisual(a) + 0.72)) : Math.min(cat0.h, ty - 2.08);
        if (/lustre/.test(it.tipo)) h = Math.min(cat0.h, ty - (sobreMesa ? topoVisual(a) + 0.8 : 2.08));
        if (h < 0.06) return;
        it.h = r2(h); it.elev = r2(ty - it.h);
        yield;
      }
    } else if (onde.conversa) {
      // poltrona ao lado da mesa de centro, voltada para o eixo do sofá (ou em diagonal)
      const a = ancora(onde.conversa, t); if (!a) return;
      const mc = ancora('mesacentro', t);
      const [fx, fy] = frenteDe(a);
      const ly = mc ? (mc.x - a.x) * fx + (mc.y - a.y) * fy : a.d / 2 + 0.6;
      for (const sg of [1, -1]) for (const ex of [0.2, 0.35, 0.1]) for (const dl of [0, 0.15, -0.1, 0.3]) {
        const [x, y] = localToPlan(a, sg * (a.w / 2 + ex + it.d / 2), ly + dl);
        it.x = r2(x); it.y = r2(y);
        it.rot = norm((a.rot || 0) + (sg > 0 ? 90 : -90)); yield;
        it.rot = norm((a.rot || 0) + (sg > 0 ? 135 : -135)); yield;
      }
    } else if (onde.tapete) {
      yield* tapeteCands(it, onde, t);
    }
  }
  // tapete dimensionado pelo conjunto: sala (sofá + mesa), quarto (cama), jantar, passadeira na frente de algo
  function* tapeteCands(it, onde, t) {
    const a = ancora(onde.tapete, t); if (!a) return;
    let w0, d0, ly;
    if (casa(a, 'sofa')) { w0 = Math.min(2.4, a.w + 0.3); d0 = 1.7; ly = a.d / 2 - 0.25 + d0 / 2; }
    else if (casa(a, 'cama')) { w0 = a.w + 0.9; d0 = 1.5; ly = a.d / 2 - d0 / 2 + 0.3; }
    else if (casa(a, 'jantar')) { w0 = a.w + 0.3; d0 = a.d + 0.3; ly = 0; }
    else { w0 = onde.w || 1.0; d0 = onde.d || 0.5; ly = (a.d || 0) / 2 + d0 / 2 + 0.03; }
    const redondo = it.tipo === 'tapeteredondo';
    for (let k = 0; k < 16; k++) {
      const w = r2(Math.max(0.5, w0 - k * 0.1)), d = r2(Math.max(0.4, d0 - k * 0.07));
      const dm = redondo ? Math.min(w, d + 0.15) : null;
      for (const dy of [0, -0.1, 0.1, -0.2, 0.2]) for (const dx of [0, 0.1, -0.1, 0.2, -0.2]) {
        const [x, y] = localToPlan(a, dx, ly + dy);
        it.w = redondo ? dm : w; it.d = redondo ? dm : d; it.x = r2(x); it.y = r2(y); it.rot = norm(a.rot || 0);
        yield;
      }
    }
  }

  function colocar(t, tipos, onde, props) {
    if (Array.isArray(onde)) {
      for (const alt of onde) if (colocar(t, tipos, { ...alt, opcional: true }, props)) return true;
      if (!onde[0]?.opcional) descartar([].concat(tipos)[0], 'não coube sem conflito');
      return false;
    }
    if (onde.falta && itens.some((i) => noEscopo(i, t) && casa(i, onde.falta))) return false;
    if (onde.tem && !ancora(onde.tem, t)) return false;
    for (const tipo of [].concat(tipos)) {
      const cat = catalogoPorId[tipo]; if (!cat) continue;
      const it = novoItem(tipo, props || {});
      const elev0 = props?.elev ?? cat.elev ?? 0;
      let n = 0;
      for (const _ of candidatos(it, onde, t)) { // eslint-disable-line no-unused-vars
        if (++n > 320) break;
        if (!onde.acima && !onde.sobre && !onde.teto) it.elev = elev0;
        if (valido(it, t)) { aceitar(it); return true; }
      }
    }
    if (!onde.opcional) descartar([].concat(tipos)[0], 'não coube sem conflito');
    return false;
  }

  // cortina em cada janela do cômodo, do forro ao chão, encolhendo até caber
  function cortinas(t, cor) {
    const salas = t.kind === 'sala' ? plan.rooms.filter((r) => sociais.has(r.id) && kindDoComodo(r) === 'sala') : [t.room];
    for (const room of salas) {
      for (const f of faces(room)) {
        for (const ab of f.abert) {
          const op = ab.o; if (op.porta || op.sem || op.peitoril > 1.3) continue;
          if (ab.a < -0.05 || ab.b > f.L + 0.05) continue; // janela de outro trecho da mesma linha de parede
          const meio = (ab.a + ab.b) / 2;
          let ok = false;
          for (const extra of [0.5, 0.4, 0.3, 0.2, 0.12, 0.06]) {
            for (const dx of [0, 0.05, -0.05, 0.1, -0.1]) {
              const it = novoItem('cortina', { cor });
              it.w = r2(op.largura + extra);
              naFace(it, f, meio + dx, 0.03);
              const ty = tetoY(plan, A, it.x, it.y);
              it.elev = 0.05; it.h = r2(ty - 0.05 - 0.04);
              if (valido(it, null)) { aceitar(it); ok = true; break; }
            }
            if (ok) break;
          }
          if (!ok) descartar('cortina', 'a janela não tem espaço para cortina');
        }
      }
    }
  }

  if (o.moveis) {
    // cortinas primeiro: a janela manda; o resto da parede se organiza em volta
    for (const t of trabalhos) if (t.spec.cortinas && !t.room.banho) cortinas(t, t.spec.cortinas);
    for (const t of trabalhos) {
      for (const ex of t.spec.poe || []) {
        const [tipos, onde, props] = ex;
        for (let i = 0; i < (onde.n || 1); i++) colocar(t, tipos, onde, props);
      }
    }
  }

  // ---- fase C: circulação. Se o estilo fechou uma passagem, sai a peça de piso acrescentada por último.
  if (o.moveis && extras.size) {
    const sem = itens.filter((i) => !extras.has(i.uid));
    const ref = circulacao(plan, sem), refB = ref.bloqueios.length, refG = ref.semGiro.length;
    let guarda = 40;
    for (;;) {
      const c = circulacao(plan, itens);
      if (c.bloqueios.length <= refB && c.semGiro.length <= refG) break;
      const ult = [...itens].reverse().find((i) => extras.has(i.uid) && !ehTapete(i) && !ehTeto(i) && (i.elev || 0) < 0.2 && !catalogoPorId[i.tipo]?.parede);
      if (!ult || guarda-- < 0) break;
      itens = itens.filter((i) => i.uid !== ult.uid); extras.delete(ult.uid); rel.adicionados--; descartar(ult.tipo, 'fechava uma passagem');
      // o que estava em cima sai junto
      for (;;) {
        const orf = itens.find((i) => extras.has(i.uid) && (i.elev > 0.03 || ehTeto(i)) && problemas(plan, itens, A, new Set([i.uid])).length);
        if (!orf) break;
        itens = itens.filter((i) => i.uid !== orf.uid); extras.delete(orf.uid); rel.adicionados--;
      }
    }
  }

  // luminárias de teto que já estavam acompanham o forro novo
  for (const it of itens) if (catalogoPorId[it.tipo]?.teto && !extras.has(it.uid)) it.elev = r2(tetoY(plan, A, it.x, it.y) - it.h);
  proj.itens = itens;
  rel.total = itens.length;
  return rel;
}

// Monta os trabalhos de um tema para os cômodos pedidos (todos ou só um).
// O quarto com a maior cama recebe a versão principal; os outros, a secundária (quando o tema tem).
export function trabalhosDoTema(plan, tema, somenteRoom = null, itens = null) {
  const t = [];
  const quartos = plan.rooms.filter((r) => kindDoComodo(r) === 'quarto');
  const areaCama = (r) => Math.max(0, ...(itens || []).filter((i) => AL.cama.includes(i.tipo) && pointInPoly(i.x, i.y, r.poly)).map((i) => i.w * i.d));
  const ordem = [...quartos].sort((a, b) => areaCama(b) - areaCama(a) || b.areaGeo - a.areaGeo);
  for (const room of plan.rooms) {
    if (somenteRoom && room.id !== somenteRoom) continue;
    const kind = kindDoComodo(room);
    let spec = tema[kind];
    if (kind === 'quarto' && Array.isArray(spec)) spec = spec[Math.min(spec.length - 1, ordem.indexOf(room))];
    if (kind === 'circ') spec = tema.circ || (tema.sala ? { acab: tema.sala.acab, poe: [] } : null);
    if (spec) t.push({ room, kind, spec });
  }
  return t;
}
