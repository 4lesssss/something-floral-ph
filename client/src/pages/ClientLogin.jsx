import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/Toast";
import Logo from "../components/Logo";
import "../styles/auth.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;

function validatePassword(pw) {
  const errors = [];
  if (pw.length < 6) errors.push("at least 6 characters");
  if (!/[a-z]/.test(pw)) errors.push("a lowercase letter");
  if (!/[A-Z]/.test(pw)) errors.push("an uppercase letter");
  if (!/[^a-zA-Z0-9]/.test(pw)) errors.push("a special character (!@#$%^&*)");
  return errors;
}

export default function ClientLogin() {
  const navigate = useNavigate();
  const { role, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState(false);

  // Forgot-password state
  // view: "login" | "forgot-email" | "forgot-code"
  const [view, setView] = useState("login");
  const [fpEmail, setFpEmail] = useState("");
  const [fpCode, setFpCode] = useState("");
  const [fpNewPassword, setFpNewPassword] = useState("");
  const [fpConfirmPassword, setFpConfirmPassword] = useState("");
  const [fpShowPwd, setFpShowPwd] = useState(false);
  const [fpError, setFpError] = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  const [fpSuccess, setFpSuccess] = useState("");

  useEffect(() => {
    if (role === "client") navigate("/", { replace: true });
  }, [role, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await api.clientLogin({ email, password });
      await login(data);
      toast("Welcome back!");
      navigate("/");
    } catch {
      setError(true);
    }
  };

  // ── Forgot Password: Step 1 — send code ───────────────
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setFpError("");
    setFpSuccess("");

    if (!fpEmail.trim() || !EMAIL_REGEX.test(fpEmail.trim())) {
      setFpError("Please enter a valid email address.");
      return;
    }

    setFpLoading(true);
    try {
      const data = await api.forgotPassword({ email: fpEmail.trim() });
      setFpSuccess(data.message || "Reset code sent!");
      setView("forgot-code");
    } catch (err) {
      setFpError(err.message || "Something went wrong. Please try again.");
    } finally {
      setFpLoading(false);
    }
  };

  // ── Forgot Password: Step 2 — verify code + reset ─────
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setFpError("");
    setFpSuccess("");

    if (!fpCode.trim() || fpCode.trim().length !== 6) {
      setFpError("Please enter the 6-digit code from your email.");
      return;
    }

    const pwErrors = validatePassword(fpNewPassword);
    if (pwErrors.length > 0) {
      setFpError("Password must have " + pwErrors.join(", ") + ".");
      return;
    }

    if (fpNewPassword !== fpConfirmPassword) {
      setFpError("Passwords do not match.");
      return;
    }

    setFpLoading(true);
    try {
      const data = await api.resetPassword({
        email: fpEmail.trim(),
        code: fpCode.trim(),
        newPassword: fpNewPassword,
      });
      toast(data.message || "Password reset successfully!");
      // Return to login
      resetForgotState();
    } catch (err) {
      setFpError(err.message || "Invalid or expired code.");
    } finally {
      setFpLoading(false);
    }
  };

  const resetForgotState = () => {
    setView("login");
    setFpEmail("");
    setFpCode("");
    setFpNewPassword("");
    setFpConfirmPassword("");
    setFpShowPwd(false);
    setFpError("");
    setFpSuccess("");
    setFpLoading(false);
  };

  // ── Login View ─────────────────────────────────────────
  if (view === "login") {
    return (
      <div className="auth-page">
        <div className="floral-blob floral-blob--pink auth-blob-pink" aria-hidden="true" />
        <div className="floral-blob floral-blob--green auth-blob-green" aria-hidden="true" />
        <div className="auth-card">
          <div className="auth-logo">
            <Logo variant="auth" />
            <span className="client-badge">🌿 Client Portal</span>
          </div>
          <h2 style={{ textAlign: "center" }}>Welcome Back</h2>
          <p className="auth-sub" style={{ textAlign: "center" }}>Sign in to track orders and manage your profile.</p>

          <form id="clientLoginForm" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="clientEmail">Email Address</label>
              <input
                type="email"
                id="clientEmail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="clientPassword">Password</label>
              <div className="input-wrap">
                <input
                  type={showPwd ? "text" : "password"}
                  id="clientPassword"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: "1rem" }}
                  required
                />
                <button type="button" className="password-toggle" onClick={() => setShowPwd((v) => !v)}>
                  {showPwd ? "Hide" : "Show"}
                </button>
              </div>
              <button
                type="button"
                className="forgot-password-link"
                onClick={() => { setView("forgot-email"); setFpError(""); setFpSuccess(""); }}
              >
                Forgot password?
              </button>
            </div>
            {error && (
              <p className="auth-error visible" id="loginError">
                Invalid email or password.
              </p>
            )}
            <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
              Sign In
            </button>
            <p className="form-note" style={{ textAlign: "center", marginTop: "0.75rem" }}>
              No account? <Link to="/account/signup">Create one</Link>
            </p>
            <p className="form-note admin-link-note" style={{ textAlign: "center", marginTop: "0.5rem" }}>
              Admin? <Link to="/admin/login">Sign in here</Link>
            </p>
          </form>
        </div>
      </div>
    );
  }

  // ── Forgot Password: Step 1 — Enter Email ─────────────
  if (view === "forgot-email") {
    return (
      <div className="auth-page">
        <div className="floral-blob floral-blob--pink auth-blob-pink" aria-hidden="true" />
        <div className="floral-blob floral-blob--green auth-blob-green" aria-hidden="true" />
        <div className="auth-card">
          <div className="auth-logo">
            <Logo variant="auth" />
            <span className="client-badge">🔐 Reset Password</span>
          </div>
          <h2 style={{ textAlign: "center" }}>Forgot Password</h2>
          <p className="auth-sub" style={{ textAlign: "center" }}>
            Enter your account email and we&apos;ll send a 6-digit reset code.
          </p>

          <form onSubmit={handleForgotSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="fpEmail">Email Address</label>
              <input
                type="email"
                id="fpEmail"
                value={fpEmail}
                onChange={(e) => { setFpEmail(e.target.value); setFpError(""); }}
                placeholder="you@email.com"
                required
                autoFocus
              />
            </div>
            {fpError && <p className="auth-error visible">{fpError}</p>}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: "100%" }}
              disabled={fpLoading}
            >
              {fpLoading ? "Sending…" : "Send Reset Code"}
            </button>
            <p className="form-note" style={{ textAlign: "center", marginTop: "0.75rem" }}>
              <button type="button" className="forgot-password-link" onClick={resetForgotState}>
                ← Back to Sign In
              </button>
            </p>
          </form>
        </div>
      </div>
    );
  }

  // ── Forgot Password: Step 2 — Enter Code + New Password
  return (
    <div className="auth-page">
      <div className="floral-blob floral-blob--pink auth-blob-pink" aria-hidden="true" />
      <div className="floral-blob floral-blob--green auth-blob-green" aria-hidden="true" />
      <div className="auth-card">
        <div className="auth-logo">
          <Logo variant="auth" />
          <span className="client-badge">🔐 Reset Password</span>
        </div>
        <h2 style={{ textAlign: "center" }}>Enter Reset Code</h2>
        <p className="auth-sub" style={{ textAlign: "center" }}>
          We sent a 6-digit code to <strong>{fpEmail}</strong>. Enter it below with your new password.
        </p>

        <form onSubmit={handleResetSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="fpCode">6-Digit Code</label>
            <input
              type="text"
              id="fpCode"
              value={fpCode}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                setFpCode(digits);
                setFpError("");
              }}
              placeholder="000000"
              maxLength={6}
              required
              autoFocus
              style={{ textAlign: "center", letterSpacing: "0.5em", fontSize: "1.25rem", fontWeight: 700 }}
            />
          </div>
          <div className="form-group">
            <label htmlFor="fpNewPassword">New Password</label>
            <div className="input-wrap">
              <input
                type={fpShowPwd ? "text" : "password"}
                id="fpNewPassword"
                value={fpNewPassword}
                onChange={(e) => { setFpNewPassword(e.target.value); setFpError(""); }}
                style={{ paddingLeft: "1rem" }}
                required
              />
              <button type="button" className="password-toggle" onClick={() => setFpShowPwd((v) => !v)}>
                {fpShowPwd ? "Hide" : "Show"}
              </button>
            </div>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Min 6 characters, uppercase, lowercase, and a special character.
            </p>
          </div>
          <div className="form-group">
            <label htmlFor="fpConfirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="fpConfirmPassword"
              value={fpConfirmPassword}
              onChange={(e) => { setFpConfirmPassword(e.target.value); setFpError(""); }}
              required
            />
          </div>
          {fpError && <p className="auth-error visible">{fpError}</p>}
          {fpSuccess && <p className="auth-success visible">{fpSuccess}</p>}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={fpLoading}
          >
            {fpLoading ? "Resetting…" : "Reset Password"}
          </button>
          <p className="form-note" style={{ textAlign: "center", marginTop: "0.75rem" }}>
            <button type="button" className="forgot-password-link" onClick={() => setView("forgot-email")}>
              ← Didn&apos;t get a code? Go back
            </button>
          </p>
          <p className="form-note" style={{ textAlign: "center", marginTop: "0.35rem" }}>
            <button type="button" className="forgot-password-link" onClick={resetForgotState}>
              ← Back to Sign In
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
