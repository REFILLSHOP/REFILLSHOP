'use strict';
// Technical login identifier. This address is never presented as a real email,
// never used for recovery, and cannot receive messages.
const PHONE_EMAIL_DOMAIN='refillshop.pages.dev';
function normalizeCubaMobile(value){
 const text=String(value??'').replace(/[\s()+-]/g,'');
 const digits=text.startsWith('53')&&text.length===10?text.slice(2):text;
 return /^5[0-9]{7}$/.test(digits)?digits:null;
}
function loginEmailForPhone(value){
 const phone=normalizeCubaMobile(value);
 if(!phone)throw Error('INVALID_CUBA_MOBILE');
 return `cu53${phone}@${PHONE_EMAIL_DOMAIN}`;
}
function validPhonePassword(password){return typeof password==='string'&&password.length>=10&&password.length<=72&&/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(password)&&/[0-9]/.test(password)}
module.exports={normalizeCubaMobile,loginEmailForPhone,validPhonePassword};