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
    { emoji: '☀️', text: '清晨的第一缕阳光，和新的一天一起醒来' },
    { emoji: '🌿', text: '新鲜的早晨，一切都是刚刚好的样子' },
    { emoji: '🍃', text: '在晨光里深呼吸，今天会是很棒的一天' },
    { emoji: '🌷', text: '早啊，喝杯温水唤醒身体的每个细胞' },
    { emoji: '🕊️', text: '让温柔的晨风带走昨日的疲惫，今天重新出发' },
    { emoji: '🌻', text: '像向日葵一样，迎着朝阳开启新的一天' },
    { emoji: '✨', text: '睁开眼睛的第一件事：对自己说声谢谢' },
    { emoji: '🍵', text: '早晨的仪式感，从一杯温热的水开始' },
    { emoji: '🎀', text: '你值得被温柔对待，从清晨的第一秒开始' },
    { emoji: '🌈', text: '每个早晨都是重启的机会，把握今天的色彩' },
    { emoji: '💛', text: '晨光正好，心情正好，一切都在变好的路上' },
  ],
  afternoon: [
    { emoji: '☀️', text: '午后时光，别忘了喝水休息一下' },
    { emoji: '🌤️', text: '阳光正暖，心情也要保持明亮噢' },
    { emoji: '🍃', text: '午后小憩，充充电继续前行' },
    { emoji: '💪', text: '下午的你也一样充满能量，加油' },
    { emoji: '🎵', text: '找个舒服的姿势，听首歌放松片刻' },
    { emoji: '🌺', text: '盛开的不只花朵，还有此刻闪闪发光的你' },
    { emoji: '📖', text: '下午适合慢下来，读几页喜欢的书' },
    { emoji: '🍰', text: '给自己来份下午茶，生活需要一点甜' },
    { emoji: '🦋', text: '下午的微风里藏着好运，仔细感受一下' },
    { emoji: '⭐', text: '你已经很棒了，下午继续冲冲冲' },
    { emoji: '🎐', text: '午后的安宁是属于你的专属时光' },
    { emoji: '💐', text: '把平凡的事做好就是不平凡，下午加油' },
  ],
  evening: [
    { emoji: '🌙', text: '月亮升起来了，今天辛苦啦' },
    { emoji: '✨', text: '卸下一天的疲惫，好好泡个脚吧' },
    { emoji: '🕯️', text: '夜晚是和自己对话的最好时光' },
    { emoji: '🌛', text: '收起白天的忙碌，回到属于自己的小世界' },
    { emoji: '💤', text: '早点休息，好的睡眠是最好的护肤品' },
    { emoji: '🛁', text: '洗个热水澡，把一天的烦恼都冲掉' },
    { emoji: '🌟', text: '无论今天如何，明天都还是全新的一天' },
    { emoji: '🏮', text: '为自己亮一盏温暖的灯，心安即是归处' },
    { emoji: '🎑', text: '月亮很亮，你也是。晚安前的温柔时刻' },
    { emoji: '💝', text: '睡前原谅所有的人和事，包括自己' },
    { emoji: '🌠', text: '许个小小的心愿，让星星帮你保管到明天' },
    { emoji: '🧸', text: '给自己一个大大的拥抱，今天你做得够好了' },
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
