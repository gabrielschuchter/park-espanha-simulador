import os, json
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots2'; errs=[]; L=lambda *a: print(*a, flush=True)
os.makedirs('/tmp/dl',exist_ok=True)
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    ctx=b.new_context(viewport={'width':1440,'height':900}, accept_downloads=True); pg=ctx.new_page()
    pg.on('pageerror',lambda e: errs.append('PE '+str(e)))
    pg.goto(URL); pg.click('[data-novo="meio"][data-sug="1"]'); pg.wait_for_timeout(700); pg.click('[data-tour="pular"]')
    pg.click('#rail [data-tool="resumo"]'); pg.wait_for_timeout(800)
    pg.screenshot(path=f'{OUT}/40-resumo.png')
    btns=pg.evaluate("() => [...document.querySelectorAll('#resumo-corpo [data-exp]')].map(b=>b.dataset.exp)"); L('exp', btns)
    for e in btns:
        try:
            with pg.expect_download(timeout=30000) as d: pg.click(f'#resumo-corpo [data-exp="{e}"]')
            dl=d.value; path=f'/tmp/dl/{dl.suggested_filename}'; dl.save_as(path); L(e, dl.suggested_filename, os.path.getsize(path))
        except Exception as ex: L(e,'ERRO',str(ex)[:100])
    # voltar para home
    pg.click('#btn-voltar'); pg.wait_for_timeout(800); pg.screenshot(path=f'{OUT}/41-home-salvo.png')
    L('errs', errs)
    b.close()
