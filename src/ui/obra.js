// Ferramenta Obra: desenhar paredes, abrir e fechar vãos, demolir e restaurar paredes da planta.
// Funciona igual na planta 2D e na maquete 3D: as duas vistas mandam o ponto do cursor (em metros) e este
// controlador encaixa, mostra a prévia e grava a mudança em fix._obra (uma edição por ação, com desfazer).
import { edit, store, uid } from '../store.js';
import { wallInfo, wallPoint } from '../geom.js';
import { TIPOS_PAREDE, TIPOS_VAO, obraDe, encaixar, paredeNoPonto, vaoNoPonto, vaoCabe, ehExterna } from '../obra.js';
import { $, $$, esc, toast, confirmar } from './util.js';
import { tocar } from '../audio.js';

let ctx = null;
const st = { modo: 'parede', tipoParede: 'alvenaria', tipoVao: 'porta80', inicio: null, sel: null, hover: null };
const CORES = [['#f1efeb', 'Branco'], ['#e6d5be', 'Areia'], ['#d9d3c8', 'Greige'], ['#b8c4b0', 'Sálvia'], ['#c47a5a', 'Terracota'], ['#2f3e56', 'Marinho'], ['#4d5553', 'Grafite']];
const cmTxt = (m) => `${Math.round(m * 100)} cm`;

const plan = () => ctx.getPlan();
const obra = () => obraDe(store.projeto.fix);
function gravar(fn, som = 'encaixe') {
  edit((p) => { const o = obraDe(p.fix); fn(o); p.fix._obra = o; }, 'fixos');
  tocar(som);
}
function prev(sp) { ctx.preview(sp); }

function espessura() { return TIPOS_PAREDE[st.tipoParede].t; }
function alturaParede() { return TIPOS_PAREDE[st.tipoParede].altura || plan().tip.peDireito; }

export function eventoObra(e) {
  if (!ctx || !plan()) return;
  const P = plan();
  if (e.tipo === 'cancel') { st.inicio = null; prev(null); render(); return; }
  if (st.modo === 'parede') {
    if (e.x === undefined || e.x === null) return;
    const enc = encaixar(P, [e.x, e.y], st.inicio, { livre: e.shift });
    const p = enc.p;
    if (e.tipo === 'move') {
      const L = st.inicio ? Math.hypot(p[0] - st.inicio[0], p[1] - st.inicio[1]) : 0;
      prev({ ponto: p, pontoTipo: enc.tipo, inicio: st.inicio, linha: st.inicio ? { a: st.inicio, b: p, t: espessura(), alt: alturaParede(), ok: L >= 0.3 } : null });
      ctx.medida?.(st.inicio ? `${cmTxt(L)}${enc.tipo === 'parede' ? ' · encosta na parede' : enc.tipo === 'ponta' ? ' · na ponta da parede' : ''}` : null);
      return;
    }
    if (e.tipo === 'click') {
      if (!st.inicio) { st.inicio = p; tocar('clique'); prev({ ponto: p, inicio: p }); render(); return; }
      const L = Math.hypot(p[0] - st.inicio[0], p[1] - st.inicio[1]);
      if (L < 0.3) { toast('Parede curta demais (mínimo 30 cm).'); return; }
      const nova = { id: 'nw-' + uid(), a: [r3(st.inicio[0]), r3(st.inicio[1])], b: [r3(p[0]), r3(p[1])], tipo: st.tipoParede, t: espessura() };
      gravar((o) => { o.paredes = [...o.paredes, nova]; });
      // continua a parede a partir da ponta, a não ser que tenha encostado em outra parede
      st.inicio = enc.tipo === 'parede' ? null : p;
      prev(st.inicio ? { ponto: p, inicio: p } : null);
      ctx.medida?.(null);
      render();
    }
    return;
  }
  // pontos de parede: no 3D vem o ponto atingido na parede; na planta, o ponto do clique
  const ponto = e.wx !== undefined && e.wx !== null ? [e.wx, e.wy] : [e.x, e.y];
  if (ponto[0] === undefined || ponto[0] === null) { prev(null); return; }
  if (st.modo === 'vao') {
    const hit = e.wall ? (() => { const w = P.tip.walls.find((q) => q.id === e.wall); if (!w) return null; const wi = wallInfo(w); return { w, s: (ponto[0] - w.a[0]) * wi.ux + (ponto[1] - w.a[1]) * wi.uy }; })() : paredeNoPonto(P, ponto);
    if (!hit) { prev(null); ctx.medida?.(null); return; }
    const tv = TIPOS_VAO[st.tipoVao];
    const de = r3(Math.max(0, hit.s - tv.largura / 2));
    const ok = vaoCabe(P, hit.w.id, de, tv.largura) && !(hit.w.guarda);
    const jan = tv.tipo.startsWith('J');
    if (e.tipo === 'move') { prev({ vao: { wall: hit.w.id, de, largura: tv.largura, ok, z0: jan ? (tv.tipo === 'J1' ? 1.5 : 1.0) : 0, z1: jan ? (tv.tipo === 'J1' ? 2.1 : 2.1) : 2.1 } }); ctx.medida?.(ok ? tv.nome : 'Não cabe aqui: longe das pontas e de outros vãos'); return; }
    if (e.tipo === 'click') {
      if (!ok) { tocar('erro'); toast('O vão não cabe aí. Precisa de 8 cm até a ponta da parede e 10 cm de outro vão.'); return; }
      const v = { id: 'nv-' + uid(), wall: hit.w.id, tipo: tv.tipo, de, largura: tv.largura, ...(tv.passagem ? { passagem: true } : {}), abre: 1, dobradica: 'a' };
      gravar((o) => { o.vaos = [...o.vaos, v]; });
      st.sel = { kind: 'vao', id: v.id }; render();
    }
    return;
  }
  if (st.modo === 'sel') {
    const op = vaoNoPonto(P, ponto);
    const hit = op ? null : e.wall ? { w: P.tip.walls.find((q) => q.id === e.wall) } : paredeNoPonto(P, ponto);
    if (e.tipo === 'move') {
      prev({ sel: st.sel?.kind === 'parede' ? st.sel.id : hit?.w?.id, selCor: '#f2a900', vao: op ? { wall: op.wall, de: op.s0, largura: op.largura, ok: true, z0: op.porta ? 0 : op.peitoril, z1: op.porta ? op.altura : op.peitoril + op.altura } : selVao() });
      ctx.medida?.(op ? `${op.nome || 'Vão'} · clique para editar` : hit?.w ? `${nomeParede(hit.w)} · clique para editar` : null);
      return;
    }
    if (e.tipo === 'click') {
      st.sel = op ? { kind: 'vao', id: op.id } : hit?.w ? { kind: 'parede', id: hit.w.id } : null;
      tocar(st.sel ? 'abrir' : 'clique');
      realcarSel(); render();
    }
  }
}
const r3 = (v) => Math.round(v * 1000) / 1000;
function selVao() {
  if (st.sel?.kind !== 'vao') return null;
  const op = plan().openings.find((o) => o.id === st.sel.id); if (!op) return null;
  return { wall: op.wall, de: op.s0, largura: op.largura, ok: true, z0: op.porta ? 0 : op.peitoril, z1: op.porta ? op.altura : op.peitoril + op.altura };
}
function realcarSel() { prev(st.sel?.kind === 'parede' ? { sel: st.sel.id } : st.sel?.kind === 'vao' ? { vao: selVao() } : null); }
// "Parede entre Sala e Quarto 1": cômodos dos dois lados da parede original
function descreverParede(id) {
  const tip = ctx.getTipOriginal?.(); const w = tip?.walls.find((q) => q.id === id);
  if (!w) return 'Parede demolida';
  const wi = wallInfo(w), nomes = new Set();
  for (const sg of [1, -1]) for (const f of [0.3, 0.5, 0.7]) {
    const p = wallPoint(w, wi.len * f, sg * (w.t / 2 + 0.15));
    const r = tip.rooms.find((q) => pointInPolyLocal(p, q.poly)); if (r) nomes.add(r.nome);
  }
  return nomes.size ? `Parede demolida entre ${[...nomes].join(' e ')}` : 'Parede demolida';
}
function pointInPolyLocal([x, y], P) { let d = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) d = !d; } return d; }
function nomeParede(w) { return w.obra ? `${TIPOS_PAREDE[w.obra]?.nome || 'Parede'} nova` : 'Parede da planta'; }

// ---------------------------------------------------------------- painel
function render() {
  if (!ctx) return;
  $$('#obra-modo [data-om]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.om === st.modo)));
  const dica = {
    parede: 'Clique (ou toque) no piso para começar a parede e de novo para terminar. A parede continua da ponta até você encostar em outra parede, clicar com o botão direito ou apertar Esc. Shift solta o encaixe.',
    vao: 'Escolha o tipo e clique na parede onde quer abrir. Verde cabe, vermelho não.',
    sel: 'Clique numa parede ou num vão para editar, demolir, fechar ou restaurar.',
  }[st.modo];
  $('#obra-dica').textContent = dica;
  const o = obra(), P = plan();
  let h = '';
  if (st.modo === 'parede') {
    h += `<h3 class="sub">Tipo de parede</h3><div class="obra-tipos">${Object.entries(TIPOS_PAREDE).map(([k, t]) => `<button class="obra-tipo ${st.tipoParede === k ? 'on' : ''}" data-tp-parede="${k}"><b>${esc(t.nome)}</b><span>${esc(t.desc)} ${cmTxt(t.t)}</span></button>`).join('')}</div>`;
    if (st.inicio) h += `<div class="acoes-row"><button class="btn btn-sm" data-obra="parar">Terminar desenho</button></div>`;
  } else if (st.modo === 'vao') {
    h += `<h3 class="sub">Tipo de vão</h3><div class="chips">${Object.entries(TIPOS_VAO).map(([k, t]) => `<button class="chip-s ${st.tipoVao === k ? 'on' : ''}" data-tp-vao="${k}">${esc(t.nome)}</button>`).join('')}</div>`;
  } else {
    h += cartaoSel(P);
  }
  // listas do que mudou
  const dem = o.demolidas.map((id) => `<li><span>${esc(descreverParede(id))}</span><button class="btn btn-sm" data-restaurar="${id}">Restaurar</button></li>`);
  const fech = o.fechados.map((id) => `<li><span>Vão fechado (${esc(id)})</span><button class="btn btn-sm" data-reabrir="${id}">Reabrir</button></li>`);
  const n = o.paredes.length, nv = o.vaos.length;
  h += `<h3 class="sub">Resumo da obra</h3><p class="nota">${n} ${n === 1 ? 'parede nova' : 'paredes novas'} · ${nv} ${nv === 1 ? 'vão novo' : 'vãos novos'} · ${o.demolidas.length} ${o.demolidas.length === 1 ? 'parede demolida' : 'paredes demolidas'} · ${o.fechados.length} ${o.fechados.length === 1 ? 'vão fechado' : 'vãos fechados'}</p>`;
  if (dem.length || fech.length) h += `<ul class="obra-lista">${dem.join('')}${fech.join('')}</ul>`;
  $('#obra-corpo').innerHTML = h;
  $('#obra-original').disabled = !(o.paredes.length || o.demolidas.length || o.vaos.length || o.fechados.length);
}

function cartaoSel(P) {
  if (!st.sel) return '<p class="nota">Nada selecionado.</p>';
  if (st.sel.kind === 'parede') {
    const w = P.tip.walls.find((q) => q.id === st.sel.id);
    if (!w) { st.sel = null; return '<p class="nota">Nada selecionado.</p>'; }
    const L = wallInfo(w).len;
    if (!w.obra) {
      const ext = ehExterna(P.tip, w);
      return `<div class="obra-card"><b>Parede da planta</b><span>${cmTxt(L)} de comprimento · ${cmTxt(w.t)} de espessura${w.guarda ? ' · guarda-corpo' : ''}</span>
        ${ext ? '<p class="nota">Parede de fachada: não pode ser demolida.</p>' : `<div class="acoes-row"><button class="btn btn-sm btn-perigo" data-obra="demolir">Demolir parede</button></div><p class="nota">As portas e janelas dessa parede saem junto. Dá para restaurar depois.</p>`}</div>`;
    }
    const nw = obra().paredes.find((q) => q.id === w.id);
    const tp = TIPOS_PAREDE[nw.tipo] || TIPOS_PAREDE.alvenaria;
    const pintavel = !['vidro', 'ripado'].includes(nw.tipo);
    return `<div class="obra-card"><b>${esc(tp.nome)} nova</b><span>${cmTxt(L)} de comprimento · ${cmTxt(w.t)} de espessura</span>
      <h4>Tipo</h4><div class="chips">${Object.entries(TIPOS_PAREDE).map(([k, t]) => `<button class="chip-s ${nw.tipo === k ? 'on' : ''}" data-mudar-tipo="${k}">${esc(t.nome)}</button>`).join('')}</div>
      ${pintavel ? `<h4>Cor</h4><div class="cores obra-cores">${CORES.map(([c, n]) => `<button class="sw-cor ${(nw.cor || '#f1efeb') === c ? 'on' : ''}" data-cor="${c}" title="${n}" style="background:${c}"></button>`).join('')}</div>` : ''}
      <h4>Comprimento e posição</h4>
      <div class="acoes-row"><button class="btn btn-sm" data-esticar="-0.1">− 10 cm</button><button class="btn btn-sm" data-esticar="0.1">+ 10 cm</button><button class="btn btn-sm" data-mover="-0.05">◂ 5 cm</button><button class="btn btn-sm" data-mover="0.05">5 cm ▸</button></div>
      <div class="acoes-row"><button class="btn btn-sm btn-perigo" data-obra="excluir">Excluir parede</button></div></div>`;
  }
  const op = P.openings.find((q) => q.id === st.sel.id);
  if (!op) { st.sel = null; return '<p class="nota">Nada selecionado.</p>'; }
  if (!op.obra) {
    return `<div class="obra-card"><b>${esc(op.nome || 'Vão')} da planta</b><span>${cmTxt(op.largura)} de largura</span>
      <div class="acoes-row"><button class="btn btn-sm btn-perigo" data-obra="fechar">Fechar o vão (vira parede)</button></div>
      <p class="nota">Para tirar só a folha da porta ou esconder a janela, use Peças.</p></div>`;
  }
  const v = obra().vaos.find((q) => q.id === op.id);
  return `<div class="obra-card"><b>${v.passagem ? 'Passagem' : esc(op.nome || 'Vão')} nova</b><span>${cmTxt(op.largura)} de largura</span>
    <h4>Largura</h4><div class="chips">${[0.6, 0.7, 0.8, 0.9, 1.2, 1.4, 1.8].map((l) => `<button class="chip-s ${Math.abs(op.largura - l) < 0.001 ? 'on' : ''}" data-largura="${l}">${Math.round(l * 100)}</button>`).join('')}</div>
    <h4>Posição</h4><div class="acoes-row"><button class="btn btn-sm" data-deslocar="-0.1">◂ 10 cm</button><button class="btn btn-sm" data-deslocar="0.1">10 cm ▸</button>
    ${op.porta && !v.passagem ? '<button class="btn btn-sm" data-obra="inverter">Inverter abertura</button><button class="btn btn-sm" data-obra="dobradica">Trocar dobradiça</button>' : ''}</div>
    <div class="acoes-row"><button class="btn btn-sm btn-perigo" data-obra="excluirvao">Excluir vão</button></div></div>`;
}

function acao(el) {
  const P = plan();
  if (el.dataset.om) { st.modo = el.dataset.om; st.inicio = null; prev(null); ctx.medida?.(null); if (st.modo === 'sel') realcarSel(); tocar('clique'); render(); return; }
  if (el.dataset.tpParede) { st.tipoParede = el.dataset.tpParede; tocar('clique'); render(); return; }
  if (el.dataset.tpVao) { st.tipoVao = el.dataset.tpVao; tocar('clique'); render(); return; }
  if (el.dataset.restaurar) { const id = el.dataset.restaurar; gravar((o) => { o.demolidas = o.demolidas.filter((x) => x !== id); }); render(); return; }
  if (el.dataset.reabrir) { const id = el.dataset.reabrir; gravar((o) => { o.fechados = o.fechados.filter((x) => x !== id); }); render(); return; }
  const sel = st.sel;
  if (el.dataset.mudarTipo && sel) { const k = el.dataset.mudarTipo; gravar((o) => { const q = o.paredes.find((x) => x.id === sel.id); if (q) { q.tipo = k; q.t = TIPOS_PAREDE[k].t; } }); after(); return; }
  if (el.dataset.cor && sel) { const c = el.dataset.cor; gravar((o) => { const q = o.paredes.find((x) => x.id === sel.id); if (q) q.cor = c; }, 'clique'); after(); return; }
  if (el.dataset.esticar && sel) {
    const d = +el.dataset.esticar;
    gravar((o) => { const q = o.paredes.find((x) => x.id === sel.id); if (!q) return; const L = Math.hypot(q.b[0] - q.a[0], q.b[1] - q.a[1]); const nl = Math.max(0.3, L + d); q.b = [r3(q.a[0] + (q.b[0] - q.a[0]) / L * nl), r3(q.a[1] + (q.b[1] - q.a[1]) / L * nl)]; }, 'clique');
    after(); return;
  }
  if (el.dataset.mover && sel) {
    const d = +el.dataset.mover;
    gravar((o) => { const q = o.paredes.find((x) => x.id === sel.id); if (!q) return; const L = Math.hypot(q.b[0] - q.a[0], q.b[1] - q.a[1]) || 1; const nx = -(q.b[1] - q.a[1]) / L, ny = (q.b[0] - q.a[0]) / L; q.a = [r3(q.a[0] + nx * d), r3(q.a[1] + ny * d)]; q.b = [r3(q.b[0] + nx * d), r3(q.b[1] + ny * d)]; }, 'clique');
    after(); return;
  }
  if (el.dataset.largura && sel) {
    const l = +el.dataset.largura, op = P.openings.find((q) => q.id === sel.id);
    const centro = op.s0 + op.largura / 2, de = r3(centro - l / 2);
    if (!vaoCabe(P, op.wall, de, l, op.id)) { tocar('erro'); toast('Essa largura não cabe nesse trecho de parede.'); return; }
    gravar((o) => { const v = o.vaos.find((x) => x.id === sel.id); if (v) { v.largura = l; v.de = de; } }, 'clique'); after(); return;
  }
  if (el.dataset.deslocar && sel) {
    const d = +el.dataset.deslocar, op = P.openings.find((q) => q.id === sel.id), de = r3(op.s0 + d);
    if (!vaoCabe(P, op.wall, de, op.largura, op.id)) { tocar('erro'); return; }
    gravar((o) => { const v = o.vaos.find((x) => x.id === sel.id); if (v) v.de = de; }, 'clique'); after(); return;
  }
  const a = el.dataset.obra;
  if (a === 'parar') { st.inicio = null; prev(null); ctx.medida?.(null); render(); return; }
  if (a === 'demolir' && sel) { const id = sel.id; gravar((o) => { o.demolidas = [...new Set([...o.demolidas, id])]; }, 'fechar'); st.sel = null; prev(null); render(); toast('Parede demolida.', 'Desfazer', () => ctx.desfazer()); return; }
  if (a === 'excluir' && sel) { const id = sel.id; gravar((o) => { o.paredes = o.paredes.filter((x) => x.id !== id); o.vaos = o.vaos.filter((v) => v.wall !== id); }, 'fechar'); st.sel = null; prev(null); render(); return; }
  if (a === 'fechar' && sel) { const id = sel.id; gravar((o) => { o.fechados = [...new Set([...o.fechados, id])]; }, 'fechar'); st.sel = null; prev(null); render(); return; }
  if (a === 'excluirvao' && sel) { const id = sel.id; gravar((o) => { o.vaos = o.vaos.filter((v) => v.id !== id); }, 'fechar'); st.sel = null; prev(null); render(); return; }
  if (a === 'inverter' && sel) { gravar((o) => { const v = o.vaos.find((x) => x.id === sel.id); if (v) v.abre = -(v.abre || 1); }, 'clique'); after(); return; }
  if (a === 'dobradica' && sel) { gravar((o) => { const v = o.vaos.find((x) => x.id === sel.id); if (v) v.dobradica = v.dobradica === 'b' ? 'a' : 'b'; }, 'clique'); after(); return; }
}
function after() { render(); realcarSel(); }

export function iniciarObra(c) {
  ctx = c;
  $('#obra-modo').addEventListener('click', (ev) => { const b = ev.target.closest('[data-om]'); if (b) acao(b); });
  $('#obra-corpo').addEventListener('click', (ev) => { const b = ev.target.closest('button'); if (b) acao(b); });
  $('#obra-cima').addEventListener('click', () => ctx.verDeCima?.());
  $('#obra-original').addEventListener('click', () => {
    confirmar('Voltar à planta original?', 'Paredes novas, demolições e vãos da obra serão desfeitos. Dá para desfazer depois.', 'Voltar à original', () => {
      edit((p) => { delete p.fix._obra; }, 'fixos'); st.sel = null; st.inicio = null; prev(null); render(); tocar('fechar');
    });
  });
  document.addEventListener('keydown', (ev) => {
    if (!ctx.ativo() || ev.target.closest?.('input, textarea, select')) return;
    if (ev.key === 'Escape' && st.inicio) { ev.preventDefault(); ev.stopPropagation(); eventoObra({ tipo: 'cancel' }); }
  }, true);
}
export function entrarObra() { st.inicio = null; render(); if (st.modo === 'sel') realcarSel(); }
export function sairObra() { st.inicio = null; prev(null); ctx?.medida?.(null); }
export function atualizarObra() { render(); if (st.modo === 'sel') realcarSel(); }
export const obraEstado = st;
void wallPoint;
