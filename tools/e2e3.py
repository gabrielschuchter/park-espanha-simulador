import os, json
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots'; errs=[]; L=lambda *a: print(*a, flush=True)
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    ctx=b.new_context(viewport={'width':1440,'height':900}, color_scheme='dark')
    pg=ctx.new_page(); pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto(URL); pg.click('[data-novo="ponta"][data-sug="0"]'); pg.wait_for_timeout(900)
    # arrastar do catálogo para a planta
    pg.click('[data-cat="quarto"]')
    card=pg.locator('[data-add="camacasal"]').bounding_box()
    host=pg.locator('#plan-host').bounding_box()
    tgt=pg.evaluate("() => { const r=document.querySelector('#plan-host').getBoundingClientRect(); return null; }")
    # ponto alvo: centro do Quarto 2 (qb) em coordenadas de tela
    sx,sy=pg.evaluate("() => { const v=__pe.plan2d.view; const [x,y]=[2.3,5.4]; const r=document.querySelector('#plan-host').getBoundingClientRect(); const [u,w]= v.rot?[-y,x]:[x,y]; return [r.left+u*v.s+v.tx, r.top+w*v.s+v.ty]; }")
    pg.mouse.move(card['x']+40, card['y']+30); pg.mouse.down(); pg.mouse.move(card['x']+80, card['y']+60, steps=4); pg.mouse.move(sx, sy, steps=12); pg.mouse.up(); pg.wait_for_timeout(500)
    it=pg.evaluate("() => { const i=__pe.store.projeto.itens.at(-1); return [i.nome,i.x,i.y,i.w,i.d]; }"); L('drop cama', it)
    # girar pela alça
    h=pg.locator('.handle.rot').bounding_box(); cx,cy=pg.evaluate("() => { const v=__pe.plan2d.view; const i=__pe.store.projeto.itens.at(-1); const r=document.querySelector('#plan-host').getBoundingClientRect(); const [u,w]= v.rot?[-i.y,i.x]:[i.x,i.y]; return [r.left+u*v.s+v.tx, r.top+w*v.s+v.ty]; }")
    pg.mouse.move(h['x']+h['width']/2, h['y']+h['height']/2); pg.mouse.down(); pg.mouse.move(cx+120, cy, steps=10); pg.mouse.up(); pg.wait_for_timeout(300)
    L('rot', pg.evaluate("() => __pe.store.projeto.itens.at(-1).rot"))
    # redimensionar pela alça leste
    e=pg.locator('.handle[data-h="e"]').bounding_box(); pg.mouse.move(e['x']+e['width']/2, e['y']+e['height']/2); pg.mouse.down(); pg.mouse.move(e['x']+e['width']/2, e['y']+e['height']/2+20, steps=5); pg.mouse.up(); pg.wait_for_timeout(300)
    L('após resize', pg.evaluate("() => { const i=__pe.store.projeto.itens.at(-1); return [i.w,i.d]; }"))
    # digitar medida exata
    pg.fill('#i-w','158'); pg.press('#i-w','Enter'); pg.fill('#i-d','198'); pg.press('#i-d','Enter'); pg.wait_for_timeout(300)
    L('queen', pg.evaluate("() => { const i=__pe.store.projeto.itens.at(-1); return [i.w,i.d]; }"))
    pg.screenshot(path=f'{OUT}/40-dark-sel.png')
    pg.keyboard.press('Control+z'); pg.keyboard.press('Control+z'); pg.wait_for_timeout(200)
    L('undo x2', pg.evaluate("() => { const i=__pe.store.projeto.itens.at(-1); return [i.w,i.d]; }"))
    pg.keyboard.press('Control+Shift+z'); L('redo', pg.evaluate("() => { const i=__pe.store.projeto.itens.at(-1); return [i.w,i.d]; }"))
    pg.keyboard.press('Control+d'); pg.wait_for_timeout(300); L('dup n', pg.evaluate("() => __pe.store.projeto.itens.length"))
    pg.keyboard.press('Delete'); pg.wait_for_timeout(300); L('del n', pg.evaluate("() => __pe.store.projeto.itens.length"))
    # exportar e importar
    pg.click('#btn-menu'); pg.click('[data-acao="exportar"]'); pg.wait_for_timeout(300)
    txt=pg.input_value('#exp-txt'); L('export bytes', len(txt)); pg.screenshot(path=f'{OUT}/41-export.png'); pg.click('[data-dlg-fechar]')
    pg.click('#btn-menu'); pg.click('[data-acao="importar"]'); pg.fill('#imp-txt', txt); pg.click('#imp-ok'); pg.wait_for_timeout(800)
    L('import', pg.evaluate("() => [__pe.store.projeto.nome, __pe.store.projeto.itens.length]"))
    pg.click('#btn-menu'); pg.click('[data-acao="medidas"]'); pg.wait_for_timeout(300); pg.screenshot(path=f'{OUT}/42-medidas.png'); pg.click('[data-dlg-fechar]')
    # mapa de circulação
    pg.click('#f-circ'); pg.wait_for_timeout(400); pg.screenshot(path=f'{OUT}/43-circ.png')
    b.close()
print('erros', errs)
