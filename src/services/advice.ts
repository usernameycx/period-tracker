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
 * 要求：不包含“第X天”“今天”等时间依赖词汇；每条 ≤20 字；拒绝“多休息”类废话。
 *   luteal（经期前）→ 营养补充、运动建议
 *   period（经期中）→ 饮食调理、疼痛管理
 *   follicular（经期后）→ 恢复运动、皮肤护理
 *   ovulation（排卵期）→ 身体变化提示
 */
const PHASE_ADVICE_POOL: Record<Phase, string[]> = {
  luteal: [
    '补镁和B6：坚果香蕉全谷物',
    '快走或瑜伽，中低强度为宜',
    '少盐少咖啡，减轻水肿胀痛',
    '睡前泡脚助眠，忌熬夜',
    '馋甜食时用水果酸奶替代',
  ],
  period: [
    '热敷小腹40℃一次一刻钟',
    '补铁：红肉菠菜动物肝脏',
    '忌生冷辛辣，喝温红糖姜茶',
    '痛经剧烈可遵医嘱服布洛芬',
    '勤换卫生用品保持干爽',
  ],
  follicular: [
    '从快走慢跑逐步恢复运动',
    '皮肤吸收好，做补水面膜',
    '每周三到四次力量训练为宜',
    '多喝水，保持皮肤清洁',
    '适量补充蛋白质与维生素',
  ],
  ovulation: [
    '白带拉丝属正常排卵信号',
    '体温略升，注意增减衣物',
    '轻微排卵痛一般无需处理',
    '激素波动易敏感，多放松',
    '此期受孕概率高，按需防护',
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
