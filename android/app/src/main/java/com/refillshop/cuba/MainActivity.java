package com.refillshop.cuba;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.CookieManager;
import android.webkit.ValueCallback;
import android.webkit.WebResourceRequest;
import android.net.Uri;
import android.content.Intent;
import android.graphics.Color;
import android.view.ViewGroup;
import android.widget.Toast;

public class MainActivity extends Activity {
    private static final String SITE = "https://refillshop.github.io/REFILLSHOP/";
    private static final int FILE_PICKER_REQUEST = 4219;
    private WebView web;
    private ValueCallback<Uri[]> fileCallback;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(Color.rgb(6,20,42));
        getWindow().setNavigationBarColor(Color.rgb(6,20,42));
        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(6,20,42));
        web.setLayoutParams(new ViewGroup.LayoutParams(-1,-1));
        setContentView(web);
        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web,false);
        web.setWebViewClient(new WebViewClient() {
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if (uri == null) return true;
                if (!"https".equalsIgnoreCase(uri.getScheme())) return true;
                String host = uri.getHost();
                if ("refillshop.github.io".equalsIgnoreCase(host)) return false;
                try {
                    Intent external = new Intent(Intent.ACTION_VIEW,uri);
                    external.addCategory(Intent.CATEGORY_BROWSABLE);
                    startActivity(external);
                } catch (Exception e) { Toast.makeText(MainActivity.this,"No se pudo abrir el enlace.",Toast.LENGTH_SHORT).show(); }
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                try {
                    Intent pick = new Intent(Intent.ACTION_GET_CONTENT);
                    pick.addCategory(Intent.CATEGORY_OPENABLE);
                    pick.setType("image/*");
                    startActivityForResult(Intent.createChooser(pick,"Seleccionar comprobante"),FILE_PICKER_REQUEST);
                    return true;
                } catch (Exception error) {
                    fileCallback = null;
                    callback.onReceiveValue(null);
                    return false;
                }
            }
        });
        web.loadUrl(SITE);
    }

    @Override protected void onActivityResult(int requestCode,int resultCode,Intent intent) {
        super.onActivityResult(requestCode,resultCode,intent);
        if (requestCode != FILE_PICKER_REQUEST) return;
        if (fileCallback == null) return;
        Uri[] result = WebChromeClient.FileChooserParams.parseResult(resultCode,intent);
        fileCallback.onReceiveValue(result);
        fileCallback = null;
    }

    @Override public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override protected void onDestroy() {
        if (fileCallback != null) {fileCallback.onReceiveValue(null); fileCallback = null;}
        if (web != null) {
            web.loadUrl("about:blank");
            web.stopLoading();
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}
