import os, json
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots'; errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    pg=b.new_page(viewport={'width':1440,'height':900}); pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto(URL); pg.click('[data-novo="meio"][data-sug="1"]'); pg.wait_for_timeout(1200)
    pg.screenshot(path=f'{OUT}/30-meio-2d-1440.png')
    pg.click('#v-3d'); pg.wait_for_timeout(1500)
    for r in ['q2','q1','sala','coz','serv']:
        pg.click('[data-modo="passeio"]'); pg.select_option('#ir-para', r); pg.wait_for_timeout(700); pg.screenshot(path=f'{OUT}/31-ir-{r}.png')
    pg.click('#btn-voltar'); pg.click('[data-novo="ponta"][data-sug="1"]'); pg.wait_for_timeout(1200); pg.click('#v-3d'); pg.wait_for_timeout(1500)
    pg.click('[data-modo="orbita"]'); pg.wait_for_timeout(900); pg.screenshot(path=f'{OUT}/32-ponta-maquete.png')
    for r in ['sala','qb']:
        pg.click('[data-modo="passeio"]'); pg.select_option('#ir-para', r); pg.wait_for_timeout(700); pg.screenshot(path=f'{OUT}/33-ponta-{r}.png')
    pg.click('[data-luz="tarde"]'); pg.wait_for_timeout(500); pg.screenshot(path=f'{OUT}/34-ponta-tarde.png')
    b.close()
print('erros', errs)
