import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { adminApi } from "../api/admin";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await adminApi.login(phone, password);
      const token = res.data.accessToken;
      const role = (res.data.user?.role ?? "admin").toUpperCase();
      login(token, role);
      navigate("/");
    } catch {
      setError("Invalid credentials. Make sure you have ADMIN role.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="login-header">
          <div className="login-badge">
            T
            <div className="login-badge-dot" />
          </div>
          <h1 className="login-title">
            TRACK<span className="login-title-accent">LY</span>
          </h1>
          <p className="login-subtitle">Super Admin Panel</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="login-field">
            <label className="login-label" htmlFor="login-phone">PHONE NUMBER</label>
            <div className="login-input-wrap">
              <input
                id="login-phone"
                type="tel"
                autoComplete="tel"
                autoFocus
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+250 7XX XXX XXX"
                className="login-input"
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="login-password">PASSWORD</label>
            <div className="login-input-wrap">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="login-input login-input-password"
              />
              <button
                type="button"
                className="login-eye-btn"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={loading} className="login-submit">
            {loading && <span className="login-spinner" />}
            {loading ? "Signing in..." : "SIGN IN AS ADMIN"}
          </button>
        </form>

        <p className="login-footer">Trackly Super Admin &middot; Ivanexo Ltd</p>
      </div>
    </div>
  );
}
