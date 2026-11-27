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
const s={page:'inicio',authMode:'login',authBusy:false,authError:'',rememberSession:(()=>{try{return localStorage.getItem('refills_shop_remember_session')!=='false'}catch{return true}})(),afterAuthPage:'inicio',authSession:null,profile:null,member:false,resellerPortal:null,resellerLoading:false,wholesalePrices:{},resellerOrders:[],resellerDeposits:[],resellerCurrency:'USDT',resellerDepositCurrency:'USDT',resellerDepositMethod:'USDT',resellerDepositStage:'methods',detailId:null,search:'',filter:'todos',offerGroup:'recargas',regionChoice:null,playerTargets:{},playerCheck:null,resellerPreview:null,resellerPreviewTier:'free',sort:'name',payment:'cup',selected:0,player:'',checkoutSession:null,qty:1,modal:null,usdtPayment:null,recentTopups:[],recentTopupsLoaded:false,changes:[],changesLoaded:false,changesLastSeen:getStored('changesSeen',0),changesLastToast:0, nickname:getStored('nickname','Invitado'),favorites:getStored('favs',[]),orders:[],cart:getStored('cart',[]),showFavs:false,selectedOrder:null, role:(window.REFILLS_SESSION&&window.REFILLS_SESSION.role)||'guest', user:(window.REFILLS_SESSION&&window.REFILLS_SESSION.user)||null,
rates:getStored('rates',{usdtSm:300,smCup:3,gainSM:0}), adminTab:'resumen',
adminOrders:getStored('adminOrders',[]), reseller:getStored('reseller',{plan:null,wallet:{USDT:0,CUP:0,SM:0},ledger:[]}),
paymentConfig:getStored('paymentConfig',{smReceiver:'',cupCard:'',cupConfirmPhone:'',usdtAddress:'',usdtEnabled:false,whatsappNumber:''}),
checkoutStep:1,checkoutProof:'',checkoutSource:'',checkoutMethod:'CUP',paymentReturnModal:null,
adminUsers:getStored('adminUsers',[]), resellerPlans:getStored('resellerPlans',[
{name:'Gratis',margin:7,price:0,days:0},{name:'Level 2',margin:4,price:.8,days:15},{name:'Level 3',margin:2,price:1.5,days:15}])};

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
function rsSystemNotice(title,detail,id,kind='order'){
 if(typeof Notification==='undefined'||Notification.permission!=='granted')return;
 const options={body:String(detail||'').slice(0,160),icon:'/REFILLSHOP/assets/refills-app-192.png',
  badge:'/REFILLSHOP/assets/refills-app-192.png',tag:'refills-'+String(id).slice(0,65),renotify:false,
  data:{url:kind==='wallet'||kind==='membership'?'/REFILLSHOP/#revendedores':kind==='store'?'/REFILLSHOP/#recargas':'/REFILLSHOP/#pedidos'}};
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
 if(kind==='order'||kind==='payment'||kind==='membership'||kind==='store')sound='silent';
 const ts=Date.now(),id=String(ts)+'-'+(++rsNotice.sequence);
 const notice={id,kind:String(kind||'store').slice(0,30),title:String(title||'Refills Shop').slice(0,120),
  detail:String(detail||'').slice(0,230),ts};
 rsNotice.items.unshift(notice);
 rsNotice.items=rsNotice.items.slice(0,50);
 rsSaveNotices();
 updateChangeBadge();
 if(s.modal==='alerts'&&document.activeElement?.tagName!=='BUTTON')modal();
 if(sound!=='silent')rsPlayNoticeSound(sound);
 if(sound!=='silent'&&['completed','warning','wallet'].includes(kind))rsSystemNotice(notice.title,notice.detail,id,kind);
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
 try{localStorage.removeItem(RS_AUTH_STORE);localStorage.removeItem('sb-kcgjlnymhmxylrjchcvl-auth-token');sessionStorage.removeItem(RS_AUTH_STORE);sessionStorage.removeItem('sb-kcgjlnymhmxylrjchcvl-auth-token')}catch{}
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
 s.profile=data.profile||null;s.rewardCoupons=[];s.rewardsLoaded=false;
 s.member=!!data.resellerActive;
 const name=data.profile?.fullName||authUser.user_metadata?.full_name||'Cliente';
 s.nickname=name;
 s.user={id:authUser.id,name,phone:data.profile?.phone||'',email:'',app_metadata:authUser.app_metadata||{}};
 rsNoticeAccount();
 s.role=authUser.app_metadata?.role==='refills_admin'?'admin':(s.member?'reseller':'customer');
 void loadCustomerOrders();void loadMyRewards();
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
 clearAuthSession();s.user=null;s.rewardCoupons=[];s.rewardsLoaded=false;s.orders=[];rsNoticeAccount();s.profile=null;s.member=false;s.role='guest';s.resellerPortal=null;s.reseller={...s.reseller,plan:null,wallet:{USDT:0,CUP:0,SM:0}};s.page='login';s.authMode='login';s.afterAuthPage='inicio';s.modal=null;render(true);toast('Has cerrado tu sesión.');
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
 const paymentMethod=document.getElementById('wallet-payment-method')?.value||'USDT';
 const amount=Number(document.getElementById('wallet-amount')?.value||0);
 const senderPhone=String(document.getElementById('wallet-sender')?.value||'').trim();
 const txHash=String(document.getElementById('wallet-txhash')?.value||'').trim();
 const file=document.getElementById('wallet-proof')?.files?.[0]||null;
 const button=document.querySelector('[data-action="reseller-deposit-submit"]');
 if(!Number.isFinite(amount)||amount<=0){toast('Introduce un importe válido.');return}
 if(s.resellerPortal?.membership?.activationRequired){const sm=Number(s.resellerPortal.rates?.buySmPerUsdt||0),cup=Number(s.resellerPortal.rates?.cupPerSm||0),equiv=currency==='USDT'?amount:currency==='SM'?amount/sm:amount/(sm*cup);if(!Number.isFinite(equiv)||equiv<5){toast('El primer depósito debe ser equivalente a 5.00 USDT o más.');return}}
 if(currency!=='USDT'&&!Number.isInteger(amount)){toast('Los importes en CUP y saldo móvil deben ser números enteros.');return}
 if(paymentMethod==='USDT'&&!txHash){toast('Pega el hash de la transferencia BEP-20 para verificarla automáticamente.');return}
 if(currency!=='USDT'&&!file){toast('Adjunta el comprobante de pago.');return}
 if(paymentMethod==='SM'&&!senderPhone){toast('Introduce el número desde el que realizaste la transferencia de saldo móvil.');return}
 if(button){button.disabled=true;button.textContent='Enviando solicitud…'}
 try{
  let result;if(paymentMethod==='USDT'){let depositId=s.resellerPendingCryptoDeposit;if(!depositId){const created=await edgeRequest('rs12-reseller','/wallet/crypto/create',{method:'POST',auth:true,body:{amount}});depositId=created.deposit.id;s.resellerPendingCryptoDeposit=depositId;}result=await edgeRequest('rs12-reseller','/wallet/crypto/verify',{method:'POST',auth:true,body:{id:depositId,txHash}});if(result?.status==='confirmed')s.resellerPendingCryptoDeposit=null;if(result?.status==='confirmed')rsAddNotice('wallet','Wallet recargada','Se acreditaron '+amount.toFixed(2)+' USDT automáticamente.','silent');else if(result?.status==='pending')throw Error(result.message||'El pago todavía no tiene las confirmaciones necesarias. Vuelve a comprobarlo en unos segundos.');}else{const proofData=await readFileAsDataUrl(file);result=await edgeRequest('rs12-reseller','/wallet/deposits',{method:'POST',auth:true,body:{currency,amount,paymentMethod,senderPhone,txHash,proofData}});if(result?.ok)rsAddNotice('wallet','Depósito solicitado','Solicitud registrada. Espera la confirmación del administrador.','silent');}
  await loadResellerPortal(true,false);
  s.modal=null;modal();if(s.page==='revendedores')render();
  toast(paymentMethod==='USDT'&&result?.status==='confirmed'?'¡Wallet recargada automáticamente!':'Solicitud registrada.');
 }catch(error){toast(error.message||'No se pudo enviar la solicitud.')}
 finally{const current=document.querySelector('[data-action="reseller-deposit-submit"]');if(current)current.disabled=false}
}


const REFILLS_WALLET_MARK='/REFILLSHOP/assets/refills-brand.webp';
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
 const methods=resellerHasPlan()?[['balance',PAYMENT_METHODS.balance]]:Object.entries(PAYMENT_METHODS).filter(([id])=>id!=='balance'||s.role==='reseller');
 return `<div class="payment-choice-list">${methods.map(([id,m])=>{
  const noPlan=id==='balance'&&!resellerHasPlan(),noCost=id==='balance'&&!!selectedOffer&&!balancePrice;
  const missing=(id==='sm'&&!s.paymentConfig.smReceiver)||(id==='cup'&&(!s.paymentConfig.cupCard||!s.paymentConfig.cupConfirmPhone))||(id==='mitransfer'&&!s.paymentConfig.mitransferPhone)||(id==='usdt'&&(!s.paymentConfig.usdtEnabled||!s.paymentConfig.usdtAddress));
  const disabled=missing||noPlan||noCost,active=s.payment===id;
  const description=id==='sm'?'Detección automática · confirma el número emisor':
   id==='cup'?'Transfermóvil · detección de avisos y revisión del ingreso':
   id==='mitransfer'?'MiTransfer · detección de avisos y revisión del ingreso':
   id==='balance'?(noPlan?'Disponible al activar Gratis, Level 2 o Level 3':noCost?'Esta oferta no tiene costo de proveedor configurado':`Wallet de revendedor · ${balanceAvailable.toFixed(2)} USDT disponibles`):
   'Verificación automática BEP-20 después de enviar el hash';
  const modeText=id==='balance'?'WALLET AUTOMÁTICA':id==='usdt'?'BLOCKCHAIN AUTOMÁTICA':'DETECCIÓN AUTOMÁTICA';
  const modeClass=id==='balance'||id==='usdt'?'auto':'review';
  return `<button type="button" class="payment-choice ${active?'active':''} ${id==='balance'?'payment-choice-balance':''}" data-action="choose-payment" data-value="${id}" ${disabled?'disabled':''} ${active?'aria-pressed="true"':'aria-pressed="false"'}>
   <span class="payment-choice-icon">${paymentVisual(id)}</span>
   <span class="payment-choice-copy"><strong>${esc(m.name)}</strong><small>${disabled?(noPlan?'Activa un plan de revendedor':noCost?'Costo del proveedor no disponible':'No habilitado o sin datos de cobro'):description}</small><em class="payment-mode-label ${modeClass}">${modeText}</em></span>
   <span class="payment-choice-state">${active?'✓':''}</span>
  </button>`;
 }).join('')}</div><p class="payment-choice-note">Refills Pay detecta avisos de SM y CUP automáticamente. La tienda comprueba el ingreso real antes de entregar. USDT se verifica en BEP-20.</p>`;
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
function minitile(g){return `<button class="tile" data-action="open-item" data-id="${g.id}"><div class="tile-image"><img loading="lazy" decoding="async" src="${photo(g)}" alt=""></div><span class="tile-name">${esc(g.name)}</span></button>`}
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
   // Las novedades se conservan en la campana, sin avisos de sistema ni sonidos.
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
 const rows=s.recentTopups||[],ranking=s.weekRanking||[];
 const iconFor=x=>/^https?:\/\//i.test(String(x.imageUrl||''))||String(x.imageUrl||'').startsWith('/REFILLSHOP/')?'<img src="'+esc(x.imageUrl)+'" alt="" loading="lazy">':I('game');
 return '<div class="rs-community-v56" id="recent-topups"><section class="card recent-topups-v1 rs-activity-v55"><div class="recent-topups-head"><div><span class="eyebrow">ACTIVIDAD DE HOY · CUBA</span><h2>Últimas recargas</h2><p>Pedidos pagados y entregados.</p></div><div class="rs-day-total"><strong>'+esc(s.dayTotal??'—')+'</strong><small>Recargas hoy</small></div></div>'
 + (rows.length?'<div class="recent-topups-list">'+rows.map(x=>'<article class="recent-topup-row"><span class="recent-topup-icon">'+iconFor(x)+'</span><span class="recent-topup-copy"><strong>'+esc(x.game||'Recarga')+'</strong><small>'+esc(x.offer||'Producto digital')+'</small><small>'+esc(x.customer||'Cliente')+' · '+esc(x.createdAt?formatShopTime(x.createdAt):'Hoy')+'</small></span><span class="recent-topup-status completed">Entregada</span></article>').join('')+'</div>':'<div class="recent-topups-empty">'+(s.recentTopupsLoaded?'Todavía no hay recargas entregadas hoy.':'Consultando actividad…')+'</div>')
 + '</section><section class="card recent-topups-v1 rs-activity-v55 rs-customer-ranking"><div class="recent-topups-head"><div><span class="eyebrow">CLASIFICACIÓN SEMANAL</span><h2>RANKING DE CLIENTE</h2><p>Clientes con mayor gasto durante la semana.</p></div><button class="btn ghost small" data-action="refresh-recent-topups" aria-label="Actualizar ranking">'+I('refresh')+'</button></div>'
 + (ranking.length?'<div class="recent-topups-list">'+ranking.map(x=>'<article class="recent-topup-row rs-customer-rank-row '+(Number(x.rank)===1?'rs-customer-rank-leader':'')+'"><span class="recent-topup-icon rs-rank-position">#'+esc(x.rank)+'</span><span class="recent-topup-copy"><strong>'+esc(x.customer||'Cliente')+'</strong><small>Gasto de la semana</small></span><span class="rs-customer-spent">'+esc(Number(x.spentCup||0).toLocaleString('es-CU',{maximumFractionDigits:2,minimumFractionDigits:0}))+' <small>CUP</small></span></article>').join('')+'</div>':'<div class="recent-topups-empty">'+(s.recentTopupsLoaded?'Todavía no hay participantes.':'Consultando clasificación…')+'</div>')
 + '<p class="rs-rank-note">Lunes a domingo · hora de Cuba. Importes equivalentes en CUP de recargas pagadas y completadas.</p></section></div>';
}
async function loadRecentTopups(force=false){
 if(s.recentTopupsLoaded&&!force)return;
 try{
  const response=await fetch(RS10_BASE+'/recent-topups',{headers:{apikey:RS_SUPABASE_KEY,accept:'application/json'},cache:'no-store'});
  if(!response.ok)throw Error('No se pudo consultar la actividad.');
  const data=await response.json();s.recentTopups=Array.isArray(data.topups)?data.topups.filter(x=>String(x.status||'')==='completed').slice(0,3):[];s.dayTotal=Number.isFinite(Number(data.totalToday))?Number(data.totalToday):null;s.weekRanking=Array.isArray(data.ranking)?data.ranking:[];s.recentTopupsLoaded=true;
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
 <button type="button" class="rs-install-entry" data-action="install-refills" aria-label="Instalar Refills Shop en este dispositivo"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/></svg><span>Instalar app</span></button>
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
async function loadMyRewards(){if(!s.user)return;const uid=s.user.id;try{const x=await edgeRequest('rs10-api','/rewards/me',{auth:true});if(s.user?.id!==uid)return;s.rewardCoupons=x.coupons||[];s.rewardsLoaded=true;if(s.page==='perfil'&&!s.modal)render()}catch{if(s.user?.id===uid){s.rewardsLoaded=false;if(s.page==='perfil'&&!s.modal)render()}}}
function profile(){
 const displayName=s.user?.name||'Mi cuenta',identity=s.user?.phone||'Cuenta Refills Shop',roleLabel=s.role==='reseller'?'Revendedor':s.role==='admin'?'Administrador':'Cliente',wallet=s.reseller?.wallet||{},activePlan=resellerHasPlan(),initial=String(displayName).trim().slice(0,2).toUpperCase()||'RS';
 const walletPanel=activePlan?`<section class="profile-wallet-v4">
  <div class="profile-wallet-head"><div><small>WALLET DE REVENDEDOR</small><span class="profile-plan-tag">${esc(s.reseller.plan)}</span></div><span class="profile-wallet-symbol">${I('wallet','big')}</span></div>
  <div class="profile-wallet-total"><strong>${Number(wallet.USDT||0).toFixed(2)}</strong><em>USDT</em><small>Saldo disponible</small></div>
  <div class="profile-wallet-secondary"><span>Saldo CUP <strong>${fmtMoney(wallet.CUP||0)}</strong></span><span>Saldo móvil <strong>${fmtMoney(wallet.SM||0)}</strong></span></div>
  <div class="profile-wallet-actions"><button class="btn primary" data-action="modal" data-modal="wallet">${I('plus','tiny')} Depositar</button><button class="btn secondary" data-action="modal" data-modal="reseller-ledger">${I('file','tiny')} Movimientos</button></div>
 </section>`:s.user?`<section class="profile-plan-locked-v4"><div><small>WALLET DE REVENDEDOR</small><strong>Activa uno de tus tres planes</strong><p>Consulta Gratis, Level 2 y Level 3 para habilitar los precios mayoristas y la wallet.</p></div><button class="btn primary" data-action="nav" data-page="revendedores">Ver planes</button></section>`:'';

 const orders=s.orders||[],completed=orders.filter(o=>o.status==='completed'&&o.paymentStatus==='paid').length,pending=orders.filter(o=>['pending','processing'].includes(o.status)).length;
 const link=(icon,title,sub,attrs)=>'<button class="setting" '+attrs+'><span class="set-icon">'+I(icon)+'</span><span class="set-copy"><strong>'+esc(title)+'</strong><small>'+esc(sub)+'</small></span>'+I('arrow','tiny')+'</button>';
 const coupons=s.rewardCoupons||[];
 return '<div class="catalog-top rs-profile-v55"><div class="eyebrow">REFILLS SHOP / MI ESPACIO</div><h1 class="page-title">Mi cuenta</h1><section class="rs-profile-banner"><div class="profile-avatar-v4">'+esc(initial)+'</div><div><span class="rs-reward-tag">'+esc(roleLabel)+'</span><h2>'+esc(displayName)+'</h2><small>'+esc(identity)+'</small></div></section><div class="rs-profile-stats"><article><strong>'+completed+'</strong><small>Entregadas</small></article><article><strong>'+pending+'</strong><small>En curso</small></article><article><strong>'+coupons.length+'</strong><small>Cupones</small></article></div>'
 +'<section class="card rs-profile-section"><h2>Mis recompensas</h2><p>Tus cupones personales aparecen aquí. Úsalos antes de pagar.</p>'+(coupons.length?coupons.map(x=>'<div class="rs-coupon-card"><div><strong>−'+esc(x.percent)+'%</strong><small>Vence '+esc(formatShopDateTime(x.expiresAt))+'</small><code>'+esc(x.code)+'</code></div><button class="btn secondary small" data-action="copy-reward" data-code="'+esc(x.code)+'">Copiar</button></div>').join(''):'<p class="rs-rank-note">'+(s.rewardsLoaded?'No tienes cupones personales disponibles.':'Consulta tus recompensas con el botón de actualizar.')+'</p>')+'<button class="btn secondary small" data-action="refresh-rewards">Actualizar cupones</button></section>'
 +'<section class="card rs-profile-section"><h2>Mi actividad</h2>'+link('file','Historial de compras','Ver recargas y comprobantes','data-action="nav" data-page="pedidos"')+link('star','Ranking semanal','Consulta los clientes destacados de la semana','data-action="nav" data-page="inicio"')+link('wallet','Planes mayoristas','Precios y wallet de revendedor','data-action="nav" data-page="revendedores"')+'</section>'+walletPanel
 +'<section class="card rs-profile-section"><h2>Cuenta y preferencias</h2><div class="profile-data-line"><span>Nombre registrado</span><strong>'+esc(displayName)+'</strong></div><div class="profile-data-line"><span>Teléfono</span><strong>'+esc(identity)+'</strong></div>'+link('bell','Notificaciones y sonidos','Avisos de compras y pagos','data-action="modal" data-modal="alerts"')+link('settings','Rendimiento','Medir fluidez de la web','data-action="rs-test-fps"')+link('headset','Ayuda y soporte','Preguntas sobre tu cuenta','data-action="modal" data-modal="help"')+(s.role==='admin'?'<a class="setting" href="/REFILLSHOP/admin/">'+I('shield')+' Panel de administración</a>':'')+'</section>'
 +'<section class="card rs-profile-section"><h2>Mis favoritos</h2>'+(s.favorites.length?'<div class="grid-media">'+s.favorites.map(id=>itemBy(id)).filter(Boolean).map(minitile).join('')+'</div>':'<p class="rs-rank-note">Guarda tus juegos favoritos desde el catálogo.</p>')+'</section><button class="btn secondary full" data-action="auth-logout">Cerrar sesión</button></div>';
}
function modalTitle(title,desc=''){return `<div class="modal-title"><div><h2>${title}</h2>${desc?`<p>${desc}</p>`:''}</div><button class="xbtn" data-action="close" aria-label="Cerrar">${I('close')}</button></div>`}

let rsCheckoutClockTimer=null;
function paymentClock(expiresAt,serverNow,receivedAt=performance.now()){
 const end=Date.parse(expiresAt),now=Date.parse(serverNow);
 if(!Number.isFinite(end)||!Number.isFinite(now))return null;
 return {expiresAt,deadlineMono:receivedAt+Math.max(0,end-now)};
}
function paymentRemaining(clock,now=performance.now()){
 return Number.isFinite(clock?.deadlineMono)?Math.max(0,Math.ceil((clock.deadlineMono-now)/1000)):null;
}
function activePaymentClock(){return s.modal==='usdt-wallet-pay'?s.usdtPayment:s.checkoutSession;}
let rsClockSync=null;
async function syncPaymentClock(){
 const current=activePaymentClock();if(!current?.code||!['checkout','usdt-wallet-pay'].includes(s.modal)||rsClockSync)return;
 rsClockSync=(async()=>{
  try{
   const data=await edgeRequest('rs10-api','/orders/clock?code='+encodeURIComponent(current.code),{auth:true});
   if(activePaymentClock()!==current)return;
   const clock=paymentClock(data.expiresAt,data.serverNow);
   if(clock)Object.assign(current,clock);
   if(data.hashRegistered&&s.modal==='usdt-wallet-pay')current.hashRegistered=true;
   if(['failed','rejected','refunded','completed'].includes(data.status)||data.paymentStatus==='paid')current.closed=true;
   startCheckoutCountdown();
  }catch(error){if(paymentRemaining(current)===null){const t=document.getElementById('rs-deadline-clock');if(t)t.textContent='Sin conexión';}}
 })().finally(()=>{rsClockSync=null});
 return rsClockSync;
}
function startCheckoutCountdown(){
 if(rsCheckoutClockTimer){clearInterval(rsCheckoutClockTimer);rsCheckoutClockTimer=null}
 const clock=document.getElementById('rs-deadline-clock');
 if(!clock||s.payment==='balance'&&s.modal==='checkout')return;
 function updateClock(){
  const target=document.getElementById('rs-deadline-clock');
  if(!target){clearInterval(rsCheckoutClockTimer);rsCheckoutClockTimer=null;return}
  const current=activePaymentClock();const remaining=current?.closed?0:paymentRemaining(current);
  if(remaining===null){target.textContent='Sincronizando…';for(const action of ['send-order','verify-usdt-payment']){const button=modalRoot.querySelector('[data-action="'+action+'"]');if(button){if(!button.disabled)button.dataset.clockBlocked="true";button.disabled=true}}return}
  if(current?.hashRegistered&&!current.closed&&s.modal==='usdt-wallet-pay'){target.textContent='Registrado';const small=target.closest('.rs-payment-deadline')?.querySelector('small');if(small)small.textContent='El hash ya está registrado. Puedes consultar sus confirmaciones.';const button=modalRoot.querySelector('[data-action="verify-usdt-payment"]');if(button&&!button.dataset.busy)button.disabled=false;return}
  target.textContent=String(Math.floor(remaining/60)).padStart(2,'0')+':'+String(remaining%60).padStart(2,'0');
  const panel=target.closest('.rs-payment-deadline');
  panel?.classList.toggle('is-urgent',remaining>0&&remaining<=120);
  panel?.classList.toggle('is-expired',remaining===0);
  if(remaining>0){const retry=panel?.querySelector('[data-action="restart-expired-order"]');if(retry){retry.remove();const small=panel?.querySelector('small');if(small)small.textContent='Confirma el envío antes de que termine el plazo.';}for(const action of ['send-order','verify-usdt-payment']){const button=modalRoot.querySelector('[data-action="'+action+'"]');if(button&&button.dataset.clockBlocked==='true'){button.disabled=false;delete button.dataset.clockBlocked;}}}
  if(remaining<=0){
   for(const action of ['send-order','verify-usdt-payment']){const button=modalRoot.querySelector('[data-action="'+action+'"]');if(button){if(!button.disabled)button.dataset.clockBlocked="true";button.disabled=true}}
   clearInterval(rsCheckoutClockTimer);rsCheckoutClockTimer=null;
   const small=panel?.querySelector('small');if(small)small.textContent='Reserva vencida. No envíes dinero. Si ya pagaste, contacta soporte antes de repetir el pago.';if(panel&&!panel.querySelector('[data-action="restart-expired-order"]')){const retry=document.createElement('button');retry.type='button';retry.className='btn primary full';retry.dataset.action='restart-expired-order';retry.textContent='Iniciar otro pedido';panel.appendChild(retry);}
  }
 }
 updateClock();const current=activePaymentClock();if(paymentRemaining(current)===null&&!current?.closed){void syncPaymentClock();return}if(rsCheckoutClockTimer===null&&!current?.closed&&paymentRemaining(current)>0)rsCheckoutClockTimer=setInterval(updateClock,1000);
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
    targetPayload,quotedAmount:amount,quotedCurrency:currency,couponCode:String(document.getElementById('rs-coupon-input')?.value||'').trim().toUpperCase()
  }});
  if(!result?.order?.code||!result?.expiresAt)throw Error('No se confirmó el plazo de pago en el servidor.');
  const timing=paymentClock(result.expiresAt,result.serverNow);if(!timing)throw Error('No se pudo sincronizar el plazo. No realices transferencias.');
  s.checkoutSession={requestId,code:result.order.code,...timing,method,offerId:o.id,gameId:g.id,player,amount:Number(result.amount??amount),currency:result.currency||currency,couponCode:result.couponCode||null};
  if(method==='usdt_wallet'){
   s.usdtPayment={code:result.order.code,amount:Number(result.payment?.amount??result.amount??amount),
     address:result.payment?.address||s.paymentConfig.usdtAddress||'',network:'BEP-20',
     txHash:'',message:'',...timing};
   s.modal='usdt-wallet-pay';
  }else{s.modal='checkout'}
  modal();
 }catch(err){toast(err?.message||'No se pudo reservar el pedido. No realices transferencias.');button.disabled=false;button.textContent='Confirmar y continuar al pago'}
}

function openDepositCheckout(){
 // Select one of the configured deposit channels; all approved deposits credit USDT.
 s.resellerDepositStage='methods';
 s.modal='wallet';
 modal();
}

async function copyPaymentValue(value,button){
 const text=String(value??'').trim();if(!text){toast('No hay datos disponibles para copiar.');return}
 let copied=false;
 try{await navigator.clipboard.writeText(text);copied=true}catch{
  const input=document.createElement('textarea');input.value=text;input.readOnly=true;input.style.cssText='position:fixed;left:-9999px;top:0;';document.body.appendChild(input);
  try{input.select();input.setSelectionRange(0,text.length);copied=document.execCommand('copy')}catch{}finally{input.remove()}
 }
 if(!copied){toast('Mantén pulsado el dato para copiarlo.');return}
 if(button){const old=button.textContent;button.textContent='Copiado';button.classList.add('rs-copied');clearTimeout(button.rsCopyTimer);button.rsCopyTimer=setTimeout(()=>{button.textContent=old==='Copiado'?'Copiar':old;button.classList.remove('rs-copied')},1600)}
}
function checkoutPaymentInstructions(){
 const method=s.payment;
 const data=method==='cup'?{name:'Tarjeta receptora · Transfermóvil',value:s.paymentConfig.cupCard,type:'Tarjeta CUP'}:
 method==='mitransfer'?{name:'Teléfono receptor · MiTransfer',value:s.paymentConfig.mitransferPhone,type:'Teléfono CUP'}:
 method==='sm'?{name:'Línea que recibe saldo móvil',value:s.paymentConfig.smReceiver,type:'Saldo móvil'}:
 method==='usdt'?{name:'Dirección USDT BEP-20',value:s.paymentConfig.usdtAddress,type:'BNB Smart Chain'}:
 {name:'Saldo de tu cuenta Refills Shop',value:'',type:'Wallet revendedor'};
 const explanation=method==='sm'?'Envía el saldo a esta línea. Escribe el número desde el que transferiste y pulsa Ya envié el saldo. Comprobaremos el ingreso antes de recargar.':
 method==='cup'?'Transfiere el importe exacto a la tarjeta indicada. El número de confirmación es un dato adicional de Transfermóvil, no otra tarjeta. Adjunta el comprobante; verificaremos el ingreso antes de entregar.':
 method==='mitransfer'?'Envía CUP a este teléfono mediante MiTransfer. Indica el número de la operación para localizarla. Se verificará la recepción antes de entregar.':
 method==='usdt'?'Primero crearemos el pedido y luego verás esta dirección y el campo de hash. Usa solo USDT BEP-20; el servidor comprobará token, importe y confirmaciones.':
 'El importe se descontará del saldo de tu wallet de revendedor después de validar disponibilidad.';
 return '<section class="rs-pay-destination" aria-label="Datos para realizar el pago">'
  +'<div class="rs-pay-dest-head"><span>DATOS PARA PAGAR</span><span class="rs-pay-dest-mode">'+(['sm','cup','mitransfer'].includes(method)?'DETECCIÓN AUTOMÁTICA · EN REVISIÓN':'VERIFICACIÓN AUTOMÁTICA')+'</span></div>'
  +'<div class="rs-pay-copy-card"><h3>'+esc(data.name)+'</h3>'
  +(data.value?'<div class="rs-pay-dest-value"><code>'+esc(data.value)+'</code><button class="btn secondary small" type="button" data-action="copy-pay-recipient">'+(method==='cup'?'Copiar tarjeta':method==='usdt'?'Copiar dirección':'Copiar número')+'</button></div>':'<div class="rs-pay-dest-value rs-pay-wallet-info">Pago desde tu saldo disponible</div>')+'</div>'
  +(method==='cup'?'<div class="rs-cup-confirm-data rs-pay-copy-card"><h3>Número de confirmación de Transfermóvil</h3>'
     +(s.paymentConfig.cupConfirmPhone?'<div class="rs-pay-dest-value"><code>'+esc(s.paymentConfig.cupConfirmPhone)+'</code><button class="btn secondary small" type="button" data-action="copy-pay-confirmation">Copiar número</button></div>':'<p class="rs-cup-confirm-warning">El número de confirmación todavía no está disponible. Contacta soporte antes de realizar la transferencia.</p>')
     +'</div>':'')
  +'<p>'+esc(explanation)+'</p></section>';
}
function modal(){
 if(!s.modal){modalRoot.innerHTML='';document.body.classList.remove('modal-open');return}
 document.body.classList.add('modal-open');
 let html='';const g=itemBy(s.detailId),o=g?.offers[s.selected]||g?.offers[0],p=o?currentPrice(o):null;
 const total=p?{...p,amount:s.modal==='checkout'&&s.checkoutSession?Number(s.checkoutSession.amount??p.amount*s.qty):p.amount*s.qty}:null;
 switch(s.modal){
 case 'install-guide':{
  const ios=/iPad|iPhone|iPod/.test(navigator.userAgent);
  const android=/Android/i.test(navigator.userAgent);
  const isChrome=android&&/Chrome\//.test(navigator.userAgent);
  html=modalTitle('Instalar app','Refills Shop')+'<div class="card panel rs-install-help">'+(ios?'<p>En Safari, toca Compartir y luego Añadir a pantalla de inicio.</p>':'<p>Abre el menú ⋮ de tu navegador y selecciona Instalar aplicación o Añadir a pantalla de inicio.</p>')+'<p class="helper">Si no aparece Instalar, puedes crear un acceso directo.</p></div>';
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
  + (s.payment==='balance'?'':'<label class="rs-coupon-label">Cupón de descuento (opcional)<input id="rs-coupon-input" class="field" maxlength="40" autocomplete="off" placeholder="Introduce tu código"></label><small class="rs-rank-note">El servidor comprueba el cupón y muestra el total definitivo antes de pagar.</small>')+'<p class="rs-confirm-warning">Después de confirmar tendrás 20 minutos para registrar el envío del pago. Si no lo haces, el pedido pasará a fallido.</p>'
  +'<button class="btn primary full" data-action="start-payment">Confirmar y continuar al pago</button><button class="btn ghost full" data-action="close">Corregir datos</button></div>';
 break;
}
case 'checkout':
  html=modalTitle('Realizar pago',s.payment==='balance'?'Confirmación con saldo de revendedor':s.payment==='sm'?'Transfiere el saldo y confirma el envío dentro de 20 minutos':'Envía el comprobante dentro del plazo de 20 minutos')+
  `<div class="rs-checkout-simple"><div class="rs-payment-deadline" ${s.payment==='balance'?'hidden':''}><span>TIEMPO RESTANTE</span><strong id="rs-deadline-clock">--:--</strong><small>${s.payment==='sm'?'Si no confirmas el envío, la solicitud vencerá automáticamente.':'Si no envías el comprobante, la solicitud vencerá automáticamente.'}</small></div>
   <div class="rs-checkout-total"><div><span>IMPORTE EXACTO</span><strong>${total?formatPriceValue(total.amount,total.currency):'No disponible'}</strong>${total&&s.payment!=='balance'?'<button class="btn secondary small" type="button" data-action="copy-pay-amount">Copiar importe</button>':''}</div><div><small>${esc(g?.name||'Recarga')} · ${esc(o?.title||'Paquete')}</small><small>Destino: ${esc(s.player||'Según producto')}</small>${s.checkoutSession?.couponCode?'<small>Cupón aplicado: '+esc(s.checkoutSession.couponCode)+'</small>':''}</div></div>
   <div class="rs-checkout-method"><span>${paymentVisual(s.payment)}<strong>${esc(paymentName())}</strong></span><span class="rs-payment-fixed">CONFIRMADO</span></div>
   ${checkoutPaymentInstructions()}
   ${Array.isArray(o?.targetSchema)&&o.targetSchema.length?'<div class="rs-checkout-confirmed"><strong>Datos de jugador guardados</strong>'+Object.entries(playerTargetData(o)).map(([key,value])=>'<span>'+esc((o.targetSchema.find(f=>f.key===key)||{}).label||key)+': <b>'+esc(value)+'</b></span>').join('')+'<small>Se tomaron de la pantalla anterior. Para cambiarlos, cierra el pago y vuelve al juego.</small></div>':''}
   ${s.payment==='sm'?'<div class="rs-checkout-inputs"><label class="sheet-label" for="payment-source-phone">Número que transfirió el saldo móvil</label><input id="payment-source-phone" class="field" type="tel" inputmode="numeric" pattern="[0-9]{8}" maxlength="8" placeholder="8 dígitos" required><small>Confirma solo después de transferir el importe exacto.</small></div>':''}
   ${s.payment==='cup'?'<div class="rs-checkout-inputs"><label class="sheet-label" for="payment-proof">Captura del comprobante</label><input id="payment-proof" class="field rs-proof-input" type="file" accept="image/png,image/jpeg,image/webp" required><small>JPG, PNG o WEBP · máximo 5 MB.</small><label class="sheet-label" for="payment-reference">Número de confirmación de la transferencia</label><input id="payment-reference" class="field" type="text" autocomplete="off" minlength="4" maxlength="80" placeholder="Código que aparece en Transfermóvil" required><small>Es obligatorio para identificar y revisar el pago.</small></div>':s.payment==='mitransfer'?'<div class="rs-checkout-inputs"><label class="sheet-label" for="payment-proof">Captura del comprobante</label><input id="payment-proof" class="field rs-proof-input" type="file" accept="image/png,image/jpeg,image/webp" required><small>JPG, PNG o WEBP · máximo 5 MB.</small><label class="sheet-label" for="payment-reference">Número de operación (opcional)</label><input id="payment-reference" class="field" type="text" autocomplete="off" maxlength="80" placeholder="Si aparece en tu comprobante"><small>Confirmaremos que el importe llegó a la cuenta receptora.</small></div>':''}
   ${s.payment==='usdt'?'<div class="rs-checkout-safe">Primero registra el pedido para reservar su identificador. Después envía USDT y pega el hash en la siguiente pantalla. No transfieras antes de crear el pedido.</div>':''}
   ${s.payment==='balance'?'<div class="rs-checkout-safe">Solo revendedores con suscripción activa y saldo suficiente pueden utilizar esta opción.</div>':''}
   <button class="btn primary full rs-checkout-submit" data-action="send-order">${I('check','tiny')} ${s.payment==='usdt'?'Crear pedido y continuar al hash':s.payment==='balance'?'Confirmar compra con saldo':s.payment==='sm'?'Ya envié el saldo':'Enviar comprobante y crear pedido'}</button>
   <p class="rs-checkout-footnote">${s.payment==='usdt'?'La recarga comenzará cuando la blockchain confirme el pago.':s.payment==='balance'?'El servidor verificará tu saldo disponible.':s.payment==='sm'?'Comprobaremos que recibimos el saldo antes de entregar la recarga.':'Enviar la captura no significa que el pago esté aprobado.'}</p>
  </div>`;
  break;
 case 'usdt-wallet-pay':{
  const pay=s.usdtPayment||{};
  html=modalTitle('Pagar con USDT BEP-20','Envía el importe exacto desde tu wallet')+
   `<div class="usdt-wallet-pay-v1"><div class="rs-payment-deadline"><span>TIEMPO PARA REGISTRAR EL HASH</span><strong id="rs-deadline-clock">--:--</strong><small>El pedido vencerá si no envías el hash a tiempo.</small></div>
    <div class="usdt-pay-order"><small>PEDIDO</small><strong>${esc(pay.code||'—')}</strong></div>
    <div class="usdt-pay-amount"><small>IMPORTE EXACTO</small><strong>${Number(pay.amount||0).toFixed(2)} USDT</strong><button class="btn secondary small" data-action="copy-pay-amount">Copiar importe</button></div>
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
  const method=s.resellerDepositMethod||'USDT';
  const options={
   USDT:{currency:'USDT',title:'USDT · BEP-20',subtitle:'Verificación automática en BNB Smart Chain',name:'Wallet receptora · USDT BEP-20',recipient:String(settings.USDT?.address||''),network:String(settings.USDT?.network||'BEP-20'),visual:paymentVisual('usdt'),note:'Envía el importe exacto en USDT BEP-20 a esta dirección. Después pega el hash de la transacción: la web comprobará automáticamente la red, el token, el importe y las confirmaciones antes de acreditar tu wallet.'},
   SM:{currency:'SM',title:'Saldo móvil ETECSA',subtitle:'Captura y número de origen · Revisión manual',name:'Número receptor · Saldo móvil',recipient:String(settings.SM?.destination||''),network:'SM',visual:paymentVisual('sm'),note:'Envía el saldo a la línea indicada, adjunta una captura e introduce el número desde el que realizaste la transferencia.'},
   CARD:{currency:'CUP',title:'Tarjeta · Transfermóvil',subtitle:'Transferencia a tarjeta · Revisión manual',name:'Tarjeta receptora',recipient:String(settings.CARD?.destination||''),confirmPhone:String(settings.CARD?.confirmPhone||''),visual:paymentVisual('cup'),note:'Transfiere CUP a la tarjeta indicada y adjunta el comprobante. El abono se convierte a USDT al tipo de cambio configurado.'},
   MITRANSFER:{currency:'CUP',title:'MiTransfer',subtitle:'Transferencia a teléfono · Revisión manual',name:'Teléfono receptor · MiTransfer',recipient:String(settings.MITRANSFER?.destination||''),visual:paymentVisual('mitransfer'),note:'Envía CUP mediante MiTransfer al teléfono indicado y adjunta el comprobante. El abono se convierte a USDT al tipo de cambio configurado.'}
  };
  let current=options[method];currency=current.currency;s.resellerDepositCurrency=currency;
  if(s.resellerDepositStage==='details'&&!current.recipient)s.resellerDepositStage='methods'
  if(s.resellerDepositStage!=='details'){
   html=modalTitle('Depositar en wallet','Elige cómo deseas recargar tu cuenta de revendedor')+
    '<div class="rs-checkout-simple rs-wallet-deposit-ui"><div class="rs-checkout-total"><div><span>TU SALDO DISPONIBLE</span><strong>'+
    Number(s.reseller.wallet?.USDT||0).toFixed(2)+' <small>USDT</small></strong></div><div><small>Recarga con USDT, saldo móvil, tarjeta o MiTransfer. Todo se convierte a USDT y se acredita tras verificar el pago.</small></div></div>'+
    '<div class="rs-wallet-stage-head"><strong>Selecciona un método de depósito</strong><small>Los datos para pagar aparecerán en el siguiente paso.</small></div>'+
    '<div class="payment-choice-list">'+Object.entries(options).map(([code,item])=>{
     const available=!!item.recipient;
     return '<button type="button" class="payment-choice rs-wallet-method" data-action="wallet-select-currency" data-currency="'+code+'" '+(!available?'disabled':'')+'>'+
       '<span class="payment-choice-icon">'+item.visual+'</span><span class="payment-choice-copy"><strong>'+esc(item.title)+'</strong><small>'+esc(available?item.subtitle:'Método sin cuenta receptora configurada')+'</small></span><span class="payment-choice-arrow">'+I('arrow','tiny')+'</span></button>';
    }).join('')+'</div>'+
    '<div class="rs-wallet-review-note">Todos los depósitos se convierten y acreditan en USDT después de verificar la transferencia. No compartas datos de tu cuenta con terceros.</div></div>';
   break;
  }
  const balance=Number(s.reseller.wallet?.USDT||0),minimumDeposit=currency==='USDT'?5:currency==='SM'?Math.ceil(5*smRate):Math.ceil(5*smRate*cupRate);
  html=modalTitle('Depositar en wallet',activationRequired?'Activa Gratis con un depósito verificado':'Datos para transferir y enviar comprobante')+
   '<div class="rs-checkout-simple rs-wallet-deposit-ui"><div class="rs-checkout-total"><div><span>IMPORTE A DEPOSITAR</span><strong id="wallet-deposit-preview">0.00 <small>'+currency+'</small></strong><small id="wallet-usdt-estimate">Saldo estimado: 0.00 USDT</small></div><div><small>Saldo actual: '+balance.toFixed(2)+' USDT</small><small>USDT: acreditación automática al confirmar la transferencia en la red.</small></div></div>'+
   '<div class="rs-checkout-method"><span>'+current.visual+'<strong>'+esc(current.title)+'</strong></span><button type="button" class="btn ghost small" data-action="wallet-change-currency">Cambiar</button></div>'+
   '<div class="rs-checkout-inputs rs-wallet-amount-field"><label class="sheet-label" for="wallet-amount">¿Cuánto deseas depositar? ('+currency+')</label>'+
    '<input id="wallet-amount" class="field" type="number" inputmode="decimal" min="'+(activationRequired?minimumDeposit:(currency==='USDT'?'0.01':'1'))+'" step="'+(currency==='USDT'?'0.01':'1')+'" autocomplete="off" placeholder="'+(activationRequired?minimumDeposit.toLocaleString('es-ES'):(currency==='USDT'?'Ejemplo: 5.00':'Ejemplo: 500'))+'" required>'+
    '<small>'+(activationRequired?'Para activar Gratis, deposita al menos '+minimumDeposit.toLocaleString('es-ES')+' '+currency+' (equivalente a 5 USDT). Se activa cuando administración apruebe el ingreso.':'Envía exactamente el importe que indicas aquí.')+'</small><input id="wallet-currency" type="hidden" value="'+currency+'"><input id="wallet-payment-method" type="hidden" value="'+method+'"></div>'+
   '<section class="rs-pay-destination"><div class="rs-pay-dest-head"><span>DATOS PARA PAGAR</span><span class="rs-pay-dest-mode">EN REVISIÓN</span></div>'+
    '<h3>'+esc(current.name)+'</h3>'+
    '<div class="rs-pay-dest-value">'+(current.recipient?
      '<code>'+esc(current.recipient)+'</code><button type="button" class="btn secondary small" data-action="wallet-copy-recipient">Copiar</button>':
      '<span class="rs-wallet-missing">No hay datos receptores configurados. No envíes dinero.</span>')+'</div>'+
    (currency==='USDT'?'<div class="rs-wallet-network">RED · '+esc(current.network)+'</div>':'')+
    
    '<p>'+esc(current.note)+'</p></section>'+
   '<div class="rs-checkout-inputs rs-wallet-evidence">'+
   (currency==='USDT'?'<label class="sheet-label" for="wallet-txhash">Hash de transacción (obligatorio para acreditar)</label><input id="wallet-txhash" class="field" type="text" autocomplete="off" placeholder="0x…" required><small>La acreditación se realiza automáticamente tras 40 confirmaciones en BNB Smart Chain.</small>':'')+
   (method==='SM'?'<label class="sheet-label" for="wallet-sender">Número desde el que transferiste</label><input id="wallet-sender" class="field" type="tel" inputmode="numeric" maxlength="20" placeholder="Número de la línea emisora" required>':'')+
   (currency==='USDT'?'':'<label class="sheet-label" for="wallet-proof">Captura del comprobante (obligatoria)</label><input id="wallet-proof" class="field rs-proof-input" type="file" accept="image/png,image/jpeg,image/webp" required><small>JPG, PNG o WEBP · tamaño máximo 5 MB.</small>')+'</div>'+
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
    `<div class="section-head"><h3>Recargas</h3></div>${deposits.length?deposits.map(d=>`<div class="summary-row"><span>${esc(d.payment_method||d.method||'Recarga')} · ${esc(d.status||'pendiente')}<small style="display:block;color:var(--muted)">${formatShopDateTime(d.created_at||d.createdAt||Date.now())} · Acreditación: ${fmtMoney(d.creditedUsdt||0)} USDT</small></span><strong>${fmtMoney(d.amount)} ${esc(d.currency||'')}</strong></div>`).join(''):`<div class="reseller-v7-empty">No tienes recargas registradas.</div>`}
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
 const registerRefillsWorker=()=>navigator.serviceWorker.register('/REFILLSHOP/sw.js?v=5',{scope:'/REFILLSHOP/',updateViaCache:'none'}).catch(error=>console.warn('PWA Refills Shop:',error?.message||error));
 if(document.readyState==='complete')void registerRefillsWorker();
 else window.addEventListener('load',()=>{void registerRefillsWorker()},{once:true});
}
function render(scroll=false){document.body.dataset.rsPage=s.page;document.body.classList.toggle('rs-auth-screen',s.page==='login'&&!s.user);rsApplyPerformancePreference();headerNav();
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
 s.modal=null;if(page!=='detalle')s.search='';s.filter='todos';s.showFavs=false;s.page=page;render(true);history.replaceState(null,'','#'+page);if(page==='inicio')void loadRecentTopups(true);if(page==='pedidos')void loadCustomerOrders();if(page==='perfil'){void loadMyRewards();void loadCustomerOrders();}
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
document.addEventListener('input',e=>{if(e.target?.id==='wallet-amount'){const el=document.getElementById('wallet-deposit-preview');const est=document.getElementById('wallet-usdt-estimate');const curr=s.resellerDepositCurrency||'USDT';const v=Number(e.target.value);const sm=Number(s.resellerPortal?.rates?.buySmPerUsdt||0),cup=Number(s.resellerPortal?.rates?.cupPerSm||0);const usdt=curr==='USDT'?v:curr==='SM'?v/sm:v/(sm*cup);if(el)el.innerHTML=(Number.isFinite(v)&&v>0?v.toLocaleString('es-ES',{minimumFractionDigits:curr==='USDT'?2:0,maximumFractionDigits:curr==='USDT'?2:0}):'0.00')+' <small>'+curr+'</small>';if(est)est.textContent='Saldo estimado: '+(Number.isFinite(usdt)&&usdt>0?usdt.toFixed(2):'0.00')+' USDT';}
if(e.target.id==='catalog-search'){s.search=e.target.value;refreshCatalog()}if(e.target.id==='player-input'){s.player=e.target.value;s.playerCheck=null;queuePlayerVerification()}if(e.target.matches('.rs-target-field')){const offer=itemBy(s.detailId)?.offers?.[s.selected];if(offer){s.playerTargets[offer.id]||={};s.playerTargets[offer.id][e.target.dataset.targetKey]=e.target.value;s.playerCheck=null;queuePlayerVerification()}}});
document.addEventListener('change',e=>{if(e.target.id==='sort-catalog'){s.sort=e.target.value;refreshCatalog()}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&s.modal){s.modal=null;modal()}if((e.key==='Enter'||e.key===' ')&&e.target.classList.contains('brand')){e.preventDefault();navigate('inicio')}if((e.key==='Enter'||e.key===' ')&&e.target.classList.contains('product-clickable')){e.preventDefault();openDetail(e.target.dataset.id)}});
document.addEventListener('click',e=>{rsUnlockNoticeSound();let b=e.target.closest('[data-action]');if(!b)return;const action=b.dataset.action;if(action==='backdrop'&&e.target!==b)return;e.preventDefault();switch(action){
case 'auth-mode':s.authMode=b.dataset.mode==='register'?'register':'login';s.authError='';render();break;
case 'auth-logout':void signOutRefills();break;
case 'refresh-rewards':void loadMyRewards();break;
case 'copy-reward':void copyPaymentValue(b.dataset.code,b);break;
case 'reseller-refresh':void loadResellerPortal(false,true);break;
case 'reseller-subscribe':void activateResellerPlan(b.dataset.tier);break;
case 'reseller-preview':void openResellerPlanPreview(b.dataset.tier);break;
case 'reseller-deposit-submit':void submitResellerDeposit();break;

case 'nav':navigate(b.dataset.page);break;case 'modal-nav':navigate(b.dataset.page);break;
case 'home-wallet-deposit':if(resellerHasPlan())openDepositCheckout();else{s.modal='wallet';modal()}break;
case 'install-refills':requestRefillsInstallation();break;case 'check-install-app':void checkRefillsInstall();break;case 'home-wallet-movements':s.modal='reseller-ledger';modal();break;
case 'wallet-select-currency':{s.resellerDepositMethod=b.dataset.currency;s.resellerDepositCurrency=b.dataset.currency==='SM'?'SM':b.dataset.currency==='USDT'?'USDT':'CUP';s.resellerDepositStage='details';modal();break;}
case 'wallet-change-currency':{s.resellerDepositStage='methods';modal();break;}
case 'wallet-copy-confirmation':{const val=String(s.resellerPortal?.paymentInstructions?.CUP?.confirmationPhone||s.paymentConfig.cupConfirmPhone||'').trim();if(!val){toast('Falta el número de confirmación de CUP');break;}void navigator.clipboard?.writeText(val).then(()=>toast('Número de confirmación copiado'),()=>toast('Mantén pulsado el número para copiarlo'));break;}
case 'wallet-copy-recipient':{const data=s.resellerPortal?.paymentInstructions||{};const method=s.resellerDepositMethod||'USDT';const val=method==='USDT'?data.USDT?.address:method==='SM'?data.SM?.destination:method==='CARD'?data.CARD?.destination:data.MITRANSFER?.destination;if(!val){toast('No hay cuenta receptora configurada');break;}void navigator.clipboard?.writeText(String(val)).then(()=>toast('Datos para pagar copiados'),()=>toast('Mantén pulsado el dato para copiarlo'));break;}
case 'open-item':openDetail(b.dataset.id);break;
case 'choose-region':openRegionGame(b.dataset.id,b.dataset.region);break;
case 'modal':s.modal=b.dataset.modal;if(s.modal==='wallet'){openDepositCheckout();break}if(s.modal==='alerts'){rsNoticeAccount();rsMarkNoticesRead();void loadPublicChanges(true);}modal();break;
case 'rs-notice-sound':rsNotice.soundEnabled=!rsNotice.soundEnabled;save('notice_sound',rsNotice.soundEnabled);if(rsNotice.soundEnabled){rsUnlockNoticeSound();rsPlayNoticeSound('completed')}modal();break;
case 'rs-notice-system':void rsRequestSystemNotices();break;
case 'rs-notice-refresh':void Promise.allSettled([loadCustomerOrders(),loadPublicChanges(true),rsPollResellerEvents()]).then(()=>{if(s.modal==='alerts')modal();toast('Avisos actualizados')});break;
case 'rs-notice-smooth':rsNotice.smoothMode=!rsNotice.smoothMode;save('smooth_mode',rsNotice.smoothMode);rsApplyPerformancePreference();modal();break;
case 'rs-notice-open':s.modal=null;navigate(b.dataset.page==='revendedores'?'revendedores':'pedidos');break;
case 'rs-test-fps':rsMeasureFPS();break;
case 'restart-expired-order':{const current=activePaymentClock();if(!current?.closed&&paymentRemaining(current)!==0)break;s.checkoutSession=null;s.usdtPayment=null;s.checkoutProof='';s.checkoutSource='';s.modal=null;modal();void loadCustomerOrders();toast('Puedes iniciar otra compra. Si pagaste la anterior, contacta soporte.');break;}
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
  <button type="button" class="rs-install-entry" data-action="install-refills"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/></svg><span>Instalar app</span></button>
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
 const balance=p.wallet||{USDT:0};
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
 if(a==='copy-pay-amount'){
 const offer=itemBy(s.detailId)?.offers?.[s.selected];const amount=s.modal==='usdt-wallet-pay'?s.usdtPayment?.amount:(s.checkoutSession?.amount??(offer?currentPrice(offer)?.amount*s.qty:null));
 if(Number.isFinite(amount)&&amount>0)await copyPaymentValue(String(amount),b);else toast('Importe no disponible.');return;
}
if(a==='copy-pay-confirmation'){await copyPaymentValue(s.paymentConfig.cupConfirmPhone,b);return;}
if(a==='copy-pay-recipient'){
 const value=s.payment==='cup'?s.paymentConfig.cupCard:s.payment==='mitransfer'?s.paymentConfig.mitransferPhone:s.payment==='sm'?s.paymentConfig.smReceiver:s.payment==='usdt'?s.paymentConfig.usdtAddress:'';
 await copyPaymentValue(value,b);return;
}
if(a==='copy-usdt-address'){await copyPaymentValue(s.usdtPayment?.address,b);return;}
if(a==='resume-usdt'){
 const order=s.orders.find(x=>x.ref===b.dataset.ref);if(!order||order.paymentStatus==='paid')return;
 s.checkoutSession=null;s.usdtPayment={code:order.ref,amount:Number(order.total||0),address:s.paymentConfig.usdtAddress||'',network:'BEP-20',txHash:order.paymentTxHash||'',message:'',hashRegistered:!!order.paymentTxHash};s.modal='usdt-wallet-pay';modal();void syncPaymentClock();return;
}
if(a==='verify-usdt-payment'){
 const code=s.usdtPayment?.code,txHash=String(document.getElementById('usdt-tx-hash')?.value||'').trim();
 if(!code||!/^0x[0-9a-fA-F]{64}$/.test(txHash)){toast('Introduce un hash BEP-20 válido.');return}
 if(s.usdtPayment?.closed||(!s.usdtPayment?.hashRegistered&&!(paymentRemaining(s.usdtPayment)>0))){toast('Comprueba el plazo del pedido antes de enviar.');return}
 b.dataset.busy='true';b.disabled=true;b.textContent='Comprobando blockchain…';
 try{
  const result=await edgeRequest('rs10-api','/usdt-wallet/verify',{method:'POST',auth:true,body:{code,txHash}});
  s.usdtPayment={...s.usdtPayment,txHash,message:result.message||''};
  if(result.status==='confirmed'){s.modal=null;await loadCustomerOrders();navigate('pedidos');toast('Pago USDT confirmado automáticamente.');}
  else{modal();toast(result.message||'El pago todavía está pendiente de confirmación.')}
 }catch(err){toast(err?.message||'No se pudo verificar el hash.')}
 finally{delete b.dataset.busy;b.disabled=false;b.textContent='Verificar pago automáticamente';if(s.modal==='usdt-wallet-pay')void syncPaymentClock()}
 return;
}
if(a==='refresh-recent-topups'){s.recentTopupsLoaded=false;await loadRecentTopups(true);return}
if(a==='send-order'){
 const g=itemBy(s.detailId),o=g?.offers[s.selected];
 if(!s.user||!g||!o?.id){toast('Selecciona una oferta publicada.');return}
 if(!s.salesEnabled||!o.purchasable||!o.inStock){toast('La tienda todavía no acepta compras. No transfieras dinero.');return}
 if(s.qty!==1){toast('Realiza un pedido por oferta.');return}
 if(s.payment!=='balance'&&(!s.checkoutSession||s.checkoutSession.offerId!==o.id||paymentRemaining(s.checkoutSession)===null||paymentRemaining(s.checkoutSession)<=0)){toast('La reserva de pago ya no es válida. Inicia de nuevo el pedido.');return}
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
   const quotedAmount=Number(s.checkoutSession?.amount??(method==='mobile'?o.sm:method==='card'?o.card:method==='wallet'?o.cup:o.usdt));
   const quotedCurrency=method==='mobile'?'SM':method==='usdt_wallet'?'USDT':'CUP';
   if(!Number.isFinite(quotedAmount)||quotedAmount<=0)throw Error('El precio no está disponible.');
   const sourcePhone=method==='mobile'?String(document.getElementById('payment-source-phone')?.value||'').trim():'';
   if(method==='mobile'&&!/^[0-9]{8}$/.test(sourcePhone))throw Error('Introduce los 8 dígitos de la línea que envió saldo.');
   const paymentReference=['card','wallet'].includes(method)?String(document.getElementById('payment-reference')?.value||'').trim():'';
   if(method==='card'&&!paymentReference)throw Error('Escribe el número de confirmación que aparece en el comprobante de Transfermóvil.');
   if(paymentReference&&!/^[A-Za-z0-9][A-Za-z0-9._/-]{3,79}$/.test(paymentReference))throw Error('La referencia del comprobante contiene caracteres no válidos.');
   let receipt='';
   if(['card','wallet'].includes(method)){
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
  s.checkoutSession=null;s.modal=null;s.orderJustSent=String(result?.order?.code||'');if(s.orderJustSent)rsAddNotice('order','Pedido registrado','Solicitud '+s.orderJustSent+' recibida. Consulta su entrega en Mis pedidos.','silent');await loadCustomerOrders();navigate('pedidos');toast('Pedido recibido. Puedes compartir el resumen desde Mis pedidos.');
 }catch(err){toast(err?.message||'No se pudo registrar la compra.');}
 finally{b.disabled=false;b.textContent=s.payment==='sm'?'Ya envié el saldo':'Enviar solicitud de compra';}
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
   if((s.page==='pedidos'||s.page==='perfil')&&JSON.stringify(items)!==oldOrdersJson){
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
const rsPollLast={orders:-Infinity,changes:-Infinity,catalog:-Infinity,recent:-Infinity,reseller:-Infinity};const rsPollActive=new Set();
function rsUpdateCycle(force=false){
 if(document.visibilityState!=='visible'||navigator.onLine===false)return;
 const now=performance.now();
 const slow=!!navigator.connection?.saveData||/^(slow-2g|2g)$/.test(String(navigator.connection?.effectiveType||''));
 const multiplier=slow?1.6:1;
 const due=(key,delay,work)=>{
  if(rsPollActive.has(key)||(!force&&now-rsPollLast[key]<delay*multiplier))return;
  rsPollLast[key]=now;rsPollActive.add(key);
  void Promise.resolve().then(work).catch(error=>console.warn('Sincronización:',error?.message||error)).finally(()=>rsPollActive.delete(key));
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
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){void syncPaymentClock();rsUpdateCycle(false)}});
window.addEventListener('online',()=>{void syncPaymentClock();rsUpdateCycle(true)});

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

