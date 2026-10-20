import os, json, sys
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html'); OUT='tools/shots2'; errs=[]; L=lambda *a: print(*a, flush=True)
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--autoplay-policy=no-user-gesture-required"])
    ctx=b.new_context(viewport={'width':1440,'height':900})
    pg=ctx.new_page(); pg.on('pageerror',lambda e: errs.append('PE '+str(e))); pg.on('console',lambda m: errs.append('C '+m.text) if m.type=='error' and 'TUNNEL' not in m.text else None)
    pg.goto(URL); pg.click('[data-novo="meio"][data-sug="1"]'); pg.wait_for_timeout(800)
    pg.click('[data-tour="pular"]'); pg.click('#v-3d'); pg.wait_for_timeout(2500)
    pg.click('#rail [data-tool="paredes"]'); pg.wait_for_timeout(300)
    res=pg.evaluate("""() => { const out={}; const v=__pe.view3d; for(let x=380;x<1430;x+=60) for(let y=130;y<880;y+=60){ const r=v.pickDebug(x,y); const k=r.sup? r.sup.tipo+':'+r.sup.room : 'none'; (out[k]=out[k]||[]).push([x,y]); } return Object.fromEntries(Object.entries(out).map(([k,v])=>[k,v.length+' '+JSON.stringify(v.slice(0,3))])); }""")
    L(json.dumps(res,indent=1))
    L('errs', errs)
    b.close()
