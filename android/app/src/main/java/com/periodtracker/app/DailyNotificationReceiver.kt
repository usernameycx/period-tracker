package com.periodtracker.app

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.database.sqlite.SQLiteDatabase
import android.os.Build
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import java.io.BufferedReader
import java.io.File
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.util.*
import java.util.concurrent.TimeUnit
import kotlin.concurrent.thread

class DailyNotificationReceiver : BroadcastReceiver() {

    companion object {
        const val TAG = "DailyNotification"
        const val CHANNEL_ID = "daily"
        const val NOTIF_ID = 1001
        const val ACTION_FIRE = "com.periodtracker.app.DAILY_FIRE"
        const val PREFS_NAME = "daily_alarm_prefs"
        const val KEY_HOUR = "hour"
        const val KEY_MINUTE = "minute"
        const val KEY_CITY = "city"

        // Cycle constants — must match src/constants/phases.ts
        const val DEFAULT_PERIOD_DAYS = 7
        const val DEFAULT_CYCLE_DAYS = 28
        const val OVULATION_BEFORE_PERIOD = 14
        const val OVULATION_SPAN = 3

        fun scheduleAlarm(context: Context, hour: Int, minute: Int) {
            val alarmMgr = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(context, DailyNotificationReceiver::class.java).apply {
                action = ACTION_FIRE
            }
            val pending = PendingIntent.getBroadcast(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val calendar = Calendar.getInstance().apply {
                set(Calendar.HOUR_OF_DAY, hour)
                set(Calendar.MINUTE, minute)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
                // 60s grace: if we're within 60s past the target, still treat as today
                if (timeInMillis + 60_000 <= System.currentTimeMillis()) {
                    add(Calendar.DAY_OF_YEAR, 1)
                }
            }

            // Use setExactAndAllowWhileIdle — bypasses Doze on aggressive ROMs
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
                alarmMgr.canScheduleExactAlarms()) {
                alarmMgr.setExactAndAllowWhileIdle(
                    AlarmManager.RTC_WAKEUP,
                    calendar.timeInMillis,
                    pending
                )
                Log.d(TAG, "Alarm scheduled WHILE_IDLE for ${calendar.time}")
            } else {
                alarmMgr.set(
                    AlarmManager.RTC_WAKEUP,
                    calendar.timeInMillis,
                    pending
                )
                Log.d(TAG, "Alarm scheduled (best-effort) for ${calendar.time}")
            }
        }

        fun cancelAlarm(context: Context) {
            val alarmMgr = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
            val intent = Intent(context, DailyNotificationReceiver::class.java).apply {
                action = ACTION_FIRE
            }
            val pending = PendingIntent.getBroadcast(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            alarmMgr.cancel(pending)
            Log.d(TAG, "Alarm cancelled")
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == ACTION_FIRE ||
            intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val pending = goAsync()
            val wl = (context.getSystemService(Context.POWER_SERVICE) as PowerManager)
                .newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "FayeTide:DailyNotification")
            wl.acquire(30_000)
            thread {
                try {
                    if (intent.action == ACTION_FIRE) {
                        fireNotification(context)
                    } else {
                        scheduleNext(context)
                    }
                } finally {
                    pending.finish()
                    wl.release()
                }
            }
        }
    }

    private fun scheduleNext(context: Context) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val hour = prefs.getInt(KEY_HOUR, 8)
        val minute = prefs.getInt(KEY_MINUTE, 0)
        scheduleAlarm(context, hour, minute)
    }

    private fun fireNotification(context: Context) {
        try {
            // Prevent duplicate fires within 30s
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val lastFire = prefs.getLong("last_fire_time", 0)
            val now = System.currentTimeMillis()
            if (now - lastFire < 30_000) {
                Log.d(TAG, "Skipping duplicate fire within ${(now - lastFire)}ms")
                return
            }
            prefs.edit().putLong("last_fire_time", now).apply()

            val city = prefs.getString(KEY_CITY, "南昌") ?: "南昌"

            // 1. Read period records from expo-sqlite database
            val records = readPeriodRecords(context)
            if (records.isEmpty()) {
                showNotification(context, "🌸 FayeTide", "打开 App 录入你的经期记录吧")
                scheduleNext(context)
                return
            }

            // 2. Calculate current phase
            val today = Calendar.getInstance()
            val phaseInfo = calculatePhase(today, records)
            val phaseLabel = phaseLabels[phaseInfo.phase] ?: "未知"
            val title = "$phaseLabel · 第${phaseInfo.dayOffset}天"

            // 3. Fetch weather
            val weather = fetchWeather(city)

            // 4. Build notification body
            val body = buildBody(phaseInfo.phase, weather)

            // 5. Show notification
            showNotification(context, title, body)

            // 6. Re-schedule for tomorrow (setExact is one-shot)
            scheduleNext(context)

            Log.d(TAG, "Notification fired: $title — $body")
        } catch (e: Exception) {
            Log.e(TAG, "fireNotification failed", e)
        }
    }

    // ─── Phase calculation (ports src/services/prediction.ts) ───

    data class PhaseInfo(val phase: String, val dayOffset: Int)

    val phaseLabels = mapOf(
        "period" to "经期",
        "follicular" to "卵泡期",
        "ovulation" to "排卵期",
        "luteal" to "黄体期"
    )

    private fun readPeriodRecords(context: Context): List<Date> {
        // expo-sqlite SDK 57 stores dbs in files/SQLite, not databases/
        val sqliteDir = File(context.filesDir, "SQLite")
        val dbFile = File(sqliteDir, "period_tracker.db")
        if (!dbFile.exists()) {
            Log.d(TAG, "DB not found at ${dbFile.absolutePath}")
            return emptyList()
        }

        val db = SQLiteDatabase.openDatabase(
            dbFile.absolutePath, null, SQLiteDatabase.OPEN_READWRITE
        )
        val records = mutableListOf<Date>()
        val fmt = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        db.rawQuery("SELECT start_date FROM period_records ORDER BY start_date ASC", null).use { cursor ->
            while (cursor.moveToNext()) {
                try {
                    records.add(fmt.parse(cursor.getString(0))!!)
                } catch (_: Exception) {}
            }
        }
        db.close()
        return records
    }

    private fun calculatePhase(today: Calendar, records: List<Date>): PhaseInfo {
        if (records.isEmpty()) return PhaseInfo("follicular", 1)

        val lastStart = records.last()
        val cycleLength = if (records.size >= 2) {
            val prev = records[records.size - 2]
            val diff = (lastStart.time - prev.time) / TimeUnit.DAYS.toMillis(1)
            diff.coerceIn(21, 35).toInt()
        } else {
            DEFAULT_CYCLE_DAYS
        }
        val avgPeriodDays = DEFAULT_PERIOD_DAYS

        // predicted next start
        val nextStart = GregorianCalendar().apply {
            time = lastStart
            add(Calendar.DAY_OF_YEAR, cycleLength)
        }

        // previous cycle start = predicted next - cycleLength = lastStart
        val prevStart = GregorianCalendar().apply {
            time = nextStart.time
            add(Calendar.DAY_OF_YEAR, -cycleLength)
        }

        // day in current cycle (0-indexed)
        val dayInCycle = ((today.timeInMillis - prevStart.timeInMillis)
            / TimeUnit.DAYS.toMillis(1)).toInt()

        if (dayInCycle < 0) return PhaseInfo("follicular", 1)

        val phase = when {
            dayInCycle < avgPeriodDays -> "period"
            dayInCycle < cycleLength - OVULATION_BEFORE_PERIOD - OVULATION_SPAN / 2 -> "follicular"
            dayInCycle < cycleLength - OVULATION_BEFORE_PERIOD + OVULATION_SPAN / 2 -> "ovulation"
            else -> "luteal"
        }

        return PhaseInfo(phase, dayInCycle + 1)
    }

    // ─── Weather fetch ───

    data class WeatherInfo(val condition: String, val icon: String, val temperature: Double)

    private fun fetchWeather(city: String): WeatherInfo? {
        try {
            // Geocode city
            val geoUrl = "https://restapi.amap.com/v3/geocode/geo" +
                "?key=db1451c008d9d0615616b92b12622e65" +
                "&address=${java.net.URLEncoder.encode(city, "UTF-8")}"
            val geoJson = httpGet(geoUrl) ?: return null

            // Simple JSON parse for lon,lat
            val location = extractJsonString(geoJson, "location") ?: return null
            val parts = location.split(",")
            if (parts.size != 2) return null
            val lon = parts[0].trim()
            val lat = parts[1].trim()

            // Open-Meteo weather
            val weatherUrl = "https://api.open-meteo.com/v1/forecast" +
                "?latitude=$lat&longitude=$lon" +
                "&current=temperature_2m,weather_code&timezone=auto"
            val weatherJson = httpGet(weatherUrl) ?: return null

            val temp = extractJsonNumber(weatherJson, "temperature_2m")
            val code = extractJsonNumber(weatherJson, "weather_code")?.toInt() ?: 0

            val weatherAdvice = weatherCodes[code] ?: WeatherInfo("未知", "🌈", temp ?: 20.0)
            return WeatherInfo(weatherAdvice.condition, weatherAdvice.icon, temp ?: weatherAdvice.temperature)
        } catch (e: Exception) {
            Log.w(TAG, "Weather fetch failed", e)
            return null
        }
    }

    // Minimal JSON extraction (no Gson/Moshi to keep it simple)
    private fun httpGet(urlStr: String): String? {
        val url = URL(urlStr)
        val conn = url.openConnection() as HttpURLConnection
        conn.connectTimeout = 5000
        conn.readTimeout = 5000
        return try {
            BufferedReader(InputStreamReader(conn.inputStream)).readText()
        } finally {
            conn.disconnect()
        }
    }

    private fun extractJsonString(json: String, key: String): String? {
        val regex = "\"$key\"\\s*:\\s*\"([^\"]*)\"".toRegex()
        return regex.find(json)?.groupValues?.get(1)
    }

    private fun extractJsonNumber(json: String, key: String): Double? {
        val regex = "\"$key\"\\s*:\\s*(-?[\\d.]+)".toRegex()
        return regex.find(json)?.groupValues?.get(1)?.toDoubleOrNull()
    }

    // Weather code → advice (ports src/constants/weather-advice.ts)
    private val weatherCodes = mapOf(
        0 to WeatherInfo("晴朗", "☀️", 20.0),
        1 to WeatherInfo("大部晴朗", "🌤️", 20.0),
        2 to WeatherInfo("多云", "⛅", 20.0),
        3 to WeatherInfo("阴天", "☁️", 20.0),
        45 to WeatherInfo("有雾", "🌫️", 20.0),
        51 to WeatherInfo("小雨", "🌧️", 20.0),
        53 to WeatherInfo("中雨", "🌧️", 20.0),
        55 to WeatherInfo("大雨", "🌧️", 20.0),
        61 to WeatherInfo("阵雨", "🌦️", 20.0),
        63 to WeatherInfo("中雨", "🌧️", 20.0),
        65 to WeatherInfo("大雨", "🌧️", 20.0),
        71 to WeatherInfo("小雪", "❄️", 20.0),
        73 to WeatherInfo("中雪", "❄️", 20.0),
        75 to WeatherInfo("大雪", "❄️", 20.0),
        80 to WeatherInfo("阵雨", "🌦️", 20.0),
        95 to WeatherInfo("雷暴", "⛈️", 20.0)
    )

    // ─── Life advice (ports src/services/advice.ts) ───

    private val phaseAdvice = mapOf(
        "period" to mapOf(
            "cold" to "经期注意腹部保暖，喝杯姜茶暖暖身子",
            "hot" to "经期避免贪凉，空调温度别太低",
            "rain" to "经期抵抗力较弱，淋雨后记得及时擦干换衣",
            "default" to "经期多休息，照顾好自己"
        ),
        "follicular" to mapOf(
            "cold" to "天气转凉，运动前充分热身防止拉伤",
            "hot" to "卵泡期代谢旺盛，记得多喝水补充水分",
            "rain" to "雨天适合在家做瑜伽或拉伸，别让天气打断节奏",
            "default" to "卵泡期精力充沛，适合运动锻炼"
        ),
        "ovulation" to mapOf(
            "cold" to "排卵期注意保暖，核心温度稳定更利于身体状态",
            "hot" to "排卵期体温略高，穿透气衣物保持舒适",
            "rain" to "排卵期状态正好，雨天可以试试室内有氧运动",
            "default" to "排卵期精力充沛，适合运动和处理重要事务"
        ),
        "luteal" to mapOf(
            "cold" to "黄体期容易手脚冰凉，泡杯热饮暖暖身",
            "hot" to "黄体期避免暴晒，情绪容易受高温影响",
            "rain" to "黄体期情绪易波动，雨天听听音乐放松心情",
            "default" to "黄体期可能会有情绪波动，适当休息不是软弱"
        )
    )

    private fun getLifeAdvice(phase: String, weather: WeatherInfo?): String {
        val adviceMap = phaseAdvice[phase] ?: return "保持好心情"

        return when {
            weather != null && weather.temperature < 10 -> adviceMap["cold"] ?: adviceMap["default"]!!
            weather != null && weather.temperature > 32 -> adviceMap["hot"] ?: adviceMap["default"]!!
            weather != null && weather.condition.contains("雨") -> adviceMap["rain"] ?: adviceMap["default"]!!
            else -> adviceMap["default"]!!
        }
    }

    private fun buildBody(phase: String, weather: WeatherInfo?): String {
        val advice = getLifeAdvice(phase, weather)
        return if (weather != null) {
            "${weather.icon} ${weather.condition} ${weather.temperature.toInt()}° · $advice"
        } else {
            advice
        }
    }

    // ─── Notification display ───

    private fun showNotification(context: Context, title: String, body: String) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Create channel if not exists
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "每日播报",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                vibrationPattern = longArrayOf(0, 100, 50, 100)
                lightColor = 0xC2905A.toInt()
            }
            manager.createNotificationChannel(channel)
        }

        // Also create period channel for compatibility
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            manager.createNotificationChannel(
                NotificationChannel("period", "经期提醒", NotificationManager.IMPORTANCE_HIGH)
            )
        }

        val iconRes = context.resources.getIdentifier(
            "notification_icon", "drawable", context.packageName
        )

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(iconRes)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .build()

        manager.notify(NOTIF_ID, notification)
    }
}
