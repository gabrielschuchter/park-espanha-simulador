// Guia rápido de cinco passos, mostrado na primeira vez e disponível no menu.
import { abrirDialogo, fecharDialogo, $ } from './util.js';
import { tocar } from '../audio.js';

const KEY = 'pe.tour.v1';
const PASSOS = [
  { t: 'Coloque os móveis', d: 'Em Móveis, toque num item para ele aparecer no cômodo, ou arraste até a planta ou o 3D. O móvel encaixa sozinho nas paredes. A alça redonda gira, os quadrados mudam a medida.', ic: '<path d="M4 12h16v6H4zM6 18v2M18 18v2M6 12V9a2 2 0 012-2h8a2 2 0 012 2v3" />' },
  { t: 'Caminhe pelo apartamento', d: 'O simulador abre no Passeio, em modo Explorar: você só anda e olha, sem mexer em nada por acidente. Para mudar móveis, toque em Editar (ou Tab). Dia, Tarde e Noite mudam a luz; Maquete e De cima mostram a casa inteira. O botão Estilos troca a decoração toda de uma vez.', ic: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z M12 12l8-4.5M12 12v9M12 12L4 7.5" />' },
  { t: 'Pinte, troque piso e forro', d: 'Em Paredes, Piso e Teto, escolha uma amostra e clique na superfície no 3D (ou no cômodo na planta). Cada clique pode ser desfeito. No Teto há gesso, sanca com LED e moldura.', ic: '<path d="M5 4h11a2 2 0 012 2v3H5zM18 7.5h2v4h-8v3M12 14.5v6" />' },
  { t: 'Acenda as luzes', d: 'Em Luz, ligue e desligue cada cômodo, ajuste a intensidade e a cor da luz. No 3D, clique no interruptor da parede. Ponha lustres, pendentes e spots pelo catálogo e use Noite para ver o efeito.', ic: '<path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0012 3z" />' },
  { t: 'Som e salvamento', d: 'O botão de som no topo controla volume, música e efeitos; ele começa em 50%. Tudo é salvo neste navegador. Exporte a planta, a lista de móveis ou a foto do 3D em Resumo.', ic: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 010 7"/>' },
];

export const tourVisto = () => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };
const marcar = () => { try { localStorage.setItem(KEY, '1'); } catch { /* ignora */ } };

export function abrirTour() {
  let i = 0;
  const pintar = () => {
    const p = PASSOS[i], ultimo = i === PASSOS.length - 1;
    abrirDialogo(`<div class="tour"><svg viewBox="0 0 24 24" class="tour-ic" aria-hidden="true">${p.ic}</svg>
      <p class="tour-n">Passo ${i + 1} de ${PASSOS.length}</p><h2>${p.t}</h2><p>${p.d}</p>
      <div class="tour-pontos" aria-hidden="true">${PASSOS.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
      <div class="acoes-row"><button class="btn btn-ghost" data-tour="pular">${ultimo ? 'Fechar' : 'Pular guia'}</button>${i ? '<button class="btn" data-tour="volta">Voltar</button>' : ''}<button class="btn btn-pri" data-tour="${ultimo ? 'fim' : 'prox'}">${ultimo ? 'Começar' : 'Próximo'}</button></div></div>`);
  };
  pintar();
  $('#dlg-body').onclick = (ev) => {
    const b = ev.target.closest('[data-tour]'); if (!b) return;
    tocar('clique');
    if (b.dataset.tour === 'prox') { i++; pintar(); }
    else if (b.dataset.tour === 'volta') { i--; pintar(); }
    else { marcar(); fecharDialogo(); $('#dlg-body').onclick = null; }
  };
  $('#dlg').addEventListener('close', () => { marcar(); $('#dlg-body').onclick = null; }, { once: true });
}
