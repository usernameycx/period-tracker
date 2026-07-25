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
        const val DEFAULT_PERIOD_DAYS = 5
        const val DEFAULT_CYCLE_DAYS = 28
        const val OVULATION_BEFORE_PERIOD = 14
        const val OVULATION_SPAN = 1

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

            // 4. Build notification body (phase-adaptive)
            val body = buildRichBody(phaseInfo.phase, phaseInfo.dayOffset, records, weather)

            // 5. Show notification (collapsed shows first line, expanded shows all)
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

    private fun readPeriodRecords(context: Context): List<Pair<Date, Date?>> {
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
        val records = mutableListOf<Pair<Date, Date?>>()
        val fmt = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        db.rawQuery("SELECT start_date, end_date FROM period_records ORDER BY start_date ASC", null).use { cursor ->
            while (cursor.moveToNext()) {
                try {
                    val start = fmt.parse(cursor.getString(0))!!
                    val end = if (cursor.isNull(1)) null else fmt.parse(cursor.getString(1))
                    records.add(Pair(start, end))
                } catch (_: Exception) {}
            }
        }
        db.close()
        return records
    }

    private fun calculatePhase(today: Calendar, records: List<Pair<Date, Date?>>): PhaseInfo {
        if (records.isEmpty()) return PhaseInfo("follicular", 1)

        // Extract start dates for cycle length calculation
        val starts = records.map { it.first }

        val lastStart = starts.last()
        val cycleLength = if (records.size >= 2) {
            val prev = starts[starts.size - 2]
            val diff = (lastStart.time - prev.time) / TimeUnit.DAYS.toMillis(1)
            diff.coerceIn(21, 35).toInt()
        } else {
            DEFAULT_CYCLE_DAYS
        }

        // Dynamic period days: average of historical end_dates
        val periodDays = computeAvgPeriodDays(records)

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
            dayInCycle < periodDays -> "period"
            dayInCycle < cycleLength - OVULATION_BEFORE_PERIOD - 1 -> "follicular"
            dayInCycle == cycleLength - OVULATION_BEFORE_PERIOD - 1 -> "ovulation"
            else -> "luteal"
        }

        val dayOffset = when (phase) {
            "period" -> dayInCycle + 1
            "follicular" -> dayInCycle - periodDays + 1
            "ovulation" -> 1
            "luteal" -> dayInCycle - (cycleLength - OVULATION_BEFORE_PERIOD) + 1
            else -> 1
        }

        return PhaseInfo(phase, dayOffset)
    }

    private fun computeAvgPeriodDays(records: List<Pair<Date, Date?>>): Int {
        val days = mutableListOf<Int>()
        for ((start, end) in records) {
            if (end != null) {
                val len = ((end.time - start.time) / TimeUnit.DAYS.toMillis(1)).toInt() + 1
                if (len in 1..10) days.add(len)
            }
        }
        if (days.isEmpty()) return DEFAULT_PERIOD_DAYS
        val avg = days.average().toInt()
        // Blend toward default when sparse
        val blend = kotlin.math.min(1.0, days.size / 3.0)
        return (avg * blend + DEFAULT_PERIOD_DAYS * (1 - blend)).toInt()
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
            "cold" to "注意腹部和腰部保暖，热敷可以缓解不适",
            "hot" to "经期避免空调直吹，少吃冷饮和冰镇水果",
            "rain" to "经期淋雨后及时擦干换衣，喝杯姜茶驱寒",
            "default" to "少碰冷水，多休息，照顾好自己"
        ),
        "follicular" to mapOf(
            "cold" to "天气冷运动前充分热身，防止肌肉拉伤",
            "hot" to "代谢旺盛易出汗，记得多喝温水补充水分",
            "rain" to "雨天适合在家做瑜伽或拉伸，别让天气打断节奏",
            "default" to "精力恢复期，适合开始新的运动计划"
        ),
        "ovulation" to mapOf(
            "cold" to "排卵期注意腹部保暖，核心温度稳定更利于身体状态",
            "hot" to "排卵期体温略高属正常，穿透气衣物保持舒适",
            "rain" to "状态正好，雨天可以试试室内有氧运动",
            "default" to "今天状态会比较好，适合安排重要事务"
        ),
        "luteal" to mapOf(
            "cold" to "黄体期容易手脚冰凉，泡杯热饮暖暖身，泡泡脚",
            "hot" to "黄体期情绪易受高温影响，避免暴晒和剧烈运动",
            "rain" to "雨天容易触发情绪波动，听听轻音乐放松",
            "default" to "减少咖啡因和甜食，睡眠充足情绪更稳定"
        )
    )

    private val dietTips = mapOf(
        "period" to "推荐红枣、姜茶、热牛奶，少吃冷饮、咖啡、辛辣",
        "follicular" to "多吃蛋白质和绿叶蔬菜，帮助身体恢复活力",
        "ovulation" to "多吃高纤维蔬菜和优质蛋白，保持身体轻盈",
        "luteal" to "多吃坚果、香蕉、深色巧克力，稳定情绪"
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

    /**
     * Build a rich notification body that adapts to the current cycle context.
     * Includes: weather + phase advice + period countdown / end-of-period / delayed / ovulation.
     */
    private fun buildRichBody(phase: String, dayOffset: Int, records: List<Pair<Date, Date?>>, weather: WeatherInfo?): String {
        val lines = mutableListOf<String>()

        // Primary: weather + phase advice
        val advice = getLifeAdvice(phase, weather)
        val primary = if (weather != null) {
            "${weather.condition} ${weather.temperature.toInt()}° · $advice"
        } else {
            advice
        }
        lines.add(primary)

        // Diet tip
        dietTips[phase]?.let { lines.add(it) }

        if (records.isEmpty()) return lines.joinToString("\n")

        // Calculate predictions for secondary alerts
        val starts = records.map { it.first }
        val lastStart = starts.last()
        val cycleLength = if (records.size >= 2) {
            val prev = starts[starts.size - 2]
            val diff = (lastStart.time - prev.time) / TimeUnit.DAYS.toMillis(1)
            diff.coerceIn(21, 35).toInt()
        } else {
            DEFAULT_CYCLE_DAYS
        }
        val periodDays = computeAvgPeriodDays(records)
        val today = Calendar.getInstance()

        val nextStart = GregorianCalendar().apply {
            time = lastStart
            add(Calendar.DAY_OF_YEAR, cycleLength)
        }
        val daysUntilNext = ((nextStart.timeInMillis - today.timeInMillis)
            / TimeUnit.DAYS.toMillis(1)).toInt()

        // A: 经期结束提醒 — predicted last day of period
        val periodEndDay = GregorianCalendar().apply {
            time = lastStart
            add(Calendar.DAY_OF_YEAR, periodDays - 1)
        }
        val daysUntilPeriodEnd = ((periodEndDay.timeInMillis - today.timeInMillis)
            / TimeUnit.DAYS.toMillis(1)).toInt()

        // B: 周期预提醒 — 3 days / 1 day before period
        // C: 月经推迟 — period was supposed to start today but no record
        val hasTodayRecord = records.any { (start, _) ->
            val fmt = SimpleDateFormat("yyyy-MM-dd", Locale.US)
            fmt.format(start.time) == fmt.format(today.time)
        }

        // Ovulation day
        val ovulationDay = GregorianCalendar().apply {
            time = nextStart.time
            add(Calendar.DAY_OF_YEAR, -OVULATION_BEFORE_PERIOD)
        }
        val daysUntilOvulation = ((ovulationDay.timeInMillis - today.timeInMillis)
            / TimeUnit.DAYS.toMillis(1)).toInt()

        // Collect secondary alerts (most important first)
        val alerts = mutableListOf<String>()

        when {
            // C: Period delayed — predicted start date has passed, no record today
            daysUntilNext < 0 && !hasTodayRecord && phase != "period" -> {
                alerts.add("经期推迟了${-daysUntilNext}天，避免生冷食物，少熬夜")
            }
            daysUntilNext == 0 && !hasTodayRecord && phase != "period" -> {
                alerts.add("今天经期该来了，备好卫生用品，别碰冷水")
            }
            // B: 1 day before
            daysUntilNext == 1 -> {
                alerts.add("明天可能是经期第一天，今天少喝咖啡浓茶")
            }
            // B: 2-3 days before
            daysUntilNext in 2..3 -> {
                alerts.add("距经期还有${daysUntilNext}天，可以准备些暖宝宝和红糖姜茶")
            }
        }

        // A: End of period (only show when in period and near the end)
        if (phase == "period" && dayOffset >= periodDays - 1) {
            alerts.add("经期快结束了，体力开始恢复，可以适当活动")
        }

        // Ovulation (only for non-period phases)
        if (phase != "period" && daysUntilOvulation == 0) {
            alerts.add("排卵期代谢旺盛，注意补水，适合运动和处理重要事务")
        }

        // Append alerts with emoji prefix
        for (alert in alerts) {
            lines.add(alert)
        }

        return lines.joinToString("\n")
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
