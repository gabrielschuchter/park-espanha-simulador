import os, json
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots2'; errs=[]; L=lambda *a: print(*a, flush=True)
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--autoplay-policy=no-user-gesture-required"])
    ctx=b.new_context(viewport={'width':1440,'height':900}); pg=ctx.new_page()
    pg.on('pageerror',lambda e: errs.append('PE '+str(e))); pg.on('console',lambda m: errs.append('C '+m.text) if m.type=='error' and 'TUNNEL' not in m.text else None)
    pg.goto(URL); pg.click('[data-novo="meio"][data-sug="1"]'); pg.wait_for_timeout(800)
    pg.click('[data-tour="pular"]'); pg.click('#v-split'); pg.wait_for_timeout(2500)
    pg.screenshot(path=f'{OUT}/22-split.png')
    pg.click('#v-3d'); pg.wait_for_timeout(1500)
    # adicionar item e selecionar
    n0=pg.evaluate("() => __pe.store.projeto.itens.length")
    pg.click('#cat-chips [data-cat="luz"]'); pg.wait_for_timeout(200)
    pg.click('.cat-item >> nth=0'); pg.wait_for_timeout(1200)
    L('itens', n0, pg.evaluate("() => __pe.store.projeto.itens.length"), 'sel', pg.evaluate("() => __pe.store.sel"))
    pg.screenshot(path=f'{OUT}/23-item-add.png')
    # click em um item existente no 3D
    uid=pg.evaluate("() => __pe.store.projeto.itens.find(i=>i.tipo.includes('sofa'))?.uid")
    pos=pg.evaluate("(u) => { const it=__pe.store.projeto.itens.find(i=>i.uid===u); return it? __pe.view3d.projetar(it.x, it.elev+it.h*0.6, it.y):null }", uid)
    L('sofa', uid, pos)
    if pos:
        pg.mouse.click(pos[0],pos[1]); pg.wait_for_timeout(800)
        L('sel', pg.evaluate("() => __pe.store.sel"))
        pg.screenshot(path=f'{OUT}/24-item-sel.png')
        # arrastar
        pg.mouse.move(pos[0],pos[1]); pg.mouse.down(); pg.mouse.move(pos[0]+60,pos[1]+20,steps=6); pg.mouse.up(); pg.wait_for_timeout(600)
        it=pg.evaluate("(u) => { const i=__pe.store.projeto.itens.find(i=>i.uid===u); return [i.x,i.y] }", uid); L('apos arrastar', it)
        pg.screenshot(path=f'{OUT}/25-item-drag.png')
    # passeio
    pg.click('#seg-modo [data-modo="passeio"]'); pg.wait_for_timeout(2000)
    pg.keyboard.down('w'); pg.wait_for_timeout(800); pg.keyboard.up('w')
    pg.screenshot(path=f'{OUT}/26-passeio.png'); L('info', pg.evaluate("() => JSON.stringify(__pe.view3d.info())"))
    L('errs', errs)
    b.close()
