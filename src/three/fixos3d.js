// Peças fixas do apartamento: pia, tanque, louças sanitárias e box. Cada uma aceita opções (ver data/fixos.js).
import { THREE, mat, add, B, cyl, parte } from './helpers3d.js';
import { armario, torneira, cuba, matTampo } from './mobiliario.js';
import { VIDROS } from '../data/fixos.js';

function matVidro(k = 'incolor') {
  const v = VIDROS[k] || VIDROS.incolor;
  return new THREE.MeshPhysicalMaterial({ color: v.cor, roughness: k === 'jateado' ? 0.7 : 0.05, transparent: true, opacity: v.op, depthWrite: false });
}
const vidroCache = new Map();
export function vidro(k) { if (!vidroCache.has(k)) vidroCache.set(k, matVidro(k)); return vidroCache.get(k); }

const fix = {
  bancada(g, f, o) {
    const { w, d, h } = f;
    const arm = o.armario && o.armario !== 'nenhum';
    const comp = o.armario === 'gavetas' ? [['gav', null, Math.max(2, Math.round((h - 0.13) / 0.2))]]
      : o.armario === 'misto' ? [['portas', null, w > 0.9 ? 2 : 1], ['gav', 0.17, 1]] : [['portas', null, w > 0.9 ? 2 : 1]];
    if (arm) {
      armario(g, { w, d, h, cor: o.cor || '#f1efea' }, { paleta: 'madeira', cfg: { k: 'base', tampo: o.tampo || 'granito', cuba: o.cuba, torneira: o.torneira, escorredor: o.escorredor, comp, puxador: 'barra' } });
      return;
    }
    // somente a bancada (como entregue): tampo, cuba, torneira e pé direito de apoio
    B(g, w, 0.03, d, matTampo(o.tampo), 0, h - 0.03, 0, 0.003);
    B(g, w, 0.10, 0.02, matTampo(o.tampo), 0, h, -d / 2 + 0.01, 0.003);
    if (o.cuba) {
      const dois = o.cuba === 2, cw = dois ? 0.36 : 0.50;
      for (const s of (dois ? [-1, 1] : [0])) cuba(g, dois ? s * w * 0.2 : -w * 0.12, h - 0.0, 0.02, cw, 0.36);
      torneira(g, dois ? 0 : -w * 0.12, h, -d / 2 + 0.07, o.torneira);
    }
    if (o.escorredor) B(g, 0.38, 0.012, 0.3, mat('inox'), w * 0.26, h, 0.0, 0.002);
    // painéis laterais de apoio (a bancada fica sobre mãos-francesas ou sobre as paredes)
    B(g, 0.03, h - 0.03, d - 0.05, mat('laca', '#d8d4cc'), w / 2 - 0.015, 0, 0, 0.004);
  },
  tanque(g, f, o) {
    const { w, d, h } = f;
    const cm = new THREE.MeshStandardMaterial({ color: o.cor || '#f6f5f2', roughness: 0.18 });
    const modelo = o.modelo || 'ceramica';
    if (modelo === 'ceramica' || modelo === 'plastico') {
      const mm = modelo === 'plastico' ? new THREE.MeshStandardMaterial({ color: o.cor || '#f6f5f2', roughness: 0.6 }) : cm;
      B(g, w, 0.30, d, mm, 0, h - 0.30, 0, 0.03);
      B(g, w - 0.10, 0.006, d - 0.12, mat('laca', '#cfd2d4'), 0, h - 0.004, 0.0, 0.002); // fundo da cuba
      for (let i = 0; i < 6; i++) B(g, w - 0.14, 0.006, 0.014, mm, 0, h - 0.002 + 0.0, d / 2 - 0.18 + i * 0.026 - 0.12, 0.002); // tábua de lavar
      if (modelo === 'ceramica') B(g, 0.12, h - 0.30, 0.14, mm, 0, 0, -d / 2 + 0.11, 0.02);
      else for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, 0.016, 0.016, h - 0.30, mat('metal', '#999'), sx * (w / 2 - 0.05), 0, sz * (d / 2 - 0.05), 8);
    } else {
      const gran = modelo === 'granito';
      const mm = gran ? mat('granito') : mat('inox');
      const arm = o.armario && o.armario !== 'nenhum';
      if (arm) {
        armario(g, { w, d, h: h - 0.0, cor: '#f1efea' }, { paleta: 'madeira', cfg: { k: 'base', tampo: gran ? 'granito' : 'inox', cuba: 1, torneira: o.torneira, comp: [['portas', null, w > 0.7 ? 2 : 1]] } });
        return;
      }
      B(g, w, 0.04, d, mm, 0, h - 0.04, 0, 0.004);
      cuba(g, 0, h, 0.0, w - 0.14, d - 0.14);
      for (const sx of [-1, 1]) B(g, 0.04, h - 0.04, d - 0.05, mat('laca', '#d8d4cc'), sx * (w / 2 - 0.02), 0, 0, 0.004);
      B(g, w, 0.08, 0.016, mm, 0, h, -d / 2 + 0.008, 0.003);
    }
    torneira(g, 0, h, -d / 2 + 0.05, o.torneira, false);
  },
  vaso(g, f, o) {
    const { w, d } = f;
    const cm = new THREE.MeshStandardMaterial({ color: o.cor || '#f6f5f2', roughness: 0.16 });
    const as = new THREE.MeshStandardMaterial({ color: o.assento || '#f6f5f2', roughness: 0.4 });
    const modelo = o.modelo || 'acoplada';
    const alt = modelo === 'suspensa' ? 0.40 : 0.40;
    const frente = modelo === 'acoplada' ? 0.18 : 0.06;
    if (modelo === 'acoplada') B(g, w, 0.36, 0.18, cm, 0, 0.42, -d / 2 + 0.09, 0.04);
    if (modelo === 'embutida') { B(g, 0.2, 0.14, 0.012, mat('inox'), 0, 1.0, -d / 2 + 0.006, 0.004); B(g, 0.04, 0.04, 0.012, mat('laca', '#fff'), 0, 1.0, -d / 2 + 0.014, 0.002); }
    const base = modelo === 'suspensa' ? 0.0 : 0.0;
    const bowl = cyl(g, w / 2, w * 0.36, alt, cm, 0, base, frente / 2 + 0.06, 28); bowl.scale.z = (d - frente) / w * 1.6 > 1.9 ? 1.9 : (d - frente) / w * 1.7;
    if (modelo === 'suspensa') { bowl.position.y = 0.0; B(g, w * 0.8, 0.02, 0.1, mat('metal', '#999'), 0, 0.2, -d / 2 + 0.05, 0.004); }
    const tampa = cyl(g, w / 2 + 0.005, w / 2 + 0.005, 0.025, as, 0, alt, frente / 2 + 0.06, 28); tampa.scale.z = bowl.scale.z;
    void tampa;
  },
  lavatorio(g, f, o) {
    const { w, d, h } = f, cm = new THREE.MeshStandardMaterial({ color: o.cor || '#f6f5f2', roughness: 0.16 });
    const modelo = o.modelo || 'coluna';
    if (modelo === 'coluna') {
      B(g, w, 0.16, d, cm, 0, h - 0.16, 0, 0.05);
      B(g, 0.16, h - 0.16, 0.16, cm, 0, 0, -d / 2 + 0.11, 0.04);
      torneira(g, 0, h, -d / 2 + 0.05, o.torneira, false);
    } else if (modelo === 'suspenso') {
      B(g, w, 0.16, d, cm, 0, h - 0.16, 0, 0.05);
      B(g, 0.1, 0.10, 0.1, mat('metal', '#999'), 0, h - 0.28, -d / 2 + 0.06, 0.01);
      torneira(g, 0, h, -d / 2 + 0.05, o.torneira, false);
    } else {
      // gabinete ou cuba de apoio
      const apoio = modelo === 'apoio', hg = apoio ? h - 0.12 : h;
      armario(g, { w: Math.max(w, 0.5), d, h: hg, cor: o.corArm || '#c9a77c' }, { paleta: 'madeira', cfg: { k: 'base', tampo: 'branco', respingo: true, comp: o.armario === 'gavetas' ? [['gav', null, 2]] : [['portas', null, w > 0.7 ? 2 : 1]], puxador: 'barra' } });
      if (apoio) {
        const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), cm); bowl.scale.set(Math.min(1.0, w / 0.5), 0.55, Math.min(1.0, d / 0.4)); bowl.rotation.x = Math.PI; bowl.position.set(0, hg + 0.12, 0.0); g.add(bowl);
        const bw = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * Math.min(1.0, w / 0.5), 0.2 * Math.min(1.0, w / 0.5), 0.02, 28), cm); bw.position.set(0, hg + 0.12, 0.0); g.add(bw);
        torneira(g, 0, hg + 0.12, -d / 2 + 0.06, o.torneira, true);
      } else {
        cuba(g, 0, h, 0.0, Math.min(0.45, w - 0.1), Math.min(0.36, d - 0.08), 'ceramica');
        torneira(g, 0, h, -d / 2 + 0.07, o.torneira, false);
      }
    }
    if (o.espelho) { B(g, Math.min(0.8, w + 0.1), 0.8, 0.02, mat('espelho'), 0, h + 0.2, -d / 2 + 0.01, 0.004); }
  },
  box(g, f, o, peDireito) {
    const { w, d } = f, H = 1.95;
    const modelo = o.modelo || 'correr';
    const metal = new THREE.MeshStandardMaterial({ color: o.metal || '#c9ccd0', roughness: 0.25, metalness: 0.85 });
    cyl(g, 0.04, 0.04, 0.012, mat('metal', '#3a3a3a'), 0, 0, 0, 16); // ralo
    B(g, 0.12, 0.006, 0.12, mat('inox'), 0, 0, 0, 0.002);
    // chuveiro
    if (o.ducha === 'teto') {
      const ph = Math.min(peDireito || 2.7, 2.7) - 0.18;
      cyl(g, 0.012, 0.012, 0.2, metal, 0, ph, -d / 2 + 0.28, 8);
      cyl(g, 0.12, 0.12, 0.012, metal, 0, ph - 0.012, -d / 2 + 0.28, 28);
    } else {
      cyl(g, 0.012, 0.012, 0.3, metal, 0, 1.78, -d / 2 + 0.02, 8);
      const braco = B(g, 0.016, 0.016, 0.26, metal, 0, 2.06, -d / 2 + 0.13, 0.006); void braco;
      cyl(g, 0.065, 0.075, 0.016, metal, 0, 2.02, -d / 2 + 0.26, 24).rotation.x = 0.35;
    }
    B(g, 0.11, 0.18, 0.014, metal, w * 0.3, 1.1, -d / 2 + 0.008, 0.004);
    if (o.banco) B(g, w - 0.1, 0.05, 0.3, mat('madeira', '#c9a77c'), 0, 0.42, -d / 2 + 0.16, 0.006);
    if (modelo === 'nenhum') return;
    const soleira = B(g, w, 0.025, 0.06, mat('granito'), 0, 0, d / 2 - 0.03, 0.002); void soleira;
    if (modelo === 'cortina') {
      cyl(g, 0.012, 0.012, w, metal, 0, 1.95, d / 2 - 0.02, 8).rotation.z = Math.PI / 2;
      const geo = new THREE.PlaneGeometry(w * 0.6, 1.85, 14, 1), p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(p.getX(i) * 22) * 0.025);
      geo.computeVertexNormals();
      add(g, geo, new THREE.MeshStandardMaterial({ color: '#d9e4e8', roughness: 0.9, side: THREE.DoubleSide, transparent: true, opacity: 0.85 }), -w * 0.18, 1.0, d / 2 - 0.02);
      return;
    }
    const perfil = new THREE.MeshStandardMaterial({ color: o.perfil || '#b9bcc0', roughness: 0.35, metalness: 0.7 });
    const vd = vidro(o.vidro || 'incolor');
    const zf = d / 2 - 0.01;
    const frame = (x, y, w2, h2, parent = g, z = zf) => {
      B(parent, w2, 0.03, 0.03, perfil, x, y, z, 0.004); B(parent, w2, 0.03, 0.03, perfil, x, y + h2 - 0.03, z, 0.004);
      B(parent, 0.03, h2, 0.03, perfil, x - w2 / 2 + 0.015, y, z, 0.004); B(parent, 0.03, h2, 0.03, perfil, x + w2 / 2 - 0.015, y, z, 0.004);
    };
    if (modelo === 'fixo') {
      frame(0, 0.03, w * 0.98, H); const v = add(g, new THREE.BoxGeometry(w * 0.98 - 0.05, H - 0.06, 0.008), vd, 0, 0.03 + H / 2, zf); v.castShadow = false;
    } else if (modelo === 'correr') {
      B(g, w, 0.03, 0.05, perfil, 0, 0, zf, 0.004); B(g, w, 0.03, 0.05, perfil, 0, H + 0.03, zf, 0.004);
      // painel fixo (esquerda) e painel de correr (direita)
      frame(-w * 0.25, 0.03, w * 0.5, H, g, zf - 0.02); { const v = add(g, new THREE.BoxGeometry(w * 0.5 - 0.05, H - 0.06, 0.008), vd, -w * 0.25, 0.03 + H / 2, zf - 0.02); v.castShadow = false; }
      const pv = new THREE.Group(); pv.position.set(w * 0.25, 0, zf + 0.012);
      frame(0, 0.03, w * 0.5, H, pv, 0); { const v = add(pv, new THREE.BoxGeometry(w * 0.5 - 0.05, H - 0.06, 0.008), vd, 0, 0.03 + H / 2, 0); v.castShadow = false; }
      B(pv, 0.02, 0.4, 0.03, mat('inox'), -w * 0.18, 0.9, 0.025, 0.006);
      parte(g, pv, { grupo: 'portas', d: [-w * 0.46, 0, 0] });
      g.add(pv);
    } else {
      // de abrir: painel fixo + porta articulada
      const pf = w * 0.35, pw = w * 0.62;
      frame(-w / 2 + pf / 2, 0.03, pf, H); { const v = add(g, new THREE.BoxGeometry(pf - 0.05, H - 0.06, 0.008), vd, -w / 2 + pf / 2, 0.03 + H / 2, zf); v.castShadow = false; }
      const pv = new THREE.Group(); pv.position.set(w / 2 - pw, 0, zf);
      frame(pw / 2, 0.03, pw, H, pv, 0); { const v = add(pv, new THREE.BoxGeometry(pw - 0.05, H - 0.06, 0.008), vd, pw / 2, 0.03 + H / 2, 0); v.castShadow = false; }
      B(pv, 0.02, 0.4, 0.03, mat('inox'), pw - 0.06, 0.9, 0.025, 0.006);
      parte(g, pv, { grupo: 'portas', r: [0, 1.75, 0] });
      g.add(pv);
    }
  },
};

export function buildFixture(f, peDireito, o = {}) {
  const g = new THREE.Group();
  if (f.oculto || o.oculto) return g;
  (fix[f.tipo] || (() => {}))(g, f, o, peDireito);
  return g;
}
