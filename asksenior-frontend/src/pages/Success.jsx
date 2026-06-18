import { useState, useEffect } from "react";
import Confetti from "react-confetti";
import { s, colors, ROLE } from "../theme";

export default function Success({ role, email, onExplore }) {
  const accent = ROLE[role]?.accent || ROLE.student.accent;
  const [windowDimension, setWindowDimension] = useState({width: window.innerWidth, height: window.innerHeight});

  useEffect(() => {
    const detectSize = () => setWindowDimension({width: window.innerWidth, height: window.innerHeight});
    window.addEventListener('resize', detectSize);
    return () => window.removeEventListener('resize', detectSize);
  }, []);

  const steps = role === 'insider' ? [
    ["✓", "Profile submitted for verification", true],
    ["✓", "We will review your details soon", true],
    ["✓", "Personal onboarding call before launch", true],
    ["✓", "Get ready to guide students!", true],
  ] : [
    ["✓", "Profile saved successfully", true],
    ["✓", "Matching you with top insiders & mentors", true],
    ["✓", "Personal outreach before public launch", true],
    ["✓", "Priority access secured!", true],
  ];

  const socialBtnStyle = (background) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: background,
    color: "#fff",
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: "bold",
    padding: "12px 18px",
    borderRadius: "24px", // More pill-shaped for a modern social button look
    flex: 1,
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    transition: "transform 0.2s, boxShadow 0.2s"
  });

  return (
    <div style={s.page}>
      <Confetti width={windowDimension.width} height={windowDimension.height} recycle={false} numberOfPieces={600} gravity={0.15} />
      <div style={{ ...s.card, position: 'relative', zIndex: 1, maxWidth: "440px" }}>
        <div style={{
          width: "56px", height: "56px", background: accent, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px", fontSize: "28px", color: "#fff",
          boxShadow: `0 4px 12px ${ROLE[role]?.soft || ROLE.student.soft}`
        }}>✓</div>
        <h2 style={{ ...s.h2, textAlign: "center", fontSize: "28px", letterSpacing: "-0.5px" }}>You're on the list!</h2>
        <p style={{ ...s.sub, textAlign: "center", marginBottom: "4px", fontSize: "15px" }}>We'll reach out personally at</p>
        <p style={{ fontSize: "15px", fontWeight: "700", color: colors.text, textAlign: "center", marginBottom: "28px" }}>{email}</p>

        <div style={{ background: colors.bg, borderRadius: "12px", padding: "20px", marginBottom: "28px", border: `1px solid ${colors.border}` }}>
          {steps.map(([icon, txt, done], i) => (
            <div key={i} style={{
              display: "flex", gap: "12px", fontSize: "14px", fontWeight: "600",
              color: colors.text, marginBottom: i === steps.length - 1 ? "0" : "14px",
              alignItems: "center"
            }}>
              <span style={{ 
                color: "#fff", 
                backgroundColor: accent,
                width: "20px", height: "20px", 
                borderRadius: "50%", 
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "12px", flexShrink: 0
              }}>{icon}</span>
              <span>{txt}</span>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "10px" }}>
          <button onClick={onExplore} style={{
             background: colors.bg,
             color: colors.text,
             border: `1.5px solid ${colors.border}`,
             borderRadius: "24px",
             padding: "12px 24px",
             fontSize: "15px",
             fontWeight: "700",
             cursor: "pointer",
             marginBottom: "32px",
             transition: "all 0.2s"
          }}>
            Explore more
          </button>
          <p style={{ fontSize: "15px", fontWeight: "800", color: colors.text, letterSpacing: "1px", marginBottom: "16px" }}>
            JOIN OUR REVOLUTION
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
            <a href="https://www.instagram.com/ogsenior.official?igsh=OHA4NTUycDl6MHNu" target="_blank" rel="noreferrer" style={socialBtnStyle("linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)")}>Instagram</a>
            <a href="https://twitter.com/_ogsenior" target="_blank" rel="noreferrer" style={socialBtnStyle("#000000")}>X</a>
            <a href="https://www.linkedin.com/company/117075085/admin/settings/" target="_blank" rel="noreferrer" style={socialBtnStyle("#0A66C2")}>LinkedIn</a>
          </div>
        </div>

      </div>
    </div>
  );
}
