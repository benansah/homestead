'use client';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import toast from 'react-hot-toast';

interface CompareContextType {
  ids: number[];
  toggle: (id: number, name?: string) => void;
  clear: () => void;
}

const CompareContext = createContext<CompareContextType>({
  ids: [], toggle: () => {}, clear: () => {},
});

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<number[]>([]);

  const toggle = useCallback((id: number, name?: string) => {
    setIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 3) {
        toast.error('Max 3 hostels at a time');
        return prev;
      }
      if (name) toast.success(`Added "${name}" to compare`);
      return [...prev, id];
    });
  }, []);

  const clear = useCallback(() => setIds([]), []);

  return (
    <CompareContext.Provider value={{ ids, toggle, clear }}>
      {children}
    </CompareContext.Provider>
  );
}

export const useCompare = () => useContext(CompareContext);
