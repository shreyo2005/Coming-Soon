import React from 'react'

export function Footer() {
  return (
    <footer style={{ background: '#0A0A0A', padding: '26px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
      <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, color: '#fff' }}>og<span style={{ color: '#059669' }}>senior</span></span>
      <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>"Ask before you choose." · June 20, 2026</span>
      <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.18)' }}>Built in India 🇮🇳</span>
    </footer>
  )
}
