import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { clamp, lerp, smooth } from '../../utils/math'
import { BottomShadow } from './HeroShadow'
import { ParticleCloud } from './HeroParticles'

function BackgroundHalo({ scrollT }) {
  const meshRef = useRef()
  const tex = useMemo(() => {
    const cv = document.createElement('canvas')
    cv.width = cv.height = 512
    const ctx = cv.getContext('2d')
    const g = ctx.createRadialGradient(256, 256, 0, 256, 256, 240)
    // Soft peach/pastel orange glow matching MDX reference
    g.addColorStop(0, 'rgba(255, 180, 140, 0.6)')   // soft peach core
    g.addColorStop(0.25, 'rgba(255, 200, 170, 0.3)')   // diffused warm light
    g.addColorStop(0.50, 'rgba(255, 220, 200, 0.1)')   // very soft aura
    g.addColorStop(1, 'rgba(255, 255, 255, 0)')     // fade out cleanly to white
    ctx.fillStyle = g
    ctx.fillRect(0, 0, 512, 512)
    const t = new THREE.CanvasTexture(cv)
    t.needsUpdate = true
    return t
  }, [])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const el = clock.elapsedTime
    const t = clamp(scrollT, 0, 1)

    // Bobbing and panning: pans with the object to create deep parallax!
    const sphereAmt = clamp(1 - (t - 0.00) / 0.25, 0, 1) + clamp((t - 0.84) / 0.10, 0, 1)

    const endYOffset = smooth(clamp((t - 0.80) / 0.13, 0, 1)) * 1.6
    const bobY = Math.sin(el * 0.30) * lerp(0.045, 0.015, 1 - sphereAmt) + endYOffset
    const tiltY = (t - 0.5) * 0.38

    // Follow the object position with slight dampening/parallax offset
    meshRef.current.position.x = tiltY * 0.65
    meshRef.current.position.y = bobY * 0.70

    // Scale responds dynamically to scroll
    const baseScale = lerp(4.0, 5.2, clamp((t - 0.20) / 0.30, 0, 1))
    meshRef.current.scale.set(baseScale, baseScale, 1)
  })

  return (
    <mesh ref={meshRef} position={[0, 0, -1.2]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  )
}

function ResponsiveCamera() {
  const { camera, size } = useThree()
  useEffect(() => {
    const aspect = size.width / size.height
    camera.position.z = aspect < 1 ? 7.5 : 5.0
    camera.updateProjectionMatrix()
  }, [size, camera])
  return null
}

export function OgScene({ scrollT }) {
  return (
    <>
      <ResponsiveCamera />
      <color attach="background" args={['#EAEAEA']} />
      <ambientLight color="#FFF5EE" intensity={0.80} />
      <directionalLight color="#FFE8C8" intensity={1.1} position={[2, 6, 4]} />
      <directionalLight color="#D8E0F0" intensity={0.35} position={[-4, 2, -2]} />

      {/* Radial shadow halo — same technique as MDX */}
      <BackgroundHalo scrollT={scrollT} />
      <BottomShadow scrollT={scrollT} />
      <ParticleCloud scrollT={scrollT} />

      <EffectComposer>
        <Bloom mipmapBlur intensity={0.12} luminanceThreshold={0.88} luminanceSmoothing={0.5} />
        <Vignette eskil={false} offset={0.12} darkness={0.14} />
      </EffectComposer>
    </>
  )
}
