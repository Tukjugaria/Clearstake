import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { Layout } from './components/layout/Layout';
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
const WaterfallPage = lazy(() =>
  import('./pages/WaterfallPage').then((m) => ({ default: m.WaterfallPage })),
);
const ValuationPage = lazy(() =>
  import('./pages/ValuationPage').then((m) => ({ default: m.ValuationPage })),
);

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
          <Route path="/waterfall" element={<WaterfallPage />} />
          <Route path="/valuation" element={<ValuationPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
