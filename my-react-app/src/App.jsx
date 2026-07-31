import { useState, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import ProtectedRoute from './components/ProtectedRoute';
import PageLoader from './components/ui/PageLoader';
import { authService } from './features/auth/services/authService';

const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    const lastReload = sessionStorage.getItem('chunk_reload_timestamp');
    const now = Date.now();

    try {
      const component = await componentImport();
      sessionStorage.removeItem('chunk_reload_timestamp');
      return component;
    } catch (error) {
      // Automatic recovery for 404 dynamic import chunk failures after new deployment builds.
      // Use a cache-busted reload so the browser fetches the NEW index.html (which references
      // the new chunk hashes) instead of reusing the cached old one via location.reload().
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem('chunk_reload_timestamp', String(now));
        const sep = window.location.search ? '&' : '?';
        window.location.assign(`${window.location.pathname}${window.location.search}${sep}v=${now}${window.location.hash}`);
        return new Promise(() => {});
      }
      throw error;
    }
  });

const AuthPage = lazyWithRetry(() => import('./features/auth/pages/AuthPage'));
const StudentsPage = lazyWithRetry(() => import('./features/dashboard/pages/StudentsPage'));
const UserManagementPage = lazyWithRetry(() => import('./features/dashboard/pages/UserManagementPage'));
const FleetManagementPage = lazyWithRetry(() => import('./features/dashboard/pages/FleetManagementPage'));
const BusDetailPage = lazyWithRetry(() => import('./features/dashboard/pages/BusDetailPage'));
const RouteLogisticsPage = lazyWithRetry(() => import('./features/dashboard/pages/RouteLogisticsPage'));
const RouteDetailPage = lazyWithRetry(() => import('./features/dashboard/pages/RouteDetailPage'));
const FinancePage = lazyWithRetry(() => import('./features/dashboard/pages/FinancePage'));
const DatabaseTelemetryPage = lazyWithRetry(() => import('./features/dashboard/pages/DatabaseTelemetryPage'));

function App() {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      queryClient.clear();
      setUser(null);
    }
  };

  return (
    <HashRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Navigate to="/students" replace />} />
          <Route 
            path="/login" 
            element={
              user ? <Navigate to="/students" replace /> : <AuthPage onLogin={setUser} />
            } 
          />
          <Route 
            path="/students" 
            element={
              <ProtectedRoute user={user}>
                <StudentsPage user={user} onSignOut={handleSignOut} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute user={user}>
                <UserManagementPage user={user} onSignOut={handleSignOut} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/fleet" 
            element={
              <ProtectedRoute user={user}>
                <FleetManagementPage user={user} onSignOut={handleSignOut} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/fleet/:busId" 
            element={
              <ProtectedRoute user={user}>
                <BusDetailPage user={user} onSignOut={handleSignOut} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/logistics" 
            element={
              <ProtectedRoute user={user}>
                <RouteLogisticsPage user={user} onSignOut={handleSignOut} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/logistics/:routeId" 
            element={
              <ProtectedRoute user={user}>
                <RouteDetailPage user={user} onSignOut={handleSignOut} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/finance" 
            element={
              <ProtectedRoute user={user}>
                <FinancePage user={user} onSignOut={handleSignOut} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/telemetry" 
            element={
              <ProtectedRoute user={user}>
                <DatabaseTelemetryPage user={user} onSignOut={handleSignOut} />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}

export default App;
