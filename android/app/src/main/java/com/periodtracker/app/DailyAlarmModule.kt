package com.periodtracker.app

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
}
