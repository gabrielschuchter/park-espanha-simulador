// Galeria de estilos: descobrir, ver e aplicar decoração (apartamento inteiro ou um cômodo).
// A folha abre por cima da vista, sem mexer nos painéis de edição. Aplicar é uma edição só (desfazer volta tudo).
import { TEMAS } from '../data/estilos.js';
import { pisoPorId, tetoPorId } from '../data/acabamentos.js';
import { estilizar, trabalhosDoTema, kindDoComodo, NOME_KIND } from '../presets.js';
import { edit, notificar, undo, store } from '../store.js';
import { $, esc, toast } from './util.js';
import { tocar } from '../audio.js';

let host = null, ctx = null, aba = 'todo', roomSel = null, aberto = null, opc = { acab: true, moveis: true, aberturas: true, base: 'meus' };
let prevBar = null;

// ---------------------------------------------------------------- cenas em SVG (miniaturas)
const NOITE = new Set(['noite']);
export function cenaSvg(tema, kind = 'sala', { w = 176, h = 112 } = {}) {
  const p = tema.pal, noite = NOITE.has(tema.periodo), id = `${tema.id}-${kind}-${Math.random().toString(36).slice(2, 6)}`;
  const parede = p.w, piso = kind === 'banho' ? p.t : p.m;
  const escuro = (c) => c; // cores já vêm calibradas por tema
  let m = '';
  const luz = tema[kind === 'cozinha' ? 'cozinha' : kind === 'servico' ? 'servico' : kind]?.acab?.luz;
  const quente = (luz?.temp || 'neutra') === 'quente';
  if (kind === 'sala') {
    m += `<rect x="10" y="72" width="156" height="6" fill="rgba(0,0,0,.12)"/>`;
    m += `<ellipse cx="88" cy="88" rx="58" ry="9" fill="${p.a}" opacity=".35"/>`;
    m += `<rect x="108" y="44" width="46" height="20" rx="2" fill="${p.g}"/><rect x="104" y="64" width="54" height="9" rx="2" fill="${p.m}"/>`;
    m += `<rect x="22" y="60" width="64" height="22" rx="7" fill="${p.t}"/><rect x="16" y="64" width="12" height="20" rx="5" fill="${p.t}" opacity=".85"/><rect x="80" y="64" width="12" height="20" rx="5" fill="${p.t}" opacity=".85"/><rect x="36" y="63" width="14" height="12" rx="3" fill="${p.a}"/>`;
    m += `<rect x="46" y="86" width="30" height="7" rx="2" fill="${p.m}"/>`;
    m += `<circle cx="14" cy="60" r="7" fill="#6f8a5a"/><circle cx="19" cy="55" r="6" fill="#7d9a68"/><rect x="11" y="66" width="8" height="9" rx="2" fill="${p.a}"/>`;
    m += `<rect x="30" y="26" width="26" height="18" fill="${p.a}" opacity=".9"/><rect x="33" y="29" width="20" height="12" fill="${p.w}" opacity=".75"/>`;
    m += `<circle cx="138" cy="14" r="${noite || quente ? 9 : 6}" fill="${quente || noite ? '#ffd9a0' : '#fff'}" opacity=".95"/>`;
  } else if (kind === 'cozinha') {
    m += `<rect x="8" y="28" width="76" height="22" rx="2" fill="${p.m}"/><rect x="8" y="58" width="150" height="30" rx="2" fill="${p.g}" opacity=".9"/><rect x="8" y="58" width="150" height="5" fill="${p.t}"/>`;
    m += `<rect x="110" y="26" width="38" height="58" rx="3" fill="#cfd3d4"/><rect x="127" y="30" width="2" height="22" fill="#9aa0a6"/>`;
    m += `<rect x="30" y="70" width="64" height="18" rx="1" fill="${p.m}"/><circle cx="46" cy="94" r="5" fill="${p.a}"/><circle cx="76" cy="94" r="5" fill="${p.a}"/>`;
    m += `<line x1="60" y1="8" x2="60" y2="20" stroke="${p.g}" stroke-width="1.3"/><path d="M52 24a8 8 0 0116 0z" fill="${p.a}"/>`;
  } else if (kind === 'quarto') {
    m += `<rect x="28" y="22" width="120" height="30" fill="${p.a}" opacity=".85"/><rect x="38" y="28" width="22" height="16" fill="${p.w}" opacity=".7"/><rect x="116" y="28" width="22" height="16" fill="${p.w}" opacity=".7"/>`;
    m += `<rect x="40" y="58" width="96" height="30" rx="5" fill="${p.t}"/><rect x="40" y="52" width="96" height="10" rx="4" fill="${p.m}"/><rect x="48" y="60" width="26" height="9" rx="3" fill="#fff" opacity=".7"/><rect x="102" y="60" width="26" height="9" rx="3" fill="#fff" opacity=".7"/>`;
    m += `<rect x="16" y="68" width="18" height="18" rx="2" fill="${p.m}"/><rect x="142" y="68" width="18" height="18" rx="2" fill="${p.m}"/><path d="M20 64a5 5 0 0110 0z" fill="${quente || noite ? '#ffd9a0' : '#f2f2f0'}"/><path d="M146 64a5 5 0 0110 0z" fill="${quente || noite ? '#ffd9a0' : '#f2f2f0'}"/>`;
    m += `<ellipse cx="88" cy="96" rx="52" ry="6" fill="${p.g}" opacity=".35"/>`;
  } else if (kind === 'banho') {
    for (let i = 0; i < 9; i++) m += `<line x1="${8 + i * 18}" y1="8" x2="${8 + i * 18}" y2="72" stroke="rgba(0,0,0,.08)"/>`;
    for (let j = 0; j < 5; j++) m += `<line x1="0" y1="${16 + j * 13}" x2="176" y2="${16 + j * 13}" stroke="rgba(0,0,0,.08)"/>`;
    m += `<rect x="18" y="30" width="34" height="26" rx="3" fill="#fff" opacity=".8"/><rect x="16" y="58" width="44" height="22" rx="2" fill="${p.m}"/><ellipse cx="38" cy="58" rx="14" ry="3" fill="#f6f5f2"/>`;
    m += `<rect x="104" y="24" width="52" height="64" rx="2" fill="#cfe3ea" opacity=".45" stroke="${p.g}" stroke-width="1.4"/><circle cx="118" cy="38" r="3" fill="${p.a}"/>`;
    m += `<rect x="72" y="62" width="20" height="18" rx="6" fill="#f6f5f2"/><rect x="74" y="50" width="16" height="14" rx="2" fill="#f6f5f2"/>`;
  } else {
    m += `<rect x="12" y="36" width="42" height="52" rx="2" fill="${p.m}"/><rect x="62" y="56" width="40" height="32" rx="2" fill="#e9e9e9"/><rect x="112" y="60" width="44" height="28" rx="2" fill="#f6f5f2"/>`;
    m += `<rect x="62" y="22" width="40" height="22" rx="2" fill="${p.m}" opacity=".8"/><circle cx="82" cy="72" r="9" fill="#cfd3d4"/><circle cx="14" cy="22" r="6" fill="#6f8a5a"/>`;
  }
  const brilho = noite ? `<rect width="${w}" height="${h}" fill="#10151b" opacity=".38"/><radialGradient id="g${id}" cx="50%" cy="20%" r="60%"><stop offset="0" stop-color="#ffcf8a" stop-opacity=".55"/><stop offset="1" stop-color="#ffcf8a" stop-opacity="0"/></radialGradient><rect width="${w}" height="${h}" fill="url(#g${id})"/>`
    : quente ? `<radialGradient id="g${id}" cx="50%" cy="15%" r="70%"><stop offset="0" stop-color="#ffd9a0" stop-opacity=".35"/><stop offset="1" stop-color="#ffd9a0" stop-opacity="0"/></radialGradient><rect width="${w}" height="${h}" fill="url(#g${id})"/>` : '';
  return `<svg viewBox="0 0 176 112" width="${w}" height="${h}" role="img" aria-label="${esc(tema.nome)}" preserveAspectRatio="xMidYMid slice"><rect width="176" height="112" fill="${escuro(parede)}"/><rect y="80" width="176" height="32" fill="${piso}"/><rect y="80" width="176" height="2" fill="rgba(0,0,0,.18)"/>${m}${brilho}</svg>`;
}

// ---------------------------------------------------------------- aplicar
function trabalhos(tema, roomId) { return trabalhosDoTema(ctx.getPlan(), tema, roomId); }

export function aplicarTema(tema, roomId = null, o = opc) {
  const plan = ctx.getPlan();
  const tr = trabalhos(tema, roomId);
  if (!tr.length) { toast('Esse estilo não tem versão para este cômodo.'); return null; }
  let rel = null;
  edit((p) => {
    rel = estilizar(plan, p, tr, {
      acab: o.acab, moveis: o.moveis, base: o.base,
      aberturas: !roomId && o.aberturas ? tema.aberturas : null,
    });
    if (!roomId && o.aberturas && tema.aberturas?.vidro) p.fix._ab = { ...(p.fix._ab || {}), vidro: tema.aberturas.vidro };
  }, 'itens');
  notificar('acab'); notificar('fixos'); notificar('luz');
  return rel;
}

function resumoRel(rel) {
  const p = [];
  if (rel.adicionados) p.push(`${rel.adicionados} ${rel.adicionados === 1 ? 'peça de decoração' : 'peças de decoração'}`);
  if (rel.trocados) p.push(`${rel.trocados} ${rel.trocados === 1 ? 'móvel ajustado' : 'móveis ajustados'}`);
  return p.length ? p.join(' e ') : 'Acabamentos e luz';
}

function aplicarEMostrar(tema, roomId, { ver = false } = {}) {
  const rel = aplicarTema(tema, roomId);
  if (!rel) return;
  fechar();
  tocar('encaixe');
  const alvo = roomId ? tema[kindDoComodo(ctx.getPlan().rooms.find((r) => r.id === roomId))]?.nome || tema.nome : tema.nome;
  if (ver) { ctx.verNoPasseio?.(roomId); mostrarPrev(alvo, rel); }
  else toast(`${alvo}: ${resumoRel(rel)}.`, 'Desfazer', () => { undo(); tocar('clique'); });
}

function mostrarPrev(nome, rel) {
  prevBar?.remove();
  prevBar = document.createElement('div');
  prevBar.className = 'est-prev';
  prevBar.setAttribute('role', 'group');
  prevBar.innerHTML = `<div><b>${esc(nome)}</b><span>${esc(resumoRel(rel))}. Caminhe pela casa e veja se gostou.</span></div><button class="btn" data-a="des">Desfazer</button><button class="btn" data-a="outro">Outros estilos</button><button class="btn btn-pri" data-a="ok">Manter</button>`;
  $('#editor').appendChild(prevBar);
  prevBar.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a;
    if (a === 'des') { undo(); tocar('clique'); }
    prevBar.remove(); prevBar = null;
    if (a === 'outro') abrir();
  });
}
export function fecharPrev() { prevBar?.remove(); prevBar = null; }

// ---------------------------------------------------------------- folha
function descreverMudancas(tema, roomId) {
  const tr = trabalhos(tema, roomId);
  const linhas = [];
  const vistos = new Set();
  for (const t of tr) {
    const a = t.spec.acab || {};
    const nome = t.room.nome;
    const partes = [];
    if (a.parede) partes.push(a.parede.nome ? `parede ${a.parede.nome.toLowerCase()}` : 'parede com textura');
    if ((a.destaque || []).length) partes.push('parede de destaque');
    if (a.piso && pisoPorId[a.piso]) partes.push(pisoPorId[a.piso].nome.toLowerCase());
    if (a.teto) partes.push((tetoPorId[a.teto.tipo]?.nome || 'forro').toLowerCase());
    if (a.luz) partes.push(`luz ${a.luz.temp}`);
    const chave = partes.join('|');
    if (t.room.id === 'circ') continue;
    if (!roomId && vistos.has(t.kind + chave)) continue;
    vistos.add(t.kind + chave);
    linhas.push(`<li><b>${esc(roomId ? nome : NOME_KIND[t.kind] || nome)}</b><span>${esc(partes.join(' · '))}</span></li>`);
  }
  return linhas.join('');
}

function cardTema(tema, kind, roomId) {
  const spec = roomId ? tema[kind] : null;
  const nome = roomId ? (Array.isArray(spec) ? spec[0].nome : spec?.nome) : tema.nome;
  const desc = roomId ? (Array.isArray(spec) ? spec[0].desc : spec?.desc) : tema.frase;
  return `<button class="est-cartao" data-tema="${tema.id}"><span class="est-cena">${cenaSvg(tema, roomId ? kind : 'sala')}</span><span class="est-nome">${esc(nome || tema.nome)}</span><span class="est-desc">${esc(desc || '')}</span>${roomId ? '' : `<span class="est-tags">${tema.tags.map((t) => `<i>${esc(t)}</i>`).join('')}</span>`}</button>`;
}

function render() {
  const plan = ctx.getPlan();
  const rooms = plan.rooms.filter((r) => r.id !== 'circ');
  if (!roomSel || !rooms.some((r) => r.id === roomSel)) roomSel = rooms[0]?.id;
  const sala = rooms.find((r) => r.id === roomSel);
  const kind = sala ? kindDoComodo(sala) : 'sala';
  let corpo = '';
  if (aberto) {
    const tema = TEMAS.find((t) => t.id === aberto);
    const roomId = aba === 'comodo' ? roomSel : null;
    const spec = roomId ? tema[kind] : null;
    const nome = roomId ? (Array.isArray(spec) ? spec[0].nome : spec.nome) : tema.nome;
    const desc = roomId ? (Array.isArray(spec) ? spec[0].desc : spec.desc) : tema.desc;
    corpo = `<div class="est-det">
      <button class="est-volta" data-a="volta">‹ Todos os estilos</button>
      <div class="est-det-cena">${cenaSvg(tema, roomId ? kind : 'sala', { w: 352, h: 224 })}</div>
      <div class="est-det-txt">
        <h3>${esc(nome)}</h3><p>${esc(desc)}</p>
        <h4>O que muda${roomId ? ` em ${esc(sala.nome)}` : ''}</h4>
        <ul class="est-muda">${descreverMudancas(tema, roomId)}</ul>
        <h4>Como aplicar</h4>
        <label class="toggle"><input type="checkbox" data-o="acab" ${opc.acab ? 'checked' : ''}><span>Paredes, piso, forro e luz</span></label>
        <label class="toggle"><input type="checkbox" data-o="moveis" ${opc.moveis ? 'checked' : ''}><span>Cores dos móveis e peças de decoração</span></label>
        ${roomId ? '' : `<label class="toggle"><input type="checkbox" data-o="aberturas" ${opc.aberturas ? 'checked' : ''}><span>Portas, esquadrias e maçanetas</span></label>`}
        <div class="est-base" role="radiogroup" aria-label="Móveis de partida">
          <button role="radio" data-base="meus" aria-checked="${opc.base === 'meus'}">Manter meus móveis</button>
          <button role="radio" data-base="sugestao" aria-checked="${opc.base === 'sugestao'}">Partir do layout sugerido</button>
        </div>
        <p class="nota">A decoração entra só onde cabe, sem travar porta nem fechar passagem. Tudo pode ser desfeito de uma vez.</p>
        <div class="est-acoes"><button class="btn" data-a="aplicar">Aplicar</button><button class="btn btn-pri" data-a="ver">Aplicar e caminhar</button></div>
      </div></div>`;
  } else {
    corpo = aba === 'todo'
      ? `<p class="est-intro">Cada estilo muda o apartamento inteiro: paredes, pisos, forros, luz, móveis e decoração. Escolha um para ver o que muda.</p><div class="est-grid">${TEMAS.map((t) => cardTema(t, 'sala', null)).join('')}</div>`
      : `<div class="chips est-rooms" role="tablist" aria-label="Cômodo">${rooms.map((r) => `<button class="chip-s ${r.id === roomSel ? 'on' : ''}" data-room="${r.id}">${esc(r.nome)}</button>`).join('')}</div><p class="est-intro">${esc(NOME_KIND[kind])}: ${TEMAS.length} versões, cada uma com acabamentos, móveis e luz próprios.</p><div class="est-grid">${TEMAS.filter((t) => t[kind]).map((t) => cardTema(t, kind, roomSel)).join('')}</div>`;
  }
  host.querySelector('.est-corpo').innerHTML = corpo;
  host.querySelectorAll('[data-aba]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.aba === aba)));
}

export function iniciarEstilos(c) {
  ctx = c;
  host = document.createElement('div');
  host.className = 'estilos'; host.id = 'estilos'; host.hidden = true;
  host.setAttribute('role', 'dialog'); host.setAttribute('aria-modal', 'true'); host.setAttribute('aria-label', 'Estilos de decoração');
  host.innerHTML = `<div class="est-folha"><header class="est-head"><h2>Estilos</h2><div class="seg" role="tablist" aria-label="Escopo"><button role="tab" data-aba="todo">Apartamento</button><button role="tab" data-aba="comodo">Por cômodo</button></div><button class="icon-btn" data-a="fechar" aria-label="Fechar" title="Fechar (Esc)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button></header><div class="est-corpo"></div></div>`;
  $('#editor').appendChild(host);
  host.addEventListener('click', (ev) => {
    if (ev.target === host) return fechar();
    const t = ev.target;
    const ab = t.closest('[data-aba]'); if (ab) { aba = ab.dataset.aba; aberto = null; tocar('clique'); render(); return; }
    const rm = t.closest('[data-room]'); if (rm) { roomSel = rm.dataset.room; tocar('clique'); render(); return; }
    const ca = t.closest('[data-tema]'); if (ca) { aberto = ca.dataset.tema; tocar('abrir'); render(); host.querySelector('.est-corpo').scrollTop = 0; return; }
    const bs = t.closest('[data-base]'); if (bs) { opc.base = bs.dataset.base; render(); return; }
    const a = t.closest('[data-a]'); if (!a) return;
    const tema = TEMAS.find((x) => x.id === aberto);
    if (a.dataset.a === 'fechar') return fechar();
    if (a.dataset.a === 'volta') { aberto = null; tocar('fechar'); render(); return; }
    if (a.dataset.a === 'aplicar' && tema) aplicarEMostrar(tema, aba === 'comodo' ? roomSel : null);
    if (a.dataset.a === 'ver' && tema) aplicarEMostrar(tema, aba === 'comodo' ? roomSel : null, { ver: true });
  });
  host.addEventListener('change', (ev) => { const o = ev.target.dataset?.o; if (o) opc[o] = ev.target.checked; });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape' && !host.hidden) { ev.preventDefault(); fechar(); } }, true);
}

export function abrir({ room = null } = {}) {
  if (!host) return;
  fecharPrev();
  if (room) { aba = 'comodo'; roomSel = room; aberto = null; }
  host.hidden = false;
  render();
  ctx.aoAbrir?.();
  tocar('abrir');
}
export function fechar() { if (!host || host.hidden) return; host.hidden = true; aberto = null; ctx.aoFechar?.(); }
export const estaAberto = () => !!host && !host.hidden;
void store;
