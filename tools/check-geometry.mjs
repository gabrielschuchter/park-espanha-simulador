import { TIPOLOGIAS } from '../src/data/tipologias.js';
import { preparePlan, wallInfo, polyArea, pointInPoly, rectCorners } from '../src/geom.js';
import fs from 'fs';
let ok = true;
for (const t of TIPOLOGIAS.filter(t=>!t.pendente)) {
  const p = preparePlan(t);
  console.log(`\n== ${t.titulo} (${t.areaPrivativa} m² privativa)`);
  let soma = 0, somaG = 0;
  for (const r of p.rooms) {
    soma += r.area; somaG += r.areaGeo;
    const dif = r.areaGeo - r.area;
    console.log(`${r.nome.padEnd(20)} declarada ${r.area.toFixed(2)}  geometria ${r.areaGeo.toFixed(2)}  dif ${dif>=0?'+':''}${dif.toFixed(2)}${Math.abs(dif)>0.15?'  <<':''}`);
  }
  console.log(`Soma áreas úteis: declarada ${soma.toFixed(2)} | geometria ${somaG.toFixed(2)} | parede+área técnica ≈ ${(t.areaPrivativa-somaG).toFixed(2)}`);
  for (const o of p.openings) {
    if (o.s1 > o.wi.len + 1e-6 || o.s0 < -1e-6) { ok=false; console.log('ABERTURA FORA DA PAREDE', o.id, o.s0, o.s1, o.wi.len); }
  }
  for (const f of p.fixos) {
    const inside = f.poly.every(([x,y]) => p.rooms.some(r=>pointInPoly(x,y,r.poly)) || true);
    const c = p.rooms.find(r=>pointInPoly(f.x,f.y,r.poly));
    console.log(`fixo ${f.id.padEnd(7)} em ${c?c.nome:'?? FORA'}`);
    if(!c) ok=false;
  }
  // SVG
  const {x0,y0,x1,y1}=p.bb, s=80, pad=0.6;
  const W=(x1-x0+2*pad)*s, H=(y1-y0+2*pad)*s;
  const P=(pts)=>pts.map(([x,y])=>`${((x-x0+pad)*s).toFixed(1)},${((y-y0+pad)*s).toFixed(1)}`).join(' ');
  let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" style="background:#fff">`;
  for (const r of p.rooms) svg+=`<polygon points="${P(r.poly)}" fill="${r.piso==='laminado'?'#f3e6d3':'#eef1f2'}" stroke="#9ab" stroke-width="0.5"/>`;
  for (const pc of p.pieces) if(!pc.verga) svg+=`<polygon points="${P(pc.poly)}" fill="${pc.sob?'#999':'#222'}"/>`;
  for (const o of p.openings) { svg+=`<polygon points="${P(o.poly)}" fill="${o.porta?'#fff':'#9cf'}" stroke="#555" stroke-width="0.5"/>`; if(o.sweep) svg+=`<polygon points="${P(o.sweep)}" fill="rgba(200,60,60,.15)" stroke="#c33" stroke-width="0.7"/>`; }
  for (const f of p.fixos) svg+=`<polygon points="${P(f.poly)}" fill="#cde" stroke="#357"/>`;
  for (const r of p.rooms){ const [cx,cy]=r.centro; svg+=`<text x="${(cx-x0+pad)*s}" y="${(cy-y0+pad)*s}" font-size="12" text-anchor="middle" font-family="sans-serif">${r.nome} ${r.areaGeo.toFixed(2)}</text>`;}
  svg+='</svg>'; fs.writeFileSync(`/tmp/claude-0/-home-claude/1156e439-5523-5b4f-afc9-03311e84964c/scratchpad/${t.id}.svg`, svg);
}
console.log(ok?'\nOK':'\nPROBLEMAS');
