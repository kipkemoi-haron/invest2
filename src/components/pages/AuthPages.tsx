import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Lock, Mail, User, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface AuthPagesProps {
  initialView: 'sign-in' | 'sign-up' | 'forgot-password';
  onNavigate: (view: string) => void;
}

export const AuthPages: React.FC<AuthPagesProps> = ({ initialView, onNavigate }) => {
  const { login, register, forgotPassword, quickLoginAs } = useAuth();
  const [currentMode, setCurrentMode] = useState<'sign-in' | 'sign-up' | 'forgot-password'>(initialView);

  // Sign In State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Sign Up State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // Forgot Password State
  const [resetEmail, setResetEmail] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  // Feedback
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCurrentMode(initialView);
    setError(null);
    setResetMessage(null);
  }, [initialView]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      setError('Please enter your email address and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const u = await login(loginEmail.trim(), loginPassword);
      onNavigate(u.role === 'ADMIN' ? 'admin-dashboard' : 'client-dashboard');
    } catch (err: any) {
      setError(err?.message || 'Incorrect email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please complete all mandatory registration fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const u = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        referralCode: referralCode.trim() || undefined,
      });
      onNavigate(u.role === 'ADMIN' ? 'admin-dashboard' : 'client-dashboard');
    } catch (err: any) {
      setError(err?.message || 'Unable to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setError('Please enter your registered email address.');
      return;
    }
    setLoading(true);
    setError(null);
    setResetMessage(null);
    try {
      const msg = await forgotPassword(resetEmail.trim());
      setResetMessage(msg);
    } catch (err: any) {
      setError(err?.message || 'Unable to send password reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickClientLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const u = await quickLoginAs();
      onNavigate(u.role === 'ADMIN' ? 'admin-dashboard' : 'client-dashboard');
    } catch (err: any) {
      setError(err?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-10 h-10 mx-auto rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-teal-600/20">
            A
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {currentMode === 'sign-in'
              ? 'Sign In to Aethelgard'
              : currentMode === 'sign-up'
              ? 'Create Earner Account'
              : 'Password Recovery'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {currentMode === 'sign-in'
              ? 'Access your task feed, mining simulator, and digital asset ledger.'
              : currentMode === 'sign-up'
              ? 'Register to save your profile, tasks, and digital asset ledger.'
              : 'Enter your email to receive password recovery instructions.'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {resetMessage && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{resetMessage}</span>
          </div>
        )}

        {/* SIGN IN FORM */}
        {currentMode === 'sign-in' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full min-h-[44px] pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-base sm:text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setResetEmail(loginEmail);
                    setCurrentMode('forgot-password');
                  }}
                  className="min-h-[44px] sm:min-h-0 flex items-center text-[11px] text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full min-h-[44px] pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-base sm:text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white font-bold text-xs transition-all shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? 'Signing In...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setCurrentMode('sign-up');
                }}
                className="font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer py-2 px-1"
              >
                Sign Up
              </button>
            </div>
          </form>
        )}

        {/* SIGN UP FORM */}
        {currentMode === 'sign-up' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Legal Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="e.g. Jane Antoni"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full min-h-[44px] pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-base sm:text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full min-h-[44px] pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-base sm:text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full min-h-[44px] pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-base sm:text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Referral Code (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. AETH-9821"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-base sm:text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500 uppercase placeholder:normal-case"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Entering a referral code unlocks Bronze Tier hash rate perks immediately.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white font-bold text-xs transition-all shadow-md shadow-teal-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{loading ? 'Creating Account...' : 'Create Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setCurrentMode('sign-in');
                }}
                className="font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer py-2 px-1"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD */}
        {currentMode === 'forgot-password' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full min-h-[44px] pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-base sm:text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-60 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {loading ? 'Sending Reset Link...' : 'Send Password Reset Email'}
            </button>

            <button
              type="button"
              onClick={() => {
                setError(null);
                setResetMessage(null);
                setCurrentMode('sign-in');
              }}
              className="w-full min-h-[44px] py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              Return to Sign In
            </button>
          </form>
        )}

        {/* Quick Sign-In Shortcut (Email/Password Demo Client) */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="text-[11px] font-semibold text-slate-400 text-center uppercase tracking-wider">
            Quick Access
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={handleQuickClientLogin}
            className="w-full min-h-[44px] py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-800 dark:text-slate-200 hover:text-teal-600 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-500" />
            <span>Demo Client Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};
