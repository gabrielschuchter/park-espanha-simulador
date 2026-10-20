import os, json, time, collections
from playwright.sync_api import sync_playwright
URL='file:///tmp/distdbg/index.html'
with sync_playwright() as p:
    b=p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
    ctx=b.new_context(viewport={'width':1440,'height':900}); pg=ctx.new_page()
    pg.goto(URL); pg.wait_for_timeout(800)
    c=ctx.new_cdp_session(pg); c.send('Profiler.enable'); c.send('Profiler.setSamplingInterval',{'interval':500}); c.send('Profiler.start')
    pg.click('[data-novo="meio"][data-sug="1"]'); pg.wait_for_timeout(300); pg.click('[data-tour="pular"]')
    pg.click('#v-3d'); pg.wait_for_function("() => document.querySelector('#gl-host canvas')"); pg.wait_for_timeout(5000)
    prof=c.send('Profiler.stop')['profile']
    nodes={n['id']:n for n in prof['nodes']}; selft=collections.Counter()
    dt=prof['timeDeltas'];
    for s,d in zip(prof['samples'],dt): selft[s]+=d
    agg=collections.Counter()
    for i,t in selft.items():
        f=nodes[i]['callFrame']; agg[(f['functionName'] or '(anon)', f['lineNumber'])]+=t
    for k,v in agg.most_common(18): print(round(v/1000), 'ms', k)
    b.close()
