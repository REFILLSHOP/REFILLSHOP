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
const imageURL=s=>/^https:\/\//i.test(String(s||''))?String(s):'/REFILLSHOP/assets/refills-icon.png';
const S={client:null,user:null,profile:null,membership:null,rememberSession:true,bootstrap:null,wallet:{USDT:0,CUP:0,SM:0},rates:{buySmPerUsdt:0,cupPerSm:0},tiers:[],instructions:{},deposits:[],games:[],offers:[],orders:[],view:'inicio',authMode:'login',selectedGame:'',selectedOffer:'',pinOrder:'',pinValue:null,search:'',kindFilter:'all',tier:'level2',currency:'USDT',pendingPlanId:null,pendingOrderId:null,busy:false,ready:false};
const BASE='/REFILLSHOP/revendedores';
const ROUTES=new Set(['inicio','catalogo','planes','billetera','pedidos','cuenta','juego','compra','codigo']);
function routeURL(view,extra=''){return BASE+'/'+(view==='inicio'?'':view+'/')+(extra?'?'+extra:'')}
function updateURL(view,extra='',replace=false){const url=routeURL(view,extra);if(replace)history.replaceState({view},'',url);else history.pushState({view},'',url)}
function readURL(){
 const tail=location.pathname.startsWith(BASE)?location.pathname.slice(BASE.length).split('/').filter(Boolean).join('/'):'';
 const page=tail.split('/')[0]||'inicio';
 S.view=ROUTES.has(page)?page:'inicio';
 const search=new URLSearchParams(location.search);
 S.selectedGame=search.get('game')||'';
 S.selectedOffer=search.get('offer')||'';
 S.pinOrder=search.get('order')||'';
 S.pinValue=null;
 S.kindFilter=search.get('tipo')==='pin'?'pin':'all';
}
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
 const tier=S.tiers.find(x=>x.tier===S.membership?.planTier),offers=S.offers.filter(x=>x.inStock);
 const days=S.membership?.expiresAt?Math.max(0,Math.ceil((new Date(S.membership.expiresAt)-Date.now())/86400000)):null;
 const featured=(S.games||[]).filter(g=>g.featured).slice(0,3);
 const games=(featured.length?featured:S.games).slice(0,3);
 return `<div class="rs-pro-home">
 <section class="rs-pro-welcome panel"><div class="rs-pro-welcome-main"><span class="eyebrow">REFILLS PRO · PORTAL EXCLUSIVO</span><h1>Recargas para<br><em>tu negocio.</em></h1><p>Consulta tus precios, compra con wallet y revisa pedidos en un solo espacio.</p><div class="tag-row"><span class="pill">${esc(tier?.name||'Plan Gratis')}</span><span class="pill">${days===null?'Sin vencimiento':days+' días restantes'}</span></div></div><div class="rs-pro-welcome-art" aria-hidden="true"><span>R</span></div></section>
 <button class="rs-pro-search-launch" type="button" data-view="catalogo"><span class="rs-pro-search-icon" aria-hidden="true"></span><span>Buscar juego o código digital...</span><b>›</b></button>
 <div class="rs-pro-shortcuts"><button type="button" data-view="catalogo">Ofertas<small>${offers.length} disponibles</small></button><button type="button" data-view="planes">Mi plan<small>Level 2 y Level 3</small></button><button type="button" data-view="billetera">Recargar<small>USDT, SM y CUP</small></button></div>
 <div class="rs-pro-section-title"><h2>Saldo de mi wallet</h2><button type="button" data-view="billetera">Gestionar saldo ›</button></div>${balanceSummary()}
 <section class="section"><div class="rs-pro-section-title"><h2>Juegos destacados</h2><button type="button" data-view="catalogo">Ver catálogo ›</button></div><div class="game-list rs-pro-featured">${games.map(g=>{const count=S.offers.filter(o=>o.gameId===g.id&&o.inStock).length;return `<button class="game" type="button" data-game="${esc(g.id)}"><img src="${esc(imageURL(g.imageUrl))}" alt="" loading="lazy" onerror="this.onerror=null;this.src='/REFILLSHOP/assets/refills-icon.png'"><span class="game-name">${esc(g.name)}</span><small class="game-count">${count} ofertas disponibles</small></button>`}).join('')}</div></section>
 <section class="section"><div class="rs-pro-section-title"><h2>Mis pedidos recientes</h2><button type="button" data-view="pedidos">Ver todos ›</button></div><div class="panel pad">${ordersRows(S.orders.slice(0,3))}</div></section>
 </div>`;
}
function tierPrice(offer,tier){
 const supplierCost=Number(offer?.providerCostUsdt);
 const markup=Number(tier?.markupPercent);
 if(!Number.isFinite(supplierCost)||supplierCost<=0||!Number.isFinite(markup))return null;
 const value=Math.ceil((supplierCost*(1+markup/100)-1e-10)*100)/100;
 return {usdt:value,sm:Math.ceil(value*num(S.rates.buySmPerUsdt)),cup:Math.ceil(value*num(S.rates.buySmPerUsdt)*num(S.rates.cupPerSm))};
}
function plans(){
 const available=S.offers.filter(o=>o.inStock&&num(o.providerCostUsdt)>0),selected=available.find(o=>o.id===S.planPreviewId)||available[0]||null;
 if(selected&&!S.planPreviewId)S.planPreviewId=selected.id;
 return '<span class="eyebrow">REFILLS PRO · MEMBRESÍAS</span><h1 class="heading">Elige tu plan</h1><p class="sub">Explora los beneficios y consulta el precio final de cualquier oferta antes de activar un plan. Sin cálculos complicados.</p>' +
 '<section class="panel pad section rs-plan-preview"><div class="section-head"><h2>Vista previa de precios</h2><span class="dim tiny">Importes informativos del catálogo activo</span></div>' +
 (available.length?'<label class="field">Selecciona una oferta real del catálogo<select id="planPreviewProduct">'+available.slice(0,120).map(o=>'<option value="'+esc(o.id)+'" '+(o.id===selected.id?'selected':'')+'>'+esc(o.name)+' · '+esc((S.games.find(g=>g.id===o.gameId)||{}).name||'')+'</option>').join('')+'</select></label>':'<div class="rs-preview-empty">La vista previa de precios aparecerá cuando administración publique las primeras ofertas reales. No mostraremos importes inventados.</div>') +
 '</section>' +
 '<div class="grid grid-3 rs-tier-cards">'+S.tiers.map(t=>{const price=selected?tierPrice(selected,t):null,active=t.tier===S.membership?.planTier;return '<article class="panel tier rs-tier-card '+(active?'active':'')+'"><span class="eyebrow">'+(t.tier==='free'?'INCLUIDO':'PLAN REVENDEDOR')+'</span><h3>'+esc(t.name)+'</h3><div class="tier-price">'+(t.tier==='free'?'Gratis':usdt(t.priceUsdt)+' USDT')+'<small>'+(t.tier==='free'?'Sin vencimiento':num(t.days)+' días')+'</small></div><div class="rs-tier-preview">'+(price?'<small>VISTA PREVIA · '+esc(selected.name)+'</small><strong>'+usdt(price.usdt)+' USDT</strong><span>'+integer(price.sm)+' SM · '+integer(price.cup)+' CUP</span>':'<small>VISTA PREVIA</small><strong>Sin ofertas</strong><span>Los precios aparecerán aquí al publicarlas</span>')+'</div>'+(active?'<span class="pill">Tu plan actual</span>':t.tier==='free'?'<span class="dim tiny">Disponible sin pago</span>':'<button class="button full" data-plan="'+esc(t.tier)+'">Seleccionar '+esc(t.name)+'</button>')+'</article>'}).join('')+'</div>' +
 '<section class="panel pad section"><h2>Activar o renovar suscripción</h2><p class="dim reduced">Los cobros se realizan desde tu wallet y siempre se confirman en Supabase.</p><form id="planForm" class="grid"><div class="two"><label class="field">Plan<select name="tier">'+S.tiers.filter(t=>t.tier!=='free').map(t=>'<option value="'+esc(t.tier)+'" '+(S.tier===t.tier?'selected':'')+'>'+esc(t.name)+' · '+usdt(t.priceUsdt)+' USDT · '+num(t.days)+' días</option>').join('')+'</select></label><label class="field">Moneda<select name="currency"><option>USDT</option><option>SM</option><option>CUP</option></select></label></div><button type="submit" class="button">Confirmar suscripción</button></form><p class="help">Antes de activar el plan revisa su importe, duración y disponibilidad de saldo.</p></section>';
}
function catalog(){
 const q=S.search.toLocaleLowerCase('es');
 const visible=S.games.filter(g=>g.name.toLocaleLowerCase('es').includes(q)&&(S.kindFilter==='all'||S.offers.some(o=>o.gameId===g.id&&o.kind==='pin')));
 return `<header class="rs-pro-app-title"><span class="eyebrow">REFILLS PRO · JUEGOS</span><h1 class="heading">Explora tus recargas</h1><p class="sub">Todos los precios se ajustan a tu plan y se verifican al comprar.</p></header>
 <div class="rs-pro-kind-tabs"><button class="${S.kindFilter==='all'?'active':''}" type="button" data-pro-kind="all">Todos los productos</button><button class="${S.kindFilter==='pin'?'active':''}" type="button" data-pro-kind="pin">Códigos PIN</button></div><form id="searchForm" class="form-actions" role="search"><input class="search" style="flex:1" name="search" type="search" placeholder="Buscar juego" value="${esc(S.search)}" aria-label="Buscar juego"><button class="ghost" type="submit">Buscar</button></form>
 <p class="dim tiny">Mostrando ${visible.length} de ${S.games.length} juegos · Precios finales para tu suscripción</p>
 ${visible.length?`<div class="game-list">${visible.map(g=>{const count=S.offers.filter(o=>o.gameId===g.id&&o.inStock&&(S.kindFilter!=='pin'||o.kind==='pin')).length;return `<button class="game" data-game="${esc(g.id)}"><img src="${esc(imageURL(g.imageUrl))}" alt="" loading="lazy" onerror="this.onerror=null;this.src='/REFILLSHOP/assets/refills-icon.png'"><span class="game-name">${esc(g.name)}</span><small class="game-count">${count} ofertas disponibles</small></button>`}).join('')}</div>`:'<div class="panel empty">No se encontraron juegos con esa búsqueda.</div>'}`;
}
function gamePage(){
 const g=S.games.find(g=>g.id===S.selectedGame);if(!g)return catalog();
 const offers=S.offers.filter(o=>o.gameId===g.id&&(S.kindFilter!=='pin'||o.kind==='pin')).sort((a,b)=>num(a.resellerUsdt)-num(b.resellerUsdt));
 return '<button class="back" data-view="catalogo">‹ Volver al catálogo</button><span class="eyebrow">TUS PRECIOS DE COMPRA</span><h1 class="heading">'+esc(g.name)+'</h1><p class="sub">Toca Vista previa para consultar el importe final en USDT, SM y CUP antes de comprar.</p>' +
 '<div class="grid rs-offer-previews">'+(offers.map(o=>'<article class="panel offer rs-price-preview-card"><div class="offer-info"><strong>'+esc(o.name)+'</strong><small>'+esc(o.region||'Global')+' · '+(o.kind==='pin'?'PIN digital':'Recarga directa')+' · '+(o.inStock?'Disponible':'Agotada')+'</small><div class="price">'+usdt(o.resellerUsdt)+' USDT</div><span class="rs-price-hint">Precio final para tu plan</span></div><div class="rs-price-actions"><button class="ghost" data-preview-offer="'+esc(o.id)+'">Vista previa</button><button class="button" data-buy="'+esc(o.id)+'" '+(o.inStock?'':'disabled')+'>'+(o.inStock?'Comprar':'Agotada')+'</button></div></article>').join('')||'<div class="panel empty">Todavía no hay ofertas activas para este juego.</div>')+'</div>';
}
function showPricePreview(offerId){
 const o=S.offers.find(x=>x.id===offerId);if(!o)return;
 const game=S.games.find(x=>x.id===o.gameId);
 const old=document.getElementById('rsPricePreview');if(old)old.remove();
 const node=document.createElement('div');node.className='rs-price-modal';node.id='rsPricePreview';
 node.innerHTML='<section role="dialog" aria-modal="true" class="rs-price-sheet"><div class="rs-price-grabber"></div><div class="rs-price-heading"><div><span class="eyebrow">REFILLS PRO · VISTA PREVIA</span><h2>'+esc(game?.name||'Recarga')+'</h2><p>'+esc(o.name)+' · '+esc(o.region||'Global')+'</p></div><button type="button" data-close-price aria-label="Cerrar">×</button></div><div class="rs-price-main"><small>PRECIO FINAL DE TU PLAN</small><strong>'+usdt(o.resellerUsdt)+' <em>USDT</em></strong><span>Precios calculados con las tasas actuales</span></div><div class="rs-price-currencies"><div><small>SALDO MÓVIL</small><strong>'+integer(o.resellerSm)+' SM</strong></div><div><small>PAGO CUP</small><strong>'+integer(o.resellerCup)+' CUP</strong></div></div><p class="dim tiny">La disponibilidad y el precio se volverán a verificar en el servidor al comprar.</p><div class="rs-price-actions"><button class="ghost" data-close-price>Cerrar</button><button class="button" data-preview-buy="'+esc(o.id)+'" '+(o.inStock?'':'disabled')+'>Continuar a comprar</button></div></section>';
 document.body.appendChild(node);
}
function targetFields(o){
 if(o?.kind==='pin')return '<div class="alert-note">PIN digital · No necesitas ID de jugador. Confirma la región y consulta el código una vez entregado.</div>';
 const schema=Array.isArray(o.targetSchema)?o.targetSchema:[];
 if(schema.length)return schema.map((x,i)=>{const key=String(x.key||'').slice(0,55);return `<label class="field">${esc(x.label||key||'Dato '+(i+1))}<input name="target_${esc(key)}" type="text" minlength="1" maxlength="64" required autocomplete="off"></label>`}).join('');
 return `<label class="field">ID del jugador<input name="playerId" type="text" minlength="3" maxlength="80" required autocomplete="off"></label><label class="field">Zona o servidor (si aplica)<input name="zoneId" type="text" maxlength="50" autocomplete="off"></label>`;
}
function checkout(){
 const o=S.offers.find(x=>x.id===S.selectedOffer),g=S.games.find(x=>x.id===o?.gameId);
 if(!o||!g||!o.inStock)return `<div class="panel pad"><h1>Oferta no disponible</h1><button class="ghost" data-view="catalogo">Volver al catálogo</button></div>`;
 return `<button class="back" data-game="${esc(g.id)}">‹ Volver a las ofertas</button><span class="eyebrow">COMPRA REVENDEDOR</span><h1 class="heading">Confirmar pedido</h1><p class="sub">${esc(g.name)} · ${esc(o.name)}</p>
 <div class="grid grid-2"><form id="orderForm" class="panel pad"><h2>${o.kind==='pin'?'Entrega de código PIN':'Datos del jugador'}</h2>${targetFields(o)}<label class="field">Moneda a descontar<select name="currency" required><option value="USDT">USDT · ${usdt(o.resellerUsdt)}</option><option value="SM">SM · ${integer(o.resellerSm)}</option><option value="CUP">CUP · ${integer(o.resellerCup)}</option></select></label><label class="checks"><input name="accept" type="checkbox" required> Confirmo los datos, la región y el importe del pedido.</label><button class="button full" type="submit">Comprar con mi saldo</button><p class="help">El servidor vuelve a calcular el precio y verifica tu saldo antes de descontarlo. No envíes transferencias fuera de la wallet.</p></form>
 <aside class="panel pad"><span class="eyebrow">RESUMEN</span><h2>${esc(o.name)}</h2><p class="dim">${esc(g.name)} · ${esc(o.region)}</p><div class="checkout-summary panel"><strong>${usdt(o.resellerUsdt)} USDT</strong>${o.kind==='pin'?'<div class="pill">PIN · Entrega manual verificada</div>':''}<div class="dim">${integer(o.resellerSm)} SM · ${integer(o.resellerCup)} CUP</div></div><p class="dim tiny">Este es tu precio final según el plan activo. Si administración rechaza el pedido, el saldo se reintegra según las reglas del servidor.</p><button class="ghost full" data-view="billetera">Ver mi wallet</button></aside></div>`;
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
 return `<div class="order-row"><div><b>${esc(code)}</b><small>${esc(name)} · ${esc(o.offer_name||o.offer||'')}</small><small>${timestamp(o.created_at||o.createdAt)} · ${esc(o.wallet_currency||o.walletCurrency||'USDT')} ${num(o.wallet_amount??o.walletAmount).toLocaleString('es-ES',{maximumFractionDigits:2})}</small></div><div class="order-controls">${o.kind==='pin'&&o.status==='completed'?`<button class="button small-button" type="button" data-pin-reveal="${esc(code)}">Ver PIN</button>`:''}<span class="status ${esc(o.status)}">${esc(status(o.status))}</span></div></div>`;
 }).join(''):'<div class="empty">Todavía no tienes pedidos registrados.</div>';
}
function orders(){return `<span class="eyebrow">SEGUIMIENTO</span><h1 class="heading">Mis pedidos</h1><p class="sub">Consulta las compras realizadas desde tu wallet. No repitas un pedido mientras esté pendiente sin comprobar su estado.</p>
 <button class="ghost small-button" id="refreshOrders">Actualizar pedidos</button><section class="panel pad section">${ordersRows(S.orders)}</section>`}
function pinPage(){
 if(!S.pinValue)return '<span class="eyebrow">ENTREGA SEGURA</span><h1 class="heading">Código PIN</h1><div class="panel empty">El código no está disponible todavía. Confirma que el pedido fue completado y actualiza Mis pedidos.</div><button class="ghost section" data-view="pedidos">Volver a mis pedidos</button>';
 return `<span class="eyebrow">ENTREGA SEGURA</span><h1 class="heading">Tu código PIN</h1><p class="sub">Solo tú puedes consultar este código desde tu cuenta cuando la entrega está completada.</p><section class="panel pad pin-delivery"><small>Pedido ${esc(S.pinOrder)}</small><div class="pin-delivery-code"><code>${esc(S.pinValue)}</code></div><button class="button" data-copy="${esc(S.pinValue)}">Copiar PIN</button><p class="help">No compartas tu código. Comprueba la región del producto antes de canjearlo.</p></section><button class="ghost section" data-view="pedidos">Mis pedidos</button>`;
}
async function fetchPin(code){const d=await req('rs12-reseller','/pin/reveal?code='+encodeURIComponent(code));S.pinValue=d.pin;S.pinOrder=code;}
function account(){
 const p=S.profile||{};
 return `<span class="eyebrow">ACCESO INDEPENDIENTE</span><h1 class="heading">Mi cuenta de revendedor</h1><p class="sub">Esta página tiene un inicio de sesión separado de la tienda para clientes. Tu perfil y tus operaciones se validan con los servicios protegidos de Refills Shop.</p>
 <div class="account-body"><section class="panel pad"><h2>Datos personales</h2><form id="profileForm"><label class="field">Nombre completo<input name="fullName" maxlength="90" minlength="2" value="${esc(p.fullName||'')}" autocomplete="name" required></label><label class="field">Teléfono de contacto, incluido el prefijo<input name="phone" type="tel" maxlength="19" minlength="8" value="${esc(p.phone||'')}" autocomplete="tel" required></label><button class="button" type="submit">Guardar datos</button></form></section>
 <section class="panel pad section"><h2>Seguridad</h2><form id="passwordForm"><label class="field">Nueva contraseña<input name="password" type="password" autocomplete="new-password" minlength="10" maxlength="72" required></label><label class="field">Confirmar contraseña<input name="confirm" type="password" autocomplete="new-password" minlength="10" maxlength="72" required></label><button class="ghost" type="submit">Cambiar contraseña</button></form></section>
 <button class="danger section" id="accountSignout">Cerrar sesión de revendedores</button></div>`;
}
function auth(){
 const register=S.authMode==='register';
 return `<div class="auth-wrap"><section class="panel auth-intro"><span class="eyebrow">PORTAL INDEPENDIENTE</span><h1>REFILLS <span style="color:#78cfff">PRO</span></h1><h2>Recargas digitales para revendedores.</h2><p>Tu propia entrada para consultar ofertas de reventa, activar planes de 15 días y administrar tu wallet. Sin mezclarte con la tienda para clientes.</p><div class="stats"><div class="stat"><small>LEVEL 2</small><strong>15 días</strong><small>Precios especiales</small></div><div class="stat"><small>LEVEL 3</small><strong>15 días</strong><small>Precios preferentes</small></div><div class="stat"><small>PLAN GRATIS</small><strong>Gratis</strong><small>Sin vencimiento</small></div></div></section>
 <section class="panel auth-card"><span class="eyebrow">ACCESO DE REVENDEDORES</span><h2>${register?'Crear mi cuenta':'Bienvenido de nuevo'}</h2><div class="auth-tabs"><button class="${register?'':'active'}" data-auth="login">Iniciar sesión</button><button class="${register?'active':''}" data-auth="register">Registrarme</button></div><form id="authForm"><input type="hidden" name="mode" value="${register?'register':'login'}">${register?'<label class="field">Nombre completo<input name="fullName" minlength="2" maxlength="90" autocomplete="name" required></label>':''}
 <div class="two"><label class="field">País<select name="prefix" required>${countries()}</select></label><label class="field">Número de teléfono<input name="phone" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="5xxxxxxx" minlength="5" maxlength="15" required></label></div>
 <label class="field">Contraseña<input name="password" type="password" autocomplete="${register?'new-password':'current-password'}" minlength="${register?'10':'1'}" maxlength="72" required></label>${!register?'<label class="rs-remember"><input type="checkbox" name="rememberSession" '+(S.rememberSession?'checked':'')+'><span><strong>Recordar mi sesión</strong><small>Mantener el acceso en este dispositivo</small></span></label>':''}<input type="text" name="website" autocomplete="off" tabindex="-1" aria-hidden="true" class="sr-only"><button class="button full" type="submit">${register?'Crear cuenta de revendedor':'Acceder a Refills Pro'}</button></form>
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
 const dock=$('portalDock');
 if(dock){
  dock.hidden=!authed;
  const tabs=[['inicio','Inicio'],['catalogo','Juegos'],['billetera','Wallet'],['pedidos','Pedidos'],['cuenta','Cuenta']];
  const paths={
   inicio:'<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-6h6v6"/>',
   catalogo:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
   billetera:'<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M15 11h6v5h-6a2.5 2.5 0 0 1 0-5z"/>',
   pedidos:'<path d="M6 4h12v16H6z"/><path d="M9 9h6M9 13h6M9 17h4"/>',
   cuenta:'<circle cx="12" cy="8" r="4"/><path d="M4.5 21c0-5 3-7 7.5-7s7.5 2 7.5 7"/>'
  };
  dock.innerHTML=authed?tabs.map(([v,label])=>`<button type="button" class="rs-pro-dock-item ${S.view===v||(v==='catalogo'&&['juego','compra'].includes(S.view))?'active':''}" data-view="${v}"><svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" aria-hidden="true">${paths[v]}</svg><span>${label}</span></button>`).join(''):'';
 }

 $('content').innerHTML=!authed?auth():(S.view==='inicio'?home():S.view==='catalogo'?catalog():S.view==='juego'?gamePage():S.view==='compra'?checkout():S.view==='planes'?plans():S.view==='billetera'?wallet():S.view==='pedidos'?orders():S.view==='codigo'?pinPage():account());
}
async function go(view){if(!ROUTES.has(view))return;S.view=view;updateURL(view);S.search='';if(view==='pedidos'){loading('Buscando tus pedidos');try{await loadOrders()}catch(e){fail(e)}}render();scrollTo({top:0,behavior:'instant'})}
async function readProof(file){
 if(!file)return null;
 if(file.size>5*1024*1024)throw Error('La imagen no puede superar 5 MB.');
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Utiliza imágenes JPG, PNG o WEBP.');
 return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('No se pudo leer el comprobante.'));r.readAsDataURL(file)});
}
function createResellerClient(bootstrap){return window.supabase.createClient(bootstrap.supabaseUrl||SB,bootstrap.publishableKey||PUB,{auth:{persistSession:true,storage:S.rememberSession?window.localStorage:window.sessionStorage,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'refills-pro-reseller-auth-v1'}})}
async function signout(){try{await S.client?.auth.signOut()}catch(e){fail(e)}S.user=null;S.profile=null;S.membership=null;S.wallet={USDT:0,CUP:0,SM:0};S.view='inicio';updateURL('inicio');render()}
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
   const remember=S.authMode==='register'?S.rememberSession:f.elements.rememberSession?.checked!==false;
   try{localStorage.setItem('refills_shop_remember_session',String(remember))}catch{}
   if(remember!==S.rememberSession){await S.client.auth.signOut().catch(()=>{});S.rememberSession=remember;S.client=createResellerClient(S.bootstrap)}
   const {data,error}=await S.client.auth.signInWithPassword({email:alias(p),password});
   if(error)throw Error('No se pudo iniciar sesión. Comprueba el teléfono y la contraseña.');
   S.user=data.user;loading('Preparando tu cuenta de revendedor');await hydrate();S.view='inicio';updateURL('inicio');await loadOrders().catch(()=>{});render();notify('Acceso correcto. Bienvenido a Refills Pro.');
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
   if(o.kind==='pin'){playerId='PIN';targetPayload.product_type='pin'}
   else if(schema.length){
    for(const x of schema){const v=String(f.elements['target_'+x.key]?.value||'').trim();if(!v||v.length>64)throw Error('Revisa el dato '+String(x.label||x.key));targetPayload[x.key]=v}
    playerId=String(targetPayload.player_id||targetPayload.user_id||targetPayload.service_user_id||Object.values(targetPayload)[0]||'').slice(0,80);
    zoneId=String(targetPayload.zone_id||targetPayload.server||'').slice(0,50);
   }else{playerId=String(f.elements.playerId.value).trim();zoneId=String(f.elements.zoneId.value||'').trim();if(playerId.length<3)throw Error('Escribe un ID de jugador válido.');targetPayload.player_id=playerId;if(zoneId)targetPayload.zone_id=zoneId}
   const currency=f.elements.currency.value;
   if(!f.elements.accept.checked)throw Error('Confirma los datos del pedido.');
   if(!confirm('¿Confirmas la compra y el descuento desde tu wallet en '+currency+'?'))return;
   S.pendingOrderId ||=crypto.randomUUID();
   const data=await req('rs12-reseller','/orders',{method:'POST',body:{offerId:o.id,clientRequestId:S.pendingOrderId,playerId,zoneId,targetPayload,currency}});
   S.pendingOrderId=null;await hydrate();await loadOrders();S.view='pedidos';updateURL('pedidos');render();notify('Pedido '+String(data.code||data.order?.code||'')+' registrado. Consulta su estado.');
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
document.addEventListener('change',e=>{if(e.target?.id==='planPreviewProduct'){S.planPreviewId=e.target.value;render();}});
document.addEventListener('click',e=>{if(e.target?.id==='rsPricePreview'){e.target.remove();}});
document.addEventListener('click',async e=>{
 const b=e.target.closest('button');if(!b||b.disabled)return;
 if(b.id==='signout'||b.id==='accountSignout')return void signout();
 if(b.dataset.auth){S.authMode=b.dataset.auth;render();return}
 if(b.dataset.view)return void go(b.dataset.view);
 if(b.dataset.proKind){
  S.kindFilter=b.dataset.proKind==='pin'?'pin':'all';
  updateURL('catalogo',S.kindFilter==='pin'?'tipo=pin':'',true);
  S.view='catalogo';render();return;
 }
 if(b.hasAttribute('data-close-price')){document.getElementById('rsPricePreview')?.remove();return}
 if(b.dataset.previewOffer){showPricePreview(b.dataset.previewOffer);return}
 if(b.dataset.previewBuy){document.getElementById('rsPricePreview')?.remove();S.selectedOffer=b.dataset.previewBuy;S.pendingOrderId=null;S.view='compra';updateURL('compra','offer='+encodeURIComponent(S.selectedOffer));render();scrollTo(0,0);return}
 if(b.dataset.game){S.selectedGame=b.dataset.game;S.view='juego';updateURL('juego','game='+encodeURIComponent(S.selectedGame));render();scrollTo(0,0);return}
 if(b.dataset.buy){S.selectedOffer=b.dataset.buy;S.pendingOrderId=null;S.view='compra';updateURL('compra','offer='+encodeURIComponent(S.selectedOffer));render();scrollTo(0,0);return}
 if(b.dataset.plan){S.tier=b.dataset.plan;S.view='planes';updateURL('planes');render();document.getElementById('planForm')?.scrollIntoView({behavior:'smooth',block:'center'});return}
 if(b.dataset.pinReveal){
  try{await fetchPin(b.dataset.pinReveal);S.view='codigo';updateURL('codigo','order='+encodeURIComponent(S.pinOrder));render();scrollTo(0,0);}catch(err){fail(err)}return;
 }
 if(b.dataset.copy){try{await navigator.clipboard.writeText(b.dataset.copy);notify('Copiado.')}catch{notify('Mantén pulsado el dato para copiarlo.',true)}return}
 if(b.id==='refreshOrders'){try{await loadOrders();render();notify('Pedidos actualizados.')}catch(err){fail(err)}return}
});
async function start(){
 if(!$('portalDock'))document.body.insertAdjacentHTML('beforeend','<nav class="rs-pro-dock" id="portalDock" hidden aria-label="Navegación móvil de revendedores"></nav>');
 readURL();
 try{
  const bootstrap=await req('rs10-api','/bootstrap',{auth:false});
  if(!window.supabase?.createClient)throw Error('No fue posible cargar el acceso seguro.');
  S.bootstrap=bootstrap;try{S.rememberSession=localStorage.getItem('refills_shop_remember_session')!=='false'}catch{S.rememberSession=true}
  S.client=createResellerClient(bootstrap);
  const {data}=await S.client.auth.getUser();S.user=data?.user||null;
  S.ready=true;
  if(S.user){await hydrate();await loadOrders().catch(()=>{});if(S.view==='codigo'&&S.pinOrder)await fetchPin(S.pinOrder).catch(fail);}
  render();
  S.client.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'&&S.user){S.user=null;S.profile=null;render()}else if(event==='SIGNED_IN'&&session?.user?.id!==S.user?.id){S.user=session.user;setTimeout(()=>{hydrate().then(()=>render()).catch(fail)},0)}});
 }catch(e){$('content').innerHTML=`<div class="panel pad" style="max-width:620px;margin:40px auto"><h1>No se pudo conectar</h1><p>${esc(e.message)}</p><button class="button" id="retryPortal">Reintentar</button></div>`;document.getElementById('retryPortal').onclick=start;}
}
window.addEventListener('popstate',()=>{readURL();if(S.user&&S.view==='pedidos')loadOrders().then(render).catch(fail);else if(S.user&&S.view==='codigo'&&S.pinOrder)fetchPin(S.pinOrder).then(render).catch(fail);else render()});
void start();
})();