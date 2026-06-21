import { useState, useEffect } from "react";
import { api } from "../api/api";
import { s, colors } from "../theme";

export function Logo({ accent }) {
  return (
    <div style={{ ...s.logoRow, justifyContent: 'center', marginBottom: '8px' }}>
      <img
        src="/logo.png"
        alt="OG Senior"
        style={{ height: 56, width: 'auto', objectFit: 'contain' }}
      />
    </div>
  );
}

export function ErrorBox({ message }) {
  if (!message) return null;
  return <div style={s.err}>{message}</div>;
}

export function Progress({ step, total, accent }) {
  return (
    <div style={s.prog}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={s.progBar(i === step, i < step, accent)} />
      ))}
      <span style={s.progText}>Step {step + 1} of {total}</span>
    </div>
  );
}

export function Field({ label, optional, children }) {
  return (
    <>
      <label style={s.label}>
        {label}{optional && <span style={s.optional}> (optional)</span>}
      </label>
      {children}
    </>
  );
}

export function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
      <div style={{
        width: "26px", height: "26px", border: `3px solid ${colors.borderSoft}`,
        borderTopColor: colors.accent, borderRadius: "50%", animation: "asspin 0.8s linear infinite",
      }} />
      <style>{`@keyframes asspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export function CollegePicker({ value, onChange }) {
  const [colleges, setColleges] = useState([]);
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      api.get(`/catalog/colleges?q=${encodeURIComponent(query.trim())}`)
        .then(setColleges)
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const filtered = colleges.slice(0, 8);

  const exactMatch = colleges.some((c) => c.name.toLowerCase() === query.trim().toLowerCase());

  return (
    <div style={{ position: "relative", marginBottom: "16px" }}>
      <input
        style={{ ...s.input, marginBottom: 0 }}
        placeholder="Search or type your college..."
        value={query}
        onChange={(e) => { setQuery(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && query && (filtered.length > 0 || !exactMatch) && (
        <div style={{
          position: "absolute", top: "47px", left: 0, right: 0, background: colors.surface,
          border: `1px solid ${colors.border}`, borderRadius: "9px",
          boxShadow: "0 4px 14px rgba(43,42,39,0.08)", zIndex: 20, maxHeight: "228px", overflowY: "auto",
        }}>
          {filtered.map((c) => (
            <div
              key={c.id}
              onMouseDown={() => { setQuery(c.name); onChange(c.name); setOpen(false); }}
              style={{
                padding: "10px 14px", fontSize: "13px", cursor: "pointer",
                borderBottom: `1px solid ${colors.borderSoft}`, color: colors.text,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = colors.bg)}
              onMouseLeave={(e) => (e.currentTarget.style.background = colors.surface)}
            >
              {c.name}
              {c.city && <span style={{ color: colors.textFaint, fontSize: "11px" }}> · {c.city}</span>}
            </div>
          ))}
          {!exactMatch && query.trim().length > 1 && (
            <div
              onMouseDown={() => { onChange(query.trim()); setOpen(false); }}
              style={{
                padding: "10px 14px", fontSize: "13px", cursor: "pointer",
                color: colors.accentText, fontWeight: 600, background: colors.accentSoft,
              }}
            >
              Use "{query.trim()}" (my college isn't listed)
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CoursePicker({ course, customCourse, onCourse, onCustom }) {
  const [courses, setCourses] = useState([]);
  useEffect(() => { api.get("/catalog/courses").then(setCourses).catch(() => {}); }, []);
  return (
    <>
      <select style={s.select} value={course} onChange={(e) => onCourse(e.target.value)}>
        <option value="">Select course...</option>
        {courses.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
      </select>
      {course === "Other" && (
        <input
          style={s.input}
          placeholder="Enter your course name"
          value={customCourse}
          onChange={(e) => onCustom(e.target.value)}
        />
      )}
    </>
  );
}

export function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'absolute',
        top: 'clamp(16px, 4vw, 32px)',
        left: 'clamp(16px, 4vw, 32px)',
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        border: '1.5px solid #E5E7EB',
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        transition: 'all 0.2s',
        zIndex: 100,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateX(-2px)';
        e.currentTarget.style.borderColor = '#111111';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.08)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateX(0)';
        e.currentTarget.style.borderColor = '#E5E7EB';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)';
      }}
      aria-label="Go back"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
    </button>
  );
}