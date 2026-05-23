import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { Seo } from './components/Seo';
import { HomePage } from './pages/HomePage';

const SafePage = lazy(() => import('./pages/SafePage').then((m) => ({ default: m.SafePage })));
const CapTablePage = lazy(() =>
  import('./pages/CapTablePage').then((m) => ({ default: m.CapTablePage })),
);
const TaxPage = lazy(() => import('./pages/TaxPage').then((m) => ({ default: m.TaxPage })));
const ScenarioPage = lazy(() =>
  import('./pages/ScenarioPage').then((m) => ({ default: m.ScenarioPage })),
);
const RunwayPage = lazy(() => import('./pages/RunwayPage').then((m) => ({ default: m.RunwayPage })));
const AngelTaxPage = lazy(() =>
  import('./pages/AngelTaxPage').then((m) => ({ default: m.AngelTaxPage })),
);
const ReturnsPage = lazy(() =>
  import('./pages/ReturnsPage').then((m) => ({ default: m.ReturnsPage })),
);
const VestingPage = lazy(() =>
  import('./pages/VestingPage').then((m) => ({ default: m.VestingPage })),
);
const TargetOwnershipPage = lazy(() =>
  import('./pages/TargetOwnershipPage').then((m) => ({ default: m.TargetOwnershipPage })),
);
const ConvertiblePage = lazy(() =>
  import('./pages/ConvertiblePage').then((m) => ({ default: m.ConvertiblePage })),
);
const FaqPage = lazy(() => import('./pages/FaqPage').then((m) => ({ default: m.FaqPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const PayrollPage = lazy(() => import('./pages/PayrollPage').then((m) => ({ default: m.PayrollPage })));
const HiringRunwayPage = lazy(() =>
  import('./pages/HiringRunwayPage').then((m) => ({ default: m.HiringRunwayPage })),
);
const BurnMultiplePage = lazy(() =>
  import('./pages/BurnMultiplePage').then((m) => ({ default: m.BurnMultiplePage })),
);
const SaasMetricsPage = lazy(() =>
  import('./pages/SaasMetricsPage').then((m) => ({ default: m.SaasMetricsPage })),
);
const BepPage = lazy(() => import('./pages/BepPage').then((m) => ({ default: m.BepPage })));
const FundMetricsPage = lazy(() =>
  import('./pages/FundMetricsPage').then((m) => ({ default: m.FundMetricsPage })),
);
const FundReturnerPage = lazy(() =>
  import('./pages/FundReturnerPage').then((m) => ({ default: m.FundReturnerPage })),
);
const WaterfallPage = lazy(() =>
  import('./pages/WaterfallPage').then((m) => ({ default: m.WaterfallPage })),
);
const ValuationPage = lazy(() =>
  import('./pages/ValuationPage').then((m) => ({ default: m.ValuationPage })),
);
const TermSheetPage = lazy(() =>
  import('./pages/TermSheetPage').then((m) => ({ default: m.TermSheetPage })),
);
const StartupTaxPage = lazy(() =>
  import('./pages/StartupTaxPage').then((m) => ({ default: m.StartupTaxPage })),
);
const RsuTaxPage = lazy(() => import('./pages/RsuTaxPage').then((m) => ({ default: m.RsuTaxPage })));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-24 text-sm text-slate-400">
      불러오는 중…
    </div>
  );
}

export function App() {
  return (
    <Layout>
      <ScrollToTop />
      <Seo />
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/safe" element={<SafePage />} />
          <Route path="/captable" element={<CapTablePage />} />
          <Route path="/tax" element={<TaxPage />} />
          <Route path="/scenario" element={<ScenarioPage />} />
          <Route path="/runway" element={<RunwayPage />} />
          <Route path="/angel-tax" element={<AngelTaxPage />} />
          <Route path="/returns" element={<ReturnsPage />} />
          <Route path="/vesting" element={<VestingPage />} />
          <Route path="/target" element={<TargetOwnershipPage />} />
          <Route path="/convertible" element={<ConvertiblePage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/payroll" element={<PayrollPage />} />
          <Route path="/hiring-runway" element={<HiringRunwayPage />} />
          <Route path="/burn-multiple" element={<BurnMultiplePage />} />
          <Route path="/saas-metrics" element={<SaasMetricsPage />} />
          <Route path="/bep" element={<BepPage />} />
          <Route path="/fund-metrics" element={<FundMetricsPage />} />
          <Route path="/fund-returner" element={<FundReturnerPage />} />
          <Route path="/waterfall" element={<WaterfallPage />} />
          <Route path="/valuation" element={<ValuationPage />} />
          <Route path="/termsheet" element={<TermSheetPage />} />
          <Route path="/startup-tax" element={<StartupTaxPage />} />
          <Route path="/rsu-tax" element={<RsuTaxPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
