package com.proaccounting.offline;

import android.content.Context;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private PrintBridge printBridge;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();
        if (webView != null) {
            printBridge = new PrintBridge(this);
            webView.addJavascriptInterface(printBridge, "AndroidPrint");
        }
    }

    private static class PrintBridge {
        private final MainActivity activity;

        PrintBridge(MainActivity activity) {
            this.activity = activity;
        }

        @JavascriptInterface
        public void printHtml(final String html) {
            activity.mainHandler.post(() -> activity.startNativePrint(html));
        }
    }

    private void startNativePrint(final String html) {
        final WebView printWebView = new WebView(this);
        WebSettings settings = printWebView.getSettings();
        settings.setJavaScriptEnabled(false);
        settings.setDomStorageEnabled(false);
        settings.setDefaultTextEncodingName("UTF-8");

        printWebView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);

                PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                if (printManager == null) {
                    return;
                }

                String jobName = "Pro Accounting - تقرير";
                android.print.PrintDocumentAdapter adapter = printWebView.createPrintDocumentAdapter(jobName);

                PrintAttributes attributes = new PrintAttributes.Builder()
                        .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                        .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                        .build();

                printManager.print(jobName, adapter, attributes);
            }
        });

        String safeHtml = html == null ? "" : html;
        printWebView.loadDataWithBaseURL(
                "https://pro-accounting.local/",
                safeHtml,
                "text/html",
                "UTF-8",
                null
        );
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
    }
}
