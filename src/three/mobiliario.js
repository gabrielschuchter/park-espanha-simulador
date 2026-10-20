// Móveis do catálogo v3: armários com portas e gavetas que abrem, eletrodomésticos, mesas com cadeiras,
// banheiro e itens de escala. Origem no centro da projeção no piso; frente em +z; y = altura. Metros.
import { THREE, mat, add, B, cyl, disco, parte } from './helpers3d.js';
import { pessoa } from './pessoas3d.js';

const ANG = 1.78; // abertura de porta (~102°)
const MAD = (c) => c && c !== '#f1efea' && c !== '#ffffff' && c !== '#f4f4f4';

// ---------------------------------------------------------------- materiais de tampo
export function matTampo(k) {
  switch (k) {
    case 'preto': return mat('laca', '#2a2a2c');
    case 'branco': return mat('laca', '#f4f2ee');
    case 'madeira': return mat('madeira', '#c9a77c');
    case 'madeiraEscura': return mat('madeira', '#6e4a31');
    case 'inox': return mat('inox');
    case 'concreto': return mat('laca', '#9b9a96');
    default: return mat('granito');
  }
}

// ---------------------------------------------------------------- peças de ferragem
function puxadorV(pv, x, y, z, len = 0.14, cor = '#b9bcc0') {
  return B(pv, 0.012, len, 0.018, mat('metal', cor), x, y - len / 2, z, 0.004);
}
function puxadorH(pv, x, y, z, len = 0.16, cor = '#b9bcc0') {
  return B(pv, len, 0.012, 0.018, mat('metal', cor), x, y, z, 0.004);
}
function louca(g, x, y, z, n = 1) {
  const branco = mat('ceramica');
  for (let i = 0; i < n; i++) {
    cyl(g, 0.11, 0.09, 0.02, branco, x, y + i * 0.024, z, 14);
  }
}
function copo(g, x, y, z) { cyl(g, 0.032, 0.026, 0.09, mat('vidro'), x, y, z, 10).castShadow = false; }

// Torneira de pia: base, pescoço e bico
export function torneira(g, x, y, z, cor = '#c9ccd0', alta = true) {
  const m = mat('metal', cor);
  cyl(g, 0.022, 0.026, 0.02, m, x, y, z, 12);
  cyl(g, 0.011, 0.011, alta ? 0.26 : 0.12, m, x, y + 0.02, z, 10);
  const bico = B(g, 0.016, 0.016, alta ? 0.17 : 0.10, m, x, y + (alta ? 0.27 : 0.13), z + (alta ? 0.075 : 0.045), 0.006);
  bico.rotation.x = 0.06;
  B(g, 0.05, 0.012, 0.012, m, x + 0.04, y + 0.03, z, 0.004);
}
// Cuba retangular embutida no tampo (y = face superior do tampo)
export function cuba(g, x, y, z, cw = 0.48, cd = 0.38, cor = 'inox') {
  const m = mat(cor === 'inox' ? 'inox' : 'ceramica');
  const f = 0.016;
  B(g, cw, 0.006, f, m, x, y, z - cd / 2 + f / 2, 0.002);
  B(g, cw, 0.006, f, m, x, y, z + cd / 2 - f / 2, 0.002);
  B(g, f, 0.006, cd, m, x - cw / 2 + f / 2, y, z, 0.002);
  B(g, f, 0.006, cd, m, x + cw / 2 - f / 2, y, z, 0.002);
  B(g, cw - 2 * f, 0.004, cd - 2 * f, mat('laca', cor === 'inox' ? '#8d9196' : '#dcd8d0'), x, y - 0.002, z, 0.002).castShadow = false;
  cyl(g, 0.02, 0.02, 0.006, mat('metal', '#555'), x, y - 0.002, z, 10);
}

// ---------------------------------------------------------------- armário genérico
// cfg.k: 'base' | 'aereo' | 'torre' | 'alto' | 'suspenso' | 'ilha'
// cfg.comp: lista de compartimentos de baixo para cima: [tipo, altura (m) ou null, n]
//   tipos: 'portas' (n folhas), 'gav' (n gavetas), 'forno', 'micro', 'nicho', 'vidro' (n folhas de vidro), 'flap' (basculante)
export function armario(g, it, c) {
  const { w, d, h } = it, cfg = c.cfg || {};
  const k = cfg.k || 'base';
  const madeira = cfg.madeira ?? (c.paleta === 'madeira' && MAD(it.cor));
  const fr = cfg.espelho ? mat('espelho') : madeira ? mat('madeira', it.cor) : mat('laca', it.cor);
  const int = mat('laca', cfg.int || '#ece7de');
  const esc = mat('laca', '#2b2b2d');
  const t = 0.018;
  const plinto = k === 'aereo' || k === 'suspenso' ? 0 : (cfg.semPlinto ? 0 : (k === 'alto' ? 0.08 : 0.10));
  const tt = cfg.tampo ? 0.035 : 0;
  const y0 = plinto, y1 = h - tt;
  const balanco = cfg.balanco || 0;

  if (plinto) B(g, w - 0.04, plinto, d - 0.08, esc, 0, 0, -0.01, 0);
  // carcaça oca
  const dc = d - 0.02, zc = -0.01;
  for (const s of [-1, 1]) B(g, t, y1 - y0, dc, int, s * (w / 2 - t / 2), y0, zc, 0);
  B(g, w - 2 * t, t, dc, int, 0, y0, zc, 0);
  B(g, w - 2 * t, t, dc, int, 0, y1 - t, zc, 0);
  B(g, w - 2 * t, y1 - y0 - 2 * t, 0.008, int, 0, y0 + t, -d / 2 + 0.004, 0);

  // compartimentos
  let comp = cfg.comp;
  if (!comp) {
    const n = cfg.portas ?? (w <= 0.62 ? 1 : w <= 1.32 ? 2 : 3);
    comp = [[k === 'aereo' && cfg.flap ? 'flap' : 'portas', null, n]];
  }
  const livre = y1 - y0 - 2 * t;
  const fixos = comp.reduce((s, q) => s + (q[1] || 0), 0), nulos = comp.filter((q) => !q[1]).length;
  const hNulo = nulos ? Math.max(0.05, (livre - fixos - t * (comp.length - 1)) / nulos) : 0;
  let y = y0 + t;
  const zf = d / 2 - 0.010; // centro das frentes
  comp.forEach(([tipo, ah, n], ci) => {
    const H = ah || hNulo, ya = y, yb = y + H;
    if (ci > 0) B(g, w - 2 * t, t, dc, int, 0, ya - t, zc, 0); // divisória
    const gap = 0.003, ph = H - gap * 2 + (ci === 0 ? t : 0) + (ci === comp.length - 1 ? t : 0);
    const pyc = (ya - (ci === 0 ? t : 0) + yb + (ci === comp.length - 1 ? t : 0)) / 2;
    if (tipo === 'portas' || tipo === 'vidro') {
      const nn = n || 1;
      const pw = (w - gap * (nn + 1)) / nn;
      const vid = tipo === 'vidro';
      // prateleira interna
      if (H > 0.55) for (let i = 1; i < (H > 1.1 ? 4 : 2); i++) B(g, w - 2 * t, 0.016, dc - 0.03, int, 0, ya + (H / ((H > 1.1 ? 4 : 2))) * i, zc - 0.005, 0);
      if (k === 'aereo' && cfg.louca && !vid) { louca(g, -w * 0.18, ya + 0.0, 0, 3); copo(g, w * 0.18, ya + 0.0, 0.02); copo(g, w * 0.18 + 0.07, ya + 0.0, -0.02); }
      if (vid) { louca(g, -w * 0.2, ya + H * 0.5, 0, 3); copo(g, w * 0.2, ya + H * 0.5, 0.02); }
      for (let i = 0; i < nn; i++) {
        const hingeLeft = nn === 1 ? (cfg.dobradica !== 'd') : i < nn / 2;
        const hx = hingeLeft ? -w / 2 + gap + i * (pw + gap) : -w / 2 + gap + (i + 1) * pw + i * gap;
        const pv = new THREE.Group(); pv.position.set(hx, pyc, zf);
        const px = hingeLeft ? pw / 2 : -pw / 2;
        if (vid) {
          const fm = mat('metal', '#2b2b2b');
          for (const [bw, bh, bx, by] of [[pw, 0.03, 0, ph / 2 - 0.015], [pw, 0.03, 0, -ph / 2 + 0.015], [0.03, ph, -pw / 2 + 0.015, 0], [0.03, ph, pw / 2 - 0.015, 0]]) B(pv, bw, bh, 0.02, fm, px + bx, by - bh / 2, 0, 0.002);
          const gv = add(pv, new THREE.BoxGeometry(pw - 0.04, ph - 0.04, 0.006), mat('vidro'), px, 0, 0); gv.castShadow = false;
        } else {
          B(pv, pw, ph, 0.018, fr, px, -ph / 2, 0, 0.004);
        }
        if (cfg.puxador !== 'nenhum' && cfg.puxador !== 'cava') {
          const hxp = hingeLeft ? pw - 0.035 : -pw + 0.035;
          const len = Math.min(k === 'torre' || k === 'alto' ? 0.26 : 0.14, ph - 0.08);
          const topo = k === 'aereo' || k === 'suspenso' ? -ph / 2 + len + 0.03 : k === 'torre' || k === 'alto' ? Math.min(0.15, ph / 2 - 0.03) : ph / 2 - 0.03;
          puxadorV(pv, hxp, topo, 0.017, len, cfg.pegaCor);
        }
        parte(g, pv, { grupo: 'portas', r: [0, hingeLeft ? -ANG : ANG, 0] });
        g.add(pv);
      }
    } else if (tipo === 'flap') {
      const nn = n || 1, pw = (w - gap * (nn + 1)) / nn;
      louca(g, -w * 0.2, ya, 0, 3); copo(g, w * 0.2, ya, 0.0);
      for (let i = 0; i < nn; i++) {
        const pv = new THREE.Group(); pv.position.set(-w / 2 + gap + i * (pw + gap) + pw / 2, pyc + ph / 2, zf);
        B(pv, pw, ph, 0.018, fr, 0, -ph, 0, 0.004);
        if (cfg.puxador !== 'nenhum') puxadorH(pv, 0, -ph + 0.04, 0.017, Math.min(0.16, pw * 0.5), cfg.pegaCor);
        parte(g, pv, { grupo: 'portas', r: [-1.9, 0, 0] });
        g.add(pv);
      }
    } else if (tipo === 'gav') {
      const nn = n || 1, gh = (H - gap * (nn + 1)) / nn;
      for (let i = 0; i < nn; i++) {
        const yc = ya + gap + gh * i + gap * i + gh / 2;
        const gv = new THREE.Group(); gv.position.set(0, yc, 0);
        B(gv, w - 0.006, gh, 0.018, fr, 0, -gh / 2, zf, 0.004);
        const bh = Math.max(0.05, gh - 0.05), bw = w - 2 * t - 0.03, prof = d - 0.07, zbox = d / 2 - 0.02 - prof / 2;
        for (const s of [-1, 1]) B(gv, 0.012, bh, prof, int, s * (bw / 2), -gh / 2 + 0.03, zbox, 0);
        B(gv, bw, 0.012, prof, int, 0, -gh / 2 + 0.03, zbox, 0);
        B(gv, bw, bh, 0.012, int, 0, -gh / 2 + 0.03, zbox - prof / 2 + 0.006, 0);
        if (cfg.puxador === 'cava') B(gv, w - 0.04, 0.012, 0.02, esc, 0, gh / 2 - 0.02, zf + 0.002, 0);
        else if (cfg.puxador !== 'nenhum') puxadorH(gv, 0, gh / 2 - 0.035, zf + 0.017, Math.min(0.22, w * 0.4), cfg.pegaCor);
        parte(g, gv, { grupo: 'portas', d: [0, 0, Math.min(0.46, (d - 0.07) * 0.82)], de: i * 0.06 });
        g.add(gv);
      }
    } else if (tipo === 'forno') {
      const gl = mat('tela'), inox = mat('inox');
      B(g, w - 2 * t - 0.02, H - 0.02, dc - 0.1, esc, 0, ya + 0.01, zc - 0.03, 0); // cavidade escura
      B(g, w - 0.02, H, 0.018, mat('laca', '#16161a'), 0, ya, zf, 0.004); // moldura frontal
      const fh = H - 0.14, pv = new THREE.Group(); pv.position.set(0, ya + 0.03, zf + 0.012);
      B(pv, w - 0.08, fh, 0.03, gl, 0, 0, 0, 0.006);
      B(pv, w - 0.16, fh - 0.14, 0.004, mat('laca', '#0a0b0d'), 0, 0.07, 0.016, 0);
      B(pv, w - 0.2, 0.016, 0.03, inox, 0, fh - 0.03, 0.03, 0.006);
      parte(g, pv, { grupo: 'portas', r: [1.5, 0, 0] });
      g.add(pv);
      for (let i = 0; i < 4; i++) cyl(g, 0.018, 0.018, 0.02, inox, -w * 0.3 + i * (w * 0.2), ya + H - 0.06, zf + 0.02, 14).rotation.x = Math.PI / 2;
    } else if (tipo === 'micro') {
      const gl = mat('tela'), inox = mat('inox');
      B(g, w - 2 * t - 0.02, H - 0.02, dc - 0.12, esc, 0, ya + 0.01, zc - 0.03, 0);
      B(g, w - 0.02, H, 0.018, mat('laca', '#16161a'), 0, ya, zf, 0.004);
      const pv = new THREE.Group(); pv.position.set(-w / 2 + 0.03, ya + H / 2, zf + 0.012);
      B(pv, w * 0.68, H - 0.07, 0.025, gl, w * 0.34, -(H - 0.07) / 2, 0, 0.005);
      parte(g, pv, { grupo: 'portas', r: [0, -1.7, 0] });
      g.add(pv);
      B(g, w * 0.2, H - 0.1, 0.012, mat('laca', '#26262b'), w * 0.38, ya + 0.05, zf + 0.012, 0.002);
      cyl(g, 0.016, 0.016, 0.014, inox, w * 0.38, ya + H * 0.6, zf + 0.02, 12).rotation.x = Math.PI / 2;
    } else if (tipo === 'nicho') {
      const nn = Math.max(1, Math.round(H / 0.32));
      for (let i = 1; i < nn; i++) B(g, w - 2 * t, 0.016, dc - 0.02, int, 0, ya + (H / nn) * i, zc, 0);
      if (cfg.louca) { louca(g, -w * 0.22, ya, 0, 4); copo(g, w * 0.18, ya, 0.0); }
      if (cfg.livros) for (let i = 0; i < 6; i++) B(g, 0.03, 0.2 + (i % 3) * 0.04, 0.16, mat('laca', ['#7d8461', '#b46a4c', '#e8e3da', '#3f5f6b', '#d1a54a', '#8c8c92'][i]), -w * 0.3 + i * 0.035, ya + H / nn, 0, 0.002);
    }
    y = yb;
  });

  // tampo e acessórios de bancada
  if (tt) {
    const tm = matTampo(cfg.tampo);
    const dt = d + 0.02 + balanco;
    const zt = 0.01 + balanco / 2 * (cfg.balancoFrente ? 1 : -1);
    B(g, w + (cfg.pontas ? 0.02 : 0), tt, dt, tm, 0, y1, zt, 0.004);
    if (cfg.respingo !== false && !balanco) B(g, w, 0.07, 0.016, tm, 0, h, -d / 2 + 0.008, 0.003);
    if (balanco) for (const s of [-1, 1]) B(g, 0.04, 0.5, 0.04, mat('metal', '#2b2b2b'), s * (w / 2 - 0.1), y1 - 0.5, cfg.balancoFrente ? d / 2 + balanco - 0.1 : -d / 2 - balanco + 0.1, 0.004);
    if (cfg.cuba) {
      const ns = cfg.cuba === 2 ? [-1, 1] : [0];
      const cx = cfg.cuba === 2 ? w * 0.22 : -w * 0.12;
      for (const s of ns) cuba(g, cfg.cuba === 2 ? s * cx : cx, h, 0.02, cfg.cuba === 2 ? Math.min(0.40, w * 0.26) : Math.min(0.5, w * 0.42), 0.38);
      torneira(g, cfg.cuba === 2 ? 0 : cx, h, -d / 2 + 0.07, cfg.torneira || '#c9ccd0', true);
      if (cfg.escorredor) B(g, 0.40, 0.012, 0.32, mat('inox'), w * 0.25, h, 0.0, 0.002);
    }
    if (cfg.cooktop) cooktopTopo(g, 0, h, 0.0, cfg.cooktop, cfg.inducao);
  }
}

// Mesa de fogão embutida (vidro preto com bocas)
export function cooktopTopo(g, x, y, z, n = 4, inducao = false) {
  const gw = n >= 5 ? 0.74 : 0.58, gd = 0.50;
  B(g, gw, 0.008, gd, mat('laca', '#101114'), x, y, z, 0.004);
  const pos = n >= 5 ? [[-0.22, -0.11, 0.05], [0.22, -0.11, 0.05], [-0.22, 0.12, 0.045], [0.22, 0.12, 0.045], [0, 0.0, 0.06]] : [[-0.14, -0.11, 0.05], [0.14, -0.11, 0.045], [-0.14, 0.12, 0.045], [0.14, 0.12, 0.055]];
  for (const [bx, bz, r] of pos.slice(0, n)) {
    if (inducao) {
      const a = new THREE.Mesh(new THREE.TorusGeometry(r + 0.02, 0.004, 4, 28), mat('laca', '#c7c7c7')); a.rotation.x = Math.PI / 2; a.position.set(x + bx, y + 0.009, z + bz); g.add(a);
    } else {
      cyl(g, r, r, 0.014, mat('metal', '#222'), x + bx, y + 0.008, z + bz, 18);
      cyl(g, r * 0.55, r * 0.55, 0.02, mat('metal', '#3a3a3a'), x + bx, y + 0.008, z + bz, 14);
    }
  }
}

// ---------------------------------------------------------------- guarda-roupa
export function guardaRoupa(g, it, c) {
  const { w, d, h } = it;
  const correr = !!c.correr;
  const madeira = c.paleta === 'madeira' && MAD(it.cor);
  const fr = madeira ? mat('madeira', it.cor) : mat('laca', it.cor);
  const int = mat('laca', '#ece7de'), t = 0.018, esc = mat('laca', '#2b2b2d');
  const plinto = 0.07;
  B(g, w - 0.04, plinto, d - 0.08, esc, 0, 0, -0.01, 0);
  const dc = d - 0.02, zc = -0.01, y0 = plinto;
  for (const s of [-1, 1]) B(g, t, h - y0, dc, int, s * (w / 2 - t / 2), y0, zc, 0);
  B(g, w - 2 * t, t, dc, int, 0, y0, zc, 0); B(g, w - 2 * t, t, dc, int, 0, h - t, zc, 0);
  B(g, w - 2 * t, h - y0 - 2 * t, 0.008, int, 0, y0 + t, -d / 2 + 0.004, 0);
  // vãos: um a cada ~0.55 m
  const nv = Math.max(1, Math.round(w / 0.55));
  const vw = (w - 2 * t) / nv;
  const roupa = ['#3f5f6b', '#b46a4c', '#e8e3da', '#7d8461', '#2f2e2c', '#d1a54a'];
  for (let i = 0; i < nv; i++) {
    const cx = -w / 2 + t + vw * (i + 0.5);
    if (i > 0) B(g, t, h - y0 - 2 * t, dc, int, -w / 2 + t + vw * i, y0 + t, zc, 0);
    const tipo = nv === 1 ? 'cab' : i % 2 === 0 ? 'cab' : 'prat';
    if (tipo === 'cab') {
      B(g, vw - 0.03, 0.016, dc - 0.04, int, cx, h - 0.42, zc, 0); // maleiro
      cyl(g, 0.008, 0.008, vw - 0.04, mat('metal', '#b9bcc0'), cx, h - 0.62, zc, 8).rotation.z = Math.PI / 2;
      for (let q = 0; q < Math.floor((vw - 0.1) / 0.06); q++) B(g, 0.025, 0.55 + (q % 3) * 0.06, 0.34, mat('tecido', roupa[(q + i) % roupa.length]), cx - vw / 2 + 0.06 + q * 0.058, h - 0.62 - 0.55 - (q % 3) * 0.06 + 0.02, zc, 0.004);
      B(g, vw - 0.03, 0.016, dc - 0.04, int, cx, y0 + 0.30, zc, 0);
      B(g, vw - 0.1, 0.14, 0.3, mat('tecido', '#e8e3da'), cx, y0 + 0.32, zc, 0.01);
    } else {
      const np = Math.max(3, Math.round((h - y0) / 0.34));
      for (let q = 1; q < np; q++) {
        const yy = y0 + ((h - y0) / np) * q;
        B(g, vw - 0.03, 0.016, dc - 0.04, int, cx, yy, zc, 0);
        B(g, vw - 0.14, 0.12 + (q % 2) * 0.04, 0.26, mat('tecido', roupa[(q + i * 2) % roupa.length]), cx, yy + 0.016, zc, 0.01);
      }
      // gavetas na base
      const gv = new THREE.Group(); gv.position.set(cx, y0 + 0.16, 0);
      B(gv, vw - 0.04, 0.2, 0.018, fr, 0, -0.1, d / 2 - 0.012, 0.004);
      B(gv, vw - 0.1, 0.12, dc - 0.12, int, 0, -0.1, zc - 0.02, 0);
      puxadorH(gv, 0, 0.0, d / 2 + 0.004, Math.min(0.2, vw * 0.5));
      parte(g, gv, { grupo: 'portas', d: [0, 0, Math.min(0.4, dc - 0.15)] });
      g.add(gv);
    }
  }
  const gap = 0.003, ph = h - y0 - 0.006;
  if (correr) {
    const n = w > 2.45 ? 3 : 2, pw = w / n + 0.025;
    for (let i = 0; i < n; i++) {
      const pv = new THREE.Group();
      const zz = d / 2 - 0.008 - (i % 2 ? 0 : 0.026);
      pv.position.set(-w / 2 + (w / n) * (i + 0.5), y0 + 0.003, zz);
      B(pv, pw - 0.004, ph, 0.016, fr, 0, 0, 0, 0.003);
      puxadorV(pv, i === 0 ? pw / 2 - 0.04 : -pw / 2 + 0.04, ph * 0.52, 0.014, 0.4);
      // painéis pares escorregam sobre o próximo
      const desl = i === 0 ? [(w / n) * 0.96, 0, 0] : i === n - 1 && n > 2 ? [-(w / n) * 0.96, 0, 0] : null;
      if (desl) parte(g, pv, { grupo: 'portas', d: desl });
      g.add(pv);
    }
  } else {
    const n = Math.max(2, Math.round(w / 0.46)), pw = (w - gap * (n + 1)) / n;
    for (let i = 0; i < n; i++) {
      const left = i < n / 2;
      const hx = left ? -w / 2 + gap + i * (pw + gap) : -w / 2 + gap + (i + 1) * pw + i * gap;
      const pv = new THREE.Group(); pv.position.set(hx, y0 + 0.003, d / 2 - 0.010);
      B(pv, pw, ph, 0.018, fr, left ? pw / 2 : -pw / 2, 0, 0, 0.004);
      puxadorV(pv, left ? pw - 0.04 : -pw + 0.04, ph * 0.52, 0.017, 0.22);
      parte(g, pv, { grupo: 'portas', r: [0, left ? -ANG : ANG, 0] });
      g.add(pv);
    }
  }
}

// ---------------------------------------------------------------- geladeiras
// cfg.tipo: 'uma' | 'duplex' | 'sbs' | 'frigobar' | 'horizontal'
export function geladeira(g, it, c) {
  const { w, d, h, cor } = it, cfg = c.cfg || {}, tipo = cfg.tipo || 'duplex';
  const corpo = mat('metal', cor), int = mat('laca', '#f3f4f6'), inox = mat('inox'), borr = mat('laca', '#d8dadd');
  const t = 0.03, dc = d - 0.05;
  if (tipo === 'horizontal') {
    B(g, w, h - 0.05, d, mat('laca', cor), 0, 0.05, 0, 0.02);
    B(g, w - 0.03, 0.02, d - 0.03, int, 0, h - 0.07, 0, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, 0.04, 0.05, 0.04, mat('metal', '#222'), sx * (w / 2 - 0.05), 0, sz * (d / 2 - 0.05), 0.004);
    for (const s of [-1, 1]) {
      const pv = new THREE.Group(); pv.position.set(0, h - 0.02, -d / 2 + 0.01);
      B(pv, w / 2 - 0.004, 0.05, d - 0.02, mat('laca', '#f4f4f4'), s * (w / 4), -0.03, (d - 0.02) / 2, 0.01);
      B(pv, 0.12, 0.02, 0.02, inox, s * (w / 4), 0.0, d - 0.04, 0.004);
      parte(g, pv, { grupo: 'portas', r: [-1.9, 0, 0], de: s > 0 ? 0.1 : 0 });
      g.add(pv);
    }
    return;
  }
  // carcaça oca
  for (const s of [-1, 1]) B(g, t, h, dc, corpo, s * (w / 2 - t / 2), 0, -d / 2 + dc / 2, 0.01);
  B(g, w - 2 * t, t, dc, corpo, 0, h - t, -d / 2 + dc / 2, 0); B(g, w - 2 * t, t, dc, corpo, 0, 0, -d / 2 + dc / 2, 0);
  B(g, w - 2 * t, h - 2 * t, 0.02, int, 0, t, -d / 2 + 0.01, 0);
  // prateleiras de vidro
  const alt = h - 2 * t;
  const nPrat = tipo === 'frigobar' ? 2 : 4;
  for (let i = 1; i <= nPrat; i++) {
    const s = B(g, w - 2 * t - 0.03, 0.008, dc - 0.08, mat('vidro'), 0, t + alt * (0.22 + 0.15 * i) * (tipo === 'frigobar' ? 1.4 : 1) - 0.0, -0.02, 0.002); s.castShadow = false;
  }
  if (tipo !== 'frigobar') {
    B(g, w - 2 * t - 0.04, 0.26, dc - 0.1, mat('laca', '#dfe6ea'), 0, t + 0.02, -0.02, 0.01);
    B(g, w - 2 * t - 0.04, 0.26, dc - 0.1, mat('vidro'), 0, t + 0.3, -0.02, 0.01).castShadow = false;
  }
  // comida (alguns itens)
  const cores = ['#b46a4c', '#7d8461', '#d1a54a', '#e8e3da'];
  for (let i = 0; i < 4; i++) B(g, 0.08, 0.14, 0.08, mat('laca', cores[i]), -w * 0.25 + i * 0.1, t + alt * 0.37 + 0.004, -0.04, 0.01);
  const dz = d / 2 - 0.02;
  const porta = (px, pw, y0b, hb, hingeRight, ang = 2.0) => {
    const pv = new THREE.Group(); pv.position.set(hingeRight ? px + pw / 2 : px - pw / 2, y0b + hb / 2, dz);
    B(pv, pw - 0.004, hb - 0.004, 0.045, corpo, hingeRight ? -pw / 2 : pw / 2, -hb / 2, 0, 0.012);
    // prateleiras internas da porta
    for (let i = 0; i < Math.max(1, Math.round(hb / 0.28)); i++) B(pv, pw - 0.06, 0.07, 0.07, mat('vidro'), hingeRight ? -pw / 2 : pw / 2, -hb / 2 + 0.06 + i * 0.2, -0.05, 0.004).castShadow = false;
    // puxador vertical na borda livre
    const lenH = Math.min(0.5, hb * 0.6), ym = hb > 0.9 ? hb * 0.3 : 0;
    B(pv, 0.02, lenH, 0.03, inox, hingeRight ? -pw + 0.05 : pw - 0.05, ym - lenH, 0.04, 0.008);
    parte(g, pv, { grupo: 'portas', r: [0, hingeRight ? ang : -ang, 0] });
    g.add(pv);
  };
  if (tipo === 'sbs') {
    porta(-w / 4, w / 2, 0.02, h - 0.02, false);
    porta(w / 4, w / 2, 0.02, h - 0.02, true);
  } else if (tipo === 'duplex') {
    const hf = (h - 0.04) * 0.32;
    porta(0, w, 0.02 + (h - 0.04) - hf, hf, true);
    porta(0, w, 0.02, (h - 0.04) - hf - 0.004, true);
    B(g, w - 0.01, 0.008, 0.01, borr, 0, h * 0.68, dz + 0.0, 0);
  } else porta(0, w, 0.02, h - 0.02, true);
  // pés
  for (const s of [-1, 1]) B(g, 0.05, 0.02, 0.05, mat('laca', '#222'), s * (w / 2 - 0.06), 0, -d / 2 + 0.06, 0.004);
}

// ---------------------------------------------------------------- fogão
export function fogao(g, it, c) {
  const { w, d, h, cor } = it, cfg = c.cfg || {}, bocas = cfg.bocas || 4;
  const m = mat('laca', cor), preto = mat('laca', '#141414'), inox = mat('inox');
  const t = 0.02, pe = 0.06;
  for (const s of [-1, 1]) B(g, 0.05, pe, 0.05, mat('laca', '#333'), s * (w / 2 - 0.05), 0, d / 2 - 0.06, 0.004), B(g, 0.05, pe, 0.05, mat('laca', '#333'), s * (w / 2 - 0.05), 0, -d / 2 + 0.06, 0.004);
  // caixa do forno (oca)
  for (const s of [-1, 1]) B(g, t, h - pe - 0.02, d, m, s * (w / 2 - t / 2), pe, 0, 0.006);
  B(g, w - 2 * t, h - pe - 0.02, 0.02, m, 0, pe, -d / 2 + 0.01, 0);
  B(g, w - 2 * t, t, d, m, 0, pe, 0, 0);
  B(g, w - 2 * t - 0.03, h - pe - 0.12 - 0.04, d - 0.14, mat('laca', '#1a1a1c'), 0, pe + 0.03, -0.03, 0);
  B(g, w, 0.025, d, preto, 0, h - 0.025, 0, 0.004);
  const painel = 0.11;
  B(g, w, painel, 0.04, m, 0, h - 0.025 - painel, d / 2 - 0.02, 0.008);
  const n = bocas >= 5 ? 5 : 4;
  for (let i = 0; i < n; i++) cyl(g, 0.017, 0.017, 0.02, inox, -w * 0.38 + (i + 0.5) * (w * 0.76 / n), h - 0.1, d / 2 + 0.005, 14).rotation.x = Math.PI / 2;
  const bx = bocas >= 5 ? [[-0.24, -0.1, 0.06], [0.24, -0.1, 0.05], [-0.24, 0.12, 0.05], [0.24, 0.12, 0.05], [0, 0.0, 0.055]] : [[-w * 0.24, -d * 0.2, 0.05], [w * 0.24, -d * 0.2, 0.04], [-w * 0.24, d * 0.18, 0.04], [w * 0.24, d * 0.18, 0.055]];
  for (const [x, z, r] of bx.slice(0, n)) {
    cyl(g, r, r, 0.016, mat('metal', '#2a2a2a'), x, h, z, 18);
    cyl(g, r * 0.5, r * 0.5, 0.028, mat('metal', '#444'), x, h, z, 12);
  }
  for (const z of [-d * 0.19, d * 0.19]) B(g, w - 0.08, 0.012, 0.012, mat('metal', '#222'), 0, h + 0.002, z, 0.002);
  // porta do forno
  const ph = h - pe - painel - 0.06;
  const pv = new THREE.Group(); pv.position.set(0, pe + 0.03, d / 2 + 0.005);
  B(pv, w - 0.04, ph, 0.03, m, 0, 0, 0, 0.006);
  B(pv, w - 0.16, ph - 0.16, 0.004, mat('tela'), 0, 0.09, 0.017, 0);
  B(pv, w - 0.12, 0.022, 0.035, inox, 0, ph - 0.03, 0.035, 0.008);
  parte(g, pv, { grupo: 'portas', r: [1.5, 0, 0] });
  g.add(pv);
}

export function cooktop(g, { w, d, h }, c) {
  const cfg = c.cfg || {};
  B(g, w, h, d, mat('laca', '#101114'), 0, 0, 0, 0.004);
  const n = cfg.bocas || 4;
  const sx = w / 0.58, sz = d / 0.50;
  const pos = n >= 5 ? [[-0.22, -0.11, 0.05], [0.22, -0.11, 0.05], [-0.22, 0.12, 0.045], [0.22, 0.12, 0.045], [0, 0.0, 0.06]] : [[-0.14, -0.11, 0.05], [0.14, -0.11, 0.045], [-0.14, 0.12, 0.045], [0.14, 0.12, 0.055]];
  for (const [bx, bz, r] of pos.slice(0, n)) {
    if (cfg.inducao) { const a = new THREE.Mesh(new THREE.TorusGeometry(r + 0.02, 0.004, 4, 28), mat('laca', '#c7c7c7')); a.rotation.x = Math.PI / 2; a.position.set(bx * sx, h + 0.001, bz * sz); g.add(a); }
    else { cyl(g, r, r, 0.014, mat('metal', '#222'), bx * sx, h, bz * sz, 18); cyl(g, r * 0.5, r * 0.5, 0.024, mat('metal', '#444'), bx * sx, h, bz * sz, 12); }
  }
}

export function coifa(g, { w, d, h }, c) {
  const cfg = c.cfg || {}, inox = mat('inox');
  if (cfg.k === 'slim') { B(g, w, h, d, inox, 0, 0, 0, 0.012); B(g, w - 0.1, 0.01, d - 0.12, mat('laca', '#222'), 0, 0, 0, 0); return; }
  const cap = h * 0.35;
  const base = B(g, w, cap, d, inox, 0, 0, 0, 0.01);
  void base;
  const ch = B(g, w * 0.4, h - cap, d * 0.5, inox, 0, cap, -d / 2 + d * 0.3, 0.008);
  void ch;
  B(g, w - 0.08, 0.01, d - 0.08, mat('laca', '#1a1a1a'), 0, 0, 0, 0);
}

export function lavaLoucas(g, it, c) {
  const { w, d, h, cor } = it, cfg = c.cfg || {};
  const m = mat('metal', cor), int = mat('inox'), t = 0.02;
  for (const s of [-1, 1]) B(g, t, h - 0.1, d, m, s * (w / 2 - t / 2), 0.1, 0, 0.004);
  B(g, w, t, d, m, 0, h - t, 0, 0.004); B(g, w - 2 * t, t, d, m, 0, 0.1, 0, 0);
  B(g, w - 2 * t, h - 0.1, 0.02, m, 0, 0.1, -d / 2 + 0.01, 0);
  B(g, w - 2 * t - 0.02, h - 0.2, d - 0.1, int, 0, 0.12, -0.02, 0.005);
  for (const yy of [0.2, 0.5]) { B(g, w - 0.14, 0.01, d - 0.18, mat('laca', '#9aa0a6'), 0, yy, -0.02, 0); for (let i = 0; i < 6; i++) B(g, 0.004, 0.12, d - 0.2, mat('laca', '#9aa0a6'), -w / 2 + 0.1 + i * ((w - 0.2) / 5), yy, -0.02, 0); }
  B(g, w - 0.02, 0.09, 0.03, m, 0, h - 0.1, d / 2 - 0.02, 0.006);
  const pv = new THREE.Group(); pv.position.set(0, 0.1, d / 2 - 0.005);
  const ph = h - 0.2;
  B(pv, w - 0.02, ph, 0.04, m, 0, 0, 0, 0.008);
  B(pv, w - 0.12, 0.018, 0.04, int, 0, ph - 0.05, 0.035, 0.008);
  parte(g, pv, { grupo: 'portas', r: [1.5, 0, 0] });
  g.add(pv);
  B(g, w - 0.02, 0.1, 0.02, mat('laca', '#222'), 0, 0, d / 2 - 0.01, 0.004);
  void cfg;
}

export function maquina(g, it, c) {
  const { w, d, h, cor } = it, cfg = c.cfg || {};
  if (cfg.topo) {
    B(g, w, h, d, mat('laca', cor), 0, 0, 0, 0.02);
    const pv = new THREE.Group(); pv.position.set(0, h, -d / 2 + 0.07);
    B(pv, w - 0.06, 0.02, d * 0.62, mat('laca', '#e4e6e8'), 0, 0.01, d * 0.31, 0.006);
    parte(g, pv, { grupo: 'portas', r: [-1.7, 0, 0] }); g.add(pv);
    B(g, w - 0.04, 0.12, 0.1, mat('laca', '#d3d6d9'), 0, h - 0.02, -d / 2 + 0.02, 0.01);
    return;
  }
  const empilhado = cfg.seca;
  const hm = empilhado ? h / 2 : h;
  for (let i = 0; i < (empilhado ? 2 : 1); i++) {
    const yb = i * hm;
    B(g, w, hm, d, mat('laca', cor), 0, yb, 0, 0.02);
    B(g, w - 0.04, 0.1, 0.012, mat('laca', '#d9d9d9'), 0, yb + hm - 0.13, d / 2 + 0.001, 0.003);
    cyl(g, 0.02, 0.02, 0.014, mat('metal', '#999'), w * 0.25, yb + hm - 0.08, d / 2 + 0.008, 12).rotation.x = Math.PI / 2;
    B(g, 0.08, 0.04, 0.01, mat('tela'), -w * 0.12, yb + hm - 0.08, d / 2 + 0.008, 0.002);
    const raio = Math.min(0.17, w * 0.28);
    const cy = yb + hm * 0.45;
    const aro = new THREE.Mesh(new THREE.TorusGeometry(raio, 0.028, 10, 32), mat('metal', '#b9bcc0')); aro.position.set(0, 0, 0);
    const vid = new THREE.Mesh(new THREE.CircleGeometry(raio, 32), mat('tela')); vid.position.set(0, 0, -0.005);
    const pv = new THREE.Group(); pv.position.set(-raio - 0.03, cy, d / 2 + 0.01);
    aro.position.x = raio + 0.03; vid.position.x = raio + 0.03;
    pv.add(aro, vid);
    B(pv, 0.02, 0.1, 0.02, mat('metal', '#b9bcc0'), 2 * raio + 0.05, -0.05, 0.0, 0.004);
    aro.castShadow = true;
    parte(g, pv, { grupo: 'portas', r: [0, -1.95, 0] }); g.add(pv);
  }
}

// ---------------------------------------------------------------- eletroportáteis
export function eletroP(g, it, c) {
  const { w, d, h, cor } = it, k = c.cfg?.k;
  const m = mat('laca', cor), inox = mat('inox'), preto = mat('laca', '#18181b');
  if (k === 'cafeteira') {
    B(g, w, 0.04, d, m, 0, 0, 0, 0.008); B(g, w, h - 0.04, d * 0.28, m, 0, 0.04, -d / 2 + d * 0.14, 0.01);
    B(g, w, 0.07, d * 0.7, m, 0, h - 0.07, -d / 2 + d * 0.35, 0.01);
    cyl(g, 0.03, 0.03, 0.09, mat('vidro'), 0, 0.05, d * 0.15, 12).castShadow = false;
  } else if (k === 'airfryer') {
    B(g, w, h, d, m, 0, 0, 0, 0.06);
    B(g, w * 0.8, 0.02, 0.012, inox, 0, h - 0.06, d / 2 - 0.005, 0.004);
    B(g, 0.05, 0.03, 0.1, preto, 0, h * 0.5, d / 2 + 0.05, 0.01);
  } else if (k === 'liquidificador') {
    cyl(g, w * 0.4, w * 0.45, h * 0.28, preto, 0, 0, 0, 20);
    cyl(g, w * 0.46, w * 0.34, h * 0.7, mat('vidro'), 0, h * 0.28, 0, 18).castShadow = false;
    cyl(g, w * 0.5, w * 0.5, h * 0.04, preto, 0, h * 0.96, 0, 18);
  } else if (k === 'torradeira') {
    B(g, w, h, d, inox, 0, 0, 0, 0.02);
    for (const s of [-1, 1]) B(g, w * 0.34, 0.006, d * 0.72, preto, s * w * 0.22, h, 0, 0.002);
  } else if (k === 'filtro') {
    B(g, w, h, d, m, 0, 0, 0, 0.03);
    cyl(g, 0.012, 0.012, 0.06, inox, 0, h * 0.48, d / 2 - 0.02, 8).rotation.x = Math.PI / 2;
    B(g, w * 0.7, 0.04, 0.012, mat('tela'), 0, h * 0.75, d / 2 + 0.002, 0.004);
  } else if (k === 'lixeira') {
    cyl(g, w / 2, w * 0.44, h - 0.03, mat('metal', cor), 0, 0, 0, 24);
    cyl(g, w / 2 + 0.006, w / 2 + 0.006, 0.03, mat('laca', '#1c1c1c'), 0, h - 0.03, 0, 24);
    B(g, 0.1, 0.02, 0.04, preto, 0, 0, w / 2 - 0.02, 0.004);
  } else if (k === 'escorredor') {
    B(g, w, 0.016, d, inox, 0, 0, 0, 0.003);
    for (let i = 0; i < 7; i++) B(g, 0.006, h, d * 0.7, inox, -w / 2 + 0.05 + i * ((w - 0.1) / 6), 0.016, 0, 0.002);
    for (const s of [-1, 1]) B(g, w, h * 0.5, 0.008, inox, 0, 0.016, s * (d / 2 - 0.004), 0.002);
  } else if (k === 'forno-bancada') {
    B(g, w, h, d, m, 0, 0, 0, 0.012);
    const pv = new THREE.Group(); pv.position.set(0, h * 0.12, d / 2 + 0.004);
    B(pv, w * 0.68, h * 0.7, 0.012, mat('tela'), -w * 0.14, 0, 0, 0.003);
    parte(g, pv, { grupo: 'portas', r: [1.5, 0, 0] }); g.add(pv);
    cyl(g, 0.014, 0.014, 0.014, inox, w * 0.36, h * 0.65, d / 2 + 0.008, 10).rotation.x = Math.PI / 2;
  } else if (k === 'panela-arroz') {
    cyl(g, w / 2, w * 0.46, h * 0.8, m, 0, 0, 0, 24);
    cyl(g, w * 0.46, w * 0.38, h * 0.2, inox, 0, h * 0.8, 0, 24);
  } else B(g, w, h, d, m, 0, 0, 0, 0.01);
}

// ---------------------------------------------------------------- cadeiras e mesas
// estilo: 'madeira' | 'estofada' | 'eames' | 'braco' | 'banco' | 'banqueta' | 'encosto-alto'
export function cadeiraGrupo(estilo = 'madeira', cor = '#2f2e2c', cor2 = null, hAssento = 0.45, hTotal = 0.85) {
  const g = new THREE.Group();
  const w = 0.44, dp = 0.48;
  const wd = mat('madeira', estilo === 'estofada' ? (cor2 || '#6e4a31') : cor);
  const mt = mat('metal', '#2b2b2b');
  const tec = mat('tecido', cor);
  if (estilo === 'banco' || estilo === 'banqueta') {
    const r = 0.17;
    cyl(g, r, r, 0.045, estilo === 'banqueta' ? mat('madeira', '#a5774b') : mat('madeira', cor), 0, hAssento - 0.045, 0, 24);
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 + Math.PI / 4; const lg = cyl(g, 0.013, 0.011, hAssento - 0.045, mt, Math.cos(a) * r * 0.62, 0, Math.sin(a) * r * 0.62, 8); lg.rotation.z = Math.cos(a) * 0.07; lg.rotation.x = -Math.sin(a) * 0.07; }
    const anel = new THREE.Mesh(new THREE.TorusGeometry(r * 0.66, 0.007, 6, 24), mt); anel.rotation.x = Math.PI / 2; anel.position.y = hAssento * 0.35; g.add(anel);
    if (estilo === 'banqueta' && hTotal > hAssento + 0.1) B(g, 0.30, 0.16, 0.025, mat('tecido', cor), 0, hAssento + 0.12, -0.17, 0.01);
    return g;
  }
  if (estilo === 'eames') {
    const casca = B(g, w, 0.05, dp, mat('laca', cor), 0, hAssento - 0.04, 0.0, 0.02);
    void casca;
    const enc = B(g, w, 0.3, 0.035, mat('laca', cor), 0, hAssento + 0.04, -dp / 2 + 0.03, 0.016); enc.rotation.x = -0.18;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const lg = cyl(g, 0.012, 0.009, hAssento - 0.05, wd, sx * 0.17, 0, sz * 0.15, 8); lg.rotation.z = sx * -0.13; lg.rotation.x = sz * 0.1; }
    return g;
  }
  // pernas
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, 0.014, 0.012, hAssento, estilo === 'estofada' ? mt : wd, sx * (w / 2 - 0.035), 0, sz * (dp / 2 - 0.04), 10);
  B(g, w, 0.04, dp - 0.02, estilo === 'estofada' ? mat('laca', '#26262a') : wd, 0, hAssento - 0.04, 0.0, 0.012);
  if (estilo === 'estofada' || estilo === 'braco') B(g, w - 0.02, 0.05, dp - 0.06, tec, 0, hAssento, 0.005, 0.02);
  if (estilo === 'braco') for (const sx of [-1, 1]) { B(g, 0.03, 0.2, 0.03, wd, sx * (w / 2 - 0.02), hAssento, 0.0, 0.006); B(g, 0.05, 0.025, dp * 0.6, wd, sx * (w / 2 - 0.02), hAssento + 0.2, -0.04, 0.008); }
  for (const sx of [-1, 1]) B(g, 0.026, hTotal - hAssento + 0.02, 0.026, estilo === 'estofada' ? mt : wd, sx * (w / 2 - 0.035), hAssento - 0.02, -dp / 2 + 0.04, 0.005);
  if (estilo === 'estofada') { const e = B(g, w - 0.02, 0.26, 0.05, tec, 0, hTotal - 0.30, -dp / 2 + 0.05, 0.02); e.rotation.x = -0.08; }
  else if (estilo === 'braco') B(g, w - 0.04, 0.26, 0.03, wd, 0, hTotal - 0.30, -dp / 2 + 0.04, 0.01);
  else B(g, w - 0.04, 0.17, 0.025, wd, 0, hTotal - 0.20, -dp / 2 + 0.04, 0.008);
  return g;
}

// Adiciona pessoa sentada (invisível até a simulação) em um grupo, com posição local
export function pessoaSentada(root, parent, x, y, z, seat, v = 0, ry = 0) {
  const p = pessoa({ pose: 'sentada', seat, v });
  p.position.set(x, y, z); p.rotation.y = ry; p.visible = false;
  parte(root, p, { grupo: 'pes' }); parent.add(p);
  return p;
}

// Mesa de jantar paramétrica. Pegada do item = tampo + 0,30 m de cadeira em cada lado longo.
// cfg: forma ('ret' | 'red' | 'ovl'), lugares, estilo de cadeira, alta, bancoLado ('z+'|'z-'|null), base
export function mesaJ(g, it, c) {
  const { w, d, h, cor, cor2 } = it, cfg = c.cfg || {};
  const forma = cfg.forma || 'ret', alta = !!cfg.alta;
  const lugares = cfg.lugares || 4;
  const hs = alta ? 0.65 : 0.45;
  const tampoM = mat(MAD(cor) ? 'madeira' : 'laca', cor), ptM = cfg.baseMetal ? mat('metal', cor2 || '#2b2b2b') : mat('madeira', cor2 || cor);
  const estiloCad = cfg.estilo || 'madeira';
  const corCad = cfg.corCad || cor2 || '#2f2e2c';
  const chairs = [];
  if (forma === 'red') {
    const r = Math.max(0.3, Math.min(w, d) / 2 - 0.30);
    cyl(g, r, r, 0.03, tampoM, 0, h - 0.03, 0, 40);
    if (cfg.base === 'pernas') for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; cyl(g, 0.025, 0.02, h - 0.03, ptM, Math.cos(a) * r * 0.7, 0, Math.sin(a) * r * 0.7, 10); }
    else { cyl(g, 0.05, 0.06, h - 0.03, ptM, 0, 0.02, 0, 16); cyl(g, r * 0.5, r * 0.55, 0.025, ptM, 0, 0, 0, 24); }
    for (let i = 0; i < lugares; i++) {
      const a = (i / lugares) * Math.PI * 2;
      chairs.push({ x: Math.sin(a) * (r + 0.03), z: Math.cos(a) * (r + 0.03), ry: a + Math.PI, ox: Math.sin(a), oz: Math.cos(a) });
    }
  } else {
    const td = cfg.encosto ? d - 0.30 : d - 0.60; // profundidade do tampo
    const zt = cfg.encosto ? -0.15 : 0;
    const oval = forma === 'ovl';
    if (oval) { const o = cyl(g, w / 2, w / 2, 0.03, tampoM, 0, h - 0.03, zt, 40); o.scale.z = td / w; }
    else B(g, w, 0.03, td, tampoM, 0, h - 0.03, zt, 0.012);
    if (cfg.base === 'cavalete') {
      for (const s of [-1, 1]) { B(g, 0.06, h - 0.03, td * 0.7, ptM, s * (w / 2 - 0.25), 0, zt, 0.006); B(g, 0.08, 0.04, td * 0.8, ptM, s * (w / 2 - 0.25), 0, zt, 0.006); }
      B(g, w - 0.6, 0.05, 0.05, ptM, 0, h * 0.25, zt, 0.006);
    } else if (cfg.base === 'pedestal') {
      B(g, 0.12, h - 0.03, td * 0.5, ptM, 0, 0.0, zt, 0.01); B(g, w * 0.5, 0.05, td * 0.7, ptM, 0, 0, zt, 0.008);
    } else {
      const inset = 0.07;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const lx = sx * (w / 2 - inset - (oval ? 0.12 : 0)), lz = zt + sz * (td / 2 - inset - (oval ? 0.06 : 0)); (cfg.pernaQuad ? B(g, 0.05, h - 0.03, 0.05, ptM, lx, 0, lz, 0.004) : cyl(g, 0.025, 0.02, h - 0.03, ptM, lx, 0, lz, 10)); }
    }
    const lados = cfg.encosto ? [1] : [1, -1];
    const heads = lugares >= 6 || cfg.cabeceiras;
    const nSide = Math.max(1, Math.ceil((lugares - (heads ? 2 : 0)) / (cfg.encosto ? 1 : 2)));
    for (const s of lados) {
      const nn = cfg.encosto ? lugares : nSide;
      for (let i = 0; i < nn; i++) {
        const x = nn === 1 ? 0 : -w / 2 + (w / nn) * (i + 0.5);
        chairs.push({ x, z: zt + s * (td / 2 + 0.02), ry: s > 0 ? Math.PI : 0, ox: 0, oz: s });
      }
    }
    if (heads && !cfg.encosto) for (const s of [-1, 1]) chairs.push({ x: s * (w / 2 + 0.02), z: zt, ry: s > 0 ? -Math.PI / 2 : Math.PI / 2, ox: s, oz: 0, cab: true });
    if (cfg.encosto) {
      // banco corrido na parede (lado -z)
      B(g, w, 0.40, 0.42, mat('tecido', cfg.corBanco || '#6f6a64'), 0, 0.02, -d / 2 + 0.21, 0.04);
      B(g, w, 0.40, 0.10, mat('tecido', cfg.corBanco || '#6f6a64'), 0, 0.30, -d / 2 + 0.05, 0.03);
      for (let i = 0; i < Math.min(3, Math.round(w / 0.55)); i++) {
        const nb = Math.min(3, Math.round(w / 0.55));
        pessoaSentada(g, g, -w / 2 + (w / nb) * (i + 0.5), 0.0, -d / 2 + 0.26, 0.44, (i + 2) % 5, 0);
      }
    }
  }
  chairs.forEach((q, i) => {
    const grp = cadeiraGrupo(estiloCad, corCad, cor2, hs, hs + 0.40);
    grp.position.set(q.x, 0, q.z); grp.rotation.y = q.ry;
    pessoaSentada(g, grp, 0, 0, -0.05, hs, i % 5, 0);
    const jit = ((i * 37) % 7 - 3) * 0.045;
    parte(g, grp, { grupo: 'cad', d: [q.ox * 0.42, 0, q.oz * 0.42], r: [0, jit, 0] });
    g.add(grp);
  });
  void h;
}

// ---------------------------------------------------------------- sofás e assentos: pessoas opcionais
export function adicionarPessoas(g, it, c) {
  const { w, d, h } = it, m = c.modelo;
  const add1 = (x, z, seat, v, ry = 0) => pessoaSentada(g, g, x, 0, z, seat, v, ry);
  if (m === 'sofa' || m === 'sofaChaise' || m === 'sofaCanto') {
    const braco = Math.min(0.18, w * 0.09);
    const largura = m === 'sofa' ? w : m === 'sofaChaise' ? w - Math.min(0.80, w * 0.38) : w - 0.95;
    const inner = largura - 2 * braco;
    const n = inner > 1.7 ? 3 : inner > 1.0 ? 2 : 1;
    const zb = m === 'sofa' ? -d / 2 + 0.34 : -d / 2 + 0.34;
    for (let i = 0; i < n; i++) add1(-w / 2 + braco + (inner / n) * (i + 0.5), zb, 0.44, i + 1);
  } else if (m === 'poltrona') add1(0, -d / 2 + 0.34, 0.42, 3);
  else if (m === 'cadeira') add1(0, -0.03, 0.45, 2);
  else if (m === 'cadeiraEscritorio') add1(0, -0.02, 0.47, 4);
  else if (m === 'banqueta') add1(0, -0.02, Math.max(0.5, h - 0.05), 1);
  else if (m === 'puff') add1(0, -0.02, h, 0);
}

// ---------------------------------------------------------------- sofá de canto (em L)
export function sofaCanto(g, it, c) {
  const { w, d, h, cor } = it;
  const f = mat('tecido', cor), dk = mat('madeira', '#3b2a1e');
  const prof = 0.95, ds = Math.min(prof, d), cw = 0.95;
  const pe = 0.10, braco = 0.16, enc = 0.20, sh = 0.44;
  // corpo principal (parte de trás)
  const bar = w - cw;
  B(g, w, sh - pe - 0.12, ds, f, 0, pe, -d / 2 + ds / 2, 0.03);
  for (const x of [-w / 2 + braco / 2]) B(g, braco, 0.64 - pe, ds, f, x, pe, -d / 2 + ds / 2, 0.05);
  B(g, w, h - pe, enc, f, 0, pe, -d / 2 + enc / 2, 0.05);
  // perna do L (lado direito, à frente)
  const lz = d - ds;
  B(g, cw, sh - pe - 0.12, lz, f, w / 2 - cw / 2, pe, d / 2 - lz / 2, 0.03);
  B(g, braco, 0.64 - pe, lz, f, w / 2 - braco / 2, pe, d / 2 - lz / 2, 0.05);
  B(g, braco, h - pe, lz, f, w / 2 - braco / 2, pe, d / 2 - lz / 2, 0.05);
  const nb = Math.max(2, Math.round(bar / 0.7));
  for (let i = 0; i < nb; i++) {
    const cwid = (bar - braco) / nb, x = -w / 2 + braco + cwid * (i + 0.5);
    B(g, cwid - 0.015, 0.14, ds - enc - 0.03, f, x, sh - 0.12, -d / 2 + enc + (ds - enc) / 2 - 0.015, 0.05);
    const bk = B(g, cwid - 0.03, h - sh - 0.05, 0.16, f, x, sh, -d / 2 + enc + 0.07, 0.06); bk.rotation.x = -0.12;
  }
  B(g, cw - braco - 0.02, 0.14, lz - 0.02, f, w / 2 - cw / 2 - braco / 2 + 0.0, sh - 0.12, d / 2 - lz / 2, 0.05);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, 0.015, 0.012, pe, dk, sx * (w / 2 - 0.08), 0, sz * (d / 2 - 0.08), 8);
}

// ---------------------------------------------------------------- acessórios (banheiro, quarto, escritório)
export function acess(g, it, c) {
  const { w, d, h, cor } = it, k = c.cfg?.k;
  const inox = mat('inox'), m = mat('laca', cor), tec = mat('tecido', cor);
  switch (k) {
    case 'toalheiro': {
      cyl(g, 0.008, 0.008, w, inox, 0, h - 0.02, d / 2 - 0.05, 8).rotation.z = Math.PI / 2;
      for (const s of [-1, 1]) B(g, 0.03, 0.03, 0.06, inox, s * (w / 2 - 0.02), h - 0.04, 0.0, 0.004);
      B(g, w * 0.5, h * 0.8, 0.02, mat('tecido', '#e8e3da'), 0, h * 0.14, d / 2 - 0.03, 0.01);
      break;
    }
    case 'toalheiro-termico': {
      for (let i = 0; i < 6; i++) cyl(g, 0.012, 0.012, w, inox, 0, i * (h / 6) + 0.04, 0, 8).rotation.z = Math.PI / 2;
      for (const s of [-1, 1]) B(g, 0.025, h, 0.03, inox, s * (w / 2 - 0.012), 0, 0, 0.004);
      break;
    }
    case 'cabideiro': {
      B(g, w, 0.05, 0.02, mat('madeira', cor), 0, 0, -d / 2 + 0.01, 0.004);
      for (let i = 0; i < Math.max(2, Math.round(w / 0.18)); i++) cyl(g, 0.008, 0.008, 0.07, inox, -w / 2 + 0.07 + i * 0.16, 0.0, -d / 2 + 0.05, 6).rotation.x = Math.PI / 2;
      break;
    }
    case 'papeleira': { cyl(g, 0.055, 0.055, 0.1, mat('laca', '#f4f4f4'), 0, 0, 0, 16).rotation.z = Math.PI / 2; B(g, 0.12, 0.012, 0.03, inox, 0, 0.0, -d / 2 + 0.015, 0.002); break; }
    case 'balanca': { B(g, w, h, d, mat('vidro'), 0, 0, 0, 0.01).castShadow = false; B(g, w * 0.5, 0.004, d * 0.18, mat('tela'), 0, h, -d * 0.2, 0.001); break; }
    case 'cortina-box': {
      cyl(g, 0.012, 0.012, w, inox, 0, h - 0.02, 0, 8).rotation.z = Math.PI / 2;
      const geo = new THREE.PlaneGeometry(w * 0.55, h - 0.12, 14, 1), p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 22) * 0.025);
      geo.computeVertexNormals();
      add(g, geo, new THREE.MeshStandardMaterial({ color: cor, roughness: 0.9, side: THREE.DoubleSide, transparent: true, opacity: 0.9 }), -w * 0.2, (h - 0.12) / 2 + 0.02, 0);
      break;
    }
    case 'prateleira-vidro': {
      B(g, w, 0.01, d, mat('vidro'), 0, 0, 0, 0.002).castShadow = false;
      for (const s of [-1, 1]) B(g, 0.02, 0.05, 0.02, inox, s * (w / 2 - 0.05), -0.04, -d / 2 + 0.02, 0.004);
      for (let i = 0; i < 3; i++) cyl(g, 0.03, 0.03, 0.11 + i * 0.03, mat('laca', ['#7d8461', '#e8e3da', '#3f5f6b'][i]), -w * 0.25 + i * 0.1, 0.01, 0, 14);
      break;
    }
    case 'cesto-roupa': {
      const cesta = new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w * 0.43, h - 0.04, 28, 1, true), new THREE.MeshStandardMaterial({ color: cor, roughness: 0.95, side: THREE.DoubleSide })); cesta.position.y = (h - 0.04) / 2; cesta.castShadow = true; g.add(cesta);
      cyl(g, w * 0.43, w * 0.43, 0.02, mat('laca', cor), 0, 0, 0, 24);
      cyl(g, w / 2 + 0.006, w / 2 + 0.006, 0.04, mat('laca', '#e8e3da'), 0, h - 0.04, 0, 28);
      break;
    }
    case 'banquinho': {
      B(g, w, 0.04, d, mat('madeira', cor), 0, h - 0.04, 0, 0.012);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, 0.018, 0.015, h - 0.04, mat('madeira', cor), sx * (w / 2 - 0.04), 0, sz * (d / 2 - 0.04), 8);
      break;
    }
    case 'suporte-canto': {
      for (const y of [0.1, 0.45, 0.8]) { const q = B(g, w, 0.008, d, mat('metal', '#c9ccd0'), 0, y * h / 0.9, 0, 0.002); void q; }
      for (const s of [-1, 1]) cyl(g, 0.006, 0.006, h, mat('metal', '#c9ccd0'), s * (w / 2 - 0.01), 0, -d / 2 + 0.01, 6);
      for (let i = 0; i < 3; i++) cyl(g, 0.03, 0.03, 0.17, mat('laca', ['#f4f4f4', '#3f5f6b', '#d1a54a'][i]), -w * 0.22 + i * 0.07, 0.01 * h / 0.9 + 0.1 * h / 0.9, -d * 0.1, 12);
      break;
    }
    case 'arara': {
      for (const s of [-1, 1]) { B(g, 0.03, h, 0.03, mat('metal', cor), s * (w / 2 - 0.02), 0, 0, 0.004); B(g, 0.03, 0.03, d, mat('metal', cor), s * (w / 2 - 0.02), 0, 0, 0.004); }
      cyl(g, 0.012, 0.012, w - 0.04, mat('metal', cor), 0, h - 0.04, 0, 8).rotation.z = Math.PI / 2;
      const cores = ['#3f5f6b', '#b46a4c', '#e8e3da', '#7d8461', '#2f2e2c'];
      for (let i = 0; i < Math.floor((w - 0.1) / 0.07); i++) B(g, 0.03, 0.6 + (i % 3) * 0.08, 0.35, mat('tecido', cores[i % 5]), -w / 2 + 0.08 + i * 0.065, h - 0.1 - 0.6 - (i % 3) * 0.08, 0, 0.006);
      break;
    }
    case 'bau': {
      B(g, w, h * 0.7, d, mat('madeira', cor), 0, 0, 0, 0.012);
      const pv = new THREE.Group(); pv.position.set(0, h * 0.7, -d / 2);
      B(pv, w + 0.01, h * 0.3, d + 0.01, mat('madeira', cor), 0, 0, d / 2, 0.02);
      B(pv, 0.06, 0.04, 0.02, mat('metal', '#b9bcc0'), 0, h * 0.12, d + 0.01, 0.004);
      parte(g, pv, { grupo: 'portas', r: [-1.7, 0, 0] }); g.add(pv);
      B(g, w - 0.06, 0.02, d - 0.06, mat('tecido', '#e8e3da'), 0, 0.12, 0, 0.01);
      break;
    }
    case 'monitor': {
      B(g, 0.05, 0.02, 0.2, mat('metal', '#2b2b2b'), 0, 0, 0, 0.004); B(g, 0.04, h * 0.38, 0.03, mat('metal', '#2b2b2b'), 0, 0.02, -0.02, 0.004);
      B(g, w, h * 0.55, 0.025, mat('laca', '#17171a'), 0, h * 0.4, -0.03, 0.006);
      add(g, new THREE.PlaneGeometry(w - 0.025, h * 0.55 - 0.025), mat('tela'), 0, h * 0.4 + h * 0.275, -0.03 + 0.0135);
      B(g, w * 0.55, 0.012, 0.15, mat('laca', '#26262a'), 0, 0, 0.22, 0.004);
      break;
    }
    case 'notebook': {
      B(g, w, 0.016, d, mat('metal', '#b9bcc0'), 0, 0, 0, 0.004);
      const lid = new THREE.Group(); lid.position.set(0, 0.016, -d / 2 + 0.005); lid.rotation.x = -0.35;
      B(lid, w, d * 0.92, 0.01, mat('metal', '#b9bcc0'), 0, 0, 0, 0.003);
      add(lid, new THREE.PlaneGeometry(w - 0.03, d * 0.92 - 0.03), mat('tela'), 0, d * 0.46, 0.0056);
      g.add(lid);
      break;
    }
    case 'impressora': { B(g, w, h, d, mat('laca', cor), 0, 0, 0, 0.012); B(g, w - 0.08, 0.012, d * 0.5, mat('laca', '#f4f4f4'), 0, h, -d * 0.1, 0.002); break; }
    case 'cacto': {
      cyl(g, w * 0.45, w * 0.36, h * 0.3, mat('laca', cor), 0, 0, 0, 20);
      cyl(g, w * 0.16, w * 0.16, h * 0.62, mat('folha', '#4f7a45'), 0, h * 0.28, 0, 12);
      for (const s of [-1, 1]) { cyl(g, w * 0.08, w * 0.08, h * 0.22, mat('folha', '#4f7a45'), s * w * 0.2, h * 0.5, 0, 10); cyl(g, w * 0.07, w * 0.07, h * 0.1, mat('folha', '#4f7a45'), s * w * 0.12, h * 0.5, 0, 10).rotation.z = Math.PI / 2; }
      break;
    }
    case 'relogio': {
      const dial = new THREE.Mesh(new THREE.CylinderGeometry(h / 2, h / 2, d, 36), mat('laca', '#2b2723')); dial.rotation.x = Math.PI / 2; dial.position.set(0, h / 2, 0); dial.castShadow = true; g.add(dial);
      const f = new THREE.Mesh(new THREE.CircleGeometry(h / 2 - 0.015, 36), mat('laca', '#f6f4f0')); f.position.set(0, h / 2, d / 2 + 0.001); g.add(f);
      B(g, 0.008, h * 0.34, 0.004, mat('laca', '#222'), 0, h / 2, d / 2 + 0.004, 0);
      const h2 = B(g, 0.008, h * 0.24, 0.004, mat('laca', '#222'), 0, h / 2, d / 2 + 0.006, 0); h2.rotation.z = -1.2;
      break;
    }
    case 'aquario': {
      B(g, w, h * 0.38, d, mat('laca', '#2b2723'), 0, 0, 0, 0.01);
      const vidro = B(g, w, h * 0.62, d, mat('vidro'), 0, h * 0.38, 0, 0.004); vidro.castShadow = false;
      B(g, w - 0.04, h * 0.45, d - 0.04, new THREE.MeshStandardMaterial({ color: '#7fc4d8', transparent: true, opacity: 0.35, roughness: 0.1, depthWrite: false }), 0, h * 0.39, 0, 0.002).castShadow = false;
      for (let i = 0; i < 4; i++) B(g, 0.07, 0.03, 0.02, mat('laca', ['#e0763a', '#d1a54a', '#3f5f6b', '#e8e3da'][i]), -w * 0.3 + i * w * 0.2, h * 0.6 + (i % 2) * 0.08, ((i * 3) % 4 - 1.5) * d * 0.15, 0.006);
      break;
    }
    default: B(g, w, h, d, m, 0, 0, 0, 0.01);
  }
  void tec;
}

// ---------------------------------------------------------------- escala e gabaritos
export function pessoaEscala(g, it, c) {
  g.add(pessoa({ pose: 'em-pe', alt: it.h, v: c.cfg?.v ?? 1 }));
}
export function cadeiraRodas(g, it) {
  const { w, d } = it, inox = mat('metal', '#2b2b2b');
  for (const s of [-1, 1]) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.30, 0.012, 8, 32), inox); r.rotation.y = Math.PI / 2; r.position.set(s * (w / 2 - 0.02), 0.31, -0.08); r.castShadow = true; g.add(r);
    const pr = new THREE.Mesh(new THREE.TorusGeometry(0.255, 0.006, 6, 28), inox); pr.rotation.y = Math.PI / 2; pr.position.copy(r.position); g.add(pr);
    cyl(g, 0.05, 0.05, 0.03, inox, s * (w / 2 - 0.1), 0, d / 2 - 0.1, 10).rotation.z = Math.PI / 2;
    B(g, 0.025, 0.03, 0.34, inox, s * (w / 2 - 0.1), 0.45, 0.0, 0.004);
    B(g, 0.02, 0.4, 0.02, inox, s * (w / 2 - 0.1), 0.45, -0.18, 0.004);
    B(g, 0.02, 0.02, 0.18, inox, s * (w / 2 - 0.1), 0.85, -0.22, 0.004);
    B(g, 0.02, 0.4, 0.02, inox, s * (w / 2 - 0.12), 0.1, 0.3, 0.004);
    B(g, 0.08, 0.02, 0.16, inox, s * (w / 2 - 0.14), 0.1, 0.46, 0.004);
  }
  B(g, w - 0.2, 0.05, 0.42, mat('tecido', '#2f2e2c'), 0, 0.45, 0.0, 0.02);
  B(g, w - 0.2, 0.4, 0.05, mat('tecido', '#2f2e2c'), 0, 0.5, -0.2, 0.02);
  const p = pessoa({ pose: 'sentada', seat: 0.45, v: 2 }); p.position.set(0, 0.0, -0.05); g.add(p);
}
export function gabarito(g, it, c) {
  const { w, d } = it, k = c.cfg?.k;
  const m = new THREE.MeshBasicMaterial({ color: k === 'giro' ? '#2aa7d8' : k === 'cubo' ? '#d89a2a' : '#59b36b', transparent: true, opacity: 0.5, depthWrite: false, side: THREE.DoubleSide });
  if (k === 'giro') {
    const r = Math.min(w, d) / 2;
    const disc = new THREE.Mesh(new THREE.CircleGeometry(r, 56), m); disc.rotation.x = -Math.PI / 2; disc.position.y = 0.012; g.add(disc);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 6, 64), new THREE.MeshBasicMaterial({ color: '#1b7fa8' })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.014; g.add(ring);
  } else if (k === 'cubo') {
    const cubo = new THREE.Mesh(new THREE.BoxGeometry(w, it.h, d), m); cubo.position.y = it.h / 2; g.add(cubo);
    const ed = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, it.h, d)), new THREE.LineBasicMaterial({ color: '#8a5d0b' })); ed.position.y = it.h / 2; g.add(ed);
  } else {
    const r = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); r.rotation.x = -Math.PI / 2; r.position.y = 0.012; g.add(r);
    const ed = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, d)), new THREE.LineBasicMaterial({ color: '#2f7d41' })); ed.rotation.x = -Math.PI / 2; ed.position.y = 0.014; g.add(ed);
  }
}

// ---------------------------------------------------------------- mapa de construtores novos
export const extra = {
  armario, guardaRoupa, geladeira, fogao, cooktop, coifa, lavaLoucas, maquina, eletroP, mesaJ, sofaCanto, acess,
  pessoaEscala, cadeiraRodas, gabarito,
  // modelos antigos que agora são articulados
  gaveteiro(g, it, c) { return armario(g, it, { ...c, cfg: { k: 'base', tampo: c.tampo ? 'granito' : null, comp: [['gav', null, Math.max(2, Math.round((it.h - (c.tampo ? 0.03 : 0)) / 0.22))]], semPlinto: c.id === 'criado', ...(c.cfg || {}) } }); },
  aereo(g, it, c) { return armario(g, it, { ...c, cfg: { k: 'aereo', louca: true, ...(c.cfg || {}) } }); },
  jantar(g, it, c) { return mesaJ(g, it, { ...c, cfg: { forma: 'ret', lugares: 4, estilo: 'madeira', ...(c.cfg || {}) } }); },
  jantarRedonda(g, it, c) { return mesaJ(g, it, { ...c, cfg: { forma: 'red', lugares: 4, estilo: 'madeira', ...(c.cfg || {}) } }); },
};
