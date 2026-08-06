import { Phase } from '../constants/phases';
import { formatDate } from '../utils/date';

// Lightweight weather subset for advice — avoids coupling to the full WeatherData type
interface WeatherForAdvice {
  temperature: number;
  weatherCode: number;
  condition: string;
  advice: string;
}

/**
 * 按阶段建议池 —— 每阶段 5 条独立建议，每天按日期 seed 随机取一条。
 * 要求：不包含“第X天”“今天”等时间依赖词汇；每条 30 字左右；具体可执行。
 *   luteal（经期前）→ 营养补充、运动建议
 *   period（经期中）→ 饮食调理、疼痛管理
 *   follicular（经期后）→ 恢复运动、皮肤护理
 *   ovulation（排卵期）→ 身体变化提示
 */
const PHASE_ADVICE_POOL: Record<Phase, string[]> = {
  luteal: [
    '补镁和B6缓解乳房胀痛，多吃坚果、香蕉、深绿叶菜，睡前泡脚助眠',
    '经期前运动以快走、瑜伽等中低强度为宜，避免剧烈运动过度疲劳',
    '少盐少咖啡因能减轻水肿，馋甜食时用水果或酸奶代替更健康',
    '情绪波动是PMS正常反应，写写日记或找朋友聊聊释放压力',
    '注意腹部保暖，受凉可能推迟经期，出门随身带件外套备用',
  ],
  period: [
    '痛经明显时热敷小腹约40℃，每次15到20分钟，缓解效果显著',
    '经期补铁很关键，红肉、菠菜、动物肝脏轮着吃，忌生冷辛辣',
    '血量多时勤换卫生用品，保持干爽透气，有效预防感染',
    '痛经剧烈可遵医嘱服用布洛芬止痛，注意避免空腹服药',
    '多喝温热红糖姜茶或温水，减少咖啡浓茶对身体的刺激',
  ],
  follicular: [
    '从快走慢跑开始逐步恢复运动，每次30分钟左右，让身体适应',
    '卵泡期皮肤吸收力好，适合补水面膜与温和美白护理',
    '每周三到四次力量训练，配合蛋白质补充效果更佳',
    '多喝水促进代谢，运动后及时清洁皮肤，预防痘痘滋生',
    '睡足七到八小时，激素回升期精力充沛，适合安排重要事务',
  ],
  ovulation: [
    '白带增多变透明拉丝是正常排卵信号，无需担心紧张',
    '基础体温会升高0.3到0.5℃，注意及时增减衣物防着凉',
    '少数人排卵日小腹轻微抽痛属正常，剧痛持续需及时就医',
    '激素波动情绪易敏感，听音乐或散步能帮助放松心情',
    '此期受孕概率最高，无备孕计划记得做好防护措施',
  ],
};

/** 简单字符串哈希 → 稳定伪随机下标（同一天同一阶段显示同一条，避免闪烁） */
function seededIndex(seed: string, length: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return h % length;
}

export function getLifeAdvice(phase: Phase, weather: WeatherForAdvice, date?: Date): { weatherAdvice: string; phaseAdvice: string } {
  const pool = PHASE_ADVICE_POOL[phase];
  const dayKey = formatDate(date ?? new Date());
  const idx = seededIndex(`${dayKey}-${phase}`, pool.length);
  return {
    weatherAdvice: weather.advice,
    phaseAdvice: pool[idx],
  };
}
