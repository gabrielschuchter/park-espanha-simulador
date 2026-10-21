import os
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots3'
ARGS=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
with sync_playwright() as p:
    b=p.chromium.launch(args=ARGS); pg=b.new_page(viewport={'width':1100,'height':700}); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.add_init_script("try{localStorage.setItem('pe.tour.v1','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_timeout(600); pg.screenshot(path=f'{OUT}/pcd-home.png', full_page=True)
    pg.click('[data-novo="pcd"][data-sug="1"]')
    pg.wait_for_function("document.querySelector('#carregando').hidden===true", timeout=120000)
    pg.wait_for_timeout(800); pg.evaluate("document.querySelector('[data-tour=pular]')?.click(); document.querySelector('#dlg')?.open && document.querySelector('#dlg').close()")
    pg.evaluate("window.__pe.setView('2d')"); pg.wait_for_timeout(1200)
    pg.evaluate("document.querySelector('#f-cotas').click()"); pg.wait_for_timeout(500)
    pg.screenshot(path=f'{OUT}/pcd-2d.png')
    pg.evaluate("window.__pe.setView('3d')"); pg.wait_for_timeout(2500)
    pg.screenshot(path=f'{OUT}/pcd-3d.png')
    print('aviso', pg.evaluate("JSON.stringify((window.__pe.analise()||{}).avisos?.slice?.(0,6)||window.__pe.analise())")[:600])
    print('errs',errs); b.close()
