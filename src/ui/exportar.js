// Exportações: planta com móveis (PNG e SVG), lista de móveis (CSV), foto do 3D (JPG) e projeto (JSON).
import { store, exportarJSON } from '../store.js';
import { catalogoPorId } from '../data/catalogo.js';
import { pointInPoly } from '../geom.js';
import { plantaSVG, svgParaPng } from './planta-svg.js';
import { baixar, slug, cm, dataUrlParaBlob, toast } from './util.js';
import { tocar } from '../audio.js';

const csvCel = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const sub = (plan) => `${plan.tip.nome} · ${plan.tip.areaPrivativa.toFixed(2).replace('.', ',')} m² · ${new Date().toLocaleDateString('pt-BR')}`;

export function itensPorComodo(plan) {
  const mapa = new Map(plan.rooms.map((r) => [r.id, []]));
  const fora = [];
  for (const it of store.projeto.itens) {
    const r = plan.rooms.find((q) => pointInPoly(it.x, it.y, q.poly));
    (r ? mapa.get(r.id) : fora).push(it);
  }
  return { mapa, fora };
}

export function csvMoveis(plan) {
  const { mapa, fora } = itensPorComodo(plan);
  const linhas = [['Cômodo', 'Item', 'Categoria', 'Largura (cm)', 'Profundidade (cm)', 'Altura (cm)', 'Altura do chão (cm)'].map(csvCel).join(';')];
  const add = (nome, its) => its.forEach((it) => linhas.push([nome, it.nome, catalogoPorId[it.tipo]?.cat || '', cm(it.w), cm(it.d), cm(it.h), cm(it.elev || 0)].map(csvCel).join(';')));
  plan.rooms.forEach((r) => add(r.nome, mapa.get(r.id)));
  add('Fora dos cômodos', fora);
  return '﻿' + linhas.join('\r\n');
}

export async function exportarPlantaPng(plan) {
  const svg = plantaSVG(plan, store.projeto, { nomes: true, completo: true, pad: 0.6, titulo: store.projeto.nome, subtitulo: sub(plan) });
  try {
    const png = await svgParaPng(svg);
    return baixar(`${slug(store.projeto.nome)}-planta.png`, png, 'image/png');
  } catch { tocar('erro'); toast('Não foi possível gerar a imagem. Tente o arquivo SVG.'); return false; }
}
export function exportarPlantaSvg(plan) {
  const svg = plantaSVG(plan, store.projeto, { nomes: true, completo: true, pad: 0.6, titulo: store.projeto.nome, subtitulo: sub(plan) });
  return baixar(`${slug(store.projeto.nome)}-planta.svg`, svg, 'image/svg+xml');
}
export function exportarCsv(plan) { return baixar(`${slug(store.projeto.nome)}-moveis.csv`, csvMoveis(plan), 'text/csv'); }
export function exportarJson() { return baixar(`${slug(store.projeto.nome)}.json`, exportarJSON(), 'application/json'); }
export async function exportarFoto(v3) {
  if (!v3) { toast('Abra a vista 3D para tirar a foto.'); return false; }
  tocar('foto');
  const url = v3.foto(1800);
  return baixar(`${slug(store.projeto.nome)}-3d.jpg`, await dataUrlParaBlob(url), 'image/jpeg');
}
