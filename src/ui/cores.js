// Seletor de cores de tinta: marcas, famílias, busca, destaques e cor própria.
// Usado no painel Paredes, no inspetor dos móveis e no forro. A escolha de marca e família é lembrada entre usos.
import { CORES_MARCA, MARCAS, FAMILIAS, NOTAS, corMarcaPorHex } from '../data/marcas.js';
import { TINTAS } from '../data/acabamentos.js';
import { $, $$, esc, abrirDialogo, fecharDialogo } from './util.js';
import { tocar } from '../audio.js';

const BASICAS = TINTAS.map(([hex, nome]) => ({ id: `basica-${hex}`, marca: 'basica', nome, codigo: '', hex, familia: 'Básicas', nota: '', rotulo: nome }));
const semAcento = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const ehHex = (s) => /^#?[0-9a-f]{6}$/i.test(String(s).trim());
const normHex = (s) => `#${String(s).trim().replace('#', '').toLowerCase()}`;

const E = { marca: 'todas', fam: 'Todas', busca: '' };

function filtrar() {
  let base = E.marca === 'basica' ? BASICAS : E.marca === 'todas' ? [...CORES_MARCA, ...BASICAS] : CORES_MARCA.filter((c) => c.marca === E.marca);
  const q = semAcento(E.busca.trim());
  // com texto na busca, a família não restringe: quem procura "papel picado" quer achar em qualquer família
  if (!q) {
    if (E.fam === 'Destaques') base = base.filter((c) => c.nota);
    else if (E.fam !== 'Todas' && E.marca !== 'basica') base = base.filter((c) => c.familia === E.fam);
  }
  if (q) base = base.filter((c) => semAcento(`${c.nome} ${c.codigo} ${c.hex} ${c.marca}`).includes(q));
  return base;
}

const chip = (txt, on, attrs) => `<button type="button" class="${on ? 'on' : ''}" ${attrs}>${esc(txt)}</button>`;

function swatch(c, ativo) {
  const marca = c.marca === 'suvinil' ? 'Suvinil' : c.marca === 'sw' ? 'S-W' : '';
  const tip = `${c.rotulo} · ${c.hex.toUpperCase()}${c.nota ? ` · ${NOTAS[c.nota]}` : ''}`;
  return `<button type="button" class="sw sw-cor sw-marca${ativo ? ' on' : ''}" data-cm="${c.id}" title="${esc(tip)}" aria-label="${esc(tip)}">
    <i style="background:${c.hex}">${c.nota === 'vendida' ? '<b aria-hidden="true">★</b>' : c.nota ? '<b aria-hidden="true">●</b>' : ''}</i>
    <span class="sw-n">${esc(c.nome)}</span><small>${esc(c.codigo || marca || ' ')}${c.codigo && marca ? ` · ${marca}` : ''}</small></button>`;
}

function descricao(atual) {
  if (!atual) return '';
  const c = corMarcaPorHex(atual.cor) || BASICAS.find((b) => b.hex === atual.cor);
  const rgb = [1, 3, 5].map((i) => parseInt(atual.cor.slice(i, i + 2), 16));
  const nome = atual.marca && atual.codigo ? `${atual.marca === 'suvinil' ? 'Suvinil' : atual.marca === 'sw' ? 'Sherwin-Williams' : ''} ${atual.nome} (${atual.codigo})`.trim() : (c?.rotulo || atual.nome || 'Cor própria');
  const nota = c?.nota ? `<small>${esc(NOTAS[c.nota])}</small>` : '';
  return `<div class="cm-sel"><i style="background:${atual.cor}"></i><div><b>${esc(nome)}</b><span>${atual.cor.toUpperCase()} · RGB ${rgb.join(', ')}</span>${nota}</div><button type="button" class="btn btn-sm" data-cm-copiar="${atual.cor.toUpperCase()}">Copiar hex</button></div>`;
}

// host: elemento onde desenhar. opts.atual: hex atual. opts.onPick({cor, nome, marca, codigo}). opts.antes: html opcional antes da grade.
export function montarSeletorCores(host, opts) {
  const estadoAtual = { cor: opts.atual || null, nome: opts.nome, marca: opts.marca, codigo: opts.codigo };
  const render = () => {
    const lista = filtrar();
    const foco = document.activeElement?.id === 'cm-busca';
    host.innerHTML = `<div class="cm">
      ${opts.antes || ''}
      ${estadoAtual.cor ? descricao(estadoAtual) : ''}
      <input id="cm-busca" class="campo campo-sm" type="search" placeholder="Buscar cor, código ou marca" value="${esc(E.busca)}" aria-label="Buscar cor">
      <div class="chips cm-marcas" role="group" aria-label="Marca">${chip('Todas', E.marca === 'todas', 'data-cm-marca="todas"')}${MARCAS.map((m) => chip(m.nome, E.marca === m.id, `data-cm-marca="${m.id}"`)).join('')}${chip('Básicas', E.marca === 'basica', 'data-cm-marca="basica"')}</div>
      ${E.marca === 'basica' ? '' : `<div class="chips cm-fams" role="group" aria-label="Família de cor">${['Todas', 'Destaques', ...FAMILIAS].map((f) => chip(f, E.fam === f, `data-cm-fam="${esc(f)}"`)).join('')}</div>`}
      <div class="sw-grid cm-grid">${lista.map((c) => swatch(c, estadoAtual.cor && c.hex === estadoAtual.cor.toLowerCase())).join('') || '<p class="nota">Nenhuma cor encontrada. Use a cor própria abaixo.</p>'}</div>
      <p class="nota cm-aviso">★ entre as mais vendidas segundo a marca ou o varejo; ● cor do ano. Cores de marca vêm dos dados publicados por elas; veja a origem em Sobre. A tela não reproduz a tinta: confira no leque físico antes de comprar.</p>
      <div class="cm-propria"><label>Cor própria<input type="color" id="cm-cor" value="${estadoAtual.cor || '#e9e1d3'}" aria-label="Escolher cor"></label>
        <input id="cm-hex" class="campo campo-sm" placeholder="#D8D3CA" maxlength="7" value="${estadoAtual.cor || ''}" aria-label="Código hexadecimal">
        <input id="cm-nome" class="campo campo-sm" placeholder="Nome ou código (opcional)" maxlength="40" aria-label="Nome da cor própria">
        <button type="button" class="btn btn-sm" data-cm-usar>Usar</button></div>
    </div>`;
    if (foco) { const i = $('#cm-busca', host); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
  };
  const escolher = (obj) => {
    Object.assign(estadoAtual, { cor: obj.cor, nome: obj.nome, marca: obj.marca, codigo: obj.codigo });
    opts.onPick(obj); tocar('clique'); render();
  };
  host.onclick = (ev) => {
    const b = ev.target.closest('button'); if (!b || !host.contains(b)) return;
    if (b.dataset.cmMarca) { E.marca = b.dataset.cmMarca; if (E.marca === 'basica') E.fam = 'Todas'; tocar('clique'); render(); return; }
    if (b.dataset.cmFam) { E.fam = b.dataset.cmFam; tocar('clique'); render(); return; }
    if (b.dataset.cm) {
      const c = [...CORES_MARCA, ...BASICAS].find((x) => x.id === b.dataset.cm); if (!c) return;
      escolher({ cor: c.hex, nome: c.nome, marca: c.marca === 'basica' ? '' : c.marca, codigo: c.codigo });
      return;
    }
    if (b.dataset.cmCopiar) { navigator.clipboard?.writeText(b.dataset.cmCopiar).catch(() => {}); b.textContent = 'Copiado'; setTimeout(() => { b.textContent = 'Copiar hex'; }, 1400); return; }
    if ('cmUsar' in b.dataset) {
      const h = $('#cm-hex', host).value.trim();
      if (!ehHex(h)) { $('#cm-hex', host).setCustomValidity('Use seis dígitos, como #D8D3CA'); $('#cm-hex', host).reportValidity(); return; }
      $('#cm-hex', host).setCustomValidity('');
      const nome = $('#cm-nome', host).value.trim();
      const conhecida = corMarcaPorHex(normHex(h));
      escolher(conhecida && !nome ? { cor: conhecida.hex, nome: conhecida.nome, marca: conhecida.marca, codigo: conhecida.codigo } : { cor: normHex(h), nome: nome || 'Cor própria', marca: '', codigo: '' });
    }
  };
  host.oninput = (ev) => {
    if (ev.target.id === 'cm-busca') { E.busca = ev.target.value; const g = $('.cm-grid', host); if (g) { const lista = filtrar(); g.innerHTML = lista.map((c) => swatch(c, estadoAtual.cor && c.hex === estadoAtual.cor.toLowerCase())).join('') || '<p class="nota">Nenhuma cor encontrada. Use a cor própria abaixo.</p>'; } }
    else if (ev.target.id === 'cm-cor') { $('#cm-hex', host).value = ev.target.value; }
  };
  host.onchange = (ev) => {
    if (ev.target.id === 'cm-cor') { escolher({ cor: ev.target.value, nome: $('#cm-nome', host).value.trim() || 'Cor própria', marca: '', codigo: '' }); }
  };
  render();
  return { render, definir(cor) { estadoAtual.cor = cor; render(); } };
}

// Janela com o seletor completo; fecha ao escolher. Usada onde não há espaço para o seletor em linha.
export function abrirCoresMarca({ titulo = 'Cores de tinta', atual, nome, marca, codigo, onPick }) {
  abrirDialogo(`<h2>${esc(titulo)}</h2><div id="cm-dlg-host" class="cm-dlg"></div><div class="acoes-row"><button class="btn" data-dlg-fechar>Fechar</button></div>`);
  montarSeletorCores($('#cm-dlg-host'), { atual, nome, marca, codigo, onPick: (o) => { onPick(o); setTimeout(fecharDialogo, 120); } });
}
