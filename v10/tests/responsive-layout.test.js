'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const app=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'..','site.css'),'utf8');

test('el detalle compacto de pedido puede desplazarse y el comprobante no invade la pantalla',()=>{
  assert.match(app,/class="card modal-card order-modal-v2"/);
  assert.match(app,/class="order-modal-v2-scroll"/);
  assert.match(css,/\.modal-card\.order-modal-v2\{[^}]*overflow:hidden!important/);
  assert.match(css,/\.order-modal-v2-scroll\{[^}]*overflow-y:auto/);
  assert.match(css,/#adminReceiptView\.is-expanded \.admin-image\{[^}]*max-height:min\(58dvh,480px\)/);
});

test('el progreso de compra sustituye las tres tarjetas por una barra adaptativa',()=>{
  assert.match(app,/function steps\(\)/);
  assert.match(app,/checkout-track-v14/);
  assert.match(app,/role="progressbar"/);
  assert.match(css,/body\.shop-refresh \.checkout-track-v14\{[^}]*max-width:100%/);
  assert.match(css,/@media\(max-width:560px\)/);
});

test('la tienda y administración limitan el ancho sin cortar el diseño en móviles',()=>{
  assert.match(css,/html\{[^}]*overflow-x:clip/);
  assert.match(css,/body\.shop-refresh \.offer-grid-v4\{[^}]*width:100%/);
  assert.match(css,/body\.admin-view \.rs-admin-content/);
  assert.match(css,/body\.shop-refresh \.payment-methods-v5\{[^}]*grid-template-columns:minmax\(0,1fr\)/);
});
