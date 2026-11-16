/* Refills Shop V19: restore the Supabase browser SDK before storefront bootstrap. */
(function () {
  if (window.supabase && typeof window.supabase.createClient === 'function') return;
  // Loading must be parser-blocking: the storefront bootstrap is the next script.
  var sdk = 'https://v19-auth-fix.refillshop.pages.dev/vendor/supabase.js';
  var fallback = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/dist/umd/supabase.js';
  if (document.readyState !== 'loading') return;
  document.write('<script src="' + sdk + '" onerror="this.onerror=null;this.src=\'' + fallback + '\'"></' + 'script>');
})();
