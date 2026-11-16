/* Refills Shop V19 - Supabase SDK loader.
   Primary: Cloudflare-hosted verified SDK asset from V19 auth-fix build.
   Fallback: pinned official Supabase browser bundle.
   Keep synchronous loading because the storefront's inline bootstrap runs next. */
(function () {
  if (window.supabase && typeof window.supabase.createClient === 'function') return;
  if (document.readyState !== 'loading') {
    console.error('Refills Shop: SDK loader must be included during HTML parsing.');
    return;
  }
  var primary = 'https://v19-auth-fix.refillshop.pages.dev/vendor/supabase.js';
  var fallback = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/dist/umd/supabase.js';
  document.write('<script src="' + primary + '"><\\/script>');
  document.write('<script>if (!window.supabase || !window.supabase.createClient) document.write(\'<script src="' + fallback + '"><\\\\/script>\');<\\/script>');
})();
