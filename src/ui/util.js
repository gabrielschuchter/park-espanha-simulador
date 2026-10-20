// Utilitários de interface compartilhados.
import { tocar } from '../audio.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const cm = (m) => Math.round(m * 100);
export const fmtM2 = (v) => v.toFixed(2).replace('.', ',');
export const mobile = () => window.matchMedia('(max-width: 860px)').matches;
export const toque = () => window.matchMedia('(pointer: coarse)').matches;
export const slug = (t) => String(t || 'projeto').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'projeto';

let tToast = null;
export function toast(msg, rotulo, fn) {
  const t = $('#toast');
  t.innerHTML = `<span>${esc(msg)}</span>${rotulo ? `<button>${esc(rotulo)}</button>` : ''}`;
  t.hidden = false;
  if (rotulo) t.querySelector('button').onclick = () => { fn(); t.hidden = true; };
  clearTimeout(tToast); tToast = setTimeout(() => { t.hidden = true; }, rotulo ? 5000 : 2600);
}

export function abrirDialogo(html) {
  $('#dlg-body').innerHTML = `<div class="dlg-in">${html}</div>`;
  const d = $('#dlg');
  if (!d.open) d.showModal();
  return d;
}
export function fecharDialogo() { const d = $('#dlg'); if (d.open) d.close(); }
$('#dlg').addEventListener('click', (ev) => { if (ev.target === $('#dlg') || ev.target.closest('[data-dlg-fechar]')) $('#dlg').close(); });
export function confirmar(titulo, texto, botao, fn) {
  abrirDialogo(`<h2>${esc(titulo)}</h2><p>${esc(texto)}</p><div class="acoes-row"><button class="btn" data-dlg-fechar>Cancelar</button><button class="btn btn-pri" id="dlg-ok">${esc(botao)}</button></div>`);
  $('#dlg-ok').addEventListener('click', () => { $('#dlg').close(); fn(); }, { once: true });
}
export function pedirTexto(titulo, valor, botao, fn) {
  abrirDialogo(`<h2>${esc(titulo)}</h2><form id="pt-form" class="grupo"><input id="pt-in" class="campo" value="${esc(valor)}" maxlength="60" aria-label="${esc(titulo)}"><div class="acoes-row"><button type="button" class="btn" data-dlg-fechar>Cancelar</button><button class="btn btn-pri" type="submit">${esc(botao)}</button></div></form>`);
  const inp = $('#pt-in'); inp.focus(); inp.select();
  $('#pt-form').addEventListener('submit', (ev) => { ev.preventDefault(); const v = inp.value.trim(); $('#dlg').close(); if (v) fn(v); });
}

// Salva um arquivo: no visualizador de artefatos pela capacidade `downloads`; fora dele, por link de download.
export async function baixar(nome, dados, mime = 'application/octet-stream') {
  const dl = window.claude?.use ? await window.claude.use('downloads').catch(() => null) : null;
  if (dl) {
    try { await dl.save({ filename: nome, data: dados }); tocar('sucesso'); toast('Arquivo salvo.'); return true; }
    catch (e) {
      if (e?.code === 'declined') toast('Download cancelado.');
      else { tocar('erro'); toast('O download não está disponível aqui.'); }
      return false;
    }
  }
  try {
    const blob = dados instanceof Blob ? dados : new Blob([dados], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    tocar('sucesso'); toast('Arquivo salvo.');
    return true;
  } catch { tocar('erro'); toast('O download foi bloqueado pelo navegador.'); return false; }
}
export async function dataUrlParaBlob(url) { return (await fetch(url)).blob(); }
