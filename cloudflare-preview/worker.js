// Entorno aislado para verificar Cloudflare Workers. NO es la tienda de producción.
export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method Not Allowed', {status:405,headers:{Allow:'GET, HEAD'}});
    if (url.pathname === '/health') {
      return new Response(request.method === 'HEAD' ? null : JSON.stringify({ok:true,stage:'cloudflare-staging',payments:false,centralOnePurchases:false}), {status:200,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
    }
    if (url.pathname !== '/') return new Response('Not Found',{status:404});
    const html = `<!doctype html><html lang="es"><meta name="viewport" content="width=device-width,initial-scale=1"><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><title>Refills Shop - Entorno seguro</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;box-sizing:border-box;background:#04111f;color:#e4f5ff;font:16px system-ui}main{max-width:540px;padding:28px;border:1px solid #2c75a5;border-radius:22px;background:#071b30}h1{color:#74cfff}p{line-height:1.6}</style><main><h1>Refills Shop · Pruebas</h1><p>Servidor Cloudflare conectado. Este sitio es una prueba de infraestructura, NO es la tienda V10.</p><p>Los pagos, pedidos y compras Central One están desactivados.</p></main></html>`;
    return new Response(request.method === 'HEAD' ? null : html, {status:200,headers:{'content-type':'text/html; charset=utf-8','x-robots-tag':'noindex, nofollow','cache-control':'no-store','x-content-type-options':'nosniff'}});
  }
};
