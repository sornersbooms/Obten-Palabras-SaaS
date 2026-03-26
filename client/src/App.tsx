import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Register from './components/Register';
import SupervisorDashboard from './components/SupervisorDashboard';
import { authService } from './services/auth.service';

// Protected Route Guard
const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role?: string }) => {
  if (!authService.isAuthenticated()) return <Navigate to="/login" replace />;
  const user = authService.getUser();
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Agent Dashboard (Default) */}
        <Route path="/" element={
          <ProtectedRoute role="agent">
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* Supervisor Monitor */}
        <Route path="/supervisor" element={
          <ProtectedRoute role="supervisor">
            <SupervisorDashboard />
          </ProtectedRoute>
        } />

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
