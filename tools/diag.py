import os, time
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html')
ARGS=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
with sync_playwright() as p:
    b=p.chromium.launch(args=ARGS); pg=b.new_page(viewport={'width':1440,'height':900}); pg.goto(URL); pg.wait_for_selector('[data-novo="meio"][data-sug="1"]')
    pg.click('[data-novo="meio"][data-sug="1"]'); pg.wait_for_function("document.querySelector('#carregando').hidden===true", timeout=90000)
    print(pg.evaluate("JSON.stringify(window.__pe.view3d.diag())"))
    b.close()
