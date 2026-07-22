import { Solar, Lunar } from 'lunar-typescript';

export interface LunarData {
  /** e.g. "二〇二六" */
  yearChinese: string;
  /** e.g. "六" */
  monthChinese: string;
  /** e.g. "初六" */
  dayChinese: string;
  /** e.g. "丙午" */
  yearGanZhi: string;
  /** e.g. "乙未" */
  monthGanZhi: string;
  /** e.g. "甲午" */
  dayGanZhi: string;
  /** e.g. "马" */
  shengXiao: string;
  /** e.g. "小暑" or empty string */
  jieQi: string;
  /** Auspicious activities */
  yi: string[];
  /** Inauspicious activities */
  ji: string[];
  /** Full lunar date string e.g. "丙午年 六月 初六" */
  fullLunar: string;
}

export function getLunarData(date: Date): LunarData {
  try {
    const solar = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate());
    const lunar = solar.getLunar();
    return {
      yearChinese: lunar.getYearInChinese(),
      monthChinese: lunar.getMonthInChinese(),
      dayChinese: lunar.getDayInChinese(),
      yearGanZhi: lunar.getYearInGanZhi(),
      monthGanZhi: lunar.getMonthInGanZhi(),
      dayGanZhi: lunar.getDayInGanZhi(),
      shengXiao: lunar.getYearShengXiao(),
      jieQi: lunar.getJieQi() || '',
      yi: lunar.getDayYi(),
      ji: lunar.getDayJi(),
      fullLunar: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInChinese()}月 ${lunar.getDayInChinese()}`,
    };
  } catch {
    return { yearChinese: '', monthChinese: '', dayChinese: '', yearGanZhi: '', monthGanZhi: '', dayGanZhi: '', shengXiao: '', jieQi: '', yi: [], ji: [], fullLunar: '' };
  }
}
