import os, json, sys
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots2'; errs=[]; L=lambda *a: print(*a, flush=True)
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--autoplay-policy=no-user-gesture-required"])
    ctx=b.new_context(viewport={'width':1440,'height':900})
    pg=ctx.new_page(); pg.on('pageerror',lambda e: errs.append('PE '+str(e))); pg.on('console',lambda m: errs.append('C '+m.text) if m.type=='error' and 'TUNNEL' not in m.text else None)
    pg.goto(URL); pg.click('[data-novo="meio"][data-sug="1"]'); pg.wait_for_timeout(800)
    pg.click('[data-tour="pular"]')
    pg.click('#v-3d'); pg.wait_for_timeout(2500)
    pg.screenshot(path=f'{OUT}/11-3d-fit.png')
    # paredes
    pg.click('#rail [data-tool="paredes"]'); pg.wait_for_timeout(400)
    pg.click('#esc-paredes [data-esc="unico"]')
    pg.click('#sw-paredes [data-nome="Verde sálvia"]')
    # alvo: parede topo da sala, face interna
    x,y=560,430
    pg.mouse.move(x,y); pg.wait_for_timeout(500); pg.screenshot(path=f'{OUT}/12-hover-parede.png')
    pg.mouse.down(); pg.mouse.up(); pg.wait_for_timeout(700)
    L('destaque', pg.evaluate("() => JSON.stringify(__pe.store.projeto.acab.destaque)"))
    pg.screenshot(path=f'{OUT}/13-parede-pintada.png')
    # cômodo todo
    pg.click('#esc-paredes [data-esc="comodo"]'); pg.click('#tab-paredes [data-pt="tex"]'); pg.click('#sw-paredes [data-tex="tijolo-branco"]')
    x,y=860,370; pg.mouse.move(x,y); pg.mouse.down(); pg.mouse.up(); pg.wait_for_timeout(600)
    L('parede', pg.evaluate("() => JSON.stringify(__pe.store.projeto.acab.parede)"))
    # piso
    pg.click('#rail [data-tool="piso"]'); pg.wait_for_timeout(300)
    pg.click('#sw-piso [data-piso="marmore"]')
    x,y=pg.evaluate("() => __pe.view3d.projetar(2.0,0.0,3.0)"); pg.mouse.move(x,y); pg.mouse.down(); pg.mouse.up(); pg.wait_for_timeout(600)
    L('piso', pg.evaluate("() => JSON.stringify(__pe.store.projeto.acab.piso)"))
    pg.screenshot(path=f'{OUT}/14-piso.png')
    L('errs', errs)
    b.close()
