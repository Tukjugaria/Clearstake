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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
