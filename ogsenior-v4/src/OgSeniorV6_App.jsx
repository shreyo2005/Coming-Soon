import { useRef, useState, useEffect, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { RoundedBox, ContactShadows, Environment } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'

// ─── Config ───────────────────────────────────────────────────────────────
const FRONTEND  = 'https://asksenior-frontend.vercel.app'
const LAUNCH    = new Date('2026-06-20T00:00:00+05:30').getTime()
const CAM_START = 12
const CAM_END   = 1.9
const DESK_COL  = '#F4EFE6'

const OVERLAY_TEXTS = [
  { from:0.00, to:0.20, text:"Every student's story\nstarts here."         },
  { from:0.20, to:0.42, text:"The most important decision\nof your life."  },
  { from:0.42, to:0.62, text:"Made with the\nwrong information."            },
  { from:0.62, to:0.82, text:"You reached out.\nNobody answered."           },
  { from:0.82, to:0.93, text:"Until now."                                   },
]

const Z   = { t:0, target:0, released:false }
const lerp  = (a,b,t) => a+(b-a)*t
const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v))
const ease  = t => t<0.5 ? 2*t*t : -1+(4-2*t)*t
const easeO = t => 1-Math.pow(1-t,3)

function useCountdown(){
  const [t,setT]=useState({d:19,h:0,m:0,s:0})
  useEffect(()=>{
    const tick=()=>{const d=Math.max(0,LAUNCH-Date.now());setT({d:Math.floor(d/86400000),h:Math.floor((d%86400000)/3600000),m:Math.floor((d%3600000)/60000),s:Math.floor((d%60000)/1000)})}
    tick();const id=setInterval(tick,1000);return()=>clearInterval(id)
  },[]);return t
}

// ─── NOTEBOOK PAGE TEXTURE ────────────────────────────────────────────────
function useNotebookTex(){
  return useMemo(()=>{
    const S=1024,cv=document.createElement('canvas')
    cv.width=S;cv.height=S;const ctx=cv.getContext('2d')

    // Warm paper background with slight gradient
    const g=ctx.createLinearGradient(0,0,S,S)
    g.addColorStop(0,'#FFFEF9');g.addColorStop(1,'#FBF7EE')
    ctx.fillStyle=g;ctx.fillRect(0,0,S,S)

    // Red margin
    ctx.strokeStyle='rgba(220,140,140,0.7)';ctx.lineWidth=2.5
    ctx.beginPath();ctx.moveTo(150,0);ctx.lineTo(150,S);ctx.stroke()

    // Ruled lines — subtle
    for(let y=72;y<S;y+=50){
      ctx.strokeStyle=y===72?'rgba(220,160,160,0.5)':'rgba(180,205,235,0.5)'
      ctx.lineWidth=1.2
      ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(S,y);ctx.stroke()
    }

    // Main text — Georgia bold, hand-written feel
    ctx.save();ctx.translate(S/2,S*0.38);ctx.rotate(-0.022)
    ctx.font='bold 106px Georgia,serif';ctx.fillStyle='#1A0D00'
    ctx.textAlign='center';ctx.fillText('What after',0,0);ctx.restore()

    ctx.save();ctx.translate(S/2,S*0.52);ctx.rotate(0.016)
    ctx.font='bold 106px Georgia,serif';ctx.fillStyle='#1A0D00'
    ctx.textAlign='center';ctx.fillText('12th??',0,0);ctx.restore()

    // Underline
    ctx.strokeStyle='rgba(80,50,20,0.45)';ctx.lineWidth=2.5
    ctx.beginPath();ctx.moveTo(230,S*0.565);ctx.lineTo(790,S*0.565);ctx.stroke()

    // Gold stars
    const star=(cx,cy,r)=>{
      ctx.beginPath()
      for(let i=0;i<10;i++){const a=(i*Math.PI/5)-Math.PI/2,rd=i%2===0?r:r*0.38;i===0?ctx.moveTo(cx+Math.cos(a)*rd,cy+Math.sin(a)*rd):ctx.lineTo(cx+Math.cos(a)*rd,cy+Math.sin(a)*rd)}
      ctx.closePath();ctx.fillStyle='#C8901A';ctx.fill()
    }
    star(845,145,26);star(185,830,20)

    // Small doodles
    ctx.font='32px Georgia,serif';ctx.fillStyle='rgba(140,120,90,0.6)';ctx.textAlign='center'
    ctx.fillText('??',225,730);ctx.fillText('...',790,775)

    // Slightly show second page edge
    ctx.strokeStyle='rgba(200,190,175,0.4)';ctx.lineWidth=1
    ctx.strokeRect(8,4,S-16,S-8)

    const tex=new THREE.CanvasTexture(cv)
    tex.rotation=-Math.PI/2;tex.center.set(0.5,0.5);tex.needsUpdate=true
    return tex
  },[])
}

// ─── PHONE SCREEN TEXTURE — bright/readable ───────────────────────────────
function usePhoneTex(){
  const chat=useMemo(()=>{
    const W=640,H=1136,cv=document.createElement('canvas')
    cv.width=W;cv.height=H;const ctx=cv.getContext('2d')

    // Slightly lighter dark background — visible but realistic dark mode
    ctx.fillStyle='#1A1F35';ctx.fillRect(0,0,W,H)

    // Status bar
    ctx.fillStyle='#222840';ctx.fillRect(0,0,W,56)
    ctx.fillStyle='rgba(255,255,255,0.65)';ctx.font='bold 22px -apple-system,sans-serif'
    ctx.textAlign='left';ctx.fillText('9:41',24,38)
    ctx.textAlign='right';ctx.fillText('⬛⬛⬛',W-24,38)

    // Chat header
    ctx.fillStyle='#1E2440';ctx.fillRect(0,56,W,72)
    // Avatar circle
    ctx.beginPath();ctx.arc(72,92,26,0,Math.PI*2);ctx.fillStyle='#4A5280';ctx.fill()
    ctx.fillStyle='rgba(255,255,255,0.7)';ctx.font='bold 22px -apple-system,sans-serif'
    ctx.textAlign='center';ctx.fillText('R',72,100)
    // Name
    ctx.fillStyle='rgba(255,255,255,0.9)';ctx.font='bold 24px -apple-system,sans-serif'
    ctx.textAlign='left';ctx.fillText('Rahul bhaiya',112,88)
    ctx.fillStyle='rgba(160,170,200,0.8)';ctx.font='19px -apple-system,sans-serif'
    ctx.fillText('Last seen 2 days ago',112,112)

    // Rounded rect helper
    const rr=(x,y,w,h,r,fill)=>{
      ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y)
      ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r)
      ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h)
      ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r)
      ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();ctx.fillStyle=fill;ctx.fill()
    }

    // Received messages — left side
    const recv=[
      {y:170,txt:'Hey, kaisa chal raha hai?',w:380},
      {y:240,txt:'Entrance ka kya hua?',w:310},
      {y:314,txt:'Busy hoon, baad mein',w:340},
      {y:364,txt:'baat karte...',w:210},
    ]
    recv.forEach(m=>{
      rr(20,m.y,m.w,48,16,'#2A3055')
      ctx.fillStyle='rgba(255,255,255,0.88)';ctx.font='21px -apple-system,sans-serif'
      ctx.textAlign='left';ctx.fillText(m.txt,40,m.y+31)
    })

    // Time divider
    ctx.fillStyle='rgba(255,255,255,0.22)';ctx.font='17px -apple-system,sans-serif'
    ctx.textAlign='center';ctx.fillText('Yesterday  11:47 PM',W/2,450)

    // SENT MESSAGE — right side, blue bubble
    rr(100,476,520,86,18,'#2563EB')
    ctx.fillStyle='#fff';ctx.font='bold 22px -apple-system,sans-serif'
    ctx.textAlign='left';ctx.fillText('Which branch lena chahiye?',118,510)
    ctx.font='21px -apple-system,sans-serif'
    ctx.fillText('Please reply bhaiya 🙏',118,542)

    // Seen receipt
    ctx.fillStyle='rgba(150,160,200,0.9)';ctx.font='18px -apple-system,sans-serif'
    ctx.textAlign='right';ctx.fillText('✓✓  Seen',W-20,582)

    // Today divider
    ctx.fillStyle='rgba(255,255,255,0.18)';ctx.font='16px -apple-system,sans-serif'
    ctx.textAlign='center';ctx.fillText('Today',W/2,640)

    // No reply pill
    rr(W/2-130,664,260,42,21,'#242940')
    ctx.fillStyle='rgba(180,185,210,0.8)';ctx.font='18px -apple-system,sans-serif'
    ctx.textAlign='center';ctx.fillText('No reply... 😔',W/2,691)

    // Bottom bar
    ctx.fillStyle='#1E2440';ctx.fillRect(0,H-72,W,72)
    rr(16,H-54,W-100,40,20,'#2A3055')
    ctx.fillStyle='rgba(180,185,210,0.4)';ctx.font='19px -apple-system,sans-serif'
    ctx.textAlign='left';ctx.fillText('  Type a message...',24,H-28)
    // Send button
    ctx.beginPath();ctx.arc(W-40,H-34,24,0,Math.PI*2)
    ctx.fillStyle='#2563EB';ctx.fill()
    ctx.fillStyle='#fff';ctx.font='bold 22px -apple-system,sans-serif'
    ctx.textAlign='center';ctx.fillText('➤',W-40,H-27)

    const tex=new THREE.CanvasTexture(cv)
    tex.rotation=-Math.PI/2;tex.center.set(0.5,0.5);tex.needsUpdate=true;return tex
  },[])

  const reveal=useMemo(()=>{
    const W=640,H=1136,cv=document.createElement('canvas')
    cv.width=W;cv.height=H;const ctx=cv.getContext('2d')

    const g=ctx.createLinearGradient(0,0,0,H)
    g.addColorStop(0,'#FAFAF7');g.addColorStop(1,'#F0ECE4')
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H)

    ctx.font='bold 80px Georgia,serif';ctx.textAlign='center'
    ctx.fillStyle='#059669';ctx.fillText('og',224,320)
    ctx.fillStyle='#111';ctx.fillText('senior',394,320)

    ctx.font='bold 42px Georgia,serif';ctx.fillStyle='#111'
    ctx.textAlign='center';ctx.fillText('Ask before',W/2,412)
    ctx.fillText('you choose.',W/2,466)

    ctx.strokeStyle='#E0DBD0';ctx.lineWidth=1.5
    ctx.beginPath();ctx.moveTo(80,500);ctx.lineTo(560,500);ctx.stroke()

    ctx.font='22px -apple-system,sans-serif';ctx.fillStyle='#6B7280';ctx.textAlign='center'
    ctx.fillText('Real advice from people',W/2,548)
    ctx.fillText("who've been there.",W/2,578)

    ctx.beginPath();ctx.arc(W/2,660,48,0,Math.PI*2);ctx.fillStyle='#059669';ctx.fill()
    ctx.fillStyle='#fff';ctx.font='bold 40px -apple-system,sans-serif';ctx.textAlign='center';ctx.fillText('✓',W/2,676)
    ctx.fillStyle='#059669';ctx.font='bold 24px -apple-system,sans-serif';ctx.fillText("You're early.",W/2,748)
    ctx.fillStyle='#9CA3AF';ctx.font='20px -apple-system,sans-serif';ctx.fillText('Launching June 20, 2026',W/2,782)

    const tex=new THREE.CanvasTexture(cv)
    tex.rotation=-Math.PI/2;tex.center.set(0.5,0.5);tex.needsUpdate=true;return tex
  },[])

  return {chat,reveal}
}

// ─── DESK ─────────────────────────────────────────────────────────────────
function Desk(){
  return(
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.015,0]} receiveShadow>
      <planeGeometry args={[50,50]}/>
      <meshStandardMaterial color={DESK_COL} roughness={0.88} metalness={0.01}/>
    </mesh>
  )
}

// ─── NOTEBOOK ─────────────────────────────────────────────────────────────
function Notebook(){
  const tex=useNotebookTex()
  const spirals=useMemo(()=>{const a=[];for(let i=0;i<14;i++)a.push(-1.52+i*0.215);return a},[])

  return(
    <group position={[-1.58,0,0.08]} rotation={[0,0.04,0]}>
      {/* Back cover — slightly darker */}
      <mesh position={[0,-0.042,0]} receiveShadow castShadow>
        <boxGeometry args={[3.1,0.020,4.1]}/><meshStandardMaterial color="#C8B99A" roughness={0.92}/>
      </mesh>
      {/* Page block */}
      <mesh position={[0.06,0,0]} receiveShadow>
        <boxGeometry args={[2.98,0.072,4.06]}/><meshStandardMaterial color="#F9F6EE" roughness={0.96}/>
      </mesh>
      {/* Page edges — slight yellowing */}
      <mesh position={[1.52,0.025,0]}>
        <boxGeometry args={[0.015,0.070,4.04]}/><meshStandardMaterial color="#EDE8DA" roughness={0.98}/>
      </mesh>
      {/* Top page with handwriting texture — PlaneGeometry */}
      <mesh position={[0,0.040,0]} rotation={[-Math.PI/2,0,0]} receiveShadow>
        <planeGeometry args={[3.0,4.06]}/><meshStandardMaterial map={tex} roughness={0.88}/>
      </mesh>
      {/* Spiral wire — THIN cylinders, not torus, for realistic wire coil */}
      {spirals.map((z,i)=>(
        <group key={i} position={[-1.62,0.028,z]}>
          {/* Horizontal bar of wire */}
          <mesh rotation={[0,0,Math.PI/2]}>
            <cylinderGeometry args={[0.018,0.018,0.25,8]}/>
            <meshStandardMaterial color="#7A7A7A" roughness={0.3} metalness={0.8}/>
          </mesh>
          {/* The arc of the spiral */}
          <mesh rotation={[Math.PI/2,0,0]}>
            <torusGeometry args={[0.055,0.013,8,20,Math.PI]}/>
            <meshStandardMaterial color="#8A8A8A" roughness={0.25} metalness={0.85}/>
          </mesh>
        </group>
      ))}
      {/* Pen */}
      <group position={[1.25,0.065,1.7]} rotation={[0,-0.22,0]}>
        <mesh><cylinderGeometry args={[0.024,0.024,2.1,10]}/><meshStandardMaterial color="#1D4ED8" roughness={0.35} metalness={0.15}/></mesh>
        <mesh position={[0,-1.08,0]}><coneGeometry args={[0.024,0.16,10]}/><meshStandardMaterial color="#111" roughness={0.4}/></mesh>
        <mesh position={[0.03,0.66,0]}><boxGeometry args={[0.009,0.9,0.018]}/><meshStandardMaterial color="#1E3A8A" roughness={0.3} metalness={0.4}/></mesh>
        {/* Pen cap */}
        <mesh position={[0,1.12,0]}><cylinderGeometry args={[0.028,0.026,0.3,10]}/><meshStandardMaterial color="#1E3A8A" roughness={0.3} metalness={0.3}/></mesh>
      </group>
    </group>
  )
}

// ─── PHONE ────────────────────────────────────────────────────────────────
function Phone({zoomT}){
  const {chat,reveal}=usePhoneTex()
  const screenRef=useRef()
  const glowRef=useRef()
  const revP=clamp((zoomT-0.78)/0.22,0,1)
  const erv=easeO(revP)

  useFrame(()=>{
    if(screenRef.current){
      screenRef.current.map = erv>0.5 ? reveal : chat
      // Screen must glow to be visible — high emissive
      screenRef.current.emissiveIntensity = lerp(0.75, 0.9, erv)
      screenRef.current.emissive = new THREE.Color(erv>0.5 ? '#FFFFF0' : '#334488')
      screenRef.current.needsUpdate=true
    }
    if(glowRef.current) glowRef.current.material.opacity=erv*0.35
  })

  return(
    <group position={[1.68,0,-0.1]} rotation={[0,-0.06,0]}>
      {/* Phone body — realistic dark glass */}
      <RoundedBox args={[1.84,0.078,3.42]} radius={0.09} smoothness={6} castShadow receiveShadow>
        <meshStandardMaterial color="#0F0F12" roughness={0.12} metalness={0.7} envMapIntensity={1.2}/>
      </RoundedBox>

      {/* Thin bezel */}
      <mesh position={[0,0.041,0]} rotation={[-Math.PI/2,0,0]}>
        <planeGeometry args={[1.70,3.26]}/>
        <meshStandardMaterial color="#080808" roughness={0.05} metalness={0.2}/>
      </mesh>

      {/* SCREEN — PlaneGeometry, high emissive for visibility */}
      <mesh position={[0,0.048,0]} rotation={[-Math.PI/2,0,0]}>
        <planeGeometry args={[1.60,3.10]}/>
        <meshStandardMaterial
          ref={screenRef}
          map={chat}
          emissive="#334488"
          emissiveIntensity={0.75}
          roughness={0.04}
          metalness={0}
        />
      </mesh>

      {/* Screen glow (light bloom effect) */}
      <mesh ref={glowRef} position={[0,0.055,0]} rotation={[-Math.PI/2,0,0]}>
        <planeGeometry args={[1.66,3.16]}/>
        <meshBasicMaterial color="#C8F0E8" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false}/>
      </mesh>

      {/* Side buttons */}
      <mesh position={[0.945,0.01,0.36]}><boxGeometry args={[0.016,0.026,0.32]}/><meshStandardMaterial color="#1A1A1E" roughness={0.3} metalness={0.75}/></mesh>
      <mesh position={[-0.945,0.01,-0.24]}><boxGeometry args={[0.016,0.026,0.46]}/><meshStandardMaterial color="#1A1A1E" roughness={0.3} metalness={0.75}/></mesh>

      {/* Camera bump — subtle */}
      <mesh position={[-0.45,0.046,-1.34]}>
        <boxGeometry args={[0.46,0.012,0.42]}/><meshStandardMaterial color="#141418" roughness={0.2} metalness={0.7}/>
      </mesh>
      {/* Camera lens circles */}
      {[[-0.55,-1.38],[-0.36,-1.38],[-0.55,-1.2]].map(([x,z],i)=>(
        <mesh key={i} position={[x,0.054,z]} rotation={[-Math.PI/2,0,0]}>
          <circleGeometry args={[0.06,16]}/><meshStandardMaterial color="#0A0A10" roughness={0.05} metalness={0.9}/>
        </mesh>
      ))}

      {/* Screen glow light */}
      <pointLight position={[0,0.5,0]} color={erv>0.5?'#FFFFCC':'#4466FF'} intensity={erv*3+0.5} distance={5}/>
    </group>
  )
}

// ─── DESK ITEMS ───────────────────────────────────────────────────────────
function DeskItems(){
  return(
    <group>
      {/* Eraser — white/cream, subtle */}
      <mesh position={[-3.1,0.028,0.8]} rotation={[0,0.2,0]} castShadow>
        <boxGeometry args={[0.58,0.055,0.22]}/><meshStandardMaterial color="#F0EBE0" roughness={0.9}/>
      </mesh>
      {/* Eraser label */}
      <mesh position={[-3.1,0.056,0.8]} rotation={[-Math.PI/2,0,-0.2]}>
        <planeGeometry args={[0.52,0.18]}/><meshStandardMaterial color="#E8C0A0" roughness={0.9} transparent opacity={0.7}/>
      </mesh>
      {/* Coin */}
      <mesh position={[3.1,0.01,1.2]} rotation={[-Math.PI/2,0,0.18]}>
        <cylinderGeometry args={[0.13,0.13,0.013,24]}/><meshStandardMaterial color="#BFA030" roughness={0.3} metalness={0.8}/>
      </mesh>
      {/* College brochure — subtle blue-white */}
      <group position={[2.5,0.01,1.6]} rotation={[0,-0.38,0]}>
        <mesh castShadow><boxGeometry args={[1.3,0.016,0.92]}/><meshStandardMaterial color="#EBF0FA" roughness={0.82}/></mesh>
        <mesh position={[0,0.012,0]}><boxGeometry args={[1.24,0.003,0.88]}/><meshStandardMaterial color="#D4DDF5" roughness={0.88}/></mesh>
      </group>
      {/* Small post-it note */}
      <mesh position={[-2.2,0.008,-1.0]} rotation={[-Math.PI/2,0,0.15]} castShadow>
        <planeGeometry args={[0.7,0.7]}/><meshStandardMaterial color="#FFF4B8" roughness={0.9} side={THREE.DoubleSide}/>
      </mesh>
    </group>
  )
}

// ─── PARTICLES ────────────────────────────────────────────────────────────
function Particles(){
  const meshRef=useRef(),N=20
  const data=useMemo(()=>{
    const pos=[],rot=[],spd=[],sz=[]
    for(let i=0;i<N;i++){
      pos.push((Math.random()-0.5)*9,Math.random()*2+0.05,(Math.random()-0.5)*7)
      rot.push(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI)
      spd.push(0.0018+Math.random()*0.0025)
      sz.push(0.028+Math.random()*0.04,0.001,0.042+Math.random()*0.05)
    }
    return{pos,rot,spd,sz}
  },[])
  const p=useRef([...data.pos]),r=useRef([...data.rot])
  const d=useMemo(()=>new THREE.Object3D(),[])
  useFrame(()=>{
    if(!meshRef.current)return
    for(let i=0;i<N;i++){
      p.current[i*3+1]+=data.spd[i]
      if(p.current[i*3+1]>3.0)p.current[i*3+1]=0.05
      r.current[i*3]+=0.004;r.current[i*3+1]+=0.003
      d.position.set(p.current[i*3],p.current[i*3+1],p.current[i*3+2])
      d.rotation.set(r.current[i*3],r.current[i*3+1],r.current[i*3+2])
      d.scale.set(data.sz[i*3],data.sz[i*3+1],data.sz[i*3+2])
      d.updateMatrix();meshRef.current.setMatrixAt(i,d.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate=true
  })
  return(
    <instancedMesh ref={meshRef} args={[null,null,N]}>
      <boxGeometry args={[1,1,1]}/>
      <meshStandardMaterial color="#D0C8B8" roughness={1} transparent opacity={0.45}/>
    </instancedMesh>
  )
}

// ─── CAMERA ───────────────────────────────────────────────────────────────
function CamRig({zoomT,mouseRef}){
  const{camera}=useThree()
  const sY=useRef(CAM_START),sX=useRef(0),sZ=useRef(0)
  const sLX=useRef(0),sLZ=useRef(0)
  useFrame(()=>{
    const ez=ease(zoomT)
    sY.current=lerp(sY.current,lerp(CAM_START,CAM_END,ez),0.055)
    const str=lerp(0.6,0.03,ez)
    sX.current=lerp(sX.current,mouseRef.current.x*str,0.04)
    sZ.current=lerp(sZ.current,mouseRef.current.y*str*0.4,0.04)
    sLX.current=lerp(sLX.current,lerp(0,1.68*0.3,ez),0.04)
    sLZ.current=lerp(sLZ.current,lerp(0,-0.1*0.2,ez),0.04)
    camera.position.set(sX.current,sY.current,sZ.current)
    camera.up.set(0,0,1)
    camera.lookAt(sLX.current,0,sLZ.current)
  })
  return null
}

// ─── LIGHTS ───────────────────────────────────────────────────────────────
function Lights(){
  return(
    <>
      <ambientLight color="#FFF5EC" intensity={0.7}/>
      {/* Main key — warm, from upper right */}
      <directionalLight color="#FFF8EE" intensity={3.2} position={[5,12,3]}
        castShadow shadow-mapSize={[2048,2048]}
        shadow-camera-left={-8} shadow-camera-right={8}
        shadow-camera-top={8}  shadow-camera-bottom={-8}
        shadow-camera-near={0.5} shadow-camera-far={30}
        shadow-bias={-0.001}/>
      {/* Cool fill from left */}
      <directionalLight color="#D8E8FF" intensity={0.65} position={[-6,7,-4]}/>
      {/* Subtle bounce from below */}
      <directionalLight color="#FFF0D8" intensity={0.18} position={[0,-4,0]}/>
    </>
  )
}

// ─── SCENE ────────────────────────────────────────────────────────────────
function Scene({zoomT,mouseRef}){
  return(
    <>
      <color attach="background" args={[DESK_COL]}/>
      {/* Environment provides reflections for metallic phone body */}
      <Environment preset="apartment"/>
      <Lights/>
      <CamRig zoomT={zoomT} mouseRef={mouseRef}/>
      <Desk/><Notebook/><Phone zoomT={zoomT}/>
      <DeskItems/><Particles/>
      <ContactShadows position={[0,0.001,0]} opacity={0.28} scale={18} blur={2.5} far={3} color="#B0A090"/>
      <EffectComposer>
        <Bloom mipmapBlur intensity={0.28} luminanceThreshold={0.82} luminanceSmoothing={0.5}/>
        <Vignette eskil={false} offset={0.2} darkness={0.38}/>
      </EffectComposer>
    </>
  )
}

// ─── LOADER ───────────────────────────────────────────────────────────────
function Loader({onDone}){
  const[n,setN]=useState(0)
  useEffect(()=>{
    const s=Date.now(),id=setInterval(()=>{const p=Math.min((Date.now()-s)/2200*100,100);setN(Math.round(p));if(p>=100){clearInterval(id);onDone()}},30)
    return()=>clearInterval(id)
  },[]) // eslint-disable-line
  return(
    <div style={{position:'fixed',inset:0,zIndex:300,background:DESK_COL,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:20}}>
      <div style={{fontFamily:'Syne,sans-serif',fontSize:30,fontWeight:800,color:'#111'}}>og<span style={{color:'#059669'}}>senior</span></div>
      <div style={{width:180,height:2,background:'#E5E7EB',borderRadius:2}}>
        <div style={{width:`${n}%`,height:'100%',background:'linear-gradient(90deg,#059669,#f59e0b)',borderRadius:2,transition:'width 0.04s'}}/>
      </div>
      <p style={{fontFamily:'DM Sans,sans-serif',fontSize:13,color:'#9CA3AF'}}>{n}%</p>
    </div>
  )
}

// ─── NAV ──────────────────────────────────────────────────────────────────
function Nav({cd}){
  const[sc,setSc]=useState(false)
  useEffect(()=>{const fn=()=>setSc(window.scrollY>20);window.addEventListener('scroll',fn,{passive:true});return()=>window.removeEventListener('scroll',fn)},[])
  return(
    <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 48px',background:sc?'rgba(244,239,230,0.95)':'transparent',backdropFilter:sc?'blur(12px)':'none',borderBottom:sc?'1px solid rgba(0,0,0,0.06)':'none',transition:'all 0.3s'}}>
      <span style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:800,color:'#111'}}>og<span style={{color:'#059669'}}>senior</span></span>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <span style={{display:'inline-block',width:7,height:7,borderRadius:'50%',background:'#059669',animation:'ogpulse 2s ease-in-out infinite'}}/>
        <span style={{fontFamily:'DM Sans,sans-serif',fontSize:13,color:'#6B7280'}}>Launching June 20 · {cd.d}d {String(cd.h).padStart(2,'0')}h away</span>
      </div>
    </nav>
  )
}

// ─── ZOOM OVERLAY TEXT ────────────────────────────────────────────────────
function ZoomText({zoomT}){
  const a=OVERLAY_TEXTS.find(t=>zoomT>=t.from&&zoomT<t.to)
  if(!a)return null
  const op=clamp((zoomT-a.from)/0.1,0,1)*clamp((a.to-zoomT)/0.08,0,1)
  return(
    <div style={{position:'absolute',bottom:'13%',left:0,right:0,textAlign:'center',zIndex:10,pointerEvents:'none',opacity:op}}>
      <div style={{display:'inline-block',background:'rgba(244,239,230,0.82)',backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',border:'1px solid rgba(0,0,0,0.05)',borderRadius:16,padding:'14px 30px'}}>
        <p style={{fontFamily:'Syne,sans-serif',fontSize:'clamp(14px,2vw,21px)',fontWeight:700,color:'#111',lineHeight:1.5,whiteSpace:'pre-line'}}>{a.text}</p>
      </div>
    </div>
  )
}

// ─── ZOOM CTA ─────────────────────────────────────────────────────────────
function ZoomCTA({zoomT}){
  const op=clamp((zoomT-0.92)/0.08,0,1)
  if(op===0)return null
  return(
    <>
      <div style={{position:'absolute',bottom:0,left:0,right:0,height:'65%',background:'linear-gradient(to top,rgba(244,239,230,0.97) 40%,rgba(244,239,230,0.7) 75%,transparent)',zIndex:12,pointerEvents:'none',opacity:op}}/>
      <div style={{position:'absolute',bottom:'5%',left:0,right:0,display:'flex',flexDirection:'column',alignItems:'center',gap:16,zIndex:15,opacity:op,transform:`translateY(${lerp(22,0,op)}px)`,pointerEvents:op>0.5?'auto':'none'}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(5,150,105,0.1)',border:'1px solid rgba(5,150,105,0.3)',borderRadius:100,padding:'5px 16px'}}>
          <span style={{width:6,height:6,borderRadius:'50%',background:'#059669',display:'inline-block',animation:'ogpulse 2s ease-in-out infinite'}}/>
          <span style={{fontFamily:'DM Sans,sans-serif',fontSize:13,color:'#059669',fontWeight:500}}>Peer mentorship for Indian students</span>
        </div>
        <h1 style={{fontFamily:'Syne,sans-serif',fontSize:'clamp(42px,7vw,82px)',fontWeight:800,color:'#0A0A0A',letterSpacing:'-0.04em',lineHeight:1.0,textAlign:'center',margin:0}}>
          Ask before<br/>
          <span style={{background:'linear-gradient(120deg,#059669 0%,#D97706 60%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>you choose.</span>
        </h1>
        <p style={{fontFamily:'DM Sans,sans-serif',fontSize:'clamp(14px,1.8vw,18px)',color:'#4B5563',textAlign:'center',maxWidth:420,lineHeight:1.65,margin:0}}>
          Real advice from verified peers and professionals —<br/>before your college, branch, or career decision.
        </p>
        <div style={{display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center'}}>
          {[
            {label:"I'm a Student",    color:'#059669',href:`${FRONTEND}/?role=student`, shadow:'rgba(5,150,105,0.35)'},
            {label:"Become an Insider",color:'#D97706',href:`${FRONTEND}/?role=insider`,shadow:'rgba(217,119,6,0.35)'},
            {label:"Become a Mentor",  color:'#7C3AED',href:`${FRONTEND}/?role=mentor`, shadow:'rgba(124,58,237,0.35)'},
          ].map(b=>(
            <a key={b.label} href={b.href} target="_blank" rel="noopener noreferrer"
              style={{fontFamily:'Syne,sans-serif',fontSize:14.5,fontWeight:700,color:'#fff',background:b.color,borderRadius:14,padding:'13px 26px',textDecoration:'none',letterSpacing:'0.01em',transition:'all 0.2s',boxShadow:`0 4px 18px ${b.shadow}`}}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 8px 28px ${b.shadow}`}}
              onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=`0 4px 18px ${b.shadow}`}}>
              {b.label} →
            </a>
          ))}
        </div>
        <div style={{animation:'ogbounce 2s ease-in-out infinite',display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
          <span style={{fontFamily:'DM Sans,sans-serif',fontSize:11,color:'#9CA3AF',letterSpacing:'0.1em',textTransform:'uppercase'}}>scroll to explore</span>
          <span style={{fontSize:16,color:'#9CA3AF'}}>↓</span>
        </div>
      </div>
    </>
  )
}

function ScrollHint({zoomT}){
  const op=clamp(1-zoomT/0.1,0,1);if(op===0)return null
  return(
    <div style={{position:'absolute',bottom:'5.5%',left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',alignItems:'center',gap:8,pointerEvents:'none',zIndex:10,opacity:op}}>
      <span style={{fontFamily:'DM Sans,sans-serif',fontSize:11,color:'#9CA3AF',letterSpacing:'0.12em',textTransform:'uppercase'}}>scroll to zoom in</span>
      <div style={{width:22,height:36,border:'1.5px solid #C8C0B8',borderRadius:11,display:'flex',justifyContent:'center',paddingTop:5}}>
        <div style={{width:3,height:6,background:'#B0A898',borderRadius:2,animation:'ogscroll 1.8s ease-in-out infinite'}}/>
      </div>
    </div>
  )
}

// ─── HERO ─────────────────────────────────────────────────────────────────
function Hero({zoomT,setZoomT,mouseRef}){
  const ref=useRef()
  useEffect(()=>{
    const el=ref.current;if(!el)return
    const onW=(e)=>{if(Z.released)return;e.preventDefault();Z.target=clamp(Z.target+e.deltaY*0.0015,0,1);if(Z.target>=1)Z.released=true}
    let ty=0
    const onTS=(e)=>{ty=e.touches[0].clientY}
    const onTM=(e)=>{if(Z.released)return;e.preventDefault();Z.target=clamp(Z.target+(ty-e.touches[0].clientY)*0.0028,0,1);ty=e.touches[0].clientY;if(Z.target>=1)Z.released=true}
    el.addEventListener('wheel',onW,{passive:false})
    el.addEventListener('touchstart',onTS,{passive:true})
    el.addEventListener('touchmove',onTM,{passive:false})
    let raf;const tick=()=>{Z.t=lerp(Z.t,Z.target,0.065);setZoomT(Z.t);raf=requestAnimationFrame(tick)}
    raf=requestAnimationFrame(tick)
    return()=>{cancelAnimationFrame(raf);el.removeEventListener('wheel',onW);el.removeEventListener('touchstart',onTS);el.removeEventListener('touchmove',onTM)}
  },[setZoomT])
  return(
    <div ref={ref} style={{position:'relative',width:'100vw',height:'100vh',overflow:'hidden',flexShrink:0}}>
      <Canvas shadows gl={{antialias:true,powerPreference:'high-performance'}} dpr={[1,1.5]}
        camera={{fov:52,position:[0,CAM_START,0],near:0.1,far:80,up:[0,0,1]}}
        style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
        <Suspense fallback={null}><Scene zoomT={zoomT} mouseRef={mouseRef}/></Suspense>
      </Canvas>
      <ZoomText zoomT={zoomT}/><ZoomCTA zoomT={zoomT}/><ScrollHint zoomT={zoomT}/>
    </div>
  )
}

// ─── 2D SECTIONS ──────────────────────────────────────────────────────────
const F={
  display:{fontFamily:'Syne,sans-serif',fontWeight:800,letterSpacing:'-0.025em',lineHeight:1.12,color:'#111'},
  body:{fontFamily:'DM Sans,sans-serif',fontSize:15.5,color:'#6B7280',lineHeight:1.72},
  eyebrow:{fontFamily:'DM Sans,sans-serif',fontSize:12,fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:12},
  wrap:{maxWidth:1060,margin:'0 auto',padding:'0 24px'},
}

function ProblemSection(){
  const cards=[
    {icon:'⚠️',title:'Advice with conflicts of interest',accent:'#EF4444',body:"Traditional counsellors are paid by colleges to send students there. Their incentive was never your future — it was their commission."},
    {icon:'🔇',title:'Silence from the people who matter',accent:'#F59E0B',body:"You messaged seniors on LinkedIn, WhatsApp, Reddit. Most never replied. Nobody had skin in the game."},
    {icon:'📅',title:'Outdated, biased, wrong',accent:'#7C3AED',body:"Google results from 2019. YouTube videos from coaching institutes with an agenda. Nobody telling you what's actually true right now."},
  ]
  return(
    <section style={{background:'#FAF8F4',padding:'100px 24px'}}>
      <div style={F.wrap}>
        <div style={{textAlign:'center',marginBottom:52}}>
          <p style={{...F.eyebrow,color:'#EF4444'}}>The real problem</p>
          <h2 style={{...F.display,fontSize:'clamp(28px,4.5vw,46px)'}}>The system was never<br/>built for you.</h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(290px,1fr))',gap:20}}>
          {cards.map((c,i)=>(
            <div key={i} style={{background:'#fff',border:'1px solid #F3F4F6',borderLeft:`4px solid ${c.accent}`,borderRadius:16,padding:'28px 24px',boxShadow:'0 2px 12px rgba(0,0,0,0.04)'}}>
              <div style={{fontSize:28,marginBottom:12}}>{c.icon}</div>
              <h3 style={{fontFamily:'Syne,sans-serif',fontSize:17,fontWeight:700,color:'#111',marginBottom:10,lineHeight:1.35}}>{c.title}</h3>
              <p style={{...F.body,fontSize:14.5}}>{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection(){
  const steps=[
    {n:'01',color:'#059669',label:'Choose who you need',sub:'Insider for college life,\nMentor for career decisions.'},
    {n:'02',color:'#D97706',label:'Book a session',sub:'Starting at ₹99.\nInstant confirmation.'},
    {n:'03',color:'#7C3AED',label:'Get real answers',sub:'No curation. No delay.\nHonest advice.'},
  ]
  return(
    <section style={{background:'#fff',padding:'100px 24px'}}>
      <div style={F.wrap}>
        <div style={{textAlign:'center',marginBottom:52}}>
          <p style={{...F.eyebrow,color:'#7C3AED'}}>How it works</p>
          <h2 style={{...F.display,fontSize:'clamp(26px,4vw,44px)',marginBottom:14}}>Three steps.<br/>One honest conversation.</h2>
          <p style={{...F.body,maxWidth:460,margin:'0 auto'}}>We connect students with Insiders and Mentors who get paid for genuine advice. When real money is on the line, real answers follow.</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',border:'1px solid #F3F4F6',borderRadius:20,overflow:'hidden',marginBottom:60}}>
          {steps.map((st,i)=>(
            <div key={i} style={{padding:'32px 28px',borderRight:i<2?'1px solid #F3F4F6':'none',background:'#fff'}}>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:12,fontWeight:800,color:st.color,letterSpacing:'0.06em',marginBottom:10}}>{st.n}</div>
              <div style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:700,color:'#111',marginBottom:8}}>{st.label}</div>
              <div style={{fontFamily:'DM Sans,sans-serif',fontSize:14,color:'#9CA3AF',lineHeight:1.6,whiteSpace:'pre-line'}}>{st.sub}</div>
            </div>
          ))}
        </div>
        <div style={{textAlign:'center',marginBottom:24}}>
          <p style={{...F.eyebrow,color:'#059669'}}>Watch the story</p>
          <h3 style={{...F.display,fontSize:'clamp(20px,3vw,30px)',marginBottom:24}}>Why we built OgSenior</h3>
        </div>
        <div style={{position:'relative',maxWidth:720,margin:'0 auto',borderRadius:20,overflow:'hidden',aspectRatio:'16/9',boxShadow:'0 20px 60px rgba(0,0,0,0.1)',border:'1px solid #F3F4F6'}}>
          <iframe width="100%" height="100%" src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1" title="Why we built OgSenior" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{position:'absolute',inset:0,width:'100%',height:'100%'}}/>
        </div>
      </div>
    </section>
  )
}

function RoleCard({r}){
  const[hov,setHov]=useState(false)
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={()=>window.open(r.href,'_blank')}
      style={{background:hov?`rgba(${r.rgb},0.04)`:'#fff',border:`1px solid ${hov?r.color:'#F3F4F6'}`,borderRadius:18,padding:'28px 24px',transition:'all 0.3s ease',transform:hov?'translateY(-4px)':'none',boxShadow:hov?`0 12px 32px rgba(${r.rgb},0.12)`:'0 2px 8px rgba(0,0,0,0.04)',display:'flex',flexDirection:'column',cursor:'pointer'}}>
      <span style={{display:'inline-block',alignSelf:'flex-start',background:`rgba(${r.rgb},0.12)`,color:r.color,fontFamily:'Syne,sans-serif',fontSize:10.5,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',padding:'3px 10px',borderRadius:100,marginBottom:16}}>{r.label}</span>
      <h3 style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:800,color:'#111',marginBottom:10,lineHeight:1.28,flexGrow:1,whiteSpace:'pre-line'}}>{r.headline}</h3>
      <p style={{...F.body,fontSize:14,marginBottom:20}}>{r.body}</p>
      <div style={{borderTop:'1px solid #F3F4F6',paddingTop:16,marginBottom:18}}>
        {r.stats.map((st,i)=>(<div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}><div style={{width:5,height:5,borderRadius:'50%',background:r.color,flexShrink:0}}/><span style={{fontFamily:'DM Sans,sans-serif',fontSize:13,color:'#9CA3AF'}}>{st}</span></div>))}
      </div>
      <a href={r.href} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()} style={{display:'block',textAlign:'center',textDecoration:'none',color:hov?'#fff':r.color,background:hov?r.color:'transparent',border:`1.5px solid ${r.color}`,borderRadius:10,padding:'11px',fontFamily:'Syne,sans-serif',fontSize:13.5,fontWeight:700,transition:'all 0.2s'}}>{r.cta} →</a>
    </div>
  )
}

function RolesSection(){
  const roles=[
    {key:'student',label:'Student',color:'#059669',rgb:'5,150,105',headline:'Real advice\nbefore you choose.',body:"Before you pick a college, a branch, a career — talk to someone who's already living it. Verified. Accountable. Real.",stats:['Sessions from ₹99','Verified Insiders & Mentors','Same-day response'],cta:'Join as a Student',href:`${FRONTEND}/?role=student`},
    {key:'insider',label:'Insider',color:'#D97706',rgb:'217,119,6',headline:'Your experience\nis worth money.',body:"You've navigated what thousands of students are figuring out. Your knowledge of college life, placements — it has real value.",stats:['₹80–120 per session','1–2 hrs/week minimum','Paid weekly to UPI'],cta:'Become an Insider',href:`${FRONTEND}/?role=insider`},
    {key:'mentor',label:'Mentor',color:'#7C3AED',rgb:'124,58,237',headline:'Your industry\nknowledge matters.',body:"Tell students what you wish someone had told you. Earn consistently on the side without competing with what you're building.",stats:['₹150–300 per session','Set your own schedule','Strictly vetted students'],cta:'Become a Mentor',href:`${FRONTEND}/?role=mentor`},
  ]
  return(
    <section style={{background:'#FAF8F4',padding:'100px 24px'}}>
      <div style={F.wrap}>
        <div style={{textAlign:'center',marginBottom:52}}>
          <p style={{...F.eyebrow,color:'#D97706'}}>Where do you belong?</p>
          <h2 style={{...F.display,fontSize:'clamp(26px,4vw,44px)'}}>Three kinds of people.<br/>One network.</h2>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:20}}>
          {roles.map(r=><RoleCard key={r.key} r={r}/>)}
        </div>
      </div>
    </section>
  )
}

function WaitlistSection({cd}){
  const[form,setForm]=useState({email:'',role:'student',done:false,busy:false})
  const[foc,setFoc]=useState(false)
  const submit=()=>{if(!form.email.includes('@'))return;setForm(f=>({...f,busy:true}));setTimeout(()=>setForm(f=>({...f,busy:false,done:true})),900)}
  const ticks=[{v:cd.d,l:'Days',c:'#059669'},{v:cd.h,l:'Hours',c:'#D97706'},{v:cd.m,l:'Mins',c:'#7C3AED'},{v:cd.s,l:'Secs',c:'rgba(255,255,255,0.3)'}]
  return(
    <section style={{background:'#111',padding:'100px 24px'}}>
      <div style={{maxWidth:500,margin:'0 auto',textAlign:'center'}}>
        <p style={{...F.eyebrow,color:'rgba(255,255,255,0.3)'}}>Going live in</p>
        <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:44,alignItems:'flex-start'}}>
          {ticks.map((tk,i)=>(<div key={i} style={{display:'flex',alignItems:'flex-start',gap:8}}>{i>0&&<div style={{fontFamily:'Syne,sans-serif',fontSize:'clamp(20px,4vw,42px)',fontWeight:300,color:'rgba(255,255,255,0.12)',lineHeight:1.05}}>:</div>}<div style={{textAlign:'center',minWidth:50}}><div style={{fontFamily:'Syne,sans-serif',fontSize:'clamp(24px,4.5vw,50px)',fontWeight:800,color:tk.c,lineHeight:1,letterSpacing:'-0.02em'}}>{String(tk.v).padStart(2,'0')}</div><div style={{fontFamily:'DM Sans,sans-serif',fontSize:10,color:'rgba(255,255,255,0.28)',textTransform:'uppercase',letterSpacing:'0.1em',marginTop:4}}>{tk.l}</div></div></div>))}
        </div>
        <h2 style={{...F.display,fontSize:'clamp(24px,4vw,38px)',color:'#fff',marginBottom:8}}>Be the first in.</h2>
        <p style={{...F.body,color:'rgba(255,255,255,0.4)',marginBottom:28}}>Early users get priority access on launch day.</p>
        {form.done?(
          <div style={{background:'rgba(5,150,105,0.12)',border:'1px solid #059669',borderRadius:14,padding:'22px'}}>
            <div style={{fontSize:26,marginBottom:6}}>✓</div>
            <p style={{fontFamily:'Syne,sans-serif',fontSize:16,fontWeight:700,color:'#059669',marginBottom:4}}>You're on the list.</p>
            <p style={{fontFamily:'DM Sans,sans-serif',fontSize:13,color:'rgba(255,255,255,0.38)'}}>See you June 20, 2026.</p>
          </div>
        ):(
          <div style={{display:'flex',flexDirection:'column',gap:9,maxWidth:360,margin:'0 auto'}}>
            <input type="email" placeholder="your@email.com" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&submit()} onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)} style={{background:'rgba(255,255,255,0.06)',border:`1.5px solid ${foc?'#059669':'rgba(255,255,255,0.1)'}`,borderRadius:10,padding:'12px 16px',fontFamily:'DM Sans,sans-serif',fontSize:15,color:'#fff',width:'100%',transition:'border-color 0.2s'}}/>
            <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} style={{background:'rgba(255,255,255,0.06)',border:'1.5px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'12px 16px',fontFamily:'DM Sans,sans-serif',fontSize:15,color:'rgba(255,255,255,0.5)',width:'100%',cursor:'pointer'}}>
              <option value="student">I'm a Student</option>
              <option value="insider">I'm an Insider (current student)</option>
              <option value="mentor">I'm a Mentor (professional)</option>
            </select>
            <button onClick={submit} disabled={form.busy} style={{background:'linear-gradient(135deg,#059669,#D97706)',border:'none',borderRadius:10,padding:'13px',fontFamily:'Syne,sans-serif',fontSize:14,fontWeight:700,color:'#fff',cursor:form.busy?'wait':'pointer',opacity:form.busy?0.7:1,transition:'opacity 0.2s',letterSpacing:'0.02em',boxShadow:'0 4px 20px rgba(5,150,105,0.3)'}}>
              {form.busy?'Saving your spot...':'Notify Me on Launch →'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

function Footer(){
  return(
    <footer style={{background:'#0A0A0A',padding:'26px 48px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
      <span style={{fontFamily:'Syne,sans-serif',fontSize:18,fontWeight:800,color:'#fff'}}>og<span style={{color:'#059669'}}>senior</span></span>
      <span style={{fontFamily:'DM Sans,sans-serif',fontSize:13,color:'rgba(255,255,255,0.3)'}}>"Ask before you choose." · June 20, 2026</span>
      <span style={{fontFamily:'DM Sans,sans-serif',fontSize:12,color:'rgba(255,255,255,0.18)'}}>Built in India 🇮🇳</span>
    </footer>
  )
}

function GlobalStyles(){
  useEffect(()=>{
    if(document.getElementById('og-gs'))return
    const s=document.createElement('style');s.id='og-gs'
    s.textContent=`@keyframes ogpulse{0%,100%{opacity:.3}50%{opacity:1}}@keyframes ogscroll{0%,100%{transform:translateY(0);opacity:.3}50%{transform:translateY(6px);opacity:1}}@keyframes ogbounce{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}`
    document.head.appendChild(s);return()=>{const e=document.getElementById('og-gs');if(e)e.remove()}
  },[]);return null
}

export default function App(){
  const[zoomT,setZoomT]=useState(0)
  const[loaded,setLoaded]=useState(false)
  const mouseRef=useRef({x:0,y:0})
  const countdown=useCountdown()
  useEffect(()=>{
    const fn=e=>{mouseRef.current.x=(e.clientX/window.innerWidth-0.5)*2;mouseRef.current.y=-(e.clientY/window.innerHeight-0.5)*2}
    window.addEventListener('mousemove',fn);return()=>window.removeEventListener('mousemove',fn)
  },[])
  return(
    <>
      <GlobalStyles/>
      {!loaded&&<Loader onDone={()=>setLoaded(true)}/>}
      <Nav cd={countdown}/>
      <Hero zoomT={zoomT} setZoomT={setZoomT} mouseRef={mouseRef}/>
      <ProblemSection/><HowItWorksSection/><RolesSection/><WaitlistSection cd={countdown}/><Footer/>
    </>
  )
}
