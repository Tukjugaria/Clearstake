import { useMemo, useState } from 'react';
import { PageHeader } from '../components/layout/Layout';
import { PerspectiveBar } from '../components/layout/PerspectiveBar';
import { Card } from '../components/ui/Card';
import { NumberInput } from '../components/ui/NumberInput';
import { StatCard } from '../components/ui/StatCard';
import { Disclaimer } from '../components/ui/Disclaimer';
import {
  calculateFundMetrics,
  FundMetricsInputError,
  type FundMetricsResult,
  type DatedCashflow,
} from '../lib/fund/fundMetrics';
import { parseNum, formatWithCommas, won, wonShort, pct } from '../lib/format';

interface CfRow {
  id: string;
  date: string;
  type: 'call' | 'dist';
  amount: string;
}

let seq = 0;
const uid = () => `cf${seq++}`;
const today = new Date().toISOString().slice(0, 10);

const initialRows: CfRow[] = [
  { id: uid(), date: '2022-01-01', type: 'call', amount: '1,000,000,000' },
  { id: uid(), date: '2024-06-01', type: 'dist', amount: '600,000,000' },
];

const cellInput =
  'tnum w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-right text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';
const ctrl =
  'w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

const fmtMultiple = (v: number) => `${v.toFixed(2)}x`;

export function FundMetricsPage() {
  const [paidIn, setPaidIn] = useState('1,000,000,000');
  const [distributions, setDistributions] = useState('600,000,000');
  const [nav, setNav] = useState('900,000,000');
  const [rows, setRows] = useState<CfRow[]>(initialRows);
  const [valuationDate, setValuationDate] = useState(today);

  const update = (id: string, patch: Partial<CfRow>) =>
    setRows((p) => p.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const { result, error, isReady } = useMemo(() => {
    const pi = parseNum(paidIn);
    const di = parseNum(distributions);
    const nv = parseNum(nav);
    if (pi == null || di == null || nv == null) {
      return { result: null as FundMetricsResult | null, error: null, isReady: false };
    }
    const cashflows: DatedCashflow[] = rows
      .map((r) => {
        const amt = parseNum(r.amount);
        if (amt == null || amt <= 0 || !r.date) return null;
        return { date: r.date, amount: r.type === 'call' ? -amt : amt };
      })
      .filter((c): c is DatedCashflow => c !== null);
    try {
      const res = calculateFundMetrics({
        paidIn: pi,
        distributions: di,
        nav: nv,
        cashflows: cashflows.length ? cashflows : undefined,
        valuationDate,
      });
      return { result: res, error: null, isReady: true };
    } catch (e) {
      const msg = e instanceof FundMetricsInputError ? e.message : '계산 중 오류가 발생했습니다.';
      return { result: null, error: msg, isReady: true };
    }
  }, [paidIn, distributions, nav, rows, valuationDate]);

  return (
    <div>
      <PageHeader
        title="펀드 성과지표 (TVPI · DPI · RVPI · XIRR)"
        description="펀드/엔젤 포트폴리오의 납입·분배·잔여가치(NAV)로 배수 지표와 불규칙 현금흐름 IRR(XIRR)을 계산합니다."
      />
      <PerspectiveBar />

      <div className="grid gap-5 lg:grid-cols-[minmax(320px,440px)_1fr]">
        <div className="space-y-5">
          <Card title="배수 지표 입력">
            <div className="space-y-4">
              <NumberInput label="누적 납입원금 (Paid-in)" suffix="₩" value={paidIn} onChange={setPaidIn} />
              <NumberInput label="누적 분배 (Distributions)" suffix="₩" value={distributions} onChange={setDistributions} />
              <NumberInput label="현재 잔여가치 (NAV)" suffix="₩" value={nav} onChange={setNav} />
            </div>
          </Card>

          <Card
            title="XIRR용 현금흐름"
            subtitle="납입/분배 + 날짜 (NAV는 평가일에 자동 포함)"
            actions={
              <button
                type="button"
                onClick={() => setRows((p) => [...p, { id: uid(), date: today, type: 'dist', amount: '' }])}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                + 행
              </button>
            }
          >
            <div className="space-y-2">
              <div className="grid grid-cols-[100px_1fr_minmax(0,1fr)_28px] gap-2 px-1 text-xs font-medium text-slate-400">
                <span>구분</span>
                <span>날짜</span>
                <span className="text-right">금액</span>
                <span />
              </div>
              {rows.map((r) => (
                <div key={r.id} className="grid grid-cols-[100px_1fr_minmax(0,1fr)_28px] items-center gap-2">
                  <select className={ctrl} value={r.type} onChange={(e) => update(r.id, { type: e.target.value as CfRow['type'] })}>
                    <option value="call">납입</option>
                    <option value="dist">분배</option>
                  </select>
                  <input type="date" className={ctrl} value={r.date} onChange={(e) => update(r.id, { date: e.target.value })} />
                  <input className={cellInput} inputMode="numeric" value={r.amount} placeholder="0" onChange={(e) => update(r.id, { amount: formatWithCommas(e.target.value) })} />
                  <button type="button" aria-label="삭제" onClick={() => setRows((p) => p.filter((x) => x.id !== r.id))} className="flex h-8 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-red-600">×</button>
                </div>
              ))}
              <label className="mt-2 block text-xs text-slate-500">
                NAV 평가일
                <input type="date" className={`${ctrl} mt-1`} value={valuationDate} onChange={(e) => setValuationDate(e.target.value)} />
              </label>
            </div>
          </Card>
        </div>

        <Card title="결과">
          {!isReady && (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              납입원금·분배·NAV를 입력하세요.
            </div>
          )}
          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          {result && (
            <div className="space-y-5" aria-live="polite">
              <div className="grid gap-3 sm:grid-cols-2">
                <StatCard label="TVPI (총 배수)" value={fmtMultiple(result.tvpi)} sub={`총가치 ${wonShort(result.totalValue)}`} highlight />
                <StatCard label="XIRR (연환산)" value={result.xirr != null ? pct(result.xirr) : '—'} highlight />
                <StatCard label="DPI (실현 배수)" value={fmtMultiple(result.dpi)} sub="분배 / 납입" />
                <StatCard label="RVPI (미실현 배수)" value={fmtMultiple(result.rvpi)} sub="NAV / 납입" />
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className="px-4 py-2.5 text-slate-600">총가치 (분배 + NAV)</td><td className="tnum px-4 py-2.5 text-right font-semibold text-slate-900">{won(result.totalValue)}</td></tr>
                    <tr><td className="px-4 py-2.5 text-slate-600">TVPI = DPI + RVPI</td><td className="tnum px-4 py-2.5 text-right text-slate-700">{fmtMultiple(result.dpi)} + {fmtMultiple(result.rvpi)} = {fmtMultiple(result.tvpi)}</td></tr>
                  </tbody>
                </table>
              </div>

              {result.warnings.map((w) => (
                <p key={w} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{w}</p>
              ))}
              <p className="text-xs leading-relaxed text-slate-400">
                ※ DPI는 실제 분배(실현), RVPI는 평가가치(미실현)입니다. XIRR은 현금흐름 날짜·NAV 평가일을 반영한 연환산 수익률입니다.
              </p>
            </div>
          )}
          <div className="mt-5"><Disclaimer compact /></div>
        </Card>
      </div>
    </div>
  );
}
