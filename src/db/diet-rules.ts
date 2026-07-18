import { SQLiteDatabase } from 'expo-sqlite';
import { Phase } from '../constants/phases';

export interface DietRule {
  id: number;
  phase: Phase;
  day_offset: number;
  recommend: string[];
  avoid: string[];
  is_builtin: number;
}

interface DietRow {
  id: number;
  phase: string;
  day_offset: number;
  recommend: string;
  avoid: string;
  is_builtin: number;
}

function buildDietData(): { phase: Phase; day_offset: number; recommend: string[]; avoid: string[] }[] {
  return [
    // === 经期 (5天) ===
    { phase: 'period', day_offset: 1, recommend: ['红枣', '姜茶', '热牛奶', '红糖水'], avoid: ['冷饮', '辛辣', '咖啡', '酒精'] },
    { phase: 'period', day_offset: 2, recommend: ['菠菜', '鸡蛋', '红糖水', '桂圆'], avoid: ['生冷食物', '酒精', '油炸食品'] },
    { phase: 'period', day_offset: 3, recommend: ['动物肝脏', '黑木耳', '红豆', '牛肉'], avoid: ['冰品', '浓茶', '碳酸饮料'] },
    { phase: 'period', day_offset: 4, recommend: ['瘦肉', '豆腐', '海带', '樱桃'], avoid: ['冷饮', '辛辣', '咖啡'] },
    { phase: 'period', day_offset: 5, recommend: ['鱼肉', '鸡蛋', '菠菜', '黑芝麻'], avoid: ['生冷食物', '酒精'] },

    // === 卵泡期 (9天) ===
    { phase: 'follicular', day_offset: 1, recommend: ['黄豆', '豆浆', '全谷物', '西兰花'], avoid: ['油炸食品', '高糖食物'] },
    { phase: 'follicular', day_offset: 2, recommend: ['鸡蛋', '牛奶', '燕麦', '核桃'], avoid: ['辛辣', '酒精'] },
    { phase: 'follicular', day_offset: 3, recommend: ['鸡胸肉', '藜麦', '牛油果', '蓝莓'], avoid: ['油炸食品'] },
    { phase: 'follicular', day_offset: 4, recommend: ['三文鱼', '菠菜', '杏仁', '酸奶'], avoid: ['高糖食物', '酒精'] },
    { phase: 'follicular', day_offset: 5, recommend: ['豆腐', '菌菇', '红薯', '奇异果'], avoid: ['油炸食品'] },
    { phase: 'follicular', day_offset: 6, recommend: ['虾仁', '芦笋', '糙米', '草莓'], avoid: ['辛辣'] },
    { phase: 'follicular', day_offset: 7, recommend: ['鸡蛋', '黑豆', '番茄', '橙子'], avoid: ['高糖食物'] },
    { phase: 'follicular', day_offset: 8, recommend: ['鸡胸肉', '西兰花', '燕麦', '苹果'], avoid: ['油炸食品', '酒精'] },
    { phase: 'follicular', day_offset: 9, recommend: ['鱼肉', '菠菜', '全麦面包', '香蕉'], avoid: ['辛辣'] },

    // === 排卵期 (3天) ===
    { phase: 'ovulation', day_offset: 1, recommend: ['生蚝', '坚果', '深色蔬菜', '莓果'], avoid: ['酒精', '咖啡', '辛辣'] },
    { phase: 'ovulation', day_offset: 2, recommend: ['虾', '鸡蛋', '西兰花', '猕猴桃'], avoid: ['酒精', '油炸食品'] },
    { phase: 'ovulation', day_offset: 3, recommend: ['鱼肉', '豆浆', '番茄', '葡萄'], avoid: ['咖啡', '高糖食物'] },

    // === 黄体期 (11天) ===
    { phase: 'luteal', day_offset: 1, recommend: ['香蕉', '坚果', '全谷物', '热牛奶'], avoid: ['咖啡', '辛辣', '酒精'] },
    { phase: 'luteal', day_offset: 2, recommend: ['菠菜', '南瓜子', '燕麦', '鸡蛋'], avoid: ['高盐食物', '酒精'] },
    { phase: 'luteal', day_offset: 3, recommend: ['黑巧克力', '核桃', '酸奶', '蓝莓'], avoid: ['咖啡', '油炸食品'] },
    { phase: 'luteal', day_offset: 4, recommend: ['三文鱼', '牛油果', '糙米', '花椰菜'], avoid: ['辛辣', '高糖食物'] },
    { phase: 'luteal', day_offset: 5, recommend: ['鸡肉', '红薯', '西兰花', '苹果'], avoid: ['酒精', '咖啡'] },
    { phase: 'luteal', day_offset: 6, recommend: ['豆腐', '海带', '鸡蛋', '奇异果'], avoid: ['高盐食物'] },
    { phase: 'luteal', day_offset: 7, recommend: ['鱼肉', '菠菜', '小米粥', '橙子'], avoid: ['咖啡', '辛辣'] },
    { phase: 'luteal', day_offset: 8, recommend: ['红枣', '桂圆', '姜茶', '牛奶'], avoid: ['酒精', '生冷食物'] },
    { phase: 'luteal', day_offset: 9, recommend: ['瘦肉', '黑木耳', '红豆', '樱桃'], avoid: ['咖啡', '油炸食品'] },
    { phase: 'luteal', day_offset: 10, recommend: ['鸡蛋', '豆浆', '全麦面包', '草莓'], avoid: ['高糖食物'] },
    { phase: 'luteal', day_offset: 11, recommend: ['热牛奶', '香蕉', '燕麦', '坚果'], avoid: ['酒精', '辛辣', '咖啡'] },
  ];
}

export async function seedDietRules(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM diet_rules');
  if (row && row.cnt > 0) return;

  const data = buildDietData();
  for (const d of data) {
    await db.runAsync(
      'INSERT INTO diet_rules (phase, day_offset, recommend, avoid, is_builtin) VALUES (?, ?, ?, ?, 1)',
      [d.phase, d.day_offset, JSON.stringify(d.recommend), JSON.stringify(d.avoid)]
    );
  }
}

export async function getDietRules(
  db: SQLiteDatabase,
  phase: Phase,
  dayOffset: number
): Promise<DietRule | null> {
  const row = await db.getFirstAsync<DietRow>(
    'SELECT * FROM diet_rules WHERE phase = ? AND day_offset = ?',
    [phase, dayOffset]
  );
  if (!row) return null;
  return { ...row, phase: row.phase as Phase, recommend: JSON.parse(row.recommend), avoid: JSON.parse(row.avoid) };
}

export async function getAllDietRules(db: SQLiteDatabase): Promise<DietRule[]> {
  const rows = await db.getAllAsync<DietRow>('SELECT * FROM diet_rules ORDER BY phase, day_offset');
  return rows.map(r => ({ ...r, phase: r.phase as Phase, recommend: JSON.parse(r.recommend), avoid: JSON.parse(r.avoid) }));
}

export async function updateDietRule(
  db: SQLiteDatabase,
  id: number,
  recommend: string[],
  avoid: string[]
): Promise<void> {
  await db.runAsync(
    'UPDATE diet_rules SET recommend = ?, avoid = ?, is_builtin = 0 WHERE id = ?',
    [JSON.stringify(recommend), JSON.stringify(avoid), id]
  );
}

export async function resetDietRulesToDefault(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM diet_rules WHERE is_builtin = 0');
  const data = buildDietData();
  for (const d of data) {
    await db.runAsync(
      'INSERT OR REPLACE INTO diet_rules (phase, day_offset, recommend, avoid, is_builtin) VALUES (?, ?, ?, ?, 1)',
      [d.phase, d.day_offset, JSON.stringify(d.recommend), JSON.stringify(d.avoid)]
    );
  }
}
