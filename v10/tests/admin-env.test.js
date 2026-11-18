'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const path=require('node:path');
const PORT=39879,BASE=`http://127.0.0.1:${PORT}`;
async function ready(){for(let i=0;i<50;i++){try{const r=await fetch(BASE+'/api/health');if(r.ok)return await r.json()}catch{}await new Promise(r=>setTimeout(r,100))}throw Error('server did not start')}
test('server accepts the configured ADM password without shipping a private .env',async()=>{
 const child=spawn(process.execPath,['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:String(PORT),ADMIN_PASSWORD:'ADMDRAKO2',SESSION_SECRET:'test-only-session-secret-long-enough',SUPABASE_SECRET_KEY:''},stdio:'ignore'});
 try{
  const health=await ready();assert.equal(health.adminConfigured,true);
  const login=await fetch(BASE+'/api/admin/login',{method:'POST',headers:{'content-type':'application/json','origin':BASE},body:JSON.stringify({password:'ADMDRAKO2'})});
  assert.equal(login.status,200);const cookie=login.headers.get('set-cookie');assert.match(cookie,/rs5_admin=/);
  const session=await fetch(BASE+'/api/admin/session',{headers:{cookie:cookie.split(';')[0]}});assert.equal(session.status,200);assert.deepEqual(await session.json(),{admin:true});
  const bad=await fetch(BASE+'/api/admin/login',{method:'POST',headers:{'content-type':'application/json','origin':BASE},body:JSON.stringify({password:'NO-ES-ESA'})});assert.equal(bad.status,401);
 }finally{child.kill()}
});