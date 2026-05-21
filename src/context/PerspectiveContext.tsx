/**
 * ClearStake — 관점(창업자/투자자) 전역 상태
 *
 * 동일 데이터를 두 관점으로 보여주는 것이 이 도구의 정체성(기획서 §4.2).
 * 관점은 강조점만 바꾸며, 계산 자체는 동일하다.
 */

import { createContext, useContext, useState, type ReactNode } from 'react';

export type Perspective = 'founder' | 'investor';

interface PerspectiveContextValue {
  perspective: Perspective;
  setPerspective: (p: Perspective) => void;
  isFounder: boolean;
}

const PerspectiveContext = createContext<PerspectiveContextValue | null>(null);

export function PerspectiveProvider({ children }: { children: ReactNode }) {
  const [perspective, setPerspective] = useState<Perspective>('founder');
  return (
    <PerspectiveContext.Provider
      value={{ perspective, setPerspective, isFounder: perspective === 'founder' }}
    >
      {children}
    </PerspectiveContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePerspective(): PerspectiveContextValue {
  const ctx = useContext(PerspectiveContext);
  if (!ctx) throw new Error('usePerspective must be used within PerspectiveProvider');
  return ctx;
}
