import { Phase, PHASE_LABELS } from '../constants/phases';

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
    default: '卵泡期精力充沛，适合运动锻炼',
  },
  ovulation: {
    default: '排卵期精力充沛，适合运动和处理重要事务',
  },
  luteal: {
    default: '黄体期可能会有情绪波动，适当休息不是软弱',
  },
};

export function getLifeAdvice(phase: Phase, weather: WeatherForAdvice): string {
  let extra = '';

  if (weather.temperature < 10) {
    extra = PHASE_WEATHER_ADVICE[phase].cold ?? PHASE_WEATHER_ADVICE[phase].default;
  } else if (weather.temperature > 32) {
    extra = PHASE_WEATHER_ADVICE[phase].hot ?? PHASE_WEATHER_ADVICE[phase].default;
  } else if (weather.weatherCode >= 51 && weather.weatherCode <= 65) {
    extra = PHASE_WEATHER_ADVICE[phase].rain ?? PHASE_WEATHER_ADVICE[phase].default;
  } else {
    extra = PHASE_WEATHER_ADVICE[phase].default;
  }

  return `${PHASE_LABELS[phase]} · ${weather.condition}${weather.temperature}°\n${weather.advice}\n${extra}`;
}
