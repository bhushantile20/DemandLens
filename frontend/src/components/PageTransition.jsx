/**
 * PageTransition.jsx — DemandLens
 *
 * Rules:
 *  - "Stacking Shelves" animation:
 *      • Home  ( / )  → Login   (/login)        — always
 *      • Login (/login) → Dashboard (/dashboard) — ONCE per session only
 *  - For every other page change: a minimal dark circular spinner
 */
import { motion, AnimatePresence } from "framer-motion";
import { useLocation }             from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";

// ── Session flag — shelves shown once for login→dashboard ──────────────────
const SESSION_KEY = "demandlens_shelf_shown";

// ── Shelf animation config ─────────────────────────────────────────────────
const COLS        = 6;
const ROWS        = 2;
const TOTAL       = COLS * ROWS;
const LAND_SPRING = { type: "spring", stiffness: 380, damping: 34, mass: 0.7 };
const STAGGER     = 0.055;
const DROP_DUR    = 0.32;

// Time from overlay-appear until it starts exiting
const OVERLAY_HOLD = TOTAL * STAGGER + DROP_DUR + 0.26; // ~1.1s

// ── Helper: decide which animation to play ──────────────────────────────────
function getAnimationType(from, to) {
  const isHomeToLogin     = from === "/"      && to === "/login";
  const isLoginToDashboard = from === "/login" && to === "/dashboard";

  if (isHomeToLogin) return "shelves";

  if (isLoginToDashboard) {
    // Only show shelves once per session
    if (!sessionStorage.getItem(SESSION_KEY)) {
      sessionStorage.setItem(SESSION_KEY, "1");
      return "shelves";
    }
  }

  return "spinner"; // default for all other transitions
}

// ══════════════════════════════════════════════════════════════════════════════
//  SHELVES OVERLAY
// ══════════════════════════════════════════════════════════════════════════════

function ShelfBox({ col, row }) {
  const delay = (row * COLS + col) * STAGGER;
  return (
    <motion.div
      initial={{ y: -160, opacity: 0, scale: 0.85 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ ...LAND_SPRING, delay, opacity: { duration: 0.15, delay } }}
      style={{
        width: 36, height: 36, borderRadius: 7, flexShrink: 0,
        background: `linear-gradient(135deg,
          hsl(${215 + col * 8}, 80%, ${52 + row * 6}%) 0%,
          hsl(${265 + col * 5}, 72%, ${48 + row * 4}%) 100%)`,
        boxShadow: "0 0 14px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.13)",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    />
  );
}

function ShelfLine({ visible }) {
  return (
    <motion.div
      initial={{ scaleX: 0, opacity: 0 }}
      animate={visible ? { scaleX: 1, opacity: 1 } : {}}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={{
        height: 1, width: "100%", marginTop: 4,
        background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.55), rgba(139,92,246,0.55), transparent)",
        transformOrigin: "left center",
      }}
    />
  );
}

function ShelvesOverlay({ onDone }) {
  const [shelvesVisible, setShelvesVisible] = useState(false);

  useEffect(() => {
    const settle = TOTAL * STAGGER + DROP_DUR + 0.05;
    const t1 = setTimeout(() => setShelvesVisible(true), settle  * 1000);
    const t2 = setTimeout(() => onDone(),                OVERLAY_HOLD * 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <motion.div
      key="shelf-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
      transition={{ duration: 0.18 }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #0B1A3A 0%, #142850 50%, #1A1A40 100%)",
      }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1,    opacity: 1 }}
        exit={{    scale: 1.06, opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
      >
        {Array.from({ length: ROWS }).map((_, row) => (
          <div key={row} style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", gap: 8 }}>
              {Array.from({ length: COLS }).map((_, col) => (
                <ShelfBox key={col} col={col} row={row} />
              ))}
            </div>
            <ShelfLine visible={shelvesVisible} />
          </div>
        ))}

        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: shelvesVisible ? 1 : 0, y: shelvesVisible ? 0 : 6 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          style={{
            marginTop: 14, fontSize: 11, fontWeight: 700,
            letterSpacing: "0.18em", textTransform: "uppercase",
            color: "rgba(148,163,184,0.6)",
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          DemandLens · Organizing inventory…
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  SPINNER OVERLAY
// ══════════════════════════════════════════════════════════════════════════════

function SpinnerOverlay({ onDone }) {
  useEffect(() => {
    // Hold for 480ms — just enough to feel intentional, not jarring
    const t = setTimeout(() => onDone(), 480);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      key="spinner-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      transition={{ duration: 0.15 }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0a1628",
      }}
    >
      {/* Outer ring */}
      <div style={{ position: "relative", width: 48, height: 48 }}>
        {/* Track ring */}
        <div style={{
          position: "absolute", inset: 0,
          borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.08)",
        }} />
        {/* Spinning arc */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute", inset: 0,
            borderRadius: "50%",
            border: "3px solid transparent",
            borderTopColor: "#6366f1",
            borderRightColor: "#8b5cf6",
            boxShadow: "0 0 12px rgba(99,102,241,0.45)",
          }}
        />
        {/* Center glow dot */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          width: 6, height: 6, borderRadius: "50%",
          background: "#818cf8",
          boxShadow: "0 0 8px rgba(129,140,248,0.8)",
        }} />
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  PAGE CONTENT WRAPPER (fade-in)
// ══════════════════════════════════════════════════════════════════════════════

function PageIn({ children, pathKey }) {
  return (
    <motion.div
      key={pathKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      style={{ height: "100%", width: "100%" }}
    >
      {children}
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN EXPORT
// ══════════════════════════════════════════════════════════════════════════════

export default function PageTransition({ children }) {
  const { pathname }                      = useLocation();
  const [overlay, setOverlay]             = useState(null);  // null | "shelves" | "spinner"
  const [showContent, setShowContent]     = useState(true);
  const prevPath                          = useRef(pathname);
  const mountedRef                        = useRef(false);

  useEffect(() => {
    // Skip very first mount — no transition needed on initial load
    if (!mountedRef.current) { mountedRef.current = true; return; }
    if (pathname === prevPath.current) return;

    const from = prevPath.current;
    const to   = pathname;
    prevPath.current = to;

    const anim = getAnimationType(from, to);

    // Hide page → show overlay
    setShowContent(false);
    setOverlay(anim);
  }, [pathname]);

  const handleOverlayDone = useCallback(() => {
    setOverlay(null);
    setShowContent(true);
  }, []);

  return (
    <>
      {/* ── Overlay (full-screen, above everything) ── */}
      <AnimatePresence>
        {overlay === "shelves" && (
          <ShelvesOverlay key="shelves" onDone={handleOverlayDone} />
        )}
        {overlay === "spinner" && (
          <SpinnerOverlay key="spinner" onDone={handleOverlayDone} />
        )}
      </AnimatePresence>

      {/* ── Page content ── */}
      <AnimatePresence mode="wait">
        {showContent && (
          <PageIn key={pathname} pathKey={pathname}>
            {children}
          </PageIn>
        )}
      </AnimatePresence>
    </>
  );
}
