// Desenhos procedurais (canvas 2D puro, sem Three.js). Usados nas texturas 3D e nas miniaturas
// dos painéis. Cada função recebe (g, s, args): contexto 2D, lado em pixels, parâmetros.

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

function hexToRgb(h) {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(h, k) {
  const [r, g, b] = hexToRgb(h);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + k * 255)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

export const DESENHOS = {
  // Porcelanato quadrado: n peças por lado
  ceramico(g, s, { cor = '#d9d4cc', n = 2, junta = 'rgba(120,110,100,0.55)', brilho = 10 } = {}) {
    const r = rng(7);
    g.fillStyle = cor; g.fillRect(0, 0, s, s);
    const p = s / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const v = (r() - 0.5) * brilho;
      g.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 120})`;
      g.fillRect(i * p, j * p, p, p);
      for (let k = 0; k < 260 / n; k++) {
        g.fillStyle = `rgba(90,80,70,${r() * 0.05})`;
        g.fillRect(i * p + r() * p, j * p + r() * p, 1 + r() * 3, 1 + r() * 3);
      }
    }
    g.strokeStyle = junta; g.lineWidth = Math.max(1.2, 3 / n);
    for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * p, 0); g.lineTo(i * p, s); g.stroke(); g.beginPath(); g.moveTo(0, i * p); g.lineTo(s, i * p); g.stroke(); }
  },

  marmore(g, s, { cor = '#ecebe8', veio = '110,112,118', n = 1 } = {}) {
    const r = rng(33);
    g.fillStyle = cor; g.fillRect(0, 0, s, s);
    for (let k = 0; k < 260; k++) {
      const a = r() * s, b = r() * s;
      g.fillStyle = `rgba(${veio},${r() * 0.035})`;
      g.beginPath(); g.arc(a, b, 10 + r() * 60, 0, 7); g.fill();
    }
    for (let k = 0; k < 14; k++) {
      let x = r() * s, y = r() * s, a = r() * 6.28;
      g.strokeStyle = `rgba(${veio},${0.10 + r() * 0.22})`; g.lineWidth = 0.6 + r() * 1.8;
      g.beginPath(); g.moveTo(x, y);
      for (let t = 0; t < 14; t++) { a += (r() - 0.5) * 1.2; x += Math.cos(a) * 30; y += Math.sin(a) * 30; g.lineTo(x, y); }
      g.stroke();
    }
    g.strokeStyle = 'rgba(120,115,110,0.5)'; g.lineWidth = 2;
    const p = s / n;
    for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * p, 0); g.lineTo(i * p, s); g.stroke(); g.beginPath(); g.moveTo(0, i * p); g.lineTo(s, i * p); g.stroke(); }
  },

  // Réguas de madeira: fileiras e comprimento
  laminado(g, s, { base = '#b8916a', fileiras = 6, grao = 1 } = {}) {
    const r = rng(21);
    const h = s / fileiras;
    for (let j = 0; j < fileiras; j++) {
      let x = -r() * s * 0.6;
      while (x < s) {
        const len = s * (0.45 + r() * 0.5);
        const [R, G, B] = hexToRgb(base), d = (r() - 0.5) * 22;
        g.fillStyle = `rgb(${Math.max(0, Math.min(255, R + d))},${Math.max(0, Math.min(255, G + d * 0.9))},${Math.max(0, Math.min(255, B + d * 0.8))})`;
        g.fillRect(x, j * h, len, h);
        for (let k = 0; k < 40 * grao; k++) {
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
  },

  // Parquê quadriculado (blocos de 3 réguas alternando a direção)
  parque(g, s, { base = '#a5774b' } = {}) {
    const r = rng(5);
    const n = 4, b = s / n, rg = 3;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const horiz = (i + j) % 2 === 0;
      for (let k = 0; k < rg; k++) {
        const d = (r() - 0.5) * 26, [R, G, B] = hexToRgb(base);
        g.fillStyle = `rgb(${Math.max(0, Math.min(255, R + d))},${Math.max(0, Math.min(255, G + d * 0.9))},${Math.max(0, Math.min(255, B + d * 0.8))})`;
        if (horiz) g.fillRect(i * b, j * b + (b / rg) * k, b, b / rg); else g.fillRect(i * b + (b / rg) * k, j * b, b / rg, b);
        g.strokeStyle = 'rgba(40,25,10,0.45)'; g.lineWidth = 1.5;
        if (horiz) g.strokeRect(i * b, j * b + (b / rg) * k, b, b / rg); else g.strokeRect(i * b + (b / rg) * k, j * b, b / rg, b);
        for (let q = 0; q < 9; q++) {
          g.strokeStyle = `rgba(60,35,15,${0.05 + r() * 0.08})`; g.lineWidth = 0.8;
          const t = r();
          g.beginPath();
          if (horiz) { g.moveTo(i * b, j * b + (b / rg) * (k + t)); g.lineTo(i * b + b, j * b + (b / rg) * (k + t) + (r() - 0.5) * 3); }
          else { g.moveTo(i * b + (b / rg) * (k + t), j * b); g.lineTo(i * b + (b / rg) * (k + t) + (r() - 0.5) * 3, j * b + b); }
          g.stroke();
        }
      }
    }
  },

  cimento(g, s, { cor = '#a8a8a4' } = {}) {
    const r = rng(9);
    g.fillStyle = cor; g.fillRect(0, 0, s, s);
    for (let k = 0; k < 70; k++) {
      const x = r() * s, y = r() * s, rad = 30 + r() * 120;
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      const c = r() > 0.5 ? '255,255,255' : '40,40,40';
      gr.addColorStop(0, `rgba(${c},${0.05 + r() * 0.06})`); gr.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    for (let k = 0; k < 9000; k++) {
      g.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '30,30,30'},${r() * 0.07})`;
      g.fillRect(r() * s, r() * s, 1 + r() * 2, 1 + r() * 2);
    }
  },

  hexagonal(g, s, { c1 = '#d8cbb4', c2 = '#b9a98c', junta = 'rgba(70,60,50,0.55)', alterna = true } = {}) {
    const r = rng(13);
    const n = 7, m = 8, w = s / n, rh = s / m, R = rh / 1.5;
    g.fillStyle = junta; g.fillRect(0, 0, s, s);
    for (let j = -1; j <= m; j++) for (let i = -1; i <= n; i++) {
      const cx = i * w + (j % 2 ? w / 2 : 0) + w / 2, cy = j * rh + rh / 2;
      const hex = [[0, -R], [w / 2, -R / 2], [w / 2, R / 2], [0, R], [-w / 2, R / 2], [-w / 2, -R / 2]];
      g.beginPath();
      hex.forEach(([x, y], q) => { const px = cx + x * 0.94, py = cy + y * 0.94; if (q) g.lineTo(px, py); else g.moveTo(px, py); });
      g.closePath();
      const base = alterna && (i + j * 2) % 3 === 0 ? c2 : c1;
      g.fillStyle = mix(base, (r() - 0.5) * 0.05); g.fill();
    }
  },

  xadrez(g, s, { c1 = '#f1efea', c2 = '#2b2b2b', n = 2 } = {}) {
    const p = s / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = (i + j) % 2 ? c2 : c1; g.fillRect(i * p, j * p, p, p); }
    g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1.5;
    for (let i = 0; i <= n; i++) { g.beginPath(); g.moveTo(i * p, 0); g.lineTo(i * p, s); g.stroke(); g.beginPath(); g.moveTo(0, i * p); g.lineTo(s, i * p); g.stroke(); }
  },

  // Revestimento retangular (30×60 ou metrô 7,5×15)
  azulejo(g, s, { cor = '#eeece8', cols = 2, rows = 4, junta = 'rgba(150,145,140,0.6)', desencontro = true, brilho = 0.04 } = {}) {
    const r = rng(17);
    g.fillStyle = junta; g.fillRect(0, 0, s, s);
    const w = s / cols, h = s / rows;
    for (let j = 0; j < rows; j++) for (let i = -1; i <= cols; i++) {
      const off = desencontro ? (j % 2) * w / 2 : 0;
      g.fillStyle = mix(cor, (r() - 0.5) * brilho * 2);
      g.fillRect(i * w + off + 1.2, j * h + 1.2, w - 2.4, h - 2.4);
      const gr = g.createLinearGradient(0, j * h, 0, (j + 1) * h);
      gr.addColorStop(0, 'rgba(255,255,255,0.18)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.07)');
      g.fillStyle = gr; g.fillRect(i * w + off + 1.2, j * h + 1.2, w - 2.4, h - 2.4);
    }
  },

  tijolo(g, s, { cor = '#e9e5de', rejunte = '#cfc9be', cols = 4, rows = 16, variacao = 0.04 } = {}) {
    const r = rng(41);
    g.fillStyle = rejunte; g.fillRect(0, 0, s, s);
    const w = s / cols, h = s / rows;
    for (let j = 0; j < rows; j++) for (let i = -1; i <= cols; i++) {
      const off = (j % 2) * w / 2;
      g.fillStyle = mix(cor, (r() - 0.5) * variacao * 2);
      g.fillRect(i * w + off + 2, j * h + 2, w - 4, h - 4);
      for (let k = 0; k < 14; k++) { g.fillStyle = `rgba(0,0,0,${r() * 0.05})`; g.fillRect(i * w + off + 2 + r() * (w - 4), j * h + 2 + r() * (h - 4), 1 + r() * 4, 1 + r() * 2); }
      g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(i * w + off + 2, j * h + 2, w - 4, 2);
    }
  },

  ripado(g, s, { base = '#a5774b', fundo = '#2a2420', ripas = 16 } = {}) {
    const r = rng(23);
    g.fillStyle = fundo; g.fillRect(0, 0, s, s);
    const p = s / ripas;
    for (let i = 0; i < ripas; i++) {
      const d = (r() - 0.5) * 0.05;
      g.fillStyle = mix(base, d); g.fillRect(i * p + p * 0.14, 0, p * 0.72, s);
      for (let k = 0; k < 16; k++) {
        const x = i * p + p * (0.18 + r() * 0.64);
        g.strokeStyle = `rgba(50,30,10,${0.06 + r() * 0.1})`; g.lineWidth = 0.7;
        g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 2, s * 0.3, x - 2, s * 0.6, x + 1, s); g.stroke();
      }
      g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(i * p + p * 0.14, 0, 2, s);
    }
  },

  madeiraPainel(g, s, { base = '#a5774b', tabuas = 5 } = {}) {
    const r = rng(29);
    const h = s / tabuas;
    for (let j = 0; j < tabuas; j++) {
      g.fillStyle = mix(base, (r() - 0.5) * 0.06); g.fillRect(0, j * h, s, h);
      for (let k = 0; k < 30; k++) {
        const y = j * h + r() * h;
        g.strokeStyle = `rgba(60,35,15,${0.05 + r() * 0.09})`; g.lineWidth = 0.6 + r() * 1.5;
        g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(s * 0.3, y + (r() - 0.5) * 8, s * 0.7, y + (r() - 0.5) * 8, s, y + (r() - 0.5) * 4); g.stroke();
      }
      g.fillStyle = 'rgba(30,18,8,0.4)'; g.fillRect(0, j * h, s, 1.5);
    }
  },

  papelLista(g, s, { c1 = '#ece4d4', c2 = '#d9ccb3', n = 12 } = {}) {
    g.fillStyle = c1; g.fillRect(0, 0, s, s);
    const p = s / n;
    for (let i = 0; i < n; i += 2) { g.fillStyle = c2; g.fillRect(i * p, 0, p, s); }
    const r = rng(3);
    for (let k = 0; k < 2200; k++) { g.fillStyle = `rgba(0,0,0,${r() * 0.025})`; g.fillRect(r() * s, r() * s, 1, 1 + r() * 3); }
  },

  papelGeo(g, s, { c1 = '#e8e2d6', c2 = '#2f4a52', c3 = '#c9a05a' } = {}) {
    g.fillStyle = c1; g.fillRect(0, 0, s, s);
    const n = 4, p = s / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const cx = i * p + p / 2, cy = j * p + p / 2;
      g.fillStyle = c2; g.beginPath(); g.moveTo(cx, cy - p * 0.42); g.lineTo(cx + p * 0.42, cy); g.lineTo(cx, cy + p * 0.42); g.lineTo(cx - p * 0.42, cy); g.closePath(); g.fill();
      g.fillStyle = c1; g.beginPath(); g.moveTo(cx, cy - p * 0.26); g.lineTo(cx + p * 0.26, cy); g.lineTo(cx, cy + p * 0.26); g.lineTo(cx - p * 0.26, cy); g.closePath(); g.fill();
      g.fillStyle = c3; g.beginPath(); g.arc(cx, cy, p * 0.07, 0, 7); g.fill();
      g.fillStyle = c3; g.fillRect(cx + p / 2 - 3, cy + p / 2 - 3, 6, 6);
    }
  },

  papelFolha(g, s, { c1 = '#e9ebe2', c2 = '#6e8a62', c3 = '#4f6b49' } = {}) {
    const r = rng(8);
    g.fillStyle = c1; g.fillRect(0, 0, s, s);
    for (let k = 0; k < 46; k++) {
      const x = r() * s, y = r() * s, a = r() * 6.28, L = s * (0.05 + r() * 0.05);
      for (const [ox, oy] of [[0, 0], [s, 0], [-s, 0], [0, s], [0, -s]]) {
        g.save(); g.translate(x + ox, y + oy); g.rotate(a);
        g.fillStyle = r() > 0.5 ? c2 : c3;
        g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(L * 0.5, -L * 0.28, L, 0); g.quadraticCurveTo(L * 0.5, L * 0.28, 0, 0); g.fill();
        g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 0); g.lineTo(L * 0.9, 0); g.stroke();
        g.restore();
      }
    }
  },

  pastilha(g, s, { c1 = '#6fa3a6', c2 = '#8cc0bd', n = 24 } = {}) {
    const r = rng(15);
    g.fillStyle = 'rgba(210,214,212,1)'; g.fillRect(0, 0, s, s);
    const p = s / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      g.fillStyle = mix(r() > 0.5 ? c1 : c2, (r() - 0.5) * 0.08);
      g.fillRect(i * p + 1.5, j * p + 1.5, p - 3, p - 3);
      g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(i * p + 2, j * p + 2, p - 6, 2);
    }
  },
};

// Desenha um desenho do catálogo num canvas de lado `px` (miniaturas)
export function miniaturaCanvas(def, px = 64) {
  const c = document.createElement('canvas'); c.width = c.height = px;
  const g = c.getContext('2d');
  const s = 128; const big = document.createElement('canvas'); big.width = big.height = s;
  const gg = big.getContext('2d');
  (DESENHOS[def.draw] || DESENHOS.cimento)(gg, s, def.args || {});
  g.drawImage(big, 0, 0, px, px);
  return c;
}
