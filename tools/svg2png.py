import sys, os
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(device_scale_factor=1)
    for f in sys.argv[1:]:
        pg.goto('file://' + os.path.abspath(f)); pg.wait_for_timeout(50)
        pg.locator('svg').screenshot(path=f[:-4] + '.png')
    b.close()
