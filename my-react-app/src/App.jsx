import { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import ProtectedRoute from './components/ProtectedRoute';
import PageLoader from './components/ui/PageLoader';
import { authService } from './features/auth/services/authService';

const AuthPage = lazy(() => import('./features/auth/pages/AuthPage'));
const StudentsPage = lazy(() => import('./features/dashboard/pages/StudentsPage'));
const UserManagementPage = lazy(() => import('./features/dashboard/pages/UserManagementPage'));
const FleetManagementPage = lazy(() => import('./features/dashboard/pages/FleetManagementPage'));
const BusDetailPage = lazy(() => import('./features/dashboard/pages/BusDetailPage'));
const RouteLogisticsPage = lazy(() => import('./features/dashboard/pages/RouteLogisticsPage'));
const RouteDetailPage = lazy(() => import('./features/dashboard/pages/RouteDetailPage'));
const FinancePage = lazy(() => import('./features/dashboard/pages/FinancePage'));

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
    <BrowserRouter>
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
