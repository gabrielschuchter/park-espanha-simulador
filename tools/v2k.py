import os, json
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html')
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist","--autoplay-policy=no-user-gesture-required"])
    pg=b.new_context(viewport={'width':1440,'height':900}).new_page()
    pg.goto(URL); pg.wait_for_timeout(500)
    pg.click('[data-novo="meio"][data-sug="1"]'); pg.wait_for_timeout(600); pg.click('[data-tour="pular"]'); pg.wait_for_timeout(400)
    names=pg.evaluate("() => Object.keys(window.__pe.Som).join(',')"); print(names)
    r=pg.evaluate("""async () => { const out=[]; const S=__pe.Som; const nomes=['clique','abrir','fechar','pegar','soltar','encaixe','girar','montar','excluir','desfazer','refazer','erro','ok','pintar','piso','pisoMadeira','forro','luzOn','luzOff','lampada','foto','sucesso','boasvindas','passoCeramica','passoMadeira','passoBanho'];
      for (const n of nomes) { try { out.push(await S.medir(n,1.5)); } catch(e) { out.push({n, e:String(e)}); } }
      for (const n of ['casa','tarde','noite']) { try { out.push(await S.medir(n,12)); } catch(e) { out.push({n, e:String(e)}); } }
      return out; }""")
    for x in r: print(x)
    b.close()
