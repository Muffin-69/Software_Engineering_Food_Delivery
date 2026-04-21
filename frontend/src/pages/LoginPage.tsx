import { useState } from "react";
import "../styles/Login.css";

export default function Login() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focused, setFocused] = useState<string | null>(null);

  const handleLogin = () => {
    console.log({ username, email, password });
  };

  return (
    <div className="login-page">
      <div className="bg-blob bg-blob--teal" />
      <div className="bg-blob bg-blob--amber" />

      <header className="login-header">
        <div className="logo">
          Eat<span className="logo__accent">out!</span>
        </div>
        <div className="sign-in-pill">Sign In</div>
      </header>

      <main className="login-main">
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

        <h1 className="welcome-title">Welcome back</h1>
        <p className="welcome-sub">
          Sign in to continue your dining journey
          <span className="amber-dot" />
        </p>

        <div className="login-form">
          {[
            {
              id: "username",
              label: "Username",
              type: "text",
              placeholder: "your username",
              value: username,
              onChange: setUsername,
            },
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

          <button className="login-btn" onClick={handleLogin}>
            Log In
          </button>
        </div>

        <div className="footer-links">
          <a className="footer-link">Create account</a>
        </div>
      </main>
    </div>
  );
}
