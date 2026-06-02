import { useState, useEffect } from 'react'
import { LAUNCH } from './constants'

export function useCountdown() {
  const [t, setT] = useState({ d: 19, h: 0, m: 0, s: 0 })
  useEffect(() => {
    const tick = () => {
      const d = Math.max(0, LAUNCH - Date.now())
      setT({ d: Math.floor(d / 86400000), h: Math.floor((d % 86400000) / 3600000), m: Math.floor((d % 3600000) / 60000), s: Math.floor((d % 60000) / 1000) })
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])
  return t
}
