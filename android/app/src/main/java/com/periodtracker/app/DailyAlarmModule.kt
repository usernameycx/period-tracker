package com.periodtracker.app

import android.app.AlarmManager
import android.content.Intent
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class DailyAlarmModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "DailyAlarmModule"

    @ReactMethod
    fun schedule(hour: Int, minute: Int, city: String) {
        val ctx = reactApplicationContext
        val prefs = ctx.getSharedPreferences(
            DailyNotificationReceiver.PREFS_NAME, android.content.Context.MODE_PRIVATE
        )
        prefs.edit()
            .putInt(DailyNotificationReceiver.KEY_HOUR, hour)
            .putInt(DailyNotificationReceiver.KEY_MINUTE, minute)
            .putString(DailyNotificationReceiver.KEY_CITY, city)
            .apply()
        DailyNotificationReceiver.scheduleAlarm(ctx, hour, minute)
    }

    @ReactMethod
    fun cancel() {
        DailyNotificationReceiver.cancelAlarm(reactApplicationContext)
    }

    @ReactMethod
    fun hasExactAlarmPermission(promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            promise.resolve(true)
            return
        }
        val alarmMgr = reactApplicationContext.getSystemService(android.content.Context.ALARM_SERVICE) as AlarmManager
        promise.resolve(alarmMgr.canScheduleExactAlarms())
    }

    @ReactMethod
    fun requestExactAlarmPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                data = android.net.Uri.parse("package:${reactApplicationContext.packageName}")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            reactApplicationContext.startActivity(intent)
        }
    }
}
