import { useRef, useState, useEffect, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js'
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js'


// ─── Config ───────────────────────────────────────────────────────────────
const FRONTEND = 'https://ogsenior.com'
const LAUNCH = new Date('2026-06-20T00:00:00+05:30').getTime()
const N = 35000            // massively increased for dense, frosted glass look
const HERO_VH = 500             // hero section height in vh

// ─── Math helpers ─────────────────────────────────────────────────────────
const lerp = (a, b, t) => a + (b - a) * t
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const smooth = t => t * t * (3 - 2 * t)          // smoothstep
const easeOut3 = t => 1 - Math.pow(1 - t, 3)

// ─── Countdown ────────────────────────────────────────────────────────────
function useCountdown() {
    const [t, setT] = useState({ d: 19, h: 0, m: 0, s: 0 })
    useEffect(() => {
        const tick = () => {
            const d = Math.max(0, LAUNCH - Date.now())
            setT({ d: Math.floor(d / 86400000), h: Math.floor((d % 86400000) / 3600000), m: Math.floor((d % 3600000) / 60000), s: Math.floor((d % 60000) / 1000) })
        }
        tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
    }, []); return t
}

// ─── Particle position generators ─────────────────────────────────────────

function sampleGeometry(geometry, count) {
    const material = new THREE.MeshBasicMaterial()
    const mesh = new THREE.Mesh(geometry, material)
    const sampler = new MeshSurfaceSampler(mesh).build()

    const positions = new Float32Array(count * 3)
    const normals = new Float32Array(count * 3)

    const _p = new THREE.Vector3()
    const _n = new THREE.Vector3()

    for (let i = 0; i < count; i++) {
        sampler.sample(_p, _n)
        positions[i * 3] = _p.x
        positions[i * 3 + 1] = _p.y
        positions[i * 3 + 2] = _p.z

        normals[i * 3] = _n.x
        normals[i * 3 + 1] = _n.y
        normals[i * 3 + 2] = _n.z
    }

    geometry.dispose()
    return { positions, normals }
}

function genSphere(n) {
    const R = 0.38;
    const nodes = [
        { x: -0.6, y: 0.55, z: 0.1 },
        { x: 0.75, y: 0.1, z: -0.3 },
        { x: -0.2, y: -0.7, z: 0.2 }
    ]

    const geometries = [];
    nodes.forEach(node => {
        const g = new THREE.SphereGeometry(R, 32, 32).toNonIndexed();
        g.translate(node.x, node.y, node.z);
        geometries.push(g);
    });

    const connections = [[nodes[0], nodes[1]], [nodes[1], nodes[2]], [nodes[2], nodes[0]]];
    connections.forEach(conn => {
        const [A, B] = conn;
        const dist = Math.hypot(B.x - A.x, B.y - A.y, B.z - A.z);
        const g = new THREE.CylinderGeometry(0.035, 0.035, dist, 12).toNonIndexed();
        const axis = new THREE.Vector3(0, 1, 0);
        const dir = new THREE.Vector3(B.x - A.x, B.y - A.y, B.z - A.z).normalize();
        const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, dir);
        g.applyQuaternion(quaternion);
        g.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
        geometries.push(g);
    });

    const merged = BufferGeometryUtils.mergeGeometries(geometries);
    merged.center();
    const SCALE = 1.15;
    merged.scale(SCALE, SCALE, SCALE);

    return sampleGeometry(merged, n);
}

function genQuestionMark(n) {
    // 1. Top Hook (270 degrees, from bottom-center -> right -> top -> left)
    const hookGeo = new THREE.TorusGeometry(0.32, 0.13, 16, 64, Math.PI * 1.5).toNonIndexed();
    hookGeo.rotateZ(-Math.PI * 0.5);
    hookGeo.translate(0, 0.25, 0);

    // 2. Stem (perfectly aligned with bottom-center of the hook)
    const stemGeo = new THREE.CylinderGeometry(0.13, 0.09, 0.35, 16).toNonIndexed();
    stemGeo.translate(0, -0.245, 0);

    // 3. Dot
    const dotGeo = new THREE.SphereGeometry(0.14, 16, 16).toNonIndexed();
    dotGeo.translate(0, -0.65, 0);

    const merged = BufferGeometryUtils.mergeGeometries([hookGeo, stemGeo, dotGeo]);
    merged.center();

    const SCALE = 1.25;
    merged.scale(SCALE, SCALE, SCALE * 0.85);

    return sampleGeometry(merged, n);
}

function genChatIcon(n) {
    const W = 1.25, H = 0.95, R = 0.28;
    const shape = new THREE.Shape();
    shape.moveTo(-W / 2 + R, -H / 2);
    shape.lineTo(-0.15, -H / 2);
    shape.lineTo(-0.50, -0.82);
    shape.lineTo(-0.35, -H / 2);
    shape.lineTo(W / 2 - R, -H / 2);
    shape.quadraticCurveTo(W / 2, -H / 2, W / 2, -H / 2 + R);
    shape.lineTo(W / 2, H / 2 - R);
    shape.quadraticCurveTo(W / 2, H / 2, W / 2 - R, H / 2);
    shape.lineTo(-W / 2 + R, H / 2);
    shape.quadraticCurveTo(-W / 2, H / 2, -W / 2, H / 2 - R);
    shape.lineTo(-W / 2, -H / 2 + R);
    shape.quadraticCurveTo(-W / 2, -H / 2, -W / 2 + R, -H / 2);

    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.16, bevelEnabled: true, bevelSegments: 4, bevelSize: 0.06, bevelThickness: 0.06 }).toNonIndexed();
    geo.center();

    const SCALE = 1.25;
    geo.scale(SCALE, SCALE, SCALE * 1.5);

    return sampleGeometry(geo, n);
}

// ─── Particle material ────────────────────────────────────────────────────
function makeParticleMat() {
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
        else if (t < 0.58) { f = 1.0; to = 1.0; mt = 0.0; }
        else if (t < 0.66) { f = 1.0; to = 2.0; mt = ease((t - 0.58) / 0.08); }
        else if (t < 0.80) { f = 2.0; to = 2.0; mt = 0.0; }
        else if (t < 0.88) { f = 2.0; to = 0.0; mt = ease((t - 0.80) / 0.08); }
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

// ─── Background radial halo (like MDX's glow shadow) ──────────────────────
// A large softly-lit disc behind the floating 3D object creates depth and
// makes the shape appear to float above the page.
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

// ─── Bottom Soft Contact Shadow ───────────────────────────────────────────
// A highly realistic GPU-accelerated ground contact shadow.
// Uses mathematical Signed Distance Fields (SDFs) to draw the exact shadow
// footprint of each 3D shape (sphere, book pages, chat bubble tail) and morphs
// them dynamically on the GPU, just like a high-end physical renderer.
function BottomShadow({ scrollT }) {
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
        if (t < 0.06) { f = 0; to = 0; mt = 0 }
        else if (t < 0.19) { f = 0; to = 1; mt = smooth((t - 0.06) / 0.13) }
        else if (t < 0.58) { f = 1; to = 1; mt = 0 }
        else if (t < 0.66) { f = 1; to = 2; mt = smooth((t - 0.58) / 0.08) }
        else if (t < 0.80) { f = 2; to = 2; mt = 0 }
        else if (t < 0.88) { f = 2; to = 0; mt = smooth((t - 0.80) / 0.08) }
        else { f = 0; to = 0; mt = 0 }

        // Update GPU uniforms
        mat.uniforms.uFromShape.value = f
        mat.uniforms.uToShape.value = to
        mat.uniforms.uMorph.value = mt
        mat.uniforms.uHeightFactor.value = clamp((bobY + 0.045) / 0.09, 0, 1)
    })

    return (
        <mesh ref={meshRef} position={[0, -1.62, -0.05]} rotation={[-Math.PI * 0.46, 0, 0]} scale={[3.8, 1.4, 1]}>
            <planeGeometry args={[1, 1]} />
            <primitive object={mat} attach="material" />
        </mesh>
    )
}

// ─── R3F: Morphing particle cloud ─────────────────────────────────────────
function ParticleCloud({ scrollT }) {
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
            sizeArr[i] = 0.50 + Math.random() * 1.5
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

    useFrame(({ clock }, delta) => {
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
        meshRef.current.position.y = Math.sin(el * 0.30) * lerp(0.045, 0.015, 1 - sphereAmt) + endYOffset

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


// ─── R3F: Complete scene ──────────────────────────────────────────────────
function OgScene({ scrollT }) {
    return (
        <>
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

// ─── Story panel data ─────────────────────────────────────────────────────
const STORY = [
    { from: 0.00, to: 0.19, stage: '01', heading: "Every student's story", highlight: "starts here.", body: null },
    { from: 0.19, to: 0.42, stage: '02', heading: "The most important", highlight: "decision of your life.", body: null },
    { from: 0.42, to: 0.58, stage: '03', heading: "Made with the", highlight: "wrong information.", body: "Counsellors with conflicts. Seniors who ghosted. Google answers from 2019." },
    { from: 0.58, to: 0.80, stage: '04', heading: "You reached out.", highlight: "Nobody answered.", body: null },
    { from: 0.80, to: 0.93, stage: '05', heading: "Until", highlight: "now.", body: "ogsenior connects you with verified peers who've been there — before you choose your college, branch, or career." },
]

// ─── Story text overlay ────────────────────────────────────────────────────
function StoryPanel({ scrollT }) {
    const active = STORY.find(s => scrollT >= s.from && scrollT < s.to)
    if (!active) return null

    const fadeIn = clamp((scrollT - active.from) / 0.06, 0, 1)
    const fadeOut = clamp((active.to - scrollT) / 0.04, 0, 1)
    const op = easeOut3(fadeIn) * fadeOut
    const ty = lerp(32, 0, easeOut3(fadeIn))

    return (
        <div style={{
            position: 'absolute', left: 0, right: 0, bottom: '11%',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            zIndex: 10, pointerEvents: 'none',
            opacity: op, transform: `translateY(${ty}px)`,
        }}>
            {/* Stage badge */}
            <div style={{
                fontFamily: 'DM Sans,sans-serif', fontSize: 10.5, fontWeight: 600,
                letterSpacing: '0.16em', textTransform: 'uppercase',
                color: 'rgba(120,90,55,0.55)', marginBottom: 10,
            }}>
                Stage {active.stage}
            </div>

            {/* Main heading — dark brown on light bg */}
            <h2 style={{
                fontFamily: 'Syne,sans-serif',
                fontSize: 'clamp(22px,3.8vw,44px)',
                fontWeight: 800, lineHeight: 1.15,
                color: '#1A120A',
                textAlign: 'center', margin: '0 0 4px',
                letterSpacing: '-0.025em',
            }}>
                {active.heading}
            </h2>

            {/* Highlighted line — warm amber/gold gradient */}
            <h2 style={{
                fontFamily: 'Syne,sans-serif',
                fontSize: 'clamp(22px,3.8vw,44px)',
                fontWeight: 800, lineHeight: 1.15,
                background: 'linear-gradient(110deg,#B45309 0%,#D97706 60%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                textAlign: 'center', margin: '0 0 18px',
                letterSpacing: '-0.025em',
            }}>
                {active.highlight}
            </h2>

            {active.body && (
                <p style={{
                    fontFamily: 'DM Sans,sans-serif',
                    fontSize: 'clamp(13px,1.5vw,16px)',
                    color: 'rgba(60,40,20,0.55)',
                    textAlign: 'center', maxWidth: 440,
                    lineHeight: 1.65, margin: 0,
                }}>
                    {active.body}
                </p>
            )}
        </div>
    )
}

// ─── Book stage overlay: "What after 12th??" ──────────────────────────────
// Positioned on the RIGHT page of the open book.
// Text uses dark ink tones — darker than the particle surface (#5C4E3E) so
// it reads clearly without floating above the object.
function BookOverlay({ scrollT }) {
    const raw = clamp((scrollT - 0.43) / 0.10, 0, 1) * clamp((0.57 - scrollT) / 0.06, 0, 1)
    const op = easeOut3(raw)
    if (op < 0.01) return null

    return (
        <div style={{
            position: 'absolute', top: '50%', left: '50%',
            // Shift right to land on the right page (which faces camera after Y-tilt)
            transform: `translate(-40%, -50%) scale(${lerp(0.90, 1, easeOut3(raw))})`,
            opacity: op, zIndex: 8, pointerEvents: 'none', textAlign: 'left',
            width: 'clamp(130px,18vw,210px)',
        }}>
            {/* Chapter label — like a real book page header */}
            <div style={{
                fontFamily: 'DM Sans,sans-serif', fontSize: 'clamp(7px,0.9vw,10px)',
                fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase',
                color: 'rgba(60,40,18,0.40)',   // muted ink — sits ON the page surface
                marginBottom: 7,
            }}>
                Chapter I
            </div>

            {/* Main title — dark warm ink, reads like handwriting on the page */}
            <div style={{
                fontFamily: 'Georgia,"Times New Roman",serif',
                fontSize: 'clamp(15px,2.2vw,26px)',
                fontWeight: 700, lineHeight: 1.25,
                color: '#2A1C0C',   // very dark brown — high contrast on pearl page
                letterSpacing: '-0.01em',
            }}>
                What after<br />12th??
            </div>

            {/* Thin rule — like a real printed book line */}
            <div style={{
                width: '60%', height: 1,
                background: 'rgba(60,35,10,0.22)',
                margin: '9px 0',
            }} />

            {/* Narrative text block */}
            <div style={{
                fontFamily: 'Georgia,"Times New Roman",serif',
                fontSize: 'clamp(9px,1.1vw,12.5px)',
                color: 'rgba(60,40,20,0.78)',
                lineHeight: 1.55,
                fontStyle: 'italic',
            }}>
                The question every student carries
            </div>
        </div>
    )
}

// ─── Chat stage overlay: WhatsApp chat bubbles ────────────────────────────
// Sits INSIDE the chat icon particle silhouette. Bubbles use dark-warm tones so
// they contrast against the pearl particle surface (#C8B89A–#EEE4D4 range)
// while still visually merging with the 3D chat icon form.
function ChatOverlay({ scrollT }) {
    const raw = clamp((scrollT - 0.58) / 0.06, 0, 1) * clamp((0.80 - scrollT) / 0.05, 0, 1)
    const op = easeOut3(raw)
    if (op < 0.01) return null

    const msgOp = easeOut3(clamp((scrollT - 0.64) / 0.06, 0, 1))
    const noRepOp = easeOut3(clamp((scrollT - 0.70) / 0.05, 0, 1))

    return (
        <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: op, zIndex: 8, pointerEvents: 'none',
            display: 'flex', flexDirection: 'column', gap: 8,
            width: 'clamp(145px,21vw,200px)',
        }}>
            {/* Received bubble — dark charcoal, contrasts against pearl chat icon surface */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
                <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: '#3D2E1E',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Syne,sans-serif', fontSize: 9, fontWeight: 800, color: '#EEE4D4',
                }}>R</div>
                <div style={{
                    background: 'rgba(42,28,12,0.78)',
                    borderRadius: '10px 10px 10px 2px',
                    padding: '7px 10px',
                    fontFamily: 'DM Sans,sans-serif', fontSize: 'clamp(9px,1.1vw,11px)',
                    color: '#E8D8C0',
                    lineHeight: 1.4,
                }}>
                    Busy rn, talk to you<br />later...
                </div>
            </div>

            {/* Sent bubble — warm amber */}
            <div style={{
                alignSelf: 'flex-end',
                opacity: msgOp,
                transform: `translateY(${lerp(6, 0, msgOp)}px)`,
            }}>
                <div style={{
                    background: 'rgba(92,48,12,0.85)',   // deep amber-brown
                    borderRadius: '10px 10px 2px 10px',
                    padding: '7px 10px',
                    fontFamily: 'DM Sans,sans-serif', fontSize: 'clamp(9px,1.1vw,11px)',
                    color: '#F0E0C4', lineHeight: 1.4, textAlign: 'right',
                }}>
                    Which branch should I take?<br />
                    <span style={{ opacity: 0.8 }}>Please reply bhaiya 🙏</span>
                    <div style={{ fontSize: 9, color: 'rgba(240,220,180,0.45)', marginTop: 3 }}>
                        ✓✓ Seen
                    </div>
                </div>
            </div>

            {/* No reply — muted ink pill that blends with chat icon surface */}
            <div style={{
                opacity: noRepOp, alignSelf: 'center',
                background: 'rgba(42,28,12,0.12)',
                border: '1px solid rgba(42,28,12,0.18)',
                borderRadius: 100, padding: '4px 12px',
                fontFamily: 'DM Sans,sans-serif', fontSize: 'clamp(8px,1.0vw,10px)',
                color: 'rgba(42,28,12,0.55)',
                fontStyle: 'italic',
            }}>
                No reply... 😔
            </div>
        </div>
    )
}

// ─── Progress dots ────────────────────────────────────────────────────────
function StageDots({ scrollT }) {
    const idx = STORY.findIndex(s => scrollT >= s.from && scrollT < s.to)
    return (
        <div style={{
            position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
            display: 'flex', flexDirection: 'column', gap: 8, zIndex: 10, pointerEvents: 'none',
        }}>
            {STORY.map((_, i) => (
                <div key={i} style={{
                    width: i === idx ? 6 : 4,
                    height: i === idx ? 20 : 4,
                    borderRadius: 3,
                    background: i === idx ? 'rgba(160,100,30,0.80)' : 'rgba(100,70,30,0.20)',
                    transition: 'all 0.4s ease',
                }} />
            ))}
        </div>
    )
}

// ─── Scroll hint ──────────────────────────────────────────────────────────
function ScrollHint({ scrollT }) {
    const op = clamp(1 - scrollT / 0.06, 0, 1)
    if (op < 0.01) return null
    return (
        <div style={{
            position: 'absolute', bottom: '4.5%', left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            pointerEvents: 'none', zIndex: 10, opacity: op,
        }}>
            <span style={{
                fontFamily: 'DM Sans,sans-serif', fontSize: 10,
                color: 'rgba(80,55,25,0.40)', letterSpacing: '0.14em', textTransform: 'uppercase',
            }}>scroll to explore</span>
            <div style={{
                width: 20, height: 32, border: '1.5px solid rgba(80,55,25,0.22)',
                borderRadius: 10, display: 'flex', justifyContent: 'center', paddingTop: 4,
            }}>
                <div style={{
                    width: 2.5, height: 5, background: 'rgba(80,55,25,0.28)',
                    borderRadius: 2, animation: 'ogscroll 1.8s ease-in-out infinite',
                }} />
            </div>
        </div>
    )
}

// ─── Final CTA (scrollT ≥ 0.93) ───────────────────────────────────────────
function HeroCTA({ scrollT }) {
    const op = easeOut3(clamp((scrollT - 0.93) / 0.07, 0, 1))
    if (op < 0.01) return null

    return (
        <>
            {/* Gradient veil — fades canvas into CTA on light background */}
            <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '65%',
                background: 'linear-gradient(to top, #EAEAEA 30%, rgba(234,234,234,0.75) 65%, transparent)',
                zIndex: 11, pointerEvents: 'none', opacity: op,
            }} />

            <div style={{
                position: 'absolute', bottom: '4%', left: 0, right: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
                zIndex: 15, opacity: op,
                transform: `translateY(${lerp(24, 0, op)}px)`,
                pointerEvents: op > 0.6 ? 'auto' : 'none',
            }}>
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    background: 'rgba(5,150,105,0.10)', border: '1px solid rgba(5,150,105,0.30)',
                    borderRadius: 100, padding: '5px 16px',
                }}>
                    <span style={{
                        width: 6, height: 6, borderRadius: '50%', background: '#059669',
                        display: 'inline-block', animation: 'ogpulse 2s ease-in-out infinite',
                    }} />
                    <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12.5, color: '#059669', fontWeight: 500 }}>
                        Peer mentorship for Indian students
                    </span>
                </div>

                <h1 style={{
                    fontFamily: 'Syne,sans-serif',
                    fontSize: 'clamp(38px,6.5vw,78px)',
                    fontWeight: 800, color: '#0F0A05',
                    letterSpacing: '-0.04em', lineHeight: 1.0,
                    textAlign: 'center', margin: 0,
                }}>
                    Ask before<br />
                    <span style={{
                        background: 'linear-gradient(120deg,#059669 0%,#D97706 60%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>you choose.</span>
                </h1>

                <p style={{
                    fontFamily: 'DM Sans,sans-serif',
                    fontSize: 'clamp(13px,1.6vw,17px)',
                    color: 'rgba(60,40,15,0.55)',
                    textAlign: 'center', maxWidth: 400, lineHeight: 1.65, margin: 0,
                }}>
                    Real advice from verified peers and professionals —<br />
                    before your college, branch, or career decision.
                </p>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {[
                        { label: "I'm a Student", color: '#059669', href: `${FRONTEND}/?role=student`, shadow: 'rgba(5,150,105,0.35)' },
                        { label: "Become an Insider", color: '#D97706', href: `${FRONTEND}/?role=insider`, shadow: 'rgba(217,119,6,0.35)' },
                        { label: "Become a Mentor", color: '#7C3AED', href: `${FRONTEND}/?role=mentor`, shadow: 'rgba(124,58,237,0.35)' },
                    ].map(b => (
                        <a key={b.label} href={b.href} target="_blank" rel="noopener noreferrer"
                            style={{
                                fontFamily: 'Syne,sans-serif', fontSize: 13.5, fontWeight: 700,
                                color: '#fff', background: b.color, borderRadius: 14,
                                padding: '12px 24px', textDecoration: 'none',
                                boxShadow: `0 4px 18px ${b.shadow}`, letterSpacing: '0.01em',
                                transition: 'all 0.22s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 28px ${b.shadow}` }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = `0 4px 18px ${b.shadow}` }}
                        >
                            {b.label} →
                        </a>
                    ))}
                </div>

                {/* Scroll-down nudge */}
                <div style={{ animation: 'ogbounce 2s ease-in-out infinite', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, opacity: 0.45 }}>
                    <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 10, color: '#fff', letterSpacing: '0.12em', textTransform: 'uppercase' }}>scroll to explore</span>
                    <span style={{ fontSize: 14, color: '#fff' }}>↓</span>
                </div>
            </div>
        </>
    )
}

// ─── Hero section ─────────────────────────────────────────────────────────
// Uses position:sticky — the canvas sticks to viewport while user scrolls
// through the tall (500 vh) section.
function Hero({ scrollT, setScrollT }) {
    const sectionRef = useRef()

    useEffect(() => {
        const onScroll = () => {
            const el = sectionRef.current; if (!el) return
            const rect = el.getBoundingClientRect()
            const sH = el.offsetHeight - window.innerHeight
            const scrolled = Math.max(0, -rect.top)
            setScrollT(clamp(scrolled / sH, 0, 1))
        }
        window.addEventListener('scroll', onScroll, { passive: true })
        onScroll()                  // sync on mount
        return () => window.removeEventListener('scroll', onScroll)
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
                <HeroCTA scrollT={scrollT} />

                {/* Seamless transition at bottom from cream hero to cream content below */}
                {scrollT >= 0.99 && (
                    <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
                        background: 'linear-gradient(to bottom, transparent, #F3F3F3)',
                        zIndex: 20, pointerEvents: 'none',
                    }} />
                )}
            </div>
        </div>
    )
}

// ─── Loader ────────────────────────────────────────────────────────────────
function Loader({ onDone }) {
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

// ─── Nav ───────────────────────────────────────────────────────────────────
// Hero is now cream so nav text is always dark. Gains glassmorphism bg on scroll.
function Nav({ cd, scrollT }) {
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#059669', animation: 'ogpulse 2s ease-in-out infinite' }} />
                <span style={{
                    fontFamily: 'DM Sans,sans-serif', fontSize: 12.5,
                    color: 'rgba(80,55,25,0.55)',
                }}>
                    Launching June 20 · {cd.d}d {String(cd.h).padStart(2, '0')}h away
                </span>
            </div>
        </nav>
    )
}

// ─── 2D Sections (unchanged) ───────────────────────────────────────────────
const F = {
    display: { fontFamily: 'Syne,sans-serif', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.12, color: '#111' },
    body: { fontFamily: 'DM Sans,sans-serif', fontSize: 15.5, color: '#6B7280', lineHeight: 1.72 },
    eyebrow: { fontFamily: 'DM Sans,sans-serif', fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 },
    wrap: { maxWidth: 1060, margin: '0 auto', padding: '0 24px' },
}

function ProblemSection() {
    const cards = [
        { icon: '⚠️', title: 'Advice with conflicts of interest', accent: '#EF4444', body: "Traditional counsellors are paid by colleges to send students there. Their incentive was never your future — it was their commission." },
        { icon: '🔇', title: 'Silence from the people who matter', accent: '#F59E0B', body: "You messaged seniors on LinkedIn, WhatsApp, Reddit. Most never replied. Nobody had skin in the game." },
        { icon: '📅', title: 'Outdated, biased, wrong', accent: '#7C3AED', body: "Google results from 2019. YouTube videos from coaching institutes with an agenda. Nobody telling you what's actually true right now." },
    ]
    return (
        <section style={{ background: '#FAF8F4', padding: '100px 24px' }}>
            <div style={F.wrap}>
                <div style={{ textAlign: 'center', marginBottom: 52 }}>
                    <p style={{ ...F.eyebrow, color: '#EF4444' }}>The real problem</p>
                    <h2 style={{ ...F.display, fontSize: 'clamp(28px,4.5vw,46px)' }}>The system was never<br />built for you.</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))', gap: 20 }}>
                    {cards.map((c, i) => (
                        <div key={i} style={{ background: '#fff', border: '1px solid #F3F4F6', borderLeft: `4px solid ${c.accent}`, borderRadius: 16, padding: '28px 24px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                            <div style={{ fontSize: 28, marginBottom: 12 }}>{c.icon}</div>
                            <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 17, fontWeight: 700, color: '#111', marginBottom: 10, lineHeight: 1.35 }}>{c.title}</h3>
                            <p style={{ ...F.body, fontSize: 14.5 }}>{c.body}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

function HowItWorksSection() {
    const steps = [
        { n: '01', color: '#059669', label: 'Choose who you need', sub: 'Insider for college life,\nMentor for career decisions.' },
        { n: '02', color: '#D97706', label: 'Book a session', sub: 'Starting at ₹99.\nInstant confirmation.' },
        { n: '03', color: '#7C3AED', label: 'Get real answers', sub: 'No curation. No delay.\nHonest advice.' },
    ]
    return (
        <section style={{ background: '#fff', padding: '100px 24px' }}>
            <div style={F.wrap}>
                <div style={{ textAlign: 'center', marginBottom: 52 }}>
                    <p style={{ ...F.eyebrow, color: '#7C3AED' }}>How it works</p>
                    <h2 style={{ ...F.display, fontSize: 'clamp(26px,4vw,44px)', marginBottom: 14 }}>Three steps.<br />One honest conversation.</h2>
                    <p style={{ ...F.body, maxWidth: 460, margin: '0 auto' }}>We connect students with Insiders and Mentors who get paid for genuine advice. When real money is on the line, real answers follow.</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', border: '1px solid #F3F4F6', borderRadius: 20, overflow: 'hidden', marginBottom: 60 }}>
                    {steps.map((st, i) => (
                        <div key={i} style={{ padding: '32px 28px', borderRight: i < 2 ? '1px solid #F3F4F6' : 'none', background: '#fff' }}>
                            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 12, fontWeight: 800, color: st.color, letterSpacing: '0.06em', marginBottom: 10 }}>{st.n}</div>
                            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 700, color: '#111', marginBottom: 8 }}>{st.label}</div>
                            <div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 14, color: '#9CA3AF', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{st.sub}</div>
                        </div>
                    ))}
                </div>
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <p style={{ ...F.eyebrow, color: '#059669' }}>Watch the story</p>
                    <h3 style={{ ...F.display, fontSize: 'clamp(20px,3vw,30px)', marginBottom: 24 }}>Why we built OgSenior</h3>
                </div>
                <div style={{ position: 'relative', maxWidth: 720, margin: '0 auto', borderRadius: 20, overflow: 'hidden', aspectRatio: '16/9', boxShadow: '0 20px 60px rgba(0,0,0,0.1)', border: '1px solid #F3F4F6' }}>
                    <iframe width="100%" height="100%" src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1" title="Why we built OgSenior" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
                </div>
            </div>
        </section>
    )
}

function RoleCard({ r }) {
    const [hov, setHov] = useState(false)
    return (
        <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} onClick={() => window.open(r.href, '_blank')}
            style={{ background: hov ? `rgba(${r.rgb},0.04)` : '#fff', border: `1px solid ${hov ? r.color : '#F3F4F6'}`, borderRadius: 18, padding: '28px 24px', transition: 'all 0.3s ease', transform: hov ? 'translateY(-4px)' : 'none', boxShadow: hov ? `0 12px 32px rgba(${r.rgb},0.12)` : '0 2px 8px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
            <span style={{ display: 'inline-block', alignSelf: 'flex-start', background: `rgba(${r.rgb},0.12)`, color: r.color, fontFamily: 'Syne,sans-serif', fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 10px', borderRadius: 100, marginBottom: 16 }}>{r.label}</span>
            <h3 style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 800, color: '#111', marginBottom: 10, lineHeight: 1.28, flexGrow: 1, whiteSpace: 'pre-line' }}>{r.headline}</h3>
            <p style={{ ...F.body, fontSize: 14, marginBottom: 20 }}>{r.body}</p>
            <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 16, marginBottom: 18 }}>
                {r.stats.map((st, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><div style={{ width: 5, height: 5, borderRadius: '50%', background: r.color, flexShrink: 0 }} /><span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: '#9CA3AF' }}>{st}</span></div>))}
            </div>
            <a href={r.href} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ display: 'block', textAlign: 'center', textDecoration: 'none', color: hov ? '#fff' : r.color, background: hov ? r.color : 'transparent', border: `1.5px solid ${r.color}`, borderRadius: 10, padding: '11px', fontFamily: 'Syne,sans-serif', fontSize: 13.5, fontWeight: 700, transition: 'all 0.2s' }}>{r.cta} →</a>
        </div>
    )
}

function RolesSection() {
    const roles = [
        { key: 'student', label: 'Student', color: '#059669', rgb: '5,150,105', headline: 'Real advice\nbefore you choose.', body: "Before you pick a college, a branch, a career — talk to someone who's already living it. Verified. Accountable. Real.", stats: ['Sessions from ₹99', 'Verified Insiders & Mentors', 'Same-day response'], cta: 'Join as a Student', href: `${FRONTEND}/?role=student` },
        { key: 'insider', label: 'Insider', color: '#D97706', rgb: '217,119,6', headline: 'Your experience\nis worth money.', body: "You've navigated what thousands of students are figuring out. Your knowledge of college life, placements — it has real value.", stats: ['₹80–120 per session', '1–2 hrs/week minimum', 'Paid weekly to UPI'], cta: 'Become an Insider', href: `${FRONTEND}/?role=insider` },
        { key: 'mentor', label: 'Mentor', color: '#7C3AED', rgb: '124,58,237', headline: 'Your industry\nknowledge matters.', body: "Tell students what you wish someone had told you. Earn consistently on the side without competing with what you're building.", stats: ['₹150–300 per session', 'Set your own schedule', 'Strictly vetted students'], cta: 'Become a Mentor', href: `${FRONTEND}/?role=mentor` },
    ]
    return (
        <section style={{ background: '#FAF8F4', padding: '100px 24px' }}>
            <div style={F.wrap}>
                <div style={{ textAlign: 'center', marginBottom: 52 }}>
                    <p style={{ ...F.eyebrow, color: '#D97706' }}>Where do you belong?</p>
                    <h2 style={{ ...F.display, fontSize: 'clamp(26px,4vw,44px)' }}>Three kinds of people.<br />One network.</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
                    {roles.map(r => <RoleCard key={r.key} r={r} />)}
                </div>
            </div>
        </section>
    )
}

function WaitlistSection({ cd }) {
    const [form, setForm] = useState({ email: '', role: 'student', done: false, busy: false })
    const [foc, setFoc] = useState(false)
    const submit = () => { if (!form.email.includes('@')) return; setForm(f => ({ ...f, busy: true })); setTimeout(() => setForm(f => ({ ...f, busy: false, done: true })), 900) }
    const ticks = [{ v: cd.d, l: 'Days', c: '#059669' }, { v: cd.h, l: 'Hours', c: '#D97706' }, { v: cd.m, l: 'Mins', c: '#7C3AED' }, { v: cd.s, l: 'Secs', c: 'rgba(255,255,255,0.3)' }]
    return (
        <section style={{ background: '#111', padding: '100px 24px' }}>
            <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
                <p style={{ ...F.eyebrow, color: 'rgba(255,255,255,0.3)' }}>Going live in</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 44, alignItems: 'flex-start' }}>
                    {ticks.map((tk, i) => (<div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>{i > 0 && <div style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(20px,4vw,42px)', fontWeight: 300, color: 'rgba(255,255,255,0.12)', lineHeight: 1.05 }}>:</div>}<div style={{ textAlign: 'center', minWidth: 50 }}><div style={{ fontFamily: 'Syne,sans-serif', fontSize: 'clamp(24px,4.5vw,50px)', fontWeight: 800, color: tk.c, lineHeight: 1, letterSpacing: '-0.02em' }}>{String(tk.v).padStart(2, '0')}</div><div style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 10, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>{tk.l}</div></div></div>))}
                </div>
                <h2 style={{ ...F.display, fontSize: 'clamp(24px,4vw,38px)', color: '#fff', marginBottom: 8 }}>Be the first in.</h2>
                <p style={{ ...F.body, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>Early users get priority access on launch day.</p>
                {form.done ? (
                    <div style={{ background: 'rgba(5,150,105,0.12)', border: '1px solid #059669', borderRadius: 14, padding: '22px' }}>
                        <div style={{ fontSize: 26, marginBottom: 6 }}>✓</div>
                        <p style={{ fontFamily: 'Syne,sans-serif', fontSize: 16, fontWeight: 700, color: '#059669', marginBottom: 4 }}>You're on the list.</p>
                        <p style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.38)' }}>See you June 20, 2026.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9, maxWidth: 360, margin: '0 auto' }}>
                        <input type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} onKeyDown={e => e.key === 'Enter' && submit()} onFocus={() => setFoc(true)} onBlur={() => setFoc(false)} style={{ background: 'rgba(255,255,255,0.06)', border: `1.5px solid ${foc ? '#059669' : 'rgba(255,255,255,0.1)'}`, borderRadius: 10, padding: '12px 16px', fontFamily: 'DM Sans,sans-serif', fontSize: 15, color: '#fff', width: '100%', transition: 'border-color 0.2s' }} />
                        <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', fontFamily: 'DM Sans,sans-serif', fontSize: 15, color: 'rgba(255,255,255,0.5)', width: '100%', cursor: 'pointer' }}>
                            <option value="student">I'm a Student</option>
                            <option value="insider">I'm an Insider (current student)</option>
                            <option value="mentor">I'm a Mentor (professional)</option>
                        </select>
                        <button onClick={submit} disabled={form.busy} style={{ background: 'linear-gradient(135deg,#059669,#D97706)', border: 'none', borderRadius: 10, padding: '13px', fontFamily: 'Syne,sans-serif', fontSize: 14, fontWeight: 700, color: '#fff', cursor: form.busy ? 'wait' : 'pointer', opacity: form.busy ? 0.7 : 1, transition: 'opacity 0.2s', letterSpacing: '0.02em', boxShadow: '0 4px 20px rgba(5,150,105,0.3)' }}>
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
        <footer style={{ background: '#0A0A0A', padding: '26px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontFamily: 'Syne,sans-serif', fontSize: 18, fontWeight: 800, color: '#fff' }}>og<span style={{ color: '#059669' }}>senior</span></span>
            <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>"Ask before you choose." · June 20, 2026</span>
            <span style={{ fontFamily: 'DM Sans,sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.18)' }}>Built in India 🇮🇳</span>
        </footer>
    )
}

function GlobalStyles() {
    useEffect(() => {
        if (document.getElementById('og-gs')) return
        const s = document.createElement('style'); s.id = 'og-gs'
        s.textContent = `
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
      html{scroll-behavior:smooth}
      body{background:#EAEAEA;overflow-x:hidden}
      @keyframes ogpulse{0%,100%{opacity:.3}50%{opacity:1}}
      @keyframes ogscroll{0%,100%{transform:translateY(0);opacity:.3}50%{transform:translateY(6px);opacity:1}}
      @keyframes ogbounce{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}
    `
        document.head.appendChild(s)
        return () => { const e = document.getElementById('og-gs'); if (e) e.remove() }
    }, []); return null
}

// ─── Root ─────────────────────────────────────────────────────────────────
export default function App() {
    const [scrollT, setScrollT] = useState(0)
    const [loaded, setLoaded] = useState(false)
    const countdown = useCountdown()

    return (
        <>
            <GlobalStyles />
            {!loaded && <Loader onDone={() => setLoaded(true)} />}
            <Nav cd={countdown} scrollT={scrollT} />
            <div id="og-hero">
                <Hero scrollT={scrollT} setScrollT={setScrollT} />
            </div>
            <ProblemSection />
            <HowItWorksSection />
            <RolesSection />
            <WaitlistSection cd={countdown} />
            <Footer />
        </>
    )
}
