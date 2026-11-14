'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const {spawn}=require('node:child_process');const path=require('node:path');
const port=39829,base='http://127.0.0.1:'+port;
async function ready(){for(let i=0;i<40;i++){try{if((await fetch(base+'/api/health')).ok)return}catch{}await new Promise(r=>setTimeout(r,80))}throw Error('not ready')}
test('V10: new admin routes require authentication; purchases remain disabled without private configuration',async()=>{
 const child=spawn(process.execPath,['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:String(port),ADMIN_PASSWORD:'TEST_PASS_V10',SESSION_SECRET:'test_secret_never_use_production_34abc123456',SUPABASE_URL:'http://127.0.0.1:9',SUPABASE_PUBLISHABLE_KEY:'test-public',SUPABASE_SECRET_KEY:'',CENTRALONE_API_KEY:'',CENTRALONE_ORDER_ENABLED:'false'},stdio:'ignore'});
 try{await ready();for(const ep of ['/api/admin/customers','/api/admin/offers','/api/admin/fulfillments','/api/admin/overview']){
  const r=await fetch(base+ep);assert.equal(r.status,403,ep)}
  const r=await fetch(base+'/api/admin/fulfill-order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:'RS-26-AAAAAAAAAA',paymentVerified:true})});assert.equal(r.status,403);
  const logged=await fetch(base+'/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:'TEST_PASS_V10'})});assert.equal(logged.status,200);
  const cookie=logged.headers.get('set-cookie').split(';')[0];const order=await fetch(base+'/api/admin/fulfill-order',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({code:'RS-26-AAAAAAAAAA',paymentVerified:true})});assert.equal(order.status,503);
 }finally{child.kill()}
});