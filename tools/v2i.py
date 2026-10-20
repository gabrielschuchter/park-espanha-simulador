import os, json
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots2'; errs=[]; L=lambda *a: print(*a, flush=True)
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--autoplay-policy=no-user-gesture-required"])
    ctx=b.new_context(viewport={'width':390,'height':844}, has_touch=True, is_mobile=True, device_scale_factor=2); pg=ctx.new_page()
    pg.on('pageerror',lambda e: errs.append('PE '+str(e))); pg.on('console',lambda m: errs.append('C '+m.text) if m.type=='error' and 'TUNNEL' not in m.text else None)
    pg.goto(URL); pg.wait_for_timeout(800); pg.screenshot(path=f'{OUT}/30-m-home.png')
    pg.tap('[data-novo="meio"][data-sug="1"]'); pg.wait_for_timeout(800)
    pg.screenshot(path=f'{OUT}/31-m-tour.png')
    pg.tap('[data-tour="pular"]'); pg.wait_for_timeout(800)
    pg.screenshot(path=f'{OUT}/32-m-editor.png')
    pg.tap('#bb-view'); pg.wait_for_timeout(2500)
    pg.screenshot(path=f'{OUT}/33-m-3d.png')
    pg.tap('#bottom-bar [data-tool="paredes"]'); pg.wait_for_timeout(800)
    pg.screenshot(path=f'{OUT}/34-m-paredes.png')
    L('docw', pg.evaluate("() => [document.documentElement.scrollWidth, innerWidth]"))
    L('errs', errs)
    b.close()
