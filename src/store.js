// Estado, histórico (desfazer/refazer) e persistência local.
import { catalogoPorId } from './data/catalogo.js';
import { tipologiaPorId } from './data/tipologias.js';
import { ACAB_VAZIO } from './data/acabamentos.js';

const KEY_INDEX = 'pe.projetos.v1';
const KEY_PROJ = (id) => `pe.projeto.v1.${id}`;
const FORMATO = 'park-espanha/projeto@3'; // @2 (sem peças fixas editáveis) continua sendo aceito na importação

function lsGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } }
function lsDel(k) { try { localStorage.removeItem(k); } catch { /* sem armazenamento */ } }

export const uid = () => Math.random().toString(36).slice(2, 9);

export function novoItem(catId, props = {}) {
  const c = catalogoPorId[catId];
  return {
    uid: uid(), tipo: catId, nome: c.nome,
    x: 0, y: 0, w: c.w, d: c.d, h: c.h, elev: c.elev || 0, rot: 0,
    cor: c.cor || '#c9a77c', cor2: c.cor2 || null,
    ...props,
  };
}

// Layouts sugeridos (ponto de partida editável)
const SUGESTOES = {
  meio: [
    ['sofa3', { x: 3.69, y: 1.20, rot: 90 }],
    ['rack', { x: 2.15, y: 0.70, w: 1.20, rot: 270 }],
    ['tv55', { x: 1.98, y: 0.70, rot: 270 }],
    ['tapete', { x: 2.80, y: 1.20, w: 1.60, d: 0.90, rot: 90 }],
    ['planta', { x: 2.25, y: 1.65 }],
    ['geladeira', { x: 0.36, y: 3.53, rot: 270 }],
    ['fogao', { x: 0.30, y: 1.67, rot: 270 }],
    ['jantar4', { x: 2.15, y: 3.30, rot: 90 }],
    ['lavar', { x: 0.85, y: 0.325, rot: 0 }],
    ['camasolteiro', { x: 4.74, y: 0.39, rot: 0, nome: 'Cama de solteiro' }],
    ['grcorrer', { x: 6.20, y: 0.45, w: 1.80, rot: 90 }],
    ['camacasal', { x: 10.35, y: 1.14, rot: 0 }],
    ['criado', { x: 9.42, y: 0.40 }],
    ['criado', { x: 11.28, y: 0.40 }],
    ['grcorrer', { x: 10.55, y: 2.95, rot: 180 }],
  ],
  ponta: [
    ['sofa3', { x: 4.11, y: 5.40, rot: 270 }],
    ['rack', { x: 5.85, y: 5.20, w: 1.50, rot: 90 }],
    ['tv55', { x: 6.02, y: 5.20, rot: 90 }],
    ['tapete', { x: 5.05, y: 5.40, w: 1.80, d: 1.00, rot: 90 }],
    ['planta', { x: 3.95, y: 6.75 }],
    ['fogao', { x: 5.75, y: 1.90, w: 0.50, rot: 90 }],
    ['geladeira', { x: 5.69, y: 3.73, rot: 90 }],
    ['jantar4', { x: 4.00, y: 2.65, w: 0.90, rot: 90 }],
    ['lavar', { x: 4.60, y: 0.625, rot: 0 }],
    ['camacasal', { x: 0.69, y: 0.94, rot: 0 }],
    ['grcorrer', { x: 2.20, y: 0.85, w: 1.60, rot: 90 }],
    ['camacasal', { x: 2.56, y: 5.74, rot: 90 }],
    ['criado', { x: 3.30, y: 6.67, rot: 90 }],
    ['grcorrer', { x: 2.75, y: 4.15, w: 1.50, rot: 0 }],
  ],
};
// PCD: mesma distribuição da Ponta, com o quarto 2 mais livre para manobra
// (passagens de 90 cm e portas mais largas: mesa de 2 lugares e guarda-roupas menores, sem avisos na análise)
SUGESTOES.pcd = SUGESTOES.ponta.filter(([t]) => t !== 'criado' && t !== 'planta')
  .map(([t, o]) => (t === 'grcorrer' ? [t, o.y < 2 ? { ...o, w: 1.40, y: 0.75 } : { ...o, x: 2.90, w: 1.20 }]
    : t === 'jantar4' ? ['jantar2', { x: 4.00, y: 3.05, rot: 0 }] : [t, o]));

export function itensSugeridos(tipId) {
  return (SUGESTOES[tipId] || []).map(([cat, p]) => novoItem(cat, p));
}

// ---------------------------------------------------------------- store
const listeners = new Set();
export const store = {
  projeto: null,
  sel: null,
  salvoEm: null,
  status: 'salvo', // 'salvo' | 'pendente' | 'erro'
  past: [],
  future: [],
  novos: new Set(), // itens recém-adicionados (animação de montagem no 3D)
};

// Garante a estrutura de acabamentos e migra o formato antigo (cor de parede por cômodo)
export function normalizarAcab(p) {
  const base = ACAB_VAZIO();
  const a = { ...base, ...(p.acab || {}) };
  for (const k of Object.keys(base)) if (!a[k] || typeof a[k] !== 'object') a[k] = base[k];
  for (const [room, cor] of Object.entries(p.paredes || {})) {
    if (typeof cor === 'string' && !a.parede[room]) a.parede[room] = { t: 'tinta', cor };
  }
  p.paredes = {};
  p.acab = a;
  if (!p.fix || typeof p.fix !== 'object') p.fix = {};
  return a;
}

export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit(kind) { for (const fn of listeners) fn(kind); }
export const notificar = emit;

const snap = () => JSON.stringify({ itens: store.projeto.itens, acab: store.projeto.acab, fix: store.projeto.fix });

let baseline = null; // instantâneo antes de uma edição em andamento

export function begin() { if (!baseline) baseline = snap(); }
export function commit() {
  if (!baseline) return;
  const now = snap();
  if (now !== baseline) {
    store.past.push(baseline);
    if (store.past.length > 120) store.past.shift();
    store.future = [];
    agendarSalvar();
  }
  baseline = null;
  emit('history');
}
// Edição atômica: aplica fn e registra no histórico
export function edit(fn, kind = 'itens') {
  begin(); fn(store.projeto); emit(kind); commit();
}
// Alteração contínua (arrasto): sem histórico até commit()
export function live(fn, kind = 'itens') { begin(); fn(store.projeto); emit(kind); }

function restore(s) {
  const o = JSON.parse(s);
  store.projeto.itens = o.itens;
  store.projeto.acab = o.acab || { ...ACAB_VAZIO() };
  store.projeto.fix = o.fix || {};
  normalizarAcab(store.projeto);
  if (store.sel && !store.projeto.itens.some((i) => i.uid === store.sel)) store.sel = null;
  emit('itens'); emit('acab'); emit('fixos'); emit('sel'); agendarSalvar(); emit('history');
}
export function undo() { if (!store.past.length) return; store.future.push(snap()); restore(store.past.pop()); }
// Pré-visualização (vitrine de estilos): troca o projeto inteiro sem entrar no histórico até confirmar.
// previewIniciar guarda o estado atual; previewMostrar põe outro estado na tela; previewConfirmar vira uma
// edição só (desfazer volta ao estado de antes da vitrine); previewCancelar devolve o estado guardado.
export function previewIniciar() { begin(); return baseline; }
export function previewMostrar(estado) {
  const o = typeof estado === 'string' ? JSON.parse(estado) : JSON.parse(JSON.stringify(estado));
  store.projeto.itens = o.itens; store.projeto.acab = o.acab; store.projeto.fix = o.fix || {};
  normalizarAcab(store.projeto);
  if (store.sel && !store.projeto.itens.some((i) => i.uid === store.sel)) store.sel = null;
  emit('itens'); emit('acab'); emit('fixos'); emit('sel');
}
export function previewConfirmar() { commit(); }
export function previewCancelar() { if (!baseline) return; const b = baseline; baseline = null; previewMostrar(b); emit('history'); }
export const previewAtivo = () => !!baseline;

export function redo() { if (!store.future.length) return; store.past.push(snap()); restore(store.future.pop()); }

// Interruptores e temperatura de luz: persistem, mas não entram no histórico de desfazer
export function setLuz(roomId, patch) {
  const a = store.projeto.acab;
  a.luz[roomId] = { ...(a.luz[roomId] || {}), ...patch };
  agendarSalvar(); emit('luz');
}
export function setLuzTodos(roomIds, patch) {
  const a = store.projeto.acab;
  for (const id of roomIds) a.luz[id] = { ...(a.luz[id] || {}), ...patch };
  agendarSalvar(); emit('luz');
}
// Peças fixas (pia, tanque, louças, box) e aberturas (portas, janelas): opções por peça em projeto.fix.
// Chaves especiais: _ab (acabamento das aberturas) e _oc[id] (peça removida da vista).
export function setFixo(id, patch) { edit((p) => { p.fix[id] = { ...(p.fix[id] || {}), ...patch }; }, 'fixos'); }
export function restaurarFixo(id) { edit((p) => { delete p.fix[id]; }, 'fixos'); }
export function setAberturas(patch) { edit((p) => { p.fix._ab = { ...(p.fix._ab || {}), ...patch }; }, 'fixos'); }

// Simulação de uso (não persiste): portas abertas, cadeiras puxadas, pessoas sentadas. Vale para todos os móveis.
export const uso = { aberto: false, cadeiras: false, pessoas: false };
// A última ação vale. Ligar ou desligar a simulação geral aplica a todos os móveis (apaga os ajustes daquela chave);
// mudar um móvel depois disso cria um ajuste próprio só dele (it.aberto/cadeiras/pessoas = true ou false),
// que dura até a próxima mudança da simulação geral naquela mesma chave.
export const USO_CHAVES = ['aberto', 'cadeiras', 'pessoas'];
export const temAjuste = (it, k) => it && it[k] !== undefined && it[k] !== null;
export const usoEfetivo = (it, k) => (temAjuste(it, k) ? !!it[k] : !!uso[k]);
export function setUso(patch) {
  const mudaram = Object.keys(patch).filter((k) => !!uso[k] !== !!patch[k]);
  Object.assign(uso, patch);
  let mexeu = false;
  if (store.projeto) for (const it of store.projeto.itens) for (const k of mudaram) if (temAjuste(it, k)) { delete it[k]; mexeu = true; }
  if (mexeu) agendarSalvar();
  emit('uso');
}
// Alterna (ou define) um estado de um móvel em relação ao que ele mostra agora
export function alternarUsoItem(it, k, valor) {
  const novo = valor === undefined ? !usoEfetivo(it, k) : !!valor;
  edit(() => { if (novo === !!uso[k]) delete it[k]; else it[k] = novo; });
  return novo;
}
export function seguirGeral(it) { edit(() => { for (const k of USO_CHAVES) delete it[k]; }); }
export function seguirGeralTodos() { edit((p) => { for (const it of p.itens) for (const k of USO_CHAVES) delete it[k]; }); }
export const contarAjustes = () => (store.projeto?.itens || []).filter((it) => USO_CHAVES.some((k) => temAjuste(it, k))).length;
export const estadoDe = (it) => ({ portas: usoEfetivo(it, 'aberto') ? 1 : 0, cad: usoEfetivo(it, 'cadeiras') ? 1 : 0, pes: usoEfetivo(it, 'pessoas') ? 1 : 0 });

export function marcarNovo(id) { store.novos.add(id); }

export function select(id) { if (store.sel !== id) { store.sel = id; emit('sel'); } }
export const selected = () => store.projeto?.itens.find((i) => i.uid === store.sel) || null;

// ---------------------------------------------------------------- persistência
export function listarProjetos() {
  try { return JSON.parse(lsGet(KEY_INDEX) || '[]'); } catch { return []; }
}
function salvarIndice(list) { lsSet(KEY_INDEX, JSON.stringify(list)); }

let tSave = null;
function agendarSalvar() {
  store.status = 'pendente'; emit('status');
  clearTimeout(tSave);
  tSave = setTimeout(salvarAgora, 500);
}
export function salvarAgora() {
  const p = store.projeto; if (!p) return;
  p.atualizado = Date.now();
  const ok = lsSet(KEY_PROJ(p.id), JSON.stringify(p));
  const list = listarProjetos().filter((x) => x.id !== p.id);
  list.unshift({ id: p.id, nome: p.nome, tipologia: p.tipologia, atualizado: p.atualizado, n: p.itens.length });
  salvarIndice(list);
  store.status = ok ? 'salvo' : 'erro';
  store.salvoEm = Date.now();
  emit('status');
}

export function abrirProjeto(id) {
  const raw = lsGet(KEY_PROJ(id));
  if (!raw) return false;
  try { setProjeto(JSON.parse(raw)); return true; } catch { return false; }
}

export function criarProjeto(tipId, { sugestao = true, nome } = {}) {
  const t = tipologiaPorId(tipId);
  const n = listarProjetos().filter((p) => p.tipologia === tipId).length;
  const p = {
    formato: FORMATO, id: uid(), tipologia: tipId,
    nome: nome || `Meu apartamento ${t.nome}${n ? ' ' + (n + 1) : ''}`,
    itens: sugestao ? itensSugeridos(tipId) : [], paredes: {}, acab: ACAB_VAZIO(), fix: {}, usoV: 2,
    criado: Date.now(), atualizado: Date.now(),
  };
  setProjeto(p); salvarAgora();
  return p;
}

function setProjeto(p) {
  normalizarAcab(p);
  // até a v3, false nos estados de uso queria dizer "seguir o geral"; agora false é ajuste próprio
  if (!p.usoV) { for (const it of p.itens || []) for (const k of USO_CHAVES) if (!it[k]) delete it[k]; p.usoV = 2; }
  store.projeto = p; store.sel = null; store.past = []; store.future = []; baseline = null;
  store.status = 'salvo';
  emit('projeto');
}

export function renomear(nome) { store.projeto.nome = nome; agendarSalvar(); emit('status'); }

export function excluirProjeto(id) {
  lsDel(KEY_PROJ(id));
  salvarIndice(listarProjetos().filter((x) => x.id !== id));
}

export function exportarJSON() {
  const p = store.projeto;
  return JSON.stringify({ ...p, formato: FORMATO }, null, 1);
}

export function importarJSON(texto) {
  let o;
  try { o = JSON.parse(texto); } catch { throw new Error('O arquivo não é um projeto válido (JSON ilegível).'); }
  if (!o || !Array.isArray(o.itens) || !tipologiaPorId(o.tipologia)) {
    throw new Error('O arquivo não parece ser um projeto do simulador Park Espanha.');
  }
  const itens = o.itens.filter((i) => catalogoPorId[i.tipo]).map((i) => ({
    ...novoItem(i.tipo), ...i,
    x: +i.x || 0, y: +i.y || 0, w: Math.max(0.05, +i.w || 0.5), d: Math.max(0.01, +i.d || 0.5),
    h: Math.max(0.005, +i.h || 0.5), elev: Math.max(0, +i.elev || 0), rot: +i.rot || 0,
  }));
  const p = {
    formato: FORMATO, id: uid(), tipologia: o.tipologia,
    nome: (o.nome || 'Projeto importado') + '', itens, paredes: o.paredes || {}, acab: o.acab || ACAB_VAZIO(), fix: o.fix && typeof o.fix === 'object' ? o.fix : {},
    criado: Date.now(), atualizado: Date.now(),
  };
  setProjeto(p); salvarAgora();
  return p;
}

export const ultimoProjeto = () => listarProjetos()[0] || null;

// Leitura sem abrir: usada pelos cartões da tela inicial (miniatura, exportar, duplicar)
export function lerProjeto(id) {
  const raw = lsGet(KEY_PROJ(id));
  if (!raw) return null;
  try { const p = JSON.parse(raw); normalizarAcab(p); return p; } catch { return null; }
}
export function exportarPorId(id) {
  const p = lerProjeto(id); if (!p) return null;
  return { nome: p.nome, json: JSON.stringify({ ...p, formato: FORMATO }, null, 1) };
}
export function duplicarProjeto(id) {
  const o = lerProjeto(id); if (!o) return null;
  const novo = { ...o, id: uid(), nome: `${o.nome} (cópia)`, criado: Date.now(), atualizado: Date.now() };
  lsSet(KEY_PROJ(novo.id), JSON.stringify(novo));
  const list = listarProjetos();
  list.unshift({ id: novo.id, nome: novo.nome, tipologia: novo.tipologia, atualizado: novo.atualizado, n: novo.itens.length });
  salvarIndice(list);
  return novo;
}
export function renomearPorId(id, nome) {
  const o = lerProjeto(id); if (!o) return;
  o.nome = nome; lsSet(KEY_PROJ(id), JSON.stringify(o));
  salvarIndice(listarProjetos().map((x) => (x.id === id ? { ...x, nome } : x)));
}
