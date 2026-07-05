import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { toast } from "../components/Toast";
import Logo from "../components/Logo";
import "../styles/auth.css";

export default function AdminLogin() {
  const navigate = useNavigate();
  const { role, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (role === "admin") navigate("/admin/dashboard", { replace: true });
  }, [role, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await api.adminLogin({ username, password });
      await login(data);
      toast("Welcome back, Admin!");
      navigate("/admin/dashboard");
    } catch {
      setError(true);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Logo variant="auth" />
          <span className="admin-badge">🔐 Admin</span>
        </div>
        <h2 style={{ textAlign: "center" }}>Admin Sign In</h2>
        <p className="auth-sub" style={{ textAlign: "center" }}>Manage orders, products, and clients.</p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="adminUsername">Username</label>
            <input
              id="adminUsername"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="adminPassword">Password</label>
            <div className="input-wrap">
              <input
                type={showPwd ? "text" : "password"}
                id="adminPassword"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: "1rem" }}
                required
              />
              <button type="button" className="password-toggle" onClick={() => setShowPwd((v) => !v)}>
                {showPwd ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          {error && (
            <p className="auth-error visible">
              Invalid credentials.
            </p>
          )}
          <button type="submit" className="btn btn-primary" style={{ width: "100%" }}>
            Sign In
          </button>
          <p className="form-note" style={{ textAlign: "center", marginTop: "0.75rem" }}>
            Not an admin? <Link to="/account/login">Client login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
