import os, json
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots5'
ARGS=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
L=lambda *a: print(*a, flush=True)
J=lambda pg,e: pg.evaluate(e)
with sync_playwright() as p:
    b=p.chromium.launch(args=ARGS)
    ctx=b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, has_touch=True, is_mobile=True, user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148')
    pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.add_init_script("try{localStorage.setItem('pe.tour.v1','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_selector('[data-novo="pcd"][data-sug="1"]'); pg.tap('[data-novo="pcd"][data-sug="1"]')
    pg.wait_for_function("document.querySelector('#carregando').hidden===true", timeout=120000)
    pg.wait_for_timeout(1500); J(pg,"document.querySelector('[data-tour=pular]')?.click(); document.querySelector('#dlg')?.open && document.querySelector('#dlg').close()")
    pg.tap('#b-estilos'); pg.wait_for_timeout(1500)
    pg.tap('.vit-card[data-tema=biofilico]'); pg.wait_for_function("!document.querySelector('.vit-info').classList.contains('calc')", timeout=90000); pg.wait_for_timeout(1500)
    L('overflow', J(pg,"document.documentElement.scrollWidth>innerWidth"), J(pg,"document.querySelector('.vit-res')?.textContent"))
    pg.screenshot(path=f'{OUT}/m-vitrine.png', timeout=120000)
    pg.tap('.vit-baixo [data-a=andar]'); pg.wait_for_timeout(2500)
    L('caminhando', J(pg,"window.__pe.view3d.getMode()"), J(pg,"document.querySelector('#vitrine').dataset.caminhando"))
    pg.screenshot(path=f'{OUT}/m-vitrine-dentro.png', timeout=120000)
    pg.tap('.vit-volta [data-a=usar]'); pg.wait_for_timeout(1500)
    L('usou: past', J(pg,"window.__pe.store.past.length"), 'modo', J(pg,"window.__pe.view3d.getMode()"), 'imersivo', J(pg,"document.querySelector('#editor').dataset.imersivo"))
    pg.tap('#seg-int [data-int=editar]'); pg.wait_for_timeout(800)
    J(pg,"window.__pe.setTool('obra')"); pg.wait_for_timeout(1200)
    L('obra modo', J(pg,"window.__pe.view3d.getMode()"), 'ferr', J(pg,"document.querySelector('#workspace').dataset.ferr"))
    pg.screenshot(path=f'{OUT}/m-obra.png', timeout=120000)
    L('overflow obra', J(pg,"document.documentElement.scrollWidth>innerWidth"))
    L('errs', errs[:3]); b.close()
