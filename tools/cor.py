import os, sys, io
from PIL import Image
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots3'
ARGS=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
with sync_playwright() as p:
    b=p.chromium.launch(args=ARGS); pg=b.new_page(viewport={'width':600,'height':420})
    pg.add_init_script("try{localStorage.setItem('pe.tour.v1','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_selector('[data-novo="meio"][data-sug="1"]'); pg.click('[data-novo="meio"][data-sug="1"]')
    pg.wait_for_function("document.querySelector('#carregando').hidden===true", timeout=90000)
    pg.wait_for_timeout(800); pg.evaluate("document.querySelector('[data-tour=pular]')?.click()")
    pg.evaluate("window.__pe.aplicar('parede','q1',null,false)"); pg.wait_for_timeout(500)
    for periodo in ['dia','tarde','noite']:
        pg.evaluate(f"window.__pe.trocarPeriodo('{periodo}')"); pg.evaluate("window.__pe.view3d.irPara('q1')"); pg.wait_for_timeout(500)
        for yaw in [0,1.5708,3.1416,4.712]:
            pg.evaluate(f"window.__pe.view3d.olhar({yaw},0.05)"); pg.wait_for_timeout(1500)
            img=Image.open(io.BytesIO(pg.screenshot())).convert('RGB')
            print(periodo,yaw,[img.getpixel((300,y)) for y in (150,210,270)])
    b.close()
