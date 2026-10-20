// Painel "Peças": pia, tanque, louças, box, portas e janelas. Tudo pode ser trocado; o que muda de lugar exige obra.
import { abrirCoresMarca } from './cores.js';
import { store, setFixo, restaurarFixo, setAberturas } from '../store.js';
import { FIX_SCHEMA, AB_SCHEMA, opcoesDe, abDe } from '../data/fixos.js';
import { pointInPoly } from '../geom.js';
import { $, $$, esc } from './util.js';
import { tocar } from '../audio.js';

let hooks = { plan: () => null, focar: () => {} };
let selId = null, rolarAb = false, rolarSel = false;
// chamada pelo 3D (clique na peça ou mira no Passeio)
export function selecionarPeca(id) { if (id === '_ab') rolarAb = true; else { selId = id; rolarAb = false; rolarSel = true; } }

export function iniciarPecas(h) {
  hooks = { ...hooks, ...h };
  $('#fixos-corpo').addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.mais) {
      const [alvo, k] = b.dataset.mais.split('|');
      abrirCoresMarca({ titulo: 'Cor do armário', atual: (store.projeto.fix?.[alvo] || {})[k], onPick: (o) => { setFixo(alvo, { [k]: o.cor }); tocar('pintar'); } });
      return;
    }
    if (b.dataset.fix) { selId = b.dataset.fix; tocar('clique'); renderPecas(); return; }
    if (b.dataset.ver) { hooks.focar(b.dataset.ver); return; }
    if (b.dataset.rest) { restaurarFixo(b.dataset.rest); tocar('pintar'); return; }
    if (b.dataset.k) {
      const v = b.dataset.v; const val = v === 'true' ? true : v === 'false' ? false : /^-?\d+$/.test(v) ? Number(v) : v;
      if (b.dataset.alvo === 'ab') setAberturas({ [b.dataset.k]: val }); else setFixo(b.dataset.alvo, { [b.dataset.k]: val });
      tocar('pintar');
    }
  });
  $('#fixos-corpo').addEventListener('change', (ev) => {
    const t = ev.target; if (t.type !== 'checkbox') return;
    setFixo(t.dataset.alvo, { [t.dataset.k]: t.checked }); tocar('clique');
  });
}

const comodoDe = (f) => hooks.plan()?.rooms.find((r) => pointInPoly(f.x, f.y, r.poly))?.nome || '';

function campo(s, valor, alvo) {
  if (s.t === 'sw') {
    return `<label class="toggle-linha"><span>${esc(s.nome)}</span><input type="checkbox" data-alvo="${alvo}" data-k="${s.k}" ${valor ? 'checked' : ''}></label>`;
  }
  if (s.t === 'cor') {
    return `<div class="opc-grupo"><h4>${esc(s.nome)}</h4><div class="cores">${s.op.map(([hex, nome]) => `<button class="cor${hex === valor ? ' on' : ''}" style="background:${hex}" data-alvo="${alvo}" data-k="${s.k}" data-v="${hex}" aria-label="${esc(nome)}" title="${esc(nome)}"></button>`).join('')}${s.mais && valor && !s.op.some(([h]) => h === valor) ? `<button class="cor on" style="background:${valor}" data-alvo="${alvo}" data-k="${s.k}" data-v="${valor}" aria-label="Cor atual" title="Cor atual"></button>` : ''}</div>${s.mais ? `<button type="button" class="btn btn-sm" data-mais="${alvo}|${s.k}">Cores de tinta de marca…</button>` : ''}</div>`;
  }
  return `<div class="opc-grupo"><h4>${esc(s.nome)}</h4><div class="opc-chips">${s.op.map(([v, nome]) => `<button class="${String(v) === String(valor) ? 'on' : ''}" data-alvo="${alvo}" data-k="${s.k}" data-v="${v}">${esc(nome)}</button>`).join('')}</div></div>`;
}

export function renderPecas() {
  const plan = hooks.plan(); const box = $('#fixos-corpo');
  if (!plan || !store.projeto) { box.innerHTML = ''; return; }
  const fix = store.projeto.fix || {};
  if (!selId || !plan.fixos.some((f) => f.id === selId)) selId = plan.fixos[0]?.id;
  const lista = plan.fixos.map((f) => {
    const ed = fix[f.id] && Object.keys(fix[f.id]).length;
    return `<button class="fix-item${f.id === selId ? ' on' : ''}" data-fix="${f.id}"><span>${esc(f.nome)}${comodoDe(f) ? ` <small>${esc(comodoDe(f))}</small>` : ''}</span>${ed ? '<small>alterado</small>' : ''}</button>`;
  }).join('');
  const f = plan.fixos.find((x) => x.id === selId);
  let det = '';
  if (f) {
    const o = opcoesDe(fix, f), sch = FIX_SCHEMA[f.tipo] || [];
    det = `<div class="sel-fixo"><b>${esc(f.nome)}</b>${comodoDe(f) ? ` · ${esc(comodoDe(f))}` : ''}</div>
      ${sch.filter((s) => !s.se || s.se(o)).map((s) => campo(s, o[s.k], f.id)).join('')}
      <label class="toggle-linha"><span>Ocultar esta peça (para testar sem ela)</span><input type="checkbox" data-alvo="${f.id}" data-k="oculto" ${o.oculto ? 'checked' : ''}></label>
      <div class="acoes-row"><button class="btn btn-sm" data-ver="${f.id}">Ver no 3D</button><button class="btn btn-sm btn-ghost" data-rest="${f.id}">Restaurar original</button></div>
      <p class="nota">${f.src === 'doc' ? 'A medida desta peça consta nos documentos da construtora.' : 'A posição desta peça é estimada a partir da planta; confirme no imóvel.'} Trocar de lugar um ponto hidráulico exige obra e autorização.</p>`;
  }
  const ab = abDe(fix);
  const detAb = `<h3 class="sub">Portas e janelas</h3>${AB_SCHEMA.map((s) => campo(s, ab[s.k], 'ab')).join('')}<p class="nota">Largura e posição das aberturas seguem a planta e não mudam aqui.</p>`;
  box.innerHTML = `<div class="fix-lista">${lista}</div><div class="grupo">${det}</div><div class="grupo" id="fix-ab">${detAb}</div>`;
  if (rolarAb) { rolarAb = false; requestAnimationFrame(() => $('#fix-ab')?.scrollIntoView({ block: 'start', behavior: 'smooth' })); }
  else if (rolarSel) { rolarSel = false; requestAnimationFrame(() => $('.sel-fixo', box)?.scrollIntoView({ block: 'start', behavior: 'smooth' })); }
}
