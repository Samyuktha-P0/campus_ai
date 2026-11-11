import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, LogOut, Shield, User, Database, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Navbar({ role }) {
  const { user, signOut, isConfigured } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    if (role === 'admin') {
      navigate('/admin/signin');
    } else {
      navigate('/student/signin');
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-academic-700 to-academic-500 flex items-center justify-center text-white shadow-md shadow-academic-500/20 group-hover:scale-105 transition-transform">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">Campus AI</span>
              {role === 'admin' && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <Shield className="w-3 h-3" /> Admin Portal
                </span>
              )}
              {role === 'student' && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-academic-50 text-academic-700 border border-academic-200">
                  <User className="w-3 h-3" /> Student Portal
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">Intelligent Campus Document Assistant</p>
          </div>
        </Link>

        {/* User Info & Actions */}
        <div className="flex items-center gap-4">
          
          {/* Storage / Backend Status Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200" title={isConfigured ? 'Connected to live Supabase backend' : 'Running in local demonstration mode (mock storage & auth)'}>
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <span>{isConfigured ? 'Supabase Live' : 'Demo Mode (Local)'}</span>
            {isConfigured ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            )}
          </div>

          {user && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-800 leading-tight">{user.full_name || user.email}</p>
                <p className="text-[11px] text-slate-400 capitalize">{user.role}</p>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                {(user.full_name || user.email || 'U')[0].toUpperCase()}
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                title="Sign out of your session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          )}

          {!user && (
            <div className="flex items-center gap-2">
              <Link
                to="/admin/signin"
                className="text-xs font-medium text-slate-600 hover:text-slate-900 px-3 py-1.5"
              >
                Admin Sign In
              </Link>
              <Link
                to="/student/signin"
                className="text-xs font-medium bg-academic-600 text-white px-3 py-1.5 rounded-lg hover:bg-academic-700 transition"
              >
                Student Sign In
              </Link>
            </div>
          )}

        </div>
      </div>
    </header>
  );
}
