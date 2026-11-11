import React from 'react';
import { Link } from 'react-router-dom';
import { 
  GraduationCap, 
  Shield, 
  UserCheck, 
  FileText, 
  Bot, 
  Search, 
  Lock, 
  ArrowRight,
  Database,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Welcome() {
  const { isConfigured } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 flex flex-col justify-between">
      
      {/* Top Academic Header */}
      <header className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-academic-600 flex items-center justify-center text-white shadow-lg shadow-academic-600/30">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl text-slate-900 tracking-tight">Campus AI</h1>
            <p className="text-xs text-slate-500 font-medium">College Document Intelligence System</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Academic Version 1.0
          </span>
        </div>
      </header>

      {/* Main Hero & Dual Portal Cards */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1 flex flex-col justify-center">
        
        {/* Hero Title Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-academic-50 text-academic-700 border border-academic-200 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-academic-500" />
            Empowering Campus Communication with Retrieval-Based AI
          </div>

          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
            Welcome to <span className="text-academic-600">Campus AI</span>
          </h2>
          <p className="text-xl sm:text-2xl text-slate-600 font-medium tracking-tight">
            "Your Campus Information, One Question Away"
          </p>
          <p className="mt-3 text-sm text-slate-500 max-w-xl mx-auto">
            Upload official college circulars, notices, and exam guidelines in PDF, DOCX, or TXT. Get instant, accurate, source-cited answers to campus questions without searching through piles of documents.
          </p>
        </div>

        {/* Two Clearly Separated Options: Admin Portal & Student Portal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
          
          {/* Admin Portal Card */}
          <div className="bg-white rounded-3xl p-8 border border-amber-200/80 shadow-xl shadow-amber-500/5 hover:border-amber-300 transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -z-0 transition-transform group-hover:scale-110"></div>
            
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-200 flex items-center justify-center text-amber-600 mb-6">
                <Shield className="w-7 h-7" />
              </div>

              <div className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 mb-2">
                Faculty & Administration
              </div>

              <h3 className="text-2xl font-bold text-slate-900 mb-2">Admin Portal</h3>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Securely manage institutional knowledge. Upload circulars, exam notifications, and schedules with automated text extraction and semantic chunking.
              </p>

              <div className="space-y-2.5 mb-8 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span>Support for PDF, DOCX, and TXT notices</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span>Role-protected document management & deletion</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-600" />
                  <span>Automated text extraction & chunk indexing</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 relative z-10 pt-4 border-t border-slate-100">
              <Link
                to="/admin/signin"
                className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold text-sm text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-600/20 transition-colors"
              >
                <span>Admin Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              
              <Link
                to="/admin/signup"
                className="w-full flex items-center justify-center py-2 px-4 rounded-xl font-medium text-xs text-slate-600 hover:text-amber-700 hover:bg-amber-50 transition-colors"
              >
                Create Admin Account (Authorized Staff)
              </Link>
            </div>
          </div>

          {/* Student Portal Card */}
          <div className="bg-white rounded-3xl p-8 border border-academic-200/80 shadow-xl shadow-academic-600/5 hover:border-academic-300 transition-all flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-academic-50 rounded-bl-full -z-0 transition-transform group-hover:scale-110"></div>

            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-academic-500/10 border border-academic-200 flex items-center justify-center text-academic-600 mb-6">
                <Bot className="w-7 h-7" />
              </div>

              <div className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-academic-100 text-academic-800 mb-2">
                Enrolled Students
              </div>

              <h3 className="text-2xl font-bold text-slate-900 mb-2">Student Portal</h3>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Interact with the intelligent campus assistant. Ask natural language questions about event dates, dress codes, venues, and exam guidelines.
              </p>

              <div className="space-y-2.5 mb-8 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-academic-600" />
                  <span>Grounded answers directly from college circulars</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-academic-600" />
                  <span>Official source document citation with each answer</span>
                </div>
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-academic-600" />
                  <span>Student chat history & inquiry persistence</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 relative z-10 pt-4 border-t border-slate-100">
              <Link
                to="/student/signin"
                className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-semibold text-sm text-white bg-academic-600 hover:bg-academic-700 shadow-md shadow-academic-600/20 transition-colors"
              >
                <span>Student Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              
              <Link
                to="/student/signup"
                className="w-full flex items-center justify-center py-2 px-4 rounded-xl font-medium text-xs text-slate-600 hover:text-academic-700 hover:bg-academic-50 transition-colors"
              >
                Create Student Account
              </Link>
            </div>
          </div>

        </div>

      </main>

      {/* Academic Footer */}
      <footer className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 text-center text-xs text-slate-400 border-t border-slate-200/60">
        <p>Campus AI — Intelligent Campus Document Assistant • Department Mini Project</p>
      </footer>

    </div>
  );
}
