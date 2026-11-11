import React from 'react';
import { NavLink } from 'react-router-dom';
import { Shield, GraduationCap } from 'lucide-react';

export default function AuthTabs({ activeTab, mode = 'signin' }) {
  const adminTarget = mode === 'signup' ? '/admin/signup' : '/admin/signin';
  const studentTarget = mode === 'signup' ? '/student/signup' : '/student/signin';

  return (
    <div className="w-full bg-slate-100 p-1.5 rounded-xl flex items-center gap-1 mb-6 border border-slate-200">
      <NavLink
        to={adminTarget}
        className={({ isActive }) => `
          flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all
          ${activeTab === 'admin'
            ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-semibold'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }
        `}
      >
        <Shield className={`w-4 h-4 ${activeTab === 'admin' ? 'text-amber-600' : 'text-slate-400'}`} />
        <span>Admin</span>
      </NavLink>

      <NavLink
        to={studentTarget}
        className={({ isActive }) => `
          flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium text-sm transition-all
          ${activeTab === 'student'
            ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-semibold'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }
        `}
      >
        <GraduationCap className={`w-4 h-4 ${activeTab === 'student' ? 'text-academic-600' : 'text-slate-400'}`} />
        <span>Student</span>
      </NavLink>
    </div>
  );
}
