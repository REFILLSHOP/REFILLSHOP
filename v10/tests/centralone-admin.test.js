'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const client=fs.readFileSync(path.resolve(__dirname,'../app.js'),'utf8');
const edge=fs.readFileSync(path.resolve(__dirname,'../../edge/rs10-api/index.ts'),'utf8');
const css=fs.readFileSync(path.resolve(__dirname,'../site.css'),'utf8');
test('editor ADM busca producto real y calcula precio de revendedor con regla antigua 2%',()=>{
 assert.match(client,/adminOfferWizard\(\)/);
 assert.match(client,/adminProviderSearchForm/);
 assert.match(client,/adminLinkedOfferForm/);
 assert.match(client,/coProductSearch/);
 assert.match(client,/adminPricePreview/);
 assert.match(client,/resellerPrice\*1\.02/);
 assert.match(css,/\.adm-editor-grid/);
 assert.match(css,/@media\(max-width:600px\)/);
});
test('los endpoints de proveedor se encuentran despues de verificar rol de administrador',()=>{
 const guard=edge.indexOf("if(!adminUser||adminUser.app_metadata?.role!=='refills_admin')");
 for(const route of ["/admin/centralone/status","/admin/centralone/connect","/admin/centralone/catalog","/admin/centralone/offer","/admin/centralone/sync"]){
   assert.ok(edge.includes(route),'Falta '+route);
   assert.ok(edge.indexOf(route)>guard,route+' debe estar protegido');
 }
});
test('la conexion del proveedor solo guarda llave en Vault y no la devuelve',()=>{
 assert.match(edge,/rs10_store_centralone_catalog_key/);
 assert.match(edge,/rs10_read_centralone_catalog_key/);
 assert.match(edge,/centralOneFetch\('\/ping',key\)/);
 assert.match(edge,/\{ok:true,connected:true,message:/);
 assert.doesNotMatch(edge,/return respond\(\{apiKey:key/);
});
test('productos vinculados se guardan en borrador para no cobrar sin entrega verificada',()=>{
 assert.match(edge,/provider_name:'centralone'/);
 assert.match(edge,/provider_product_key:product\.productId/);
 assert.match(edge,/provider_price_usdt:product\.resellerPrice/);
 assert.match(edge,/provider_target_schema:product\.targetSchema/);
 assert.match(edge,/active:false/);
 assert.match(edge,/resellerUsdt:r2\(cost\*1\.02\)/);
 assert.match(edge,/Operación de compra o pago no habilitada/);
});