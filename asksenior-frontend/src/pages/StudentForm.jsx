import { useState } from "react";
import { api } from "../api/api";
import { s, colors, ROLE } from "../theme";
import { Logo, ErrorBox, BackButton } from "../components/common";

export default function StudentForm({ userId, onDone, onBack }) {
  const [f, setF] = useState({ fullName: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const accent = ROLE.student.accent;
  const reqAst = <span style={{ color: "red" }}>*</span>;

  const phoneOk = (p) => /^(\+91)?[6-9][0-9]{9}$/.test(p.replace(/\s/g, ""));

  const submit = async () => {
    if (!f.fullName.trim()) return setError("Full name is required");
    if (!phoneOk(f.phone)) return setError("Enter a valid 10-digit Indian mobile number (starting with 6–9)");
    try {
      setLoading(true); setError("");
      await api.put(`/student/${userId}/profile`, {
        fullName: f.fullName.trim(),
        phone: f.phone.trim(),
      });
      onDone();
    } catch (e) { setError(e.message || "Failed to join waitlist"); }
    finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <BackButton onClick={onBack} />
      <div style={s.card}>
        <Logo accent={accent} />
        <h2 style={s.h2}>Almost there!</h2>
        <p style={s.sub}>Just a couple of details and you're on the waitlist.</p>
        <ErrorBox message={error} />

        <label style={s.label}>Full name {reqAst}</label>
        <input
          style={s.input}
          value={f.fullName}
          onChange={(e) => setF(p => ({ ...p, fullName: e.target.value }))}
          placeholder="Your full name"
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />

        <label style={s.label}>Phone number {reqAst}</label>
        <input
          style={s.input}
          type="tel"
          value={f.phone}
          onChange={(e) => setF(p => ({ ...p, phone: e.target.value.replace(/[^\d+]/g, "") }))}
          placeholder="9876543210"
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
        <p style={{ ...s.hint, marginBottom: "16px" }}>
          We'll use this to notify you when AskSenior launches.
        </p>

        <button style={s.btn(accent)} onClick={submit} disabled={loading}>
          {loading ? "Saving..." : "Join Waitlist 🎉"}
        </button>
      </div>
    </div>
  );
}
