import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AuthTabs from '../../components/AuthTabs';
import { Shield, Lock, Mail, User, KeyRound, ArrowRight, AlertCircle, CheckCircle2, GraduationCap, ShieldAlert } from 'lucide-react';

export default function AdminSignUp() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const { signUpAdmin } = useAuth();
  const navigate = useNavigate();

  const handleAdminSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setAccessDenied(false);

    // Form validations
    if (!fullName.trim() || !email.trim() || !inviteCode.trim() || !newPassword || !confirmPassword) {
      setError('All fields are mandatory for administrator account provisioning.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid academic/institutional email address.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New Password and Confirm Password do not match.');
      return;
    }

    setLoading(true);
    try {
      await signUpAdmin({
        email,
        password: newPassword,
        fullName: fullName.trim(),
        inviteCode: inviteCode.trim()
      });

      setSuccess('Administrator account provisioned successfully! Redirecting to Admin Sign In...');
      setTimeout(() => {
        navigate('/admin/signin');
      }, 1800);
    } catch (err) {
      if (err.message && err.message.includes('Access Denied')) {
        setAccessDenied(true);
      }
      setError(err.message || 'Failed to provision admin account.');
    } finally {
      setLoading(false);
    }
  };

  // Helper for quick demonstration
  const fillSampleInvite = () => {
    setInviteCode('CAMPUS_ADMIN_2025');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link to="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-md shadow-amber-600/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <span className="font-bold text-xl text-slate-900 tracking-tight">Campus AI</span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          Admin Account Provisioning
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Authorized staff registration protected by institutional security key
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200 sm:px-10">
          
          <AuthTabs activeTab="admin" mode="signup" />

          {/* Security Notice */}
          <div className="mb-5 p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-800 text-xs">
            <Shield className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
            <p>
              <strong>Restricted Registration:</strong> Administrator accounts can only be provisioned with a verified college authorization key.
            </p>
          </div>

          {accessDenied && (
            <div className="mb-5 p-4 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-3 text-rose-800 text-xs">
              <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-sm text-rose-900">Access Denied (Unauthorized)</p>
                <p className="mt-1">
                  You are not authorized to create an administrator account. Only designated institutional officers possessing the authorized setup code can register as administrators.
                </p>
              </div>
            </div>
          )}

          {error && !accessDenied && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-emerald-800 text-xs">
              <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleAdminSignUp} className="space-y-4">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Prof. Alan Davis"
                  className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Email ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alan.davis@campus.edu"
                  className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Admin Provisioning Key */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Admin Authorization Key
                </label>
                <button
                  type="button"
                  onClick={fillSampleInvite}
                  className="text-[11px] text-amber-600 hover:text-amber-700 underline font-medium"
                >
                  Use Default Key
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Enter institutional setup code"
                  className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">Default key: CAMPUS_ADMIN_2025</p>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                New Password <span className="font-normal lowercase text-slate-400">(set account password)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 shadow-md shadow-amber-600/20 transition-all disabled:opacity-50"
              >
                {loading ? 'Provisioning Account...' : 'Provision Administrator Account'}
              </button>
            </div>

          </form>

          {/* Already have an admin account? */}
          <div className="mt-6 text-center text-xs text-slate-500">
            <span>Already an administrator? </span>
            <Link
              to="/admin/signin"
              className="font-semibold text-amber-600 hover:text-amber-700 underline"
            >
              Sign In to Admin Portal
            </Link>
          </div>

        </div>

        {/* Back to Home link */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-slate-500 hover:text-slate-800">
            ← Back to Welcome Screen
          </Link>
        </div>

      </div>

    </div>
  );
}
