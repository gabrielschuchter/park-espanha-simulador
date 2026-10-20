import os, json, time
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html')
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg=b.new_context(viewport={'width':1440,'height':900}).new_page()
    pg.goto(URL); pg.wait_for_timeout(800)
    pg.evaluate("""() => { window.__lt=[]; new PerformanceObserver(l=>l.getEntries().forEach(e=>__lt.push([Math.round(e.startTime),Math.round(e.duration)]))).observe({entryTypes:['longtask']}); }""")
    t=time.time(); pg.click('[data-novo="meio"][data-sug="1"]'); pg.wait_for_timeout(300); pg.click('[data-tour="pular"]')
    pg.click('#v-3d'); pg.wait_for_function("() => document.querySelector('#gl-host canvas')"); t2=time.time()-t
    pg.wait_for_timeout(4000)
    print('lt', pg.evaluate("() => __lt"), 'tempo ate canvas', round(t2,2))
    b.close()
