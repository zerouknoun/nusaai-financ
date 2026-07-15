package com.nusaai.finance;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import java.text.NumberFormat;
import java.util.Locale;

public class FinanceWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        // There may be multiple widgets active, so update all of them
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        // Construct the RemoteViews object
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_finance);

        // Access Capacitor Preferences data
        SharedPreferences prefs = context.getSharedPreferences("CapacitorStorage", Context.MODE_PRIVATE);
        String isLoggedIn = prefs.getString("widget_is_logged_in", "false");
        
        if ("true".equals(isLoggedIn)) {
            views.setViewVisibility(R.id.layout_data, android.view.View.VISIBLE);
            views.setViewVisibility(R.id.layout_login_prompt, android.view.View.GONE);
            
            String saldoStr = prefs.getString("widget_saldo", "0");
            String pemasukanStr = prefs.getString("widget_pemasukan", "0");
            String pengeluaranStr = prefs.getString("widget_pengeluaran", "0");

            try {
                double saldo = Double.parseDouble(saldoStr);
                double pemasukan = Double.parseDouble(pemasukanStr);
                double pengeluaran = Double.parseDouble(pengeluaranStr);

                views.setTextViewText(R.id.tv_saldo, formatRp(saldo));
                views.setTextViewText(R.id.tv_pemasukan, formatRp(pemasukan));
                views.setTextViewText(R.id.tv_pengeluaran, formatRp(pengeluaran));
            } catch (NumberFormatException e) {
                views.setTextViewText(R.id.tv_saldo, "Rp 0");
                views.setTextViewText(R.id.tv_pemasukan, "Rp 0");
                views.setTextViewText(R.id.tv_pengeluaran, "Rp 0");
            }
        } else {
            views.setViewVisibility(R.id.layout_data, android.view.View.GONE);
            views.setViewVisibility(R.id.layout_login_prompt, android.view.View.VISIBLE);
        }

        // Instruct the widget manager to update the widget
        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
    
    private static String formatRp(double amount) {
        NumberFormat format = NumberFormat.getCurrencyInstance(new Locale("id", "ID"));
        format.setMaximumFractionDigits(0);
        return format.format(amount).replace("Rp", "Rp ");
    }
}
