// Ferramentas de acabamento: paredes, piso, teto e luz. Cada uma funciona como um pincel:
// escolha uma amostra no painel e clique no cômodo (planta) ou na superfície (3D).
import {
  PISOS, TINTAS, REVESTIMENTOS, TEXTURAS_PAREDE, RODAPES, TETOS, REBAIXOS, COR_TETO, LUZ_TEMPS,
  pisoPorId, texParedePorId, tetoPorId, paredeOriginal, pisoDe, paredeDe, tetoDe, luzDe, rodapeDe, tempPorId,
} from '../data/acabamentos.js';
import { catalogoPorId } from '../data/catalogo.js';
import { miniaturaCanvas } from '../tex/draw.js';
import { tetoY } from '../tetoGeo.js';
import { pointInPoly } from '../geom.js';
import { store, edit, setLuz, setLuzTodos, undo } from '../store.js';
import { $, $$, esc, cm, fmtM2, toast } from './util.js';
import { tocar } from '../audio.js';

const thumbs = new Map();
function thumb(def) {
  if (!thumbs.has(def.id)) thumbs.set(def.id, miniaturaCanvas(def, 64).toDataURL());
  return thumbs.get(def.id);
}
const F = {
  tool: 'moveis',
  esc: { paredes: 'comodo', piso: 'comodo', teto: 'comodo' },
  ptab: 'tinta',
  brush: {
    paredes: { kind: 'tinta', cor: TINTAS[2][0], nome: TINTAS[2][1] },
    piso: { id: 'lam-claro' },
    teto: { tipo: 'gesso', drop: 0.10, cor: COR_TETO[0][0] },
  },
};
let A = null; // ponte com main.js

const ICONE_LAMP = '<path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z" />';

// ------------------------------------------------------------ amostras
const swTex = (def, ativo, extra = '') => `<button class="sw${ativo ? ' on' : ''}" ${extra} title="${esc(def.nome)}" aria-label="${esc(def.nome)}"><img src="${thumb(def)}" alt="" width="52" height="52"><span>${esc(def.nome)}</span></button>`;
const swCor = (cor, nome, ativo, extra = '') => `<button class="sw sw-cor${ativo ? ' on' : ''}" ${extra} title="${esc(nome)}" aria-label="${esc(nome)}"><i style="background:${cor}"></i><span>${esc(nome)}</span></button>`;
const swOrig = (ativo, extra = '') => `<button class="sw sw-orig${ativo ? ' on' : ''}" ${extra} title="Como a construtora entrega" aria-label="Original da construtora"><i></i><span>Original</span></button>`;

function desenharParedes() {
  const b = F.brush.paredes, el = $('#sw-paredes');
  $$('#tab-paredes button').forEach((x) => x.setAttribute('aria-selected', String(x.dataset.pt === F.ptab)));
  const orig = swOrig(b.kind === 'original', 'data-orig="1"');
  if (F.ptab === 'tinta') {
    const cur = b.kind === 'tinta' ? b.cor : null;
    el.innerHTML = `<div class="sw-grid">${orig}${TINTAS.map(([c, n]) => swCor(c, n, cur === c, `data-cor="${c}" data-nome="${esc(n)}"`)).join('')}</div>
      <label class="sw-pers"><span>Cor personalizada</span><input type="color" id="cor-pers" value="${cur || '#e9e1d3'}" aria-label="Cor personalizada"></label>`;
  } else if (F.ptab === 'rev') {
    el.innerHTML = `<div class="sw-grid">${orig}${REVESTIMENTOS.map((d) => swTex(d, b.kind === 'tex' && b.id === d.id, `data-tex="${d.id}"`)).join('')}</div><p class="nota">Revestimentos para paredes molhadas ou de destaque.</p>`;
  } else if (F.ptab === 'tex') {
    const gr = {};
    TEXTURAS_PAREDE.forEach((d) => (gr[d.grupo] ||= []).push(d));
    el.innerHTML = `<div class="sw-grid">${orig}</div>` + Object.entries(gr).map(([g, l]) => `<h3 class="sub">${g}</h3><div class="sw-grid">${l.map((d) => swTex(d, b.kind === 'tex' && b.id === d.id, `data-tex="${d.id}"`)).join('')}</div>`).join('');
  } else {
    el.innerHTML = `<div class="rod-lista">${RODAPES.map((r) => `<button class="rod${b.kind === 'rodape' && b.id === r.id ? ' on' : ''}" data-rod="${r.id}"><i style="background:${r.cor};height:${Math.max(2, r.alt * 60)}px"></i><span>${esc(r.nome)}</span></button>`).join('')}</div><p class="nota">O rodapé acompanha o cômodo inteiro.</p>`;
  }
  const dica = $('#dica-paredes');
  if (dica) {
    const em3d = A.vista() !== '2d';
    dica.textContent = F.ptab === 'rodape' ? 'Escolha o rodapé e clique no cômodo.' : em3d ? 'Escolha um acabamento e clique na parede no 3D. Na planta, o clique pinta o cômodo inteiro.' : 'Escolha um acabamento e clique no cômodo na planta. Para pintar uma parede só, use a vista 3D.';
  }
  $$('#esc-paredes button').forEach((x) => x.setAttribute('aria-checked', String(x.dataset.esc === F.esc.paredes)));
}

function desenharPiso() {
  const b = F.brush.piso, gr = {};
  PISOS.forEach((d) => (gr[d.grupo] ||= []).push(d));
  $('#sw-piso').innerHTML = `<div class="sw-grid">${swOrig(!b.id, 'data-orig="1"')}</div>` +
    Object.entries(gr).map(([g, l]) => `<h3 class="sub">${g}</h3><div class="sw-grid">${l.map((d) => swTex(d, b.id === d.id, `data-piso="${d.id}"`)).join('')}</div>`).join('');
  $$('#esc-piso button').forEach((x) => x.setAttribute('aria-checked', String(x.dataset.esc === F.esc.piso)));
}

const SEC = {
  laje: '<path d="M4 8h56" /><path d="M4 8v26M60 8v26" class="p" />',
  gesso: '<path d="M4 8h56" class="p" /><path d="M4 16h56" /><path d="M4 8v26M60 8v26" class="p" />',
  sanca: '<path d="M4 8h56" class="p" /><path d="M4 8h12v8h32V8h12" /><path d="M16 12h32" class="led" /><path d="M4 8v26M60 8v26" class="p" />',
  moldura: '<path d="M4 8h56" class="p" /><path d="M4 16h12v-8h32v8h12" /><path d="M4 8v26M60 8v26" class="p" />',
};
function desenharTeto() {
  const b = F.brush.teto;
  $('#teto-cards').innerHTML = TETOS.map((t) => `<button class="teto-card${b.tipo === t.id ? ' on' : ''}" data-tt="${t.id}"><svg viewBox="0 0 64 36" aria-hidden="true">${SEC[t.id]}</svg><b>${esc(t.nome)}</b><span>${esc(t.desc)}</span></button>`).join('');
  $('#teto-drops').innerHTML = REBAIXOS.map((d) => `<button class="${Math.abs(b.drop - d) < 0.001 ? 'on' : ''}" data-drop="${d}" ${b.tipo === 'laje' ? 'disabled' : ''}>${cm(d)} cm</button>`).join('');
  $('#teto-cores').innerHTML = COR_TETO.map(([c, n]) => `<button class="cor${b.cor === c ? ' on' : ''}" style="background:${c}" data-tcor="${c}" aria-label="${n}" title="${n}"></button>`).join('');
  const H = A.plan()?.tip.peDireito || 2.7;
  const livre = b.tipo === 'laje' ? H : H - b.drop;
  const nota = b.tipo === 'laje' ? `Pé-direito de ${String(H).replace('.', ',')} m, como na entrega.`
    : b.tipo === 'sanca' ? `Centro a ${String(livre.toFixed(2)).replace('.', ',')} m do piso e faixa de luz junto às paredes, na altura da laje.`
      : b.tipo === 'moldura' ? `Faixa junto às paredes a ${String(livre.toFixed(2)).replace('.', ',')} m do piso; o centro fica na altura da laje.`
        : `Altura livre sob o forro: ${String(livre.toFixed(2)).replace('.', ',')} m.`;
  $('#teto-nota').textContent = nota + (livre < 2.4 ? ' Atenção: abaixo de 2,40 m o ambiente fica baixo para uso residencial.' : '');
  $$('#esc-teto button').forEach((x) => x.setAttribute('aria-checked', String(x.dataset.esc === F.esc.teto)));
}

// ------------------------------------------------------------ luz
export function desenharLuz() {
  const plan = A.plan(); if (!plan || !store.projeto) return;
  const a = store.projeto.acab;
  const contagem = {};
  for (const it of store.projeto.itens) {
    const c = catalogoPorId[it.tipo]; if (!c?.luz) continue;
    const r = plan.rooms.find((q) => pointInPoly(it.x, it.y, q.poly)); if (r) contagem[r.id] = (contagem[r.id] || 0) + 1;
  }
  $('#luz-lista').innerHTML = plan.rooms.filter((r) => !(r.id === 'circ' && plan.tip.id === 'ponta')).map((r) => {
    const l = luzDe(a, r), n = contagem[r.id] || 0;
    return `<div class="luz-row${l.on ? ' on' : ''}" data-room="${r.id}">
      <div class="l1"><button class="lamp-btn${l.on ? ' on' : ''}" data-lt aria-pressed="${l.on}" aria-label="${l.on ? 'Apagar' : 'Acender'} ${esc(r.nome)}"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONE_LAMP}</svg></button><span class="nome">${esc(r.nome)}</span><span class="m">${n ? `${n} ${n === 1 ? 'luminária' : 'luminárias'}` : 'ponto de luz'}</span></div>
      <div class="l2"><input type="range" data-int min="20" max="100" step="5" value="${Math.round(l.int * 100)}" aria-label="Intensidade, ${esc(r.nome)}" ${l.on ? '' : 'disabled'}>
        <div class="temps" role="radiogroup" aria-label="Cor da luz">${LUZ_TEMPS.map((t) => `<button role="radio" aria-checked="${l.temp === t.id}" data-temp="${t.id}" title="${t.nome} (${t.k})" style="--c:${t.cor}"></button>`).join('')}</div></div>
    </div>`;
  }).join('');
  const estado = {};
  for (const r of plan.rooms) estado[r.id] = luzDe(a, r).on;
  A.plan2d()?.setLuzEstado(estado);
}

// ------------------------------------------------------------ aplicar
function alvos(roomId, escopo) {
  const plan = A.plan();
  if (escopo !== 'todos') return plan.rooms.filter((r) => r.id === roomId);
  return plan.rooms.filter((r) => !r.banho || r.id === roomId);
}
export function ajustarItensTeto(proj) {
  const plan = A.plan();
  for (const it of proj.itens) {
    const c = catalogoPorId[it.tipo];
    if (c?.teto) it.elev = Math.round((tetoY(plan, proj.acab, it.x, it.y) - it.h) * 1000) / 1000;
  }
}

export function aplicar(tipo, roomId, edge, origem3d = false) {
  const plan = A.plan();
  const room = plan.rooms.find((r) => r.id === roomId); if (!room) return;
  const esc_ = F.esc[{ parede: 'paredes' }[tipo] || tipo];
  const lista = alvos(roomId, esc_);
  let frase = '';
  const b = F.brush[{ parede: 'paredes' }[tipo] || tipo];
  edit((p) => {
    const a = p.acab;
    if (tipo === 'piso') {
      for (const r of lista) { if (b.id) a.piso[r.id] = b.id; else delete a.piso[r.id]; }
      frase = b.id ? `${esc_ === 'todos' ? 'Todos os cômodos' : room.nome}: piso ${pisoPorId[b.id].nome.toLowerCase()}.` : `${room.nome}: piso original.`;
    } else if (tipo === 'teto') {
      for (const r of lista) {
        if (b.tipo === 'original') delete a.teto[r.id]; else a.teto[r.id] = { tipo: b.tipo, drop: b.drop, cor: b.cor };
      }
      ajustarItensTeto(p);
      frase = `${esc_ === 'todos' ? 'Todos os cômodos' : room.nome}: ${tetoPorId[b.tipo]?.nome.toLowerCase() || 'forro original'}.`;
    } else {
      if (b.kind === 'rodape') {
        for (const r of lista) a.rodape[r.id] = b.id;
        frase = `${esc_ === 'todos' ? 'Todos os cômodos' : room.nome}: ${RODAPES.find((x) => x.id === b.id).nome.toLowerCase()}.`;
      } else if (b.kind === 'original') {
        if (esc_ === 'unico' && edge != null) delete a.destaque[`${roomId}:${edge}`];
        else for (const r of lista) { delete a.parede[r.id]; for (const k of Object.keys(a.destaque)) if (k.startsWith(r.id + ':')) delete a.destaque[k]; }
        frase = `${room.nome}: parede original.`;
      } else {
        const fin = b.kind === 'tex' ? { t: 'tex', id: b.id } : { t: 'tinta', cor: b.cor };
        const nome = b.kind === 'tex' ? texParedePorId[b.id].nome : b.nome || b.cor;
        const comMeia = (r) => (b.kind === 'tinta' && r.banho ? { ...fin, meia: paredeOriginal(r).meia } : fin);
        if (esc_ === 'unico' && edge != null) { a.destaque[`${roomId}:${edge}`] = comMeia(room); frase = `${room.nome}: uma parede em ${nome.toLowerCase()}.`; }
        else {
          for (const r of lista) { a.parede[r.id] = comMeia(r); for (const k of Object.keys(a.destaque)) if (k.startsWith(r.id + ':')) delete a.destaque[k]; }
          frase = `${esc_ === 'todos' ? 'Todos os cômodos' : room.nome}: parede em ${nome.toLowerCase()}.`;
        }
      }
    }
  }, 'acab');
  tocar(tipo === 'piso' ? (b.id && /lam|vinil|parque/.test(b.id) ? 'pisoMadeira' : 'piso') : tipo === 'teto' ? 'forro' : 'pintar');
  if (origem3d) A.v3()?.pulsar({ tipo, room: roomId, edge });
  else A.plan2d()?.realcarComodo(roomId);
  toast(frase, 'Desfazer', undo);
}

function alternarLuz(roomId) {
  const plan = A.plan(), r = plan.rooms.find((q) => q.id === roomId); if (!r) return;
  const l = luzDe(store.projeto.acab, r);
  setLuz(roomId, { on: !l.on });
  tocar(l.on ? 'luzOff' : 'luzOn');
}
export const alternarLuzComodo = alternarLuz;

// ------------------------------------------------------------ ligação
export function iniciarFerramentas(ponte) {
  A = ponte;
  $('#esc-paredes').addEventListener('click', (ev) => { const b = ev.target.closest('[data-esc]'); if (!b) return; F.esc.paredes = b.dataset.esc; A.v3()?.setEscopo(b.dataset.esc); tocar('clique'); desenharParedes(); });
  $('#esc-piso').addEventListener('click', (ev) => { const b = ev.target.closest('[data-esc]'); if (!b) return; F.esc.piso = b.dataset.esc; A.v3()?.setEscopo(b.dataset.esc); tocar('clique'); desenharPiso(); });
  $('#esc-teto').addEventListener('click', (ev) => { const b = ev.target.closest('[data-esc]'); if (!b) return; F.esc.teto = b.dataset.esc; A.v3()?.setEscopo(b.dataset.esc); tocar('clique'); desenharTeto(); });
  $('#tab-paredes').addEventListener('click', (ev) => { const b = ev.target.closest('[data-pt]'); if (!b) return; F.ptab = b.dataset.pt; tocar('clique'); desenharParedes(); });
  $('#sw-paredes').addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    if (b.dataset.orig) F.brush.paredes = { kind: 'original' };
    else if (b.dataset.cor) F.brush.paredes = { kind: 'tinta', cor: b.dataset.cor, nome: b.dataset.nome };
    else if (b.dataset.tex) F.brush.paredes = { kind: 'tex', id: b.dataset.tex };
    else if (b.dataset.rod) F.brush.paredes = { kind: 'rodape', id: b.dataset.rod };
    else return;
    tocar('clique'); desenharParedes();
  });
  $('#sw-paredes').addEventListener('input', (ev) => {
    if (ev.target.id !== 'cor-pers') return;
    F.brush.paredes = { kind: 'tinta', cor: ev.target.value, nome: 'cor personalizada' };
    $$('#sw-paredes .sw.on').forEach((x) => x.classList.remove('on'));
  });
  $('#sw-piso').addEventListener('click', (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    F.brush.piso = b.dataset.orig ? { id: null } : { id: b.dataset.piso };
    tocar('clique'); desenharPiso();
  });
  $('#teto-cards').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-tt]'); if (!b) return;
    const t = tetoPorId[b.dataset.tt]; F.brush.teto.tipo = t.id; if (t.drop) F.brush.teto.drop = t.drop;
    tocar('clique'); desenharTeto();
  });
  $('#teto-drops').addEventListener('click', (ev) => { const b = ev.target.closest('[data-drop]'); if (!b) return; F.brush.teto.drop = +b.dataset.drop; tocar('clique'); desenharTeto(); });
  $('#teto-cores').addEventListener('click', (ev) => { const b = ev.target.closest('[data-tcor]'); if (!b) return; F.brush.teto.cor = b.dataset.tcor; tocar('clique'); desenharTeto(); });

  const lista = $('#luz-lista');
  lista.addEventListener('click', (ev) => {
    const row = ev.target.closest('.luz-row'); if (!row) return;
    const id = row.dataset.room;
    if (ev.target.closest('[data-lt]')) { alternarLuz(id); return; }
    const t = ev.target.closest('[data-temp]');
    if (t) { setLuz(id, { temp: t.dataset.temp }); tocar('lampada'); }
  });
  lista.addEventListener('input', (ev) => { const row = ev.target.closest('.luz-row'); if (row && ev.target.matches('[data-int]')) setLuz(row.dataset.room, { int: +ev.target.value / 100 }); });
  lista.addEventListener('change', (ev) => { if (ev.target.matches('[data-int]')) tocar('lampada'); });
  $('#luz-todas-on').addEventListener('click', () => { setLuzTodos(A.plan().rooms.map((r) => r.id), { on: true }); tocar('luzOn'); });
  $('#luz-todas-off').addEventListener('click', () => { setLuzTodos(A.plan().rooms.map((r) => r.id), { on: false }); tocar('luzOff'); });
  $('#luz-noite').addEventListener('click', () => { A.periodo('noite'); });
}

export function redesenharFerramentas() {
  desenharParedes(); desenharPiso(); desenharTeto(); desenharLuz();
}
export const escopoAtual = (tool) => F.esc[tool];
export const ferramentaAtual = () => F.tool;
export function trocarFerramenta(t) { F.tool = t; A.v3()?.setEscopo(F.esc[t] || 'comodo'); if (t === 'paredes') desenharParedes(); }
export { desenharParedes };
void esc; void fmtM2; void paredeDe; void rodapeDe; void tetoDe; void tempPorId; void pisoDe;
