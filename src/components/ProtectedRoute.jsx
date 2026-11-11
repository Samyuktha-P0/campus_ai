import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-academic-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-medium">Authenticating Campus AI session...</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    const redirectUrl = allowedRole === 'admin' ? '/admin/signin' : '/student/signin';
    return <Navigate to={redirectUrl} state={{ from: location }} replace />;
  }

  // Role mismatch
  if (allowedRole && user.role !== allowedRole) {
    // If student attempts to view admin dashboard, or admin attempts to view student chat
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-rose-200 p-8 text-center">
          <div className="w-14 h-14 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied (403)</h2>
          <p className="text-sm text-slate-600 mb-6">
            Your account is assigned the <strong className="text-slate-800 capitalize">"{user.role}"</strong> role. You do not have permission to access the <strong className="capitalize">{allowedRole}</strong> portal.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <NavigateButton role={user.role} />
          </div>
        </div>
      </div>
    );
  }

  return children;
}

function NavigateButton({ role }) {
  if (role === 'admin') {
    return (
      <a
        href="/admin/dashboard"
        className="w-full inline-flex justify-center py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition"
      >
        Go to Admin Dashboard
      </a>
    );
  }
  return (
    <a
      href="/student/chat"
      className="w-full inline-flex justify-center py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-academic-600 hover:bg-academic-700 shadow-sm transition"
    >
      Go to Student Chatbot
    </a>
  );
}
