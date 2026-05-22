/**
 * VCEquityNote — 모듈 C 단위테스트
 *
 * 기획서 수용 기준:
 *  - 부여/행사 연도에 따라 연간 비과세 한도(2억 vs 5천만)가 자동 분기된다
 *  - 누적 5억 한도 초과분이 정확히 과세대상으로 계산된다
 *  - 세제 수치가 전부 taxConfig에서 주입되며 코드에 하드코딩되지 않는다 (config 주입 검증)
 */

import { describe, it, expect } from 'vitest';
import { calculateStockOptionTax, StockOptionTaxInputError } from './stockOptionTax';
import type { StockOptionTaxInput } from './types';

const base: StockOptionTaxInput = {
  grantYear: 2022,
  exerciseYear: 2024,
  marketPrice: 50_000,
  exercisePrice: 10_000,
  shares: 10_000, // 행사이익 = 40,000 × 10,000 = 4억
  isVentureQualified: true,
};

describe('calculateStockOptionTax — 행사이익/비과세 한도 분기', () => {
  it('행사이익 = (시가 − 행사가) × 주식수', () => {
    const r = calculateStockOptionTax(base);
    expect(r.exerciseGain).toBe(4e8);
  });

  it('2023년 이후 행사 → 연간 비과세 한도 2억', () => {
    const r = calculateStockOptionTax({ ...base, exerciseYear: 2024 });
    expect(r.annualExemptionLimit).toBe(2e8);
    expect(r.exemptionApplied).toBe(2e8); // 4억 중 2억 비과세
    expect(r.taxableAmount).toBe(2e8); // 나머지 2억 과세
  });

  it('2023년 이전 행사 → 연간 비과세 한도 5천만', () => {
    const r = calculateStockOptionTax({ ...base, grantYear: 2020, exerciseYear: 2021 });
    expect(r.annualExemptionLimit).toBe(5e7);
    expect(r.exemptionApplied).toBe(5e7);
    expect(r.taxableAmount).toBe(3.5e8);
  });
});

describe('calculateStockOptionTax — 누적 5억 한도', () => {
  it('과거 누적 사용액이 많으면 잔여 한도까지만 비과세', () => {
    // 누적 4.5억 사용 → 잔여 5천만. 연간 2억보다 잔여가 작으므로 5천만만 비과세
    const r = calculateStockOptionTax({
      ...base,
      priorCumulativeExemptionUsed: 4.5e8,
    });
    expect(r.exemptionApplied).toBe(5e7);
    expect(r.taxableAmount).toBe(3.5e8); // 4억 − 5천만
  });

  it('누적 한도를 이미 소진했으면 비과세 0', () => {
    const r = calculateStockOptionTax({
      ...base,
      priorCumulativeExemptionUsed: 5e8,
    });
    expect(r.exemptionApplied).toBe(0);
    expect(r.taxableAmount).toBe(4e8);
    expect(r.cumulativeUsageRate).toBeCloseTo(1, 6);
  });
});

describe('calculateStockOptionTax — 벤처 요건/일몰', () => {
  it('벤처기업 미충족이면 비과세 0, 전액 과세', () => {
    const r = calculateStockOptionTax({ ...base, isVentureQualified: false });
    expect(r.exemptionApplied).toBe(0);
    expect(r.taxableAmount).toBe(4e8);
    expect(r.warnings.some((w) => w.includes('미충족'))).toBe(true);
  });

  it('일몰 이후 부여면 경고를 노출한다', () => {
    const r = calculateStockOptionTax({ ...base, grantYear: 2030, exerciseYear: 2031 });
    expect(r.warnings.some((w) => w.includes('일몰'))).toBe(true);
  });
});

describe('calculateStockOptionTax — config 주입(하드코딩 금지 검증)', () => {
  it('주입한 config의 한도가 그대로 사용된다', () => {
    const customConfig = {
      lastUpdated: 'test',
      stockOption: {
        annualExemptionByExerciseYear: [
          { fromYear: 2023, limit: 9e8 }, // 임의 한도 9억
          { fromYear: 0, limit: 1e8 },
        ],
        cumulativeExemptionCap: 1e10,
        sunsetGrantBefore: '2099-12-31',
        installmentYears: 3,
      },
      incomeTax: {
        brackets: [{ upTo: null, rate: 0.2, progressiveDeduction: 0 }],
        localSurtaxRate: 0,
      },
      capitalGains: {
        annualDeduction: 0,
        types: [{ key: 'smbSmall', label: '중소기업 소액주주', brackets: [{ upTo: null, rate: 0.1, progressiveDeduction: 0 }] }],
        defaultType: 'smbSmall',
      },
      sources: [],
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = calculateStockOptionTax(base, customConfig as any);
    expect(r.annualExemptionLimit).toBe(9e8);
    expect(r.exemptionApplied).toBe(4e8); // 행사이익 전액 < 9억 → 전액 비과세
    expect(r.taxableAmount).toBe(0);
    // 분할 시나리오 연차 수가 주입된 installmentYears(3)을 따른다
    const inst = r.scenarios.find((s) => s.key === 'laborInstallment')!;
    expect(inst.schedule).toHaveLength(3);
  });
});

describe('calculateStockOptionTax — 시나리오/분할', () => {
  it('분할납부 총액은 일시납부와 같고, 스케줄 합계가 일치한다', () => {
    const r = calculateStockOptionTax(base);
    const lump = r.scenarios.find((s) => s.key === 'laborLumpSum')!;
    const inst = r.scenarios.find((s) => s.key === 'laborInstallment')!;
    expect(inst.totalTax).toBe(lump.totalTax);
    const scheduleSum = inst.schedule!.reduce((a, b) => a + b.amount, 0);
    expect(scheduleSum).toBe(inst.totalTax);
  });

  it('세후 실수령 = 행사이익 − 총세액, 실효세율 일치', () => {
    const r = calculateStockOptionTax(base);
    for (const s of r.scenarios) {
      expect(s.netAfterTax).toBe(r.exerciseGain - s.totalTax);
      expect(s.effectiveTaxRate).toBeCloseTo(s.totalTax / r.exerciseGain, 10);
    }
  });

  it('추천 시나리오가 세후 실수령이 가장 크다', () => {
    const r = calculateStockOptionTax(base);
    const rec = r.scenarios.find((s) => s.key === r.recommendedKey)!;
    const maxNet = Math.max(...r.scenarios.map((s) => s.netAfterTax));
    expect(rec.netAfterTax).toBe(maxNet);
  });

  it('입력 검증: 행사 연도가 부여 연도보다 빠르면 에러', () => {
    expect(() =>
      calculateStockOptionTax({ ...base, grantYear: 2024, exerciseYear: 2022 }),
    ).toThrow(StockOptionTaxInputError);
  });
});
