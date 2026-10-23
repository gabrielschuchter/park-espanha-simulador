import os, sys
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html')
ARGS=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
J=lambda pg,e: pg.evaluate(e)
with sync_playwright() as p:
    b=p.chromium.launch(args=ARGS); pg=b.new_page(viewport={'width':900,'height':600}); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.add_init_script("try{localStorage.setItem('pe.tour.v1','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_selector('[data-novo="ponta"][data-sug="1"]'); pg.click('[data-novo="ponta"][data-sug="1"]')
    pg.wait_for_function("document.querySelector('#carregando').hidden===true", timeout=120000)
    pg.wait_for_timeout(1500); J(pg,"document.querySelector('[data-tour=pular]')?.click()")
    J(pg,"window.__pe.view3d.setMode('orbita')"); pg.wait_for_timeout(1500)
    cv=pg.locator('canvas').first; box=cv.bounding_box(); cx,cy=box['x']+box['width']/2, box['y']+box['height']/2
    pg.mouse.move(cx,cy)
    for dy,label in [(-100,'roda normal'),(-3000,'evento gigante'),(-100,'normal')]:
        d0=J(pg,"window.__pe.view3d.camDist()")
        pg.evaluate("(dy)=>{const c=document.querySelector('canvas');c.dispatchEvent(new WheelEvent('wheel',{deltaY:dy,clientX:%d,clientY:%d,bubbles:true,cancelable:true}))}"%(cx,cy), dy)
        pg.wait_for_timeout(1500)
        d1=J(pg,"window.__pe.view3d.camDist()")
        print(label, dy, 'dist', round(d0,2),'->',round(d1,2),'razao',round(d1/d0,3))
    # gigante em linhas (Firefox): deltaMode 1, deltaY -3 => ~100px
    d0=J(pg,"window.__pe.view3d.camDist()")
    pg.evaluate("()=>{const c=document.querySelector('canvas');c.dispatchEvent(new WheelEvent('wheel',{deltaY:-3,deltaMode:1,bubbles:true,cancelable:true}))}")
    pg.wait_for_timeout(1500); d1=J(pg,"window.__pe.view3d.camDist()")
    print('linhas -3', round(d0,2),'->',round(d1,2),'razao',round(d1/d0,3))
    print('errs', errs[:3]); b.close()
