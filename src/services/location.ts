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

/** 模块级 in-flight 互斥：启动定位与手动定位并发时共享同一次请求，避免原生单例互踩/误取消 */
let inFlightPromise: Promise<LocationResponse> | null = null;

/** 定位是否可用：仅 Android 且高德原生模块已注册（iOS / 未构建原生模块时返回 false，调用方自动降级） */
export function isLocationAvailable(): boolean {
  return Platform.OS === 'android' && !!native();
}

/** 请求定位运行时权限（Android 6.0+）。拒绝时返回 false。 */
export async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    // 加超时保护：Activity 未就绪时系统弹窗可能无法显示，避免请求永久挂起
    const granted = await Promise.race([
      PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: '定位权限',
          message: 'FayeTide 需要获取您的位置，以自动显示当地天气。',
          buttonPositive: '允许',
          buttonNegative: '拒绝',
          buttonNeutral: '稍后再说',
        }
      ),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('请求定位权限超时')), 8000)
      ),
    ]);
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (e) {
    console.warn('requestLocationPermission failed:', e);
    // 超时后复查一次：弹窗可能已延迟弹出并授权（“幽灵授权”场景），避免误报未授权
    try {
      return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    } catch {
      return false;
    }
  }
}

/**
 * 单次定位，返回城市 + 坐标。
 * 失败时返回 { result: null, error: 原因 } —— 调用方应保留最后一次正常天气数据。
 * 并发调用共享同一次请求（in-flight 互斥），避免与原生模块单例冲突。
 */
export function getCurrentLocation(): Promise<LocationResponse> {
  if (inFlightPromise) return inFlightPromise;
  inFlightPromise = doGetCurrentLocation().finally(() => {
    inFlightPromise = null;
  });
  return inFlightPromise;
}

async function doGetCurrentLocation(): Promise<LocationResponse> {
  const module = native();
  if (!module) return { result: null, error: '当前环境不支持定位（需 Android + 高德 SDK）' };
  try {
    const result = await module.requestLocation();
    if (!result || !result.city) {
      return { result: null, error: '定位结果无效' };
    }
    return { result, error: null };
  } catch (e: any) {
    const code = typeof e === 'object' && e?.code ? String(e.code) : '';
    const msg = typeof e === 'object' && e?.message ? String(e.message) : String(e);
    // 常见原因提示：key 绑定签名不匹配（本地 debug 包 vs EAS 正式包）
    const hint = /INVALID_USER_KEY|KEY|key/i.test(msg) && !/LOCATION_BUSY/i.test(code)
      ? '（高德 key 校验失败：请确认 key 已绑定当前安装包的签名 SHA1）'
      : '';
    console.warn('getCurrentLocation failed:', msg);
    return { result: null, error: `${msg}${hint}` };
  } finally {
    try { module.destroy(); } catch { /* ignore */ }
  }
}
