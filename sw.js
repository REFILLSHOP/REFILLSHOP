const APP_CACHE='refills-shop-pwa-shell-v1';
const ROOT='/REFILLSHOP/';
const OFFLINE=ROOT+'offline.html';
const CORE=[OFFLINE,ROOT+'manifest.webmanifest',ROOT+'assets/refills-icon.png',ROOT+'assets/refills-icon-192.png'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(APP_CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('refills-shop-pwa-shell-')&&key!==APP_CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin||!url.pathname.startsWith(ROOT))return;
 // No almacenar sesiones, pedidos, respuestas API, saldos ni administración.
 if(url.pathname.startsWith(ROOT+'admin/')||url.pathname.includes('/api/')||url.pathname.includes('/auth/'))return;
 if(req.mode==='navigate'){
  event.respondWith(fetch(req).catch(()=>caches.match(OFFLINE)));
  return;
 }
 // Únicamente recursos estáticos públicos; evita cachear el catálogo del usuario.
 if(url.pathname.startsWith(ROOT+'assets/')){
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(response=>{
   if(response.ok&&response.type==='basic'){
    const clone=response.clone();void caches.open(APP_CACHE).then(cache=>cache.put(req,clone));
   }
   return response;
  })));
 }
});
