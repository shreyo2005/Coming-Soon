import { useState, useEffect } from "react";
import { FONT, s, colors, ROLE } from "../theme";
import { Logo, ErrorBox, Spinner } from "../components/common";

const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/api";
const ASSET_BASE = BASE.replace(/\/api$/, "");

const exportCSV = (records, filename, columns) => {
  if (!records || !records.length) return;
  const header = ['Name', 'Email', ...columns.map(c => c.label)].join(',');
  const rows = records.map(r => {
    return [
      `"${(r.fullName || 'Pending').replace(/"/g, '""')}"`,
      `"${(r.email || '').replace(/"/g, '""')}"`,
      ...columns.map(c => {
        let val = r[c.key];
        if (c.format && val) val = c.format(val);
        if (val === null || val === undefined) val = "";
        return `"${String(val).replace(/"/g, '""')}"`;
      })
    ].join(',');
  });
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

function AdminLogin({ onLogin, error, loading, onBack }) {
  const [key, setKey] = useState("");
  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <Logo />
        </div>
        <h2 style={s.h2}>Admin access</h2>
        <p style={s.sub}>Enter your secure key to manage users and verify documents.</p>
        <ErrorBox message={error} />
        
        <label style={s.label}>Admin Key</label>
        <input 
          style={s.input} 
          type="password" 
          value={key} 
          onChange={(e) => setKey(e.target.value)} 
          placeholder="••••••••••••" 
          onKeyDown={(e) => e.key === 'Enter' && onLogin(key)}
        />
        
        <button 
          style={s.btn(colors.text)} 
          onClick={() => onLogin(key)} 
          disabled={loading || !key}
        >
          {loading ? "Verifying..." : "Enter Dashboard"}
        </button>
        <button style={s.btnGhost} onClick={onBack}>Back to site</button>
      </div>
    </div>
  );
}

function BarChart({ data, accent }) {
  const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = Math.max(1, ...entries.map((e) => e[1]));
  if (entries.length === 0) return <p style={{ fontSize: "14px", color: colors.textFaint, fontStyle: "italic" }}>No data yet</p>;
  return (
    <div>
      {entries.map(([k, v]) => (
        <div key={k} style={{ marginBottom: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: colors.text, marginBottom: "6px" }}>
            <span style={{ maxWidth: "80%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k}</span>
            <span style={{ fontWeight: 600 }}>{v}</span>
          </div>
          <div style={{ height: "8px", background: colors.borderSoft, borderRadius: "99px", overflow: "hidden" }}>
            <div style={{ width: `${(v / max) * 100}%`, height: "100%", background: accent, borderRadius: "99px", transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DocLink({ label, path, accent }) {
  if (!path) return null;
  return (
    <a 
      href={`${ASSET_BASE}${path}`} 
      target="_blank" 
      rel="noreferrer"
      style={{ 
        display: "inline-block", 
        padding: "6px 12px", 
        background: `${accent}15`, 
        color: accent, 
        borderRadius: "6px", 
        fontSize: "12px", 
        fontWeight: "600",
        textDecoration: "none",
        marginRight: "8px",
        marginBottom: "8px",
        border: `1px solid ${accent}30`
      }}
    >
      ↗ {label}
    </a>
  );
}

function DataTable({ records, columns, accent, docsRenderer }) {
  if (!records || records.length === 0) {
    return <div style={{ padding: "40px", textAlign: "center", color: colors.textFaint }}>No records found.</div>;
  }

  return (
    <div style={{ overflowX: "auto", border: `1px solid ${colors.borderSoft}`, borderRadius: "12px", background: "#fff" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
        <thead>
          <tr style={{ background: colors.bg, borderBottom: `2px solid ${colors.borderSoft}` }}>
            <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: colors.textSoft, textTransform: "uppercase", letterSpacing: "0.5px" }}>User</th>
            {columns.map(c => (
              <th key={c.key} style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: colors.textSoft, textTransform: "uppercase", letterSpacing: "0.5px" }}>{c.label}</th>
            ))}
            {docsRenderer && <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "12px", fontWeight: "600", color: colors.textSoft, textTransform: "uppercase", letterSpacing: "0.5px" }}>Documents</th>}
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={r.id} style={{ borderBottom: `1px solid ${colors.borderSoft}`, background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
              <td style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
                {r.photoPath ? (
                  <img src={`${ASSET_BASE}${r.photoPath}`} alt="Avatar" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", border: `1px solid ${colors.border}` }} />
                ) : (
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: `${accent}20`, color: accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "16px" }}>
                    {r.fullName ? r.fullName.charAt(0).toUpperCase() : "?"}
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: "600", color: colors.text, fontSize: "14px", marginBottom: "2px" }}>{r.fullName || "Pending"}</div>
                  <div style={{ color: colors.textSoft, fontSize: "12px" }}>{r.email}</div>
                </div>
              </td>
              {columns.map(c => (
                <td key={c.key} style={{ padding: "16px", fontSize: "13px", color: colors.text }}>
                  {r[c.key] ? (c.format ? c.format(r[c.key]) : String(r[c.key])) : "—"}
                </td>
              ))}
              {docsRenderer && (
                <td style={{ padding: "16px", fontSize: "13px" }}>
                  {docsRenderer(r)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminDashboard({ onBack }) {
  const [auth, setAuth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [error, setError] = useState("");
  
  const [stats, setStats] = useState(null);
  const [records, setRecords] = useState({ insider: [], mentor: [], student: [] });
  const [tab, setTab] = useState("overview");
  const [hidePending, setHidePending] = useState(false);

  const login = async (key) => {
    setLoading(true); setError("");
    try {
      const headers = { "X-Admin-Key": key };
      const [statsData, ins, men, stu] = await Promise.all([
        fetch(`${BASE}/admin/stats`, { headers }).then(r => { if(r.status===401) throw new Error("unauthorized"); return r.json() }),
        fetch(`${BASE}/insider?size=500`, { headers }).then(r => r.ok ? r.json() : {content:[]}),
        fetch(`${BASE}/mentor?size=500`, { headers }).then(r => r.ok ? r.json() : {content:[]}),
        fetch(`${BASE}/student?size=500`, { headers }).then(r => r.ok ? r.json() : {content:[]})
      ]);
      setStats(statsData);
      setRecords({ insider: ins.content||[], mentor: men.content||[], student: stu.content||[] });
      setAdminKey(key);
      setAuth(true);
    } catch (e) {
      setError(e.message === "unauthorized" ? "Invalid admin key" : "Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  if (!auth) {
    return <AdminLogin onLogin={login} error={error} loading={loading} onBack={onBack} />;
  }

  const statCard = (label, value, accent) => (
    <div style={{ flex: 1, background: "#fff", border: `1px solid ${colors.borderSoft}`, borderRadius: "16px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
      <div style={{ fontSize: "36px", fontWeight: "800", color: accent, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: "14px", fontWeight: "500", color: colors.textSoft, marginTop: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
    </div>
  );

  const section = (title, content) => (
    <div style={{ background: "#fff", border: `1px solid ${colors.borderSoft}`, borderRadius: "16px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
      <div style={{ fontSize: "16px", fontWeight: "700", color: colors.text, marginBottom: "20px" }}>{title}</div>
      {content}
    </div>
  );

  const TabBtn = ({ id, label }) => (
    <button
      onClick={() => setTab(id)}
      style={{
        padding: "10px 20px",
        borderRadius: "8px",
        border: "none",
        background: tab === id ? colors.text : "transparent",
        color: tab === id ? "#fff" : colors.textSoft,
        fontWeight: "600",
        fontSize: "14px",
        cursor: "pointer",
        transition: "all 0.2s"
      }}
    >
      {label}
    </button>
  );

  const insiderCols = [
    { key: "college", label: "College" },
    { key: "phone", label: "Phone" },
    { key: "verificationMethod", label: "Verification" },
    { key: "upiId", label: "UPI" },
    { key: "registeredAt", label: "Joined", format: (v) => new Date(v).toLocaleDateString() }
  ];
  const mentorCols = [
    { key: "company", label: "Company" },
    { key: "designation", label: "Designation" },
    { key: "phone", label: "Phone" },
    { key: "verificationMethod", label: "Verification" },
    { key: "upiId", label: "UPI" },
    { key: "registeredAt", label: "Joined", format: (v) => new Date(v).toLocaleDateString() }
  ];
  const studentCols = [
    { key: "college", label: "College" },
    { key: "course", label: "Course" },
    { key: "year", label: "Year" },
    { key: "phone", label: "Phone" },
    { key: "registeredAt", label: "Joined", format: (v) => new Date(v).toLocaleDateString() }
  ];

  const getFilteredRecords = (recs) => {
    if (hidePending) return recs.filter(r => r.fullName);
    return recs;
  };

  const handleExport = () => {
    let recs = [];
    let cols = [];
    if (tab === "insiders") { recs = getFilteredRecords(records.insider); cols = insiderCols; }
    if (tab === "mentors") { recs = getFilteredRecords(records.mentor); cols = mentorCols; }
    if (tab === "students") { recs = getFilteredRecords(records.student); cols = studentCols; }
    exportCSV(recs, `${tab}_export`, cols);
  };

  return (
    <div style={{ minHeight: "100vh", background: colors.bg, fontFamily: FONT }}>
      {/* Top Navigation */}
      <div style={{ background: "#fff", borderBottom: `1px solid ${colors.borderSoft}`, padding: "0 32px", height: "72px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <Logo />
          <div style={{ height: "24px", width: "1px", background: colors.border }}></div>
          <span style={{ fontWeight: "700", color: colors.text, fontSize: "16px" }}>Admin Portal</span>
        </div>
        <button style={{ ...s.btnGhost, width: "auto", padding: "8px 16px" }} onClick={onBack}>Exit Dashboard</button>
      </div>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 32px" }}>
        
        {/* Tab Bar & Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", gap: "8px", background: "rgba(0,0,0,0.03)", padding: "6px", borderRadius: "12px" }}>
            <TabBtn id="overview" label="Overview" />
            <TabBtn id="insiders" label="Insiders" />
            <TabBtn id="mentors" label="Mentors" />
            <TabBtn id="students" label="Students" />
          </div>
          
          {tab !== "overview" && (
            <div style={{ display: "flex", alignItems: "center", gap: "16px", animation: "fadeIn 0.3s ease-out" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: "500", color: colors.text, cursor: "pointer" }}>
                <input 
                  type="checkbox" 
                  checked={hidePending} 
                  onChange={(e) => setHidePending(e.target.checked)} 
                  style={{ width: "16px", height: "16px", accentColor: colors.text }}
                />
                Hide Pending Users
              </label>
              
              <button 
                onClick={handleExport}
                style={{ ...s.btnGhost, padding: "8px 16px", background: "#fff", border: `1px solid ${colors.borderSoft}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
              >
                ↓ Export CSV
              </button>
            </div>
          )}
        </div>

        {/* Tab Contents */}
        {tab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "32px", animation: "fadeIn 0.3s ease-out" }}>
            <div style={{ display: "flex", gap: "24px" }}>
              {statCard("Total Students", stats.totalStudents, ROLE.student.accent)}
              {statCard("Total Insiders", stats.totalInsiders, ROLE.insider.accent)}
              {statCard("Total Mentors", stats.totalMentors, ROLE.mentor.accent)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px" }}>
              {section("Students by College", <BarChart data={stats.studentsByCollege} accent={ROLE.student.accent} />)}
              {section("Insiders by College", <BarChart data={stats.insidersByCollege} accent={ROLE.insider.accent} />)}
              {section("Mentors by Domain", <BarChart data={stats.mentorsByDomain} accent={ROLE.mentor.accent} />)}
            </div>
          </div>
        )}

        {tab === "insiders" && (
          <div style={{ animation: "fadeIn 0.3s ease-out" }}>
            <DataTable 
              records={getFilteredRecords(records.insider)} 
              accent={ROLE.insider.accent}
              columns={insiderCols}
              docsRenderer={(r) => (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  <DocLink label="ID Card" path={r.idCardPath} accent={ROLE.insider.accent} />
                  <DocLink label="Admission Proof" path={r.proofOfAdmissionPath} accent={ROLE.insider.accent} />
                  {r.verificationMethod === "edu_email" && r.eduEmailVerified && (
                    <span style={{ display: "inline-block", padding: "6px 12px", background: "#e8f5e9", color: "#2e7d32", borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}>✓ Edu Email Verified</span>
                  )}
                </div>
              )}
            />
          </div>
        )}

        {tab === "mentors" && (
          <div style={{ animation: "fadeIn 0.3s ease-out" }}>
            <DataTable 
              records={getFilteredRecords(records.mentor)} 
              accent={ROLE.mentor.accent}
              columns={mentorCols}
              docsRenderer={(r) => (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  <DocLink label="Proof of Work" path={r.proofOfWorkPath} accent={ROLE.mentor.accent} />
                  <DocLink label="Employee ID" path={r.employeeIdCardPath} accent={ROLE.mentor.accent} />
                  {r.verificationMethod === "work_email" && r.workEmailVerified && (
                    <span style={{ display: "inline-block", padding: "6px 12px", background: "#e8f5e9", color: "#2e7d32", borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}>✓ Work Email Verified</span>
                  )}
                </div>
              )}
            />
          </div>
        )}

        {tab === "students" && (
          <div style={{ animation: "fadeIn 0.3s ease-out" }}>
            <DataTable 
              records={getFilteredRecords(records.student)} 
              accent={ROLE.student.accent}
              columns={studentCols}
            />
          </div>
        )}

      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}