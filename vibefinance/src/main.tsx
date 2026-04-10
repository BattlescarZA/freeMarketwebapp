import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './components/theme/theme-provider';
import { ErrorBoundary } from './components/shared/error-boundary';
import { router } from './router';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" storageKey="vibe-finance-theme">
        <RouterProvider router={router} />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
