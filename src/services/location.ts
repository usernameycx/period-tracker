import { NativeModules, Platform, PermissionsAndroid } from 'react-native';

export interface LocationResult {
  /** 定位到的城市名（已去掉“市”后缀，与手动输入格式一致） */
  city: string;
  latitude: number;
  longitude: number;
  district?: string;
}

export interface LocationResponse {
  /** 定位成功时为城市+坐标；失败为 null */
  result: LocationResult | null;
  /** 失败原因（含高德错误码/错误信息，便于诊断 key 绑定、权限等问题） */
  error: string | null;
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
 * 失败时返回 { result: null, error: 原因 } —— 调用方应保留最后一次正常天气数据。
 */
export async function getCurrentLocation(): Promise<LocationResponse> {
  const module = native();
  if (!module) return { result: null, error: '当前环境不支持定位（需 Android + 高德 SDK）' };
  try {
    const result = await module.requestLocation();
    if (!result || !result.city) {
      return { result: null, error: '定位结果无效' };
    }
    return { result, error: null };
  } catch (e: any) {
    const msg = typeof e === 'object' && e?.message ? String(e.message) : String(e);
    // 常见原因提示：key 绑定签名不匹配（本地 debug 包 vs EAS 正式包）
    const hint = /INVALID_USER_KEY|KEY|key/i.test(msg) && !/location_busy/i.test(msg)
      ? '（高德 key 校验失败：请确认 key 已绑定当前安装包的签名 SHA1）'
      : '';
    console.warn('getCurrentLocation failed:', msg);
    return { result: null, error: `${msg}${hint}` };
  } finally {
    try { module.destroy(); } catch { /* ignore */ }
  }
}
