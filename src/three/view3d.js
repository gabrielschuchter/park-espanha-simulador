// Visualização 3D sincronizada com o editor. Planta (x, y) → mundo (x, z); altura = y.
// Além de mostrar o apartamento, a cena recebe toques: móveis (mover, girar), piso, parede, forro e interruptores.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { wallInfo, wallPoint, rectCorners, pointInPoly, rad, deg, bbox, rayPolys, bordasComodo, roomAt, polyCentroid } from '../geom.js';
import { catalogoPorId } from '../data/catalogo.js';
import { buildFurniture, buildFixture, mat } from './furniture3d.js';
import { texCeu, texAcab } from './textures.js';
import { store, live, commit, select } from '../store.js';
import { pisoDe, paredeDe, tetoDe, luzDe, rodapeDe, texParedePorId, tempPorId, COR_PAREDE_PADRAO } from '../data/acabamentos.js';
import { construirForro, tetoY, tetoMin } from './teto.js';
import { snapItem, colide } from '../snap.js';

const COR_SEL = '#1f9bc2', COR_ERRO = '#e0463a';
const FATOR_PERIODO = { dia: 0.25, tarde: 0.75, noite: 1 };
const ALTURA_BAIXA = 0.10; // escala vertical das paredes "recortadas"

export function createView3D(container, opts = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.localClippingEnabled = true;
  container.appendChild(renderer.domElement);
  renderer.domElement.className = 'gl';

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.55;
  const ceu = texCeu();
  scene.background = ceu;

  const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 400);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true; controls.dampingFactor = 0.09;
  controls.maxPolarAngle = Math.PI * 0.47; controls.minDistance = 2; controls.maxDistance = 90;
  controls.screenSpacePanning = true;

  const hemi = new THREE.HemisphereLight('#eef4ff', '#b8a990', 0.45); scene.add(hemi);
  const sol = new THREE.DirectionalLight('#fff3e0', 2.6);
  sol.castShadow = true; sol.shadow.mapSize.set(2048, 2048); sol.shadow.bias = -0.0004; sol.shadow.normalBias = 0.02;
  scene.add(sol); scene.add(sol.target);

  // lâmpadas: número fixo de PointLight reaproveitadas pelas luminárias mais próximas do foco
  const NLUZ = window.matchMedia('(pointer: coarse)').matches ? 8 : 12;
  const pool = [];
  for (let i = 0; i < NLUZ; i++) { const l = new THREE.PointLight('#ffd9a6', 0, 6, 1.6); l.position.set(0, -50, 0); scene.add(l); pool.push(l); }

  const corte = new THREE.Plane(new THREE.Vector3(0, -1, 0), 99);
  const matParede = new THREE.MeshStandardMaterial({ color: COR_PAREDE_PADRAO, roughness: 0.92, clippingPlanes: [corte], side: THREE.DoubleSide, shadowSide: THREE.FrontSide });

  const estrutura = new THREE.Group(); scene.add(estrutura); // laje, chão, fixos
  const paredesG = new THREE.Group(); scene.add(paredesG);   // um grupo por parede (recorte)
  const pisosG = new THREE.Group(); scene.add(pisosG);
  const tetosG = new THREE.Group(); scene.add(tetosG);
  const pontosG = new THREE.Group(); scene.add(pontosG);     // ponto de luz padrão e interruptores
  const moveis = new THREE.Group(); scene.add(moveis);
  const alvoG = new THREE.Group(); scene.add(alvoG);         // realce de superfície sob o cursor
  const gizmoG = new THREE.Group(); scene.add(gizmoG);

  const selBox = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), new THREE.LineBasicMaterial({ color: COR_SEL, depthTest: false, transparent: true }));
  selBox.renderOrder = 10; selBox.visible = false; scene.add(selBox);

  let plan = null, mode = 'orbita', periodo = 'dia', paredesModo = 'recorte', visivel = true, dirty = true;
  let ferramenta = 'moveis', escopo = 'comodo', laje = null, chao = null, enquadrado = false;
  const meshPorUid = new Map(), assinatura = new Map();
  const wallGroups = new Map(); // id → { g, sub, centro: [x, z] }
  let pisoMeshes = [], peleMeshes = [], caixasParede = [], tetoMeshes = [], swMeshes = [];
  let tetoPorRoom = new Map(); // room → { group, emissivos, glows }
  let bocais = new Map();      // room → { mesh, mat }
  const requestRender = () => { dirty = true; };
  const acab = () => store.projeto?.acab;

  // ------------------------------------------------------------ utilidades
  function limpar(group) {
    for (const c of [...group.children]) {
      group.remove(c);
      c.traverse?.((o) => { if (o.geometry && !o.geometry.userData?.shared) o.geometry.dispose?.(); });
    }
  }
  function roomDe(x, y) {
    const r = roomAt(plan, x, y);
    if (r) return r;
    let best = null, bd = Infinity;
    for (const q of plan.rooms) { const d = Math.hypot(q.centro[0] - x, q.centro[1] - y); if (d < bd) { bd = d; best = q; } }
    return best;
  }

  // ------------------------------------------------------------ materiais de acabamento
  const cachePiso = new Map(), cacheParede = new Map();
  function matPiso(def) {
    if (!cachePiso.has(def.id)) {
      const t = texAcab(def); t.repeat.set(1 / def.cobre, 1 / def.cobre);
      cachePiso.set(def.id, new THREE.MeshStandardMaterial({ map: t, roughness: def.rough ?? 0.3 }));
    }
    return cachePiso.get(def.id);
  }
  function matParedeFin(f) {
    const key = f.t === 'tex' ? `tex:${f.id}` : `tinta:${f.cor}`;
    if (!cacheParede.has(key)) {
      if (f.t === 'tex') {
        const def = texParedePorId[f.id] || texParedePorId['azulejo-branco'];
        const t = texAcab({ ...def, id: 'w-' + def.id });
        cacheParede.set(key, new THREE.MeshStandardMaterial({ map: t, roughness: def.rough ?? 0.5, clippingPlanes: [corte] }));
      } else cacheParede.set(key, new THREE.MeshStandardMaterial({ color: f.cor || COR_PAREDE_PADRAO, roughness: 0.9, clippingPlanes: [corte] }));
    }
    return cacheParede.get(key);
  }
  const cobreDe = (f) => (f.t === 'tex' ? (texParedePorId[f.id]?.cobre || 1.2) : 1.2);

  // ------------------------------------------------------------ arquitetura
  function boxWall(w, s0, s1, z0, z1, material, t = w.t) {
    const wi = wallInfo(w), len = s1 - s0, h = z1 - z0;
    if (len < 0.005 || h < 0.005) return null;
    const m = new THREE.Mesh(new THREE.BoxGeometry(len, h, t), material);
    const [cx, cy] = wallPoint(w, (s0 + s1) / 2);
    m.position.set(cx, z0 + h / 2, cy);
    m.rotation.y = -wi.ang;
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }

  function construirArquitetura() {
    limpar(estrutura); limpar(paredesG); wallGroups.clear(); caixasParede = [];
    const { tip } = plan, H = tip.peDireito;
    for (const w of tip.walls) {
      const g = new THREE.Group(), sub = new THREE.Group(); g.add(sub); paredesG.add(g);
      const wi = wallInfo(w);
      wallGroups.set(w.id, { g, sub, centro: [(w.a[0] + w.b[0]) / 2, (w.a[1] + w.b[1]) / 2], esc: 1 });
      void wi;
    }
    for (const p of plan.pieces) {
      const m = boxWall(p.w, p.s0, p.s1, p.z0, p.z1, matParede);
      if (m) { wallGroups.get(p.w.id).g.add(m); caixasParede.push(m); }
      if (p.w.guarda && !p.verga) {
        const cap = boxWall(p.w, p.s0 - 0.01, p.s1 + 0.01, p.z1, p.z1 + 0.025, mat('granito'), p.w.t + 0.04);
        if (cap) wallGroups.get(p.w.id).g.add(cap);
      }
    }
    const { x0, y0, x1, y1 } = plan.bb;
    laje = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.14, y1 - y0), new THREE.MeshStandardMaterial({ color: '#8f8b85', roughness: 1 }));
    laje.position.set((x0 + x1) / 2, -0.071, (y0 + y1) / 2); laje.receiveShadow = true; estrutura.add(laje);
    chao = new THREE.Mesh(new THREE.CircleGeometry(160, 48), new THREE.MeshStandardMaterial({ color: '#9aa58c', roughness: 1 }));
    chao.rotation.x = -Math.PI / 2; chao.position.set((x0 + x1) / 2, -18, (y0 + y1) / 2); estrutura.add(chao);
    for (const o of plan.openings) wallGroups.get(o.wall).g.add(construirAbertura(o, H));
    for (const f of plan.fixos) {
      const g = buildFixture(f, H);
      g.position.set(f.x, 0, f.y); g.rotation.y = -rad(f.rot || 0);
      g.userData.fixo = f.id; estrutura.add(g);
    }
    const cx = (x0 + x1) / 2, cz = (y0 + y1) / 2, span = Math.max(x1 - x0, y1 - y0);
    sol.target.position.set(cx, 0, cz);
    const sc = sol.shadow.camera; sc.left = -span; sc.right = span; sc.top = span; sc.bottom = -span; sc.near = 1; sc.far = 60; sc.updateProjectionMatrix();
    construirPisos(); construirPeles(); construirTetos(); construirPontos();
    aplicarPeriodo(); aplicarModo(true);
    requestRender();
  }

  function construirAbertura(o, H) {
    const g = new THREE.Group();
    const w = o.w, wi = wallInfo(w);
    const alu = mat('laca', '#f2f2f0');
    if (o.porta && !o.correr) {
      for (const s of [o.s0, o.s1]) { const j = boxWall(w, s - 0.02, s + 0.02, 0, o.altura + 0.03, mat('laca', '#f4f2ee'), w.t + 0.02); if (j) g.add(j); }
      const vt = boxWall(w, o.s0 - 0.02, o.s1 + 0.02, o.altura, o.altura + 0.04, mat('laca', '#f4f2ee'), w.t + 0.02); if (vt) g.add(vt);
      const so = boxWall(w, o.s0, o.s1, 0, 0.006, mat('granito'), w.t); if (so) g.add(so);
      const larg = o.largura - 0.03;
      const folha = new THREE.Mesh(new THREE.BoxGeometry(larg, o.altura - 0.01, 0.035), o.entrada ? mat('madeira', '#6e4a31') : mat('laca', '#f6f4f0'));
      const dir = [o.open[0] - o.hinge[0], o.open[1] - o.hinge[1]];
      const L = Math.hypot(...dir), ux = dir[0] / L, uy = dir[1] / L;
      const cx = o.hinge[0] + ux * (larg / 2 + 0.02);
      const cy = o.hinge[1] + uy * (larg / 2 + 0.02);
      folha.position.set(cx + (o.dobradica === 'a' ? wi.ux : -wi.ux) * 0.02, (o.altura - 0.01) / 2, cy + (o.dobradica === 'a' ? wi.uy : -wi.uy) * 0.02);
      folha.rotation.y = -Math.atan2(uy, ux);
      folha.castShadow = true; folha.receiveShadow = true; g.add(folha);
      const mac = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, 0.02), mat('inox'));
      mac.position.set(folha.position.x + ux * (larg / 2 - 0.08), 1.05, folha.position.z + uy * (larg / 2 - 0.08));
      mac.position.x += -uy * 0.03 * (o.abre || 1); mac.rotation.y = folha.rotation.y; g.add(mac);
    } else if (o.correr) {
      const so = boxWall(w, o.s0, o.s1, 0, 0.006, mat('granito'), w.t); if (so) g.add(so);
      const meio = (o.s0 + o.s1) / 2;
      for (const [a, b, off] of [[o.s0, meio + 0.04, -0.025], [meio - 0.04 + 0.45, o.s1, 0.025]]) {
        const vid = boxWall(w, a + 0.04, b - 0.04, 0.06, o.altura - 0.05, mat('vidro'), 0.008);
        const fr = [boxWall(w, a, b, 0, 0.06, alu, 0.04), boxWall(w, a, b, o.altura - 0.05, o.altura, alu, 0.04), boxWall(w, a, a + 0.04, 0, o.altura, alu, 0.04), boxWall(w, b - 0.04, b, 0, o.altura, alu, 0.04)];
        for (const m of [vid, ...fr]) if (m) { m.position.x += wi.nx * off; m.position.z += wi.ny * off; if (m === vid) m.castShadow = false; g.add(m); }
      }
    } else {
      const z0 = o.peitoril, z1 = o.peitoril + o.altura;
      const pe = boxWall(w, o.s0 - 0.03, o.s1 + 0.03, z0 - 0.02, z0, mat('granito'), w.t + 0.06); if (pe) g.add(pe);
      const fr = [boxWall(w, o.s0, o.s1, z0, z0 + 0.04, alu, 0.06), boxWall(w, o.s0, o.s1, z1 - 0.04, z1, alu, 0.06), boxWall(w, o.s0, o.s0 + 0.04, z0, z1, alu, 0.06), boxWall(w, o.s1 - 0.04, o.s1, z0, z1, alu, 0.06)];
      for (const m of fr) if (m) g.add(m);
      if (o.tipo === 'J1') {
        const v = boxWall(w, o.s0 + 0.04, o.s1 - 0.04, z0 + 0.04, z1 - 0.04, new THREE.MeshStandardMaterial({ color: '#e7ecee', roughness: 0.3, transparent: true, opacity: 0.75 }), 0.006);
        if (v) { v.castShadow = false; g.add(v); }
      } else {
        const mid = (o.s0 + o.s1) / 2;
        for (const [a, b, off] of [[o.s0 + 0.04, mid + 0.03, -0.015], [mid - 0.03, o.s1 - 0.04, 0.015]]) {
          const v = boxWall(w, a, b, z0 + 0.04, z1 - 0.04, mat('vidro'), 0.006);
          const ms = boxWall(w, a, a + 0.03, z0 + 0.04, z1 - 0.04, alu, 0.03);
          for (const m of [v, ms]) if (m) { m.position.x += wi.nx * off; m.position.z += wi.ny * off; if (m === v) m.castShadow = false; g.add(m); }
        }
      }
    }
    return g;
  }

  // ------------------------------------------------------------ pisos
  function construirPisos() {
    limpar(pisosG); pisoMeshes = [];
    for (const r of plan.rooms) {
      const shape = new THREE.Shape(r.poly.map(([x, y]) => new THREE.Vector2(x, -y)));
      const f = new THREE.Mesh(new THREE.ShapeGeometry(shape), matPiso(pisoDe(acab(), r)));
      f.rotation.x = -Math.PI / 2; f.position.y = 0.001; f.receiveShadow = true;
      f.userData = { surface: 'piso', room: r.id };
      pisosG.add(f); pisoMeshes.push(f);
    }
  }

  // ------------------------------------------------------------ paredes (revestimento interno por borda)
  function quad(p, ux, uy, nx, ny, a, b, z0, z1, material, cobre) {
    const off = 0.003;
    const ax = p[0] + ux * a + nx * off, ay = p[1] + uy * a + ny * off;
    const bx = p[0] + ux * b + nx * off, by = p[1] + uy * b + ny * off;
    const pos = new Float32Array([ax, z0, ay, bx, z0, by, bx, z1, by, ax, z1, ay]);
    const k = 1 / cobre;
    const uv = new Float32Array([a * k, z0 * k, b * k, z0 * k, b * k, z1 * k, a * k, z1 * k]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const facesIn = (-(by - ay)) * nx + (bx - ax) * ny;
    geo.setIndex(facesIn > 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]);
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, material); m.receiveShadow = true;
    return m;
  }
  function rodape(p, ux, uy, nx, ny, a, b, alt, cor) {
    const esp = 0.012, len = b - a;
    const m = new THREE.Mesh(new THREE.BoxGeometry(len, alt, esp), mat('laca', cor));
    const cx = p[0] + ux * (a + b) / 2 + nx * (0.003 + esp / 2), cy = p[1] + uy * (a + b) / 2 + ny * (0.003 + esp / 2);
    m.position.set(cx, alt / 2, cy); m.rotation.y = -Math.atan2(uy, ux);
    m.castShadow = false; m.receiveShadow = true;
    return m;
  }

  function construirPeles() {
    for (const { sub } of wallGroups.values()) limpar(sub);
    peleMeshes = [];
    const H = plan.tip.peDireito, A = acab();
    const azulBox = { t: 'tex', id: 'azulejo-branco' };
    for (const r of plan.rooms) {
      const P = r.poly, bordas = bordasComodo(plan, r), rp = rodapeDe(A, r);
      for (const bd of bordas) {
        if (bd.curta || !bd.cobertos.length) continue;
        const { p, q, L, ux, uy, nx, ny, cobertos, abert } = bd;
        const fin = paredeDe(A, r, bd.i);
        const base = matParedeFin(fin);
        const meia = fin.meia ? matParedeFin(fin.meia) : null;
        const especiais = [];
        if (r.banho) {
          for (const f of plan.fixos) {
            if (f.tipo !== 'box' || !pointInPoly(f.x, f.y, P)) continue;
            const cs = rectCorners(f);
            const proj = cs.map(([x, y]) => [(x - p[0]) * ux + (y - p[1]) * uy, Math.abs((x - p[0]) * nx + (y - p[1]) * ny)]);
            if (Math.min(...proj.map((c) => c[1])) < 0.06) especiais.push([Math.min(...proj.map((c) => c[0])), Math.max(...proj.map((c) => c[0])), H]);
          }
        }
        for (const f of plan.fixos) {
          if (f.tipo !== 'bancada' || !pointInPoly(f.x, f.y, P)) continue;
          const cs = rectCorners(f);
          const proj = cs.map(([x, y]) => [(x - p[0]) * ux + (y - p[1]) * uy, Math.abs((x - p[0]) * nx + (y - p[1]) * ny)]);
          if (Math.min(...proj.map((c) => c[1])) < 0.06) especiais.push([Math.min(...proj.map((c) => c[0])) - 0.3, Math.max(...proj.map((c) => c[0])) + 0.3, 1.55]);
        }
        const cortes = new Set([0, L]);
        for (const [a, b] of cobertos) { cortes.add(a); cortes.add(b); }
        for (const x of abert) { cortes.add(Math.max(0, x.a)); cortes.add(Math.min(L, x.b)); }
        for (const e of especiais) { cortes.add(Math.max(0, Math.min(L, e[0]))); cortes.add(Math.max(0, Math.min(L, e[1]))); }
        const xs = [...cortes].sort((a, b) => a - b);
        for (let k = 0; k < xs.length - 1; k++) {
          const a = xs[k], b = xs[k + 1]; if (b - a < 0.005) continue;
          const m = (a + b) / 2;
          const cob = cobertos.find(([c0, c1]) => m > c0 && m < c1);
          if (!cob) continue;
          const grupo = wallGroups.get(cob[2]).sub;
          let faixas = [[0, H]];
          const ab = abert.find((x) => m > x.a && m < x.b);
          if (ab) faixas = ab.o.porta ? [[ab.o.altura, H]] : [[0, ab.o.peitoril], [ab.o.peitoril + ab.o.altura, H]];
          const esp = especiais.find((e) => m > e[0] && m < e[1]);
          // camadas de baixo para cima: [z0, z1, material, cobre]
          let camadas;
          if (esp) camadas = [[0, esp[2], matParedeFin(azulBox), 1.2], [esp[2], H, base, cobreDe(fin)]];
          else if (meia) camadas = [[0, fin.meia.alt, meia, cobreDe(fin.meia)], [fin.meia.alt, H, base, cobreDe(fin)]];
          else camadas = [[0, H, base, cobreDe(fin)]];
          for (const [z0, z1] of faixas) {
            if (z1 - z0 < 0.005) continue;
            for (const [c0, c1, material, cobre] of camadas) {
              const lo = Math.max(c0, z0), hi = Math.min(c1, z1);
              if (hi - lo < 0.004) continue;
              const mesh = quad(p, ux, uy, nx, ny, a, b, lo, hi, material, cobre);
              mesh.userData = { surface: 'parede', room: r.id, edge: bd.i };
              grupo.add(mesh); peleMeshes.push(mesh);
            }
            if (rp.alt > 0 && z0 < 0.001) grupo.add(rodape(p, ux, uy, nx, ny, a, b, rp.alt, rp.cor));
          }
        }
      }
    }
    requestRender();
  }

  // ------------------------------------------------------------ forro
  function construirTetos() {
    limpar(tetosG); tetoMeshes = []; tetoPorRoom = new Map();
    const A = acab(), H = plan.tip.peDireito;
    for (const r of plan.rooms) {
      const cfg = tetoDe(A, r), lz = luzDe(A, r);
      const res = construirForro(plan, r, cfg, tempPorId[lz.temp]?.cor);
      tetosG.add(res.group); tetoPorRoom.set(r.id, res);
      res.group.traverse((o) => { if (o.userData.surface === 'teto') tetoMeshes.push(o); });
    }
    // tabicas entre ambientes integrados com forros em alturas diferentes
    const matT = (cor) => new THREE.MeshStandardMaterial({ color: cor, roughness: 0.95, side: THREE.DoubleSide });
    for (const r of plan.rooms) {
      const hr = tetoMin(plan, A, r);
      for (const bd of bordasComodo(plan, r)) {
        if (bd.parede || bd.curta) continue;
        const cx = (bd.p[0] + bd.q[0]) / 2 + bd.nx * -0.12, cy = (bd.p[1] + bd.q[1]) / 2 + bd.ny * -0.12;
        const viz = plan.rooms.find((q) => q !== r && pointInPoly(cx, cy, q.poly));
        if (!viz) continue;
        const hv = tetoMin(plan, A, viz);
        if (hv > hr + 0.004) {
          const pos = new Float32Array([bd.p[0], hr, bd.p[1], bd.q[0], hr, bd.q[1], bd.q[0], hv, bd.q[1], bd.p[0], hv, bd.p[1]]);
          const geo = new THREE.BufferGeometry();
          geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex([0, 1, 2, 0, 2, 3]); geo.computeVertexNormals();
          const tb = new THREE.Mesh(geo, matT(tetoDe(A, r).cor)); tb.userData.room = r.id;
          tetosG.add(tb);
        }
      }
    }
    void H;
    requestRender();
  }

  // ------------------------------------------------------------ pontos de luz e interruptores
  function posInterruptor(r) {
    const bordas = bordasComodo(plan, r);
    const livre = (b, s) => !b.abert.some((x) => s > x.a - 0.12 && s < x.b + 0.12) && s > 0.12 && s < b.L - 0.12;
    for (const b of bordas) {
      if (b.curta || !b.parede) continue;
      for (const x of b.abert) {
        if (!x.o.porta || x.o.correr) continue;
        for (const s of [x.a - 0.17, x.b + 0.17]) if (livre(b, s)) return { b, s };
      }
    }
    const ord = bordas.filter((b) => b.parede && !b.curta).sort((a, b) => b.L - a.L);
    for (const b of ord) for (const s of [0.28, b.L - 0.28, b.L / 2]) if (livre(b, s)) return { b, s };
    return null;
  }
  function construirPontos() {
    limpar(pontosG); swMeshes = []; bocais = new Map();
    for (const r of plan.rooms) {
      // ponto de luz padrão (bocal) no centro do cômodo
      const m = new THREE.MeshStandardMaterial({ color: '#f4f2ee', emissive: '#ffd39a', emissiveIntensity: 1, roughness: 0.6 });
      const bocal = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 20), m);
      bocal.position.set(r.centro[0], 2.6, r.centro[1]); bocal.userData.room = r.id; pontosG.add(bocal);
      bocais.set(r.id, { mesh: bocal, mat: m });
      // interruptor
      const pos = posInterruptor(r);
      if (pos) {
        const { b, s } = pos;
        const x = b.p[0] + b.ux * s + b.nx * 0.008, z = b.p[1] + b.uy * s + b.ny * 0.008;
        const placa = new THREE.Group();
        const corpo = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.075, 0.014), new THREE.MeshStandardMaterial({ color: '#f6f5f2', roughness: 0.4 }));
        const tecla = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.045, 0.008), new THREE.MeshStandardMaterial({ color: '#e5e3de', roughness: 0.4 }));
        tecla.position.z = 0.009;
        placa.add(corpo, tecla);
        placa.position.set(x, 1.10, z); placa.rotation.y = Math.atan2(b.nx, b.ny);
        placa.traverse((o) => { o.userData.sw = r.id; });
        pontosG.add(placa); swMeshes.push(corpo, tecla);
      }
    }
    atualizarPontos();
  }
  function atualizarPontos() {
    if (!plan) return;
    const A = acab();
    const comLuminaria = new Set();
    for (const it of store.projeto.itens) {
      const c = catalogoPorId[it.tipo];
      if (c?.teto && c?.luz) comLuminaria.add(roomDe(it.x, it.y)?.id);
    }
    for (const r of plan.rooms) {
      const b = bocais.get(r.id); if (!b) continue;
      const y = tetoY(plan, A, r.centro[0], r.centro[1]);
      b.mesh.position.y = y - 0.015;
      b.mesh.visible = !comLuminaria.has(r.id) && (mode === 'passeio' || mode === 'forro');
    }
  }

  // ------------------------------------------------------------ luz
  function corLuz(roomId) { const r = plan.rooms.find((q) => q.id === roomId); return tempPorId[luzDe(acab(), r).temp]?.cor || '#ffb066'; }
  function aplicarEmissivos() {
    if (!plan) return;
    const A = acab(), f = FATOR_PERIODO[periodo];
    const intens = (cfg, k = 1) => (cfg.on ? k * (0.35 + 0.65 * cfg.int) * (periodo === 'dia' ? 0.55 : 1) : 0);
    for (const [uid, g] of meshPorUid) {
      const em = g.userData.emissivos; if (!em) continue;
      const it = store.projeto.itens.find((i) => i.uid === uid); if (!it) continue;
      const r = roomDe(it.x, it.y), cfg = luzDe(A, r), cor = tempPorId[cfg.temp]?.cor || '#ffb066';
      for (const m of em) { m.emissive.set(cor); m.emissiveIntensity = intens(cfg, 1.3); }
    }
    for (const r of plan.rooms) {
      const cfg = luzDe(A, r), cor = tempPorId[cfg.temp]?.cor || '#ffb066';
      const t = tetoPorRoom.get(r.id);
      if (t) {
        for (const m of t.emissivos) { m.emissive.set(cor); m.emissiveIntensity = intens(cfg, 1.5); }
        for (const m of t.glows) { m.color.set(cor); m.opacity = cfg.on ? 0.26 * (0.4 + 0.6 * cfg.int) * (periodo === 'dia' ? 0.5 : 1) : 0; }
      }
      const b = bocais.get(r.id);
      if (b) { b.mat.emissive.set(cor); b.mat.emissiveIntensity = intens(cfg, 1.2); }
    }
    void f;
  }
  function coletarEmissores() {
    const A = acab(), H = plan.tip.peDireito, out = [], f = FATOR_PERIODO[periodo];
    const comLuminaria = new Set();
    for (const it of store.projeto.itens) {
      const c = catalogoPorId[it.tipo];
      if (!c?.luz) continue;
      const r = roomDe(it.x, it.y), cfg = luzDe(A, r);
      if (c.teto) comLuminaria.add(r.id);
      if (!cfg.on) continue;
      const tipo = c.luz.tipo;
      const y = (it.elev || 0) + it.h * (c.luz.y ?? 0.5) - (tipo === 'teto' ? 0.04 : 0);
      out.push({ x: it.x, y, z: it.y, cor: tempPorId[cfg.temp]?.cor || '#ffb066', int: 3.4 * c.luz.int * (0.35 + 0.65 * cfg.int) * f, dist: tipo === 'teto' ? 6.5 : tipo === 'parede' ? 4 : 4.5, room: r.id });
    }
    for (const r of plan.rooms) {
      if (r.id === 'circ' && r.areaGeo < 2 && plan.rooms.length > 7 && false) continue;
      const cfg = luzDe(A, r); if (!cfg.on) continue;
      const cor = tempPorId[cfg.temp]?.cor || '#ffb066';
      const cf = tetoDe(A, r);
      if (!comLuminaria.has(r.id)) out.push({ x: r.centro[0], y: tetoY(plan, A, r.centro[0], r.centro[1]) - 0.12, z: r.centro[1], cor, int: 3.2 * (0.35 + 0.65 * cfg.int) * f, dist: 6, room: r.id });
      if (cf.tipo === 'sanca') out.push({ x: r.centro[0], y: H - cf.drop - 0.25, z: r.centro[1], cor, int: 1.9 * (0.35 + 0.65 * cfg.int) * f, dist: 5, room: r.id });
    }
    return out;
  }
  let focoAnterior = new THREE.Vector3(1e9, 0, 0);
  function atualizarPool() {
    if (!plan || !store.projeto) return;
    const em = coletarEmissores();
    const foco = mode === 'passeio' ? walk.pos : controls.target;
    focoAnterior.copy(foco);
    const roomFoco = mode === 'passeio' ? roomDe(foco.x, foco.z)?.id : null;
    em.forEach((e) => { e.score = Math.hypot(e.x - foco.x, e.z - foco.z) - (e.room === roomFoco ? 3 : 0); });
    em.sort((a, b) => a.score - b.score);
    pool.forEach((l, i) => {
      const e = em[i];
      if (!e) { l.intensity = 0; return; }
      l.position.set(e.x, e.y, e.z); l.color.set(e.cor); l.intensity = e.int; l.distance = e.dist;
    });
    requestRender();
  }

  const PER = {
    dia: { sun: (cx, cz) => [cx - 6, 14, cz - 9], si: 2.8, sc: '#fff3e0', hemi: 0.5, env: 0.6, exp: 1.0, bg: true },
    tarde: { sun: (cx, cz) => [cx + 12, 5, cz - 6], si: 2.4, sc: '#ffbf7a', hemi: 0.32, env: 0.38, exp: 1.05, bg: true },
    noite: { sun: (cx, cz) => [cx + 2, 12, cz + 4], si: 0.0, sc: '#9fb4ff', hemi: 0.14, env: 0.22, exp: 1.1, bg: false },
  };
  function aplicarPeriodo() {
    if (!plan) return;
    const { x0, y0, x1, y1 } = plan.bb;
    const cx = (x0 + x1) / 2, cz = (y0 + y1) / 2;
    const P = PER[periodo];
    sol.position.set(...P.sun(cx, cz)); sol.intensity = P.si; sol.color.set(P.sc);
    hemi.intensity = mode === 'forro' ? Math.max(P.hemi, 0.95) : P.hemi;
    scene.environmentIntensity = mode === 'forro' ? Math.max(P.env, 0.8) : P.env;
    renderer.toneMappingExposure = P.exp;
    scene.background = P.bg ? ceu : new THREE.Color('#141a26');
    if (chao) chao.material.color.set(P.bg ? '#9aa58c' : '#20261f');
    aplicarEmissivos(); atualizarPool(); requestRender();
  }

  // ------------------------------------------------------------ móveis
  const anims = [];
  const sigItem = (it) => [it.tipo, it.w, it.d, it.h, it.cor, it.cor2].join('|');
  function aplicarTetoItem(it) {
    const c = catalogoPorId[it.tipo];
    if (c?.teto) it.elev = Math.round((tetoY(plan, acab(), it.x, it.y) - it.h) * 1000) / 1000;
  }
  function animMontagem(g, uid) {
    const base = g.children.map((c) => ({ c, p: c.position.clone(), r: c.rotation.clone() }));
    const n = base.length; if (!n) return;
    let seed = [...uid].reduce((a, ch) => a + ch.charCodeAt(0), 7);
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    base.forEach((b, i) => { b.delay = (i / n) * 0.4; b.off = new THREE.Vector3((rnd() - 0.5) * 0.5, 0.3 + rnd() * 0.5, (rnd() - 0.5) * 0.5); b.rz = (rnd() - 0.5) * 1.4; });
    const t0 = performance.now(), dur = 0.42;
    base.forEach((b) => { b.c.visible = false; });
    anims.push((now) => {
      const t = (now - t0) / 1000;
      let fim = true;
      for (const b of base) {
        const k = Math.max(0, Math.min(1, (t - b.delay) / dur));
        if (k < 1) fim = false;
        if (k <= 0) continue;
        b.c.visible = true;
        const e = 1 - Math.pow(1 - k, 3), o = 1 - e;
        b.c.position.set(b.p.x + b.off.x * o, b.p.y + b.off.y * o, b.p.z + b.off.z * o);
        b.c.rotation.z = b.r.z + b.rz * o;
      }
      dirty = true;
      if (fim) { for (const b of base) { b.c.visible = true; b.c.position.copy(b.p); b.c.rotation.copy(b.r); } opts.onMontado?.(uid); return true; }
      return false;
    });
  }
  function syncItems(itens) {
    const vivos = new Set();
    for (const it of itens) {
      vivos.add(it.uid);
      let g = meshPorUid.get(it.uid);
      const s = sigItem(it);
      if (!g || assinatura.get(it.uid) !== s) {
        const novo = !g && store.novos.has(it.uid);
        if (g) moveis.remove(g);
        g = buildFurniture(it, catalogoPorId[it.tipo]);
        g.userData.uid = it.uid;
        g.traverse((o) => { o.userData.uid = it.uid; });
        meshPorUid.set(it.uid, g); assinatura.set(it.uid, s);
        moveis.add(g);
        g.position.set(it.x, it.elev || 0, it.y); g.rotation.y = -rad(it.rot || 0);
        if (novo) { store.novos.delete(it.uid); animMontagem(g, it.uid); }
      }
      g.position.set(it.x, it.elev || 0, it.y);
      g.rotation.y = -rad(it.rot || 0);
    }
    for (const [uid, g] of meshPorUid) if (!vivos.has(uid)) { moveis.remove(g); meshPorUid.delete(uid); assinatura.delete(uid); }
    aplicarVisibilidadeModo();
    aplicarEmissivos(); atualizarPool(); atualizarPontos();
    syncSel();
    requestRender();
  }

  // ------------------------------------------------------------ seleção e giro
  const gizmoRing = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 6, 64), new THREE.MeshBasicMaterial({ color: COR_SEL, depthTest: false, transparent: true, opacity: 0.9 }));
  gizmoRing.rotation.x = Math.PI / 2; gizmoRing.renderOrder = 11;
  const gizmoHandle = new THREE.Mesh(new THREE.SphereGeometry(0.075, 18, 12), new THREE.MeshBasicMaterial({ color: '#ffffff', depthTest: false }));
  gizmoHandle.renderOrder = 12; gizmoHandle.userData.gizmo = 'rot';
  const gizmoHandleRing = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.016, 8, 24), new THREE.MeshBasicMaterial({ color: COR_SEL, depthTest: false }));
  gizmoHandleRing.renderOrder = 13; gizmoHandleRing.userData.gizmo = 'rot';
  gizmoG.add(gizmoRing, gizmoHandle, gizmoHandleRing); gizmoG.visible = false;
  const gizmoHit = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshBasicMaterial({ visible: false }));
  gizmoHit.userData.gizmo = 'rot'; gizmoG.add(gizmoHit);

  let ultimaSel = null;
  function syncSel() {
    const it = store.projeto?.itens.find((i) => i.uid === store.sel);
    if (!it || mode === 'passeio' || mode === 'forro' || ferramenta === 'paredes' || ferramenta === 'piso' || ferramenta === 'teto') {
      selBox.visible = false; gizmoG.visible = false; ultimaSel = null; opts.onSelScreen?.(null); requestRender(); return;
    }
    selBox.visible = true;
    selBox.scale.set(it.w + 0.02, Math.max(it.h, 0.02) + 0.02, it.d + 0.02);
    selBox.position.set(it.x, (it.elev || 0) + Math.max(it.h, 0.02) / 2, it.y);
    selBox.rotation.y = -rad(it.rot || 0);
    selBox.material.color.set(colide(plan, it, store.projeto.itens) ? COR_ERRO : COR_SEL);
    // anel de giro
    const raio = Math.hypot(it.w, it.d) / 2 + 0.12;
    gizmoG.visible = true;
    gizmoG.position.set(it.x, (it.elev || 0) + 0.015, it.y); gizmoG.rotation.y = -rad(it.rot || 0);
    gizmoRing.scale.set(raio, raio, raio);
    const hz = -(it.d / 2 + 0.28);
    for (const h of [gizmoHandle, gizmoHandleRing, gizmoHit]) h.position.set(0, 0, hz);
    gizmoHandleRing.rotation.x = Math.PI / 2;
    ultimaSel = it.uid;
    requestRender();
  }
  const projTmp = new THREE.Vector3();
  let selTela = null;
  function atualizarSelTela() {
    if (!opts.onSelScreen) return;
    const it = ultimaSel && store.projeto?.itens.find((i) => i.uid === ultimaSel);
    if (!it || !selBox.visible) { if (selTela) { selTela = null; opts.onSelScreen(null); } return; }
    projTmp.set(it.x, (it.elev || 0) + Math.max(it.h, 0.02), it.y).project(camera);
    const w = renderer.domElement.clientWidth, h = renderer.domElement.clientHeight;
    const x = (projTmp.x * 0.5 + 0.5) * w, y = (-projTmp.y * 0.5 + 0.5) * h;
    const vis = projTmp.z < 1;
    if (!selTela || Math.abs(selTela.x - x) > 0.8 || Math.abs(selTela.y - y) > 0.8 || selTela.vis !== vis) { selTela = { x, y, vis }; opts.onSelScreen({ x, y, vis, w, h }); }
  }

  // ------------------------------------------------------------ câmeras e modos
  const walk = { yaw: 0, pitch: 0, pos: new THREE.Vector3(), mv: [0, 0], keys: new Set(), raio: 0.2, acum: 0 };
  const EYE = 1.60;
  let anim = null;
  function animarCamera(pos, alvo, ms = 650) {
    const p0 = camera.position.clone(), t0 = controls.target.clone(), start = performance.now();
    anim = (now) => {
      const k = Math.min(1, (now - start) / ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      camera.position.lerpVectors(p0, pos, e); controls.target.lerpVectors(t0, alvo, e);
      if (k >= 1) anim = null;
      dirty = true;
    };
  }
  function centro() { const { x0, y0, x1, y1 } = plan.bb; return new THREE.Vector3((x0 + x1) / 2, 0.6, (y0 + y1) / 2); }
  function aplicarVisibilidadeModo() {
    const forro = mode === 'forro';
    for (const [uid, g] of meshPorUid) {
      const it = store.projeto.itens.find((i) => i.uid === uid);
      g.visible = !forro || !!catalogoPorId[it?.tipo]?.teto;
    }
  }
  let autoFit = true;
  // distância da câmera (na direção dir) que enquadra a planta inteira, com margem, considerando a proporção do palco
  function distanciaEnquadrada(dir, c) {
    const tmp = new THREE.PerspectiveCamera(42, camera.aspect, 0.1, 500);
    const { x0, y0, x1, y1 } = plan.bb, H = plan.tip.peDireito;
    const pts = [];
    for (const x of [x0, x1]) for (const z of [y0, y1]) for (const y of [0, H]) pts.push(new THREE.Vector3(x, y, z));
    let d = 14;
    for (let i = 0; i < 10; i++) {
      tmp.position.copy(c).addScaledVector(dir, d); tmp.lookAt(c); tmp.updateMatrixWorld(true); tmp.updateProjectionMatrix();
      let m = 0;
      for (const q of pts) { const v = q.clone().project(tmp); m = Math.max(m, Math.abs(v.x) / 0.9, Math.abs(v.y) / 0.82); }
      d *= 1 + (m - 1) * 0.85;
    }
    return d;
  }
  function aplicarModo(inicial = false) {
    autoFit = true;
    const ir = (pos, alvo) => { if (inicial) { anim = null; camera.position.copy(pos); controls.target.copy(alvo); dirty = true; } else animarCamera(pos, alvo); };
    const forro = mode === 'forro';
    tetosG.visible = mode === 'passeio' || forro;
    if (laje) laje.visible = !forro; if (chao) chao.visible = !forro;
    estrutura.children.forEach((o) => { if (o.userData.fixo) o.visible = !forro; });
    pisosG.visible = !forro;
    aplicarVisibilidadeModo(); atualizarPontos();
    controls.minPolarAngle = 0; controls.maxPolarAngle = Math.PI * 0.47;
    if (mode === 'passeio') {
      controls.enabled = false; corte.constant = 99;
      camera.fov = 72; camera.near = 0.05; camera.updateProjectionMatrix();
      if (inicial || walk.pos.lengthSq() === 0) irPara(null);
      aplicarCamWalk();
    } else {
      controls.enabled = true; camera.fov = 42; camera.updateProjectionMatrix();
      const c = centro(), { x0, y0, x1, y1 } = plan.bb, W = x1 - x0, D = y1 - y0;
      const vt = Math.tan(rad(42) / 2), ht = vt * Math.max(0.5, camera.aspect);
      if (mode === 'cima') {
        corte.constant = 1.15;
        const h = Math.max((W / 2 + 0.7) / ht, (D / 2 + 0.7) / vt);
        ir(new THREE.Vector3(c.x, h, c.z + 0.01), c.clone().setY(0));
      } else if (forro) {
        corte.constant = 99;
        controls.minPolarAngle = Math.PI * 0.53; controls.maxPolarAngle = Math.PI * 0.99;
        const alvo = new THREE.Vector3(c.x, plan.tip.peDireito, c.z);
        const h = Math.max((W / 2 + 0.7) / ht, (D / 2 + 0.7) / vt) * 1.1;
        ir(new THREE.Vector3(c.x, -h + plan.tip.peDireito * 0.6, c.z + 0.02), alvo);
      } else {
        corte.constant = paredesModo === 'baixas' ? 1.15 : 99;
        const dir = new THREE.Vector3(-0.06, 0.82, 0.57).normalize();
        const dist = distanciaEnquadrada(dir, c);
        const pos = c.clone().addScaledVector(dir, dist);
        ir(pos, c);
      }
    }
    aplicarPeriodo();
    syncSel(); requestRender();
  }
  function aplicarCamWalk() {
    camera.position.set(walk.pos.x, EYE, walk.pos.z);
    const dir = new THREE.Vector3(Math.sin(walk.yaw) * Math.cos(walk.pitch), Math.sin(walk.pitch), -Math.cos(walk.yaw) * Math.cos(walk.pitch));
    camera.lookAt(camera.position.clone().add(dir));
    dirty = true;
  }
  function distPoly(x, y, P) {
    if (pointInPoly(x, y, P)) return 0;
    let best = Infinity;
    for (let i = 0; i < P.length; i++) {
      const [ax, ay] = P[i], [bx, by] = P[(i + 1) % P.length];
      const ex = bx - ax, ey = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * ex + (y - ay) * ey) / (ex * ex + ey * ey)));
      best = Math.min(best, Math.hypot(x - ax - ex * t, y - ay - ey * t));
    }
    return best;
  }
  function irPara(roomId) {
    let x, z, lx, lz;
    if (!roomId) { [x, z] = plan.tip.pontos.inicio; [lx, lz] = plan.tip.pontos.olhar; }
    else {
      const r = plan.rooms.find((q) => q.id === roomId);
      const porta = plan.openings.find((o) => o.porta && !o.entrada && o.lados.some(([a, b]) => pointInPoly(a, b, r.poly)));
      const lado = porta ? porta.lados.find(([a, b]) => pointInPoly(a, b, r.poly)) : r.centro;
      const ref = [lado[0] * 0.6 + r.centro[0] * 0.4, lado[1] * 0.6 + r.centro[1] * 0.4];
      const obs = obstaculos();
      const bb = bbox(r.poly);
      let best = null, bs = -Infinity;
      for (let px = bb.x0 + 0.25; px <= bb.x1 - 0.25; px += 0.1) for (let pz = bb.y0 + 0.25; pz <= bb.y1 - 0.25; pz += 0.1) {
        if (!pointInPoly(px, pz, r.poly)) continue;
        let livre = 0.6;
        for (const P of obs) { livre = Math.min(livre, distPoly(px, pz, P)); if (livre < 0.22) break; }
        if (livre < 0.22) continue;
        const sc = Math.min(livre, 0.45) * 2 - 0.35 * Math.hypot(px - ref[0], pz - ref[1]);
        if (sc > bs) { bs = sc; best = [px, pz]; }
      }
      [x, z] = best || r.centro;
      const paredes = plan.pieces.filter((p) => !p.verga && !p.sob && p.z1 > 1.7).map((p) => ({ pts: p.poly }));
      const c = r.centro;
      const alvos = [...r.poly.map((p) => [p[0] * 0.75 + c[0] * 0.25, p[1] * 0.75 + c[1] * 0.25]), c];
      let far = c, fd = -1;
      for (const t of alvos) {
        const dx = t[0] - x, dy = t[1] - z, d = Math.hypot(dx, dy);
        if (d < 0.4) continue;
        const { t: hit } = rayPolys(x, z, dx / d, dy / d, paredes);
        if (hit < d - 0.05) continue;
        if (d > fd) { fd = d; far = t; }
      }
      [lx, lz] = far;
    }
    walk.pos.set(x, EYE, z);
    walk.yaw = Math.atan2(lx - x, -(lz - z)); walk.pitch = -0.08;
    resolverColisao();
    aplicarCamWalk(); atualizarPool();
  }

  function obstaculos() {
    const L = [];
    for (const p of plan.pieces) if (!p.verga && p.z0 < 1.0) L.push(p.poly);
    for (const f of plan.fixos) if (f.h > 0.3) L.push(f.poly);
    const ent = plan.openings.find((o) => o.entrada); if (ent) L.push(ent.poly);
    for (const it of store.projeto.itens) if (!catalogoPorId[it.tipo]?.livre && it.elev < 1.0 && it.h > 0.25) L.push(rectCorners(it));
    return L;
  }
  function resolverColisao() {
    const obs = obstaculos(), r = walk.raio;
    for (let iter = 0; iter < 3; iter++) {
      for (const P of obs) {
        const px = walk.pos.x, pz = walk.pos.z;
        const dentro = pointInPoly(px, pz, P);
        let best = Infinity, bx = 0, bz = 0;
        for (let i = 0; i < P.length; i++) {
          const [ax, ay] = P[i], [cx2, cy2] = P[(i + 1) % P.length];
          const ex = cx2 - ax, ey = cy2 - ay, l2 = ex * ex + ey * ey;
          const t = Math.max(0, Math.min(1, ((px - ax) * ex + (pz - ay) * ey) / l2));
          const qx = ax + ex * t, qz = ay + ey * t, d = Math.hypot(px - qx, pz - qz);
          if (d < best) { best = d; bx = qx; bz = qz; }
        }
        if (dentro) {
          const dx = bx - px, dz = bz - pz, d = Math.hypot(dx, dz) || 1e-6;
          walk.pos.x = bx + (dx / d) * r; walk.pos.z = bz + (dz / d) * r;
        } else if (best < r) {
          const dx = px - bx, dz = pz - bz, d = best || 1e-6;
          walk.pos.x = bx + (dx / d) * r; walk.pos.z = bz + (dz / d) * r;
        }
      }
    }
  }
  function passoWalk(dt) {
    let f = walk.mv[1], s = walk.mv[0];
    const k = walk.keys;
    if (k.has('KeyW') || k.has('ArrowUp')) f += 1;
    if (k.has('KeyS') || k.has('ArrowDown')) f -= 1;
    if (k.has('KeyA')) s -= 1;
    if (k.has('KeyD')) s += 1;
    if (k.has('ArrowLeft')) walk.yaw -= dt * 1.8;
    if (k.has('ArrowRight')) walk.yaw += dt * 1.8;
    const mag = Math.hypot(f, s);
    if (mag > 0.01 || k.has('ArrowLeft') || k.has('ArrowRight')) {
      const corre = k.has('ShiftLeft');
      const vel = 1.35 * (corre ? 1.7 : 1) * Math.min(1, mag || 0);
      if (mag > 0.01) {
        const x0 = walk.pos.x, z0 = walk.pos.z;
        const fx = Math.sin(walk.yaw), fz = -Math.cos(walk.yaw);
        walk.pos.x += ((fx * f + -fz * s) / Math.max(1, mag)) * vel * dt;
        walk.pos.z += ((fz * f + fx * s) / Math.max(1, mag)) * vel * dt;
        resolverColisao();
        walk.acum += Math.hypot(walk.pos.x - x0, walk.pos.z - z0);
        const passo = corre ? 0.78 : 0.62;
        if (walk.acum >= passo) {
          walk.acum = 0;
          const r = roomAt(plan, walk.pos.x, walk.pos.z);
          if (r) opts.onPasso?.({ room: r, piso: pisoDe(acab(), r), corre });
        }
      }
      aplicarCamWalk();
    }
  }

  // ------------------------------------------------------------ recorte inteligente das paredes
  const dirCam = new THREE.Vector3();
  function atualizarRecorte(dt, forcar) {
    let mudou = false;
    const ativo = mode === 'orbita' && paredesModo === 'recorte';
    dirCam.set(camera.position.x - controls.target.x, 0, camera.position.z - controls.target.z);
    const len = dirCam.length(); if (len > 0.01) dirCam.divideScalar(len);
    for (const w of wallGroups.values()) {
      let alvo = 1;
      if (ativo && len > 0.01) {
        const proj = (w.centro[0] - controls.target.x) * dirCam.x + (w.centro[1] - controls.target.z) * dirCam.z;
        if (proj > 0.3) alvo = ALTURA_BAIXA;
      }
      if (forcar) w.g.scale.y = alvo;
      else if (Math.abs(w.g.scale.y - alvo) > 0.002) { w.g.scale.y += (alvo - w.g.scale.y) * Math.min(1, dt * 9); mudou = true; }
    }
    if (mudou || forcar) dirty = true;
  }

  // ------------------------------------------------------------ interação
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const planoPiso = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  let drag = null, down = null, hoverInfo = null, hoverKey = '', hoverPend = null;
  const el = renderer.domElement;
  function apontar(ev) {
    const r = el.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
  }
  function pickItem(ev) {
    apontar(ev);
    const hits = ray.intersectObjects(moveis.children.filter((g) => g.visible), true);
    return hits.find((h) => h.object.userData.uid) || null;
  }
  function pickGizmo(ev) {
    if (!gizmoG.visible) return false;
    apontar(ev);
    gizmoG.updateMatrixWorld(true);
    return ray.intersectObjects([gizmoHit], false).length > 0;
  }
  function pickInterruptor(ev) {
    apontar(ev);
    const alvo = [...swMeshes, ...caixasParede, ...moveis.children];
    const h = ray.intersectObjects(alvo, true)[0];
    return h && h.object.userData.sw && h.distance < 7 ? h.object.userData.sw : null;
  }
  function superficieDaFerramenta() { return { paredes: 'parede', piso: 'piso', teto: 'teto' }[ferramenta] || null; }
  function pickSuperficie(ev) {
    const tipo = superficieDaFerramenta(); if (!tipo) return null;
    apontar(ev);
    const lista = tipo === 'parede' ? [...peleMeshes, ...caixasParede] : tipo === 'piso' ? [...pisoMeshes, ...caixasParede] : [...tetoMeshes, ...caixasParede];
    const hits = ray.intersectObjects([...lista, ...moveis.children.filter((g) => g.visible)], true);
    const h = hits[0];
    if (!h || h.object.userData.surface !== tipo) return null;
    if (mode === 'passeio' && h.distance > 8) return null;
    return { tipo, room: h.object.userData.room, edge: h.object.userData.edge };
  }
  function pontoPiso(ev, y = 0) {
    apontar(ev);
    planoPiso.constant = -y;
    const p = new THREE.Vector3();
    return ray.ray.intersectPlane(planoPiso, p) ? p : null;
  }

  // realce da superfície sob o cursor
  const matAlvo = new THREE.MeshBasicMaterial({ color: '#27a9d3', transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  function roomsDoEscopo(info) {
    if (escopo === 'todos') return plan.rooms.filter((r) => !r.banho || r.id === info.room);
    return plan.rooms.filter((r) => r.id === info.room);
  }
  function montarAlvo(info, material = matAlvo) {
    const g = new THREE.Group();
    const H = plan.tip.peDireito, A = acab();
    if (info.tipo === 'piso') {
      for (const r of roomsDoEscopo(info)) {
        const sh = new THREE.Shape(r.poly.map(([x, y]) => new THREE.Vector2(x, -y)));
        const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), material); m.rotation.x = -Math.PI / 2; m.position.y = 0.006; g.add(m);
      }
    } else if (info.tipo === 'teto') {
      for (const r of roomsDoEscopo(info)) {
        const sh = new THREE.Shape(r.poly.map(([x, y]) => new THREE.Vector2(x, y)));
        const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), material); m.rotation.x = Math.PI / 2; m.position.y = tetoMin(plan, A, r) - 0.01; g.add(m);
      }
    } else if (info.tipo === 'parede') {
      for (const r of roomsDoEscopo(info)) {
        for (const bd of bordasComodo(plan, r)) {
          if (!bd.parede && !(escopo === 'unico' && bd.i === info.edge && r.id === info.room)) continue;
          if (escopo === 'unico' && !(bd.i === info.edge && r.id === info.room)) continue;
          const off = 0.009, a = [bd.p[0] + bd.nx * off, bd.p[1] + bd.ny * off], b = [bd.q[0] + bd.nx * off, bd.q[1] + bd.ny * off];
          const pos = new Float32Array([a[0], 0, a[1], b[0], 0, b[1], b[0], H, b[1], a[0], H, a[1]]);
          const geo = new THREE.BufferGeometry();
          geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex([0, 1, 2, 0, 2, 3]); geo.computeVertexNormals();
          g.add(new THREE.Mesh(geo, material));
        }
      }
    }
    return g;
  }
  function mostrarHover(info) {
    const key = info ? `${info.tipo}|${info.room}|${info.edge}|${escopo}` : '';
    if (key === hoverKey) return;
    hoverKey = key; hoverInfo = info;
    limpar(alvoG);
    if (info) alvoG.add(montarAlvo(info));
    requestRender();
  }
  let flash = null;
  function pulsar(info) {
    const m = matAlvo.clone(); m.color.set('#ffffff'); m.opacity = 0.7;
    const g = montarAlvo(info, m);
    scene.add(g); flash = { g, m, t0: performance.now() };
    requestRender();
  }
  function textoHover(info) {
    if (!info) return null;
    const r = plan.rooms.find((q) => q.id === info.room); if (!r) return null;
    const A = acab();
    if (info.tipo === 'piso') return `Piso · ${r.nome} · ${pisoDe(A, r).nome}`;
    if (info.tipo === 'teto') return `Forro · ${r.nome} · ${{ laje: 'laje lisa', gesso: 'gesso', sanca: 'sanca com LED', moldura: 'moldura' }[tetoDe(A, r).tipo]}`;
    const f = paredeDe(A, r, info.edge);
    return `Parede · ${r.nome}${f.t === 'tex' ? ' · ' + (texParedePorId[f.id]?.nome || '') : ''}`;
  }

  el.addEventListener('pointerdown', (ev) => {
    down = { x: ev.clientX, y: ev.clientY, t: performance.now(), yaw: walk.yaw, pitch: walk.pitch, id: ev.pointerId };
    if (mode === 'passeio') { el.setPointerCapture(ev.pointerId); return; }
    if (mode === 'forro' || ev.button !== 0) return;
    if (superficieDaFerramenta()) return;
    if (pickGizmo(ev)) {
      const it = store.projeto.itens.find((i) => i.uid === store.sel);
      if (it) { drag = { kind: 'rot', uid: it.uid }; controls.enabled = false; el.setPointerCapture(ev.pointerId); ev.preventDefault(); opts.onPegar?.('rot'); return; }
    }
    const h = pickItem(ev);
    if (h) {
      const uid = h.object.userData.uid;
      const it = store.projeto.itens.find((i) => i.uid === uid);
      select(uid);
      const p = pontoPiso(ev, it.elev || 0);
      if (p) { drag = { kind: 'move', uid, dx: it.x - p.x, dz: it.y - p.z, moved: false, ox: it.x, oy: it.y }; controls.enabled = false; el.setPointerCapture(ev.pointerId); }
    }
  });
  el.addEventListener('pointermove', (ev) => {
    if (mode === 'passeio' && down && down.id === ev.pointerId && Math.hypot(ev.clientX - down.x, ev.clientY - down.y) > 4) {
      const k = ev.pointerType === 'touch' ? 0.006 : 0.0042;
      walk.yaw = down.yaw + (ev.clientX - down.x) * k;
      walk.pitch = Math.max(-1.1, Math.min(1.1, down.pitch - (ev.clientY - down.y) * k));
      aplicarCamWalk(); return;
    }
    if (drag) {
      const it = store.projeto.itens.find((i) => i.uid === drag.uid); if (!it) return;
      const p = pontoPiso(ev, it.elev || 0); if (!p) return;
      if (drag.kind === 'rot') {
        live((proj) => {
          const x = proj.itens.find((i) => i.uid === drag.uid);
          let a = deg(Math.atan2(p.z - x.y, p.x - x.x)) + 90;
          a = ev.shiftKey ? Math.round(a) : Math.round(a / 15) * 15;
          x.rot = ((a % 360) + 360) % 360;
        });
        return;
      }
      if (!drag.moved && Math.hypot(p.x + drag.dx - drag.ox, p.z + drag.dz - drag.oy) < 0.02) return;
      if (!drag.moved) { drag.moved = true; opts.onPegar?.('move', it); }
      let encostou = false;
      live((proj) => {
        const x = proj.itens.find((i) => i.uid === drag.uid);
        x.x = p.x + drag.dx; x.y = p.z + drag.dz;
        encostou = snapItem(plan, proj.itens, x, ev.shiftKey || ev.altKey);
        aplicarTetoItem(x);
      });
      if (encostou && !drag.encostou) opts.onEncaixe?.();
      drag.encostou = encostou;
      return;
    }
    // sem arrasto: realce do que está sob o cursor (mouse)
    if (ev.pointerType === 'mouse' || mode === 'passeio') {
      hoverPend = ev;
    }
  });
  let ultimoHover = null;
  function processarHover() {
    const ev = hoverPend; hoverPend = null;
    if (!ev || drag || !plan) return;
    const tipo = superficieDaFerramenta();
    if (tipo) {
      const info = pickSuperficie(ev);
      mostrarHover(info);
      const txt = textoHover(info);
      ultimoHover = [ev.clientX, ev.clientY];
      opts.onHover?.(txt, ev.clientX, ev.clientY);
      el.style.cursor = info ? 'pointer' : '';
    } else {
      const sw = pickInterruptor(ev);
      if (sw) { el.style.cursor = 'pointer'; const r = plan.rooms.find((q) => q.id === sw); opts.onHover?.(`Interruptor · ${r.nome}`, ev.clientX, ev.clientY); return; }
      const h = mode !== 'forro' ? pickItem(ev) : null;
      el.style.cursor = h ? 'grab' : '';
      opts.onHover?.(null);
    }
  }
  const up = (ev) => {
    const tap = down && Math.hypot(ev.clientX - down.x, ev.clientY - down.y) < 6 && performance.now() - down.t < 450;
    if (drag) {
      const d = drag; drag = null; commit(); controls.enabled = mode !== 'passeio';
      if (d.kind === 'rot' || d.moved) opts.onSoltar?.(d.kind, store.projeto.itens.find((i) => i.uid === d.uid));
    } else if (tap) {
      const sw = pickInterruptor(ev);
      if (sw) opts.onInterruptor?.(sw);
      else if (superficieDaFerramenta()) {
        const info = pickSuperficie(ev);
        if (info) { mostrarHover(info); opts.onSuperficie?.(info, { escopo }); }
      } else {
        const h = mode === 'forro' ? null : pickItem(ev);
        if (h) select(h.object.userData.uid);
        else if (mode !== 'passeio') select(null);
      }
    }
    down = null;
  };
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', () => { if (drag) commit(); drag = null; down = null; controls.enabled = mode !== 'passeio'; });
  el.addEventListener('pointerleave', () => { if (!drag) { mostrarHover(null); opts.onHover?.(null); } });
  el.addEventListener('wheel', (ev) => { if (mode === 'passeio') { ev.preventDefault(); camera.fov = Math.max(45, Math.min(90, camera.fov + ev.deltaY * 0.03)); camera.updateProjectionMatrix(); dirty = true; } }, { passive: false });
  controls.addEventListener('change', requestRender);
  controls.addEventListener('start', () => { autoFit = false; });

  const onKey = (isDown) => (ev) => {
    if (mode !== 'passeio' || !visivel) return;
    if (ev.target.closest && ev.target.closest('input,textarea,select')) return;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft'].includes(ev.code)) {
      ev.preventDefault();
      if (isDown) walk.keys.add(ev.code); else walk.keys.delete(ev.code);
    }
  };
  const kd = onKey(true), ku = onKey(false);
  window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
  window.addEventListener('blur', () => walk.keys.clear());

  // ------------------------------------------------------------ laço
  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix(); dirty = true;
    if (plan && (!enquadrado || autoFit) && mode !== 'passeio') { enquadrado = true; aplicarModo(true); }
  }
  const ro = new ResizeObserver(resize); ro.observe(container);
  let last = performance.now(), raf = 0, tPool = 0;
  function loop(now) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (!visivel || !plan) return;
    if (anim) anim(now);
    for (let i = anims.length - 1; i >= 0; i--) if (anims[i](now)) anims.splice(i, 1);
    if (flash) {
      const k = (now - flash.t0) / 520;
      if (k >= 1) { scene.remove(flash.g); flash = null; } else flash.m.opacity = 0.7 * (1 - k);
      dirty = true;
    }
    if (mode === 'passeio') passoWalk(dt);
    else if (controls.update()) dirty = true;
    atualizarRecorte(dt, false);
    if (hoverPend) processarHover();
    const foco = mode === 'passeio' ? walk.pos : controls.target;
    if (now - tPool > 220 && foco.distanceTo(focoAnterior) > 0.35) { tPool = now; atualizarPool(); }
    if (dirty) { renderer.render(scene, camera); dirty = false; atualizarSelTela(); }
  }
  raf = requestAnimationFrame(loop);

  return {
    setPlan(p) {
      plan = p; enquadrado = false; meshPorUid.forEach((g) => moveis.remove(g)); meshPorUid.clear(); assinatura.clear(); walk.pos.set(0, 0, 0);
      construirArquitetura(); atualizarRecorte(0, true);
    },
    syncItems, syncSel,
    refreshAcab() { if (!plan) return; construirPisos(); construirPeles(); construirTetos(); atualizarPontos(); aplicarEmissivos(); atualizarPool(); atualizarRecorte(0, true); if (hoverInfo && ultimoHover && superficieDaFerramenta()) opts.onHover?.(textoHover(hoverInfo), ultimoHover[0], ultimoHover[1]); },
    refreshLuz() { if (!plan) return; aplicarEmissivos(); atualizarPool(); atualizarPontos(); },
    setMode(m) { if (m === mode) return; mode = m; walk.keys.clear(); aplicarModo(); opts.onMode?.(m); },
    getMode: () => mode,
    setPeriodo(l) { periodo = l; aplicarPeriodo(); },
    getPeriodo: () => periodo,
    setParedes(m) { paredesModo = m; if (mode === 'orbita') { corte.constant = m === 'baixas' ? 1.15 : 99; } atualizarRecorte(0, true); requestRender(); },
    setFerramenta(f) { ferramenta = f; mostrarHover(null); opts.onHover?.(null); syncSel(); if (f !== 'moveis' && f !== 'luz') el.style.cursor = ''; },
    setEscopo(e) { escopo = e; hoverKey = ''; if (hoverInfo) mostrarHover(hoverInfo); },
    pulsar,
    irPara(roomId) { if (mode !== 'passeio') { mode = 'passeio'; aplicarModo(); opts.onMode?.(mode); } irPara(roomId); },
    moveInput(x, y) { walk.mv = [x, y]; },
    resetCamera() { aplicarModo(); },
    setVisible(v) { visivel = v; if (v) { resize(); dirty = true; atualizarRecorte(0, true); } else walk.keys.clear(); },
    render: requestRender,
    pontoNaTela(cx, cy) {
      const p = pontoPiso({ clientX: cx, clientY: cy }, 0);
      if (!p) return null;
      const { x0, y0, x1, y1 } = plan.bb;
      return p.x < x0 || p.x > x1 || p.z < y0 || p.z > y1 ? null : [p.x, p.z];
    },
    foto(largura = 1600) {
      resize(); if (anim) anim(performance.now() + 1e6); atualizarRecorte(0, true);
      const w0 = renderer.domElement.width, h0 = renderer.domElement.height;
      const aspect = w0 / h0, w = largura, h = Math.round(largura / aspect);
      renderer.setSize(w, h, false); camera.aspect = aspect; camera.updateProjectionMatrix();
      renderer.render(scene, camera);
      const url = renderer.domElement.toDataURL('image/jpeg', 0.9);
      renderer.setSize(w0 / renderer.getPixelRatio(), h0 / renderer.getPixelRatio(), false); camera.updateProjectionMatrix(); dirty = true;
      return url;
    },
    snapshot() { renderer.render(scene, camera); return renderer.domElement.toDataURL('image/jpeg', 0.85); },
    pickDebug(cx, cy) { const e = { clientX: cx, clientY: cy }; return { sup: pickSuperficie(e), tool: superficieDaFerramenta() }; },
    meshPos(uidItem) { const g = meshPorUid.get(uidItem); return g ? { x: g.position.x, z: g.position.z, y: g.position.y, rotY: g.rotation.y } : null; },
    debug: () => ({
      mode, periodo, paredesModo, ferramenta,
      luzesAtivas: pool.filter((l) => l.intensity > 0).length,
      paredes: [...wallGroups.entries()].map(([id, w]) => [id, +w.g.scale.y.toFixed(2)]),
      pisos: pisoMeshes.length, peles: peleMeshes.length, tetos: tetoMeshes.length, interruptores: swMeshes.length / 2,
      chamadas: renderer.info.render.calls, tris: renderer.info.render.triangles,
    }),
    info: () => ({ mode, pos: walk.pos.toArray(), yaw: walk.yaw, calls: renderer.info.render.calls, tris: renderer.info.render.triangles }),
    projetar(x, y, z) { const v = new THREE.Vector3(x, y, z).project(camera); const r = el.getBoundingClientRect(); return [r.left + (v.x * 0.5 + 0.5) * r.width, r.top + (-v.y * 0.5 + 0.5) * r.height]; },
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); renderer.dispose(); },
  };
}
