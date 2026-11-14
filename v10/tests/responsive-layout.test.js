'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const app=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'..','site.css'),'utf8');

test('el detalle de pedido conserva el encabezado y permite desplazar el comprobante',()=>{
  assert.match(app,/class="card modal-card order-detail-modal"/);
  assert.match(app,/class="order-detail-body"/);
  assert.match(css,/\.modal-card\.order-detail-modal\{[^}]*overflow:hidden!important/);
  assert.match(css,/\.order-detail-body\{[^}]*overflow-y:auto/);
  assert.match(css,/\.order-detail-body \.admin-image\{[^}]*max-height:min\(62dvh,520px\)/);
});

test('las secciones de tienda y administración respetan el ancho del móvil',()=>{
  assert.match(css,/html\{[^}]*overflow-x:clip/);
  assert.match(css,/body\.shop-refresh \.main-content\{[^}]*margin-inline:auto/);
  assert.match(css,/body\.shop-refresh \.offer-grid-v4\{[^}]*width:100%/);
  assert.match(css,/body\.admin-view \.rs-admin-content \.rs-v3-item\{[^}]*flex-wrap:wrap/);
  assert.doesNotMatch(css,/100vw/);
});
