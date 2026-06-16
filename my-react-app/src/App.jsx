import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './features/auth/pages/AuthPage';
import UserManagementPage from './features/dashboard/pages/UserManagementPage';
import FleetManagementPage from './features/dashboard/pages/FleetManagementPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [user, setUser] = useState(null);

  return (
    <BrowserRouter>
      <Routes>
        {/* Main index redirecting to users directory */}
        <Route path="/" element={<Navigate to="/users" replace />} />

        {/* Auth Route */}
        <Route 
          path="/login" 
          element={
            user ? <Navigate to="/users" replace /> : <AuthPage onLogin={setUser} />
          } 
        />

        {/* Dashboard User Directory (Protected) */}
        <Route 
          path="/users" 
          element={
            <ProtectedRoute user={user}>
              <UserManagementPage user={user} onSignOut={() => setUser(null)} />
            </ProtectedRoute>
          } 
        />

        {/* Fleet & Maintenance Hub (Protected) */}
        <Route 
          path="/fleet" 
          element={
            <ProtectedRoute user={user}>
              <FleetManagementPage user={user} onSignOut={() => setUser(null)} />
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
