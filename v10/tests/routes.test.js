'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const path=require('node:path');
const PORT=39877,BASE=`http://127.0.0.1:${PORT}`;
async function ready(){for(let i=0;i<40;i++){try{const r=await fetch(BASE+'/api/health');if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,90))}throw Error('Test server not started')}
test('clean routes return SPA HTML on direct access, and no supplier key appears in client resources',async()=>{
 const child=spawn(process.execPath,['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:String(PORT),ADMIN_PASSWORD:'TEST_ONLY_PASSWORD',SESSION_SECRET:'a-test-only-signing-secret-of-more-than-32-chars',CENTRALONE_API_KEY:'TEST_SHOULD_NOT_LEAK',RA_API_KEY:'',SUPABASE_URL:'',SUPABASE_PUBLISHABLE_KEY:'',SUPABASE_SECRET_KEY:''},stdio:'ignore'});
 try{
  await ready();
  for(const route of ['/inicio','/catalogo','/pedidos','/revendedores','/cuenta','/juegos/free-fire','/compra/datos','/compra/pago','/compra/revision','/admin','/admin/offers']){
   const r=await fetch(BASE+route);assert.equal(r.status,200,route);assert.match(r.headers.get('content-type'),/text\/html/);
  }
  const js=await (await fetch(BASE+'/app.js')).text();const html=await (await fetch(BASE+'/index.html')).text();const css=await (await fetch(BASE+'/site.css')).text();
  assert.equal(js.includes('TEST_SHOULD_NOT_LEAK'),false);assert.equal(html.includes('TEST_SHOULD_NOT_LEAK'),false);assert.equal(css.includes('TEST_SHOULD_NOT_LEAK'),false);
  assert.equal((await fetch(BASE+'/assets/brand-wordmark.webp')).status,200);
  assert.equal((await fetch(BASE+'/assets/google-g.svg')).status,200);
  assert.equal((await fetch(BASE+'/api/catalog?provider=centralone')).status,401);
  const r=await fetch(BASE+'/api/orders',{method:'POST'});assert.equal(r.status,401);
 }finally{child.kill()}
});