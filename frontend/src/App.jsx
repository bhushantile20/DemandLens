import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

import Sidebar    from "./components/Sidebar";
import Navbar     from "./components/Navbar";

import Home        from "./pages/Home";
import Login       from "./pages/Login";
import Dashboard   from "./pages/Dashboard";
import ItemsList   from "./pages/ItemsList";
import ItemDetail  from "./pages/ItemDetail";
import Alerts      from "./pages/Alerts";
import DataQuality from "./pages/DataQuality";
import Forecasting from './pages/Forecasting';
import Settings    from "./pages/Settings";


/**
 * AppShell — wraps authenticated pages with Sidebar + Navbar.
 */
function AppShell({ children }) {
  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
      <Sidebar />
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0, overflow: "hidden", background: "#f8fafc" }}>
        <Navbar />
        <main style={{ flex: 1, overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Full-page public routes (NO sidebar, NO navbar) ── */}
        <Route path="/"      element={<Home />} />
        <Route path="/login" element={<Login />} />

        {/* ── App routes — each explicitly wrapped in AppShell ── */}
        <Route path="/dashboard"     element={<AppShell><Dashboard /></AppShell>} />
        <Route path="/items"         element={<AppShell><ItemsList /></AppShell>} />
        <Route path="/items/:id"     element={<AppShell><ItemDetail /></AppShell>} />
        <Route path="/forecasting"    element={<AppShell><Forecasting /></AppShell>} />
        <Route path="/alerts"        element={<AppShell><Alerts /></AppShell>} />
        <Route path="/data-quality"  element={<AppShell><DataQuality /></AppShell>} />
        <Route path="/settings"      element={<AppShell><Settings /></AppShell>} />

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
