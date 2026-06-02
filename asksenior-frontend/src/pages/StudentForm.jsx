import { useState } from "react";
import { api } from "../api/api";
import { s, colors, ROLE } from "../theme";
import { Logo, ErrorBox, CollegePicker, CoursePicker } from "../components/common";
import PhotoCapture from "../components/PhotoCapture";

export default function StudentForm({ userId, onDone }) {
  const [f, setF] = useState({
    fullName: "", phone: "", college: "", course: "", customCourse: "",
    year: "", city: "", linkedInUrl: "", collegeEmail: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const accent = ROLE.student.accent;
  const set = (k) => (v) => setF((prev) => ({ ...prev, [k]: v }));

  const phoneOk = (p) => /^(\+91)?[6-9][0-9]{9}$/.test(p.replace(/\s/g, ""));

  const submit = async () => {
    if (!f.fullName) return setError("Full name is required");
    if (!phoneOk(f.phone)) return setError("Enter a valid 10-digit Indian mobile number (starts 6-9)");
    if (!f.college) return setError("Please select or enter your college");
    if (!f.course) return setError("Please select your course");
    if (f.course === "Other" && !f.customCourse) return setError("Please enter your course name");
    if (f.collegeEmail && !/\S+@\S+\.\S+/.test(f.collegeEmail)) return setError("Please enter a valid college email");
    try {
      setLoading(true); setError("");
      await api.put(`/student/${userId}/profile`, f);
      onDone();
    } catch (e) { setError(e.collegeEmail || e.phone || e.message || "Failed to save"); }
    finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <Logo accent={accent} />
        <h2 style={s.h2}>Tell us about you</h2>
        <p style={s.sub}>So we can match you with the right insiders.</p>
        <ErrorBox message={error} />

        <PhotoCapture role="student" userId={userId} accent={accent} />

        <label style={s.label}>Full name</label>
        <input style={s.input} value={f.fullName} onChange={(e) => set("fullName")(e.target.value)} placeholder="Your full name" />

        <label style={s.label}>Phone number</label>
        <input style={s.input} value={f.phone} onChange={(e) => set("phone")(e.target.value.replace(/[^\d+]/g, ""))} placeholder="9876543210" type="tel" />

        <label style={s.label}>Target / current college</label>
        <CollegePicker value={f.college} onChange={set("college")} />

        <label style={s.label}>Course</label>
        <CoursePicker course={f.course} customCourse={f.customCourse} onCourse={set("course")} onCustom={set("customCourse")} />

        <label style={s.label}>Year / Class</label>
        <select style={s.select} value={f.year} onChange={(e) => set("year")(e.target.value)}>
          <option value="">Select...</option>
          <option>Class 12</option><option>Gap Year</option>
          <option>1st Year</option><option>2nd Year</option>
          <option>3rd Year</option><option>4th Year</option>
        </select>

        <label style={s.label}>City</label>
        <input style={s.input} value={f.city} onChange={(e) => set("city")(e.target.value)} placeholder="e.g. Bengaluru" />

        <label style={s.label}>College email <span style={{ color: colors.textFaint, fontWeight: 400 }}>(optional)</span></label>
        <input style={s.input} value={f.collegeEmail} onChange={(e) => set("collegeEmail")(e.target.value)} placeholder="you@college.edu" />

        <label style={s.label}>LinkedIn <span style={{ color: colors.textFaint, fontWeight: 400 }}>(optional)</span></label>
        <input style={s.input} value={f.linkedInUrl} onChange={(e) => set("linkedInUrl")(e.target.value)} placeholder="https://linkedin.com/in/..." />

        <button style={s.btn(accent)} onClick={submit} disabled={loading}>
          {loading ? "Saving..." : "Complete registration"}
        </button>
      </div>
    </div>
  );
}