import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface SelectedDateCtx {
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
}

const Ctx = createContext<SelectedDateCtx>({} as SelectedDateCtx);
export const useSelectedDate = () => useContext(Ctx);

export function SelectedDateProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const value = useMemo(() => ({ selectedDate, setSelectedDate }), [selectedDate]);

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
}
