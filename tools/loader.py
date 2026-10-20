import os
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html')
ARGS=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
with sync_playwright() as p:
    b=p.chromium.launch(args=ARGS); pg=b.new_page(viewport={'width':390,'height':780}); pg.goto(URL); pg.wait_for_selector('[data-novo="meio"][data-sug="1"]')
    pg.evaluate("""()=>{window.__ev=[];const t0=performance.now();const log=(n)=>window.__ev.push([n,Math.round(performance.now()-t0)]);
      const car=document.querySelector('#carregando'), ed=document.querySelector('#editor');
      new MutationObserver(()=>log('car hidden='+car.hidden+' txt='+document.querySelector('#car-txt').textContent)).observe(car,{attributes:true,subtree:true,childList:true,characterData:true});
      new MutationObserver(()=>log('editor hidden='+ed.hidden)).observe(ed,{attributes:true});
      (function r(){requestAnimationFrame(()=>{log('frame');if(window.__ev.length<60)r()})})();}""")
    pg.click('[data-novo="meio"][data-sug="1"]'); pg.wait_for_function("document.querySelector('#carregando').hidden===true", timeout=90000)
    for e in pg.evaluate("window.__ev"): print(e)
    b.close()
