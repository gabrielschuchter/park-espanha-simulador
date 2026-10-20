// Utilitários de modelagem 3D compartilhados pelos construtores de móveis, louças e fixos.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { texTecido, texMadeira, texGranito, texQuadro } from './textures.js';

const matCache = new Map();
export function mat(kind, cor = '#ffffff') {
  const key = kind + cor;
  if (matCache.has(key)) return matCache.get(key);
  let m;
  const c = new THREE.Color(cor);
  switch (kind) {
    case 'tecido': m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, map: texTecido() }); break;
    case 'madeira': m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, map: texMadeira() }); break;
    case 'laca': m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.38 }); break;
    case 'metal': m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.32, metalness: 0.75 }); break;
    case 'inox': m = new THREE.MeshStandardMaterial({ color: '#c9ccd0', roughness: 0.25, metalness: 0.9 }); break;
    case 'vidro': m = new THREE.MeshPhysicalMaterial({ color: '#dbe9ef', roughness: 0.05, metalness: 0, transmission: 0.0, transparent: true, opacity: 0.22, depthWrite: false }); break;
    case 'espelho': m = new THREE.MeshStandardMaterial({ color: '#dfe7ea', roughness: 0.02, metalness: 1 }); break;
    case 'tela': m = new THREE.MeshStandardMaterial({ color: '#0d0f12', roughness: 0.15, metalness: 0.4 }); break;
    case 'ceramica': m = new THREE.MeshStandardMaterial({ color: '#f6f5f2', roughness: 0.18 }); break;
    case 'granito': m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.25, map: texGranito() }); break;
    case 'folha': m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, flatShading: true }); break;
    case 'luz': m = new THREE.MeshStandardMaterial({ color: '#fff4dc', emissive: '#ffe2a8', emissiveIntensity: 1.2, roughness: 0.6 }); break;
    case 'quadro': m = new THREE.MeshStandardMaterial({ map: texQuadro(cor), roughness: 0.8 }); break;
    default: m = new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 });
  }
  matCache.set(key, m);
  return m;
}

const geoCache = new Map();
export function rbox(w, h, d, r) {
  r = Math.max(0.001, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));
  const key = [w, h, d, r].map((v) => v.toFixed(3)).join('|');
  if (!geoCache.has(key)) geoCache.set(key, r > 0.004 ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d));
  return geoCache.get(key);
}
export function add(g, geo, m, x, y, z, ry = 0) {
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z); mesh.rotation.y = ry;
  mesh.castShadow = true; mesh.receiveShadow = true;
  g.add(mesh); return mesh;
}
// caixa com base em y0
export const B = (g, w, h, d, m, x, y0, z, r = 0.01) => add(g, rbox(w, h, d, r), m, x, y0 + h / 2, z);
export const cyl = (g, rt, rb, h, m, x, y0, z, seg = 20) => add(g, new THREE.CylinderGeometry(rt, rb, h, seg), m, x, y0 + h / 2, z);
export function pernas(g, w, d, h, m, inset = 0.05, r = 0.018) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, r, r * 0.8, h, m, sx * (w / 2 - inset), 0, sz * (d / 2 - inset), 10);
}

// Material emissivo próprio de cada luminária (liga e desliga por cômodo)
export function lampMat(g, cor = '#fff2d6') {
  const m = new THREE.MeshStandardMaterial({ color: cor, emissive: '#ffd39a', emissiveIntensity: 1.1, roughness: 0.5 });
  if (!g.userData.emissivos) g.userData.emissivos = [];
  g.userData.emissivos.push(m);
  return m;
}
export const disco = (g, r, h, m, x, y0, z) => cyl(g, r, r, h, m, x, y0, z, 28);

export { THREE };

// ---------------------------------------------------------------- peças articuladas (portas, gavetas, cadeiras, pessoas)
// Cada peça móvel é um objeto cuja origem é o eixo da dobradiça (ou o ponto de apoio).
// def: { grupo: 'portas' | 'cad' | 'pes', r: [rx, ry, rz] (rotação em k = 1), d: [dx, dy, dz] (deslocamento em k = 1), de: atraso 0..0.5 }
export function parte(g, obj, def) {
  (g.userData.partes ||= []).push({ o: obj, p0: obj.position.clone(), r0: obj.rotation.clone(), def });
  return obj;
}
// k: { portas: 0..1, cad: 0..1, pes: 0|1 }
export function aplicarEstado(g, k) {
  const ps = g.userData.partes; if (!ps) return false;
  for (const p of ps) {
    const { def, o } = p;
    if (def.grupo === 'pes') { o.visible = (k.pes || 0) > 0.5; continue; }
    const v0 = k[def.grupo] || 0, de = def.de || 0;
    const t = Math.max(0, Math.min(1, (v0 - de) / (1 - de)));
    const e = t * t * (3 - 2 * t);
    if (def.r) o.rotation.set(p.r0.x + def.r[0] * e, p.r0.y + def.r[1] * e, p.r0.z + def.r[2] * e);
    if (def.d) o.position.set(p.p0.x + def.d[0] * e, p.p0.y + def.d[1] * e, p.p0.z + def.d[2] * e);
  }
  return true;
}
export const temEstados = (g) => !!g.userData.partes?.length;
