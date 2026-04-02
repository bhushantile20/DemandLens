import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Zap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  BrainCircuit,
  BellRing,
  BarChart3,
} from "lucide-react";

const PERKS = [
  { icon: BrainCircuit, text: "AI-powered demand predictions" },
  { icon: BellRing,     text: "Real-time reorder alerts" },
  { icon: BarChart3,    text: "Interactive inventory analytics" },
];

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    // Simulate auth — replace with real API call if needed
    setTimeout(() => {
      setLoading(false);
      navigate("/dashboard");
    }, 1200);
  }

  return (
    <div className="min-h-screen flex font-['Inter',sans-serif]">

      {/* ══════ LEFT PANEL (Branding) ══════ */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-gradient-to-br from-[#0B1220] via-[#0f1f3d] to-[#1a1040] p-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-[-80px] right-[-80px] w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-80px] left-[-80px] w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            Inventory<span className="text-blue-400">AI</span>
          </span>
        </div>

        {/* Main copy */}
        <div className="relative z-10">
          <span className="inline-block bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            Demand Dashboard
          </span>
          <h2 className="text-4xl font-extrabold text-white leading-snug mb-4">
            Predict. Reorder.{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Optimize.
            </span>
          </h2>
          <p className="text-slate-400 leading-relaxed mb-10 text-sm">
            Sign in to access your AI-powered inventory dashboard and unlock
            real-time demand predictions.
          </p>

          {/* Perks list */}
          <div className="flex flex-col gap-4">
            {PERKS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-sm text-slate-300">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stat row */}
        <div className="relative z-10 flex items-center gap-8 pt-8 border-t border-white/10">
          {[
            { val: "94.2%", label: "Accuracy" },
            { val: "~40%", label: "Cost Saved" },
            { val: "Real-time", label: "Alerts" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-lg font-bold text-white">{s.val}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══════ RIGHT PANEL (Form) ══════ */}
      <div className="flex flex-1 items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2.5 justify-center mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <Zap className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">
              Inventory<span className="text-blue-600">AI</span>
            </span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 md:p-10">

            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-extrabold text-slate-900 mb-1">
                Welcome back
              </h1>
              <p className="text-sm text-slate-500">
                Sign in to your InventoryAI account
              </p>
            </div>

            {/* Quick-fill hint */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2.5 mb-6">
              <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700 leading-relaxed">
                <span className="font-semibold">Demo mode:</span> Enter any email + password and click Sign In to access the dashboard.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="password"
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-2.5 rounded-xl">
                  {error}
                </div>
              )}

              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white rounded-lg px-6 py-3 flex items-center justify-center gap-2 w-full font-semibold hover:scale-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Bottom link */}
          <p className="text-center text-xs text-slate-500 mt-6">
            Back to{" "}
            <Link to="/" className="text-blue-600 font-semibold hover:text-blue-700">
              Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
