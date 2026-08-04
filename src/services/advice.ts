import { Phase } from '../constants/phases';

// Lightweight weather subset for advice — avoids coupling to the full WeatherData type
interface WeatherForAdvice {
  temperature: number;
  weatherCode: number;
  condition: string;
  advice: string;
}

/**
 * 按阶段细化生活建议 —— 每条都针对该阶段生理特点给出可执行的具体动作：
 *  luteal（经期前）→ 营养补充、运动建议
 *  period（经期中）→ 饮食调理、疼痛管理
 *  follicular（经期后）→ 恢复运动、皮肤护理
 *  ovulation（排卵期）→ 身体变化提示
 */
const PHASE_WEATHER_ADVICE: Record<Phase, Record<string, string>> = {
  period: {
    cold: '经期前2天腹痛明显时用热水袋敷小腹（约40℃，每次15-20分钟），忌冰饮凉食；第3天后可改喝桂圆红枣茶暖身',
    hot: '经期注意补铁，多吃瘦肉、动物肝脏、菠菜；咖啡和浓茶少喝以免加重痛经，空调房里披件薄外套护住腹部',
    rain: '经期淋雨受凉易加重痛经，及时换干衣并泡热水脚（40℃水泡15分钟）；痛经时热敷小腹并轻揉三阴交',
    default: '经期第1-2天减少弯腰和负重，痛经明显可遵说明书服用布洛芬；饮食多补铁（红肉、菠菜），忌生冷辛辣，保证睡眠',
  },
  follicular: {
    cold: '经期刚结束别立刻剧烈运动，从快走或慢跑30分钟开始，运动前充分热身；天气转冷皮肤易干，保湿面霜安排上',
    hot: '卵泡期代谢快、皮肤吸收好，适合补水面膜和温和美白护理；运动可逐步加量，每周3-4次力量训练效果好',
    rain: '经期结束后一周是运动恢复黄金期，雨天改做室内瑜伽或普拉提；运动后及时清洁皮肤，防止闷痘',
    default: '经期结束后逐渐恢复运动（快走→慢跑→力量），别一下上强度；此时皮肤状态回升，做好清洁+保湿，多喝水',
  },
  ovulation: {
    cold: '排卵期基础体温会升高0.3-0.5℃，注意增减衣物别着凉；少数人排卵日小腹有轻微抽痛（排卵痛），属正常现象',
    hot: '排卵期体温偏高加上天气炎热容易疲劳，注意及时补水，穿透气衣物；白带变透明拉丝是正常排卵信号，不必担心',
    rain: '排卵期激素波动可能让情绪更敏感，雨天在家听听音乐放松；分泌物增多属正常，注意保持透气干爽',
    default: '排卵日体温略升、白带增多拉丝都是正常信号；少数人有轻微排卵痛，若剧痛持续请及时就医；这几天受孕概率最高',
  },
  luteal: {
    cold: '经期前一周多吃含镁食物（坚果、香蕉、深绿叶菜）缓解乳房胀痛，睡前泡脚助眠；注意保暖，受凉可能让经期推迟',
    hot: '经期前食欲容易增加，想吃甜食时用水果或酸奶替代；少盐少咖啡，减轻水肿和乳房胀痛',
    rain: '经期前情绪易烦躁（PMS），雨天更适合快走、瑜伽等温和运动；别憋着情绪，写写日记或找人聊聊',
    default: '经期前1周补充镁和维生素B6（坚果、香蕉、全谷物）缓解乳房胀痛与情绪波动；运动以快走、瑜伽等中低强度为主，别熬夜，给身体存够能量',
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
