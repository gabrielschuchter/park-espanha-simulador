import os, json
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots5'
ARGS=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
L=lambda *a: print(*a, flush=True)
J=lambda pg,e: pg.evaluate(e)
with sync_playwright() as p:
    b=p.chromium.launch(args=ARGS); pg=b.new_page(viewport={'width':1200,'height':720}); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
    pg.add_init_script("try{localStorage.setItem('pe.tour.v1','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_selector('[data-novo="meio"][data-sug="1"]'); pg.click('[data-novo="meio"][data-sug="1"]')
    pg.wait_for_function("document.querySelector('#carregando').hidden===true", timeout=120000)
    pg.wait_for_timeout(1000); J(pg,"document.querySelector('[data-tour=pular]')?.click(); document.querySelector('#dlg')?.open && document.querySelector('#dlg').close()")
    J(pg,"window.__pe.setTool('obra')"); pg.wait_for_timeout(800)
    L('modo3d', J(pg,"window.__pe.view3d.getMode()"), 'tool', J(pg,"document.querySelector('#workspace').dataset.tool"))
    O=lambda e: J(pg,f"window.__pe.eventoObra({json.dumps(e)})")
    # parede nova dividindo o quarto 2 (de parede a parede)
    O({'tipo':'click','x':9.10,'y':1.75}); O({'tipo':'move','x':10.2,'y':1.77}); O({'tipo':'click','x':11.6,'y':1.76})
    pg.wait_for_timeout(1500)
    ob=J(pg,"window.__pe.store.projeto.fix._obra")
    L('paredes', json.dumps(ob['paredes']))
    nid=ob['paredes'][0]['id']
    # abre porta na parede nova
    J(pg,"document.querySelector('#obra-modo [data-om=vao]').click()")
    O({'tipo':'move','x':10.0,'y':1.75}); O({'tipo':'click','x':10.0,'y':1.75}); pg.wait_for_timeout(1200)
    L('vaos', json.dumps(J(pg,"window.__pe.store.projeto.fix._obra.vaos")))
    # demolir parede entre sala e quarto 1
    J(pg,"document.querySelector('#obra-modo [data-om=sel]').click()")
    O({'tipo':'click','x':4.225,'y':1.0}); pg.wait_for_timeout(300)
    L('card', J(pg,"document.querySelector('#obra-corpo .obra-card')?.innerText.slice(0,120)"))
    J(pg,"document.querySelector('#obra-corpo [data-obra=demolir]')?.click()"); pg.wait_for_timeout(1500)
    L('demolidas', J(pg,"JSON.stringify(window.__pe.store.projeto.fix._obra.demolidas)"), 'walls', J(pg,"window.__pe.plan.tip.walls.length"), 'remendos', J(pg,"(window.__pe.plan.tip.remendos||[]).length"))
    L('analise', J(pg,"window.__pe.analise().alertas.map(a=>a.msg).slice(0,5).join(' | ')"))
    pg.screenshot(path=f'{OUT}/obra-3d.png', timeout=120000)
    J(pg,"window.__pe.setView('2d')"); pg.wait_for_timeout(900); pg.screenshot(path=f'{OUT}/obra-2d.png', timeout=120000)
    # desfazer volta a parede
    J(pg,"window.__pe.undo()"); pg.wait_for_timeout(900)
    L('desfez demolidas', J(pg,"JSON.stringify(window.__pe.store.projeto.fix._obra.demolidas)"), 'walls', J(pg,"window.__pe.plan.tip.walls.length"))
    # passeio pela parede nova: colisão
    L('errs', errs[:4]); b.close()
