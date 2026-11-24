package app.vinvi.philatrail

import android.appwidget.AppWidgetManager
import android.content.Context
import android.content.SharedPreferences
import android.widget.RemoteViews
import es.antonborri.home_widget.HomeWidgetLaunchIntent
import es.antonborri.home_widget.HomeWidgetProvider

/**
 * Android home-screen widget showing passport progress ("N of M stamps" +
 * a progress bar). Port of ios/PhilatrailWidget/PhilatrailWidget.swift's
 * content, fed by lib/core/home_widget_sync.dart via the home_widget
 * plugin's SharedPreferences bridge rather than reading app data directly
 * (this provider has no access to the Flutter engine/Supabase client).
 */
class PhilatrailWidgetProvider : HomeWidgetProvider() {

  override fun onUpdate(
      context: Context,
      appWidgetManager: AppWidgetManager,
      appWidgetIds: IntArray,
      widgetData: SharedPreferences
  ) {
    val collected = widgetData.getInt("collected", 0)
    val total = widgetData.getInt("total", 0)
    val percent = if (total > 0) (collected.toDouble() / total.toDouble()) else 0.0

    appWidgetIds.forEach { widgetId ->
      val views = RemoteViews(context.packageName, R.layout.philatrail_widget).apply {
        setTextViewText(R.id.widget_count, collected.toString())
        setTextViewText(R.id.widget_caption, "of $total stamps")
        setProgressBar(R.id.widget_progress, 10000, (percent * 10000).toInt(), false)

        val pendingIntent = HomeWidgetLaunchIntent.getActivity(context, MainActivity::class.java)
        setOnClickPendingIntent(R.id.widget_root, pendingIntent)
      }
      appWidgetManager.updateAppWidget(widgetId, views)
    }
  }
}
