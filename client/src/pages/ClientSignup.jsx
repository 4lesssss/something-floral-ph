import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/Toast";
import Logo from "../components/Logo";
import "../styles/auth.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^09\d{9}$/;

function validatePassword(pw) {
  const errors = [];
  if (pw.length < 6) errors.push("at least 6 characters");
  if (!/[a-z]/.test(pw)) errors.push("a lowercase letter");
  if (!/[A-Z]/.test(pw)) errors.push("an uppercase letter");
  if (!/[^a-zA-Z0-9]/.test(pw)) errors.push("a special character (!@#$%^&*)");
  return errors;
}

export default function ClientSignup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showTerms, setShowTerms] = useState(false);

  const update = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((e) => ({ ...e, [field]: "" }));
    }
    if (error) setError("");
  };

  // Phone: strip non-digits, cap at 11
  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
    update("phone", digits);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};

    // First / Last name
    if (!form.firstName.trim()) errs.firstName = "First name is required.";
    else if (form.firstName.trim().length > 50) errs.firstName = "Max 50 characters.";
    if (!form.lastName.trim()) errs.lastName = "Last name is required.";
    else if (form.lastName.trim().length > 50) errs.lastName = "Max 50 characters.";

    // Email
    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!EMAIL_REGEX.test(form.email.trim())) errs.email = "Please enter a valid email address.";

    // Phone
    if (form.phone && !PHONE_REGEX.test(form.phone))
      errs.phone = "Must be a valid PH mobile number (e.g. 09171234567).";

    // Password strength
    const pwErrors = validatePassword(form.password);
    if (pwErrors.length > 0) {
      errs.password = "Password must have " + pwErrors.join(", ") + ".";
    }

    // Confirm password
    if (form.password !== form.confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }

    // Terms
    if (!form.terms) {
      errs.terms = "Please accept the terms to continue.";
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    try {
      const data = await api.clientRegister({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone,
        password: form.password,
      });
      await login(data);
      toast("Account created! Welcome to Something Floral PH.");
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  const FieldError = ({ name }) =>
    fieldErrors[name] ? (
      <p style={{ color: "#c0392b", fontSize: "0.78rem", marginTop: "0.25rem" }} role="alert">
        {fieldErrors[name]}
      </p>
    ) : null;

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <Logo variant="auth" />
          <span className="client-badge">🌿 Join Us</span>
        </div>
        <h2 style={{ textAlign: "center" }}>Create Account</h2>
        <p className="auth-sub" style={{ textAlign: "center" }}>Register to track reservations and save your details.</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                id="firstName"
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                maxLength={50}
                required
              />
              <FieldError name="firstName" />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                id="lastName"
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                maxLength={50}
                required
              />
              <FieldError name="lastName" />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="signupEmail">Email *</label>
            <input
              type="email"
              id="signupEmail"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@email.com"
              required
            />
            <FieldError name="email" />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              type="tel"
              id="phone"
              value={form.phone}
              onChange={handlePhoneChange}
              placeholder="09XX XXX XXXX"
              maxLength={11}
            />
            <FieldError name="phone" />
          </div>
          <div className="form-group">
            <label htmlFor="signupPassword">Password *</label>
            <div className="input-wrap">
              <input
                type={showPwd ? "text" : "password"}
                id="signupPassword"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                style={{ paddingLeft: "1rem" }}
                required
              />
              <button type="button" className="password-toggle" onClick={() => setShowPwd((v) => !v)}>
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
              Min 6 characters, uppercase, lowercase, and a special character.
            </p>
            <FieldError name="password" />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              required
            />
            <FieldError name="confirmPassword" />
          </div>
          <div className="form-check">
            <input
              type="checkbox"
              id="terms"
              checked={form.terms}
              onChange={(e) => update("terms", e.target.checked)}
            />
            <label htmlFor="terms">
              I agree to the <button type="button" onClick={() => setShowTerms(true)} className="link-button">terms and privacy policy</button>.
            </label>
          </div>
          <FieldError name="terms" />
          {error && <p className="auth-error visible">{error}</p>}
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
            Create Account
          </button>
          <p className="form-note" style={{ textAlign: "center", marginTop: "0.75rem" }}>
            Already have an account? <Link to="/account/login">Sign in</Link>
          </p>
        </form>
      </div>

      {showTerms && (
        <div className="modal-overlay" onClick={() => setShowTerms(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: "#fff", padding: "2rem", borderRadius: "8px", maxWidth: "500px", width: "90%", maxHeight: "80vh", overflowY: "auto", position: "relative" }}>
            <button onClick={() => setShowTerms(false)} style={{ position: "absolute", top: "1rem", right: "1rem", background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", lineHeight: 1 }}>&times;</button>
            <h3 style={{ marginBottom: "1rem", color: "var(--pink-deep)" }}>Terms & Privacy Policy</h3>
            <div style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "var(--text-body)" }}>
              <p><strong>1. Introduction</strong><br/>Welcome to Something Floral PH. By creating an account, you agree to these terms.</p>
              <br/>
              <p><strong>2. Privacy Policy</strong><br/>We only collect information necessary to process your reservations (name, email, phone number). We do not share your data with third parties.</p>
              <br/>
              <p><strong>3. Reservations</strong><br/>All reservations are subject to availability. Please make sure your contact details are accurate so we can update you regarding your order.</p>
              <br/>
              <p><strong>4. Changes to Terms</strong><br/>We reserve the right to modify these terms at any time. Continued use of our service implies acceptance of the updated terms.</p>
            </div>
            <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
              <button className="btn btn-primary btn-sm" onClick={() => setShowTerms(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
