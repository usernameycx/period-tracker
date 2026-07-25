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
    // === 经期 (7天覆盖) ===
    { phase: 'period', day_offset: 1, recommend: ['红糖姜茶', '热牛奶', '红枣桂圆汤', '小米粥'], avoid: ['冷饮', '冰镇水果', '酒精', '浓茶'] },
    { phase: 'period', day_offset: 2, recommend: ['菠菜猪肝汤', '水煮蛋', '红豆粥', '黑芝麻糊'], avoid: ['生冷沙拉', '咖啡', '油炸食品'] },
    { phase: 'period', day_offset: 3, recommend: ['牛肉炖胡萝卜', '黑木耳炒蛋', '山药排骨汤', '樱桃'], avoid: ['冰品', '碳酸饮料', '辛辣火锅'] },
    { phase: 'period', day_offset: 4, recommend: ['清蒸鲈鱼', '豆腐海带汤', '燕麦牛奶', '桂圆'], avoid: ['冷饮', '浓茶', '烧烤'] },
    { phase: 'period', day_offset: 5, recommend: ['鸡肉粥', '番茄炒蛋', '牛奶燕麦', '核桃'], avoid: ['生冷食物', '酒精', '辛辣'] },
    { phase: 'period', day_offset: 6, recommend: ['红枣枸杞鸡汤', '全麦面包', '酸奶', '香蕉'], avoid: ['冰品', '咖啡', '油炸食品'] },
    { phase: 'period', day_offset: 7, recommend: ['鸡蛋羹', '小米南瓜粥', '温豆浆', '苹果'], avoid: ['冷饮', '酒精', '浓茶'] },

    // === 卵泡期 (9天覆盖) ===
    { phase: 'follicular', day_offset: 1, recommend: ['黄豆浆', '全麦吐司', '蓝莓', '水煮蛋'], avoid: ['油炸食品', '高糖甜点'] },
    { phase: 'follicular', day_offset: 2, recommend: ['燕麦坚果粥', '鸡胸肉沙拉', '猕猴桃', '酸奶'], avoid: ['辛辣食物', '酒精'] },
    { phase: 'follicular', day_offset: 3, recommend: ['藜麦饭', '西兰花炒虾仁', '牛油果', '草莓'], avoid: ['油炸食品', '碳酸饮料'] },
    { phase: 'follicular', day_offset: 4, recommend: ['三文鱼', '菠菜拌芝麻', '杏仁', '酸奶'], avoid: ['高糖食物', '酒精'] },
    { phase: 'follicular', day_offset: 5, recommend: ['豆腐菌菇汤', '糙米饭', '蒸红薯', '奇异果'], avoid: ['油炸食品', '辛辣'] },
    { phase: 'follicular', day_offset: 6, recommend: ['芦笋虾仁', '杂粮饭', '番茄', '橙子'], avoid: ['高盐食物', '酒精'] },
    { phase: 'follicular', day_offset: 7, recommend: ['黑豆排骨汤', '炒鸡蛋', '蒸玉米', '葡萄'], avoid: ['高糖甜点', '油炸'] },
    { phase: 'follicular', day_offset: 8, recommend: ['鸡胸肉', '西兰花', '全麦面包', '苹果'], avoid: ['辛辣', '酒精'] },
    { phase: 'follicular', day_offset: 9, recommend: ['鱼肉豆腐', '菠菜', '燕麦粥', '香蕉'], avoid: ['油炸食品', '咖啡'] },

    // === 排卵日 (1天) ===
    { phase: 'ovulation', day_offset: 1, recommend: ['清蒸生蚝', '坚果拼盘', '深色绿叶菜', '蓝莓'], avoid: ['酒精', '过量咖啡', '辛辣油腻'] },

    // === 黄体期 (14天完整) ===
    { phase: 'luteal', day_offset: 1, recommend: ['香蕉燕麦粥', '南瓜子', '全麦面包', '热牛奶'], avoid: ['咖啡', '辛辣食物', '酒精'] },
    { phase: 'luteal', day_offset: 2, recommend: ['菠菜炒蛋', '核桃', '糙米饭', '鸡胸肉'], avoid: ['高盐零食', '酒精', '浓茶'] },
    { phase: 'luteal', day_offset: 3, recommend: ['黑巧克力', '杏仁', '希腊酸奶', '蓝莓'], avoid: ['咖啡', '油炸食品', '甜饮料'] },
    { phase: 'luteal', day_offset: 4, recommend: ['三文鱼', '牛油果沙拉', '杂粮饭', '花椰菜'], avoid: ['辛辣', '高糖甜点'] },
    { phase: 'luteal', day_offset: 5, recommend: ['烤鸡肉', '蒸红薯', '蒜蓉西兰花', '苹果'], avoid: ['酒精', '咖啡', '咸菜'] },
    { phase: 'luteal', day_offset: 6, recommend: ['豆腐海带汤', '水煮蛋', '猕猴桃', '燕麦'], avoid: ['高盐食物', '腌制品'] },
    { phase: 'luteal', day_offset: 7, recommend: ['清蒸鱼', '菠菜汤', '小米粥', '橙子'], avoid: ['咖啡', '辛辣', '油炸'] },
    { phase: 'luteal', day_offset: 8, recommend: ['红枣桂圆茶', '温豆浆', '蒸蛋羹', '樱桃'], avoid: ['酒精', '生冷食物', '冰饮'] },
    { phase: 'luteal', day_offset: 9, recommend: ['瘦肉粥', '黑木耳炒蛋', '红豆汤', '全麦饼'], avoid: ['咖啡', '油炸食品', '甜食'] },
    { phase: 'luteal', day_offset: 10, recommend: ['鸡蛋', '无糖豆浆', '全麦吐司', '草莓'], avoid: ['高糖食物', '辛辣', '酒精'] },
    { phase: 'luteal', day_offset: 11, recommend: ['热牛奶', '香蕉', '燕麦粥', '核桃仁'], avoid: ['咖啡', '浓茶', '辛辣'] },
    { phase: 'luteal', day_offset: 12, recommend: ['桂圆红枣汤', '蒸南瓜', '鸡蛋白', '苏打饼'], avoid: ['冷饮', '油炸', '咖啡'] },
    { phase: 'luteal', day_offset: 13, recommend: ['小米红枣粥', '温酸奶', '蒸山药', '苹果泥'], avoid: ['辛辣', '酒精', '冰品'] },
    { phase: 'luteal', day_offset: 14, recommend: ['姜枣茶', '全麦面包', '水煮蛋', '温热蜂蜜水'], avoid: ['生冷食物', '浓茶', '咖啡', '酒精'] },
  ];
}

export async function seedDietRules(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ cnt: number }>('SELECT COUNT(*) as cnt FROM diet_rules');
  if (row && row.cnt > 0) return;

  const data = buildDietData();
  await db.withTransactionAsync(async () => {
    for (const d of data) {
      await db.runAsync(
        'INSERT INTO diet_rules (phase, day_offset, recommend, avoid, is_builtin) VALUES (?, ?, ?, ?, 1)',
        [d.phase, d.day_offset, JSON.stringify(d.recommend), JSON.stringify(d.avoid)]
      );
    }
  });
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
  return { ...row, phase: row.phase as Phase, recommend: safeJsonParse(row.recommend), avoid: safeJsonParse(row.avoid) };
}

export async function getAllDietRules(db: SQLiteDatabase): Promise<DietRule[]> {
  const rows = await db.getAllAsync<DietRow>('SELECT * FROM diet_rules ORDER BY phase, day_offset');
  return rows.map(r => ({ ...r, phase: r.phase as Phase, recommend: safeJsonParse(r.recommend), avoid: safeJsonParse(r.avoid) }));
}

function safeJsonParse(raw: string): string[] {
  try { return JSON.parse(raw); } catch { return []; }
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
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM diet_rules');
    const data = buildDietData();
    for (const d of data) {
      await db.runAsync(
        'INSERT OR REPLACE INTO diet_rules (phase, day_offset, recommend, avoid, is_builtin) VALUES (?, ?, ?, ?, 1)',
        [d.phase, d.day_offset, JSON.stringify(d.recommend), JSON.stringify(d.avoid)]
      );
    }
  });
}
