import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { UsersPage } from './pages/UsersPage';
import { DashboardPage } from './pages/DashboardPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { ReviewQueuePage } from './pages/ReviewQueuePage';
import { DispositionQueuePage } from './pages/DispositionQueuePage';
import { VerifyPage } from './pages/VerifyPage';
import { TaskCenterPage } from './pages/TaskCenterPage';
import { SystemStatusPage } from './pages/SystemStatusPage';
import { AppView } from './components/Navbar';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [activeView, setActiveView] = useState<AppView>('documents');

  useEffect(() => {
    if (user && user.role !== 'ROLE_ADMIN' && activeView !== 'documents' && activeView !== 'tasks') {
      setActiveView('documents');
    }
  }, [user, activeView]);

  useEffect(() => {
    const handleNavigate = (e: any) => {
      if (e.detail) {
        setActiveView(e.detail);
      }
    };
    window.addEventListener('app-navigate', handleNavigate);
    return () => window.removeEventListener('app-navigate', handleNavigate);
  }, []);

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bg)'
      }}>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>Đang khởi tạo hệ thống...</p>
      </div>
    );
  }

  if (window.location.pathname === '/verify' || window.location.pathname.startsWith('/verify')) {
    return <VerifyPage />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const isAdmin = user?.role === 'ROLE_ADMIN';

  if (activeView === 'tasks') {
    return <TaskCenterPage />;
  }

  if (activeView === 'dashboard' && isAdmin) {
    return <DashboardPage />;
  }

  if (activeView === 'users' && isAdmin) {
    return <UsersPage />;
  }

  if (activeView === 'review-queue' && isAdmin) {
    return <ReviewQueuePage />;
  }

  if (activeView === 'disposition-queue' && isAdmin) {
    return <DispositionQueuePage />;
  }

  if (activeView === 'audit' && isAdmin) {
    return <AuditLogPage />;
  }

  if (activeView === 'system-status' && isAdmin) {
    return <SystemStatusPage />;
  }

  return <DocumentsPage />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
