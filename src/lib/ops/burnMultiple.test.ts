import { describe, it, expect } from 'vitest';
import { calculateBurnMultiple } from './burnMultiple';

describe('calculateBurnMultiple', () => {
  it('번 멀티플 = 순소모 / 순신규ARR', () => {
    const r = calculateBurnMultiple({ netBurn: 1_000_000_000, netNewArr: 800_000_000 });
    expect(r.multiple).toBeCloseTo(1.25, 6);
    expect(r.rating).toBe('great');
  });

  it('< 1x 는 최상', () => {
    expect(calculateBurnMultiple({ netBurn: 5e8, netNewArr: 1e9 }).rating).toBe('amazing');
  });

  it('> 3x 는 위험', () => {
    expect(calculateBurnMultiple({ netBurn: 4e9, netNewArr: 1e9 }).rating).toBe('bad');
  });

  it('성장(ARR) 0 이하면 산정 불가(na)', () => {
    const r = calculateBurnMultiple({ netBurn: 1e9, netNewArr: 0 });
    expect(r.multiple).toBeNull();
    expect(r.rating).toBe('na');
  });

  it('흑자(순소모 0 이하)면 amazing', () => {
    expect(calculateBurnMultiple({ netBurn: -1, netNewArr: 1e9 }).rating).toBe('amazing');
  });
});
