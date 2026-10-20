import { tipologiaPorId, TIPOS_ABERTURA } from './data/tipologias.js';
import { CATEGORIAS, CORES, catalogoPorId } from './data/catalogo.js';
import { ACAB_VAZIO, luzDe } from './data/acabamentos.js';
import { preparePlan, pointInPoly, localToPlan, polyArea } from './geom.js';
import {
  store, subscribe, edit, live, commit, undo, redo, select, selected, novoItem, uid,
  abrirProjeto, criarProjeto, renomear, exportarJSON, importarJSON, itensSugeridos, salvarAgora, marcarNovo,
} from './store.js';
import { analisar, circulacao, distancias, portaFrase } from './analysis.js';
import { createPlan2D } from './plan2d.js';
import { snapItem, colide, levarParaParede } from './snap.js';
import { tetoY } from './tetoGeo.js';
import * as Som from './audio.js';
import { tocar, tocarPasso } from './audio.js';
import { $, $$, esc, cm, fmtM2, mobile, toque, toast, abrirDialogo, confirmar, baixar, slug } from './ui/util.js';
import { renderHome, iniciarHome } from './ui/home.js';
import { renderCatalogo, iniciarCatalogo } from './ui/catalogo-ui.js';
import {
  iniciarFerramentas, redesenharFerramentas, desenharLuz, aplicar, alternarLuzComodo, trocarFerramenta, ajustarItensTeto, escopoAtual,
} from './ui/ferramentas.js';
import { exportarPlantaPng, exportarPlantaSvg, exportarCsv, exportarFoto, itensPorComodo } from './ui/exportar.js';
import { abrirTour, tourVisto } from './ui/tour.js';

let plan = null, plan2d = null, view3d = null, view3dLoading = null;
let viewMode = '2d', tool = 'moveis', ferrAberto = true, inspMobile = false, forroAuto = false, periodo = 'dia', paredesModo = 'recorte';
let ultimaAnalise = { alertas: [], circ: null };

// ======================================================================== som
Som.montarControle($('#som-home'));
Som.montarControle($('#som-editor'));

// ======================================================================== layout
function atualizarLayout() {
  const ws = $('#workspace');
  const comItem = !!selected() && (tool === 'moveis' || tool === 'luz');
  const insp = comItem && (!mobile() || inspMobile);
  ws.dataset.insp = insp ? '1' : '0';
  ws.dataset.ferr = ferrAberto && !(mobile() && insp) ? '1' : '0';
  ws.dataset.tool = tool;
  $$('#rail [data-tool], #bottom-bar [data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === tool && (!mobile() || ws.dataset.ferr === '1')));
  $$('.tp').forEach((p) => { p.hidden = p.dataset.tp !== tool; });
}
window.matchMedia('(max-width: 860px)').addEventListener('change', atualizarLayout);

function setTool(t) {
  if (t === tool) { ferrAberto = !ferrAberto; tocar(ferrAberto ? 'abrir' : 'fechar'); atualizarLayout(); return; }
  tool = t; ferrAberto = true; inspMobile = false;
  if (t !== 'moveis' && t !== 'luz') select(null);
  trocarFerramenta(t);
  plan2d?.setFerramenta(t);
  sincronizar3D();
  if (t === 'resumo') renderResumo();
  if (t === 'luz') desenharLuz();
  renderInspetor();
  atualizarLayout();
  tocar('abrir');
  requestAnimationFrame(() => plan2d?.fit?.());
}
$('#rail').addEventListener('click', (ev) => { const b = ev.target.closest('[data-tool]'); if (b) setTool(b.dataset.tool); });
$('#bottom-bar').addEventListener('click', (ev) => { const b = ev.target.closest('[data-tool]'); if (b) setTool(b.dataset.tool); });
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-fechar]'); if (!b) return;
  if (b.dataset.fechar === 'ferr') { ferrAberto = false; tocar('fechar'); atualizarLayout(); }
  if (b.dataset.fechar === 'inspetor') { inspMobile = false; select(null); atualizarLayout(); }
});

// ======================================================================== abrir o editor
function abrirEditor(novo = false) {
  const tip = tipologiaPorId(store.projeto.tipologia);
  plan = preparePlan(tip);
  $('#home').hidden = true; $('#editor').hidden = false;
  $('#proj-nome').value = store.projeto.nome;
  $('#proj-tip').textContent = `TIPOLOGIA ${tip.nome.toUpperCase()} · ${fmtM2(tip.areaPrivativa)} m² · pé-direito ${String(tip.peDireito).replace('.', ',')} m`;
  if (!plan2d) {
    plan2d = createPlan2D($('#plan-host'), {
      onView: atualizarEscala, onRoomClick: (id, t) => aplicar(t === 'paredes' ? 'parede' : t, id, null, false),
      onLuzToggle: alternarLuzComodo, onSelScreen: (p) => posBarra(barra2d, p),
      onPegar: () => tocar('pegar'), onEncaixe: () => tocar('encaixe'), onSoltar: aoSoltar, aoMover: ajustarTeto,
    });
  }
  plan2d.setPlan(plan);
  plan2d.redrawItems();
  if (view3d) { view3d.setPlan(plan); view3d.syncItems(store.projeto.itens); }
  tool = 'moveis'; ferrAberto = !mobile(); inspMobile = false;
  trocarFerramenta('moveis'); plan2d.setFerramenta('moveis'); view3d?.setFerramenta('moveis');
  preencherIrPara(); renderCatalogo(); redesenharFerramentas();
  setView(window.innerWidth >= 1600 ? 'split' : '2d');
  agendarAnalise(0); renderInspetor(); atualizarHistorico(); atualizarStatus(); atualizarLayout();
  if (novo || !tourVisto()) setTimeout(abrirTour, 700);
}

$('#btn-voltar').addEventListener('click', () => { salvarAgora(); $('#editor').hidden = true; $('#home').hidden = false; renderHome(); view3d?.setVisible(false); tocar('fechar'); });
$('#proj-nome').addEventListener('change', (ev) => renomear(ev.target.value.trim() || 'Meu apartamento'));
$('#proj-nome').addEventListener('keydown', (ev) => { if (ev.key === 'Enter') ev.target.blur(); });

// ======================================================================== 2D / 3D
async function garantir3D() {
  if (view3d) return view3d;
  if (!view3dLoading) {
    view3dLoading = import('./three/view3d.js').then(({ createView3D }) => {
      view3d = createView3D($('#gl-host'), {
        onMode: aoMudarModo,
        onSuperficie: (info) => aplicar(info.tipo, info.room, info.edge, true),
        onInterruptor: alternarLuzComodo,
        onHover: dicaHover3d,
        onSelScreen: (p) => posBarra(barra3d, p),
        onPegar: () => tocar('pegar'), onEncaixe: () => tocar('encaixe'), onSoltar: aoSoltar,
        onPasso: ({ piso }) => tocarPasso(piso),
      });
      view3d.setPlan(plan);
      view3d.syncItems(store.projeto.itens);
      view3d.setPeriodo(periodo);
      view3d.setParedes(paredesModo);
      view3d.setFerramenta(tool);
      view3d.setEscopo(escopoAtual(tool) || 'comodo');
      return view3d;
    });
  }
  return view3dLoading;
}

async function setView(v) {
  if (v === 'split' && mobile()) v = '3d';
  viewMode = v;
  $('#workspace').dataset.view = v;
  $$('.view-seg button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.view === v)));
  $('#bb-view span').textContent = v === '2d' ? 'Ver em 3D' : 'Ver planta';
  if (v !== '2d') {
    const v3 = await garantir3D();
    v3.setVisible(true);
    aoMudarModo(v3.getMode());
    sincronizar3D();
  } else view3d?.setVisible(false);
  redesenharFerramentas();
  requestAnimationFrame(() => plan2d?.fit());
}
$$('.view-seg button').forEach((b) => b.addEventListener('click', () => { tocar('clique'); setView(b.dataset.view); }));
$('#bb-view').addEventListener('click', () => { tocar('clique'); setView(viewMode === '2d' ? '3d' : '2d'); });

function sincronizar3D() {
  const v3 = view3d; if (!v3) return;
  v3.setFerramenta(tool);
  v3.setEscopo(escopoAtual(tool) || 'comodo');
  if (viewMode === '2d') return;
  if (tool === 'teto' && v3.getMode() !== 'forro') { forroAuto = true; v3.setMode('forro'); }
  else if (tool !== 'teto' && forroAuto && v3.getMode() === 'forro') { forroAuto = false; v3.setMode('orbita'); }
}

$('#seg-modo').addEventListener('click', async (ev) => {
  const b = ev.target.closest('[data-modo]'); if (!b) return;
  forroAuto = false; tocar('clique');
  if (b.dataset.modo === 'passeio') select(null);
  (await garantir3D()).setMode(b.dataset.modo);
});
$('#seg-periodo').addEventListener('click', async (ev) => {
  const b = ev.target.closest('[data-luz]'); if (!b) return;
  trocarPeriodo(b.dataset.luz);
});
async function trocarPeriodo(p) {
  periodo = p; tocar('abrir');
  $$('#seg-periodo button').forEach((x) => x.classList.toggle('on', x.dataset.luz === p));
  Som.setPeriodo(p);
  (await garantir3D()).setPeriodo(p);
}
const MODOS_PAREDE = [['recorte', 'recorte'], ['baixas', 'baixas'], ['inteiras', 'inteiras']];
$('#b-paredes').addEventListener('click', async () => {
  const i = MODOS_PAREDE.findIndex((m) => m[0] === paredesModo);
  paredesModo = MODOS_PAREDE[(i + 1) % MODOS_PAREDE.length][0];
  $('#b-paredes span').textContent = `Paredes: ${paredesModo}`;
  tocar('clique');
  (await garantir3D()).setParedes(paredesModo);
});
$('#b-foto').addEventListener('click', async () => exportarFoto(await garantir3D()));
$('#ir-para').addEventListener('change', async (ev) => { if (ev.target.value) { tocar('clique'); (await garantir3D()).irPara(ev.target.value); } ev.target.blur(); });

function preencherIrPara() {
  const opts = plan.rooms.filter((r) => r.id !== 'circ').map((r) => `<option value="${r.id}">${esc(r.nome)}</option>`).join('');
  $('#ir-para').innerHTML = `<option value="">Ir para…</option>${opts}`;
}
function aoMudarModo(m) {
  $$('#seg-modo [data-modo]').forEach((x) => x.classList.toggle('on', x.dataset.modo === m));
  $('#vista-3d').dataset.modo = m;
  $('#joy').hidden = !(m === 'passeio' && toque());
  const hint = {
    orbita: toque() ? 'Arraste para girar · pinça para aproximar · toque num móvel e arraste para mover' : 'Arraste para girar · botão direito move a câmera · role para aproximar · arraste um móvel para mover',
    cima: 'Vista de cima com corte a 1,15 m',
    passeio: toque() ? 'Joystick para andar · arraste a tela para olhar em volta' : 'W A S D ou setas para andar · arraste para olhar · Shift corre',
    forro: tool === 'teto' ? 'Vista de baixo para cima. Escolha o forro e clique no cômodo.' : 'Vista de baixo para cima: forro, sancas e luminárias',
  }[m];
  const h = $('#hint-3d'); h.textContent = hint; h.hidden = false;
  clearTimeout(window.__hint); window.__hint = setTimeout(() => { h.hidden = true; }, 6000);
  $('#ir-para').value = '';
  syncBarras();
}

// joystick
(() => {
  const joy = $('#joy'), knob = $('.joy-knob', joy);
  let id = null, c = null;
  const set = (x, y) => { knob.style.transform = `translate(${x * 38}px, ${y * 38}px)`; view3d?.moveInput(x, -y); };
  joy.addEventListener('pointerdown', (ev) => { id = ev.pointerId; joy.setPointerCapture(id); const r = joy.getBoundingClientRect(); c = [r.left + r.width / 2, r.top + r.height / 2]; ev.preventDefault(); ev.stopPropagation(); });
  joy.addEventListener('pointermove', (ev) => {
    if (ev.pointerId !== id) return;
    let x = (ev.clientX - c[0]) / 50, y = (ev.clientY - c[1]) / 50; const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
    set(x, y);
  });
  const end = () => { id = null; set(0, 0); };
  joy.addEventListener('pointerup', end); joy.addEventListener('pointercancel', end);
})();

// dica que acompanha o cursor no 3D
function dicaHover3d(txt, x, y) {
  const t = $('#tip-3d');
  if (!txt) { t.hidden = true; return; }
  const r = $('#vista-3d').getBoundingClientRect();
  t.textContent = txt; t.hidden = false;
  t.style.left = Math.min(r.width - 12, x - r.left + 14) + 'px'; t.style.top = Math.max(8, y - r.top - 34) + 'px';
}

// ---------------------------------------------------------------- zoom, escala e camadas
$('#z-mais').addEventListener('click', () => plan2d.zoom(1.25));
$('#z-menos').addEventListener('click', () => plan2d.zoom(0.8));
$('#z-fit').addEventListener('click', () => plan2d.fit());
function atualizarEscala(view) {
  const s = view.s;
  const passo = s > 140 ? 0.5 : s < 35 ? 2 : 1;
  $('#escala span').style.width = `${(s * passo).toFixed(1)}px`;
  $('#escala em').textContent = passo === 0.5 ? '50 cm' : `${passo} m`;
}
$('#b-camadas').addEventListener('click', (ev) => {
  ev.stopPropagation();
  const p = $('#pop-camadas'); p.hidden = !p.hidden; $('#b-camadas').setAttribute('aria-expanded', String(!p.hidden)); tocar(p.hidden ? 'fechar' : 'abrir');
});
document.addEventListener('click', (ev) => { if (!ev.target.closest('.camadas')) { $('#pop-camadas').hidden = true; $('#b-camadas').setAttribute('aria-expanded', 'false'); } });
$('#pop-camadas').addEventListener('change', (ev) => {
  const t = ev.target; tocar('clique');
  if (t.id === 'f-nomes') plan2d.setFlag('nomes', t.checked);
  if (t.id === 'f-dist') plan2d.setFlag('distancias', t.checked);
  if (t.id === 'f-cotas') plan2d.setFlag('cotas', t.checked);
  if (t.id === 'f-circ') plan2d.setFlag('circulacao', t.checked);
});

// ======================================================================== adicionar móveis
function ajustarTeto(it) {
  if (catalogoPorId[it.tipo]?.teto) it.elev = Math.round((tetoY(plan, store.projeto.acab, it.x, it.y) - it.h) * 1000) / 1000;
}
function encontrarLugar(it, [x, y]) {
  const sala = plan.rooms.find((r) => r.id === 'sala') || plan.rooms[0];
  let room = plan.rooms.find((r) => pointInPoly(x, y, r.poly));
  if (!room) { room = sala; [x, y] = room.centro; }
  const itens = store.projeto.itens;
  for (let r = 0; r <= 2.4; r += 0.1) {
    const n = r === 0 ? 1 : Math.ceil(r * 24);
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      it.x = Math.round((x + Math.cos(a) * r) * 100) / 100; it.y = Math.round((y + Math.sin(a) * r) * 100) / 100;
      if (!colide(plan, it, itens)) return it;
    }
  }
  it.x = x; it.y = y;
  return it;
}
function pontoPadrao() {
  if (viewMode !== '3d' && plan2d) return plan2d.centroVisivel();
  const r = $('#gl-host').getBoundingClientRect();
  const p = view3d?.pontoNaTela(r.left + r.width / 2, r.top + r.height * 0.55);
  return p || (plan.rooms.find((q) => q.id === 'sala') || plan.rooms[0]).centro;
}
function adicionar(catId, ponto, exato = false, extra = {}) {
  const c = catalogoPorId[catId];
  if (c.personalizado && !extra.w) { dialogoSobMedida(); return; }
  const it = novoItem(catId, extra);
  const p = ponto || pontoPadrao();
  const itens = store.projeto.itens;
  if (exato && plan.rooms.some((r) => pointInPoly(p[0], p[1], r.poly))) { it.x = p[0]; it.y = p[1]; snapItem(plan, itens, it); }
  else {
    encontrarLugar(it, p);
    if (c.parede && !c.teto && !c.livre) levarParaParede(plan, itens, it);
    else if (c.parede && !c.teto) snapItem(plan, itens, it);
  }
  ajustarTeto(it);
  marcarNovo(it.uid);
  edit((proj) => proj.itens.push(it));
  select(it.uid);
  tocar(c.luz ? 'lampada' : 'montar');
  if (mobile()) { ferrAberto = false; atualizarLayout(); }
  toast(`${it.nome} adicionado (${cm(it.w)} × ${cm(it.d)} cm).`);
}
function soltarEm(cx, cy) {
  const dentro = (r) => r.width > 0 && cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
  if (viewMode !== '3d' && dentro($('#plan-host').getBoundingClientRect())) return plan2d.screenToWorld(cx, cy);
  if (viewMode !== '2d' && view3d && dentro($('#gl-host').getBoundingClientRect())) return view3d.pontoNaTela(cx, cy);
  return null;
}
iniciarCatalogo({ adicionar, soltarEm });

function aoSoltar(kind, it) {
  if (it && colide(plan, it, store.projeto.itens)) { tocar('erro'); return; }
  tocar(kind === 'rot' ? 'girar' : kind === 'resize' ? 'encaixe' : 'soltar');
}

// ======================================================================== inspetor do móvel
const LADOS = { '0,1': 'Frente', '0,-1': 'Fundo', '-1,0': 'Esquerda', '1,0': 'Direita' };
function campoNum(id, label, valor, unidade = 'cm', attrs = '') {
  return `<label class="med" for="${id}">${label}<span class="campo-num"><input id="${id}" type="number" inputmode="decimal" value="${valor}" ${attrs}><span class="u">${unidade}</span></span></label>`;
}
let inspUid = null;
function renderInspetor() {
  const it = selected();
  if (!it) { $('#insp-item').innerHTML = ''; inspUid = null; syncBarras(); atualizarLayout(); return; }
  renderInspItem(it); syncBarras(); atualizarLayout();
}
function renderInspItem(it) {
  const c = catalogoPorId[it.tipo];
  const pal = CORES[c.paleta] || null;
  inspUid = it.uid;
  $('#insp-item').innerHTML = `<div class="insp">
    <div class="insp-head">
      <div class="painel-head"><input id="i-nome" value="${esc(it.nome)}" aria-label="Nome do móvel" maxlength="40"><button class="icon-btn" data-fechar="inspetor" aria-label="Fechar detalhes"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button></div>
      <span>${esc(CATEGORIAS.find((k) => k.id === c.cat)?.nome || '')} · ${esc(c.nome)}</span>
    </div>
    <div class="grupo"><h3>Medidas</h3>
      <div class="grid-med">
        ${campoNum('i-w', 'Largura', cm(it.w), 'cm', 'min="5" max="600" step="1"')}
        ${campoNum('i-d', 'Profundidade', cm(it.d), 'cm', 'min="1" max="600" step="1"')}
        ${campoNum('i-h', 'Altura', cm(it.h), 'cm', 'min="1" max="270" step="1"')}
        ${campoNum('i-e', c.teto ? 'Distância ao piso' : 'Altura do chão', cm(it.elev || 0), 'cm', `min="0" max="260" step="1" ${c.teto ? 'disabled' : ''}`)}
      </div>
      ${c.teto ? '<p class="nota">A luminária acompanha a altura do forro.</p>' : ''}
    </div>
    <div class="grupo"><h3>Distâncias livres</h3>
      <div class="dist-grid" id="i-dist"></div>
      <p class="nota">Digite uma distância para afastar ou encostar o móvel naquele lado.</p>
    </div>
    <div class="grupo"><h3>Rotação</h3>
      <div class="rot-row">
        <button class="icon-btn" id="i-rl" aria-label="Girar 90° para a esquerda" title="Girar −90°"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4v6h6M4.5 10A8 8 0 1112 20" /></svg></button>
        ${campoNum('i-r', 'Ângulo', Math.round(it.rot || 0), 'graus', 'step="1"')}
        <button class="icon-btn" id="i-rr" aria-label="Girar 90° para a direita" title="Girar +90° (R)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4v6h-6M19.5 10A8 8 0 1012 20" /></svg></button>
      </div>
    </div>
    ${pal ? `<div class="grupo"><h3>Acabamento</h3><div class="cores" id="i-cores">${pal.map(([hex, nome]) => `<button class="cor${hex === it.cor ? ' on' : ''}" style="background:${hex}" data-cor="${hex}" aria-label="${nome}" title="${nome}"></button>`).join('')}</div></div>` : ''}
    <div class="grupo"><h3>Avisos</h3><ul class="alertas" id="i-alertas"></ul></div>
    <div class="acoes-row">
      <button class="btn btn-sm" id="i-dup">Duplicar</button>
      <button class="btn btn-sm btn-danger" id="i-del">Excluir</button>
    </div>
  </div>`;
  atualizarInspItem(it);
}
function atualizarInspItem(it) {
  const set = (id, v) => { const el = $('#' + id); if (el && document.activeElement !== el) el.value = v; };
  set('i-w', cm(it.w)); set('i-d', cm(it.d)); set('i-h', cm(it.h)); set('i-e', cm(it.elev || 0)); set('i-r', Math.round(it.rot || 0));
  const ds = distancias(plan, store.projeto.itens, it);
  const box = $('#i-dist');
  if (box) {
    const ordem = ['0,-1', '0,1', '-1,0', '1,0'];
    if (!box.children.length) {
      box.innerHTML = ordem.map((k) => {
        const d = ds.find((x) => `${x.lx},${x.ly}` === k);
        return campoNum(`i-dist-${k}`, LADOS[k], d ? cm(d.dist) : '', 'cm', `data-lado="${k}" ${d ? '' : 'disabled placeholder="—"'} min="0" step="1"`);
      }).join('');
    } else for (const k of ordem) {
      const d = ds.find((x) => `${x.lx},${x.ly}` === k);
      const el = $(`#i-dist-${CSS.escape(k)}`);
      if (el && document.activeElement !== el) { el.value = d ? cm(d.dist) : ''; el.disabled = !d; }
    }
  }
  const al = ultimaAnalise.alertas.filter((a) => a.uid === it.uid);
  const ul = $('#i-alertas');
  if (ul) ul.innerHTML = al.length ? al.map((a) => `<li class="${a.nivel}">${esc(a.msg)}</li>`).join('') : '<li class="ok">Sem conflitos com paredes, portas ou outros móveis.</li>';
  $$('#i-cores .cor').forEach((b) => b.classList.toggle('on', b.dataset.cor === it.cor));
}

$('#insp-item').addEventListener('change', (ev) => {
  const t = ev.target, it = selected(); if (!it) return;
  const n = parseFloat(String(t.value).replace(',', '.'));
  if (t.id === 'i-nome') { edit(() => { it.nome = t.value.trim() || catalogoPorId[it.tipo].nome; }); return; }
  if (Number.isNaN(n)) { atualizarInspItem(it); return; }
  const m = n / 100;
  if (t.id === 'i-w') edit(() => { it.w = Math.min(6, Math.max(0.05, m)); });
  if (t.id === 'i-d') edit(() => { it.d = Math.min(6, Math.max(0.01, m)); });
  if (t.id === 'i-h') edit(() => { it.h = Math.min(2.7, Math.max(0.005, m)); ajustarTeto(it); });
  if (t.id === 'i-e') edit(() => { it.elev = Math.min(2.6, Math.max(0, m)); });
  if (t.id === 'i-r') edit(() => { it.rot = ((Math.round(n) % 360) + 360) % 360; });
  if (t.dataset.lado) {
    const [lx, ly] = t.dataset.lado.split(',').map(Number);
    const d = distancias(plan, store.projeto.itens, it).find((x) => x.lx === lx && x.ly === ly);
    if (!d) return;
    const delta = d.dist - Math.max(0, m);
    const [px, py] = localToPlan({ ...it, x: 0, y: 0 }, lx * delta, ly * delta);
    edit(() => { it.x = Math.round((it.x + px) * 1000) / 1000; it.y = Math.round((it.y + py) * 1000) / 1000; ajustarTeto(it); });
  }
  tocar('encaixe');
});
$('#insp-item').addEventListener('keydown', (ev) => { if (ev.key === 'Enter' && ev.target.matches('input')) ev.target.blur(); });
$('#insp-item').addEventListener('click', (ev) => {
  const it = selected(); if (!it) return;
  const b = ev.target.closest('button'); if (!b) return;
  if (b.id === 'i-rr') girar(90);
  if (b.id === 'i-rl') girar(-90);
  if (b.id === 'i-dup') duplicar();
  if (b.id === 'i-del') excluir();
  if (b.dataset.cor) { edit(() => { it.cor = b.dataset.cor; }); tocar('pintar'); }
});

function girar(g) { const it = selected(); if (!it) return; edit(() => { it.rot = (((it.rot || 0) + g) % 360 + 360) % 360; }); tocar('girar'); }
function duplicar() {
  const it = selected(); if (!it) return;
  const n = { ...it, uid: uid() };
  const [ox, oy] = localToPlan({ ...it, x: 0, y: 0 }, it.w + 0.1, 0);
  n.x = it.x + ox; n.y = it.y + oy;
  if (colide(plan, n, store.projeto.itens)) encontrarLugar(n, [n.x, n.y]);
  ajustarTeto(n); marcarNovo(n.uid);
  edit((p) => p.itens.push(n)); select(n.uid);
  tocar('montar');
  toast(`${n.nome} duplicado.`);
}
function excluir() {
  const it = selected(); if (!it) return;
  edit((p) => { p.itens = p.itens.filter((x) => x.uid !== it.uid); });
  select(null);
  tocar('excluir');
  toast(`${it.nome} removido.`, 'Desfazer', () => { undo(); tocar('desfazer'); });
}

// ---------------------------------------------------------------- barra flutuante do móvel selecionado
function criarBarra(host) {
  const bar = document.createElement('div');
  bar.className = 'obj-bar'; bar.hidden = true;
  const ic = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
  bar.innerHTML = `<button data-sb="gl" aria-label="Girar 90° à esquerda" title="Girar à esquerda">${ic('<path d="M4 4v6h6M4.5 10A8 8 0 1112 20" />')}</button>
    <button data-sb="gr" aria-label="Girar 90° à direita" title="Girar à direita (R)">${ic('<path d="M20 4v6h-6M19.5 10A8 8 0 1012 20" />')}</button>
    <button data-sb="dup" aria-label="Duplicar" title="Duplicar (Ctrl+D)">${ic('<path d="M8 8h11v11H8zM5 15V5h10" />')}</button>
    <button data-sb="medidas" aria-label="Medidas e detalhes" title="Medidas e detalhes">${ic('<path d="M3 17L17 3l4 4L7 21zM8 12l2 2M11 9l2 2M14 6l2 2" />')}</button>
    <button data-sb="del" class="del" aria-label="Excluir" title="Excluir (Delete)">${ic('<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" />')}</button>`;
  host.appendChild(bar);
  bar.addEventListener('pointerdown', (ev) => ev.stopPropagation());
  bar.addEventListener('click', (ev) => {
    const k = ev.target.closest('[data-sb]')?.dataset.sb;
    if (k === 'medidas') { inspMobile = true; tocar('abrir'); atualizarLayout(); }
    if (k === 'gl') girar(-90);
    if (k === 'gr') girar(90);
    if (k === 'dup') duplicar();
    if (k === 'del') excluir();
  });
  return bar;
}
const barra2d = criarBarra($('#vista-2d'));
const barra3d = criarBarra($('#vista-3d'));
function posBarra(bar, p) {
  if (!p || !p.vis || !selected() || (tool !== 'moveis' && tool !== 'luz')) { bar.hidden = true; return; }
  bar.hidden = false;
  const w = bar.offsetWidth || 190, ww = p.w || 800;
  bar.style.left = Math.max(w / 2 + 8, Math.min(ww - w / 2 - 8, p.x)) + 'px';
  bar.style.top = Math.max(52, p.y) + 'px';
}
function syncBarras() {
  if (!selected() || (tool !== 'moveis' && tool !== 'luz')) { barra2d.hidden = true; barra3d.hidden = true; }
  else { plan2d?.redrawItems?.(); view3d?.syncSel(); }
}

// ======================================================================== resumo
function renderResumo() {
  if (!plan || !store.projeto) return;
  const al = ultimaAnalise.alertas, bloq = ultimaAnalise.circ?.bloqueios || [];
  const erros = al.filter((a) => a.nivel === 'erro').length, avisos = al.filter((a) => a.nivel === 'aviso').length;
  const avisosLi = [
    ...(ultimaAnalise.circ?.semGiro || []).map((r) => `<li class="aviso">Sem área livre para giro de cadeira de rodas (Ø ${String(plan.tip.requisitos.giro360).replace('.', ',')} m) em ${esc(r.nome.toLowerCase())}.</li>`),
    ...bloq.map((b) => `<li class="erro">Passagem com menos de ${cm(ultimaAnalise.circ.passagem)} cm até ${esc(b.room ? (b.room.id === 'sala' || b.room.id === 'circ' ? 'a ' : 'o ') + b.rotulo.toLowerCase() : portaFrase(b))}.</li>`),
    ...al.map((a) => `<li class="${a.nivel}" data-uid="${a.uid}">${esc(a.msg)}</li>`),
  ];
  const { mapa, fora } = itensPorComodo(plan);
  const total = store.projeto.itens.length;
  const grupo = (nome, its) => its.length ? `<div class="lm-grupo"><h4>${esc(nome)} <span>${its.length}</span></h4><ul>${its.map((i) => `<li data-uid="${i.uid}"><span>${esc(i.nome)}</span><span class="m">${cm(i.w)} × ${cm(i.d)} × ${cm(i.h)}</span></li>`).join('')}</ul></div>` : '';
  const keep = $('#ferr').scrollTop;
  $('#resumo-corpo').innerHTML = `<div class="insp">
    <div class="grupo"><h3>Avisos ${avisosLi.length ? `· ${erros} conflito${erros === 1 ? '' : 's'}, ${avisos + bloq.length} atenção` : ''}</h3>
      <ul class="alertas">${avisosLi.length ? avisosLi.join('') : `<li class="ok">Nenhum conflito. Circulação de pelo menos ${cm(ultimaAnalise.circ?.passagem || 0.6)} cm até todos os cômodos.</li>`}</ul>
    </div>
    <div class="grupo"><h3>Lista de móveis · ${total}</h3>
      ${total ? plan.rooms.map((r) => grupo(r.nome, mapa.get(r.id))).join('') + grupo('Fora dos cômodos', fora) : '<p class="nota">Nenhum móvel ainda. Use a ferramenta Móveis.</p>'}
    </div>
    <div class="grupo"><h3>Exportar</h3>
      <div class="exp-grid">
        <button class="btn btn-sm" data-exp="png">Planta (PNG)</button>
        <button class="btn btn-sm" data-exp="svg">Planta (SVG)</button>
        <button class="btn btn-sm" data-exp="foto">Foto do 3D (JPG)</button>
        <button class="btn btn-sm" data-exp="csv">Lista (CSV)</button>
        <button class="btn btn-sm" data-exp="json">Projeto (JSON)</button>
        <button class="btn btn-sm btn-ghost" data-acao="medidas">Sobre as medidas</button>
      </div>
    </div>
    <div class="grupo"><h3>Áreas úteis</h3>
      <table class="resumo-areas"><tbody>${plan.rooms.map((r) => `<tr><td>${esc(r.nome)}</td><td>${fmtM2(r.area)} m²</td></tr>`).join('')}</tbody></table>
      <p class="nota">Área privativa ${fmtM2(plan.tip.areaPrivativa)} m², que inclui paredes.</p>
    </div>
  </div>`;
  $('#ferr').scrollTop = keep;
  atualizarBadge();
}
$('#resumo-corpo').addEventListener('click', async (ev) => {
  const li = ev.target.closest('li[data-uid]');
  if (li) { setTool('moveis'); select(li.dataset.uid); return; }
  const e = ev.target.closest('[data-exp]')?.dataset.exp;
  if (e === 'png') exportarPlantaPng(plan);
  if (e === 'svg') exportarPlantaSvg(plan);
  if (e === 'csv') exportarCsv(plan);
  if (e === 'json') baixar(`${slug(store.projeto.nome)}.json`, exportarJSON(), 'application/json');
  if (e === 'foto') { if (viewMode === '2d') { await setView('3d'); await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); } exportarFoto(await garantir3D()); }
  const a = ev.target.closest('[data-acao]'); if (a) acao(a.dataset.acao);
});
function atualizarBadge() {
  const al = ultimaAnalise.alertas, n = al.filter((a) => a.nivel !== 'info').length + (ultimaAnalise.circ?.bloqueios.length || 0);
  for (const b of [$('#rail-badge'), $('#top-badge')]) { b.hidden = !n; b.textContent = n; b.classList.toggle('erro', al.some((a) => a.nivel === 'erro')); }
}
$('#bb-info-top').addEventListener('click', () => { if (tool === 'resumo') { ferrAberto = !ferrAberto; atualizarLayout(); } else setTool('resumo'); if (mobile()) { ferrAberto = true; atualizarLayout(); } });

// ======================================================================== análise
let tAnalise = null;
function agendarAnalise(ms = 120) {
  clearTimeout(tAnalise);
  tAnalise = setTimeout(() => {
    if (!plan || !store.projeto) return;
    const itens = store.projeto.itens;
    ultimaAnalise = { alertas: analisar(plan, itens), circ: circulacao(plan, itens) };
    plan2d?.setAnalise(ultimaAnalise);
    const it = selected();
    if (it) atualizarInspItem(it);
    if (tool === 'resumo') renderResumo(); else atualizarBadge();
  }, ms);
}

// ======================================================================== reações ao estado
subscribe((kind) => {
  if (!plan || $('#editor').hidden) return;
  if (kind === 'itens') {
    plan2d.redrawItems();
    view3d?.syncItems(store.projeto.itens);
    const it = selected();
    if (it && inspUid === it.uid) atualizarInspItem(it); else renderInspetor();
    if (tool === 'luz') desenharLuz();
    agendarAnalise();
  }
  if (kind === 'acab') {
    plan2d.redrawAcab();
    view3d?.refreshAcab();
    view3d?.syncItems(store.projeto.itens);
    plan2d.redrawItems();
    desenharLuz();
  }
  if (kind === 'luz') { view3d?.refreshLuz(); desenharLuz(); }
  if (kind === 'sel') {
    plan2d.redrawItems();
    view3d?.syncSel();
    renderInspetor();
  }
  if (kind === 'history') atualizarHistorico();
  if (kind === 'status') atualizarStatus();
});
function atualizarHistorico() { $('#btn-undo').disabled = !store.past.length; $('#btn-redo').disabled = !store.future.length; }
function atualizarStatus() {
  const s = $('#status');
  s.classList.toggle('erro', store.status === 'erro');
  s.textContent = store.status === 'pendente' ? 'Salvando…' : store.status === 'erro' ? 'Sem espaço para salvar neste navegador' : 'Salvo neste navegador';
}
$('#btn-undo').addEventListener('click', () => { undo(); tocar('desfazer'); });
$('#btn-redo').addEventListener('click', () => { redo(); tocar('refazer'); });

// ======================================================================== teclado
window.addEventListener('keydown', (ev) => {
  if ($('#editor').hidden || $('#dlg').open) return;
  const tag = ev.target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  const mod = ev.ctrlKey || ev.metaKey;
  if (mod && ev.key.toLowerCase() === 'z') { ev.preventDefault(); if (ev.shiftKey) { redo(); tocar('refazer'); } else { undo(); tocar('desfazer'); } return; }
  if (mod && ev.key.toLowerCase() === 'y') { ev.preventDefault(); redo(); tocar('refazer'); return; }
  if (mod && ev.key.toLowerCase() === 'd') { ev.preventDefault(); duplicar(); return; }
  const passeio = view3d?.getMode() === 'passeio' && viewMode !== '2d';
  const it = selected();
  if (ev.key === 'Escape') { select(null); inspMobile = false; atualizarLayout(); return; }
  if (!it) return;
  if (ev.key === 'Delete' || ev.key === 'Backspace') { ev.preventDefault(); excluir(); return; }
  if (ev.key.toLowerCase() === 'r' && !mod) { girar(ev.shiftKey ? -90 : 90); return; }
  if (!passeio && ev.key.startsWith('Arrow')) {
    ev.preventDefault();
    const p = ev.shiftKey ? 0.10 : 0.01;
    const d = plan2d.screenDeltaToWorld(...{ ArrowLeft: [-p, 0], ArrowRight: [p, 0], ArrowUp: [0, -p], ArrowDown: [0, p] }[ev.key]);
    live(() => { it.x = Math.round((it.x + d[0]) * 1000) / 1000; it.y = Math.round((it.y + d[1]) * 1000) / 1000; ajustarTeto(it); });
    clearTimeout(window.__nudge); window.__nudge = setTimeout(commit, 400);
  }
});

// ======================================================================== menu e diálogos
$('#btn-menu').addEventListener('click', (ev) => {
  ev.stopPropagation();
  const m = $('#menu'); m.hidden = !m.hidden; $('#btn-menu').setAttribute('aria-expanded', String(!m.hidden));
});
document.addEventListener('click', (ev) => { if (!ev.target.closest('.menu-wrap')) { $('#menu').hidden = true; $('#btn-menu').setAttribute('aria-expanded', 'false'); } });
$('#menu').addEventListener('click', (ev) => { const b = ev.target.closest('[data-acao]'); if (b) { $('#menu').hidden = true; acao(b.dataset.acao); } });

function acao(a) {
  if (a === 'tour') abrirTour();
  if (a === 'exportar') {
    const json = exportarJSON();
    const nome = slug(store.projeto.nome);
    abrirDialogo(`<h2>Exportar projeto</h2>
      <p>Guarde este arquivo para abrir o projeto em outro navegador ou enviar para alguém. Se o download não funcionar, copie o texto e cole em “Importar projeto”.</p>
      <textarea id="exp-txt" readonly aria-label="Projeto em texto">${esc(json)}</textarea>
      <div class="acoes-row"><button class="btn" data-dlg-fechar>Fechar</button><button class="btn" id="exp-copiar">Copiar texto</button><button class="btn btn-pri" id="exp-baixar">Baixar ${esc(nome)}.json</button></div>`);
    $('#exp-copiar').addEventListener('click', () => {
      const ta = $('#exp-txt');
      navigator.clipboard?.writeText(json).then(() => toast('Projeto copiado.'), () => { ta.focus(); ta.select(); toast('Texto selecionado. Use Ctrl+C para copiar.'); }) ?? (ta.select(), toast('Texto selecionado. Use Ctrl+C para copiar.'));
    });
    $('#exp-baixar').addEventListener('click', () => baixar(`${nome}.json`, json, 'application/json'));
  }
  if (a === 'importar') {
    abrirDialogo(`<h2>Importar projeto</h2>
      <p>Escolha um arquivo .json exportado pelo simulador ou cole o texto abaixo. O projeto importado é aberto como uma cópia nova.</p>
      <input type="file" id="imp-file" accept=".json,application/json" class="campo" style="padding:8px">
      <textarea id="imp-txt" placeholder="Ou cole aqui o texto do projeto" aria-label="Texto do projeto"></textarea>
      <div class="acoes-row"><button class="btn" data-dlg-fechar>Cancelar</button><button class="btn btn-pri" id="imp-ok">Importar</button></div>`);
    $('#imp-ok').addEventListener('click', async () => {
      try {
        const f = $('#imp-file').files[0];
        const txt = f ? await f.text() : $('#imp-txt').value;
        if (!txt.trim()) { toast('Escolha um arquivo ou cole o texto do projeto.'); return; }
        importarJSON(txt); $('#dlg').close(); abrirEditor(); toast('Projeto importado.');
      } catch (e) { tocar('erro'); toast(e.message); }
    });
  }
  if (a === 'sugestao') confirmar('Recomeçar com a sugestão?', 'Os móveis atuais serão substituídos pelo layout sugerido. Você pode desfazer depois.', 'Recomeçar', () => { edit((p) => { p.itens = itensSugeridos(p.tipologia); ajustarItensTeto(p); }); select(null); });
  if (a === 'limpar') confirmar('Remover todos os móveis?', 'O apartamento ficará vazio. Você pode desfazer depois.', 'Remover', () => { edit((p) => { p.itens = []; }); select(null); tocar('excluir'); });
  if (a === 'original') confirmar('Restaurar os acabamentos originais?', 'Pisos, paredes, rodapés, forros e luzes voltam ao que a construtora entrega. Você pode desfazer depois.', 'Restaurar', () => { edit((p) => { p.acab = ACAB_VAZIO(); ajustarItensTeto(p); }, 'acab'); tocar('pintar'); });
  if (a === 'medidas') dialogoMedidas();
  if (a === 'atalhos') abrirDialogo(`<h2>Atalhos e controles</h2>
    <ul>
      <li><b>Planta:</b> arraste o fundo para mover a vista, role ou faça pinça para aproximar, toque duas vezes no fundo para enquadrar.</li>
      <li><b>Móvel selecionado:</b> arraste para mover (encaixa sozinho em paredes e móveis próximos; segure <kbd>Shift</kbd> para soltar o encaixe). Na planta, a alça redonda gira e os quadrados mudam a medida. No 3D, a bolinha branca no anel gira.</li>
      <li><kbd>R</kbd> gira 90°, <kbd>Shift</kbd>+<kbd>R</kbd> gira para o outro lado, setas movem 1 cm (<kbd>Shift</kbd> 10 cm).</li>
      <li><kbd>Ctrl</kbd>+<kbd>Z</kbd> desfaz, <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd> refaz, <kbd>Ctrl</kbd>+<kbd>D</kbd> duplica, <kbd>Delete</kbd> exclui, <kbd>Esc</kbd> cancela a seleção.</li>
      <li><b>Paredes, Piso e Teto:</b> escolha uma amostra e clique na superfície. “Uma parede” pinta só a parede clicada, “Cômodo” pinta o ambiente e “Todos” aplica a todos, menos aos banheiros.</li>
      <li><b>Luz:</b> clique no interruptor na parede (3D) ou no botão de lâmpada na planta. A luz de verdade aparece em “Noite”.</li>
      <li><b>Passeio 3D:</b> <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> ou setas para andar, arraste para olhar, <kbd>Shift</kbd> para andar mais rápido. No celular, use o joystick.</li>
    </ul><div class="acoes-row"><button class="btn btn-pri" data-dlg-fechar>Entendi</button></div>`);
}

function dialogoSobMedida() {
  abrirDialogo(`<h2>Móvel sob medida</h2>
    <p>Informe as medidas do seu móvel. Ele aparece como um bloco na planta e no 3D, com checagem de colisão e distâncias.</p>
    <form id="sm-form" class="grupo">
      <label class="med" for="sm-nome">Nome<span class="campo-num"><input id="sm-nome" value="Meu móvel" maxlength="40" style="font-family:var(--f-body)"></span></label>
      <div class="grid-med">
        ${campoNum('sm-w', 'Largura', 100, 'cm', 'min="5" max="600" required')}
        ${campoNum('sm-d', 'Profundidade', 50, 'cm', 'min="1" max="600" required')}
        ${campoNum('sm-h', 'Altura', 80, 'cm', 'min="1" max="270" required')}
        ${campoNum('sm-e', 'Altura do chão', 0, 'cm', 'min="0" max="260"')}
      </div>
      <div class="acoes-row"><button type="button" class="btn" data-dlg-fechar>Cancelar</button><button class="btn btn-pri" type="submit">Adicionar</button></div>
    </form>`);
  $('#sm-form').addEventListener('submit', (ev) => {
    ev.preventDefault();
    const n = (id) => Math.max(0, parseFloat($('#' + id).value.replace(',', '.')) || 0) / 100;
    $('#dlg').close();
    adicionar('caixa', null, false, { nome: $('#sm-nome').value.trim() || 'Meu móvel', w: Math.max(0.05, n('sm-w')), d: Math.max(0.01, n('sm-d')), h: Math.max(0.01, n('sm-h')), elev: n('sm-e') });
  });
}

function dialogoMedidas() {
  const t = plan.tip;
  const linhas = plan.rooms.map((r) => {
    const g = polyArea(r.poly), dif = g - r.area;
    return `<tr><td>${esc(r.nome)}</td><td class="n">${fmtM2(r.area)}</td><td class="n">${fmtM2(g)}</td><td class="n">${dif >= 0 ? '+' : ''}${fmtM2(dif)}</td></tr>`;
  }).join('');
  const somaD = plan.rooms.reduce((s, r) => s + r.area, 0), somaG = plan.rooms.reduce((s, r) => s + polyArea(r.poly), 0);
  const ab = Object.entries(TIPOS_ABERTURA).filter(([k]) => t.openings.some((o) => o.tipo === k))
    .map(([k, v]) => `<tr><td>${k}</td><td>${esc(v.nome)}</td><td class="n">${cm(v.largura)} × ${cm(v.altura)}${v.peitoril ? ` · peitoril ${cm(v.peitoril)}` : ''}</td><td><span class="tag est">estimado</span></td></tr>`).join('');
  const notaPonta = t.id === 'ponta'
    ? '<li>A legenda da planta Ponta indica 9,58 m² para a sala, mas as cotas (2,40 m de largura e paredes de 2,50 m e 2,70 m) resultam em cerca de 7,80 m². A diferença, 1,78 m², coincide com a área da circulação. O simulador segue as cotas. Os banheiros têm 1,95 × 1,10 m nas cotas (2,14 m²), contra 2,30 m² na legenda.</li><li>O Banheiro 2 foi lido como suíte, com porta para o Quarto 2. Confirme na vistoria.</li>'
    : '<li>Na planta Meio, as áreas calculadas pelas cotas fecham com a legenda com diferença máxima de 0,04 m² por cômodo.</li>';
  abrirDialogo(`<h2>Como as medidas foram obtidas</h2>
    <ul>
      <li><span class="tag doc">documentado</span> Cotas internas dos cômodos e áreas da planta de vendas da tipologia ${esc(t.nome)} (escala 1:75); pé-direito de 2,70 m, pia de 120 × 55 cm e acabamentos (porcelanato na área social e banheiros, laminado nos quartos, azulejo no box até o teto e meia altura nas demais paredes do banheiro) do memorial descritivo e do documento de dúvidas da construtora.</li>
      <li><span class="tag est">estimado</span> Espessura de parede de 15 cm (alvenaria estrutural com reboco), 10 cm em duas divisórias internas; largura e posição exata de portas e janelas; posição do tanque, bacia, lavatório e box.</li>
      <li><span class="tag est">simulação</span> Pisos, tintas, revestimentos, forros, sancas e luminárias do simulador são opções de visualização. Não fazem parte do memorial, e o rebaixo de forro precisa de projeto e autorização do condomínio e da construtora.</li>
      ${notaPonta}
      <li>Área privativa (${fmtM2(t.areaPrivativa)} m²) inclui paredes e não é a soma das áreas úteis (${fmtM2(somaD)} m² na legenda; ${fmtM2(somaG)} m² pelas cotas).</li>
    </ul>
    <div class="tabela-wrap"><table class="tabela"><thead><tr><th>Cômodo</th><th>Legenda m²</th><th>Cotas m²</th><th>Diferença</th></tr></thead><tbody>${linhas}</tbody></table></div>
    <div class="tabela-wrap"><table class="tabela"><thead><tr><th>Código</th><th>Abertura</th><th>Medida (cm)</th><th></th></tr></thead><tbody>${ab}</tbody></table></div>
    <p>O simulador serve para experimentar layouts. Antes de comprar ou encomendar móveis, confira as medidas no imóvel; a construtora recomenda medição no local para móveis planejados.</p>
    <div class="acoes-row"><button class="btn btn-pri" data-dlg-fechar>Fechar</button></div>`);
}

// ======================================================================== ferramentas de acabamento
iniciarFerramentas({
  plan: () => plan, plan2d: () => plan2d, v3: () => view3d, vista: () => viewMode,
  periodo: async (p) => { if (viewMode === '2d') await setView('3d'); trocarPeriodo(p); },
});

// ======================================================================== início
window.addEventListener('beforeunload', () => { if (store.projeto) salvarAgora(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && store.projeto) salvarAgora(); });
iniciarHome({ abrirEditor });
renderHome();
$('#home').hidden = false;
// atalho por âncora: #meio ou #ponta abre o último projeto daquela planta (ou cria um)
(() => {
  const h = location.hash.replace('#', '');
  if (h === 'meio' || h === 'ponta') {
    const p = JSON.parse(localStorage.getItem('pe.projetos.v1') || '[]').find((x) => x.tipologia === h);
    if (p && abrirProjeto(p.id)) abrirEditor(); else { criarProjeto(h, { sugestao: true }); abrirEditor(); }
  }
})();
// gancho de testes
window.__pe = {
  store, Som, get plan() { return plan; }, get view3d() { return view3d; }, get plan2d() { return plan2d; },
  setView, setTool, garantir3D, aplicar, analise: () => ultimaAnalise, adicionar, trocarPeriodo,
  luzDe: (r) => luzDe(store.projeto.acab, r),
};
