type TimePeriod = 'morning' | 'afternoon' | 'evening';

interface GreetingData {
  emoji: string;
  text: string;
}

export interface Greeting extends GreetingData {
  period: TimePeriod;
}

const GREETINGS: Record<TimePeriod, GreetingData[]> = {
  morning: [
    { emoji: '🌸', text: '早安，今天也要好好爱自己' },
    { emoji: '☀️', text: '早上好，先喝杯温水再开始忙碌' },
    { emoji: '🌿', text: '新的一天，记录身体状态的好时机' },
    { emoji: '🍃', text: '早晨空气好，开窗透透气' },
    { emoji: '🌷', text: '早啊，昨晚睡得好吗' },
    { emoji: '🌻', text: '一杯温水唤醒身体，今天也要好好照顾自己' },
    { emoji: '✨', text: '新的一天，从记录开始' },
    { emoji: '🍵', text: '早晨来杯温热的，肚子会感谢你' },
    { emoji: '💛', text: '晨光正好，给自己一个舒展的早晨' },
  ],
  afternoon: [
    { emoji: '☀️', text: '午后记得喝水，别等渴了再喝' },
    { emoji: '🌤️', text: '下午了，站起来活动五分钟' },
    { emoji: '🍃', text: '给自己十分钟闭眼休息，不是偷懒' },
    { emoji: '💪', text: '今天的你已经做了很多了' },
    { emoji: '🎵', text: '放首歌，让下午的节奏慢一点' },
    { emoji: '🍰', text: '来点水果当下午加餐，比零食好' },
    { emoji: '💐', text: '记得站起来走动一下，久坐对身体不好' },
  ],
  evening: [
    { emoji: '🌙', text: '今天辛苦啦，早点休息' },
    { emoji: '✨', text: '泡泡脚放松一下，经期前后尤其有益' },
    { emoji: '🕯️', text: '把今天的事放下，明天再说' },
    { emoji: '🌛', text: '收起白天的忙碌，回到属于自己的小世界' },
    { emoji: '💤', text: '今晚早一点放下手机，让身体好好修复' },
    { emoji: '🛁', text: '洗个热水澡，经期快到了的话注意水温别太高' },
    { emoji: '🌟', text: '不管今天怎样，睡一觉就是新的一天' },
    { emoji: '🧸', text: '做完了今天的事，剩下的留给明天' },
  ],
};

const TIMEZONE = 'Asia/Shanghai';

/** Extract the local hour for a given timezone from a Date (UTC timestamp). */
function getHourInTimezone(date: Date, tz: string): number {
  const parts = Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: tz }).formatToParts(date);
  return parseInt(parts.find(p => p.type === 'hour')?.value ?? '0', 10);
}

/** Determine time period from hour (0-23). */
function classifyPeriod(hour: number): TimePeriod {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'evening';
}

export { classifyPeriod as getTimePeriod };

/** Pick a greeting using Asia/Shanghai time + optional seed so it changes across periods, days, and refresh cycles. */
export function getGreeting(date: Date, seed = 0): Greeting {
  const hour = getHourInTimezone(date, TIMEZONE);
  const period = classifyPeriod(hour);
  const pool = GREETINGS[period];
  // Combine day-of-year + period index + seed to vary across days, time periods, and refresh cycles
  const startOfYear = Date.UTC(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear) / (1000 * 60 * 60 * 24));
  const idx = (dayOfYear * 7 + ['morning', 'afternoon', 'evening'].indexOf(period) * 3 + seed) % pool.length;
  return { ...pool[idx], period };
}
