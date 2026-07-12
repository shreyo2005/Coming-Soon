import { useState } from "react";
import { api } from "../api/api";
import { s, ROLE } from "../theme";
import { Logo, ErrorBox, BackButton } from "../components/common";

export default function SignIn({ role, onDone, onBack }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const accent = ROLE[role].accent;

  const submit = async () => {
    if (!email || !email.includes("@")) return setError("Please enter a valid email address");

    // Set a timeout to notify the user if the server is cold-starting
    const wakeUpTimeout = setTimeout(() => {
      setError("Server is waking up from sleep. This usually takes about 60 seconds. Please hold on...");
    }, 8000);

    try {
      setLoading(true); setError("");
      const data = await api.post(`/${role}/auth`, { email });
      clearTimeout(wakeUpTimeout);
      onDone(data);
    } catch (e) {
      clearTimeout(wakeUpTimeout);
      let msg = e.email || e.message;
      if (!msg || msg === "Failed to fetch") {
        msg = "We are having trouble connecting to our servers right now. Please try again or contact support.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <BackButton onClick={onBack} />
      <div style={s.card}>
        <Logo accent={accent} />
        <h2 style={s.h2}>Sign up to continue</h2>
        <p style={s.sub}>Enter your email to begin your {ROLE[role].label} registration.</p>
        <ErrorBox message={error} />
        <label style={s.label}>Email address</label>
        <input
          style={s.input}
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <button style={s.btn(accent)} onClick={submit} disabled={loading}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              Please wait...
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : "Continue"}
        </button>
        <button style={s.btnGhost} onClick={onBack}>Back</button>
      </div>
    </div>
  );
}
