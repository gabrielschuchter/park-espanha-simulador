import os, json
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html')
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--autoplay-policy=no-user-gesture-required"])
    pg=b.new_context(viewport={'width':1440,'height':900}).new_page()
    pg.goto(URL); pg.click('[data-novo="meio"][data-sug="1"]'); pg.wait_for_timeout(800)
    pg.click('[data-tour="pular"]'); pg.click('#v-3d'); pg.wait_for_timeout(2000)
    pg.click('#rail [data-tool="piso"]'); pg.wait_for_timeout(300)
    r=pg.evaluate("""() => { const out=[]; for (let x=420;x<1300;x+=40) for (let y=250;y<700;y+=40) { const d=__pe.view3d.pickDebug(x,y); out.push([x,y,JSON.stringify(d.sup),JSON.stringify(d.tool)]); } return out; }""")
    hits=[o for o in r if o[2] not in ('null','undefined')]
    print(len(r),len(hits)); print(hits[:8]); print(r[0])
    b.close()
