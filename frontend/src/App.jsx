import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import AgentHistory from './pages/AgentHistory';
import ManagerDashboard from './pages/ManagerDashboard';
import ManagerAgents from './pages/ManagerAgents';
import ManagerBreaks from './pages/ManagerBreaks';
import ManagerHistory from './pages/ManagerHistory';
import Reports from './pages/Reports';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />; // Redirect to home or unauthorized page
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['AGENT']}>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute allowedRoles={['AGENT']}>
                  <AgentHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager"
              element={
                <ProtectedRoute allowedRoles={['MANAGER', 'SUPER_ADMIN']}>
                  <ManagerDashboard />
                </ProtectedRoute>
              }
            >
              <Route path="agents" element={<ManagerAgents />} />
              <Route path="breaks" element={<ManagerBreaks />} />
              <Route path="history" element={<ManagerHistory />} />
              <Route path="reports" element={<Reports />} />
              {/* <Route path="reports" element={<ManagerReports />} /> */}
            </Route>
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
