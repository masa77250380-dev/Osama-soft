package com.proaccounting.offline;

import android.app.Activity;
import android.content.Context;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.BridgeActivity;

import java.util.ArrayList;
import java.util.List;

/** Native Android helpers: reliable system printing + pinch zoom. */
public class MainActivity extends BridgeActivity {
    private final List<WebView> printViews = new ArrayList<>();

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            // Enable normal Android pinch zoom even when the HTML viewport is restrictive.
            settings.setSupportZoom(true);
            settings.setBuiltInZoomControls(true);
            settings.setDisplayZoomControls(false);
            settings.setUseWideViewPort(true);
            settings.setLoadWithOverviewMode(false);

            webView.addJavascriptInterface(new PrintBridge(this), "AndroidPrint");
        }
    }

    public static class PrintBridge {
        private final MainActivity activity;

        PrintBridge(MainActivity activity) {
            this.activity = activity;
        }

        @JavascriptInterface
        public void printHtml(final String html) {
            activity.runOnUiThread(() -> activity.startHtmlPrint(html));
        }

        @JavascriptInterface
        public void printCurrentPage() {
            activity.runOnUiThread(activity::startCurrentPagePrint);
        }
    }

    private void configurePrintWebView(WebView view) {
        WebSettings settings = view.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDefaultTextEncodingName("UTF-8");
        settings.setSupportZoom(false);
    }

    private void startHtmlPrint(String html) {
        final WebView printWebView = new WebView(this);
        configurePrintWebView(printWebView);
        // Keep a strong reference until the print job is started/completed.
        printViews.add(printWebView);

        printWebView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                view.postDelayed(() -> startPrint(view, "Pro Accounting"), 900);
            }
        });

        String safeHtml = html == null ? "" : html;
        printWebView.loadDataWithBaseURL(
                "https://localhost/",
                safeHtml,
                "text/html",
                "UTF-8",
                null
        );
    }

    private void startCurrentPagePrint() {
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            startPrint(webView, "Pro Accounting");
        }
    }

    private void startPrint(WebView webView, String jobName) {
        PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
        if (printManager == null || webView == null) return;

        PrintDocumentAdapter adapter = webView.createPrintDocumentAdapter(jobName);
        printManager.print(jobName, adapter,
                new PrintAttributes.Builder()
                        .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                        .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                        .build());
    }

    @Override
public void onDestroy() {
        for (WebView view : printViews) {
            try { view.destroy(); } catch (Exception ignored) {}
        }
        printViews.clear();
        super.onDestroy();
    }
}
