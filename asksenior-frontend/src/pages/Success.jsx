import { s, colors, ROLE } from "../theme";

export default function Success({ role, email }) {
  const accent = ROLE[role].accent;
  const steps = [
    ["✓", "Profile saved", true],
    ["○", "We review your application", false],
    ["○", "Personal outreach before launch", false],
    ["○", "You go live on AskSenior", false],
  ];
  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{
          width: "50px", height: "50px", background: ROLE[role].soft, borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 18px", fontSize: "24px", color: accent,
        }}>✓</div>
        <h2 style={{ ...s.h2, textAlign: "center" }}>You're on the list</h2>
        <p style={{ ...s.sub, textAlign: "center", marginBottom: "6px" }}>We'll reach out personally at</p>
        <p style={{ fontSize: "13.5px", fontWeight: "600", color: colors.text, textAlign: "center", marginBottom: "24px" }}>{email}</p>

        <div style={{ background: colors.bg, borderRadius: "11px", padding: "18px", marginBottom: "22px" }}>
          {steps.map(([icon, txt, done], i) => (
            <div key={i} style={{
              display: "flex", gap: "10px", fontSize: "13.5px",
              color: done ? colors.text : colors.textFaint, marginBottom: "10px",
            }}>
              <span style={{ color: done ? accent : colors.textFaint }}>{icon}</span>{txt}
            </div>
          ))}
        </div>

        <p style={{ fontSize: "12.5px", color: colors.textFaint, textAlign: "center" }}>
          Thank you for joining early.
        </p>
      </div>
    </div>
  );
}
