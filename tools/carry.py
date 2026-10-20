import os, json
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots3'
ARGS=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
L=lambda *a: print(*a, flush=True)
with sync_playwright() as p:
    b=p.chromium.launch(args=ARGS); pg=b.new_page(viewport={'width':700,'height':480}); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.add_init_script("try{localStorage.setItem('pe.tour.v1','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_selector('[data-novo="meio"][data-sug="1"]'); pg.click('[data-novo="meio"][data-sug="1"]')
    pg.wait_for_function("document.querySelector('#carregando').hidden===true", timeout=90000)
    pg.evaluate("document.querySelector('#dlg')?.open && document.querySelector('#dlg').close()")
    rooms=pg.evaluate("window.__pe.plan.rooms.map(r=>r.id+':'+r.nome)"); L(rooms)
    pg.evaluate("window.__pe.view3d.irPara('sala')"); pg.wait_for_timeout(1500)
    L('mode',pg.evaluate("window.__pe.view3d.getMode()"), pg.evaluate("JSON.stringify(window.__pe.view3d.posicao())"))
    n0=pg.evaluate("window.__pe.store.projeto.itens.length")
    def teste(id, yaw, pitch, nome):
        pg.evaluate(f"window.__pe.view3d.olhar({yaw},{pitch})"); pg.wait_for_timeout(600)
        pg.evaluate(f"window.__pe.adicionar('{id}')"); pg.wait_for_timeout(2500)
        ativo=pg.evaluate("window.__pe.view3d.carryAtivo()")
        pg.screenshot(path=f'{OUT}/carry-{nome}.png')
        ok=pg.evaluate("window.__pe.view3d.confirmarCarry()")
        pg.wait_for_timeout(500)
        its=pg.evaluate("window.__pe.store.projeto.itens"); it=its[-1]
        L(nome,'ativo',ativo,'confirmou',ok,'n',len(its),json.dumps({k:it.get(k) for k in ('tipo','x','y','elev','rot')}))
    teste('estante',0,-0.7,'piso')
    pos=json.loads(pg.evaluate("JSON.stringify(window.__pe.view3d.posicao())")); L(pos)
    teste('quadro',0,0.0,'parede-n')
    teste('quadro',1.5708,0.0,'parede-l')
    teste('lustre',0,1.2,'teto')
    L('altura/rotacao')
    pg.evaluate("window.__pe.view3d.olhar(3.1416,-0.6)"); pg.wait_for_timeout(400)
    pg.evaluate("window.__pe.adicionar('abajur')"); pg.wait_for_timeout(1200)
    pg.evaluate("window.__pe.view3d.alturaCarry(20); window.__pe.view3d.girarCarry(45)"); pg.wait_for_timeout(1500)
    pg.screenshot(path=f'{OUT}/carry-altura.png')
    pg.evaluate("window.__pe.view3d.confirmarCarry()"); pg.wait_for_timeout(300)
    it=pg.evaluate("window.__pe.store.projeto.itens.slice(-1)[0]"); L('abajur',json.dumps({k:it.get(k) for k in ('tipo','x','y','elev','rot')}))
    L('errs',errs)
    b.close()
