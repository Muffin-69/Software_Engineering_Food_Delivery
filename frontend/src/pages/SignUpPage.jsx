import { useState } from "react";
import { register } from "../data/authApi";
import "../styles/Auth.css";

/* ──────────────────────────────────────────────────────────────
   Sign up page
   Lets the user create either a customer or a restaurant account.
   For restaurant accounts a "Restaurant name" field appears so a
   matching Restaurant entity can be created and linked to them.
   ────────────────────────────────────────────────────────────── */

export default function SignUp({ onSignUp, onGoToLogin, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer"); // "customer" | "restaurant"
  const [restaurantName, setRestaurantName] = useState("");
  const [focused, setFocused] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSignUp = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const user = await register({
        email,
        password,
        role,
        restaurantName: role === "restaurant" ? restaurantName : undefined,
      });
      onSignUp(user);
    } catch (err) {
      setError(err && err.message ? err.message : "Could not sign up.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="bg-blob bg-blob--teal" />
      <div className="bg-blob bg-blob--amber" />

      <header className="auth-header">
        <div className="logo" onClick={onBack} style={{ cursor: "pointer" }}>
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

        <form className="auth-form" onSubmit={handleSignUp}>
          <div className="field-group">
            <label htmlFor="email" className="field-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="hello@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
              className={`field-input ${
                focused === "email" ? "field-input--focused" : ""
              }`}
            />
          </div>

          <div className="field-group">
            <label htmlFor="password" className="field-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocused("password")}
              onBlur={() => setFocused(null)}
              className={`field-input ${
                focused === "password" ? "field-input--focused" : ""
              }`}
            />
          </div>

          {/* Role selector — pill-style toggle */}
          <div className="field-group">
            <label className="field-label">I am a</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 8,
              }}
            >
              {[
                { id: "customer", label: "Customer" },
                { id: "restaurant", label: "Restaurant owner" },
              ].map((opt) => {
                const active = role === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setRole(opt.id)}
                    className="field-input"
                    style={{
                      cursor: "pointer",
                      textAlign: "center",
                      fontWeight: active ? 600 : 400,
                      color: active ? "#011627" : "rgba(1,22,39,0.6)",
                      background: active
                        ? "rgba(65,234,212,0.18)"
                        : "rgba(1,22,39,0.04)",
                      borderColor: active
                        ? "#41ead4"
                        : "rgba(1,22,39,0.12)",
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {role === "restaurant" && (
            <div className="field-group">
              <label htmlFor="rname" className="field-label">
                Restaurant name
              </label>
              <input
                id="rname"
                type="text"
                placeholder="My Awesome Place"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                onFocus={() => setFocused("rname")}
                onBlur={() => setFocused(null)}
                className={`field-input ${
                  focused === "rname" ? "field-input--focused" : ""
                }`}
              />
            </div>
          )}

          {error && (
            <div
              style={{
                fontSize: 12,
                color: "#e71d36",
                background: "rgba(231,29,54,0.08)",
                border: "1px solid rgba(231,29,54,0.25)",
                borderRadius: 8,
                padding: "8px 10px",
              }}
            >
              {error}
            </div>
          )}

          <button
            className="auth-btn"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Creating account…" : "Sign Up"}
          </button>
        </form>

        <div className="footer-links">
          <a className="footer-link" onClick={onBack}>
            ← Back
          </a>
          <a className="footer-link" onClick={onGoToLogin}>
            Already have an account? Log in
          </a>
        </div>
      </main>
    </div>
  );
}
