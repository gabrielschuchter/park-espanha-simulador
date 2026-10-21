import os, json
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots4'
ARGS=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
L=lambda *a: print(*a, flush=True)
J=lambda pg,e: pg.evaluate(e)
with sync_playwright() as p:
    b=p.chromium.launch(args=ARGS); pg=b.new_page(viewport={'width':1100,'height':700}); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
    pg.add_init_script("try{localStorage.setItem('pe.tour.v1','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_selector('[data-novo="meio"][data-sug="1"]'); pg.click('[data-novo="meio"][data-sug="1"]')
    pg.wait_for_function("document.querySelector('#carregando').hidden===true", timeout=120000)
    pg.wait_for_timeout(1500); J(pg,"document.querySelector('[data-tour=pular]')?.click(); document.querySelector('#dlg')?.open && document.querySelector('#dlg').close()")
    L('modo', J(pg,"window.__pe.view3d.getMode()"), 'int', J(pg,"window.__pe.view3d.getInteracao()"), 'imersivo', J(pg,"document.querySelector('#editor').dataset.imersivo"))
    L('topbar vis', J(pg,"getComputedStyle(document.querySelector('.topbar')).display"), 'rail', J(pg,"getComputedStyle(document.querySelector('#rail')).display"), 'segint hidden', J(pg,"document.querySelector('#seg-int').hidden"))
    J(pg,"window.__pe.view3d.irPara('sala')"); pg.wait_for_timeout(1500)
    pg.screenshot(path=f'{OUT}/explorar.png', timeout=120000)
    # tentar editar em explorar: clique na tela
    n0=J(pg,"window.__pe.store.projeto.itens.length"); a0=J(pg,"JSON.stringify(window.__pe.store.projeto.acab)")
    pg.mouse.click(640,380); pg.wait_for_timeout(400)
    L('apos clique: sel', J(pg,"window.__pe.store.sel"), 'cartao', J(pg,"document.querySelector('#workspace').dataset.cartao"), 'acab igual', a0==J(pg,"JSON.stringify(window.__pe.store.projeto.acab)"))
    L('miraInfo', J(pg,"JSON.stringify(window.__pe.view3d.miraInfo?.()||null)"))
    # Tab
    pg.keyboard.press('Tab'); pg.wait_for_timeout(700)
    L('apos Tab int', J(pg,"window.__pe.view3d.getInteracao()"), 'imersivo', J(pg,"document.querySelector('#editor').dataset.imersivo"), 'ferr', J(pg,"document.querySelector('#workspace').dataset.ferr"))
    pg.screenshot(path=f'{OUT}/editar.png', timeout=120000)
    pg.click('#seg-int [data-int=explorar]'); pg.wait_for_timeout(600)
    L('volta explorar', J(pg,"window.__pe.view3d.getInteracao()"), J(pg,"document.querySelector('#editor').dataset.imersivo"))
    L('errs', errs[:5]); b.close()
