/* Refills Shop v50 — frontend, pedidos y catálogo sin datos de demostración */


(()=>{'use strict';
const pictures=Object.freeze({}); // El catálogo en producción utiliza imágenes remotas; se retiraron las fotos demo incrustadas.
const I=(name,cls='')=>`<svg class="svg ${cls}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>Math.round(n).toLocaleString('es-ES');
const entry=(id,name,category,photo,offers,desc='',region='Global')=>({id,name,category,photo,offers:offers.map(([title,cup,bonus=''])=>({title,cup,bonus})),desc,region});
const ITEMS=[];
const labels={inicio:'Inicio',recargas:'Recargas',gift:'Gift Cards',pedidos:'Pedidos',perfil:'Perfil',revendedores:'Mayoristas',admin:'Administración',login:'Entrar'};
const icons={inicio:'home',recargas:'game',gift:'gift',pedidos:'file',perfil:'user',revendedores:'wallet',admin:'shield',login:'user'};
/* Los productos publicados provienen exclusivamente de Supabase; no cargar precios ni artículos de ejemplo. */
const getStored=(key,fallback)=>{try{return JSON.parse(localStorage.getItem('refills_shop_'+key)??localStorage.getItem('refills_mock_'+key))??fallback}catch{return fallback}};
const save=(key,data)=>{try{localStorage.setItem('refills_shop_'+key,JSON.stringify(data))}catch{}};
const RS_NOTICE_TTL=86400000;
(function pruneLocalNoticeState(){
 try{
  const last=Number(localStorage.getItem('refills_shop_changes_seen_at')||0);
  if(!last||Date.now()-last>=RS_NOTICE_TTL){
   localStorage.removeItem('refills_shop_changesSeen');
   localStorage.removeItem('refills_mock_changesSeen');
   localStorage.removeItem('refills_shop_changes_seen_at');
  }
 }catch{}
})();
/* El catálogo antiguo guardado en localStorage no se reintroduce. */
const s={page:'inicio',authMode:'login',authBusy:false,authError:'',rememberSession:(()=>{try{return localStorage.getItem('refills_shop_remember_session')!=='false'}catch{return true}})(),afterAuthPage:'inicio',authSession:null,profile:null,member:false,resellerPortal:null,resellerLoading:false,wholesalePrices:{},resellerOrders:[],resellerDeposits:[],resellerCurrency:'USDT',resellerDepositCurrency:'USDT',resellerDepositStage:'methods',detailId:null,search:'',filter:'todos',offerGroup:'recargas',regionChoice:null,playerTargets:{},playerCheck:null,resellerPreview:null,resellerPreviewTier:'free',sort:'name',payment:'cup',selected:0,player:'',checkoutSession:null,qty:1,modal:null,usdtPayment:null,recentTopups:[],recentTopupsLoaded:false,changes:[],changesLoaded:false,changesLastSeen:getStored('changesSeen',0),changesLastToast:0, nickname:getStored('nickname','Invitado'),favorites:getStored('favs',[]),orders:[],cart:getStored('cart',[]),showFavs:false,selectedOrder:null, role:(window.REFILLS_SESSION&&window.REFILLS_SESSION.role)||'guest', user:(window.REFILLS_SESSION&&window.REFILLS_SESSION.user)||null,
rates:getStored('rates',{usdtSm:300,smCup:3,gainSM:0}), adminTab:'resumen',
adminOrders:getStored('adminOrders',[]), reseller:getStored('reseller',{plan:null,wallet:{USDT:0,CUP:0,SM:0},ledger:[]}),
paymentConfig:getStored('paymentConfig',{smReceiver:'',cupCard:'',cupConfirmPhone:'',usdtAddress:'',usdtEnabled:false,whatsappNumber:''}),
checkoutStep:1,checkoutProof:'',checkoutSource:'',checkoutMethod:'CUP',paymentReturnModal:null,
adminUsers:getStored('adminUsers',[]), resellerPlans:getStored('resellerPlans',[
{name:'Gratis',margin:7,price:0,days:0},{name:'Level 2',margin:4,price:.8,days:7},{name:'Level 3',margin:2,price:1.5,days:15}])};

/* REFILLS SHOP v51 · Avisos verificados para pedidos, catálogo y cuenta. */
const rsNotice={
 uid:null,items:[],seenAt:0,orderState:{},orderReady:false,resellerState:{},resellerReady:false,
 soundEnabled:getStored('notice_sound',true)===true,
 smoothMode:getStored('smooth_mode',true)!==false,
 audio:null,audioUnlocked:false,lastSoundAt:0,sequence:0,
 publicSeenId:(()=>{try{return Number(localStorage.getItem('refills_shop_public_event_last_v51')||0)}catch{return 0}})(),
 publicReady:false,pollOrders:null,pollReseller:null,pollChanges:null
};
const rsNoticeStoreKey=uid=>'refills_shop_account_notices_v51_'+uid;
function rsNoticeAccount(){
 const uid=String(s.user?.id||'');
 if(!uid){rsNotice.uid=null;rsNotice.items=[];rsNotice.orderState={};rsNotice.orderReady=false;rsNotice.resellerState={};rsNotice.resellerReady=false;return}
 if(rsNotice.uid===uid)return;
 rsNotice.uid=uid;
 let data={};
 try{data=JSON.parse(localStorage.getItem(rsNoticeStoreKey(uid))||'{}')||{}}catch{}
 rsNotice.items=Array.isArray(data.items)?data.items.filter(x=>x&&typeof x.title==='string'&&Number.isFinite(Number(x.ts))).slice(0,55):[];
 rsNotice.seenAt=Number(data.seenAt||0);
 rsNotice.orderState=data.orderState&&typeof data.orderState==='object'?data.orderState:{};
 rsNotice.orderReady=Object.keys(rsNotice.orderState).length>0;
 rsNotice.resellerState=data.resellerState&&typeof data.resellerState==='object'?data.resellerState:{};
 rsNotice.resellerReady=Object.keys(rsNotice.resellerState).length>0;
}
function rsSaveNotices(){
 if(!rsNotice.uid)return;
 try{localStorage.setItem(rsNoticeStoreKey(rsNotice.uid),JSON.stringify({
  items:rsNotice.items.slice(0,50),seenAt:rsNotice.seenAt,
  orderState:rsNotice.orderState,resellerState:rsNotice.resellerState
 }))}catch{}
}
function rsUnreadNotices(){
 const personal=rsNotice.items.filter(x=>Number(x.ts)>rsNotice.seenAt).length;
 const publicCount=(s.changes||[]).filter(e=>Number(e.id||0)>Number(s.changesLastSeen||0)).length;
 return personal+publicCount;
}
function rsMarkNoticesRead(){
 const now=Date.now();rsNotice.seenAt=now;
 s.changesLastSeen=Math.max(Number(s.changesLastSeen||0),Number(s.changes?.[0]?.id||0));
 save('changesSeen',s.changesLastSeen);
 try{localStorage.setItem('refills_shop_changes_seen_at',String(now))}catch{}
 rsSaveNotices();updateChangeBadge();
}
function rsUnlockNoticeSound(){
 if(!rsNotice.soundEnabled)return;
 const Context=window.AudioContext||window.webkitAudioContext;
 if(!Context)return;
 try{
  if(!rsNotice.audio)rsNotice.audio=new Context();
  if(rsNotice.audio.state==='suspended')void rsNotice.audio.resume().then(()=>{rsNotice.audioUnlocked=true}).catch(()=>{});
  else rsNotice.audioUnlocked=true;
 }catch{}
}
function rsPlayNoticeSound(kind='message'){
 if(!rsNotice.soundEnabled||!rsNotice.audio||rsNotice.audio.state!=='running')return;
 const now=Date.now();
 if(now-rsNotice.lastSoundAt<900)return;
 rsNotice.lastSoundAt=now;
 try{
  const ctx=rsNotice.audio;
  const sequence=kind==='completed'?[660,830,1046]:kind==='warning'?[500,350]:[670,790];
  const start=ctx.currentTime+.018;
  sequence.forEach((freq,i)=>{
   const osc=ctx.createOscillator(),gain=ctx.createGain(),t=start+i*.135;
   osc.type='sine';osc.frequency.value=freq;
   gain.gain.setValueAtTime(.0001,t);
   gain.gain.exponentialRampToValueAtTime(.095,t+.018);
   gain.gain.exponentialRampToValueAtTime(.0001,t+.115);
   osc.connect(gain);gain.connect(ctx.destination);
   osc.start(t);osc.stop(t+.128);
  });
 }catch(error){console.warn('Sonido Refills:',error?.message||error)}
}
function rsSystemNotice(title,detail,id){
 if(typeof Notification==='undefined'||Notification.permission!=='granted')return;
 const options={body:String(detail||'').slice(0,160),icon:'/REFILLSHOP/assets/refills-app-192.png',
  badge:'/REFILLSHOP/assets/refills-app-192.png',tag:'refills-'+String(id).slice(0,65),renotify:false};
 if('serviceWorker' in navigator){
  void navigator.serviceWorker.getRegistration('/REFILLSHOP/').then(reg=>{
   if(reg?.showNotification)return reg.showNotification(title,options);
   if(!/Android/i.test(navigator.userAgent))new Notification(title,options);
  }).catch(()=>{});
 }else if(!/Android/i.test(navigator.userAgent)){
  try{new Notification(title,options)}catch{}
 }
}
function rsAddNotice(kind,title,detail,sound='message'){
 if(!s.user)return;
 rsNoticeAccount();
 const ts=Date.now(),id=String(ts)+'-'+(++rsNotice.sequence);
 const notice={id,kind:String(kind||'store').slice(0,30),title:String(title||'Refills Shop').slice(0,120),
  detail:String(detail||'').slice(0,230),ts};
 rsNotice.items.unshift(notice);
 rsNotice.items=rsNotice.items.slice(0,50);
 rsSaveNotices();
 updateChangeBadge();
 if(s.modal==='alerts'&&document.activeElement?.tagName!=='BUTTON')modal();
 if(sound!=='silent')rsPlayNoticeSound(sound);
 rsSystemNotice(notice.title,notice.detail,id);
 if(kind==='completed')toast(notice.title+' · '+notice.detail);
}
function rsTrackOrders(list){
 if(!s.user)return;
 rsNoticeAccount();
 const next={...rsNotice.orderState},wasReady=rsNotice.orderReady;
 let shown=0;
 for(const o of list.slice(0,100)){
  const key=String(o.id||o.ref||'');if(!key)continue;
  const current={status:String(o.status||''),payment:String(o.paymentStatus||'')};
  const previous=next[key];
  next[key]=current;
  if(!wasReady||!previous||shown>=4)continue;
  const code=String(o.ref||'').slice(0,32);
  const game=String(o.gameName||'Producto digital').slice(0,70);
  if(previous.status!==current.status){
   if(current.status==='completed'){
    rsAddNotice('completed','Recarga completada',game+' · Pedido '+code,'completed');shown++;
   }else if(['failed','rejected','cancelled','refunded'].includes(current.status)){
    rsAddNotice('warning','Revisa tu pedido',game+' · Pedido '+code+' · '+clientOrderStatus(current.status).label,'warning');shown++;
   }else if(current.status==='processing'){
    rsAddNotice('order','Pedido en proceso',game+' · Pedido '+code,'silent');shown++;
   }
  }else if(previous.payment!==current.payment&&current.payment==='paid'){
   rsAddNotice('payment','Pago confirmado',game+' · Pedido '+code,'message');shown++;
  }
 }
 rsNotice.orderState=Object.fromEntries(Object.entries(next).slice(-150));
 rsNotice.orderReady=true;rsSaveNotices();
}
function rsTrackReseller(orders=[],deposits=[],wallet=null,plan=''){
 if(!s.user)return;
 rsNoticeAccount();
 const next={orders:{},deposits:{},wallet:wallet&&typeof wallet==='object'?wallet:{},plan:String(plan||'')};
 for(const o of orders.slice(0,90)){const id=String(o.id||o.code||'');if(id)next.orders[id]=String(o.status||'')}
 for(const d of deposits.slice(0,90)){const id=String(d.id||d.code||'');if(id)next.deposits[id]=String(d.status||'')}
 const last=rsNotice.resellerState;
 if(rsNotice.resellerReady){
  let shown=0;
  for(const o of orders.slice(0,90)){
   const id=String(o.id||o.code||'');const a=last.orders?.[id],b=next.orders[id];
   if(a&&a!==b&&shown<3){
    if(b==='completed'){rsAddNotice('completed','Pedido mayorista completado','Tu pedido de revendedor fue entregado.','completed');shown++}
    else if(['failed','rejected','cancelled'].includes(b)){rsAddNotice('warning','Pedido mayorista con incidencia','Consulta el historial mayorista.','warning');shown++}
   }
  }
  for(const d of deposits.slice(0,90)){
   const id=String(d.id||d.code||'');const a=last.deposits?.[id],b=next.deposits[id];
   if(a&&a!==b&&shown<4){
    if(['approved','completed','credited'].includes(b)){rsAddNotice('wallet','Depósito acreditado','Tu monedero de revendedor se ha actualizado.','completed');shown++}
    else if(['rejected','failed'].includes(b)){rsAddNotice('warning','Depósito no aprobado','Revisa tu solicitud de depósito.','warning');shown++}
   }
  }
  if(last.plan&&next.plan&&last.plan!==next.plan&&shown<4)rsAddNotice('membership','Plan de revendedor actualizado','Tu cuenta ahora tiene el plan '+next.plan+'.','message');
  const grew=Object.keys(next.wallet||{}).filter(currency=>{
   const before=Number(last.wallet?.[currency]);
   const after=Number(next.wallet[currency]);
   return Number.isFinite(before)&&before>=0&&Number.isFinite(after)&&after-before>.01;
  });
  if(grew.length&&shown===0)rsAddNotice('wallet','Saldo de la wallet actualizado','Tienes saldo nuevo en '+grew.slice(0,3).join(', ')+'.','message');
 }
 rsNotice.resellerState=next;rsNotice.resellerReady=true;rsSaveNotices();
}
async function rsPollResellerEvents(){
 if(!s.user||!s.member||rsNotice.pollReseller)return;
 const uid=s.user.id;
 rsNotice.pollReseller=(async()=>{
  try{
   const [orders,deposits,portal]=await Promise.all([
    edgeRequest('rs12-reseller','/orders',{auth:true}),
    edgeRequest('rs12-reseller','/wallet/deposits',{auth:true}),
    edgeRequest('rs12-reseller','/portal',{auth:true})
   ]);
   if(s.user?.id!==uid)return;
   const items=Array.isArray(orders?.orders)?orders.orders:[];
   const funds=Array.isArray(deposits?.deposits)?deposits.deposits:[];
   const tier=String(portal?.membership?.planTier||'free');
   const plan=tier==='level2'?'Level 2':tier==='level3'?'Level 3':'Gratis';
   const wallet=portal?.wallet||s.reseller?.wallet||{};
   s.reseller={...s.reseller,plan,wallet:{USDT:Number(wallet.USDT||0),CUP:Number(wallet.CUP||0),SM:Number(wallet.SM||0)}};
   s.resellerOrders=items;s.resellerDeposits=funds;
   rsTrackReseller(items,funds,s.reseller.wallet,plan);
   if(s.page==='revendedores'&&!s.modal)render();
  }catch(error){console.warn('Avisos mayoristas:',error?.message||error)}
 })().finally(()=>{rsNotice.pollReseller=null});
 return rsNotice.pollReseller;
}
async function rsRequestSystemNotices(){
 if(typeof Notification==='undefined'){toast('Tu navegador no admite avisos de sistema. La campana seguirá funcionando.');return}
 if(!window.isSecureContext){toast('Los avisos necesitan conexión HTTPS.');return}
 try{
  const permission=await Notification.requestPermission();
  if(permission==='granted')toast('Avisos del teléfono activados mientras Refills Shop esté abierta.');
  else toast('El permiso no está activo. Puedes consultar los avisos en la campana.');
 }catch{toast('No se pudo activar el permiso de avisos en este navegador.')}
 if(s.modal==='alerts')modal();
}
function rsNotificationModal(){
 const publicEvents=(s.changes||[]).map(e=>({
  id:'public-'+e.id,kind:e.kind||'store',title:e.title||'Noticia de la tienda',detail:e.detail||'',
  ts:Date.parse(e.createdAt||'')||0,category:'Tienda'
 }));
 const personal=rsNotice.items.map(n=>({...n,category:['completed','order','payment'].includes(n.kind)?'Mis pedidos':['wallet','membership'].includes(n.kind)?'Mi cuenta':'Aviso'}));
 const items=[...personal,...publicEvents].sort((a,b)=>b.ts-a.ts).slice(0,45);
 const permission=typeof Notification==='undefined'?'unsupported':Notification.permission;
 return modalTitle('Notificaciones','Pedidos, pagos, revendedores y novedades de la tienda')+
  '<section class="rs-notify-center">'+
   '<div class="rs-notify-controls">'+
    '<button type="button" class="btn secondary small" data-action="rs-notice-sound">'+I(rsNotice.soundEnabled?'bell':'settings','tiny')+' Sonidos: '+(rsNotice.soundEnabled?'Sí':'No')+'</button>'+
    '<button type="button" class="btn secondary small" data-action="rs-notice-system" '+(permission==='unsupported'||permission==='denied'?'disabled':'')+'>'+I('bell','tiny')+' '+(permission==='granted'?'Avisos permitidos':'Activar avisos del móvil')+'</button>'+
    '<button type="button" class="btn ghost small" data-action="rs-notice-refresh">Actualizar</button>'+
    '<button type="button" class="btn ghost small" data-action="rs-notice-smooth">'+(rsNotice.smoothMode?'Modo fluido: Sí':'Modo fluido: No')+'</button>'+
   '</div>'+
   '<p class="rs-notify-caption">Los avisos son reales y se actualizan cuando la web está abierta. Los sonidos necesitan que hayas tocado la pantalla. No son notificaciones push con la aplicación cerrada.</p>'+
   (permission==='denied'?'<p class="rs-notify-denied">Android/Chrome bloqueó los avisos de sistema. Puedes cambiarlo desde los permisos del sitio.</p>':'')+
   (items.length?'<div class="rs-notify-items">'+items.map(n=>{
    const isNew=n.category==='Tienda'?Number(n.id.split('-')[1])>Number(s.changesLastSeen||0):Number(n.ts)>rsNotice.seenAt;
    const link=n.category==='Mis pedidos'?'pedidos':n.category==='Mi cuenta'?'revendedores':null;
    return '<article class="rs-notify-item '+(isNew?'unread':'')+'"><div class="rs-notify-symbol">'+I(n.kind==='completed'?'check':n.kind==='warning'?'info':n.kind==='wallet'?'wallet':n.kind==='payment'?'credit':n.kind==='offer_new'?'plus':'bell','tiny')+'</div><div class="rs-notify-item-copy"><div class="rs-notify-item-top"><span>'+esc(n.category)+'</span><small>'+esc(formatShopDateTime(n.ts))+'</small></div><strong>'+esc(n.title)+'</strong><p>'+esc(n.detail)+'</p>'+(link?'<button type="button" data-action="rs-notice-open" data-page="'+link+'">Ver '+(link==='pedidos'?'pedido':'cuenta')+' '+I('arrow','tiny')+'</button>':'')+'</div></article>';
   }).join('')+'</div>':'<div class="rs-notify-empty">'+I('bell')+'<h3>No hay avisos todavía</h3><p>Los cambios de la tienda y de tus pedidos aparecerán aquí.</p></div>')+
  '</section>';
}
function rsMeasureFPS(){
 const el=document.getElementById('rs-fps-result');
 if(!el)return;
 if(document.visibilityState!=='visible'){el.textContent='Abre la app en primer plano para medir la fluidez.';return}
 el.textContent='Midiendo durante 2 segundos…';
 const start=performance.now();let count=0,prev=0,missed=0;
 const frame=t=>{
  if(document.visibilityState!=='visible')return;
  if(prev>0&&t-prev>34)missed++;
  prev=t;count++;
  if(t-start<2000){requestAnimationFrame(frame);return}
  const rate=Math.round((count-1)*1000/Math.max(1,t-start));
  const target=document.getElementById('rs-fps-result');
  if(target)target.textContent='Pantalla: ~'+rate+' FPS observados · '+missed+' pausas de más de 34 ms. No se pueden forzar 90 Hz en pantallas de 60 Hz.';
 };
 requestAnimationFrame(frame);
}
function rsApplyPerformancePreference(){
 document.body.classList.toggle('rs-lite-motion',rsNotice.smoothMode);
}

const itemBy=id=>ITEMS.find(g=>g.id===id),photo=g=>(g?.imageUrl&&/^https:\/\//i.test(g.imageUrl)?g.imageUrl:pictures[g?.photo]||REFILLS_WALLET_MARK),minPrice=g=>Math.min(...(g.offers||[]).map(o=>Number(o.cup)||Infinity));
/* Autenticación de Refills Shop: reutiliza los alias telefónicos de la web anterior. */
const RS_SUPABASE_URL='https://kcgjlnymhmxylrjchcvl.supabase.co';
const RS_SUPABASE_KEY='sb_publishable_sGK_1a5Tp8gY83KI8wiSZg_LP5uxGdc';
const RS_AUTH_STORE='refills_shop_supabase_session_v1';
const RS10_BASE=RS_SUPABASE_URL+'/functions/v1/rs10-api';
const RS12_BASE=RS_SUPABASE_URL+'/functions/v1/rs12-reseller';
const RS_COUNTRIES=[
 ['+53','Cuba +53'],['+1','Estados Unidos / Canadá +1'],['+52','México +52'],['+57','Colombia +57'],
 ['+58','Venezuela +58'],['+34','España +34'],['+54','Argentina +54'],['+55','Brasil +55'],
 ['+56','Chile +56'],['+51','Perú +51'],['+593','Ecuador +593'],['+507','Panamá +507'],
 ['+44','Reino Unido +44'],['+33','Francia +33'],['+49','Alemania +49'],['+39','Italia +39'],
 ['+351','Portugal +351'],['+598','Uruguay +598'],['+595','Paraguay +595'],['+591','Bolivia +591'],
 ['+506','Costa Rica +506'],['+503','El Salvador +503'],['+502','Guatemala +502'],['+504','Honduras +504'],
 ['+505','Nicaragua +505'],['+509','Haití +509'],['+31','Países Bajos +31'],['+32','Bélgica +32'],
 ['+353','Irlanda +353'],['+61','Australia +61'],['+64','Nueva Zelanda +64'],['+971','Emiratos Árabes +971']
];
function authStoredSession(){
 try{
  const own=JSON.parse(localStorage.getItem(RS_AUTH_STORE)||'null');
  if(own?.access_token&&own?.refresh_token){s.rememberSession=true;return own}
  const old=JSON.parse(localStorage.getItem('sb-kcgjlnymhmxylrjchcvl-auth-token')||'null');
  const legacy=old?.currentSession||old?.session||old;
  if(legacy?.access_token&&legacy?.refresh_token){s.rememberSession=true;return legacy}
  const tab=JSON.parse(sessionStorage.getItem(RS_AUTH_STORE)||'null');
  if(tab?.access_token&&tab?.refresh_token){s.rememberSession=false;return tab}
  return null;
 }catch{return null}
}
function saveAuthSession(data,remember=s.rememberSession!==false){
 const expiresAt=Number(data.expires_at||0)||Math.floor(Date.now()/1000)+Number(data.expires_in||3600);
 s.authSession={...data,expires_at:expiresAt};s.rememberSession=!!remember;
 try{
  localStorage.setItem('refills_shop_remember_session',String(s.rememberSession));
  if(s.rememberSession){
   localStorage.setItem(RS_AUTH_STORE,JSON.stringify(s.authSession));
   localStorage.setItem('sb-kcgjlnymhmxylrjchcvl-auth-token',JSON.stringify(s.authSession));
   sessionStorage.removeItem(RS_AUTH_STORE);
  }else{
   localStorage.removeItem(RS_AUTH_STORE);localStorage.removeItem('sb-kcgjlnymhmxylrjchcvl-auth-token');
   sessionStorage.setItem(RS_AUTH_STORE,JSON.stringify(s.authSession));
  }
 }catch{}
 return s.authSession;
}
function clearAuthSession(){
 s.authSession=null;
 try{localStorage.removeItem(RS_AUTH_STORE);localStorage.removeItem('sb-kcgjlnymhmxylrjchcvl-auth-token');sessionStorage.removeItem(RS_AUTH_STORE)}catch{}
}
async function authRequest(path,{method='GET',body,token}={}){
 const headers={apikey:RS_SUPABASE_KEY,Accept:'application/json'};
 if(body!==undefined)headers['Content-Type']='application/json';
 if(token)headers.Authorization='Bearer '+token;
 let response;
 try{response=await fetch(RS_SUPABASE_URL+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),credentials:'omit',cache:'no-store'})}
 catch{throw Error('No se pudo conectar con el servicio de cuentas. Comprueba tu conexión.')}
 const data=await response.json().catch(()=>({}));
 if(!response.ok){const err=new Error(data.msg||data.message||data.error_description||data.error||'No se pudo completar la autenticación.');err.status=response.status;throw err}
 return data;
}
async function validAuthSession(){
 if(!s.authSession)s.authSession=authStoredSession();
 let session=s.authSession;
 if(!session?.access_token||!session?.refresh_token)return null;
 if(Number(session.expires_at||0)<Math.floor(Date.now()/1000)+90){
  try{
   const refreshed=await authRequest('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token}});
   session=saveAuthSession(refreshed);
  }catch{clearAuthSession();return null}
 }
 return session;
}
async function edgeRequest(service,path,{method='GET',body,auth=true}={}){
 const base=service==='rs12-reseller'?RS12_BASE:RS10_BASE;
 const headers={apikey:RS_SUPABASE_KEY,Accept:'application/json'};
 if(body!==undefined)headers['Content-Type']='application/json';
 if(auth){
  const session=await validAuthSession();
  if(!session?.access_token)throw Error('Tu sesión expiró. Inicia sesión otra vez.');
  headers.Authorization='Bearer '+session.access_token;
 }
 let response;
 try{response=await fetch(base+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),credentials:'omit',cache:'no-store'})}
 catch{throw Error('No se pudo conectar con Refills Shop. Comprueba tu conexión.')}
 const data=await response.json().catch(()=>({}));
 if(!response.ok){const err=new Error(data.error||data.message||'Servicio temporalmente no disponible.');err.status=response.status;throw err}
 return data;
}
function phoneFromAuthForm(form){
 const code=String(form.elements.countryCode?.value||'').trim();
 const local=String(form.elements.phone?.value||'').replace(/[^0-9]/g,'');
 if(!/^\+[1-9][0-9]{0,2}$/.test(code)||local.length<5||local.length>12)throw Error('Selecciona tu país e introduce un número válido.');
 if(code==='+53'&&!/^[56][0-9]{7}$/.test(local))throw Error('Para Cuba, introduce 8 dígitos y comienza por 5 o 6.');
 if(code==='+1'&&local.length!==10)throw Error('Para +1, introduce un número de 10 dígitos.');
 const digits=code.slice(1)+local;
 if(digits.length<8||digits.length>15)throw Error('Revisa el prefijo y el número de teléfono.');
 return code+local;
}
function phoneEmailAlias(phone){
 const digits=String(phone).replace(/[^0-9]/g,'');
 return (digits.startsWith('53')&&digits.length===10?'cu':'tel')+digits+'@refillshop.pages.dev';
}
function newRequestId(){
 try{if(crypto.randomUUID)return crypto.randomUUID()}catch{}
 return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==='x'?r:(r&3|8)).toString(16)});
}
async function signInWithPhone(phone,password,remember=s.rememberSession){
 const data=await authRequest('/auth/v1/token?grant_type=password',{method:'POST',body:{email:phoneEmailAlias(phone),password}});
 saveAuthSession(data,remember);
 const user=await authRequest('/auth/v1/user',{token:data.access_token});
 s.authSession.user=user;
 await loadAccountProfile(user);
 return user;
}
async function loadAccountProfile(authUser=s.authSession?.user){
 if(!authUser)return null;
 const data=await edgeRequest('rs10-api','/profile',{auth:true});
 s.profile=data.profile||null;
 s.member=!!data.resellerActive;
 const name=data.profile?.fullName||authUser.user_metadata?.full_name||'Cliente';
 s.nickname=name;
 s.user={id:authUser.id,name,phone:data.profile?.phone||'',email:'',app_metadata:authUser.app_metadata||{}};
 rsNoticeAccount();
 s.role=authUser.app_metadata?.role==='refills_admin'?'admin':(s.member?'reseller':'customer');
 void loadCustomerOrders();
 if(s.member)await loadResellerPortal(true,false);
 else{s.resellerPortal=null;s.wholesalePrices={};s.reseller={...s.reseller,plan:null,wallet:{USDT:0,CUP:0,SM:0}}}
 return data;
}
async function loadResellerPortal(silent=false,rerender=true){
 if(!s.user){s.afterAuthPage='revendedores';s.page='login';s.authMode='login';if(rerender)render(true);return null}
 s.resellerLoading=true;
 if(rerender&&s.page==='revendedores')render();
 try{
  const portal=await edgeRequest('rs12-reseller','/portal',{auth:true});
  s.resellerPortal=portal;
  const tier=String(portal.membership?.planTier||'free');
  const planName=tier==='level2'?'Level 2':tier==='level3'?'Level 3':'Gratis';
  s.reseller={...s.reseller,plan:planName,wallet:{USDT:Number(portal.wallet?.USDT||0),CUP:Number(portal.wallet?.CUP||0),SM:Number(portal.wallet?.SM||0)}};
  s.member=true;
  if(s.role!=='admin')s.role='reseller';
  s.resellerPlans=(portal.tiers||[]).map(t=>({tier:t.tier,name:t.tier==='free'?'Gratis':t.name,margin:Number(t.markupPercent||0),price:Number(t.priceUsdt||0),days:Number(t.days||0),refresh:t.refresh}));
  const [orders,deposits]=await Promise.all([
   edgeRequest('rs12-reseller','/orders',{auth:true}).catch(()=>({orders:[]})),
   edgeRequest('rs12-reseller','/wallet/deposits',{auth:true}).catch(()=>({deposits:portal.deposits||[]}))
  ]);
  s.resellerOrders=orders.orders||[];
  try{const wholesale=await edgeRequest('rs12-reseller','/storefront',{auth:true});s.wholesalePrices=Object.fromEntries((wholesale.offers||[]).filter(x=>x.id&&x.inStock).map(x=>[x.id,x]));}
  catch(error){s.wholesalePrices={};console.warn('Mayorista no disponible:',error?.message||error);}
  s.resellerDeposits=deposits.deposits||portal.deposits||[];
  rsTrackReseller(s.resellerOrders,s.resellerDeposits,s.reseller?.wallet,s.reseller?.plan);
  return portal;
 }catch(error){
  if(!silent)toast(error.message||'No se pudo cargar el portal de revendedores.');
  return null;
 }finally{
  s.resellerLoading=false;
  if(rerender&&s.page==='revendedores')render();
 }
}
async function handleAuthSubmit(form){
 if(s.authBusy)return;
 const registering=s.authMode==='register';
 const button=form.querySelector('[type="submit"]');
 s.authBusy=true;s.authError='';
 if(button){button.disabled=true;button.textContent=registering?'Creando cuenta…':'Comprobando cuenta…'}
 try{
  const phone=phoneFromAuthForm(form),password=String(form.elements.password?.value||'');
  if(registering){
   const fullName=String(form.elements.fullName?.value||'').trim().replace(/\s+/g,' ');
   if(fullName.length<2||fullName.length>90)throw Error('Escribe tu nombre completo.');
   if(password.length<10||password.length>72||!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(password)||!/[0-9]/.test(password))throw Error('La contraseña debe tener al menos 10 caracteres, letras y números.');
   if(String(form.elements.website?.value||''))return;
   await edgeRequest('rs10-api','/auth/phone-register',{method:'POST',auth:false,body:{fullName,phone,password,website:''}});
  }
  const remember=registering?s.rememberSession:form.elements.rememberSession?.checked!==false;
  await signInWithPhone(phone,password,remember);
  const destination=s.afterAuthPage&&s.afterAuthPage!=='login'?s.afterAuthPage:'inicio';
  s.page=destination;
  if(destination==='revendedores'&&!s.resellerPortal)await loadResellerPortal(true,false);
  if(destination==='admin'&&s.role!=='admin')s.page='inicio';
  s.authMode='login';s.authError='';
  render(true);
  toast(registering?'Cuenta creada. Ya puedes usar Refills Shop.':'Bienvenido de nuevo a Refills Shop.');
 }catch(error){
  const msg=String(error.message||'');
  s.authError=registering&&(/ya está registrado|already.registered|already exists|Ese teléfono ya está registrado/i.test(msg)||error.status===409)
   ?'Este número ya tiene una cuenta. Selecciona «Iniciar sesión».'
   :(!registering&&[400,401].includes(error.status)?'Número o contraseña incorrectos.':msg);
  if(error.status===429)s.authError='Se alcanzó el límite de registros. Espera un momento antes de intentarlo otra vez.';
  render();
 }finally{
  s.authBusy=false;
  const current=document.querySelector('#auth-form [type="submit"]');
  if(current){current.disabled=false;current.textContent=s.authMode==='register'?'Crear mi cuenta':'Iniciar sesión'}
 }
}
async function signOutRefills(){
 try{const session=await validAuthSession();if(session?.access_token)await authRequest('/auth/v1/logout',{method:'POST',token:session.access_token})}catch{}
 clearAuthSession();s.user=null;rsNoticeAccount();s.profile=null;s.member=false;s.role='guest';s.resellerPortal=null;s.reseller={...s.reseller,plan:null,wallet:{USDT:0,CUP:0,SM:0}};s.page='login';s.authMode='login';s.afterAuthPage='inicio';s.modal=null;render(true);toast('Has cerrado tu sesión.');
}
async function activateResellerPlan(tier){
 if(!s.user){s.afterAuthPage='revendedores';navigate('login');return}
 const currency=document.getElementById('reseller-currency')?.value||s.resellerCurrency||'USDT';
 const btn=document.querySelector(`[data-action="reseller-subscribe"][data-tier="${tier}"]`);
 if(btn){btn.disabled=true;btn.textContent='Activando…'}
 try{
  const result=await edgeRequest('rs12-reseller','/subscribe',{method:'POST',auth:true,body:{tier,currency,clientRequestId:newRequestId()}});
  if(result.ok!==true)throw Error(result.error||'No se pudo activar el plan.');
  await loadResellerPortal(true,false);
  render();
  toast(`Plan ${tier==='level2'?'Level 2':'Level 3'} activado. Se descontó ${Number(result.charged||0).toLocaleString('es-ES')} ${result.currency||currency} de tu wallet.`);
 }catch(error){toast(error.message||'No se pudo activar el plan.')}
 finally{const current=document.querySelector(`[data-action="reseller-subscribe"][data-tier="${tier}"]`);if(current)current.disabled=false}
}
function readFileAsDataUrl(file){
 return new Promise((resolve,reject)=>{
  if(!file)return resolve(null);
  if(file.size>5*1024*1024)return reject(Error('El comprobante no puede superar 5 MB.'));
  const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=()=>reject(Error('No se pudo leer el comprobante.'));reader.readAsDataURL(file);
 });
}
async function submitResellerDeposit(){
 const currency=document.getElementById('wallet-currency')?.value||'USDT';
 const amount=Number(document.getElementById('wallet-amount')?.value||0);
 const senderPhone=String(document.getElementById('wallet-sender')?.value||'').trim();
 const txHash=String(document.getElementById('wallet-txhash')?.value||'').trim();
 const file=document.getElementById('wallet-proof')?.files?.[0]||null;
 const button=document.querySelector('[data-action="reseller-deposit-submit"]');
 if(!Number.isFinite(amount)||amount<=0){toast('Introduce un importe válido.');return}
 if(s.resellerPortal?.membership?.activationRequired){const sm=Number(s.resellerPortal.rates?.buySmPerUsdt||0),cup=Number(s.resellerPortal.rates?.cupPerSm||0),equiv=currency==='USDT'?amount:currency==='SM'?amount/sm:amount/(sm*cup);if(!Number.isFinite(equiv)||equiv<5){toast('El primer depósito debe ser equivalente a 5.00 USDT o más.');return}}
 if(currency!=='USDT'&&!Number.isInteger(amount)){toast('Los importes en CUP y saldo móvil deben ser números enteros.');return}
 if(currency==='USDT'&&!txHash&&!file){toast('Adjunta el comprobante o introduce el hash USDT BEP-20.');return}
 if(currency!=='USDT'&&!file){toast('Adjunta el comprobante de pago.');return}
 if(currency==='SM'&&!senderPhone){toast('Introduce el número desde el que realizaste la transferencia de saldo móvil.');return}
 if(button){button.disabled=true;button.textContent='Enviando solicitud…'}
 try{
  const proofData=await readFileAsDataUrl(file);
  const result=await edgeRequest('rs12-reseller','/wallet/deposits',{method:'POST',auth:true,body:{currency,amount,senderPhone,txHash,proofData}});
  await loadResellerPortal(true,false);
  s.modal=null;modal();if(s.page==='revendedores')render();
  toast(result.ok?'Solicitud de recarga enviada.':'Solicitud registrada.');
 }catch(error){toast(error.message||'No se pudo enviar la solicitud.')}
 finally{const current=document.querySelector('[data-action="reseller-deposit-submit"]');if(current)current.disabled=false}
}


const REFILLS_WALLET_MARK='data:image/webp;base64,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';
const PAYMENT_METHODS={
 sm:{name:'Saldo móvil ETECSA',short:'Saldo móvil',currency:'SM',icon:'wallet'},
 cup:{name:'Transfermóvil',short:'CUP',currency:'CUP',icon:'credit'},
 mitransfer:{name:'MiTransfer · envío por teléfono',short:'MiTransfer',currency:'CUP',icon:'wallet'},
 balance:{name:'Saldo de la web',short:'Mi saldo',currency:'USDT',icon:'wallet'},
 usdt:{name:'USDT · Wallet propia BEP-20',short:'USDT',currency:'USDT',icon:'shield'}
};
function paymentName(id=s.payment){return PAYMENT_METHODS[id]?.name||'Transfermóvil'}
const TRANSFERMOVIL_MARK='/REFILLSHOP/assets/transfermovil-brand.png';const ETECSA_MARK='/REFILLSHOP/assets/saldo-movil-etecsa.webp';
function resellerHasPlan(){
 return !!s.user&&!!s.resellerPortal?.membership?.planTier&&!!s.reseller?.plan&&s.resellerPlans.some(p=>p.name===s.reseller.plan);
}
function paymentVisual(id){
 if(id==='cup')return `<img class="payment-method-logo transfermovil-mark" src="${TRANSFERMOVIL_MARK}" alt="Transfermóvil">`;
 if(id==='sm')return `<img class="payment-method-logo etecsa-mark" src="${ETECSA_MARK}" alt="ETECSA">`;
 if(id==='mitransfer')return `<img class="payment-method-logo mitransfer-mark" src="/REFILLSHOP/assets/mitransfer-wallet.webp" alt="MiTransfer">`;
 if(id==='balance')return `<span class="payment-method-symbol balance" aria-label="Saldo Refills Shop">${I('wallet')}</span>`;
 return `<span class="payment-method-symbol usdt" aria-label="USDT">₮</span>`;
}
function paymentChoiceList(){
 const selectedOffer=itemBy(s.detailId)?.offers?.[s.selected];
 const balancePrice=selectedOffer?currentPrice(selectedOffer,'balance'):null;
 const balanceAvailable=Number(s.reseller?.wallet?.USDT||0);
 const methods=Object.entries(PAYMENT_METHODS).filter(([id])=>id!=='balance'||s.role==='reseller');
 return `<div class="payment-choice-list">${methods.map(([id,m])=>{
  const noPlan=id==='balance'&&!resellerHasPlan(),noCost=id==='balance'&&!!selectedOffer&&!balancePrice;
  const missing=(id==='sm'&&!s.paymentConfig.smReceiver)||(id==='cup'&&(!s.paymentConfig.cupCard||!s.paymentConfig.cupConfirmPhone))||(id==='mitransfer'&&!s.paymentConfig.mitransferPhone)||(id==='usdt'&&(!s.paymentConfig.usdtEnabled||!s.paymentConfig.usdtAddress));
  const disabled=missing||noPlan||noCost,active=s.payment===id;
  const description=id==='sm'?'Manual · envío de saldo móvil y comprobante':
   id==='cup'?'Transfermóvil · número de transacción (pago en revisión)':
   id==='mitransfer'?'MiTransfer · envío por teléfono (pago en revisión)':
   id==='balance'?(noPlan?'Disponible al activar Gratis, Level 2 o Level 3':noCost?'Esta oferta no tiene costo de proveedor configurado':`Wallet de revendedor · ${balanceAvailable.toFixed(2)} USDT disponibles`):
   'Verificación automática BEP-20 después de enviar el hash';
  const modeText=id==='sm'?'MANUAL':id==='balance'?'WALLET AUTOMÁTICA':id==='usdt'?'BLOCKCHAIN AUTOMÁTICA':'REFERENCIA · REVISIÓN';
  const modeClass=id==='sm'?'manual':id==='balance'||id==='usdt'?'auto':'review';
  return `<button type="button" class="payment-choice ${active?'active':''} ${id==='balance'?'payment-choice-balance':''}" data-action="choose-payment" data-value="${id}" ${disabled?'disabled':''} ${active?'aria-pressed="true"':'aria-pressed="false"'}>
   <span class="payment-choice-icon">${paymentVisual(id)}</span>
   <span class="payment-choice-copy"><strong>${esc(m.name)}</strong><small>${disabled?(noPlan?'Activa un plan de revendedor':noCost?'Costo del proveedor no disponible':'No habilitado o sin datos de cobro'):description}</small><em class="payment-mode-label ${modeClass}">${modeText}</em></span>
   <span class="payment-choice-state">${active?'✓':''}</span>
  </button>`;
 }).join('')}</div><p class="payment-choice-note">USDT se comprueba automáticamente en BEP-20. Transfermóvil y MiTransfer necesitan conexión comercial de consulta para validar referencias automáticamente. Saldo móvil permanece manual.</p>`;
}
function priceFor(o,method=s.payment){
 if(!o)return null;
 if(method==='sm')return {amount:Number(o.sm||0),currency:'SM',method:PAYMENT_METHODS.sm};
 if(method==='usdt'||method==='balance')return {amount:Number(o.usdt||0),currency:'USDT',method:PAYMENT_METHODS[method]};
 if(method==='mitransfer')return {amount:Number(o.cup||0),currency:'CUP',method:PAYMENT_METHODS.mitransfer};
 return {amount:Number(o.card||o.cup||0),currency:'CUP',method:PAYMENT_METHODS.cup};
}
function formatPriceValue(amount,currency){
 const value=currency==='USDT'?Number(amount).toFixed(2):Number(amount).toLocaleString('es-ES',{maximumFractionDigits:2});
 return value+' '+currency;
}
function priceText(o,method=s.payment){
 const p=priceFor(o,method);
 return formatPriceValue(p.amount,p.currency);
}
function resellerPrice(o,method=s.payment){
 const plan=s.resellerPlans.find(x=>x.name===s.reseller.plan)||s.resellerPlans[0];
 if(!Number(o?.providerUsdt))return null;
 const base=Number(o.providerUsdt)*(1+Number(plan?.margin||0)/100);
 const usdtRate=Math.max(.000001,Number(s.rates.usdtSm)||300);
 const cupRate=Math.max(.000001,Number(s.rates.smCup)||3);
 const sm=base*usdtRate, cup=sm*cupRate;
 if(method==='sm')return {amount:sm,currency:'SM'};
 if(method==='cup')return {amount:cup,currency:'CUP'};
 return {amount:base,currency:'USDT'};
}
function currentPrice(o,method=s.payment){
 if(method==='balance'){
  const quote=s.wholesalePrices?.[o?.id];
  return quote&&Number(quote.resellerUsdt)>0?{amount:Number(quote.resellerUsdt),currency:'USDT',method:PAYMENT_METHODS.balance}:null;
 }
 return priceFor(o,method);
}

function offerAmountForSorting(o,method=s.payment){
 const quote=currentPrice(o,method);
 const amount=Number(quote?.amount);
 return Number.isFinite(amount)&&amount>0?amount:Number.POSITIVE_INFINITY;
}
function sortedOffersForDisplay(g,group=s.offerGroup){
 return (g?.offers||[]).map((offer,index)=>({offer,index}))
  .filter(({offer})=>offerGroup(offer)===group&&(!s.regionChoice||String(offer.region||'Global')===s.regionChoice))
  .sort((a,b)=>offerAmountForSorting(a.offer)-offerAmountForSorting(b.offer)||
   String(a.offer.title||'').localeCompare(String(b.offer.title||''),'es'));
}
function displayPrice(o,method=s.payment){
 const p=currentPrice(o,method);
 if(!p)return 'Costo pendiente';
 return (p.currency==='USDT'?Number(p.amount).toFixed(2):Number(p.amount).toLocaleString('es-ES',{maximumFractionDigits:2}))+' '+p.currency;
}
function paymentConfigText(){
 if(s.payment==='cup')return s.paymentConfig.cupCard?`Transfermóvil · tarjeta receptora: ${esc(s.paymentConfig.cupCard)}${s.paymentConfig.cupConfirmPhone?' · Número de confirmación: '+esc(s.paymentConfig.cupConfirmPhone):''}`:'Transfermóvil no está configurado todavía.';
 if(s.payment==='mitransfer')return s.paymentConfig.mitransferPhone?`MiTransfer · envía al teléfono ${esc(s.paymentConfig.mitransferPhone)}`:'MiTransfer no tiene teléfono receptor configurado.';
 if(s.payment==='sm')return s.paymentConfig.smReceiver?`Saldo móvil · ${esc(s.paymentConfig.smReceiver)}`:'El número receptor de saldo móvil no está configurado todavía.';
 if(s.payment==='balance')return resellerHasPlan()?'Saldo de tu wallet Refills Shop en USDT. El servidor comprobará los fondos y autorizará el débito.':'Necesitas un plan de revendedor activo para utilizar el saldo de la web.';
 return s.paymentConfig.usdtEnabled&&s.paymentConfig.usdtAddress?`USDT BEP-20 · ${esc(s.paymentConfig.usdtAddress)}`:'USDT wallet propia no está habilitada todavía.';
}
function saveCatalog(){/* No se permiten catálogos locales: toda publicación pasa por Supabase. */}

const main=document.getElementById('app'),modalRoot=document.getElementById('modal-root');
function updateRefillsCartDock(count=s.cart.length){
 const dock=document.getElementById('rs-cart-dock');
 if(!dock)return;
 const visible=!!s.user&&s.page!=='login'&&s.page!=='admin';
 dock.hidden=!visible;
 dock.classList.toggle('is-filled',count>0);
 dock.setAttribute('aria-label','Abrir carrito de Refills Shop, '+count+' '+(count===1?'producto':'productos'));
 const num=document.getElementById('rs-cart-dock-count');if(num)num.textContent=String(count);
 const label=document.getElementById('rs-cart-dock-label');if(label)label.textContent=count===0?'Sin productos':count===1?'1 producto':count+' productos';
}
function headerNav(){
 const top=document.getElementById('topnav'),bottom=document.getElementById('bottomnav');
 if(!s.user){
  if(top){top.innerHTML='';top.style.display='none'}
  if(bottom){bottom.innerHTML='';bottom.style.display='none'}
  const actions=document.querySelector('.top-actions');if(actions)actions.style.display='none';
  const access=document.getElementById('admin-mobile-access');if(access)access.classList.remove('is-visible');
  updateChangeBadge();const count=s.cart.length,b=document.getElementById('cart-count');if(b){b.textContent=count;b.style.display=count?'grid':'none'}updateRefillsCartDock(count);
  return;
 }
 const actions=document.querySelector('.top-actions');if(actions)actions.style.display='';
 const publicLabels={inicio:labels.inicio,recargas:labels.recargas,gift:labels.gift,pedidos:labels.pedidos,perfil:labels.perfil};
 if(top){top.style.display='';top.innerHTML=Object.entries(publicLabels).map(([id,label])=>`<button class="top-link ${s.page===id||(s.page==='detalle'&&id==='recargas')?'active':''}" data-action="nav" data-page="${id}">${I(icons[id],'tiny')}${label}</button>`).join('')+
  `<button class="top-link ${s.page==='revendedores'?'active':''}" data-action="nav" data-page="revendedores">${I('wallet','tiny')} Mayoristas</button>`+
  (s.role==='admin'?`<button class="top-link ${s.page==='admin'?'active':''}" data-action="nav" data-page="admin">${I('shield','tiny')} ADM</button>`:'');}
 if(bottom){bottom.style.display='';bottom.innerHTML=Object.entries(publicLabels).map(([id,label])=>`<button class="bottom-item ${s.page===id||(s.page==='detalle'&&id==='recargas')?'active':''}" data-action="nav" data-page="${id}">${I(icons[id])}<span>${label}</span></button>`).join('');}
 const access=document.getElementById('admin-mobile-access');
 if(access){
  const isAdmin=s.role==='admin';access.classList.toggle('is-visible',isAdmin);
  access.dataset.page=s.page==='admin'?'inicio':'admin';
  access.innerHTML=s.page==='admin'?`${I('shop')}<span>Volver a tienda</span>`:`${I('shield')}<span>Panel ADM</span>`;
  access.setAttribute('aria-label',s.page==='admin'?'Volver a la tienda':'Abrir panel de administración');
 }
 updateChangeBadge();const count=s.cart.length,b=document.getElementById('cart-count');if(b){b.textContent=count;b.style.display=count?'grid':'none'}updateRefillsCartDock(count);
}
function card(g){
 const fav=s.favorites.includes(g.id),o=[...(g.offers||[])].sort((a,b)=>offerAmountForSorting(a)-offerAmountForSorting(b))[0],count=g.offers?.length||0,price=o?displayPrice(o):'Sin ofertas';
 return `<article class="product product-horizontal product-clickable" data-action="open-item" data-id="${g.id}" role="button" tabindex="0" aria-label="Abrir ${esc(g.name)}">
  <div class="product-cover"><img loading="lazy" decoding="async" src="${photo(g)}" alt="${esc(g.name)}"></div>
  <div class="product-info"><strong class="product-name">${esc(g.name)}</strong><div class="product-kind">${count?count+' '+(count===1?'oferta':'ofertas'):'Próximamente'}${o?' · '+esc(o.title):''}</div><div class="product-desc">${esc(g.desc||'')}</div></div>
  <div class="product-payment"><small>${o?esc(paymentName()):'Catálogo'}</small><strong>${price}</strong><span class="product-tap-hint">Toca para abrir ${I('arrow','tiny')}</span></div>
  <button class="favorite ${fav?'active':''}" data-action="fav" data-id="${g.id}" title="${fav?'Eliminar de favoritos':'Añadir a favoritos'}" aria-label="Favorito ${esc(g.name)}">${I('star')}</button>
 </article>`;
}
function minitile(g){return `<button class="tile" data-action="open-item" data-id="${g.id}"><div class="tile-image"><img loading="lazy" src="${photo(g)}" alt=""></div><span class="tile-name">${esc(g.name)}</span></button>`}
function homeGameTile(g){
 if(!g)return '';
 const count=g.offers?.length||0;
 return `<button class="home-game-card-v4" data-action="open-item" data-id="${g.id}" aria-label="Abrir ${esc(g.name)}">
  <span class="home-game-art-v4"><img loading="lazy" decoding="async" src="${photo(g)}" alt="${esc(g.name)}"><i>${count?count+' '+(count===1?'oferta':'ofertas'):'Próximamente'}</i></span>
  <span class="home-game-meta-v4"><strong>${esc(gameFamilyName(g))}</strong><small>${gameRegionOptions(g).length>1?gameRegionOptions(g).length+' regiones':esc(g.region||'Catálogo digital')}</small></span>
  <span class="home-game-arrow-v4">${I('arrow','tiny')}</span>
 </button>`;
}
function sectionMini(title,ids,navpage){
 const dedupe=new Set();const items=(ids||[]).map(itemBy).filter(g=>{if(!g)return false;const k=g.category==='juegos'?gameFamilyKey(g):g.id;if(dedupe.has(k))return false;dedupe.add(k);return true}).slice(0,4);
 if(!items.length)return '';
 return `<section class="home-mini-section"><div class="section-head"><h2>${title}</h2><button class="text-link" data-action="nav" data-page="${navpage}">Ver catálogo ${I('arrow','tiny')}</button></div><div class="home-game-grid-v4">${items.map(homeGameTile).join('')}</div></section>`;
}

function updateChangeBadge(){
 const unread=rsUnreadNotices();
 const el=document.getElementById('change-unread');
 if(el){el.textContent=unread>9?'9+':String(unread);el.style.display=unread?'grid':'none';el.setAttribute('aria-label',unread+' notificaciones sin leer');}
}
async function loadPublicChanges(force=false){
 if(s.changesLoaded&&!force)return;
 try{
  const data=await edgeRequest('rs10-api','/changes',{auth:false});
  const cutoff=Date.now()-RS_NOTICE_TTL;
  const changes=Array.isArray(data.events)?data.events.filter(e=>{const stamp=Date.parse(e.createdAt||'');return Number.isFinite(stamp)&&stamp>=cutoff}):[];
  s.changes=changes.slice(0,40);s.changesLoaded=true;
  const newest=Number(s.changes[0]?.id||0);
  if(!rsNotice.publicReady){
   rsNotice.publicReady=true;
   if(rsNotice.publicSeenId<=0){
    rsNotice.publicSeenId=newest;
    if(!s.changesLastSeen){s.changesLastSeen=newest;save('changesSeen',newest);}
   }
  }else if(force&&s.user&&newest>rsNotice.publicSeenId){
   const fresh=s.changes.filter(x=>Number(x.id)>rsNotice.publicSeenId);
   if(fresh.length){rsPlayNoticeSound('message');rsSystemNotice('Novedades en Refills Shop',fresh.length===1?String(fresh[0].title||'Nueva oferta'):fresh.length+' cambios nuevos en el catálogo','catalog-'+newest);}
  }
  if(newest>rsNotice.publicSeenId){
   rsNotice.publicSeenId=newest;
   try{localStorage.setItem('refills_shop_public_event_last_v51',String(newest))}catch{}
  }
  updateChangeBadge();
  if(s.modal==='alerts')modal();
 }catch(err){console.warn('Refills updates:',err?.message||err)}
}

function formatShopTime(value){
 const d=new Date(value);
 return Number.isFinite(d.getTime())?d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true}):'—';
}
function formatShopDateTime(value){
 const d=new Date(value);
 return Number.isFinite(d.getTime())?d.toLocaleDateString('es-ES',{day:'2-digit',month:'2-digit',year:'numeric'})+' · '+formatShopTime(value):'—';
}
function clientOrderStatus(raw){
 const v=String(raw||'pending').toLowerCase().trim();
 if(v==='completed'||v==='entregado'||v==='completado')return {key:'complete',label:'Completado'};
 if(v==='refunded'||v==='reembolsado')return {key:'refunded',label:'Reembolsado'};
 if(['failed','rejected','cancelled','expired','fallido','rechazado'].includes(v))return {key:'rejected',label:'Fallido'};
 if(['processing','partially_completed','procesando','en proceso'].includes(v))return {key:'processing',label:'En proceso'};
 return {key:'pending',label:'Pendiente'};
}

function recentTopupStatus(value){
 const s=String(value||'pending').toLowerCase();
 if(s==='completed')return {label:'Completada',className:'complete'};
 if(s==='failed'||s==='rejected')return {label:'Fallida',className:'failed'};
 if(s==='refunded')return {label:'Reembolsada',className:'refunded'};
 if(s==='processing'||s==='partially_completed')return {label:'En proceso',className:'processing'};
 return {label:'Pendiente',className:'pending'};
}
function recentTopupsMarkup(){
 const rows=Array.isArray(s.recentTopups)?s.recentTopups.filter(x=>String(x.status||'').toLowerCase()==='completed'):[];
 return `<section class="card recent-topups-v1" id="recent-topups">
  <div class="recent-topups-head"><div><span class="eyebrow">ACTIVIDAD DE HOY</span><h2>Últimas 3 recargas entregadas</h2><p>Solo recargas confirmadas como completadas; sin datos privados.</p></div><button class="btn ghost small" data-action="refresh-recent-topups" aria-label="Actualizar actividad">↻</button></div>
  ${rows.length?`<div class="recent-topups-list">${rows.slice(0,3).map(x=>{const st=recentTopupStatus(x.status);return `<article class="recent-topup-row"><span class="recent-topup-icon">${I('game')}</span><span class="recent-topup-copy"><strong>${esc(x.game||'Recarga')}</strong><small>${esc(x.offer||'Producto digital')} · ${x.createdAt?formatShopTime(x.createdAt):'Hoy'}</small></span><span class="recent-topup-status ${st.className}">${st.label}</span></article>`}).join('')}</div>`:`<div class="recent-topups-empty">Todavía no hay recargas entregadas hoy.</div>`}
 </section>`;
}
async function loadRecentTopups(force=false){
 if(s.recentTopupsLoaded&&!force)return;
 try{
  const response=await fetch(RS10_BASE+'/recent-topups',{headers:{apikey:RS_SUPABASE_KEY,accept:'application/json'},cache:'no-store'});
  if(!response.ok)throw Error('No se pudo consultar la actividad.');
  const data=await response.json();s.recentTopups=Array.isArray(data.topups)?data.topups.filter(x=>String(x.status||'')==='completed').slice(0,3):[];s.recentTopupsLoaded=true;
 }catch(error){console.warn('Recent topups:',error?.message||error)}
 const node=document.getElementById('recent-topups');
 if(node){const temp=document.createElement('div');temp.innerHTML=recentTopupsMarkup();node.replaceWith(temp.firstElementChild)}
}
function home(){
 const greeting=s.user?.name||s.nickname||'Invitado';
 const hasPlan=resellerHasPlan();
 const wallet=s.reseller?.wallet||{};
 const usdtBalance=hasPlan?Number(wallet.USDT||0):0;
 const walletHero=`<section class="card home-balance-v6">
  <div class="home-balance-heading">
   <span class="home-balance-title">${I('wallet')} Hola, ${esc(greeting)}. Tu saldo</span>
   ${hasPlan?`<span class="home-balance-plan">${esc(s.reseller.plan)}</span>`:''}
  </div>
  <div class="home-balance-amount">${usdtBalance.toFixed(2)} <small>USDT</small></div>
  <div class="home-balance-actions">
   <button class="btn primary" data-action="home-wallet-deposit">${I('plus')} <span>Depositar</span></button>
   <button class="btn secondary" data-action="home-wallet-movements">${I('file')} <span>Movimientos</span></button>
   <button class="btn secondary" data-action="nav" data-page="revendedores">${I('wallet')} <span>Cuenta revendedor</span></button>
  </div>
  ${!hasPlan?`<p class="home-wallet-hint">Activa tu plan Gratis, Level 2 o Level 3 para utilizar el monedero.</p>`:''}
 </section>`;
 return `${walletHero}
 <button type="button" class="rs-install-entry" data-action="install-refills" aria-label="Instalar Refills Shop en este dispositivo"><img class="rs-install-logo" src="/REFILLSHOP/assets/refills-app-192.png" alt=""><span>Instalar Refills Shop</span></button>
 <div class="notice-grid"><button class="notice" data-action="modal" data-modal="news"><span class="notice-icon">${I('spark')}</span><span><strong>Ofertas y novedades</strong><small>Descubre recargas y productos</small></span>${I('arrow','tiny arrow')}</button><button class="notice" data-action="modal" data-modal="help"><span class="notice-icon">${I('headset')}</span><span><strong>Centro de ayuda</strong><small>Conoce cómo funciona la tienda</small></span>${I('arrow','tiny arrow')}</button></div>
 ${sectionMini('Móvil, internet y más',['nauta','cubacel','vpn','sms'],'recargas')}
 ${sectionMini('Juegos disponibles',ITEMS.filter(g=>g.category==='juegos').sort((a,b)=>Number(b.featured)-Number(a.featured)||a.sortOrder-b.sortOrder||a.name.localeCompare(b.name)).slice(0,4).map(g=>g.id),'recargas')}
 ${recentTopupsMarkup()}
 <section class="card home-howto"><div class="live">REFILLS SHOP</div><h2>Una compra sencilla, desde tu móvil</h2><div class="feature-row"><div class="feature">${I('search')} Busca tu juego</div><div class="feature">${I('diamond')} Elige una oferta</div><div class="feature">${I('credit')} Revisa tu pedido</div></div><button class="btn secondary full" data-action="nav" data-page="recargas">Empezar ahora ${I('arrow','tiny')}</button></section>`;
}
function payPills(){
 const id=PAYMENT_METHODS[s.payment]?s.payment:'cup',m=PAYMENT_METHODS[id];
 return `<button type="button" class="pay-current" data-action="open-payment-methods" aria-haspopup="dialog" aria-label="Método de pago: ${esc(m.name)}. Tocar para cambiar">
  <span class="pay-current-icon">${paymentVisual(id)}</span>
  <span class="pay-current-copy"><small>MÉTODO DE PAGO</small><strong>${esc(m.short)}</strong><span>${esc(m.name)}</span></span>
  <span class="pay-current-change">Cambiar ${I('arrow','tiny')}</span>
 </button>`;
}

function gameFamilyName(g){
 return String(g?.name||'Juego').trim().replace(/\s+(?:LATAM|GLOBAL|BRASIL|BRAZIL|EUROPA|EU|NA|NORTEAMERICA|USA|US|MENA|ASIA|SEA|TURQUIA|TURKEY|INDIA)$/i,'').trim();
}
function gameFamilyKey(g){
 return (gameFamilyName(g)||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
}
function gameRegionOptions(g){
 if(!g)return [];
 const games=ITEMS.filter(x=>x.category===g.category&&gameFamilyKey(x)===gameFamilyKey(g));
 const choices=[],seen=new Set();
 for(const x of games){
  const regions=[...new Set((x.offers||[]).map(o=>String(o.region||'').trim()).filter(Boolean))];
  if(!regions.length)regions.push(String(x.name).match(/\s+(GLOBAL|LATAM|BRASIL|EU|EUROPA|USA|ASIA|NA)$/i)?.[1]||'Global');
  for(const region of regions){
   const key=x.id+'|'+region;
   if(seen.has(key))continue;seen.add(key);
   choices.push({id:x.id,region,name:x.name,offerCount:x.offers.filter(o=>String(o.region||'Global')===region).length});
  }
 }
 return choices;
}
function openRegionGame(id,region=''){
 const g=itemBy(id);if(!g)return;
 s.detailId=id;s.selected=0;s.checkoutSession=null;s.regionChoice=region||null;s.player='';s.offerGroup='recargas';s.playerTargets={};s.playerCheck=null;s.qty=1;s.modal=null;s.page='detalle';
 const matches=(g.offers||[]).map((o,i)=>({o,i})).filter(x=>!s.regionChoice||String(x.o.region||'Global')===s.regionChoice);
 const selected=[...matches].filter(x=>offerGroup(x.o)==='recargas').sort((a,b)=>offerAmountForSorting(a.o)-offerAmountForSorting(b.o))[0]||[...matches].sort((a,b)=>offerAmountForSorting(a.o)-offerAmountForSorting(b.o))[0];
 if(selected){s.selected=selected.i;s.offerGroup=offerGroup(selected.o)}
 render(true);history.replaceState(null,'','#producto/'+id);
}
function catalogueFamilyCards(items){
 const seen=new Set(),result=[];
 for(const g of items){
  const key=g.category==='juegos'?gameFamilyKey(g):g.id;
  if(seen.has(key))continue;seen.add(key);
  const choices=gameRegionOptions(g);
  if(g.category!=='juegos'){result.push(card(g));continue}
  result.push('<article class="product product-horizontal product-clickable rs-family-card" data-action="open-item" data-id="'+esc(g.id)+'" role="button" tabindex="0" aria-label="Elegir región de '+esc(gameFamilyName(g))+'">'
  +'<div class="product-cover"><img loading="lazy" decoding="async" src="'+photo(g)+'" alt="'+esc(gameFamilyName(g))+'"></div>'
  +'<div class="product-info"><strong class="product-name">'+esc(gameFamilyName(g))+'</strong><div class="product-kind">'+choices.length+' regiones disponibles</div><div class="product-desc">Selecciona la región de tu cuenta antes de comprar.</div></div>'
  +'<div class="product-payment"><small>REGIONES</small><strong>'+choices.length+' opciones</strong><span class="product-tap-hint">Elegir región '+I('arrow','tiny')+'</span></div></article>');
 }
 return result.join('');
}
function catalog(isGift=false){
 const list=ITEMS.filter(g=>(isGift?g.category==='gift':s.filter==='todos'?g.category!=='gift':g.category===s.filter))
 .filter(g=>g.name.toLowerCase().includes(s.search.trim().toLowerCase())||(g.desc||'').toLowerCase().includes(s.search.trim().toLowerCase()));
 list.sort(s.sort==='price'?(a,b)=>minPrice(a)-minPrice(b):s.sort==='z'?(a,b)=>b.name.localeCompare(a.name):((a,b)=>a.name.localeCompare(b.name)));
 const visible=s.showFavs?list.filter(g=>s.favorites.includes(g.id)):list;
 return `<div class="catalog-top"><div class="eyebrow">REFILLS SHOP / CATÁLOGO</div><h1 class="page-title">${isGift?'Gift Cards':'Recargas'}</h1><p class="page-lead">${isGift?'Tarjetas de regalo y códigos digitales':'Juegos, recargas móviles y servicios digitales'}</p>
 <div class="catalog-toolbar"><label class="searchbox">${I('search')}<input id="catalog-search" autocomplete="off" type="search" placeholder="Buscar juego o tarjeta..." value="${esc(s.search)}"></label><select id="sort-catalog" class="select" aria-label="Ordenar catálogo"><option value="name" ${s.sort==='name'?'selected':''}>A-Z</option><option value="price" ${s.sort==='price'?'selected':''}>Menor precio</option><option value="z" ${s.sort==='z'?'selected':''}>Z-A</option></select></div>
 <div class="payment-selector"><div><strong>Método de pago</strong><small>Los precios se actualizan según tu selección.</small></div>${payPills()}</div>
 <div class="chip-row">${(isGift?[['todos','Todas las tarjetas']]:[['todos','Todo'],['juegos','Juegos'],['movil','Móvil e internet']]).map(([id,l])=>`<button class="chip ${s.filter===id?'active':''}" data-action="filter" data-value="${id}">${l}</button>`).join('')}<button class="chip ${s.showFavs?'active':''}" data-action="only-favs">${I('star','tiny')} Favoritos</button></div>
 <div class="section-head" style="margin-top:0"><h2>${visible.length} productos disponibles</h2></div><div id="catalog-results">${visible.length?`<div class="catalog-grid">${catalogueFamilyCards(visible)}</div>`:`<div class="empty">${I('search')}<h3>${ITEMS.length?'No hay resultados':'Próximamente nuevas recargas'}</h3><p>${ITEMS.length?'Prueba con otro nombre o cambia los filtros.':'Estamos preparando el catálogo. Los productos aparecerán cuando el administrador los publique.'}</p><button class="btn secondary" data-action="reset-filters">Mostrar todos</button></div>`}</div></div>`;
}

function offerGroup(o){
 const name=String(o?.title||o?.name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const kind=String(o?.kind||'').toLowerCase();
 // La clasificación tiene prioridad explícita: las recargas son únicamente moneda virtual.
 if(kind==='pin'||/\bpin\b|codigo\s+pin|key\s+digital|gift.?card|voucher|tarjeta\s+de\s+regalo/.test(name))return 'pin';
 // Los paquetes para subir niveles son pases, incluso si no incluyen la palabra "pase".
 if(/\bpase\b|\bpass\b|\bseason\b|temporada|booyah|battle.?pass|strike.?pass|twilight.?pass|level[\s-]*up|subida\s+de\s+nivel|mejora\s+de\s+nivel|paquete\s+de\s+nivel|pase\s+de\s+nivel|acceso\s+evo|\bnivel\s*\d+/.test(name))return 'pases';
 if(/membresia|membership|semanal|mensual|weekly|monthly|suscripcion|starlight|\bvip\b|\bprime\b/.test(name))return 'membresias';
 if(/fragment|cofre|\bcaja(?:s)?\b|chest|crate|\blucky\s+bag\b|\bsafe\b|pre.?order|skin|cosmetic|\bloot\b|\bemote\b|\bgesto\b|\bobjeto\b|\bmaterial\b|\bitem\b|coleccionable|\bdeal\b|arma\s*evo/.test(name))return 'coleccionables';
 // Monedas recargables: diamantes, oro, Robux, BC, FC Points, plata y similares.
 if(/\bdiamonds?\b|\bdiamantes?\b|\bgold\b|\boro\b|\brobux\b|\bbc\b|\bsilver\b|\bplata\b|\bcoins?\b|\bmonedas?\b|\bgems?\b|\bgemas?\b|\bpoints?\b|\bpuntos?\b|\bfc\s*points\b|\buc\b|\bcp\b|\bcredits?\b|\bcreditos?\b|\bcristales?\b|\btokens?\b|\bcash\b|\bjewels?\b/.test(name))return 'recargas';
 // Ante ofertas ambiguas no mezclar productos especiales con las monedas.
 return 'coleccionables';
}
const OFFER_TABS=[['recargas','Recargas'],['pases','Pases'],['membresias','Membresías'],['pin','PIN'],['coleccionables','Coleccionables']];

function primaryTargetField(offer){
 const fields=Array.isArray(offer?.targetSchema)?offer.targetSchema:[];
 const textFields=fields.filter(f=>f&&f.type!=='select');
 return textFields.find(f=>/^(?:player_?id|user_?id|uid|role_?id|service_user_id|account_?id|game_?id)$/i.test(String(f.key||'')))||textFields[0]||null;
}
function playerTargetData(offer,validate=false){
 const fields=Array.isArray(offer?.targetSchema)?offer.targetSchema:[];
 const primary=primaryTargetField(offer),stored=s.playerTargets?.[offer.id]||{},payload={};
 for(const field of fields){
  const key=String(field?.key||'');if(!key)continue;
  const value=String(primary&&field.key===primary.key?s.player:stored[key]||'').trim();
  if(validate&&(!value||value.length>80))throw Error('Completa '+String(field.label||field.key||'este campo')+' en la pantalla anterior.');
  if(validate&&field.type==='select'&&Array.isArray(field.options)&&field.options.length&&!field.options.some(v=>String(v.value)===value))throw Error('Elige una región o servidor válido.');
  if(value)payload[key]=value;
 }
 return payload;
}
function playerExtraFields(offer){
 const fields=Array.isArray(offer?.targetSchema)?offer.targetSchema:[],primary=primaryTargetField(offer);
 const stored=s.playerTargets?.[offer.id]||{};
 const extra=fields.filter(f=>f?.key&&f.key!==primary?.key);
 if(!extra.length)return '';
 return '<div class="rs-target-container"><strong>Datos del juego y región</strong><small>Completa estos campos ahora; no volveremos a pedirlos al pagar.</small>'
 +extra.map(f=>{
  const key=String(f.key),label=String(f.label||key),value=String(stored[key]||'');
  if(f.type==='select'&&Array.isArray(f.options)){
   return '<label class="rs-target-label">'+esc(label)+'<select class="field rs-target-field" data-target-key="'+esc(key)+'"><option value="">Seleccionar…</option>'+f.options.map(v=>'<option value="'+esc(v.value)+'" '+(String(v.value)===value?'selected':'')+'>'+esc(v.label||v.value)+'</option>').join('')+'</select></label>';
  }
  return '<label class="rs-target-label">'+esc(label)+'<input class="field rs-target-field" data-target-key="'+esc(key)+'" maxlength="80" autocomplete="off" value="'+esc(value)+'" placeholder="'+esc(label)+'"></label>';
 }).join('')+'</div>';
}

let rsPlayerVerifyDebounce=null;
let rsPlayerVerifyGeneration=0;
function queuePlayerVerification(){
 rsPlayerVerifyGeneration++;
 if(rsPlayerVerifyDebounce){clearTimeout(rsPlayerVerifyDebounce);rsPlayerVerifyDebounce=null}
 const offer=itemBy(s.detailId)?.offers?.[s.selected];
 if(s.page!=='detalle'||!s.user||!offer||offer.kind==='pin'||!Array.isArray(offer.targetSchema)||!offer.targetSchema.length)return;
 const value=String(s.player||'').trim();
 if(value.length<3)return;
 try{playerTargetData(offer,true)}catch{return}
 const generation=rsPlayerVerifyGeneration;
 rsPlayerVerifyDebounce=window.setTimeout(()=>{
  rsPlayerVerifyDebounce=null;
  if(generation!==rsPlayerVerifyGeneration||s.page!=='detalle'||!s.user)return;
  const current=itemBy(s.detailId)?.offers?.[s.selected];
  if(current?.id!==offer.id)return;
  void verifyPlayerIdentity(generation);
 },950);
}
async function verifyPlayerIdentity(expectedGeneration=rsPlayerVerifyGeneration){
 const offer=itemBy(s.detailId)?.offers?.[s.selected];
 const value=String(document.getElementById('player-input')?.value||s.player||'').trim();
 s.player=value;
 if(!offer){toast('Selecciona una oferta.');return}
 if(offer.kind==='pin'&&!offer.targetSchema?.length){toast('Este producto no necesita validar un jugador.');return}
 if(value.length<3){toast('Escribe primero el ID del jugador.');document.getElementById('player-input')?.focus();return}
 let payload;
 try{payload=playerTargetData(offer,true)}catch(err){toast(err.message);return}
 if(!offer.id||!Array.isArray(offer.targetSchema)||!offer.targetSchema.length){
  s.playerCheck={offerId:offer.id,player:value,status:'unverified',message:'La validación automática no está disponible para este producto.'};
  render();return;
 }
 if(!s.user){toast('Inicia sesión para verificar el jugador.');return}
 const btn=document.querySelector('[data-action="verify-player"]');
 if(btn){btn.disabled=true;btn.textContent='Verificando…'}
 try{
  const result=await edgeRequest('rs10-api','/player/validate',{method:'POST',auth:true,body:{offerId:offer.id,targetPayload:payload}});
  if(expectedGeneration!==rsPlayerVerifyGeneration||itemBy(s.detailId)?.offers?.[s.selected]?.id!==offer.id||s.player!==value)return;
  s.playerCheck={offerId:offer.id,player:value,status:result.status||'unverified',name:result.status==='valid'?String(result.playerName||''):'',message:result.status==='invalid'?'No se pudo confirmar ese ID. Revisa los datos.':result.status==='valid'?'Jugador verificado correctamente.':'La verificación automática no está disponible para este producto.'};
  render();
  if(result.status==='valid')toast(result.playerName?'Jugador: '+result.playerName:'ID confirmado.');
  else toast(s.playerCheck.message);
 }catch(err){
  if(expectedGeneration!==rsPlayerVerifyGeneration||itemBy(s.detailId)?.offers?.[s.selected]?.id!==offer.id||s.player!==value)return;
  s.playerCheck={offerId:offer.id,player:value,status:'unverified',message:'No se pudo consultar el nombre: '+(err?.message||'intenta de nuevo')};
  render();toast('No se pudo verificar automáticamente. Los datos seguirán disponibles para revisión.');
 }finally{if(btn){btn.disabled=false}}
}

function detail(){
 const g=itemBy(s.detailId);if(!g)return home();
 if(!g.offers?.length)return `<button class="detail-back" data-action="nav" data-page="recargas">${I('back','tiny')} Volver al catálogo</button><div class="card empty"><h3>Próximamente</h3><p>Este juego ya está en el catálogo. Sus ofertas aparecerán aquí cuando estén publicadas y verificadas.</p></div>`;
 const o=g.offers[s.selected]||g.offers[0],p=currentPrice(o);
 const selectedPrice=p?displayPrice(o):'Costo pendiente';
 const filteredOffers=sortedOffersForDisplay(g);
 const methodAvailable=s.payment==='usdt'?(s.paymentConfig.usdtEnabled&&!!s.paymentConfig.usdtAddress):s.payment==='mitransfer'?!!s.paymentConfig.mitransferPhone:s.payment==='balance'?(resellerHasPlan()&&!!currentPrice(o,'balance')):true;
 return `<button class="detail-back" data-action="nav" data-page="${g.category==='gift'?'gift':'recargas'}">${I('back','tiny')} Volver al catálogo</button>
 <div class="detail-head"><div class="detail-icon"><img src="${photo(g)}" alt="${esc(g.name)}"></div><div><h1>${esc(g.name)}</h1><p>${esc(g.region)} · ${esc(g.desc)}</p></div></div>
 <div class="stepper"><div class="step ${s.player?'done':'active'}"><span class="num">${s.player?I('check','tiny'):'1'}</span>Tu ID</div><div class="step active"><span class="num">2</span>Paquete</div><div class="step"><span class="num">3</span>Pago</div></div>
 <div class="detail-layout"><div>
 <section class="card panel ${o.kind==='pin'?'rs-pin-no-player':''}"><h2><span class="stage">1</span>${o.kind==='pin'?'Entrega de código PIN':g.category==='gift'?'Datos del destinatario':g.category==='movil'?'Introduce tu dato de recarga':'Escribe tu ID de jugador'}</h2>${o.kind==='pin'?`<p class="rs-pin-intro">Este producto entrega un código digital y no necesita ID de jugador. Elige la oferta y continúa con el pago.</p>`:''}<div class="input-group"><input class="field" id="player-input" maxlength="80" autocomplete="off" value="${esc(s.player)}" placeholder="${g.category==='juegos'?'ID del jugador':g.category==='gift'?'Correo o ID destinatario':'Número o cuenta de destino'}"><button class="btn secondary" data-action="verify-player">${I('check','tiny')} Revisar ID</button></div><p class="helper">Escribe el ID una sola vez. Cuando la cuenta sea válida aparecerá el nombre del jugador.</p>${playerExtraFields(o)}${s.playerCheck&&s.playerCheck.offerId===o.id&&s.playerCheck.player===s.player?`<div class="rs-player-result ${s.playerCheck.status==='valid'?'valid':s.playerCheck.status==='invalid'?'invalid':'unknown'}">${s.playerCheck.status==='valid'?'Cuenta confirmada':s.playerCheck.status==='invalid'?'ID no válido':'Validación no disponible'}${s.playerCheck.name?` · <strong>${esc(s.playerCheck.name)}</strong>`:''}${s.playerCheck.message?`<small>${esc(s.playerCheck.message)}</small>`:''}</div>`:''}</section>
 <section class="card panel"><h2><span class="stage">2</span>Elige tu oferta</h2><div class="payment-selector"><div><strong>Método de pago</strong><small>Selecciona cómo quieres pagar.</small></div>${payPills()}</div>
 <div class="rs-offer-tabs" role="group" aria-label="Categorías de ofertas">${OFFER_TABS.map(([id,title])=>{const count=g.offers.filter(o=>offerGroup(o)===id&&(!s.regionChoice||String(o.region||'Global')===s.regionChoice)).length;return `<button class="rs-offer-tab ${s.offerGroup===id?'active':''}" data-action="offer-group" data-value="${id}" type="button" aria-pressed="${s.offerGroup===id}">${title}<span>${count}</span></button>`}).join('')}</div><div class="offers-grid">${filteredOffers.length?filteredOffers.map(({offer,index:i})=>{const selected=s.selected===i,amount=displayPrice(offer);return `<button type="button" class="offer-row ${selected?'active':''}" data-action="select-offer" data-index="${i}" aria-pressed="${selected}">
 <span class="offer-game-icon"><img src="${photo(g)}" alt="${esc(g.name)}"></span>
 <span class="offer-info"><strong>${esc(offer.title)}</strong><small>${esc(offer.bonus||g.region||'Recarga digital')}</small><small class="offer-game-name">${esc(g.name)}</small></span>
 <span class="offer-payment"><small>${I(PAYMENT_METHODS[s.payment].icon,'tiny')} ${esc(paymentName())}</small><strong>${amount}</strong></span>
 </button>`}).join(''):`<div class="rs-empty-offers">No hay ofertas de esta categoría para este juego.</div>`}</div></section></div>
 <aside class="card summary-panel"><h2>Resumen de compra</h2><div class="summary-product"><img src="${photo(g)}" alt=""><strong>${esc(g.name)}<div class="muted" style="margin-top:5px;font-weight:500">${esc(o.title)}</div></strong></div>
 <div class="summary-list"><div class="summary-row"><span>Destino</span><strong>${esc(s.player||'Por indicar')}</strong></div><div class="summary-row"><span>Pago</span><strong>${esc(paymentName())}</strong></div><div class="summary-row"><span>Precio</span><strong>${selectedPrice}</strong></div></div><div class="divider"></div>
 <div class="summary-row"><span>Total</span><strong class="summary-total">${selectedPrice}</strong></div>
 ${!methodAvailable?`<p class="helper">${s.payment==='balance'?(resellerHasPlan()?'Esta oferta no tiene costo de proveedor configurado para el pago con wallet.':'Activa uno de los tres planes de revendedor para usar el saldo de la web.'):'Este método todavía no está habilitado.'}</p>`:''}
 <button class="btn primary full" style="margin-top:17px" data-action="checkout">${I('credit','tiny')} Continuar con el pago</button>
 <button class="btn ghost full" style="margin-top:9px" data-action="add-cart">${I('cart','tiny')} Añadir al carrito</button></aside></div>`;
}
function orderSummaryText(o){
 if(!o)return '';
 const amount=o.totalText||fmtMoney(o.total)+' '+(o.currency||'');
 return ['REFILLS SHOP · RESUMEN DE PEDIDO','Pedido: '+(o.ref||'—'),
  'Juego: '+(o.gameName||'Producto digital'),'Paquete: '+(o.offer||'—'),
  'ID / destino: '+(o.player||'—'),'Total: '+amount,
  'Método: '+(o.payment||'—'),'Estado: '+clientOrderStatus(o.status).label,
  'Consulta tu pedido en https://refillshop.github.io/REFILLSHOP/'].join('\n');
}
function orders(){
 const list=Array.isArray(s.orders)?s.orders:[];
 const pending=list.filter(o=>['pending','processing'].includes(clientOrderStatus(o.status).key));
 const complete=list.filter(o=>clientOrderStatus(o.status).key==='complete');
 const filter=s.orderFilter||'all';
 const shown=filter==='active'?pending:filter==='completed'?complete:list;
 const banner=s.orderJustSent&&list.some(o=>o.ref===s.orderJustSent)?
  '<div class="rs-order-sent"><strong>Pedido recibido: #'+esc(s.orderJustSent)+'</strong><span>Tu solicitud se registró. El estado se actualizará cuando se confirme la entrega.</span><button class="btn secondary small" data-action="share-order-summary" data-ref="'+esc(s.orderJustSent)+'">Compartir resumen</button></div>':'';
 return '<div class="catalog-top rs-simple-orders">'+
  '<div class="rs-simple-orders-header"><div><div class="eyebrow">REFILLS SHOP · PEDIDOS</div><h1 class="page-title">Mis pedidos</h1><p class="page-lead">Consulta el estado de cada compra sin pasos complicados.</p></div><button class="btn secondary small" data-action="refresh-orders">'+I('check','tiny')+' Actualizar</button></div>'+
  banner+
  '<div class="rs-order-filter-bar" role="group" aria-label="Filtrar pedidos">'+
  [['all','Todos',list.length],['active','En proceso',pending.length],['completed','Completados',complete.length]].map(row=>'<button type="button" data-action="orders-filter" data-filter="'+row[0]+'" class="'+(filter===row[0]?'active':'')+'">'+row[1]+' <b>'+row[2]+'</b></button>').join('')+'</div>'+
  (!shown.length?'<div class="card rs-orders-empty"><h3>'+(!list.length?'Todavía no tienes pedidos':'No hay pedidos de esta categoría')+'</h3><p>Cuando compres, podrás consultar aquí la entrega y compartir el resumen.</p><button class="btn primary" data-action="nav" data-page="recargas">Explorar juegos</button></div>':
    '<div class="rs-orders-compact-list">'+shown.map(o=>{
     const st=clientOrderStatus(o.status),total=o.totalText||fmtMoney(o.total)+' '+(o.currency||'CUP');
     return '<article class="card rs-order-compact-card"><div class="rs-order-compact-top"><div><small>#'+esc(o.ref||'—')+' · '+esc(o.date||'')+'</small><h2>'+esc(o.gameName||'Compra digital')+'</h2></div><span class="order-status-v4 '+st.key+'">'+esc(st.label)+'</span></div>'+
      '<p class="rs-order-compact-package">'+esc(o.offer||'Oferta')+'</p>'+
      '<div class="rs-order-compact-bottom"><strong>'+esc(total)+'</strong><div><button class="btn secondary small" data-action="order-details" data-ref="'+esc(o.ref)+'">Ver pedido</button><button class="btn ghost small" data-action="share-order-summary" data-ref="'+esc(o.ref)+'">Compartir</button></div></div></article>';
    }).join('')+'</div>')+
  '<p class="rs-order-help">Los pedidos con Central One se comprueban automáticamente. Un pago confirmado no significa que el paquete ya esté entregado.</p></div>';
}
function profile(){
 const displayName=s.user?.name||s.nickname||'Mi cuenta';
 const identity=s.user?.email||s.user?.phone||'Cuenta Refills Shop';
 const roleLabel=s.role==='reseller'?'Revendedor':s.role==='admin'?'Administrador':'Cliente';
 const wallet=s.reseller?.wallet||{};
 const activePlan=resellerHasPlan();
 const initial=String(displayName).trim().slice(0,2).toUpperCase()||'RS';
 const walletPanel=activePlan?`<section class="profile-wallet-v4">
  <div class="profile-wallet-head"><div><small>WALLET DE REVENDEDOR</small><span class="profile-plan-tag">${esc(s.reseller.plan)}</span></div><span class="profile-wallet-symbol">${I('wallet','big')}</span></div>
  <div class="profile-wallet-total"><strong>${Number(wallet.USDT||0).toFixed(2)}</strong><em>USDT</em><small>Saldo disponible</small></div>
  <div class="profile-wallet-secondary"><span>Saldo CUP <strong>${fmtMoney(wallet.CUP||0)}</strong></span><span>Saldo móvil <strong>${fmtMoney(wallet.SM||0)}</strong></span></div>
  <div class="profile-wallet-actions"><button class="btn primary" data-action="modal" data-modal="wallet">${I('plus','tiny')} Depositar</button><button class="btn secondary" data-action="modal" data-modal="reseller-ledger">${I('file','tiny')} Movimientos</button></div>
 </section>`:s.user?`<section class="profile-plan-locked-v4"><div><small>WALLET DE REVENDEDOR</small><strong>Activa uno de tus tres planes</strong><p>Consulta Gratis, Level 2 y Level 3 para habilitar los precios mayoristas y la wallet.</p></div><button class="btn primary" data-action="nav" data-page="revendedores">Ver planes</button></section>`:'';
 return `<div class="catalog-top profile-page-v4">
  <div class="eyebrow">CUENTA Y PREFERENCIAS</div><h1 class="page-title">Mi perfil</h1><p class="page-lead">Tu información, tu actividad y la configuración de tu cuenta.</p>
  <section class="profile-hero-v4">
   <div class="profile-avatar-v4">${esc(initial)}</div>
   <div class="profile-identity-v4"><small>CUENTA REFILLS SHOP</small><strong>${esc(displayName)}</strong><span>${esc(identity)}</span></div>
   <span class="profile-role-v4">${I('shield','tiny')} ${roleLabel}</span>
  </section>
  ${walletPanel}
  <div class="profile-layout-v4">
   <section class="card profile-panel-v4"><div class="profile-panel-title"><span>${I('user')}</span><div><h2>Mis datos</h2><p>Actualiza cómo aparece tu cuenta en la tienda.</p></div></div><div class="profile-form"><label for="profile-name">Nombre o apodo</label><input class="field" id="profile-name" maxlength="32" placeholder="Nombre que se mostrará" value="${esc(s.nickname)}"><button class="btn primary full" data-action="save-profile">Guardar cambios</button></div><div class="profile-data-line"><span>Tipo de cuenta</span><strong>${roleLabel}</strong></div><div class="profile-data-line"><span>Identificación</span><strong>${esc(identity)}</strong></div></section>
   <section class="card profile-panel-v4 profile-settings-v4"><div class="profile-panel-title"><span>${I('settings')}</span><div><h2>Configuración</h2><p>Accesos rápidos de tu cuenta.</p></div></div>
    <button class="setting" data-action="nav" data-page="pedidos"><span class="set-icon">${I('file')}</span><span class="set-copy"><strong>Mis pedidos</strong><small>Consulta compras, estados y comprobantes.</small></span>${I('arrow','tiny')}</button>
    <button class="setting" data-action="nav" data-page="revendedores"><span class="set-icon">${I('wallet')}</span><span class="set-copy"><strong>Planes de revendedor</strong><small>Consulta Gratis, Level 2 y Level 3.</small></span>${I('arrow','tiny')}</button>
    ${activePlan?`<button class="setting" data-action="modal" data-modal="wallet"><span class="set-icon">${I('wallet')}</span><span class="set-copy"><strong>Mi wallet</strong><small>Depositar y consultar tus saldos.</small></span>${I('arrow','tiny')}</button>`:''}
    ${s.role==='admin'?`<a class="setting" href="/REFILLSHOP/admin/"><span class="set-icon">${I('shield')}</span><span class="set-copy"><strong>Panel de administración</strong><small>Administrar juegos, precios y pedidos</small></span>${I('arrow','tiny')}</a>`:''}
    <button class="setting" data-action="modal" data-modal="alerts"><span class="set-icon">${I('bell')}</span><span class="set-copy"><strong>Notificaciones y sonidos</strong><small>Recargas, pagos, wallet y novedades del catálogo.</small></span>${I('arrow','tiny')}</button>
    <button class="setting" data-action="rs-test-fps"><span class="set-icon">${I('settings')}</span><span class="set-copy"><strong>Medir fluidez</strong><small id="rs-fps-result">Comprueba cuántos fotogramas muestra este teléfono.</small></span>${I('arrow','tiny')}</button>
    <button class="setting" data-action="modal" data-modal="help"><span class="set-icon">${I('headset')}</span><span class="set-copy"><strong>Ayuda y soporte</strong><small>Información del proceso de compra.</small></span>${I('arrow','tiny')}</button>
    <button class="setting" data-action="auth-logout"><span class="set-icon">${I('shield')}</span><span class="set-copy"><strong>Cerrar sesión</strong><small>Salir de tu cuenta en este dispositivo.</small></span>${I('arrow','tiny')}</button>
   </section>
  </div>
  <section class="card profile-favorites-v4"><div class="profile-panel-title"><span>${I('star')}</span><div><h2>Mis favoritos</h2><p>Tus juegos y productos guardados.</p></div></div>${s.favorites.length?`<div class="grid-media">${s.favorites.map(id=>itemBy(id)).filter(Boolean).map(minitile).join('')}</div>`:`<div class="profile-favorites-empty">Todavía no has guardado productos. Usa la estrella del catálogo para añadir tus favoritos.</div>`}</section>
 </div>`;
}
function modalTitle(title,desc=''){return `<div class="modal-title"><div><h2>${title}</h2>${desc?`<p>${desc}</p>`:''}</div><button class="xbtn" data-action="close" aria-label="Cerrar">${I('close')}</button></div>`}

let rsCheckoutClockTimer=null;
function startCheckoutCountdown(){
 if(rsCheckoutClockTimer){clearInterval(rsCheckoutClockTimer);rsCheckoutClockTimer=null}
 const expiration=Date.parse(s.checkoutSession?.expiresAt||s.usdtPayment?.expiresAt||'');
 const clock=document.getElementById('rs-deadline-clock');
 if(!clock||!Number.isFinite(expiration))return;
 function updateClock(){
  const target=document.getElementById('rs-deadline-clock');
  if(!target){clearInterval(rsCheckoutClockTimer);rsCheckoutClockTimer=null;return}
  const remaining=Math.max(0,Math.ceil((expiration-Date.now())/1000));
  target.textContent=String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0');
  const panel=target.closest('.rs-payment-deadline');
  panel?.classList.toggle('is-urgent',remaining>0&&remaining<=120);
  panel?.classList.toggle('is-expired',remaining===0);
  if(remaining<=0){
   for(const action of ['send-order','verify-usdt-payment']){const button=modalRoot.querySelector('[data-action="'+action+'"]');if(button)button.disabled=true}
   clearInterval(rsCheckoutClockTimer);rsCheckoutClockTimer=null;
   const small=panel?.querySelector('small');if(small)small.textContent='Tiempo agotado. No envíes más dinero; el pedido se marcará como fallido. Contacta soporte si ya pagaste.';
  }
 }
 updateClock();if(rsCheckoutClockTimer===null&&expiration>Date.now())rsCheckoutClockTimer=setInterval(updateClock,1000);
}
async function startPaymentReservation(button){
 const g=itemBy(s.detailId),o=g?.offers?.[s.selected],player=String(s.player||'').trim();
 if(!s.user||!g||!o){toast('Selecciona una recarga válida.');return}
 if(!s.salesEnabled||!o.purchasable||!o.inStock){toast('La tienda todavía no acepta compras. No transfieras dinero.');return}
 if(o.kind!=='pin'&&!(s.playerCheck?.status==='valid'&&s.playerCheck.offerId===o.id&&s.playerCheck.player===player)){toast('Valida el ID antes de pagar.');return}
 if(s.payment==='balance'){s.modal='checkout';modal();return}
 const method=s.payment==='sm'?'mobile':s.payment==='cup'?'card':s.payment==='mitransfer'?'wallet':s.payment==='usdt'?'usdt_wallet':null;
 if(!method){toast('El método de pago no está disponible.');return}
 const amount=Number(method==='mobile'?o.sm:method==='card'?o.card:method==='wallet'?o.cup:o.usdt);
 const currency=method==='mobile'?'SM':method==='usdt_wallet'?'USDT':'CUP';
 if(!Number.isFinite(amount)||amount<=0){toast('El precio no está disponible.');return}
 let targetPayload;
 try{targetPayload=playerTargetData(o,true)}catch(err){toast(err.message);return}
 const requestId=newRequestId();
 button.disabled=true;button.textContent='Preparando pago seguro…';
 try{
  const result=await edgeRequest('rs10-api','/orders/start',{method:'POST',auth:true,body:{
    gameId:g.id,offerId:o.id,clientRequestId:requestId,method,playerId:player||'PIN',
    targetPayload,quotedAmount:amount,quotedCurrency:currency
  }});
  if(!result?.order?.code||!result?.expiresAt)throw Error('No se confirmó el plazo de pago en el servidor.');
  s.checkoutSession={requestId,code:result.order.code,expiresAt:result.expiresAt,method,offerId:o.id,gameId:g.id,player};
  if(method==='usdt_wallet'){
   s.usdtPayment={code:result.order.code,amount:Number(result.payment?.amount||amount),
     address:result.payment?.address||s.paymentConfig.usdtAddress||'',network:'BEP-20',
     txHash:'',message:'',expiresAt:result.expiresAt};
   s.modal='usdt-wallet-pay';
  }else{s.modal='checkout'}
  modal();
 }catch(err){toast(err?.message||'No se pudo reservar el pedido. No realices transferencias.');button.disabled=false;button.textContent='Confirmar y continuar al pago'}
}

function openDepositCheckout(){
 // Payment UI mirrors the offer checkout, while deposit approval remains server-controlled.
 const settings=s.resellerPortal?.paymentInstructions||{};
 const chosen=['USDT','CUP','SM'].includes(s.resellerDepositCurrency)?s.resellerDepositCurrency:'USDT';
 if(!(chosen==='USDT'?settings.USDT?.address:chosen==='CUP'?settings.CUP?.destination:settings.SM?.destination)){
  const preferred=[['USDT',settings.USDT?.address],['CUP',settings.CUP?.destination],['SM',settings.SM?.destination]].find(x=>!!x[1]);
  if(preferred)s.resellerDepositCurrency=preferred[0];
 }
 s.resellerDepositStage='details';
 s.modal='wallet';
 modal();
}

function checkoutPaymentInstructions(){
 const method=s.payment;
 const data=method==='cup'?{name:'Tarjeta receptora · Transfermóvil',value:s.paymentConfig.cupCard,type:'Tarjeta CUP'}:
 method==='mitransfer'?{name:'Teléfono receptor · MiTransfer',value:s.paymentConfig.mitransferPhone,type:'Teléfono CUP'}:
 method==='sm'?{name:'Línea que recibe saldo móvil',value:s.paymentConfig.smReceiver,type:'Saldo móvil'}:
 method==='usdt'?{name:'Dirección USDT BEP-20',value:s.paymentConfig.usdtAddress,type:'BNB Smart Chain'}:
 {name:'Saldo de tu cuenta Refills Shop',value:'',type:'Wallet revendedor'};
 const explanation=method==='sm'?'Envía el saldo a esta línea. Adjunta una captura y escribe el número que realizó la transferencia. Comprobaremos el ingreso antes de recargar.':
 method==='cup'?'Transfiere el importe exacto a la tarjeta indicada. El número de confirmación es un dato adicional de Transfermóvil, no otra tarjeta. Adjunta el comprobante; verificaremos el ingreso antes de entregar.':
 method==='mitransfer'?'Envía CUP a este teléfono mediante MiTransfer. Indica el número de la operación para localizarla. Se verificará la recepción antes de entregar.':
 method==='usdt'?'Primero crearemos el pedido y luego verás esta dirección y el campo de hash. Usa solo USDT BEP-20; el servidor comprobará token, importe y confirmaciones.':
 'El importe se descontará del saldo de tu wallet de revendedor después de validar disponibilidad.';
 return '<section class="rs-pay-destination" aria-label="Datos para realizar el pago">'
  +'<div class="rs-pay-dest-head"><span>DATOS PARA PAGAR</span><span class="rs-pay-dest-mode">'+(method==='sm'?'MANUAL':method==='cup'||method==='mitransfer'?'EN REVISIÓN':'VERIFICACIÓN AUTOMÁTICA')+'</span></div>'
  +'<h3>'+esc(data.name)+'</h3>'
  +(data.value?'<div class="rs-pay-dest-value"><code>'+esc(data.value)+'</code><button class="btn secondary small" type="button" data-action="copy-pay-recipient">Copiar tarjeta / dato</button></div>':'<div class="rs-pay-dest-value rs-pay-wallet-info">Pago desde tu saldo disponible</div>')
  +(method==='cup'?'<div class="rs-cup-confirm-data"><h3>Número de confirmación de Transfermóvil</h3>'
     +(s.paymentConfig.cupConfirmPhone?'<div class="rs-pay-dest-value"><code>'+esc(s.paymentConfig.cupConfirmPhone)+'</code><button class="btn secondary small" type="button" data-action="copy-pay-confirmation">Copiar número</button></div>':'<p class="rs-cup-confirm-warning">El número de confirmación todavía no está disponible. Contacta soporte antes de realizar la transferencia.</p>')
     +'</div>':'')
  +'<p>'+esc(explanation)+'</p></section>';
}
function modal(){
 if(!s.modal){modalRoot.innerHTML='';document.body.classList.remove('modal-open');return}
 document.body.classList.add('modal-open');
 let html='';const g=itemBy(s.detailId),o=g?.offers[s.selected]||g?.offers[0],p=o?currentPrice(o):null;
 const total=p?{...p,amount:p.amount*s.qty}:null;
 switch(s.modal){
 case 'install-guide':{
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent);
  const android=/Android/i.test(navigator.userAgent);
  const isChrome=android&&/Chrome\//.test(navigator.userAgent);
  html=modalTitle('Instalar Refills Shop','Icono oficial en tu pantalla de inicio')+
   '<div class="card panel rs-install-help">'+
   '<img src="/REFILLSHOP/assets/refills-app-192.png" alt="Logo Refills Shop" width="64" height="64" style="width:64px;height:64px;border-radius:17px;margin:0 auto 12px;display:block">'+
   (ios?'<p>Abre la web en <strong>Safari</strong>, toca <strong>Compartir</strong> y luego <strong>Añadir a pantalla de inicio</strong>.</p>':
    android?'<p><strong>1.</strong> Abre el menú <strong>⋮</strong> de Chrome y entra a <strong>Instalar y crear acceso directo</strong>.</p>'+
     '<p><strong>2.</strong> Si <strong>Instalar</strong> está disponible, tócalo para abrir la app sin la barra del navegador.</p>'+
     '<p><strong>3.</strong> Si aparece <strong>«Esta aplicación no se puede instalar»</strong>, selecciona <strong>Crear acceso directo</strong>. Tendrás el mismo logo en tu inicio, aunque la tienda se abrirá en Chrome.</p>'+
     '<p>La instalación completa depende de Chrome y los servicios de Android. Si está bloqueada, revisa actualizaciones de Chrome y Servicios de Google Play; también puedes probar sin VPN o con otra conexión de confianza.</p>':
     '<p>Usa el menú de Chrome o Edge y elige <strong>Instalar aplicación</strong> o <strong>Crear acceso directo</strong>.</p>')+
   '<div id="rs-install-check" class="rs-install-check" role="status">Comprobando compatibilidad de tu navegador…</div>'+
   '<button type="button" class="btn secondary full" data-action="check-install-app">Volver a comprobar instalación</button>'+
   '<p class="helper">Refills Shop es una aplicación web (PWA), no una descarga APK. Para comprar, ver saldo y consultar pedidos sigue siendo necesaria la conexión a internet.</p></div>';
  queueMicrotask(()=>{void checkRefillsInstall();});
  break;
 }
  case 'reseller-preview':{
  const tier=s.resellerPreviewTier||'free',name=tier==='level2'?'Level 2':tier==='level3'?'Level 3':'Gratis';
  const data=s.resellerPreview,items=Array.isArray(data?.offers)?data.offers:[];
  const byGame=new Map();
  for(const item of items.slice(0,150)){
   const game=String(item.game||'Otros juegos'),region=String(item.region||'Global');
   if(!byGame.has(game))byGame.set(game,new Map());
   const regions=byGame.get(game);if(!regions.has(region))regions.set(region,[]);
   regions.get(region).push(item);
  }
  const groupedMarkup=[...byGame.entries()].sort((a,b)=>a[0].localeCompare(b[0],'es')).map(([game,regions])=>
   '<section class="rs-preview-game-group"><div class="rs-preview-game-heading"><strong>'+esc(game)+'</strong><small>'+[...regions.values()].reduce((n,list)=>n+list.length,0)+' ofertas</small></div>'+
   [...regions.entries()].sort((a,b)=>a[0].localeCompare(b[0],'es')).map(([region,list])=>
    '<div class="rs-preview-region-group"><h4>'+esc(region)+'</h4>'+list.map(item=>'<article class="rs-preview-offer"><div><strong>'+esc(item.name)+'</strong><small>'+esc(offerGroup(item))+'</small></div><div class="rs-preview-offer-prices"><b>'+Number(item.usdt||0).toFixed(2)+' USDT</b><small>'+Number(item.sm||0).toLocaleString('es-ES')+' SM · '+Number(item.cup||0).toLocaleString('es-ES')+' CUP</small></div></article>').join('')+'</div>'
   ).join('')+'</section>'
  ).join('');
  html=modalTitle('Ofertas de '+name,'VISTA PREVIA · Separada por juego y región')+
    '<div class="rs-preview-only-sheet"><div class="rs-preview-only-head"><strong>Precios que tendrías con '+esc(name)+'</strong><span>SOLO CONSULTA</span></div>'
    +(data===null?'<div class="rs-preview-empty-state">Cargando precios del proveedor…</div>':data.error?'<div class="rs-preview-empty-state">'+esc(data.error)+'</div>':items.length?
    '<div class="rs-preview-offers-list">'+groupedMarkup+'</div>':'<div class="rs-preview-empty-state">Aún no hay ofertas publicadas para mostrar. La vista previa se llenará cuando el ADM publique ofertas reales.</div>')
    +'<div class="rs-preview-footer">No se puede comprar desde esta vista. Para comprar debes activar un plan y tener saldo disponible.</div></div>';
  break;
 }
 case 'region-picker':{
  const g=itemBy(s.regionPickGame),regions=gameRegionOptions(g);
  html=modalTitle('Elige la región','Selecciona la región que corresponde a tu cuenta')+
   '<div class="rs-region-list">'+regions.map(region=>'<button type="button" class="rs-region-row" data-action="choose-region" data-id="'+esc(region.id)+'" data-region="'+esc(region.region)+'"><span><strong>'+esc(region.region)+'</strong><small>'+region.offerCount+' '+(region.offerCount===1?'oferta':'ofertas')+'</small></span><span>'+I('arrow','tiny')+'</span></button>').join('')+'</div><p class="rs-region-tip">Cada región tiene sus propias ofertas. Confirma tu región antes de continuar.</p>';
  break;
 }
 case 'payment-methods':
  html=modalTitle('Cambiar método de pago','Selecciona cómo quieres pagar tu compra')+
  paymentChoiceList();
  break;
 case 'purchase-confirm':{
 html=modalTitle('Confirmar compra','Revisa los datos antes de continuar')+
  '<div class="rs-purchase-confirm"><div class="rs-confirm-info"><small>JUEGO / REGIÓN</small><strong>'+esc(gameFamilyName(g||{}))+' · '+esc(o?.region||'Global')+'</strong>'
  +'<small>PAQUETE</small><strong>'+esc(o?.title||'Recarga')+'</strong>'
  +'<small>DESTINATARIO</small><strong>'+esc(o?.kind==='pin'?'Código digital':s.player||'Sin ID')+'</strong>'
  +'<small>MÉTODO</small><strong>'+esc(paymentName())+'</strong>'
  +'<small>TOTAL</small><strong class="rs-confirm-total">'+(total?formatPriceValue(total.amount,total.currency):'No disponible')+'</strong></div>'
  +'<p class="rs-confirm-warning">Después de confirmar tendrás 20 minutos para enviar la captura o el hash. Si no lo envías, el pedido pasará a fallido.</p>'
  +'<button class="btn primary full" data-action="start-payment">Confirmar y continuar al pago</button><button class="btn ghost full" data-action="close">Corregir datos</button></div>';
 break;
}
case 'checkout':
  html=modalTitle('Realizar pago',s.payment==='balance'?'Confirmación con saldo de revendedor':'Envía el comprobante dentro del plazo de 20 minutos')+
  `<div class="rs-checkout-simple"><div class="rs-payment-deadline"><span>TIEMPO RESTANTE</span><strong id="rs-deadline-clock">20:00</strong><small>Si no envías el comprobante, la solicitud vencerá automáticamente.</small></div>
   <div class="rs-checkout-total"><div><span>IMPORTE EXACTO</span><strong>${total?formatPriceValue(total.amount,total.currency):'No disponible'}</strong></div><div><small>${esc(g?.name||'Recarga')} · ${esc(o?.title||'Paquete')}</small><small>Destino: ${esc(s.player||'Según producto')}</small></div></div>
   <div class="rs-checkout-method"><span>${paymentVisual(s.payment)}<strong>${esc(paymentName())}</strong></span><span class="rs-payment-fixed">CONFIRMADO</span></div>
   ${checkoutPaymentInstructions()}
   ${Array.isArray(o?.targetSchema)&&o.targetSchema.length?'<div class="rs-checkout-confirmed"><strong>Datos de jugador guardados</strong>'+Object.entries(playerTargetData(o)).map(([key,value])=>'<span>'+esc((o.targetSchema.find(f=>f.key===key)||{}).label||key)+': <b>'+esc(value)+'</b></span>').join('')+'<small>Se tomaron de la pantalla anterior. Para cambiarlos, cierra el pago y vuelve al juego.</small></div>':''}
   ${s.payment==='sm'?'<div class="rs-checkout-inputs"><label class="sheet-label" for="payment-source-phone">Número que transfirió el saldo móvil</label><input id="payment-source-phone" class="field" type="tel" inputmode="numeric" pattern="[0-9]{8}" maxlength="8" placeholder="8 dígitos" required><label class="sheet-label" for="payment-proof">Captura del pago realizado</label><input id="payment-proof" class="field rs-proof-input" type="file" accept="image/png,image/jpeg,image/webp" required><small>JPG, PNG o WEBP · máximo 5 MB</small></div>':''}
   ${s.payment==='cup'?'<div class="rs-checkout-inputs"><label class="sheet-label" for="payment-proof">Captura del comprobante</label><input id="payment-proof" class="field rs-proof-input" type="file" accept="image/png,image/jpeg,image/webp" required><small>JPG, PNG o WEBP · máximo 5 MB.</small><label class="sheet-label" for="payment-reference">Número de confirmación de la transferencia</label><input id="payment-reference" class="field" type="text" autocomplete="off" minlength="4" maxlength="80" placeholder="Código que aparece en Transfermóvil" required><small>Es obligatorio para identificar y revisar el pago.</small></div>':s.payment==='mitransfer'?'<div class="rs-checkout-inputs"><label class="sheet-label" for="payment-proof">Captura del comprobante</label><input id="payment-proof" class="field rs-proof-input" type="file" accept="image/png,image/jpeg,image/webp" required><small>JPG, PNG o WEBP · máximo 5 MB.</small><label class="sheet-label" for="payment-reference">Número de operación (opcional)</label><input id="payment-reference" class="field" type="text" autocomplete="off" maxlength="80" placeholder="Si aparece en tu comprobante"><small>Confirmaremos que el importe llegó a la cuenta receptora.</small></div>':''}
   ${s.payment==='usdt'?'<div class="rs-checkout-safe">Primero registra el pedido para reservar su identificador. Después envía USDT y pega el hash en la siguiente pantalla. No transfieras antes de crear el pedido.</div>':''}
   ${s.payment==='balance'?'<div class="rs-checkout-safe">Solo revendedores con suscripción activa y saldo suficiente pueden utilizar esta opción.</div>':''}
   <button class="btn primary full rs-checkout-submit" data-action="send-order">${I('check','tiny')} ${s.payment==='usdt'?'Crear pedido y continuar al hash':s.payment==='balance'?'Confirmar compra con saldo':'Enviar comprobante y crear pedido'}</button>
   <p class="rs-checkout-footnote">${s.payment==='usdt'?'La recarga comenzará cuando la blockchain confirme el pago.':s.payment==='balance'?'El servidor verificará tu saldo disponible.':'Enviar el número o la captura no significa que el pago esté aprobado.'}</p>
  </div>`;
  break;
 case 'usdt-wallet-pay':{
  const pay=s.usdtPayment||{};
  html=modalTitle('Pagar con USDT BEP-20','Envía el importe exacto desde tu wallet')+
   `<div class="usdt-wallet-pay-v1"><div class="rs-payment-deadline"><span>TIEMPO PARA REGISTRAR EL HASH</span><strong id="rs-deadline-clock">20:00</strong><small>El pedido vencerá si no envías el hash a tiempo.</small></div>
    <div class="usdt-pay-order"><small>PEDIDO</small><strong>${esc(pay.code||'—')}</strong></div>
    <div class="usdt-pay-amount"><small>IMPORTE EXACTO</small><strong>${Number(pay.amount||0).toFixed(2)} USDT</strong></div>
    <div class="usdt-pay-network"><span>Red</span><strong>BNB Smart Chain · BEP-20</strong></div>
    <label class="sheet-label" for="usdt-wallet-address">Wallet receptora</label><textarea id="usdt-wallet-address" class="field" rows="2" readonly>${esc(pay.address||'')}</textarea>
    <button class="btn secondary full" data-action="copy-usdt-address">Copiar dirección</button>
    <label class="sheet-label" for="usdt-tx-hash">Hash de la transacción</label><input id="usdt-tx-hash" class="field" inputmode="text" autocomplete="off" placeholder="0x…" value="${esc(pay.txHash||'')}">
    <p class="helper">El servidor comprobará el token USDT auténtico, la dirección, el importe y las confirmaciones. No envíes por TRC-20, ERC-20 ni otra red.</p>
    ${pay.message?`<div class="warn">${esc(pay.message)}</div>`:''}
    <button class="btn primary full" data-action="verify-usdt-payment">Verificar pago automáticamente</button>
   </div>`;
  break;
 }
 case 'wallet':{
  if(!resellerHasPlan()&&!s.resellerPortal?.membership?.activationRequired){
   html=modalTitle('Wallet de revendedor','Activa un plan para utilizar la wallet')+
    '<div class="empty"><p>La billetera y sus recargas están disponibles para revendedores con un plan activo.</p><button class="btn primary" data-action="modal-nav" data-page="revendedores">Ver planes</button></div>';
   break;
  }
  const settings=s.resellerPortal?.paymentInstructions||{};
  const activationRequired=!!s.resellerPortal?.membership?.activationRequired;
  const smRate=Number(s.resellerPortal?.rates?.buySmPerUsdt||0),cupRate=Number(s.resellerPortal?.rates?.cupPerSm||0);
  let currency=['USDT','CUP','SM'].includes(s.resellerDepositCurrency)?s.resellerDepositCurrency:'USDT';
  const options={
   USDT:{title:'USDT · BEP-20',subtitle:'Hash de transacción o captura · Revisión de ingreso',name:'Wallet receptora · USDT BEP-20',recipient:String(settings.USDT?.address||''),network:String(settings.USDT?.network||'BEP-20'),visual:paymentVisual('usdt'),note:'Envía únicamente USDT por la red indicada. Introduce el hash o adjunta una captura. El abono se realizará tras verificar el ingreso.'},
   CUP:{title:'CUP · Transfermóvil',subtitle:'Captura del comprobante · Revisión manual',name:'Tarjeta receptora · Transfermóvil',recipient:String(settings.CUP?.destination||''),confirmPhone:String(settings.CUP?.confirmPhone||settings.CUP?.confirmationPhone||s.paymentConfig.cupConfirmPhone||''),network:'CUP',visual:paymentVisual('cup'),note:'Transfiere el importe exacto a la tarjeta, comprueba el número de confirmación y adjunta una captura JPG, PNG o WEBP. No se acredita la wallet sin verificar el ingreso.'},
   SM:{title:'Saldo móvil ETECSA',subtitle:'Captura y número de origen · Revisión manual',name:'Número receptor · Saldo móvil',recipient:String(settings.SM?.destination||''),network:'SM',visual:paymentVisual('sm'),note:'Envía el saldo a la línea indicada, adjunta una captura e introduce el número desde el que realizaste la transferencia.'}
  };
  let current=options[currency];
  if(s.resellerDepositStage==='details'&&!current.recipient){const available=Object.entries(options).find(([,opt])=>!!opt.recipient);if(available){currency=available[0];current=available[1];s.resellerDepositCurrency=currency}else s.resellerDepositStage='methods'}
  if(s.resellerDepositStage!=='details'){
   html=modalTitle('Depositar en wallet','Elige cómo deseas recargar tu cuenta de revendedor')+
    '<div class="rs-checkout-simple rs-wallet-deposit-ui"><div class="rs-checkout-total"><div><span>TU SALDO DISPONIBLE</span><strong>'+
    Number(s.reseller.wallet?.USDT||0).toFixed(2)+' <small>USDT</small></strong></div><div><small>Recarga en USDT, CUP o saldo móvil. La acreditación requiere confirmación del ingreso.</small></div></div>'+
    '<div class="rs-wallet-stage-head"><strong>Selecciona un método de depósito</strong><small>Los datos para pagar aparecerán en el siguiente paso.</small></div>'+
    '<div class="payment-choice-list">'+Object.entries(options).map(([code,item])=>{
     const available=!!item.recipient&&(code!=='CUP'||!!item.confirmPhone);
     return '<button type="button" class="payment-choice rs-wallet-method" data-action="wallet-select-currency" data-currency="'+code+'" '+(!available?'disabled':'')+'>'+
       '<span class="payment-choice-icon">'+item.visual+'</span><span class="payment-choice-copy"><strong>'+esc(item.title)+'</strong><small>'+esc(available?item.subtitle:'Método sin cuenta receptora configurada')+'</small></span><span class="payment-choice-arrow">'+I('arrow','tiny')+'</span></button>';
    }).join('')+'</div>'+
    '<div class="rs-wallet-review-note">Las solicitudes se acreditan solamente después de verificar la transferencia. No compartas datos de tu cuenta con terceros.</div></div>';
   break;
  }
  const balance=Number(s.reseller.wallet?.USDT||0),minimumDeposit=currency==='USDT'?5:currency==='SM'?Math.ceil(5*smRate):Math.ceil(5*smRate*cupRate);
  html=modalTitle('Depositar en wallet',activationRequired?'Activa Gratis con un depósito verificado':'Datos para transferir y enviar comprobante')+
   '<div class="rs-checkout-simple rs-wallet-deposit-ui"><div class="rs-checkout-total"><div><span>IMPORTE A DEPOSITAR</span><strong id="wallet-deposit-preview">0.00 <small>'+currency+'</small></strong></div><div><small>Saldo actual: '+balance.toFixed(2)+' USDT</small><small>La acreditación no es instantánea: se verificará el pago primero.</small></div></div>'+
   '<div class="rs-checkout-method"><span>'+current.visual+'<strong>'+esc(current.title)+'</strong></span><button type="button" class="btn ghost small" data-action="wallet-change-currency">Cambiar</button></div>'+
   '<div class="rs-checkout-inputs rs-wallet-amount-field"><label class="sheet-label" for="wallet-amount">¿Cuánto deseas depositar? ('+currency+')</label>'+
    '<input id="wallet-amount" class="field" type="number" inputmode="decimal" min="'+(activationRequired?minimumDeposit:(currency==='USDT'?'0.01':'1'))+'" step="'+(currency==='USDT'?'0.01':'1')+'" autocomplete="off" placeholder="'+(activationRequired?minimumDeposit.toLocaleString('es-ES'):(currency==='USDT'?'Ejemplo: 5.00':'Ejemplo: 500'))+'" required>'+
    '<small>'+(activationRequired?'Para activar Gratis, deposita al menos '+minimumDeposit.toLocaleString('es-ES')+' '+currency+' (equivalente a 5 USDT). Se activa cuando administración apruebe el ingreso.':'Envía exactamente el importe que indicas aquí.')+'</small><input id="wallet-currency" type="hidden" value="'+currency+'"></div>'+
   '<section class="rs-pay-destination"><div class="rs-pay-dest-head"><span>DATOS PARA PAGAR</span><span class="rs-pay-dest-mode">EN REVISIÓN</span></div>'+
    '<h3>'+esc(current.name)+'</h3>'+
    '<div class="rs-pay-dest-value">'+(current.recipient?
      '<code>'+esc(current.recipient)+'</code><button type="button" class="btn secondary small" data-action="wallet-copy-recipient">Copiar</button>':
      '<span class="rs-wallet-missing">No hay datos receptores configurados. No envíes dinero.</span>')+'</div>'+
    (currency==='USDT'?'<div class="rs-wallet-network">RED · '+esc(current.network)+'</div>':'')+
    (currency==='CUP'?'<div class="rs-cup-confirm-data"><h3>Número de confirmación de Transfermóvil</h3>'+(current.confirmPhone?'<div class="rs-pay-dest-value"><code>'+esc(current.confirmPhone)+'</code><button type="button" class="btn secondary small" data-action="wallet-copy-confirmation">Copiar número</button></div>':'<p class="rs-cup-confirm-warning">No se configuró el número de confirmación de CUP. Contacta soporte antes de enviar dinero.</p>')+'</div>':'')+
    '<p>'+esc(current.note)+'</p></section>'+
   '<div class="rs-checkout-inputs rs-wallet-evidence">'+
   (currency==='USDT'?'<label class="sheet-label" for="wallet-txhash">Hash de transacción USDT (recomendado)</label><input id="wallet-txhash" class="field" type="text" autocomplete="off" placeholder="0x…"><small>Si todavía no tienes el hash, puedes adjuntar una captura.</small>':'')+
   (currency==='SM'?'<label class="sheet-label" for="wallet-sender">Número desde el que transferiste</label><input id="wallet-sender" class="field" type="tel" inputmode="numeric" maxlength="20" placeholder="Número de la línea emisora" required>':'')+
   '<label class="sheet-label" for="wallet-proof">Captura del comprobante '+(currency==='USDT'?'(si no envías hash)':'(obligatoria)')+'</label>'+
   '<input id="wallet-proof" class="field rs-proof-input" type="file" accept="image/png,image/jpeg,image/webp" '+(currency==='USDT'?'':'required')+'>'+
   '<small>JPG, PNG o WEBP · tamaño máximo 5 MB.</small></div>'+
   '<button class="btn primary full rs-checkout-submit" data-action="reseller-deposit-submit" '+(!current.recipient?'disabled':'')+'>'+
     I('check','tiny')+' Enviar solicitud de depósito</button>'+
   '<p class="rs-checkout-footnote">La captura o el hash no significan que el dinero ya esté acreditado. Consulta su estado en Movimientos.</p></div>';
  break;
 }
 case 'reseller-deposit':
  openDepositCheckout();return;
 case 'reseller-ledger':
  if(!resellerHasPlan()){html=modalTitle('Movimientos de wallet','Disponible con un plan de revendedor')+`<div class="empty"><p>Activa un plan para consultar los movimientos de tu wallet.</p><button class="btn primary" data-action="modal-nav" data-page="revendedores">Ver planes</button></div>`}
  else{
   const deposits=(s.resellerDeposits||[]).slice(0,15),orders=(s.resellerOrders||[]).slice(0,15);
   html=modalTitle('Movimientos de wallet','Recargas, compras y suscripciones registradas')+
    `<div class="section-head"><h3>Recargas</h3></div>${deposits.length?deposits.map(d=>`<div class="summary-row"><span>${esc(d.payment_method||d.method||'Recarga')} · ${esc(d.status||'pendiente')}<small style="display:block;color:var(--muted)">${formatShopDateTime(d.created_at||d.createdAt||Date.now())}</small></span><strong>${fmtMoney(d.amount)} ${esc(d.currency||'')}</strong></div>`).join(''):`<div class="reseller-v7-empty">No tienes recargas registradas.</div>`}
    <div class="section-head"><h3>Compras mayoristas</h3></div>${orders.length?orders.map(o=>`<div class="summary-row"><span>${esc(o.game_name||o.gameName||'Compra')} · ${esc(o.code||'')}<small style="display:block;color:var(--muted)">${esc(o.status||'Pendiente')}</small></span><strong>${fmtMoney(o.wallet_amount)} ${esc(o.wallet_currency||'')}</strong></div>`).join(''):`<div class="reseller-v7-empty">No tienes compras mayoristas registradas.</div>`}`;
  }
  break;
 case 'cart':{
  const entries=s.cart.map((c,index)=>{
   const game=itemBy(c.id);
   const off=game?.offers?.find(o=>o.id===c.offerId)||game?.offers?.[c.offer];
   const p=off?currentPrice(off):null;
   return game&&off?{c,index,game,off,price:p}:null;
  }).filter(Boolean);
  const amountValid=entries.length>0&&entries.every(e=>e.price&&Number.isFinite(Number(e.price.amount))&&Number(e.price.amount)>=0&&e.price.currency===entries[0].price.currency);
  const totalAmount=amountValid?entries.reduce((sum,e)=>sum+Number(e.price.amount),0):0;
  const subtotal=amountValid?(entries[0].price.currency==='USDT'?totalAmount.toFixed(2):totalAmount.toLocaleString('es-ES',{maximumFractionDigits:2}))+' '+entries[0].price.currency:null;
  html=modalTitle('Mi carrito','Tus productos guardados en Refills Shop')+
  '<div class="rs-cart-v50">'+
   (entries.length?
    '<div class="rs-cart-v50-head"><span>'+entries.length+' '+(entries.length===1?'producto':'productos')+'</span><span>Confirma cada recarga por separado</span></div>'+
    '<div class="rs-cart-v50-items">'+entries.map(e=>
     '<article class="rs-cart-v50-item">'+
      '<img loading="lazy" decoding="async" src="'+esc(photo(e.game))+'" alt="">'+
      '<div class="rs-cart-v50-details"><strong>'+esc(e.game.name)+'</strong><span>'+esc(e.off.title||'Oferta')+'</span><small>ID: '+esc(e.c.player||'Por confirmar')+' · '+esc(e.c.region||e.off.region||'Global')+'</small><b>'+(e.price?esc(displayPrice(e.off)):'Precio no disponible')+'</b></div>'+
      '<div class="rs-cart-v50-actions"><button type="button" class="rs-cart-v50-open" data-action="cart-pick" data-index="'+e.index+'">Revisar</button><button type="button" class="rs-cart-v50-remove" data-action="remove-cart" data-index="'+e.index+'" aria-label="Quitar '+esc(e.off.title||'oferta')+' del carrito">'+I('trash','tiny')+'</button></div>'+
     '</article>').join('')+'</div>'+
    '<div class="rs-cart-v50-total"><span>Subtotal orientativo<small>Se confirma antes de cada pago</small></span><strong>'+(subtotal||'Consultar precios')+'</strong></div>'+
    '<p class="rs-cart-v50-hint">Por seguridad, cada artículo se revisa y se paga individualmente. Nunca se envían compras automáticas desde el carrito.</p>'+
    '<button type="button" class="btn primary full rs-cart-v50-main" data-action="cart-pick" data-index="'+entries[0].index+'">Revisar primer producto '+I('arrow','tiny')+'</button>':
    '<div class="rs-cart-v50-empty"><span class="rs-cart-v50-empty-symbol">'+I('cart')+'</span><h3>Tu carrito está vacío</h3><p>Guarda las recargas que te interesen y revísalas cuando quieras.</p><button type="button" class="btn primary" data-action="modal-nav" data-page="recargas">Explorar catálogo</button></div>')+
  '</div>';
  break;
 }
 case 'alerts':html=rsNotificationModal();break;
 case 'help':
  html=modalTitle('¿Cómo funciona?','Compra en tres pasos')+`<div class="setting"><span class="set-icon">${I('search')}</span><span class="set-copy"><strong>1. Busca tu juego</strong><small>Explora el catálogo y selecciona tu recarga.</small></span></div><div class="setting"><span class="set-icon">${I('diamond')}</span><span class="set-copy"><strong>2. Escribe el ID y elige el paquete</strong><small>Indica el destinatario y el método de pago.</small></span></div><div class="setting"><span class="set-icon">${I('check')}</span><span class="set-copy"><strong>3. Confirma tu pedido</strong><small>Consulta su estado desde el apartado Pedidos.</small></span></div><button class="btn primary full" data-action="modal-nav" data-page="recargas">Ir al catálogo</button>`;break;
 case 'news':
  html=modalTitle('Ofertas y novedades')+`<div class="small-banner">Consulta las promociones disponibles en el catálogo.</div><div class="section-head"><h2>Juegos populares</h2></div><div class="grid-media" style="grid-template-columns:repeat(4,minmax(0,1fr))">${['freefire','mlbb','pubg','honor'].map(id=>minitile(itemBy(id))).join('')}</div>`;break;
 case 'order':{
  const current=s.orders.find(x=>x.ref===s.selectedOrder);
  const st=clientOrderStatus(current?.status);
  html=modalTitle('Pedido #'+esc(current?.ref||''),'Tu compra y estado de entrega')+
   (current?'<div class="rs-order-modal-head"><div><strong>'+esc(current.gameName||'Compra digital')+'</strong><small>'+esc(current.offer||'Paquete')+'</small></div><span class="order-status-v4 '+st.key+'">'+esc(st.label)+'</span></div>'+
    '<div class="rs-order-modal-total">'+esc(current.totalText||fmtMoney(current.total)+' '+(current.currency||'CUP'))+'</div>'+
    '<div class="rs-order-modal-fields"><div><span>ID / destino</span><strong>'+esc(current.player||'—')+'</strong></div><div><span>Pago</span><strong>'+esc(current.payment||'—')+'</strong></div><div><span>Fecha</span><strong>'+esc(current.date||'—')+'</strong></div></div>'+
    '<div class="rs-order-modal-actions"><button class="btn primary" data-action="share-order-summary" data-ref="'+esc(current.ref)+'">Enviar resumen</button><button class="btn secondary" data-action="copy-order-summary" data-ref="'+esc(current.ref)+'">Copiar resumen</button><button class="btn ghost" data-action="refresh-orders">Actualizar estado</button></div>'+
    '<p class="rs-order-modal-hint">'+(st.key==='complete'?'Central One o administración confirmó la entrega.':st.key==='processing'?'Tu pedido sigue en proceso; consultaremos Central One automáticamente.':'El pedido está en revisión. Consulta el estado aquí.')+'</p>':
    '<div class="empty">No se encontró el pedido. Actualiza la lista.</div>');
  break;
 }
 }
 modalRoot.innerHTML=`<div class="overlay" data-action="backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="${esc(s.modal)}"><div class="sheet-grabber" aria-hidden="true"></div>${html}</section></div>`;
 if(s.modal==='checkout'&&s.payment==='balance')modalRoot.querySelector('.rs-payment-deadline')?.remove();
 if(s.modal==='checkout'||s.modal==='usdt-wallet-pay')startCheckoutCountdown();else if(rsCheckoutClockTimer){clearInterval(rsCheckoutClockTimer);rsCheckoutClockTimer=null}
}
let rsDeferredInstall=null;
async function checkRefillsInstall(){
 const el=document.getElementById('rs-install-check');if(!el)return;
 if(window.matchMedia('(display-mode: standalone)').matches||navigator.standalone){el.textContent='Refills Shop ya se está ejecutando como aplicación instalada.';return}
 const problems=[];
 try{
  const response=await fetch('/REFILLSHOP/manifest.webmanifest?verify=20261123v4',{cache:'no-store'});
  if(!response.ok)problems.push('No se puede cargar la configuración de la app.');
  else{
   const mf=await response.json();
   if(!mf.start_url||!mf.name||!mf.icons?.length)problems.push('La configuración de instalación está incompleta.');
   else{
    const icon=mf.icons.find(i=>String(i.sizes).includes('192'))||mf.icons[0];
    const img=await fetch(new URL(icon.src,location.origin),{method:'HEAD',cache:'no-store'});
    if(!img.ok)problems.push('No se puede cargar el icono.');
   }
  }
 }catch{problems.push('El manifiesto o el icono no respondieron. Comprueba la conexión.')}
 if(!('serviceWorker' in navigator))problems.push('Este navegador no admite el servicio requerido.');
 else{
  try{const reg=await navigator.serviceWorker.getRegistration('/REFILLSHOP/');
   if(!reg||!reg.active)problems.push('El servicio de la aplicación todavía se está activando.');
  }catch{problems.push('El navegador bloqueó el servicio de la app.')}
 }
 if(!el.isConnected)return;
 if(problems.length){el.textContent=problems.join(' ');el.classList.add('warning');return}
 el.classList.remove('warning');
 el.textContent=rsDeferredInstall?'La tienda está preparada. Cierra esta ventana y pulsa Instalar.':'La configuración de Refills Shop está correcta. Si Chrome deshabilita Instalar, usa Crear acceso directo: el bloqueo depende del instalador del dispositivo.';
}
function requestRefillsInstallation(){
 if(window.matchMedia('(display-mode: standalone)').matches||navigator.standalone===true){toast('Refills Shop ya está instalada en este dispositivo.');return}
 if(rsDeferredInstall){
  const prompt=rsDeferredInstall;rsDeferredInstall=null;
  // Mantener el gesto del usuario para que Android abra el diálogo de instalación.
  void (async()=>{
   try{
    await prompt.prompt();
    const result=await prompt.userChoice;
    if(result?.outcome==='accepted')toast('Instalación aceptada. Busca Refills Shop en tu teléfono.');
    else toast('Instalación cancelada. Puedes intentarlo de nuevo desde el menú de Chrome.');
   }catch(error){console.warn('Instalación PWA:',error?.message||error);s.modal='install-guide';modal();}
  })();
  return;
 }
 s.modal='install-guide';modal();
}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();rsDeferredInstall=event;});
window.addEventListener('appinstalled',()=>{rsDeferredInstall=null;toast('Refills Shop instalada correctamente.');});
if('serviceWorker' in navigator&&location.protocol==='https:'){
 const registerRefillsWorker=()=>navigator.serviceWorker.register('/REFILLSHOP/sw.js?v=4',{scope:'/REFILLSHOP/',updateViaCache:'none'}).catch(error=>console.warn('PWA Refills Shop:',error?.message||error));
 if(document.readyState==='complete')void registerRefillsWorker();
 else window.addEventListener('load',()=>{void registerRefillsWorker()},{once:true});
}
function render(scroll=false){document.body.classList.toggle('rs-auth-screen',s.page==='login'&&!s.user);rsApplyPerformancePreference();headerNav();
if(s.page==='detalle')main.innerHTML=detail();
else if(s.page==='inicio')main.innerHTML=home();
else if(s.page==='recargas')main.innerHTML=catalog(false);
else if(s.page==='gift')main.innerHTML=catalog(true);
else if(s.page==='pedidos')main.innerHTML=orders();
else if(s.page==='perfil')main.innerHTML=profile();
else if(s.page==='login')main.innerHTML=authPage();
else if(s.page==='revendedores')main.innerHTML=resellerPage();
else if(s.page==='admin')main.innerHTML=s.role==='admin'?`<div class="catalog-top"><div class="eyebrow">ADMINISTRACIÓN / REFILLS SHOP</div><h1 class="page-title">Centro de control</h1><p class="page-lead">Tu catálogo, precios, clientes, pedidos y conexión real con Central One se administran desde el panel seguro conectado a Supabase.</p><section class="card panel" style="max-width:640px;margin:20px auto;padding:24px"><div style="display:grid;gap:12px"><a class="btn primary full" href="/REFILLSHOP/admin/">${I('shield','tiny')} Abrir administración real</a><a class="btn secondary full" href="/REFILLSHOP/admin/integrations">${I('settings','tiny')} Central One y conexiones</a><a class="btn secondary full" href="/REFILLSHOP/admin/games">${I('game','tiny')} Crear juegos y ofertas</a><button class="btn ghost full" data-action="nav" data-page="inicio">Volver a la tienda</button></div></section></div>`:`<div class="catalog-top"><h1 class="page-title">Acceso restringido</h1><p class="page-lead">Esta área requiere una sesión administrativa válida.</p><button class="btn primary" data-action="nav" data-page="login">Iniciar sesión</button></div>`;
modal();if(scroll)window.scrollTo({top:0,behavior:'instant'})}
function navigate(page){
 if(!s.user&&page!=='login'){s.afterAuthPage=page;s.authMode='login';s.page='login';s.modal=null;render(true);toast('Inicia sesión o crea tu cuenta para continuar.');return}
 if(page==='admin'&&s.role!=='admin'){s.page='inicio';render(true);toast('Esta sección requiere permisos de administrador.');return}
 s.modal=null;if(page!=='detalle')s.search='';s.filter='todos';s.showFavs=false;s.page=page;render(true);history.replaceState(null,'','#'+page);if(page==='inicio')void loadRecentTopups(true);if(page==='pedidos')void loadCustomerOrders();
 if(page==='revendedores'&&!s.resellerPortal)void loadResellerPortal(false,true);
}
function openDetail(id){let g=itemBy(id);if(!g)return;const regions=gameRegionOptions(g);if(g.category==='juegos'&&regions.length){s.regionPickGame=id;s.modal='region-picker';modal();return}openRegionGame(id,regions[0]?.region||'')}
function toast(t){const root=document.getElementById('toast-root');root.innerHTML=`<div class="toast">${esc(t)}</div>`;clearTimeout(toast.timer);toast.timer=setTimeout(()=>root.innerHTML='',2800)}
function changePayment(p){
 if(!PAYMENT_METHODS[p])return;
 if(s.checkoutSession&&s.modal==='checkout'){toast('Este pedido ya tiene un método confirmado. Cierra el pago para crear otro.');return}
 if(p==='balance'&&!resellerHasPlan()){toast('Activa uno de los planes de revendedor para pagar con tu saldo de Refills Shop.');return}
 if(p==='balance'&&s.detailId){const selectedOffer=itemBy(s.detailId)?.offers?.[s.selected];if(selectedOffer&&!currentPrice(selectedOffer,'balance')){toast('Esta oferta no tiene costo de proveedor configurado para el pago con wallet.');return}}
 if(p==='usdt'&&(!s.paymentConfig.usdtEnabled||!s.paymentConfig.usdtAddress)){toast('USDT wallet propia todavía no está habilitada por administración.');return}
 if(p==='mitransfer'&&!s.paymentConfig.mitransferPhone){toast('MiTransfer no tiene teléfono receptor configurado.');return}
 s.payment=p;
 const returnModal=s.paymentReturnModal||null;
 s.paymentReturnModal=null;
 s.modal=returnModal;
 if(s.modal)modal();else{const y=window.scrollY;render();window.scrollTo(0,y)}
}
function refreshCatalog(){const isGift=s.page==='gift',container=document.getElementById('catalog-results');if(!container)return;const doc=new DOMParser().parseFromString(catalog(isGift),'text/html');const newContainer=doc.getElementById('catalog-results');if(newContainer)container.innerHTML=newContainer.innerHTML;const title=document.querySelector('.section-head h2');const match=(newContainer?.querySelectorAll('.product')||[]).length;if(title&&s.page!=='detalle')title.textContent=match+' productos disponibles'}
document.addEventListener('submit',e=>{if(e.target?.id==='auth-form'){e.preventDefault();void handleAuthSubmit(e.target)}});
document.addEventListener('change',e=>{
 if(e.target?.id==='remember-session'){s.rememberSession=!!e.target.checked;try{localStorage.setItem('refills_shop_remember_session',String(s.rememberSession))}catch{}}
 if(e.target?.id==='reseller-currency')s.resellerCurrency=e.target.value;
 if(e.target?.id==='wallet-currency'){
  s.resellerDepositCurrency=e.target.value;
  const i=s.resellerPortal?.paymentInstructions||{},c=e.target.value;
  const message=c==='USDT'?`USDT · ${i.USDT?.network||'BEP-20'} · ${i.USDT?.address||'Dirección no configurada'}`:c==='CUP'?`Transfermóvil · ${i.CUP?.destination||'Datos no configurados'}`:`Saldo móvil ETECSA · ${i.SM?.destination||'Datos no configurados'}`;
  const target=document.querySelector('#modal-root .payment-instructions p');if(target)target.textContent=message;
 }
});
document.addEventListener('input',e=>{if(e.target?.id==='wallet-amount'){const el=document.getElementById('wallet-deposit-preview');const curr=s.resellerDepositCurrency||'USDT';const v=Number(e.target.value);if(el)el.innerHTML=(Number.isFinite(v)&&v>0?v.toLocaleString('es-ES',{minimumFractionDigits:curr==='USDT'?2:0,maximumFractionDigits:curr==='USDT'?2:0}):'0.00')+' <small>'+curr+'</small>';}
if(e.target.id==='catalog-search'){s.search=e.target.value;refreshCatalog()}if(e.target.id==='player-input'){s.player=e.target.value;s.playerCheck=null;queuePlayerVerification()}if(e.target.matches('.rs-target-field')){const offer=itemBy(s.detailId)?.offers?.[s.selected];if(offer){s.playerTargets[offer.id]||={};s.playerTargets[offer.id][e.target.dataset.targetKey]=e.target.value;s.playerCheck=null;queuePlayerVerification()}}});
document.addEventListener('change',e=>{if(e.target.id==='sort-catalog'){s.sort=e.target.value;refreshCatalog()}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&s.modal){s.modal=null;modal()}if((e.key==='Enter'||e.key===' ')&&e.target.classList.contains('brand')){e.preventDefault();navigate('inicio')}if((e.key==='Enter'||e.key===' ')&&e.target.classList.contains('product-clickable')){e.preventDefault();openDetail(e.target.dataset.id)}});
document.addEventListener('click',e=>{rsUnlockNoticeSound();let b=e.target.closest('[data-action]');if(!b)return;const action=b.dataset.action;if(action==='backdrop'&&e.target!==b)return;e.preventDefault();switch(action){
case 'auth-mode':s.authMode=b.dataset.mode==='register'?'register':'login';s.authError='';render();break;
case 'auth-logout':void signOutRefills();break;
case 'reseller-refresh':void loadResellerPortal(false,true);break;
case 'reseller-subscribe':void activateResellerPlan(b.dataset.tier);break;
case 'reseller-preview':void openResellerPlanPreview(b.dataset.tier);break;
case 'reseller-deposit-submit':void submitResellerDeposit();break;

case 'nav':navigate(b.dataset.page);break;case 'modal-nav':navigate(b.dataset.page);break;
case 'home-wallet-deposit':if(resellerHasPlan())openDepositCheckout();else{s.modal='wallet';modal()}break;
case 'install-refills':requestRefillsInstallation();break;case 'check-install-app':void checkRefillsInstall();break;case 'home-wallet-movements':s.modal='reseller-ledger';modal();break;
case 'wallet-select-currency':{s.resellerDepositCurrency=b.dataset.currency;s.resellerDepositStage='details';modal();break;}
case 'wallet-change-currency':{s.resellerDepositStage='methods';modal();break;}
case 'wallet-copy-confirmation':{const val=String(s.resellerPortal?.paymentInstructions?.CUP?.confirmationPhone||s.paymentConfig.cupConfirmPhone||'').trim();if(!val){toast('Falta el número de confirmación de CUP');break;}void navigator.clipboard?.writeText(val).then(()=>toast('Número de confirmación copiado'),()=>toast('Mantén pulsado el número para copiarlo'));break;}
case 'wallet-copy-recipient':{const data=s.resellerPortal?.paymentInstructions||{};const currency=s.resellerDepositCurrency||'USDT';const val=currency==='USDT'?data.USDT?.address:currency==='CUP'?data.CUP?.destination:data.SM?.destination;if(!val){toast('No hay cuenta receptora configurada');break;}void navigator.clipboard?.writeText(String(val)).then(()=>toast('Datos para pagar copiados'),()=>toast('Mantén pulsado el dato para copiarlo'));break;}
case 'open-item':openDetail(b.dataset.id);break;
case 'choose-region':openRegionGame(b.dataset.id,b.dataset.region);break;
case 'modal':s.modal=b.dataset.modal;if(s.modal==='wallet'){openDepositCheckout();break}if(s.modal==='alerts'){rsNoticeAccount();rsMarkNoticesRead();void loadPublicChanges(true);}modal();break;
case 'rs-notice-sound':rsNotice.soundEnabled=!rsNotice.soundEnabled;save('notice_sound',rsNotice.soundEnabled);if(rsNotice.soundEnabled){rsUnlockNoticeSound();rsPlayNoticeSound('completed')}modal();break;
case 'rs-notice-system':void rsRequestSystemNotices();break;
case 'rs-notice-refresh':void Promise.allSettled([loadCustomerOrders(),loadPublicChanges(true),rsPollResellerEvents()]).then(()=>{if(s.modal==='alerts')modal();toast('Avisos actualizados')});break;
case 'rs-notice-smooth':rsNotice.smoothMode=!rsNotice.smoothMode;save('smooth_mode',rsNotice.smoothMode);rsApplyPerformancePreference();modal();break;
case 'rs-notice-open':s.modal=null;navigate(b.dataset.page==='revendedores'?'revendedores':'pedidos');break;
case 'rs-test-fps':rsMeasureFPS();break;
case 'close':case 'backdrop':s.modal=null;modal();break;
case 'fav':{let idx=s.favorites.indexOf(b.dataset.id);if(idx>=0)s.favorites.splice(idx,1);else s.favorites.push(b.dataset.id);save('favs',s.favorites);if(s.page==='perfil'||s.showFavs)render();else{b.classList.toggle('active');b.title=idx>=0?'Añadir a favoritos':'Eliminar de favoritos'}toast(idx>=0?'Eliminado de favoritos':'Guardado en favoritos');break;}
case 'only-favs':s.showFavs=!s.showFavs;render();break;
case 'filter':s.filter=b.dataset.value;render();break;
case 'reset-filters':s.filter='todos';s.search='';s.showFavs=false;render();break;
case 'set-payment':changePayment(b.dataset.value);break;
case 'open-payment-methods':s.paymentReturnModal=s.modal==='checkout'?'checkout':null;s.modal='payment-methods';modal();break;
case 'choose-payment':changePayment(b.dataset.value);break;
case 'offer-group':{const id=b.dataset.value,g=itemBy(s.detailId);if(!OFFER_TABS.some(t=>t[0]===id)||!g)break;const choice=sortedOffersForDisplay(g,id)[0];const first=choice?choice.index:-1;if(first<0){toast('Esta región no tiene productos de esa categoría.');break}s.offerGroup=id;s.selected=first;s.playerCheck=null;const pos=window.scrollY;render();window.scrollTo(0,pos);break;}
case 'select-offer':{let pos=window.scrollY;s.selected=Number(b.dataset.index);s.playerCheck=null;rsPlayerVerifyGeneration++;render();window.scrollTo(0,pos);queuePlayerVerification();break;}
case 'verify-player':{rsPlayerVerifyGeneration++;if(rsPlayerVerifyDebounce){clearTimeout(rsPlayerVerifyDebounce);rsPlayerVerifyDebounce=null}void verifyPlayerIdentity();break;}
case 'start-payment':void startPaymentReservation(b);break;
case 'checkout':{if(s.role==='guest'){s.page='login';render(true);toast('Inicia sesión para continuar con la compra');return}const o=itemBy(s.detailId)?.offers?.[s.selected];let v=(document.getElementById('player-input')?.value||s.player||'').trim();s.player=v;if(o?.kind!=='pin'&&v.length<3){toast('Primero escribe el ID o destinatario.');document.getElementById('player-input')?.focus();return}try{playerTargetData(o,true)}catch(err){toast(err.message);return}if(o?.kind!=='pin'&&!(s.playerCheck?.status==='valid'&&s.playerCheck.offerId===o.id&&s.playerCheck.player===v)){toast('Valida el ID para continuar. Si el juego no permite verificarlo, no puedes iniciar el pago.');return}s.checkoutSession=null;s.modal='purchase-confirm';modal();break;}
case 'add-cart':{let v=(document.getElementById('player-input')?.value||s.player||'').trim();s.player=v;const offer=itemBy(s.detailId)?.offers?.[s.selected];if(offer?.kind!=='pin'&&v.length<3){toast('Indica el ID o destinatario');return}let targets;try{targets=playerTargetData(offer,true)}catch(err){toast(err.message);return}s.cart.push({id:s.detailId,offer:s.selected,offerId:offer.id,player:s.player,targets,region:offer.region||s.regionChoice||'Global'});save('cart',s.cart);headerNav();toast('Producto añadido al carrito');break;}
case 'qty-minus':s.qty=Math.max(1,s.qty-1);modal();break;case 'qty-plus':s.qty=Math.min(20,s.qty+1);modal();break;


case 'remove-cart':{s.cart.splice(Number(b.dataset.index),1);save('cart',s.cart);headerNav();modal();break;}
case 'cart-first':case 'cart-pick':{const c=s.cart[Number(b.dataset.index||0)];if(!c)return;openRegionGame(c.id,c.region||'');const game=itemBy(c.id),index=game?.offers?.findIndex(o=>o.id===c.offerId);s.selected=index>=0?index:c.offer;s.player=String(c.player||'');const offer=game?.offers?.[s.selected],offerId=c.offerId||offer?.id;if(offerId)s.playerTargets[offerId]={...(c.targets||{})};if(!offer){toast('Esta oferta guardada ya no está disponible.');render();return}s.offerGroup=offerGroup(offer);s.playerCheck=null;s.modal=null;render(true);toast(offer.kind==='pin'?'Revisa la oferta y confirma la compra.':'Revisa y valida tu ID antes de continuar al pago.');break;}
case 'save-profile':{const name=(document.getElementById('profile-name')?.value||'').trim();if(!name){toast('Escribe un nombre');return}s.nickname=name.slice(0,32);save('nickname',s.nickname);render();toast('Nombre guardado');break;}
case 'order-details':s.selectedOrder=b.dataset.ref;s.modal='order';modal();void loadCustomerOrders();break;
case 'orders-filter':s.orderFilter=b.dataset.filter||'all';render();break;
case 'copy-order-summary':{const item=s.orders.find(x=>x.ref===b.dataset.ref);if(item){void navigator.clipboard.writeText(orderSummaryText(item)).then(()=>toast('Resumen copiado'),()=>toast('No se pudo copiar.'));}break;}
case 'share-order-summary':{const item=s.orders.find(x=>x.ref===b.dataset.ref);if(item){const msg=orderSummaryText(item);const phone=String(s.paymentConfig?.whatsappNumber||'').replace(/\D/g,'');const link='https://wa.me/'+(phone||'')+'?text='+encodeURIComponent(msg);window.open(link,'_blank','noopener,noreferrer');}break;}
case 'refresh-orders':void loadCustomerOrders();break;
case 'delete-order':s.orders=s.orders.filter(o=>o.ref!==b.dataset.ref);save('orders',s.orders);s.modal=null;render();toast('Pedido eliminado');break;
}});

function fmtMoney(v){return Number(v||0).toLocaleString('es-ES',{maximumFractionDigits:2})}
function adminSave(k,v){save(k,v)}
function authPage(){
 const registering=s.authMode==='register';
 const countryOptions=RS_COUNTRIES.map(([value,label])=>`<option value="${esc(value)}" ${value==='+53'?'selected':''}>${esc(label)}</option>`).join('');
 return `<div class="auth-page-v7"><section class="auth-card-v7">
  <div class="auth-brand-v7"><div class="brandmark"><img src="${document.querySelector('.brandmark img')?.src||''}" alt="Refills Shop"></div><span><strong>REFILLS SHOP</strong><small>RECARGAS Y PRODUCTOS DIGITALES</small></span></div>
  <div class="eyebrow">ACCESO SEGURO A TU CUENTA</div>
  <h1>${registering?'Crea tu cuenta':'Bienvenido de nuevo'}</h1>
  <p class="auth-lead-v7">${registering?'Regístrate con los mismos datos que utiliza Refills Shop: país, teléfono, nombre y contraseña.':'Entra con el país, teléfono y contraseña que ya utilizabas en la web anterior.'}</p>
  <div class="auth-tabs-v7"><button type="button" data-action="auth-mode" data-mode="login" class="${!registering?'active':''}">Iniciar sesión</button><button type="button" data-action="auth-mode" data-mode="register" class="${registering?'active':''}">Crear cuenta</button></div>
  <form id="auth-form" class="auth-form-v7" autocomplete="on">
   ${registering?`<div class="field-wrap"><label for="auth-fullname">Nombre completo</label><input id="auth-fullname" name="fullName" type="text" autocomplete="name" minlength="2" maxlength="90" placeholder="Tu nombre y apellidos" required></div>`:''}
   <div class="field-wrap"><label for="auth-country">País y número de teléfono</label><div class="phone-grid-v7"><select id="auth-country" name="countryCode" required>${countryOptions}</select><input id="auth-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="Tu número de teléfono" minlength="5" maxlength="18" required></div><small class="helper">Para Cuba (+53), escribe los 8 dígitos de tu línea; pueden comenzar por 5 o 6.</small></div>
   <div class="field-wrap"><label for="auth-password">Contraseña</label><input id="auth-password" name="password" type="password" autocomplete="${registering?'new-password':'current-password'}" minlength="${registering?'10':'1'}" maxlength="72" placeholder="${registering?'Mínimo 10 caracteres, letras y números':'Tu contraseña'}" required></div>
   ${!registering?`<label class="remember-row-v7" for="remember-session"><input id="remember-session" name="rememberSession" type="checkbox" ${s.rememberSession?'checked':''}><span><strong>Recordar mi sesión</strong><small>No tendrás que iniciar sesión cada vez en este dispositivo.</small></span></label>`:''}
   ${registering?`<input class="auth-honeypot-v7" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">`:''}
   ${s.authError?`<div class="auth-error-v7" role="alert">${esc(s.authError)}</div>`:''}
   <button class="btn primary auth-submit-v7" type="submit" ${s.authBusy?'disabled':''}>${s.authBusy?'Conectando…':registering?'Crear mi cuenta':'Iniciar sesión'}</button>
  </form>
  <button type="button" class="rs-install-entry" data-action="install-refills"><img class="rs-install-logo" src="/REFILLSHOP/assets/refills-app-192.png" alt=""><span>Instalar Refills Shop</span></button>
 </section></div>`;
}


async function openResellerPlanPreview(tier){
 if(!['free','level2','level3'].includes(tier)){toast('Plan no reconocido.');return}
 s.resellerPreviewTier=tier;s.resellerPreview=null;s.modal='reseller-preview';modal();
 try{
  const result=await edgeRequest('rs12-reseller','/offers/preview?tier='+encodeURIComponent(tier),{auth:true});
  if(s.modal!=='reseller-preview'||s.resellerPreviewTier!==tier)return;
  s.resellerPreview=result;modal();
 }catch(err){
  if(s.modal!=='reseller-preview')return;
  s.resellerPreview={previewOnly:true,tier,offers:[],error:err?.message||'Vista previa no disponible.'};
  modal();
 }
}

function resellerPage(){
 if(!s.user)return authPage();
 if(s.resellerLoading&&!s.resellerPortal)return `<div class="catalog-top"><div class="eyebrow">REFILLS SHOP / MAYORISTAS</div><h1 class="page-title">Portal de revendedores</h1><div class="card panel reseller-v7-empty">Cargando tus planes, wallet y datos de la cuenta…</div></div>`;
 const p=s.resellerPortal;
 if(!p)return `<div class="catalog-top"><div class="eyebrow">REFILLS SHOP / MAYORISTAS</div><h1 class="page-title">Portal de revendedores</h1><p class="page-lead">Consulta los tres planes y activa el que mejor se adapte a tu negocio.</p><div class="card panel reseller-v7-empty">No se pudo cargar el portal. <button class="btn primary" data-action="reseller-refresh">Reintentar</button></div></div>`;
 const membership=p.membership||{},activationRequired=membership.activationRequired===true||!membership.planTier,tier=String(membership.planTier||'free');
 const currentPlan=activationRequired?'Activación pendiente':tier==='level2'?'Level 2':tier==='level3'?'Level 3':'Gratis';
 const currentMargin=Number(membership.markupPercent||7);
 const expires=membership.expiresAt?new Date(membership.expiresAt):null;
 const daysLeft=expires?Math.max(0,Math.ceil((expires.getTime()-Date.now())/86400000)):null;
 const plans=(p.tiers||[]).map(t=>({...t,name:t.tier==='free'?'Gratis':t.name,markupPercent:Number(t.markupPercent||0),priceUsdt:Number(t.priceUsdt||0),days:Number(t.days||0)}));
 const smRate=Number(p.rates?.buySmPerUsdt||0),cupRate=Number(p.rates?.cupPerSm||0);
 const deposits=(s.resellerDeposits||[]).slice(0,5);
 const balance=p.wallet||{USDT:0,CUP:0,SM:0};
 return `<div class="catalog-top">
  <div class="reseller-v7-head"><div><div class="eyebrow">PORTAL INDEPENDIENTE / REVENDEDORES</div><h1 class="page-title">Panel de revendedores</h1><p class="page-lead">Tus planes, precios mayoristas y wallet en un solo lugar.</p></div><button class="reseller-v7-refresh" data-action="reseller-refresh">${I('arrow','tiny')} Actualizar</button></div>
  <section class="card wallet-hero" style="margin-top:16px">
   <span class="wallet-text">TU PLAN ACTUAL</span><div class="wallet-number" style="font-size:clamp(30px,5vw,42px)">${esc(currentPlan)}</div>
   <div class="muted">${activationRequired?'Para activar el plan Gratis realiza un depósito mínimo equivalente a 5.00 USDT. Se activa cuando administración verifique el ingreso.':`Precios finales disponibles en tu catálogo de revendedor${expires?` · Vence ${expires.toLocaleDateString('es-ES')} · ${daysLeft} días restantes`:' · Sin vencimiento'}`}</div>
   <div class="wallet-controls"><button class="btn primary" data-action="modal" data-modal="wallet">${I('plus','tiny')} Recargar wallet</button><button class="btn secondary" data-action="modal" data-modal="reseller-ledger">${I('file','tiny')} Movimientos</button></div>
  </section>
  <div class="section-head"><h2>Mi wallet</h2><span class="muted small">Saldos reales de tu cuenta</span></div>
  <div class="reseller-v7-balance-grid">
   <div class="reseller-v7-balance"><small>USDT</small><strong>${Number(balance.USDT||0).toFixed(2)}</strong></div>
   <div class="reseller-v7-balance"><small>CUP</small><strong>${fmtMoney(balance.CUP||0)}</strong></div>
   <div class="reseller-v7-balance"><small>SALDO MÓVIL</small><strong>${fmtMoney(balance.SM||0)}</strong></div>
  </div>
  <div class="section-head"><h2>Elige tu plan</h2><span class="muted small">Consulta una vista previa de los precios finales</span></div>
  <div class="reseller-v7-actions"><label class="muted small" for="reseller-currency">Pagar suscripción con</label><select id="reseller-currency" aria-label="Moneda para pagar el plan"><option value="USDT" ${s.resellerCurrency==='USDT'?'selected':''}>USDT</option><option value="CUP" ${s.resellerCurrency==='CUP'?'selected':''}>CUP</option><option value="SM" ${s.resellerCurrency==='SM'?'selected':''}>Saldo móvil (SM)</option></select></div>
  <div class="reseller-v7-plans">${plans.map(plan=>{
   const isCurrent=!!membership.planTier&&plan.tier===tier,isFree=plan.tier==='free';
   const priceLabel=isFree?'Gratis':`${plan.priceUsdt.toFixed(2)} USDT · ${smRate?Math.ceil(plan.priceUsdt*smRate):'—'} SM · ${smRate&&cupRate?Math.ceil(plan.priceUsdt*smRate*cupRate):'—'} CUP`;
   const duration=isFree?'Sin vencimiento':`${plan.days} días`;
   const update=plan.refresh==='daily_mini'?'Actualización diaria ligera':'Actualización diaria';
   const blockedLower=tier==='level3'&&plan.tier==='level2';
   const example=Object.values(s.wholesalePrices||{}).find(o=>Number(o.providerCostUsdt)>0);
   const examplePrice=example?Math.ceil(Number(example.providerCostUsdt)*(1+Number(plan.markupPercent||0)/100)*100)/100:null;
   return `<article class="reseller-v7-plan ${isCurrent?'current':''}">
    <div class="plan-kicker">${isCurrent?'TU PLAN ACTUAL':'PLAN DE REVENDEDOR'}</div><h3>${esc(plan.name)}</h3>
    <div class="plan-margin">${examplePrice!==null?`${examplePrice.toFixed(2)} USDT`:'Sin ofertas'}</div><div class="muted small">VISTA PREVIA${example?` · ${esc(example.name)}`:' · Publica una oferta para ver precios'}</div><p>${priceLabel} · ${duration}<br>${update}</p>
    ${isCurrent?(isFree?`<span class="current-pill">Activo</span>`:`<button class="btn secondary" data-action="reseller-subscribe" data-tier="${esc(plan.tier)}">Renovar ${esc(plan.name)}</button>`):blockedLower?`<button class="btn secondary" disabled>Requiere bajar de nivel al vencer</button>`:isFree&&activationRequired?`<button class="btn primary" data-action="modal" data-modal="wallet">Depositar 5 USDT para activar</button>`:isFree?`<span class="muted small">Disponible al cumplir el requisito de activación</span>`:`<button class="btn primary" data-action="reseller-subscribe" data-tier="${esc(plan.tier)}">Activar ${esc(plan.name)}</button>`}
    <button type="button" class="btn ghost rs-plan-preview-btn" data-action="reseller-preview" data-tier="${esc(plan.tier)}">${I('eye','tiny')} Ver todas las ofertas de ${esc(plan.name)}</button>
   </article>`;
  }).join('')}</div>
  <div class="card panel" style="margin:18px 0">
   <div class="section-head" style="margin-top:0"><h2>Recargas recientes</h2><button class="text-link" data-action="modal" data-modal="reseller-ledger">Ver movimientos ${I('arrow','tiny')}</button></div>
   ${deposits.length?`<div class="reseller-v7-history">${deposits.map(d=>`<div class="reseller-v7-history-row"><span><strong>Recarga ${esc(d.currency||'')}</strong><small>${formatShopDateTime(d.created_at||d.createdAt||Date.now())} · ${esc(d.status||'pendiente')}</small></span><strong>${fmtMoney(d.amount)} ${esc(d.currency||'')}</strong></div>`).join('')}</div>`:`<div class="reseller-v7-empty">Todavía no tienes recargas de wallet registradas.</div>`}
  </div>
  <div class="notice-grid"><button class="notice" data-action="nav" data-page="recargas"><span class="notice-icon">${I('game')}</span><span><strong>Volver a la tienda</strong><small>Explora juegos y productos</small></span>${I('arrow','tiny arrow')}</button><button class="notice" data-action="modal" data-modal="help"><span class="notice-icon">${I('headset')}</span><span><strong>Centro de ayuda</strong><small>Soporte y funcionamiento</small></span>${I('arrow','tiny arrow')}</button></div>
 </div>`;
}

/* La administración antigua ha sido retirada. Refills OS se encuentra en /REFILLSHOP/admin/ . */
function clientPrice(cost){
 const sm=Number(cost)*Number(s.rates.usdtSm)+Number(s.rates.gainSM||0);
 return {sm,cup:sm*Number(s.rates.smCup),usdt:sm/Number(s.rates.usdtSm)};
}


document.addEventListener('click',async e=>{
 const b=e.target.closest('[data-action]');if(!b)return;
 const a=b.dataset.action;
 if(a==='nav'&&b.dataset.page==='login'){s.page='login';render(true);return}
 if(a==='nav'&&b.dataset.page==='admin'&&s.role!=='admin'){toast('Acceso administrativo restringido');return}
 if(a==='nav'&&b.dataset.page==='revendedores'){s.page='revendedores';render(true);return}
 if(a==='google-login'){
  if(typeof window.REFILLS_AUTH?.signInWithGoogle==='function'){try{await window.REFILLS_AUTH.signInWithGoogle()}catch(err){toast('No se pudo iniciar sesión. Inténtalo nuevamente.')}}else toast('El inicio de sesión todavía no está conectado al servidor.');
  return;
 }
 if(a==='reseller-plan-request'||a==='choose-plan'){
  const plan=b.dataset.plan||'';
  const endpoint=window.REFILLS_CONFIG?.resellerEndpoint;
  if(!endpoint){toast('La activación de suscripciones requiere conexión con el servidor.');return}
  try{const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'request_plan',plan})});if(!response.ok)throw new Error('request failed');toast('Solicitud de plan enviada');}catch(err){toast('No se pudo enviar la solicitud.')}
  return;
 }
 if(a==='admin-tab'){s.adminTab=b.dataset.tab;render();return}
 if(a==='admin-add-game'){
  const name=document.getElementById('adm-game-name')?.value.trim(),id=document.getElementById('adm-game-id')?.value.trim(),cat=document.getElementById('adm-game-cat')?.value,photoKey=document.getElementById('adm-game-img')?.value,desc=document.getElementById('adm-game-desc')?.value.trim(),region=document.getElementById('adm-game-region')?.value.trim();
  if(!name||!id||ITEMS.some(x=>x.id===id)){toast('Completa nombre e ID único');return}
  ITEMS.push({id,name,category:cat,photo:photoKey||'tiles',region:region||'Global',desc:desc||'',offers:[]});saveCatalog();toast('Producto guardado en este navegador');render();return;
 }
 if(a==='admin-edit-game'){
  const g=itemBy(b.dataset.id);if(!g)return;
  const name=prompt('Nombre del producto',g.name);if(name===null)return;
  const desc=prompt('Descripción',g.desc||'');if(desc===null)return;
  g.name=name.trim()||g.name;g.desc=desc.trim();saveCatalog();render();toast('Producto actualizado');return;
 }
 if(a==='admin-delete-game'){
  const index=ITEMS.findIndex(x=>x.id===b.dataset.id);if(index<0)return;
  if(!confirm('¿Eliminar este producto y sus ofertas?'))return;
  ITEMS.splice(index,1);saveCatalog();render();toast('Producto eliminado');return;
 }
 if(a==='admin-add-offer'){
  const g=itemBy(b.dataset.id);if(!g)return;
  const title=prompt('Nombre de la oferta');if(!title)return;
  const cup=Number(prompt('Precio final CUP', ''));
  if(!Number.isFinite(cup)||cup<=0){toast('Introduce un precio CUP válido');return}
  const providerUsdt=Number(prompt('Costo del proveedor en USDT (opcional)', '0'))||0;
  g.offers.push({title:title.trim(),cup,providerUsdt,bonus:''});saveCatalog();render();toast('Oferta guardada');return;
 }
 if(a==='admin-edit-offer'){
  const g=itemBy(b.dataset.id),index=Number(b.dataset.index),o=g?.offers[index];if(!o)return;
  const title=prompt('Nombre de la oferta',o.title);if(title===null)return;
  const cup=Number(prompt('Precio final CUP',o.cup));if(!Number.isFinite(cup)||cup<=0){toast('Precio CUP no válido');return}
  const cost=prompt('Costo del proveedor USDT',o.providerUsdt||'');if(cost===null)return;
  o.title=title.trim();o.cup=cup;o.providerUsdt=Number(cost)||0;saveCatalog();render();toast('Oferta actualizada');return;
 }
 if(a==='admin-delete-offer'){
  const g=itemBy(b.dataset.id),index=Number(b.dataset.index);if(!g||!g.offers[index])return;
  if(!confirm('¿Eliminar esta oferta?'))return;
  g.offers.splice(index,1);saveCatalog();render();toast('Oferta eliminada');return;
 }
 if(a==='admin-save-rates'){
  const usdtSm=Number(document.getElementById('rate-usdt-sm')?.value),smCup=Number(document.getElementById('rate-sm-cup')?.value),gainSM=Number(document.getElementById('rate-gain-sm')?.value);
  if(usdtSm<=0||smCup<=0||gainSM<0||![usdtSm,smCup,gainSM].every(Number.isFinite)){toast('Revisa las tasas');return}
  s.rates={usdtSm,smCup,gainSM};save('rates',s.rates);toast('Tasas guardadas');render();return;
 }
 if(a==='admin-save-payments'){
  s.paymentConfig={smReceiver:document.getElementById('pay-sm')?.value.trim()||'',cupCard:document.getElementById('pay-cup')?.value.trim()||'',usdtAddress:document.getElementById('pay-usdt')?.value.trim()||'',whatsappNumber:document.getElementById('pay-whatsapp')?.value.trim()||'',usdtEnabled:!!document.getElementById('pay-usdt-enabled')?.checked};
  save('paymentConfig',s.paymentConfig);toast('Datos de pago guardados');return;
 }
 if(a==='admin-save-plans'){
  s.resellerPlans=s.resellerPlans.map((p,i)=>({...p,margin:Number(document.querySelector('.plan-margin[data-index="'+i+'"]')?.value??p.margin),price:Number(document.querySelector('.plan-price[data-index="'+i+'"]')?.value??p.price),days:Number(document.querySelector('.plan-days[data-index="'+i+'"]')?.value??p.days)}));
  save('resellerPlans',s.resellerPlans);toast('Planes guardados');render();return;
 }
 if(a==='admin-status'){
  const endpoint=window.REFILLS_CONFIG?.orderStatusEndpoint;
  if(!endpoint){toast('La actualización de pedidos requiere conexión con el servidor.');return}
  try{const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ref:b.dataset.ref,status:b.dataset.status})});if(!response.ok)throw new Error();toast('Estado actualizado');}catch(err){toast('No se pudo actualizar el pedido.')}
  return;
 }
 if(a==='copy-pay-confirmation'){
  const value=String(s.paymentConfig.cupConfirmPhone||'').trim();
  if(!value){toast('No está configurado el número de confirmación.');return;}
  try{await navigator.clipboard.writeText(value);toast('Número de confirmación copiado.')}
  catch{const input=document.createElement('textarea');input.value=value;input.style.position='fixed';input.style.opacity='0';document.body.appendChild(input);input.select();const copied=document.execCommand('copy');input.remove();toast(copied?'Número copiado.':'Mantén pulsado el número para copiarlo.');}
  return;
 }
 if(a==='copy-pay-recipient'){
 const value=s.payment==='cup'?s.paymentConfig.cupCard:s.payment==='mitransfer'?s.paymentConfig.mitransferPhone:s.payment==='sm'?s.paymentConfig.smReceiver:s.payment==='usdt'?s.paymentConfig.usdtAddress:'';
 if(!value){toast('No hay datos de pago configurados.');return}
 try{await navigator.clipboard.writeText(value);toast('Datos para pagar copiados.')}
 catch{const node=document.querySelector('.rs-pay-dest-value code');if(node){const range=document.createRange();range.selectNodeContents(node);getSelection()?.removeAllRanges();getSelection()?.addRange(range);document.execCommand('copy');getSelection()?.removeAllRanges();toast('Datos copiados.')}else toast('No se pudieron copiar los datos.')}
 return;
}
if(a==='copy-usdt-address'){
 const address=s.usdtPayment?.address||'';if(!address){toast('No hay una wallet configurada.');return}
 try{await navigator.clipboard.writeText(address);toast('Dirección USDT copiada.')}catch{const input=document.getElementById('usdt-wallet-address');if(input){input.focus();input.select();document.execCommand('copy');toast('Dirección copiada.')}else toast('No se pudo copiar la dirección.')}
 return;
}
if(a==='resume-usdt'){
 const order=s.orders.find(x=>x.ref===b.dataset.ref);if(!order||order.paymentStatus==='paid')return;
 s.usdtPayment={code:order.ref,amount:Number(order.total||0),address:s.paymentConfig.usdtAddress||'',network:'BEP-20',txHash:order.paymentTxHash||'',message:''};s.modal='usdt-wallet-pay';modal();return;
}
if(a==='verify-usdt-payment'){
 const code=s.usdtPayment?.code,txHash=String(document.getElementById('usdt-tx-hash')?.value||'').trim();
 if(!code||!/^0x[0-9a-fA-F]{64}$/.test(txHash)){toast('Introduce un hash BEP-20 válido.');return}
 b.disabled=true;b.textContent='Comprobando blockchain…';
 try{
  const result=await edgeRequest('rs10-api','/usdt-wallet/verify',{method:'POST',auth:true,body:{code,txHash}});
  s.usdtPayment={...s.usdtPayment,txHash,message:result.message||''};
  if(result.status==='confirmed'){s.modal=null;await loadCustomerOrders();navigate('pedidos');toast('Pago USDT confirmado automáticamente.');}
  else{modal();toast(result.message||'El pago todavía está pendiente de confirmación.')}
 }catch(err){toast(err?.message||'No se pudo verificar el hash.')}
 finally{b.disabled=false;b.textContent='Verificar pago automáticamente'}
 return;
}
if(a==='refresh-recent-topups'){s.recentTopupsLoaded=false;await loadRecentTopups(true);return}
if(a==='send-order'){
 const g=itemBy(s.detailId),o=g?.offers[s.selected];
 if(!s.user||!g||!o?.id){toast('Selecciona una oferta publicada.');return}
 if(!s.salesEnabled||!o.purchasable||!o.inStock){toast('La tienda todavía no acepta compras. No transfieras dinero.');return}
 if(s.qty!==1){toast('Realiza un pedido por oferta.');return}
 if(s.payment!=='balance'&&(!s.checkoutSession||s.checkoutSession.offerId!==o.id||Date.parse(s.checkoutSession.expiresAt)<=Date.now())){toast('La reserva de pago ya no es válida. Inicia de nuevo el pedido.');return}
 let targetPayload;
 try{targetPayload=playerTargetData(o,true)}catch(err){toast(err.message);return}
 const player=String(s.player||'').trim();
 if(o.kind!=='pin'&&!player&&!Object.keys(targetPayload).length){toast('Escribe el ID de jugador.');return}
 b.disabled=true;b.textContent='Registrando pedido…';
 try{
  let result;
  if(s.payment==='balance'){
   if(!resellerHasPlan())throw Error('Necesitas un plan activo de revendedor.');
   const live=await edgeRequest('rs12-reseller','/storefront',{auth:true});
   const item=(live.offers||[]).find(x=>x.id===o.id&&x.inStock===true);
   if(!item)throw Error('La oferta no está disponible al costo mayorista.');
   if(Number(s.reseller?.wallet?.USDT||0)<Number(item.resellerUsdt||0))throw Error('No tienes saldo USDT suficiente.');
   result=await edgeRequest('rs12-reseller','/orders',{method:'POST',auth:true,body:{offerId:o.id,clientRequestId:newRequestId(),playerId:player||'PIN',targetPayload,currency:'USDT'}});
   await loadResellerPortal(true,false);
  }else{
   const method=s.payment==='sm'?'mobile':s.payment==='cup'?'card':s.payment==='mitransfer'?'wallet':s.payment==='usdt'?'usdt_wallet':null;
   if(!method)throw Error('Método de pago no disponible.');
   const quotedAmount=Number(method==='mobile'?o.sm:method==='card'?o.card:method==='wallet'?o.cup:o.usdt);
   const quotedCurrency=method==='mobile'?'SM':method==='usdt_wallet'?'USDT':'CUP';
   if(!Number.isFinite(quotedAmount)||quotedAmount<=0)throw Error('El precio no está disponible.');
   const sourcePhone=method==='mobile'?String(document.getElementById('payment-source-phone')?.value||'').trim():'';
   if(method==='mobile'&&!/^[0-9]{8}$/.test(sourcePhone))throw Error('Introduce los 8 dígitos de la línea que envió saldo.');
   const paymentReference=['card','wallet'].includes(method)?String(document.getElementById('payment-reference')?.value||'').trim():'';
   if(method==='card'&&!paymentReference)throw Error('Escribe el número de confirmación que aparece en el comprobante de Transfermóvil.');
   if(paymentReference&&!/^[A-Za-z0-9][A-Za-z0-9._/-]{3,79}$/.test(paymentReference))throw Error('La referencia del comprobante contiene caracteres no válidos.');
   let receipt='';
   if(['mobile','card','wallet'].includes(method)){
    const file=document.getElementById('payment-proof')?.files?.[0];
    if(!file)throw Error('Adjunta la captura del pago realizado.');
    if(file.size>5242880||!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('La captura debe ser JPG, PNG o WEBP y pesar como máximo 5 MB.');
    receipt=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('No se pudo leer el comprobante.'));reader.readAsDataURL(file)});
   }
   result=await edgeRequest('rs10-api','/orders',{method:'POST',auth:true,body:{gameId:g.id,offerId:o.id,clientRequestId:s.checkoutSession.requestId,method,playerId:player||'PIN',targetPayload,quotedAmount,quotedCurrency,sourcePhone,paymentReference,receipt}});
   if(method==='usdt_wallet'){
    s.usdtPayment={code:result.order.code,amount:Number(result.payment?.amount||quotedAmount),address:result.payment?.address||s.paymentConfig.usdtAddress||'',network:'BEP-20',txHash:'',message:''};
    s.modal='usdt-wallet-pay';modal();toast('Pedido creado. Envía el importe exacto y verifica el hash.');return;
   }
  }
  if(!result?.ok&&!result?.order)throw Error('El servidor no confirmó el pedido.');
  s.checkoutSession=null;s.modal=null;s.orderJustSent=String(result?.order?.code||'');await loadCustomerOrders();navigate('pedidos');toast('Pedido recibido. Puedes compartir el resumen desde Mis pedidos.');
 }catch(err){toast(err?.message||'No se pudo registrar la compra.');}
 finally{b.disabled=false;b.textContent='Enviar solicitud de compra';}
 return;
}
if(a==='request-wallet-deposit'){
 if(!resellerHasPlan()){toast('Activa un plan de revendedor para recargar la wallet.');return}
 await submitResellerDeposit();return;
}

});


let rsOrderFetch=null;
async function loadCustomerOrders(){
 if(!s.user){s.orders=[];return}
 if(rsOrderFetch)return rsOrderFetch;
 const uid=s.user.id;
 rsOrderFetch=(async()=>{
  try{
   const result=await edgeRequest('rs10-api','/orders',{auth:true});
   if(s.user?.id!==uid)return;
   const oldOrdersJson=JSON.stringify(s.orders||[]);
   const items=(Array.isArray(result.orders)?result.orders:[]).map(x=>({
    id:x.id,ref:x.code,gameName:x.game,offer:x.offer,player:x.playerId||'PIN',
    payment:x.method==='mobile'?'Saldo móvil':x.method==='card'?'Transfermóvil':x.method==='wallet'?'MiTransfer':x.method==='usdt_wallet'?'USDT Wallet BEP-20':x.method==='usdt_bep20'?'USDT BEP-20':x.method,
    total:x.amount,currency:x.currency,status:x.status,paymentStatus:x.paymentStatus||'unpaid',
    paymentReference:x.paymentReference||'',paymentTxHash:x.paymentTxHash||'',refundReference:x.refundReference||'',
    date:x.created?formatShopDateTime(x.created):'',totalText:(Number(x.amount||0).toLocaleString('es-ES')+' '+(x.currency||''))
   }));
   s.orders=items;
   rsTrackOrders(items);
   if(s.page==='pedidos'&&JSON.stringify(items)!==oldOrdersJson){
    const y=window.scrollY;render();window.scrollTo(0,y);
    if(s.modal==='order')modal();
   }
  }catch(err){console.warn('No se pudo cargar el historial:',err?.message||err)}
 })().finally(()=>{rsOrderFetch=null});
 return rsOrderFetch;
}

// Los estados de entrega aparecen sin necesidad de recargar la página.
// El historial se actualiza mediante el único temporizador global mientras Pedidos esté visible.
let rsCatalogSnapshot='';
async function loadLiveCatalog(silent=false){
 if(silent&&(s.modal||['detalle','login'].includes(s.page)))return;
 if(!silent){s.catalogLoading=true;s.catalogError='';}
 try{
  const data=await edgeRequest('rs10-api','/storefront',{auth:false});
  const games=Array.isArray(data.games)?data.games:[],offers=Array.isArray(data.offers)?data.offers:[];
  const signature=JSON.stringify({games:[...games].sort((a,b)=>String(a.id).localeCompare(String(b.id))),offers:[...offers].sort((a,b)=>String(a.id).localeCompare(String(b.id))),config:data.config,salesEnabled:data.salesEnabled});
  if(silent&&signature===rsCatalogSnapshot)return;
  rsCatalogSnapshot=signature;
  const grouped=new Map();for(const g of games){
   const id=String(g.id||'').trim();if(!id)continue;
   grouped.set(id,{id,name:String(g.name||'Producto'),category:/gift|pin|tarjeta/i.test(String(g.tag||''))?'gift':(/m[oó]vil|internet|nauta|cubacel/i.test(String(g.tag||''))?'movil':'juegos'),photo:'',imageUrl:g.imageUrl||'',featured:g.featured===true,sortOrder:Number(g.sortOrder||99),marginPercent:Number(g.marginPercent||0),region:'Global',desc:'',offers:[]});
  }
  for(const o of offers){const game=grouped.get(String(o.gameId||''));if(!game||o.visible===false||o.inStock!==true)continue;
   game.offers.push({id:String(o.id||''),title:String(o.name||'Oferta'),cup:Number(o.cup||0),card:Number(o.card||o.cup||0),sm:Number(o.sm||0),usdt:Number(o.usdt||0),kind:o.kind||'topup',region:o.region||'Global',targetSchema:Array.isArray(o.targetSchema)?o.targetSchema:[],inStock:o.inStock===true,purchasable:o.purchasable===true,bonus:''});
  }
  ITEMS.splice(0,ITEMS.length,...[...grouped.values()].sort((a,b)=>Number(b.featured)-Number(a.featured)||a.sortOrder-b.sortOrder||a.name.localeCompare(b.name)));
  s.salesEnabled=data.salesEnabled===true;s.catalogLoading=false;
  if(data.config){
   s.rates={...s.rates,usdtSm:Number(data.config.buySmPerUsdt||s.rates.usdtSm),smCup:Number(data.config.cupPerSm||s.rates.smCup)};
   s.paymentConfig={...s.paymentConfig,smReceiver:data.config.mobilePhone||'',cupCard:data.config.cardNumber||'',cupConfirmPhone:data.config.confirmPhone||'',mitransferPhone:data.config.walletPhone||'',mitransferEnabled:data.config.mitransferEnabled===true,mitransferAutoEnabled:data.config.mitransferAutoEnabled===true,transfermovilAutoEnabled:data.config.transfermovilAutoEnabled===true,usdtEnabled:data.config.usdtWalletEnabled===true,usdtAddress:data.config.usdtWalletAddress||'',whatsappNumber:data.config.supportWhatsapp||''};
  }
  const validIds=new Set(ITEMS.map(g=>g.id));s.cart=s.cart.filter(c=>{const game=itemBy(c.id);if(!game||!validIds.has(c.id)||!game.offers.length)return false;return c.offerId?game.offers.some(o=>o.id===c.offerId):Boolean(game.offers[c.offer]);});save('cart',s.cart);
  if(s.page==='detalle'&&!validIds.has(s.detailId))s.page='recargas';
  const oldScroll=silent?window.scrollY:0;
  render();if(silent)window.scrollTo(0,oldScroll);
  void loadPublicChanges();if(s.page==='inicio')void loadRecentTopups();
 }catch(error){
  if(silent){console.warn('Refills Shop catalog refresh:',error?.message||error);return}
  s.catalogLoading=false;s.catalogError=error?.message||'No se pudo actualizar el catálogo desde Supabase';
  ITEMS.length=0;render();console.warn('Refills Shop storefront:',s.catalogError);
 }
}
let requestedPage='inicio';
if(location.pathname.replace(/\/$/,'')==='/admin'||location.hash==='#admin')requestedPage='admin';
else if(location.pathname.replace(/\/$/,'')==='/revendedores')requestedPage='revendedores';
else if(location.hash.startsWith('#producto/')){const id=decodeURIComponent(location.hash.slice(10));if(itemBy(id)){requestedPage='detalle';s.detailId=id}}
else if(labels[location.hash.slice(1)])requestedPage=location.hash.slice(1);
s.afterAuthPage=requestedPage==='login'?'inicio':requestedPage;
s.user=null;s.role='guest';s.authSession=null;s.profile=null;s.member=false;s.resellerPortal=null;
s.page='login';
render();
loadLiveCatalog();
/* Un solo programador, sin hacer consultas ni repintar mientras la app está oculta. */
const rsPollLast={orders:0,changes:0,catalog:0,recent:0,reseller:0};
function rsUpdateCycle(force=false){
 if(document.visibilityState!=='visible'||navigator.onLine===false)return;
 const now=Date.now();
 const slow=!!navigator.connection?.saveData||/^(slow-2g|2g)$/.test(String(navigator.connection?.effectiveType||''));
 const multiplier=slow?1.6:1;
 const due=(key,delay,work)=>{
  if(!force&&now-rsPollLast[key]<delay*multiplier)return;
  rsPollLast[key]=now;
  void Promise.resolve().then(work).catch(error=>console.warn('Sincronización:',error?.message||error));
 };
 if(s.user){
  due('orders',s.page==='pedidos'?27000:50000,()=>loadCustomerOrders());
  due('changes',90000,()=>loadPublicChanges(true));
  if(s.member)due('reseller',110000,()=>rsPollResellerEvents());
 }
 if(['inicio','recargas','gift','perfil','pedidos'].includes(s.page)&&!s.modal){
  due('catalog',90000,()=>loadLiveCatalog(true));
 }
 if(s.page==='inicio')due('recent',90000,()=>loadRecentTopups(true));
}
window.setInterval(()=>rsUpdateCycle(false),12000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')rsUpdateCycle(false)});
window.addEventListener('online',()=>rsUpdateCycle(true));

(async function restoreRefillsAccount(){
 try{
  const session=await validAuthSession();
  if(session){
   const authUser=await authRequest('/auth/v1/user',{token:session.access_token});
   s.authSession.user=authUser;
   await loadAccountProfile(authUser);
   s.page=requestedPage==='login'?'inicio':requestedPage;
   if(s.page==='revendedores'&&!s.resellerPortal)await loadResellerPortal(true,false);
   if(s.page==='admin'&&s.role!=='admin')s.page='inicio';
  }else{
   s.user=null;s.profile=null;s.member=false;s.role='guest';s.page='login';
  }
 }catch(error){
  s.user=null;s.profile=null;s.member=false;s.role='guest';s.page='login';s.authError='No se pudo sincronizar tu cuenta. Revisa tu conexión e inténtalo otra vez.';
  console.warn('Refills Shop auth restore:',error?.message||error);
 }
 render(true);
})();

const appSplash=document.getElementById('app-loader');
let appSplashFinished=false;
function finishAppSplash(){
 if(appSplashFinished)return;
 appSplashFinished=true;
 if(appSplash){appSplash.classList.add('is-hiding');window.setTimeout(()=>appSplash.remove(),480)}
}
if(document.readyState==='complete')window.setTimeout(finishAppSplash,220);
else window.addEventListener('load',()=>window.setTimeout(finishAppSplash,220),{once:true});
// Recuperación si alguna imagen externa o red no acaba de responder.
window.setTimeout(finishAppSplash,1450);
})();

