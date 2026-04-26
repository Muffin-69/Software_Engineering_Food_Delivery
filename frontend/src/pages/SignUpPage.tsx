import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Auth.css";

export default function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  const handleSignUp = () => {
    // console.log({ username, email, password });
    console.log({ email, password });
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
              />
            </div>
          ))}

          <button className="auth-btn" onClick={handleSignUp}>
            Sign Up
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
