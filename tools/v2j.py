import os, json
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html')
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    ctx=b.new_context(viewport={'width':390,'height':844}, has_touch=True, is_mobile=True, device_scale_factor=2); pg=ctx.new_page()
    pg.on('console',lambda m: print(m.text) if 'FIT' in m.text else None); pg.goto(URL); pg.wait_for_timeout(500)
    pg.tap('[data-novo="meio"][data-sug="1"]'); pg.wait_for_timeout(600); pg.tap('[data-tour="pular"]'); pg.wait_for_timeout(500)
    pg.tap('#bb-view')
    for t in (200,800,2000):
        pg.wait_for_timeout(t)
        print(pg.evaluate("() => { const h=document.querySelector('#gl-host'); const c=h.querySelector('canvas'); const r=h.getBoundingClientRect(); return JSON.stringify({host:[r.width,r.height], canvas:[c.width,c.height,c.style.width,c.style.height], p:__pe.view3d.projetar(0,0,0), q:__pe.view3d.projetar(11.7,0,0)}); }"))
    b.close()
