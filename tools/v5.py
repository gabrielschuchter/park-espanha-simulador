import os, json, math
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots3'
ARGS=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
L=lambda *a: print(*a, flush=True)
with sync_playwright() as p:
    b=p.chromium.launch(args=ARGS); pg=b.new_page(viewport={'width':1000,'height':640}); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.add_init_script("try{localStorage.setItem('pe.tour.v1','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_selector('[data-novo="meio"][data-sug="1"]'); pg.click('[data-novo="meio"][data-sug="1"]')
    pg.wait_for_function("document.querySelector('#carregando').hidden===true", timeout=120000)
    pg.wait_for_timeout(800); pg.evaluate("document.querySelector('[data-tour=pular]')?.click(); document.querySelector('#dlg')?.open && document.querySelector('#dlg').close()")
    fx=pg.evaluate("window.__pe.plan.fixos.map(f=>({id:f.id,tipo:f.tipo,x:f.x,y:f.y,nome:f.nome}))"); L(fx)
    # passeio: mirar cada peça
    pg.evaluate("window.__pe.view3d.irPara('sala')"); pg.wait_for_timeout(1200)
    for f in fx:
        if f['tipo'] not in ('bancada','tanque','vaso','lavatorio'): continue
        pg.evaluate(f"window.__pe.view3d.focar({f['x']},{f['y']})"); pg.wait_for_timeout(300)
        pos=pg.evaluate("window.__pe.view3d.posicao()")
        dx,dz=f['x']-pos['x'], f['y']-pos['z']; dist=math.hypot(dx,dz)
        yaw=math.atan2(dx,-dz); pitch=-math.atan2(1.62-0.6, dist)
        pg.evaluate(f"window.__pe.view3d.olhar({yaw},{pitch})"); pg.wait_for_timeout(700)
        L(f['id'], 'mira', json.dumps(pg.evaluate("(()=>{const i=window.__pe.view3d.miraInfo();return i&&{k:i.kind,id:i.id||i.uid,n:i.nome}})()")), pg.evaluate("document.querySelector('#acoes-passeio').innerText.replace(/\\n/g,' | ')"))
    pg.screenshot(path=f'{OUT}/v5-mira-fixo.png')
    # clicar Editar
    pg.evaluate("document.querySelector('#acoes-passeio [data-ma=editar]')?.click()"); pg.wait_for_timeout(700)
    L('tool', pg.evaluate("document.querySelector('#workspace').dataset.tool"), 'ferr', pg.evaluate("document.querySelector('#workspace').dataset.ferr"), 'sel', pg.evaluate("document.querySelector('.fix-item.on')?.innerText"), 'modo', pg.evaluate("window.__pe.view3d.getMode()"))
    pg.screenshot(path=f'{OUT}/v5-editar-fixo.png')
    # parede
    pg.evaluate("window.__pe.view3d.olhar(0,0)"); pg.wait_for_timeout(600)
    L('mira parede', json.dumps(pg.evaluate("(()=>{const i=window.__pe.view3d.miraInfo();return i&&{k:i.kind,n:i.nome}})()")))
    # hover mouse na tela, centro
    box=pg.evaluate("(()=>{const r=document.querySelector('.gl').getBoundingClientRect();return [r.left,r.top,r.width,r.height]})()")
    # uso: item com pessoas
    L('itens c/ pessoas', pg.evaluate("window.__pe.store.projeto.itens.filter(i=>['jantar','mesaJ','jantarRedonda','sofa'].includes(window.__pe.catalogoPorId?.[i.tipo]?.modelo)).map(i=>i.uid+':'+i.tipo).join(',')"))
    r=pg.evaluate('''(()=>{const P=window.__pe, it=P.store.projeto.itens.find(i=>['jantar','mesaJ','jantarRedonda'].includes(P.catalogoPorId[i.tipo]?.modelo)); if(!it) return 'sem mesa';
      const out=[]; const e=()=>JSON.stringify(P.estadoDe(it))+' aj='+JSON.stringify({p:it.pessoas,c:it.cadeiras});
      P.alternarUsoItem(it,'pessoas',true); out.push('item on: '+e());
      P.setUso({pessoas:true}); out.push('geral on: '+e());
      P.setUso({pessoas:false}); out.push('geral off: '+e());
      P.alternarUsoItem(it,'pessoas',true); P.setUso({cadeiras:true}); out.push('geral cad on: '+e());
      P.alternarUsoItem(it,'cadeiras',false); out.push('item cad off: '+e());
      P.setUso({cadeiras:false}); out.push('geral cad off: '+e());
      return out.join(' || ')})()''')
    L('uso', r)
    L('errs',errs); b.close()
