'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {priceOf}=require('../prices');
test('cliente y revendedor usan costos y tasas, sin redondeo anticipado',()=>{
 const p=priceOf({provider_price_usdt:2,gain_sm:50},{buy_sm_per_usdt:400,cup_per_sm:4,card_fee_pct:5});
 assert.deepEqual(p,{sm:850,cup:3400,usdt:2.13,card:3570,resellerUsdt:2.06});
});
test('rechaza tasas invalidas o precios negativos',()=>{
 assert.throws(()=>priceOf({provider_price_usdt:-1,gain_sm:0},{buy_sm_per_usdt:400,cup_per_sm:4,card_fee_pct:5}),/INVALID_PRICE_CONFIG/);
 assert.throws(()=>priceOf({provider_price_usdt:2,gain_sm:0},{buy_sm_per_usdt:0,cup_per_sm:4,card_fee_pct:5}),/INVALID_PRICE_CONFIG/);
});