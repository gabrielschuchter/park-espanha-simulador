import os, json, math
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots3'
ARGS=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
L=lambda *a: print(*a, flush=True)
with sync_playwright() as p:
    b=p.chromium.launch(args=ARGS); ctx=b.new_context(viewport={'width':360,'height':720}, has_touch=True, is_mobile=True); pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.add_init_script("try{localStorage.setItem('pe.tour.v1','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_selector('[data-novo="meio"][data-sug="1"]'); pg.click('[data-novo="meio"][data-sug="1"]')
    pg.wait_for_function("document.querySelector('#carregando').hidden===true", timeout=120000)
    pg.wait_for_timeout(800); pg.evaluate("document.querySelector('[data-tour=pular]')?.click()")
    pg.evaluate("window.__pe.view3d.irPara('sala')"); pg.wait_for_timeout(1000)
    pg.evaluate("window.__pe.view3d.focar(6.975,1.85)"); pg.wait_for_timeout(300)
    pos=pg.evaluate("window.__pe.view3d.posicao()"); dx,dz=6.975-pos['x'],1.85-pos['z']; d=math.hypot(dx,dz)
    pg.evaluate(f"window.__pe.view3d.olhar({math.atan2(dx,-dz)},{-math.atan2(1.62-0.4,d)})"); pg.wait_for_timeout(1500)
    L('mira', pg.evaluate("document.querySelector('#acoes-passeio').innerText"))
    pg.screenshot(path=f'{OUT}/v5m-mira.png')
    pg.evaluate("document.querySelector('#acoes-passeio [data-ma=editar]').click()"); pg.wait_for_timeout(1200)
    pg.screenshot(path=f'{OUT}/v5m-editar.png')
    L('tool', pg.evaluate("document.querySelector('#workspace').dataset.tool"), pg.evaluate("document.querySelector('#workspace').dataset.ferr"))
    L('errs',errs); b.close()
