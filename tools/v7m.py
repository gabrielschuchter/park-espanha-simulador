import os
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots4'
ARGS=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
L=lambda *a: print(*a, flush=True)
J=lambda pg,e: pg.evaluate(e)
with sync_playwright() as p:
    b=p.chromium.launch(args=ARGS)
    ctx=b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, has_touch=True, is_mobile=True, user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148')
    pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.add_init_script("try{localStorage.setItem('pe.tour.v1','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_selector('[data-novo="ponta"][data-sug="1"]'); pg.tap('[data-novo="ponta"][data-sug="1"]')
    pg.wait_for_function("document.querySelector('#carregando').hidden===true", timeout=120000)
    pg.wait_for_timeout(1500); J(pg,"document.querySelector('[data-tour=pular]')?.click(); document.querySelector('#dlg')?.open && document.querySelector('#dlg').close()")
    L('modo', J(pg,"window.__pe.view3d.getMode()+' '+window.__pe.view3d.getInteracao()"), 'imersivo', J(pg,"document.querySelector('#editor').dataset.imersivo"), 'bottom', J(pg,"getComputedStyle(document.querySelector('#bottom-bar')).display"))
    L('overflow', J(pg,"document.documentElement.scrollWidth>innerWidth"))
    pg.screenshot(path=f'{OUT}/m-explorar.png', timeout=120000)
    pg.tap('#seg-int [data-int=editar]'); pg.wait_for_timeout(900)
    L('editar', J(pg,"document.querySelector('#editor').dataset.imersivo"), 'bottom', J(pg,"getComputedStyle(document.querySelector('#bottom-bar')).display"), 'ferr', J(pg,"document.querySelector('#workspace').dataset.ferr"))
    pg.screenshot(path=f'{OUT}/m-editar.png', timeout=120000)
    pg.tap('#seg-int [data-int=explorar]'); pg.wait_for_timeout(700)
    pg.tap('#b-estilos'); pg.wait_for_timeout(600); pg.screenshot(path=f'{OUT}/m-galeria.png', timeout=120000)
    L('overflow galeria', J(pg,"document.documentElement.scrollWidth>innerWidth"), J(pg,"document.querySelector('.est-folha').getBoundingClientRect().width"))
    pg.tap('.est-cartao[data-tema=industrial]'); pg.wait_for_timeout(500); pg.screenshot(path=f'{OUT}/m-detalhe.png', timeout=120000)
    pg.tap('.est-acoes [data-a=ver]'); pg.wait_for_timeout(3500)
    pg.screenshot(path=f'{OUT}/m-aplicado.png', timeout=120000)
    L('alertas', J(pg,"window.__pe.analise().alertas.filter(a=>a.nivel!=='info').length"))
    L('errs', errs[:3]); b.close()
