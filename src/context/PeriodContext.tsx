import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { getDatabase } from '../db/database';
import { PeriodRecord, getAllPeriodRecords, insertPeriodRecord, updatePeriodEndDate, deletePeriodRecord, clearAllPeriodRecords } from '../db/period-records';
import { parseDate, diffDays, addDays, formatDate } from '../utils/date';
import { DEFAULT_PERIOD_DAYS } from '../constants/phases';
import { findPrevMissingEndRecord, assertMinCycleDistance } from '../services/period-validation';

/** Debounce window for batch-operations — merges rapid refreshes */
const REFRESH_DEBOUNCE_MS = 300;

/**
 * 记录新周期时，上一个周期还没有设置结束日期。
 * 核心原则：已结束的周期不能被后续操作修改 —— 必须先补齐上个周期的结束日期，
 * 否则上个周期的经期天数会随全局平均（无 end_date 时按间隔 20% 估算）漂移。
 */
export class MissingEndDateError extends Error {
  /** 上一个周期（缺少结束日期）的开始日期 YYYY-MM-DD */
  prevStart: string;
  constructor(prevStart: string) {
    super(`上个周期（${prevStart}开始）还没有设置结束日期`);
    this.name = 'MissingEndDateError';
    this.prevStart = prevStart;
  }
}

interface PeriodCtx {
  records: PeriodRecord[];
  loading: boolean;
  error: string | null;
  addRecord: (startDate: string) => Promise<void>;
  /** 忽略提醒时使用：按默认天数补齐上个周期结束日期后，再记录新周期 */
  addRecordIgnoringMissingEnd: (startDate: string) => Promise<void>;
  removeRecord: (id: number) => Promise<void>;
  updateEndDate: (startDate: string, endDate: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<PeriodCtx>({} as PeriodCtx);
export const usePeriod = () => useContext(Ctx);

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<PeriodRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRefresh = useRef<() => Promise<void>>(() => Promise.resolve());
  // 最近一次渲染的 records 快照：乐观更新失败时用于回滚
  const recordsRef = useRef<PeriodRecord[]>([]);
  recordsRef.current = records;

  const doRefresh = useCallback(async () => {
    try {
      setError(null);
      const db = await getDatabase();
      const all = await getAllPeriodRecords(db);
      setRecords(all);
    } catch (e: any) {
      console.warn('PeriodContext.refresh failed:', e);
      setError(e?.message || '加载经期数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  /** Debounced refresh — merges rapid successive calls into a single DB query */
  const refresh = useCallback(async () => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    return new Promise<void>(resolve => {
      latestRefresh.current = async () => { await doRefresh(); resolve(); };
      refreshTimer.current = setTimeout(() => {
        refreshTimer.current = null;
        latestRefresh.current();
      }, REFRESH_DEBOUNCE_MS);
    });
  }, [doRefresh]);

  useEffect(() => { doRefresh(); }, [doRefresh]);

  const addRecord = useCallback(async (startDate: string) => {
    const db = await getDatabase();
    // 先做校验（快速、无副作用）；校验失败直接抛出，不修改 UI
    const all = await getAllPeriodRecords(db);
    const newDate = parseDate(startDate);
    assertMinCycleDistance(all, newDate);
    // 记录新周期前，检查是否还有未设置结束日期的历史周期。
    // 没有则提醒（MissingEndDateError → UI 弹窗）；用户忽略时走 addRecordIgnoringMissingEnd。
    const prev = findPrevMissingEndRecord(all, newDate);
    if (prev) {
      throw new MissingEndDateError(prev.start_date);
    }
    // —— 乐观更新：先改 UI，让点击立即反馈 ——
    const snapshot = recordsRef.current;
    setRecords(prevState => {
      if (prevState.some(r => r.start_date === startDate)) return prevState;
      return [...prevState, { id: -1, start_date: startDate, end_date: null, created_at: new Date().toISOString() }];
    });
    try {
      await insertPeriodRecord(db, startDate);
    } catch (e: any) {
      // 保存失败：回滚 UI 并提示
      setRecords(snapshot);
      const msg = e?.message || '';
      if (msg.includes('UNIQUE') || msg.includes('unique')) {
        // 兜底：DB 已存在该日期（罕见的外部写入），按“再点一次取消”语义删除
        const existing = (await getAllPeriodRecords(db)).find(r => r.start_date === startDate);
        if (existing) {
          await deletePeriodRecord(db, existing.id);
          setRecords(prevState => prevState.filter(r => r.start_date !== startDate));
        }
        return;
      }
      throw e;
    }
    // Debounced full refresh to sync IDs and re-schedule reminders
    refresh();
  }, [refresh]);

  /** 用户选择忽略"缺结束日期"提醒：按默认天数补齐该周期结束日期，再记录新周期。
   *  这样已结束的周期就被固定下来，不再受全局平均天数影响。 */
  const addRecordIgnoringMissingEnd = useCallback(async (startDate: string) => {
    const db = await getDatabase();
    const all = await getAllPeriodRecords(db);
    const newDate = parseDate(startDate);
    // 与 addRecord 共用同一间隔校验，防止绕过 21 天最短周期约束
    assertMinCycleDistance(all, newDate);
    const prev = findPrevMissingEndRecord(all, newDate);
    const endDate = prev ? formatDate(addDays(parseDate(prev.start_date), DEFAULT_PERIOD_DAYS - 1)) : null;
    // —— 乐观更新：补齐结束日期 + 添加新记录，一次生效 ——
    const snapshot = recordsRef.current;
    setRecords(prevState => {
      let next = prevState;
      if (prev) {
        next = next.map(r =>
          r.start_date === prev.start_date ? { ...r, end_date: endDate! } : r
        );
      }
      if (!next.some(r => r.start_date === startDate)) {
        next = [...next, { id: -1, start_date: startDate, end_date: null, created_at: new Date().toISOString() }];
      }
      return next;
    });
    try {
      if (prev) await updatePeriodEndDate(db, prev.start_date, endDate!);
      await insertPeriodRecord(db, startDate);
    } catch (e) {
      setRecords(snapshot); // 保存失败：回滚 UI
      refresh(); // 兜底：以 DB 真实状态为准（部分写入场景）
      throw e;
    }
    refresh();
  }, [refresh]);

  const removeRecord = useCallback(async (id: number) => {
    const db = await getDatabase();
    const snapshot = recordsRef.current;
    const target = snapshot.find(r => r.id === id);
    // —— 乐观更新：立即从 UI 移除 ——
    setRecords(prevState => prevState.filter(r => r.id !== id));
    try {
      if (id !== -1) {
        await deletePeriodRecord(db, id);
      } else if (target?.start_date) {
        // 乐观项（id=-1）可能尚未落库：按 start_date 找到真实记录后删除
        const all = await getAllPeriodRecords(db);
        const existing = all.find(r => r.start_date === target.start_date);
        if (existing) await deletePeriodRecord(db, existing.id);
      }
    } catch (e) {
      setRecords(snapshot); // 保存失败：回滚 UI
      throw e;
    }
    refresh();
  }, [refresh]);

  const updateEndDate = useCallback(async (startDate: string, endDate: string) => {
    const db = await getDatabase();
    const snapshot = recordsRef.current;
    // —— 乐观更新：立即更新 UI ——
    setRecords(prevState => prevState.map(r =>
      r.start_date === startDate ? { ...r, end_date: endDate } : r
    ));
    try {
      await updatePeriodEndDate(db, startDate, endDate);
    } catch (e) {
      setRecords(snapshot); // 保存失败：回滚 UI
      throw e;
    }
    refresh();
  }, [refresh]);

  const clearAll = useCallback(async () => {
    const db = await getDatabase();
    await clearAllPeriodRecords(db);
    await refresh();
  }, [refresh]);

  const value = useMemo(() => ({
    records, loading, error, addRecord, addRecordIgnoringMissingEnd, removeRecord, updateEndDate, clearAll, refresh
  }), [records, loading, error, addRecord, addRecordIgnoringMissingEnd, removeRecord, updateEndDate, clearAll, refresh]);

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
}
