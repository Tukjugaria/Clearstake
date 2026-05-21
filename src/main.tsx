import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import './index.css';
import { App } from './App';
import { PerspectiveProvider } from './context/PerspectiveContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <PerspectiveProvider>
        <App />
      </PerspectiveProvider>
    </HashRouter>
  </StrictMode>,
);
