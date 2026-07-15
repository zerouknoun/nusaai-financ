package com.nusaai.finance;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Intent;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetPlugin")
public class WidgetPlugin extends Plugin {
    @PluginMethod
    public void updateWidget(PluginCall call) {
        try {
            Intent intent = new Intent(getContext(), FinanceWidgetProvider.class);
            intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            
            AppWidgetManager widgetManager = AppWidgetManager.getInstance(getContext());
            int[] ids = widgetManager.getAppWidgetIds(new ComponentName(getContext(), FinanceWidgetProvider.class));
            intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
            
            getContext().sendBroadcast(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Gagal memperbarui widget: " + e.getMessage());
        }
    }
}
