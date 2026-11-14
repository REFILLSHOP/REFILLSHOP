// Refills Shop V10 - separate live backend gateway on Supabase Edge Functions.
// No supplier spending, payment capture, wallet credits or order mutations until verified.
const SB = Deno.env.get('SUPABASE_URL') || '';
const SECRET = (()=>{try{return JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}').default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''}catch{return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')||''}})();
const PUBLISHABLE = (()=>{try{return JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS')||'{}').default||Deno.env.get('SUPABASE_ANON_KEY')||''}catch{return Deno.env.get('SUPABASE_ANON_KEY')||''}})();
const HEADERS = {'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'};
const ORIGINS = new Set(['https://refillshop.pages.dev','https://refills-shop-v10-pruebas.refills-shop-preview.workers.dev','https://refills-shop-v10-activo.refills-shop-preview.workers.dev']);
const respond = (data:unknown,status=200,headers:Record<string,string>={}) => new Response(JSON.stringify(data),{status,headers:{...HEADERS,...headers}});
const reqHeaders = (key:string, token?:string):HeadersInit => ({'apikey':key, 'authorization':'Bearer '+(token||key),'accept':'application/json','content-type':'application/json'});
const errMsg = (value:unknown) => typeof value==='object'&&value!==null&&'message' in value ? String((value as {message:unknown}).message) : 'Error';
async function service<T=unknown>(path:string, method='GET',data?:unknown):Promise<T>{
 const resp=await fetch(SB+path,{method,headers:reqHeaders(SECRET),body:data===undefined?undefined:JSON.stringify(data),signal:AbortSignal.timeout(10000)});
 const json=await resp.json().catch(()=>null);if(!resp.ok)throw Error('Supabase HTTP '+resp.status+' '+errMsg(json));return json as T;
}
function normalizePhone(v:unknown):string|null {
 const raw=String(v||'').trim();if(!/^\+[0-9()\s.\-]+$/.test(raw))return null;
 const s=raw.replace(/[^0-9]/g,'');if(!/^[1-9][0-9]{7,14}$/.test(s))return null;
 if(s.startsWith('53')&&(s.length!==10||s[2]!=='5'))return null;
 return '+'+s;
}
function phoneAlias(phone:string):string {const s=phone.slice(1);return s.startsWith('53')&&s.length===10?'cu'+s+'@refillshop.pages.dev':'tel'+s+'@refillshop.pages.dev'}
function securePassword(v:unknown):v is string{return typeof v==='string'&&v.length>=10&&v.length<=72&&/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(v)&&/[0-9]/.test(v)}
async function userFromRequest(req:Request):Promise<{id:string}|null>{
 const value=req.headers.get('authorization')||'';if(!/^Bearer [\w.\-]+$/.test(value))return null;
 const response=await fetch(SB+'/auth/v1/user',{headers:reqHeaders(PUBLISHABLE,value.slice(7)),signal:AbortSignal.timeout(9000)});
 if(!response.ok)return null;const u=await response.json().catch(()=>({}));return typeof u.id==='string'?u:null;
}
async function storefront(){
 const [g,o,c] = await Promise.all([
 service<any[]>('/rest/v1/rs5_games?select=id,name,category,image_url,featured,sort_order&active=eq.true&order=sort_order.asc'),
 service<any[]>('/rest/v1/rs5_offers?select=id,game_id,name,display_name,provider_price_usdt,gain_sm,provider_in_stock,provider_target_schema,featured,sort_order&active=eq.true'),
 service<any[]>('/rest/v1/rs5_settings?select=buy_sm_per_usdt,cup_per_sm,card_fee_pct,mobile_phone,wallet_phone,card_number,confirm_phone,reseller_plan_price_usdt,reseller_plan_days&id=eq.1')]);
 const cfg=c[0];if(!cfg)throw Error('Settings missing');const rate=Number(cfg.buy_sm_per_usdt),cup=Number(cfg.cup_per_sm),fee=Number(cfg.card_fee_pct),r2=(x:number)=>Math.round((x+Number.EPSILON)*100)/100;
 if(rate<=0||cup<=0||fee<0||fee>100)throw Error('Invalid prices');
 const offers=o.filter(x=>Number(x.provider_price_usdt)>0).map(x=>{const cost=Number(x.provider_price_usdt),sm=r2(cost*rate+Number(x.gain_sm||0)),cp=r2(sm*cup);return {id:x.id,gameId:x.game_id,name:x.display_name||x.name,inStock:x.provider_in_stock!==false,targetSchema:Array.isArray(x.provider_target_schema)?x.provider_target_schema:[],featured:!!x.featured,sortOrder:x.sort_order||99,sm,cup:cp,usdt:r2(sm/rate),card:r2(cp*(1+fee/100)),resellerUsdt:r2(cost*1.03)}});
 return {live:true,games:g.map(x=>({id:x.id,name:x.name,tag:x.category,imageUrl:x.image_url,featured:x.featured,sortOrder:x.sort_order})),offers,config:{buySmPerUsdt:rate,cupPerSm:cup,cardFee:fee,mobilePhone:cfg.mobile_phone,walletPhone:cfg.wallet_phone||'',cardNumber:cfg.card_number,confirmPhone:cfg.confirm_phone,planPrice:cfg.reseller_plan_price_usdt,planDays:cfg.reseller_plan_days}};
}
Deno.serve(async req=>{
 const url=new URL(req.url);const action=url.pathname.replace(/^\/rs10-api\/?/,'/').replace(/^\/+/,'/');
 const origin=req.headers.get('origin')||'';
 const cors=ORIGINS.has(origin)?{'access-control-allow-origin':origin,'vary':'Origin','access-control-allow-methods':'GET, POST, OPTIONS','access-control-allow-headers':'authorization,content-type,apikey'}:{};
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
 // Requests sent directly from arbitrary browsers to this API are not authorized to create accounts.
 // Same-origin Cloudflare proxy strips Origin after host validation and adds a required server-side key in the future.
 if(origin&&!ORIGINS.has(origin))return respond({error:'Origen no permitido'},403,cors);
 if(!SB||!SECRET||!PUBLISHABLE)return respond({error:'El servidor necesita las claves de Supabase'},503,cors);
 try{
  if(req.method==='GET'&&action==='/health')return respond({ok:true,database:true,auth:true,payments:false,orders:false,admin:false,providerPurchases:false,environment:'preproduction'},200,cors);
  if(req.method==='GET'&&action==='/client-config')return respond({supabaseUrl:SB,publishableKey:PUBLISHABLE,googleLoginEnabled:false},200,cors);
  if(req.method==='GET'&&(action==='/bootstrap'||action==='/storefront')){
   const data=await storefront();return respond(action==='/bootstrap'?{storefront:data,storefrontError:null,adminConfigured:false,databaseConfigured:true,googleLoginEnabled:false,supabaseUrl:SB,publishableKey:PUBLISHABLE}:data,200,cors);
  }
  if(req.method==='POST'&&action==='/auth/phone-register'){
   if(Number(req.headers.get('content-length')||0)>3000)return respond({error:'Formulario demasiado grande'},413,cors);
   const raw=await req.text();if(raw.length>3000)return respond({error:'Formulario demasiado grande'},413,cors);
   const b=JSON.parse(raw);if(b.website)return respond({ok:true},200,cors);
   const phone=normalizePhone(b.phone),name=String(b.fullName||'').trim().replace(/\s+/g,' '),password=b.password;
   if(!phone||name.length<2||name.length>90||!securePassword(password))return respond({error:'Introduce tu nombre, el teléfono con prefijo internacional y una contraseña de 10 caracteres con letras y números.'},400,cors);
   const ip=req.headers.get('cf-connecting-ip')||req.headers.get('x-forwarded-for')?.split(',')[0]||'unknown';
   const keyBytes=new TextEncoder().encode('rs10:'+ip.trim());const digest=await crypto.subtle.digest('SHA-256',keyBytes);const key=Array.from(new Uint8Array(digest)).map(c=>c.toString(16).padStart(2,'0')).join('');
   const allowed=await service<boolean>('/rest/v1/rpc/rs10_check_signup_rate','POST',{p_bucket:key});
   if(!allowed)return respond({error:'Demasiados intentos. Prueba dentro de una hora.'},429,cors);
   const email=phoneAlias(phone);
   const createdResponse=await fetch(SB+'/auth/v1/admin/users',{method:'POST',headers:reqHeaders(SECRET),body:JSON.stringify({email,password,email_confirm:true,user_metadata:{signup_source:'phone_password',phone_verification:'unverified'}}),signal:AbortSignal.timeout(10000)});
   const created=await createdResponse.json().catch(()=>({}));
   if(!createdResponse.ok)return respond({error:createdResponse.status===422||createdResponse.status===409?'Ese teléfono ya está registrado':'No se pudo registrar'},createdResponse.status===422||createdResponse.status===409?409:503,cors);
   const uid=created?.user?.id||created?.id;
   if(!/^[a-f0-9-]{36}$/i.test(String(uid)))return respond({error:'No se pudo completar el registro'},503,cors);
   try{await service('/rest/v1/rs5_profiles?on_conflict=user_id','POST',{user_id:uid,full_name:name,phone,updated_at:new Date().toISOString()})}
   catch(e){await service('/auth/v1/admin/users/'+encodeURIComponent(uid),'DELETE').catch(()=>{});console.error('registration profile failed',String(e));return respond({error:'No se pudo guardar el perfil'},503,cors)}
   return respond({ok:true,phone,phoneVerified:false,message:'Cuenta creada; número pendiente de confirmación manual.'},201,cors);
  }
  if(req.method==='GET'&&action==='/profile'){
   const user=await userFromRequest(req);if(!user)return respond({error:'Inicia sesión'},401,cors);
   const [p,w,m]=await Promise.all([
    service<any[]>('/rest/v1/rs5_profiles?select=full_name,phone&user_id=eq.'+encodeURIComponent(user.id)),
    service<any[]>('/rest/v1/rs5_wallets?select=balance_usdt&user_id=eq.'+encodeURIComponent(user.id)),
    service<any[]>('/rest/v1/rs5_reseller_memberships?select=expires_at&user_id=eq.'+encodeURIComponent(user.id))]);
   const active=!!m[0]&&Date.parse(m[0].expires_at)>Date.now();return respond({profile:p[0]?{fullName:p[0].full_name,phone:p[0].phone}:null,resellerActive:active,expiresAt:active?m[0].expires_at:null,walletUsdt:w[0]?Number(w[0].balance_usdt):0},200,cors);
  }
  if(req.method==='GET'&&action==='/orders'){
   const user=await userFromRequest(req);if(!user)return respond({error:'Inicia sesión'},401,cors);
   const rows=await service<any[]>('/rest/v1/rs5_orders?select=id,code,game_name,offer_name,player_id,zone_id,target_payload,method,source_phone,amount,currency,status,admin_note,created_at,receipt_path&user_id=eq.'+encodeURIComponent(user.id)+'&status=neq.uploading&order=created_at.desc&limit=100');
   return respond({orders:rows.map(o=>({id:o.id,code:o.code,game:o.game_name,offer:o.offer_name,playerId:o.player_id,zoneId:o.zone_id||'',targetPayload:o.target_payload||{},method:o.method,sourcePhone:o.source_phone||'',amount:Number(o.amount),currency:o.currency,status:o.status,note:o.admin_note||'',created:o.created_at,receiptAvailable:!!o.receipt_path}))},200,cors);
  }
  if(action.startsWith('/admin/'))return respond({error:'ADM real pendiente de configuración segura. No uses el modo de demostración.'},503,cors);
  if(req.method!=='GET')return respond({error:'Operación de compra o pago no habilitada. No envíes dinero hasta la activación verificada.'},503,cors);
  return respond({error:'Ruta no encontrada'},404,cors);
 }catch(e){console.error('rs10 edge failure',String(e));return respond({error:'Servicio temporalmente no disponible'},503,cors)}
});