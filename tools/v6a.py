import os, json, math
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots3'
ARGS=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
L=lambda *a: print(*a, flush=True)
J=lambda pg,e: pg.evaluate(e)
with sync_playwright() as p:
    b=p.chromium.launch(args=ARGS); pg=b.new_page(viewport={'width':1100,'height':700}); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.add_init_script("try{localStorage.setItem('pe.tour.v1','1')}catch(e){}")
    pg.goto(URL); pg.wait_for_selector('[data-novo="meio"][data-sug="1"]'); pg.click('[data-novo="meio"][data-sug="1"]')
    pg.wait_for_function("document.querySelector('#carregando').hidden===true", timeout=120000)
    pg.wait_for_timeout(800); J(pg,"document.querySelector('[data-tour=pular]')?.click(); document.querySelector('#dlg')?.open && document.querySelector('#dlg').close()")
    J(pg,"window.__pe.view3d.irPara('sala')"); pg.wait_for_timeout(1000)
    def mirar(x,y,h):
        J(pg,f"window.__pe.view3d.focar({x},{y})"); pg.wait_for_timeout(200)
        pos=J(pg,"window.__pe.view3d.posicao()"); dx,dz=x-pos['x'],y-pos['z']; d=math.hypot(dx,dz)
        J(pg,f"window.__pe.view3d.olhar({math.atan2(dx,-dz)},{-math.atan2(1.62-h,d)})"); pg.wait_for_timeout(1300)
    mirar(0.275,2.55,0.9)
    L('acoes', J(pg,"document.querySelector('#acoes-passeio').innerText.replace(/\\n/g,' | ')"))
    J(pg,"document.querySelector('#acoes-passeio [data-ma=editar]').click()"); pg.wait_for_timeout(700)
    L('cartao', J(pg,"document.querySelector('#workspace').dataset.cartao"), J(pg,"document.querySelector('#cartao-tit').textContent"), '|', J(pg,"document.querySelector('#cartao-sub').textContent"), 'ferr', J(pg,"document.querySelector('#workspace').dataset.ferr"))
    pg.screenshot(path=f'{OUT}/v6-cartao-pia.png')
    pg.wait_for_timeout(2500); pg.screenshot(path=f'{OUT}/v6-cartao-pia2.png'); L('errs',errs); b.close(); raise SystemExit
    J(pg,"document.querySelector('#cartao-corpo [data-girar]').click()"); pg.wait_for_timeout(800)
    L('girou', json.dumps(J(pg,"window.__pe.store.projeto.fix.pia")), 'sub', J(pg,"document.querySelector('#cartao-sub').textContent"))
    J(pg,"document.querySelector('#cartao-corpo [data-origpos]').click()"); pg.wait_for_timeout(800)
    L('original', json.dumps(J(pg,"window.__pe.store.projeto.fix.pia")), J(pg,"window.__pe.plan.fixos.find(f=>f.id==='pia').rot"))
    # mover via carry
    J(pg,"document.querySelector('#cartao-corpo [data-mover]').click()"); pg.wait_for_timeout(1200)
    L('carry ativo', J(pg,"window.__pe.view3d.carryAtivo()"), J(pg,"document.querySelector('#carry-nome').textContent"), J(pg,"document.querySelector('#cy-alt').textContent"))
    J(pg,"window.__pe.view3d.olhar(window.__pe.view3d.posicao().yaw+0.4,-0.6)"); pg.wait_for_timeout(1200)
    pg.screenshot(path=f'{OUT}/v6-carry-pia.png')
    L('confirmou', J(pg,"window.__pe.view3d.confirmarCarry()")); pg.wait_for_timeout(1200)
    L('pos nova', json.dumps(J(pg,"window.__pe.store.projeto.fix.pia")))
    J(pg,"window.__pe.store.projeto && 0");
    # desfazer
    J(pg,"document.querySelector('#btn-undo').click()"); pg.wait_for_timeout(900)
    L('desfez', json.dumps(J(pg,"window.__pe.store.projeto.fix.pia||null")), J(pg,"window.__pe.plan.fixos.find(f=>f.id==='pia').x"))
    # abertura: porta do quarto 1
    J(pg,"window.__pe.editarAlvo({kind:'abertura', id:'P1-q1'})"); pg.wait_for_timeout(600)
    L('cartao porta', J(pg,"document.querySelector('#cartao-tit').textContent"), J(pg,"document.querySelector('#cartao-corpo').innerText.slice(0,120).replace(/\\n/g,' | ')"))
    J(pg,"document.querySelector('#cartao-corpo [data-sem]').click()"); pg.wait_for_timeout(900)
    L('retirada', json.dumps(J(pg,"window.__pe.store.projeto.fix['P1-q1']")), J(pg,"window.__pe.plan.openings.find(o=>o.id==='P1-q1').sem"), J(pg,"document.querySelector('#cartao-sub').textContent"))
    pg.screenshot(path=f'{OUT}/v6-porta-retirada.png')
    J(pg,"document.querySelector('#cartao-corpo [data-sem]').click()"); pg.wait_for_timeout(900)
    L('recolocada', json.dumps(J(pg,"window.__pe.store.projeto.fix['P1-q1']")))
    # superficie
    J(pg,"window.__pe.editarAlvo({kind:'superficie', tipo:'parede', room:'sala', edge:0})"); pg.wait_for_timeout(900)
    L('cartao parede', J(pg,"document.querySelector('#cartao-tit').textContent"), J(pg,"[...document.querySelectorAll('#cartao-corpo .esc-lista button')].map(b=>b.getAttribute('aria-checked')+':'+b.textContent).join(' / ')"))
    J(pg,"document.querySelector('#cartao-corpo .sw-marca[data-cm=suvinil-n879]')?.click() || document.querySelector('#cartao-corpo .sw-marca')?.click()"); pg.wait_for_timeout(1000)
    L('destaque', json.dumps(J(pg,"window.__pe.store.projeto.acab.destaque")), 'parede', json.dumps(J(pg,"window.__pe.store.projeto.acab.parede.sala||null")))
    pg.screenshot(path=f'{OUT}/v6-cartao-parede.png')
    J(pg,"document.querySelector('#cartao-x').click()"); pg.wait_for_timeout(500)
    L('fechou', J(pg,"document.querySelector('#workspace').dataset.cartao"))
    # acao na mira (sem cursor preso): parede
    J(pg,"window.__pe.view3d.olhar(0,0)"); pg.wait_for_timeout(900)
    J(pg,"window.__pe.view3d.acaoNaMira()"); pg.wait_for_timeout(600)
    L('acaoNaMira ->', J(pg,"document.querySelector('#cartao-tit').textContent"), J(pg,"document.querySelector('#workspace').dataset.cartao"))
    # clique no canvas: pointer lock
    box=J(pg,"(()=>{const r=document.querySelector('.gl').getBoundingClientRect();return [r.left,r.top,r.width,r.height]})()")
    J(pg,"document.querySelector('#cartao-x').click()")
    pg.mouse.click(box[0]+box[2]/2, box[1]+box[3]/2); pg.wait_for_timeout(600)
    L('lock', J(pg,"!!document.pointerLockElement"), J(pg,"document.querySelector('#hint-3d').textContent"))
    L('errs',errs); b.close()
