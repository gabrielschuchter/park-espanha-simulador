import os, sys, json
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots5'; os.makedirs(OUT, exist_ok=True)
ARGS=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
L=lambda *a: print(*a, flush=True)
J=lambda pg,e: pg.evaluate(e)
tip=sys.argv[1] if len(sys.argv)>1 else 'ponta'
temas=sys.argv[2].split(',') if len(sys.argv)>2 else ['aconchegante']
with sync_playwright() as p:
    b=p.chromium.launch(args=ARGS); pg=b.new_page(viewport={'width':1100,'height':700}); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.add_init_script("try{localStorage.setItem('pe.tour.v1','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_selector(f'[data-novo="{tip}"][data-sug="1"]'); pg.click(f'[data-novo="{tip}"][data-sug="1"]')
    pg.wait_for_function("document.querySelector('#carregando').hidden===true", timeout=120000)
    pg.wait_for_timeout(1200); J(pg,"document.querySelector('[data-tour=pular]')?.click(); document.querySelector('#dlg')?.open && document.querySelector('#dlg').close()")
    pg.click('#b-estilos'); pg.wait_for_timeout(1500)
    L('vitrine', J(pg,"document.querySelector('#editor').dataset.vitrine"), J(pg,"window.__pe.view3d.getMode()"), 'cards', J(pg,"document.querySelectorAll('.vit-card').length"))
    pg.screenshot(path=f'{OUT}/vit-{tip}-orig.png', timeout=120000)
    for t in temas:
        t0=J(pg,"performance.now()")
        pg.click(f'.vit-card[data-tema={t}]'); pg.wait_for_function("!document.querySelector('.vit-info').classList.contains('calc')", timeout=60000)
        pg.wait_for_timeout(1500)
        L(t, 'ms', round(J(pg,"performance.now()")-t0), J(pg,"document.querySelector('.vit-res')?.textContent"))
        pg.screenshot(path=f'{OUT}/vit-{tip}-{t}.png', timeout=120000)
    n=J(pg,"window.__pe.store.projeto.itens.length"); past=J(pg,"window.__pe.store.past.length")
    pg.click('.vit-acoes [data-a=cancelar]'); pg.wait_for_timeout(800)
    L('cancelou: itens', n, '->', J(pg,"window.__pe.store.projeto.itens.length"), 'past', past, J(pg,"window.__pe.store.past.length"), 'modo', J(pg,"window.__pe.view3d.getMode()"))
    L('errs', errs[:3]); b.close()
