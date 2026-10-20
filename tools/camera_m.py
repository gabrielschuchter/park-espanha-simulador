import os, json, math, time
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots3'
ARGS=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
L=lambda *a: print(*a, flush=True)
info=lambda pg: pg.evaluate("window.__pe.view3d.info()")
fmt=lambda a: [round(x,2) for x in a]
with sync_playwright() as p:
    b=p.chromium.launch(args=ARGS)
    ctx=b.new_context(viewport={'width':390,'height':780}, has_touch=True, is_mobile=True, device_scale_factor=1)
    pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.add_init_script("try{localStorage.setItem('pe.tour.v1','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_selector('[data-novo="meio"][data-sug="1"]'); pg.click('[data-novo="meio"][data-sug="1"]')
    pg.wait_for_function("document.querySelector('#carregando').hidden===true", timeout=120000)
    pg.wait_for_timeout(800); pg.evaluate("document.querySelector('[data-tour=pular]')?.click()"); pg.wait_for_timeout(300)
    cdp=ctx.new_cdp_session(pg)
    def touch(tp, pts):
        cdp.send('Input.dispatchTouchEvent', {'type': tp, 'touchPoints': [{'x':x,'y':y,'id':i} for i,(x,y) in enumerate(pts)]})
    def gesto(a0, a1, passos=12, dt=18, hold_end=False):
        touch('touchStart', a0)
        for k in range(1,passos+1):
            t=k/passos; touch('touchMove', [(x0+(x1-x0)*t, y0+(y1-y0)*t) for (x0,y0),(x1,y1) in zip(a0,a1)]); pg.wait_for_timeout(dt)
        if not hold_end: touch('touchEnd', [])
    L('modo', info(pg)['mode'], 'fps teste:', pg.evaluate("new Promise(r=>{let n=0;const t0=performance.now();const f=()=>{n++;performance.now()-t0<1000?requestAnimationFrame(f):r(n)};f()})"))
    box=pg.evaluate("(()=>{const r=document.querySelector('.gl').getBoundingClientRect();return [r.left,r.top,r.width,r.height]})()"); L('canvas',box)
    cy=box[1]+box[3]*0.35
    i0=info(pg); d0=math.dist(i0['cam'],i0['alvo']); L('orbita', fmt(i0['cam']), fmt(i0['alvo']))
    gesto([(130,cy),(260,cy)], [(70,cy),(320,cy)]); pg.wait_for_timeout(1500)
    i1=info(pg); L('pinça abre: dist', round(d0,1),'->',round(math.dist(i1['cam'],i1['alvo']),1),'alvo mov',fmt([a-b for a,b in zip(i1['alvo'],i0['alvo'])]))
    gesto([(195,cy)], [(120,cy+30)]); pg.wait_for_timeout(1500)
    i2=info(pg); L('1 dedo gira: cam', fmt(i1['cam']),'->',fmt(i2['cam']))
    gesto([(110,cy),(180,cy)], [(210,cy+60),(280,cy+60)]); pg.wait_for_timeout(1500)
    i3=info(pg); L('2 dedos juntos (pan): alvo', fmt(i2['alvo']),'->',fmt(i3['alvo']), 'dist', round(math.dist(i2['cam'],i2['alvo']),1),'->',round(math.dist(i3['cam'],i3['alvo']),1))
    pg.touchscreen.tap(195,cy); pg.wait_for_timeout(110); pg.touchscreen.tap(195,cy); pg.wait_for_timeout(1300)
    i4=info(pg); L('duplo toque: dist', round(math.dist(i3['cam'],i3['alvo']),1),'->',round(math.dist(i4['cam'],i4['alvo']),1))
    pg.screenshot(path=f'{OUT}/cam-m-orbita.png')
    # passeio
    pg.evaluate("window.__pe.view3d.irPara('sala')"); pg.wait_for_timeout(1800)
    L('modo', info(pg)['mode'], 'joy visivel', pg.evaluate("!document.querySelector('#joy').hidden"))
    y0=info(pg)['yaw']
    touch('touchStart',[(250,300)])
    for k in range(1,9): touch('touchMove',[(250+k*9,300)]); pg.wait_for_timeout(16)
    pg.wait_for_timeout(10); touch('touchEnd',[])
    ya=info(pg)['yaw']; pg.wait_for_timeout(120); yb=info(pg)['yaw']; pg.wait_for_timeout(900); yc=info(pg)['yaw']; pg.wait_for_timeout(900); yd=info(pg)['yaw']
    L('olhar toque 72px: yaw +',round(ya-y0,3),'/',round(yb-y0,3),'/',round(yc-y0,3),'/',round(yd-y0,3),'(inércia: cresce depois de soltar; base esperada', round(72*math.radians(84)/box[3]*1.15,3),')')
    f0=info(pg)['fov']
    gesto([(150,260),(250,260)], [(110,260),(290,260)]); pg.wait_for_timeout(400)
    L('pinça passeio fov', round(f0,1),'->',round(info(pg)['fov'],1))
    # joystick
    jb=pg.evaluate("(()=>{const r=document.querySelector('#joy').getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]})()"); L('joy centro',jb)
    pg.evaluate("window.__pe.view3d.olhar(0,0)"); pg.wait_for_timeout(300)
    p0=info(pg)['pos']
    touch('touchStart',[(jb[0],jb[1])]); touch('touchMove',[(jb[0]+2,jb[1]-3)]); pg.wait_for_timeout(500)
    p1=info(pg)['pos']; L('zona morta: deslocou', round(math.hypot(p1[0]-p0[0],p1[2]-p0[2]),3))
    touch('touchMove',[(jb[0],jb[1]-25)]); pg.wait_for_timeout(1200); p2=info(pg)['pos']
    touch('touchMove',[(jb[0],jb[1]-60)]); pg.wait_for_timeout(300)
    L('knob corre', pg.evaluate("document.querySelector('.joy-knob').classList.contains('corre')"))
    pg.wait_for_timeout(1200); p3=info(pg)['pos']
    touch('touchEnd',[]); pg.wait_for_timeout(1000); p4=info(pg)['pos']; pg.wait_for_timeout(600); p5=info(pg)['pos']
    d=lambda a,b: round(math.hypot(a[0]-b[0],a[2]-b[2]),3)
    L('joy meia: ',d(p1,p2),'| pleno (corre):',d(p2,p3),'| apos soltar',d(p3,p4),'+',d(p4,p5))
    pg.screenshot(path=f'{OUT}/cam-m-passeio.png')
    L('errs',errs); b.close()
