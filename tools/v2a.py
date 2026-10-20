import os, json, sys
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots2'; errs=[]; L=lambda *a: print(*a, flush=True)
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--autoplay-policy=no-user-gesture-required"])
    ctx=b.new_context(viewport={'width':1440,'height':900})
    pg=ctx.new_page(); pg.on('pageerror',lambda e: errs.append('PE '+str(e))); pg.on('console',lambda m: errs.append('C '+m.text) if m.type in ('error','warning') else None)
    pg.goto(URL); pg.wait_for_timeout(600)
    pg.screenshot(path=f'{OUT}/01-home.png')
    pg.click('[data-novo="meio"][data-sug="1"]'); pg.wait_for_timeout(1200)
    pg.screenshot(path=f'{OUT}/02-editor-tour.png')
    pg.click('[data-tour="pular"]'); pg.wait_for_timeout(300)
    pg.screenshot(path=f'{OUT}/03-editor-2d.png')
    L('errs', errs)
    b.close()
