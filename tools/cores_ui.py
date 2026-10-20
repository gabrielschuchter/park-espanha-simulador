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
    pg.wait_for_timeout(900); pg.evaluate("document.querySelector('[data-tour=pular]')?.click()"); pg.wait_for_timeout(300)
    pg.evaluate("window.__pe.setTool('paredes')"); pg.wait_for_timeout(1000); pg.screenshot(path=f'{OUT}/cm-mob-1.png')
    pg.evaluate("document.querySelector('[data-cm-marca=suvinil]').click()"); pg.evaluate("document.querySelector('[data-cm-fam=Verdes]').click()"); pg.wait_for_timeout(300)
    pg.evaluate("document.querySelector('.sw-marca[data-cm=suvinil-n879]').click()"); pg.wait_for_timeout(500)
    pg.evaluate("document.querySelector('#sw-paredes').scrollIntoView()"); pg.screenshot(path=f'{OUT}/cm-mob-2.png')
    L('brush', pg.evaluate("document.querySelector('.cm-sel')?.innerText"))
    pg.evaluate("window.__pe.aplicar('parede','q1',null,false)"); pg.wait_for_timeout(500)
    L('acab', json.dumps(pg.evaluate("window.__pe.store.projeto.acab.parede.q1")))
    # busca
    pg.evaluate("(()=>{const i=document.querySelector('#cm-busca');i.value='papel';i.dispatchEvent(new Event('input',{bubbles:true}))})()"); pg.wait_for_timeout(300)
    L('busca n', pg.evaluate("document.querySelectorAll('.cm-grid .sw').length"))
    L('errs',errs); b.close()
