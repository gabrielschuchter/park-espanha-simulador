// Catálogo de móveis: cartões com símbolo da planta, busca, categorias e arrasto para a planta ou o 3D.
import { CATALOGO, CATEGORIAS, catalogoPorId } from '../data/catalogo.js';
import { simboloItem } from '../plan2d.js';
import { $, esc, cm } from './util.js';
import { tocar } from '../audio.js';

let catAtual = 'sala';
const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function cartao(c) {
  const it = { ...c, x: 0, y: 0, rot: 0, tipo: c.id };
  const pad = Math.max(c.w, c.d) * 0.12 + 0.05;
  const vb = `${(-c.w / 2 - pad).toFixed(3)} ${(-Math.max(c.d, 0.05) / 2 - pad).toFixed(3)} ${(c.w + pad * 2).toFixed(3)} ${(Math.max(c.d, 0.05) + pad * 2).toFixed(3)}`;
  const med = c.personalizado ? 'informe as medidas' : `${cm(c.w)} × ${cm(c.d)} cm`;
  return `<button class="cat-item" data-add="${c.id}" aria-label="Adicionar ${esc(c.nome)}"><svg viewBox="${vb}" preserveAspectRatio="xMidYMid meet" style="--mv:${c.cor || '#c9a77c'}" aria-hidden="true"><g style="--mv:${c.cor || '#c9a77c'}">${simboloItem(it)}</g></svg><span class="n">${esc(c.nome)}</span><span class="m">${med}</span></button>`;
}

export function renderCatalogo() {
  $('#cat-chips').innerHTML = [{ id: 'todos', nome: 'Todos' }, ...CATEGORIAS].map((c) => `<button role="tab" data-cat="${c.id}" aria-selected="${c.id === catAtual}" class="${c.id === catAtual ? 'on' : ''}">${esc(c.nome)}</button>`).join('');
  const q = norm($('#cat-busca').value.trim());
  const itens = CATALOGO.filter((c) => (q ? norm(c.nome).includes(q) : catAtual === 'todos' || c.cat === catAtual));
  $('#cat-grid').innerHTML = itens.map(cartao).join('') || '<p class="dica">Nada encontrado. Use “Móvel sob medida” em Meus móveis para criar qualquer peça.</p>';
  $('#luz-grid').innerHTML = CATALOGO.filter((c) => c.cat === 'luz').map(cartao).join('');
}

export function iniciarCatalogo({ adicionar, soltarEm }) {
  $('#cat-chips').addEventListener('click', (ev) => { const b = ev.target.closest('[data-cat]'); if (!b) return; catAtual = b.dataset.cat; $('#cat-busca').value = ''; tocar('clique'); renderCatalogo(); });
  $('#cat-busca').addEventListener('input', renderCatalogo);
  let st = null, ghost = null;
  const down = (ev) => {
    const b = ev.target.closest('[data-add]'); if (!b) return;
    st = { id: b.dataset.add, x: ev.clientX, y: ev.clientY, pid: ev.pointerId, moved: false, b };
    b.setPointerCapture(ev.pointerId);
  };
  const move = (ev) => {
    if (!st || ev.pointerId !== st.pid) return;
    if (!st.moved && Math.hypot(ev.clientX - st.x, ev.clientY - st.y) > 8 && ev.pointerType !== 'touch') {
      st.moved = true;
      ghost = document.createElement('div'); ghost.className = 'ghost'; ghost.textContent = catalogoPorId[st.id].nome; document.body.appendChild(ghost);
      tocar('pegar');
    }
    if (ghost) { ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; }
  };
  const fim = (ev) => {
    if (!st || ev.pointerId !== st.pid) return;
    const s = st; st = null;
    if (ghost) { ghost.remove(); ghost = null; }
    if (ev.type === 'pointercancel') return;
    if (s.moved) {
      const alvo = soltarEm(ev.clientX, ev.clientY);
      if (alvo) adicionar(s.id, alvo, true); else adicionar(s.id);
    } else adicionar(s.id);
  };
  for (const g of [$('#cat-grid'), $('#luz-grid')]) {
    g.addEventListener('pointerdown', down); g.addEventListener('pointermove', move);
    g.addEventListener('pointerup', fim); g.addEventListener('pointercancel', fim);
  }
}
