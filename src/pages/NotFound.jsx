import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
        <div className="w-12 h-12 bg-academic-100 rounded-xl flex items-center justify-center text-academic-700 mx-auto mb-4">
          <GraduationCap className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">404</h1>
        <h2 className="text-base font-bold text-slate-700 mb-2">Page Not Found</h2>
        <p className="text-xs text-slate-500 mb-6">
          The requested Campus AI portal URL does not exist or has been moved.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-academic-600 hover:bg-academic-700 transition"
        >
          <Home className="w-4 h-4" />
          <span>Return to Welcome Screen</span>
        </Link>
      </div>
    </div>
  );
}
