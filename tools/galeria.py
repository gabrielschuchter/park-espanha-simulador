import sys, subprocess, time, os
from playwright.sync_api import sync_playwright
cats = sys.argv[1].split(',')
est = sys.argv[2] if len(sys.argv) > 2 else '0'
out = sys.argv[3] if len(sys.argv) > 3 else 'tools/shots3'
os.makedirs(out, exist_ok=True)
srv = subprocess.Popen(['npx', 'vite', '--port', '5199', '--strictPort'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(3)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = b.new_page(viewport={'width': 1600, 'height': 1100})
        pg.on('console', lambda m: print('LOG', m.text) if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e: print('ERR', e))
        for c in cats:
            n = 1
            k = 0
            while k < n:
                pg.goto(f'http://localhost:5199/tools/galeria/index.html?cat={c}&estado={est}&pg={k}')
                pg.wait_for_function('window.__ok === true', timeout=60000)
                n = (pg.evaluate('window.__n') + 11) // 12
                pg.screenshot(path=f'{out}/{c}-e{est}-{k}.png', full_page=True)
                k += 1
        b.close()
finally:
    srv.terminate()
