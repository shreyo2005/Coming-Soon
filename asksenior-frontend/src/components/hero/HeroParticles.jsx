import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { N } from '../../utils/constants'
import { clamp, lerp, smooth } from '../../utils/math'
import { genSphere, genQuestionMark, genChatIcon } from '../../utils/geometry'

export function makeParticleMat() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uBase: { value: new THREE.Color('#FFF5E1') },
      uBright: { value: new THREE.Color('#FFD1B3') },
      uHighl: { value: new THREE.Color('#FFFFFF') },
      uLightDir: { value: new THREE.Vector3(1.0, 1.5, 0.8).normalize() },
      uTime: { value: 0.0 },
      uScroll: { value: 0.0 }
    },
    vertexShader: `
      attribute float aSize;
      attribute float aRand;
      
      // Shape 0: Sphere
      attribute vec3 position1;
      attribute vec3 normal1;
      
      // Shape 1: Question Mark
      attribute vec3 position2;
      attribute vec3 normal2;
      
      uniform float uTime;
      uniform float uScroll;
      
      varying  float vRand;
      varying  vec3 vNormal;
      varying  vec3 vViewPos;
      
      // smoothstep function for GLSL
      float ease(float t) {
          return t * t * (3.0 - 2.0 * t);
      }
      
      void main() {
        vRand  = aRand;
        
        // Morphing logic identical to JS
        float t = clamp(uScroll, 0.0, 1.0);
        float f = 0.0;
        float to = 0.0;
        float mt = 0.0;
        
        if (t < 0.19) { f = 0.0; to = 1.0; mt = ease(t / 0.19); }
        else if (t < 0.50) { f = 1.0; to = 1.0; mt = 0.0; }
        else if (t < 0.65) { f = 1.0; to = 2.0; mt = ease((t - 0.50) / 0.15); }
        else if (t < 0.75) { f = 2.0; to = 2.0; mt = 0.0; }
        else if (t < 0.95) { f = 2.0; to = 0.0; mt = ease((t - 0.75) / 0.20); }
        else { f = 0.0; to = 0.0; mt = 0.0; }
        
        vec3 pFrom = position;
        vec3 nFrom = normal;
        vec3 pTo = position;
        vec3 nTo = normal;
        
        // Select From
        if (f > 1.5) { pFrom = position2; nFrom = normal2; }
        else if (f > 0.5) { pFrom = position1; nFrom = normal1; }
        
        // Select To
        if (to > 1.5) { pTo = position2; nTo = normal2; }
        else if (to > 0.5) { pTo = position1; nTo = normal1; }
        
        // Interpolate
        vec3 finalPos = mix(pFrom, pTo, mt);
        vec3 finalNorm = mix(nFrom, nTo, mt);
        
        // Ripple effect
        float ripple = sin(t * 14.0 + aRand * 35.0 + uTime * 1.1) * 0.026;
        finalPos += ripple;
        
        vNormal = normalize(normalMatrix * finalNorm);
        vec4 mv = modelViewMatrix * vec4(finalPos, 1.0);
        vViewPos = -mv.xyz;
        gl_Position  = projectionMatrix * mv;
        gl_PointSize = aSize * (50.0 / -mv.z);
      }
    `,
    fragmentShader: `
      uniform vec3  uBase;
      uniform vec3  uBright;
      uniform vec3  uHighl;
      uniform vec3  uLightDir;
      
      varying float vRand;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      
      void main() {
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        
        float soft = 1.0 - smoothstep(0.1, 0.50, d);
        
        vec3 N = normalize(vNormal);
        vec3 V = normalize(vViewPos);
        vec3 L = normalize((viewMatrix * vec4(uLightDir, 0.0)).xyz);
        
        float diff = max(dot(N, L), 0.0);
        
        float rim = 1.0 - max(dot(V, N), 0.0);
        rim = smoothstep(0.5, 1.0, rim);
        
        vec3 H = normalize(L + V);
        float spec = pow(max(dot(N, H), 0.0), 32.0);
        
        vec3 col = mix(uBase * 0.4, uBright, diff * 0.7 + 0.3);
        col += uBright * rim * 0.6;
        col += uHighl * spec * 0.9;
        
        float core = 1.0 - smoothstep(0.0, 0.25, d);
        col = mix(col, uHighl, core * spec * 0.5);
        
        float alph = soft * (0.8 + 0.2 * vRand);
        gl_FragColor = vec4(col, alph);
      }
    `,
    transparent: true,
    depthWrite: true,
    depthTest: true,
    blending: THREE.NormalBlending,
  })
}

export function ParticleCloud({ scrollT }) {
  const meshRef = useRef()

  const { shapes, shapeNormals, sizeArr, randArr } = useMemo(() => {
    function sortPoints(p, n_arr) {
      const pts = []
      for (let i = 0; i < p.length; i += 3) {
        pts.push({ x: p[i], y: p[i + 1], z: p[i + 2], nx: n_arr[i], ny: n_arr[i + 1], nz: n_arr[i + 2] })
      }
      pts.sort((a, b) => {
        const yA = Math.floor(a.y / 0.05), yB = Math.floor(b.y / 0.05)
        if (yA !== yB) return yA - yB
        const xA = Math.floor(a.x / 0.05), xB = Math.floor(b.x / 0.05)
        if (xA !== xB) return xA - xB
        return a.z - b.z
      })
      for (let i = 0; i < pts.length; i++) {
        p[i * 3] = pts[i].x; p[i * 3 + 1] = pts[i].y; p[i * 3 + 2] = pts[i].z;
        n_arr[i * 3] = pts[i].nx; n_arr[i * 3 + 1] = pts[i].ny; n_arr[i * 3 + 2] = pts[i].nz;
      }
      return { p, n_arr }
    }

    const s1 = genSphere(N);
    const s2 = genQuestionMark(N);
    const s3 = genChatIcon(N);

    const sorted1 = sortPoints(s1.positions, s1.normals);
    const sorted2 = sortPoints(s2.positions, s2.normals);
    const sorted3 = sortPoints(s3.positions, s3.normals);

    const shapes = [sorted1.p, sorted2.p, sorted3.p];
    const shapeNormals = [sorted1.n_arr, sorted2.n_arr, sorted3.n_arr];

    const sizeArr = new Float32Array(N)
    const randArr = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      sizeArr[i] = 0.20 + Math.random() * 0.50
      randArr[i] = Math.random()
    }
    return { shapes, shapeNormals, sizeArr, randArr }
  }, [])

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(shapes[0].slice(), 3))
    g.setAttribute('normal', new THREE.BufferAttribute(shapeNormals[0].slice(), 3))

    g.setAttribute('position1', new THREE.BufferAttribute(shapes[1].slice(), 3))
    g.setAttribute('normal1', new THREE.BufferAttribute(shapeNormals[1].slice(), 3))

    g.setAttribute('position2', new THREE.BufferAttribute(shapes[2].slice(), 3))
    g.setAttribute('normal2', new THREE.BufferAttribute(shapeNormals[2].slice(), 3))

    g.setAttribute('aSize', new THREE.BufferAttribute(sizeArr, 1))
    g.setAttribute('aRand', new THREE.BufferAttribute(randArr, 1))
    return g
  }, [shapes, shapeNormals, sizeArr, randArr])

  const mat = useMemo(() => makeParticleMat(), [])

  const spinYRef = useRef(0.19)
  const tagOpacityRef = useRef(1)

  const nodePositions = useMemo(() => {
    const nodes = [
      { x: -0.6, y: 0.55, z: 0.1 },
      { x: 0.75, y: 0.1, z: -0.3 },
      { x: -0.2, y: -0.7, z: 0.2 }
    ]
    const YTILT = Math.PI * 0.12
    const XTILT = Math.PI * 0.05
    const cY = Math.cos(YTILT), sY = Math.sin(YTILT)
    const cX = Math.cos(XTILT), sX = Math.sin(XTILT)
    const SCALE = 1.15
    return nodes.map(n => {
      let x = n.x * SCALE, y = n.y * SCALE, z = n.z * SCALE
      const nx = x * cY + z * sY; z = -x * sY + z * cY; x = nx
      const ny = y * cX - z * sX; const nz = y * sX + z * cX
      return [x, ny, nz]
    })
  }, [])

  useFrame(({ clock }) => {
    if (!meshRef.current) return

    const t = clamp(scrollT, 0, 1)
    const el = clock.elapsedTime

    mat.uniforms.uTime.value = el;
    mat.uniforms.uScroll.value = t;

    const sphereAmt = clamp(1 - (t - 0.00) / 0.25, 0, 1) + clamp((t - 0.84) / 0.10, 0, 1)
    const sweepAngle = Math.sin(el * 0.25) * (Math.PI / 8)
    const currentSpin = sweepAngle + 0.19
    const targetSpin = lerp(0.19, currentSpin, sphereAmt)
    const tiltY = (t - 0.5) * 0.38

    meshRef.current.rotation.y = targetSpin + tiltY
    meshRef.current.rotation.x = Math.sin(el * 0.04) * 0.05 * sphereAmt + Math.sin(t * Math.PI) * 0.07

    const endYOffset = smooth(clamp((t - 0.80) / 0.13, 0, 1)) * 1.6
    meshRef.current.position.y = Math.sin(el * 0.30) * lerp(0.045, 0.015, 1 - sphereAmt) + endYOffset + 0.45

    let targetTagOpacity = 0
    if (t < 0.05) targetTagOpacity = 1 - (t / 0.05)
    else if (t > 0.88) targetTagOpacity = (t - 0.88) / 0.05
    targetTagOpacity = clamp(targetTagOpacity, 0, 1)

    if (Math.abs(tagOpacityRef.current - targetTagOpacity) > 0.01) {
      tagOpacityRef.current = targetTagOpacity
      const tags = document.querySelectorAll('.ios-tag')
      tags.forEach(tag => tag.style.opacity = targetTagOpacity)
    }
  })

  return (
    <points ref={meshRef} geometry={geo} material={mat}>
      <Html position={nodePositions[0]} center>
        <div className="ios-tag" style={{ color: '#D97706' }}>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#D97706', marginRight: 6, marginBottom: 1 }}></span>
          Insider
        </div>
      </Html>
      <Html position={nodePositions[1]} center>
        <div className="ios-tag" style={{ color: '#059669' }}>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#059669', marginRight: 6, marginBottom: 1 }}></span>
          Student
        </div>
      </Html>
      <Html position={nodePositions[2]} center>
        <div className="ios-tag" style={{ color: '#7C3AED' }}>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#7C3AED', marginRight: 6, marginBottom: 1 }}></span>
          Mentor
        </div>
      </Html>
    </points>
  )
}
