import os
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
    J(pg,"window.__pe.view3d.setMode('passeio')"); pg.wait_for_timeout(1500)
    J(pg,"const c=document.querySelector('canvas');Object.defineProperty(document,'pointerLockElement',{get:()=>c,configurable:true});document.dispatchEvent(new Event('pointerlockchange'))")
    pg.wait_for_timeout(400)
    for mx in (20,150,4000):
        y0=J(pg,"window.__pe.view3d.posicao().yaw")
        J(pg,"(mx)=>{const c=document.querySelector('canvas');c.dispatchEvent(new PointerEvent('pointermove',{movementX:mx,movementY:0,bubbles:true,pointerType:'mouse'}))}".replace("(mx)=>{","(()=>{const mx=%d;"%mx)+")()" if False else "(()=>{const mx=%d;const c=document.querySelector('canvas');c.dispatchEvent(new PointerEvent('pointermove',{movementX:mx,movementY:0,bubbles:true,pointerType:'mouse'}))})()"%mx)
        pg.wait_for_timeout(500)
        y1=J(pg,"window.__pe.view3d.posicao().yaw")
        print('movementX',mx,'yaw rad',round(y1-y0,3))
    print('errs',errs[:3]); b.close()
