import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import { LoginPage } from './pages/login';
import { SignupPage } from './pages/signup';
import { PortfolioPage } from './pages/portfolio';
import { WatchlistPage } from './pages/watchlist';
import { InsightsPage } from './pages/insights';
import { SettingsPage } from './pages/settings';
import { SearchPage } from './pages/search';
import AssetDetail from './pages/asset-detail';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/signup',
    element: <SignupPage />,
  },
  {
    path: '/dashboard',
    element: <App />,
  },
  {
    path: '/portfolio',
    element: <PortfolioPage />,
  },
  {
    path: '/watchlist',
    element: <WatchlistPage />,
  },
  {
    path: '/insights',
    element: <InsightsPage />,
  },
  {
    path: '/settings',
    element: <SettingsPage />,
  },
  {
    path: '/search',
    element: <SearchPage />,
  },
  {
    path: '/asset/:ticker',
    element: <AssetDetail />,
  },
]);
