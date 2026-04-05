import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Zap, Mail, Lock, Eye, EyeOff, ArrowRight,
  User, BrainCircuit, BellRing, BarChart3, CheckCircle2,
} from "lucide-react";

const PERKS = [
  { icon: BrainCircuit, text: "Hybrid ML forecasts combining statistical and deep learning models" },
  { icon: BellRing,     text: "Dynamic reorder recommendations based on predicted demand" },
  { icon: BarChart3,    text: "Visual dashboards with real-time consumption and trend analysis" },
];

export default function Register() {
  const navigate = useNavigate();
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [success, setSuccess]   = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    // Save credentials to localStorage so Login can verify them
    const existing = JSON.parse(localStorage.getItem("dl_users") || "[]");
    const alreadyExists = existing.find((u) => u.email === email);
    if (alreadyExists) {
      setError("An account with this email already exists.");
      return;
    }

    existing.push({ name, email, password });
    localStorage.setItem("dl_users", JSON.stringify(existing));

    setLoading(true);
    setSuccess(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/login");
    }, 1500);
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
            Demand<span className="text-blue-400">Lens</span>
          </span>
        </div>

        {/* Main copy */}
        <div className="relative z-10">
          <span className="inline-block bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            Create Your Account
          </span>
          <h2 className="text-4xl font-extrabold text-white leading-snug mb-4">
            Start predicting.{" "}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Today.
            </span>
          </h2>
          <p className="text-slate-400 leading-relaxed mb-10 text-sm">
            Join DemandLens and unlock AI-powered inventory intelligence — from demand forecasting to automated reorder suggestions.
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
            { val: "94.2%", label: "Accuracy",  sub: "On recent demand patterns" },
            { val: "~40%",  label: "Cost Saved", sub: "Overstock & stockout reduction" },
            { val: "Real-time", label: "Alerts", sub: "Instant inventory risk signals" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-lg font-bold text-white">{s.val}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
              <div className="text-[10px] text-slate-600 mt-0.5">{s.sub}</div>
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
              Demand<span className="text-blue-600">Lens</span>
            </span>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8 md:p-10">

            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900 mb-1">
                Create account
              </h1>
              <p className="text-sm text-slate-500">
                Join <span className="font-semibold text-slate-700">DemandLens</span> — it's free to get started
              </p>
            </div>

            {/* Success state */}
            {success && (
              <div className="bg-green-50 border border-green-100 rounded-xl p-3.5 flex items-center gap-2.5 mb-5">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <p className="text-xs text-green-700 font-semibold">
                  Account created! Redirecting to login…
                </p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="reg-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="reg-email"
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
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="reg-password"
                    type={showPass ? "text" : "password"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    id="reg-confirm"
                    type={showConf ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  />
                  <button type="button" onClick={() => setShowConf(!showConf)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showConf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-xs px-4 py-2.5 rounded-xl font-medium">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                id="register-submit"
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white rounded-xl px-6 py-3 flex items-center justify-center gap-2 w-full font-bold text-sm hover:bg-blue-700 hover:scale-[1.02] transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 mt-1"
                style={{ boxShadow: "0 0 20px rgba(37,99,235,0.3)" }}
              >
                {loading ? (
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <>Create Account <ArrowRight className="w-4 h-4 ml-1" /></>
                )}
              </button>
            </form>
          </div>

          {/* Bottom link */}
          <p className="text-center text-xs text-slate-500 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
