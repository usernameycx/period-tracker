import { Phase } from '../constants/phases';

interface Quote {
  text: string;
  emoji: string;
}

const PHASE_QUOTES: Record<Phase, Quote[]> = {
  period: [
    { text: '给自己泡杯热茶，好好休息吧', emoji: '🍵' },
    { text: '月经是身体的潮汐，倾听它的节奏', emoji: '🌊' },
    { text: '这几天多宠爱自己，你做得很棒', emoji: '💝' },
    { text: '温暖的小腹，柔软的心情', emoji: '🌙' },
    { text: '生理期是身体的自我清洁，放松就好', emoji: '🧘‍♀️' },
    { text: '允许自己慢下来，这不是偷懒', emoji: '🌸' },
    { text: '铁质和温暖是你现在最好的朋友', emoji: '🫖' },
    { text: '每一次经期都是身体在说：我很健康', emoji: '✨' },
    { text: '经期是身体送给自己的假日', emoji: '🎀' },
    { text: '拥抱你的脆弱，那也是力量的一部分', emoji: '🤗' },
    { text: '别忘了换卫生巾，照顾好自己', emoji: '💜' },
    { text: '暖暖的热水袋是经期最好的伴侣', emoji: '🔥' },
    { text: '经期不是弱点，是女性独有的韵律', emoji: '🎵' },
    { text: '适当的散步可以帮助缓解不适', emoji: '🚶‍♀️' },
    { text: '多吃含铁食物，给身体补充能量', emoji: '🥬' },
    { text: '今天不勉强自己，舒适最重要', emoji: '🛋️' },
  ],
  follicular: [
    { text: '新周期的开始，活力正在回升', emoji: '🌱' },
    { text: '现在适合开始新的计划与尝试', emoji: '🚀' },
    { text: '雌激素让你容光焕发，去展现自己吧', emoji: '💃' },
    { text: '这是属于你的春天，万物复苏', emoji: '🦋' },
    { text: '头脑清晰，适合学习新技能', emoji: '📚' },
    { text: '皮肤状态正佳，记得拍张美照', emoji: '📸' },
    { text: '身体充满能量，适合运动挑战', emoji: '🏃‍♀️' },
    { text: '创造力正在涌动，别浪费了灵感', emoji: '🎨' },
    { text: '卵泡期的你像初春的嫩芽，充满可能', emoji: '🌿' },
    { text: '精力充沛的日子，把待办清单清一清', emoji: '✅' },
    { text: '新陈代谢加速，健康饮食效果加倍', emoji: '🥗' },
    { text: '适合社交的日子，约朋友出来聊聊', emoji: '👯‍♀️' },
    { text: '这个阶段学习效率最高，抓紧充电', emoji: '💡' },
    { text: '肌肉恢复快，运动效果事半功倍', emoji: '🏋️‍♀️' },
    { text: '试着做一件一直想做但没开始的事', emoji: '🌟' },
    { text: '积极的心态是最好的化妆品', emoji: '💖' },
  ],
  ovulation: [
    { text: '你正在发光，自信是最美的东西', emoji: '✨' },
    { text: '沟通能力爆表，适合重要的谈话', emoji: '💬' },
    { text: '魅力值满格，去赴约吧', emoji: '🌹' },
    { text: '排卵日的你，由内而外散发光芒', emoji: '💫' },
    { text: '今天是社交的好日子，享受连接', emoji: '🤝' },
    { text: '身体的春天到了顶峰，享受这一刻', emoji: '🌺' },
    { text: '你比想象中更有力量', emoji: '🔥' },
    { text: '笑一个吧，今天的你格外好看', emoji: '😊' },
    { text: '大自然赋予你最强的吸引力，自信点', emoji: '💎' },
    { text: '适合表达自己，说出心里想说的话', emoji: '🎤' },
    { text: '排卵日是身体的绽放时刻', emoji: '💐' },
    { text: '你的笑容在这个阶段最有感染力', emoji: '😄' },
    { text: '创造力巅峰，把想法变成行动', emoji: '⚡' },
    { text: '最适合团队协作的日子，主动出击', emoji: '🤼‍♀️' },
    { text: '镜子里的自己今天特别美，多看两眼', emoji: '🪞' },
    { text: '大胆做梦，大胆行动，现在是最好的时机', emoji: '🌈' },
  ],
  luteal: [
    { text: '慢下来，给自己一些独处的时光', emoji: '🏡' },
    { text: '整理房间也是整理心情，试试看', emoji: '📦' },
    { text: '吃点喜欢的食物，心情会变好', emoji: '🍫' },
    { text: '这几天适合完成未了的事，然后休息', emoji: '📝' },
    { text: '接纳情绪的起伏，那只是荷尔蒙在跳舞', emoji: '🎭' },
    { text: '温暖的泡澡是最好的治愈', emoji: '🛁' },
    { text: '阅读一本好书，让心安静下来', emoji: '📖' },
    { text: '黄体期的你像秋天的果实，饱满而温柔', emoji: '🍂' },
    { text: '情绪敏感不是错，是你很细腻的证明', emoji: '💭' },
    { text: '减少咖啡因，让神经放松下来', emoji: '☕' },
    { text: '写写日记，把心里的东西倒出来', emoji: '✍️' },
    { text: '听从身体的需要，想休息就休息', emoji: '😴' },
    { text: '来杯热牛奶或花茶，温暖从舌尖到心底', emoji: '🫖' },
    { text: '不急着做决定，等几天再说不迟', emoji: '⏳' },
    { text: '做些温和的运动，瑜伽和散步都不错', emoji: '🧘' },
    { text: '每个人都有低潮，低潮过后就是涨潮', emoji: '🌊' },
  ],
};

/** Pick a daily quote by date + phase + optional seed (no time-of-day dependency — 每日一言只按生理期阶段). */
export function getDailyQuote(date: Date, phase: Phase, seed = 0): Quote {
  const quotes = PHASE_QUOTES[phase];
  // UTC-based day-of-year — timezone-independent, same as greeting
  const startOfYear = Date.UTC(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((date.getTime() - startOfYear) / (1000 * 60 * 60 * 24));
  const phases = ['period', 'follicular', 'ovulation', 'luteal'];
  // Seed independent from greeting: day + phase + refresh offset
  const idx = (dayOfYear * 3 + phases.indexOf(phase) * 7 + seed) % quotes.length;
  return quotes[idx];
}
