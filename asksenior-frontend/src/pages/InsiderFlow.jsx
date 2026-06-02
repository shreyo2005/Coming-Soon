import { useState } from "react";
import { api } from "../api/api";
import { s, colors, ROLE } from "../theme";
import { Logo, ErrorBox, Progress, CollegePicker, CoursePicker } from "../components/common";
import PhotoCapture from "../components/PhotoCapture";

const accent = ROLE.insider.accent;

// Step 1 — College
export function InsiderCollege({ userId, onNext, onBack }) {
  const [f, setF] = useState({ college: "", course: "", customCourse: "", year: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  const submit = async () => {
    if (!f.college || !f.course || !f.year) return setError("Please fill in all fields");
    if (f.course === "Other" && !f.customCourse) return setError("Please enter your course name");
    try {
      setLoading(true); setError("");
      await api.put(`/insider/${userId}/college`, f);
      onNext();
    } catch (e) { setError(e.message || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Logo accent={accent} />
        <Progress step={0} total={3} accent={ROLE.insider.accent} />
        <h2 style={s.h2}>Your college</h2>
        <p style={s.sub}>Students will find you based on this.</p>
        <ErrorBox message={error} />
        <label style={s.label}>College</label>
        <CollegePicker value={f.college} onChange={set("college")} />
        <label style={s.label}>Course</label>
        <CoursePicker course={f.course} customCourse={f.customCourse} onCourse={set("course")} onCustom={set("customCourse")} />
        <label style={s.label}>Year of study</label>
        <select style={s.select} value={f.year} onChange={(e) => set("year")(e.target.value)}>
          <option value="">Select...</option>
          <option>1st Year</option><option>2nd Year</option><option>3rd Year</option>
          <option>4th Year</option><option>5th Year</option>
        </select>
        <button style={s.btn(accent)} onClick={submit} disabled={loading}>{loading ? "Saving..." : "Next"}</button>
        <button style={s.btnGhost} onClick={onBack}>Back</button>
      </div>
    </div>
  );
}

// Step 2 — Profile + photo
export function InsiderProfile({ userId, onNext, onBack }) {
  const [f, setF] = useState({ fullName: "", phone: "", bio: "", linkedInUrl: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const words = f.bio.trim() ? f.bio.trim().split(/\s+/).length : 0;
  const phoneOk = (p) => /^(\+91)?[6-9][0-9]{9}$/.test(p.replace(/\s/g, ""));

  const submit = async () => {
    if (!f.fullName) return setError("Full name is required");
    if (!phoneOk(f.phone)) return setError("Enter a valid 10-digit Indian mobile number (starts 6-9)");
    if (!f.bio) return setError("Please write a short bio");
    if (words > 50) return setError("Bio must be 50 words or less");
    try {
      setLoading(true); setError("");
      await api.put(`/insider/${userId}/profile`, f);
      onNext();
    } catch (e) { setError(e.phone || e.message || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Logo accent={accent} />
        <Progress step={1} total={3} accent={ROLE.insider.accent} />
        <h2 style={s.h2}>About you</h2>
        <p style={s.sub}>Keep it honest. Students value authenticity.</p>
        <ErrorBox message={error} />
        <PhotoCapture role="insider" userId={userId} accent={accent} />
        <label style={s.label}>Full name</label>
        <input style={s.input} value={f.fullName} onChange={(e) => set("fullName")(e.target.value)} placeholder="Your full name" />
        <label style={s.label}>Phone number</label>
        <input style={s.input} value={f.phone} onChange={(e) => set("phone")(e.target.value.replace(/[^\d+]/g, ""))} placeholder="9876543210" type="tel" />
        <label style={s.label}>Short bio <span style={{ color: colors.textFaint, fontWeight: 400 }}>(max 50 words)</span></label>
        <textarea style={{ ...s.textarea, marginBottom: "4px" }} rows={4} value={f.bio}
          onChange={(e) => set("bio")(e.target.value)}
          placeholder="What's your college like? What can you help students with?" />
        <div style={{ fontSize: "11.5px", textAlign: "right", color: words > 50 ? colors.danger : colors.textFaint, marginBottom: "16px" }}>
          {words}/50 words
        </div>
        <label style={s.label}>LinkedIn <span style={{ color: colors.textFaint, fontWeight: 400 }}>(optional)</span></label>
        <input style={s.input} value={f.linkedInUrl} onChange={(e) => set("linkedInUrl")(e.target.value)} placeholder="https://linkedin.com/in/..." />
        <button style={s.btn(accent)} onClick={submit} disabled={loading}>{loading ? "Saving..." : "Next"}</button>
        <button style={s.btnGhost} onClick={onBack}>Back</button>
      </div>
    </div>
  );
}

// Step 3 — Payout with live UPI verify
export function InsiderPayout({ userId, onDone, onBack }) {
  const [f, setF] = useState({ upiId: "", collegeIdNumber: "", adminSummary: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false); // disables submit after a failed UPI check
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  // Editing the UPI re-enables the button so they can retry
  const setUpi = (v) => {
    setF((p) => ({ ...p, upiId: v }));
    if (blocked) { setBlocked(false); setError(""); }
  };

  const submit = async () => {
    if (!f.upiId || !f.collegeIdNumber) return setError("UPI ID and College ID are required");
    try {
      setLoading(true); setError("");
      // Backend validates the UPI; on invalid it throws with a message
      await api.put(`/insider/${userId}/payout`, f);
      onDone();
    } catch (e) {
      setError(e.message || "Invalid UPI ID. Please correct it and try again.");
      setBlocked(true); // keep button disabled until they edit the UPI
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Logo accent={accent} />
        <Progress step={2} total={3} accent={ROLE.insider.accent} />
        <h2 style={s.h2}>Payout & verification</h2>
        <p style={s.sub}>How we verify and pay you when students book sessions.</p>
        <ErrorBox message={error} />

        <label style={s.label}>UPI ID</label>
        <input style={{ ...s.input, marginBottom: "4px" }} value={f.upiId} onChange={(e) => setUpi(e.target.value)} placeholder="yourname@oksbi" />
        <p style={s.hint}>You'll receive payments here when students book sessions</p>

        <label style={s.label}>College ID number</label>
        <input style={{ ...s.input, marginBottom: "4px" }} value={f.collegeIdNumber} onChange={(e) => set("collegeIdNumber")(e.target.value)} placeholder="Enrollment / USN" />
        <p style={s.hint}>Used to verify you're a current student</p>

        <label style={s.label}>Anything else? <span style={{ color: colors.textFaint, fontWeight: 400 }}>(optional)</span></label>
        <textarea style={{ ...s.textarea, marginBottom: "16px" }} rows={3} value={f.adminSummary} onChange={(e) => set("adminSummary")(e.target.value)} placeholder="Anything for the team..." />

        <button
          style={{ ...s.btn(accent), opacity: (loading || blocked) ? 0.5 : 1, cursor: (loading || blocked) ? "not-allowed" : "pointer" }}
          onClick={submit}
          disabled={loading || blocked}
        >
          {loading ? "Verifying..." : "Submit for approval"}
        </button>
        <button style={s.btnGhost} onClick={onBack}>Back</button>
      </div>
    </div>
  );
}