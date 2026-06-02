import { useRef, useState, useEffect, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { RoundedBox, ContactShadows } from '@react-three/drei'
import { EffectComposer, DepthOfField, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'

// ─── Config ───────────────────────────────────────────────────────────────
const FRONTEND = 'https://asksenior-frontend.vercel.app'
const LAUNCH   = new Date('2026-06-20T00:00:00+05:30').getTime()
const CAM_START = 14
const CAM_END   = 1.6
const DESK_COLOR = '#F7F2EA'

const OVERLAY_TEXTS = [
  { from: 0.00, to: 0.18, top: false, text: "Every student's story\nstarts here." },
  { from: 0.18, to: 0.38, top: false, text: "The most important decision\nof your life." },
  { from: 0.38, to: 0.58, top: false, text: "Made with\nthe wrong information." },
  { from: 0.58, to: 0.78, top: false, text: "You reached out.\nNobody answered." },
  { from: 0.78, to: 0.92, top: false, text: "Until now." },
]

const Z = { t: 0, target: 0, released: false }
const lerp  = (a, b, t) => a + (b - a) * t
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const ease  = t => t < 0.5 ? 2*t*t : -1+(4-2*t)*t
const easeOut = t => 1 - Math.pow(1 - t, 3)

// ─── Countdown ────────────────────────────────────────────────────────────
function useCountdown() {
  const [t, setT] = useState({ d: 19, h: 0, m: 0, s: 0 })
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, LAUNCH - Date.now())
      setT({ d: Math.floor(diff/86400000), h: Math.floor((diff%86400000)/3600000),
             m: Math.floor((diff%3600000)/60000), s: Math.floor((diff%60000)/1000) })
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])
  return t
}

// ─── Canvas texture for handwriting ──────────────────────────────────────
function useHandwritingTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width  = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')

    // Notebook page background
    ctx.fillStyle = '#FFFCF5'
    ctx.fillRect(0, 0, 512, 512)

    // Red margin line
    ctx.strokeStyle = '#F4A0A0'
    ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(80, 0); ctx.lineTo(80, 512); ctx.stroke()

    // Ruled lines
    ctx.strokeStyle = '#C8D8F0'
    ctx.lineWidth = 1
    for (let y = 60; y < 512; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke()
    }

    // Main handwriting text
    ctx.fillStyle = '#1A0F00'
    ctx.font = 'bold 62px Georgia, serif'
    ctx.textAlign = 'center'

    // Simulate handwriting with slight rotation variations
    ctx.save()
    ctx.translate(256, 190)
    ctx.rotate(-0.025)
    ctx.fillText('What after', 0, 0)
    ctx.restore()

    ctx.save()
    ctx.translate(256, 265)
    ctx.rotate(0.02)
    ctx.fillText('12th??', 0, 0)
    ctx.restore()

    // Doodle elements
    ctx.strokeStyle = '#8B7355'
    ctx.lineWidth = 2

    // Star doodle top-right
    const drawStar = (cx, cy, r, pts) => {
      ctx.beginPath()
      for (let i = 0; i < pts * 2; i++) {
        const ang = (i * Math.PI) / pts - Math.PI / 2
        const rad = i % 2 === 0 ? r : r * 0.4
        i === 0 ? ctx.moveTo(cx + Math.cos(ang)*rad, cy + Math.sin(ang)*rad)
                : ctx.lineTo(cx + Math.cos(ang)*rad, cy + Math.sin(ang)*rad)
      }
      ctx.closePath()
      ctx.fillStyle = '#D4A050'
      ctx.fill()
    }
    drawStar(420, 80, 18, 5)
    drawStar(90, 420, 14, 5)

    // Question mark circles
    ctx.strokeStyle = '#B0A898'
    ctx.lineWidth = 1.5
    ctx.font = '28px Georgia, serif'
    ctx.fillStyle = '#B0A898'
    ctx.textAlign = 'center'
    ctx.fillText('?', 140, 380)
    ctx.fillText('...', 370, 420)

    // Underline under text
    ctx.strokeStyle = '#8B7355'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(120, 285); ctx.lineTo(390, 285)
    ctx.stroke()

    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }, [])
}

// ─── Canvas texture for phone screen ────────────────────────────────────
function usePhoneTextures() {
  const chatTex = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width  = 400
    canvas.height = 700
    const ctx = canvas.getContext('2d')

    // Dark background
    ctx.fillStyle = '#1A1A2E'
    ctx.fillRect(0, 0, 400, 700)

    // Status bar
    ctx.fillStyle = '#2A2A3E'
    ctx.fillRect(0, 0, 400, 44)
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.font = '14px -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('9:41', 18, 30)
    ctx.textAlign = 'right'
    ctx.fillText('●●●', 382, 30)

    // Chat header
    ctx.fillStyle = '#252538'
    ctx.fillRect(0, 44, 400, 56)
    ctx.beginPath()
    ctx.arc(56, 72, 18, 0, Math.PI * 2)
    ctx.fillStyle = '#4A4A6A'
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.font = 'bold 14px -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Rahul bhaiya', 86, 68)
    ctx.fillStyle = '#10b981'
    ctx.font = '11px -apple-system, sans-serif'
    ctx.fillText('● Online', 86, 86)

    // Helper: rounded rect
    const rr = (x, y, w, h, r) => {
      ctx.beginPath()
      ctx.moveTo(x+r, y)
      ctx.lineTo(x+w-r, y)
      ctx.quadraticCurveTo(x+w, y, x+w, y+r)
      ctx.lineTo(x+w, y+h-r)
      ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h)
      ctx.lineTo(x+r, y+h)
      ctx.quadraticCurveTo(x, y+h, x, y+h-r)
      ctx.lineTo(x, y+r)
      ctx.quadraticCurveTo(x, y, x+r, y)
      ctx.closePath()
    }

    // Received messages (left)
    const recvMsgs = [
      { y: 130, text: "Hey, kya hua?", w: 130 },
      { y: 190, text: "Sab theek?", w: 108 },
      { y: 250, text: "Busy hoon, baad mein baat karte", w: 260 },
    ]
    recvMsgs.forEach(m => {
      rr(16, m.y, m.w, 38, 12)
      ctx.fillStyle = '#2C2C45'
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.82)'
      ctx.font = '13px -apple-system, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(m.text, 28, m.y + 24)
    })

    // Sent message (right) - the key one
    const sentY = 340
    rr(50, sentY, 334, 68, 14)
    ctx.fillStyle = '#2463EB'
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = '13px -apple-system, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Which branch lena chahiye?', 64, sentY + 24)
    ctx.fillText('Please reply bhaiya 🙏', 64, sentY + 44)

    // Read receipt
    ctx.fillStyle = '#8888AA'
    ctx.font = '11px -apple-system, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('✓✓  Seen', 384, sentY + 84)

    // Timestamp
    ctx.fillStyle = '#4A4A6A'
    ctx.font = '11px -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Yesterday 11:32 PM', 200, 460)

    // "Still no reply..." indicator
    ctx.fillStyle = '#3A3A5A'
    rr(120, 490, 160, 28, 14)
    ctx.fill()
    ctx.fillStyle = '#6666AA'
    ctx.font = '11px -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('No reply...', 200, 509)

    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }, [])

  const revealTex = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width  = 400
    canvas.height = 700
    const ctx = canvas.getContext('2d')

    // Light background
    ctx.fillStyle = '#FAFAF8'
    ctx.fillRect(0, 0, 400, 700)

    // OgSenior branding
    ctx.font = 'bold 48px Georgia, serif'
    ctx.fillStyle = '#059669'
    ctx.textAlign = 'center'
    ctx.fillText('og', 145, 260)
    ctx.fillStyle = '#111'
    ctx.fillText('senior', 260, 260)

    // Tagline
    ctx.font = 'bold 26px Georgia, serif'
    ctx.fillStyle = '#111'
    ctx.textAlign = 'center'
    ctx.fillText('Ask before', 200, 330)
    ctx.fillText('you choose.', 200, 365)

    // Divider
    ctx.strokeStyle = '#E5E7EB'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(60, 395); ctx.lineTo(340, 395); ctx.stroke()

    // Sub text
    ctx.font = '16px -apple-system, sans-serif'
    ctx.fillStyle = '#6B7280'
    ctx.textAlign = 'center'
    ctx.fillText('Real advice from people', 200, 430)
    ctx.fillText("who've been there.", 200, 452)

    // Notification badge
    ctx.beginPath()
    ctx.arc(200, 530, 32, 0, Math.PI * 2)
    ctx.fillStyle = '#059669'
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 22px -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('✓', 200, 539)

    ctx.fillStyle = '#059669'
    ctx.font = 'bold 14px -apple-system, sans-serif'
    ctx.fillText("You're early.", 200, 590)
    ctx.fillStyle = '#9CA3AF'
    ctx.font = '12px -apple-system, sans-serif'
    ctx.fillText('Launching June 20, 2026', 200, 612)

    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }, [])

  return { chatTex, revealTex }
}

// ─── 3D: DESK ─────────────────────────────────────────────────────────────
function Desk() {
  return (
    <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, -0.015, 0]} receiveShadow>
      <planeGeometry args={[30, 30]} />
      <meshStandardMaterial color={DESK_COLOR} roughness={0.95} metalness={0} />
    </mesh>
  )
}

// ─── 3D: NOTEBOOK ─────────────────────────────────────────────────────────
function Notebook() {
  const tex = useHandwritingTexture()

  // Spiral positions
  const spirals = useMemo(() => {
    const arr = []
    for (let i = 0; i < 13; i++) arr.push(-1.4 + i * 0.225)
    return arr
  }, [])

  // Page stack positions
  const pages = useMemo(() => {
    const arr = []
    for (let i = 0; i < 5; i++) arr.push(0.022 + i * 0.008)
    return arr
  }, [])

  return (
    <group position={[-1.55, 0, 0.15]} rotation={[0, 0.05, 0]}>
      {/* Back cover */}
      <mesh position={[0, -0.04, 0]} receiveShadow castShadow>
        <boxGeometry args={[2.9, 0.025, 3.9]} />
        <meshStandardMaterial color="#D4C9B8" roughness={0.9} />
      </mesh>

      {/* Page stack (visible from side) */}
      {pages.map((y, i) => (
        <mesh key={i} position={[0.04, y, 0]}>
          <boxGeometry args={[2.78, 0.007, 3.8]} />
          <meshStandardMaterial color={`hsl(40, ${15 - i*2}%, ${96 + i}%)`} roughness={1} />
        </mesh>
      ))}

      {/* Top page with handwriting texture */}
      <mesh position={[0, 0.065, 0]} receiveShadow castShadow>
        <boxGeometry args={[2.82, 0.006, 3.82]} />
        <meshStandardMaterial map={tex} roughness={0.95} />
      </mesh>

      {/* Spiral binding — FILLED cylinders (not torus) */}
      {spirals.map((z, i) => (
        <group key={i} position={[-1.5, 0.055, z]}>
          {/* Outer ring */}
          <mesh rotation={[Math.PI/2, 0, 0]}>
            <torusGeometry args={[0.065, 0.022, 8, 16]} />
            <meshStandardMaterial color="#9A8A7A" roughness={0.5} metalness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Pen resting on notebook */}
      <group position={[1.1, 0.08, 1.6]} rotation={[0, -0.3, 0]}>
        <mesh>
          <cylinderGeometry args={[0.028, 0.028, 1.9, 10]} />
          <meshStandardMaterial color="#2563EB" roughness={0.4} metalness={0.1} />
        </mesh>
        {/* Pen tip */}
        <mesh position={[0, -0.98, 0]}>
          <coneGeometry args={[0.028, 0.12, 10]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.5} />
        </mesh>
        {/* Pen clip */}
        <mesh position={[0.03, 0.6, 0]}>
          <boxGeometry args={[0.012, 0.8, 0.022]} />
          <meshStandardMaterial color="#1D4ED8" roughness={0.4} metalness={0.3} />
        </mesh>
      </group>
    </group>
  )
}

// ─── 3D: PHONE ────────────────────────────────────────────────────────────
function Phone({ zoomT }) {
  const { chatTex, revealTex } = usePhoneTextures()
  const screenMatRef = useRef()
  const glowRef = useRef()

  const revealProg = clamp((zoomT - 0.78) / 0.22, 0, 1)
  const easedRev   = easeOut(revealProg)

  useFrame(() => {
    if (screenMatRef.current) {
      screenMatRef.current.map = easedRev > 0.5 ? revealTex : chatTex
      screenMatRef.current.emissiveIntensity = lerp(0.05, 0.35, easedRev)
      screenMatRef.current.needsUpdate = true
    }
    if (glowRef.current) {
      glowRef.current.material.opacity = easedRev * 0.3
      glowRef.current.material.needsUpdate = true
    }
  })

  return (
    <group position={[1.6, 0, -0.1]} rotation={[0, -0.06, 0]}>
      {/* Phone body */}
      <RoundedBox
        args={[1.75, 0.072, 3.3]}
        radius={0.08}
        smoothness={6}
        castShadow receiveShadow
      >
        <meshStandardMaterial color="#18181B" roughness={0.25} metalness={0.5} />
      </RoundedBox>

      {/* Screen bezel */}
      <mesh position={[0, 0.038, 0]}>
        <boxGeometry args={[1.64, 0.004, 3.18]} />
        <meshStandardMaterial color="#0A0A0F" roughness={0.1} metalness={0.2} />
      </mesh>

      {/* Screen display */}
      <mesh position={[0, 0.044, 0]}>
        <boxGeometry args={[1.58, 0.002, 3.06]} />
        <meshStandardMaterial
          ref={screenMatRef}
          map={chatTex}
          emissive="#334488"
          emissiveIntensity={0.05}
          roughness={0.05}
          metalness={0.0}
        />
      </mesh>

      {/* Screen glow overlay */}
      <mesh ref={glowRef} position={[0, 0.05, 0]}>
        <boxGeometry args={[1.62, 0.001, 3.1]} />
        <meshBasicMaterial
          color="#E8F5E9"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Side buttons */}
      <mesh position={[0.89, 0.01, 0.4]}>
        <boxGeometry args={[0.02, 0.03, 0.28]} />
        <meshStandardMaterial color="#28282F" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[-0.89, 0.01, -0.2]}>
        <boxGeometry args={[0.02, 0.03, 0.42]} />
        <meshStandardMaterial color="#28282F" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Camera bump */}
      <mesh position={[-0.42, 0.044, -1.28]}>
        <boxGeometry args={[0.42, 0.01, 0.38]} />
        <meshStandardMaterial color="#222228" roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Screen glow light at reveal */}
      <pointLight
        position={[0, 0.3, 0]}
        color="#A7F3D0"
        intensity={easedRev * 2}
        distance={3}
      />
    </group>
  )
}

// ─── 3D: FLOATING PARTICLES ───────────────────────────────────────────────
function Particles() {
  const meshRef = useRef()
  const N = 28

  const data = useMemo(() => {
    const pos = [], rot = [], spd = [], sz = []
    for (let i = 0; i < N; i++) {
      pos.push((Math.random()-0.5)*10, Math.random()*2.5+0.05, (Math.random()-0.5)*8)
      rot.push(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI)
      spd.push(0.002 + Math.random()*0.003)
      sz.push(0.04 + Math.random()*0.06, 0.001, 0.06 + Math.random()*0.08)
    }
    return { pos, rot, spd, sz }
  }, [])

  const pos = useRef([...data.pos])
  const rot = useRef([...data.rot])
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame(() => {
    if (!meshRef.current) return
    for (let i = 0; i < N; i++) {
      pos.current[i*3+1] += data.spd[i]
      if (pos.current[i*3+1] > 3.5) pos.current[i*3+1] = 0.05
      rot.current[i*3]   += 0.004
      rot.current[i*3+1] += 0.003
      dummy.position.set(pos.current[i*3], pos.current[i*3+1], pos.current[i*3+2])
      dummy.rotation.set(rot.current[i*3], rot.current[i*3+1], rot.current[i*3+2])
      dummy.scale.set(data.sz[i*3], data.sz[i*3+1], data.sz[i*3+2])
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[null, null, N]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#D4C8B8" roughness={1} transparent opacity={0.55} />
    </instancedMesh>
  )
}

// ─── 3D: EXTRA DESK ITEMS ─────────────────────────────────────────────────
function DeskItems() {
  return (
    <group>
      {/* Eraser */}
      <mesh position={[-2.6, 0.03, 1.2]} rotation={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.5, 0.06, 0.22]} />
        <meshStandardMaterial color="#F9CACA" roughness={0.9} />
      </mesh>
      {/* Small coin */}
      <mesh position={[2.8, 0.012, 1.5]} rotation={[-Math.PI/2, 0, 0.2]}>
        <cylinderGeometry args={[0.12, 0.12, 0.015, 20]} />
        <meshStandardMaterial color="#C8A840" roughness={0.4} metalness={0.7} />
      </mesh>
      {/* Crumpled paper ball */}
      <mesh position={[-3.0, 0.08, -1.0]} castShadow>
        <icosahedronGeometry args={[0.22, 1]} />
        <meshStandardMaterial color="#E8E4DC" roughness={1} />
      </mesh>
      {/* College brochure (folded) */}
      <group position={[2.2, 0.01, 1.8]} rotation={[0, -0.4, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.2, 0.018, 0.85]} />
          <meshStandardMaterial color="#E8F0FE" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.016, 0]}>
          <boxGeometry args={[1.15, 0.002, 0.82]} />
          <meshStandardMaterial color="#BFCFFF" roughness={0.9} />
        </mesh>
      </group>
    </group>
  )
}

// ─── 3D: CAMERA ───────────────────────────────────────────────────────────
function CamRig({ zoomT, mouseRef }) {
  const { camera } = useThree()
  const smoothY  = useRef(CAM_START)
  const smoothX  = useRef(0)
  const smoothZ  = useRef(0)

  useFrame(() => {
    const ez = ease(zoomT)
    const targetY = lerp(CAM_START, CAM_END, ez)

    // Mouse parallax weakens as we zoom in
    const pStrength = lerp(0.7, 0.04, ez)
    const targetX = mouseRef.current.x * pStrength
    const targetZ = mouseRef.current.y * pStrength * 0.5

    smoothY.current = lerp(smoothY.current, targetY, 0.055)
    smoothX.current = lerp(smoothX.current, targetX, 0.04)
    smoothZ.current = lerp(smoothZ.current, targetZ, 0.04)

    camera.position.set(smoothX.current, smoothY.current, smoothZ.current)

    // Look at different targets at different zoom levels
    const lookX = lerp(0,  1.6 * 0.4, ez)  // drift toward phone
    const lookZ = lerp(0, -0.1, ez)
    camera.lookAt(lookX, 0, lookZ)
  })

  return null
}

// ─── 3D: LIGHTS ───────────────────────────────────────────────────────────
function Lights({ zoomT }) {
  const keyRef  = useRef()
  const fillRef = useRef()
  const rimRef  = useRef()

  useFrame(() => {
    // Key light brightens slightly on reveal
    if (keyRef.current)  keyRef.current.intensity  = lerp(2.8, 2.2, ease(zoomT))
    if (fillRef.current) fillRef.current.intensity = lerp(0.6, 0.4, ease(zoomT))
  })

  return (
    <>
      {/* Warm key light top-right */}
      <directionalLight
        ref={keyRef}
        color="#FFF5E0"
        intensity={2.8}
        position={[5, 10, 4]}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-bias={-0.001}
      />
      {/* Cool fill light left */}
      <directionalLight ref={fillRef} color="#E0EEFF" intensity={0.6} position={[-6, 6, -3]} />
      {/* Subtle ambient */}
      <ambientLight color="#FFF8F0" intensity={0.9} />
      {/* Rim from below — very subtle bounce */}
      <directionalLight ref={rimRef} color="#FFF0D0" intensity={0.2} position={[0, -2, 0]} />
    </>
  )
}

// ─── 3D: POST-PROCESSING ──────────────────────────────────────────────────
function PostFX({ zoomT }) {
  // DoF: wide when far, tight when close
  const focDist    = lerp(0.45, 0.018, ease(zoomT))
  const focLen     = lerp(0.06,  0.006, ease(zoomT))
  const bokeh      = lerp(5,     2.0,   ease(zoomT))

  return (
    <EffectComposer>
      <DepthOfField focusDistance={focDist} focalLength={focLen} bokehScale={bokeh} />
      <Bloom mipmapBlur intensity={0.25} luminanceThreshold={0.88} luminanceSmoothing={0.5} />
      <Vignette eskil={false} offset={0.22} darkness={0.45} />
    </EffectComposer>
  )
}

// ─── 3D: SCENE ────────────────────────────────────────────────────────────
function Scene({ zoomT, mouseRef }) {
  return (
    <>
      <color attach="background" args={[DESK_COLOR]} />
      <Lights zoomT={zoomT} />
      <CamRig zoomT={zoomT} mouseRef={mouseRef} />
      <Desk />
      <Notebook />
      <Phone zoomT={zoomT} />
      <DeskItems />
      <Particles />
      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.22}
        scale={16}
        blur={3}
        far={3}
        color="#C0B0A0"
      />
      <PostFX zoomT={zoomT} />
    </>
  )
}

// ─── HTML: LOADER ─────────────────────────────────────────────────────────
function Loader({ onDone }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const duration = 2200
    const id = setInterval(() => {
      const p = Math.min((Date.now() - start) / duration * 100, 100)
      setDisplay(Math.round(p))
      if (p >= 100) { clearInterval(id); onDone() }
    }, 30)
    return () => clearInterval(id)
  }, []) // eslint-disable-line

  return (
    <div style={{ position:'fixed', inset:0, zIndex:300, background:DESK_COLOR,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20 }}>
      <div style={{ fontFamily:'Syne, sans-serif', fontSize:30, fontWeight:800, color:'#111' }}>
        og<span style={{ color:'#059669' }}>senior</span>
      </div>
      <div style={{ width:180, height:2, background:'#E5E7EB', borderRadius:2 }}>
        <div style={{ width:`${display}%`, height:'100%',
          background:'linear-gradient(90deg, #059669, #f59e0b)',
          borderRadius:2, transition:'width 0.04s' }} />
      </div>
      <p style={{ fontFamily:'DM Sans, sans-serif', fontSize:13, color:'#9CA3AF' }}>{display}%</p>
    </div>
  )
}

// ─── HTML: NAV ────────────────────────────────────────────────────────────
function Nav({ cd }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn, { passive:true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100,
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'16px 48px',
      background: scrolled ? 'rgba(247,242,234,0.94)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(0,0,0,0.06)' : 'none',
      transition:'all 0.3s' }}>
      <span style={{ fontFamily:'Syne, sans-serif', fontSize:20, fontWeight:800, color:'#111' }}>
        og<span style={{ color:'#059669' }}>senior</span>
      </span>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <span style={{ display:'inline-block', width:7, height:7, borderRadius:'50%',
          background:'#059669', animation:'ogpulse 2s ease-in-out infinite' }} />
        <span style={{ fontFamily:'DM Sans, sans-serif', fontSize:13, color:'#6B7280' }}>
          Launching June 20 · {cd.d}d {String(cd.h).padStart(2,'0')}h away
        </span>
      </div>
    </nav>
  )
}

// ─── HTML: ZOOM OVERLAY TEXT ──────────────────────────────────────────────
function ZoomOverlayText({ zoomT }) {
  const active = OVERLAY_TEXTS.find(t => zoomT >= t.from && zoomT < t.to)
  if (!active) return null
  const op = clamp((zoomT - active.from) / 0.1, 0, 1) *
             clamp((active.to - zoomT)   / 0.08, 0, 1)

  return (
    <div style={{
      position:'absolute', bottom:'13%', left:0, right:0,
      textAlign:'center', zIndex:10, pointerEvents:'none',
      opacity: op,
    }}>
      <div style={{
        display:'inline-block',
        background:'rgba(247,242,234,0.82)',
        backdropFilter:'blur(12px)',
        WebkitBackdropFilter:'blur(12px)',
        border:'1px solid rgba(0,0,0,0.06)',
        borderRadius:16,
        padding:'14px 28px',
      }}>
        <p style={{
          fontFamily:'Syne, sans-serif',
          fontSize:'clamp(14px, 2vw, 20px)',
          fontWeight:700,
          color:'#111',
          lineHeight:1.5,
          whiteSpace:'pre-line',
        }}>
          {active.text}
        </p>
      </div>
    </div>
  )
}

// ─── HTML: CTA at zoomT=1 ────────────────────────────────────────────────
function ZoomCTA({ zoomT }) {
  const op = clamp((zoomT - 0.92) / 0.08, 0, 1)
  if (op === 0) return null

  return (
    <div style={{
      position:'absolute', bottom:'7%', left:0, right:0,
      display:'flex', flexDirection:'column', alignItems:'center', gap:14,
      zIndex:15, opacity:op,
      transform:`translateY(${lerp(18,0,op)}px)`,
      pointerEvents: op > 0.5 ? 'auto' : 'none',
    }}>
      <h1 style={{
        fontFamily:'Syne, sans-serif', fontSize:'clamp(26px, 4.5vw, 48px)',
        fontWeight:800, color:'#111', letterSpacing:'-0.03em',
        lineHeight:1.05, textAlign:'center',
        textShadow:'0 2px 20px rgba(247,242,234,0.9)',
      }}>
        Ask before you choose.
      </h1>
      <p style={{
        fontFamily:'DM Sans, sans-serif', fontSize:'clamp(13px, 1.6vw, 16px)',
        color:'#6B7280', textAlign:'center', maxWidth:400, lineHeight:1.7,
        background:'rgba(247,242,234,0.7)', backdropFilter:'blur(8px)',
        padding:'8px 16px', borderRadius:8,
      }}>
        Real advice from people who've been there —<br />
        before you choose your college, branch, or career.
      </p>
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center' }}>
        {[
          { label:"I'm a Student",     color:'#059669', rgb:'5,150,105',  href:`${FRONTEND}/?role=student`  },
          { label:"Become an Insider", color:'#D97706', rgb:'217,119,6',  href:`${FRONTEND}/?role=insider`  },
          { label:"Become a Mentor",   color:'#7C3AED', rgb:'124,58,237', href:`${FRONTEND}/?role=mentor`   },
        ].map(b => (
          <a key={b.label} href={b.href} target="_blank" rel="noopener noreferrer"
            style={{
              fontFamily:'Syne, sans-serif', fontSize:13.5, fontWeight:700,
              color:b.color, border:`2px solid ${b.color}`, borderRadius:12,
              padding:'10px 20px', textDecoration:'none',
              background:`rgba(${b.rgb},0.08)`,
              backdropFilter:'blur(8px)',
              transition:'all 0.2s',
            }}
            onMouseEnter={e=>{e.currentTarget.style.background=b.color;e.currentTarget.style.color='#fff'}}
            onMouseLeave={e=>{e.currentTarget.style.background=`rgba(${b.rgb},0.08)`;e.currentTarget.style.color=b.color}}
          >
            {b.label}
          </a>
        ))}
      </div>
      <div style={{ animation:'ogbounce 2s ease-in-out infinite',
        display:'flex', flexDirection:'column', alignItems:'center', gap:2, marginTop:4 }}>
        <span style={{ fontFamily:'DM Sans, sans-serif', fontSize:10.5, color:'#9CA3AF',
          letterSpacing:'0.1em', textTransform:'uppercase' }}>scroll to explore</span>
        <span style={{ fontSize:14, color:'#9CA3AF' }}>↓</span>
      </div>
    </div>
  )
}

// ─── HTML: SCROLL HINT ────────────────────────────────────────────────────
function ScrollHint({ zoomT }) {
  const op = clamp(1 - zoomT / 0.1, 0, 1)
  if (op === 0) return null
  return (
    <div style={{ position:'absolute', bottom:'6%', left:'50%',
      transform:'translateX(-50%)', display:'flex', flexDirection:'column',
      alignItems:'center', gap:8, pointerEvents:'none', zIndex:10, opacity:op }}>
      <span style={{ fontFamily:'DM Sans, sans-serif', fontSize:11, color:'#9CA3AF',
        letterSpacing:'0.12em', textTransform:'uppercase' }}>scroll to zoom in</span>
      <div style={{ width:22, height:36, border:'1.5px solid #C8C0B8', borderRadius:11,
        display:'flex', justifyContent:'center', paddingTop:5 }}>
        <div style={{ width:3, height:6, background:'#B0A898', borderRadius:2,
          animation:'ogscroll 1.8s ease-in-out infinite' }} />
      </div>
    </div>
  )
}

// ─── HTML: HERO ───────────────────────────────────────────────────────────
function Hero({ zoomT, setZoomT, mouseRef }) {
  const containerRef = useRef()

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const onWheel = (e) => {
      if (Z.released) return
      e.preventDefault()
      Z.target = clamp(Z.target + e.deltaY * 0.0016, 0, 1)
      if (Z.target >= 1) Z.released = true
    }

    let ty = 0
    const onTS = (e) => { ty = e.touches[0].clientY }
    const onTM = (e) => {
      if (Z.released) return
      e.preventDefault()
      Z.target = clamp(Z.target + (ty - e.touches[0].clientY) * 0.003, 0, 1)
      ty = e.touches[0].clientY
      if (Z.target >= 1) Z.released = true
    }

    el.addEventListener('wheel',      onWheel, { passive:false })
    el.addEventListener('touchstart', onTS,    { passive:true  })
    el.addEventListener('touchmove',  onTM,    { passive:false })

    let raf
    const tick = () => {
      Z.t = lerp(Z.t, Z.target, 0.065)
      setZoomT(Z.t)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('wheel',      onWheel)
      el.removeEventListener('touchstart', onTS)
      el.removeEventListener('touchmove',  onTM)
    }
  }, [setZoomT])

  return (
    <div ref={containerRef} style={{ position:'relative', width:'100vw', height:'100vh',
      overflow:'hidden', flexShrink:0 }}>
      <Canvas
        shadows
        gl={{ antialias:true, powerPreference:'high-performance' }}
        dpr={[1, 1.5]}
        camera={{ fov:52, position:[0, CAM_START, 0], near:0.1, far:80 }}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}
      >
        <Suspense fallback={null}>
          <Scene zoomT={zoomT} mouseRef={mouseRef} />
        </Suspense>
      </Canvas>

      <ZoomOverlayText zoomT={zoomT} />
      <ZoomCTA        zoomT={zoomT} />
      <ScrollHint     zoomT={zoomT} />
    </div>
  )
}

// ─── HTML: 2D SECTIONS ────────────────────────────────────────────────────

const F = {
  display: { fontFamily:'Syne, sans-serif', fontWeight:800, letterSpacing:'-0.025em', lineHeight:1.12, color:'#111' },
  body:    { fontFamily:'DM Sans, sans-serif', fontSize:15.5, color:'#6B7280', lineHeight:1.72 },
  eyebrow: { fontFamily:'DM Sans, sans-serif', fontSize:12, fontWeight:600,
             letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:12 },
  wrap:    { maxWidth:1060, margin:'0 auto', padding:'0 24px' },
}

function ProblemSection() {
  const cards = [
    { icon:'⚠️', title:'Advice with conflicts of interest', accent:'#EF4444',
      body:"Traditional counsellors are paid by colleges to send students there. Their incentive was never your future — it was their commission." },
    { icon:'🔇', title:'Silence from the people who matter', accent:'#F59E0B',
      body:"You messaged seniors on LinkedIn, WhatsApp, Reddit. Most never replied. The ones who did gave vague answers. Nobody had skin in the game." },
    { icon:'📅', title:'Outdated, biased, wrong', accent:'#7C3AED',
      body:"Google results from 2019. YouTube videos from coaching institutes with an agenda. Nobody telling you what's actually true right now." },
  ]
  return (
    <section style={{ background:'#FAF8F4', padding:'100px 24px' }}>
      <div style={F.wrap}>
        <div style={{ textAlign:'center', marginBottom:52 }}>
          <p style={{ ...F.eyebrow, color:'#EF4444' }}>The real problem</p>
          <h2 style={{ ...F.display, fontSize:'clamp(28px, 4.5vw, 46px)' }}>
            The system was never<br />built for you.
          </h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(290px, 1fr))', gap:20 }}>
          {cards.map((c,i) => (
            <div key={i} style={{ background:'#fff', border:'1px solid #F3F4F6',
              borderLeft:`4px solid ${c.accent}`, borderRadius:16, padding:'28px 24px',
              boxShadow:'0 2px 12px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize:28, marginBottom:12 }}>{c.icon}</div>
              <h3 style={{ fontFamily:'Syne, sans-serif', fontSize:17, fontWeight:700,
                color:'#111', marginBottom:10, lineHeight:1.35 }}>{c.title}</h3>
              <p style={{ ...F.body, fontSize:14.5 }}>{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    { n:'01', color:'#059669', label:'Choose who you need',
      sub:'Insider for college life,\nMentor for career decisions.' },
    { n:'02', color:'#D97706', label:'Book a session',
      sub:'Starting at ₹99.\nInstant confirmation.' },
    { n:'03', color:'#7C3AED', label:'Get real answers',
      sub:'No curation. No delay.\nHonest advice.' },
  ]
  return (
    <section style={{ background:'#fff', padding:'100px 24px' }}>
      <div style={F.wrap}>
        <div style={{ textAlign:'center', marginBottom:52 }}>
          <p style={{ ...F.eyebrow, color:'#7C3AED' }}>How it works</p>
          <h2 style={{ ...F.display, fontSize:'clamp(26px, 4vw, 44px)', marginBottom:14 }}>
            Three steps.<br />One honest conversation.
          </h2>
          <p style={{ ...F.body, maxWidth:460, margin:'0 auto' }}>
            We connect students with Insiders and Mentors who get paid for genuine advice.
            When real money is on the line, real answers follow.
          </p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(240px, 1fr))',
          border:'1px solid #F3F4F6', borderRadius:20, overflow:'hidden', marginBottom:60 }}>
          {steps.map((st,i) => (
            <div key={i} style={{ padding:'32px 28px',
              borderRight: i<2 ? '1px solid #F3F4F6' : 'none', background:'#fff' }}>
              <div style={{ fontFamily:'Syne, sans-serif', fontSize:12, fontWeight:800,
                color:st.color, letterSpacing:'0.06em', marginBottom:10 }}>{st.n}</div>
              <div style={{ fontFamily:'Syne, sans-serif', fontSize:18, fontWeight:700,
                color:'#111', marginBottom:8 }}>{st.label}</div>
              <div style={{ fontFamily:'DM Sans, sans-serif', fontSize:14, color:'#9CA3AF',
                lineHeight:1.6, whiteSpace:'pre-line' }}>{st.sub}</div>
            </div>
          ))}
        </div>

        {/* Video */}
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <p style={{ ...F.eyebrow, color:'#059669' }}>Watch the story</p>
          <h3 style={{ ...F.display, fontSize:'clamp(20px, 3vw, 30px)', marginBottom:24 }}>
            Why we built OgSenior
          </h3>
        </div>
        <div style={{ position:'relative', maxWidth:720, margin:'0 auto',
          borderRadius:20, overflow:'hidden', aspectRatio:'16/9',
          boxShadow:'0 20px 60px rgba(0,0,0,0.1)', border:'1px solid #F3F4F6' }}>
          <iframe width="100%" height="100%"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1"
            title="Why we built OgSenior"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} />
        </div>
      </div>
    </section>
  )
}

function RoleCard({ r }) {
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      onClick={()=>window.open(r.href,'_blank')}
      style={{ background: hov ? `rgba(${r.rgb},0.04)` : '#fff',
        border:`1px solid ${hov ? r.color : '#F3F4F6'}`, borderRadius:18,
        padding:'28px 24px', transition:'all 0.3s ease',
        transform: hov ? 'translateY(-4px)' : 'none',
        boxShadow: hov ? `0 12px 32px rgba(${r.rgb},0.12)` : '0 2px 8px rgba(0,0,0,0.04)',
        display:'flex', flexDirection:'column', cursor:'pointer' }}>
      <span style={{ display:'inline-block', alignSelf:'flex-start',
        background:`rgba(${r.rgb},0.12)`, color:r.color,
        fontFamily:'Syne, sans-serif', fontSize:10.5, fontWeight:700,
        letterSpacing:'0.12em', textTransform:'uppercase',
        padding:'3px 10px', borderRadius:100, marginBottom:16 }}>{r.label}</span>
      <h3 style={{ fontFamily:'Syne, sans-serif', fontSize:20, fontWeight:800,
        color:'#111', marginBottom:10, lineHeight:1.28, flexGrow:1,
        whiteSpace:'pre-line' }}>{r.headline}</h3>
      <p style={{ ...F.body, fontSize:14, marginBottom:20 }}>{r.body}</p>
      <div style={{ borderTop:'1px solid #F3F4F6', paddingTop:16, marginBottom:18 }}>
        {r.stats.map((st,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <div style={{ width:5, height:5, borderRadius:'50%', background:r.color, flexShrink:0 }} />
            <span style={{ fontFamily:'DM Sans, sans-serif', fontSize:13, color:'#9CA3AF' }}>{st}</span>
          </div>
        ))}
      </div>
      <a href={r.href} target="_blank" rel="noopener noreferrer"
        onClick={e=>e.stopPropagation()}
        style={{ display:'block', textAlign:'center', textDecoration:'none',
          color: hov ? '#fff' : r.color, background: hov ? r.color : 'transparent',
          border:`1.5px solid ${r.color}`, borderRadius:10, padding:'11px',
          fontFamily:'Syne, sans-serif', fontSize:13.5, fontWeight:700, transition:'all 0.2s' }}>
        {r.cta} →
      </a>
    </div>
  )
}

function RolesSection() {
  const roles = [
    { key:'student', label:'Student', color:'#059669', rgb:'5,150,105',
      headline:'Real advice\nbefore you choose.',
      body:"Before you pick a college, a branch, a career — talk to someone who's already living it. Verified. Accountable. Real.",
      stats:['Sessions from ₹99','Verified Insiders & Mentors','Same-day response'],
      cta:'Join as a Student', href:`${FRONTEND}/?role=student` },
    { key:'insider', label:'Insider', color:'#D97706', rgb:'217,119,6',
      headline:'Your experience\nis worth money.',
      body:"You've navigated what thousands of students are figuring out. Your knowledge of college life, placements, the real syllabus — it has real value.",
      stats:['₹80–120 per session','1–2 hrs/week minimum','Paid weekly to UPI'],
      cta:'Become an Insider', href:`${FRONTEND}/?role=insider` },
    { key:'mentor', label:'Mentor', color:'#7C3AED', rgb:'124,58,237',
      headline:'Your industry\nknowledge matters.',
      body:"Tell students what you wish someone had told you. Earn consistently on the side — without competing with what you're building.",
      stats:['₹150–300 per session','Set your own schedule','Strictly vetted students'],
      cta:'Become a Mentor', href:`${FRONTEND}/?role=mentor` },
  ]
  return (
    <section style={{ background:'#FAF8F4', padding:'100px 24px' }}>
      <div style={F.wrap}>
        <div style={{ textAlign:'center', marginBottom:52 }}>
          <p style={{ ...F.eyebrow, color:'#D97706' }}>Where do you belong?</p>
          <h2 style={{ ...F.display, fontSize:'clamp(26px, 4vw, 44px)' }}>
            Three kinds of people.<br />One network.
          </h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:20 }}>
          {roles.map(r => <RoleCard key={r.key} r={r} />)}
        </div>
      </div>
    </section>
  )
}

function WaitlistSection({ cd }) {
  const [form, setForm] = useState({ email:'', role:'student', done:false, busy:false })
  const [focused, setFocused] = useState(false)

  const submit = () => {
    if (!form.email.includes('@')) return
    setForm(f=>({...f,busy:true}))
    // TODO: fetch('/api/waitlist', { method:'POST', body:JSON.stringify({ email:form.email, role:form.role }) })
    setTimeout(() => setForm(f=>({...f,busy:false,done:true})), 900)
  }

  const ticks = [
    {v:cd.d,l:'Days',c:'#059669'},{v:cd.h,l:'Hours',c:'#D97706'},
    {v:cd.m,l:'Mins',c:'#7C3AED'},{v:cd.s,l:'Secs',c:'rgba(255,255,255,0.3)'},
  ]

  return (
    <section style={{ background:'#111', padding:'100px 24px' }}>
      <div style={{ maxWidth:500, margin:'0 auto', textAlign:'center' }}>
        <p style={{ ...F.eyebrow, color:'rgba(255,255,255,0.3)' }}>Going live in</p>
        <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:44, alignItems:'flex-start' }}>
          {ticks.map((tk,i) => (
            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
              {i>0 && <div style={{ fontFamily:'Syne,sans-serif', fontSize:'clamp(20px,4vw,42px)',
                fontWeight:300, color:'rgba(255,255,255,0.12)', lineHeight:1.05 }}>:</div>}
              <div style={{ textAlign:'center', minWidth:50 }}>
                <div style={{ fontFamily:'Syne,sans-serif', fontSize:'clamp(24px,4.5vw,50px)',
                  fontWeight:800, color:tk.c, lineHeight:1, letterSpacing:'-0.02em' }}>
                  {String(tk.v).padStart(2,'0')}
                </div>
                <div style={{ fontFamily:'DM Sans,sans-serif', fontSize:10, color:'rgba(255,255,255,0.28)',
                  textTransform:'uppercase', letterSpacing:'0.1em', marginTop:4 }}>{tk.l}</div>
              </div>
            </div>
          ))}
        </div>

        <h2 style={{ ...F.display, fontSize:'clamp(24px,4vw,38px)', color:'#fff', marginBottom:8 }}>
          Be the first in.
        </h2>
        <p style={{ ...F.body, color:'rgba(255,255,255,0.4)', marginBottom:28 }}>
          Early users get priority access on launch day.
        </p>

        {form.done ? (
          <div style={{ background:'rgba(5,150,105,0.12)', border:'1px solid #059669',
            borderRadius:14, padding:'22px' }}>
            <div style={{ fontSize:26, marginBottom:6 }}>✓</div>
            <p style={{ fontFamily:'Syne,sans-serif', fontSize:16, fontWeight:700,
              color:'#059669', marginBottom:4 }}>You're on the list.</p>
            <p style={{ fontFamily:'DM Sans,sans-serif', fontSize:13,
              color:'rgba(255,255,255,0.38)' }}>See you June 20, 2026.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:9, maxWidth:360, margin:'0 auto' }}>
            <input type="email" placeholder="your@email.com" value={form.email}
              onChange={e=>setForm(f=>({...f,email:e.target.value}))}
              onKeyDown={e=>e.key==='Enter'&&submit()}
              onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
              style={{ background:'rgba(255,255,255,0.06)',
                border:`1.5px solid ${focused?'#059669':'rgba(255,255,255,0.1)'}`,
                borderRadius:10, padding:'12px 16px',
                fontFamily:'DM Sans,sans-serif', fontSize:15,
                color:'#fff', width:'100%', transition:'border-color 0.2s' }} />
            <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}
              style={{ background:'rgba(255,255,255,0.06)',
                border:'1.5px solid rgba(255,255,255,0.1)', borderRadius:10,
                padding:'12px 16px', fontFamily:'DM Sans,sans-serif', fontSize:15,
                color:'rgba(255,255,255,0.5)', width:'100%', cursor:'pointer' }}>
              <option value="student">I'm a Student</option>
              <option value="insider">I'm an Insider (current student)</option>
              <option value="mentor">I'm a Mentor (professional)</option>
            </select>
            <button onClick={submit} disabled={form.busy}
              style={{ background:'linear-gradient(135deg,#059669,#D97706)', border:'none',
                borderRadius:10, padding:'13px', fontFamily:'Syne,sans-serif',
                fontSize:14, fontWeight:700, color:'#fff',
                cursor:form.busy?'wait':'pointer', opacity:form.busy?0.7:1,
                transition:'opacity 0.2s', letterSpacing:'0.02em',
                boxShadow:'0 4px 20px rgba(5,150,105,0.3)' }}>
              {form.busy ? 'Saving your spot...' : 'Notify Me on Launch →'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer style={{ background:'#0A0A0A', padding:'26px 48px',
      display:'flex', alignItems:'center', justifyContent:'space-between',
      flexWrap:'wrap', gap:12 }}>
      <span style={{ fontFamily:'Syne,sans-serif', fontSize:18, fontWeight:800, color:'#fff' }}>
        og<span style={{ color:'#059669' }}>senior</span>
      </span>
      <span style={{ fontFamily:'DM Sans,sans-serif', fontSize:13, color:'rgba(255,255,255,0.3)' }}>
        "Ask before you choose." · June 20, 2026
      </span>
      <span style={{ fontFamily:'DM Sans,sans-serif', fontSize:12, color:'rgba(255,255,255,0.18)' }}>
        Built in India 🇮🇳
      </span>
    </footer>
  )
}

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────
function GlobalStyles() {
  useEffect(() => {
    if (document.getElementById('og-gs')) return
    const s = document.createElement('style')
    s.id = 'og-gs'
    s.textContent = `
      @keyframes ogpulse  { 0%,100%{opacity:.3} 50%{opacity:1} }
      @keyframes ogscroll { 0%,100%{transform:translateY(0);opacity:.3} 50%{transform:translateY(6px);opacity:1} }
      @keyframes ogbounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(5px)} }
    `
    document.head.appendChild(s)
    return () => { const e = document.getElementById('og-gs'); if (e) e.remove() }
  }, [])
  return null
}

// ─── APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [zoomT,  setZoomT]  = useState(0)
  const [loaded, setLoaded] = useState(false)
  const mouseRef  = useRef({ x:0, y:0 })
  const countdown = useCountdown()

  useEffect(() => {
    const fn = e => {
      mouseRef.current.x =  (e.clientX / window.innerWidth  - 0.5) * 2
      mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', fn)
    return () => window.removeEventListener('mousemove', fn)
  }, [])

  return (
    <>
      <GlobalStyles />
      {!loaded && <Loader onDone={() => setLoaded(true)} />}
      <Nav cd={countdown} />
      <Hero zoomT={zoomT} setZoomT={setZoomT} mouseRef={mouseRef} />
      <ProblemSection />
      <HowItWorksSection />
      <RolesSection />
      <WaitlistSection cd={countdown} />
      <Footer />
    </>
  )
}
