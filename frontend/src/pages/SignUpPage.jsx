import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";
import { useAuth } from "../context/AuthContext";

const ROLES = ["customer", "restaurant", "admin"];

export default function SignUp() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [focused, setFocused] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSignUp = async () => {
    setError("");
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      await register(email, password, role);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="auth-page">
      <div className="bg-blob bg-blob--teal" />
      <div className="bg-blob bg-blob--amber" />

      <header className="auth-header">
        <div className="logo">
          Eat<span className="logo__accent">out!</span>
        </div>
        <div className="auth-dot">Sign Up</div>
      </header>

      <main className="auth-main">
        <div className="avatar">
          <svg
            viewBox="0 0 48 48"
            width={36}
            height={36}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="24" cy="18" r="8" stroke="#011627" strokeWidth="2.5" />
            <path
              d="M8 42 Q10 30 24 30 Q38 30 40 42"
              stroke="#011627"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h1 className="welcome-title">Welcome!</h1>
        <p className="welcome-sub">
          Sign up to start your dining journey
          <span className="amber-dot" />
        </p>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="auth-success" role="status">
            Account created! Redirecting to login…
          </div>
        )}

        <div className="auth-form">
          {[
            {
              id: "email",
              label: "Email",
              type: "email",
              placeholder: "hello@example.com",
              value: email,
              onChange: setEmail,
            },
            {
              id: "password",
              label: "Password",
              type: "password",
              placeholder: "••••••••",
              value: password,
              onChange: setPassword,
            },
          ].map(({ id, label, type, placeholder, value, onChange }) => (
            <div key={id} className="field-group">
              <label htmlFor={id} className="field-label">
                {label}
              </label>
              <input
                id={id}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setFocused(id)}
                onBlur={() => setFocused(null)}
                className={`field-input ${
                  focused === id ? "field-input--focused" : ""
                }`}
                onKeyDown={(e) => e.key === "Enter" && handleSignUp()}
              />
            </div>
          ))}

          <div className="field-group">
            <label htmlFor="role" className="field-label">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="field-input field-select"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <button
            className="auth-btn"
            onClick={handleSignUp}
            disabled={loading || success}
          >
            {loading ? "Creating account…" : "Sign Up"}
          </button>
        </div>

        <div className="footer-links">
          <a className="footer-link" onClick={() => navigate("/login")}>
            Already have an account? Log in
          </a>
        </div>
      </main>
    </div>
  );
}
