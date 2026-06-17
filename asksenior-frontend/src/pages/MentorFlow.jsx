import { useState } from "react";
import { api } from "../api/api";
import { s, colors, ROLE } from "../theme";
import { Logo, ErrorBox, Progress } from "../components/common";
import PhotoCapture from "../components/PhotoCapture";

const accent = ROLE.mentor.accent;

// Step 1 — Company
export function MentorCompany({ userId, onNext, onBack }) {
  const [f, setF] = useState({ company: "", designation: "", areaOfExpertise: "", yearsOfExperience: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  
  const reqAst = <span style={{ color: "red" }}>*</span>;

  const submit = async () => {
    if (!f.company || !f.designation || !f.areaOfExpertise || !f.yearsOfExperience) return setError("Please fill in all fields");
    try {
      setLoading(true); setError("");
      await api.put(`/mentor/${userId}/profile`, {
        ...f,
        yearsOfExperience: parseInt(f.yearsOfExperience, 10),
        // Send dummy values for step 2 fields since backend validation might require them.
        // Wait, MentorProfileRequest has @NotBlank on fullName. We should update the DTO or send empty strings and remove @NotBlank?
        // Actually, partial update might fail if the DTO has @NotBlank.
        // Let's check backend DTO. Yes, Dto has @NotBlank for fullName, phone, company, designation, etc.
        // It's better to fetch existing or send dummy and overwrite in step 2.
        fullName: "Pending", phone: "9999999999", linkedInUrl: "https://linkedin.com/in/pending", workEmail: ""
      });
      onNext();
    } catch (e) { setError(e.message || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Logo accent={accent} />
        <Progress step={0} total={3} accent={ROLE.mentor.accent} />
        <h2 style={s.h2}>Your experience</h2>
        <p style={s.sub}>Students will find you based on your professional background.</p>
        <ErrorBox message={error} />
        
        <label style={s.label}>Company {reqAst}</label>
        <input style={s.input} value={f.company} onChange={(e) => set("company")(e.target.value)} placeholder="e.g. Google" />
        
        <label style={s.label}>Designation {reqAst}</label>
        <input style={s.input} value={f.designation} onChange={(e) => set("designation")(e.target.value)} placeholder="e.g. Senior Software Engineer" />
        
        <label style={s.label}>Area of expertise {reqAst}</label>
        <input style={s.input} value={f.areaOfExpertise} onChange={(e) => set("areaOfExpertise")(e.target.value)} placeholder="e.g. Product Management" />
        
        <label style={s.label}>Years of experience {reqAst}</label>
        <input style={s.input} type="number" value={f.yearsOfExperience} onChange={(e) => set("yearsOfExperience")(e.target.value)} placeholder="e.g. 5" />
        
        <button style={s.btn(accent)} onClick={submit} disabled={loading}>{loading ? "Saving..." : "Next"}</button>
        <button style={s.btnGhost} onClick={onBack}>Back</button>
      </div>
    </div>
  );
}

// Step 2 — Profile + photo
export function MentorProfile({ userId, onNext, onBack }) {
  const [f, setF] = useState({ fullName: "", phone: "", linkedInUrl: "", bio: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  
  const phoneOk = (p) => /^(\+91)?[6-9][0-9]{9}$/.test(p.replace(/\s/g, ""));
  const linkedinOk = (u) => /linkedin\.com/i.test(u);
  const reqAst = <span style={{ color: "red" }}>*</span>;

  // We need to fetch the existing data from step 1 so we don't overwrite it with dummy values
  const submit = async () => {
    if (!f.fullName) return setError("Full name is required");
    if (!phoneOk(f.phone)) return setError("Enter a valid 10-digit Indian mobile number");
    if (!linkedinOk(f.linkedInUrl)) return setError("A valid LinkedIn URL is required");
    
    try {
      setLoading(true); setError("");
      // Fetch existing
      const existing = await api.get(`/mentor/${userId}`);
      
      await api.put(`/mentor/${userId}/profile`, {
        ...existing,
        ...f,
        workEmail: existing.workEmail || "", // Will be set in step 3
      });
      onNext();
    } catch (e) { setError(e.phone || e.message || "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Logo accent={accent} />
        <Progress step={1} total={3} accent={ROLE.mentor.accent} />
        <h2 style={s.h2}>About you</h2>
        <p style={s.sub}>Keep it honest. Students value authenticity.</p>
        <ErrorBox message={error} />
        
        <PhotoCapture role="mentor" userId={userId} accent={accent} />
        
        <label style={s.label}>Full name {reqAst}</label>
        <input style={s.input} value={f.fullName} onChange={(e) => set("fullName")(e.target.value)} placeholder="Your full name" />
        
        <label style={s.label}>Phone number {reqAst}</label>
        <input style={s.input} value={f.phone} onChange={(e) => set("phone")(e.target.value.replace(/[^\d+]/g, ""))} placeholder="9876543210" type="tel" />
        
        <label style={s.label}>LinkedIn profile {reqAst}</label>
        <input style={s.input} value={f.linkedInUrl} onChange={(e) => set("linkedInUrl")(e.target.value)} placeholder="https://linkedin.com/in/..." />
        
        <label style={s.label}>Short bio <span style={{ color: colors.textFaint, fontWeight: 400 }}>(optional)</span></label>
        <textarea style={{ ...s.textarea, marginBottom: "16px" }} rows={3} value={f.bio} onChange={(e) => set("bio")(e.target.value)} placeholder="How can you help students?" />
        
        <button style={s.btn(accent)} onClick={submit} disabled={loading}>{loading ? "Saving..." : "Next"}</button>
        <button style={s.btnGhost} onClick={onBack}>Back</button>
      </div>
    </div>
  );
}

// Step 3 — Payout and Verification
export function MentorPayout({ userId, onDone, onBack }) {
  const [f, setF] = useState({ 
    upiId: "", 
    verificationMethod: "", 
    workEmail: "",
    adminSummary: "" 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const reqAst = <span style={{ color: "red" }}>*</span>;
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  const setUpi = (v) => {
    setF((p) => ({ ...p, upiId: v }));
    if (blocked) { setBlocked(false); setError(""); }
  };

  const submit = async () => {
    if (!f.upiId || !f.verificationMethod) return setError("Please fill all required fields");
    if (f.verificationMethod === "work_email" && !otpVerified) return setError("Please verify your work email with OTP");
    
    try {
      setLoading(true); setError("");
      // Fetch existing profile to resave with the proper work email if we verified it
      const existing = await api.get(`/mentor/${userId}`);
      
      // Update the profile first to save the workEmail (since it's a profile field)
      await api.put(`/mentor/${userId}/profile`, {
        ...existing,
        workEmail: f.workEmail || existing.workEmail || ""
      });

      // Then save payout
      await api.put(`/mentor/${userId}/payout`, f);
      onDone();
    } catch (e) {
      setError(e.message || "Invalid UPI ID. Please correct it and try again.");
      setBlocked(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!f.workEmail || !/\S+@\S+\.\S+/.test(f.workEmail)) {
      return setError("Please enter a valid work email address");
    }
    try {
      setLoading(true); setError("");
      await api.post(`/mentor/${userId}/send-otp`, { workEmail: f.workEmail });
      setOtpSent(true);
    } catch (e) { setError(e.message || "Failed to send OTP"); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) return setError("Please enter the OTP");
    try {
      setLoading(true); setError("");
      await api.post(`/mentor/${userId}/verify-otp`, { otp: otpCode, workEmail: f.workEmail });
      setOtpVerified(true);
      setError("");
    } catch (e) { setError(e.message || "Invalid OTP"); }
    finally { setLoading(false); }
  };

  const uploadDoc = async (docType, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    const extension = file.name.split('.').pop().toLowerCase();
    const validExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(extension)) {
      setError("Please upload a valid document (JPEG, PNG, or PDF)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large. Please upload a file smaller than 5MB");
      return;
    }

    try {
      setLoading(true); setError("");
      const fd = new FormData();
      fd.append("file", file);
      await api.post(`/profile/upload-document?role=mentor&id=${userId}&docType=${docType}`, fd);
      alert("Document uploaded successfully");
    } catch (err) {
      setError(err.message || "Failed to upload document");
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Logo accent={accent} />
        <Progress step={2} total={3} accent={ROLE.mentor.accent} />
        <h2 style={s.h2}>Payout & verification</h2>
        <p style={s.sub}>How we verify and pay you when students book sessions.</p>
        <ErrorBox message={error} />

        <label style={s.label}>UPI ID {reqAst}</label>
        <input style={{ ...s.input, marginBottom: "4px" }} value={f.upiId} onChange={(e) => setUpi(e.target.value)} placeholder="yourname@oksbi" />
        <p style={s.hint}>You'll receive payments here when students book sessions</p>

        <label style={s.label}>Verification method {reqAst}</label>
        <select style={{...s.select, marginBottom: "16px"}} value={f.verificationMethod} onChange={(e) => set("verificationMethod")(e.target.value)}>
          <option value="">Select verification method...</option>
          <option value="work_email">Company Work Email (fastest)</option>
          <option value="proof_work">Proof of Work / Offer Letter</option>
          <option value="employee_id_card">Employee ID Card</option>
        </select>

        {f.verificationMethod === "work_email" && !otpVerified && (
          <div style={{ marginBottom: "16px", padding: "12px", background: "#f8fafc", borderRadius: "8px", border: `1px solid ${colors.border}` }}>
            <label style={{...s.label, fontSize: "13px"}}>Company Work Email</label>
            <div style={{ display: "flex", gap: "8px", marginBottom: otpSent ? "12px" : "0" }}>
              <input style={{...s.input, marginBottom: 0}} value={f.workEmail} disabled={otpSent} onChange={(e) => set("workEmail")(e.target.value)} placeholder="you@company.com" type="email" />
              <button style={{...s.btn(accent), padding: "8px 12px", fontSize: "13px", whiteSpace: "nowrap"}} onClick={handleSendOtp} disabled={loading || (otpSent && !error)}>
                {otpSent ? "Resend OTP" : "Send OTP"}
              </button>
            </div>
            
            {otpSent && (
              <>
                <label style={{...s.label, fontSize: "13px"}}>Enter OTP from Email (Check Terminal logs to test!)</label>
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

        {f.verificationMethod === "work_email" && otpVerified && (
          <div style={{ marginBottom: "16px", padding: "12px", background: "#e8f5e9", color: "#2e7d32", borderRadius: "8px", fontSize: "14px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
            ✓ Work Email Verified
          </div>
        )}

        {f.verificationMethod === "proof_work" && (
          <div style={{ marginBottom: "16px", padding: "12px", background: "#f8fafc", borderRadius: "8px", border: `1px solid ${colors.border}` }}>
            <label style={{...s.label, fontSize: "13px"}}>Upload Proof of Work / Offer Letter</label>
            <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => uploadDoc("proof_work", e)} style={{fontSize: "14px", width: "100%"}} />
          </div>
        )}

        {f.verificationMethod === "employee_id_card" && (
          <div style={{ marginBottom: "16px", padding: "12px", background: "#f8fafc", borderRadius: "8px", border: `1px solid ${colors.border}` }}>
            <label style={{...s.label, fontSize: "13px"}}>Upload Employee ID Card</label>
            <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => uploadDoc("employee_id_card", e)} style={{fontSize: "14px", width: "100%"}} />
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
