import os, json, math
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots3'
ARGS=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
L=lambda *a: print(*a, flush=True)
J=lambda pg,e: pg.evaluate(e)
UA='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
with sync_playwright() as p:
    b=p.chromium.launch(args=ARGS); ctx=b.new_context(viewport={'width':390,'height':664}, screen={'width':390,'height':844}, has_touch=True, is_mobile=True, device_scale_factor=1, user_agent=UA); pg=ctx.new_page(); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.add_init_script("try{localStorage.setItem('pe.tour.v1','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_timeout(800); pg.screenshot(path=f'{OUT}/v6m-home.png')
    L('home overflow', J(pg,"document.documentElement.scrollWidth"), J(pg,"innerWidth"))
    pg.click('[data-novo="meio"][data-sug="1"]')
    pg.wait_for_function("document.querySelector('#carregando').hidden===true", timeout=120000)
    pg.wait_for_timeout(800); J(pg,"document.querySelector('[data-tour=pular]')?.click()")
    pg.screenshot(path=f'{OUT}/v6m-editor.png')
    L('editor overflow', J(pg,"document.documentElement.scrollWidth"), J(pg,"[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&r.right>innerWidth+1&&getComputedStyle(e).position!=='fixed'&&!e.closest('.cam-ctl,.bb-tools,.cm-fams,.chips,.sw-grid')}).slice(0,8).map(e=>e.tagName+'.'+e.className+'#'+e.id+':'+Math.round(e.getBoundingClientRect().right)).join(' ; ')"))
    J(pg,"window.__pe.view3d.irPara('sala')"); pg.wait_for_timeout(1500)
    pg.screenshot(path=f'{OUT}/v6m-passeio.png')
    J(pg,"window.__pe.editarAlvo({kind:'superficie', tipo:'parede', room:'sala', edge:0})"); pg.wait_for_timeout(1500)
    pg.screenshot(path=f'{OUT}/v6m-cartao-parede.png')
    J(pg,"document.querySelector('#cartao-x').click()"); pg.wait_for_timeout(300)
    J(pg,"window.__pe.editarAlvo({kind:'fixo', id:'tanque'})"); pg.wait_for_timeout(1200)
    pg.screenshot(path=f'{OUT}/v6m-cartao-tanque.png')
    L('errs',errs); b.close()
