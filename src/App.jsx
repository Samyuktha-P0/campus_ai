import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DocumentProvider } from './context/DocumentContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Welcome from './pages/Welcome';
import AdminSignIn from './pages/admin/AdminSignIn';
import AdminSignUp from './pages/admin/AdminSignUp';
import AdminDashboard from './pages/admin/AdminDashboard';
import StudentSignIn from './pages/student/StudentSignIn';
import StudentSignUp from './pages/student/StudentSignUp';
import StudentChat from './pages/student/StudentChat';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <DocumentProvider>
          <Routes>
            {/* 1. First Screen - Welcome Page */}
            <Route path="/" element={<Welcome />} />

            {/* 2. Admin Authentication Routes */}
            <Route path="/admin/signin" element={<AdminSignIn />} />
            <Route path="/admin/signup" element={<AdminSignUp />} />

            {/* 3. Protected Admin Dashboard */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* 4. Student Authentication Routes */}
            <Route path="/student/signin" element={<StudentSignIn />} />
            <Route path="/student/signup" element={<StudentSignUp />} />

            {/* 5. Protected Student Chatbot */}
            <Route
              path="/student/chat"
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentChat />
                </ProtectedRoute>
              }
            />

            {/* Fallback routes */}
            <Route path="/admin" element={<Navigate to="/admin/signin" replace />} />
            <Route path="/student" element={<Navigate to="/student/signin" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DocumentProvider>
      </AuthProvider>
    </Router>
  );
}
