import React from 'react'

export function Footer({ go }) {
  return (
    <footer style={{ background: '#0A0A0A', padding: '26px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
      <img
        src="/logo.png"
        alt="OG Senior"
        style={{ height: 32, width: 'auto', objectFit: 'contain', display: 'block' }}
      />
      <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>"Ask before you choose." · July 1, 2026</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.18)' }}>Built in India 🇮🇳</span>
        <button onClick={() => go('admin')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.18)', fontSize: 11, cursor: 'pointer', textDecoration: 'underline' }}>Admin</button>
      </div>
    </footer>
  )
}
