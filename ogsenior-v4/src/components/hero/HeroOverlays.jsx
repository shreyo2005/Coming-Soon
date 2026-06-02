import React from 'react'
import { clamp, easeOut3, lerp } from '../../utils/math'
import { FRONTEND } from '../../utils/constants'

const STORY = [
  { from: 0.00, to: 0.19, stage: '01', heading: "Every student's story", highlight: "starts here.", body: null },
  { from: 0.19, to: 0.40, stage: '02', heading: "The most important", highlight: "decision of your life.", body: null },
  { from: 0.40, to: 0.50, stage: '03', heading: "Made with the", highlight: "wrong information.", body: "Counsellors with conflicts. Seniors who ghosted. Google answers from 2019." },
  { from: 0.50, to: 0.75, stage: '04', heading: "You reached out.", highlight: "Nobody answered.", body: null },
  { from: 0.75, to: 0.90, stage: '05', heading: "Until", highlight: "now.", body: "ogsenior connects you with verified peers who've been there — before you choose your college, branch, or career." },
]

export function StoryPanel({ scrollT }) {
  const active = STORY.find(s => scrollT >= s.from && scrollT < s.to)
  if (!active) return null

  const fadeIn = clamp((scrollT - active.from) / 0.06, 0, 1)
  const fadeOut = clamp((active.to - scrollT) / 0.04, 0, 1)
  const op = easeOut3(fadeIn) * fadeOut
  const ty = lerp(32, 0, easeOut3(fadeIn))

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: '11%',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      zIndex: 10, pointerEvents: 'none',
      opacity: op, transform: `translateY(${ty}px)`,
    }}>
      <div style={{
        fontFamily: 'DM Sans,sans-serif', fontSize: 10.5, fontWeight: 600,
        letterSpacing: '0.16em', textTransform: 'uppercase',
        color: 'rgba(120,90,55,0.55)', marginBottom: 10,
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
        textAlign: 'center', margin: '0 0 18px',
        letterSpacing: '-0.025em',
      }}>
        {active.highlight}
      </h2>

      {active.body && (
        <p style={{
          fontFamily: 'DM Sans,sans-serif',
          fontSize: 'clamp(13px,1.5vw,16px)',
          color: 'rgba(60,40,20,0.55)',
          textAlign: 'center', maxWidth: 440,
          lineHeight: 1.65, margin: 0,
        }}>
          {active.body}
        </p>
      )}
    </div>
  )
}

export function BookOverlay({ scrollT }) {
  const raw = clamp((scrollT - 0.43) / 0.10, 0, 1) * clamp((0.57 - scrollT) / 0.06, 0, 1)
  const op = easeOut3(raw)
  if (op < 0.01) return null

  return (
    <div style={{
      position: 'absolute', top: '50%', left: '50%',
      transform: `translate(-40%, -50%) scale(${lerp(0.90, 1, easeOut3(raw))})`,
      opacity: op, zIndex: 8, pointerEvents: 'none', textAlign: 'left',
      width: 'clamp(130px,18vw,210px)',
    }}>
      <div style={{
        fontFamily: 'DM Sans,sans-serif', fontSize: 'clamp(7px,0.9vw,10px)',
        fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
        color: 'rgba(60,40,18,0.40)',
        marginBottom: 7,
      }}>
        Chapter I
      </div>

      <div style={{
        fontFamily: 'Georgia,"Times New Roman",serif',
        fontSize: 'clamp(15px,2.2vw,26px)',
        fontWeight: 700, lineHeight: 1.25,
        color: '#2A1C0C',
        letterSpacing: '-0.01em',
      }}>
        What after<br />12th??
      </div>

      <div style={{
        width: '60%', height: 1,
        background: 'rgba(60,35,10,0.22)',
        margin: '9px 0',
      }} />

      <div style={{
        fontFamily: 'Georgia,"Times New Roman",serif',
        fontSize: 'clamp(9px,1.1vw,12.5px)',
        color: 'rgba(60,40,20,0.78)',
        lineHeight: 1.55,
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

  const msgOp = easeOut3(clamp((scrollT - 0.64) / 0.06, 0, 1))
  const noRepOp = easeOut3(clamp((scrollT - 0.70) / 0.05, 0, 1))

  return (
    <div style={{
      position: 'absolute', top: '50%', left: '50%',
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
          background: 'rgba(42,28,12,0.78)',
          borderRadius: '10px 10px 10px 2px',
          padding: '7px 10px',
          fontFamily: 'DM Sans,sans-serif', fontSize: 'clamp(9px,1.1vw,11px)',
          color: '#E8D8C0',
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
          background: 'rgba(92,48,12,0.85)',
          borderRadius: '10px 10px 2px 10px',
          padding: '7px 10px',
          fontFamily: 'DM Sans,sans-serif', fontSize: 'clamp(9px,1.1vw,11px)',
          color: '#F0E0C4', lineHeight: 1.4, textAlign: 'right',
        }}>
          Which branch should I take?<br />
          <span style={{ opacity: 0.8 }}>Please reply bhaiya 🙏</span>
          <div style={{ fontSize: 9, color: 'rgba(240,220,180,0.45)', marginTop: 3 }}>
            ✓✓ Seen
          </div>
        </div>
      </div>

      <div style={{
        opacity: noRepOp, alignSelf: 'center',
        background: 'rgba(42,28,12,0.12)',
        border: '1px solid rgba(42,28,12,0.18)',
        borderRadius: 100, padding: '4px 12px',
        fontFamily: 'DM Sans,sans-serif', fontSize: 'clamp(8px,1.0vw,10px)',
        color: 'rgba(42,28,12,0.55)',
        fontStyle: 'italic',
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
      position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
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

export function HeroCTA({ scrollT }) {
  const op = easeOut3(clamp((scrollT - 0.90) / 0.07, 0, 1))
  if (op < 0.01) return null

  return (
    <>
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%',
        background: 'linear-gradient(to top, #EAEAEA 30%, rgba(234,234,234,0.75) 65%, transparent)',
        zIndex: 11, pointerEvents: 'none', opacity: op,
      }} />

      <div style={{
        position: 'absolute', bottom: '4%', left: 0, right: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        zIndex: 15, opacity: op,
        transform: `translateY(${lerp(24, 0, op)}px)`,
        pointerEvents: op > 0.6 ? 'auto' : 'none',
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
            Peer mentorship for Indian students
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
            { label: "I'm a School Student", color: '#059669', href: `${FRONTEND}/?role=student`, shadow: 'rgba(5,150,105,0.35)' },
            { label: "Become a college Insider", color: '#D97706', href: `${FRONTEND}/?role=insider`, shadow: 'rgba(217,119,6,0.35)' },
            { label: "Become a Mentor", color: '#7C3AED', href: `${FRONTEND}/?role=mentor`, shadow: 'rgba(124,58,237,0.35)' },
          ].map(b => (
            <a key={b.label} href={b.href} target="_blank" rel="noopener noreferrer"
              style={{
                fontFamily: 'Syne,sans-serif', fontSize: 13.5, fontWeight: 700,
                color: '#fff', background: b.color, borderRadius: 14,
                padding: '12px 24px', textDecoration: 'none',
                boxShadow: `0 4px 18px ${b.shadow}`, letterSpacing: '0.01em',
                transition: 'all 0.22s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 28px ${b.shadow}` }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 18px ${b.shadow}` }}
            >
              {b.label}
            </a>
          ))}
        </div>
      </div>
    </>
  )
}
