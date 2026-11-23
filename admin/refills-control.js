(() => {
'use strict';
const SB='https://kcgjlnymhmxylrjchcvl.supabase.co';
const KEY='sb_publishable_sGK_1a5Tp8gY83KI8wiSZg_LP5uxGdc';
const $=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=x=>(Number(x)||0).toLocaleString('es-ES',{maximumFractionDigits:2});
const usd=x=>(Number(x)||0).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
const date=x=>x?new Date(x).toLocaleString('es-ES'):'—';
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
const MENU=[['overview','Resumen','overview','Indicadores y accesos'],['games','Juegos','games','Tu catálogo'],['offers','Ofertas','offers','Precios y productos'],['orders','Pedidos','orders','Compras y entregas'],['customers','Clientes','customers','Cuentas y seguridad'],['resellers','Revendedores','resellers','Planes y depósitos'],['payments','Pagos y tasas','payments','Configuración comercial'],['centralone','Central One','centralone','Integración proveedor']];
const S={client:null,user:null,page:'overview',busy:false,rememberSession:true,cache:{},search:'',offerSearch:'',gameFilter:'all',offerFilter:'all',coFilter:'',coKind:'all',product:null,offerMode:'centralone',bulkNotice:'',bulkFamily:''};
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
 const service=options.service==='reseller'?'rs12-reseller':'rs10-api';
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
 if(!res.ok)throw Error(json.error||json.message||'Error del servidor HTTP '+res.status);
 return json;
}
function createAdminClient(){
 return window.supabase.createClient(SB,KEY,{auth:{persistSession:true,storage:S.rememberSession?window.localStorage:window.sessionStorage,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'sb-kcgjlnymhmxylrjchcvl-auth-token'}});
}
async function verifyAdmin(){
 const user=(await S.client.auth.getUser()).data.user;
 if(!user)throw Error('Necesitas iniciar sesión.');
 await request('/admin/session');
 S.user=user;return true;
}
function pageFromHash(){const page=location.hash.replace(/^#/,'').split('?')[0];return MENU.some(m=>m[0]===page)?page:'overview'}
function showLogin(message){
 S.user=null;$('auth-shell').hidden=false;$('console').hidden=true;
 const remember=$('admin-login')?.elements.rememberSession;if(remember)remember.checked=S.rememberSession;
 if(message)flash(message,true);
}
function showConsole(){
 $('auth-shell').hidden=true;$('console').hidden=false;
 $('whoami').textContent='Administrador';
 S.page=pageFromHash();renderMenu();navigate(S.page,true);
}
function renderMenu(){
 $('admin-menu').innerHTML=MENU.map(m=>'<button type="button" class="side-item '+(S.page===m[0]?'active':'')+'" data-page="'+m[0]+'">'+ico(m[2])+'<span>'+m[1]+'</span></button>').join('');
}
function navigate(page,first=false){
 if(!MENU.some(m=>m[0]===page))page='overview';
 if(S.page!==page){S.search='';S.offerSearch=''}S.page=page;if(!first)history.replaceState(null,'','#'+page);
 renderMenu();
 const meta=MENU.find(m=>m[0]===page);$('crumb-name').textContent=meta[1];
 $('view-title').textContent=meta[1]==='Resumen'?'Vista general':meta[1];
 $('view-description').textContent=meta[3];
 $('view-eyebrow').textContent='REFILLS OS / '+meta[1].toUpperCase();
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
 try{
  if(page==='overview'){
   const [overview,commerce,central,reseller,orders]=await Promise.all([
    request('/admin/overview'),request('/admin/commerce/settings'),request('/admin/centralone/status'),
    request('/admin/summary',{service:'reseller'}).catch(()=>({deposits:[],orders:[],memberships:[]})),
    request('/admin/orders').catch(()=>({orders:[]}))
   ]);
   Object.assign(S.cache,{overview,commerce,central,reseller,orders});return drawOverview();
  }
  if(page==='games'){
   const x=await request('/admin/games');S.cache.games=x.games||[];
   return drawGames();
  }
  if(page==='offers'){
   const [g,o,store,co]=await Promise.all([request('/admin/games'),request('/admin/offers'),publicStorefront(),request('/admin/centralone/catalog?kind=all&offset=0').catch(()=>({families:[],products:[]}))]);
   S.cache.games=g.games||[];S.cache.offers=o.offers||[];S.cache.store=store;
   S.cache.coFamilies=Array.isArray(co.families)?co.families:[];
   if(!S.cache.coProducts?.length)S.cache.coProducts=co.products||[];
   return drawOffers();
  }
  if(page==='orders'){
   const x=await request('/admin/orders');S.cache.orders=x;return drawOrders();
  }
  if(page==='customers'){
   const x=await request('/admin/customers');S.cache.customers=x.clients||[];return drawCustomers();
  }
  if(page==='resellers'){
   const x=await request('/admin/summary',{service:'reseller'});S.cache.reseller=x;return drawResellers();
  }
  if(page==='payments'){
   const [s,store,commerce,crypto]=await Promise.all([request('/admin/settings'),publicStorefront(),request('/admin/commerce/settings'),request('/admin/crypto/status')]);
   Object.assign(S.cache,{settings:s.config,store,commerce,crypto});return drawPayments();
  }
  if(page==='centralone'){
   const [central,orderStatus,commerce]=await Promise.all([request('/admin/centralone/status'),request('/admin/centralone/orders/status'),request('/admin/commerce/settings')]);
   Object.assign(S.cache,{central,orderStatus,commerce});return drawCentral();
  }
 }catch(err){$('admin-view').innerHTML='<div class="surface section"><h2>No se pudo cargar este apartado</h2><p>'+esc(err.message)+'</p><button class="btn secondary" data-action="refresh">Reintentar</button></div>'}
}
async function publicStorefront(){
 const headers={'apikey':KEY,'Accept':'application/json'};
 const res=await fetch(SB+'/functions/v1/rs10-api/storefront',{headers,cache:'no-store'});
 const data=await res.json().catch(()=>({}));
 if(!res.ok)throw Error(data.error||'No se pudieron obtener las tasas de la tienda.');
 return data;
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
function drawOverview(){
 const x=S.cache.overview?.counts||{}, r=S.cache.reseller||{}, co=S.cache.commerce||{},cn=S.cache.central||{};
 $('admin-view').innerHTML='<div class="grid four">'
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
 const filtered=games.filter(g=>(S.gameFilter==='all'||(S.gameFilter==='active')===!!g.active));
 $('admin-view').innerHTML='<div class="split">'
 +'<section class="surface section"><div class="panel-head"><div><h2>Crear o editar juego</h2><small>El producto se guarda en Supabase</small></div>'+ico('plus')+'</div><form id="game-form" class="form-grid"><label>ID único (sin espacios)<input name="id" placeholder="ej: mobile-legends" pattern="[a-z0-9-]{2,60}" required></label><label>Nombre del juego<input name="name" maxlength="90" placeholder="Nombre del producto" required></label><label>Categoría<input name="category" value="Juegos" maxlength="70" required></label><label>Imagen HTTPS<input name="imageUrl" type="url" placeholder="https://…"></label><label class="check wide"><input name="featured" type="checkbox"> Destacar en el inicio</label><div class="form-actions wide"><button class="btn primary" type="submit">'+ico('plus')+' Guardar juego</button></div></form><p class="footer-caption">Primero crea el juego. Después vincula las ofertas que quieras vender desde Central One.</p></section>'
 +'<section class="surface section"><div class="panel-head"><div><h2>Mis juegos</h2><small>'+games.length+' registrados · '+games.filter(g=>g.active).length+' publicados</small></div>'+ico('games')+'</div>'
 +'<div class="toolbar"><input type="search" id="filter-games" placeholder="Buscar juego…" value="'+esc(S.search)+'"><select id="game-filter"><option value="all">Todos</option><option value="active" '+(S.gameFilter==='active'?'selected':'')+'>Publicados</option><option value="archived" '+(S.gameFilter==='archived'?'selected':'')+'>Archivados</option></select></div>'
 +(filtered.length?'<div class="list">'+filtered.map(g=>'<div class="record"><div class="record-main"><img class="thumb" alt="" src="'+esc(/^https:\/\//.test(g.imageUrl||'')?g.imageUrl:'/REFILLSHOP/assets/refills-icon.png')+'"><div><h3>'+esc(g.name)+'</h3><small>'+esc(g.id)+' · '+esc(g.tag||'Juegos')+'</small></div></div><div class="row-actions">'+tag(g.active?'Publicado':'Archivado',g.active?'good':'warn')+'<button class="btn ghost small" data-action="edit-game" data-id="'+esc(g.id)+'">Editar</button>'+(g.active?'<button class="btn secondary small" data-page="offers">Ofertas</button>':'<button class="btn secondary small" data-action="restore-game" data-id="'+esc(g.id)+'">Restaurar</button>')+'<button class="btn danger small" data-action="delete-game" data-id="'+esc(g.id)+'">Eliminar</button></div></div>').join('')+'</div>':empty('Sin resultados','No hay juegos que coincidan.'))+'</section></div>';
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
 if(!modalConfirm('Importar SOLO '+options.region+' de la familia seleccionada con '+options.marginPercent+' % de ganancia? Las otras regiones no cambiarán.'))return;
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
 const previews=o=>{const sm=Math.ceil(Number(o.provider_price_usdt||0)*Number(settings.buySmPerUsdt||0)+Number(o.gain_sm||0));const cup=Math.ceil(sm*Number(settings.cupPerSm||0));return sm>0&&cup>0?money(sm)+' SM / '+money(cup)+' CUP':'Revisar tasas'};
 $('admin-view').innerHTML=bulkOffersPanel()+'<div class="surface section"><div class="panel-head"><div><h2>Crear oferta</h2><small>Selecciona un producto de Central One o crea un borrador manual</small></div>'+ico('plus')+'</div><div class="tabs"><button data-action="mode-centralone" class="'+(S.offerMode==='centralone'?'active':'')+'">Catálogo Central One</button><button data-action="mode-manual" class="'+(S.offerMode==='manual'?'active':'')+'">Borrador manual</button></div>'
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
function drawOrders(){
 const list=S.cache.orders?.orders||[],q=S.search.toLowerCase();
 const filtered=list;
 $('admin-view').innerHTML='<div class="toolbar"><input type="search" id="filter-orders" placeholder="Buscar por código, cliente o juego" value="'+esc(S.search)+'"><button class="btn secondary" data-action="refresh">Actualizar pedidos ↻</button></div>'
 +'<div class="list">'+(filtered.length?filtered.map(o=>'<article class="surface section"><div class="panel-head"><div><small class="tag">PEDIDO '+esc(o.code)+'</small><h2>'+esc(o.game||'Recarga')+' · '+esc(o.offer||'')+'</h2><small>'+esc(o.customerName||'Cliente')+' · '+esc(o.customerPhone||'')+' · '+date(o.created)+'</small></div>'+status(o.status)+'</div><div class="grid three"><div><span class="tag">DESTINO</span><p>'+esc(o.playerId||'PIN')+'</p></div><div><span class="tag">MONTO</span><p>'+money(o.amount)+' '+esc(o.currency)+'</p></div><div><span class="tag">PAGO</span><p>'+esc(o.paymentStatus||'Sin verificar')+'</p></div></div><div class="form-actions">'+(o.receiptAvailable?'<button class="btn ghost small" data-action="receipt" data-code="'+esc(o.code)+'">'+ico('eye')+' Ver comprobante</button>':'')+(o.paymentStatus!=='paid'&&o.status==='pending'?'<button class="btn secondary small" data-action="verify-payment" data-code="'+esc(o.code)+'">Verificar pago</button>':'')+(o.paymentStatus==='paid'&&o.status==='pending'&&o.kind==='topup'?'<button class="btn primary small" data-action="fulfill" data-code="'+esc(o.code)+'">Enviar a Central One</button>':'')+(o.kind==='pin'&&o.paymentStatus==='paid'?'<button class="btn primary small" data-action="assign-pin" data-code="'+esc(o.code)+'">Entregar PIN</button>':'')+(o.status==='pending'?'<button class="btn danger small" data-action="reject-order" data-code="'+esc(o.code)+'">Rechazar</button>':'')+(o.paymentStatus==='paid'&&o.status!=='refunded'?'<button class="btn ghost small" data-action="refund-order" data-code="'+esc(o.code)+'">Registrar reembolso</button>':'')+'</div></article>').join(''):empty('Sin pedidos','Cuando recibas compras reales, aparecerán aquí.'))+'</div>';
}
function drawCustomers(){
 const list=S.cache.customers||[];
 const filtered=list;
 $('admin-view').innerHTML='<div class="toolbar"><input type="search" id="filter-customers" value="'+esc(S.search)+'" placeholder="Buscar nombre o teléfono"><span class="tiny-note">'+list.length+' clientes</span></div><section class="surface section"><div class="panel-head"><div><h2>Cuentas registradas</h2><small>Las cuentas existentes permanecen en Supabase</small></div>'+ico('customers')+'</div><div class="list">'+(filtered.length?filtered.map(x=>'<div class="record"><div class="record-main"><span class="avatar">'+esc(String(x.name||'RS').slice(0,2).toUpperCase())+'</span><div><h3>'+esc(x.name||'Cliente')+'</h3><small>'+esc(x.phone||'')+' · '+(x.orders||0)+' pedidos · '+usd(x.balanceUsdt||0)+' USDT</small></div></div><div class="row-actions"><button class="btn ghost small" data-action="customer-details" data-id="'+esc(x.id)+'">Detalles</button><button class="btn secondary small" data-action="customer-reset" data-id="'+esc(x.id)+'">Contraseña</button></div></div>').join(''):empty('Sin resultados','No se encontraron cuentas coincidentes.'))+'</div></section>';
}
function drawResellers(){
 const data=S.cache.reseller||{},m=data.memberships||[],d=data.deposits||[],orders=data.orders||[];
 $('admin-view').innerHTML='<div class="grid three">'+metric('REVENDEDORES',m.length,'Cuentas con plan','resellers')+metric('DEPÓSITOS PENDIENTES',d.length,'Por comprobar','payments')+metric('PEDIDOS MAYORISTAS',orders.length,'En proceso','orders')+'</div><div class="spacing"></div>'
 +'<section class="surface section"><div class="panel-head"><div><h2>Recargas de wallet</h2><small>Comprueba cada transferencia antes de acreditar saldo</small></div>'+ico('payments')+'</div>'
 +(d.length?'<div class="list">'+d.map(x=>'<div class="record"><div><h3>'+esc(x.customerName)+'</h3><small>'+esc(x.customerPhone||'')+' · '+money(x.amount)+' '+esc(x.currency)+' · '+date(x.createdAt)+'</small></div><div class="row-actions">'+(x.proofUrl?'<a href="'+esc(x.proofUrl)+'" target="_blank" rel="noopener" class="btn ghost small">Comprobante ↗</a>':'')+'<button class="btn primary small" data-action="approve-deposit" data-id="'+esc(x.id)+'">Acreditar</button><button class="btn danger small" data-action="reject-deposit" data-id="'+esc(x.id)+'">Rechazar</button></div></div>').join('')+'</div>':empty('No hay depósitos pendientes','Las solicitudes aparecerán al recargar la wallet.'))+'</section>'
 +'<div class="spacing"></div><section class="surface section"><div class="panel-head"><div><h2>Suscripciones activas</h2><small>Gratis, Level 2 y Level 3</small></div>'+ico('resellers')+'</div>'
 +(m.length?'<div class="list">'+m.slice(0,100).map(x=>'<div class="record"><div><h3>'+esc(x.customerName)+'</h3><small>'+esc(x.customerPhone||'')+' · '+(x.expiresAt?date(x.expiresAt):'Sin vencimiento')+'</small></div><div class="row-actions">'+tag(x.tier.toUpperCase(),'good')+tag(usd(x.wallet?.USDT||0)+' USDT')+'</div></div>').join('')+'</div>':empty('Sin suscripciones','Los planes activos aparecerán aquí.'))+'</section>'
 +'<div class="spacing"></div><section class="surface section"><div class="panel-head"><div><h2>Pedidos de revendedores</h2><small>Los precios se muestran sin detallar márgenes al revendedor</small></div>'+ico('orders')+'</div>'
 +(orders.length?'<div class="list">'+orders.map(o=>'<div class="record"><div><h3>'+esc(o.game||'Pedido')+' · '+esc(o.offer||'')+'</h3><small>'+esc(o.customerName)+' · '+esc(o.code)+' · '+usd(o.totalUsdt)+' USDT</small></div><div class="row-actions">'+status(o.status)+'<button class="btn secondary small" data-action="reseller-order" data-id="'+esc(o.id)+'">Administrar</button></div></div>').join('')+'</div>':empty('Sin pedidos mayoristas','Cuando un revendedor compre, lo verás aquí.'))+'</section>';
}

function paymentAutomationPanel(){
 const st=S.cache.settings||{},com=S.cache.commerce||{},cr=S.cache.crypto||{};
 const mode=(method,details,automatic,color)=>{
  const good=automatic===true,unknown=automatic===null;
  return '<div class="rs-payment-method-row"><div><strong>'+esc(method)+'</strong><small>'+esc(details)+'</small></div>'
    +tag(unknown?'Requiere integración':good?'Automático':'En revisión',unknown?'warn':good?'good':'warn')+'</div>';
 };
 return '<section class="surface section rs-payment-control"><div class="panel-head"><div><span class="tag">CONFIGURACIÓN DE COBROS</span><h2>Cómo se valida cada pago</h2><small>Refills Shop no marca compras como pagadas basándose solo en lo que escribe el cliente.</small></div>'+ico('shield')+'</div>'
 +mode('Saldo móvil ETECSA','Captura y revisión del comprobante',false)
 +mode('MiTransfer (CUP)','Envío mediante teléfono; referencia del movimiento',st.mitransferAutoEnabled===true?null:false)
 +mode('Transfermóvil (CUP)','Transferencia a tarjeta; referencia del movimiento',st.transfermovilAutoEnabled===true?null:false)
 +mode('USDT BEP-20 · wallet propia','El servidor comprueba token, destinatario, importe y 40 confirmaciones',st.storeUsdtWalletEnabled===true)
 +mode('Saldo Refills Shop','Débito verificado por el servidor; solo revendedores con plan',true)
 +'<div class="alert-note warn">Automatización de CUP: todavía se necesita una conexión verificable de MiTransfer o Transfermóvil. Un número de transacción por sí solo NO confirma que el dinero llegó. Esos pedidos quedan pendientes de revisión.</div>'
 +'<div class="alert-note">La wallet USDT puede verificarse automáticamente en BNB Smart Chain cuando esté habilitada. Las ventas generales están '+(com.acceptOrders?'habilitadas':'pausadas')+'. El estado de NOWPayments es '+(cr.configured?'configurado':'sin configurar')+'.</div>'
 +'</section><div class="spacing"></div>';
}

function drawPayments(){
 const st=S.cache.settings||{},cfg=S.cache.store?.config||{},com=S.cache.commerce||{},cr=S.cache.crypto||{};
 $('admin-view').innerHTML=paymentAutomationPanel()+'<div class="split"><section class="surface section"><div class="panel-head"><div><h2>Tasas y cuentas de cobro</h2><small>Valores compartidos por el catálogo</small></div>'+ico('payments')+'</div><form id="rates-form" class="form-grid">'
 +field('Tasa USDT → SM','buySmPerUsdt',cfg.buySmPerUsdt,'number')+field('Tasa SM → CUP','cupPerSm',cfg.cupPerSm,'number')+field('Comisión de tarjeta (%)','cardFee',cfg.cardFee,'number')+field('Duración plan base (días)','planDays',cfg.planDays||15,'number')
 +field('Número receptor saldo móvil','mobilePhone',st.mobilePhone,'text')+field('Número de MiTransfer','walletPhone',st.walletPhone,'text')+field('Tarjeta de Transfermóvil','cardNumber',st.cardNumber,'text')+field('Número de confirmación','confirmPhone',st.confirmPhone,'text')
 +field('WhatsApp soporte','supportWhatsapp',st.supportWhatsapp,'text')+field('Email soporte','supportEmail',st.supportEmail,'email')+field('Wallet USDT BEP-20 de la tienda','storeUsdtWalletAddress',st.storeUsdtWalletAddress,'text')+'<label class="check wide"><input type="checkbox" name="storeUsdtWalletEnabled" '+(st.storeUsdtWalletEnabled?'checked':'')+'> Preparar wallet USDT propia para verificar transacciones en blockchain</label>'
 +'<input type="hidden" name="planPrice" value=""><input type="hidden" name="operatorName" value="'+esc(st.operatorName||'')+'"><div class="form-actions wide"><button class="btn primary" type="submit">Guardar configuración</button></div></form></section>'
 +'<section class="surface section"><div class="panel-head"><div><h2>Operaciones y seguridad</h2><small>Control de compras con dinero real</small></div>'+ico('shield')+'</div>'
 +'<div class="live-strip"><div><strong>Ventas '+(com.acceptOrders?'habilitadas':'pausadas')+'</strong><p>La comprobación de pagos y los envíos al proveedor son independientes.</p></div>'+tag(com.acceptOrders?'Activas':'Pausadas',com.acceptOrders?'good':'warn')+'</div>'
 +'<form id="commerce-form" class="form-grid spacer">'+field('Límite por pedido en USDT','maxSupplierOrderUsdt',com.maxSupplierOrderUsdt||10,'number')
 +'<label class="check wide"><input type="checkbox" name="enabled" '+(com.acceptOrders?'checked':'')+'> Aceptar pedidos reales</label>'
 +'<label class="check wide"><input type="checkbox" name="confirmRealFunds"> Confirmo que las compras usarán dinero real y que he verificado las cuentas y permisos</label>'
 +'<div class="form-actions wide"><button class="btn secondary" type="submit">Actualizar estado de ventas</button></div></form>'
 +'<hr class="divider"><h3>USDT BEP-20</h3><p>Pasarela: '+esc(cr.gateway||'NOWPayments')+'</p>'+tag(cr.configured?'Configurada':'Pendiente',cr.configured?'good':'warn')+tag(cr.enabled?'Activa':'Desactivada',cr.enabled?'good':'warn')
 +'<p class="footer-caption">Nunca se acreditan fondos ni se hacen compras de prueba desde esta pantalla.</p></section></div>';
}
function field(label,name,value,type){return '<label>'+esc(label)+'<input name="'+name+'" type="'+(type||'text')+'" '+(type==='number'?'step="any" ':'')+'value="'+esc(value??'')+'"></label>'}
function drawCentral(){
 const c=S.cache.central||{},o=S.cache.orderStatus||{},co=S.cache.commerce||{};
 $('admin-view').innerHTML='<div class="grid three">'+metric('CATÁLOGO',c.connected?'Conectado':'Pendiente','Consulta productos Central One','centralone')+metric('ORDENES',o.ordersRead?'Conectadas':'Pendientes','Permiso orders:read','shield')+metric('COMPRAS',co.acceptOrders?'Habilitadas':'Pausadas','Sin gastos de prueba','payments')+'</div><div class="spacing"></div><div class="split">'
 +'<section class="surface section"><div class="panel-head"><div><h2>Claves de Central One</h2><small>Se almacenan cifradas en Supabase Vault</small></div>'+ico('shield')+'</div><form id="co-catalog-key"><label class="tag">API DEL CATÁLOGO</label><input type="password" name="apiKey" required autocomplete="off" placeholder="co_live_…"><button class="btn secondary full spacer" type="submit">Verificar y conectar catálogo</button></form><hr class="divider"><form id="co-orders-key"><label class="tag">API DE PEDIDOS</label><input type="password" name="apiKey" required autocomplete="off" placeholder="co_live_…"><button class="btn secondary full spacer" type="submit">Verificar permisos de pedidos</button></form><div class="alert-note">La comprobación de la clave de pedidos es de solo lectura. No se crea ninguna recarga durante el test.</div></section>'
 +'<section class="surface section"><div class="panel-head"><div><h2>Catálogo del proveedor</h2><small>Busca productos disponibles y enlázalos a tus juegos</small></div>'+ico('search')+'</div><div class="toolbar"><input id="co-search" type="search" value="'+esc(S.coFilter)+'" placeholder="Buscar juego, recarga o PIN"><select id="co-kind"><option value="all" '+(S.coKind==='all'?'selected':'')+'>Todos</option><option value="topup" '+(S.coKind==='topup'?'selected':'')+'>Recargas</option><option value="pin" '+(S.coKind==='pin'?'selected':'')+'>PIN</option></select><button class="btn primary" data-action="search-co" type="button">Buscar</button></div>'+renderCoResults()+'<div class="form-actions"><button class="btn secondary" data-action="sync-co">Sincronizar precios</button><button class="btn ghost" data-page="offers">Crear oferta vinculada</button></div></section></div>';
}
function openModal(title,content){
 $('modal-root').innerHTML='<section class="modal-window" role="dialog" aria-modal="true" aria-label="'+esc(title)+'"><div class="panel-head"><h2>'+esc(title)+'</h2><button type="button" class="close" data-action="close-modal" aria-label="Cerrar">×</button></div>'+content+'</section>';
 $('modal-root').hidden=false;
}
function closeModal(){$('modal-root').hidden=true;$('modal-root').innerHTML=''}
async function changeGame(id){
 const g=(S.cache.games||[]).find(x=>x.id===id);if(!g)return;
 const form=$('game-form');for(const key of ['id','name','imageUrl'])if(form.elements[key])form.elements[key].value=g[key]||'';
 form.elements.category.value=g.tag||'Juegos';form.elements.featured.checked=!!g.featured;form.scrollIntoView({behavior:'smooth',block:'start'});flash('Puedes editar el juego y guardarlo.');
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
function modalConfirm(text){return window.confirm(text)}
async function runAction(action,el){
 const id=el.dataset.id,code=el.dataset.code;
 if(action==='bulk-apply')return withBusy(async()=>{const args=bulkArgs();if(!modalConfirm('¿Actualizar SOLO '+args.region+' con ganancia '+args.marginPercent+' %?'))return;await applyExistingMargin(args);await load('offers')});
 if(action==='bulk-import')return withBusy(async()=>{const args=bulkArgs();await importFamilyOffers(args)});
 if(action==='close-modal')return closeModal();
 if(action==='refresh')return load();
 if(action==='mode-centralone'||action==='mode-manual'){S.offerMode=action.split('-')[1];return drawOffers()}
 if(action==='edit-game')return changeGame(id);
 if(action==='customer-details')return openCustomer(id);
 if(action==='customer-reset')return openCustomerReset(id);
 if(action==='edit-offer')return openOfferEdit(id);
 if(action==='select-co'){S.product=id;if(S.page==='offers')drawOffers();else flash('Producto seleccionado. Abre Ofertas para vincularlo.');return}
 if(action==='search-co')return withBusy(async()=>{S.coFilter=String($('co-search-inline')?.value||$('co-search')?.value||'').trim();S.coKind=$('co-kind')?.value||S.coKind;const result=await request('/admin/centralone/catalog?q='+encodeURIComponent(S.coFilter)+'&kind='+encodeURIComponent(S.coKind));S.cache.coProducts=result.products||[];S.product=S.cache.coProducts[0]?.productId||null;S.page==='offers'?drawOffers():drawCentral();flash((result.total||0)+' productos encontrados en Central One.');});
 if(action==='sync-co')return withBusy(async()=>{if(!modalConfirm('¿Sincronizar costos y disponibilidad? No se enviará ninguna compra.'))return;const res=await request('/admin/centralone/sync',{method:'POST',body:{}});flash(res.message||'Catálogo sincronizado');await load()});
 if(action==='restore-game')return withBusy(async()=>{await request('/admin/restore-game',{method:'POST',body:{id}});flash('Juego restaurado. Las ofertas permanecen como borradores.');await load()});
 if(action==='delete-game')return withBusy(async()=>{if(!modalConfirm('¿Eliminar definitivamente este juego? Los pedidos históricos estarán protegidos.'))return;await request('/admin/delete-game',{method:'POST',body:{id,permanent:true}});flash('Juego eliminado');await load()});
 if(action==='delete-offer')return withBusy(async()=>{if(!modalConfirm('¿Eliminar esta oferta definitivamente?'))return;await request('/admin/delete-offer',{method:'POST',body:{id,permanent:true}});flash('Oferta eliminada');await load()});
 if(action==='toggle-offer')return withBusy(async()=>{const o=(S.cache.offers||[]).find(x=>x.id===id);if(!o)return;if(!modalConfirm((o.active?'Ocultar':'Publicar')+' esta oferta?'))return;await request('/admin/offer-visibility',{method:'POST',body:{id,visible:!o.active}});flash('Visibilidad actualizada');await load()});
 if(action==='verify-payment')return withBusy(async()=>{if(!modalConfirm('¿Has comprobado REALMENTE que recibiste el dinero correspondiente a '+code+'?'))return;await request('/admin/verify-payment',{method:'POST',body:{code,confirmedPayment:true}});flash('Pago verificado');await load()});
 if(action==='refund-order')return withBusy(async()=>{
   const reference=String(prompt('Registra la referencia REAL del dinero que ya devolviste. No se hará ninguna transferencia desde aquí.')||'').trim();
   if(reference.length<4||reference.length>100)throw Error('La referencia del reembolso es obligatoria (4 a 100 caracteres).');
   if(!modalConfirm('Confirma que YA devolviste los fondos del pedido '+code+'. Se guardará el estado Reembolsado y la referencia '+reference+'.'))return;
   await request('/admin/order-status',{method:'POST',body:{code,status:'refunded',refundReference:reference,note:'Reembolso realizado y comprobado por administración.'}});
   flash('Reembolso registrado. No se ejecutó ninguna transferencia desde el panel.');await load();
 });
 if(action==='reject-order')return withBusy(async()=>{if(!modalConfirm('¿Rechazar el pedido '+code+'?'))return;await request('/admin/order-status',{method:'POST',body:{code,status:'rejected'}});flash('Pedido rechazado');await load()});
 if(action==='fulfill')return withBusy(async()=>{if(!modalConfirm('¿Enviar el pedido pagado '+code+' a Central One? Esta operación puede gastar fondos REALES del proveedor.'))return;const r=await request('/admin/fulfill-order',{method:'POST',body:{code,paymentVerified:true}});flash(r.message||'Solicitud enviada. Comprueba el estado del proveedor.');await load()});
 if(action==='assign-pin')return openModal('Entregar PIN','<form id="pin-form"><input type="hidden" name="code" value="'+esc(code)+'"><label>PIN real del proveedor<input name="pin" minlength="4" maxlength="500" required autocomplete="off"></label><div class="form-actions"><button class="btn primary" type="submit">Guardar y entregar PIN</button></div></form>');
 if(action==='receipt')return withBusy(async()=>{const blob=await request('/admin/receipt?code='+encodeURIComponent(code),{blob:true});const url=URL.createObjectURL(blob);window.open(url,'_blank','noopener,noreferrer');setTimeout(()=>URL.revokeObjectURL(url),60000);});
 if(action==='approve-deposit'||action==='reject-deposit')return withBusy(async()=>{if(!modalConfirm(action==='approve-deposit'?'¿Comprobaste el pago REAL? Se acreditará saldo al revendedor.':'¿Rechazar este depósito pendiente?'))return;await request('/admin/wallet-deposit/'+(action==='approve-deposit'?'approve':'reject'),{service:'reseller',method:'POST',body:{id}});flash('Depósito actualizado');await load()});
 if(action==='reseller-order'){const o=(S.cache.reseller?.orders||[]).find(x=>x.id===id);if(!o)return;return openModal('Pedido mayorista','<div class="record"><div><h3>'+esc(o.game)+' · '+esc(o.offer)+'</h3><small>'+esc(o.code)+' · '+esc(o.customerName)+' · '+usd(o.totalUsdt)+' USDT</small></div>'+status(o.status)+'</div><p class="spacer">Para enviar un pedido al proveedor debes confirmar primero que el pago está disponible y que Central One puede atenderlo.</p><div class="form-actions"><button class="btn secondary" data-action="reseller-order-process" data-id="'+esc(id)+'">Procesar</button><button class="btn primary" data-action="reseller-order-fulfill" data-id="'+esc(id)+'">Enviar a Central One</button></div>')};
 if(action==='reseller-order-process'||action==='reseller-order-fulfill')return withBusy(async()=>{const isFulfill=action.endsWith('fulfill');if(!modalConfirm(isFulfill?'¿Enviar pedido a Central One? Puede gastar saldo real.':'¿Marcar pedido en procesamiento?'))return;await request('/admin/order/'+(isFulfill?'fulfill':'status'),{service:'reseller',method:'POST',body:isFulfill?{id}:{id,status:'processing'}});closeModal();flash('Pedido actualizado');await load()});
}
document.addEventListener('click',e=>{
 const el=e.target.closest('button[data-page],button[data-action]');
 if(!el||el.disabled)return;
 if(el.dataset.page){navigate(el.dataset.page);return}
 if(el.dataset.action)runAction(el.dataset.action,el).catch(guarded);
});
document.addEventListener('submit',async e=>{
 const form=e.target;if(!form?.id)return;e.preventDefault();
 const data=Object.fromEntries(new FormData(form).entries());
 if(form.id==='admin-login')return withBusy(async()=>{
  const remember=form.elements.rememberSession?.checked!==false;
  try{localStorage.setItem('refills_shop_remember_session',String(remember));if(!remember)localStorage.removeItem('sb-kcgjlnymhmxylrjchcvl-auth-token')}catch{}
  if(remember!==S.rememberSession){await S.client.auth.signOut().catch(()=>{});S.rememberSession=remember;S.client=createAdminClient()}
  const phone=String(form.elements.country.value).replace(/\D/g,'')+String(form.elements.phone.value).replace(/\D/g,'');
  const email=phoneAlias(phone),password=String(data.password||'');
  const result=await S.client.auth.signInWithPassword({email,password});
  if(result.error)throw result.error;
  try{await verifyAdmin()}catch(err){await S.client.auth.signOut();throw err}
  showConsole();flash('Acceso administrativo verificado.');
 });
 if(!S.user)return flash('Inicia sesión',true);
 await withBusy(async()=>{
  let r;
  if(form.id==='game-form'){r=await request('/admin/game',{method:'POST',body:{id:String(data.id||'').trim().toLowerCase(),name:data.name,category:data.category,imageUrl:data.imageUrl,featured:!!data.featured}});}
  else if(form.id==='link-offer-form'){const pid=S.product||data.productId;if(!pid)throw Error('Busca y selecciona un producto real de Central One.');r=await request('/admin/centralone/offer',{method:'POST',body:{gameId:data.gameId,productId:pid,displayName:data.displayName,gainSm:Number(data.gainSm),featured:!!data.featured}});}
  else if(form.id==='manual-offer-form'){r=await request('/admin/offer-manual',{method:'POST',body:{gameId:data.gameId,name:data.name,provider:'centralone',providerPriceUsdt:Number(data.providerPriceUsdt),gainSm:Number(data.gainSm)}});}
  else if(form.id==='edit-offer-form'){r=await request('/admin/offer-edit',{method:'POST',body:{id:data.id,gainSm:Number(data.gainSm)}});closeModal();}
  else if(form.id==='reset-customer-form'){if(!data.identityConfirmed)throw Error('Debes verificar la identidad del cliente.');r=await request('/admin/customer-password',{method:'POST',body:{userId:data.userId,password:data.password,identityConfirmed:true}});closeModal();}
  else if(form.id==='pin-form'){if(!modalConfirm('¿Seguro que este es el PIN REAL del pedido?'))return;r=await request('/admin/pin/assign',{method:'POST',body:{code:data.code,pin:data.pin}});closeModal();}
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
 const id=e.target.id;
 if(id==='filter-games'){S.search=e.target.value;filterVisibleRecords(e.target.value,e.target.closest('.surface')||$('admin-view'))}
 if(id==='filter-offers'){S.offerSearch=e.target.value;filterVisibleRecords(e.target.value,e.target.closest('.surface')||$('admin-view'))}
 if(id==='filter-orders'){S.search=e.target.value;filterVisibleRecords(e.target.value,e.target.closest('.surface')||$('admin-view'))}
 if(id==='filter-customers'){S.search=e.target.value;filterVisibleRecords(e.target.value,e.target.closest('.surface')||$('admin-view'))}
});
document.addEventListener('change',e=>{
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
$('sign-out').addEventListener('click',async()=>{await S.client.auth.signOut();showLogin();flash('Sesión cerrada.');});
$('modal-root').addEventListener('click',e=>{if(e.target.id==='modal-root')closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
window.addEventListener('hashchange',()=>{if(S.user){S.page=pageFromHash();navigate(S.page,true)}});
async function start(){
 try{
  if(!window.supabase?.createClient)throw Error('No se cargó el módulo de Supabase.');
  try{S.rememberSession=localStorage.getItem('refills_shop_remember_session')!=='false'}catch{S.rememberSession=true}
  S.client=createAdminClient();
  const session=(await S.client.auth.getSession()).data.session;
  if(!session)return showLogin();
  try{await verifyAdmin();showConsole()}catch(err){showLogin(err.message)}
 }catch(err){showLogin(err.message)}
}
start();
})();