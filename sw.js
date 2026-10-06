const V='folio-v10',MUST=['./','index.html'],EXTRA=['manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png'];
self.addEventListener('install',e=>e.waitUntil((async()=>{
  const c=await caches.open(V),fresh=u=>new Request(u,{cache:'reload'});
  await c.addAll(MUST.map(fresh));
  await Promise.all(EXTRA.map(u=>c.add(fresh(u)).catch(()=>{})));
  await self.skipWaiting();
})()));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==V&&n!=='folio-share').map(n=>caches.delete(n)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method==='POST'&&u.pathname.endsWith('/share')){
    e.respondWith((async()=>{
      try{const fs=(await r.formData()).getAll('pdf').filter(f=>f&&f.size),c=await caches.open('folio-share');
        for(let i=0;i<fs.length;i++)await c.put('shared-'+i,new Response(fs[i],{headers:{'x-name':encodeURIComponent(fs[i].name||'shared.pdf')}}));
      }catch(_){}
      return Response.redirect('./?shared=1',303);
    })());
    return;
  }
  if(r.method!=='GET'||u.origin!==location.origin)return;
  e.respondWith((async()=>{
    const c=await caches.open(V),hit=await c.match(r,{ignoreSearch:true});
    const net=fetch(r).then(x=>{if(x.ok&&!u.search)c.put(r,x.clone());return x}).catch(()=>null);
    if(hit){e.waitUntil(net);return hit}
    return(await net)||Response.error();
  })());
});
