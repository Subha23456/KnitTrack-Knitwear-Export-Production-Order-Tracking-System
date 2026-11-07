import React, { useState } from 'react';
import { User, DemoCredential } from '../types';
import { 
  ShieldCheck, 
  UserCheck, 
  Smartphone, 
  ShoppingBag, 
  TrendingUp, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  onLoginWithCredentials: (email: string, password?: string) => Promise<User>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onLoginWithCredentials,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('tiruppur123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const demoAccounts = [
    {
      id: 'user-merchandiser-1',
      name: 'Priya Rajan',
      role: 'merchandiser',
      roleLabel: 'Senior Merchandiser',
      email: 'priya.rajan@companya-knits.com',
      password: 'tiruppur123',
      organization: 'Company A (Tiruppur)',
      icon: UserCheck,
      color: 'border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-900',
      badgeColor: 'bg-blue-100 text-blue-800',
      destination: 'Production Order Board',
      description: 'Create POs, review TNA schedules, inspect mathematical run-rate proofs, and audit delay warnings.',
    },
    {
      id: 'user-supervisor-1',
      name: 'Murugan Kandasamy (முருகன்)',
      role: 'supervisor',
      roleLabel: 'Floor Supervisor',
      email: 'murugan.unit1@companya-knits.com',
      password: 'tiruppur123',
      organization: 'Unit 1 (Kangeyam Rd)',
      icon: Smartphone,
      color: 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-900',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      destination: 'Floor Supervisor Mobile (தமிழ்)',
      description: 'Mobile touch steppers (+100, +250, +500), Tamil audio/text input, offline queue & 1-tap sync.',
    },
    {
      id: 'user-buyer-b',
      name: 'John Smith',
      role: 'buyer',
      roleLabel: 'Buyer (Company B - UK)',
      email: 'j.smith@companyb-retail.co.uk',
      password: 'tiruppur123',
      organization: 'Company B (UK)',
      icon: ShoppingBag,
      color: 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-900',
      badgeColor: 'bg-indigo-100 text-indigo-800',
      destination: 'Buyer Portal (Company B POs only)',
      description: 'Strict multi-tenant isolation: sees only B-PO-88213 & B-PO-88240, milestones, QC photos, and CSV export.',
    },
    {
      id: 'user-buyer-c',
      name: 'Hans Weber',
      role: 'buyer',
      roleLabel: 'Buyer (Company C - Germany)',
      email: 'h.weber@companyc-textil.de',
      password: 'tiruppur123',
      organization: 'Company C (Germany)',
      icon: ShoppingBag,
      color: 'border-purple-200 bg-purple-50/50 hover:bg-purple-50 text-purple-900',
      badgeColor: 'bg-purple-100 text-purple-800',
      destination: 'Buyer Portal (Company C POs only)',
      description: 'Strict multi-tenant isolation: sees only C-PO-0488. Zero access to Company B styles.',
    },
    {
      id: 'user-md-1',
      name: 'K. Shanmugam',
      role: 'md',
      roleLabel: 'Managing Director (MD)',
      email: 'ks@companya-knits.com',
      password: 'tiruppur123',
      organization: 'Company A (Tiruppur)',
      icon: TrendingUp,
      color: 'border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-900',
      badgeColor: 'bg-amber-100 text-amber-800',
      destination: 'Executive Financial Dashboard',
      description: 'Company A annual ₹1.08 Cr loss model, air freight exposure (₹3.50L), and season progress.',
    },
  ];

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter an email address.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await onLoginWithCredentials(email.trim(), password);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password credentials. Please try again or select a demo account.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (acc: typeof demoAccounts[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await onLoginWithCredentials(acc.email, acc.password);
      onLoginSuccess(user);
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to log in as ${acc.name}. Please check server connection.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full mx-auto space-y-8">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white font-bold text-lg mb-3 shadow-sm">
            TT
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            TexTrack Tiruppur · KnitTrack
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto">
            Production Order-Tracking System for Tiruppur Knitwear Exporters with TNA Milestones, Run-Rate Mathematics, Tamil Voice Floor Updates, and Isolated Buyer Portals.
          </p>
        </div>

        {/* Error notification banner */}
        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-rose-500 hover:text-rose-700 font-bold ml-4"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Grid: Credentials Form (Left) & Quick Persona Cards (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Standard Authentication */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-600" />
                Secure Staff & Buyer Login
              </h2>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                SQLite Auth
              </span>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. priya.rajan@companya-knits.com"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Demo default: <code className="font-mono text-slate-600">tiruppur123</code>
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-10 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 p-1 rounded transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying session...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
              <p className="flex items-center gap-1.5 text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Session security enforced on all orders & photos
              </p>
              <p className="text-slate-400">
                Multi-tenant: buyers access only their contracted POs.
              </p>
            </div>
          </div>

          {/* Right Column: 1-Click Demo Reviewer Personas */}
          <div className="lg:col-span-7 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1-Click Reviewer Demo Logins
              </span>
              <span className="text-[11px] text-slate-500">
                Select any role to test end-to-end
              </span>
            </div>

            <div className="space-y-2.5">
              {demoAccounts.map((acc) => {
                const IconComponent = acc.icon;
                return (
                  <button
                    key={acc.id}
                    onClick={() => handleQuickLogin(acc)}
                    disabled={isLoading}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 shadow-2xs ${acc.color} ${
                      isLoading ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-white/80 shrink-0 mt-0.5 shadow-2xs">
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-slate-900 truncate">
                          {acc.name}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${acc.badgeColor}`}>
                          {acc.roleLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                        <span>{acc.email}</span>
                        <span>·</span>
                        <span className="text-slate-400 truncate">{acc.organization}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                        {acc.description}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-slate-900">
                        <span>Opens:</span>
                        <span className="font-semibold underline decoration-slate-300 underline-offset-2">
                          {acc.destination}
                        </span>
                        <ArrowRight className="w-3 h-3 ml-0.5" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
