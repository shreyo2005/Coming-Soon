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
  
  const reqAst = <span style={{ color: "red" }}>*</span>;

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
        <label style={s.label}>College {reqAst}</label>
        <CollegePicker value={f.college} onChange={set("college")} />
        <label style={s.label}>Course {reqAst}</label>
        <CoursePicker course={f.course} customCourse={f.customCourse} onCourse={set("course")} onCustom={set("customCourse")} />
        <label style={s.label}>Year of study {reqAst}</label>
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
  const reqAst = <span style={{ color: "red" }}>*</span>;

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
        <label style={s.label}>Full name {reqAst}</label>
        <input style={s.input} value={f.fullName} onChange={(e) => set("fullName")(e.target.value)} placeholder="Your full name" />
        <label style={s.label}>Phone number {reqAst}</label>
        <input style={s.input} value={f.phone} onChange={(e) => set("phone")(e.target.value.replace(/[^\d+]/g, ""))} placeholder="9876543210" type="tel" />
        <label style={s.label}>Short bio <span style={{ color: colors.textFaint, fontWeight: 400 }}>(max 50 words)</span> {reqAst}</label>
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
  const [f, setF] = useState({ 
    upiId: "", 
    verificationMethod: "", 
    eduEmail: "",
    adminSummary: "" 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false); // disables submit after a failed UPI check
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const reqAst = <span style={{ color: "red" }}>*</span>;

  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  // Editing the UPI re-enables the button so they can retry
  const setUpi = (v) => {
    setF((p) => ({ ...p, upiId: v }));
    if (blocked) { setBlocked(false); setError(""); }
  };

  const submit = async () => {
    if (!f.upiId || !f.verificationMethod) return setError("Please fill all required fields");
    if (f.verificationMethod === "edu_email" && !otpVerified) return setError("Please verify your college email with OTP");
    
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

  const handleSendOtp = async () => {
    if (!f.eduEmail || !(f.eduEmail.endsWith(".edu") || f.eduEmail.endsWith(".edu.in") || f.eduEmail.endsWith(".ac.in"))) {
      return setError("Please enter a valid .edu or .ac.in email address");
    }
    try {
      setLoading(true); setError("");
      await api.post(`/insider/${userId}/send-otp`, { eduEmail: f.eduEmail });
      setOtpSent(true);
    } catch (e) { setError(e.message || "Failed to send OTP"); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) return setError("Please enter the OTP");
    try {
      setLoading(true); setError("");
      await api.post(`/insider/${userId}/verify-otp`, { otp: otpCode });
      setOtpVerified(true);
      setError("");
    } catch (e) { setError(e.message || "Invalid OTP"); }
    finally { setLoading(false); }
  };

  const uploadDoc = async (docType, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    const extension = file.name.split('.').pop().toLowerCase();
    const validExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(extension)) {
      setError("Please upload a valid document (JPEG, PNG, or PDF)");
      return;
    }

    // Validate file size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large. Please upload a file smaller than 5MB");
      return;
    }

    try {
      setLoading(true); setError("");
      const fd = new FormData();
      fd.append("file", file);
      await api.post(`/profile/upload-document?role=insider&id=${userId}&docType=${docType}`, fd);
      alert("Document uploaded successfully");
    } catch (err) {
      setError(err.message || "Failed to upload document");
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Logo accent={accent} />
        <Progress step={2} total={3} accent={ROLE.insider.accent} />
        <h2 style={s.h2}>Payout & verification</h2>
        <p style={s.sub}>How we verify and pay you when students book sessions.</p>
        <ErrorBox message={error} />

        <label style={s.label}>UPI ID {reqAst}</label>
        <input style={{ ...s.input, marginBottom: "4px" }} value={f.upiId} onChange={(e) => setUpi(e.target.value)} placeholder="yourname@oksbi" />
        <p style={s.hint}>You'll receive payments here when students book sessions</p>

        <label style={s.label}>Verification method {reqAst}</label>
        <select style={{...s.select, marginBottom: "16px"}} value={f.verificationMethod} onChange={(e) => set("verificationMethod")(e.target.value)}>
          <option value="">Select verification method...</option>
          <option value="edu_email">College's .edu mail (fastest)</option>
          <option value="id_card">College ID Card</option>
          <option value="proof_admission">Proof of Admission</option>
        </select>

        {f.verificationMethod === "edu_email" && !otpVerified && (
          <div style={{ marginBottom: "16px", padding: "12px", background: "#f8fafc", borderRadius: "8px", border: `1px solid ${colors.border}` }}>
            <label style={{...s.label, fontSize: "13px"}}>College Email ID (.edu or .ac.in)</label>
            <div style={{ display: "flex", gap: "8px", marginBottom: otpSent ? "12px" : "0" }}>
              <input style={{...s.input, marginBottom: 0}} value={f.eduEmail} disabled={otpSent} onChange={(e) => set("eduEmail")(e.target.value)} placeholder="student@college.edu" />
              <button style={{...s.btn(accent), padding: "8px 12px", fontSize: "13px", whiteSpace: "nowrap"}} onClick={handleSendOtp} disabled={loading || (otpSent && !error)}>
                {otpSent ? "Resend OTP" : "Send OTP"}
              </button>
            </div>
            
            {otpSent && (
              <>
                <label style={{...s.label, fontSize: "13px"}}>Enter OTP from Email</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input style={{...s.input, marginBottom: 0}} value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="123456" />
                  <button style={{...s.btn(accent), padding: "8px 12px", fontSize: "13px", whiteSpace: "nowrap"}} onClick={handleVerifyOtp} disabled={loading}>
                    Verify
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {f.verificationMethod === "edu_email" && otpVerified && (
          <div style={{ marginBottom: "16px", padding: "12px", background: "#e8f5e9", color: "#2e7d32", borderRadius: "8px", fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
            ✓ College Email Verified
          </div>
        )}

        {f.verificationMethod === "id_card" && (
          <div style={{ marginBottom: "16px", padding: "12px", background: "#f8fafc", borderRadius: "8px", border: `1px solid ${colors.border}` }}>
            <label style={{...s.label, fontSize: "13px"}}>Upload College ID Card</label>
            <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => uploadDoc("id_card", e)} style={{fontSize: "14px", width: "100%"}} />
          </div>
        )}

        {f.verificationMethod === "proof_admission" && (
          <div style={{ marginBottom: "16px", padding: "12px", background: "#f8fafc", borderRadius: "8px", border: `1px solid ${colors.border}` }}>
            <label style={{...s.label, fontSize: "13px"}}>Upload Proof of Admission</label>
            <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => uploadDoc("proof_admission", e)} style={{fontSize: "14px", width: "100%"}} />
          </div>
        )}

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