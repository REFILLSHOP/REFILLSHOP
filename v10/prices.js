'use strict';
function finite(value,low,high){const n=Number(value);return Number.isFinite(n)&&n>=low&&n<=high?n:null}
function round(n){return Math.round((n+Number.EPSILON)*100)/100}
function priceOf(offer,config){
 const cost=finite(offer.provider_price_usdt,0.00001,1e9);
 const smRate=finite(config.buy_sm_per_usdt,0.001,1e9);
 const cupRate=finite(config.cup_per_sm,0.001,1e9);
 const gain=finite(offer.gain_sm,0,1e9);
 const fee=finite(config.card_fee_pct,0,100);
 if([cost,smRate,cupRate,gain,fee].some(x=>x===null)) throw Error('INVALID_PRICE_CONFIG');
 const sm=round(cost*smRate+gain),cup=round(sm*cupRate);
 return {sm,cup,usdt:round(sm/smRate),card:round(cup*(1+fee/100)),resellerUsdt:round(cost*1.03)};
}
module.exports={priceOf,finite,round};