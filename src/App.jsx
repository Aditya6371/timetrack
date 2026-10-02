import { HashRouter, Route, Routes } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { Toasts } from './components/Toasts';
import { AppProvider } from './context/AppProvider';
import { CalendarPage } from './pages/Calendar';
import { Dashboard } from './pages/Dashboard';
import { ReportsPage } from './pages/Reports';
import { SettingsPage } from './pages/Settings';

export default function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AppProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </Layout>
          <Toasts />
        </AppProvider>
      </HashRouter>
    </ErrorBoundary>
  );
}
