import os, json, math
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots3'
ARGS=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
L=lambda *a: print(*a, flush=True)
def abrir(p, mobile):
    b=p.chromium.launch(args=ARGS)
    ctx=b.new_context(viewport={'width':390,'height':780} if mobile else {'width':1100,'height':700}, has_touch=mobile, is_mobile=mobile, device_scale_factor=1)
    pg=ctx.new_page(); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.add_init_script("try{localStorage.setItem('pe.tour.v1','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_selector('[data-novo="meio"][data-sug="1"]'); pg.click('[data-novo="meio"][data-sug="1"]')
    pg.wait_for_function("document.querySelector('#carregando').hidden===true", timeout=120000)
    pg.wait_for_timeout(800); pg.evaluate("document.querySelector('[data-tour=pular]')?.click()"); pg.wait_for_timeout(300)
    return b, ctx, pg, errs
info=lambda pg: pg.evaluate("window.__pe.view3d.info()")
fmt=lambda a: [round(x,2) for x in a]
with sync_playwright() as p:
    # ---------------- desktop
    b,ctx,pg,errs=abrir(p, False)
    pg.evaluate("window.__pe.view3d.setMode('orbita')"); pg.wait_for_timeout(1200)
    i0=info(pg); L('orbita ini', fmt(i0['cam']), fmt(i0['alvo']))
    box=pg.evaluate("(()=>{const r=document.querySelector('.gl').getBoundingClientRect();return [r.left,r.top,r.width,r.height]})()")
    cx,cy=box[0]+box[2]*0.75, box[1]+box[3]*0.5   # cursor à direita do centro
    pg.mouse.move(cx,cy)
    for _ in range(4): pg.mouse.wheel(0,-120); pg.wait_for_timeout(80)
    pg.wait_for_timeout(900)
    i1=info(pg); L('apos wheel', fmt(i1['cam']), fmt(i1['alvo']), 'dist', round(math.dist(i1['cam'],i1['alvo']),2),'(antes',round(math.dist(i0['cam'],i0['alvo']),2),')')
    L('alvo moveu em x?', round(i1['alvo'][0]-i0['alvo'][0],2))
    pg.screenshot(path=f'{OUT}/cam-d-zoom.png')
    # zoom extremo e limite
    for _ in range(40): pg.mouse.wheel(0,120); pg.wait_for_timeout(30)
    pg.wait_for_timeout(900); i2=info(pg); L('afastou', fmt(i2['cam']), fmt(i2['alvo']), round(math.dist(i2['cam'],i2['alvo']),1))
    # duplo clique
    pg.evaluate("window.__pe.view3d.resetCamera()"); pg.wait_for_timeout(1000)
    i3=info(pg); d3=math.dist(i3['cam'],i3['alvo'])
    pg.mouse.dblclick(box[0]+box[2]*0.5, box[1]+box[3]*0.6); pg.wait_for_timeout(1200)
    i4=info(pg); d4=math.dist(i4['cam'],i4['alvo']); L('dblclick dist', round(d3,2),'->',round(d4,2),'alvo',fmt(i4['alvo']))
    pg.mouse.dblclick(box[0]+box[2]*0.5, box[1]+box[3]*0.6); pg.wait_for_timeout(1200)
    pg.mouse.dblclick(box[0]+box[2]*0.5, box[1]+box[3]*0.6); pg.wait_for_timeout(1400)
    i5=info(pg); L('2o/3o dblclick dist', round(math.dist(i5['cam'],i5['alvo']),2))
    # ---------------- passeio
    pg.evaluate("window.__pe.view3d.irPara('sala')"); pg.wait_for_timeout(1500)
    L('modo', info(pg)['mode'])
    y0=info(pg)['yaw']
    pg.mouse.move(box[0]+400,box[1]+300); pg.mouse.down()
    pg.mouse.move(box[0]+420,box[1]+300, steps=2); pg.wait_for_timeout(16)
    ya=info(pg)['yaw']; pg.wait_for_timeout(250); yb=info(pg)['yaw']
    pg.mouse.up(); L('olhar mouse: logo apos', round(ya-y0,3),'depois de 250ms', round(yb-y0,3),'(esperado ~', round(20*math.radians(64)/700*0.85,3),')')
    # aceleração
    pg.evaluate("window.__pe.view3d.olhar(0,0)"); pg.wait_for_timeout(300)
    p0=info(pg)['pos']; pg.keyboard.down('KeyW'); pg.wait_for_timeout(120); p1=info(pg)['pos']; pg.wait_for_timeout(700); p2=info(pg)['pos']
    pg.keyboard.up('KeyW'); pg.wait_for_timeout(60); p3=info(pg)['pos']; pg.wait_for_timeout(500); p4=info(pg)['pos']
    d=lambda a,b: round(math.hypot(a[0]-b[0],a[2]-b[2]),3)
    L('andar: 120ms',d(p0,p1),'| +700ms',d(p1,p2),'| soltou +60ms',d(p2,p3),'| +500ms',d(p3,p4))
    pg.mouse.wheel(0,200); pg.wait_for_timeout(200); L('fov apos wheel', round(info(pg)['fov'],1))
    pg.screenshot(path=f'{OUT}/cam-d-passeio.png')
    L('errs',errs); b.close()
