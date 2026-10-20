import os, json
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots2'
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg=b.new_context(viewport={'width':1440,'height':900}).new_page()
    pg.goto(URL); pg.click('[data-novo="meio"][data-sug="1"]'); pg.wait_for_timeout(800)
    pg.click('[data-tour="pular"]'); pg.click('#v-3d'); pg.wait_for_timeout(1500)
    pg.click('#seg-modo [data-modo="forro"]')
    for t in (4000,):
        pg.wait_for_timeout(t)
        print(pg.evaluate("() => { const v=__pe.view3d; return JSON.stringify([[0,2.7,0],[10,2.7,5]].map(a=>v.projetar(...a).map(Math.round))); }"), pg.evaluate("() => { const c=document.querySelector('#gl-host canvas'); const r=c.getBoundingClientRect(); return [c.width,c.height,Math.round(r.left),Math.round(r.width),Math.round(r.height)]; }"))
    pg.screenshot(path=f'{OUT}/21-forro-fit.png'); b.close()
