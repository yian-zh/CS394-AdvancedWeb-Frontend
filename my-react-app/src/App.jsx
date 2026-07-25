import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import AuthPage from './features/auth/pages/AuthPage';
import UserManagementPage from './features/dashboard/pages/UserManagementPage';
import FleetManagementPage from './features/dashboard/pages/FleetManagementPage';
import BusDetailPage from './features/dashboard/pages/BusDetailPage';
import RouteLogisticsPage from './features/dashboard/pages/RouteLogisticsPage';
import RouteDetailPage from './features/dashboard/pages/RouteDetailPage';
import StudentsPage from './features/dashboard/pages/StudentsPage';
import FinancePage from './features/dashboard/pages/FinancePage';
import ProtectedRoute from './components/ProtectedRoute';
import { authService } from './features/auth/services/authService';

function App() {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const queryClient = useQueryClient();

  const handleSignOut = async () => {
    try {
      await authService.logout();
      queryClient.clear();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Main index redirecting to students directory */}
        <Route path="/" element={<Navigate to="/students" replace />} />

        {/* Auth Route */}
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/students" replace /> : <AuthPage onLogin={setUser} />
          } 
        />

        {/* Student Management Hub (Protected) */}
        <Route 
          path="/students" 
          element={
            <ProtectedRoute user={user}>
              <StudentsPage 
                user={user} 
                onSignOut={handleSignOut} 
              />
            </ProtectedRoute>
          } 
        />

        {/* Dashboard User Directory (Protected) */}
        <Route 
          path="/users" 
          element={
            <ProtectedRoute user={user}>
              <UserManagementPage user={user} onSignOut={handleSignOut} />
            </ProtectedRoute>
          } 
        />


        {/* Fleet & Maintenance Hub (Protected) */}
        <Route 
          path="/fleet" 
          element={
            <ProtectedRoute user={user}>
              <FleetManagementPage 
                user={user} 
                onSignOut={handleSignOut} 
              />
            </ProtectedRoute>
          } 
        />

        {/* Bus Details Page (Protected) */}
        <Route 
          path="/fleet/:busId" 
          element={
            <ProtectedRoute user={user}>
              <BusDetailPage 
                user={user} 
                onSignOut={handleSignOut} 
              />
            </ProtectedRoute>
          } 
        />

        {/* Route Directory (Protected) */}
        <Route 
          path="/logistics" 
          element={
            <ProtectedRoute user={user}>
              <RouteLogisticsPage 
                user={user} 
                onSignOut={handleSignOut} 
              />
            </ProtectedRoute>
          } 
        />

        {/* Route Detail Planner (Protected) */}
        <Route 
          path="/logistics/:routeId" 
          element={
            <ProtectedRoute user={user}>
              <RouteDetailPage 
                user={user} 
                onSignOut={handleSignOut} 
              />
            </ProtectedRoute>
          } 
        />

        {/* Financial Dashboard (Protected) */}
        <Route 
          path="/finance" 
          element={
            <ProtectedRoute user={user}>
              <FinancePage 
                user={user} 
                onSignOut={handleSignOut} 
              />
            </ProtectedRoute>
          } 
        />

        {/* Catch-all redirect to index */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
