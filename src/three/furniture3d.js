// Modelos 3D paramétricos. Origem no centro da projeção no piso; x = largura,
// z = profundidade (frente em +z), y = altura. Tudo em metros.
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
function rbox(w, h, d, r) {
  r = Math.max(0.001, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));
  const key = [w, h, d, r].map((v) => v.toFixed(3)).join('|');
  if (!geoCache.has(key)) geoCache.set(key, r > 0.004 ? new RoundedBoxGeometry(w, h, d, 3, r) : new THREE.BoxGeometry(w, h, d));
  return geoCache.get(key);
}
function add(g, geo, m, x, y, z, ry = 0) {
  const mesh = new THREE.Mesh(geo, m);
  mesh.position.set(x, y, z); mesh.rotation.y = ry;
  mesh.castShadow = true; mesh.receiveShadow = true;
  g.add(mesh); return mesh;
}
// caixa com base em y0
const B = (g, w, h, d, m, x, y0, z, r = 0.01) => add(g, rbox(w, h, d, r), m, x, y0 + h / 2, z);
const cyl = (g, rt, rb, h, m, x, y0, z, seg = 20) => add(g, new THREE.CylinderGeometry(rt, rb, h, seg), m, x, y0 + h / 2, z);
function pernas(g, w, d, h, m, inset = 0.05, r = 0.018) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, r, r * 0.8, h, m, sx * (w / 2 - inset), 0, sz * (d / 2 - inset), 10);
}

// Material emissivo próprio de cada luminária (liga e desliga por cômodo)
function lampMat(g, cor = '#fff2d6') {
  const m = new THREE.MeshStandardMaterial({ color: cor, emissive: '#ffd39a', emissiveIntensity: 1.1, roughness: 0.5 });
  if (!g.userData.emissivos) g.userData.emissivos = [];
  g.userData.emissivos.push(m);
  return m;
}
const disco = (g, r, h, m, x, y0, z) => cyl(g, r, r, h, m, x, y0, z, 28);

const builders = {
  sofa(g, { w, d, h, cor }) {
    const f = mat('tecido', cor), dk = mat('madeira', '#3b2a1e');
    const pe = 0.10, braco = Math.min(0.18, w * 0.09), enc = 0.20, sh = 0.44;
    pernas(g, w - 0.1, d - 0.1, pe, dk, 0.04, 0.015);
    B(g, w, sh - pe - 0.12, d, f, 0, pe, 0, 0.03);
    for (const s of [-1, 1]) B(g, braco, 0.64 - pe, d, f, s * (w / 2 - braco / 2), pe, 0, 0.05);
    B(g, w - 2 * braco + 0.02, h - pe, enc, f, 0, pe, -d / 2 + enc / 2, 0.05);
    const n = w - 2 * braco > 1.7 ? 3 : 2;
    const cw = (w - 2 * braco) / n;
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + braco + cw * (i + 0.5);
      B(g, cw - 0.015, 0.14, d - enc - 0.03, f, x, sh - 0.12, enc / 2 + 0.005, 0.05);
      const back = B(g, cw - 0.03, h - sh - 0.05, 0.16, f, x, sh, -d / 2 + enc + 0.07, 0.06);
      back.rotation.x = -0.12;
    }
  },
  sofaChaise(g, it) {
    const { w, d, h, cor } = it;
    const ds = Math.min(0.95, d);
    const sub = new THREE.Group(); builders.sofa(sub, { w, d: ds, h, cor }); sub.position.z = -d / 2 + ds / 2; g.add(sub);
    const f = mat('tecido', cor), cw = Math.min(0.80, w * 0.38);
    B(g, cw, 0.32, d - ds + 0.1, f, w / 2 - cw / 2, 0.06, d / 2 - (d - ds + 0.1) / 2, 0.04);
    B(g, cw - 0.02, 0.12, d - ds, f, w / 2 - cw / 2, 0.36, d / 2 - (d - ds) / 2, 0.05);
  },
  poltrona(g, { w, d, h, cor }) {
    const f = mat('tecido', cor), wd = mat('madeira', '#8a6240');
    pernas(g, w - 0.06, d - 0.06, 0.16, wd, 0.06, 0.016);
    B(g, w, 0.24, d, f, 0, 0.16, 0, 0.05);
    for (const s of [-1, 1]) B(g, 0.10, 0.30, d - 0.05, f, s * (w / 2 - 0.05), 0.36, 0.02, 0.045);
    const b = B(g, w - 0.04, h - 0.38, 0.14, f, 0, 0.36, -d / 2 + 0.09, 0.05); b.rotation.x = -0.14;
    B(g, w - 0.22, 0.10, d - 0.2, f, 0, 0.40, 0.06, 0.05);
  },
  rack(g, { w, d, h, cor }) {
    const m = mat('madeira', cor), dk = mat('metal', '#2b2b2b');
    pernas(g, w, d, 0.12, dk, 0.06, 0.012);
    B(g, w, h - 0.12, d, m, 0, 0.12, 0, 0.006);
    const n = Math.max(2, Math.round(w / 0.6));
    for (let i = 1; i < n; i++) B(g, 0.004, h - 0.16, 0.004, dk, -w / 2 + (w / n) * i, 0.14, d / 2 + 0.001, 0);
  },
  tv(g, { w, d, h }) {
    B(g, w, h, d * 0.5, mat('laca', '#121212'), 0, 0, 0, 0.004);
    add(g, new THREE.PlaneGeometry(w - 0.02, h - 0.02), mat('tela'), 0, h / 2, d * 0.25 + 0.001);
  },
  painel(g, { w, d, h, cor }) {
    const m = mat('madeira', cor);
    B(g, w, h, 0.012, mat('laca', '#2b2723'), 0, 0, -d / 2 + 0.006, 0);
    const n = Math.max(3, Math.floor(w / 0.06));
    for (let i = 0; i < n; i++) B(g, 0.035, h, d - 0.012, m, -w / 2 + (w / n) * (i + 0.5), 0, 0.006, 0.004);
  },
  mesaCentro(g, { w, d, h, cor }) {
    const m = mat('madeira', cor);
    B(g, w, 0.035, d, m, 0, h - 0.035, 0, 0.012);
    B(g, w - 0.1, 0.02, d - 0.1, m, 0, 0.10, 0, 0.006);
    pernas(g, w, d, h - 0.035, m, 0.05, 0.02);
  },
  mesaRedonda(g, { w, d, h, cor }) {
    const m = mat('madeira', cor), r = Math.min(w, d) / 2;
    cyl(g, r, r, 0.03, m, 0, h - 0.03, 0, 36);
    cyl(g, 0.025, 0.025, h - 0.03, mat('metal', '#2b2b2b'), 0, 0, 0, 12);
    cyl(g, r * 0.55, r * 0.6, 0.02, mat('metal', '#2b2b2b'), 0, 0, 0, 24);
  },
  estante(g, { w, d, h, cor }) {
    const m = mat('madeira', cor), t = 0.022;
    for (const s of [-1, 1]) B(g, t, h, d, m, s * (w / 2 - t / 2), 0, 0, 0.002);
    const n = Math.max(3, Math.round(h / 0.36));
    for (let i = 0; i <= n; i++) B(g, w - 2 * t, t, d, m, 0, Math.min(h - t, (h / n) * i), 0, 0.002);
    B(g, w, h, 0.006, m, 0, 0, -d / 2 + 0.003, 0);
    const livros = ['#7d8461', '#b46a4c', '#e8e3da', '#3f5f6b', '#d1a54a'];
    for (let i = 0; i < n - 1; i++) {
      let x = -w / 2 + t + 0.02;
      const y = (h / n) * (i + 1) + t;
      let k = i;
      while (x < w / 2 - 0.2 && (k % 3) !== 2) {
        const bw = 0.025 + ((k * 7) % 5) * 0.006, bh = Math.min(h / n - 0.06, 0.20 + ((k * 3) % 4) * 0.025);
        B(g, bw, bh, d * 0.75, mat('laca', livros[k % 5]), x + bw / 2, y, 0, 0.002);
        x += bw + 0.003; k++;
      }
    }
  },
  cama(g, { w, d, h, cor, cor2 }) {
    const base = mat('madeira', cor2 || '#a5774b'), roupa = mat('tecido', cor), branco = mat('tecido', '#f4f2ee');
    const cab = 0.06, hb = 0.95;
    B(g, w + 0.02, hb, cab, base, 0, 0, -d / 2 + cab / 2, 0.015);
    B(g, w, 0.28, d - cab, base, 0, 0.04, cab / 2, 0.01);
    B(g, w - 0.03, h - 0.32, d - cab - 0.03, branco, 0, 0.32, cab / 2, 0.06);
    // edredom
    B(g, w + 0.03, 0.06, (d - cab) * 0.66, roupa, 0, h - 0.04, d / 2 - (d - cab) * 0.33 - 0.01, 0.03);
    B(g, w + 0.035, h - 0.18, 0.04, roupa, 0, 0.16, d / 2 + 0.002, 0.02);
    const np = w > 1.1 ? 2 : 1, pw = Math.min(0.62, (w - 0.12) / np);
    for (let i = 0; i < np; i++) {
      const x = np === 1 ? 0 : (i === 0 ? -1 : 1) * (pw / 2 + 0.03);
      const p = B(g, pw, 0.12, 0.40, branco, x, h - 0.02, -d / 2 + cab + 0.26, 0.06); p.rotation.x = -0.25;
    }
  },
  beliche(g, { w, d, h, cor }) {
    const m = mat('madeira', cor), col = mat('tecido', '#e8e3da');
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, 0.06, h, 0.06, m, sx * (w / 2 - 0.03), 0, sz * (d / 2 - 0.03), 0.005);
    for (const y of [0.18, h * 0.62]) {
      B(g, w, 0.10, d, m, 0, y, 0, 0.008);
      B(g, w - 0.08, 0.14, d - 0.08, col, 0, y + 0.10, 0, 0.04);
    }
    for (const sz of [-1, 1]) B(g, w - 0.06, 0.06, 0.03, m, 0, h - 0.10, sz * (d / 2 - 0.03), 0.005);
    for (let i = 0; i < 4; i++) B(g, 0.03, 0.03, 0.30, m, w / 2 - 0.03, 0.35 + i * 0.22, d / 2 - 0.25, 0.005);
  },
  berco(g, { w, d, h, cor }) {
    const m = mat('laca', cor);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, 0.04, h, 0.04, m, sx * (w / 2 - 0.02), 0, sz * (d / 2 - 0.02), 0.005);
    B(g, w - 0.04, 0.12, d - 0.04, mat('tecido', '#f4f2ee'), 0, 0.32, 0, 0.03);
    for (const y of [0.30, h - 0.04]) {
      for (const sz of [-1, 1]) B(g, w, 0.035, 0.03, m, 0, y, sz * (d / 2 - 0.015), 0.005);
      for (const sx of [-1, 1]) B(g, 0.03, 0.035, d, m, sx * (w / 2 - 0.015), y, 0, 0.005);
    }
    for (const sz of [-1, 1]) for (let i = 1; i < 10; i++) B(g, 0.018, h - 0.36, 0.018, m, -w / 2 + (w / 10) * i, 0.33, sz * (d / 2 - 0.015), 0.004);
  },
  guardaRoupa(g, { w, d, h, cor }, c) {
    const m = mat(c?.paleta === 'madeira' && cor !== '#f1efea' ? 'madeira' : 'laca', cor);
    const linha = mat('laca', '#8d877f'), puxa = mat('metal', '#2b2b2b');
    B(g, w, h, d, m, 0, 0, 0, 0.006);
    if (c?.correr) {
      const n = w > 1.5 ? 2 : 1;
      for (let i = 1; i < n; i++) B(g, 0.006, h - 0.04, 0.012, linha, -w / 2 + (w / n) * i, 0.02, d / 2 + 0.003, 0);
      for (let i = 0; i < n; i++) B(g, 0.02, 0.5, 0.02, puxa, -w / 2 + (w / n) * i + (i === 0 ? w / n - 0.06 : 0.06), h / 2 - 0.25, d / 2 + 0.01, 0.004);
    } else {
      const n = Math.max(2, Math.round(w / 0.45));
      for (let i = 1; i < n; i++) B(g, 0.004, h - 0.04, 0.006, linha, -w / 2 + (w / n) * i, 0.02, d / 2 + 0.002, 0);
      for (let i = 0; i < n; i++) B(g, 0.015, 0.22, 0.02, puxa, -w / 2 + (w / n) * (i + (i % 2 ? 0.12 : 0.88)), h * 0.48, d / 2 + 0.01, 0.004);
    }
  },
  gaveteiro(g, { w, d, h, cor }, c) {
    const m = mat(cor === '#f1efea' ? 'laca' : 'madeira', cor), linha = mat('laca', '#8d877f'), puxa = mat('metal', '#2b2b2b');
    const top = c?.tampo ? 0.03 : 0;
    B(g, w, h - top, d, m, 0, 0, 0, 0.006);
    if (top) B(g, w + 0.01, top, d + 0.02, mat('granito'), 0, h - top, 0.01, 0.003);
    const n = Math.max(2, Math.round((h - top) / 0.22));
    for (let i = 1; i < n; i++) B(g, w - 0.02, 0.004, 0.006, linha, 0, ((h - top) / n) * i, d / 2 + 0.002, 0);
    for (let i = 0; i < n; i++) B(g, Math.min(0.2, w * 0.4), 0.015, 0.02, puxa, 0, ((h - top) / n) * (i + 0.7), d / 2 + 0.01, 0.004);
  },
  split(g, { w, d, h }) {
    B(g, w, h, d, mat('laca', '#f4f4f4'), 0, 0, 0, 0.05);
    B(g, w - 0.08, 0.025, 0.01, mat('laca', '#cfcfcf'), 0, 0.03, d / 2, 0.004);
  },
  geladeira(g, { w, d, h, cor }) {
    const m = mat('metal', cor), linha = mat('laca', '#2b2b2b');
    B(g, w, h, d, m, 0, 0, 0, 0.03);
    B(g, w - 0.01, 0.008, 0.01, linha, 0, h * 0.68, d / 2 + 0.001, 0);
    for (const [y0, hh] of [[h * 0.72, 0.30], [h * 0.30, 0.55]]) B(g, 0.025, hh, 0.035, mat('inox'), w / 2 - 0.06, y0, d / 2 + 0.02, 0.01);
  },
  fogao(g, { w, d, h, cor }) {
    const m = mat('laca', cor), preto = mat('laca', '#141414');
    B(g, w, h - 0.02, d, m, 0, 0, 0, 0.01);
    B(g, w, 0.02, d, preto, 0, h - 0.02, 0, 0.004);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, 0.045, 0.05, 0.03, mat('metal', '#3a3a3a'), sx * w * 0.24, h, sz * d * 0.22, 16);
    add(g, new THREE.PlaneGeometry(w - 0.1, h * 0.45), mat('tela'), 0, h * 0.42, d / 2 + 0.002);
    B(g, w - 0.08, 0.02, 0.03, mat('inox'), 0, h * 0.72, d / 2 + 0.015, 0.006);
  },
  aereo(g, { w, d, h, cor }) {
    const m = mat(cor === '#f1efea' ? 'laca' : 'madeira', cor), linha = mat('laca', '#8d877f');
    B(g, w, h, d, m, 0, 0, 0, 0.006);
    const n = Math.max(1, Math.round(w / 0.4));
    for (let i = 1; i < n; i++) B(g, 0.004, h - 0.02, 0.006, linha, -w / 2 + (w / n) * i, 0.01, d / 2 + 0.002, 0);
  },
  microondas(g, { w, d, h, cor }) {
    B(g, w, h, d, mat('laca', cor), 0, 0, 0, 0.01);
    add(g, new THREE.PlaneGeometry(w * 0.66, h * 0.7), mat('tela'), -w * 0.12, h / 2, d / 2 + 0.002);
  },
  mesa(g, { w, d, h, cor, cor2 }) {
    const m = mat(cor === '#f1efea' ? 'laca' : 'madeira', cor), p = mat(cor2 ? 'metal' : 'madeira', cor2 || cor);
    B(g, w, 0.03, d, m, 0, h - 0.03, 0, 0.01);
    pernas(g, w, d, h - 0.03, p, 0.06, 0.02);
  },
  cadeira(g, { w, d, h, cor }) {
    const m = mat('madeira', cor);
    pernas(g, w - 0.02, d - 0.04, 0.45, m, 0.03, 0.014);
    B(g, w, 0.04, d - 0.04, m, 0, 0.45, 0.02, 0.012);
    for (const s of [-1, 1]) B(g, 0.025, h - 0.45, 0.025, m, s * (w / 2 - 0.03), 0.45, -d / 2 + 0.03, 0.005);
    B(g, w - 0.04, 0.18, 0.025, m, 0, h - 0.22, -d / 2 + 0.03, 0.008);
  },
  banqueta(g, { w, h, cor }) {
    const m = mat('metal', cor), r = w / 2;
    cyl(g, r * 0.95, r * 0.95, 0.05, mat('madeira', '#a5774b'), 0, h - 0.05, 0, 24);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const leg = cyl(g, 0.012, 0.012, h - 0.05, m, Math.cos(a) * r * 0.7, 0, Math.sin(a) * r * 0.7, 8);
      leg.rotation.z = Math.cos(a) * 0.08; leg.rotation.x = -Math.sin(a) * 0.08;
    }
    const anel = new THREE.Mesh(new THREE.TorusGeometry(r * 0.72, 0.008, 6, 24), m); anel.rotation.x = Math.PI / 2; anel.position.y = h * 0.32; g.add(anel);
  },
  jantar(g, it) {
    const { w, d, h, cor, cor2 } = it;
    const td = Math.max(0.6, d - 0.6);
    builders.mesa(g, { w, d: td, h, cor, cor2: cor2 || '#2f2e2c' });
    const nl = w >= 0.9 ? 2 : 1;
    for (const s of [-1, 1]) for (let i = 0; i < nl; i++) {
      const c = new THREE.Group(); builders.cadeira(c, { w: 0.44, d: 0.48, h: 0.85, cor: cor2 || '#2f2e2c' });
      c.position.set(nl === 1 ? 0 : (i ? 1 : -1) * w / 4, 0, s * (td / 2 + 0.02));
      c.rotation.y = s > 0 ? Math.PI : 0; g.add(c);
    }
  },
  jantarRedonda(g, { w, d, h, cor, cor2 }) {
    const r = Math.max(0.35, Math.min(w, d) / 2 - 0.32);
    const t = new THREE.Group(); builders.mesaRedonda(t, { w: r * 2, d: r * 2, h, cor }); g.add(t);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const c = new THREE.Group(); builders.cadeira(c, { w: 0.44, d: 0.48, h: 0.85, cor: cor2 || '#c9a77c' });
      c.position.set(Math.sin(a) * (r + 0.05), 0, Math.cos(a) * (r + 0.05)); c.rotation.y = a + Math.PI; g.add(c);
    }
  },
  maquina(g, { w, d, h, cor }) {
    B(g, w, h, d, mat('laca', cor), 0, 0, 0, 0.02);
    const porta = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 10, 32), mat('metal', '#b9bcc0'));
    porta.position.set(0, h * 0.45, d / 2 + 0.01); g.add(porta);
    const vid = new THREE.Mesh(new THREE.CircleGeometry(0.15, 32), mat('tela')); vid.position.set(0, h * 0.45, d / 2 + 0.005); g.add(vid);
    B(g, w - 0.04, 0.1, 0.01, mat('laca', '#d9d9d9'), 0, h - 0.13, d / 2 + 0.001, 0.003);
  },
  varal(g, { w, d, h, cor }) {
    const m = mat('metal', cor);
    for (const sx of [-1, 1]) { const p = B(g, 0.02, h, d, m, sx * (w / 2 - 0.01), 0, 0, 0.004); p.scale.z = 0.05; }
    for (let i = 0; i < 6; i++) { const r = add(g, new THREE.CylinderGeometry(0.005, 0.005, w, 6), m, 0, h - 0.02, -d / 2 + (d / 5) * i); r.rotation.z = Math.PI / 2; }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, 0.03, 0.02, 0.03, m, sx * (w / 2 - 0.015), 0, sz * (d / 2 - 0.015), 0.004);
  },
  cadeiraEscritorio(g, { w, d, h, cor }) {
    const f = mat('tecido', cor), m = mat('metal', '#2b2b2b');
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      const arm = B(g, 0.03, 0.025, w / 2 - 0.04, m, Math.sin(a) * (w / 4 - 0.02), 0.06, Math.cos(a) * (w / 4 - 0.02), 0.006); arm.rotation.y = a;
    }
    cyl(g, 0.025, 0.025, 0.36, m, 0, 0.07, 0, 10);
    B(g, w - 0.08, 0.07, d - 0.12, f, 0, 0.43, 0.02, 0.03);
    const b = B(g, w - 0.14, h - 0.55, 0.05, f, 0, 0.55, -d / 2 + 0.08, 0.02); b.rotation.x = -0.08;
  },
  prateleira(g, { w, d, h, cor }) {
    B(g, w, h, d, mat('madeira', cor), 0, 0, 0, 0.004);
    for (let i = 0; i < 4; i++) B(g, 0.04, 0.18, 0.12, mat('laca', ['#7d8461', '#b46a4c', '#e8e3da', '#3f5f6b'][i]), -w / 3 + i * 0.05, h, 0, 0.004);
  },
  tapete(g, { w, d, h, cor }) { B(g, w, Math.max(h, 0.008), d, mat('tecido', cor), 0, 0, 0, 0.004).castShadow = false; },
  tapeteRedondo(g, { w, d, h, cor }) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w / 2, Math.max(h, 0.008), 48), mat('tecido', cor));
    m.scale.z = d / w; m.position.y = h / 2; m.receiveShadow = true; g.add(m);
  },
  planta(g, { w, h, cor }) {
    const r = w / 2, ph = Math.min(0.42, h * 0.32);
    cyl(g, r * 0.62, r * 0.46, ph, mat('laca', cor), 0, 0, 0, 28);
    cyl(g, r * 0.58, r * 0.58, 0.02, mat('default', '#3b2d22'), 0, ph - 0.03, 0, 24);
    const verdes = ['#3f6b38', '#52803f', '#2f5530', '#5f8a48'];
    const folha = new THREE.SphereGeometry(1, 10, 6);
    const n = Math.max(14, Math.round(h * 18));
    for (let i = 0; i < n; i++) {
      const t = i / n, a = i * 2.399;
      const alt = ph + (h - ph) * (0.15 + 0.85 * t);
      const raio = r * (0.25 + 0.75 * Math.sin(Math.PI * Math.min(1, t * 1.1)));
      const caule = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.006, alt - ph, 4), mat('folha', '#4a5b33'));
      caule.position.set(Math.cos(a) * raio * 0.4, ph + (alt - ph) / 2, Math.sin(a) * raio * 0.4); caule.rotation.z = Math.cos(a) * 0.25; caule.rotation.x = -Math.sin(a) * 0.25;
      g.add(caule);
      const f = new THREE.Mesh(folha, mat('default', verdes[i % verdes.length]));
      f.material.roughness = 0.6;
      f.scale.set(0.11 + (i % 3) * 0.02, 0.012, 0.045);
      f.position.set(Math.cos(a) * raio, alt, Math.sin(a) * raio);
      f.rotation.set(0.35 * Math.sin(i), -a, -0.45 - 0.3 * t);
      f.castShadow = true; g.add(f);
    }
  },
  luminaria(g, { w, h, cor }) {
    const m = mat('metal', cor);
    cyl(g, w * 0.4, w * 0.45, 0.025, m, 0, 0, 0, 24);
    cyl(g, 0.012, 0.012, h - 0.28, m, 0, 0.02, 0, 8);
    cyl(g, w * 0.32, w * 0.5, 0.28, lampMat(g), 0, h - 0.28, 0, 24).castShadow = false;
  },
  quadro(g, { w, d, h, cor }) {
    B(g, w, h, d, mat('laca', '#2b2723'), 0, 0, 0, 0.003);
    add(g, new THREE.PlaneGeometry(w - 0.06, h - 0.06), mat('quadro', cor), 0, h / 2, d / 2 + 0.001);
  },
  espelho(g, { w, d, h, cor }) {
    B(g, w, h, d, mat('metal', cor), 0, 0, 0, 0.01);
    add(g, new THREE.PlaneGeometry(w - 0.03, h - 0.03), mat('espelho'), 0, h / 2, d / 2 + 0.002);
  },
  cortina(g, { w, d, h, cor }) {
    const geo = new THREE.PlaneGeometry(w, h, Math.max(8, Math.round(w * 30)), 1);
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 28) * (d / 2 - 0.01));
    geo.computeVertexNormals();
    const m = new THREE.MeshStandardMaterial({ color: cor, roughness: 1, side: THREE.DoubleSide, map: texTecido(), transparent: true, opacity: 0.93 });
    add(g, geo, m, 0, h / 2, 0);
    const trilho = add(g, new THREE.CylinderGeometry(0.01, 0.01, w + 0.1, 8), mat('metal', '#e9e9e9'), 0, h + 0.02, 0); trilho.rotation.z = Math.PI / 2;
  },

  // ---------------------------------------------------------------- iluminação
  // Luminárias de teto: a origem fica na base da peça (ponto mais baixo); o topo encosta no forro.
  plafon(g, { w, h, cor }) {
    cyl(g, w / 2, w / 2, h, mat('laca', cor), 0, 0.006, 0, 36);
    disco(g, w / 2 - 0.025, 0.012, lampMat(g), 0, 0, 0).castShadow = false;
  },
  plafonQuad(g, { w, d, h, cor }) {
    B(g, w, h, d, mat('laca', cor), 0, 0.006, 0, 0.012);
    B(g, w - 0.05, 0.012, d - 0.05, lampMat(g), 0, 0, 0, 0.002).castShadow = false;
  },
  painelLed(g, { w, d, h, cor }) {
    B(g, w, h, d, mat('laca', cor), 0, 0.01, 0, 0.004);
    B(g, w - 0.04, 0.012, d - 0.04, lampMat(g), 0, 0, 0, 0.001).castShadow = false;
  },
  spot(g, { w, h, cor }) {
    cyl(g, w / 2, w / 2, 0.012, mat('metal', cor), 0, h - 0.012, 0, 24);
    disco(g, w / 2 - 0.018, 0.012, lampMat(g), 0, h - 0.02, 0).castShadow = false;
  },
  kitSpots(g, { w, d, h, cor }) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const sp = new THREE.Group(); builders.spot(sp, { w: 0.10, h, cor });
      sp.position.set(sx * w * 0.36, 0, sz * d * 0.36); g.add(sp);
    }
  },
  trilho(g, { w, d, h, cor }) {
    const m = mat('metal', cor);
    B(g, w, 0.025, d, m, 0, h - 0.025, 0, 0.004);
    const n = 3;
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + w * ((i + 0.5) / n);
      const sp = new THREE.Group();
      cyl(sp, 0.012, 0.012, 0.05, m, 0, 0, 0, 10);
      const cab = cyl(sp, 0.04, 0.034, 0.09, m, 0, -0.08, 0, 18);
      disco(sp, 0.032, 0.008, lampMat(g), 0, -0.083, 0).castShadow = false;
      sp.position.set(x, h - 0.03, 0); sp.rotation.x = 0.35 * (i % 2 ? -1 : 1) + 0.15; sp.rotation.z = (i - 1) * 0.25;
      void cab; g.add(sp);
    }
  },
  lustreCristal(g, { w, h, cor }) {
    const m = mat('metal', cor), vidro = new THREE.MeshStandardMaterial({ color: '#f4f8fb', roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.55 });
    cyl(g, 0.07, 0.07, 0.025, m, 0, h - 0.025, 0, 24);
    cyl(g, 0.012, 0.012, h * 0.62, m, 0, h * 0.40, 0, 8);
    const aro = (r, y) => { const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.008, 6, 40), m); t.rotation.x = Math.PI / 2; t.position.y = y; t.castShadow = true; g.add(t); };
    aro(w * 0.46, h * 0.46); aro(w * 0.30, h * 0.30);
    const nVel = 8;
    for (let i = 0; i < nVel; i++) {
      const a = (i / nVel) * Math.PI * 2, r = w * 0.46;
      cyl(g, 0.012, 0.012, 0.07, mat('laca', '#f6f1e6'), Math.cos(a) * r, h * 0.46, Math.sin(a) * r, 8);
      const ch = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), lampMat(g)); ch.scale.y = 1.5; ch.position.set(Math.cos(a) * r, h * 0.46 + 0.085, Math.sin(a) * r); g.add(ch);
      const braco = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, r, 5), m); braco.rotation.z = Math.PI / 2; braco.rotation.y = -a;
      braco.position.set(Math.cos(a) * r / 2, h * 0.47, Math.sin(a) * r / 2); g.add(braco);
    }
    const cri = new THREE.OctahedronGeometry(0.018, 0);
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2, r = w * (i % 2 ? 0.46 : 0.30), y0 = h * (i % 2 ? 0.46 : 0.30);
      const dr = 0.05 + (i % 3) * 0.04;
      const c = new THREE.Mesh(cri, vidro); c.scale.set(1, 1.8, 1); c.position.set(Math.cos(a) * r, y0 - dr, Math.sin(a) * r); g.add(c);
      cyl(g, 0.0012, 0.0012, dr, mat('metal', '#d6d6d6'), Math.cos(a) * r, y0 - dr, Math.sin(a) * r, 3);
    }
    const bola = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 10), vidro); bola.position.y = h * 0.12; g.add(bola);
  },
  lustreAros(g, { w, h, cor }) {
    const m = mat('metal', cor);
    cyl(g, 0.06, 0.06, 0.02, m, 0, h - 0.02, 0, 20);
    const aneis = [[w * 0.48, h * 0.18], [w * 0.36, h * 0.38], [w * 0.24, h * 0.58]];
    for (const [r, y] of aneis) {
      const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.014, 8, 48), lampMat(g)); t.rotation.x = Math.PI / 2; t.position.y = y; g.add(t);
      for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + y * 3; cyl(g, 0.0025, 0.0025, h - y - 0.02, m, Math.cos(a) * r * 0.995, y, Math.sin(a) * r * 0.995, 4); }
    }
  },
  pendente(g, { w, h, cor }) {
    const m = mat('metal', cor), sh = Math.min(0.30, w * 0.8), r = w / 2;
    cyl(g, 0.04, 0.04, 0.02, m, 0, h - 0.02, 0, 16);
    cyl(g, 0.003, 0.003, h - sh, m, 0, sh, 0, 6);
    const cup = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: cor, roughness: 0.3, metalness: 0.7, side: THREE.DoubleSide }));
    cup.scale.y = sh / r; cup.position.y = 0.02; cup.castShadow = true; g.add(cup);
    cyl(g, 0.02, 0.02, 0.03, m, 0, sh, 0, 12);
    const bulbo = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 10), lampMat(g)); bulbo.position.y = 0.10; g.add(bulbo);
    disco(g, r * 0.92, 0.004, lampMat(g, '#ffe9c4'), 0, 0.012, 0).castShadow = false;
  },
  pendenteTrio(g, { w, d, h, cor }) {
    const m = mat('metal', cor);
    B(g, w, 0.02, Math.max(d * 0.6, 0.06), m, 0, h - 0.02, 0, 0.004);
    const comp = [1, 0.75, 0.52];
    comp.forEach((k, i) => {
      const sub = new THREE.Group();
      builders.pendente(sub, { w: 0.20, h: h * k, cor });
      cyl(sub, 0.0, 0.0, 0.001, m, 0, 0, 0, 3);
      sub.position.set(-w / 2 + (w / 3) * (i + 0.5), h - h * k, 0);
      g.add(sub);
    });
  },
  pendenteGlobo(g, { w, h, cor }) {
    const m = mat('metal', cor), r = w / 2;
    cyl(g, 0.04, 0.04, 0.02, m, 0, h - 0.02, 0, 16);
    cyl(g, 0.003, 0.003, h - r * 2, m, 0, r * 2, 0, 6);
    const globo = new THREE.Mesh(new THREE.SphereGeometry(r, 28, 20), lampMat(g, '#fbf6ec')); globo.position.y = r; g.add(globo);
  },
  arandela(g, { w, d, h, cor }) {
    const m = mat('metal', cor);
    B(g, w, h, 0.02, m, 0, 0, -d / 2 + 0.01, 0.006);
    const cab = new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w / 2, h * 0.8, 20, 1, false, -Math.PI / 2, Math.PI), m);
    cab.rotation.x = 0; cab.position.set(0, h / 2, -d / 2 + 0.02); cab.rotation.y = 0; cab.castShadow = true; g.add(cab);
    for (const sy of [-1, 1]) { const e = disco(g, w / 2 - 0.012, 0.006, lampMat(g), 0, h / 2 + sy * h * 0.40, -d / 2 + 0.02); e.castShadow = false; }
    B(g, w * 0.6, h * 0.55, d * 0.55, lampMat(g), 0, h * 0.22, -d / 2 + 0.05, 0.01).castShadow = false;
  },
  abajur(g, { w, h, cor }) {
    const base = mat('ceramica'), ab = lampMat(g, cor);
    cyl(g, w * 0.22, w * 0.28, h * 0.30, base, 0, 0, 0, 24);
    cyl(g, 0.01, 0.01, h * 0.30, mat('metal', '#b9bcc0'), 0, h * 0.28, 0, 8);
    const cupula = cyl(g, w * 0.36, w * 0.5, h * 0.42, ab, 0, h * 0.50, 0, 28); cupula.castShadow = false;
  },
  luminariaMesa(g, { w, d, h, cor }) {
    const m = mat('metal', cor);
    cyl(g, 0.08, 0.09, 0.025, m, 0, 0, 0, 20);
    const b1 = B(g, 0.014, h * 0.55, 0.014, m, 0, 0.02, 0, 0.003); b1.rotation.z = 0.35; b1.position.set(0.06, 0.02 + h * 0.24, 0);
    const b2 = B(g, 0.014, h * 0.55, 0.014, m, 0, 0.02, 0, 0.003); b2.rotation.z = -0.9; b2.position.set(0.13, h * 0.66, 0);
    const cab = cyl(g, 0.05, 0.075, 0.09, m, 0, h - 0.12, 0, 20); cab.position.x = 0.02; cab.rotation.z = 0.25;
    disco(g, 0.068, 0.006, lampMat(g), 0.012, h - 0.17, 0).castShadow = false;
    void w; void d;
  },
  espelhoRedondo(g, { w, d, h, cor }) {
    const r = Math.min(w, h) / 2;
    const fr = new THREE.Mesh(new THREE.TorusGeometry(r - 0.012, 0.015, 8, 48), mat('madeira', cor)); fr.position.set(0, h / 2, d / 2); fr.castShadow = true; g.add(fr);
    const esp = new THREE.Mesh(new THREE.CircleGeometry(r - 0.012, 48), mat('espelho')); esp.position.set(0, h / 2, d / 2 - 0.008); g.add(esp);
    const fundo = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.01, 40), mat('laca', '#2b2723')); fundo.rotation.x = Math.PI / 2; fundo.position.set(0, h / 2, -d / 2 + 0.005); g.add(fundo);
  },
  nicho(g, { w, d, h, cor }) {
    const m = mat(cor === '#f1efea' ? 'laca' : 'madeira', cor), t = 0.02;
    B(g, w, t, d, m, 0, 0, 0, 0.002); B(g, w, t, d, m, 0, h - t, 0, 0.002);
    for (const s of [-1, 1]) B(g, t, h, d, m, s * (w / 2 - t / 2), 0, 0, 0.002);
    B(g, w, h, 0.008, mat('laca', '#dcd8d0'), 0, 0, -d / 2 + 0.004, 0);
    B(g, 0.06, 0.12, 0.05, mat('laca', '#7d8461'), -w / 4, t, 0, 0.003);
  },
  quadroTrio(g, { w, d, h, cor }) {
    const pw = (w - 0.1) / 3, cores = [cor, '#3f5f6b', '#d1a54a'];
    cores.forEach((c, i) => {
      const q = new THREE.Group(); builders.quadro(q, { w: pw, d, h: i === 1 ? h : h * 0.82, cor: c });
      q.position.set(-w / 2 + pw / 2 + i * (pw + 0.05), i === 1 ? 0 : h * 0.09, 0); g.add(q);
    });
  },
  puff(g, { w, d, h, cor }) {
    const f = mat('tecido', cor);
    const corpo = cyl(g, w / 2, w / 2 * 0.95, h * 0.82, f, 0, 0.02, 0, 32); corpo.scale.z = d / w;
    const topo = new THREE.Mesh(new THREE.SphereGeometry(w / 2, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), f); topo.scale.set(1, h * 0.22 / (w / 2), d / w); topo.position.y = h * 0.82 + 0.02; topo.castShadow = true; g.add(topo);
    for (const sx of [-1, 1]) cyl(g, 0.015, 0.012, 0.04, mat('madeira', '#3b2a1e'), sx * w * 0.3, 0, 0, 8);
  },
  vasoDeco(g, { w, h, cor }) {
    const r = w / 2, pts = [[0.0, 0], [r * 0.55, 0], [r * 0.9, h * 0.12], [r, h * 0.38], [r * 0.82, h * 0.62], [r * 0.4, h * 0.82], [r * 0.34, h * 0.93], [r * 0.46, h]].map(([x, y]) => new THREE.Vector2(x, y));
    const v = new THREE.Mesh(new THREE.LatheGeometry(pts, 32), new THREE.MeshStandardMaterial({ color: cor, roughness: 0.35, side: THREE.DoubleSide })); v.castShadow = true; g.add(v);
    for (let i = 0; i < 3; i++) {
      const gal = cyl(g, 0.004, 0.004, h * 0.55, mat('folha', '#6b7a48'), (i - 1) * 0.03, h * 0.9, 0, 4);
      gal.rotation.z = (i - 1) * 0.28; gal.position.y = h * 0.9 + h * 0.2;
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), mat('folha', '#7d8f55')); f.scale.set(1, 0.35, 0.6); f.position.set((i - 1) * 0.1, h + h * 0.42, 0); g.add(f);
    }
  },
  cesto(g, { w, d, h, cor }) {
    const m = new THREE.MeshStandardMaterial({ color: cor, roughness: 0.9, map: texMadeira(), side: THREE.DoubleSide });
    const c = new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w * 0.42, h, 32, 1, true), m); c.scale.z = d / w; c.position.y = h / 2; c.castShadow = true; g.add(c);
    const base = cyl(g, w * 0.42, w * 0.42, 0.02, m, 0, 0, 0, 28); base.scale.z = d / w;
    const aro = new THREE.Mesh(new THREE.TorusGeometry(w / 2, 0.012, 6, 36), m); aro.rotation.x = Math.PI / 2; aro.scale.y = d / w; aro.position.y = h; g.add(aro);
  },
  caixa(g, { w, d, h, cor }) { B(g, w, h, d, mat('madeira', cor), 0, 0, 0, 0.008); },
};

// ---------------------------------------------------------------- elementos fixos
const fixBuilders = {
  bancada(g, { w, d, h }) {
    const gr = mat('granito');
    B(g, w, 0.03, d, gr, 0, h - 0.03, 0, 0.003);
    B(g, w, 0.10, 0.02, gr, 0, h, -d / 2 + 0.01, 0.003);
    const cuba = B(g, 0.50, 0.012, 0.36, mat('inox'), -w * 0.12, h - 0.005, 0.02, 0.01);
    cuba.scale.y = 1;
    cyl(g, 0.012, 0.014, 0.30, mat('inox'), -w * 0.12, h, -d / 2 + 0.07, 10);
    const bico = B(g, 0.02, 0.02, 0.20, mat('inox'), -w * 0.12, h + 0.28, -d / 2 + 0.16, 0.008);
    bico.rotation.x = 0.1;
    // armário sob a pia (sugestão; a construtora entrega só a bancada)
    B(g, 0.03, h - 0.03, d - 0.05, mat('laca', '#d8d4cc'), w / 2 - 0.015, 0, 0, 0.004);
  },
  tanque(g, { w, d, h }) {
    const c = mat('ceramica');
    B(g, w, 0.28, d, c, 0, h - 0.28, 0, 0.03);
    B(g, 0.10, h - 0.28, 0.12, c, 0, 0, -d / 2 + 0.1, 0.02);
    cyl(g, 0.012, 0.014, 0.22, mat('inox'), 0, h, -d / 2 + 0.05, 10);
  },
  vaso(g, { w, d }) {
    const c = mat('ceramica');
    B(g, w, 0.36, 0.18, c, 0, 0.42, -d / 2 + 0.09, 0.04);
    const bowl = cyl(g, w / 2, w * 0.36, 0.40, c, 0, 0, 0.08, 28); bowl.scale.z = 1.35;
    const tampa = cyl(g, w / 2 + 0.005, w / 2 + 0.005, 0.025, mat('ceramica'), 0, 0.40, 0.08, 28); tampa.scale.z = 1.35;
  },
  lavatorio(g, { w, d, h }) {
    const c = mat('ceramica');
    B(g, w, 0.16, d, c, 0, h - 0.16, 0, 0.05);
    B(g, 0.16, h - 0.16, 0.16, c, 0, 0, -d / 2 + 0.1, 0.04);
    cyl(g, 0.01, 0.012, 0.16, mat('inox'), 0, h, -d / 2 + 0.05, 10);
  },
  box(g, { w, d }, peDireito) {
    const v = mat('vidro');
    const p = add(g, new THREE.BoxGeometry(w * 0.98, 1.90, 0.008), v, 0, 0.95, d / 2);
    p.castShadow = false;
    B(g, w * 0.98, 0.02, 0.025, mat('metal', '#b9bcc0'), 0, 1.90, d / 2, 0.003);
    cyl(g, 0.012, 0.012, 0.012, mat('metal', '#3a3a3a'), 0, 0, 0, 16);
    const ch = cyl(g, 0.08, 0.08, 0.02, mat('inox'), 0, 2.10, -d / 2 + 0.28, 24); ch.castShadow = false;
    B(g, 0.02, 0.02, 0.28, mat('inox'), 0, 2.13, -d / 2 + 0.14, 0.005);
    void peDireito;
  },
};

export function buildFurniture(it, catalogo) {
  const g = new THREE.Group();
  const fn = builders[catalogo?.modelo] || builders.caixa;
  fn(g, it, catalogo);
  return g;
}
export function buildFixture(f, peDireito) {
  const g = new THREE.Group();
  (fixBuilders[f.tipo] || builders.caixa)(g, f, peDireito);
  return g;
}
