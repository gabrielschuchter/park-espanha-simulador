import os, json
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots3'
ARGS=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
L=lambda *a: print(*a, flush=True)
with sync_playwright() as p:
    b=p.chromium.launch(args=ARGS); pg=b.new_page(viewport={'width':1100,'height':700}); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.add_init_script("try{localStorage.setItem('pe.tour.v1','1')}catch(e){}")
    pg.goto(URL); pg.click('[data-novo="meio"][data-sug="1"]')
    pg.wait_for_function("document.querySelector('#carregando').hidden===true", timeout=120000)
    pg.wait_for_timeout(600); pg.evaluate("document.querySelector('[data-tour=pular]')?.click(); document.querySelector('#dlg')?.open && document.querySelector('#dlg').close()")
    pg.evaluate("window.__pe.setView('2d')"); pg.wait_for_timeout(1000)
    r=pg.evaluate("(()=>{const g=document.querySelector('.fixo[data-fix=tanque]').getBoundingClientRect();return [g.left+g.width/2,g.top+g.height/2]})()")
    pg.mouse.move(*r); pg.mouse.down(); pg.mouse.move(r[0]+40,r[1]+10,steps=5); pg.mouse.up(); pg.wait_for_timeout(800)
    L('arrastou tanque', json.dumps(pg.evaluate("window.__pe.store.projeto.fix.tanque")))
    r=pg.evaluate("(()=>{const g=document.querySelector('.fixo[data-fix=vaso1]').getBoundingClientRect();return [g.left+g.width/2,g.top+g.height/2]})()")
    pg.mouse.click(*r); pg.wait_for_timeout(800)
    L('clique vaso ->', pg.evaluate("document.querySelector('#cartao-tit').textContent"), pg.evaluate("document.querySelector('#workspace').dataset.cartao"))
    pg.screenshot(path=f'{OUT}/v6b-2d.png')
    L('errs',errs); b.close()
