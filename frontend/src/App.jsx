import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext.jsx';
import { WebSocketProvider } from './context/WebSocketContext.jsx';
import Navbar from './components/Navbar.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AdminDashboard from './pages/Admin/AdminDashboard.jsx';
import ChefDashboard from './pages/Chef/ChefDashboard.jsx';
import SailorDashboard from './pages/Sailor/SailorDashboard.jsx';
import LoadingSpinner from './components/LoadingSpinner.jsx';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const DashboardRouter = () => {
  const { user } = useAuth();

  const getDashboard = () => {
    switch (user?.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'chef':
        return <ChefDashboard />;
      case 'sailor':
        return <SailorDashboard />;
      default:
        return <div>Invalid Role. Contact administrator.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {getDashboard()}
      </main>
    </div>
  );
};

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />

        <Route path="/dashboard" element={
            <ProtectedRoute>
              <WebSocketProvider>
                <DashboardRouter />
              </WebSocketProvider>
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />

        <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center">
              404 Page Not Found
            </div>
          }
        />
      </Routes>
      <Toaster position="top-right" />
    </>
  );
}

export default App;