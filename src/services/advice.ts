import { Phase } from '../constants/phases';

// Lightweight weather subset for advice — avoids coupling to the full WeatherData type
interface WeatherForAdvice {
  temperature: number;
  weatherCode: number;
  condition: string;
  advice: string;
}

const PHASE_WEATHER_ADVICE: Record<Phase, Record<string, string>> = {
  period: {
    cold: '经期注意腹部保暖，喝杯姜茶暖暖身子',
    hot: '经期避免贪凉，空调温度别太低',
    rain: '经期抵抗力较弱，淋雨后记得及时擦干换衣',
    default: '经期多休息，照顾好自己',
  },
  follicular: {
    cold: '天气转凉，运动前充分热身防止拉伤',
    hot: '卵泡期代谢旺盛，记得多喝水补充水分',
    rain: '雨天适合在家做瑜伽或拉伸，别让天气打断节奏',
    default: '卵泡期精力充沛，适合运动锻炼',
  },
  ovulation: {
    cold: '排卵日注意保暖，核心温度稳定更利于身体状态',
    hot: '排卵日体温略高，穿透气衣物保持舒适',
    rain: '排卵日状态正好，雨天可以试试室内有氧运动',
    default: '排卵日精力充沛，适合运动和处理重要事务',
  },
  luteal: {
    cold: '黄体期容易手脚冰凉，泡杯热饮暖暖身',
    hot: '黄体期避免暴晒，情绪容易受高温影响',
    rain: '黄体期情绪易波动，雨天听听音乐放松心情',
    default: '黄体期可能会有情绪波动，适当休息不是软弱',
  },
};

export function getLifeAdvice(phase: Phase, weather: WeatherForAdvice): { weatherAdvice: string; phaseAdvice: string } {
  const weatherTip = weather.advice;
  let phaseTip = PHASE_WEATHER_ADVICE[phase].default;

  if (weather.temperature < 10) {
    phaseTip = PHASE_WEATHER_ADVICE[phase].cold ?? phaseTip;
  } else if (weather.temperature > 32) {
    phaseTip = PHASE_WEATHER_ADVICE[phase].hot ?? phaseTip;
  } else if (weather.weatherCode >= 51 && weather.weatherCode <= 65) {
    phaseTip = PHASE_WEATHER_ADVICE[phase].rain ?? phaseTip;
  }

  return { weatherAdvice: weatherTip, phaseAdvice: phaseTip };
}
