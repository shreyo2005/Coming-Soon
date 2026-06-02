import React, { useState, useEffect } from 'react'

export function Loader({ onDone }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const s = Date.now(), id = setInterval(() => {
      const p = Math.min((Date.now() - s) / 2200 * 100, 100)
      setN(Math.round(p)); if (p >= 100) { clearInterval(id); onDone() }
    }, 30)
    return () => clearInterval(id)
  }, []) // eslint-disable-line
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: '#0E0B07', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 28, fontWeight: 800, color: '#fff' }}>
        og<span style={{ color: '#059669' }}>senior</span>
      </div>
      <div style={{ width: 180, height: 2, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
        <div style={{ width: `${n}%`, height: '100%', background: 'linear-gradient(90deg,#F59E0B,#EC7C30)', borderRadius: 2, transition: 'width 0.04s' }} />
      </div>
      <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>{n}%</p>
    </div>
  )
}
