import os, json, sys
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots2'; errs=[]; L=lambda *a: print(*a, flush=True)
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--autoplay-policy=no-user-gesture-required"])
    ctx=b.new_context(viewport={'width':1440,'height':900})
    pg=ctx.new_page(); pg.on('pageerror',lambda e: errs.append('PE '+str(e))); pg.on('console',lambda m: errs.append('C '+m.text) if m.type=='error' and 'TUNNEL' not in m.text else None)
    pg.goto(URL); pg.click('[data-novo="meio"][data-sug="1"]'); pg.wait_for_timeout(800)
    pg.click('[data-tour="pular"]')
    pg.click('#v-3d'); pg.wait_for_timeout(3500)
    L('errs', errs); L(pg.evaluate("() => __pe.view3d.debug()"))
    pg.screenshot(path=f'{OUT}/10-3d.png')
    b.close()
