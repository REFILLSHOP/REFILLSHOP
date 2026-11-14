'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {parseCentralCatalog,cents4}=require('../centralone');
const uuid='22222222-3333-4444-5555-666666666666';
test('Central One: parses UUID and preserves four decimals; recognizes dynamic server selects',()=>{
 const c=parseCentralCatalog({items:[{product_id:uuid,name:'Diamantes',product_type:'game_topup',category:'gaming_topup',currency:'USD',reseller_price:'1.2345',status:'active',in_stock:true,product_family_name:'Juego',requires_target:true,target_fields:['player_id','server'],target_schema:[{key:'player_id',label:'ID',type:'text'},{key:'server',label:'Servidor',type:'select',options:[{value:'region_a',label:'Región A'}]}]}]});
 assert.equal(c.length,1);assert.equal(c[0].id,uuid);assert.equal(c[0].price,'1.2345');assert.equal(c[0].targetSchema.length,2);assert.equal(c[0].targetSchema[1].options[0].value,'region_a');
});
test('Central One: out-of-stock stays available to sync, not for new purchases',()=>{
 const c=parseCentralCatalog({items:[{product_id:uuid,name:'Producto sin stock',currency:'USD',reseller_price:'12.0000',status:'active',in_stock:false}]});
 assert.equal(c.length,1);assert.equal(c[0].inStock,false);
});
test('Central One: rejects broken responses and imprecise prices',()=>{
 assert.throws(()=>parseCentralCatalog({error:{code:'invalid_api_key'}}));
 assert.throws(()=>cents4('1.23456'));
 assert.throws(()=>cents4('-1.20'));
 assert.equal(cents4('1.2'),'1.2000');
});