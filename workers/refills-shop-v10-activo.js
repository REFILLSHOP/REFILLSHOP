// Refills Shop V10 actual backend staging: Cloudflare edge serves the frontend,
// Supabase Edge function implements protected account API. No real payments enabled.
const COMMIT="5477173a6578c8110b47ba7ee6541828883a73fe";
const GITHUB="https://raw.githubusercontent.com/REFILLSHOP/REFILLSHOP/"+COMMIT+"/v10";
const BACKEND="https://kcgjlnymhmxylrjchcvl.supabase.co/functions/v1/rs10-api";
const label='<div role="status" style="position:relative;z-index:100;background:#124c72;color:#fff;text-align:center;padding:7px 16px;font:600 12px system-ui">REFILLS SHOP · PREPRODUCCIÓN REAL · Registros conectados · Compras y pagos todavía desactivados</div>';
export default {
 async fetch(req){
  const u=new URL(req.url),p=decodeURIComponent(u.pathname);
  if(p==='/health')return new Response(JSON.stringify({ok:true,environment:'preproduction',api:BACKEND,payments:false}),{headers:{'content-type':'application/json','cache-control':'no-store'}});
  if(p.startsWith('/api/')){
   if(!['GET','POST'].includes(req.method))return new Response(JSON.stringify({error:'Operación no permitida'}),{status:405,headers:{'content-type':'application/json'}});
   // Only public backend routes are proxied. Admin and payment mutations remain disabled.
   const headers=new Headers({'accept':'application/json','content-type':'application/json','origin':u.origin});
   const token=req.headers.get('authorization');if(token)headers.set('authorization',token);
   if(req.headers.get('cf-connecting-ip'))headers.set('x-forwarded-for',req.headers.get('cf-connecting-ip'));
   let res;
   try{res=await fetch(BACKEND+p.slice(4)+u.search,{method:req.method,headers,body:req.method==='POST'?req.body:undefined,redirect:'manual',signal:AbortSignal.timeout(18000)});}catch{return new Response(JSON.stringify({error:'La API no responde. Reintenta más tarde.'}),{status:503,headers:{'content-type':'application/json'}})}
   const responseHeaders=new Headers({'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});
   return new Response(res.body,{status:res.status,headers:responseHeaders});
  }
  if(!['GET','HEAD'].includes(req.method))return new Response('Method Not Allowed',{status:405});
  const asset=/^\/assets\/[a-zA-Z0-9_.-]+\.(?:svg|png|jpg|jpeg|webp|ico)$/.test(p),rootFile=p==='/app.js'||p==='/site.css';
  if(p.includes('..')||p.includes('\\')||p.startsWith('/.')||(/\.[a-z0-9]{1,8}$/i.test(p)&&!asset&&!rootFile))return new Response('Not Found',{status:404});
  const file=asset||rootFile?p:'/index.html';let src;
  try{src=await fetch(GITHUB+file,{headers:{accept:'*/*'},cf:{cacheEverything:true,cacheTtl:300}});}catch{return new Response('Static assets unavailable',{status:503})}
  if(!src.ok)return new Response('Asset missing',{status:502});
  const h=new Headers({'x-robots-tag':'noindex,nofollow,noarchive','x-content-type-options':'nosniff','referrer-policy':'no-referrer','cache-control':file==='/index.html'?'no-store':'public,max-age=300'});
  if(file==='/index.html'){
   let html=await src.text();html=html.replace('</head>','<script>window.RS_PREVIEW=false;</script></head>').replace('<body>','<body>'+label);
   h.set('content-type','text/html; charset=utf-8');return new Response(req.method==='HEAD'?null:html,{status:200,headers:h});
  }
  const ext=file.split('.').pop();h.set('content-type',({js:'application/javascript; charset=utf-8',css:'text/css; charset=utf-8',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',ico:'image/x-icon'})[ext]||'application/octet-stream');
  return new Response(req.method==='HEAD'?null:src.body,{status:200,headers:h});
 }
};