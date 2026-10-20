// Forro por cômodo: laje lisa, gesso rebaixado, sanca com LED e moldura rebaixada.
// A geometria usa só as bordas que são parede de verdade; a divisa entre ambientes integrados fica aberta.
import * as THREE from 'three';
import { bordasComodo } from '../geom.js';
import { geomForro, tetoY, tetoMin } from '../tetoGeo.js';

export { geomForro, tetoY, tetoMin };

const matCache = new Map();
function matTeto(cor) {
  if (!matCache.has(cor)) matCache.set(cor, new THREE.MeshStandardMaterial({ color: cor, roughness: 0.95, side: THREE.DoubleSide }));
  return matCache.get(cor);
}

function plano(poly, y, mat) {
  const sh = new THREE.Shape(poly.map(([x, z]) => new THREE.Vector2(x, z)));
  const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), mat);
  m.rotation.x = Math.PI / 2; m.position.y = y; m.receiveShadow = false;
  return m;
}
function quadV(a, b, y0, y1, mat) {
  const pos = new Float32Array([a[0], y0, a[1], b[0], y0, b[1], b[0], y1, b[1], a[0], y1, a[1]]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex([0, 1, 2, 0, 2, 3]); geo.computeVertexNormals();
  return new THREE.Mesh(geo, mat);
}
function quadH(p0, p1, p2, p3, y, mat) {
  const pos = new Float32Array([p0[0], y, p0[1], p1[0], y, p1[1], p2[0], y, p2[1], p3[0], y, p3[1]]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex([0, 1, 2, 0, 2, 3]); geo.computeVertexNormals();
  return new THREE.Mesh(geo, mat);
}

// Retorna { group, emissivos, glows }. Os meshes do forro levam userData.surface = 'teto'.
export function construirForro(plan, room, cfg, ledCor = '#ffb066') {
  const H = plan.tip.peDireito, g = new THREE.Group();
  const emissivos = [], glows = [];
  const mat = matTeto(cfg.cor);
  const marca = (m) => { m.userData.surface = 'teto'; m.userData.room = room.id; g.add(m); return m; };
  const geo = geomForro(plan, room, cfg);
  const drop = cfg.drop;
  if (cfg.tipo === 'laje') marca(plano(room.poly, H, mat));
  else if (cfg.tipo === 'gesso' || !geo.inner) marca(plano(room.poly, H - drop, mat));
  else {
    const yCentro = cfg.tipo === 'sanca' ? H - drop : H;
    const yFaixa = cfg.tipo === 'sanca' ? H : H - drop;
    marca(plano(geo.inner, yCentro, mat));
    const P = room.poly, I = geo.inner, n = P.length;
    for (let i = 0; i < n; i++) {
      if (!(geo.dists[i] > 0)) continue;
      const j = (i + 1) % n;
      marca(quadH(P[i], P[j], I[j], I[i], yFaixa, mat));
      marca(quadV(I[i], I[j], H - drop, H, mat));
      if (cfg.tipo === 'sanca') {
        const b = geo.bordas[i], len = Math.hypot(I[j][0] - I[i][0], I[j][1] - I[i][1]);
        const mLed = new THREE.MeshStandardMaterial({ color: '#fff4dc', emissive: ledCor, emissiveIntensity: 1.4, roughness: 0.5 });
        emissivos.push(mLed);
        const led = new THREE.Mesh(new THREE.BoxGeometry(len, 0.012, 0.03), mLed);
        const mx = (I[i][0] + I[j][0]) / 2 - b.nx * 0.045, mz = (I[i][1] + I[j][1]) / 2 - b.ny * 0.045;
        led.position.set(mx, H - 0.008, mz); led.rotation.y = -Math.atan2(I[j][1] - I[i][1], I[j][0] - I[i][0]);
        g.add(led);
        const mGlow = new THREE.MeshBasicMaterial({ color: ledCor, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
        glows.push(mGlow);
        const larg = Math.max(0.1, geo.dists[i] - 0.03);
        const gl = new THREE.Mesh(new THREE.PlaneGeometry(len, larg), mGlow);
        gl.rotation.set(Math.PI / 2, 0, 0);
        const pivot = new THREE.Group();
        pivot.position.set((I[i][0] + I[j][0]) / 2 - b.nx * (0.03 + larg / 2), H - 0.004, (I[i][1] + I[j][1]) / 2 - b.ny * (0.03 + larg / 2));
        pivot.rotation.y = -Math.atan2(I[j][1] - I[i][1], I[j][0] - I[i][0]);
        pivot.add(gl); g.add(pivot);
      }
    }
  }
  g.userData.room = room.id;
  return { group: g, emissivos, glows };
}
