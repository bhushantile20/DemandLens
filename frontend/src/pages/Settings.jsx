import { useState, useEffect } from "react";
import { User, Mail, Lock, CheckCircle2, XCircle, Eye, EyeOff, Shield } from "lucide-react";
import { useUser } from "../context/UserContext";
import { updateName, updateEmail, updatePassword } from "../services/api";

/* ─────────────────────────────────────────────────────────
   Tiny toast hook — status can be "success" | "error" | null
───────────────────────────────────────────────────────── */
function useToast() {
  const [toast, setToast] = useState(null); // { type, msg }
  function show(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3200);
  }
  return { toast, show };
}

/* ─────────────────────────────────────────────────────────
   Password strength helpers
───────────────────────────────────────────────────────── */
function getStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0-4
}
const STRENGTH_LABEL = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLOR = ["", "#ef4444", "#f97316", "#22c55e", "#16a34a"];

/* ─────────────────────────────────────────────────────────
   Reusable card wrapper
───────────────────────────────────────────────────────── */
function SettingsCard({ icon: Icon, title, description, children }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "16px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        overflow: "hidden",
        marginBottom: "20px",
      }}
    >
      {/* Card header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
          padding: "20px 24px",
          borderBottom: "1px solid #f1f5f9",
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(59,130,246,0.25)",
          }}
        >
          <Icon style={{ width: "17px", height: "17px", color: "#fff" }} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>
            {title}
          </h3>
          <p style={{ margin: 0, marginTop: "3px", fontSize: "12px", color: "#64748b" }}>
            {description}
          </p>
        </div>
      </div>

      {/* Card body */}
      <div style={{ padding: "24px" }}>{children}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Toast component
───────────────────────────────────────────────────────── */
function Toast({ toast }) {
  if (!toast) return null;
  const isSuccess = toast.type === "success";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginTop: "12px",
        padding: "10px 14px",
        borderRadius: "10px",
        fontSize: "13px",
        fontWeight: 500,
        background: isSuccess ? "#f0fdf4" : "#fff1f2",
        color: isSuccess ? "#15803d" : "#be123c",
        border: `1px solid ${isSuccess ? "#bbf7d0" : "#fecdd3"}`,
        animation: "fadeSlideIn 0.25s ease",
      }}
    >
      {isSuccess
        ? <CheckCircle2 style={{ width: "15px", height: "15px", flexShrink: 0 }} />
        : <XCircle style={{ width: "15px", height: "15px", flexShrink: 0 }} />}
      {toast.msg}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Styled Input helper
───────────────────────────────────────────────────────── */
function FieldInput({ id, type = "text", value, onChange, placeholder, suffix }) {
  return (
    <div style={{ position: "relative" }}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: suffix ? "10px 42px 10px 14px" : "10px 14px",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
          background: "#f8fafc",
          fontSize: "14px",
          color: "#1e293b",
          outline: "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#3b82f6";
          e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)";
          e.target.style.background = "#fff";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#e2e8f0";
          e.target.style.boxShadow = "none";
          e.target.style.background = "#f8fafc";
        }}
      />
      {suffix && (
        <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)" }}>
          {suffix}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   SaveButton with spinner
───────────────────────────────────────────────────────── */
function SaveButton({ loading, children, ...props }) {
  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      style={{
        marginTop: "14px",
        padding: "10px 22px",
        borderRadius: "10px",
        border: "none",
        background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
        color: "#fff",
        fontSize: "13px",
        fontWeight: 600,
        cursor: loading ? "not-allowed" : "pointer",
        opacity: loading ? 0.7 : 1,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        transition: "opacity 0.15s, transform 0.1s",
        boxShadow: "0 2px 8px rgba(59,130,246,0.3)",
      }}
      onMouseEnter={(e) => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
    >
      {loading && (
        <svg
          style={{ width: "14px", height: "14px", animation: "spin 0.7s linear infinite" }}
          viewBox="0 0 24 24" fill="none"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
          <path opacity="0.75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN SETTINGS PAGE
═══════════════════════════════════════════════════════ */
export default function Settings() {
  const { user, updateUser } = useUser();

  /* ── Update Name ── */
  const [nameVal, setNameVal] = useState(user.name);
  const [nameLoading, setNameLoading] = useState(false);
  const { toast: nameToast, show: showNameToast } = useToast();

  async function handleSaveName(e) {
    e.preventDefault();
    const trimmed = nameVal.trim();
    if (!trimmed) { showNameToast("error", "Name cannot be empty."); return; }
    if (trimmed.length < 2) { showNameToast("error", "Name must be at least 2 characters."); return; }
    setNameLoading(true);
    try {
      await updateName(trimmed);
      updateUser({ name: trimmed });
      showNameToast("success", "Name updated successfully!");
    } catch (err) {
      showNameToast("error", err?.response?.data?.error || "Failed to update name.");
    } finally {
      setNameLoading(false);
    }
  }

  /* ── Update Email ── */
  const [emailVal, setEmailVal] = useState(user.email);
  const [emailLoading, setEmailLoading] = useState(false);
  const { toast: emailToast, show: showEmailToast } = useToast();

  function isValidEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  async function handleSaveEmail(e) {
    e.preventDefault();
    const trimmed = emailVal.trim();
    if (!trimmed) { showEmailToast("error", "Email cannot be empty."); return; }
    if (!isValidEmail(trimmed)) { showEmailToast("error", "Please enter a valid email address."); return; }
    setEmailLoading(true);
    try {
      await updateEmail(trimmed);
      updateUser({ email: trimmed });
      showEmailToast("success", "Email updated successfully!");
    } catch (err) {
      showEmailToast("error", err?.response?.data?.error || "Failed to update email.");
    } finally {
      setEmailLoading(false);
    }
  }

  /* ── Update Password ── */
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const { toast: pwToast, show: showPwToast } = useToast();

  const strength = getStrength(newPw);

  async function handleSavePassword(e) {
    e.preventDefault();
    if (!currentPw) { showPwToast("error", "Please enter your current password."); return; }
    if (newPw.length < 8) { showPwToast("error", "New password must be at least 8 characters."); return; }
    if (strength < 2) { showPwToast("error", "Password is too weak. Add uppercase letters, numbers, or symbols."); return; }
    if (newPw !== confirmPw) { showPwToast("error", "New password and confirmation do not match."); return; }
    setPwLoading(true);
    try {
      await updatePassword(currentPw, newPw);
      showPwToast("success", "Password changed successfully!");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err) {
      showPwToast("error", err?.response?.data?.error || "Failed to update password.");
    } finally {
      setPwLoading(false);
    }
  }

  /* keep fields in sync if user changes from another source */
  useEffect(() => { setNameVal(user.name); }, [user.name]);
  useEffect(() => { setEmailVal(user.email); }, [user.email]);

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(-4px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div
        style={{
          maxWidth: "680px",
          margin: "0 auto",
          padding: "32px 24px 48px",
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {/* Page header */}
        <div style={{ marginBottom: "28px" }}>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#0f172a" }}>
            Account Settings
          </h2>
          <p style={{ margin: 0, marginTop: "6px", fontSize: "13px", color: "#64748b" }}>
            Manage your profile information and security preferences.
          </p>
        </div>

        {/* ── Card 1: Update Name ── */}
        <SettingsCard
          icon={User}
          title="Display Name"
          description="Your name is shown in the navbar and throughout the app."
        >
          <form onSubmit={handleSaveName}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
              Full Name
            </label>
            <FieldInput
              id="settings-name"
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              placeholder="Enter your full name"
            />
            <Toast toast={nameToast} />
            <SaveButton id="save-name-btn" loading={nameLoading} type="submit">
              {nameLoading ? "Saving…" : "Save Name"}
            </SaveButton>
          </form>
        </SettingsCard>

        {/* ── Card 2: Update Email ── */}
        <SettingsCard
          icon={Mail}
          title="Email Address"
          description="Used for notifications and account recovery."
        >
          <form onSubmit={handleSaveEmail}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
              Email Address
            </label>
            <FieldInput
              id="settings-email"
              type="email"
              value={emailVal}
              onChange={(e) => setEmailVal(e.target.value)}
              placeholder="you@company.com"
            />
            <Toast toast={emailToast} />
            <SaveButton id="save-email-btn" loading={emailLoading} type="submit">
              {emailLoading ? "Saving…" : "Save Email"}
            </SaveButton>
          </form>
        </SettingsCard>

        {/* ── Card 3: Update Password ── */}
        <SettingsCard
          icon={Lock}
          title="Change Password"
          description="Use a strong password with at least 8 characters."
        >
          <form onSubmit={handleSavePassword}>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Current password */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                  Current Password
                </label>
                <FieldInput
                  id="settings-current-pw"
                  type={showCurrent ? "text" : "password"}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Enter current password"
                  suffix={
                    <button type="button" onClick={() => setShowCurrent((v) => !v)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
                      {showCurrent
                        ? <EyeOff style={{ width: "15px", height: "15px" }} />
                        : <Eye style={{ width: "15px", height: "15px" }} />}
                    </button>
                  }
                />
              </div>

              {/* New password + strength bar */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                  New Password
                </label>
                <FieldInput
                  id="settings-new-pw"
                  type={showNew ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Minimum 8 characters"
                  suffix={
                    <button type="button" onClick={() => setShowNew((v) => !v)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
                      {showNew
                        ? <EyeOff style={{ width: "15px", height: "15px" }} />
                        : <Eye style={{ width: "15px", height: "15px" }} />}
                    </button>
                  }
                />
                {/* Strength bar */}
                {newPw.length > 0 && (
                  <div style={{ marginTop: "8px" }}>
                    <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                      {[1, 2, 3, 4].map((n) => (
                        <div
                          key={n}
                          style={{
                            flex: 1,
                            height: "4px",
                            borderRadius: "4px",
                            background: n <= strength ? STRENGTH_COLOR[strength] : "#e2e8f0",
                            transition: "background 0.2s",
                          }}
                        />
                      ))}
                    </div>
                    <p style={{ margin: 0, fontSize: "11px", color: STRENGTH_COLOR[strength], fontWeight: 600 }}>
                      {STRENGTH_LABEL[strength]}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                  Confirm New Password
                </label>
                <FieldInput
                  id="settings-confirm-pw"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Re-enter new password"
                  suffix={
                    <button type="button" onClick={() => setShowConfirm((v) => !v)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
                      {showConfirm
                        ? <EyeOff style={{ width: "15px", height: "15px" }} />
                        : <Eye style={{ width: "15px", height: "15px" }} />}
                    </button>
                  }
                />
                {/* Match indicator */}
                {confirmPw.length > 0 && (
                  <p style={{
                    margin: 0, marginTop: "5px", fontSize: "11px", fontWeight: 600,
                    color: confirmPw === newPw ? "#16a34a" : "#ef4444",
                    display: "flex", alignItems: "center", gap: "4px",
                  }}>
                    {confirmPw === newPw
                      ? <><CheckCircle2 style={{ width: "12px" }} /> Passwords match</>
                      : <><XCircle style={{ width: "12px" }} /> Passwords do not match</>}
                  </p>
                )}
              </div>
            </div>

            <Toast toast={pwToast} />

            {/* Security note */}
            <div style={{
              marginTop: "14px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 12px",
              background: "#f0f9ff",
              borderRadius: "8px",
              border: "1px solid #bae6fd",
            }}>
              <Shield style={{ width: "12px", height: "12px", color: "#0284c7", flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: "11px", color: "#0369a1" }}>
                Password is stored securely using Django's built-in PBKDF2 hashing.
              </p>
            </div>

            <SaveButton id="save-password-btn" loading={pwLoading} type="submit">
              {pwLoading ? "Saving…" : "Change Password"}
            </SaveButton>
          </form>
        </SettingsCard>
      </div>
    </>
  );
}
