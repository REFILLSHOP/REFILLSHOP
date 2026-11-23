// Refills Shop PWA. Solo guarda recursos públicos: nunca pedidos, sesiones, pagos ni saldos.
const CACHE='refills-shop-pwa-shell-v4';
const ROOT='/REFILLSHOP/';
const OFFLINE=ROOT+'offline.html';
const STATIC=[OFFLINE,ROOT+'manifest.webmanifest',ROOT+'assets/refills-app-192.png',ROOT+'assets/refills-app-512.png',ROOT+'assets/refills-app-maskable-512.png'];
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await Promise.allSettled(STATIC.map(path=>cache.add(new Request(path,{cache:'reload'}))));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('refills-shop-pwa-shell-')&&k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin||!url.pathname.startsWith(ROOT))return;
 // Administración, sesiones, precios y API siempre en red, nunca en cache.
 if(url.pathname.startsWith(ROOT+'admin/')||/\/(api|auth|checkout|orders)\//i.test(url.pathname))return;
 if(req.mode==='navigate'){
  event.respondWith((async()=>{
   try {return await fetch(req);}
   catch{return await caches.match(OFFLINE)||new Response('Conéctate a internet para utilizar Refills Shop',{status:503,headers:{'content-type':'text/plain; charset=utf-8'}});}
  })());
  return;
 }
 // Sólo iconos públicos: no interceptar datos de la tienda.
 const isStatic=STATIC.some(p=>new URL(p,self.location.origin).pathname===url.pathname);
 if(isStatic){
  event.respondWith((async()=>{
   const cached=await caches.match(req,{ignoreSearch:true});
   if(cached)return cached;
   const res=await fetch(req);
   if(res.ok&&res.type==='basic'){
    const copy=res.clone();
    void caches.open(CACHE).then(cache=>cache.put(req,copy)).catch(()=>{});
   }
   return res;
  })());
 }
});
