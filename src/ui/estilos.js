// Vitrine de estilos: a vista vai para a maquete e cada estilo aparece aplicado de verdade, ao vivo.
// Nada entra no histórico enquanto a pessoa compara; "Usar este estilo" vira uma edição só (desfazer volta tudo)
// e "Cancelar" devolve o apartamento como estava. Cada resultado é calculado uma vez e guardado.
import { TEMAS } from '../data/estilos.js';
import { estilizar, trabalhosDoTema, kindDoComodo, NOME_KIND } from '../presets.js';
import { store, previewIniciar, previewMostrar, previewConfirmar, previewCancelar, previewAtivo } from '../store.js';
import { $, esc, toast, frame } from './util.js';
import { tocar } from '../audio.js';

let host = null, ctx = null;
let estado = null; // { base (json), escopo: 'todo'|roomId, sel: temaId|null, opc, cache: Map, caminhando, periodo0, modo0 }
const OPC0 = { acab: true, moveis: true, aberturas: true, base: 'meus' };

const pal = (t) => [t.pal.w, t.pal.t, t.pal.m, t.pal.a, t.pal.g];
const chaveDe = (temaId) => `${temaId}|${estado.escopo}|${estado.opc.acab ? 1 : 0}${estado.opc.moveis ? 1 : 0}${estado.opc.aberturas ? 1 : 0}${estado.opc.base}`;

function calcular(tema) {
  const k = chaveDe(tema.id);
  if (estado.cache.has(k)) return estado.cache.get(k);
  const plan = ctx.getPlan();
  const proj = JSON.parse(estado.base);
  const roomId = estado.escopo === 'todo' ? null : estado.escopo;
  const tr = trabalhosDoTema(plan, tema, roomId, proj.itens);
  if (!tr.length) return null;
  const rel = estilizar(plan, proj, tr, {
    acab: estado.opc.acab, moveis: estado.opc.moveis, base: estado.opc.base,
    aberturas: !roomId && estado.opc.aberturas ? tema.aberturas : null,
  });
  const r = { json: JSON.stringify({ itens: proj.itens, acab: proj.acab, fix: proj.fix }), rel };
  estado.cache.set(k, r);
  return r;
}

function resumo(rel) {
  if (!rel) return '';
  const p = [];
  if (rel.adicionados) p.push(`${rel.adicionados} ${rel.adicionados === 1 ? 'peça nova' : 'peças novas'}`);
  if (rel.trocados) p.push(`${rel.trocados} ${rel.trocados === 1 ? 'móvel ajustado' : 'móveis ajustados'}`);
  const fora = [...new Set(rel.descartes.filter((d) => !/modelo maior/.test(d.motivo)).map((d) => d.tipo))];
  let s = p.length ? p.join(', ') : 'Só acabamentos e luz';
  if (fora.length) s += `. Ficou de fora por falta de espaço: ${fora.slice(0, 4).map(nomeTipo).join(', ')}${fora.length > 4 ? '…' : ''}`;
  return s + '.';
}
const nomeTipo = (t) => (ctx.catalogo?.[t]?.nome || t).toLowerCase();

async function mostrar(temaId) {
  estado.sel = temaId;
  render();
  if (!temaId) { previewMostrar(estado.base); ctx.setPeriodo?.(estado.periodo0); return; }
  const tema = TEMAS.find((t) => t.id === temaId);
  const info = host.querySelector('.vit-info');
  if (!estado.cache.has(chaveDe(temaId))) { info.classList.add('calc'); await frame(); await frame(); }
  const r = calcular(tema);
  info.classList.remove('calc');
  if (!r) { toast('Esse estilo não tem versão para este cômodo.'); return; }
  previewMostrar(r.json);
  if (estado.escopo === 'todo') ctx.setPeriodo?.(tema.periodo);
  render();
}

function render() {
  if (!host) return;
  const plan = ctx.getPlan();
  const rooms = plan.rooms.filter((r) => r.id !== 'circ');
  const tema = TEMAS.find((t) => t.id === estado.sel);
  const kind = estado.escopo === 'todo' ? null : kindDoComodo(rooms.find((r) => r.id === estado.escopo));
  const spec = tema && kind ? (Array.isArray(tema[kind]) ? tema[kind][0] : tema[kind]) : null;
  const r = tema ? estado.cache.get(chaveDe(tema.id)) : null;
  host.querySelector('.vit-escopo').innerHTML = `<option value="todo"${estado.escopo === 'todo' ? ' selected' : ''}>Apartamento inteiro</option>${rooms.map((q) => `<option value="${q.id}"${estado.escopo === q.id ? ' selected' : ''}>${esc(q.nome)}</option>`).join('')}`;
  host.querySelector('.vit-info').innerHTML = tema
    ? `<b>${esc(spec?.nome || tema.nome)}</b><p>${esc(spec?.desc || tema.desc)}</p><p class="vit-res">${esc(resumo(r?.rel))}</p>`
    : `<b>Como está agora</b><p>${estado.escopo === 'todo' ? 'Seu apartamento, sem estilo aplicado.' : `${esc(NOME_KIND[kind] || '')}: como está agora.`} Escolha um estilo abaixo para ver aplicado na maquete.</p>`;
  host.querySelector('.vit-lista').innerHTML = `<button class="vit-card ${!estado.sel ? 'on' : ''}" data-tema=""><span class="vit-pal vit-orig"></span><span class="vit-nome">Como está</span></button>`
    + TEMAS.map((t) => `<button class="vit-card ${estado.sel === t.id ? 'on' : ''}" data-tema="${t.id}" title="${esc(t.frase)}"><span class="vit-pal">${pal(t).map((c) => `<i style="background:${c}"></i>`).join('')}</span><span class="vit-nome">${esc(t.curto)}</span></button>`).join('');
  host.querySelector('[data-a=usar]').disabled = !estado.sel;
  const opc = host.querySelector('.vit-opc');
  opc.querySelectorAll('[data-o]').forEach((c) => { c.checked = !!estado.opc[c.dataset.o]; });
  opc.querySelectorAll('[data-base]').forEach((b) => b.setAttribute('aria-checked', String(estado.opc.base === b.dataset.base)));
  opc.querySelector('[data-o=aberturas]').closest('label').hidden = estado.escopo !== 'todo';
  host.dataset.caminhando = estado.caminhando ? '1' : '0';
  const on = host.querySelector('.vit-card.on'); on?.scrollIntoView?.({ block: 'nearest', inline: 'center', behavior: 'smooth' });
}

export function iniciarEstilos(c) {
  ctx = c;
  host = document.createElement('div');
  host.className = 'vitrine'; host.id = 'vitrine'; host.hidden = true;
  host.innerHTML = `
    <div class="vit-topo">
      <div class="vit-tit"><h2>Estilos</h2><select class="campo campo-sm vit-escopo" aria-label="Onde aplicar"></select>
        <button class="chip vit-bopc" data-a="opc" aria-haspopup="true" aria-expanded="false">Opções</button></div>
      <div class="vit-acoes"><button class="btn" data-a="cancelar">Cancelar</button><button class="btn btn-pri" data-a="usar">Usar este estilo</button></div>
      <div class="pop vit-opc" hidden>
        <label class="toggle"><input type="checkbox" data-o="acab"><span>Paredes, piso, forro e luz</span></label>
        <label class="toggle"><input type="checkbox" data-o="moveis"><span>Cores dos móveis e decoração</span></label>
        <label class="toggle"><input type="checkbox" data-o="aberturas"><span>Portas, esquadrias e maçanetas</span></label>
        <div class="est-base" role="radiogroup" aria-label="Móveis de partida">
          <button role="radio" data-base="meus">Manter meus móveis</button><button role="radio" data-base="sugestao">Partir do layout sugerido</button>
        </div>
        <p class="nota">A decoração só entra onde cabe sem encostar em nada, sem tampar janela ou porta e sem fechar passagem.</p>
      </div>
    </div>
    <div class="vit-info" aria-live="polite"></div>
    <div class="vit-baixo">
      <button class="icon-btn vit-seta" data-a="ant" aria-label="Estilo anterior"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg></button>
      <div class="vit-lista" role="listbox" aria-label="Estilos"></div>
      <button class="icon-btn vit-seta" data-a="prox" aria-label="Próximo estilo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg></button>
      <button class="btn vit-andar" data-a="andar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 4a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM10 21l2-6 3 3v3M8 12l3-3 3 2 3 1M12 15l-2-4" /></svg><span>Caminhar dentro</span></button>
    </div>
    <div class="vit-volta"><span>Vendo o estilo por dentro</span><button class="btn" data-a="voltar">Voltar à vitrine</button><button class="btn btn-pri" data-a="usar">Usar este estilo</button></div>`;
  $('#editor').appendChild(host);
  host.addEventListener('click', async (ev) => {
    const card = ev.target.closest('[data-tema]');
    if (card) { tocar('clique'); mostrar(card.dataset.tema || null); return; }
    const b = ev.target.closest('[data-base]');
    if (b) { estado.opc.base = b.dataset.base; trocouOpcoes(); return; }
    const a = ev.target.closest('[data-a]')?.dataset.a; if (!a) return;
    if (a === 'cancelar') fechar(false);
    if (a === 'usar') fechar(true);
    if (a === 'opc') { const p = host.querySelector('.vit-opc'); p.hidden = !p.hidden; ev.target.closest('[data-a]').setAttribute('aria-expanded', String(!p.hidden)); }
    if (a === 'prox' || a === 'ant') passo(a === 'prox' ? 1 : -1);
    if (a === 'andar') { estado.caminhando = true; render(); ctx.caminhar?.(estado.escopo === 'todo' ? null : estado.escopo); }
    if (a === 'voltar') { estado.caminhando = false; render(); ctx.maquete?.(estado.escopo === 'todo' ? null : estado.escopo); }
  });
  host.addEventListener('change', (ev) => {
    if (ev.target.classList.contains('vit-escopo')) {
      estado.escopo = ev.target.value; tocar('clique');
      ctx.maquete?.(estado.escopo === 'todo' ? null : estado.escopo);
      mostrar(estado.sel);
      return;
    }
    const o = ev.target.dataset?.o; if (o) { estado.opc[o] = ev.target.checked; trocouOpcoes(); }
  });
  document.addEventListener('keydown', (ev) => {
    if (!estaAberto() || ev.target.closest?.('input, select, textarea')) return;
    if (ev.key === 'Escape') { ev.preventDefault(); ev.stopPropagation(); if (estado.caminhando) host.querySelector('[data-a=voltar]').click(); else fechar(false); }
    if (!estado.caminhando && (ev.key === 'ArrowRight' || ev.key === 'ArrowLeft')) { ev.preventDefault(); ev.stopPropagation(); passo(ev.key === 'ArrowRight' ? 1 : -1); }
  }, true);
}
function trocouOpcoes() { estado.cache.clear(); mostrar(estado.sel); }
function passo(d) {
  const ids = [null, ...TEMAS.map((t) => t.id)];
  const i = ids.indexOf(estado.sel);
  mostrar(ids[(i + d + ids.length) % ids.length]);
}

export function abrir({ room = null, tema = null } = {}) {
  if (!host || estaAberto()) return;
  ctx.aoAbrir?.();
  previewIniciar();
  estado = { base: JSON.stringify({ itens: store.projeto.itens, acab: store.projeto.acab, fix: store.projeto.fix }), escopo: room || 'todo', sel: null, opc: { ...OPC0 }, cache: new Map(), caminhando: false, periodo0: ctx.getPeriodo?.() };
  host.hidden = false;
  document.getElementById('editor').dataset.vitrine = '1';
  ctx.maquete?.(room);
  render();
  tocar('abrir');
  if (tema) mostrar(tema);
}

export function fechar(usar) {
  if (!estaAberto()) return;
  const tema = TEMAS.find((t) => t.id === estado.sel);
  host.hidden = true; host.querySelector('.vit-opc').hidden = true;
  document.getElementById('editor').dataset.vitrine = '0';
  if (usar && tema && previewAtivo()) {
    previewConfirmar();
    const r = estado.cache.get(chaveDe(tema.id));
    toast(`${tema.nome}: ${resumo(r?.rel).replace(/\.$/, '')}.`, 'Desfazer', () => { ctx.desfazer?.(); tocar('clique'); });
    tocar('encaixe');
  } else {
    previewCancelar();
    ctx.setPeriodo?.(estado.periodo0);
    tocar('fechar');
  }
  ctx.aoFechar?.({ usar: !!(usar && tema), caminhando: estado.caminhando });
  estado = null;
}
export const estaAberto = () => !!host && !host.hidden;
export const fecharPrev = () => {};

// Aplicação direta (sem vitrine): usada pelos testes e por atalhos
export function aplicarTema(tema, roomId = null, o = OPC0) {
  const plan = ctx.getPlan();
  previewIniciar();
  const proj = JSON.parse(JSON.stringify({ itens: store.projeto.itens, acab: store.projeto.acab, fix: store.projeto.fix }));
  const rel = estilizar(plan, proj, trabalhosDoTema(plan, tema, roomId, proj.itens), {
    acab: o.acab, moveis: o.moveis, base: o.base, aberturas: !roomId && o.aberturas ? tema.aberturas : null,
  });
  previewMostrar(proj);
  previewConfirmar();
  return rel;
}
