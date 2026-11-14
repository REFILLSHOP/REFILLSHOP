'use strict';
/* Refills Shop V7.1: private supplier adapters and secure Supabase orders. Never expose supplier API keys. */
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
// Load the private local .env file before reading configuration. Existing host
// environment variables always take precedence over values in this file.
try {
 const rawEnv = require('node:fs').readFileSync(path.join(__dirname,'.env'),'utf8');
 for (const line of rawEnv.split(/\r?\n/)) {
  const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
  if (!m || (process.env[m[1]] !== undefined && process.env[m[1]] !== '')) continue;
  let value=m[2];
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value=value.slice(1,-1);
  process.env[m[1]]=value;
 }
} catch {}
const crypto = require('node:crypto');
const ROOT=__dirname, PORT=Number(process.env.PORT||3000);
const RA_BASE='https://panel.recargasamerica.com/api/v1';
const RA_KEY=process.env.RA_API_KEY||'';
const CO_CATALOG_KEY=process.env.CENTRALONE_CATALOG_API_KEY||process.env.CENTRALONE_API_KEY||'';
const CO_ORDER_KEY=process.env.CENTRALONE_ORDER_API_KEY||process.env.CENTRALONE_API_KEY||'';
const CO_STATUS_KEY=process.env.CENTRALONE_STATUS_API_KEY||process.env.CENTRALONE_API_KEY||'';
const {BASE:CO_BASE,parseCentralCatalog,uuid:providerUUID}=require('./centralone');
const SB_URL=process.env.SUPABASE_URL||'';
const SB_PUBLIC=process.env.SUPABASE_PUBLISHABLE_KEY||'';
const SB_SECRET=process.env.SUPABASE_SECRET_KEY||'';
const ADMIN_PASSWORD=process.env.ADMIN_PASSWORD||'';
const SESSION_SECRET=process.env.SESSION_SECRET||crypto.randomBytes(32).toString('hex');
const SESSION_SECONDS=4*60*60;
const COOKIE_SECURE=process.env.COOKIE_SECURE==='true';
const {priceOf,finite}=require('./prices');
const {normalizeInternationalPhone,normalizeProfilePhone,loginEmailForPhone,validPhonePassword}=require('./phone-auth');
const sessions=new Map();
const phoneSignupLimits=new Map();
let catalogCache=null, catalogTime=0, retryUntil=0, centralCache=null, centralTime=0, centralRetry=0, storeTime=0, storeCache=null;
const now=()=>Date.now();
const saneNumber=(v,min,max)=>Number.isFinite(Number(v))&&Number(v)>=min&&Number(v)<=max?Number(v):null;
function send(res,status,value,extra={}){const body=Buffer.from(JSON.stringify(value));res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','content-length':body.length,'x-content-type-options':'nosniff',...extra});res.end(body)}
function equal(a,b){const x=crypto.createHash('sha256').update(String(a)).digest();const y=crypto.createHash('sha256').update(String(b)).digest();return crypto.timingSafeEqual(x,y)}
function mac(v){return crypto.createHmac('sha256',SESSION_SECRET).update(v).digest('base64url')}
function cookie(){const t=Buffer.from('admin:'+String(Math.floor(now()/1000)+SESSION_SECONDS)).toString('base64url');return `rs5_admin=${t}.${mac(t)}; Path=/api/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${COOKIE_SECURE?'; Secure':''}`}
function authAdmin(req){const c=(req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('rs5_admin='));if(!c)return false;const pieces=c.slice(10).split('.');if(pieces.length!==2||!equal(pieces[1],mac(pieces[0])))return false;try{const [role,expiry]=Buffer.from(pieces[0],'base64url').toString().split(':');return role==='admin'&&Number(expiry)>now()/1000&&Boolean(ADMIN_PASSWORD)}catch{return false}}
async function bodyJSON(req,limit=16384){let raw='',size=0;for await(const chunk of req){size+=chunk.length;if(size>limit)throw Error('BODY_TOO_LARGE');raw+=chunk.toString('utf8')}return JSON.parse(raw||'{}')}
function sameOrigin(req){const origin=req.headers.origin;if(!origin)return true;try{return new URL(origin).host===req.headers.host}catch{return false}}
async function timedFetch(url,options){return fetch(url,{...options,signal:AbortSignal.timeout(10000)})}
async function sb(table,options={}){
 if(!SB_SECRET||!SB_URL)throw Error('SUPABASE_SECRET_NOT_CONFIGURED');
 const query=options.query||'select=*';const endpoint=SB_URL+'/rest/v1/'+encodeURIComponent(table)+'?'+query;
 const headers={'apikey':SB_SECRET,'Content-Type':'application/json','Accept':'application/json','Prefer':options.prefer||'return=representation'};if(SB_SECRET.startsWith('eyJ'))headers.Authorization='Bearer '+SB_SECRET;
 const r=await timedFetch(endpoint,{method:options.method||'GET',headers,body:options.body===undefined?undefined:JSON.stringify(options.body)});
 const text=await r.text();let data;try{data=JSON.parse(text||'null')}catch{data=text.slice(0,1000)};
 if(!r.ok)throw Error('DB_'+r.status+':'+(data?.code||data?.message||'unknown'));
 return data;
}
// Signup is intentionally password-only; phone ownership is NOT verified.
// Automated recovery and wallet approvals must never trust this phone number.
function allowPhoneSignup(req){
 const key=req.socket.remoteAddress||'unknown';
 const t=now(),windowMs=60*60_000;
 // The count is incremented even on failed submissions to deter enumeration.
 for(const [ip,state] of phoneSignupLimits){if(state.until<t)phoneSignupLimits.delete(ip)}
 const state=phoneSignupLimits.get(key)||{count:0,until:t+windowMs};
 if(state.until<t){state.count=0;state.until=t+windowMs}
 state.count++;phoneSignupLimits.set(key,state);
 return state.count<=5;
}
async function createPhonePasswordUser(phone,password,name){
 if(!SB_URL||!SB_SECRET)throw Error('SUPABASE_SECRET_NOT_CONFIGURED');
 const email=loginEmailForPhone(phone),headers={'apikey':SB_SECRET,'Content-Type':'application/json','Accept':'application/json'};
 if(SB_SECRET.startsWith('eyJ'))headers.Authorization='Bearer '+SB_SECRET;
 const result=await timedFetch(SB_URL+'/auth/v1/admin/users',{method:'POST',headers,body:JSON.stringify({email,password,email_confirm:true,user_metadata:{signup_source:'phone_password',phone_verification:'unverified'}})});
 const created=await result.json().catch(()=>({}));
 if(!result.ok){if(result.status===422||result.status===409)throw Error('PHONE_ALREADY_REGISTERED');throw Error('AUTH_CREATE_'+result.status)}
 const id=created?.user?.id||created?.id;
 if(!/^[a-f0-9-]{36}$/i.test(String(id)))throw Error('AUTH_INVALID_USER');
 try{
  await sb('rs5_profiles',{method:'POST',query:'on_conflict=user_id',prefer:'resolution=merge-duplicates,return=representation',body:{user_id:id,full_name:name,phone,updated_at:new Date().toISOString()}});
 }catch(e){
  // Do not leave an orphaned login if its profile could not be created.
  try{await timedFetch(SB_URL+'/auth/v1/admin/users/'+encodeURIComponent(id),{method:'DELETE',headers})}catch{}
  if(String(e.message).includes('23505'))throw Error('PHONE_ALREADY_REGISTERED');
  throw Error('PROFILE_CREATE_FAILED');
 }
 return id;
}
async function authUser(req){const h=req.headers.authorization||'';if(!SB_URL||!SB_PUBLIC||!/^Bearer [\w.\-]+$/.test(h))return null;try{const r=await timedFetch(SB_URL+'/auth/v1/user',{headers:{'apikey':SB_PUBLIC,'Authorization':h}});if(!r.ok)return null;const data=await r.json();return data?.id?data:null}catch{return null}}
function cleanProducts(data){if(!Array.isArray(data))throw Error('INVALID_CATALOG');return data.filter(x=>Number.isInteger(Number(x.id))&&Number(x.price)>0).slice(0,3500).map(x=>({id:Number(x.id),sku:String(x.sku||'').slice(0,80),name:String(x.name||'Producto').slice(0,150),price:Number(x.price),type:String(x.type||'recharge'),required_fields:Array.isArray(x.required_fields)?x.required_fields.filter(v=>typeof v==='string'):[],field_options:x.field_options||{},categories:Array.isArray(x.categories)?x.categories:[]}))}
async function catalog(){if(!RA_KEY)throw Error('RA_API_KEY_NOT_CONFIGURED');if(retryUntil>now())throw Error('RA_RATE_LIMITED');if(catalogCache&&catalogTime>now())return catalogCache;
 const r=await timedFetch(RA_BASE+'/products/catalog',{headers:{'Authorization':'Bearer '+RA_KEY,'Accept':'application/json'}});
 if(r.status===429){retryUntil=now()+Math.min(600,Math.max(15,Number(r.headers.get('retry-after'))||60))*1000;throw Error('RA_RATE_LIMITED')}
 if(!r.ok)throw Error('RA_HTTP_'+r.status);
 const data=await r.json();if(data.success===false)throw Error('RA_'+(data.code||'ERROR'));
 catalogCache=cleanProducts(data.data??data);catalogTime=now()+3*60*1000;return catalogCache;
}
async function centralCatalog(){
 if(!CO_CATALOG_KEY)throw Error('CO_CATALOG_KEY_NOT_CONFIGURED');
 if(centralRetry>now())throw Error('CO_RATE_LIMITED');
 if(centralCache&&centralTime>now())return centralCache;
 const r=await timedFetch(CO_BASE+'/catalog',{headers:{'Authorization':'Bearer '+CO_CATALOG_KEY,'Accept':'application/json'}});
 if(r.status===429){centralRetry=now()+Math.min(600,Math.max(15,Number(r.headers.get('retry-after'))||60))*1000;throw Error('CO_RATE_LIMITED')}
 if(!r.ok)throw Error('CO_HTTP_'+r.status);
 const raw=await r.json();centralCache=parseCentralCatalog(raw);
 // Supplier recommends 15-minute cache. No provider request per visitor.
 centralTime=now()+15*60_000;return centralCache;
}
async function audit(operation,targetType,targetId,details={}){
 try {await sb('rs5_admin_audit',{method:'POST',prefer:'return=minimal',body:{operation,target_type:targetType,target_id:String(targetId||''),details}})}
 catch(err){console.error('audit failed',String(err.message).slice(0,80));}
}
async function authAdminUsers(page=1,perPage=100){
 if(!SB_SECRET||!SB_URL)throw Error('SUPABASE_SECRET_NOT_CONFIGURED');
 const query=new URLSearchParams({page:String(page),per_page:String(perPage)});
 const headers={'apikey':SB_SECRET,'accept':'application/json'};
 if(SB_SECRET.startsWith('eyJ'))headers.Authorization='Bearer '+SB_SECRET;
 const r=await timedFetch(SB_URL+'/auth/v1/admin/users?'+query,{headers});
 if(!r.ok)throw Error('AUTH_ADMIN_'+r.status);
 const data=await r.json();return Array.isArray(data.users)?data.users:[];
}
async function updateCentralOrder(f){
 // Read-only reconciliation: never issues another purchase or repeats POST /orders.
 const r=await timedFetch(CO_BASE+'/orders/'+encodeURIComponent(f.provider_order_id),{headers:{'Authorization':'Bearer '+CO_STATUS_KEY,'Accept':'application/json'}});
 if(!r.ok)throw Error('CO_ORDER_'+r.status);
 const data=await r.json();return data.order||data;
}
async function providerCatalog(provider){
 if(provider==='centralone')return centralCatalog();
 if(provider==='recargasamerica')return catalog();
 throw Error('INVALID_PROVIDER');
}
async function storefront(){if(storeCache&&storeTime>now())return storeCache;
 // Public Edge Function is active on the new Supabase project. It allows live
 // read-only catalog without distributing the server-side secret key.
 if(!SB_SECRET){
  if(!SB_URL||!SB_PUBLIC)throw Error('SUPABASE_PUBLIC_NOT_CONFIGURED');
  const r=await timedFetch(SB_URL+'/functions/v1/rs7-storefront',{headers:{'apikey':SB_PUBLIC,'accept':'application/json'}});
  if(!r.ok)throw Error('STORE_CATALOG_'+r.status);
  const data=await r.json();if(data?.live!==true||!Array.isArray(data.games)||!Array.isArray(data.offers))throw Error('STORE_BAD_RESPONSE');
  storeCache=data;storeTime=now()+20_000;return data;
 }

 const [games,offers,config]=await Promise.all([
  sb('rs5_games',{query:'select=id,name,category,image_url,featured,sort_order&active=eq.true&order=sort_order.asc'}),
  sb('rs5_offers',{query:'select=id,game_id,provider_product_id,name,provider_price_usdt,gain_sm,provider_name,provider_in_stock,provider_target_schema&active=eq.true'}),
  sb('rs5_settings',{query:'select=buy_sm_per_usdt,cup_per_sm,card_fee_pct,mobile_phone,wallet_phone,card_number,confirm_phone,reseller_plan_price_usdt,reseller_plan_days&id=eq.1'})
 ]);
 const cfg=config[0];if(!cfg)throw Error('CONFIG_MISSING');
 const conversion=Number(cfg.buy_sm_per_usdt),cup=Number(cfg.cup_per_sm);
 const publicOffers=offers.map(o=>({id:o.id,gameId:o.game_id,name:o.name,inStock:o.provider_in_stock!==false,targetSchema:o.provider_target_schema||[],...priceOf(o,cfg)}));
 const payload={live:true,games:games.map(g=>({id:g.id,name:g.name,tag:g.category,imageUrl:g.image_url||null,featured:g.featured,sortOrder:g.sort_order})),offers:publicOffers,config:{buySmPerUsdt:conversion,cupPerSm:cup,cardFee:Number(cfg.card_fee_pct),mobilePhone:cfg.mobile_phone,walletPhone:cfg.wallet_phone||'',cardNumber:cfg.card_number,confirmPhone:cfg.confirm_phone,planPrice:cfg.reseller_plan_price_usdt===null?null:Number(cfg.reseller_plan_price_usdt),planDays:Number(cfg.reseller_plan_days)}};
 storeCache=payload;storeTime=now()+35_000;return payload;
}
function invalidate(){storeTime=0;storeCache=null}
async function staticFile(res,file,type){try{const data=await fs.readFile(path.join(ROOT,file));res.writeHead(200,{'content-type':type,'content-length':data.length,'cache-control':'no-cache','x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','content-security-policy':`default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self' ${SB_URL}; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'`});res.end(data)}catch{send(res,404,{error:'No encontrado'})}}

async function privateStorageObject(key,method='GET',bytes=null,mime='application/octet-stream'){
 if(!SB_SECRET||!SB_URL)throw Error('STORAGE_NOT_CONFIGURED');
 const url=SB_URL+'/storage/v1/object/rs5-receipts/'+key.split('/').map(encodeURIComponent).join('/');
 const headers={'apikey':SB_SECRET};if(SB_SECRET.startsWith('eyJ'))headers.Authorization='Bearer '+SB_SECRET;
 if(method==='POST'){headers['Content-Type']=mime;headers['x-upsert']='false'}
 const r=await timedFetch(url,{method,headers,body:bytes||undefined});
 if(!r.ok)throw Error('STORAGE_HTTP_'+r.status);
 return r;
}
function parseReceipt(data){
 const m=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(String(data||''));
 if(!m)throw Error('INVALID_RECEIPT');
 const b=Buffer.from(m[2],'base64'),fmt=m[1];
 if(b.length<200||b.length>3*1024*1024)throw Error('INVALID_RECEIPT_SIZE');
 const valid=fmt==='png'?b.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')):
 fmt==='jpeg'?b[0]===0xff&&b[1]===0xd8&&b[2]===0xff:
 b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP';
 if(!valid)throw Error('INVALID_RECEIPT_FORMAT');
 return {buffer:b,mime:'image/'+fmt,ext:fmt==='jpeg'?'jpg':fmt};
}
function code(){return 'RS-'+new Date().getUTCFullYear().toString().slice(-2)+'-'+crypto.randomBytes(5).toString('hex').toUpperCase()}
function cleanOrder(o){return {id:o.id,code:o.code,game:o.game_name,offer:o.offer_name,playerId:o.player_id,zoneId:o.zone_id||'',targetPayload:o.target_payload||{},method:o.method,sourcePhone:o.source_phone||'',amount:Number(o.amount),currency:o.currency,status:o.status,note:o.admin_note||'',created:o.created_at,receiptAvailable:!!o.receipt_path}}
function validPhone(v){return !!normalizeProfilePhone(v)}
function validUUID(v){return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v||''))}
async function accountData(uid){
 const [profiles,membership,wallet]=await Promise.all([
 sb('rs5_profiles',{query:'select=full_name,phone&user_id=eq.'+encodeURIComponent(uid)+'&limit=1'}),
 sb('rs5_reseller_memberships',{query:'select=expires_at&user_id=eq.'+encodeURIComponent(uid)+'&limit=1'}),
 sb('rs5_wallets',{query:'select=balance_usdt&user_id=eq.'+encodeURIComponent(uid)+'&limit=1'})]);
 const active=!!membership[0]&&Date.parse(membership[0].expires_at)>Date.now();
 return {profile:profiles[0]?{fullName:profiles[0].full_name,phone:profiles[0].phone}:null,resellerActive:active,expiresAt:active?membership[0].expires_at:null,walletUsdt:active&&wallet[0]?Number(wallet[0].balance_usdt):null};
}

const server=http.createServer(async(req,res)=>{
 const u=new URL(req.url,'http://localhost');const p=u.pathname;
 try{
 if(p.startsWith('/api/')&&['POST','PUT','PATCH','DELETE'].includes(req.method)&&!sameOrigin(req))return send(res,403,{error:'Origen no permitido'});
 if(p==='/api/health'&&req.method==='GET')return send(res,200,{ok:true,raConfigured:!!RA_KEY,databaseConfigured:!!SB_SECRET&&!!SB_URL,adminConfigured:!!ADMIN_PASSWORD});
 if(p==='/api/client-config'&&req.method==='GET')return send(res,200,{supabaseUrl:SB_URL,publishableKey:SB_PUBLIC,googleLoginEnabled:process.env.ENABLE_GOOGLE_LOGIN==='true'&&!!SB_URL&&!!SB_PUBLIC});
 if(p==='/api/bootstrap'&&req.method==='GET'){
 if(!SB_URL||!SB_PUBLIC)return send(res,503,{error:'Configura SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY en el servidor'});
 let publicStore,storefrontError=null;
 try{publicStore=await storefront()}catch(e){storefrontError='No se pudo sincronizar el catálogo. El acceso al ADM sigue disponible; revisa la conexión de Supabase.';publicStore={live:false,games:[],offers:[],config:{buySmPerUsdt:350,cupPerSm:3,cardFee:5,mobilePhone:'50237996',walletPhone:'',cardNumber:'9204-1299-7870-3553',confirmPhone:'50237996',planPrice:null,planDays:30}}}
 return send(res,200,{storefront:publicStore,storefrontError,adminConfigured:!!ADMIN_PASSWORD,databaseConfigured:!!SB_SECRET,googleLoginEnabled:process.env.ENABLE_GOOGLE_LOGIN==='true'&&!!SB_PUBLIC,supabaseUrl:SB_URL,publishableKey:SB_PUBLIC});
 }
 if(p==='/api/auth/phone-register'&&req.method==='POST'){
  if(!allowPhoneSignup(req))return send(res,429,{error:'Demasiados intentos de registro. Espera una hora.'});
  if(!SB_SECRET||!SB_URL||!SB_PUBLIC)return send(res,503,{error:'El registro de usuarios aún no está disponible.'});
  const b=await bodyJSON(req,2500),phone=normalizeInternationalPhone(b.phone),name=String(b.fullName||'').trim().replace(/\s+/g,' '),password=b.password;
  if(b.website)return send(res,200,{ok:true}); // honeypot for basic automated submissions
  if(!phone||name.length<2||name.length>90||!validPhonePassword(password))return send(res,400,{error:'Introduce tu nombre, tu número con prefijo internacional (+código de país) y una contraseña de 10 a 72 caracteres con letras y números.'});
  try{await createPhonePasswordUser(phone,password,name);return send(res,201,{ok:true,phone,phoneVerified:false,message:'Cuenta creada. Tu número todavía no está verificado.'});}
  catch(e){if(e.message==='PHONE_ALREADY_REGISTERED')return send(res,409,{error:'Este número ya tiene una cuenta. Inicia sesión.'});
   console.error('Phone signup failed:',String(e.message).slice(0,90));return send(res,503,{error:'No se pudo crear la cuenta. Reintenta más tarde.'});}
 }
 if(p==='/api/profile'&&req.method==='GET'){
 const user=await authUser(req);if(!user)return send(res,401,{error:'Inicia sesión'});
 return send(res,200,await accountData(user.id));
 }
 if(p==='/api/profile'&&req.method==='PUT'){
 const user=await authUser(req);if(!user)return send(res,401,{error:'Inicia sesión'});
 const b=await bodyJSON(req),fullName=String(b.fullName||'').trim().replace(/\s+/g,' '),phone=normalizeProfilePhone(b.phone);
 if(fullName.length<2||fullName.length>90||!validPhone(phone))return send(res,400,{error:'Introduce nombre y teléfono con prefijo internacional'});
 if(user.user_metadata?.signup_source==='phone_password'&&loginEmailForPhone(phone)!==user.email)return send(res,409,{error:'El número de acceso no se puede cambiar desde el perfil. Contacta con soporte.'});
 await sb('rs5_profiles',{query:'on_conflict=user_id',method:'POST',prefer:'resolution=merge-duplicates,return=representation',body:{user_id:user.id,full_name:fullName,phone,updated_at:new Date().toISOString()}});
 return send(res,200,{ok:true,profile:{fullName,phone}});
 }
 if(p==='/api/orders'&&req.method==='GET'){
 const user=await authUser(req);if(!user)return send(res,401,{error:'Inicia sesión'});
 const rows=await sb('rs5_orders',{query:'select=*&user_id=eq.'+encodeURIComponent(user.id)+'&status=neq.uploading&order=created_at.desc&limit=150'});
 return send(res,200,{orders:rows.map(cleanOrder)});
 }
 if(p==='/api/orders'&&req.method==='POST'){
 const user=await authUser(req);if(!user)return send(res,401,{error:'Inicia sesión antes de hacer un pedido'});
 const prof=await sb('rs5_profiles',{query:'select=user_id&user_id=eq.'+encodeURIComponent(user.id)+'&limit=1'});
 if(!prof[0])return send(res,409,{error:'Completa tu nombre y teléfono antes de comprar'});
 const b=await bodyJSON(req,4500000),offerId=String(b.offerId||''),gid=String(b.gameId||''),method=String(b.method||''),playerId=String(b.playerId||'').trim(),zone=String(b.zoneId||'').trim(),origin=String(b.sourcePhone||'').trim(),requestId=String(b.clientRequestId||'');
 if(!validUUID(offerId)||!validUUID(requestId)||!gid||!['mobile','wallet','card'].includes(method)||playerId.length<3||playerId.length>80||zone.length>30||(method==='mobile'&&!validPhone(origin)))return send(res,400,{error:'Revisa los datos del pedido'});
 const existing=await sb('rs5_orders',{query:'select=*&user_id=eq.'+encodeURIComponent(user.id)+'&client_request_id=eq.'+requestId+'&limit=1'});
 if(existing[0])return existing[0].status==='uploading'?send(res,409,{error:'La subida del pedido sigue pendiente; contacta soporte si persiste'}):send(res,200,{ok:true,order:cleanOrder(existing[0]),duplicate:true});
 const prod=(await sb('rs5_offers',{query:'select=*&id=eq.'+offerId+'&game_id=eq.'+encodeURIComponent(gid)+'&active=eq.true&limit=1'}))[0];
 if(!prod||prod.provider_in_stock===false)return send(res,404,{error:'Oferta ya no disponible o agotada'});
 const schema=Array.isArray(prod.provider_target_schema)?prod.provider_target_schema:[];
 const rawTarget=b.targetPayload&&typeof b.targetPayload==='object'&&!Array.isArray(b.targetPayload)?b.targetPayload:{};
 const validatedTarget={};
 for(const field of schema){if(!field||!/^[a-z0-9_]{1,50}$/i.test(String(field.key||'')))continue;
  const val=String(rawTarget[field.key]||'').trim();
  if(!val||val.length>64)return send(res,400,{error:'Falta el dato requerido: '+String(field.label||field.key).slice(0,80)});
  if(field.type==='select'&&!Array.isArray(field.options))return send(res,409,{error:'La opción de servidor ya no está disponible'});
  if(field.type==='select'&&!field.options.some(x=>x.value===val))return send(res,400,{error:'Elige un valor permitido para '+String(field.label||field.key).slice(0,80)});
  validatedTarget[field.key]=val;
 }
 const gm=(await sb('rs5_games',{query:'select=name&active=eq.true&id=eq.'+encodeURIComponent(gid)+'&limit=1'}))[0];
 if(!gm)return send(res,404,{error:'Juego ya no disponible'});
 const cfg=(await sb('rs5_settings',{query:'select=*&id=eq.1'}))[0];
 const sums=priceOf(prod,cfg),total=method==='mobile'?sums.sm:method==='card'?sums.card:sums.cup,currency=method==='mobile'?'SM':'CUP';
 if(method==='wallet'&&!cfg.wallet_phone)return send(res,409,{error:'Monedero temporalmente no disponible'});
 const receipt=parseReceipt(b.receipt);
 const record={code:code(),user_id:user.id,client_request_id:requestId,game_id:gid,offer_id:offerId,game_name:gm.name,offer_name:prod.name,player_id:playerId,zone_id:zone||null,target_payload:validatedTarget,method,source_phone:method==='mobile'?origin:null,amount:total,currency,status:'uploading'};
 const created=(await sb('rs5_orders',{method:'POST',body:record}))[0];
 const key=user.id+'/'+created.id+'.'+receipt.ext;
 try{
  await privateStorageObject(key,'POST',receipt.buffer,receipt.mime);
  const updated=(await sb('rs5_orders',{method:'PATCH',query:'id=eq.'+created.id+'&status=eq.uploading',body:{status:'pending',receipt_path:key,updated_at:new Date().toISOString()}}))[0];
  if(!updated)throw Error('ORDER_UPLOAD_STATUS');
  return send(res,201,{ok:true,order:cleanOrder(updated)});
 }catch(err){console.error('receipt storage:',String(err.message).slice(0,80));return send(res,502,{error:'No se pudo guardar el comprobante. El pedido no se ha enviado; contacta soporte con tu sesión antes de repetir el pago.'})}
 }

 if(p==='/api/admin/overview'&&req.method==='GET'){
  if(!authAdmin(req))return send(res,403,{error:'No autorizado'});
  const [games,offers,orders,profiles]=await Promise.all([
   sb('rs5_games',{query:'select=id&active=eq.true'}),sb('rs5_offers',{query:'select=id&active=eq.true'}),
   sb('rs5_orders',{query:'select=id,status&limit=1000'}),sb('rs5_profiles',{query:'select=user_id&limit=1000'})]);
  return send(res,200,{counts:{games:games.length,offers:offers.length,orders:orders.length,pending:orders.filter(o=>o.status==='pending').length,profiles:profiles.length},integration:{supabase:!!SB_SECRET,centralCatalog:!!CO_CATALOG_KEY,centralPurchases:process.env.CENTRALONE_ORDER_ENABLED==='true'&&!!CO_CATALOG_KEY&&!!CO_ORDER_KEY&&!!CO_STATUS_KEY,googleConfigured:process.env.ENABLE_GOOGLE_LOGIN==='true'}});
 }
 if(p==='/api/admin/customers'&&req.method==='GET'){
  if(!authAdmin(req))return send(res,403,{error:'Acceso no autorizado'});
  const [profiles,wallets,memberships,orders,users]=await Promise.all([
   sb('rs5_profiles',{query:'select=user_id,full_name,phone,created_at,updated_at&order=created_at.desc&limit=1000'}),
   sb('rs5_wallets',{query:'select=user_id,balance_usdt&limit=1000'}),
   sb('rs5_reseller_memberships',{query:'select=user_id,expires_at&limit=1000'}),
   sb('rs5_orders',{query:'select=user_id,id&status=neq.uploading&limit=1000'}),
   authAdminUsers(1,100).catch(()=>[])
  ]);
  const wm=new Map(wallets.map(w=>[w.user_id,w]));const mm=new Map(memberships.map(m=>[m.user_id,m]));const counts=new Map();for(const o of orders)counts.set(o.user_id,(counts.get(o.user_id)||0)+1);
  const pm=new Map(profiles.map(x=>[x.user_id,x]));const um=new Map(users.map(x=>[x.id,x]));
  const ids=[...new Set([...pm.keys(),...um.keys()])];
  const clients=ids.slice(0,1000).map(id=>({id,name:pm.get(id)?.full_name||'',phone:pm.get(id)?.phone||'',email:um.get(id)?.user_metadata?.signup_source==='phone_password'?null:(um.get(id)?.email||null),createdAt:um.get(id)?.created_at||pm.get(id)?.created_at||null,provider:um.get(id)?.app_metadata?.provider||null,balanceUsdt:Number(wm.get(id)?.balance_usdt||0),resellerUntil:mm.get(id)?.expires_at||null,orders:counts.get(id)||0}));
  return send(res,200,{clients,limited:ids.length>1000,authUsersLoaded:users.length>0});
 }
 if(p==='/api/admin/customer-profile'&&req.method==='POST'){
  if(!authAdmin(req))return send(res,403,{error:'Acceso no autorizado'});
  const b=await bodyJSON(req),uid=String(b.userId||''),name=String(b.fullName||'').trim().replace(/\s+/g,' '),phone=normalizeProfilePhone(b.phone);
  if(!validUUID(uid)||name.length<2||name.length>90||!validPhone(phone))return send(res,400,{error:'Revisa los datos del cliente'});
  await sb('rs5_profiles',{method:'POST',query:'on_conflict=user_id',prefer:'resolution=merge-duplicates,return=representation',body:{user_id:uid,full_name:name,phone,updated_at:new Date().toISOString()}});
  await audit('profile_update','customer',uid,{updatedFields:['full_name','phone']});return send(res,200,{ok:true});
 }
 if(p==='/api/admin/offers'&&req.method==='GET'){
  if(!authAdmin(req))return send(res,403,{error:'No autorizado'});
  return send(res,200,{offers:await sb('rs5_offers',{query:'select=id,game_id,provider_name,provider_product_key,name,provider_price_usdt,gain_sm,active,provider_in_stock,updated_at&order=updated_at.desc&limit=1000'})});
 }
 if(p==='/api/admin/offer-edit'&&req.method==='POST'){
  if(!authAdmin(req))return send(res,403,{error:'No autorizado'});
  const b=await bodyJSON(req),id=String(b.id||''),gain=saneNumber(b.gainSm,0,1000000);
  if(!validUUID(id)||gain===null||typeof b.active!=='boolean')return send(res,400,{error:'ID, ganancia o estado inválidos'});
  const offer=(await sb('rs5_offers',{query:'select=id,provider_in_stock& id=eq.'.replace(' ','')+id+'&limit=1'}))[0];
  if(!offer)return send(res,404,{error:'Oferta no encontrada'});
  if(b.active===true&&offer.provider_in_stock===false)return send(res,409,{error:'No puedes publicar un producto agotado'});
  await sb('rs5_offers',{method:'PATCH',query:'id=eq.'+id,body:{gain_sm:gain,active:b.active,updated_at:new Date().toISOString()},prefer:'return=minimal'});
  invalidate();await audit('offer_edit','offer',id,{gainSm:gain,active:b.active});return send(res,200,{ok:true});
 }
 if(p==='/api/admin/fulfillments'&&req.method==='GET'){
  if(!authAdmin(req))return send(res,403,{error:'No autorizado'});
  return send(res,200,{fulfillments:await sb('rs5_fulfillments',{query:'select=order_id,status,provider_order_id,provider_reference,provider_status,error_code,created_at,updated_at&order=created_at.desc&limit=200'})});
 }
 if(p==='/api/admin/fulfill-order'&&req.method==='POST'){
  if(!authAdmin(req))return send(res,403,{error:'No autorizado'});
  if(process.env.CENTRALONE_ORDER_ENABLED!=='true'||!CO_CATALOG_KEY||!CO_ORDER_KEY||!CO_STATUS_KEY||!SB_SECRET)return send(res,503,{error:'Las compras al proveedor no están activadas en el servidor'});
  const b=await bodyJSON(req),orderCode=String(b.code||'');
  if(b.paymentVerified!==true||!/^RS-[0-9]{2}-[A-F0-9]{10}$/.test(orderCode))return send(res,400,{error:'Primero verifica el comprobante de pago y confirma expresamente'});
  const order=(await sb('rs5_orders',{query:'select=*&code=eq.'+encodeURIComponent(orderCode)+'&status=eq.pending&limit=1'}))[0];
  if(!order||!order.receipt_path)return send(res,409,{error:'El pedido no está pendiente o falta su comprobante'});
  const offer=(await sb('rs5_offers',{query:'select=provider_name,provider_product_key,provider_in_stock,active,provider_target_schema& id=eq.'.replace(' ','')+order.offer_id+'&limit=1'}))[0];
  if(!offer||offer.provider_name!=='centralone'||!providerUUID.test(String(offer.provider_product_key||''))||offer.provider_in_stock===false||offer.active===false)return send(res,409,{error:'Producto no disponible para recarga automática con Central One'});
  const schema=Array.isArray(offer.provider_target_schema)?offer.provider_target_schema:[],payload=order.target_payload||{};
  const target={};for(const f of schema){const v=String(payload[f.key]||'');if(!v||v.length>64)return send(res,409,{error:'Falta el campo del producto: '+String(f.key).slice(0,50)});if(f.type==='select'&&!(f.options||[]).some(x=>x.value===v))return send(res,409,{error:'Servidor del producto no válido'});target[f.key]=v}
  // An order is not placed against a stale or higher cost. Refresh the current
  // supplier price immediately before spending money and require a fresh review.
  const currentResp=await timedFetch(CO_BASE+'/catalog',{headers:{'Authorization':'Bearer '+CO_CATALOG_KEY,'Accept':'application/json'}});
  if(!currentResp.ok)return send(res,503,{error:'No se pudo comprobar el costo actual del proveedor; no se realizó la compra'});
  const currentProduct=parseCentralCatalog(await currentResp.json()).find(x=>x.id===offer.provider_product_key);
  if(!currentProduct||!currentProduct.inStock)return send(res,409,{error:'Producto no disponible; no se realizó la compra'});
  const storedPrice=(await sb('rs5_offers',{query:'select=provider_price_usdt&id=eq.'+order.offer_id+'&limit=1'}))[0];
  if(!storedPrice||currentProduct.price!==Number(storedPrice.provider_price_usdt).toFixed(4))return send(res,409,{error:'Cambió el precio del proveedor. Sincroniza costos y revisa el importe antes de comprar.'});
  const idem='rs-'+order.id;const claim={order_id:order.id,provider:'centralone',idempotency_key:idem,product_key:offer.provider_product_key,status:'prepared',payment_confirmed_at:new Date().toISOString()};
  try{await sb('rs5_fulfillments',{method:'POST',body:claim,prefer:'return=representation'});}catch(e){if(String(e.message).includes('23505'))return send(res,409,{error:'Este pedido ya tiene un intento de compra. Usa Consultar estado; no vuelvas a enviar una compra.'});throw e}
  await audit('supplier_purchase_prepared','order',order.id,{provider:'centralone',paymentVerified:true});
  const item={catalog_item_id:offer.provider_product_key,quantity:1};if(schema.length)item.target_payload=target;
  try{
   const resp=await timedFetch(CO_BASE+'/orders',{method:'POST',headers:{'Authorization':'Bearer '+CO_ORDER_KEY,'Content-Type':'application/json','Accept':'application/json','Idempotency-Key':idem},body:JSON.stringify({items:[item],note:order.code})});
   const payload=await resp.json().catch(()=>({}));const remote=payload.order||{};
   if(!resp.ok||!providerUUID.test(String(remote.id||''))){
    await sb('rs5_fulfillments',{method:'PATCH',query:'order_id=eq.'+order.id,body:{status:'needs_review',error_code:String(payload.error?.code||'HTTP_'+resp.status).slice(0,80),updated_at:new Date().toISOString()},prefer:'return=minimal'});
    return send(res,502,{error:'Central One no confirmó una compra. Revisa la operación con el proveedor antes de reintentar.'});
   }
   await sb('rs5_fulfillments',{method:'PATCH',query:'order_id=eq.'+order.id,body:{status:'submitted',provider_order_id:remote.id,provider_reference:String(remote.reference_code||'').slice(0,100),provider_status:String(remote.status||'confirmed').slice(0,40),updated_at:new Date().toISOString()},prefer:'return=minimal'});
   await audit('supplier_purchase_submitted','order',order.id,{providerOrderId:remote.id});
   return send(res,200,{ok:true,submitted:true,providerOrderId:remote.id,providerStatus:remote.status||'confirmed'});
  }catch(e){await sb('rs5_fulfillments',{method:'PATCH',query:'order_id=eq.'+order.id,body:{status:'needs_review',error_code:'NETWORK_OR_UNKNOWN',updated_at:new Date().toISOString()},prefer:'return=minimal'}).catch(()=>{});return send(res,502,{error:'No se confirmó la respuesta del proveedor. No repitas la compra; primero concilia el pedido.'})}
 }
 if(p==='/api/admin/reconcile-order'&&req.method==='POST'){
  if(!authAdmin(req))return send(res,403,{error:'No autorizado'});
  const b=await bodyJSON(req),id=String(b.orderId||'');if(!validUUID(id))return send(res,400,{error:'ID inválido'});
  const f=(await sb('rs5_fulfillments',{query:'select=*&order_id=eq.'+id+'&limit=1'}))[0];if(!f||!f.provider_order_id)return send(res,409,{error:'El proveedor aún no devolvió un ID; consulta soporte usando la referencia antes de hacer otra compra'});
  if(!CO_STATUS_KEY)return send(res,503,{error:'La clave Central One con permiso orders:read no está configurada'});
  const remote=await updateCentralOrder(f);const status=String(remote.status||'').toLowerCase();
  const done=['completed','delivered'].includes(status),failed=['failed','cancelled','canceled'].includes(status);
  await sb('rs5_fulfillments',{method:'PATCH',query:'order_id=eq.'+id,body:{status:done?'completed':failed?'failed':'submitted',provider_status:status.slice(0,40),updated_at:new Date().toISOString()},prefer:'return=minimal'});
  if(done)await sb('rs5_orders',{method:'PATCH',query:'id=eq.'+id+'&status=eq.pending',body:{status:'completed',admin_note:'Entrega confirmada por Central One',updated_at:new Date().toISOString()},prefer:'return=minimal'});
  await audit('supplier_status_checked','order',id,{providerStatus:status});return send(res,200,{ok:true,providerStatus:status,completed:done,failed});
 }
 if(p==='/api/admin/orders'&&req.method==='GET'){
 if(!authAdmin(req))return send(res,403,{error:'Acceso no autorizado'});
 const q=String(u.searchParams.get('q')||'').trim().toUpperCase();let query='select=*&order=created_at.desc&limit=200';
 if(q){if(!/^RS-[A-Z0-9-]{1,30}$/.test(q))return send(res,400,{error:'Código inválido'});query='select=*&code=eq.'+encodeURIComponent(q)+'&limit=1'}
 const rows=await sb('rs5_orders',{query});return send(res,200,{orders:rows.filter(o=>o.status!=='uploading').map(cleanOrder)});
 }
 if(p==='/api/admin/order-status'&&req.method==='POST'){
 if(!authAdmin(req))return send(res,403,{error:'Acceso no autorizado'});
 const b=await bodyJSON(req),status=String(b.status||''),code=String(b.code||'').trim().toUpperCase();
 if(!['completed','rejected'].includes(status)||!/^RS-[0-9]{2}-[A-F0-9]{10}$/.test(code))return send(res,400,{error:'Código o estado inválido'});
 const supplierRow=await sb('rs5_orders',{query:'select=id&code=eq.'+encodeURIComponent(code)+'&limit=1'});
 if(supplierRow[0]){const existingFulfill=await sb('rs5_fulfillments',{query:'select=status&order_id=eq.'+supplierRow[0].id+'&limit=1'});if(existingFulfill[0]&&existingFulfill[0].status!=='completed')return send(res,409,{error:'La recarga del proveedor está pendiente de conciliación'});}
 const rows=await sb('rs5_orders',{query:'code=eq.'+encodeURIComponent(code)+'&status=eq.pending',method:'PATCH',body:{status,admin_note:String(b.note||'').slice(0,400),updated_at:new Date().toISOString()}});
 if(!rows[0])return send(res,409,{error:'El pedido ya no está pendiente'});
 return send(res,200,{ok:true,order:cleanOrder(rows[0])});
 }
 if(p==='/api/admin/receipt'&&req.method==='GET'){
 if(!authAdmin(req))return send(res,403,{error:'Acceso no autorizado'});
 const q=String(u.searchParams.get('code')||'').trim().toUpperCase();if(!/^RS-[0-9]{2}-[A-F0-9]{10}$/.test(q))return send(res,400,{error:'Código inválido'});
 const records=await sb('rs5_orders',{query:'select=receipt_path&code=eq.'+encodeURIComponent(q)+'&limit=1'});if(!records[0]?.receipt_path)return send(res,404,{error:'Captura no disponible'});
 const r=await privateStorageObject(records[0].receipt_path);const bytes=Buffer.from(await r.arrayBuffer());res.writeHead(200,{'content-type':r.headers.get('content-type')||'image/jpeg','cache-control':'no-store','x-content-type-options':'nosniff','content-length':bytes.length});return res.end(bytes);
 }
 if(p==='/api/admin/session'&&req.method==='GET')return send(res,200,{admin:authAdmin(req)});
 if(p==='/api/admin/logout'&&req.method==='POST')return send(res,200,{ok:true},{'set-cookie':'rs5_admin=; HttpOnly; SameSite=Strict; Path=/api/; Max-Age=0'});
 if(p==='/api/admin/login'&&req.method==='POST'){
 if(!ADMIN_PASSWORD)return send(res,503,{error:'Configura ADMIN_PASSWORD en el servidor'});
 const ip=req.socket.remoteAddress||'?';const cur=sessions.get(ip)||{tries:0,until:now()+15*60_000};if(cur.until<now()){cur.tries=0;cur.until=now()+15*60_000}
 if(cur.tries>=6)return send(res,429,{error:'Demasiados intentos de acceso'});
 const b=await bodyJSON(req);if(!equal(b.password||'',ADMIN_PASSWORD)){cur.tries++;sessions.set(ip,cur);return send(res,401,{error:'Contraseña incorrecta'})}
 sessions.delete(ip);return send(res,200,{ok:true},{'set-cookie':cookie()});
 }
 if(p==='/api/storefront'&&req.method==='GET'){if(!SB_URL||!SB_PUBLIC)return send(res,503,{error:'BASE_DATOS_NO_CONFIGURADA'});return send(res,200,await storefront())}
 if(p==='/api/catalog'&&req.method==='GET'){if(!authAdmin(req))return send(res,401,{error:'Inicia sesión en el ADM'});const provider=String(u.searchParams.get('provider')||'centralone');if(!['centralone','recargasamerica'].includes(provider))return send(res,400,{error:'Proveedor desconocido'});return send(res,200,{provider,products:await providerCatalog(provider)})}
 if(p==='/api/admin/game'&&req.method==='POST'){
 if(!authAdmin(req))return send(res,403,{error:'No autorizado'});const b=await bodyJSON(req);
 const id=String(b.id||'').toLowerCase();if(!/^[a-z0-9-]{2,60}$/.test(id))return send(res,400,{error:'Identificador del juego inválido'});
 const name=String(b.name||'').trim().slice(0,90),category=String(b.category||'Juegos').trim().slice(0,45);
 if(!name||!category)return send(res,400,{error:'Completa el nombre y categoría'});
 const image=String(b.imageUrl||'').trim();if(image&&!/^https:\/\/[^\s<>"']{1,1000}$/.test(image))return send(res,400,{error:'Usa una URL HTTPS para la imagen'});
 await sb('rs5_games',{query:'on_conflict=id',method:'POST',prefer:'resolution=merge-duplicates,return=representation',body:{id,name,category,image_url:image||null,featured:!!b.featured,sort_order:saneNumber(b.sortOrder,-100,1000)||0}});invalidate();await audit('game_upsert','game',id,{name,category,featured:!!b.featured});return send(res,200,{ok:true});
 }
 if(p==='/api/admin/offer'&&req.method==='POST'){
 if(!authAdmin(req))return send(res,403,{error:'No autorizado'});
 const b=await bodyJSON(req),provider=String(b.provider||'centralone'),productKey=String(b.productId||''),gameId=String(b.gameId||''),gain=saneNumber(b.gainSm,0,1_000_000);
 if(!['centralone','recargasamerica'].includes(provider)||!productKey||!/^[a-z0-9-]{2,60}$/.test(gameId)||gain===null)return send(res,400,{error:'Proveedor, producto, juego o ganancia incorrectos'});
 if(provider==='centralone'&&!providerUUID.test(productKey))return send(res,400,{error:'Identificador del producto Central One no válido'});
 if(provider==='recargasamerica'&&!/^[1-9][0-9]{0,15}$/.test(productKey))return send(res,400,{error:'Identificador del producto RecargasAmérica no válido'});
 const product=(await providerCatalog(provider)).find(x=>String(x.id)===productKey);
 if(!product||product.inStock===false)return send(res,404,{error:'Este producto no figura disponible o está agotado en el proveedor'});
 const games=await sb('rs5_games',{query:'select=id&id=eq.'+encodeURIComponent(gameId)+'&limit=1'});
 if(!games[0])return send(res,404,{error:'El juego seleccionado no está registrado'});
 const info={game_id:gameId,provider_product_id:provider==='recargasamerica'?Number(productKey):null,
  provider_product_key:productKey,provider_name:provider,name:product.name,provider_price_usdt:String(product.price),gain_sm:gain,
  provider_family:product.family||null,provider_region:product.region||null,
  provider_target_schema:product.targetSchema||[],provider_in_stock:product.inStock!==false,
  provider_price_updated_at:product.updatedAt||null,active:true,updated_at:new Date().toISOString()};
 const old=(await sb('rs5_offers',{query:'select=id&provider_name=eq.'+provider+'&provider_product_key=eq.'+encodeURIComponent(productKey)+'&limit=1'}))[0];
 if(old)await sb('rs5_offers',{method:'PATCH',query:'id=eq.'+old.id,body:info,prefer:'return=minimal'});
 else await sb('rs5_offers',{method:'POST',body:info,prefer:'return=minimal'});
 invalidate();await audit('offer_publish','offer',productKey,{provider,gameId});return send(res,200,{ok:true,product:product.name,provider});
 }
 if(p==='/api/admin/import-family'&&req.method==='POST'){
  if(!authAdmin(req))return send(res,403,{error:'No autorizado'});
  const b=await bodyJSON(req),provider='centralone',gameId=String(b.gameId||''),familyId=String(b.familyId||''),gain=saneNumber(b.gainSm,0,1000000);
  if(!/^[a-z0-9-]{2,60}$/.test(gameId)||!familyId||familyId.length>140||gain===null)return send(res,400,{error:'Juego, familia o ganancia inválidos'});
  const g=(await sb('rs5_games',{query:'select=id&active=eq.true&id=eq.'+encodeURIComponent(gameId)+'&limit=1'}))[0];
  if(!g)return send(res,404,{error:'El juego no existe'});
  const products=(await centralCatalog()).filter(x=>x.familyId===familyId&&x.inStock===true);
  if(!products.length)return send(res,404,{error:'La familia no tiene productos disponibles'});
  if(products.length>40)return send(res,409,{error:'Familia demasiado grande; publica sus ofertas individualmente (máximo 40 por lote)'});
  let created=0,updated=0;
  for(const product of products){
   const old=(await sb('rs5_offers',{query:'select=id&provider_name=eq.centralone&provider_product_key=eq.'+encodeURIComponent(product.id)+'&limit=1'}))[0];
   const info={game_id:gameId,provider_product_id:null,provider_product_key:product.id,provider_name:'centralone',name:product.name,provider_price_usdt:product.price,gain_sm:gain,provider_family:product.family||null,provider_region:product.region||null,provider_target_schema:product.targetSchema||[],provider_in_stock:product.inStock===true,provider_price_updated_at:product.updatedAt||null,active:true,updated_at:new Date().toISOString()};
   if(old){await sb('rs5_offers',{method:'PATCH',query:'id=eq.'+old.id,body:info,prefer:'return=minimal'});updated++}
   else{await sb('rs5_offers',{method:'POST',body:info,prefer:'return=minimal'});created++}
  }
  invalidate();await audit('family_import','game',gameId,{familyId,created,updated});return send(res,200,{ok:true,created,updated,familyId});
 }
 if(p==='/api/admin/delete-game'&&req.method==='POST'){
 if(!authAdmin(req))return send(res,403,{error:'No autorizado'});const b=await bodyJSON(req),id=String(b.id||'');if(!/^[a-z0-9-]{2,60}$/.test(id))return send(res,400,{error:'Juego inválido'});
 await sb('rs5_games',{method:'PATCH',query:'id=eq.'+encodeURIComponent(id),body:{active:false},prefer:'return=minimal'});
 await sb('rs5_offers',{method:'PATCH',query:'game_id=eq.'+encodeURIComponent(id),body:{active:false},prefer:'return=minimal'});invalidate();return send(res,200,{ok:true});
 }
 if(p==='/api/admin/delete-offer'&&req.method==='POST'){
 if(!authAdmin(req))return send(res,403,{error:'No autorizado'});const b=await bodyJSON(req),id=String(b.id||'');if(!/^[0-9a-f-]{36}$/i.test(id))return send(res,400,{error:'Oferta inválida'});
 await sb('rs5_offers',{method:'PATCH',query:'id=eq.'+encodeURIComponent(id),body:{active:false},prefer:'return=minimal'});invalidate();return send(res,200,{ok:true});
 }
 if(p==='/api/admin/settings'&&req.method==='POST'){
 if(!authAdmin(req))return send(res,403,{error:'No autorizado'});const b=await bodyJSON(req);
 const rate=saneNumber(b.buySmPerUsdt,1,100000),cup=saneNumber(b.cupPerSm,0.01,10000),fee=saneNumber(b.cardFee,0,100),price=b.planPrice===null||b.planPrice===''?null:saneNumber(b.planPrice,0.01,50000),days=saneNumber(b.planDays,1,365);
 if(rate===null||cup===null||fee===null||days===null||(price===null&&b.planPrice!==null&&b.planPrice!==''))return send(res,400,{error:'Revisa tasas y el precio del plan'});
 await sb('rs5_settings',{query:'id=eq.1',method:'PATCH',body:{buy_sm_per_usdt:rate,cup_per_sm:cup,card_fee_pct:fee,reseller_plan_price_usdt:price,reseller_plan_days:days,mobile_phone:/^[0-9]{8}$/.test(String(b.mobilePhone||''))?b.mobilePhone:'50237996',wallet_phone:/^[0-9]{8}$/.test(String(b.walletPhone||''))?b.walletPhone:null,card_number:/^[0-9-]{16,24}$/.test(String(b.cardNumber||''))?b.cardNumber:'9204-1299-7870-3553',confirm_phone:/^[0-9]{8}$/.test(String(b.confirmPhone||''))?b.confirmPhone:'50237996'},prefer:'return=representation'});invalidate();return send(res,200,{ok:true});
 }
 if(p==='/api/admin/sync'&&req.method==='POST'){
 if(!authAdmin(req))return send(res,403,{error:'No autorizado'});
 const b=await bodyJSON(req),provider=String(b.provider||'centralone');
 if(!['centralone','recargasamerica'].includes(provider))return send(res,400,{error:'Proveedor inválido'});
 const [items,offers]=await Promise.all([providerCatalog(provider),sb('rs5_offers',{query:'select=id,provider_name,provider_product_key,provider_product_id,provider_price_usdt,provider_in_stock&provider_name=eq.'+provider})]);
 const index=new Map(items.map(x=>[String(x.id),x]));let count=0,stockChanged=0;
 for(const o of offers){const item=index.get(o.provider_product_key||String(o.provider_product_id));
  if(!item)continue;
  const priceChanged=String(item.price)!==Number(o.provider_price_usdt).toFixed(4);
  const inStock=item.inStock!==false;
  if(priceChanged||inStock!==(o.provider_in_stock!==false)){
   await sb('rs5_offers',{query:'id=eq.'+o.id,method:'PATCH',prefer:'return=minimal',body:{provider_price_usdt:item.price,provider_in_stock:inStock,provider_price_updated_at:item.updatedAt||null,updated_at:new Date().toISOString()}});count++;if(inStock!==(o.provider_in_stock!==false))stockChanged++;
  }
 }
 invalidate();return send(res,200,{ok:true,provider,updated:count,stockChanged});
 }
 if(p==='/api/reseller/request'&&req.method==='POST'){
 const user=await authUser(req);if(!user)return send(res,401,{error:'Inicia sesión primero'});
 const cfg=(await sb('rs5_settings',{query:'select=reseller_plan_price_usdt,reseller_plan_days&id=eq.1'}))[0];
 if(!cfg||cfg.reseller_plan_price_usdt===null)return send(res,409,{error:'El precio del plan todavía no está configurado'});
 const existing=await sb('rs5_plan_requests',{query:'select=id&user_id=eq.'+encodeURIComponent(user.id)+'&status=eq.pending&limit=1'});
 if(existing.length)return send(res,409,{error:'Ya tienes una solicitud pendiente. No necesitas pagar de nuevo.'});
 await sb('rs5_plan_requests',{method:'POST',body:{user_id:user.id,plan_price_usdt:cfg.reseller_plan_price_usdt,plan_days:cfg.reseller_plan_days,status:'pending'}});
 return send(res,200,{ok:true,status:'pending',message:'Solicitud registrada. Pendiente de pago comprobado y aprobación manual; no activa el plan automáticamente.'});
 }
 if(p==='/api/admin/plan-reject'&&req.method==='POST'){if(!authAdmin(req))return send(res,403,{error:'Acceso no autorizado'});const b=await bodyJSON(req),id=saneNumber(b.requestId,1,9e15);if(id===null)return send(res,400,{error:'Solicitud inválida'});const rows=await sb('rs5_plan_requests',{method:'PATCH',query:'id=eq.'+id+'&status=eq.pending',body:{status:'rejected'}});return rows[0]?send(res,200,{ok:true}):send(res,409,{error:'Solicitud ya procesada'})}
 if(p==='/api/admin/plan-requests'&&req.method==='GET'){if(!authAdmin(req))return send(res,403,{error:'No autorizado'});const items=await sb('rs5_plan_requests',{query:'select=id,user_id,plan_price_usdt,plan_days,status,created_at&order=created_at.desc&limit=150'});return send(res,200,{requests:items})}
 if(p==='/api/admin/approve-plan'&&req.method==='POST'){
 if(!authAdmin(req))return send(res,403,{error:'No autorizado'});const b=await bodyJSON(req);if(b.confirmedPayment!==true)return send(res,400,{error:'Confirma la verificación manual del cobro antes de activar'});
 const id=saneNumber(b.requestId,1,9e15);if(id===null)return send(res,400,{error:'Solicitud inválida'});
 const reqs=await sb('rs5_plan_requests',{query:'select=id,user_id,plan_days,status&id=eq.'+id});const request=reqs[0];if(!request||request.status!=='pending')return send(res,409,{error:'Solicitud no pendiente'});
 // This route does not execute supplier purchases and must never trust a price from the browser.
 const memberships=await sb('rs5_reseller_memberships',{query:'select=expires_at&user_id=eq.'+encodeURIComponent(request.user_id)});
 const base=Math.max(now(),memberships[0]?Date.parse(memberships[0].expires_at):0);
 const expires=new Date(base+Number(request.plan_days)*86400_000).toISOString();
 await sb('rs5_reseller_memberships',{query:'on_conflict=user_id',method:'POST',prefer:'resolution=merge-duplicates,return=representation',body:{user_id:request.user_id,expires_at:expires}});
 await sb('rs5_wallets',{query:'on_conflict=user_id',method:'POST',prefer:'resolution=ignore-duplicates,return=minimal',body:{user_id:request.user_id,balance_usdt:0}});
 await sb('rs5_plan_requests',{query:'id=eq.'+id,method:'PATCH',prefer:'return=minimal',body:{status:'approved'}});
 return send(res,200,{ok:true,expiresAt:expires});
 }
 if(p.startsWith('/api/'))return send(res,404,{error:'Operación no habilitada. Este servidor no procesa cobros ni envía compras al proveedor.'});
 if(req.method!=='GET'&&req.method!=='HEAD')return send(res,405,{error:'No permitido'});
 if(p==='/'||p==='/index.html'||p==='/inicio'||p==='/catalogo'||p==='/pedidos'||p==='/revendedores'||p==='/cuenta'||p==='/iniciar-sesion'||p==='/crear-cuenta'||/^\/compra\/(datos|pago|revision|listo)$/.test(p)||p.startsWith('/juegos/')||p==='/admin'||p.startsWith('/admin/')||p==='/account'||p==='/catalog'||p==='/orders'||p==='/reseller'||p.startsWith('/games/')||p==='/checkout')return staticFile(res,'index.html','text/html; charset=utf-8');
 if(p==='/site.css')return staticFile(res,'site.css','text/css; charset=utf-8');
 if(p==='/app.js')return staticFile(res,'app.js','application/javascript; charset=utf-8');
 if(p==='/prices.js')return staticFile(res,'prices.js','application/javascript; charset=utf-8');
 if(/^\/assets\/[a-z0-9-]+\.svg$/.test(p))return staticFile(res,p.slice(1),'image/svg+xml');
 if(p==='/assets/refills-brand.webp'||p==='/assets/brand-wordmark.webp')return staticFile(res,p.slice(1),'image/webp');
 if(p==='/assets/refills-icon.png')return staticFile(res,'assets/refills-icon.png','image/png');
 if(p==='/assets/favicon.png')return staticFile(res,'assets/favicon.png','image/png');
 if(p==='/assets/google-g.svg')return staticFile(res,'assets/google-g.svg','image/svg+xml');
 return send(res,404,{error:'No encontrado'});
 }catch(e){const msg=String(e.message||'Error');if(!msg.includes('NOT_CONFIGURED')&&!msg.startsWith('RA_')&&!msg.startsWith('CO_'))console.error('Server error:',msg.slice(0,160));return send(res,msg.startsWith('RA_RATE')||msg.startsWith('CO_RATE')?429:msg.includes('NOT_CONFIGURED')?503:502,{error:msg.startsWith('DB_')?'La base de datos respondió con un error; verifica las tablas y credenciales.':(msg.startsWith('RA_')||msg.startsWith('CO_'))?'El proveedor no está disponible o requiere configurar su clave privada.':msg.includes('NOT_CONFIGURED')?'Falta configuración privada en el servidor.':'No se pudo completar la solicitud.'})}
});
server.listen(PORT,()=>console.log(`Refills Shop V8 en http://localhost:${PORT}. Compras reales deshabilitadas.`));