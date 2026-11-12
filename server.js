'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const HOST='0.0.0.0';
const PORT=Number(process.env.PORT || 10000);
const ROOT=__dirname;
const HEALTH=Object.freeze({status:'ok',service:'refills-shop-render-test',mode:'safe-read-only'});
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2'};
function handler(req,res){
 const url=new URL(req.url,'http://localhost');
 const name=url.pathname;
 res.setHeader('X-Content-Type-Options','nosniff');
 res.setHeader('Referrer-Policy','no-referrer');
 res.setHeader('X-Frame-Options','DENY');
 if(name==='/health'||name==='/healthz'){
   res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});return res.end(JSON.stringify(HEALTH));
 }
 if(name.startsWith('/api/')||name==='/admin'){
   res.writeHead(503,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
   return res.end(JSON.stringify({error:'Backend de producción pendiente de configuración; ninguna compra se procesará.'}));
 }
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Allow':'GET, HEAD'});return res.end();}
 let decoded;
 try{decoded=decodeURIComponent(name)}catch{res.writeHead(400);return res.end();}
 if(decoded.includes('\0')||decoded.includes('\\')||decoded.split('/').includes('..')||decoded.startsWith('/.')){res.writeHead(403);return res.end();}
 const relative=decoded==='/'?'preview/index.html':decoded.slice(1);
 const absolute=path.resolve(ROOT,relative);
 if(!absolute.startsWith(ROOT+path.sep)){res.writeHead(403);return res.end();}
 fs.stat(absolute,(err,st)=>{
   if(err||!st.isFile()){
     res.writeHead(404,{'Content-Type':'text/plain; charset=utf-8'});return res.end('No encontrado');
   }
   const ext=path.extname(absolute).toLowerCase();
   if(!MIME[ext]){res.writeHead(403);return res.end();}
   res.writeHead(200,{'Content-Type':MIME[ext],'Cache-Control':'public,max-age=60'});
   if(req.method==='HEAD')return res.end();
   fs.createReadStream(absolute).on('error',()=>res.destroy()).pipe(res);
 });
}
if(require.main===module){http.createServer(handler).listen(PORT,HOST,()=>console.log('Refills Shop safe preview listening on '+PORT));}
module.exports={handler};
