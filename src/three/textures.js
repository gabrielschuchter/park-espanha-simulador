// Texturas procedurais (canvas), sem arquivos externos.
import * as THREE from 'three';
import { DESENHOS } from '../tex/draw.js';

const cache = new Map();
function canvasTex(key, size, draw, repeat = [1, 1]) {
  if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  draw(g, size);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.repeat.set(...repeat);
  cache.set(key, t);
  return t;
}
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// Porcelanato 60×60 (textura cobre 1,20 m = 2×2 peças)
export function texCeramico(cor = '#d9d4cc') {
  return canvasTex('cer' + cor, 512, (g, s) => {
    const r = rng(7);
    g.fillStyle = cor; g.fillRect(0, 0, s, s);
    const n = 2, p = s / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const v = (r() - 0.5) * 10;
      g.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 120})`;
      g.fillRect(i * p, j * p, p, p);
      for (let k = 0; k < 260; k++) {
        g.fillStyle = `rgba(90,80,70,${r() * 0.05})`;
        g.fillRect(i * p + r() * p, j * p + r() * p, 1 + r() * 3, 1 + r() * 3);
      }
    }
    g.strokeStyle = 'rgba(120,110,100,0.55)'; g.lineWidth = 2;
    for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * p, 0); g.lineTo(i * p, s); g.stroke(); g.beginPath(); g.moveTo(0, i * p); g.lineTo(s, i * p); g.stroke(); }
  });
}

// Piso laminado: réguas de 19 cm (textura cobre 1,20 m)
export function texLaminado(base = '#b8916a') {
  return canvasTex('lam' + base, 1024, (g, s) => {
    const r = rng(21);
    const fileiras = 6, h = s / fileiras;
    const c = new THREE.Color(base);
    for (let j = 0; j < fileiras; j++) {
      let x = -r() * s * 0.6;
      while (x < s) {
        const len = s * (0.45 + r() * 0.5);
        const tint = c.clone().offsetHSL((r() - 0.5) * 0.02, (r() - 0.5) * 0.06, (r() - 0.5) * 0.08);
        g.fillStyle = '#' + tint.getHexString();
        g.fillRect(x, j * h, len, h);
        for (let k = 0; k < 40; k++) {
          const y = j * h + r() * h;
          g.strokeStyle = `rgba(60,35,15,${0.04 + r() * 0.08})`;
          g.lineWidth = 0.6 + r() * 1.6;
          g.beginPath(); g.moveTo(x, y);
          g.bezierCurveTo(x + len * 0.3, y + (r() - 0.5) * 6, x + len * 0.6, y + (r() - 0.5) * 6, x + len, y + (r() - 0.5) * 4);
          g.stroke();
        }
        g.fillStyle = 'rgba(40,25,10,0.45)'; g.fillRect(x, j * h, 1.5, h);
        x += len;
      }
      g.fillStyle = 'rgba(40,25,10,0.35)'; g.fillRect(0, j * h, s, 1.5);
    }
  });
}

// Revestimento de parede 30×60 branco acetinado (textura cobre 1,20 × 1,20 m)
export function texAzulejo(cor = '#eeece8') {
  return canvasTex('azu' + cor, 512, (g, s) => {
    g.fillStyle = cor; g.fillRect(0, 0, s, s);
    const cols = 2, rows = 4, w = s / cols, h = s / rows;
    g.strokeStyle = 'rgba(150,145,140,0.6)'; g.lineWidth = 2;
    for (let j = 0; j < rows; j++) for (let i = 0; i <= cols; i++) {
      const off = (j % 2) * w / 2;
      g.beginPath(); g.moveTo(i * w + off, j * h); g.lineTo(i * w + off, (j + 1) * h); g.stroke();
    }
    for (let j = 0; j <= rows; j++) { g.beginPath(); g.moveTo(0, j * h); g.lineTo(s, j * h); g.stroke(); }
  });
}

export function texTecido() {
  return canvasTex('tec', 256, (g, s) => {
    const r = rng(3);
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, s, s);
    for (let i = 0; i < s; i += 2) {
      g.fillStyle = `rgba(0,0,0,${0.03 + r() * 0.03})`; g.fillRect(i, 0, 1, s);
      g.fillStyle = `rgba(0,0,0,${0.02 + r() * 0.03})`; g.fillRect(0, i, s, 1);
    }
  }, [6, 6]);
}

export function texMadeira() {
  return canvasTex('mad', 512, (g, s) => {
    const r = rng(11);
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, s, s);
    for (let k = 0; k < 120; k++) {
      const y = r() * s;
      g.strokeStyle = `rgba(80,50,20,${0.05 + r() * 0.1})`; g.lineWidth = 0.5 + r() * 2;
      g.beginPath(); g.moveTo(0, y);
      g.bezierCurveTo(s * 0.3, y + (r() - 0.5) * 20, s * 0.7, y + (r() - 0.5) * 20, s, y + (r() - 0.5) * 8);
      g.stroke();
    }
  });
}

export function texGranito() {
  return canvasTex('gra', 512, (g, s) => {
    const r = rng(5);
    g.fillStyle = '#3d3a37'; g.fillRect(0, 0, s, s);
    for (let k = 0; k < 9000; k++) {
      const c = r();
      g.fillStyle = c < 0.5 ? `rgba(20,18,16,${r()})` : c < 0.85 ? `rgba(120,112,104,${r() * 0.8})` : `rgba(200,190,180,${r() * 0.7})`;
      g.fillRect(r() * s, r() * s, 1 + r() * 3, 1 + r() * 3);
    }
  });
}

export function texCeu() {
  const c = document.createElement('canvas'); c.width = 4; c.height = 512;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, '#8fb3d6'); gr.addColorStop(0.48, '#cfe0ec'); gr.addColorStop(0.52, '#dfe3dd'); gr.addColorStop(1, '#b9bdb0');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.mapping = THREE.EquirectangularReflectionMapping;
  return t;
}

export function texQuadro(cor) {
  return canvasTex('qua' + cor, 256, (g, s) => {
    g.fillStyle = '#f2ede4'; g.fillRect(0, 0, s, s);
    g.fillStyle = cor; g.beginPath(); g.arc(s * 0.42, s * 0.55, s * 0.26, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#2f3b38'; g.fillRect(s * 0.55, s * 0.2, s * 0.08, s * 0.62);
    g.fillStyle = 'rgba(180,106,76,.85)'; g.fillRect(s * 0.18, s * 0.78, s * 0.6, s * 0.05);
  });
}

// Textura de acabamento do catálogo (pisos e revestimentos). A repetição é definida por quem usa.
export function texAcab(def) {
  return canvasTex('acab-' + def.id, 512, (g, s) => (DESENHOS[def.draw] || DESENHOS.cimento)(g, s, def.args || {}));
}
