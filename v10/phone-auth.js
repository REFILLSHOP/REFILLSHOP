'use strict';
// Phone ownership is NOT verified by a password-only signup. These aliases are
// technical Auth identifiers; they must never be treated as deliverable email.
const PHONE_EMAIL_DOMAIN='refillshop.pages.dev';
const COUNTRY_CALLING_CODES=new Set(['1','7','20','27','30','31','32','33','34','36','39','40','41','43','44','45','46','47','48','49','51','52','53','54','55','56','57','58','60','61','62','63','64','65','66','81','82','84','86','90','91','92','93','94','95','98','211','212','213','216','218','220','221','222','223','224','225','226','227','228','229','230','231','232','233','234','235','236','237','238','239','240','241','242','243','244','245','246','248','249','250','251','252','253','254','255','256','257','258','260','261','262','263','264','265','266','267','268','269','290','291','297','298','299','350','351','352','353','354','355','356','357','358','359','370','371','372','373','374','375','376','377','378','380','381','382','383','385','386','387','389','420','421','423','500','501','502','503','504','505','506','507','508','509','590','591','592','593','594','595','596','597','598','599','670','672','673','674','675','676','677','678','679','680','681','682','683','685','686','687','688','689','690','691','692','850','852','853','855','856','880','886','960','961','962','963','964','965','966','967','968','970','971','972','973','974','975','976','977','992','993','994','995','996','998']);
function normalizeCubaMobile(value){
 const text=String(value??'').replace(/[\s()+-]/g,'');
 const digits=text.startsWith('53')&&text.length===10?text.slice(2):text;
 return /^5[0-9]{7}$/.test(digits)?digits:null;
}
function normalizeInternationalPhone(value){
 const raw=String(value??'').trim();
 // Do not silently guess a country: ambiguous national numbers cannot be routed.
 if(!/^\+[0-9()\s.\-]+$/.test(raw))return null;
 const digits=raw.replace(/[^0-9]/g,'');
 if(digits.length<8||digits.length>15||digits[0]==='0')return null;
 const country=[...COUNTRY_CALLING_CODES].filter(c=>digits.startsWith(c)).sort((a,b)=>b.length-a.length)[0];
 if(!country)return null;
 const national=digits.slice(country.length);
 if(national.length<5||national.length>12)return null;
 // Existing Cuban users require the same alias; accept old local format only in legacy flow.
 if(country==='53'&&!normalizeCubaMobile(national))return null;
 return '+'+digits;
}
function normalizeProfilePhone(value){
 const intl=normalizeInternationalPhone(value);
 if(intl)return intl;
 const legacy=normalizeCubaMobile(value);
 return legacy?'+53'+legacy:null;
}
function loginEmailForPhone(value){
 const international=normalizeInternationalPhone(value);
 if(!international){
  const cuba=normalizeCubaMobile(value);
  if(cuba)return `cu53${cuba}@${PHONE_EMAIL_DOMAIN}`;
  throw Error('INVALID_PHONE');
 }
 const digits=international.slice(1);
 if(digits.startsWith('53')&&digits.length===10)return `cu${digits}@${PHONE_EMAIL_DOMAIN}`;
 return `tel${digits}@${PHONE_EMAIL_DOMAIN}`;
}
function validPhonePassword(password){return typeof password==='string'&&password.length>=10&&password.length<=72&&/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(password)&&/[0-9]/.test(password)}
module.exports={normalizeCubaMobile,normalizeInternationalPhone,normalizeProfilePhone,loginEmailForPhone,validPhonePassword};