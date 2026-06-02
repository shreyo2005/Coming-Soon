import { useState } from "react";
import { api } from "../api/api";
import { s, colors, ROLE } from "../theme";
import { Logo } from "../components/common";

// Replace with your real onboarding video id (the part after v= in a YouTube URL)
const YOUTUBE_ID = "https://youtu.be/dQw4w9WgXcQ?si=F65nFwLvHGHBA9NW";

export default function Onboarding({ role, userId, onDone }) {
  const [watched, setWatched] = useState(false);
  const [saving, setSaving] = useState(false);
  const accent = ROLE[role].accent;

  const proceed = async () => {
    if (role !== "student") {
      try { setSaving(true); await api.put(`/${role}/${userId}/onboarding-watched`, {}); }
      catch { /* non-blocking */ }
      finally { setSaving(false); }
    }
    onDone();
  };

  const rows = [
    ["Students", "Find verified insiders from your target college and book sessions."],
    ["Insiders", "Current students who share honest experiences and earn money."],
    ["Mentors", "Working professionals who guide students on careers."],
  ];

  return (
    <div style={s.page}>
      <div style={{ ...s.card, maxWidth: "560px" }}>
        <Logo accent={accent} />
        <h2 style={s.h2}>Welcome to AskSenior</h2>
        <p style={s.sub}>Watch this short intro to understand how the platform works before setting up your profile.</p>

        <div style={{
          position: "relative", paddingBottom: "56.25%", height: 0,
          borderRadius: "11px", overflow: "hidden", marginBottom: "20px", background: "#000",
        }}>
          <iframe
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
            src={`https://www.youtube.com/embed/${YOUTUBE_ID}`}
            title="AskSenior onboarding"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <div style={{ background: colors.bg, borderRadius: "11px", padding: "18px", marginBottom: "20px" }}>
          <div style={{ fontSize: "12.5px", fontWeight: "600", color: colors.text, marginBottom: "12px" }}>
            How AskSenior works
          </div>
          {rows.map(([t, d]) => (
            <div key={t} style={{ display: "flex", gap: "10px", marginBottom: "9px", fontSize: "12.5px" }}>
              <span style={{ fontWeight: "600", color: colors.text, minWidth: "70px" }}>{t}</span>
              <span style={{ color: colors.textSoft, lineHeight: 1.45 }}>{d}</span>
            </div>
          ))}
        </div>

        <label style={{
          display: "flex", alignItems: "center", gap: "10px", fontSize: "13.5px",
          color: colors.text, marginBottom: "18px", cursor: "pointer",
        }}>
          <input
            type="checkbox"
            checked={watched}
            onChange={(e) => setWatched(e.target.checked)}
            style={{ width: "16px", height: "16px", accentColor: accent }}
          />
          I've watched the intro and I'm ready to continue
        </label>

        <button
          style={{ ...s.btn(accent), opacity: watched ? 1 : 0.4, cursor: watched ? "pointer" : "not-allowed" }}
          disabled={!watched || saving}
          onClick={proceed}
        >
          {saving ? "Saving..." : "Continue to setup"}
        </button>
      </div>
    </div>
  );
}
