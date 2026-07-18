import { createContext, useContext, useState, ReactNode } from 'react';

interface PeriodData {
  lastPeriodStart: Date | null;
  cycleLength: number;
  periodLength: number;
}

interface PeriodContextType {
  periodData: PeriodData;
  setPeriodData: (data: PeriodData) => void;
}

const PeriodContext = createContext<PeriodContextType>({
  periodData: { lastPeriodStart: null, cycleLength: 28, periodLength: 5 },
  setPeriodData: () => {},
});

export function PeriodProvider({ children }: { children: ReactNode }) {
  const [periodData, setPeriodData] = useState<PeriodData>({
    lastPeriodStart: null,
    cycleLength: 28,
    periodLength: 5,
  });

  return (
    <PeriodContext.Provider value={{ periodData, setPeriodData }}>
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriod() {
  return useContext(PeriodContext);
}
