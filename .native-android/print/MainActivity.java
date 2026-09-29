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

/**
 * Native Android print bridge for the offline accounting app.
 * JavaScript calls window.AndroidPrint.printHtml(html).
 */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.addJavascriptInterface(new PrintBridge(this), "AndroidPrint");
        }
    }

    public static class PrintBridge {
        private final Activity activity;

        PrintBridge(Activity activity) {
            this.activity = activity;
        }

        @JavascriptInterface
        public void printHtml(final String html) {
            activity.runOnUiThread(() -> {
                final WebView printWebView = new WebView(activity);
                WebSettings settings = printWebView.getSettings();
                settings.setJavaScriptEnabled(true);
                settings.setDomStorageEnabled(true);
                settings.setDefaultTextEncodingName("UTF-8");

                printWebView.setWebViewClient(new WebViewClient() {
                    @Override
                    public void onPageFinished(WebView view, String url) {
                        view.postDelayed(() -> startPrint(view), 350);
                    }
                });

                String safeHtml = html == null ? "" : html;
                printWebView.loadDataWithBaseURL(
                        null,
                        safeHtml,
                        "text/html",
                        "UTF-8",
                        null
                );
            });
        }

        private void startPrint(WebView printWebView) {
            PrintManager printManager =
                    (PrintManager) activity.getSystemService(Context.PRINT_SERVICE);
            if (printManager == null) {
                return;
            }

            String jobName = "Pro Accounting";
            PrintDocumentAdapter adapter = printWebView.createPrintDocumentAdapter(jobName);
            printManager.print(jobName, adapter, new PrintAttributes.Builder()
                    .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                    .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                    .build());
        }
    }
}
