import os, json, math, time
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots3'
ARGS=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
L=lambda *a: print(*a, flush=True)
info=lambda pg: pg.evaluate("window.__pe.view3d.info()")
fmt=lambda a: [round(x,2) for x in a]
with sync_playwright() as p:
    b=p.chromium.launch(args=ARGS)
    ctx=b.new_context(viewport={'width':320,'height':568}, has_touch=True, is_mobile=True, device_scale_factor=1)
    pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.add_init_script("try{localStorage.setItem('pe.tour.v1','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_selector('[data-novo="meio"][data-sug="1"]'); pg.click('[data-novo="meio"][data-sug="1"]')
    pg.wait_for_function("document.querySelector('#carregando').hidden===true", timeout=120000)
    pg.wait_for_timeout(800); pg.evaluate("document.querySelector('[data-tour=pular]')?.click()"); pg.wait_for_timeout(300)
    cdp=ctx.new_cdp_session(pg)
    def touch(tp, pts):
        cdp.send('Input.dispatchTouchEvent', {'type': tp, 'touchPoints': [{'x':x,'y':y,'id':i} for i,(x,y) in enumerate(pts)]})
    def gesto(a0, a1, passos=5, dt=40, hold_end=False):
        touch('touchStart', a0)
        for k in range(1,passos+1):
            t=k/passos; touch('touchMove', [(x0+(x1-x0)*t, y0+(y1-y0)*t) for (x0,y0),(x1,y1) in zip(a0,a1)]); pg.wait_for_timeout(dt)
        if not hold_end: touch('touchEnd', [])
    L('modo', info(pg)['mode'], 'fps teste:', pg.evaluate("new Promise(r=>{let n=0;const t0=performance.now();const f=()=>{n++;performance.now()-t0<1000?requestAnimationFrame(f):r(n)};f()})"))
    box=pg.evaluate("(()=>{const r=document.querySelector('.gl').getBoundingClientRect();return [r.left,r.top,r.width,r.height]})()"); L('canvas',box)
    cy=box[1]+box[3]*0.35
    i2=info(pg); i3=i2
    i3=info(pg)
    pg.touchscreen.tap(160,cy); pg.wait_for_timeout(110); pg.touchscreen.tap(160,cy); pg.wait_for_timeout(1300)
    i4=info(pg); L('duplo toque: dist', round(math.dist(i3['cam'],i3['alvo']),1),'->',round(math.dist(i4['cam'],i4['alvo']),1))
    pg.screenshot(path=f'{OUT}/cam-m-orbita.png')
    # passeio
    pg.evaluate("window.__pe.view3d.irPara('sala')"); pg.wait_for_timeout(1800)
    L('modo', info(pg)['mode'], 'joy visivel', pg.evaluate("!document.querySelector('#joy').hidden"))
    y0=info(pg)['yaw']
    touch('touchStart',[(200,300)])
    for k in range(1,5): touch('touchMove',[(200+k*18,300)]); pg.wait_for_timeout(30)
    pg.wait_for_timeout(10); touch('touchEnd',[])
    ya=info(pg)['yaw']; pg.wait_for_timeout(120); yb=info(pg)['yaw']; pg.wait_for_timeout(900); yc=info(pg)['yaw']; pg.wait_for_timeout(900); yd=info(pg)['yaw']
    L('olhar toque 72px: yaw +',round(ya-y0,3),'/',round(yb-y0,3),'/',round(yc-y0,3),'/',round(yd-y0,3),'(inércia: cresce depois de soltar; base esperada', round(72*math.radians(84)/box[3]*1.15,3),')')
    L('errs',errs); b.close()
