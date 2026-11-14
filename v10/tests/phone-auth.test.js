'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createServer}=require('node:http');
const {spawn}=require('node:child_process');
const path=require('node:path');
const {normalizeCubaMobile,normalizeInternationalPhone,normalizeProfilePhone,loginEmailForPhone,validPhonePassword}=require('../phone-auth');
test('Cuban mobile normalization and technical sign-in identity',()=>{
 assert.equal(normalizeCubaMobile('51234567'),'51234567');
 assert.equal(normalizeCubaMobile('+53 5123 4567'),'51234567');
 assert.equal(normalizeCubaMobile('5351234567'),'51234567');
 assert.equal(normalizeCubaMobile('61234567'),null);
 assert.equal(normalizeCubaMobile('1234567'),null);
 assert.equal(loginEmailForPhone('51234567'),'cu5351234567@refillshop.pages.dev');
 assert.equal(normalizeInternationalPhone('+53 5123 4567'),'+5351234567');
 assert.equal(normalizeInternationalPhone('+1 (305) 555-0199'),'+13055550199');
 assert.equal(normalizeInternationalPhone('+34 612 345 678'),'+34612345678');
 assert.equal(normalizeInternationalPhone('3055550199'),null);
 assert.equal(normalizeInternationalPhone('+99988888888'),null);
 assert.equal(normalizeProfilePhone('51234567'),'+5351234567');
 assert.equal(loginEmailForPhone('+53 51234567'),'cu5351234567@refillshop.pages.dev');
 assert.equal(loginEmailForPhone('+1 3055550199'),'tel13055550199@refillshop.pages.dev');
 assert.ok(validPhonePassword('Abcd123456'));
 assert.equal(validPhonePassword('1234567890'),false);
 assert.equal(validPhonePassword('abcd123'),false);
});
function listen(server){return new Promise(resolve=>server.listen(0,'127.0.0.1',()=>resolve(server.address().port)))}
function close(server){return new Promise(resolve=>server.close(resolve))}
async function readiness(base){for(let i=0;i<50;i++){try{const r=await fetch(base+'/api/health');if(r.ok)return}catch{}await new Promise(ok=>setTimeout(ok,80))}throw Error('app did not start')}
test('server creates a password account, stores phone in private profile, rejects duplicate and invalid signup',async()=>{
 let created=0,profiles=0,createdBody;
 const mock=createServer(async(req,res)=>{
  let body='';for await(const b of req)body+=b.toString();
  if(req.url==='/auth/v1/admin/users'&&req.method==='POST'){
   created++;createdBody=JSON.parse(body);
   res.writeHead(201,{'content-type':'application/json'});res.end(JSON.stringify({id:'12345678-1234-1234-1234-123456789012'}));return;
  }
  if(req.url.startsWith('/rest/v1/rs5_profiles')&&req.method==='POST'){
   profiles++;res.writeHead(201,{'content-type':'application/json'});res.end('[]');return;
  }
  res.writeHead(404,{'content-type':'application/json'});res.end('{}');
 });
 const mockPort=await listen(mock);
 const appPort=39000+Math.floor(Math.random()*1000);
 const proc=spawn(process.execPath,['server.js'],{cwd:path.join(__dirname,'..'),env:{...process.env,PORT:String(appPort),SUPABASE_URL:`http://127.0.0.1:${mockPort}`,SUPABASE_SECRET_KEY:'fake-server-secret',SUPABASE_PUBLISHABLE_KEY:'fake-public',ADMIN_PASSWORD:'temporary-test-admin-only',SESSION_SECRET:'this-secret-is-only-for-unit-tests-and-should-not-be-used-in-real-world',RA_API_KEY:''},stdio:'ignore'});
 try{
  const url=`http://127.0.0.1:${appPort}`;await readiness(url);
  const req=body=>fetch(url+'/api/auth/phone-register',{method:'POST',headers:{'content-type':'application/json',origin:url},body:JSON.stringify(body)});
  let response=await req({fullName:'A',phone:'+5351234567',password:'Abcd123456'});assert.equal(response.status,400);
  response=await req({fullName:'Cliente Prueba',phone:'+5361234567',password:'Abcd123456'});assert.equal(response.status,400);
  response=await req({fullName:'Cliente Prueba',phone:'+5351234567',password:'abc'});assert.equal(response.status,400);
  assert.equal(created,0);
  response=await req({fullName:'Cliente Prueba',phone:'+5351234567',password:'Abcd123456'});assert.equal(response.status,201,await response.text());
  assert.equal(created,1);assert.equal(profiles,1);
  assert.equal(createdBody.email,'cu5351234567@refillshop.pages.dev');
  assert.equal(createdBody.user_metadata.phone_verification,'unverified');
  assert.equal(createdBody.email_confirm,true);
  const page=await fetch(url+'/app.js');const script=await page.text();
  assert.ok(script.includes('phoneAuthForm'));assert.ok(script.includes('No necesitas un correo electrónico'));assert.ok(script.includes('countryCodeManual'));
  assert.ok(!script.includes('fake-server-secret'));
  response=await req({fullName:'Cliente Prueba',phone:'+5351234567',password:'Abcd123456'});
  assert.equal(response.status,201);
  response=await req({fullName:'Cliente Prueba',phone:'+5351234567',password:'Abcd123456'});
  // Same IP has a 5-attempt/hour cap (valid + invalid attempts share it).
  assert.equal(response.status,429);
 }finally{proc.kill();await close(mock)}
});