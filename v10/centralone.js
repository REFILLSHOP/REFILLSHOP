'use strict';
// Central One v1 adapter. READ-ONLY: this module NEVER creates an order.
const BASE='https://portal.centraloneglobal.com/api/v1';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function cents4(raw){
 if(typeof raw!=='string'||!/^(?:0|[1-9][0-9]{0,8})(?:\.[0-9]{1,4})?$/.test(raw))throw Error('INVALID_CENTRAL_PRICE');
 const [whole,fract='']=raw.split('.');const units=BigInt(whole)*10000n+BigInt(fract.padEnd(4,'0'));
 if(units<=0n)throw Error('INVALID_CENTRAL_PRICE');
 return (units/10000n).toString()+'.'+(units%10000n).toString().padStart(4,'0');
}
function safeTargetSchema(val){
 if(!Array.isArray(val))return [];
 return val.slice(0,15).filter(f=>f&&typeof f.key==='string'&&/^[a-z0-9_]{1,50}$/i.test(f.key)).map(f=>({key:f.key,label:String(f.label||f.key).slice(0,100),type:f.type==='select'?'select':'text',options:f.type==='select'&&Array.isArray(f.options)?f.options.slice(0,100).filter(o=>o&&typeof o.value==='string').map(o=>({value:o.value.slice(0,80),label:String(o.label||o.value).slice(0,100)})):[]}));
}
function parseCentralCatalog(data){
 if(!data||!Array.isArray(data.items))throw Error('INVALID_CENTRAL_CATALOG');
 return data.items.filter(p=>p&&uuid.test(String(p.product_id||''))&&p.reseller_price&&p.currency==='USD').slice(0,6000).map(p=>({
 id:String(p.product_id).toLowerCase(),name:String(p.name||'Producto').slice(0,160),sku:String(p.sku||'').slice(0,80),
 price:cents4(p.reseller_price),region:String(p.region||'GLOBAL').slice(0,80),
 family:String(p.product_family_name||'').slice(0,150),familyId:String(p.product_family_id||'').slice(0,120),
 type:String(p.product_type||p.category||'digital').slice(0,40),
 requiresTarget:p.requires_target===true,fields:Array.isArray(p.target_fields)?p.target_fields.slice(0,15).filter(v=>typeof v==='string'):[],
 targetSchema:(()=>{const schema=safeTargetSchema(p.target_schema);return schema.length?schema:(Array.isArray(p.target_fields)?p.target_fields.filter(v=>/^[a-z0-9_]{1,50}$/i.test(String(v))).map(v=>({key:String(v),label:String(v).replace(/_/g,' '),type:'text',options:[]})):[])})(),inStock:p.in_stock===true,status:String(p.status||'').slice(0,30),
 updatedAt:typeof p.price_updated_at==='string'?p.price_updated_at:null
 })).filter(p=>p.status==='active');
}
module.exports={BASE,uuid,cents4,parseCentralCatalog,safeTargetSchema};