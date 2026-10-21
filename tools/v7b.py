import os, sys
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots5'
ARGS=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
J=lambda pg,e: pg.evaluate(e)
tip=sys.argv[1] if len(sys.argv)>1 else 'meio'
temas=sys.argv[2].split(',') if len(sys.argv)>2 else None
with sync_playwright() as p:
    b=p.chromium.launch(args=ARGS); pg=b.new_page(viewport={'width':900,'height':560}); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.add_init_script("try{localStorage.setItem('pe.tour.v1','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_selector(f'[data-novo="{tip}"][data-sug="1"]'); pg.click(f'[data-novo="{tip}"][data-sug="1"]')
    pg.wait_for_function("document.querySelector('#carregando').hidden===true", timeout=120000)
    pg.wait_for_timeout(1500); J(pg,"document.querySelector('[data-tour=pular]')?.click(); document.querySelector('#dlg')?.open && document.querySelector('#dlg').close()")
    ids=temas or J(pg,"window.__pe.TEMAS.map(t=>t.id)")
    rooms=J(pg,"window.__pe.plan.rooms.map(r=>r.id)")
    for t in ids:
        J(pg,f"window.__pe.aplicarTema(window.__pe.TEMAS.find(x=>x.id==='{t}'))");
        per=J(pg,f"window.__pe.TEMAS.find(x=>x.id==='{t}').periodo"); J(pg,f"window.__pe.view3d.setPeriodo('{'dia' if per=='dia' else per}')")
        for r in ['sala','coz','qb','qa','b1','serv'] if 'qb' in rooms else ['sala','coz','q2','q1','b1','serv']:
            J(pg,f"window.__pe.view3d.irPara('{r}')"); pg.wait_for_timeout(1700)
            pg.screenshot(path=f'{OUT}/t-{tip}-{t}-{r}.png', timeout=120000)
        J(pg,"window.__pe.undo()"); pg.wait_for_timeout(300)
        print(t, flush=True)
    print('errs', errs[:3]); b.close()
