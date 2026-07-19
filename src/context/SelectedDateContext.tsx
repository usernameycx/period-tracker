import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface SelectedDateCtx {
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
}

const Ctx = createContext<SelectedDateCtx>({} as SelectedDateCtx);
export const useSelectedDate = () => useContext(Ctx);

export function SelectedDateProvider({ children }: { children: ReactNode }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  return (
    <Ctx.Provider value={{ selectedDate, setSelectedDate }}>
      {children}
    </Ctx.Provider>
  );
}
