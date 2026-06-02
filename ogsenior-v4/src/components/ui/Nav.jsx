import React, { useState, useEffect } from 'react'

export function Nav({ cd, scrollT }) {
  const [sc, setSc] = useState(false)

  useEffect(() => {
    const fn = () => {
      setSc(window.scrollY > 60)
    }
    window.addEventListener('scroll', fn, { passive: true }); return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <nav id="og-nav" style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 48px',
      background: sc ? 'rgba(240,234,226,0.92)' : 'transparent',
      backdropFilter: sc ? 'blur(14px)' : 'none',
      borderBottom: sc ? '1px solid rgba(80,60,30,0.08)' : 'none',
      transition: 'all 0.35s',
    }}>
      <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 800, color: '#111' }}>
        og<span style={{ color: '#059669' }}>senior</span>
      </span>
      <div className="nav-status" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#059669', animation: 'ogpulse 2s ease-in-out infinite' }} />
        <span style={{
          fontFamily: 'DM Sans,sans-serif', fontSize: 12.5,
          color: 'rgba(80,55,25,0.55)',
        }}>
          Launching June 20 · {cd?.d || 0}d {String(cd?.h || 0).padStart(2, '0')}h away
        </span>
      </div>
    </nav>
  )
}
