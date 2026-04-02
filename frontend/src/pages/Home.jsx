import { useNavigate, Link } from "react-router-dom";
import { Zap, BrainCircuit, BellRing, BarChart3 } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  const features = [
    {
      icon: BrainCircuit,
      title: "Demand Prediction",
      desc: "Forecast demand with high accuracy.",
    },
    {
      icon: BellRing,
      title: "Reorder Alerts",
      desc: "Get notified before stockouts occur.",
    },
    {
      icon: BarChart3,
      title: "Data Insights",
      desc: "View clear analytics and track metrics.",
    },
  ];

  return (
    <div className="w-full min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">
      {/* We use overflow-x-hidden strictly on this wrapper to prevent width blowing out, but keep it off body to save Sticky Nav */}

      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="w-full max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">InventoryAI</span>
          </Link>

          <div className="hidden md:flex gap-8 text-sm font-medium text-gray-500">
            <a href="#home" className="hover:text-gray-900 transition-colors">Home</a>
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#about" className="hover:text-gray-900 transition-colors">About</a>
          </div>

          <button
            onClick={() => navigate("/login")}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 hover:shadow-md transition-all"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section id="home" className="w-full bg-grid-slate-50 relative">
        <div className="relative w-full max-w-7xl mx-auto px-6 py-24 grid lg:grid-cols-2 gap-16 items-center">

          {/* LEFT CONTENT */}
          <div className="space-y-6 max-w-xl z-10 w-full relative">
            <h1 className="text-5xl lg:text-6xl font-extrabold leading-[1.1] text-gray-900 tracking-tight">
              Smart Inventory <br /> Management with AI
            </h1>
            <p className="text-gray-600 text-xl font-medium max-w-md leading-relaxed">
              Predict demand and manage your stock intelligently.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => navigate("/login")}
                className="bg-blue-600 text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center"
              >
                Get Started
              </button>
              <a
                href="#features"
                className="bg-white border border-gray-200 text-gray-700 px-7 py-3.5 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* RIGHT DASHBOARD MOCK */}
          <div className="w-full flex justify-center lg:justify-end z-10">
            {/* Tightly bound container pushing to the right margin properly */}
            <div className="w-full max-w-[480px] bg-white border border-gray-100 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
              {/* Chrome Mock Window */}
              <div className="flex gap-2 p-4 bg-gray-50/50 border-b border-gray-100">
                <div className="w-3 h-3 bg-red-400 rounded-full shadow-sm"></div>
                <div className="w-3 h-3 bg-amber-400 rounded-full shadow-sm"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full shadow-sm"></div>
              </div>

              {/* Data Display */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Dashboard</h3>
                    <p className="text-xs text-gray-500 font-medium">Inventory Overview</p>
                  </div>
                  <span className="text-xs font-bold bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-md">
                    Optimal
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="border border-gray-100 bg-gray-50/50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Total</p>
                    <p className="font-extrabold text-2xl text-gray-900">1,248</p>
                  </div>
                  <div className="border border-blue-100 bg-blue-50/50 p-4 rounded-xl">
                    <p className="text-xs text-blue-600/80 font-semibold uppercase tracking-wider mb-1">Restock</p>
                    <p className="font-extrabold text-2xl text-blue-600">12</p>
                  </div>
                </div>

                {/* Growth Chart */}
                <div className="flex items-end gap-2 h-36 mt-2 pt-4 bg-gray-50/30 rounded-lg p-2 border border-gray-50">
                  {[45, 65, 40, 85, 70, 55, 95].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-blue-500 rounded-t-sm opacity-90"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="w-full py-24 bg-gray-50 border-y border-gray-100">
        <div className="w-full max-w-7xl mx-auto px-6">
          <div className="text-center md:text-left mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-xl">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight">Key Features</h2>
              <p className="text-gray-600 text-lg mt-3">
                Everything you need to modernize your supply chain.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="p-8 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
                    <Icon className="text-blue-600 w-6 h-6" strokeWidth={2} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full py-8 bg-white border-t border-gray-100">
        <div className="w-full max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500 font-medium">
          <p>© {new Date().getFullYear()} InventoryAI</p>
          <div className="flex gap-6 mt-4 sm:mt-0">
            <a href="#" className="hover:text-gray-900 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
