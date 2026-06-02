import { useState } from "react";
import { api } from "../api/api";
import { s, colors, ROLE } from "../theme";
import { Logo, ErrorBox } from "../components/common";
import PhotoCapture from "../components/PhotoCapture";

export default function MentorForm({ userId, onDone }) {
  const [f, setF] = useState({
    fullName: "", phone: "", company: "", designation: "", workEmail: "",
    areaOfExpertise: "", linkedInUrl: "", yearsOfExperience: "", bio: "", adminSummary: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const accent = ROLE.mentor.accent;
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  const phoneOk = (p) => /^(\+91)?[6-9][0-9]{9}$/.test(p.replace(/\s/g, ""));
  const linkedinOk = (u) => /linkedin\.com/i.test(u);

  const submit = async () => {
    if (!f.fullName) return setError("Full name is required");
    if (!phoneOk(f.phone)) return setError("Enter a valid 10-digit Indian mobile number (starts 6-9)");
    if (!f.company) return setError("Company is required");
    if (!f.designation) return setError("Designation is required");
    if (!f.workEmail || !/\S+@\S+\.\S+/.test(f.workEmail)) return setError("A valid work email is required");
    if (!linkedinOk(f.linkedInUrl)) return setError("A valid LinkedIn URL is required (must contain linkedin.com)");
    try {
      setLoading(true); setError("");
      await api.put(`/mentor/${userId}/profile`, {
        ...f,
        yearsOfExperience: f.yearsOfExperience ? parseInt(f.yearsOfExperience, 10) : null,
      });
      onDone();
    } catch (e) { setError(e.workEmail || e.phone || e.linkedInUrl || e.message || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Logo accent={accent} />
        <h2 style={s.h2}>Your professional profile</h2>
        <p style={s.sub}>Students will see this when looking for career guidance.</p>
        <ErrorBox message={error} />

        <PhotoCapture role="mentor" userId={userId} accent={accent} />

        <label style={s.label}>Full name</label>
        <input style={s.input} value={f.fullName} onChange={(e) => set("fullName")(e.target.value)} placeholder="Your full name" />

        <label style={s.label}>Phone number</label>
        <input style={s.input} value={f.phone} onChange={(e) => set("phone")(e.target.value.replace(/[^\d+]/g, ""))} placeholder="9876543210" type="tel" />

        <label style={s.label}>Work email</label>
        <input style={s.input} type="email" value={f.workEmail} onChange={(e) => set("workEmail")(e.target.value)} placeholder="you@company.com" />

        <label style={s.label}>Company</label>
        <input style={s.input} value={f.company} onChange={(e) => set("company")(e.target.value)} placeholder="e.g. Google" />

        <label style={s.label}>Designation</label>
        <input style={s.input} value={f.designation} onChange={(e) => set("designation")(e.target.value)} placeholder="e.g. Senior Software Engineer" />

        <label style={s.label}>LinkedIn profile</label>
        <input style={s.input} value={f.linkedInUrl} onChange={(e) => set("linkedInUrl")(e.target.value)} placeholder="https://linkedin.com/in/..." />

        <label style={s.label}>Area of expertise</label>
        <input style={s.input} value={f.areaOfExpertise} onChange={(e) => set("areaOfExpertise")(e.target.value)} placeholder="e.g. Product Management" />

        <label style={s.label}>Years of experience</label>
        <input style={s.input} type="number" value={f.yearsOfExperience} onChange={(e) => set("yearsOfExperience")(e.target.value)} placeholder="e.g. 5" />

        <label style={s.label}>Short bio <span style={{ color: colors.textFaint, fontWeight: 400 }}>(optional)</span></label>
        <textarea style={{ ...s.textarea, marginBottom: "16px" }} rows={3} value={f.bio} onChange={(e) => set("bio")(e.target.value)} placeholder="How can you help students?" />

        <button style={s.btn(accent)} onClick={submit} disabled={loading}>
          {loading ? "Saving..." : "Submit for approval"}
        </button>
      </div>
    </div>
  );
}