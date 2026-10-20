import os, json
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots3'
ARGS=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
L=lambda *a: print(*a, flush=True)
with sync_playwright() as p:
    b=p.chromium.launch(args=ARGS)
    ctx=b.new_context(viewport={'width':390,'height':780}, has_touch=True, is_mobile=True, device_scale_factor=2); pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_selector('[data-novo="ponta"][data-sug="1"]'); pg.click('[data-novo="ponta"][data-sug="1"]')
    pg.wait_for_function("document.querySelector('#carregando').hidden===true", timeout=90000)
    pg.wait_for_timeout(900); pg.screenshot(path=f'{OUT}/c-mob-tour.png')
    pg.evaluate("document.querySelector('[data-tour=pular]')?.click()"); pg.wait_for_timeout(400)
    L('view',pg.evaluate("document.querySelector('#workspace').dataset.view"))
    pg.evaluate("document.querySelector('#bb-view').click()"); pg.wait_for_timeout(1200)
    L('view',pg.evaluate("document.querySelector('#workspace').dataset.view"))
    pg.screenshot(path=f'{OUT}/c-mob-planta.png')
    # carry em passeio no celular: botoes
    pg.evaluate("document.querySelector('#bb-view').click()"); pg.wait_for_timeout(800)
    pg.evaluate("window.__pe.view3d.irPara(window.__pe.plan.rooms.find(r=>/uarto/.test(r.nome)).id)"); pg.wait_for_timeout(1500)
    pg.evaluate("window.__pe.adicionar('comoda')"); pg.wait_for_timeout(2000); pg.screenshot(path=f'{OUT}/c-mob-carry.png')
    L('carry',pg.evaluate("window.__pe.view3d.carryAtivo()"))
    pg.evaluate("document.querySelector('#cy-ok').click()"); pg.wait_for_timeout(600)
    pg.evaluate("window.__pe.setTool('dicas')"); pg.wait_for_timeout(800)
    L('errs',errs); b.close()
