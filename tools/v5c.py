import os, json, math
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots3'
ARGS=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
L=lambda *a: print(*a, flush=True)
with sync_playwright() as p:
    b=p.chromium.launch(args=ARGS); pg=b.new_page(viewport={'width':1000,'height':640}); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.add_init_script("try{localStorage.setItem('pe.tour.v1','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_selector('[data-novo="meio"][data-sug="1"]'); pg.click('[data-novo="meio"][data-sug="1"]')
    pg.wait_for_function("document.querySelector('#carregando').hidden===true", timeout=120000)
    pg.wait_for_timeout(800); pg.evaluate("document.querySelector('[data-tour=pular]')?.click(); document.querySelector('#dlg')?.open && document.querySelector('#dlg').close()")
    pg.evaluate("window.__pe.view3d.irPara('sala')"); pg.wait_for_timeout(1000)
    pg.evaluate("window.__pe.view3d.focar(0.275,2.55)"); pg.wait_for_timeout(300)
    pos=pg.evaluate("window.__pe.view3d.posicao()"); dx,dz=0.275-pos['x'],2.55-pos['z']; d=math.hypot(dx,dz)
    pg.evaluate(f"window.__pe.view3d.olhar({math.atan2(dx,-dz)},{-math.atan2(1.62-0.9,d)})"); pg.wait_for_timeout(1500)
    L('mira', json.dumps(pg.evaluate("(()=>{const i=window.__pe.view3d.miraInfo();return i&&{k:i.kind,id:i.id,n:i.nome}})()")))
    box=pg.evaluate("(()=>{const r=document.querySelector('.gl').getBoundingClientRect();return [r.left,r.top,r.width,r.height]})()")
    cx,cy=box[0]+box[2]/2, box[1]+box[3]/2
    pg.mouse.move(cx-30,cy-30); pg.mouse.move(cx,cy,steps=3); pg.wait_for_timeout(900)
    L('hover', pg.evaluate("[...document.querySelectorAll('#tip-3d')].map(e=>e.hidden+':'+e.textContent).join('|')"))
    pg.screenshot(path=f'{OUT}/v5-hover-pia.png')
    pg.mouse.click(cx,cy); pg.wait_for_timeout(900)
    L('clique -> tool', pg.evaluate("document.querySelector('#workspace').dataset.tool"), pg.evaluate("document.querySelector('.fix-item.on')?.innerText"), 'modo', pg.evaluate("window.__pe.view3d.getMode()"))
    pg.screenshot(path=f'{OUT}/v5-clique-pia.png')
    # orbita: hover/click lavatorio via ver no 3D
    pg.evaluate("window.__pe.view3d.setMode('orbita')"); pg.wait_for_timeout(1200)
    pg.evaluate("window.__pe.setTool('moveis')"); pg.wait_for_timeout(500)
    hits=[]
    for gx in range(6,15):
        for gy in range(3,10):
            x=box[0]+box[2]*gx/20; y=box[1]+box[3]*gy/12
            pg.mouse.move(x,y); pg.wait_for_timeout(120)
            t=pg.evaluate("[...document.querySelectorAll('#tip-3d')].filter(e=>!e.hidden).map(e=>e.textContent).join('|')")
            if 'editar' in t and t not in [h[2] for h in hits]: hits.append((x,y,t))
    L('orbita hovers', [h[2] for h in hits])
    L('errs',errs); b.close()
