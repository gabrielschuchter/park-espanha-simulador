import os, json
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots3'
ARGS=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
L=lambda *a: print(*a, flush=True)
with sync_playwright() as p:
    b=p.chromium.launch(args=ARGS); pg=b.new_page(viewport={'width':900,'height':700}); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: errs.append('CE '+m.text) if m.type=='error' and 'TUNNEL' not in m.text else None)
    pg.add_init_script("try{localStorage.setItem('pe.tour.v1','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_selector('[data-novo="meio"][data-sug="1"]'); pg.click('[data-novo="meio"][data-sug="1"]')
    pg.wait_for_function("document.querySelector('#carregando').hidden===true", timeout=90000)
    pg.wait_for_timeout(900); pg.evaluate("document.querySelector('[data-tour=pular]')?.click()")
    fx=pg.evaluate("window.__pe.plan.fixos.map(f=>[f.id,f.tipo||f.kind||f.fix,f.nome])"); L(fx)
    prefer={'pia':{'tampo':'madeira','cuba':2,'armario':'misto','escorredor':True},'tanque':{'modelo':'inox','armario':'portas'},'lav1':{'modelo':'gabinete','armario':'gavetas','espelho':True},'vaso1':{'modelo':'suspensa'},'box1':{'modelo':'abrir'},'box2':{'modelo':'fixo','vidro':'fume'}}
    # varredura: cada opção de cada peça
    n=0
    for fid,tp,_ in fx:
        for c in pg.evaluate(f"window.__pe.FIX_SCHEMA['{tp}'].map(c=>[c.k,c.t,c.op||null])"):
            k,t,op=c
            vals=[o[0] for o in op] if op else [True,False]
            for v in vals:
                pg.evaluate("([id,k,v])=>window.__pe.setFixo(id,{[k]:v})",[fid,k,v]); n+=1
        pg.wait_for_timeout(150)
    pg.wait_for_timeout(1500); L('variantes aplicadas',n,'erros',errs[:5])
    for fid,pt in prefer.items():
        pg.evaluate("([id,pt])=>window.__pe.setFixo(id,pt)",[fid,pt])
    pg.evaluate("window.__pe.setView('3d')")
    pg.evaluate("window.__pe.view3d.setMode('passeio')"); pg.wait_for_timeout(500)
    for fid in ['pia','tanque','lav1','box1','vaso1','box2']:
        pg.evaluate(f"(()=>{{const f=window.__pe.plan.fixos.find(f=>f.id=='{fid}');const xs=f.poly.map(p=>p[0]),ys=f.poly.map(p=>p[1]);window.__pe.view3d.focar((Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2)}})()")
        pg.wait_for_timeout(1500); pg.screenshot(path=f'{OUT}/fx-{fid}.png')
    L('erros',errs[:5])
    b.close()
