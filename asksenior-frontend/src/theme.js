export const FONT = "'DM Sans', sans-serif";
export const FONT_HEAD = "'Syne', sans-serif";

export const colors = {
  bg: "#FAF8F4", // match landing page background
  surface: "#ffffff",
  border: "#E5E7EB",
  borderSoft: "#F3F4F6",
  text: "#111111", // darker text for bold look
  textSoft: "#6B7280",
  textFaint: "#9CA3AF",
  accent: "#111111",
  accentSoft: "#F3F4F6",
  accentText: "#111111",
  danger: "#EF4444",
  dangerSoft: "#FEF2F2",
  success: "#059669",
  successSoft: "#ECFDF5",
};

export const ROLE = {
  student: { accent: "#059669", soft: "rgba(5,150,105,0.06)", label: "Student" },
  insider: { accent: "#D97706", soft: "rgba(217,119,6,0.06)", label: "College Insider" },
  mentor:  { accent: "#7C3AED", soft: "rgba(124,58,237,0.06)", label: "Career Mentor" },
};

export const s = {
  page: {
    minHeight: "100vh", background: colors.bg, display: "flex",
    flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: "40px 24px", fontFamily: FONT, position: "relative",
  },
  card: {
    background: colors.surface, border: `1px solid ${colors.borderSoft}`,
    borderRadius: "24px", padding: "40px", width: "100%", maxWidth: "480px",
    boxShadow: "0 12px 40px rgba(0,0,0,0.04)",
  },
  logoRow: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" },
  logoMark: (accent) => ({
    width: "32px", height: "32px", background: accent || colors.accent,
    borderRadius: "10px", display: "flex", alignItems: "center",
    justifyContent: "center", color: "#fff", fontSize: "14px", fontWeight: "800",
    fontFamily: FONT_HEAD, letterSpacing: "0.02em"
  }),
  logoText: { fontFamily: FONT_HEAD, fontWeight: "800", fontSize: "20px", color: colors.text, letterSpacing: "-0.02em" },
  h2: { fontFamily: FONT_HEAD, fontSize: "28px", fontWeight: "800", color: "#111", marginBottom: "12px", lineHeight: 1.15, letterSpacing: "-0.02em" },
  sub: { fontSize: "15px", color: colors.textSoft, marginBottom: "32px", lineHeight: 1.5 },
  label: { display: "block", fontFamily: FONT_HEAD, fontSize: "14px", fontWeight: "700", color: colors.text, marginBottom: "8px" },
  optional: { color: colors.textFaint, fontWeight: 400, fontFamily: FONT, fontSize: "13px" },
  input: {
    width: "100%", border: `1.5px solid ${colors.border}`, borderRadius: "14px",
    padding: "14px 18px", fontSize: "15px", color: colors.text, outline: "none",
    background: colors.surface, boxSizing: "border-box", marginBottom: "20px", fontFamily: FONT,
    transition: "all 0.2s", fontWeight: 500
  },
  textarea: {
    width: "100%", border: `1.5px solid ${colors.border}`, borderRadius: "14px",
    padding: "14px 18px", fontSize: "15px", color: colors.text, outline: "none",
    background: colors.surface, boxSizing: "border-box", resize: "none", fontFamily: FONT,
    transition: "all 0.2s", fontWeight: 500
  },
  select: {
    width: "100%", border: `1.5px solid ${colors.border}`, borderRadius: "14px",
    padding: "14px 18px", fontSize: "15px", color: colors.text, outline: "none",
    background: colors.surface, boxSizing: "border-box", marginBottom: "20px", fontFamily: FONT,
    transition: "all 0.2s", fontWeight: 500, cursor: "pointer"
  },
  btn: (accent) => ({
    width: "100%", padding: "16px", background: accent || colors.accent, color: "#fff",
    border: "none", borderRadius: "14px", fontSize: "15px", fontWeight: "700",
    cursor: "pointer", marginBottom: "12px", fontFamily: FONT_HEAD, transition: "transform 0.2s, box-shadow 0.2s",
    boxShadow: `0 8px 24px ${accent ? accent + '40' : 'rgba(0,0,0,0.1)'}`, letterSpacing: "0.02em"
  }),
  btnGhost: {
    width: "100%", padding: "16px", background: "transparent", color: colors.textSoft,
    border: `1.5px solid ${colors.border}`, borderRadius: "14px", fontSize: "15px",
    fontWeight: "700", cursor: "pointer", fontFamily: FONT_HEAD, transition: "all 0.2s"
  },
  err: {
    background: colors.dangerSoft, border: `1.5px solid ${colors.danger}40`,
    color: colors.danger, fontSize: "14px", fontWeight: "500", padding: "12px 16px",
    borderRadius: "14px", marginBottom: "24px",
  },
  hint: { fontSize: "13px", color: colors.textFaint, marginTop: "-14px", marginBottom: "20px" },
  prog: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "32px" },
  progBar: (active, done, accent) => ({
    height: "6px", borderRadius: "99px",
    background: done ? accent || colors.accent : active ? colors.textFaint : colors.borderSoft,
    width: done ? "40px" : active ? "32px" : "16px", transition: "all 0.3s",
  }),
  progText: {
    fontFamily: FONT_HEAD, fontWeight: "700", fontSize: "12px", color: colors.textFaint, marginLeft: "8px", letterSpacing: "0.05em", textTransform: "uppercase"
  }
};