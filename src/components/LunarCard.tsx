import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getLunarData, LunarData } from '../services/lunar';
import { LunarColors, Radius, Spacing, FontSize, Weight, } from '../constants/theme';
import PressableScale from './PressableScale';
import Icon from './Icon';

interface Props {
  date: Date;
}

export default function LunarCard({ date }: Props) {
  const lunar: LunarData = useMemo(() => getLunarData(date), [date]);
  const [showAllYi, setShowAllYi] = useState(false);
  const [showAllJi, setShowAllJi] = useState(false);

  const displayYi = showAllYi ? lunar.yi : lunar.yi.slice(0, 5);
  const displayJi = showAllJi ? lunar.ji : lunar.ji.slice(0, 5);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Icon name="calendar" size={16} color={LunarColors.text} />
        <Text style={styles.headerTitle}>今日黄历</Text>
        {lunar.jieQi ? (
          <View style={styles.jieQiBadge}>
            <Text style={styles.jieQiText}>{lunar.jieQi}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.dateRow}>
        <View style={styles.dateBlock}>
          <Text style={styles.lunarMonth}>{lunar.monthChinese}月</Text>
          <Text style={styles.lunarDay}>{lunar.dayChinese}</Text>
        </View>
        <View style={styles.dateDivider} />
        <View style={styles.ganzhiBlock}>
          <Text style={styles.ganzhiYear}>{lunar.yearGanZhi}年 · {lunar.shengXiao}年</Text>
          <Text style={styles.ganzhiDetail}>{lunar.monthGanZhi}月 · {lunar.dayGanZhi}日</Text>
        </View>
      </View>

      <View style={styles.yiJiRow}>
        <View style={styles.yiSection}>
          <View style={[styles.sectionLabel, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
            <Icon name="check" size={14} color={LunarColors.yiText} />
            <Text style={styles.yiLabel}>宜</Text>
          </View>
          <View style={styles.tagRow}>
            {displayYi.map((item, i) => (
              <View key={i} style={styles.yiTag}>
                <Text style={styles.yiTagText}>{item}</Text>
              </View>
            ))}
            {lunar.yi.length > 5 && (
              <PressableScale onPress={() => setShowAllYi(!showAllYi)}>
                <Text style={styles.moreBtn}>
                  {showAllYi ? '收起' : `+${lunar.yi.length - 5}`}
                </Text>
              </PressableScale>
            )}
          </View>
        </View>

        <View style={styles.jiSection}>
          <View style={[styles.sectionLabel, { flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
            <Icon name="close" size={14} color={LunarColors.jiText} />
            <Text style={styles.jiLabel}>忌</Text>
          </View>
          <View style={styles.tagRow}>
            {displayJi.map((item, i) => (
              <View key={i} style={styles.jiTag}>
                <Text style={styles.jiTagText}>{item}</Text>
              </View>
            ))}
            {lunar.ji.length > 5 && (
              <PressableScale onPress={() => setShowAllJi(!showAllJi)}>
                <Text style={styles.moreBtn}>
                  {showAllJi ? '收起' : `+${lunar.ji.length - 5}`}
                </Text>
              </PressableScale>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: LunarColors.bg, borderRadius: Radius.lg, padding: Spacing.lg,
    marginBottom: Spacing.cardGap, borderWidth: 1, borderColor: LunarColors.border,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md, gap: Spacing.sm },
  headerTitle: { fontSize: FontSize.base, fontWeight: Weight.bold, color: LunarColors.text, flex: 1 },
  jieQiBadge: {
    backgroundColor: LunarColors.jieQiBg, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: 3,
  },
  jieQiText: { color: LunarColors.jieQiText, fontSize: FontSize.xs, fontWeight: Weight.bold },

  dateRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md,
    backgroundColor: LunarColors.innerBg, borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, borderColor: LunarColors.innerBorder,
  },
  dateBlock: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.xs },
  lunarMonth: { fontSize: FontSize.base, color: LunarColors.text, fontWeight: Weight.medium },
  lunarDay: { fontSize: FontSize.xxl, fontWeight: Weight.extrabold, color: LunarColors.dayNumber },
  dateDivider: {
    width: 1, height: 36, backgroundColor: LunarColors.border,
    marginHorizontal: Spacing.md,
  },
  ganzhiBlock: { flex: 1 },
  ganzhiYear: { fontSize: FontSize.sm2, color: LunarColors.text, fontWeight: Weight.semibold },
  ganzhiDetail: { fontSize: FontSize.sm, color: LunarColors.textSecondary, marginTop: 2 },

  yiJiRow: { gap: Spacing.md },
  yiSection: {},
  jiSection: {},
  sectionLabel: { marginBottom: Spacing.xs },
  yiLabel: { fontSize: FontSize.sm, fontWeight: Weight.bold, color: LunarColors.yiText },
  jiLabel: { fontSize: FontSize.sm, fontWeight: Weight.bold, color: LunarColors.jiText },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, alignItems: 'center' },
  yiTag: {
    backgroundColor: LunarColors.yiBg, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderWidth: 1, borderColor: LunarColors.yiBorder,
  },
  yiTagText: { fontSize: FontSize.xs, color: LunarColors.yiText, fontWeight: Weight.medium },
  jiTag: {
    backgroundColor: LunarColors.jiBg, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderWidth: 1, borderColor: LunarColors.jiBorder,
  },
  jiTagText: { fontSize: FontSize.xs, color: LunarColors.jiText, fontWeight: Weight.medium },
  moreBtn: { fontSize: FontSize.xs, color: LunarColors.moreBtn, fontWeight: Weight.semibold, paddingHorizontal: Spacing.xs },
});
