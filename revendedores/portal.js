(function Portal(){
'use strict';
const SB='https://kcgjlnymhmxylrjchcvl.supabase.co';
const PUB='sb_publishable_sGK_1a5Tp8gY83KI8wiSZg_LP5uxGdc';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=x=>Number.isFinite(Number(x))?Number(x):0;
const usdt=x=>num(x).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
const integer=x=>Math.ceil(num(x)).toLocaleString('es-ES',{maximumFractionDigits:0});
const status=s=>({pending:'Pendiente',processing:'Procesando',completed:'Completado',approved:'Aprobado',rejected:'Rechazado',failed:'Fallido'})[String(s)]||String(s||'Pendiente');
const date=s=>s?new Date(s).toLocaleDateString('es-ES',{year:'numeric',month:'short',day:'numeric'}):'Sin vencimiento';
const timestamp=s=>s?new Date(s).toLocaleString('es-ES'):'—';
const imageURL=s=>/^https:\/\//i.test(String(s||''))?String(s):'../assets/refills-icon.png';
const S={client:null,user:null,profile:null,membership:null,wallet:{USDT:0,CUP:0,SM:0},rates:{buySmPerUsdt:0,cupPerSm:0},tiers:[],instructions:{},deposits:[],games:[],offers:[],orders:[],view:'inicio',authMode:'login',selectedGame:'',selectedOffer:'',search:'',tier:'level2',currency:'USDT',pendingPlanId:null,pendingOrderId:null,busy:false,ready:false};
let notifyTimer=null;
function notify(message,error=false){const el=$('notice');if(!el)return;el.textContent=String(message||'').slice(0,320);el.classList.toggle('error',error);el.hidden=false;clearTimeout(notifyTimer);notifyTimer=setTimeout(()=>{el.hidden=true},5400)}
function fail(e){notify(String(e?.message||'No fue posible completar la operación.'),true)}
async function req(service,path,{method='GET',body,auth=true}={}){
 const headers={'Accept':'application/json','apikey':PUB};
 if(body!==undefined)headers['Content-Type']='application/json';
 if(auth){const {data}=await S.client.auth.getSession();if(!data?.session?.access_token)throw Error('La sesión venció. Vuelve a iniciar sesión.');headers.Authorization='Bearer '+data.session.access_token}
 let response;try{response=await fetch(SB+'/functions/v1/'+service+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),cache:'no-store'})}catch{throw Error('No hay conexión. Comprueba tu Internet e inténtalo de nuevo.')}
 let data;try{data=await response.json()}catch{throw Error('El servidor no devolvió una respuesta válida.')}
 if(!response.ok)throw Error(data?.error||data?.message||'La solicitud no pudo completarse.');
 return data;
}
function alias(phone){const digits=phone.replace(/\D/g,'');return (digits.startsWith('53')&&digits.length===10?'cu':'tel')+digits+'@refillshop.pages.dev'}
function phone(form){const prefix=String(form.elements.prefix.value),digits=String(form.elements.phone.value).replace(/\D/g,'');if(!/^\+[1-9]\d{0,2}$/.test(prefix)||digits.length<5||digits.length>12)throw Error('Revisa el prefijo y el teléfono.');if(prefix==='+53'&&!/^[56]\d{7}$/.test(digits))throw Error('En Cuba, el número debe tener 8 dígitos y empezar por 5 o 6.');if(prefix==='+1'&&digits.length!==10)throw Error('El número +1 debe tener 10 dígitos.');return prefix+digits}
function countries(){return [['+53','Cuba (+53)'],['+1','Estados Unidos (+1)'],['+34','España (+34)'],['+52','México (+52)'],['+57','Colombia (+57)'],['+58','Venezuela (+58)'],['+54','Argentina (+54)'],['+51','Perú (+51)'],['+56','Chile (+56)'],['+55','Brasil (+55)'],['+49','Alemania (+49)']].map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}
function loading(message='Cargando…'){$('content').innerHTML=`<section class="loading"><div class="loader"></div><strong>${esc(message)}</strong></section>`}
async function hydrate(){
 const p=await req('rs12-reseller','/portal');
 S.profile=p.profile;S.membership=p.membership||{planTier:'free',markupPercent:7,expiresAt:null};
 S.wallet=p.wallet||{USDT:0,CUP:0,SM:0};S.tiers=p.tiers||[];
 S.rates=p.rates||S.rates;S.instructions=p.paymentInstructions||{};S.deposits=p.deposits||[];
 const data=await req('rs12-reseller','/storefront').catch(e=>{if(/plan no est[aá] activo/i.test(e.message))return {games:[],offers:[]};throw e});
 S.games=data.games||[];S.offers=data.offers||[];
}
async function loadOrders(){const data=await req('rs12-reseller','/orders');S.orders=data.orders||[]}
async function reload(){loading('Actualizando tus datos');try{await hydrate();if(S.view==='pedidos'||S.view==='inicio')await loadOrders();render();notify('Datos actualizados.')}catch(e){fail(e);render()}}
function balanceSummary(){return `<div class="grid grid-3 balance-grid">${[['USDT',usdt(S.wallet.USDT)],['SALDO SM',integer(S.wallet.SM)],['CUP',integer(S.wallet.CUP)]].map(([name,value])=>`<div class="panel balance-card"><span>${name}</span><strong>${value}</strong></div>`).join('')}</div>`}
function sectionHead(title,action=''){return `<div class="section-head"><h2>${title}</h2>${action}</div>`}
function home(){
 const t=S.tiers.find(x=>x.tier===S.membership?.planTier),offers=S.offers.filter(x=>x.inStock),days=S.membership?.expiresAt?Math.max(0,Math.ceil((new Date(S.membership.expiresAt)-Date.now())/86400000)):null;
 return `<div class="hero"><section class="panel hero-intro"><span class="eyebrow">TU NEGOCIO, TU ESPACIO</span><h1 class="heading">Tu centro de <span style="color:#73cfff">reventas.</span></h1><p>Catálogo a precios de tu nivel, wallet y seguimiento de pedidos. Todo desde este portal independiente.</p><div class="tag-row"><span class="pill">${esc(t?.name||'Plan Gratis')}</span><span class="pill">Margen +${num(S.membership?.markupPercent||7)}%</span></div><div class="actions"><button class="button" data-view="catalogo">Explorar ofertas</button><button class="ghost" data-view="billetera">Recargar saldo</button></div></section><section class="panel hero-side"><div><span class="eyebrow">TU SUSCRIPCIÓN</span><span class="big">${days===null?'Gratis':days+' días'}</span><p class="dim tiny">${days===null?'Sin fecha de caducidad':days===0?'Revisa si tu plan ya ha vencido':'Vence el '+esc(date(S.membership.expiresAt))}</p></div><div><span class="eyebrow">OFERTAS DISPONIBLES</span><span class="big">${offers.length}</span><p class="dim tiny">Los precios se calculan para tu nivel en el servidor.</p></div></section></div>${balanceSummary()}
 <section class="section">${sectionHead('Accesos rápidos')}<div class="grid grid-3">${[['planes','Planes y renovaciones','Dos suscripciones de 15 días'],['catalogo','Catálogo mayorista','Precios adaptados a tu nivel'],['pedidos','Mis pedidos','Consulta el estado de las compras']].map(([v,t,d])=>`<button data-view="${v}" class="panel pad" style="text-align:left;color:inherit;cursor:pointer"><b>${t}</b><div class="dim tiny">${d}</div></button>`).join('')}</div></section>
 <section class="section">${sectionHead('Pedidos recientes','<button class="ghost small-button" data-view="pedidos">Ver todos</button>')}<div class="panel pad">${ordersRows(S.orders.slice(0,3))}</div></section>`;
}
function plans(){
 const markup=S.membership?.markupPercent||7;
 return `<span class="eyebrow">PRECIOS POR NIVEL</span><h1 class="heading">Suscripciones</h1><p class="sub">Elige tu plan. Level 2 y Level 3 duran 15 días cada uno, pero tienen un precio y un margen diferentes. Los importes se validan al activar.</p>
 <div class="grid grid-3">${S.tiers.map(t=>`<article class="panel tier ${t.tier===S.membership?.planTier?'active':''}"><span class="eyebrow">${t.tier==='free'?'ACCESO BASE':'PLAN DE REVENTA'}</span><h3>${esc(t.name)}</h3><div class="tier-price">${t.tier==='free'?'Gratis':usdt(t.priceUsdt)+' USDT'}<small>${t.tier==='free'?'Sin vencimiento':num(t.days)+' días'}</small></div><div class="dim reduced">Precio del proveedor +${num(t.markupPercent)}%<br>Catálogo actualizado para tu nivel</div>${t.tier===S.membership?.planTier?'<span class="pill">Plan actual</span>':t.tier==='free'?'<span class="dim tiny">Incluido al crear tu cuenta</span>':`<button class="button full" data-plan="${esc(t.tier)}">Elegir ${esc(t.name)}</button>`}</article>`).join('')}</div>
 <section class="panel pad section"><h2>Activar o renovar</h2><p class="dim reduced">Se descuenta directamente de tu wallet en USDT, CUP o SM. Las conversiones se calculan con las tasas configuradas por administración.</p>
 <form id="planForm" class="grid"><div class="two"><label class="field">Suscripción<select name="tier">${S.tiers.filter(t=>t.tier!=='free').map(t=>`<option value="${esc(t.tier)}" ${S.tier===t.tier?'selected':''}>${esc(t.name)} · ${usdt(t.priceUsdt)} USDT · ${num(t.days)} días</option>`).join('')}</select></label><label class="field">Pagar desde wallet<select name="currency"><option>USDT</option><option>SM</option><option>CUP</option></select></label></div><button class="button" type="submit">Confirmar suscripción</button></form>
 <p class="help">Tu plan actual tiene un margen de +${num(markup)}%. Si la wallet no tiene saldo suficiente, recárgala primero.</p></section>`;
}
function catalog(){
 const q=S.search.toLocaleLowerCase('es');
 const visible=S.games.filter(g=>g.name.toLocaleLowerCase('es').includes(q));
 return `<span class="eyebrow">OFERTAS DE REVENTA</span><h1 class="heading">Catálogo mayorista</h1><p class="sub">Ofertas y precios adaptados a tu suscripción. Selecciona el juego y revisa siempre el importe antes de comprar.</p>
 <form id="searchForm" class="form-actions" role="search"><input class="search" style="flex:1" name="search" type="search" placeholder="Buscar juego" value="${esc(S.search)}" aria-label="Buscar juego"><button class="ghost" type="submit">Buscar</button></form>
 <p class="dim tiny">Mostrando ${visible.length} de ${S.games.length} juegos · Margen de tu plan: +${num(S.membership?.markupPercent||7)}%</p>
 ${visible.length?`<div class="game-list">${visible.map(g=>{const count=S.offers.filter(o=>o.gameId===g.id&&o.inStock).length;return `<button class="game" data-game="${esc(g.id)}"><img src="${esc(imageURL(g.imageUrl))}" alt="" loading="lazy" onerror="this.onerror=null;this.src='../assets/refills-icon.png'"><span class="game-name">${esc(g.name)}</span><small class="game-count">${count} ofertas disponibles</small></button>`}).join('')}</div>`:'<div class="panel empty">No se encontraron juegos con esa búsqueda.</div>'}`;
}
function gamePage(){
 const g=S.games.find(g=>g.id===S.selectedGame);
 if(!g)return catalog();
 const offers=S.offers.filter(o=>o.gameId===g.id).sort((a,b)=>num(a.resellerUsdt)-num(b.resellerUsdt));
 return `<button class="back" data-view="catalogo">‹ Volver al catálogo</button><span class="eyebrow">PRECIOS PARA TU NIVEL</span><h1 class="heading">${esc(g.name)}</h1><p class="sub">${offers.length} ofertas · Precios finales en USDT, saldo móvil y CUP. Oferta sujeta a disponibilidad.</p>
 <div class="grid">${offers.map(o=>`<article class="panel offer"><div class="offer-info"><strong>${esc(o.name)}</strong><small>${esc(o.region||'Global')} · <span class="${o.inStock?'in-stock':'out-stock'}">${o.inStock?'Disponible':'Agotada'}</span></small><div class="price">${usdt(o.resellerUsdt)} USDT</div><div class="price-alt">${integer(o.resellerSm)} SM · ${integer(o.resellerCup)} CUP</div></div><button class="button" data-buy="${esc(o.id)}" ${o.inStock?'':'disabled'}>${o.inStock?'Comprar':'Agotada'}</button></article>`).join('')||'<div class="panel empty">Este juego no tiene ofertas activas para reventa.</div>'}</div>`;
}
function targetFields(o){
 const schema=Array.isArray(o.targetSchema)?o.targetSchema:[];
 if(schema.length)return schema.map((x,i)=>{const key=String(x.key||'').slice(0,55);return `<label class="field">${esc(x.label||key||'Dato '+(i+1))}<input name="target_${esc(key)}" type="text" minlength="1" maxlength="64" required autocomplete="off"></label>`}).join('');
 return `<label class="field">ID del jugador<input name="playerId" type="text" minlength="3" maxlength="80" required autocomplete="off"></label><label class="field">Zona o servidor (si aplica)<input name="zoneId" type="text" maxlength="50" autocomplete="off"></label>`;
}
function checkout(){
 const o=S.offers.find(x=>x.id===S.selectedOffer),g=S.games.find(x=>x.id===o?.gameId);
 if(!o||!g||!o.inStock)return `<div class="panel pad"><h1>Oferta no disponible</h1><button class="ghost" data-view="catalogo">Volver al catálogo</button></div>`;
 return `<button class="back" data-game="${esc(g.id)}">‹ Volver a las ofertas</button><span class="eyebrow">COMPRA REVENDEDOR</span><h1 class="heading">Confirmar pedido</h1><p class="sub">${esc(g.name)} · ${esc(o.name)}</p>
 <div class="grid grid-2"><form id="orderForm" class="panel pad"><h2>Datos del jugador</h2>${targetFields(o)}<label class="field">Moneda a descontar<select name="currency" required><option value="USDT">USDT · ${usdt(o.resellerUsdt)}</option><option value="SM">SM · ${integer(o.resellerSm)}</option><option value="CUP">CUP · ${integer(o.resellerCup)}</option></select></label><label class="checks"><input name="accept" type="checkbox" required> Confirmo el ID, el juego y el importe del pedido.</label><button class="button full" type="submit">Comprar con mi saldo</button><p class="help">El servidor vuelve a calcular el precio y verifica tu saldo antes de descontarlo. No envíes transferencias fuera de la wallet.</p></form>
 <aside class="panel pad"><span class="eyebrow">RESUMEN</span><h2>${esc(o.name)}</h2><p class="dim">${esc(g.name)} · ${esc(o.region)}</p><div class="checkout-summary panel"><strong>${usdt(o.resellerUsdt)} USDT</strong><div class="dim">${integer(o.resellerSm)} SM · ${integer(o.resellerCup)} CUP</div></div><p class="dim tiny">Margen actual +${num(S.membership?.markupPercent||7)}%. Si administración rechaza el pedido, el saldo usado se reintegra según las reglas del servidor.</p><button class="ghost full" data-view="billetera">Ver mi wallet</button></aside></div>`;
}
function instructions(currency){
 const i=S.instructions[currency]||{};
 const v=currency==='USDT'?i.address:i.destination;
 return `<div class="payment-instructions"><b>${currency==='USDT'?'USDT · '+esc(i.network||'BEP-20'):currency==='CUP'?'CUP · Transfermóvil':'SM · Saldo móvil ETECSA'}</b><small class="dim">Datos de pago configurados por administración</small><code>${esc(v||'Pendiente de configurar')}</code>${v?`<button type="button" class="ghost small-button" data-copy="${esc(v)}">Copiar dato</button>`:''}<p class="help">Verifica la moneda, red, importe y destino antes de enviar fondos. Un comprobante no acredita automáticamente tu wallet.</p></div>`;
}
function wallet(){
 return `<span class="eyebrow">SALDO DEL REVENDEDOR</span><h1 class="heading">Mi billetera</h1><p class="sub">Recarga tu cuenta en USDT, CUP o saldo móvil. Administración verifica las transferencias antes de acreditar los fondos.</p>${balanceSummary()}
 <div class="grid grid-2 section"><section class="panel pad"><h2>Solicitar recarga</h2><form id="depositForm">
 <label class="field">Moneda<select name="currency" id="depositCurrency"><option value="USDT">USDT · BEP-20</option><option value="CUP">CUP · Transfermóvil</option><option value="SM">SM · ETECSA</option></select></label><div id="paymentDetails">${instructions('USDT')}</div><label class="field">Importe a acreditar<input name="amount" type="number" min="0.01" step="0.01" required placeholder="Importe exacto"></label><label class="field">Número desde el que transferiste (para SM)<input name="senderPhone" type="tel" maxlength="20" placeholder="+5351234567"></label><label class="field">Hash de transferencia USDT (si corresponde)<input name="txHash" type="text" maxlength="66" placeholder="0x…"></label><label class="field">Comprobante (JPG, PNG o WEBP, máximo 5 MB)<input name="proof" type="file" accept="image/jpeg,image/png,image/webp"></label>
 <button class="button full" type="submit">Enviar solicitud</button><p class="help">Necesitas un comprobante o un hash de USDT. El saldo aparece disponible solo después de su aprobación.</p></form></section>
 <section class="panel pad"><h2>Recargas recientes</h2>${S.deposits.length?S.deposits.map(d=>`<div class="deposit-row"><div><strong>${integer(d.amount)} ${esc(d.currency)}</strong><small>${timestamp(d.createdAt)}</small></div><span class="status ${esc(d.status)}">${esc(status(d.status))}</span></div>`).join(''):'<p class="empty">Aún no hay recargas registradas.</p>'}</section></div>`;
}
function ordersRows(rows){
 return rows?.length?rows.map(o=>{
 const code=o.code||'';const name=o.game_name||o.game||'Pedido';
 return `<div class="order-row"><div><b>${esc(code)}</b><small>${esc(name)} · ${esc(o.offer_name||o.offer||'')}</small><small>${timestamp(o.created_at||o.createdAt)} · ${esc(o.wallet_currency||o.walletCurrency||'USDT')} ${num(o.wallet_amount??o.walletAmount).toLocaleString('es-ES',{maximumFractionDigits:2})}</small></div><span class="status ${esc(o.status)}">${esc(status(o.status))}</span></div>`;
 }).join(''):'<div class="empty">Todavía no tienes pedidos registrados.</div>';
}
function orders(){return `<span class="eyebrow">SEGUIMIENTO</span><h1 class="heading">Mis pedidos</h1><p class="sub">Consulta las compras realizadas desde tu wallet. No repitas un pedido mientras esté pendiente sin comprobar su estado.</p>
 <button class="ghost small-button" id="refreshOrders">Actualizar pedidos</button><section class="panel pad section">${ordersRows(S.orders)}</section>`}
function account(){
 const p=S.profile||{};
 return `<span class="eyebrow">ACCESO INDEPENDIENTE</span><h1 class="heading">Mi cuenta de revendedor</h1><p class="sub">Esta página tiene un inicio de sesión separado de la tienda para clientes. Tu perfil y tus operaciones se validan con los servicios protegidos de Refills Shop.</p>
 <div class="account-body"><section class="panel pad"><h2>Datos personales</h2><form id="profileForm"><label class="field">Nombre completo<input name="fullName" maxlength="90" minlength="2" value="${esc(p.fullName||'')}" autocomplete="name" required></label><label class="field">Teléfono de contacto, incluido el prefijo<input name="phone" type="tel" maxlength="19" minlength="8" value="${esc(p.phone||'')}" autocomplete="tel" required></label><button class="button" type="submit">Guardar datos</button></form></section>
 <section class="panel pad section"><h2>Seguridad</h2><form id="passwordForm"><label class="field">Nueva contraseña<input name="password" type="password" autocomplete="new-password" minlength="10" maxlength="72" required></label><label class="field">Confirmar contraseña<input name="confirm" type="password" autocomplete="new-password" minlength="10" maxlength="72" required></label><button class="ghost" type="submit">Cambiar contraseña</button></form></section>
 <button class="danger section" id="accountSignout">Cerrar sesión de revendedores</button></div>`;
}
function auth(){
 const register=S.authMode==='register';
 return `<div class="auth-wrap"><section class="panel auth-intro"><span class="eyebrow">PORTAL INDEPENDIENTE</span><h1>REFILLS <span style="color:#78cfff">PRO</span></h1><h2>Recargas digitales para revendedores.</h2><p>Tu propia entrada para consultar ofertas de reventa, activar planes de 15 días y administrar tu wallet. Sin mezclarte con la tienda para clientes.</p><div class="stats"><div class="stat"><small>LEVEL 2</small><strong>15 días</strong><small>+4% proveedor</small></div><div class="stat"><small>LEVEL 3</small><strong>15 días</strong><small>+2% proveedor</small></div><div class="stat"><small>PLAN GRATIS</small><strong>+7%</strong><small>Sin vencimiento</small></div></div></section>
 <section class="panel auth-card"><span class="eyebrow">ACCESO DE REVENDEDORES</span><h2>${register?'Crear mi cuenta':'Bienvenido de nuevo'}</h2><div class="auth-tabs"><button class="${register?'':'active'}" data-auth="login">Iniciar sesión</button><button class="${register?'active':''}" data-auth="register">Registrarme</button></div><form id="authForm"><input type="hidden" name="mode" value="${register?'register':'login'}">${register?'<label class="field">Nombre completo<input name="fullName" minlength="2" maxlength="90" autocomplete="name" required></label>':''}
 <div class="two"><label class="field">País<select name="prefix" required>${countries()}</select></label><label class="field">Número de teléfono<input name="phone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="5xxxxxxx" minlength="5" maxlength="15" required></label></div>
 <label class="field">Contraseña<input name="password" type="password" autocomplete="${register?'new-password':'current-password'}" minlength="${register?'10':'1'}" maxlength="72" required></label><input type="text" name="website" autocomplete="off" tabindex="-1" aria-hidden="true" class="sr-only"><button class="button full" type="submit">${register?'Crear cuenta de revendedor':'Acceder a Refills Pro'}</button></form>
 <p class="authentication-note">Si ya tienes una cuenta Refills Shop, puedes usar tus credenciales aquí; <strong>el inicio de sesión de este portal se guarda por separado</strong>. Al registrarte se asigna el plan Gratis.</p></section></div>`;
}
function render(){
 document.title='Refills Pro · Revendedores';
 if(!S.ready)return;
 const authed=!!S.user;
 $('portalNav').hidden=!authed;
 $('signout').hidden=!authed;
 $('memberChip').hidden=!authed;
 if(authed)$('memberChip').textContent=S.tiers.find(t=>t.tier===S.membership?.planTier)?.name||'Plan Gratis';
 $('portalNav').innerHTML=authed?[['inicio','Inicio'],['catalogo','Ofertas'],['planes','Planes'],['billetera','Wallet'],['pedidos','Pedidos'],['cuenta','Mi cuenta']].map(([v,label])=>`<button class="nav-button ${S.view===v||v==='catalogo'&&['juego','compra'].includes(S.view)?'active':''}" data-view="${v}">${label}</button>`).join(''):'';
 $('content').innerHTML=!authed?auth():(S.view==='inicio'?home():S.view==='catalogo'?catalog():S.view==='juego'?gamePage():S.view==='compra'?checkout():S.view==='planes'?plans():S.view==='billetera'?wallet():S.view==='pedidos'?orders():account());
}
async function go(view){S.view=view;S.search='';if(view==='pedidos'){loading('Buscando tus pedidos');try{await loadOrders()}catch(e){fail(e)}}render();scrollTo({top:0,behavior:'instant'})}
async function readProof(file){
 if(!file)return null;
 if(file.size>5*1024*1024)throw Error('La imagen no puede superar 5 MB.');
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Utiliza imágenes JPG, PNG o WEBP.');
 return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('No se pudo leer el comprobante.'));r.readAsDataURL(file)});
}
async function signout(){try{await S.client?.auth.signOut()}catch(e){fail(e)}S.user=null;S.profile=null;S.membership=null;S.wallet={USDT:0,CUP:0,SM:0};S.view='inicio';render()}
async function handleForm(f){
 if(S.busy)return;
 const id=f.id,button=f.querySelector('[type="submit"]');S.busy=true;if(button)button.disabled=true;
 try{
  if(id==='authForm'){
   const p=phone(f),password=String(f.elements.password.value);
   if(S.authMode==='register'){
    const fullName=String(f.elements.fullName.value).trim();
    if(fullName.length<2||password.length<10||!/[a-záéíóúñ]/i.test(password)||!/\d/.test(password))throw Error('Introduce tu nombre y una contraseña de al menos 10 caracteres con letras y números.');
    await req('rs10-api','/auth/phone-register',{auth:false,method:'POST',body:{fullName,phone:p,password,website:String(f.elements.website.value||'')}});
   }
   const {data,error}=await S.client.auth.signInWithPassword({email:alias(p),password});
   if(error)throw Error('No se pudo iniciar sesión. Comprueba el teléfono y la contraseña.');
   S.user=data.user;loading('Preparando tu cuenta de revendedor');await hydrate();S.view='inicio';await loadOrders().catch(()=>{});render();notify('Acceso correcto. Bienvenido a Refills Pro.');
  }else if(id==='planForm'){
   const tier=f.elements.tier.value,currency=f.elements.currency.value,t=S.tiers.find(t=>t.tier===tier);
   if(!t)throw Error('Selecciona un plan disponible.');
   if(!confirm(`¿Activar o renovar ${t.name} por ${usdt(t.priceUsdt)} USDT equivalentes desde tu wallet en ${currency}?`))return;
   S.pendingPlanId ||=crypto.randomUUID();
   await req('rs12-reseller','/subscribe',{method:'POST',body:{tier,currency,clientRequestId:S.pendingPlanId}});
   S.pendingPlanId=null;await hydrate();render();notify('Suscripción actualizada correctamente.');
  }else if(id==='searchForm'){S.search=String(f.elements.search.value||'').trim().slice(0,80);render();
  }else if(id==='orderForm'){
   const o=S.offers.find(x=>x.id===S.selectedOffer);if(!o||!o.inStock)throw Error('La oferta ya no está disponible.');
   const targetPayload={};let playerId='',zoneId='';
   const schema=Array.isArray(o.targetSchema)?o.targetSchema:[];
   if(schema.length){
    for(const x of schema){const v=String(f.elements['target_'+x.key]?.value||'').trim();if(!v||v.length>64)throw Error('Revisa el dato '+String(x.label||x.key));targetPayload[x.key]=v}
    playerId=String(targetPayload.player_id||targetPayload.user_id||targetPayload.service_user_id||Object.values(targetPayload)[0]||'').slice(0,80);
    zoneId=String(targetPayload.zone_id||targetPayload.server||'').slice(0,50);
   }else{playerId=String(f.elements.playerId.value).trim();zoneId=String(f.elements.zoneId.value||'').trim();if(playerId.length<3)throw Error('Escribe un ID de jugador válido.');targetPayload.player_id=playerId;if(zoneId)targetPayload.zone_id=zoneId}
   const currency=f.elements.currency.value;
   if(!f.elements.accept.checked)throw Error('Confirma los datos del pedido.');
   if(!confirm('¿Confirmas la compra y el descuento desde tu wallet en '+currency+'?'))return;
   S.pendingOrderId ||=crypto.randomUUID();
   const data=await req('rs12-reseller','/orders',{method:'POST',body:{offerId:o.id,clientRequestId:S.pendingOrderId,playerId,zoneId,targetPayload,currency}});
   S.pendingOrderId=null;await hydrate();await loadOrders();S.view='pedidos';render();notify('Pedido '+String(data.code||data.order?.code||'')+' registrado. Consulta su estado.');
  }else if(id==='depositForm'){
   const currency=f.elements.currency.value,amount=Number(f.elements.amount.value),txHash=String(f.elements.txHash.value||'').trim(),senderPhone=String(f.elements.senderPhone.value||'').trim();
   if(!Number.isFinite(amount)||amount<=0||(currency!=='USDT'&&!Number.isInteger(amount)))throw Error('Revisa el importe. CUP y SM requieren valores enteros.');
   if(currency==='SM'&&!/^\+?[1-9]\d{7,14}$/.test(senderPhone))throw Error('Para SM debes indicar el número que hizo la transferencia.');
   const proofData=await readProof(f.elements.proof.files?.[0]);
   if(!proofData&&!txHash)throw Error('Adjunta el comprobante o indica el hash USDT.');
   await req('rs12-reseller','/wallet/deposits',{method:'POST',body:{currency,amount,txHash,senderPhone,proofData}});
   await hydrate();render();notify('Solicitud enviada. Administración verificará tu recarga.');
  }else if(id==='profileForm'){
   const fullName=f.elements.fullName.value.trim(),phoneValue=f.elements.phone.value.trim();
   if(!fullName||!phoneValue)throw Error('Completa tu nombre y teléfono.');
   await req('rs10-api','/profile',{method:'PUT',body:{fullName,phone:phoneValue}});
   await hydrate();render();notify('Perfil actualizado.');
  }else if(id==='passwordForm'){
   const pass=String(f.elements.password.value),confirmPass=String(f.elements.confirm.value);
   if(pass!==confirmPass||pass.length<10||!/[a-záéíóúñ]/i.test(pass)||!/\d/.test(pass))throw Error('Las contraseñas deben coincidir y tener al menos 10 caracteres, con letras y números.');
   const {error}=await S.client.auth.updateUser({password:pass});if(error)throw error;f.reset();notify('Contraseña actualizada.');
  }
 }catch(e){fail(e)}
 finally{S.busy=false;if(button?.isConnected)button.disabled=false}
}
document.addEventListener('submit',e=>{if(e.target instanceof HTMLFormElement){e.preventDefault();void handleForm(e.target)}});
document.addEventListener('change',e=>{if(e.target.id==='depositCurrency'){$('paymentDetails').innerHTML=instructions(e.target.value)}});
document.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b||b.disabled)return;
 if(b.id==='signout'||b.id==='accountSignout')return void signout();
 if(b.dataset.auth){S.authMode=b.dataset.auth;render();return}
 if(b.dataset.view)return void go(b.dataset.view);
 if(b.dataset.game){S.selectedGame=b.dataset.game;S.view='juego';render();scrollTo(0,0);return}
 if(b.dataset.buy){S.selectedOffer=b.dataset.buy;S.pendingOrderId=null;S.view='compra';render();scrollTo(0,0);return}
 if(b.dataset.plan){S.tier=b.dataset.plan;S.view='planes';render();document.getElementById('planForm')?.scrollIntoView({behavior:'smooth',block:'center'});return}
 if(b.dataset.copy){try{await navigator.clipboard.writeText(b.dataset.copy);notify('Copiado.')}catch{notify('Mantén pulsado el dato para copiarlo.',true)}return}
 if(b.id==='refreshOrders'){try{await loadOrders();render();notify('Pedidos actualizados.')}catch(err){fail(err)}return}
});
async function start(){
 try{
  const bootstrap=await req('rs10-api','/bootstrap',{auth:false});
  if(!window.supabase?.createClient)throw Error('No fue posible cargar el acceso seguro.');
  S.client=window.supabase.createClient(bootstrap.supabaseUrl||SB,bootstrap.publishableKey||PUB,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'refills-pro-reseller-auth-v1'}});
  const {data}=await S.client.auth.getUser();S.user=data?.user||null;
  S.ready=true;
  if(S.user){await hydrate();await loadOrders().catch(()=>{});}
  render();
  S.client.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'&&S.user){S.user=null;S.profile=null;render()}else if(event==='SIGNED_IN'&&session?.user?.id!==S.user?.id){S.user=session.user;setTimeout(()=>{hydrate().then(()=>render()).catch(fail)},0)}});
 }catch(e){$('content').innerHTML=`<div class="panel pad" style="max-width:620px;margin:40px auto"><h1>No se pudo conectar</h1><p>${esc(e.message)}</p><button class="button" id="retryPortal">Reintentar</button></div>`;document.getElementById('retryPortal').onclick=start;}
}
void start();
})();