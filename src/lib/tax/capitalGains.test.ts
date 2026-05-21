import { describe, it, expect } from 'vitest';
import { capitalGainsTaxBeforeLocal, resolveCapitalGainsType } from './capitalGains';

describe('capitalGains — 주주 유형별 세율', () => {
  it('중소기업 소액주주는 10% 단일세율', () => {
    // (5억 − 250만) × 10% = 49,750,000
    const tax = capitalGainsTaxBeforeLocal(500_000_000, 'smbSmall');
    expect(tax).toBe((500_000_000 - 2_500_000) * 0.1);
  });

  it('대주주: 3억 이하 20%', () => {
    // 과세표준 = 2억 − 250만 = 197,500,000 → ×20% = 39,500,000
    const base = 200_000_000 - 2_500_000;
    const tax = capitalGainsTaxBeforeLocal(200_000_000, 'largeShareholder');
    expect(tax).toBe(base * 0.2);
  });

  it('대주주: 3억 초과분 25% (누진)', () => {
    // 과세표준 5억 → 5억×0.25 − 1,500만 = 110,000,000
    const gain = 500_000_000 + 2_500_000; // 기본공제 차감 후 과세표준 5억
    const tax = capitalGainsTaxBeforeLocal(gain, 'largeShareholder');
    expect(tax).toBe(500_000_000 * 0.25 - 15_000_000);
  });

  it('알 수 없는 유형은 기본 유형(소액주주)으로 처리', () => {
    expect(resolveCapitalGainsType('unknown').key).toBe('smbSmall');
    expect(resolveCapitalGainsType(undefined).key).toBe('smbSmall');
  });

  it('대주주 3억 경계에서 연속(20%→25% 전환)', () => {
    const gainAt300 = 300_000_000 + 2_500_000; // 과세표준 정확히 3억
    const tax = capitalGainsTaxBeforeLocal(gainAt300, 'largeShareholder');
    expect(tax).toBe(300_000_000 * 0.2); // 60,000,000
  });
});
