// Tela inicial: cartões de planta e de projetos salvos, com miniatura.
import { TIPOLOGIAS, tipologiaPorId } from '../data/tipologias.js';
import { preparePlan } from '../geom.js';
import {
  listarProjetos, abrirProjeto, criarProjeto, excluirProjeto, importarJSON, itensSugeridos, lerProjeto,
  exportarPorId, duplicarProjeto, renomearPorId,
} from '../store.js';
import { plantaSVG } from './planta-svg.js';
import { $, esc, cm, fmtM2, toast, confirmar, pedirTexto, baixar, slug } from './util.js';
import { tocar } from '../audio.js';

const planos = {};
export const planoDe = (tipId) => (planos[tipId] ||= preparePlan(tipologiaPorId(tipId)));

const IC = {
  dup: '<path d="M8 8h11v11H8zM5 15V5h10" />',
  ren: '<path d="M4 20h4l11-11-4-4L4 16zM13.5 6.5l4 4" />',
  exp: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14" />',
  del: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" />',
};
const ib = (acao, rot) => `<button class="icon-btn" data-${acao} aria-label="${rot}" title="${rot}"><svg viewBox="0 0 24 24" aria-hidden="true">${IC[acao]}</svg></button>`;

function quando(ts) {
  const d = Date.now() - ts, m = Math.round(d / 60000);
  if (m < 1) return 'agora há pouco';
  if (m < 60) return `há ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `há ${h} h`;
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function renderHome() {
  const grid = $('#tip-grid');
  grid.innerHTML = TIPOLOGIAS.map((t) => {
    if (t.pendente) {
      return `<article class="tip-card pendente">
        <div class="mini">Planta oficial ainda não disponível.<br>O simulador está preparado para recebê-la.</div>
        <h3>${esc(t.nome)} <span class="selo">em breve</span></h3>
        <p>${esc(t.resumo)}</p>
        <p class="nota">Quando a planta for incluída, os avisos usarão os critérios da ${t.requisitos.referencia} (giro de ${String(t.requisitos.giro360).replace('.', ',')} m e passagens de ${cm(t.requisitos.passagemMin)} cm). O simulador não substitui a verificação de acessibilidade.</p>
      </article>`;
    }
    return `<article class="tip-card">
      ${plantaSVG(planoDe(t.id), { itens: itensSugeridos(t.id), acab: {} }, { nomes: false })}
      <h3>${esc(t.nome)} <small>${fmtM2(t.areaPrivativa)} m²</small></h3>
      <p>${esc(t.resumo)}</p>
      <div class="acoes">
        <button class="btn btn-pri" data-novo="${t.id}" data-sug="1">Começar com móveis sugeridos</button>
        <button class="btn" data-novo="${t.id}" data-sug="0">Apartamento vazio</button>
      </div>
    </article>`;
  }).join('');

  const list = listarProjetos();
  $('#projetos').hidden = !list.length;
  $('#lbl-imp-vazio').hidden = !!list.length;
  $('#proj-list').innerHTML = list.map((p) => {
    const t = tipologiaPorId(p.tipologia);
    const dados = lerProjeto(p.id);
    const thumb = t && dados && !t.pendente ? plantaSVG(planoDe(p.tipologia), dados, { nomes: false }) : '<div class="mini"></div>';
    return `<article class="proj-card" data-id="${p.id}">
      <button class="proj-thumb" data-abrir="${p.id}" aria-label="Abrir ${esc(p.nome)}">${thumb}</button>
      <div class="proj-info"><div class="nome" title="${esc(p.nome)}">${esc(p.nome)}</div><div class="meta">${esc(t?.nome || '')} · ${p.n} ${p.n === 1 ? 'móvel' : 'móveis'} · ${quando(p.atualizado)}</div></div>
      <div class="proj-acoes"><button class="btn btn-sm btn-pri" data-abrir="${p.id}">Abrir</button><span class="espaco"></span>${ib('dup', 'Duplicar')}${ib('ren', 'Renomear')}${ib('exp', 'Exportar arquivo')}${ib('del', 'Excluir')}</div>
    </article>`;
  }).join('');
}

export function iniciarHome({ abrirEditor }) {
  $('#home').addEventListener('click', async (ev) => {
    const b = ev.target.closest('button'); if (!b) return;
    const card = b.closest('.proj-card'); const id = card?.dataset.id;
    if (b.dataset.novo) { tocar('boasvindas'); criarProjeto(b.dataset.novo, { sugestao: b.dataset.sug === '1' }); abrirEditor(true); return; }
    if (b.dataset.abrir) { if (abrirProjeto(b.dataset.abrir)) { tocar('boasvindas'); abrirEditor(false); } else toast('Não foi possível abrir este projeto.'); return; }
    if (!id) return;
    const p = listarProjetos().find((x) => x.id === id);
    if (b.hasAttribute('data-dup')) { duplicarProjeto(id); tocar('ok'); renderHome(); toast('Projeto duplicado.'); }
    if (b.hasAttribute('data-ren')) pedirTexto('Renomear projeto', p.nome, 'Salvar', (v) => { renomearPorId(id, v); renderHome(); });
    if (b.hasAttribute('data-exp')) { const e = exportarPorId(id); if (e) baixar(`${slug(e.nome)}.json`, e.json, 'application/json'); }
    if (b.hasAttribute('data-del')) confirmar(`Excluir “${p?.nome}”?`, 'O projeto será apagado deste navegador. Exporte antes se quiser guardar uma cópia.', 'Excluir', () => { excluirProjeto(id); tocar('excluir'); renderHome(); toast('Projeto excluído.'); });
  });
  $('#imp-file-home').addEventListener('change', async (ev) => {
    const f = ev.target.files[0]; if (!f) return;
    try { importarJSON(await f.text()); abrirEditor(false); toast('Projeto importado.'); } catch (e) { tocar('erro'); toast(e.message); }
    ev.target.value = '';
  });
}
