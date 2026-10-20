import os, json
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots2'; errs=[]; L=lambda *a: print(*a, flush=True)
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--autoplay-policy=no-user-gesture-required"])
    pg=b.new_context(viewport={'width':1440,'height':900}).new_page()
    pg.on('pageerror',lambda e: errs.append('PE '+str(e))); pg.on('console',lambda m: errs.append('C '+m.text) if m.type=='error' and 'TUNNEL' not in m.text else None)
    pg.goto(URL); pg.click('[data-novo="meio"][data-sug="1"]'); pg.wait_for_timeout(800)
    pg.click('[data-tour="pular"]'); pg.click('#v-3d'); pg.wait_for_timeout(2000)
    # piso
    pg.click('#rail [data-tool="piso"]'); pg.wait_for_timeout(300)
    pg.click('#esc-piso [data-esc="comodo"]')
    pg.click('#sw-piso [data-piso="marmore"]')
    pg.mouse.move(580,530); pg.wait_for_timeout(400); pg.screenshot(path=f'{OUT}/15-hover-piso.png')
    pg.mouse.down(); pg.mouse.up(); pg.wait_for_timeout(700)
    L('piso', pg.evaluate("() => JSON.stringify(__pe.store.projeto.acab.piso)"))
    pg.screenshot(path=f'{OUT}/16-piso.png')
    # desfazer
    pg.keyboard.press('Control+z'); pg.wait_for_timeout(300)
    L('piso apos undo', pg.evaluate("() => JSON.stringify(__pe.store.projeto.acab.piso)"))
    pg.keyboard.press('Control+y'); pg.wait_for_timeout(300)
    L('piso apos redo', pg.evaluate("() => JSON.stringify(__pe.store.projeto.acab.piso)"))
    # teto
    pg.click('#rail [data-tool="teto"]'); pg.wait_for_timeout(1800)
    L('modo', pg.evaluate("() => __pe.view3d.getMode()"))
    pg.click('#teto-cards [data-tt="sanca"]'); pg.click('#esc-teto [data-esc="todos"]')
    pg.screenshot(path=f'{OUT}/17-forro-pre.png')
    r=pg.evaluate("""() => { const out=[]; for (let x=420;x<1300;x+=40) for (let y=150;y<800;y+=40) { const d=__pe.view3d.pickDebug(x,y); if (d.sup) out.push([x,y,d.sup]); } return out; }""")
    L('hits teto', len(r), r[:5])
    if r:
        x,y=r[len(r)//2][0],r[len(r)//2][1]; pg.mouse.move(x,y); pg.mouse.down(); pg.mouse.up(); pg.wait_for_timeout(900)
    L('teto', pg.evaluate("() => JSON.stringify(__pe.store.projeto.acab.teto)"))
    pg.screenshot(path=f'{OUT}/18-forro.png')
    # luz noite
    pg.click('#rail [data-tool="luz"]'); pg.wait_for_timeout(300)
    pg.click('#luz-todas-on'); pg.click('#luz-noite'); pg.wait_for_timeout(1800)
    L('modo', pg.evaluate("() => __pe.view3d.getMode()"), pg.evaluate("() => JSON.stringify(__pe.view3d.debug())"))
    pg.screenshot(path=f'{OUT}/19-noite.png')
    pg.click('#seg-modo [data-modo="orbita"]'); pg.wait_for_timeout(1800)
    pg.screenshot(path=f'{OUT}/20-noite-orbita.png')
    L('errs', errs)
    b.close()
