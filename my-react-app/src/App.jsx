import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './features/auth/pages/AuthPage';
import UserManagementPage from './features/dashboard/pages/UserManagementPage';
import FleetManagementPage from './features/dashboard/pages/FleetManagementPage';
import BusDetailPage from './features/dashboard/pages/BusDetailPage';
import RouteLogisticsPage from './features/dashboard/pages/RouteLogisticsPage';
import RouteDetailPage from './features/dashboard/pages/RouteDetailPage';
import StudentsPage from './features/dashboard/pages/StudentsPage';
import ProtectedRoute from './components/ProtectedRoute';
import { INITIAL_FLEET, INITIAL_REPAIRS } from './features/dashboard/data/fleetData';
import { INITIAL_STUDENTS } from './features/dashboard/data/studentsData';

function App() {
  const [user, setUser] = useState(null);
  const [fleet, setFleet] = useState(INITIAL_FLEET);
  const [repairs, setRepairs] = useState(INITIAL_REPAIRS);
  const [students, setStudents] = useState(INITIAL_STUDENTS);

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
                onSignOut={() => setUser(null)} 
                students={students}
                setStudents={setStudents}
              />
            </ProtectedRoute>
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
              <FleetManagementPage 
                user={user} 
                onSignOut={() => setUser(null)} 
                fleet={fleet}
                setFleet={setFleet}
                repairs={repairs}
                setRepairs={setRepairs}
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
                onSignOut={() => setUser(null)} 
                fleet={fleet}
                setFleet={setFleet}
                repairs={repairs}
                setRepairs={setRepairs}
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
                onSignOut={() => setUser(null)} 
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
                onSignOut={() => setUser(null)} 
                fleet={fleet}
                setFleet={setFleet}
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
