'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const http=require('node:http');const {handler}=require('../server');
async function request(url){const s=http.createServer(handler);await new Promise(r=>s.listen(0,'127.0.0.1',r));try{const port=s.address().port;const r=await fetch('http://127.0.0.1:'+port+url);return {status:r.status,body:await r.text()};}finally{await new Promise(r=>s.close(r));}}
test('health endpoint',async()=>{const r=await request('/health');assert.equal(r.status,200);assert.equal(JSON.parse(r.body).status,'ok')});
test('supplier order endpoints disabled',async()=>{const r=await request('/api/admin/fulfill-order');assert.equal(r.status,503)});
test('private config blocked',async()=>{const r=await request('/.env');assert.equal(r.status,403)});
test('root serves preview',async()=>{const r=await request('/');assert.equal(r.status,200);assert.match(r.body,/Servidor de pruebas/)});
