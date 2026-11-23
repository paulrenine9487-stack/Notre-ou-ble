import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import ProtectedRoute from './components/ProtectedRoute';
import WelcomePage from './pages/WelcomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ModuleSelectionPage from './pages/ModuleSelectionPage';
import LearningPage from './pages/LearningPage';
import PracticeJournalPage from './pages/PracticeJournalPage';
import AdminPortalPage from './pages/AdminPortalPage';

export default function App() {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <Router>
        <Routes>
          {/* Welcome Page: All reference sections in continuous flow */}
          <Route path="/" element={<WelcomePage />} />

          {/* Authentication Routes */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected User Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Level 1: Protected Learning Modules Selection */}
          <Route
            path="/learning"
            element={
              <ProtectedRoute>
                <ModuleSelectionPage />
              </ProtectedRoute>
            }
          />

          {/* Level 2: Module 01 - Breath Management 5-Stage Portal */}
          <Route
            path="/learning/modules/breath-management"
            element={
              <ProtectedRoute>
                <LearningPage />
              </ProtectedRoute>
            }
          />

          {/* Backward compatibility / aliases */}
          <Route
            path="/learning/modules/1"
            element={<Navigate to="/learning/modules/breath-management" replace />}
          />
          <Route
            path="/learning/breath-management"
            element={<Navigate to="/learning/modules/breath-management" replace />}
          />

          {/* Protected Practice Journal & Song Phrase Mapping */}
          <Route
            path="/practice"
            element={
              <ProtectedRoute>
                <PracticeJournalPage />
              </ProtectedRoute>
            }
          />

          {/* Dedicated Administrative Management & Teacher Studio Portal */}
          <Route path="/ResonovaNotreoble" element={<AdminPortalPage />} />
          <Route path="/ResonovaSmirthi" element={<AdminPortalPage />} />
          <Route path="/admin" element={<Navigate to="/ResonovaSmirthi" replace />} />
          <Route path="/admin-portal" element={<Navigate to="/ResonovaSmirthi" replace />} />

          {/* Fallback to Welcome */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AccessibilityProvider>
  </AuthProvider>
  );
}
