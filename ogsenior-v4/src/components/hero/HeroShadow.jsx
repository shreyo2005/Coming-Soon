import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { clamp, lerp, smooth } from '../../utils/math'

export function BottomShadow({ scrollT }) {
  const meshRef = useRef()

  const mat = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uFromShape: { value: 0 },
        uToShape: { value: 0 },
        uMorph: { value: 0 },
        uHeightFactor: { value: 0 }
      },
      vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */`
        uniform float uFromShape;
        uniform float uToShape;
        uniform float uMorph;
        uniform float uHeightFactor;
        varying vec2 vUv;

        float sdBox(vec2 p, vec2 b) {
          vec2 d = abs(p) - b;
          return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
        }

        float sdRoundedBox(vec2 p, vec2 b, float r) {
          return sdBox(p, b - r) - r;
        }

        // Calculates exact footprint footprint SDF based on shape index
        float getSdf(vec2 p, float shapeType) {
          if (shapeType < 0.5) {
            // 1. Sphere: round/circular
            return length(p) - 0.28;
          } else if (shapeType < 1.5) {
            // 2. Open Book: two distinct pages with a small gap in the middle
            float left = sdRoundedBox(p - vec2(-0.25, 0.0), vec2(0.20, 0.34), 0.06);
            float right = sdRoundedBox(p - vec2(0.25, 0.0), vec2(0.20, 0.34), 0.06);
            return min(left, right);
          } else {
            // 3. Chat Icon: speech bubble body + tail at bottom left
            float bubble = sdRoundedBox(p, vec2(0.38, 0.28), 0.08);
            float tail = length(p - vec2(-0.24, -0.26)) - 0.12;
            return min(bubble, tail);
          }
        }

        void main() {
          vec2 p = vUv - 0.5;
          p.x *= 4.0; // scale aspect ratio of ground plane W=512/H=128
          
          float dFrom = getSdf(p, uFromShape);
          float dTo   = getSdf(p, uToShape);
          float d     = mix(dFrom, dTo, uMorph);
          
          // Higher object = wider/softer shadow blur
          float soft = 0.06 + uHeightFactor * 0.13;
          float shadow = smoothstep(soft, -0.06, d);
          
          // Shadow gets lighter as object floats higher
          float opacity = shadow * mix(0.70, 0.32, uHeightFactor);
          
          // Soft neutral shadow tone matching MDX reference
          gl_FragColor = vec4(0.08, 0.08, 0.08, opacity);
        }
      `,
      transparent: true,
      depthWrite: false
    })
  }, [])

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    const el = clock.elapsedTime
    const t = clamp(scrollT, 0, 1)

    // Sync with bobbing of the 3D model
    const sphereAmt = clamp(1 - (t - 0.00) / 0.25, 0, 1) + clamp((t - 0.84) / 0.10, 0, 1)
    const bobY = Math.sin(el * 0.30) * lerp(0.045, 0.015, 1 - sphereAmt)
    const tiltY = (t - 0.5) * 0.38

    // Shift left/right to follow the model's panning
    meshRef.current.position.x = tiltY * 0.95

    // Determine morph states
    let f, to, mt
    if (t < 0.19) { f = 0; to = 1; mt = smooth(t / 0.19) }
    else if (t < 0.50) { f = 1; to = 1; mt = 0 }
    else if (t < 0.65) { f = 1; to = 2; mt = smooth((t - 0.50) / 0.15) }
    else if (t < 0.75) { f = 2; to = 2; mt = 0 }
    else if (t < 0.95) { f = 2; to = 0; mt = smooth((t - 0.75) / 0.20) }
    else { f = 0; to = 0; mt = 0 }

    // Update GPU uniforms
    mat.uniforms.uFromShape.value = f
    mat.uniforms.uToShape.value = to
    mat.uniforms.uMorph.value = mt
    mat.uniforms.uHeightFactor.value = clamp((bobY + 0.045) / 0.09, 0, 1)
  })

  return (
    <mesh ref={meshRef} position={[0, -2.1, 0.0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[5, 1.25]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}
