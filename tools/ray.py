import os, json
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html')
ARGS=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
with sync_playwright() as p:
    b=p.chromium.launch(args=ARGS); pg=b.new_page(viewport={'width':500,'height':400})
    pg.add_init_script("try{localStorage.setItem('pe.tour.v1','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_selector('[data-novo="meio"][data-sug="1"]'); pg.click('[data-novo="meio"][data-sug="1"]')
    pg.wait_for_function("document.querySelector('#carregando').hidden===true", timeout=90000)
    pg.evaluate("window.__pe.view3d.irPara('sala')"); pg.wait_for_timeout(1000)
    for yaw,pitch in [(0,0),(1.5708,0),(3.1416,-0.3),(0,1.2)]:
        pg.evaluate(f"window.__pe.view3d.olhar({yaw},{pitch})")
        print(yaw,pitch,json.dumps(pg.evaluate("window.__pe.view3d.rayDebug()")))
    b.close()
