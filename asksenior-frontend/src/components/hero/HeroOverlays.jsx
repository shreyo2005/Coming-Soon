import React from 'react'
import { clamp, easeOut3, lerp } from '../../utils/math'
import { FRONTEND } from '../../utils/constants'

const STORY = [
  { from: 0.00, to: 0.19, stage: '01', heading: "Every student's story", highlight: "starts here.", body: null },
  { from: 0.19, to: 0.40, stage: '02', heading: "The most important", highlight: "decision of your life.", body: null },
  { from: 0.40, to: 0.50, stage: '03', heading: "Made with the", highlight: "wrong information.", body: "Counsellors with conflicts. Seniors who ghosted. Google answers from 2019." },
  { from: 0.50, to: 0.75, stage: '04', heading: "You reached out.", highlight: "Nobody answered.", body: null }
]

export function StoryPanel({ scrollT }) {
  const active = STORY.find(s => scrollT >= s.from && scrollT < s.to)
  if (!active) return null

  const fadeIn = clamp((scrollT - active.from) / 0.06, 0, 1)
  const fadeOut = clamp((active.to - scrollT) / 0.04, 0, 1)
  const op = easeOut3(fadeIn) * fadeOut
  const ty = lerp(32, 0, easeOut3(fadeIn))

  return (
    // Outer wrapper: pinned to bottom 0, flex column so content stacks from bottom upward
    <div style={{
      position: 'absolute', left: 0, right: 0,
      // Place text in the lower third, above the shadow zone (shadow is at y=-2.1 in 3D = ~bottom 20% of screen)
      bottom: 0,
      height: '38%',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 20, pointerEvents: 'none',
      opacity: op, transform: `translateY(${ty}px)`,
      // Frosted cream backdrop ensures text is always legible above the 3D shadow
      background: 'linear-gradient(to top, rgba(245,240,232,0.96) 0%, rgba(245,240,232,0.80) 60%, transparent 100%)',
      paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
    }}>
      <div style={{
        fontFamily: 'DM Sans,sans-serif', fontSize: 12.5, fontWeight: 800,
        letterSpacing: '0.16em', textTransform: 'uppercase',
        color: 'rgba(120,90,55,0.85)', marginBottom: 10,
      }}>
        Stage {active.stage}
      </div>

      <h2 style={{
        fontFamily: 'Syne,sans-serif',
        fontSize: 'clamp(22px,3.8vw,44px)',
        fontWeight: 800, lineHeight: 1.15,
        color: '#1A120A',
        textAlign: 'center', margin: '0 0 4px',
        letterSpacing: '-0.025em',
      }}>
        {active.heading}
      </h2>

      <h2 style={{
        fontFamily: 'Syne,sans-serif',
        fontSize: 'clamp(22px,3.8vw,44px)',
        fontWeight: 800, lineHeight: 1.15,
        background: 'linear-gradient(110deg,#B45309 0%,#D97706 60%)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        textAlign: 'center', margin: '0 0 10px',
        letterSpacing: '-0.025em',
      }}>
        {active.highlight}
      </h2>

      {active.body && (
        <p style={{
          fontFamily: 'DM Sans,sans-serif',
          fontSize: 'clamp(15px,1.7vw,18px)',
          fontWeight: 700,
          color: '#2A1C0C',
          textAlign: 'center', maxWidth: 450, padding: '0 24px',
          lineHeight: 1.65, margin: 0,
        }}>
          {active.body}
        </p>
      )}
    </div>
  )
}

export function BookOverlay({ scrollT }) {
  // Synchronized to appear exactly with Stage 3 (from: 0.40)
  const raw = clamp((scrollT - 0.40) / 0.05, 0, 1) * clamp((0.55 - scrollT) / 0.06, 0, 1)
  const op = easeOut3(raw)
  if (op < 0.01) return null

  return (
    <div style={{
      position: 'absolute', top: '40%', left: '50%',
      transform: `translate(-40%, -50%) scale(${lerp(0.90, 1, easeOut3(raw))})`,
      opacity: op, zIndex: 8, pointerEvents: 'none', textAlign: 'left',
      width: 'clamp(130px,18vw,210px)',
    }}>
      <div style={{
        fontFamily: 'DM Sans,sans-serif', fontSize: 'clamp(11px,1.2vw,14px)',
        fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase',
        color: '#4A2F13',
        marginBottom: 7,
      }}>
        Chapter I
      </div>

      <div style={{
        fontFamily: 'Georgia,"Times New Roman",serif',
        fontSize: 'clamp(18px,2.6vw,30px)',
        fontWeight: 800, lineHeight: 1.25,
        color: '#1A0E04',
        letterSpacing: '-0.01em',
      }}>
        What after<br />12th??
      </div>

      <div style={{
        width: '60%', height: 1.5,
        background: '#4A2F13',
        margin: '9px 0',
      }} />

      <div style={{
        fontFamily: 'Georgia,"Times New Roman",serif',
        fontSize: 'clamp(12px,1.4vw,16px)',
        color: '#1A0E04',
        lineHeight: 1.55,
        fontWeight: 700,
        fontStyle: 'italic',
      }}>
        The question every student carries
      </div>
    </div>
  )
}

export function ChatOverlay({ scrollT }) {
  const raw = clamp((scrollT - 0.58) / 0.06, 0, 1) * clamp((0.80 - scrollT) / 0.05, 0, 1)
  const op = easeOut3(raw)
  if (op < 0.01) return null

  const msgOp = easeOut3(clamp((scrollT - 0.58) / 0.06, 0, 1))
  const noRepOp = easeOut3(clamp((scrollT - 0.58) / 0.06, 0, 1))

  return (
    <div style={{
      position: 'absolute', top: '40%', left: '50%',
      transform: 'translate(-50%, -50%)',
      opacity: op, zIndex: 8, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', gap: 8,
      width: 'clamp(145px,21vw,200px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
        <div style={{
          width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
          background: '#3D2E1E',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Syne,sans-serif', fontSize: 9, fontWeight: 800, color: '#EEE4D4',
        }}>R</div>
        <div style={{
          background: 'rgba(26,17,8,0.95)',
          borderRadius: '10px 10px 10px 2px',
          padding: '8px 12px',
          fontFamily: 'DM Sans,sans-serif', fontSize: 'clamp(11px,1.3vw,13px)',
          color: '#FFF2DB',
          fontWeight: 700,
          lineHeight: 1.4,
        }}>
          Busy rn, talk to you<br />later...
        </div>
      </div>

      <div style={{
        alignSelf: 'flex-end',
        opacity: msgOp,
        transform: `translateY(${lerp(6, 0, msgOp)}px)`,
      }}>
        <div style={{
          background: 'rgba(64,31,4,0.95)',
          borderRadius: '10px 10px 2px 10px',
          padding: '8px 12px',
          fontFamily: 'DM Sans,sans-serif', fontSize: 'clamp(11px,1.3vw,13px)',
          color: '#FFE8C2', lineHeight: 1.4, textAlign: 'right',
          fontWeight: 700,
        }}>
          Which branch should I take?<br />
          <span style={{ opacity: 0.9 }}>Please reply bhaiya 🙏</span>
          <div style={{ fontSize: 10, color: 'rgba(255,220,180,0.7)', marginTop: 3, fontWeight: 800 }}>
            ✓✓ Seen
          </div>
        </div>
      </div>

      <div style={{
        opacity: noRepOp, alignSelf: 'center',
        background: 'rgba(42,28,12,0.22)',
        border: '1.5px solid rgba(42,28,12,0.5)',
        borderRadius: 100, padding: '6px 16px',
        fontFamily: 'DM Sans,sans-serif', fontSize: 'clamp(10px,1.2vw,12px)',
        color: 'rgba(42,28,12,0.9)',
        fontStyle: 'italic',
        fontWeight: 800,
      }}>
        No reply... 😔
      </div>
    </div>
  )
}

export function StageDots({ scrollT }) {
  const idx = STORY.findIndex(s => scrollT >= s.from && scrollT < s.to)
  return (
    <div style={{
      position: 'absolute', right: 24, top: '40%', transform: 'translateY(-50%)',
      display: 'flex', flexDirection: 'column', gap: 8, zIndex: 10, pointerEvents: 'none',
    }}>
      {STORY.map((_, i) => (
        <div key={i} style={{
          width: i === idx ? 6 : 4,
          height: i === idx ? 20 : 4,
          borderRadius: 3,
          background: i === idx ? 'rgba(160,100,30,0.80)' : 'rgba(100,70,30,0.20)',
          transition: 'all 0.4s ease',
        }} />
      ))}
    </div>
  )
}

export function ScrollHint({ scrollT }) {
  const op = clamp(1 - scrollT / 0.06, 0, 1)
  if (op < 0.01) return null
  return (
    <div style={{
      position: 'absolute', bottom: '4.5%', left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      pointerEvents: 'none', zIndex: 10, opacity: op,
    }}>
      <span style={{
        fontFamily: 'DM Sans,sans-serif', fontSize: 10,
        color: 'rgba(80,55,25,0.40)', letterSpacing: '0.14em', textTransform: 'uppercase',
      }}>scroll to explore</span>
      <div style={{
        width: 20, height: 32, border: '1.5px solid rgba(80,55,25,0.22)',
        borderRadius: 10, display: 'flex', justifyContent: 'center', paddingTop: 4,
      }}>
        <div style={{
          width: 2.5, height: 5, background: 'rgba(80,55,25,0.28)',
          borderRadius: 2, animation: 'ogscroll 1.8s ease-in-out infinite',
        }} />
      </div>
    </div>
  )
}

export function HeroCTA({ scrollT, go }) {
  const op = easeOut3(clamp((scrollT - 0.75) / 0.15, 0, 1))
  if (op < 0.01) return null

  return (
    <>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '100%',
        background: 'linear-gradient(to top, #F5F0E8 55%, rgba(245,240,232,0.85) 75%, transparent)',
        zIndex: 11, pointerEvents: 'none', opacity: op,
      }} />

      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
        zIndex: 15, opacity: op,
        transform: `translateY(${lerp(24, 0, op)}px)`,
        pointerEvents: op > 0.6 ? 'auto' : 'none',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        paddingTop: 12,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: 'rgba(5,150,105,0.10)', border: '1px solid rgba(5,150,105,0.30)',
          borderRadius: 100, padding: '5px 16px',
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: '#059669',
            display: 'inline-block', animation: 'ogpulse 2s ease-in-out infinite',
          }} />
          <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12.5, color: '#059669', fontWeight: 500 }}>
            Peer mentorship for students & professionals
          </span>
        </div>

        <h1 style={{
          fontFamily: 'Syne,sans-serif',
          fontSize: 'clamp(38px,6.5vw,78px)',
          fontWeight: 800, color: '#0F0A05',
          letterSpacing: '-0.04em', lineHeight: 1.0,
          textAlign: 'center', margin: 0,
        }}>
          Ask before<br />
          <span style={{
            background: 'linear-gradient(120deg,#059669 0%,#D97706 60%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>you choose.</span>
        </h1>

        <p style={{
          fontFamily: 'DM Sans,sans-serif',
          fontSize: 'clamp(13px,1.6vw,17px)',
          color: 'rgba(60,40,15,0.55)',
          textAlign: 'center', maxWidth: 400, lineHeight: 1.65, margin: 0,
        }}>
          Real advice from verified peers and professionals —<br />
          before your college, branch, or career decision.
        </p>

        <div className="hero-cta-buttons" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { label: "I’m a learner", color: '#059669', role: 'student', shadow: 'rgba(5,150,105,0.35)' },
            { label: "I’m a College Insider", color: '#D97706', role: 'insider', shadow: 'rgba(217,119,6,0.35)' },
            { label: "I’m a Career Mentor", color: '#7C3AED', role: 'mentor', shadow: 'rgba(124,58,237,0.35)' },
          ].map(b => (
            <button key={b.label} onClick={() => go(b.role)}
              style={{
                fontFamily: 'Syne,sans-serif', fontSize: 13.5, fontWeight: 700,
                color: '#fff', background: b.color, borderRadius: 14, border: 'none', cursor: 'pointer',
                padding: '12px 24px', textDecoration: 'none',
                boxShadow: `0 4px 18px ${b.shadow}`, letterSpacing: '0.01em',
                transition: 'all 0.22s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 28px ${b.shadow}` }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 18px ${b.shadow}` }}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
