import { PageHeader } from '../components/layout/Layout';
import { PerspectiveBar } from '../components/layout/PerspectiveBar';
import { Card } from '../components/ui/Card';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { Disclaimer } from '../components/ui/Disclaimer';
import { DilutionTrendChart } from '../components/charts/DilutionTrendChart';
import { useCapTable, type ShareholderForm, type RoundForm } from '../hooks/useCapTable';
import { formatWithCommas, num, pct, won, wonShort } from '../lib/format';
import { groupColors, groupLabels } from '../lib/groups';
import type { ShareholderGroup } from '../lib/captable/types';
import { usePerspective } from '../context/PerspectiveContext';

const groupOptions: { value: ShareholderGroup; label: string }[] = [
  { value: 'founder', label: '창업자' },
  { value: 'investor', label: '기존 투자자' },
  { value: 'optionPool', label: '옵션풀' },
];

function GroupBadge({ group }: { group: ShareholderGroup }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: `${groupColors[group]}1a`, color: groupColors[group] }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: groupColors[group] }} />
      {groupLabels[group]}
    </span>
  );
}

const cellInput =
  'tnum w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-right text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';
const textInput =
  'w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export function CapTablePage() {
  const {
    shareholders,
    rounds,
    addShareholder,
    removeShareholder,
    updateShareholder,
    addRound,
    removeRound,
    updateRound,
    simulation,
    error,
    chartData,
  } = useCapTable();
  const { isFounder } = usePerspective();

  const finalRound = simulation?.rounds[simulation.rounds.length - 1];
  const finalRows = finalRound?.rows ?? simulation?.initialRows ?? [];
  const finalTotal = finalRound?.totalShares ?? simulation?.initialTotalShares ?? 0;

  return (
    <div>
      <PageHeader
        title="캡테이블 & 희석 시뮬레이터"
        description="현재 주주 구성과 후속 라운드(신규 발행·옵션풀 확대·SAFE 전환)를 입력해 before/after 지분율과 희석 추이를 확인합니다."
      />
      <PerspectiveBar />

      {/* 입력 */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card
          title="현재 주주"
          actions={
            <button
              type="button"
              onClick={addShareholder}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              + 주주 추가
            </button>
          }
        >
          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_110px_120px_32px] gap-2 px-1 text-xs font-medium text-slate-400">
              <span>이름</span>
              <span className="text-right">주식수</span>
              <span>그룹</span>
              <span />
            </div>
            {shareholders.map((s: ShareholderForm) => (
              <div key={s.id} className="grid grid-cols-[1fr_110px_120px_32px] items-center gap-2">
                <input
                  className={textInput}
                  value={s.name}
                  placeholder="이름"
                  onChange={(e) => updateShareholder(s.id, { name: e.target.value })}
                />
                <input
                  className={cellInput}
                  inputMode="numeric"
                  value={s.shares}
                  placeholder="0"
                  onChange={(e) =>
                    updateShareholder(s.id, { shares: formatWithCommas(e.target.value) })
                  }
                />
                <select
                  className={textInput}
                  value={s.group}
                  onChange={(e) =>
                    updateShareholder(s.id, { group: e.target.value as ShareholderGroup })
                  }
                >
                  {groupOptions.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  aria-label="주주 삭제"
                  onClick={() => removeShareholder(s.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="후속 라운드"
          subtitle="순서대로 누적 적용됩니다"
          actions={
            <button
              type="button"
              onClick={addRound}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              + 라운드 추가
            </button>
          }
        >
          <div className="space-y-4">
            {rounds.map((r: RoundForm, idx) => (
              <div key={r.id} className="rounded-xl border border-slate-200 p-3">
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <input
                    className={`${textInput} max-w-[180px] font-semibold`}
                    value={r.name}
                    onChange={(e) => updateRound(r.id, { name: e.target.value })}
                  />
                  {rounds.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRound(r.id)}
                      className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      라운드 {idx + 1} 삭제
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="text-xs text-slate-500">
                    pre-money (₩)
                    <input
                      className={`${cellInput} mt-1`}
                      inputMode="numeric"
                      value={r.preMoney}
                      onChange={(e) =>
                        updateRound(r.id, { preMoney: formatWithCommas(e.target.value) })
                      }
                    />
                  </label>
                  <label className="text-xs text-slate-500">
                    신규 투자금 (₩)
                    <input
                      className={`${cellInput} mt-1`}
                      inputMode="numeric"
                      value={r.newMoney}
                      onChange={(e) =>
                        updateRound(r.id, { newMoney: formatWithCommas(e.target.value) })
                      }
                    />
                  </label>
                  <label className="text-xs text-slate-500">
                    옵션풀 목표 (%)
                    <input
                      className={`${cellInput} mt-1`}
                      inputMode="numeric"
                      value={r.poolPct}
                      placeholder="선택"
                      onChange={(e) => updateRound(r.id, { poolPct: e.target.value })}
                    />
                  </label>
                  <label className="text-xs text-slate-500">
                    SAFE 전환 주식수
                    <input
                      className={`${cellInput} mt-1`}
                      inputMode="numeric"
                      value={r.safeShares}
                      placeholder="선택 (모듈 A)"
                      onChange={(e) =>
                        updateRound(r.id, { safeShares: formatWithCommas(e.target.value) })
                      }
                    />
                  </label>
                </div>
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">옵션풀 확대 기준</span>
                  <SegmentedControl
                    size="sm"
                    ariaLabel="옵션풀 기준"
                    value={r.poolBasis}
                    onChange={(v) => updateRound(r.id, { poolBasis: v })}
                    segments={[
                      { value: 'pre', label: 'pre (창업자 희석)' },
                      { value: 'post', label: 'post (전원 희석)' },
                    ]}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 결과 */}
      <div className="mt-5 space-y-5">
        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {simulation && (
          <>
            <Card title="지분 희석 추이" subtitle="현재 → 라운드별 누적">
              <DilutionTrendChart data={chartData} />
            </Card>

            <Card title="라운드별 요약">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-slate-500">
                    <tr className="border-b border-slate-100">
                      <th className="px-3 py-2 text-left font-medium">라운드</th>
                      <th className="px-3 py-2 text-right font-medium">주당가격</th>
                      <th className="px-3 py-2 text-right font-medium">post-money</th>
                      <th className="px-3 py-2 text-right font-medium">신규 발행</th>
                      <th className="px-3 py-2 text-right font-medium">옵션풀 추가</th>
                      <th className="px-3 py-2 text-right font-medium">총 주식수</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {simulation.rounds.map((rd) => (
                      <tr key={rd.roundId}>
                        <td className="px-3 py-2 font-medium text-slate-800">{rd.roundName}</td>
                        <td className="tnum px-3 py-2 text-right text-slate-700">
                          {won(rd.pricePerShare)}
                        </td>
                        <td className="tnum px-3 py-2 text-right text-slate-700">
                          {wonShort(rd.postMoneyValuation)}
                        </td>
                        <td className="tnum px-3 py-2 text-right text-slate-700">
                          {num(rd.newInvestorShares)}
                        </td>
                        <td className="tnum px-3 py-2 text-right text-slate-700">
                          {rd.optionPoolAddedShares > 0 ? num(rd.optionPoolAddedShares) : '—'}
                        </td>
                        <td className="tnum px-3 py-2 text-right text-slate-700">
                          {num(rd.totalShares)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {simulation.rounds.some((r) => r.warnings.length > 0) && (
                <ul className="mt-3 space-y-1.5">
                  {simulation.rounds.flatMap((r) =>
                    r.warnings.map((w) => (
                      <li
                        key={`${r.roundId}-${w}`}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800"
                      >
                        [{r.roundName}] {w}
                      </li>
                    )),
                  )}
                </ul>
              )}
            </Card>

            <Card
              title="최종 캡테이블"
              subtitle={`총 ${num(finalTotal)}주 · ${isFounder ? '창업자 관점' : '투자자 관점'}`}
            >
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium">주주</th>
                      <th className="px-4 py-2.5 text-left font-medium">그룹</th>
                      <th className="px-4 py-2.5 text-right font-medium">주식수</th>
                      <th className="px-4 py-2.5 text-right font-medium">지분율</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {finalRows.map((row) => {
                      const emphasize =
                        (isFounder && row.group === 'founder') ||
                        (!isFounder && (row.group === 'newInvestor' || row.group === 'safe' || row.group === 'investor'));
                      return (
                        <tr key={row.id} className={emphasize ? 'bg-brand-50/40' : ''}>
                          <td className="px-4 py-2.5 text-slate-800">{row.name}</td>
                          <td className="px-4 py-2.5">
                            <GroupBadge group={row.group} />
                          </td>
                          <td className="tnum px-4 py-2.5 text-right text-slate-600">
                            {num(row.shares)}
                          </td>
                          <td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">
                            {pct(row.pct)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        <Disclaimer />
      </div>
    </div>
  );
}
