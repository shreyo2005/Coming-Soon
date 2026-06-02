import { useState, useEffect } from "react";
import { FONT, s, colors, ROLE } from "../theme";
import { Logo, ErrorBox, Spinner } from "../components/common";

const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/api";
const ASSET_BASE = BASE.replace(/\/api$/, "");

function BarChart({ data, accent }) {
  const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = Math.max(1, ...entries.map((e) => e[1]));
  if (entries.length === 0) return <p style={{ fontSize: "12.5px", color: colors.textFaint }}>No data yet</p>;
  return (
    <div>
      {entries.map(([k, v]) => (
        <div key={k} style={{ marginBottom: "10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12.5px", color: colors.text, marginBottom: "4px" }}>
            <span style={{ maxWidth: "72%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k}</span>
            <span style={{ fontWeight: 600 }}>{v}</span>
          </div>
          <div style={{ height: "7px", background: colors.borderSoft, borderRadius: "99px" }}>
            <div style={{ width: `${(v / max) * 100}%`, height: "100%", background: accent, borderRadius: "99px" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// Expandable record row
function RecordRow({ record, accent, fields }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${colors.borderSoft}` }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px", color: colors.text, padding: "9px 0", cursor: "pointer" }}
      >
        <span style={{ fontWeight: 500 }}>{record.fullName || "(no name)"} · {record.email}</span>
        <span style={{ color: accent, fontSize: "11px" }}>{open ? "▲ hide" : "▼ details"}</span>
      </div>
      {open && (
        <div style={{ background: colors.bg, borderRadius: "10px", padding: "12px 14px", marginBottom: "10px" }}>
          {record.photoPath && (
            <img
              src={`${ASSET_BASE}${record.photoPath}`}
              alt="profile"
              style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", marginBottom: "10px", border: `1px solid ${colors.border}` }}
            />
          )}
          {fields.map(([label, key]) => (
            <div key={key} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", padding: "3px 0" }}>
              <span style={{ color: colors.textSoft }}>{label}</span>
              <span style={{ color: colors.text, maxWidth: "60%", textAlign: "right", wordBreak: "break-word" }}>
                {record[key] !== null && record[key] !== undefined && record[key] !== "" ? String(record[key]) : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard({ onBack }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [adminKey, setAdminKey] = useState("");
  const [records, setRecords] = useState({ insider: [], mentor: [], student: [] });

  useEffect(() => {
    const key = window.prompt("Enter admin key to view the dashboard:");
    if (key === null) { setError("Admin key required to view this page."); return; }
    setAdminKey(key);

    const headers = { "X-Admin-Key": key };

    Promise.all([
      fetch(`${BASE}/admin/stats`, { headers }).then((r) => {
        if (r.status === 401) throw new Error("unauthorized");
        if (!r.ok) throw new Error("failed");
        return r.json();
      }),
      fetch(`${BASE}/insider?size=100`, { headers }).then((r) => r.ok ? r.json() : { content: [] }),
      fetch(`${BASE}/mentor?size=100`, { headers }).then((r) => r.ok ? r.json() : { content: [] }),
      fetch(`${BASE}/student?size=100`, { headers }).then((r) => r.ok ? r.json() : { content: [] }),
    ])
      .then(([statsData, ins, men, stu]) => {
        setStats(statsData);
        setRecords({
          insider: ins.content || [],
          mentor: men.content || [],
          student: stu.content || [],
        });
      })
      .catch((e) => {
        if (e.message === "unauthorized") setError("Wrong admin key.");
        else setError("Could not load stats. Is the backend running?");
      });
  }, []);

  if (error) return (
    <div style={s.page}><div style={s.card}>
      <ErrorBox message={error} />
      <button style={s.btnGhost} onClick={onBack}>Back to site</button>
    </div></div>
  );
  if (!stats) return <div style={s.page}><Spinner /></div>;

  const statCard = (label, value, accent) => (
    <div style={{ flex: 1, background: colors.surface, border: `1px solid ${colors.borderSoft}`, borderRadius: "16px", padding: "20px" }}>
      <div style={{ fontSize: "28px", fontWeight: "700", color: accent }}>{value}</div>
      <div style={{ fontSize: "12.5px", color: colors.textSoft, marginTop: "3px" }}>{label}</div>
    </div>
  );

  const section = (title, content) => (
    <div style={{ background: colors.surface, border: `1px solid ${colors.borderSoft}`, borderRadius: "16px", padding: "20px", marginBottom: "14px" }}>
      <div style={{ fontSize: "13px", fontWeight: "600", color: colors.text, marginBottom: "16px" }}>{title}</div>
      {content}
    </div>
  );

  const insiderFields = [
    ["Phone", "phone"], ["College", "college"], ["Course", "course"],
    ["Custom course", "customCourse"], ["Year", "year"], ["LinkedIn", "linkedInUrl"],
    ["Bio", "bio"], ["UPI ID", "upiId"], ["UPI status", "upiVerificationStatus"],
    ["College ID", "collegeIdNumber"], ["Admin notes", "adminSummary"], ["Registered", "registeredAt"],
  ];
  const mentorFields = [
    ["Phone", "phone"], ["Company", "company"], ["Designation", "designation"],
    ["Work email", "workEmail"], ["Expertise", "areaOfExpertise"], ["Experience (yrs)", "yearsOfExperience"],
    ["LinkedIn", "linkedInUrl"], ["Bio", "bio"], ["Admin notes", "adminSummary"], ["Registered", "registeredAt"],
  ];
  const studentFields = [
    ["Phone", "phone"], ["College", "college"], ["Course", "course"],
    ["Custom course", "customCourse"], ["Year", "year"], ["City", "city"],
    ["College email", "collegeEmail"], ["LinkedIn", "linkedInUrl"], ["Registered", "registeredAt"],
  ];

  const recordSection = (title, list, accent, fields) => section(title, (
    list.length ? list.map((r) => <RecordRow key={r.id} record={r} accent={accent} fields={fields} />)
                : <p style={{ fontSize: "12.5px", color: colors.textFaint }}>None yet</p>
  ));

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, fontFamily: FONT, padding: "26px" }}>
      <div style={{ maxWidth: "780px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <Logo />
          <button style={{ ...s.btnGhost, width: "auto", padding: "9px 18px" }} onClick={onBack}>Back to site</button>
        </div>

        <div style={{ display: "flex", gap: "13px", marginBottom: "14px" }}>
          {statCard("Students", stats.totalStudents, ROLE.student.accent)}
          {statCard("Insiders", stats.totalInsiders, ROLE.insider.accent)}
          {statCard("Mentors", stats.totalMentors, ROLE.mentor.accent)}
        </div>

        {section("Students by College", <BarChart data={stats.studentsByCollege} accent={ROLE.student.accent} />)}
        {section("Insiders by College", <BarChart data={stats.insidersByCollege} accent={ROLE.insider.accent} />)}
        {section("Mentors by Domain", <BarChart data={stats.mentorsByDomain} accent={ROLE.mentor.accent} />)}

        {recordSection("All Insiders — click to expand", records.insider, ROLE.insider.accent, insiderFields)}
        {recordSection("All Mentors — click to expand", records.mentor, ROLE.mentor.accent, mentorFields)}
        {recordSection("All Students — click to expand", records.student, ROLE.student.accent, studentFields)}
      </div>
    </div>
  );
}