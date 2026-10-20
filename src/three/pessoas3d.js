// Pessoas simplificadas (cápsulas e esferas) para dar escala e mostrar cadeiras ocupadas.
// Origem no piso, sob o quadril; a pessoa olha para +z.
import * as THREE from 'three';

const mats = new Map();
function m(cor) {
  if (!mats.has(cor)) mats.set(cor, new THREE.MeshStandardMaterial({ color: cor, roughness: 0.8 }));
  return mats.get(cor);
}
const capCache = new Map();
function capsula(r, len) {
  const k = `${r.toFixed(3)}|${len.toFixed(3)}`;
  if (!capCache.has(k)) { const g = new THREE.CapsuleGeometry(r, Math.max(0.001, len), 4, 10); g.userData.shared = true; capCache.set(k, g); }
  return capCache.get(k);
}
const esf = new THREE.SphereGeometry(1, 16, 12); esf.userData.shared = true;
const Y = new THREE.Vector3(0, 1, 0);
function seg(g, a, b, r, mat) {
  const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), dir = Bv.clone().sub(A), L = dir.length();
  const mesh = new THREE.Mesh(capsula(r, L - 2 * r), mat);
  mesh.position.copy(A).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(Y, dir.normalize());
  mesh.castShadow = true; g.add(mesh); return mesh;
}
const TONS = ['#e0b08d', '#c68642', '#8d5524', '#f1c9a5', '#6b4226'];
const ROUPAS = [['#3f5f6b', '#2f3a4a'], ['#b46a4c', '#3b3b3b'], ['#7d8461', '#4b4338'], ['#d1a54a', '#2b3a55'], ['#8c8c92', '#2d2d33']];

// opts: { pose: 'em-pe' | 'sentada', seat: altura do assento (m), alt: altura total (m), v: variante 0..4, ry }
export function pessoa({ pose = 'em-pe', seat = 0.46, alt = 1.72, v = 0 } = {}) {
  const g = new THREE.Group();
  const pele = m(TONS[v % TONS.length]), [camisa, calca] = ROUPAS[v % ROUPAS.length].map(m);
  const cabelo = m(['#2b2118', '#6b4a2b', '#1a1a1a', '#b88a4a', '#3a2a1c'][v % 5]);
  const s = alt / 1.72;
  const R = { perna: 0.062 * s, braco: 0.04 * s, torso: 0.17 * s, cab: 0.105 * s };
  if (pose === 'em-pe') {
    const q = 0.92 * s; // quadril
    for (const sx of [-1, 1]) {
      seg(g, [sx * 0.09 * s, q, 0], [sx * 0.095 * s, 0.07 * s, 0.01], R.perna, calca);
      const pe = new THREE.Mesh(new THREE.BoxGeometry(0.09 * s, 0.06 * s, 0.24 * s), m('#222')); pe.position.set(sx * 0.095 * s, 0.03 * s, 0.05 * s); pe.castShadow = true; g.add(pe);
    }
    const tor = seg(g, [0, q + 0.02 * s, 0], [0, 1.40 * s, 0], R.torso, camisa); tor.scale.z = 0.62;
    for (const sx of [-1, 1]) seg(g, [sx * 0.2 * s, 1.38 * s, 0], [sx * 0.23 * s, 0.88 * s, 0.03], R.braco, camisa);
    const pesc = new THREE.Mesh(new THREE.CylinderGeometry(0.045 * s, 0.05 * s, 0.08 * s, 10), pele); pesc.position.y = 1.5 * s; g.add(pesc);
    const cab = new THREE.Mesh(esf, pele); cab.scale.set(R.cab * 0.9, R.cab * 1.12, R.cab); cab.position.set(0, 1.62 * s, 0.01); cab.castShadow = true; g.add(cab);
    const cel = new THREE.Mesh(esf, cabelo); cel.scale.set(R.cab * 0.95, R.cab * 0.75, R.cab * 1.02); cel.position.set(0, 1.66 * s, -0.012); g.add(cel);
  } else {
    const hs = seat, q = hs + 0.09 * s;
    for (const sx of [-1, 1]) {
      seg(g, [sx * 0.09 * s, q, -0.02 * s], [sx * 0.095 * s, q + 0.01, 0.40 * s], R.perna, calca);        // coxa
      seg(g, [sx * 0.095 * s, q, 0.40 * s], [sx * 0.10 * s, 0.07 * s, 0.43 * s], R.perna * 0.9, calca);   // canela
      const pe = new THREE.Mesh(new THREE.BoxGeometry(0.09 * s, 0.06 * s, 0.24 * s), m('#222')); pe.position.set(sx * 0.10 * s, 0.03 * s, 0.50 * s); pe.castShadow = true; g.add(pe);
    }
    const alto = q + 0.50 * s;
    const tor = seg(g, [0, q + 0.02 * s, -0.04 * s], [0, alto - 0.04 * s, -0.06 * s], R.torso, camisa); tor.scale.z = 0.62;
    for (const sx of [-1, 1]) {
      seg(g, [sx * 0.2 * s, alto - 0.07 * s, -0.06 * s], [sx * 0.21 * s, q + 0.12 * s, 0.0], R.braco, camisa);
      seg(g, [sx * 0.21 * s, q + 0.12 * s, 0.0], [sx * 0.13 * s, q + 0.16 * s, 0.26 * s], R.braco * 0.9, pele);
    }
    const cab = new THREE.Mesh(esf, pele); cab.scale.set(R.cab * 0.9, R.cab * 1.12, R.cab); cab.position.set(0, alto + 0.12 * s, -0.04 * s); cab.castShadow = true; g.add(cab);
    const cel = new THREE.Mesh(esf, cabelo); cel.scale.set(R.cab * 0.95, R.cab * 0.75, R.cab * 1.02); cel.position.set(0, alto + 0.16 * s, -0.07 * s); g.add(cel);
  }
  g.userData.pessoa = true;
  return g;
}
