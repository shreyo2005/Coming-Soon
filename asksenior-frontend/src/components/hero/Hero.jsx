import React, { useRef, useEffect, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { HERO_VH } from '../../utils/constants'
import { OgScene } from './HeroScene'
import { StoryPanel, BookOverlay, ChatOverlay, StageDots, ScrollHint, HeroCTA } from './HeroOverlays'

export function Hero({ scrollT, setScrollT, go }) {
  const sectionRef = useRef()
  const stepRef = useRef(0)
  const currentTRef = useRef(scrollT)
  const lastEventTime = useRef(0)

  const TARGETS = [0.0, 0.30, 0.45, 0.65, 0.82, 1.0]

  useEffect(() => {
    let animationFrameId

    const tick = () => {
      const targetT = TARGETS[stepRef.current]
      const currentT = currentTRef.current
      const diff = targetT - currentT

      if (Math.abs(diff) > 0.0001) {
        let stepDelta = diff * 0.03

        const maxSpeed = 0.004
        if (Math.abs(stepDelta) > maxSpeed) stepDelta = Math.sign(stepDelta) * maxSpeed

        const newT = currentT + stepDelta
        currentTRef.current = Math.abs(targetT - newT) < 0.001 ? targetT : newT
        setScrollT(currentTRef.current)
      }

      // Lock the page scroll entirely while the user is still progressing through the Hero steps.
      // Only unlock when they have fully reached the final frame (currentT = 1.0)
      if (currentTRef.current < 0.99) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = 'auto'
      }

      animationFrameId = requestAnimationFrame(tick)
    }

    const handleWheel = (e) => {
      if (window.scrollY > 5) return;

      const now = Date.now()

      if (Math.abs(e.deltaY) < 12) return;

      // Scrolling DOWN
      if (e.deltaY > 0) {
        if (stepRef.current < 5) {
          e.preventDefault()
          if (now - lastEventTime.current > 800) {
            stepRef.current = Math.min(5, stepRef.current + 1)
            lastEventTime.current = now
          }
        }
      }
      // Scrolling UP
      else if (e.deltaY < 0) {
        if (stepRef.current > 0) {
          e.preventDefault()
          if (now - lastEventTime.current > 800) {
            stepRef.current = Math.max(0, stepRef.current - 1)
            lastEventTime.current = now
          }
        }
      }
    }

    let touchStartY = 0
    const handleTouchStart = (e) => { touchStartY = e.touches[0].clientY }
    const handleTouchMove = (e) => {
      if (window.scrollY > 5) return;
      const touchY = e.touches[0].clientY
      const deltaY = touchStartY - touchY

      const now = Date.now()

      if (deltaY > 15) {
        if (stepRef.current < 5) {
          e.preventDefault()
          if (now - lastEventTime.current > 800) {
            stepRef.current = Math.min(5, stepRef.current + 1)
            lastEventTime.current = now
          }
        }
      } else if (deltaY < -15) {
        if (stepRef.current > 0) {
          e.preventDefault()
          if (now - lastEventTime.current > 800) {
            stepRef.current = Math.max(0, stepRef.current - 1)
            lastEventTime.current = now
          }
        }
      }
    }

    // passive: false is required to allow e.preventDefault()
    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })

    tick()

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      cancelAnimationFrame(animationFrameId)
      document.body.style.overflow = 'auto' // ensure cleanup
    }
  }, [setScrollT])

  return (
    <div ref={sectionRef} style={{ height: `${HERO_VH}vh`, position: 'relative' }}>
      {/* Sticky viewport: sticks until user scrolls past the section */}
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
        {/* R3F canvas — fills the sticky container */}
        <Canvas
          gl={{ antialias: true, powerPreference: 'high-performance' }}
          camera={{ fov: 45, position: [0, 0.1, 5.0], near: 0.1, far: 60 }}
          dpr={[1, 1.5]}
          style={{ position: 'absolute', inset: 0 }}
        >
          <Suspense fallback={null}>
            <OgScene scrollT={scrollT} />
          </Suspense>
        </Canvas>

        {/* HTML overlays */}
        <StoryPanel scrollT={scrollT} />
        <BookOverlay scrollT={scrollT} />
        <ChatOverlay scrollT={scrollT} />
        <StageDots scrollT={scrollT} />
        <ScrollHint scrollT={scrollT} />
        <HeroCTA scrollT={scrollT} go={go} />

        {/* Seamless transition at bottom from cream hero to cream content below */}
        {scrollT >= 0.99 && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
            background: 'linear-gradient(to bottom, transparent, #F5F0E8)',
            zIndex: 20, pointerEvents: 'none',
          }} />
        )}
      </div>
    </div>
  )
}
