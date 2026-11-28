(() => {
'use strict';
const SB='https://kcgjlnymhmxylrjchcvl.supabase.co';
const KEY='sb_publishable_sGK_1a5Tp8gY83KI8wiSZg_LP5uxGdc';
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=x=>(Number(x)||0).toLocaleString('es-ES',{maximumFractionDigits:2});
const usd=x=>(Number(x)||0).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
const date=x=>{const d=new Date(x);return x&&Number.isFinite(d.getTime())?d.toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',year:'numeric'})+' · '+d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true}):'—'};
const paths={
overview:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
games:'<path d="M7 8h10a5 5 0 0 1 5 5l-1 4a3 3 0 0 1-4 2l-4-2H11l-4 2a3 3 0 0 1-4-2l-1-4a5 5 0 0 1 5-5z"/><path d="M8 11v5M5.5 13.5h5M16 12h.01M19 15h.01"/>',
offers:'<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M3 11h18M8 3v5M16 3v5"/>',
orders:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/>',
customers:'<circle cx="10" cy="8" r="4"/><path d="M2 21a8 8 0 0 1 16 0M18 8a4 4 0 0 1 0 8m1 2a6 6 0 0 1 3 3"/>',
resellers:'<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18M16 15h3M7 15h4"/>',
payments:'<path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="9"/>',
centralone:'<path d="M5 16v4h14v-4M8 8h8M8 12h8M7 3h10l3 4v9H4V7z"/>',
shield:'<path d="M12 2 20 5v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="m8 12 3 3 5-6"/>',
refresh:'<path d="M20 7v5h-5M4 17v-5h5M6 9a7 7 0 0 1 12-2l2 5M4 12l2 5a7 7 0 0 0 12-2"/>',
search:'<circle cx="10.8" cy="10.8" r="7"/><path d="m16 16 5 5"/>',
plus:'<path d="M12 4v16M4 12h16"/>',
eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
check:'<path d="m4 12 5 5 11-11"/>',
alert:'<path d="M12 2 2 21h20z"/><path d="M12 9v5M12 17h.01"/>'
};
const ico=(name)=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.shield)+'</svg>';
const MENU=[['overview','Resumen','overview','Indicadores y accesos'],['games','Juegos','games','Tu catálogo'],['offers','Ofertas','offers','Precios y productos'],['orders','Pedidos','orders','Compras y entregas'],['customers','Clientes','customers','Cuentas y seguridad'],['resellers','Revendedores','resellers','Planes y depósitos'],['payments','Pagos y tasas','payments','Configuración comercial'],['centralone','Central One','centralone','Integración proveedor'],['rewards','Promociones','offers','Cupones, descuentos y primera compra'],['partnerapi','API de socios','centralone','Claves y documentación de integración'],['tickets','Soporte','customers','Solicitudes de clientes'],['sales','Ganancias','payments','Ventas y margen estimado']];
const GROUPS=[['overview','Inicio','overview',['overview']],['games','Catálogo','games',['games','offers','rewards']],['orders','Pedidos','orders',['orders']],['customers','Clientes','customers',['customers','tickets','resellers']],['payments','Finanzas','payments',['payments','sales']],['centralone','Integraciones','centralone',['centralone','partnerapi']]];
 const groupFor=page=>GROUPS.find(g=>g[3].includes(page))||GROUPS[0];
 const S={client:null,user:null,page:'overview',busy:false,rememberSession:true,cache:{},search:'',offerSearch:'',editingGameId:null,gameFilter:'all',offerFilter:'all',coFilter:'',coKind:'all',product:null,offerMode:'centralone',bulkNotice:'',bulkFamily:'',regionGame:'',regionName:'',regionMarginPct:null,orderAlertTimer:null,orderAlertBusy:false,orderAlerts:{orders:[],pendingCount:0},notifyOrdersEnabled:false};
function flash(message,error=false){
 const el=$('notify');el.textContent=String(message||'');el.classList.toggle('error',error);el.hidden=false;
 clearTimeout(flash.timer);flash.timer=setTimeout(()=>el.hidden=true,5000);
}
function guarded(err){flash(err?.message||String(err)||'No se pudo realizar esta operación',true)}
function phoneAlias(value){
 const digits=String(value||'').replace(/\D/g,'');
 if(!/^[1-9]\d{7,14}$/.test(digits))throw Error('Introduce un número con prefijo internacional válido.');
 return (digits.startsWith('53')&&digits.length===10?'cu':'tel')+digits+'@refillshop.pages.dev';
}
async function request(path,options={}){
 const service=options.service==='reseller'?'rs12-reseller':options.service==='engagement'?'rs15-engagement':'rs10-api';
 const session=(await S.client.auth.getSession()).data.session;
 if(!session?.access_token)throw Error('Tu sesión terminó. Inicia sesión otra vez.');
 const headers={'Accept':'application/json','apikey':KEY,'Authorization':'Bearer '+session.access_token};
 if(options.body!==undefined)headers['Content-Type']='application/json';
 let res;
 try{res=await fetch(SB+'/functions/v1/'+service+path,{method:options.method||'GET',headers,body:options.body===undefined?undefined:JSON.stringify(options.body),cache:'no-store'});}
 catch{throw Error('No se pudo conectar con Supabase. Comprueba tu conexión y vuelve a intentarlo.');}
 const type=res.headers.get('content-type')||'';
 if(options.blob){if(!res.ok)throw Error('No se pudo abrir el comprobante.');return res.blob()}
 if(!type.includes('application/json'))throw Error('El servidor devolvió una respuesta inesperada (HTTP '+res.status+').');
 const json=await res.json();
 if(!res.ok){const err=Error(json.error||json.message||'Error del servidor HTTP '+res.status);err.status=res.status;throw err}
 return json;
}
const AUTH_KEYS=['refills_shop_supabase_session_v1','sb-kcgjlnymhmxylrjchcvl-auth-token'];
let adminSession=null,refreshInFlight=null,sessionCheckedAt=-Infinity;
function readAdminSession(){
 for(const storage of [localStorage,sessionStorage]){
  for(const key of AUTH_KEYS){try{const raw=JSON.parse(storage.getItem(key)||'null');const v=raw?.currentSession||raw?.session||raw;if(v?.access_token&&v?.refresh_token){S.rememberSession=storage===localStorage;return v}}catch{}}
 }
 return null;
}
function persistAdminSession(data){
 if(!data?.access_token||!data?.refresh_token)throw Error('Respuesta de sesión inválida.');
 adminSession=data;sessionCheckedAt=performance.now();
 try{const store=S.rememberSession?localStorage:sessionStorage,other=S.rememberSession?sessionStorage:localStorage;for(const key of AUTH_KEYS){store.setItem(key,JSON.stringify(data));other.removeItem(key)}localStorage.setItem('refills_shop_remember_session',String(S.rememberSession))}catch{}
 return data;
}
function clearAdminSession(){
 adminSession=null;sessionCheckedAt=-Infinity;for(const storage of [localStorage,sessionStorage])for(const key of AUTH_KEYS)try{storage.removeItem(key)}catch{}
}
async function adminAuth(path,{method='GET',body,token}={}){
 const headers={apikey:KEY,Accept:'application/json'};if(token)headers.Authorization='Bearer '+token;if(body!==undefined)headers['Content-Type']='application/json';
 let r;try{r=await fetch(SB+'/auth/v1'+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store',credentials:'omit'})}catch{throw Error('No se pudo conectar con el servicio de cuentas. Comprueba Internet y reintenta.')}
 const data=await r.json().catch(()=>({}));
 if(!r.ok){const e=Error(data.msg||data.message||data.error_description||'No se pudo validar la sesión.');e.status=r.status;throw e}return data;
}
async function refreshAdminSession(){
 if(refreshInFlight)return refreshInFlight;
 refreshInFlight=(async()=>{const latest=readAdminSession()||adminSession;if(!latest?.refresh_token)throw Error('Inicia sesión con tu cuenta Refills Shop.');try{return persistAdminSession(await adminAuth('/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:latest.refresh_token}}))}catch(e){if([400,401,403].includes(e.status))clearAdminSession();throw e}})().finally(()=>refreshInFlight=null);
 return refreshInFlight;
}
async function checkedAdminUser(){
 adminSession=readAdminSession()||adminSession;if(!adminSession)throw Error('Inicia sesión con tu cuenta Refills Shop.');
 try{const user=await adminAuth('/user',{token:adminSession.access_token});sessionCheckedAt=performance.now();return user}catch(e){if(e.status!==401&&e.status!==403)throw e;const renewed=await refreshAdminSession();const user=await adminAuth('/user',{token:renewed.access_token});sessionCheckedAt=performance.now();return user}
}
function createAdminClient(){
 return {auth:{
  async getSession(){const stored=readAdminSession();if(stored&&stored.access_token!==adminSession?.access_token){adminSession=stored;sessionCheckedAt=-Infinity}if(adminSession&&performance.now()-sessionCheckedAt>240000)await checkedAdminUser();return {data:{session:adminSession}}},
  async getUser(){return {data:{user:await checkedAdminUser()}}},
  async signInWithPassword({email,password}){try{const data=await adminAuth('/token?grant_type=password',{method:'POST',body:{email,password}});persistAdminSession(data);return {data:{session:data,user:data.user},error:null}}catch(error){return {error}}},
  async signOut(){const current=adminSession||readAdminSession();try{if(current?.access_token)await adminAuth('/logout?scope=local',{method:'POST',token:current.access_token})}catch{}finally{clearAdminSession()}}
 }};
}
async function verifyAdmin(){
 const user=(await S.client.auth.getUser()).data.user;
 if(!user)throw Error('Necesitas iniciar sesión.');
 await request('/admin/session');
 S.user=user;return true;
}
function pageFromHash(){const page=location.hash.replace(/^#/,'').split('?')[0];return MENU.some(m=>m[0]===page)?page:'overview'}
function showLogin(message){
 S.user=null;if(S.providerTimer){clearInterval(S.providerTimer);S.providerTimer=null}if(S.orderAlertTimer){clearInterval(S.orderAlertTimer);S.orderAlertTimer=null}$('auth-shell').hidden=false;$('console').hidden=true;
 const form=$('admin-login');const embedded=/\bwv\b/i.test(navigator.userAgent)||new URLSearchParams(location.search).get('app')==='adm';if(form){form.hidden=!embedded;form.elements.rememberSession.checked=true}const help=$('auth-help');if(help)help.textContent=embedded?'Usa la misma cuenta de Refills Shop. No necesitas otra contraseña.':'Entra con tu cuenta en la tienda. Si ya tienes sesión, vuelve a abrir el ADM. No hay una contraseña separada.';
 if(message)flash(message,true);
}
function showConsole(){
 $('auth-shell').hidden=true;$('console').hidden=false;
 $('whoami').textContent='Administrador';
 S.page=pageFromHash();renderMenu();navigate(S.page,true);startAdminOrderAlerts();
}
function renderMenu(){
 const group=groupFor(S.page);
 $('admin-menu').innerHTML=GROUPS.map(g=>'<button type="button" class="side-item '+(group[0]===g[0]?'active':'')+'" data-page="'+g[0]+'" '+(group[0]===g[0]?'aria-current="true"':'')+'>'+ico(g[2])+'<span>'+g[1]+'</span></button>').join('');
 const tabs=$('rs-admin-subnav');if(tabs){tabs.hidden=group[3].length<2;tabs.innerHTML=group[3].map(id=>{const m=MENU.find(x=>x[0]===id);return '<button class="rs-admin-tab '+(S.page===id?'active':'')+'" data-page="'+id+'" '+(S.page===id?'aria-current="page"':'')+' type="button">'+ico(m[2])+'<span>'+esc(m[1])+'</span></button>'}).join('')}
}
function navigate(page,first=false){
 if(!MENU.some(m=>m[0]===page))page='overview';
 if(S.page!==page){S.search='';S.offerSearch='';S.editingGameId=null}S.page=page;if(!first)history.replaceState(null,'','#'+page);
 renderMenu();
 const meta=MENU.find(m=>m[0]===page),group=groupFor(page);$('crumb-name').textContent=group[1]+(group[3].length>1?' / '+meta[1]:'');
 $('view-title').textContent=meta[1]==='Resumen'?'Vista general':group[1];
 $('view-description').textContent=meta[3];
 $('view-eyebrow').textContent=group[3].length>1?meta[1].toUpperCase():'REFILLS OS';
 $('admin-view').innerHTML='<div class="surface loading">Consultando información de Refills Shop…</div>';
 load(page);
 if(window.innerWidth<740)window.scrollTo({top:0,behavior:'smooth'});
}
async function withBusy(task){
 if(S.busy)return;S.busy=true;
 try{await task()}catch(err){guarded(err)}
 finally{S.busy=false}
}
async function load(page=S.page){
 const loadId=(S.loadId||0)+1;S.loadId=loadId;const current=()=>S.page===page&&S.loadId===loadId;
 try{
  if(page==='overview'){
   const [overview,commerce,central,reseller,orders]=await Promise.all([
    request('/admin/overview'),request('/admin/commerce/settings'),request('/admin/centralone/status'),
    request('/admin/summary',{service:'reseller'}).catch(()=>({deposits:[],orders:[],memberships:[]})),
    request('/admin/orders').catch(()=>({orders:[]}))
   ]);
   Object.assign(S.cache,{overview,commerce,central,reseller,orders});return current()?drawOverview():undefined;
  }
  if(page==='games'){
   const x=await request('/admin/games');S.cache.games=x.games||[];
   return current()?drawGames():undefined;
  }
  if(page==='offers'){
   const [g,o,store,co]=await Promise.all([request('/admin/games'),request('/admin/offers'),publicStorefront(),request('/admin/centralone/catalog?kind=all&offset=0').catch(()=>({families:[],products:[]}))]);
   S.cache.games=g.games||[];S.cache.offers=o.offers||[];S.cache.store=store;
   S.cache.coFamilies=Array.isArray(co.families)?co.families:[];
   if(!S.cache.coProducts?.length)S.cache.coProducts=co.products||[];
   return current()?drawOffers():undefined;
  }
  if(page==='orders'){
   const [x,sm,cup]=await Promise.all([request('/admin/orders'),request('/admin/refills-pay/events').catch(()=>null),request('/admin/refills-pay/cup-events').catch(()=>null)]);S.cache.orders=x;S.cache.orderPaymentMatches=[...(sm?.events||[]),...(cup?.events||[])];return current()?drawOrders():undefined;
  }
  if(page==='customers'){
   const x=await request('/admin/customers');S.cache.customers=x.clients||[];return current()?drawCustomers():undefined;
  }
  if(page==='resellers'){
   const x=await request('/admin/summary',{service:'reseller'});S.cache.reseller=x;return current()?drawResellers():undefined;
  }
  if(page==='payments'){
   const [s,store,commerce,crypto,payEvents,cupEvents]=await Promise.all([request('/admin/settings'),publicStorefront(),request('/admin/commerce/settings'),request('/admin/crypto/status'),request('/admin/refills-pay/events').catch(()=>null),request('/admin/refills-pay/cup-events').catch(()=>null)]);
   Object.assign(S.cache,{settings:s.config,store,commerce,crypto,payEvents,cupEvents});return current()?drawPayments():undefined;
  }
  if(page==='rewards'||page==='partnerapi'){S.cache.rewards=await request('/admin/rewards');if(current())return drawRewards();return;}
   if(page==='tickets'){S.cache.tickets=await request('/admin/tickets',{service:'engagement'});return current()?drawTickets():undefined;}
   if(page==='sales'){S.cache.sales=await request('/admin/stats',{service:'engagement'});return current()?drawSales():undefined;}
  if(page==='centralone'){
   const [central,orderStatus,commerce]=await Promise.all([request('/admin/centralone/status'),request('/admin/centralone/orders/status'),request('/admin/commerce/settings')]);
   Object.assign(S.cache,{central,orderStatus,commerce});return current()?drawCentral():undefined;
  }
 }catch(err){if(!current())return;$('admin-view').innerHTML='<div class="surface section"><h2>No se pudo cargar este apartado</h2><p>'+esc(err.message)+'</p><button class="btn secondary" data-action="refresh">Reintentar</button></div>'}
}
async function publicStorefront(){
 const headers={'apikey':KEY,'Accept':'application/json'};
 const res=await fetch(SB+'/functions/v1/rs10-api/storefront',{headers,cache:'no-store'});
 const data=await res.json().catch(()=>({}));
 if(!res.ok)throw Error(data.error||'No se pudieron obtener las tasas de la tienda.');
 return data;
}
function drawRewards(){
 const d=S.cache.rewards||{},coupons=d.coupons||[],keys=d.keys||[];
 $('admin-view').innerHTML='<section class="surface section"><div class="panel-head"><div><h2>Cupones de descuento</h2><small>El ganador semanal recibe un cupón personal de 8% durante 7 días. Los demás códigos se crean aquí.</small></div>'+ico('offers')+'</div><form id="reward-coupon-form" class="form-grid">'+field('Código (4–40 caracteres)','code','','text')+field('Descuento % (máx. 20)','percent',8,'number')+field('Usos totales','maxUses',1,'number')+field('Vigencia en días','days',7,'number')+'<div class="form-actions wide"><button class="btn primary" type="submit">Crear cupón</button></div></form><div class="spacing"></div>'+ (coupons.length?coupons.map(x=>'<div class="record spacer"><div><h3>'+esc(x.reward_week?'Premio semanal · código privado':x.code)+' · '+esc(x.percent)+'%</h3><small>Vence '+esc(new Date(x.expires_at).toLocaleDateString('es-CU',{timeZone:'America/Havana'}))+' · Máximo '+esc(x.max_uses)+' usos</small></div>'+tag(x.active?'Activo':'Desactivado',x.active?'good':'warn')+(x.active?'<button class="btn ghost small" data-action="disable-reward-coupon" data-code="'+esc(x.code)+'">Desactivar</button>':'')+'</div>').join(''):empty('Sin cupones','Crea una promoción.'))+'</section><div class="spacing"></div><section class="surface section"><div class="panel-head"><div><h2>API Refills Shop v1</h2><small>Clave de catálogo o clave de compra vinculada a un revendedor con wallet USDT.</small></div>'+ico('centralone')+'</div><p>GET <code style="overflow-wrap:anywhere">https://kcgjlnymhmxylrjchcvl.supabase.co/functions/v1/rs10-api/partner/v1/catalog</code></p><p>Authorization: Bearer TU_CLAVE_API</p><p><a href="/REFILLSHOP/api/" target="_blank" rel="noopener">Documentación de integración</a></p><form id="partner-key-form" class="form-grid">'+field('Nombre de distribuidor','label','','text')+field('ID de cuenta revendedor (opcional, habilita compras)','ownerId','','text')+'<div class="form-actions wide"><button class="btn primary" type="submit">Generar clave API</button></div></form><div id="partner-new-key" hidden></div><div class="spacing"></div>'+ (keys.length?keys.map(x=>'<div class="record spacer"><div><h3>'+esc(x.label)+'</h3><small>'+esc(x.scope==='reseller'?'Compras con wallet · '+(x.owner_id||''):'Solo lectura')+'</small></div>'+tag(x.active?'Activa':'Revocada',x.active?'good':'warn')+(x.active?'<button class="btn ghost small" data-action="revoke-partner-key" data-id="'+esc(x.id)+'">Revocar</button>':'')+'</div>').join(''):empty('Sin claves API','Genera una clave por distribuidor.'))+'</section>';
 $('admin-view').insertAdjacentHTML('afterbegin','<section class="surface section"><div class="panel-head"><div><h2>Ofertas relámpago y primera compra</h2><small>Publica un cupón temporal visible en Ofertas y novedades</small></div>'+ico('offers')+'</div><form id="rs-promo-form" class="form-grid">'+field('Código','code','','text')+field('Descuento % (máx. 20)','percent','','number')+field('Máximo de usos','maxUses',10,'number')+field('Duración en horas (1–720)','hours',24,'number')+'<label class="check wide"><input type="checkbox" name="firstPurchase"> Solo clientes que todavía no hayan pagado una compra</label><p class="footer-caption wide">Comprueba que el descuento no supere tu margen. No se crean descuentos hasta que guardes el cupón.</p><div class="form-actions wide"><button class="btn primary" type="submit">Publicar promoción</button></div></form></section><div class="spacing"></div>');
 const view=$('admin-view'),api=view.querySelector('#partner-key-form')?.closest('section');
 if(S.page==='partnerapi'){for(const child of [...view.children])if(child!==api)child.remove();}
 else {api?.remove();for(const child of [...view.children])if(child.classList.contains('spacing')&&!child.nextElementSibling)child.remove();}
}
function metric(label,value,subtitle,icon){return '<article class="surface metric"><div class="metric-header"><span class="metric-title">'+esc(label)+'</span><span class="metric-icon">'+ico(icon)+'</span></div><b>'+esc(value)+'</b><small>'+esc(subtitle)+'</small></article>'}
function empty(title,subtitle){return '<div class="empty">'+ico('orders')+'<b>'+esc(title)+'</b><small>'+esc(subtitle)+'</small></div>'}
function tag(text,type=''){return '<span class="pill '+type+'">'+esc(text)+'</span>'}
function status(value){
 const v=String(value||'pending').toLowerCase();
 if(v==='refunded'||v.includes('reembols'))return tag('Reembolsado','refund');
 if(v==='completed'||v.includes('complet')||v.includes('entregad')||v==='paid'||v==='approved')return tag('Completado','good');
 if(v==='rejected'||v==='failed'||v.includes('fall')||v.includes('cancel')||v.includes('rechaz'))return tag('Fallido','bad');
 if(v==='processing'||v.includes('proces'))return tag('En proceso','info');
 return tag('Pendiente','warn');
}

const ADMIN_SEEN_ORDERS='refills_admin_seen_orders_v3',ADMIN_NOTIFY_PREF='refills_admin_notifications_v3';
function adminOrderAlertPanel(){
 const canNotify=typeof Notification!=='undefined',enabled=S.notifyOrdersEnabled&&canNotify&&Notification.permission==='granted';
 const pending=(S.orderAlerts.orders||[]).filter(o=>o.status==='pending').slice(0,6);
 return '<section class="surface section rs-order-alert-control"><div class="panel-head"><div><h2>Avisos de pedidos</h2><small>Se revisan cada 15 segundos mientras el panel está abierto.</small></div>'+ico('orders')+'</div>'
 +'<div class="rs-order-alert-row"><strong><span id="rs-admin-pending-number">'+Number(S.orderAlerts.pendingCount||0)+'</span> pedidos pendientes</strong><button type="button" class="btn '+(enabled?'secondary':'primary')+' small" data-action="'+(enabled?'disable-order-notifications':'enable-order-notifications')+'">'+(enabled?'Desactivar avisos':'Activar notificaciones')+'</button><button type="button" class="btn ghost small" data-action="check-new-orders">Actualizar</button></div>'
 +'<p class="footer-caption">'+(canNotify?(Notification.permission==='denied'?'Permisos bloqueados: actívalos en los ajustes del navegador.':enabled?'Notificaciones permitidas en este dispositivo.':'Pulsa Activar para solicitar permiso al navegador.'):'Este navegador no admite notificaciones de página.')+' Las alertas del sistema necesitan que este panel siga abierto; no son notificaciones push con la web cerrada.</p>'
 +'<div class="rs-urgent-orders" id="rs-admin-pending-list"><h3>Los últimos pendientes</h3>'+(pending.length?pending.map(o=>'<div class="rs-urgent-order"><div><strong>'+esc(o.game||'Recarga')+'</strong><small>'+esc(o.offer||'Oferta')+' · '+esc(o.code||'')+' · '+date(o.createdAt)+'</small></div>'+status(o.status)+'</div>').join(''):'<p class="footer-caption">Por ahora no hay pedidos pendientes nuevos.</p>')+'</div><button class="btn secondary small" type="button" data-page="orders">Revisar pedidos</button></section><div class="spacing"></div>';
}
function adminSaveSeen(ids){try{localStorage.setItem(ADMIN_SEEN_ORDERS,JSON.stringify({at:Date.now(),ids:ids.slice(0,80)}))}catch{}}
function adminReadSeen(){
 try{
  const x=JSON.parse(localStorage.getItem(ADMIN_SEEN_ORDERS)||'null');
  if(!x||!Array.isArray(x.ids)||!Number.isFinite(Number(x.at))||Date.now()-Number(x.at)>=86400000){
   localStorage.removeItem(ADMIN_SEEN_ORDERS);return null;
  }
  return x.ids.filter(v=>typeof v==='string').slice(0,80);
 }catch{try{localStorage.removeItem(ADMIN_SEEN_ORDERS)}catch{}return null}
}
async function adminPollOrders(visibleStatus=false){
 if(!S.user||S.orderAlertBusy)return;
 S.orderAlertBusy=true;
 try{
  const data=await request('/admin/order-alerts');
  const orders=Array.isArray(data.orders)?data.orders:[];
  const previous=adminReadSeen();
  const seen=new Set(previous||orders.map(o=>o.id));
  const added=previous?orders.filter(o=>o.id&&!seen.has(o.id)):[];
  const oldState=(S.orderAlerts.orders||[]).map(o=>o.id+':'+o.status).join(',');
  S.orderAlerts={orders,pendingCount:Number(data.pendingCount)||0};
  adminSaveSeen(orders.map(o=>o.id));
  if(S.notifyOrdersEnabled&&typeof Notification!=='undefined'&&Notification.permission==='granted'){
   for(const o of added.filter(o=>o.status==='pending').slice(0,1)){try{
    const n=new Notification('Pedidos nuevos · Refills Shop',{body:added.length+' nuevo(s). Revisa el panel de pedidos.',icon:'/REFILLSHOP/assets/refills-icon.png',tag:'rs-order-batch',renotify:false});
    n.onclick=()=>{window.focus();navigate('orders');n.close()};
   }catch{}}
  }
  if(added.length)flash('Llegaron '+added.length+' pedidos nuevos. Revisa Pedidos.');
  const current=oldState!==orders.map(o=>o.id+':'+o.status).join(',');
  if(S.page==='overview'&&$('rs-admin-order-alert-box'))$('rs-admin-order-alert-box').innerHTML=adminOrderAlertPanel();
  if(S.page==='orders'&&!S.busy&&(current||Date.now()-Number(S.lastOrdersAutoRefresh||0)>30000)&&document.activeElement?.id!=='filter-orders'){const currentOrders=await request('/admin/orders');S.cache.orders=currentOrders;S.lastOrdersAutoRefresh=Date.now();drawOrders()}
  else if(S.page==='orders'){const el=$('rs-admin-pending-number');if(el)el.textContent=String(S.orderAlerts.pendingCount)}
  if(visibleStatus)flash('Pedidos sincronizados: '+S.orderAlerts.pendingCount+' pendientes.');
 }catch(error){if(visibleStatus)guarded(error);else console.warn('Avisos:',error?.message||error)}
 finally{S.orderAlertBusy=false}
}
function startAdminOrderAlerts(){
 if(S.orderAlertTimer)return;
 try{S.notifyOrdersEnabled=localStorage.getItem(ADMIN_NOTIFY_PREF)==='true'}catch{}
 void adminPollOrders();
 S.orderAlertTimer=window.setInterval(()=>{if(S.user)void adminPollOrders()},15000);
 try{const v=localStorage.getItem('rs_provider_balance_threshold');if(v!==null&&Number.isFinite(Number(v))&&Number(v)>=0)S.balanceThreshold=Number(v)}catch{}
 void pollProviderBalance();S.providerTimer=window.setInterval(()=>{if(S.user)void pollProviderBalance()},120000);
}

function drawTickets(){
 const rows=S.cache.tickets?.tickets||[];
 $('admin-view').innerHTML='<section class="surface section"><div class="panel-head"><div><h2>Tickets de soporte</h2><small>'+rows.filter(t=>t.status==='open').length+' pendientes · últimos 100</small></div>'+ico('customers')+'</div>'+(rows.length?rows.map(t=>'<div class="record"><div style="min-width:0"><h3>'+esc(t.subject)+'</h3><small>'+date(t.created_at)+' · '+esc(t.user_id)+'</small><p style="white-space:pre-wrap;overflow-wrap:anywhere">'+esc(t.message)+'</p>'+(t.reply?'<p style="white-space:pre-wrap;overflow-wrap:anywhere"><strong>Respuesta:</strong> '+esc(t.reply)+'</p>':'')+'</div><div class="row-actions">'+tag(t.status==='open'?'Pendiente':t.status==='answered'?'Respondido':'Cerrado')+'<button class="btn secondary small" data-action="reply-ticket" data-id="'+esc(t.id)+'">Responder</button></div></div>').join(''):empty('Sin tickets','Las solicitudes de tus clientes aparecerán aquí.'))+'</section>';
}
function drawSales(){
 const x=S.cache.sales||{};
 $('admin-view').innerHTML='<div class="grid three">'+metric('PEDIDOS PAGADOS Y ENTREGADOS',Number(x.count||0),'Últimos 30 días · clientes','orders')+metric('COSTO ESTIMADO',usd(x.estimatedCostUsdt)+' USDT','Costo actual de las ofertas','payments')+metric('MARGEN BRUTO ESTIMADO',usd(x.estimatedMarginUsdt)+' USDT','No incluye gastos ni comisiones','overview')+'</div><div class="spacing"></div><section class="surface section"><h2>Ingresos por moneda</h2>'+Object.entries(x.revenue||{}).map(([k,v])=>'<div class="record"><strong>'+esc(k)+'</strong><strong>'+money(v)+'</strong></div>').join('')+'<p class="footer-caption">El margen usa las tasas y los costos actuales, no los históricos. Incluye '+Number(x.knownCount||0)+' de '+Number(x.count||0)+' pedidos con costo y conversión conocidos. No representa la ganancia neta real ni incluye ventas mayoristas.</p></section>';
}
function providerBalancePanel(compact=false){
 const x=S.providerBalance;
 if(!x)return '<section class="surface section"><h2>Saldo del proveedor</h2><p>Consultando Central One…</p></section>';
 const limit=Number(S.balanceThreshold??10),verified=x.verified===true&&Number.isFinite(x.available),low=verified&&x.available<=limit;
 if(compact)return '<div class="surface rs-provider-compact"><div><small>Saldo de Central One</small><strong>'+(verified?Number(x.available).toFixed(4)+' '+esc(x.currency||'USD'):'Sin verificar')+'</strong></div>'+tag(verified?(low?'Saldo bajo':'Suficiente'):'Sin verificar',low||!verified?'warn':'good')+'<button class="btn secondary small" data-page="centralone">Gestionar</button></div>';
 return '<section class="surface section"><div class="panel-head"><div><h2>Saldo Central One</h2><small>Consulta de solo lectura · cada 2 minutos con ADM abierto</small></div>'+ico('payments')+'</div><div class="record"><div><h3>'+(verified?Number(x.available).toFixed(4)+' '+esc(x.currency||'USD'):'No disponible')+'</h3><small>'+esc(verified?date(x.checkedAt):x.reason||'No se pudo confirmar el saldo')+'</small></div>'+tag(verified?(low?'Saldo bajo':'Saldo suficiente'):'Sin verificar',low||!verified?'warn':'good')+'</div><form id="provider-threshold-form" class="form-grid spacer">'+field('Avisarme al alcanzar este saldo (USD/USDT)','threshold',limit,'number')+'<button type="submit" class="btn secondary small">Guardar umbral en este dispositivo</button></form><button type="button" class="btn ghost small" data-action="check-provider-balance">Actualizar ahora</button></section>';
}
async function pollProviderBalance(){
 if(!S.user||S.providerBusy)return;
 S.providerBusy=true;
 try{
  S.providerBalance=await request('/admin/balance',{service:'engagement'});
  const x=S.providerBalance,limit=Number(S.balanceThreshold??10);
  const low=x.verified===true&&Number.isFinite(x.available)&&x.available<=limit;
  if(low&&!S.providerLow){flash('Saldo bajo de Central One: '+Number(x.available).toFixed(4)+' '+(x.currency||'USD')+'.',true)}
  S.providerLow=low;
 }catch(e){S.providerBalance={verified:false,reason:e.message||'No se pudo consultar el saldo'};}
 finally{S.providerBusy=false;const box=$('rs-provider-balance-box');if(box&&!box.contains(document.activeElement))box.innerHTML=providerBalancePanel(S.page==='overview');}
}
function drawOverview(){
 const x=S.cache.overview?.counts||{}, r=S.cache.reseller||{}, co=S.cache.commerce||{},cn=S.cache.central||{};
 $('admin-view').innerHTML='<div id="rs-admin-order-alert-box">'+adminOrderAlertPanel()+'</div><div id="rs-provider-balance-box">'+providerBalancePanel(true)+'</div><div class="spacing"></div><div class="grid four">'
 +metric('JUEGOS PUBLICADOS',x.games||0,'Catálogo actual','games')
 +metric('OFERTAS ACTIVAS',x.offers||0,'Visibles para clientes','offers')
 +metric('PEDIDOS',x.orders||0,(x.pending||0)+' pendientes','orders')
 +metric('CLIENTES',x.profiles||0,'Cuentas registradas','customers')+'</div>'
 +'<div class="spacing"></div><div class="grid two">'
 +'<section class="surface section"><div class="panel-head"><div><h2>Accesos rápidos</h2><small>Gestiona lo más importante</small></div>'+ico('overview')+'</div><div class="quick-grid">'
 +[['games','Nuevo juego','Añade artículos a tu catálogo','games'],['offers','Crear oferta','Central One o borrador manual','offers'],['orders','Revisar pedidos','Cobros y entregas seguras','orders'],['resellers','Revendedores','Planes, saldos y recargas','resellers']].map(a=>'<button class="quick-card" data-page="'+a[0]+'"><span class="quick-icon">'+ico(a[3])+'</span><b>'+a[1]+'</b><small>'+a[2]+'</small></button>').join('')+'</div></section>'
 +'<section class="surface section"><div class="panel-head"><div><h2>Estado de la tienda</h2><small>Conexiones y operaciones</small></div>'+ico('shield')+'</div>'
 +'<div class="record"><div><h3>Supabase</h3><small>Autenticación y base de datos</small></div>'+tag('Conectado','good')+'</div>'
 +'<div class="record spacer"><div><h3>Central One</h3><small>Catálogo del proveedor</small></div>'+tag(cn.connected?'Conectado':'Por configurar',cn.connected?'good':'warn')+'</div>'
 +'<div class="record spacer"><div><h3>Recepción de pedidos</h3><small>Pedidos con dinero real</small></div>'+tag(co.acceptOrders?'Habilitada':'Pausada',co.acceptOrders?'good':'warn')+'</div>'
 +'<div class="record spacer"><div><h3>Revendedores</h3><small>Depósitos pendientes</small></div>'+tag((r.deposits||[]).length+' pendientes')+'</div>'
 +'</section></div><div class="spacing"></div><div class="live-strip"><div><strong>Refills Shop Control Center</strong><p>Los productos no se publican automáticamente. Tú decides cuáles ofrecer.</p></div><button class="btn secondary small" data-page="centralone">Administrar Central One ↗</button></div>';
}
function drawGames(){
 const games=S.cache.games||[];
 const editing=games.find(g=>g.id===S.editingGameId)||null;
 const filtered=games.filter(g=>(S.gameFilter==='all'||(S.gameFilter==='active')===!!g.active));
 $('admin-view').innerHTML='<div class="split">'
 +'<section class="surface section"><div class="panel-head"><div><h2>'+(editing?'Editar juego: '+esc(editing.name):'Crear juego')+'</h2><small>'+(editing?'ID permanente · No se alterarán sus ofertas, estado ni orden':'La información del juego se sincroniza con los clientes')+'</small></div>'+ico('plus')+'</div><form id="game-form" class="form-grid" novalidate><label>ID único (sin espacios)<input name="id" placeholder="ej: mobile-legends" pattern="[a-z0-9-]{2,60}" value="'+esc(editing?.id||'')+'" '+(editing?'readonly aria-readonly="true"':'')+' required></label><label>Nombre del juego<input name="name" maxlength="90" placeholder="Nombre del producto" value="'+esc(editing?.name||'')+'" required></label><label>Categoría<input name="category" value="'+esc(editing?.tag||'Juegos')+'" maxlength="70" required></label><label>Imagen HTTPS<input name="imageUrl" type="url" placeholder="https://…" value="'+esc(editing?.imageUrl||'')+'"></label><label class="check wide"><input name="featured" type="checkbox" '+(editing?.featured?'checked':'')+'> Destacar en el inicio</label><div class="form-actions wide"><button class="btn primary" type="button" data-action="save-game">'+ico('check')+(editing?' Guardar cambios del juego':' Crear juego')+'</button>'+(editing?'<button class="btn ghost" type="button" data-action="cancel-edit-game">Cancelar edición</button>':'')+'</div></form><p class="footer-caption">Primero crea el juego. Después vincula las ofertas que quieras vender desde Central One.</p></section>'
 +'<section class="surface section"><div class="panel-head"><div><h2>Mis juegos</h2><small>'+games.length+' registrados · '+games.filter(g=>g.active).length+' publicados</small></div>'+ico('games')+'</div>'
 +'<div class="toolbar"><input type="search" id="filter-games" placeholder="Buscar juego…" value="'+esc(S.search)+'"><select id="game-filter"><option value="all">Todos</option><option value="active" '+(S.gameFilter==='active'?'selected':'')+'>Publicados</option><option value="archived" '+(S.gameFilter==='archived'?'selected':'')+'>Archivados</option></select></div>'
 +(filtered.length?'<div class="list">'+filtered.map(g=>'<div class="record"><div class="record-main"><img class="thumb" alt="" src="'+esc(/^https:\/\//.test(g.imageUrl||'')?g.imageUrl:'/REFILLSHOP/assets/refills-icon.png')+'"><div><h3>'+esc(g.name)+'</h3><small>'+esc(g.id)+' · '+esc(g.tag||'Juegos')+'</small></div></div><div class="row-actions">'+tag(g.active?'Publicado':'Archivado',g.active?'good':'warn')+'<button class="btn ghost small" data-action="edit-game" data-id="'+esc(g.id)+'">Editar</button>'+(g.active?'<button class="btn secondary small" data-page="offers">Ofertas</button>':'<button class="btn secondary small" data-action="restore-game" data-id="'+esc(g.id)+'">Restaurar</button>')+'<button class="btn danger small" data-action="delete-game" data-id="'+esc(g.id)+'">Eliminar</button></div></div>').join('')+'</div>':empty('Sin resultados','No hay juegos que coincidan.'))+'</section></div>';
}


function regionMarginPanel(){
 const games=(S.cache.games||[]).filter(g=>g.active),offers=S.cache.offers||[];
 const game=games.find(g=>g.id===S.regionGame)||games[0]||null;
 const regions=[...new Set(offers.filter(o=>o.game_id===game?.id).map(o=>String(o.provider_region||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es'));
 const region=regions.includes(S.regionName)?S.regionName:(regions[0]||'');
 const relevant=offers.filter(o=>o.game_id===game?.id&&String(o.provider_region||'').trim()===region);
 const unique=[...new Set(relevant.map(o=>Number(o.margin_percent||0)))];
 const storedPct=unique.length===1?unique[0]:null;
 const percentage=S.regionMarginPct!==null&&game?.id===S.regionGame&&region===S.regionName?S.regionMarginPct:storedPct;
 const example=relevant.find(o=>Number(o.provider_price_usdt)>0)||null;
 const rate=Number(S.cache.store?.config?.buySmPerUsdt||0),cup=Number(S.cache.store?.config?.cupPerSm||0);
 const previewValue=example&&Number.isFinite(percentage)?Math.floor((Number(example.provider_price_usdt)*(1+percentage/100)+1e-9)*100)/100:null;
 const sm=previewValue!==null&&rate>0?Math.ceil(previewValue*rate):null;
 const cupValue=sm!==null&&cup>0?Math.ceil(sm*cup):null;
 return '<section class="surface section rs-regional-margin-panel"><div class="panel-head"><div><span class="tag">CONTROL DE GANANCIA POR REGIÓN</span><h2>Ganancia de un juego por región</h2><small>Cambia el porcentaje de las ofertas existentes en una región, sin modificar las demás.</small></div>'+ico('offers')+'</div>'
 +'<div class="form-grid"><label>Juego<select id="region-margin-game">'+games.map(g=>'<option value="'+esc(g.id)+'" '+(g.id===game?.id?'selected':'')+'>'+esc(g.name)+'</option>').join('')+'</select></label>'
 +'<label>Región<select id="region-margin-region">'+regions.map(r=>'<option value="'+esc(r)+'" '+(region===r?'selected':'')+'>'+esc(r)+'</option>').join('')+'</select></label>'
 +'<label>Ganancia sobre el costo del proveedor (%)<input id="region-margin-pct" type="number" min="0" max="300" step="0.01" inputmode="decimal" value="'+(percentage===null?'':percentage)+'" placeholder="'+(unique.length>1?'Las ofertas tienen márgenes diferentes':'Ejemplo: 30')+'"></label>'
 +'<div class="preview" id="region-margin-preview"><small>'+relevant.length+' OFERTAS EN '+esc(region||'ESTA REGIÓN')+'</small><strong id="region-margin-preview-value">'+(previewValue!==null?usd(previewValue)+' USDT':'Introduce el porcentaje')+'</strong><span id="region-margin-preview-other">'+(cupValue!==null?money(sm)+' SM · '+money(cupValue)+' CUP':'Vista previa según las tasas globales')+'</span></div>'
 +'</div><div class="form-actions"><button type="button" class="btn primary" data-action="region-margin-save" '+(!relevant.length?'disabled':'')+'>Guardar ganancia de esta región</button></div>'
 +'<p class="footer-caption">Se actualizarán '+relevant.length+' ofertas de '+esc(game?.name||'Juego')+' · '+esc(region||'Sin región')+'. Las ofertas, estados y precios de otras regiones no se tocan. Los pedidos existentes conservan su importe original.</p>'
 +'</section><div class="spacing"></div>';
}
function updateRegionMarginPreview(){
 const box=$('region-margin-preview'),value=$('region-margin-preview-value'),other=$('region-margin-preview-other');
 const gameId=$('region-margin-game')?.value,region=$('region-margin-region')?.value,percent=Number($('region-margin-pct')?.value);
 const o=(S.cache.offers||[]).find(x=>x.game_id===gameId&&x.provider_region===region&&Number(x.provider_price_usdt)>0);
 const config=S.cache.store?.config||{},rate=Number(config.buySmPerUsdt),cup=Number(config.cupPerSm);
 const valid=$('region-margin-pct')?.value.trim()!==''&&Number.isFinite(percent)&&percent>=0&&percent<=300;
 if(box)box.classList.toggle('invalid',!valid);
 if(!valid||!o){if(value)value.textContent='Introduce una ganancia entre 0 y 300 %';if(other)other.textContent='No se cambiará ningún precio hasta que confirmes.';return}
 const usdt=Math.floor((Number(o.provider_price_usdt)*(1+percent/100)+1e-9)*100)/100;
 const sm=Math.ceil(usdt*rate);
 if(value)value.textContent=usd(usdt)+' USDT';
 if(other)other.textContent=rate>0&&cup>0?money(sm)+' SM · '+money(Math.ceil(sm*cup))+' CUP':'Revisa las tasas de conversión';
}

function bulkOffersPanel(){
 const games=(S.cache.games||[]).filter(g=>g.active),families=S.cache.coFamilies||[],regions=S.cache.bulkRegions||[];
 const cfg=S.cache.store?.config||{},selectedGame=games.find(g=>g.id===S.bulkGame)||games[0];
 const selectedMargin=Number.isFinite(S.bulkMargin)?S.bulkMargin:Number(selectedGame?.marginPercent||0);
 const product=S.cache.bulkFamilySample;
 const rate=Number(cfg.buySmPerUsdt||0),cup=Number(cfg.cupPerSm||0);
 const price=product&&Number(product.resellerPrice)>0?Math.floor((Number(product.resellerPrice)*(1+selectedMargin/100)+1e-9)*100)/100:0;
 const sm=price>0?Math.ceil(price*rate):0;
 return '<section class="surface section rs-bulk-panel"><div class="panel-head"><div><span class="tag">REFILLS SHOP · IMPORTACIÓN REGIONAL</span><h2>Importar ofertas por juego y región</h2><small>Elige una familia de Central One y exactamente una región. No se alterarán otras regiones.</small></div>'+ico('offers')+'</div>'
 +'<div class="form-grid"><label>Juego de tu tienda<select id="bulk-game" required>'+games.map(g=>'<option value="'+esc(g.id)+'" '+(selectedGame?.id===g.id?'selected':'')+'>'+esc(g.name)+'</option>').join('')+'</select></label>'
 +'<label>Juego / familia en Central One<select id="bulk-family" required><option value="">Selecciona la familia</option>'+families.map(f=>'<option value="'+esc(f.id)+'" '+(S.bulkFamily===f.id?'selected':'')+'>'+esc(f.name)+'</option>').join('')+'</select></label>'
 +'<label>Región exacta<select id="bulk-region" required '+(!S.bulkFamily?'disabled':'')+'><option value="">'+(S.bulkFamily?'Selecciona región':'Selecciona familia primero')+'</option>'+regions.map(r=>'<option value="'+esc(r)+'" '+(S.bulkRegion===r?'selected':'')+'>'+esc(r)+'</option>').join('')+'</select></label>'
 +'<label>Ganancia para esta región (%)<input id="bulk-margin" type="number" min="0" max="300" step="0.01" value="'+selectedMargin+'" required></label>'
 +'<div class="preview rs-bulk-preview" id="bulk-preview"><small>EJEMPLO · PRECIO DE UNA OFERTA REAL</small><strong id="bulk-preview-price">'+(price?usd(price)+' USDT':'Selecciona familia y región')+'</strong><span id="bulk-preview-conversion">'+(price?money(sm)+' SM · '+money(Math.ceil(sm*cup))+' CUP':'La vista previa usa precios y tasas de Central One')+'</span></div></div>'
 +'<div class="form-actions rs-bulk-actions"><button class="btn secondary" data-action="bulk-apply" type="button" '+(!games.length||!S.bulkRegion?'disabled':'')+'>Actualizar precios de esta región</button><button class="btn primary" data-action="bulk-import" type="button" '+(!games.length||!S.bulkRegion?'disabled':'')+'>Importar todas las ofertas de esta región</button></div>'
 +'<div id="bulk-progress" class="alert-note" aria-live="polite">'+esc(S.bulkNotice||'La importación no realiza compras. Se guardan ofertas en Supabase y se validan los precios con el proveedor; las ventas siguen sujetas a su habilitación.')+'</div>'
 +(S.cache.store?.salesEnabled===true?'<div class="alert-note warn"><strong>Ventas activas.</strong> Por seguridad, pausa temporalmente los cobros en <button type="button" data-page="payments" class="btn ghost small">Pagos y tasas</button> antes de importar o actualizar todos los precios. No pausaremos las ventas automáticamente.</div>':'')
 +(!families.length?'<div class="alert-note warn">No se obtuvo el catálogo de Central One. Comprueba su conexión en el apartado Integraciones.</div>':'')
 +'</section><div class="spacing"></div>';
}
function updateBulkPreview(){
 const raw=Number(S.cache.bulkFamilySample?.resellerPrice),margin=Number($('bulk-margin')?.value);
 const rate=Number(S.cache.store?.config?.buySmPerUsdt||0),cup=Number(S.cache.store?.config?.cupPerSm||0);
 const valid=!!S.bulkRegion&&Number.isFinite(raw)&&raw>0&&Number.isFinite(margin)&&margin>=0&&margin<=300&&rate>0&&cup>0;
 const price=valid?Math.floor((raw*(1+margin/100)+1e-9)*100)/100:0,sm=Math.ceil(price*rate);
 const top=$('bulk-preview-price'),bottom=$('bulk-preview-conversion');
 if(top)top.textContent=valid?usd(price)+' USDT':'Selecciona una región válida';
 if(bottom)bottom.textContent=valid?money(sm)+' SM · '+money(Math.ceil(sm*cup))+' CUP · '+S.cache.bulkFamilySample.name:'No hay precios inventados ni mezcla de regiones';
 const available=!!S.bulkRegion&&valid;
 for(const action of ['bulk-apply','bulk-import']){const b=document.querySelector('[data-action="'+action+'"]');if(b)b.disabled=!available}
}
function bulkArgs(){
 const gameId=$('bulk-game')?.value,familyId=$('bulk-family')?.value,region=$('bulk-region')?.value,marginPercent=Number($('bulk-margin')?.value);
 if(!gameId||!familyId||!region||!Number.isFinite(marginPercent)||marginPercent<0||marginPercent>300)throw Error('Selecciona juego, familia, región y margen válido entre 0 y 300 %.');
 if(!(S.cache.bulkRegions||[]).includes(region))throw Error('Esa región no está disponible en la familia de Central One.');
 return {gameId,familyId,region,marginPercent};
}
async function applyExistingMargin(options){
 const r=await request('/admin/game-offers-bulk',{method:'POST',body:{gameId:options.gameId,familyId:options.familyId,region:options.region,marginPercent:options.marginPercent,publish:true}});
 S.bulkNotice=options.region+': '+r.updated+' ofertas actualizadas, '+r.published+' publicadas, '+r.outOfStock+' agotadas. Otras regiones intactas.';
 flash(S.bulkNotice);return r;
}
async function importFamilyOffers(options){
 if(S.cache.store?.salesEnabled===true)throw Error('Pausa las ventas antes de importar un lote para evitar cambios de precio durante las compras.');
 if(!await modalConfirm('Importar SOLO '+options.region+' de la familia seleccionada con '+options.marginPercent+' % de ganancia? Las otras regiones no cambiarán.'))return;
 const n=$('bulk-progress'),progress=t=>{S.bulkNotice=t;if(n)n.textContent=t};
 let offset=0,processed=0,failed=0,firstError='',total=0;
 while(processed<600){
  const page=await request('/admin/centralone/catalog?kind=all&family='+encodeURIComponent(options.familyId)+'&region='+encodeURIComponent(options.region)+'&offset='+offset);
  const items=(page.products||[]).filter(p=>p.productId&&p.familyId===options.familyId&&p.region===options.region);
  total=Number(page.total||0);
  if(!items.length)break;
  let next=0;
  async function worker(){while(next<items.length&&processed<600){
   const product=items[next++];processed++;
   try{await request('/admin/centralone/offer',{method:'POST',body:{gameId:options.gameId,productId:product.productId,displayName:product.name,gainSm:0,featured:false}})}
   catch(err){failed++;if(!firstError)firstError=String(err?.message||'Error al vincular')}
   progress('Región '+options.region+' · '+processed+' / '+total+' revisadas'+(failed?' · '+failed+' errores':''));
  }}
  await Promise.all([worker(),worker(),worker()]);
  if(page.nextOffset===null||page.nextOffset===undefined||Number(page.nextOffset)<=offset)break;
  offset=Number(page.nextOffset);
 }
 if(!processed)throw Error('La familia y región seleccionadas no tienen ofertas.');
 const result=await applyExistingMargin(options);
 S.bulkNotice='Región '+options.region+': '+result.updated+' ofertas actualizadas; '+failed+' errores.'+(total>600?' Solo se procesaron las primeras 600.':'')+(firstError?' '+firstError:'');
 await load('offers');flash(S.bulkNotice,failed>0);
}

function drawOffers(){
 const games=(S.cache.games||[]).filter(g=>g.active),offers=S.cache.offers||[];
 const q=S.offerSearch.toLowerCase();
 const filtered=offers.filter(o=>(S.offerFilter==='all'||(S.offerFilter==='active')===!!o.active));
 const settings=S.cache.store?.config||{};
 const previews=o=>{const rate=Number(settings.buySmPerUsdt||0),cupRate=Number(settings.cupPerSm||0),cost=Math.ceil((Number(o.provider_price_usdt||0)-1e-10)*100)/100,margin=Number(o.margin_percent||0);const usdt=margin>0?Math.floor((cost*(1+margin/100)+1e-9)*100)/100:cost;const sm=margin>0?Math.ceil(usdt*rate):Math.ceil(cost*rate+Number(o.gain_sm||0));const cup=Math.ceil(sm*cupRate);return sm>0&&cup>0?money(sm)+' SM / '+money(cup)+' CUP':'Revisar tasas'};
 $('admin-view').innerHTML=regionMarginPanel()+bulkOffersPanel()+'<div class="surface section"><div class="panel-head"><div><h2>Crear oferta</h2><small>Selecciona un producto de Central One o crea un borrador manual</small></div>'+ico('plus')+'</div><div class="tabs"><button data-action="mode-centralone" class="'+(S.offerMode==='centralone'?'active':'')+'">Catálogo Central One</button><button data-action="mode-manual" class="'+(S.offerMode==='manual'?'active':'')+'">Borrador manual</button></div>'
 +(S.offerMode==='manual'
 ?'<form id="manual-offer-form" class="form-grid spacer"><label>Juego <select name="gameId" required>'+games.map(g=>'<option value="'+esc(g.id)+'">'+esc(g.name)+'</option>').join('')+'</select></label><label>Nombre de la oferta<input name="name" required placeholder="Paquete / diamantes"></label><label>Costo proveedor USDT<input type="number" name="providerPriceUsdt" min=".0001" step=".0001" required></label><label>Ganancia en SM<input type="number" name="gainSm" min="0" step=".01" value="0" required></label><div class="form-actions wide"><button class="btn primary" type="submit">Guardar borrador</button></div></form><div class="alert-note">Los borradores no están visibles ni generan compras hasta vincularlos y verificar el proveedor.</div>'
 :'<div class="toolbar spacer"><input id="co-search-inline" type="search" placeholder="Buscar producto o categoría de Central One…" value="'+esc(S.coFilter)+'"><button class="btn secondary" data-action="search-co">Buscar catálogo</button></div>'+renderCoResults()+
 '<form id="link-offer-form" class="form-grid spacer"><label>Juego creado en la tienda<select name="gameId" required>'+games.map(g=>'<option value="'+esc(g.id)+'">'+esc(g.name)+'</option>').join('')+'</select></label><label>Producto Central One<select name="productId" id="co-selected-product" required>'+((S.cache.coProducts||[]).map(p=>'<option value="'+esc(p.productId)+'" '+(S.product===p.productId?'selected':'')+'>'+esc(p.name)+'</option>').join(''))+'</select></label><label>Nombre que verá el cliente<input name="displayName" placeholder="Nombre del paquete"></label><label>Ganancia en SM<input name="gainSm" type="number" min="0" step=".01" value="0" required></label><label class="check wide"><input type="checkbox" name="featured"> Destacar oferta</label><div class="form-actions wide"><button type="submit" class="btn primary" '+(!games.length||!(S.cache.coProducts||[]).length?'disabled':'')+'>Vincular oferta real</button></div></form><div class="alert-note">Las compras permanecen pausadas hasta que habilites los cobros y verifiques Central One. La oferta solo se publica si el proveedor confirma existencias.</div>')
 +'</div><div class="spacing"></div><section class="surface section"><div class="panel-head"><div><h2>Ofertas de la tienda</h2><small>'+offers.length+' registradas · '+offers.filter(x=>x.active).length+' visibles</small></div>'+ico('offers')+'</div><div class="toolbar"><input id="filter-offers" value="'+esc(S.offerSearch)+'" placeholder="Buscar oferta…" type="search"><select id="offer-filter"><option value="all">Todas</option><option value="active" '+(S.offerFilter==='active'?'selected':'')+'>Publicadas</option><option value="archived" '+(S.offerFilter==='archived'?'selected':'')+'>Borradores</option></select></div>'
 +(filtered.length?'<div class="list">'+filtered.map(o=>'<article class="record"><div><h3>'+esc(o.display_name||o.name)+'</h3><small>'+esc(o.game_id)+' · '+esc(o.provider_name||'Proveedor')+' · '+previews(o)+'</small></div><div class="row-actions">'+tag(o.active?'Visible':'Borrador',o.active?'good':'warn')+'<button class="btn ghost small" data-action="edit-offer" data-id="'+esc(o.id)+'">Precio</button><button class="btn secondary small" data-action="toggle-offer" data-id="'+esc(o.id)+'">'+(o.active?'Ocultar':'Publicar')+'</button><button class="btn danger small" data-action="delete-offer" data-id="'+esc(o.id)+'">Eliminar</button></div></article>').join('')+'</div>':empty('No hay ofertas','Crea una oferta manual o vincula un producto de Central One.'))+'</section>';
}
function renderCoResults(){
 const ps=S.cache.coProducts||[];
 return ps.length?'<div class="list">'+ps.slice(0,20).map(p=>'<button type="button" class="record" data-action="select-co" data-id="'+esc(p.productId)+'" style="color:inherit;text-align:left;width:100%"><span><h3>'+esc(p.name)+'</h3><small>'+esc(p.region||'Global')+' · '+esc(p.category||'')+'</small></span><span class="price">'+usd(p.resellerPrice)+' USDT'+(p.inStock?'':' · agotado')+'</span></button>').join('')+'</div>':'<div class="alert-note">Busca y selecciona un producto real de Central One. No se importan ofertas automáticamente.</div>';
}
function paymentMethodLabel(method){
 return ({mobile:'Saldo móvil ETECSA',wallet:'MiTransfer (teléfono)',card:'Transfermóvil (CUP)',usdt_wallet:'USDT BEP-20',usdt_bep20:'Pasarela USDT'})[method]||method||'Sin método';
}
function adminOrderMessage(o){
 if(!o)return '';
 return ['REFILLS SHOP · RESUMEN DEL PEDIDO','Pedido: '+(o.code||'—'),
  'Juego: '+(o.game||'Recarga'),'Paquete: '+(o.offer||'—'),
  'ID / destino: '+(o.playerId||'—'),'Importe: '+money(o.amount)+' '+(o.currency||''),
  'Pago: '+paymentMethodLabel(o.method),'Estado: '+({'pending':'Pendiente','processing':'En proceso','completed':'Completado','rejected':'Rechazado','failed':'Fallido','refunded':'Reembolsado'}[o.status]||o.status||'Pendiente'),
  'https://refillshop.github.io/REFILLSHOP/'].join('\n');
}
function drawOrders(){
 const orders=[...(S.cache.orders?.orders||[])].sort((a,b)=>({'pending':0,'processing':1,'partially_completed':1,'uploading':2,'completed':3,'failed':4,'rejected':4,'refunded':5}[a.status]??6)-({'pending':0,'processing':1,'partially_completed':1,'uploading':2,'completed':3,'failed':4,'rejected':4,'refunded':5}[b.status]??6)||new Date(b.created)-new Date(a.created));
 const pending=orders.filter(o=>o.status==='pending');
 const processing=orders.filter(o=>['processing','partially_completed'].includes(o.status));
 const complete=orders.filter(o=>o.status==='completed');
 const failed=orders.filter(o=>['failed','rejected','refunded'].includes(o.status));
 const refundReview=orders.filter(o=>['rejected','failed'].includes(o.status)&&o.paymentStatus==='paid'&&!o.refundReference);
 const filter=S.orderFilter||'all';
 const filtered=orders.filter(o=>filter==='all'||(filter==='active'&&['pending','processing','partially_completed'].includes(o.status))||(filter==='completed'&&o.status==='completed')||(filter==='failed'&&['failed','rejected','refunded'].includes(o.status)));
 const tabs=[['all','Todos',orders.length],['active','Por atender',pending.length+processing.length],['completed','Completados',complete.length],['failed','Incidencias',failed.length]];
 $('admin-view').innerHTML=
  '<div id="rs-admin-order-alert-box">'+adminOrderAlertPanel()+'</div>'+
  '<section class="surface section rs-admin-order-simple"><div class="panel-head"><div><h2>Pedidos</h2><small>Confirma el ingreso real: las recargas elegibles se envían automáticamente a Central One.</small></div>'+ico('orders')+'</div>'+
  '<div class="rs-admin-orders-summary"><span><strong>'+pending.length+'</strong> por verificar</span><span><strong>'+processing.length+'</strong> en proveedor</span><span><strong>'+complete.length+'</strong> entregados</span></div>'+
  (refundReview.length?'<div class="rs-admin-order-warning" role="alert">'+refundReview.length+' pedido(s) pagados y fallidos requieren revisar el reembolso. No vuelvas a enviar la compra.</div>':'')+
  '<div class="rs-admin-order-tabs">'+tabs.map(t=>'<button type="button" class="'+(filter===t[0]?'active':'')+'" data-action="admin-order-filter" data-filter="'+t[0]+'">'+t[1]+' <b>'+t[2]+'</b></button>').join('')+'</div>'+
  '<div class="toolbar"><input type="search" id="filter-orders" placeholder="Buscar pedido, juego, teléfono…" value="'+esc(S.search)+'"><button class="btn secondary small" data-action="refresh">Actualizar ↻</button></div>'+
  (filtered.length?'<div class="list rs-admin-order-list">'+filtered.map(o=>{
   const isCrypto=o.method==='usdt_wallet'||o.method==='usdt_bep20';
   const card=o.method==='card'||o.method==='wallet';
   const sm=o.method==='mobile';
   const pay=o.paymentStatus==='paid'?'<span class="rs-admin-paid">Pago confirmado</span>':'<span class="rs-admin-unpaid">Pago sin confirmar</span>';
   const matches=(S.cache.orderPaymentMatches||[]).filter(e=>e.orderCode===o.code&&e.matchCount===1);
   const matched=matches.length===1?matches[0]:null;
   const matchInfo=matched?'<div><span>Refills Pay · coincidencia de aviso</span><strong>'+esc(money(matched.amount)+' '+o.currency)+'</strong><small>Solicitado: '+esc(money(o.amount)+' '+o.currency)+' · Diferencia: '+esc((Number(matched.amountDifference)>0?'+':'')+money(matched.amountDifference||0)+' '+o.currency)+'</small><small>'+esc(matched.late?'Aviso recibido después del plazo · revisar':'Aviso coincidente')+' · '+esc(new Date(matched.receivedAt).toLocaleString('es-CU',{timeZone:'America/Havana'}))+'</small></div>':'';
   const paymentInfo=card?'<div><span>Referencia</span><strong>'+esc(o.paymentReference||'Sin referencia')+'</strong></div>':
    sm?'<div><span>Línea de origen</span><strong>'+esc(o.sourcePhone||'No informada')+'</strong></div>':
    isCrypto?'<div><span>Hash blockchain</span><strong class="code-hint">'+esc(o.paymentTxHash||'Pendiente')+'</strong></div>':'';
   const actions=
    (o.receiptAvailable?'<button class="btn ghost small" data-action="receipt" data-code="'+esc(o.code)+'">'+ico('eye')+' Captura</button>':'')+
    (!isCrypto&&o.paymentStatus!=='paid'&&o.status==='pending'?'<button class="btn secondary small" data-action="verify-payment" data-code="'+esc(o.code)+'" >'+(o.kind==='topup'?'Confirmar y enviar recarga':'Confirmar cobro')+'</button>':'')+
    (o.paymentStatus==='paid'&&o.status==='pending'&&o.kind==='topup'?'<button class="btn primary small" data-action="fulfill" data-code="'+esc(o.code)+'">Entregar con Central One</button>':'')+
    (o.paymentStatus==='paid'&&['processing','partially_completed'].includes(o.status)&&o.kind==='topup'?'<button class="btn secondary small" data-action="reconcile-order" data-id="'+esc(o.id)+'">Revisar proveedor</button>':'')+
    (o.kind==='pin'&&o.paymentStatus==='paid'&&o.status!=='completed'?'<button class="btn primary small" data-action="assign-pin" data-code="'+esc(o.code)+'">Entregar PIN</button>':'')+
    (o.status==='pending'?'<button class="btn danger small" data-action="reject-order" data-code="'+esc(o.code)+'">Rechazar</button>':'')+
    (o.paymentStatus==='paid'&&['rejected','failed'].includes(o.status)?'<button class="btn ghost small" data-action="refund-order" data-code="'+esc(o.code)+'">Registrar reembolso</button>':'')+
    '<button class="btn ghost small" data-action="copy-order-brief" data-id="'+esc(o.id)+'">Copiar resumen</button>'+
    (String(o.customerPhone||'').replace(/\D/g,'').length>=8?'<button class="btn ghost small" data-action="send-order-brief" data-id="'+esc(o.id)+'">WhatsApp</button>':'');
   return '<article class="record rs-admin-horizontal-order">'+
    '<div class="rs-hor-row">'+
    '<div class="rs-hor-primary"><span class="rs-hor-code">'+esc(o.code||'Pedido')+'</span><strong>'+esc(o.game||'Recarga')+'</strong><small title="'+esc(o.offer||'')+'">'+esc(o.offer||'')+'</small></div>'+
    '<div class="rs-hor-customer"><span>'+esc(o.customerName||'Cliente')+'</span><small>ID: '+esc(o.playerId||'PIN')+'</small></div>'+
    '<div class="rs-hor-money"><strong>'+money(o.amount)+' '+esc(o.currency||'')+'</strong><small>'+esc(paymentMethodLabel(o.method))+'</small></div>'+
    '<div class="rs-hor-state">'+status(o.status)+pay+(matched&&o.paymentStatus!=='paid'?'<small class="rs-admin-unpaid">SMS coincidente · revisar</small>':'')+'</div>'+
    '<button type="button" class="btn secondary small rs-hor-toggle" data-action="toggle-order-row" data-id="'+esc(o.id)+'" aria-expanded="false" aria-label="Ver acciones del pedido '+esc(o.code||'')+'">Gestionar <span aria-hidden="true">⌄</span></button>'+
    '</div>'+
    '<div class="rs-hor-expanded" hidden>'+
    '<div class="rs-hor-extra-line"><span><b>Cliente:</b> '+esc(o.customerName||'Cliente')+'</span><span><b>Teléfono:</b> '+esc(o.customerPhone||'—')+'</span><span><b>Destino:</b> '+esc(o.playerId||'—')+'</span><span><b>Fecha:</b> '+date(o.created)+'</span></div>'+
    ((paymentInfo||matchInfo)?'<div class="rs-hor-extra-payment">'+paymentInfo+matchInfo+'</div>':'')+
    '<div class="row-actions rs-hor-action-buttons">'+actions+'</div>'+
    '</div></article>';
  }).join('')+'</div>':empty('No hay pedidos en este filtro','Selecciona Todos o actualiza para consultar el historial.'))+
  '</section>';
}
function drawCustomers(){
 const list=S.cache.customers||[];
 const filtered=list;
 $('admin-view').innerHTML='<div class="toolbar"><input type="search" id="filter-customers" value="'+esc(S.search)+'" placeholder="Buscar nombre o teléfono"><span class="tiny-note">'+list.length+' clientes</span></div><section class="surface section"><div class="panel-head"><div><h2>Cuentas registradas</h2><small>Las cuentas existentes permanecen en Supabase</small></div>'+ico('customers')+'</div><div class="list">'+(filtered.length?filtered.map(x=>'<div class="record"><div class="record-main"><span class="avatar">'+esc(String(x.name||'RS').slice(0,2).toUpperCase())+'</span><div><h3>'+esc(x.name||'Cliente')+'</h3><small>'+esc(x.phone||'')+' · '+(x.orders||0)+' pedidos · '+usd(x.balanceUsdt||0)+' USDT</small></div></div><div class="row-actions"><button class="btn ghost small" data-action="customer-details" data-id="'+esc(x.id)+'">Detalles</button><button class="btn primary small" data-action="grant-plan" data-id="'+esc(x.id)+'">Regalar plan</button><button class="btn secondary small" data-action="customer-reset" data-id="'+esc(x.id)+'">Contraseña</button></div></div>').join(''):empty('Sin resultados','No se encontraron cuentas coincidentes.'))+'</div></section>';
}
function drawResellers(){
 const data=S.cache.reseller||{},m=data.memberships||[],d=data.deposits||[],orders=data.orders||[];
 $('admin-view').innerHTML='<div class="grid three">'+metric('REVENDEDORES',m.length,'Cuentas con plan','resellers')+metric('DEPÓSITOS PENDIENTES',d.length,'Por comprobar','payments')+metric('PEDIDOS MAYORISTAS',orders.length,'En proceso','orders')+'</div><div class="spacing"></div>'
 +'<section class="surface section"><div class="panel-head"><div><h2>Recargas de wallet</h2><small>Comprueba cada transferencia antes de acreditar saldo</small></div>'+ico('payments')+'</div>'
 +(d.length?'<div class="list">'+d.map(x=>'<div class="record"><div><h3>'+esc(x.customerName)+'</h3><small>'+esc(x.customerPhone||'')+' · '+money(x.amount)+' '+esc(x.currency)+' → '+usd(x.creditedUsdt||0)+' USDT · '+esc(x.method||'')+' · '+date(x.createdAt)+'</small></div><div class="row-actions">'+(x.proofUrl?'<a href="'+esc(x.proofUrl)+'" target="_blank" rel="noopener" class="btn ghost small">Comprobante ↗</a>':'')+'<button class="btn primary small" data-action="approve-deposit" data-id="'+esc(x.id)+'">Acreditar</button><button class="btn danger small" data-action="reject-deposit" data-id="'+esc(x.id)+'">Rechazar</button></div></div>').join('')+'</div>':empty('No hay depósitos pendientes','Las solicitudes aparecerán al recargar la wallet.'))+'</section>'
 +'<div class="spacing"></div><section class="surface section"><div class="panel-head"><div><h2>Suscripciones activas</h2><small>Gratis, Level 2 y Level 3</small></div>'+ico('resellers')+'</div>'
 +(m.length?'<div class="list">'+m.slice(0,100).map(x=>'<div class="record"><div><h3>'+esc(x.customerName)+'</h3><small>'+esc(x.customerPhone||'')+' · '+(x.expiresAt?date(x.expiresAt):'Sin vencimiento')+'</small></div><div class="row-actions">'+tag(x.tier.toUpperCase(),'good')+tag(usd(x.wallet?.USDT||0)+' USDT')+'<button class="btn secondary small" data-action="grant-plan" data-id="'+esc(x.userId)+'">Regalar plan</button></div></div>').join('')+'</div>':empty('Sin suscripciones','Los planes activos aparecerán aquí.'))+'</section>'
 +'<div class="spacing"></div><section class="surface section"><div class="panel-head"><div><h2>Pedidos de revendedores</h2><small>Los precios se muestran sin detallar márgenes al revendedor</small></div>'+ico('orders')+'</div>'
 +(orders.length?'<div class="list">'+orders.map(o=>'<div class="record"><div><h3>'+esc(o.game||'Pedido')+' · '+esc(o.offer||'')+'</h3><small>'+esc(o.customerName)+' · '+esc(o.code)+' · '+usd(o.totalUsdt)+' USDT</small></div><div class="row-actions">'+status(o.status)+'<button class="btn secondary small" data-action="reseller-order" data-id="'+esc(o.id)+'">Administrar</button></div></div>').join('')+'</div>':empty('Sin pedidos mayoristas','Cuando un revendedor compre, lo verás aquí.'))+'</section>';
}

function refillsDifference(e,currency){if(e.matchCount!==1||e.expectedAmount==null)return '';const d=Number(e.amountDifference||0);return ' · Solicitado: '+esc(money(e.expectedAmount)+' '+currency)+' · Diferencia: '+esc((d>0?'+':'')+money(d)+' '+currency)}
function refillsCupEventsPanel(){
 const data=S.cache.cupEvents,events=data?.events||[];
 return '<section class="surface section"><div class="panel-head"><div><span class="tag">PAGOxMOVIL</span><h2>Avisos CUP detectados</h2><small>Transfermóvil y MiTransfer · método, referencia y tolerancia de ±10 CUP</small></div><button class="btn secondary small" data-action="refresh">Actualizar</button></div>'
 +(!data?'<div class="alert-note warn">No se pudo consultar el registro CUP.</div>':!events.length?'<p class="muted">No hay avisos CUP registrados.</p>':events.map(e=>'<div class="record spacer"><div><h3>'+esc(String(e.amount))+' CUP · '+esc(e.method==='card'?'Transfermóvil':'MiTransfer')+'</h3><small>'+esc(e.reference)+' · '+esc(new Date(e.smsAt).toLocaleString('es-CU',{timeZone:'America/Havana'}))+' · '+esc(e.orderCode||'Sin pedido vinculado')+refillsDifference(e,'CUP')+'</small></div>'+tag(e.paymentStatus==='paid'?'Pedido pagado':e.matchCount===1?(Number(e.amountDifference)===0?'Coincidencia exacta · verificar':'Coincidencia ±10 · verificar'):e.matchCount>1?'Ambiguo':'Sin coincidencia',e.paymentStatus==='paid'?'good':'warn')+'</div>').join(''))
 +'<div class="alert-note warn">El aviso no confirma un ingreso. Revisa el movimiento en tu cuenta o monedero antes de aprobar el pedido.</div></section><div class="spacing"></div>';
}
function refillsPayEventsPanel(){
 const data=S.cache.payEvents, events=data?.events||[];
 return '<section class="surface section"><div class="panel-head"><div><span class="tag">REFILLS PAY</span><h2>Ingresos detectados por SMS</h2><small>Últimos 50 eventos · misma línea y tolerancia de ±10 SM · entrega automática para coincidencias únicas elegibles.</small></div><button class="btn secondary small" data-action="refresh">Actualizar</button></div>'
 +(!data?'<div class="alert-note warn">No se pudo consultar el registro. Reintenta.</div>':!events.length?'<p class="muted">Todavía no hay transferencias detectadas.</p>':events.map(e=>'<div class="record spacer"><div><h3>'+esc(String(e.amount))+' SM · '+esc(e.senderPhone)+'</h3><small>'+esc(new Date(e.receivedAt).toLocaleString('es-CU',{timeZone:'America/Havana'}))+' · '+esc(e.orderCode||'Sin pedido vinculado')+refillsDifference(e,'SM')+(e.late?' · Aviso tardío':'')+'</small></div>'+tag(e.paymentStatus==='paid'?'Pedido pagado':e.matchCount===1?(Number(e.amountDifference)===0?'Coincidencia exacta · pendiente':'Coincidencia ±10 · pendiente'):e.matchCount>1?'Ambiguo':'Sin coincidencia',e.paymentStatus==='paid'?'good':'warn')+'</div>').join(''))
 +'<div class="alert-note warn">Los SMS nuevos de saldo móvil pueden activar recargas automáticamente. Los avisos ambiguos, antiguos o fuera de los límites requieren revisión.</div></section><div class="spacing"></div>';
}
function paymentAutomationPanel(){
 const st=S.cache.settings||{},com=S.cache.commerce||{},cr=S.cache.crypto||{};
 const mode=(method,details,automatic,color)=>{
  const good=automatic===true,unknown=automatic===null;
  return '<div class="rs-payment-method-row"><div><strong>'+esc(method)+'</strong><small>'+esc(details)+'</small></div>'
    +tag(unknown?'Requiere integración':good?'Automático':'En revisión',unknown?'warn':good?'good':'warn')+'</div>';
 };
 return '<section class="surface section rs-payment-control"><div class="panel-head"><div><span class="tag">CONFIGURACIÓN DE COBROS</span><h2>Cómo se valida cada pago</h2><small>La entrega de recargas elegibles se inicia al confirmar un ingreso real. Los avisos SMS no son comprobación bancaria.</small></div>'+ico('shield')+'</div>'
 +mode('Saldo móvil ETECSA','SMS del dispositivo autorizado · ±10 SM · coincidencia única · máximo 30 USDT automáticos por día',S.cache.payEvents?.mode==='sms_auto_delivery'&&com.acceptOrders===true)
 +mode('MiTransfer (CUP)','Avisos PAGOxMOVIL y referencia; ingreso por verificar',false)
 +mode('Transfermóvil (CUP)','Avisos PAGOxMOVIL y referencia; ingreso por verificar',false)
 +mode('USDT BEP-20 · wallet propia','El servidor comprueba token, destinatario, importe y 40 confirmaciones',st.storeUsdtWalletEnabled===true)
 +mode('Saldo Refills Shop','Débito verificado por el servidor; solo revendedores con plan',true)
 +'<div class="alert-note warn">Automatización de CUP: todavía se necesita una conexión verificable de MiTransfer o Transfermóvil. Un número de transacción por sí solo NO confirma que el dinero llegó. Esos pedidos quedan pendientes de revisión.</div>'
 +'<div class="alert-note">La wallet USDT puede verificarse automáticamente en BNB Smart Chain cuando esté habilitada. Las ventas generales están '+(com.acceptOrders?'habilitadas':'pausadas')+'. El estado de NOWPayments es '+(cr.configured?'configurado':'sin configurar')+'.</div>'
 +'</section><div class="spacing"></div>';
}

function drawPayments(){
 const st=S.cache.settings||{},cfg=S.cache.store?.config||{},com=S.cache.commerce||{},cr=S.cache.crypto||{};
 $('admin-view').innerHTML=refillsPayEventsPanel()+refillsCupEventsPanel()+paymentAutomationPanel()+'<div class="split"><section class="surface section"><div class="panel-head"><div><h2>Tasas y cuentas de cobro</h2><small>Valores compartidos por el catálogo</small></div>'+ico('payments')+'</div><form id="rates-form" class="form-grid">'
 +field('Tasa USDT → SM','buySmPerUsdt',cfg.buySmPerUsdt,'number')+field('Tasa SM → CUP','cupPerSm',cfg.cupPerSm,'number')+field('Comisión de tarjeta (%)','cardFee',cfg.cardFee,'number')+field('Duración plan base (días)','planDays',cfg.planDays||15,'number')
 +field('Número receptor saldo móvil','mobilePhone',st.mobilePhone,'text')+field('Número de MiTransfer','walletPhone',st.walletPhone,'text')+field('Tarjeta de Transfermóvil','cardNumber',st.cardNumber,'text')+field('Número de confirmación del destinatario (Transfermóvil)','confirmPhone',st.confirmPhone,'text')
 +field('WhatsApp soporte','supportWhatsapp',st.supportWhatsapp,'text')+field('Email soporte','supportEmail',st.supportEmail,'email')+field('Wallet USDT BEP-20 de la tienda','storeUsdtWalletAddress',st.storeUsdtWalletAddress,'text')+'<label class="check wide"><input type="checkbox" name="storeUsdtWalletEnabled" '+(st.storeUsdtWalletEnabled?'checked':'')+'> Preparar wallet USDT propia para verificar transacciones en blockchain</label>'
 +'<input type="hidden" name="planPrice" value=""><input type="hidden" name="operatorName" value="'+esc(st.operatorName||'')+'"><div class="form-actions wide"><button class="btn primary" type="submit">Guardar configuración</button></div></form></section>'
 +'<section class="surface section"><div class="panel-head"><div><h2>Operaciones y seguridad</h2><small>Control de compras con dinero real</small></div>'+ico('shield')+'</div>'
 +'<div class="live-strip"><div><strong>Ventas '+(com.acceptOrders?'habilitadas':'pausadas')+'</strong><p>Al confirmar un cobro real, las recargas elegibles se envían al proveedor respetando el límite de seguridad.</p></div>'+tag(com.acceptOrders?'Activas':'Pausadas',com.acceptOrders?'good':'warn')+'</div>'
 +'<form id="commerce-form" class="form-grid spacer">'+field('Límite por pedido en USDT','maxSupplierOrderUsdt',com.maxSupplierOrderUsdt||10,'number')
 +'<label class="check wide"><input type="checkbox" name="enabled" '+(com.acceptOrders?'checked':'')+'> Aceptar pedidos reales</label>'
 +'<label class="check wide"><input type="checkbox" name="confirmRealFunds"> Confirmo que las compras usarán dinero real y que he verificado las cuentas y permisos</label>'
 +'<div class="form-actions wide"><button class="btn secondary" type="submit">Actualizar estado de ventas</button></div></form>'
 +'<hr class="divider"><h3>USDT BEP-20</h3><p>Pasarela: '+esc(cr.gateway||'NOWPayments')+'</p>'+tag(cr.configured?'Configurada':'Pendiente',cr.configured?'good':'warn')+tag(cr.enabled?'Activa':'Desactivada',cr.enabled?'good':'warn')
 +'<p class="footer-caption">Nunca se acreditan fondos ni se hacen compras de prueba desde esta pantalla.</p></section></div>';
 $('admin-view').insertAdjacentHTML('beforeend','<section class="surface section spacer"><div class="panel-head"><div><h2>Pasarelas de pagos cubanas</h2><small>Registro de comercio y conciliación real, no verificaciones por un número inventado</small></div>'+ico('shield')+'</div><div class="grid two"><div class="alert-note"><strong>Transfermóvil / Bulevar MiTransfer</strong><p>Inscribe tu comercio para gestionar pagos en línea, códigos QR y reportes de operaciones recibidas.</p><a class="btn secondary small" href="https://transfermovil.etecsa.cu/" target="_blank" rel="noopener noreferrer">Contratación Transfermóvil ↗</a> <a class="btn ghost small" href="https://mitransfer.tur.cu/" target="_blank" rel="noopener noreferrer">Bulevar MiTransfer ↗</a></div><div class="alert-note"><strong>EnZona Comercio</strong><p>Registra tu comercio y solicita acceso autorizado a la API de cobros y sus confirmaciones.</p><a class="btn secondary small" href="https://bulevar.enzona.net/" target="_blank" rel="noopener noreferrer">Registrar comercio ↗</a> <a class="btn ghost small" href="https://api.enzona.net/" target="_blank" rel="noopener noreferrer">Portal API ↗</a></div></div><div class="alert-note warn">El número de transacción aportado por un cliente no confirma que recibiste el dinero. Solo acredita pagos una operación verificada contra el registro del banco o la pasarela. No publiques como automático un método sin credenciales y confirmación del proveedor.</div></section>');

}
function field(label,name,value,type){return '<label>'+esc(label)+'<input name="'+name+'" type="'+(type||'text')+'" '+(type==='number'?'step="any" ':'')+'value="'+esc(value??'')+'"></label>'}
function drawCentral(){
 const c=S.cache.central||{},o=S.cache.orderStatus||{},co=S.cache.commerce||{};
 $('admin-view').innerHTML='<div class="grid three">'+metric('CATÁLOGO',c.connected?'Conectado':'Pendiente','Consulta productos Central One','centralone')+metric('ORDENES',o.ordersRead?'Conectadas':'Pendientes','Permiso orders:read','shield')+metric('COMPRAS',co.acceptOrders?'Habilitadas':'Pausadas','Sin gastos de prueba','payments')+'</div><div class="spacing"></div><div class="split">'
 +'<section class="surface section"><div class="panel-head"><div><h2>Claves de Central One</h2><small>Se almacenan cifradas en Supabase Vault</small></div>'+ico('shield')+'</div><form id="co-catalog-key"><label class="tag">API DEL CATÁLOGO</label><input type="password" name="apiKey" required autocomplete="off" placeholder="co_live_…"><button class="btn secondary full spacer" type="submit">Verificar y conectar catálogo</button></form><hr class="divider"><form id="co-orders-key"><label class="tag">API DE PEDIDOS</label><input type="password" name="apiKey" required autocomplete="off" placeholder="co_live_…"><button class="btn secondary full spacer" type="submit">Verificar permisos de pedidos</button></form><div class="alert-note">La comprobación de la clave de pedidos es de solo lectura. No se crea ninguna recarga durante el test.</div></section>'
 +'<section class="surface section"><div class="panel-head"><div><h2>Catálogo del proveedor</h2><small>Busca productos disponibles y enlázalos a tus juegos</small></div>'+ico('search')+'</div><div class="toolbar"><input id="co-search" type="search" value="'+esc(S.coFilter)+'" placeholder="Buscar juego, recarga o PIN"><select id="co-kind"><option value="all" '+(S.coKind==='all'?'selected':'')+'>Todos</option><option value="topup" '+(S.coKind==='topup'?'selected':'')+'>Recargas</option><option value="pin" '+(S.coKind==='pin'?'selected':'')+'>PIN</option></select><button class="btn primary" data-action="search-co" type="button">Buscar</button></div>'+renderCoResults()+'<div class="form-actions"><button class="btn secondary" data-action="sync-co">Sincronizar precios</button><button class="btn ghost" data-page="offers">Crear oferta vinculada</button></div></section></div>';
 $('admin-view').insertAdjacentHTML('afterbegin','<div id="rs-provider-balance-box">'+providerBalancePanel()+'</div><div class="spacing"></div>');
}
function openModal(title,content){
 $('modal-root').innerHTML='<section class="modal-window" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><div class="panel-head"><h2>'+esc(title)+'</h2><button type="button" class="close" data-action="close-modal" aria-label="Cerrar">×</button></div>'+content+'</section>';
 $('modal-root').hidden=false;
}
function closeModal(){$('modal-root').hidden=true;$('modal-root').innerHTML=''}

async function submitGameChanges(){
 const form=$('game-form');
 if(!form||S.page!=='games')return flash('Abre Juegos para guardar los cambios.',true);
 if(!S.user)return flash('Inicia sesión como administrador.',true);
 if(S.busy)return flash('Hay una operación en curso; comprueba su resultado primero.',true);
 const id=String(form.elements.namedItem('id')?.value||'').trim().toLowerCase();
 const name=String(form.elements.namedItem('name')?.value||'').trim();
 const category=String(form.elements.namedItem('category')?.value||'').trim();
 const imageUrl=String(form.elements.namedItem('imageUrl')?.value||'').trim();
 const featured=!!form.elements.namedItem('featured')?.checked;
 if(!/^[a-z0-9-]{2,60}$/.test(id)){flash('Revisa el identificador del juego.',true);form.elements.namedItem('id')?.focus();return}
 if(name.length<2||name.length>90){flash('El nombre debe tener entre 2 y 90 caracteres.',true);form.elements.namedItem('name')?.focus();return}
 if(category.length<2||category.length>70){flash('Completa una categoría válida.',true);form.elements.namedItem('category')?.focus();return}
 if(imageUrl&&!/^https:\/\/[^\s<>"']{5,500}$/i.test(imageUrl)){flash('La imagen debe tener una dirección HTTPS válida o puedes dejar el campo vacío.',true);form.elements.namedItem('imageUrl')?.focus();return}
 const editingId=S.editingGameId;
 if(editingId&&editingId!==id)return flash('El identificador es permanente; no debe cambiarse al editar un juego.',true);
 const btn=form.querySelector('[data-action="save-game"]');
 if(btn){btn.disabled=true;btn.textContent='Guardando…'}
 S.busy=true;
 try{
  const result=await request(editingId?'/admin/game-edit':'/admin/game',{
   method:'POST',body:{id,name,category,imageUrl,featured}
  });
  if(result?.ok!==true)throw Error(result?.error||'El servidor no confirmó el guardado del juego.');
  S.editingGameId=null;
  const updated=await request('/admin/games');
  S.cache.games=Array.isArray(updated.games)?updated.games:[];
  drawGames();
  flash(result.message||'Juego guardado correctamente en Supabase.');
 }catch(error){
  guarded(error);
  if(btn){btn.disabled=false;btn.textContent=editingId?'Guardar cambios del juego':'Crear juego'}
 }finally{S.busy=false}
}

function changeGame(id){
 const g=(S.cache.games||[]).find(x=>x.id===id);
 if(!g)return flash('Juego no encontrado. Actualiza la lista.',true);
 S.editingGameId=g.id;drawGames();
 const form=$('game-form');
 if(form){form.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});form.elements.name?.focus({preventScroll:true});}
 flash('Modifica el nombre y pulsa Guardar cambios. El ID no se puede cambiar.');
}
async function openCustomer(id){
 const c=(S.cache.customers||[]).find(x=>x.id===id);if(!c)return;
 openModal('Ficha de cliente','<div class="record"><div><h3>'+esc(c.name)+'</h3><small>'+esc(c.phone)+'</small></div>'+tag(c.reviewStatus||'Pendiente')+'</div><div class="grid two spacer">'+metric('PEDIDOS',c.orders||0,'En la tienda','orders')+metric('SALDO',usd(c.balanceUsdt||0)+' USDT','Wallet registrada','resellers')+'</div>');
}
async function openCustomerReset(id){
 const c=(S.cache.customers||[]).find(x=>x.id===id);if(!c)return;
 openModal('Restablecer contraseña','<p>Solo tras verificar personalmente la identidad del cliente '+esc(c.name)+'. No se enviará la contraseña en esta pantalla.</p><form id="reset-customer-form" class="form-grid"><input type="hidden" name="userId" value="'+esc(id)+'">'+field('Nueva contraseña (10+ caracteres)','password','','password')+'<label class="check wide"><input type="checkbox" name="identityConfirmed" required> Confirmo que verifiqué la identidad de este cliente</label><div class="form-actions wide"><button class="btn primary" type="submit">Actualizar contraseña de cliente</button></div></form>');
}
async function openOfferEdit(id){
 const o=(S.cache.offers||[]).find(x=>x.id===id);if(!o)return;
 openModal('Precio de la oferta','<p>Modifica tu ganancia en SM. El sistema recalcula los precios automáticamente.</p><form id="edit-offer-form" class="form-grid"><input type="hidden" name="id" value="'+esc(id)+'">'+field('Ganancia en SM','gainSm',o.gain_sm,'number')+'<div class="form-actions wide"><button class="btn primary" type="submit">Guardar precio</button></div></form>');
}
function modalConfirm(text){return RSDialog.confirm(text)}
async function runAction(action,el){
 const id=el.dataset.id,code=el.dataset.code;
 if(action==='grant-plan'){const c=(S.cache.customers||[]).find(x=>x.id===id)||(S.cache.reseller?.memberships||[]).find(x=>x.userId===id);if(!c)return flash('Cliente no encontrado',true);const rid=crypto.randomUUID();return openModal('Conceder plan sin costo','<p>Cliente: <strong>'+esc(c.name||c.customerName)+'</strong> · '+esc(c.phone||c.customerPhone||'')+'</p><form id="grant-plan-form" class="form-grid"><input type="hidden" name="userId" value="'+esc(id)+'"><input type="hidden" name="requestId" value="'+esc(rid)+'"><label class="wide">Nivel<select name="tier" required><option value="free">Level 1 · Gratis, sin depósito inicial</option><option value="level2">Level 2 · 15 días gratis</option><option value="level3">Level 3 · 15 días gratis</option></select></label><div class="alert-note wide">No se descuenta saldo ni se simula un depósito. Se respetan los niveles superiores vigentes; un plan de pago activo del mismo nivel o inferior recibe 15 días adicionales.</div><button type="submit" class="btn primary wide">Activar sin cobrar</button></form>')}
 if(action==='disable-reward-coupon')return withBusy(async()=>{if(!await RSDialog.confirm('¿Desactivar este cupón?'))return;await request('/admin/rewards/coupon/disable',{method:'POST',body:{code}});await load();flash('Cupón desactivado');});
 if(action==='revoke-partner-key')return withBusy(async()=>{if(!await RSDialog.confirm('¿Revocar esta clave API?'))return;await request('/admin/rewards/api-key/revoke',{method:'POST',body:{id}});await load();flash('Clave revocada');});
 if(action==='check-provider-balance'){await pollProviderBalance();const box=$('rs-provider-balance-box');if(box)box.innerHTML=providerBalancePanel(S.page==='overview');return}
 if(action==='reply-ticket'){const t=(S.cache.tickets?.tickets||[]).find(t=>t.id===id);if(!t)return;return openModal('Responder ticket','<form id="rs-ticket-reply-form" class="form-grid"><input type="hidden" name="id" value="'+esc(t.id)+'"><label class="wide">Respuesta<textarea name="reply" rows="5" maxlength="2000" required>'+esc(t.reply||'')+'</textarea></label><label>Estado<select name="status"><option value="answered">Respondido</option><option value="closed">Cerrado</option></select></label><button class="btn primary" type="submit">Guardar respuesta</button></form>')}
 if(action==='check-new-orders')return adminPollOrders(true);
 if(action==='enable-order-notifications'){
  if(typeof Notification==='undefined')return flash('Este dispositivo no admite notificaciones desde la web. Los pedidos siguen visibles en el ADM.',true);
  let permission=Notification.permission;
  if(permission==='default'){try{permission=await Notification.requestPermission()}catch{permission='denied'}}
  S.notifyOrdersEnabled=permission==='granted';
  try{localStorage.setItem(ADMIN_NOTIFY_PREF,String(S.notifyOrdersEnabled))}catch{}
  if(S.page==='overview')drawOverview();else if(S.page==='orders')drawOrders();
  flash(S.notifyOrdersEnabled?'Avisos activados en este dispositivo, mientras el ADM esté abierto.':'Permiso no concedido. Revisa los ajustes de notificaciones de este sitio.',!S.notifyOrdersEnabled);
  return;
 }
 if(action==='disable-order-notifications'){
  S.notifyOrdersEnabled=false;try{localStorage.setItem(ADMIN_NOTIFY_PREF,'false')}catch{}
  if(S.page==='overview')drawOverview();else if(S.page==='orders')drawOrders();
  flash('Notificaciones del navegador desactivadas en este dispositivo.');
  return;
 }
 if(action==='region-margin-save')return withBusy(async()=>{
  const gameId=$('region-margin-game')?.value,region=$('region-margin-region')?.value;
  const raw=$('region-margin-pct')?.value,marginPercent=Number(raw);
  if(!raw||!gameId||!region||!Number.isFinite(marginPercent)||marginPercent<0||marginPercent>300)
   throw Error('Selecciona juego y región y escribe un porcentaje entre 0 y 300.');
  const matches=(S.cache.offers||[]).filter(o=>o.game_id===gameId&&o.provider_region===region);
  if(!matches.length)throw Error('La región no tiene ofertas. Actualiza el catálogo.');
  const game=(S.cache.games||[]).find(x=>x.id===gameId);
  if(!await modalConfirm('¿Cambiar el margen a '+marginPercent+' % en las '+matches.length+' ofertas de '+(game?.name||gameId)+' · '+region+'? Se mantienen intactas las otras regiones.'))return;
  const result=await request('/admin/region-margin',{method:'POST',body:{gameId,region,marginPercent}});
  if(!result?.ok||result.updated!==matches.length)throw Error('No se pudo confirmar la actualización. Actualiza el catálogo antes de intentar de nuevo.');
  S.regionGame=gameId;S.regionName=region;S.regionMarginPct=null;
  await load('offers');flash(result.message||'Ganancia regional actualizada.');
 });
 if(action==='bulk-apply')return withBusy(async()=>{const args=bulkArgs();if(!await modalConfirm('¿Actualizar SOLO '+args.region+' con ganancia '+args.marginPercent+' %?'))return;await applyExistingMargin(args);await load('offers')});
 if(action==='bulk-import')return withBusy(async()=>{const args=bulkArgs();await importFamilyOffers(args)});
 if(action==='close-modal')return closeModal();
 if(action==='toggle-order-row'){
  const item=el.closest('.rs-admin-horizontal-order');
  const extra=item?.querySelector('.rs-hor-expanded');
  if(!extra)return;
  extra.hidden=!extra.hidden;
  el.setAttribute('aria-expanded',String(!extra.hidden));
  return;
 }
 if(action==='admin-order-filter'){S.orderFilter=el.dataset.filter||'all';return drawOrders();}
 if(action==='copy-order-brief'||action==='send-order-brief'){
  const o=(S.cache.orders?.orders||[]).find(row=>row.id===id);if(!o)return flash('Pedido no encontrado',true);
  const message=adminOrderMessage(o);
  if(action==='copy-order-brief')return navigator.clipboard.writeText(message).then(()=>flash('Resumen copiado.'),()=>flash('No se pudo copiar.',true));
  const phone=String(o.customerPhone||'').replace(/\D/g,'');
  if(phone.length<8)return flash('El cliente no tiene un número de WhatsApp válido.',true);
  window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(message),'_blank','noopener,noreferrer');return;
 }
 if(action==='refresh')return load();
 if(action==='mode-centralone'||action==='mode-manual'){S.offerMode=action.split('-')[1];return drawOffers()}
 if(action==='save-game')return submitGameChanges();
 if(action==='reconcile-order')return withBusy(async()=>{const r=await request('/admin/reconcile-order',{method:'POST',body:{orderId:id}});flash('Estado del proveedor: '+(r.providerStatus||'desconocido')+'. Pedido: '+(r.orderStatus||'en revisión')+'.');await load('orders')});
 if(action==='edit-game')return changeGame(id);
 if(action==='cancel-edit-game'){S.editingGameId=null;drawGames();flash('Edición cancelada, ningún cambio guardado.');return}
 if(action==='customer-details')return openCustomer(id);
 if(action==='customer-reset')return openCustomerReset(id);
 if(action==='edit-offer')return openOfferEdit(id);
 if(action==='select-co'){S.product=id;if(S.page==='offers')drawOffers();else flash('Producto seleccionado. Abre Ofertas para vincularlo.');return}
 if(action==='search-co')return withBusy(async()=>{S.coFilter=String($('co-search-inline')?.value||$('co-search')?.value||'').trim();S.coKind=$('co-kind')?.value||S.coKind;const result=await request('/admin/centralone/catalog?q='+encodeURIComponent(S.coFilter)+'&kind='+encodeURIComponent(S.coKind));S.cache.coProducts=result.products||[];S.product=S.cache.coProducts[0]?.productId||null;S.page==='offers'?drawOffers():drawCentral();flash((result.total||0)+' productos encontrados en Central One.');});
 if(action==='sync-co')return withBusy(async()=>{if(!await modalConfirm('¿Sincronizar costos y disponibilidad? No se enviará ninguna compra.'))return;const res=await request('/admin/centralone/sync',{method:'POST',body:{}});flash(res.message||'Catálogo sincronizado');await load()});
 if(action==='restore-game')return withBusy(async()=>{await request('/admin/restore-game',{method:'POST',body:{id}});flash('Juego restaurado. Las ofertas permanecen como borradores.');await load()});
 if(action==='delete-game')return withBusy(async()=>{if(!await modalConfirm('¿Eliminar definitivamente este juego? Los pedidos históricos estarán protegidos.'))return;await request('/admin/delete-game',{method:'POST',body:{id,permanent:true}});flash('Juego eliminado');await load()});
 if(action==='delete-offer')return withBusy(async()=>{if(!await modalConfirm('¿Eliminar esta oferta definitivamente?'))return;await request('/admin/delete-offer',{method:'POST',body:{id,permanent:true}});flash('Oferta eliminada');await load()});
 if(action==='toggle-offer')return withBusy(async()=>{const o=(S.cache.offers||[]).find(x=>x.id===id);if(!o)return;if(!await modalConfirm((o.active?'Ocultar':'Publicar')+' esta oferta?'))return;await request('/admin/offer-visibility',{method:'POST',body:{id,visible:!o.active}});flash('Visibilidad actualizada');await load()});
 if(action==='verify-payment')return withBusy(async()=>{
 const o=(S.cache.orders?.orders||[]).find(x=>x.code===code);
 if(!o)throw Error('Actualiza los pedidos para consultar el comprobante.');
 if(o.method==='usdt_wallet'||o.method==='usdt_bep20')throw Error('Los pagos USDT deben verificarse mediante la blockchain.');
 if(!await modalConfirm('¿Has comprobado en tu cuenta el INGRESO REAL de '+money(o.amount)+' '+o.currency+'?\n'+
   (o.paymentReference?'Referencia aportada: '+o.paymentReference+'\n':'')+
   (o.sourcePhone?'Remitente saldo móvil: '+o.sourcePhone+'\n':'')+
   'No apruebes una captura o referencia sin revisar que recibiste el dinero. '+(o.kind==='topup'?'Al confirmar se intentará enviar la recarga a Central One con dinero real.':'')))return;
 const result=await request('/admin/verify-payment',{method:'POST',body:{code,confirmedPayment:true}});
 await load();flash(result.message||'Ingreso confirmado.',o.kind==='topup'&&result.autoDelivery!==true);
});
 if(action==='refund-order')return withBusy(async()=>{
   const reference=String(await RSDialog.prompt('Registra la referencia REAL del dinero que ya devolviste. No se hará ninguna transferencia desde aquí.')||'').trim();
   if(reference.length<4||reference.length>100)throw Error('La referencia del reembolso es obligatoria (4 a 100 caracteres).');
   if(!await modalConfirm('Confirma que YA devolviste los fondos del pedido '+code+'. Se guardará el estado Reembolsado y la referencia '+reference+'.'))return;
   await request('/admin/order-status',{method:'POST',body:{code,status:'refunded',refundReference:reference,note:'Reembolso realizado y comprobado por administración.'}});
   flash('Reembolso registrado. No se ejecutó ninguna transferencia desde el panel.');await load();
 });
 if(action==='reject-order')return withBusy(async()=>{if(!await modalConfirm('¿Rechazar el pedido '+code+'?'))return;await request('/admin/order-status',{method:'POST',body:{code,status:'rejected'}});flash('Pedido rechazado');await load()});
 if(action==='fulfill')return withBusy(async()=>{if(!await modalConfirm('¿Enviar el pedido pagado '+code+' a Central One? Esta operación puede gastar fondos REALES del proveedor.'))return;const r=await request('/admin/fulfill-order',{method:'POST',body:{code,paymentVerified:true}});flash(r.message||'Solicitud enviada. Comprueba el estado del proveedor.');await load()});
 if(action==='assign-pin')return openModal('Entregar PIN','<form id="pin-form"><input type="hidden" name="code" value="'+esc(code)+'"><label>PIN real del proveedor<input name="pin" minlength="4" maxlength="500" required autocomplete="off"></label><div class="form-actions"><button class="btn primary" type="submit">Guardar y entregar PIN</button></div></form>');
 if(action==='receipt')return withBusy(async()=>{const blob=await request('/admin/receipt?code='+encodeURIComponent(code),{blob:true});const url=URL.createObjectURL(blob);openModal('Comprobante de pago','<img alt="Comprobante del pedido" style="max-width:100%;max-height:70vh;object-fit:contain;display:block;margin:auto" src="'+esc(url)+'">');setTimeout(()=>URL.revokeObjectURL(url),60000);});
 if(action==='approve-deposit'||action==='reject-deposit')return withBusy(async()=>{if(!await modalConfirm(action==='approve-deposit'?'¿Comprobaste el pago REAL? Se acreditará saldo al revendedor.':'¿Rechazar este depósito pendiente?'))return;const result=await request('/admin/wallet-deposit/'+(action==='approve-deposit'?'approve':'reject'),{service:'reseller',method:'POST',body:{id}});flash(action==='approve-deposit'&&result?.result?.planActivated?'Depósito aprobado. Plan Gratis activado automáticamente.':'Depósito actualizado');await load()});
 if(action==='reseller-order'){const o=(S.cache.reseller?.orders||[]).find(x=>x.id===id);if(!o)return;return openModal('Pedido mayorista','<div class="record"><div><h3>'+esc(o.game)+' · '+esc(o.offer)+'</h3><small>'+esc(o.code)+' · '+esc(o.customerName)+' · '+usd(o.totalUsdt)+' USDT</small></div>'+status(o.status)+'</div><p class="spacer">Para enviar un pedido al proveedor debes confirmar primero que el pago está disponible y que Central One puede atenderlo.</p><div class="form-actions"><button class="btn secondary" data-action="reseller-order-process" data-id="'+esc(id)+'">Procesar</button><button class="btn primary" data-action="reseller-order-fulfill" data-id="'+esc(id)+'">Enviar a Central One</button></div>')};
 if(action==='reseller-order-process'||action==='reseller-order-fulfill')return withBusy(async()=>{const isFulfill=action.endsWith('fulfill');if(!await modalConfirm(isFulfill?'¿Enviar pedido a Central One? Puede gastar saldo real.':'¿Marcar pedido en procesamiento?'))return;await request('/admin/order/'+(isFulfill?'fulfill':'status'),{service:'reseller',method:'POST',body:isFulfill?{id}:{id,status:'processing'}});closeModal();flash('Pedido actualizado');await load()});
}
document.addEventListener('click',e=>{
 const el=e.target.closest('button[data-page],button[data-action]');
 if(!el||el.disabled)return;
 if(el.dataset.page){navigate(el.dataset.page);return}
 if(el.dataset.action)runAction(el.dataset.action,el).catch(guarded);
});
document.addEventListener('submit',async e=>{
 const form=e.target;if(!form?.id)return;e.preventDefault();
 if(form.id==='game-form'){await submitGameChanges();return}
 const data=Object.fromEntries(new FormData(form).entries());
 if(form.id==='admin-login')return withBusy(async()=>{
  const remember=form.elements.rememberSession?.checked!==false;
  try{localStorage.setItem('refills_shop_remember_session',String(remember));if(!remember)localStorage.removeItem('sb-kcgjlnymhmxylrjchcvl-auth-token')}catch{}
  S.rememberSession=remember;if(!S.client)S.client=createAdminClient();
  const phone=String(form.elements.country.value).replace(/\D/g,'')+String(form.elements.phone.value).replace(/\D/g,'');
  const email=phoneAlias(phone),password=String(data.password||'');
  const result=await S.client.auth.signInWithPassword({email,password});
  if(result.error)throw result.error;
  try{await verifyAdmin()}catch(err){if(err.status===403)await S.client.auth.signOut();throw err}
  form.reset();showConsole();flash('Acceso administrativo verificado.');
 });
 if(!S.user)return flash('Inicia sesión',true);
 await withBusy(async()=>{
  let r;
  if(form.id==='grant-plan-form'){if(!await modalConfirm('¿Conceder este nivel de revendedor sin cobrar al cliente?'))return;const result=await request('/admin/grant-plan',{service:'engagement',method:'POST',body:{userId:data.userId,tier:data.tier,requestId:data.requestId}});if(result.ok!==true)throw Error('No se confirmó el plan');closeModal();await load();flash('Plan concedido sin costo.');return}
  if(form.id==='rs-promo-form'){if(!await modalConfirm('¿Publicar el descuento con los límites indicados? Revisa primero que no venda por debajo de tu costo.'))return;await request('/admin/promos',{service:'engagement',method:'POST',body:{code:data.code,percent:Number(data.percent),maxUses:Number(data.maxUses),hours:Number(data.hours),firstPurchase:!!form.elements.firstPurchase.checked}});await load('rewards');flash('Promoción publicada');return}
  if(form.id==='provider-threshold-form'){const v=Number(data.threshold);if(!Number.isFinite(v)||v<0||v>100000)throw Error('Umbral inválido');S.balanceThreshold=v;S.providerLow=false;try{localStorage.setItem('rs_provider_balance_threshold',String(v))}catch{}await pollProviderBalance();const box=$('rs-provider-balance-box');if(box)box.innerHTML=providerBalancePanel();return}
  if(form.id==='rs-ticket-reply-form'){await request('/admin/tickets',{service:'engagement',method:'POST',body:{id:data.id,reply:data.reply,status:data.status}});closeModal();await load('tickets');flash('Respuesta guardada.');return}
  if(form.id==='reward-coupon-form'){r=await request('/admin/rewards/coupon',{method:'POST',body:{code:data.code,percent:Number(data.percent),maxUses:Number(data.maxUses),days:Number(data.days)}});}
  else if(form.id==='partner-key-form'){r=await request('/admin/rewards/api-key',{method:'POST',body:{label:data.label,ownerId:data.ownerId||''}});await load();const box=$('partner-new-key');if(box){box.hidden=false;box.innerHTML='<div class="alert-note"><strong>Guarda esta clave: se muestra una sola vez.</strong><input class="field" readonly value="'+esc(r.key)+'" style="width:100%;margin-top:8px" aria-label="Nueva clave API"></div>';}return;}
  else if(form.id==='link-offer-form'){const pid=S.product||data.productId;if(!pid)throw Error('Busca y selecciona un producto real de Central One.');r=await request('/admin/centralone/offer',{method:'POST',body:{gameId:data.gameId,productId:pid,displayName:data.displayName,gainSm:Number(data.gainSm),featured:!!data.featured}});}
  else if(form.id==='manual-offer-form'){r=await request('/admin/offer-manual',{method:'POST',body:{gameId:data.gameId,name:data.name,provider:'centralone',providerPriceUsdt:Number(data.providerPriceUsdt),gainSm:Number(data.gainSm)}});}
  else if(form.id==='edit-offer-form'){r=await request('/admin/offer-edit',{method:'POST',body:{id:data.id,gainSm:Number(data.gainSm)}});closeModal();}
  else if(form.id==='reset-customer-form'){if(!data.identityConfirmed)throw Error('Debes verificar la identidad del cliente.');r=await request('/admin/customer-password',{method:'POST',body:{userId:data.userId,password:data.password,identityConfirmed:true}});closeModal();}
  else if(form.id==='pin-form'){if(!await modalConfirm('¿Seguro que este es el PIN REAL del pedido?'))return;r=await request('/admin/pin/assign',{method:'POST',body:{code:data.code,pin:data.pin}});closeModal();}
  else if(form.id==='rates-form'){r=await request('/admin/settings',{method:'POST',body:{buySmPerUsdt:Number(data.buySmPerUsdt),cupPerSm:Number(data.cupPerSm),cardFee:Number(data.cardFee),planDays:Number(data.planDays),mobilePhone:data.mobilePhone,walletPhone:data.walletPhone,cardNumber:data.cardNumber,confirmPhone:data.confirmPhone,supportWhatsapp:data.supportWhatsapp,supportEmail:data.supportEmail,operatorName:data.operatorName,storeUsdtWalletAddress:data.storeUsdtWalletAddress,storeUsdtWalletEnabled:!!data.storeUsdtWalletEnabled,planPrice:null}});}
  else if(form.id==='commerce-form'){if(data.enabled&&!data.confirmRealFunds)throw Error('Confirma que estás habilitando operaciones con dinero real.');r=await request('/admin/commerce/settings',{method:'POST',body:{enabled:!!data.enabled,confirmRealFunds:!!data.confirmRealFunds,maxSupplierOrderUsdt:Number(data.maxSupplierOrderUsdt)}});}
  else if(form.id==='co-catalog-key'){r=await request('/admin/centralone/connect',{method:'POST',body:{apiKey:data.apiKey}});form.reset();}
  else if(form.id==='co-orders-key'){r=await request('/admin/centralone/orders/connect',{method:'POST',body:{apiKey:data.apiKey}});form.reset();}
  else return;
  flash(r?.message||'Cambios confirmados por Supabase.');await load();
 });
});
function filterVisibleRecords(value,root){
 const q=String(value||'').trim().toLowerCase();
 const container=root||$('admin-view');
 for(const item of container.querySelectorAll('.list > .record, .list > .surface')){
  item.hidden=!!q&&!item.textContent.toLowerCase().includes(q);
 }
}
document.addEventListener('input',e=>{
 if(e.target?.id==='bulk-margin'){S.bulkMargin=Number(e.target.value);updateBulkPreview();}
 if(e.target?.id==='region-margin-pct'){S.regionMarginPct=e.target.value===''?null:Number(e.target.value);updateRegionMarginPreview();}
 const id=e.target.id;
 if(id==='filter-games'){S.search=e.target.value;filterVisibleRecords(e.target.value,e.target.closest('.surface')||$('admin-view'))}
 if(id==='filter-offers'){S.offerSearch=e.target.value;filterVisibleRecords(e.target.value,e.target.closest('.surface')||$('admin-view'))}
 if(id==='filter-orders'){S.search=e.target.value;filterVisibleRecords(e.target.value,e.target.closest('.surface')||$('admin-view'))}
 if(id==='filter-customers'){S.search=e.target.value;filterVisibleRecords(e.target.value,e.target.closest('.surface')||$('admin-view'))}
});
document.addEventListener('change',e=>{
 if(e.target?.id==='region-margin-game'){S.regionGame=e.target.value;S.regionName='';S.regionMarginPct=null;drawOffers();return}
 if(e.target?.id==='region-margin-region'){S.regionGame=$('region-margin-game')?.value||'';S.regionName=e.target.value;S.regionMarginPct=null;drawOffers();return}
 if(e.target?.id==='bulk-family'){
  const family=e.target.value;S.bulkFamily=family;S.bulkRegion='';S.cache.bulkRegions=[];S.cache.bulkFamilySample=null;
  updateBulkPreview();const select=$('bulk-region');
  if(select){select.disabled=!family;select.innerHTML='<option value="">'+(family?'Consultando regiones…':'Selecciona familia primero')+'</option>'}
  if(family){void request('/admin/centralone/catalog?kind=all&family='+encodeURIComponent(family)+'&offset=0')
   .then(data=>{
    if(S.bulkFamily!==family)return;
    S.cache.bulkRegions=(data.regions||[]).filter(x=>typeof x==='string'&&x.trim());
    if(select){select.disabled=false;select.innerHTML='<option value="">Selecciona región</option>'+S.cache.bulkRegions.map(r=>'<option value="'+esc(r)+'">'+esc(r)+'</option>').join('')}
    updateBulkPreview();
   }).catch(err=>flash(err?.message||'No se pudieron consultar las regiones',true))}
 }
 if(e.target?.id==='bulk-region'){
  const family=S.bulkFamily,region=e.target.value;S.bulkRegion=region;S.cache.bulkFamilySample=null;updateBulkPreview();
  if(family&&region){void request('/admin/centralone/catalog?kind=all&family='+encodeURIComponent(family)+'&region='+encodeURIComponent(region)+'&offset=0')
   .then(data=>{if(S.bulkFamily!==family||S.bulkRegion!==region)return;S.cache.bulkFamilySample=(data.products||[]).find(p=>Number(p.resellerPrice)>0)||null;updateBulkPreview();const n=$('bulk-progress');if(n)n.textContent='Región '+region+': '+data.total+' ofertas del proveedor. Confirma antes de importar.'})
   .catch(err=>flash(err?.message||'No se pudieron consultar las ofertas de la región',true))}
 }
 if(e.target?.id==='bulk-game'){S.bulkGame=e.target.value;S.bulkMargin=Number((S.cache.games||[]).find(g=>g.id===S.bulkGame)?.marginPercent||0);$('bulk-margin').value=S.bulkMargin;updateBulkPreview()}
 if(e.target.id==='game-filter'){S.gameFilter=e.target.value;drawGames();filterVisibleRecords(S.search,$('game-filter')?.closest('.surface'))}
 if(e.target.id==='offer-filter'){S.offerFilter=e.target.value;drawOffers();filterVisibleRecords(S.offerSearch,$('offer-filter')?.closest('.surface'))}
 if(e.target.id==='co-kind')S.coKind=e.target.value;
 if(e.target.id==='co-selected-product')S.product=e.target.value;
});
$('refresh-view').addEventListener('click',()=>load());
$('refresh-all').addEventListener('click',()=>load());
$('sign-out').addEventListener('click',async()=>{await S.client.auth.signOut();for(const storage of [localStorage,sessionStorage]){storage.removeItem('refills_shop_supabase_session_v1');storage.removeItem('sb-kcgjlnymhmxylrjchcvl-auth-token');}location.replace('/REFILLSHOP/');});
$('modal-root').addEventListener('click',e=>{if(e.target.id==='modal-root')closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
window.addEventListener('hashchange',()=>{if(S.user){S.page=pageFromHash();navigate(S.page,true)}});
async function start(){
 S.client=createAdminClient();
 try{
  adminSession=readAdminSession();
  if(!adminSession)return showLogin('');
  await verifyAdmin();showConsole();
 }catch(err){showLogin(err.message)}
}
$('retry-auth').addEventListener('click',()=>void start());
start();
})();