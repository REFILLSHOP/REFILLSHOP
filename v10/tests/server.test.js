'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const path=require('node:path');
const PORT=39741,URL=`http://127.0.0.1:${PORT}`;
async function waitUntilReady(){for(let i=0;i<35;i++){try{const r=await fetch(URL+'/api/health');if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,80))}throw Error('Server did not start')}
test('admin is URL-only and access is validated server-side, not client-side',async()=>{
 const child=spawn(process.execPath,['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:String(PORT),ADMIN_PASSWORD:'TEST_PASSWORD_ONLY',SESSION_SECRET:'a-test-only-signing-secret-of-more-than-32-chars',RA_API_KEY:'',SUPABASE_URL:'http://127.0.0.1:9',SUPABASE_SECRET_KEY:'',SUPABASE_PUBLISHABLE_KEY:'test-publishable-key'},stdio:'ignore'});
 try{
  await waitUntilReady();
  const site=await fetch(URL+'/'),html=await site.text();
  assert.equal(site.status,200);assert.ok(!html.includes('data-href="/admin"'));
  assert.equal((await fetch(URL+'/admin')).status,200);
  assert.equal((await fetch(URL+'/api/orders')).status,401);
  assert.equal((await fetch(URL+'/api/admin/orders')).status,403);
  const wrong=await fetch(URL+'/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:'wrong'})});assert.equal(wrong.status,401);
  const right=await fetch(URL+'/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:'TEST_PASSWORD_ONLY'})});assert.equal(right.status,200);
  const cookie=right.headers.get('set-cookie')?.split(';')[0];assert.ok(cookie?.startsWith('rs5_admin='));
  const session=await fetch(URL+'/api/admin/session',{headers:{Cookie:cookie}});assert.equal((await session.json()).admin,true);
  const store=await fetch(URL+'/api/bootstrap');assert.equal(store.status,200);const boot=await store.json();assert.equal(boot.adminConfigured,true);assert.ok(boot.storefront&&Array.isArray(boot.storefront.games));
 }finally{child.kill()}
});