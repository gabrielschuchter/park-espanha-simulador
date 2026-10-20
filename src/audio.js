// Som do simulador: efeitos e trilhas sintetizados no navegador (Web Audio), sem arquivos de áudio.
// O volume padrão é médio (50%). Os efeitos têm pico próximo de -19 dBFS nesse ajuste e as trilhas ficam
// uns 8 dB abaixo dos efeitos; um compressor na saída evita picos se vários sons se somarem.
const KEY = 'pe.audio.v1';
const PADRAO = { vol: 0.5, mudo: false, sfx: true, musica: 'auto' };

function ler() {
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (o && typeof o === 'object') {
      return {
        vol: Math.min(1, Math.max(0, Number.isFinite(+o.vol) ? +o.vol : PADRAO.vol)),
        mudo: !!o.mudo, sfx: o.sfx !== false,
        musica: ['off', 'auto', 'casa', 'tarde', 'noite'].includes(o.musica) ? o.musica : PADRAO.musica,
      };
    }
  } catch { /* sem armazenamento */ }
  return { ...PADRAO };
}
const prefs = ler();
function gravar() { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* ignora */ } }

let ctx = null, master = null, sfxBus = null, musBus = null, comp = null, ruidoBuf = null;
let periodo = 'dia';
const ouvintes = new Set();
const avisar = () => ouvintes.forEach((f) => f({ ...prefs }));

// curva perceptiva: 50% do controle ≈ -13 dB no mestre
const ganhoMestre = () => (prefs.mudo ? 0 : Math.pow(prefs.vol, 1.6));

function garantir() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try { ctx = new AC({ latencyHint: 'interactive' }); } catch { return null; }
  master = ctx.createGain();
  comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -16; comp.knee.value = 14; comp.ratio.value = 6; comp.attack.value = 0.004; comp.release.value = 0.22;
  sfxBus = ctx.createGain(); sfxBus.gain.value = 1;
  musBus = ctx.createGain(); musBus.gain.value = 0;
  // eco suave para dar espaço à música
  const atraso = ctx.createDelay(1); atraso.delayTime.value = 0.34;
  const fb = ctx.createGain(); fb.gain.value = 0.32;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400;
  const wet = ctx.createGain(); wet.gain.value = 0.28;
  musBus.connect(atraso); atraso.connect(lp); lp.connect(fb); fb.connect(atraso); lp.connect(wet); wet.connect(master);
  sfxBus.connect(master); musBus.connect(master);
  master.connect(comp); comp.connect(ctx.destination);
  master.gain.value = ganhoMestre();
  const n = ctx.sampleRate;
  ruidoBuf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = ruidoBuf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return ctx;
}

// ------------------------------------------------------------ síntese
function tom(f, t, dur, o = {}) {
  const { tipo = 'sine', vol = 0.2, a = 0.004, r = 0.08, slide = null, filtro = null, bus = sfxBus, det = 0 } = o;
  const osc = ctx.createOscillator(); osc.type = tipo;
  osc.frequency.setValueAtTime(f, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slide), t + dur);
  if (det) osc.detune.value = det;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + r);
  let no = osc;
  if (filtro) { const fl = ctx.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = filtro; osc.connect(fl); no = fl; }
  no.connect(g); g.connect(bus);
  osc.start(t); osc.stop(t + dur + r + 0.03);
}
function ruido(t, dur, o = {}) {
  const { vol = 0.1, tipo = 'lowpass', f = 2000, f2 = null, q = 1, a = 0.003, bus = sfxBus } = o;
  const src = ctx.createBufferSource(); src.buffer = ruidoBuf; src.loop = true;
  src.playbackRate.value = 0.9 + Math.random() * 0.2;
  const fl = ctx.createBiquadFilter(); fl.type = tipo; fl.Q.value = q;
  fl.frequency.setValueAtTime(f, t);
  if (f2) fl.frequency.exponentialRampToValueAtTime(Math.max(40, f2), t + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(fl); fl.connect(g); g.connect(bus);
  src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.03);
}

const SFX = {
  clique: (t) => tom(1500, t, 0.025, { tipo: 'triangle', vol: 0.24, r: 0.025 }),
  abrir: (t) => { ruido(t, 0.16, { vol: 0.12, tipo: 'bandpass', f: 600, f2: 2600, q: 0.8, a: 0.04 }); tom(520, t, 0.07, { vol: 0.14 }); },
  fechar: (t) => { ruido(t, 0.14, { vol: 0.1, tipo: 'bandpass', f: 2200, f2: 500, q: 0.8, a: 0.02 }); tom(400, t, 0.06, { vol: 0.12 }); },
  pegar: (t) => { tom(330, t, 0.09, { vol: 0.3, slide: 560, r: 0.05 }); ruido(t, 0.03, { vol: 0.07, tipo: 'highpass', f: 3000 }); },
  soltar: (t) => { tom(160, t, 0.13, { vol: 0.34, slide: 72, r: 0.09 }); ruido(t, 0.06, { vol: 0.1, f: 900 }); },
  encaixe: (t) => { tom(900, t, 0.03, { tipo: 'square', vol: 0.08, r: 0.02, filtro: 3000 }); tom(1350, t + 0.03, 0.05, { tipo: 'triangle', vol: 0.17, r: 0.06 }); },
  girar: (t) => { ruido(t, 0.1, { vol: 0.12, tipo: 'bandpass', f: 1800, f2: 900, q: 1.2 }); tom(260, t, 0.05, { vol: 0.18 }); },
  montar: (t) => {
    [0, 0.1, 0.2, 0.3].forEach((d, i) => { tom(190 + i * 16, t + d, 0.06, { vol: 0.17, slide: 120, r: 0.05 }); ruido(t + d, 0.04, { vol: 0.04, f: 2600, tipo: 'highpass' }); });
    tom(1046, t + 0.44, 0.35, { vol: 0.12, r: 0.3 }); tom(1568, t + 0.5, 0.3, { vol: 0.06, r: 0.3 });
  },
  excluir: (t) => { ruido(t, 0.24, { vol: 0.1, f: 3000, f2: 300 }); tom(300, t, 0.18, { vol: 0.13, slide: 90 }); },
  desfazer: (t) => tom(720, t, 0.07, { vol: 0.22, slide: 480 }),
  refazer: (t) => tom(480, t, 0.07, { vol: 0.22, slide: 720 }),
  erro: (t) => { tom(196, t, 0.1, { tipo: 'triangle', vol: 0.17 }); tom(147, t + 0.11, 0.17, { tipo: 'triangle', vol: 0.17 }); },
  ok: (t) => { tom(660, t, 0.08, { vol: 0.12 }); tom(990, t + 0.08, 0.2, { vol: 0.12, r: 0.16 }); },
  pintar: (t) => { ruido(t, 0.36, { vol: 0.14, tipo: 'bandpass', f: 500, f2: 1900, q: 0.7, a: 0.06 }); tom(180, t, 0.2, { vol: 0.05, r: 0.1 }); },
  piso: (t) => {
    tom(125, t, 0.08, { vol: 0.2, slide: 80 }); ruido(t, 0.025, { vol: 0.035, tipo: 'highpass', f: 4500 });
    tom(98, t + 0.13, 0.08, { vol: 0.18, slide: 70 }); ruido(t + 0.13, 0.025, { vol: 0.03, tipo: 'highpass', f: 4000 });
  },
  pisoMadeira: (t) => {
    tom(210, t, 0.09, { tipo: 'triangle', vol: 0.2, slide: 150 }); ruido(t, 0.03, { vol: 0.08, f: 1800 });
    tom(180, t + 0.14, 0.09, { tipo: 'triangle', vol: 0.19, slide: 130 });
  },
  forro: (t) => { ruido(t, 0.2, { vol: 0.09, f: 900, f2: 300 }); tom(72, t, 0.2, { vol: 0.28, slide: 50 }); tom(1568, t + 0.1, 0.3, { vol: 0.05, r: 0.3 }); },
  luzOn: (t) => {
    ruido(t, 0.014, { vol: 0.26, tipo: 'highpass', f: 3200 }); tom(180, t, 0.03, { tipo: 'square', vol: 0.08, r: 0.02, filtro: 900 });
    tom(784, t + 0.06, 0.25, { vol: 0.08, r: 0.25 }); tom(1175, t + 0.1, 0.3, { vol: 0.045, r: 0.3 });
  },
  luzOff: (t) => { ruido(t, 0.014, { vol: 0.24, tipo: 'highpass', f: 3000 }); tom(170, t, 0.03, { tipo: 'square', vol: 0.08, r: 0.02, filtro: 900 }); tom(330, t + 0.04, 0.12, { vol: 0.06, slide: 200 }); },
  lampada: (t) => { tom(1568, t, 0.08, { vol: 0.17, r: 0.2 }); tom(2093, t + 0.03, 0.06, { vol: 0.08, r: 0.2 }); },
  foto: (t) => { ruido(t, 0.025, { vol: 0.26, tipo: 'highpass', f: 3500 }); tom(220, t, 0.04, { tipo: 'square', vol: 0.06, r: 0.02, filtro: 1200 }); ruido(t + 0.07, 0.03, { vol: 0.22, tipo: 'highpass', f: 3000 }); },
  sucesso: (t) => { [523, 659, 784, 1046].forEach((f, i) => tom(f, t + i * 0.07, 0.12, { vol: 0.1, r: 0.2 })); },
  boasvindas: (t) => { [392, 494, 587, 784].forEach((f, i) => tom(f, t + i * 0.09, 0.2, { tipo: 'triangle', vol: 0.08, r: 0.3 })); },
  passoCeramica: (t) => { ruido(t, 0.03, { vol: 0.05, tipo: 'highpass', f: 2800 }); tom(110, t, 0.05, { vol: 0.07, slide: 80 }); },
  passoMadeira: (t) => { tom(150, t, 0.06, { tipo: 'triangle', vol: 0.1, slide: 100 }); ruido(t, 0.03, { vol: 0.03, f: 1500 }); },
  passoBanho: (t) => { ruido(t, 0.035, { vol: 0.05, tipo: 'bandpass', f: 3200, q: 1.5 }); tom(120, t, 0.04, { vol: 0.05, slide: 90 }); },
};
const INTERVALO = { passoCeramica: 0.2, passoMadeira: 0.2, passoBanho: 0.2, girar: 0.07, clique: 0.03, encaixe: 0.08, pintar: 0.12, piso: 0.12, forro: 0.12 };
const ultimo = {};

export function tocar(nome, atraso = 0) {
  if (!prefs.sfx || prefs.mudo || prefs.vol <= 0) return;
  const c = garantir(); if (!c || !SFX[nome]) return;
  if (c.state === 'suspended') c.resume();
  const agora = c.currentTime;
  if (INTERVALO[nome] && ultimo[nome] && agora - ultimo[nome] < INTERVALO[nome]) return;
  ultimo[nome] = agora;
  try { SFX[nome](agora + 0.01 + atraso); } catch { /* áudio indisponível */ }
}
export function tocarPasso(piso) {
  const id = piso?.id || '';
  const nome = /lam|vinil|parque/.test(id) ? 'passoMadeira' : /banho/.test(id) ? 'passoBanho' : 'passoCeramica';
  tocar(nome);
}

// ------------------------------------------------------------ música
const nota = (m) => 440 * Math.pow(2, (m - 69) / 12);
const FAIXAS = {
  casa: {
    nome: 'Casa nova', bpm: 74, swing: 0.1, perc: true, mel: [0, 2, 4, 7, 9], tonica: 60, bruma: 0.7,
    acordes: [[48, [0, 7, 11, 16]], [45, [0, 7, 10, 15]], [50, [0, 7, 10, 15]], [43, [0, 7, 10, 14]]],
  },
  tarde: {
    nome: 'Tarde de domingo', bpm: 90, swing: 0.16, perc: true, mel: [0, 2, 4, 7, 9], tonica: 65, bruma: 0.5,
    acordes: [[53, [0, 7, 11, 16]], [52, [0, 7, 10, 15]], [57, [0, 7, 10, 14]], [50, [0, 7, 10, 15]], [55, [0, 7, 10, 16]], [48, [0, 7, 11, 16]]],
  },
  noite: {
    nome: 'Noite calma', bpm: 58, swing: 0, perc: false, mel: [0, 3, 5, 7, 10], tonica: 62, bruma: 1,
    acordes: [[50, [0, 7, 11, 16]], [47, [0, 7, 10, 15]], [43, [0, 7, 11, 14]], [45, [0, 7, 9, 14]]],
  },
};
export const LISTA_FAIXAS = [['off', 'Desligada'], ['auto', 'Automática'], ['casa', FAIXAS.casa.nome], ['tarde', FAIXAS.tarde.nome], ['noite', FAIXAS.noite.nome]];

let faixaAtiva = null, passoN = 0, proximo = 0, timer = null, semente = 7;
const rnd = () => ((semente = (semente * 1664525 + 1013904223) >>> 0) / 4294967296);

function faixaDaVez() {
  if (prefs.musica === 'off') return null;
  if (prefs.musica === 'auto') return periodo === 'noite' ? 'noite' : periodo === 'tarde' ? 'tarde' : 'casa';
  return prefs.musica;
}

function passoMusica(f, n, t, dur8) {
  const compasso = Math.floor(n / 8), p = n % 8;
  const [raiz, iv] = f.acordes[compasso % f.acordes.length];
  const swing = p % 2 ? f.swing * dur8 : 0;
  const tt = t + swing;
  if (p === 0) {
    // colchão de acordes
    iv.forEach((i, k) => tom(nota(raiz + 12 + i), tt, dur8 * 7.5, { tipo: 'sawtooth', vol: 0.011, a: 0.7, r: 1.2, filtro: 900, bus: musBus, det: (k - 1.5) * 5 }));
    tom(nota(raiz), tt, dur8 * 3.6, { vol: 0.1, a: 0.02, r: 0.4, bus: musBus });
  }
  if (p === 4) tom(nota(raiz + (f.perc ? 7 : 0)), tt, dur8 * 2.4, { vol: 0.07, a: 0.02, r: 0.4, bus: musBus });
  // arpejo
  if (p % 2 === 0 || rnd() < 0.35) {
    if (rnd() < 0.82) {
      const i = iv[(p + compasso + Math.floor(rnd() * 3)) % iv.length];
      tom(nota(raiz + 24 + i), tt, dur8 * 0.9, { tipo: 'triangle', vol: 0.03 + rnd() * 0.012, a: 0.006, r: 0.5, filtro: 2200, bus: musBus });
    }
  }
  // melodia esparsa
  if ((p === 2 || p === 5 || p === 7) && rnd() < 0.5) {
    const grau = f.mel[Math.floor(rnd() * f.mel.length)];
    const oit = rnd() < 0.3 ? 12 : 0;
    tom(nota(f.tonica + 12 + grau + oit), tt, dur8 * 1.6, { tipo: 'sine', vol: 0.045, a: 0.01, r: 0.9, bus: musBus });
  }
  if (f.perc) {
    if (p % 2 === 1) ruido(tt, 0.04, { vol: 0.016, tipo: 'highpass', f: 6500, bus: musBus });
    if (p === 4) ruido(tt, 0.06, { vol: 0.03, tipo: 'bandpass', f: 1800, q: 2, bus: musBus });
    if (p === 0) tom(90, tt, 0.12, { vol: 0.025, slide: 45, r: 0.1, bus: musBus });
  }
}

function agenda() {
  if (!ctx || !faixaAtiva) return;
  const f = FAIXAS[faixaAtiva]; const dur8 = 30 / f.bpm;
  while (proximo < ctx.currentTime + 0.5) {
    passoMusica(f, passoN, proximo, dur8);
    proximo += dur8; passoN++;
  }
}
function pararMusica(rapido = false) {
  if (timer) { clearInterval(timer); timer = null; }
  faixaAtiva = null;
  if (ctx && musBus) { musBus.gain.cancelScheduledValues(ctx.currentTime); musBus.gain.setTargetAtTime(0, ctx.currentTime, rapido ? 0.03 : 0.25); }
}
function iniciarMusica() {
  const c = garantir(); if (!c) return;
  const alvo = faixaDaVez();
  if (!alvo || prefs.mudo || prefs.vol <= 0) { pararMusica(); return; }
  if (faixaAtiva === alvo && timer) return;
  const trocar = () => {
    faixaAtiva = alvo; passoN = 0; semente = 7 + alvo.length * 13; proximo = c.currentTime + 0.15;
    musBus.gain.cancelScheduledValues(c.currentTime);
    musBus.gain.setValueAtTime(0, c.currentTime);
    musBus.gain.linearRampToValueAtTime(0.5, c.currentTime + 2.5);
    if (!timer) timer = setInterval(agenda, 120);
    agenda();
  };
  if (faixaAtiva && faixaAtiva !== alvo) {
    musBus.gain.setTargetAtTime(0, c.currentTime, 0.2);
    setTimeout(() => { if (faixaDaVez() === alvo) trocar(); }, 700);
  } else trocar();
}

// ------------------------------------------------------------ API
export function destravar() {
  const c = garantir(); if (!c) return;
  if (c.state === 'suspended') c.resume().catch(() => {});
  iniciarMusica();
}
export const getPrefs = () => ({ ...prefs });
export function onChange(fn) { ouvintes.add(fn); return () => ouvintes.delete(fn); }
function aplicarMestre() {
  if (!ctx) return;
  master.gain.cancelScheduledValues(ctx.currentTime);
  master.gain.setTargetAtTime(ganhoMestre(), ctx.currentTime, 0.03);
}
export function setVol(v) {
  prefs.vol = Math.min(1, Math.max(0, v));
  if (prefs.vol > 0 && prefs.mudo) prefs.mudo = false;
  gravar(); aplicarMestre(); if (ctx) { if (prefs.vol === 0) pararMusica(); else iniciarMusica(); } avisar();
}
export function setMudo(m) {
  prefs.mudo = !!m; gravar(); aplicarMestre();
  if (ctx) { if (prefs.mudo) pararMusica(); else iniciarMusica(); }
  avisar();
}
export function setSfx(v) { prefs.sfx = !!v; gravar(); avisar(); }
export function setMusica(id) {
  prefs.musica = id; gravar();
  if (id === 'off') pararMusica(); else { garantir(); iniciarMusica(); }
  avisar();
}
export function setPeriodo(p) { periodo = p; if (prefs.musica === 'auto' && ctx) iniciarMusica(); }
document.addEventListener('visibilitychange', () => {
  if (!ctx) return;
  if (document.hidden) ctx.suspend().catch(() => {});
  else if (!prefs.mudo) ctx.resume().catch(() => {});
});

// Medição offline (usada nos testes): renderiza um som e devolve pico e RMS em dBFS no ajuste atual
export async function medir(nome, segundos = 2) {
  const AC = window.OfflineAudioContext;
  const real = { ctx, master, sfxBus, musBus, comp, ruidoBuf };
  const off = new AC(1, 44100 * segundos, 44100);
  ctx = off; master = off.createGain(); comp = off.createDynamicsCompressor();
  comp.threshold.value = -16; comp.knee.value = 14; comp.ratio.value = 6; comp.attack.value = 0.004; comp.release.value = 0.22;
  sfxBus = off.createGain(); musBus = off.createGain(); musBus.gain.value = 0.5;
  sfxBus.connect(master); musBus.connect(master); master.connect(comp); comp.connect(off.destination);
  master.gain.value = ganhoMestre();
  ruidoBuf = off.createBuffer(1, 44100, 44100);
  const d = ruidoBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  try {
    if (SFX[nome]) SFX[nome](0.01);
    else if (FAIXAS[nome]) {
      const f = FAIXAS[nome], dur8 = 30 / f.bpm; semente = 7;
      for (let n = 0, t = 0.05; t < segundos - 0.2; n++, t += dur8) passoMusica(f, n, t, dur8);
    }
    const buf = await off.startRendering();
    const x = buf.getChannelData(0);
    let pico = 0, soma = 0;
    for (let i = 0; i < x.length; i++) { pico = Math.max(pico, Math.abs(x[i])); soma += x[i] * x[i]; }
    const db = (v) => 20 * Math.log10(Math.max(v, 1e-9));
    return { nome, picoDb: +db(pico).toFixed(1), rmsDb: +db(Math.sqrt(soma / x.length)).toFixed(1) };
  } finally {
    ({ ctx, master, sfxBus, musBus, comp, ruidoBuf } = real);
  }
}

// ------------------------------------------------------------ controle visual
const ICONE = {
  alto: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/>',
  baixo: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 010 7"/>',
  mudo: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9.5l4 5M21 9.5l-4 5"/>',
};

export function montarControle(host) {
  const el = document.createElement('div');
  el.className = 'som';
  el.innerHTML = `
    <button type="button" class="som-btn" aria-label="Som" aria-haspopup="dialog" aria-expanded="false" title="Som"><svg viewBox="0 0 24 24" aria-hidden="true"></svg></button>
    <input type="range" class="som-slider" min="0" max="100" step="1" aria-label="Volume geral">
    <output class="som-pct" aria-hidden="true"></output>
    <button type="button" class="som-mais" aria-label="Opções de som e música" title="Música e efeitos"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10l5 5 5-5"/></svg></button>
    <div class="som-pop" role="dialog" aria-label="Som e música" hidden>
      <label class="som-linha so-mobile-som">Volume
        <input type="range" class="som-slider som-slider-pop" min="0" max="100" step="1" aria-label="Volume geral">
      </label>
      <div class="som-linha"><span>Música</span>
        <div class="som-faixas" role="radiogroup" aria-label="Trilha">${LISTA_FAIXAS.map(([id, nome]) => `<button type="button" role="radio" data-faixa="${id}">${nome}</button>`).join('')}</div>
      </div>
      <label class="toggle som-linha-t"><input type="checkbox" class="som-sfx"><span>Efeitos sonoros</span></label>
      <p class="nota">Volume inicial em 50%. O som só começa depois do seu primeiro toque na página.</p>
    </div>`;
  host.appendChild(el);
  const btn = el.querySelector('.som-btn'), sl = [...el.querySelectorAll('.som-slider')], pct = el.querySelector('.som-pct');
  const pop = el.querySelector('.som-pop'), mais = el.querySelector('.som-mais'), sfx = el.querySelector('.som-sfx');
  function pintar() {
    const p = getPrefs();
    const v = p.mudo ? 0 : Math.round(p.vol * 100);
    sl.forEach((s) => { s.value = String(v); s.style.setProperty('--v', v + '%'); });
    pct.textContent = v + '%';
    btn.querySelector('svg').innerHTML = p.mudo || p.vol === 0 ? ICONE.mudo : p.vol < 0.45 ? ICONE.baixo : ICONE.alto;
    btn.setAttribute('aria-pressed', String(p.mudo));
    btn.title = p.mudo ? 'Ativar som' : 'Silenciar';
    sfx.checked = p.sfx;
    el.querySelectorAll('[data-faixa]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.faixa === p.musica)));
  }
  onChange(pintar); pintar();
  sl.forEach((s) => {
    s.addEventListener('input', () => { destravar(); setVol(+s.value / 100); });
    s.addEventListener('change', () => tocar('clique'));
  });
  const largo = () => window.matchMedia('(min-width: 861px)').matches;
  btn.addEventListener('click', () => {
    destravar();
    if (largo()) { setMudo(!getPrefs().mudo); if (!getPrefs().mudo) tocar('ok'); }
    else { pop.hidden = !pop.hidden; btn.setAttribute('aria-expanded', String(!pop.hidden)); }
  });
  mais.addEventListener('click', () => { destravar(); pop.hidden = !pop.hidden; btn.setAttribute('aria-expanded', String(!pop.hidden)); });
  pop.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-faixa]'); if (b) { destravar(); setMusica(b.dataset.faixa); tocar('clique'); }
  });
  sfx.addEventListener('change', () => { setSfx(sfx.checked); if (sfx.checked) tocar('ok'); });
  document.addEventListener('pointerdown', (ev) => { if (!pop.hidden && !el.contains(ev.target)) { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); } });
  return el;
}

// o navegador só libera o áudio depois de um gesto do usuário
const primeiro = () => { destravar(); if (ctx && ctx.state === 'running') { window.removeEventListener('pointerdown', primeiro, true); window.removeEventListener('keydown', primeiro, true); } };
window.addEventListener('pointerdown', primeiro, true);
window.addEventListener('keydown', primeiro, true);
