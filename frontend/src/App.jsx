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

/**
 * AppShell — wraps authenticated pages with Sidebar + Navbar.
 * Only used on /dashboard, /items, /alerts, /data-quality.
 * Home and Login render WITHOUT this wrapper.
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
        <Route path="/alerts"        element={<AppShell><Alerts /></AppShell>} />
        <Route path="/data-quality"  element={<AppShell><DataQuality /></AppShell>} />

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
