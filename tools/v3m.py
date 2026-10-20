import os, time, sys
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots3'; L=lambda *a: print(*a, flush=True)
ARGS=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
with sync_playwright() as p:
    b=p.chromium.launch(args=ARGS)
    ctx=b.new_context(viewport={'width':390,'height':780}, has_touch=True, is_mobile=True, device_scale_factor=2)
    pg=ctx.new_page()
    pg.goto(URL); pg.wait_for_selector('[data-novo="meio"][data-sug="1"]')
    L('home', pg.evaluate("[innerWidth, document.documentElement.scrollWidth, visualViewport.width]"))
    pg.screenshot(path=f'{OUT}/m-home.png')
    pg.click('[data-novo="meio"][data-sug="1"]')
    pg.wait_for_function("document.querySelector('#carregando').hidden===true", timeout=90000)
    pg.wait_for_timeout(500)
    L('editor', pg.evaluate("[innerWidth, document.documentElement.scrollWidth, visualViewport.width]"))
    L(pg.evaluate("""(()=>{const w=innerWidth;return [...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.right>w+2&&r.width>0}).slice(0,15).map(e=>e.tagName+'#'+e.id+'.'+e.className+' '+Math.round(e.getBoundingClientRect().right))})()"""))
    b.close()
