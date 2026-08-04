package com.periodtracker.app

import android.os.Handler
import android.os.Looper
import com.amap.api.location.AMapLocation
import com.amap.api.location.AMapLocationClient
import com.amap.api.location.AMapLocationClientOption
import com.amap.api.location.AMapLocationListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * 高德定位 JS↔Native 桥接。
 * 单次高精度定位 + 逆地理编码（返回城市名），供 JS 端自动切换天气地区。
 * 定位失败时以错误码 reject，JS 端保留最后一次正常天气数据。
 */
class AMapLocationModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), AMapLocationListener {

    override fun getName() = "AMapLocation"

    private var client: AMapLocationClient? = null
    private var pendingPromise: Promise? = null

    @ReactMethod
    fun requestLocation(promise: Promise) {
        if (pendingPromise != null) {
            promise.reject("LOCATION_BUSY", "定位请求进行中，请稍后再试")
            return
        }
        pendingPromise = promise
        // 高德 SDK 要求在主线程初始化 AMapLocationClient
        Handler(Looper.getMainLooper()).post {
            try {
                val ctx = reactApplicationContext
                val c = AMapLocationClient(ctx)
                client = c
                c.setLocationListener(this)
                val option = AMapLocationClientOption().apply {
                    locationMode = AMapLocationClientOption.AMapLocationMode.Hight_Accuracy
                    isOnceLocation = true // 单次定位
                    isNeedAddress = true // 逆地理编码，返回城市信息
                    httpTimeOut = 10000
                }
                c.setLocationOption(option)
                c.startLocation()
            } catch (e: Exception) {
                fail("LOCATION_INIT_FAILED", "定位初始化失败：${e.message}")
            }
        }
    }

    @ReactMethod
    fun destroy() {
        fail("LOCATION_CANCELLED", "定位已取消") // reject 挂起的 promise，避免 JS 端永久 loading
        client?.stopLocation()
        client?.onDestroy()
        client = null
    }

    // RN 实例销毁（热重载/退出）时兜底清理，避免 client 泄漏、promise 永不 settle
    override fun onCatalystInstanceDestroy() {
        fail("LOCATION_CANCELLED", "定位已取消")
        client?.stopLocation()
        client?.onDestroy()
        client = null
        super.onCatalystInstanceDestroy()
    }

    override fun onLocationChanged(location: AMapLocation?) {
        val promise = pendingPromise ?: return
        if (location == null) {
            fail("LOCATION_NULL", "定位失败：无定位结果")
            return
        }
        if (location.errorCode != 0) {
            fail("LOCATION_ERROR_${location.errorCode}", "定位失败：${location.errorInfo}（错误码 ${location.errorCode}）")
            return
        }
        pendingPromise = null
        val cityRaw = location.city ?: location.province ?: ""
        // 只去掉最常见的"市"后缀，与手动输入城市名格式保持一致（如"南昌市"→"南昌"）。
        // 自治州等地名（如"延边朝鲜族自治州"）保留原名，高德 geocode 仍可识别。
        val cityName = cityRaw.removeSuffix("市").ifBlank { "南昌" }
        val result = Arguments.createMap().apply {
            putString("city", cityName)
            putDouble("latitude", location.latitude)
            putDouble("longitude", location.longitude)
            putString("district", location.district ?: "")
        }
        promise.resolve(result)
        client?.stopLocation()
    }

    private fun fail(code: String, message: String) {
        val promise = pendingPromise ?: return
        pendingPromise = null
        promise.reject(code, message)
    }
}
