import { useState } from "react";
import { api } from "../api/api";
import { s, ROLE } from "../theme";
import { Logo, ErrorBox } from "../components/common";

export default function SignIn({ role, onDone, onBack }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const accent = ROLE[role].accent;

  const submit = async () => {
    if (!email || !email.includes("@")) return setError("Please enter a valid email address");
    try {
      setLoading(true); setError("");
      const data = await api.post(`/${role}/auth`, { email });
      onDone(data);
    } catch (e) {
      setError(e.email || e.message || "Something went wrong. Is the backend running on port 8080?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Logo accent={accent} />
        <h2 style={s.h2}>Sign in to continue</h2>
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
          {loading ? "Please wait..." : "Continue"}
        </button>
        <button style={s.btnGhost} onClick={onBack}>Back</button>
      </div>
    </div>
  );
}
