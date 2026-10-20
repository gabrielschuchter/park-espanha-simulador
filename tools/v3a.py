import os, time
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots3'; errs=[]; L=lambda *a: print(*a, flush=True)
ARGS=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
with sync_playwright() as p:
    b=p.chromium.launch(args=ARGS)
    for nome,vp,mob in [('desk',{'width':1440,'height':900},False),('mob',{'width':390,'height':780},True)]:
        ctx=b.new_context(viewport=vp, has_touch=mob, is_mobile=mob, device_scale_factor=2 if mob else 1); pg=ctx.new_page()
        pg.on('pageerror',lambda e: errs.append('PE '+str(e)))
        pg.on('console',lambda m: errs.append('CE '+m.text) if m.type=='error' else None)
        pg.add_init_script("try{localStorage.setItem('pe.tour.v1','1')}catch(e){}"); pg.goto(URL); pg.wait_for_selector('[data-novo="meio"][data-sug="1"]')
        t0=time.time(); pg.click('[data-novo="meio"][data-sug="1"]')
        pg.wait_for_timeout(120); pg.screenshot(path=f'{OUT}/a-{nome}-loading.png')
        pg.wait_for_function("document.querySelector('#carregando').hidden===true", timeout=60000)
        L(nome,'abriu em',round(time.time()-t0,2),'s')
        pg.wait_for_timeout(600); pg.screenshot(path=f'{OUT}/a-{nome}-editor.png')
        L('view', pg.evaluate("document.querySelector('#workspace').dataset.view"))
        if pg.query_selector('[data-tour="pular"]'):
            pg.click('[data-tour="pular"]'); pg.wait_for_timeout(300)
        pg.screenshot(path=f'{OUT}/a-{nome}-editor2.png')
        ctx.close()
    L('errs', errs[:10]); b.close()
