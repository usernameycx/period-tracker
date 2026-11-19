import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Modal, SectionList, Dimensions } from 'react-native';
import { Colors, Spacing, FontSize, Radius, Shadow, Weight, LineHeight } from '../constants/theme';
import PressableScale from './PressableScale';
import Icon from './Icon';
import type { IconName } from './Icon';

/** 列表可视高度：屏幕的 52%，约 7 行 —— 条目多时也能一屏看个大概 */
const LIST_MAX_HEIGHT = Math.round(Dimensions.get('window').height * 0.52);

export interface OptionItem {
  key: string;
  title: string;
  subtitle?: string;
  icon?: IconName;
  /** 危险项（例如"全部删除"），用 danger 配色区分 */
  danger?: boolean;
  /** 分组标题（例：2026年11月）；同一分组需连续排列 */
  section?: string;
}

interface Props {
  visible: boolean;
  title: string;
  hint?: string;
  options: OptionItem[];
  actionLabel: string;
  emptyText?: string;
  icon?: IconName;
  onCancel: () => void;
  onConfirm: (key: string) => void;
}

/**
 * 单选列表弹窗 —— 用于"按周期删除经期记录""按日期删除症状记录"等场景。
 * 视觉与 ConfirmModal 保持一致：白卡 + 主色圆角按钮 + 阴影。
 */
export default function OptionListModal({
  visible, title, hint, options, actionLabel, emptyText, icon,
  onCancel, onConfirm,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  // 每次打开重置选择，避免沿用上一次的选中项
  useEffect(() => {
    if (visible) setSelected(null);
  }, [visible]);

  const hasOptions = options.length > 0;
  /** 条目较多时给弹窗固定高度，让列表占满中间区域（否则会缩成三行的小窗） */
  const tall = options.length > 4;

  /** 按 section 把扁平选项聚成分组（不能假定外部已经分好） */
  const sections = useMemo(() => {
    const out: { title: string; data: OptionItem[] }[] = [];
    for (const opt of options) {
      const title = opt.section ?? '';
      const last = out[out.length - 1];
      if (last && last.title === title) last.data.push(opt);
      else out.push({ title, data: [opt] });
    }
    return out;
  }, [options]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={[styles.card, tall && styles.cardTall]}>
          <View style={styles.header}>
            {icon && (
              <View style={styles.iconWrap}>
                <Icon name={icon} size={22} color={Colors.primary} />
              </View>
            )}
            <View style={styles.headerText}>
              <Text style={styles.title}>{title}</Text>
              {!!hint && <Text style={styles.hint}>{hint}</Text>}
            </View>
          </View>

          {hasOptions ? (
            <SectionList
              sections={sections}
              keyExtractor={item => item.key}
              style={[styles.list, tall ? styles.listTall : styles.listCompact]}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              stickySectionHeadersEnabled={false}
              nestedScrollEnabled
              renderSectionHeader={({ section }) => section.title ? (
                <Text style={styles.sectionTitle}>{section.title}</Text>
              ) : null}
              renderItem={({ item: opt }) => {
                const active = selected === opt.key;
                return (
                  <PressableScale
                    style={[styles.row, active && styles.rowActive]}
                    onPress={() => setSelected(opt.key)}
                    accessibilityRole="button"
                    accessibilityLabel={opt.title}
                  >
                    {opt.icon && (
                      <View style={[styles.rowIcon, opt.danger && styles.rowIconDanger]}>
                        <Icon name={opt.icon} size={16} color={opt.danger ? Colors.danger : Colors.primary} />
                      </View>
                    )}
                    <View style={styles.rowText}>
                      <Text
                        style={[styles.rowTitle, opt.danger && styles.rowTitleDanger]}
                        numberOfLines={1}
                      >
                        {opt.title}
                      </Text>
                      {!!opt.subtitle && <Text style={styles.rowSubtitle}>{opt.subtitle}</Text>}
                    </View>
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active && <Icon name="check" size={12} color={Colors.white} />}
                    </View>
                  </PressableScale>
                );
              }}
            />
          ) : (
            <View style={styles.emptyWrap}>
              <Icon name="info" size={20} color={Colors.textHint} />
              <Text style={styles.emptyText}>{emptyText ?? '暂无可删除的记录'}</Text>
            </View>
          )}

          <View style={styles.btnRow}>
            <PressableScale style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>取消</Text>
            </PressableScale>
            <PressableScale
              style={[styles.actionBtn, !selected && styles.actionBtnDisabled]}
              disabled={!selected}
              onPress={() => selected && onConfirm(selected)}
            >
              <Text style={styles.actionText}>{actionLabel}</Text>
            </PressableScale>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  card: {
    backgroundColor: Colors.cardBg, borderRadius: Radius.xxl,
    padding: Spacing.xl, width: '100%', maxWidth: 360, maxHeight: '85%',
    ...Shadow.prominent,
  },
  cardTall: { height: '82%' },

  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  iconWrap: {
    width: 40, height: 40, borderRadius: Radius.md,
    backgroundColor: Colors.primaryBg, alignItems: 'center', justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: { fontSize: FontSize.lg, fontWeight: Weight.extrabold, color: Colors.text },
  hint: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 2, lineHeight: LineHeight.sm },

  list: {},
  listTall: { flexGrow: 1, flexShrink: 1 },
  listCompact: { flexGrow: 0, maxHeight: LIST_MAX_HEIGHT },
  listContent: { gap: Spacing.xs, paddingVertical: 2 },
  sectionTitle: {
    fontSize: FontSize.xs, fontWeight: Weight.bold, color: Colors.textMuted,
    marginTop: Spacing.xs, marginBottom: 2, marginLeft: Spacing.xs,
  },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surfaceMuted, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: 'transparent',
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
  },
  rowActive: { backgroundColor: Colors.primaryBg, borderColor: Colors.primary },
  rowIcon: {
    width: 30, height: 30, borderRadius: Radius.sm,
    backgroundColor: Colors.cardBg, alignItems: 'center', justifyContent: 'center',
  },
  rowIconDanger: { backgroundColor: Colors.dangerBg },
  rowText: { flex: 1 },
  rowTitle: { fontSize: FontSize.md, fontWeight: Weight.semibold, color: Colors.text },
  rowTitleDanger: { color: Colors.danger },
  rowSubtitle: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },

  emptyWrap: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xxl },
  emptyText: { fontSize: FontSize.sm2, color: Colors.textMuted },

  btnRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  cancelBtn: {
    flex: 1, backgroundColor: Colors.inkBg, borderRadius: Radius.md,
    paddingVertical: Spacing.md, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.divider,
  },
  cancelText: { fontSize: FontSize.md, color: Colors.textSecondary, fontWeight: Weight.medium },
  actionBtn: {
    flex: 1, backgroundColor: Colors.danger, borderRadius: Radius.md,
    paddingVertical: Spacing.md, alignItems: 'center', ...Shadow.raised,
  },
  actionBtnDisabled: { backgroundColor: Colors.primaryLight, shadowOpacity: 0, elevation: 0 },
  actionText: { fontSize: FontSize.md, color: Colors.white, fontWeight: Weight.bold },
});
