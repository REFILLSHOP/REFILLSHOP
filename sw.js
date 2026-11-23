// Refills Shop PWA — exclusivamente recursos públicos, nunca saldo ni pedidos.
const CACHE='refills-shop-pwa-shell-v2';
const ROOT='/REFILLSHOP/';
const OFFLINE=ROOT+'offline.html';
const PUBLIC_ASSETS=[OFFLINE,ROOT+'assets/refills-app-192.png',ROOT+'assets/refills-app-512.png',ROOT+'assets/refills-app-maskable-512.png'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(async c=>{
  await Promise.allSettled(PUBLIC_ASSETS.map(url=>c.add(new Request(url,{cache:'reload'}))));
 }).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('refills-shop-pwa-shell-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const u=new URL(event.request.url);
 if(u.origin!==self.location.origin||!u.pathname.startsWith(ROOT))return;
 if(u.pathname.startsWith(ROOT+'admin/')||u.pathname.includes('/api/')||u.pathname.includes('/auth/'))return;
 if(event.request.mode==='navigate'){
  event.respondWith(fetch(event.request).catch(async()=>await caches.match(OFFLINE)||new Response('Conéctate a internet para usar Refills Shop',{status:503,headers:{'content-type':'text/plain; charset=utf-8'}})));
  return;
 }
 if(u.pathname.startsWith(ROOT+'assets/')){
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(res=>{
   if(res.ok&&res.type==='basic')event.waitUntil(caches.open(CACHE).then(c=>c.put(event.request,res.clone())));
   return res;
  })));
 }
});
