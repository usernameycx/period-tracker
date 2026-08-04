import { NativeModules, Platform, PermissionsAndroid } from 'react-native';

export interface LocationResult {
  /** 定位到的城市名（已去掉“市”后缀，与手动输入格式一致） */
  city: string;
  latitude: number;
  longitude: number;
  district?: string;
}

const native = () => (NativeModules as any).AMapLocation as {
  requestLocation: () => Promise<LocationResult>;
  destroy: () => void;
} | null;

/** 定位是否可用：仅 Android 且高德原生模块已注册（iOS / 未构建原生模块时返回 false，调用方自动降级） */
export function isLocationAvailable(): boolean {
  return Platform.OS === 'android' && !!native();
}

/** 请求定位运行时权限（Android 6.0+）。拒绝时返回 false。 */
export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: '定位权限',
        message: 'FayeTide 需要获取您的位置，以自动显示当地天气。',
        buttonPositive: '允许',
        buttonNegative: '拒绝',
        buttonNeutral: '稍后再说',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

/**
 * 单次定位，返回城市 + 坐标。
 * 定位失败（无权限 / 网络 / SDK 错误）返回 null —— 调用方应保留最后一次正常天气数据。
 */
export async function getCurrentLocation(): Promise<LocationResult | null> {
  const module = native();
  if (!module) return null;
  try {
    const result = await module.requestLocation();
    if (!result || !result.city) return null;
    return result;
  } catch (e) {
    console.warn('getCurrentLocation failed:', e);
    return null;
  } finally {
    try { module.destroy(); } catch { /* ignore */ }
  }
}
