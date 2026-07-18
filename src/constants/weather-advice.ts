// Open-Meteo weather codes → advice mapping
// https://open-meteo.com/en/docs#weathervariables
export interface WeatherAdvice {
  condition: string;
  advice: string;
  icon: string;
}

export const WEATHER_ADVICE: Record<number, WeatherAdvice> = {
  0: { condition: '晴朗', advice: '天气很好，适合出门散步晒太阳', icon: '☀️' },
  1: { condition: '大部晴朗', advice: '适合轻度户外活动', icon: '🌤️' },
  2: { condition: '多云', advice: '适合室内外活动，注意保暖', icon: '⛅' },
  3: { condition: '阴天', advice: '天气阴沉，适合室内瑜伽或拉伸', icon: '☁️' },
  45: { condition: '有雾', advice: '出行注意安全，避免户外剧烈运动', icon: '🌫️' },
  48: { condition: '雾凇', advice: '注意保暖，减少外出', icon: '🌫️' },
  51: { condition: '小雨', advice: '记得带伞，适合室内运动', icon: '🌧️' },
  53: { condition: '中雨', advice: '出门带伞，今天适合在家休息', icon: '🌧️' },
  55: { condition: '大雨', advice: '尽量避免外出，煮一壶热茶暖暖身', icon: '🌧️' },
  61: { condition: '阵雨', advice: '出门记得带伞', icon: '🌦️' },
  71: { condition: '小雪', advice: '注意保暖防滑', icon: '❄️' },
  73: { condition: '中雪', advice: '减少外出，注意腹部保暖', icon: '❄️' },
  95: { condition: '雷暴', advice: '避免外出，在家做舒缓拉伸', icon: '⛈️' },
};

export const UV_ADVICE: Record<number, string> = {
  0: '紫外线很弱，无需防护',
  1: '紫外线弱，短时间外出无需防护',
  3: '紫外线中等，建议涂抹防晒',
  6: '紫外线强，外出请做好防晒',
  8: '紫外线很强，尽量避免外出暴晒',
  11: '紫外线极强，尽量不要外出',
};

export function getWeatherAdvice(code: number): WeatherAdvice {
  return WEATHER_ADVICE[code] ?? { condition: '未知', advice: '保持好心情', icon: '🌈' };
}

export function getUVAdvice(index: number): string {
  const key = Object.keys(UV_ADVICE).map(Number).sort((a, b) => a - b).find(k => index <= k);
  return key !== undefined ? UV_ADVICE[key] : '注意防护';
}
