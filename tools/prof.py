import os, time, json, collections, sys
from playwright.sync_api import sync_playwright
URL='file://'+os.path.abspath('dist/index.html')
ARGS=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"]
mob = len(sys.argv)>1
with sync_playwright() as p:
    b=p.chromium.launch(args=ARGS)
    ctx=b.new_context(viewport={'width':390,'height':780} if mob else {'width':1440,'height':900}, has_touch=mob, is_mobile=mob, device_scale_factor=2 if mob else 1)
    pg=ctx.new_page(); pg.goto(URL); pg.wait_for_selector('[data-novo="meio"][data-sug="1"]')
    cdp=ctx.new_cdp_session(pg); cdp.send('Profiler.enable'); cdp.send('Profiler.setSamplingInterval',{'interval':1000}); cdp.send('Profiler.start')
    t0=time.time(); pg.click('[data-novo="meio"][data-sug="1"]')
    pg.wait_for_function("document.querySelector('#carregando').hidden===true", timeout=90000)
    print('total',round(time.time()-t0,2))
    prof=cdp.send('Profiler.stop')['profile']
    nodes={n['id']:n for n in prof['nodes']}; self=collections.Counter()
    dt=prof['timeDeltas'];
    for s,d in zip(prof['samples'],dt): self[s]+=d
    agg=collections.Counter()
    for i,t in self.items():
        cf=nodes[i]['callFrame']; agg[(cf['functionName'] or '(anon)')+' '+str(cf['lineNumber'])+':'+str(cf['columnNumber'])]+=t
    tot=sum(agg.values())
    for k,v in agg.most_common(18): print(round(v/1000),'ms',k)
    print('sum',round(tot/1000))
    b.close()
