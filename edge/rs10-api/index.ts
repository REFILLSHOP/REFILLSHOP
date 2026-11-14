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
async function userFromRequest(req:Request):Promise<{id:string,app_metadata?:{role?:string}}|null>{
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
  if(req.method==='GET'&&action==='/health')return respond({ok:true,database:true,auth:true,payments:false,orders:false,admin:true,providerPurchases:false,environment:'preproduction'},200,cors);
  if(req.method==='GET'&&action==='/client-config')return respond({supabaseUrl:SB,publishableKey:PUBLISHABLE,googleLoginEnabled:false},200,cors);
  if(req.method==='GET'&&(action==='/bootstrap'||action==='/storefront')){
   const data=await storefront();return respond(action==='/bootstrap'?{storefront:data,storefrontError:null,adminConfigured:true,databaseConfigured:true,googleLoginEnabled:false,supabaseUrl:SB,publishableKey:PUBLISHABLE}:data,200,cors);
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
  if(action.startsWith('/admin/')){
   const adminUser=await userFromRequest(req);
   if(!adminUser||adminUser.app_metadata?.role!=='refills_admin')return respond({error:'No autorizado: inicia sesión con tu cuenta administradora.'},403,cors);
   if(action==='/admin/login'&&req.method==='POST')return respond({ok:true,admin:true},200,cors);
   if(action==='/admin/session'&&req.method==='GET')return respond({admin:true},200,cors);
   if(action==='/admin/logout'&&req.method==='POST')return respond({ok:true},200,cors);
   if(action==='/admin/overview'&&req.method==='GET'){
    const [g,o,p,orders,reviews]=await Promise.all([
     service<any[]>('/rest/v1/rs5_games?select=id&active=eq.true'),
     service<any[]>('/rest/v1/rs5_offers?select=id&active=eq.true'),
     service<any[]>('/rest/v1/rs5_profiles?select=user_id&limit=1000'),
     service<any[]>('/rest/v1/rs5_orders?select=id,status&limit=1000'),
     service<any[]>('/rest/v1/rs5_registration_reviews?select=user_id,status&limit=1000')]);
    return respond({counts:{games:g.length,offers:o.length,orders:orders.length,pending:orders.filter(x=>x.status==='pending').length,profiles:p.length,newRegistrations:reviews.filter(x=>x.status==='pending').length},integration:{supabase:true,centralCatalog:false,centralPurchases:false,googleConfigured:false}},200,cors);
   }
   if(action==='/admin/customers'&&req.method==='GET'){
    const [profiles,reviews,wallets,plans,orders]=await Promise.all([
     service<any[]>('/rest/v1/rs5_profiles?select=user_id,full_name,phone,created_at&order=created_at.desc&limit=1000'),
     service<any[]>('/rest/v1/rs5_registration_reviews?select=user_id,status,channel,created_at&limit=1000'),
     service<any[]>('/rest/v1/rs5_wallets?select=user_id,balance_usdt&limit=1000'),
     service<any[]>('/rest/v1/rs5_reseller_memberships?select=user_id,expires_at&limit=1000'),
     service<any[]>('/rest/v1/rs5_orders?select=user_id,id&limit=1000')]);
    const rm=new Map(reviews.map(x=>[x.user_id,x]));const wm=new Map(wallets.map(x=>[x.user_id,x]));const mm=new Map(plans.map(x=>[x.user_id,x]));const counts=new Map<string,number>();
    for(const x of orders)counts.set(x.user_id,(counts.get(x.user_id)||0)+1);
    const clients=profiles.map(p=>({id:p.user_id,name:p.full_name,phone:p.phone,email:null,createdAt:p.created_at,provider:'phone_password',balanceUsdt:Number(wm.get(p.user_id)?.balance_usdt||0),resellerUntil:mm.get(p.user_id)?.expires_at||null,orders:counts.get(p.user_id)||0,reviewStatus:rm.get(p.user_id)?.status||'pending',reviewChannel:rm.get(p.user_id)?.channel||null,phoneVerified:false}));
    return respond({clients,limited:clients.length>=1000},200,cors);
   }
   if(action==='/admin/registration-review'&&req.method==='POST'){
    const input=await req.text();if(input.length>1200)return respond({error:'Formulario demasiado grande'},413,cors);
    const b=JSON.parse(input),uid=String(b.userId||''),status=String(b.status||'');
    if(!/^[a-f0-9-]{36}$/i.test(uid)||!['pending','contacted','confirmed'].includes(status))return respond({error:'Revisión inválida'},400,cors);
    const customer=await service<any[]>('/rest/v1/rs5_profiles?select=user_id&user_id=eq.'+encodeURIComponent(uid));
    if(!customer.length)return respond({error:'Cliente no encontrado'},404,cors);
    const channel=['whatsapp','sms','other'].includes(String(b.channel||''))?String(b.channel):null;
    await service('/rest/v1/rs5_registration_reviews?user_id=eq.'+encodeURIComponent(uid),'PATCH',{status,channel,updated_at:new Date().toISOString()});
    return respond({ok:true,status,phoneVerified:false},200,cors);
   }
   if(action==='/admin/orders'&&req.method==='GET'){
    const q=String(url.searchParams.get('q')||'').slice(0,60);
    const clause=q?'&code=ilike.*'+encodeURIComponent(q.replace(/[%*,]/g,''))+'*':'';
    const orders=await service<any[]>('/rest/v1/rs5_orders?select=id,code,game_name,offer_name,player_id,zone_id,target_payload,method,source_phone,amount,currency,status,admin_note,created_at,receipt_path&status=neq.uploading&order=created_at.desc&limit=150'+clause);
    return respond({orders:orders.map(o=>({id:o.id,code:o.code,game:o.game_name,offer:o.offer_name,playerId:o.player_id,zoneId:o.zone_id||'',targetPayload:o.target_payload||{},method:o.method,sourcePhone:o.source_phone||'',amount:Number(o.amount),currency:o.currency,status:o.status,note:o.admin_note||'',created:o.created_at,receiptAvailable:!!o.receipt_path}))},200,cors);
   }
   if(action==='/admin/offers'&&req.method==='GET')return respond({offers:await service<any[]>('/rest/v1/rs5_offers?select=id,game_id,name,provider_name,provider_product_key,provider_price_usdt,gain_sm,active,provider_in_stock&order=updated_at.desc&limit=300')},200,cors);
   // Administrative catalog controls. All routes above require a valid Supabase
   // user JWT with app_metadata.role=refills_admin; never trust client metadata.
   const readBody=async()=>{const text=await req.text();if(text.length>4000)throw Error('Formulario demasiado largo');return JSON.parse(text||'{}')};
   const safeText=(x:unknown,max:number)=>String(x||'').trim().slice(0,max);
   const positive=(x:unknown,min:number,max:number)=>Number.isFinite(Number(x))&&Number(x)>=min&&Number(x)<=max?Number(x):null;
   if(action==='/admin/game'&&req.method==='POST'){
    const b=await readBody(),id=safeText(b.id,60),name=safeText(b.name,90),category=safeText(b.category,70)||'Juegos',imageUrl=safeText(b.imageUrl,500);
    if(!/^[a-z0-9-]{2,60}$/.test(id)||name.length<2||name.length>90||category.length<2)return respond({error:'Revisa ID, nombre y categoría del juego'},400,cors);
    if(imageUrl&&!/^https:\/\/[^\s<>"']{5,500}$/i.test(imageUrl))return respond({error:'La imagen debe ser una URL HTTPS válida'},400,cors);
    const data={id,name,category,image_url:imageUrl||null,featured:b.featured===true,sort_order:b.featured===true?1:99,active:true,updated_at:new Date().toISOString()};
    const res=await fetch(SB+'/rest/v1/rs5_games?on_conflict=id',{method:'POST',headers:{...reqHeaders(SECRET),Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(data)});
    if(!res.ok)throw Error('No se pudo guardar juego '+res.status);
    return respond({ok:true,game:(await res.json())[0]},200,cors);
   }
   if(action==='/admin/offer-manual'&&req.method==='POST'){
    const b=await readBody(),gameId=safeText(b.gameId,60),name=safeText(b.name,120),provider=safeText(b.provider,30)||'centralone',cost=positive(b.providerPriceUsdt,0.0001,100000),gain=positive(b.gainSm,0,1000000),productKey=safeText(b.productKey,100);
    if(!/^[a-z0-9-]{2,60}$/.test(gameId)||name.length<2||!['centralone','recargasamerica'].includes(provider)||cost===null||gain===null)return respond({error:'Completa juego, nombre, proveedor, costo USDT y ganancia SM'},400,cors);
    const games=await service<any[]>('/rest/v1/rs5_games?select=id&id=eq.'+encodeURIComponent(gameId)+'&active=eq.true');
    if(!games.length)return respond({error:'Primero crea o activa el juego'},404,cors);
    if(productKey&&provider==='centralone'&&!/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(productKey))return respond({error:'El ID de Central One debe ser un UUID del catálogo'},400,cors);
    const data={game_id:gameId,name,display_name:name,provider_name:provider,provider_product_key:productKey||null,provider_price_usdt:cost,gain_sm:gain,active:false,provider_in_stock:false,provider_target_schema:[],updated_at:new Date().toISOString()};
    const res=await fetch(SB+'/rest/v1/rs5_offers',{method:'POST',headers:{...reqHeaders(SECRET),Prefer:'return=representation'},body:JSON.stringify(data)});
    if(!res.ok)throw Error('No se pudo guardar la oferta '+res.status);
    return respond({ok:true,offer:(await res.json())[0],published:false,message:'Oferta guardada como borrador hasta verificar proveedor y cobros'},201,cors);
   }
   if(action==='/admin/offer-edit'&&req.method==='POST'){
    const b=await readBody(),id=safeText(b.id,50),gain=positive(b.gainSm,0,1000000);
    if(!/^[0-9a-f-]{36}$/i.test(id)||gain===null)return respond({error:'Oferta inválida'},400,cors);
    if(b.active===true)return respond({error:'La venta sigue bloqueada: antes de publicar hay que verificar el proveedor y los cobros'},409,cors);
    await service('/rest/v1/rs5_offers?id=eq.'+encodeURIComponent(id),'PATCH',{gain_sm:gain,active:false,provider_in_stock:false,updated_at:new Date().toISOString()});
    return respond({ok:true,active:false},200,cors);
   }
   if(action==='/admin/delete-game'&&req.method==='POST'){
    const b=await readBody(),id=safeText(b.id,60);if(!/^[a-z0-9-]{2,60}$/.test(id))return respond({error:'Juego inválido'},400,cors);
    await service('/rest/v1/rs5_offers?game_id=eq.'+encodeURIComponent(id),'PATCH',{active:false,provider_in_stock:false});
    await service('/rest/v1/rs5_games?id=eq.'+encodeURIComponent(id),'PATCH',{active:false,updated_at:new Date().toISOString()});
    return respond({ok:true,archived:true},200,cors);
   }
   if(action==='/admin/delete-offer'&&req.method==='POST'){
    const b=await readBody(),id=safeText(b.id,50);if(!/^[0-9a-f-]{36}$/i.test(id))return respond({error:'Oferta inválida'},400,cors);
    await service('/rest/v1/rs5_offers?id=eq.'+encodeURIComponent(id),'PATCH',{active:false,provider_in_stock:false,updated_at:new Date().toISOString()});
    return respond({ok:true,archived:true},200,cors);
   }
   if(action==='/admin/settings'&&req.method==='POST'){
    const b=await readBody(),rate=positive(b.buySmPerUsdt,0.01,1000000),cup=positive(b.cupPerSm,0.01,1000000),fee=positive(b.cardFee,0,100),planDays=positive(b.planDays,1,365);
    if(rate===null||cup===null||fee===null||planDays===null||!Number.isInteger(planDays))return respond({error:'Revisa las tasas y duración del plan'},400,cors);
    const p=String(b.mobilePhone||''),w=String(b.walletPhone||''),c=String(b.cardNumber||''),confirm=String(b.confirmPhone||'');
    if(!/^[0-9]{8}$/.test(p)||w&&!/^[0-9]{8}$/.test(w)||c.length<8||c.length>40||!/^[0-9]{8}$/.test(confirm))return respond({error:'Revisa teléfono, monedero y tarjeta'},400,cors);
    const plan=b.planPrice===null||b.planPrice===''?null:positive(b.planPrice,0.01,10000);if(b.planPrice!==null&&b.planPrice!==''&&plan===null)return respond({error:'Precio del plan inválido'},400,cors);
    await service('/rest/v1/rs5_settings?id=eq.1','PATCH',{buy_sm_per_usdt:rate,cup_per_sm:cup,card_fee_pct:fee,mobile_phone:p,wallet_phone:w||null,card_number:c,confirm_phone:confirm,reseller_plan_price_usdt:plan,reseller_plan_days:planDays,updated_at:new Date().toISOString()});
    return respond({ok:true,message:'Tasas guardadas. Los pagos siguen bloqueados hasta su verificación.'},200,cors);
   }

   return respond({error:'Acción administrativa no disponible hasta verificar el proceso de compras y pagos.'},503,cors);
  }
  if(req.method!=='GET')return respond({error:'Operación de compra o pago no habilitada. No envíes dinero hasta la activación verificada.'},503,cors);
  return respond({error:'Ruta no encontrada'},404,cors);
 }catch(e){console.error('rs10 edge failure',String(e));return respond({error:'Servicio temporalmente no disponible'},503,cors)}
});