import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MeetingsPage from './pages/MeetingsPage';
import CreateMeetingPage from './pages/CreateMeetingPage';
import MeetingDetailPage from './pages/MeetingDetailPage';
import LiveMeetingPage from './pages/LiveMeetingPage';
import MeetingSummaryPage from './pages/MeetingSummaryPage';
import TranscriptPage from './pages/TranscriptPage';
import ActionItemsPage from './pages/ActionItemsPage';
import InsightsPage from './pages/InsightsPage';
import SearchPage from './pages/SearchPage';
import AuditLogPage from './pages/AuditLogPage';
import SecurityPage from './pages/SecurityPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import NotFoundPage from './pages/NotFoundPage';

import './styles/global.css';

function AppWithLayout({ children }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontFamily: 'Inter, system-ui, sans-serif',
              fontSize: '13.5px',
              borderRadius: '8px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes — all use AppLayout */}
          <Route path="/dashboard" element={<AppWithLayout><DashboardPage /></AppWithLayout>} />
          <Route path="/meetings" element={<AppWithLayout><MeetingsPage /></AppWithLayout>} />
          <Route path="/meetings/new" element={<AppWithLayout><CreateMeetingPage /></AppWithLayout>} />
          <Route path="/meetings/:id" element={<AppWithLayout><MeetingDetailPage /></AppWithLayout>} />
          <Route path="/meetings/:id/live" element={
            <ProtectedRoute>
              <LiveMeetingPage />
            </ProtectedRoute>
          } />
          <Route path="/meetings/:id/summary" element={<AppWithLayout><MeetingSummaryPage /></AppWithLayout>} />
          <Route path="/meetings/:id/qa" element={<AppWithLayout><MeetingSummaryPage /></AppWithLayout>} />
          <Route path="/meetings/:id/transcript" element={<AppWithLayout><TranscriptPage /></AppWithLayout>} />
          <Route path="/meetings/:id/audit" element={<AppWithLayout><AuditLogPage /></AppWithLayout>} />
          <Route path="/actions" element={<AppWithLayout><ActionItemsPage /></AppWithLayout>} />
          <Route path="/insights" element={<AppWithLayout><InsightsPage /></AppWithLayout>} />
          <Route path="/search" element={<AppWithLayout><SearchPage /></AppWithLayout>} />
          <Route path="/security" element={<AppWithLayout><SecurityPage /></AppWithLayout>} />
          <Route path="/profile" element={<AppWithLayout><ProfilePage /></AppWithLayout>} />
          <Route path="/notifications" element={<AppWithLayout><NotificationsPage /></AppWithLayout>} />
          <Route path="/settings" element={<AppWithLayout><ProfilePage /></AppWithLayout>} />

          {/* Catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
