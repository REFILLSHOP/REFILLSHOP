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
    private long lastNotice=0;
    private static final String CHANNEL="refills_orders";
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
        settings.setUserAgentString(settings.getUserAgentString()+" RefillsShopAndroid/3");
        web.addJavascriptInterface(new Notices(),"RefillsAndroid");
        android.app.NotificationManager manager=getSystemService(android.app.NotificationManager.class);
        manager.createNotificationChannel(new android.app.NotificationChannel(CHANNEL,"Pedidos Refills Shop",android.app.NotificationManager.IMPORTANCE_DEFAULT));
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
                if ("refillshop.github.io".equalsIgnoreCase(host) && uri.getPath()!=null && uri.getPath().startsWith("/REFILLSHOP/") && !uri.getPath().startsWith("/REFILLSHOP/admin/")) return false;
                if ("refillshop.github.io".equalsIgnoreCase(host)) return true;
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

    private boolean trustedPage() {
        if(web==null||web.getUrl()==null)return false;
        Uri u=Uri.parse(web.getUrl());return "https".equals(u.getScheme())&&"refillshop.github.io".equals(u.getHost())&&u.getPath()!=null&&u.getPath().startsWith("/REFILLSHOP/")&&!u.getPath().startsWith("/REFILLSHOP/admin/");
    }
    private final class Notices {
        @android.webkit.JavascriptInterface public void enable() {
            runOnUiThread(()->{if(!trustedPage())return;if(android.os.Build.VERSION.SDK_INT>=33&&checkSelfPermission("android.permission.POST_NOTIFICATIONS")!=android.content.pm.PackageManager.PERMISSION_GRANTED)requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"},402);});
        }
        @android.webkit.JavascriptInterface public void orderEvent(String type) {
            runOnUiThread(()->{
                if(!trustedPage()||!("completed".equals(type)||"payment".equals(type)||"processing".equals(type)))return;
                if(android.os.Build.VERSION.SDK_INT>=33&&checkSelfPermission("android.permission.POST_NOTIFICATIONS")!=android.content.pm.PackageManager.PERMISSION_GRANTED)return;
                long now=android.os.SystemClock.elapsedRealtime();if(now-lastNotice<1500)return;lastNotice=now;
                String title="completed".equals(type)?"Recarga completada":"payment".equals(type)?"Pago confirmado":"Pedido en proceso";
                Intent open=new Intent(MainActivity.this,MainActivity.class);open.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP|Intent.FLAG_ACTIVITY_CLEAR_TOP);
                android.app.PendingIntent pi=android.app.PendingIntent.getActivity(MainActivity.this,0,open,android.app.PendingIntent.FLAG_IMMUTABLE|android.app.PendingIntent.FLAG_UPDATE_CURRENT);
                android.app.Notification n=new android.app.Notification.Builder(MainActivity.this,CHANNEL).setSmallIcon(android.R.drawable.stat_notify_more).setContentTitle(title).setContentText("Abre Refills Shop para consultar tu pedido.").setContentIntent(pi).setAutoCancel(true).build();
                getSystemService(android.app.NotificationManager.class).notify((int)(now%Integer.MAX_VALUE),n);
            });
        }
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
            web.removeJavascriptInterface("RefillsAndroid");
            web.loadUrl("about:blank");
            web.stopLoading();
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}
