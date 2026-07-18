import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getDatabase } from '../db/database';
import { PeriodRecord, getAllPeriodRecords, insertPeriodRecord, updatePeriodRecord, deletePeriodRecord } from '../db/period-records';

interface PeriodCtx {
  records: PeriodRecord[];
  loading: boolean;
  addRecord: (startDate: string, endDate: string) => Promise<void>;
  updateRecord: (id: number, startDate: string, endDate: string) => Promise<void>;
  removeRecord: (id: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<PeriodCtx>({} as PeriodCtx);
export const usePeriod = () => useContext(Ctx);

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<PeriodRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const db = await getDatabase();
    const all = await getAllPeriodRecords(db);
    setRecords(all);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const addRecord = async (startDate: string, endDate: string) => {
    const db = await getDatabase();
    await insertPeriodRecord(db, startDate, endDate);
    await refresh();
  };

  const updateRecord = async (id: number, startDate: string, endDate: string) => {
    const db = await getDatabase();
    await updatePeriodRecord(db, id, startDate, endDate);
    await refresh();
  };

  const removeRecord = async (id: number) => {
    const db = await getDatabase();
    await deletePeriodRecord(db, id);
    await refresh();
  };

  return (
    <Ctx.Provider value={{ records, loading, addRecord, updateRecord, removeRecord, refresh }}>
      {children}
    </Ctx.Provider>
  );
}
