import os, json
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots3'
ARGS=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
L=lambda *a: print(*a, flush=True)
with sync_playwright() as p:
    b=p.chromium.launch(args=ARGS)
    ctx=b.new_context(viewport={'width':390,'height':780}, has_touch=True, is_mobile=True, device_scale_factor=2); pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.add_init_script("try{localStorage.setItem('pe.tour.v1','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_selector('[data-novo="meio"][data-sug="1"]'); pg.click('[data-novo="meio"][data-sug="1"]')
    pg.wait_for_function("document.querySelector('#carregando').hidden===true", timeout=90000)
    pg.wait_for_timeout(900); pg.evaluate("document.querySelector('[data-tour=pular]')?.click()"); pg.wait_for_timeout(500)
    for tp in ['fixos','dicas','moveis']:
        pg.evaluate(f"window.__pe.setTool('{tp}')"); pg.wait_for_timeout(900)
        pg.screenshot(path=f'{OUT}/b-mob-{tp}.png'); L(tp, pg.evaluate("document.querySelector('#workspace').dataset.ferr"))
    # simular uso
    pg.evaluate("document.querySelector('#b-uso').click()"); pg.wait_for_timeout(500); pg.screenshot(path=f'{OUT}/b-mob-uso-pop.png')
    pg.evaluate("document.querySelector('#u-aberto').click(); document.querySelector('#u-cad').click(); document.querySelector('#u-pes').click()"); pg.wait_for_timeout(2500)
    L('uso', pg.evaluate("[u-aberto,u-cad,u-pes].map(i=>document.getElementById(i).checked)".replace('[u-aberto,u-cad,u-pes]',"['u-aberto','u-cad','u-pes']")))
    pg.evaluate("document.querySelector('#pop-uso').hidden=true; window.__pe.view3d.irPara('coz')"); pg.wait_for_timeout(2500); pg.screenshot(path=f'{OUT}/b-mob-passeio-uso.png')
    L('errs',errs); b.close()
