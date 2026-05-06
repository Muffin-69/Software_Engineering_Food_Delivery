import "../styles/Auth.css";
import "../styles/Welcome.css";

/* ──────────────────────────────────────────────────────────────
   Welcome / launch screen

   The first thing a user sees. Three options:
     • Log in (existing customer or restaurant owner)
     • Sign up (create either type of account)
     • Continue as guest (browse + place mock orders, no account)
   ────────────────────────────────────────────────────────────── */

type WelcomePageProps = {
  onLogIn: () => void;
  onSignUp: () => void;
  onContinueAsGuest: () => void;
};

export default function WelcomePage({
  onLogIn,
  onSignUp,
  onContinueAsGuest,
}: WelcomePageProps) {
  return (
    <div className="auth-page">
      <div className="bg-blob bg-blob--teal" />
      <div className="bg-blob bg-blob--amber" />

      <header className="auth-header">
        <div className="logo">
          Eat<span className="logo__accent">out!</span>
        </div>
      </header>

      <main className="auth-main welcome-main">
        <div className="welcome-hero">
          <h1 className="welcome-hero-title">
            Eat<span className="logo__accent">out!</span>
          </h1>
          <p className="welcome-hero-sub">
            Order food from your favourite restaurants
            <span className="amber-dot" />
          </p>
        </div>

        <div className="welcome-actions">
          <button className="auth-btn welcome-btn" onClick={onLogIn}>
            Log in
          </button>
          <button
            className="auth-btn welcome-btn welcome-btn--secondary"
            onClick={onSignUp}
          >
            Sign up
          </button>
          <button
            className="welcome-guest-btn"
            onClick={onContinueAsGuest}
          >
            Continue as guest
          </button>
        </div>
      </main>
    </div>
  );
}
