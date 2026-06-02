import React, { useState } from 'react'
import { FRONTEND } from '../../utils/constants'

const F = {
  display: { fontFamily: 'Syne,sans-serif', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.12, color: '#111' },
  body: { fontFamily: 'DM Sans,sans-serif', fontSize: 15.5, color: '#6B7280', lineHeight: 1.72 },
  eyebrow: { fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 },
  wrap: { maxWidth: 1060, margin: '0 auto', padding: '0 24px' },
}

export function ProblemSection() {
  const cards = [
    { icon: '⚠️', title: 'Advice with conflicts of interest', accent: '#EF4444', body: "Traditional counsellors are paid by colleges to send students there. Their incentive was never your future — it was their commission." },
    { icon: '🔇', title: 'Silence from the people who matter', accent: '#F59E0B', body: "You messaged seniors on LinkedIn, WhatsApp, Reddit. Most never replied. Nobody had skin in the game." },
    { icon: '📅', title: 'Outdated, biased, wrong', accent: '#7C3AED', body: "AI tells you what it thinks you want to hear. Google results from 2019. YouTube videos from coaching institutes with an agenda. Nobody telling you what's actually true right now." },
  ]
  return (
    <section style={{ background: '#FAF8F4', padding: '100px 24px' }}>
      <div style={F.wrap}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <p style={{ ...F.eyebrow, color: '#EF4444' }}>The real problem</p>
          <h2 style={{ ...F.display, fontSize: 'clamp(28px,4.5vw,46px)' }}>The system was never<br />built for you.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))', gap: 20 }}>
          {cards.map((c, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #F3F4F6', borderLeft: `4px solid ${c.accent}`, borderRadius: 16, padding: '28px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{c.icon}</div>
              <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 17, fontWeight: 700, color: '#111', marginBottom: 10, lineHeight: 1.35 }}>{c.title}</h3>
              <p style={{ ...F.body, fontSize: 14.5 }}>{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function HowItWorksSection() {
  const steps = [
    { n: '01', color: '#059669', label: 'Choose who you need', sub: 'Insider for college life,\nMentor for career decisions.' },
    { n: '02', color: '#D97706', label: 'Book a session', sub: 'Starting at ₹19.\nInstant confirmation.' },
    { n: '03', color: '#7C3AED', label: 'Get real answers', sub: 'No curation. No delay.\nHonest advice.' },
  ]
  return (
    <section style={{ background: '#fff', padding: '100px 24px' }}>
      <div style={F.wrap}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <p style={{ ...F.eyebrow, color: '#7C3AED' }}>How it works</p>
          <h2 style={{ ...F.display, fontSize: 'clamp(26px,4vw,44px)', marginBottom: 14 }}>Three steps.<br />One honest conversation.</h2>
          <p style={{ ...F.body, maxWidth: 460, margin: '0 auto' }}>We connect students with Insiders and Mentors who get paid for genuine advice. When real money is on the line, real answers follow.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', border: '1px solid #F3F4F6', borderRadius: 20, overflow: 'hidden', marginBottom: 60 }}>
          {steps.map((st, i) => (
            <div key={i} style={{ padding: '32px 28px', borderRight: i < 2 ? '1px solid #F3F4F6' : 'none', background: '#fff' }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 800, color: st.color, letterSpacing: '0.06em', marginBottom: 10 }}>{st.n}</div>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 8 }}>{st.label}</div>
              <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: '#9CA3AF', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{st.sub}</div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <p style={{ ...F.eyebrow, color: '#059669' }}>Watch the story</p>
          <h3 style={{ ...F.display, fontSize: 'clamp(20px,3vw,30px)', marginBottom: 24 }}>Why we built OgSenior</h3>
        </div>
        <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto', borderRadius: 20, overflow: 'hidden', aspectRatio: '16/9', boxShadow: '0 20px 60px rgba(0,0,0,0.1)', border: '1px solid #F3F4F6' }}>
          <iframe width="100%" height="100%" src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1" title="Why we built OgSenior" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
        </div>
      </div>
    </section>
  )
}

function RoleCard({ r, go }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={() => go(r.key)}
      style={{ background: hov ? `rgba(${r.rgb},0.04)` : '#fff', border: `1px solid ${hov ? r.color : '#F3F4F6'}`, borderRadius: 18, padding: '28px 24px', transition: 'all 0.3s ease', transform: hov ? 'translateY(-4px)' : 'none', boxShadow: hov ? `0 12px 32px rgba(${r.rgb},0.12)` : '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
      <span style={{ display: 'inline-block', alignSelf: 'flex-start', background: `rgba(${r.rgb},0.12)`, color: r.color, fontFamily: 'Syne,sans-serif', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 100, marginBottom: 16 }}>{r.label}</span>
      <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 10, lineHeight: 1.28, flexGrow: 1, whiteSpace: 'pre-line' }}>{r.headline}</h3>
      <p style={{ ...F.body, fontSize: 14, marginBottom: 20 }}>{r.body}</p>
      <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 16, marginBottom: 18 }}>
        {r.stats.map((st, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><div style={{ width: 5, height: 5, borderRadius: '50%', background: r.color, flexShrink: 0 }} /><span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#9CA3AF' }}>{st}</span></div>))}
      </div>
      <button onClick={e => { e.stopPropagation(); go(r.key); }} style={{ display: 'block', width: '100%', textAlign: 'center', color: hov ? '#fff' : r.color, background: hov ? r.color : 'transparent', border: `1.5px solid ${r.color}`, borderRadius: 10, padding: '11px', fontFamily: 'Syne,sans-serif', fontSize: 13.5, fontWeight: 700, transition: 'all 0.2s', cursor: 'pointer' }}>{r.cta} →</button>
    </div>
  )
}

export function RolesSection({ go }) {
  const roles = [
    { key: 'student', label: 'Student', color: '#059669', rgb: '5,150,105', headline: 'Real advice\nbefore you choose.', body: "Before you pick a college, a branch, a career — talk to someone who's already living it. Verified. Accountable. Real.", stats: ['Sessions from ₹19', 'Verified Insiders & Mentors', 'Same-day response', 'Instant booking & live QnA'], cta: 'Join as a Student' },
    { key: 'insider', label: 'Insider', color: '#D97706', rgb: '217,119,6', headline: 'Your experience\nis worth money.', body: "You've navigated what thousands of students are figuring out. Your knowledge of college life, placements — it has real value.", stats: ['₹150–300 per session', 'Set your own pricing', 'Only 3–4 hrs/week work', 'Paid directly to UPI'], cta: 'Become a college Insider' },
    { key: 'mentor', label: 'Mentor', color: '#7C3AED', rgb: '124,58,237', headline: 'Your industry\nknowledge matters.', body: "Tell students what you wish someone had told you. Earn consistently on the side without competing with what you're building.", stats: ['₹150–300 per session', 'Set your own schedule', 'Strictly vetted students'], cta: 'Become a Mentor' },
  ]
  return (
    <section style={{ background: '#FAF8F4', padding: '100px 24px' }}>
      <div style={F.wrap}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <p style={{ ...F.eyebrow, color: '#D97706' }}>Where do you belong?</p>
          <h2 style={{ ...F.display, fontSize: 'clamp(26px,4vw,44px)' }}>Three kinds of people.<br />One network.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
          {roles.map(r => <RoleCard key={r.key} r={r} go={go} />)}
        </div>
      </div>
    </section>
  )
}

export function WaitlistSection({ cd, go }) {
  const [form, setForm] = useState({ email: '', role: 'student', done: false, busy: false })
  const [foc, setFoc] = useState(false)
  const submit = () => { go(form.role); }
  const ticks = [{ v: cd?.d || 0, l: 'Days', c: '#059669' }, { v: cd?.h || 0, l: 'Hours', c: '#D97706' }, { v: cd?.m || 0, l: 'Mins', c: '#7C3AED' }, { v: cd?.s || 0, l: 'Secs', c: 'rgba(255,255,255,0.3)' }]
  return (
    <section style={{ background: '#111', padding: '100px 24px' }}>
      <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
        <p style={{ ...F.eyebrow, color: 'rgba(255,255,255,0.3)' }}>Going live in</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 44, alignItems: 'flex-start' }}>
          {ticks.map((tk, i) => (<div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>{i > 0 && <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(20px,4vw,42px)', fontWeight: 300, color: 'rgba(255,255,255,0.12)', lineHeight: 1.05 }}>:</div>}<div style={{ textAlign: 'center', minWidth: 50 }}><div style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(24px,4.5vw,50px)', fontWeight: 800, color: tk.c, lineHeight: 1, letterSpacing: '-0.02em' }}>{String(tk.v).padStart(2, '0')}</div><div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>{tk.l}</div></div></div>))}
        </div>
        <h2 style={{ ...F.display, fontSize: 'clamp(24px,4vw,38px)', color: '#fff', marginBottom: 8 }}>Be the first in.</h2>
        <p style={{ ...F.body, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>Early users get priority access on launch day.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, maxWidth: 360, margin: '0 auto' }}>
          <button onClick={() => go('student')} style={{ background: 'linear-gradient(135deg,#059669,#D97706)', border: 'none', borderRadius: 10, padding: '13px', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', transition: 'opacity 0.2s', letterSpacing: '0.02em', boxShadow: '0 4px 20px rgba(5,150,105,0.3)' }}>
            Join as a Student →
          </button>
          <button onClick={() => go('insider')} style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '13px', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', transition: 'opacity 0.2s', letterSpacing: '0.02em' }}>
            Become a college Insider →
          </button>
          <button onClick={() => go('mentor')} style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '13px', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', transition: 'opacity 0.2s', letterSpacing: '0.02em' }}>
            Become a Mentor →
          </button>
        </div>
      </div>
    </section>
  )
}
