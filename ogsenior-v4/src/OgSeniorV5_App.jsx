import { useRef, useState, useEffect, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { RoundedBox, ContactShadows } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'

// ─── Config ───────────────────────────────────────────────────────────────
const FRONTEND   = 'https://asksenior-frontend.vercel.app'
const LAUNCH     = new Date('2026-06-20T00:00:00+05:30').getTime()
const CAM_START  = 13
const CAM_END    = 1.7
const DESK_COLOR = '#F5F0E8'

const OVERLAY_TEXTS = [
  { from:0.00, to:0.20, text:"Every student's story\nstarts here."              },
  { from:0.20, to:0.40, text:"The most important decision\nof your life."        },
  { from:0.40, to:0.60, text:"Made with the\nwrong information."                 },
  { from:0.60, to:0.80, text:"You reached out.\nNobody answered."                },
  { from:0.80, to:0.93, text:"Until now."                                        },
]

const Z = { t:0, target:0, released:false }
const lerp   = (a,b,t) => a+(b-a)*t
const clamp  = (v,lo,hi) => Math.max(lo,Math.min(hi,v))
const ease   = t => t<0.5 ? 2*t*t : -1+(4-2*t)*t
const easeO  = t => 1-Math.pow(1-t,3)

function useCountdown(){
  const [t,setT]=useState({d:19,h:0,m:0,s:0})
  useEffect(()=>{
    const tick=()=>{const d=Math.max(0,LAUNCH-Date.now());setT({d:Math.floor(d/86400000),h:Math.floor((d%86400000)/3600000),m:Math.floor((d%3600000)/60000),s:Math.floor((d%60000)/1000)})}
    tick();const id=setInterval(tick,1000);return()=>clearInterval(id)
  },[]);return t
}

// ─── Notebook page texture ────────────────────────────────────────────────
function useNotebookTexture(){
  return useMemo(()=>{
    const W=1024,H=1024
    const cv=document.createElement('canvas');cv.width=W;cv.height=H
    const ctx=cv.getContext('2d')

    // Page background
    ctx.fillStyle='#FFFEF8';ctx.fillRect(0,0,W,H)

    // Red margin
    ctx.strokeStyle='#F4A0A0';ctx.lineWidth=3
    ctx.beginPath();ctx.moveTo(140,0);ctx.lineTo(140,H);ctx.stroke()

    // Ruled lines
    for(let y=80;y<H;y+=48){
      ctx.strokeStyle=y===80?'#F0C0C0':'#C5D8F5';ctx.lineWidth=1.5
      ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()
    }

    // Handwriting — "What after 12th??"
    ctx.save()
    ctx.translate(W/2,H*0.38)
    ctx.rotate(-0.018)
    ctx.font='bold 110px Georgia,serif'
    ctx.fillStyle='#1A0D00'
    ctx.textAlign='center'
    ctx.fillText('What after',0,0)
    ctx.restore()

    ctx.save()
    ctx.translate(W/2,H*0.52)
    ctx.rotate(0.014)
    ctx.font='bold 110px Georgia,serif'
    ctx.fillStyle='#1A0D00'
    ctx.textAlign='center'
    ctx.fillText('12th??',0,0)
    ctx.restore()

    // Underline scribble
    ctx.strokeStyle='#5A4030';ctx.lineWidth=3
    ctx.beginPath();ctx.moveTo(220,H*0.565);ctx.lineTo(800,H*0.565);ctx.stroke()

    // Stars & doodles
    const star=(cx,cy,r)=>{
      ctx.beginPath()
      for(let i=0;i<10;i++){const a=(i*Math.PI/5)-Math.PI/2,rd=i%2===0?r:r*0.4;i===0?ctx.moveTo(cx+Math.cos(a)*rd,cy+Math.sin(a)*rd):ctx.lineTo(cx+Math.cos(a)*rd,cy+Math.sin(a)*rd)}
      ctx.closePath();ctx.fillStyle='#C8902A';ctx.fill()
    }
    star(840,140,28);star(180,820,22)

    ctx.font='36px Georgia,serif';ctx.fillStyle='#A09080';ctx.textAlign='center'
    ctx.fillText('??',220,720);ctx.fillText('...',780,760)

    const tex=new THREE.CanvasTexture(cv)
    // FIX: rotate UVs 90° to compensate for camera looking straight down
    tex.rotation = -Math.PI/2
    tex.center.set(0.5,0.5)
    tex.needsUpdate=true
    return tex
  },[])
}

// ─── Phone screen texture ─────────────────────────────────────────────────
function usePhoneTextures(){
  const chatTex=useMemo(()=>{
    const W=600,H=1060
    const cv=document.createElement('canvas');cv.width=W;cv.height=H
    const ctx=cv.getContext('2d')

    // Background
    ctx.fillStyle='#1B2035';ctx.fillRect(0,0,W,H)

    // Status bar
    ctx.fillStyle='#252840';ctx.fillRect(0,0,W,52)
    ctx.fillStyle='rgba(255,255,255,0.6)';ctx.font='bold 20px -apple-system,sans-serif'
    ctx.textAlign='left';ctx.fillText('9:41',22,36)
    ctx.textAlign='right';ctx.fillText('▮▮▮',578,36)

    // Header
    ctx.fillStyle='#1F2440';ctx.fillRect(0,52,W,68)
    ctx.beginPath();ctx.arc(66,86,24,0,Math.PI*2)
    ctx.fillStyle='#3A4060';ctx.fill()
    ctx.fillStyle='rgba(255,255,255,0.5)';ctx.font='bold 20px -apple-system,sans-serif'
    ctx.textAlign='center';ctx.fillText('R',66,93)
    ctx.fillStyle='rgba(255,255,255,0.85)';ctx.font='bold 22px -apple-system,sans-serif'
    ctx.textAlign='left';ctx.fillText('Rahul bhaiya',102,80)
    ctx.fillStyle='#9CA3AF';ctx.font='18px -apple-system,sans-serif'
    ctx.fillText('Last seen 2 days ago',102,104)

    // Helper rounded rect
    const rr=(x,y,w,h,r,fill)=>{ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();ctx.fillStyle=fill;ctx.fill()}

    // Received messages
    const msgs=[
      {y:155,txt:'Hey, kaisa chal raha hai?',w:360},
      {y:218,txt:'Entrance ka kya hua?',w:298},
      {y:285,txt:'Busy hoon, baad mein baat karte hai',w:448},
    ]
    msgs.forEach(m=>{
      rr(20,m.y,m.w,46,14,'#2C3258')
      ctx.fillStyle='rgba(255,255,255,0.82)';ctx.font='20px -apple-system,sans-serif'
      ctx.textAlign='left';ctx.fillText(m.txt,38,m.y+30)
    })

    // Date divider
    ctx.fillStyle='rgba(255,255,255,0.2)';ctx.font='16px -apple-system,sans-serif'
    ctx.textAlign='center';ctx.fillText('Yesterday 11:47 PM',W/2,380)

    // Sent message (blue bubble)
    rr(120,406,460,78,16,'#2460E8')
    ctx.fillStyle='#fff';ctx.font='bold 20px -apple-system,sans-serif'
    ctx.textAlign='left';ctx.fillText('Which branch lena chahiye?',138,436)
    ctx.font='20px -apple-system,sans-serif'
    ctx.fillText('Please reply bhaiya 🙏',138,462)

    // Read receipt
    ctx.fillStyle='#8B95C4';ctx.font='17px -apple-system,sans-serif'
    ctx.textAlign='right';ctx.fillText('✓✓  Seen',578,500)

    // Today divider
    ctx.fillStyle='rgba(255,255,255,0.18)';ctx.font='16px -apple-system,sans-serif'
    ctx.textAlign='center';ctx.fillText('Today',W/2,560)

    // No reply indicator
    rr(W/2-120,580,240,38,19,'#252840')
    ctx.fillStyle='rgba(255,255,255,0.3)';ctx.font='17px -apple-system,sans-serif'
    ctx.textAlign='center';ctx.fillText('No reply... 😔',W/2,605)

    const tex=new THREE.CanvasTexture(cv)
    tex.rotation=-Math.PI/2;tex.center.set(0.5,0.5)
    tex.needsUpdate=true;return tex
  },[])

  const revealTex=useMemo(()=>{
    const W=600,H=1060
    const cv=document.createElement('canvas');cv.width=W;cv.height=H
    const ctx=cv.getContext('2d')

    // Light background
    const grad=ctx.createLinearGradient(0,0,0,H)
    grad.addColorStop(0,'#FAFAF7');grad.addColorStop(1,'#F0EDE5')
    ctx.fillStyle=grad;ctx.fillRect(0,0,W,H)

    // Logo
    ctx.font='bold 72px Georgia,serif'
    ctx.textAlign='center'
    ctx.fillStyle='#059669';ctx.fillText('og',232,320)
    ctx.fillStyle='#111111';ctx.fillText('senior',380,320)

    // Tagline
    ctx.font='bold 40px Georgia,serif'
    ctx.fillStyle='#111111';ctx.textAlign='center'
    ctx.fillText('Ask before',W/2,406)
    ctx.fillText('you choose.',W/2,456)

    // Divider
    ctx.strokeStyle='#E0DDD5';ctx.lineWidth=1.5
    ctx.beginPath();ctx.moveTo(80,490);ctx.lineTo(520,490);ctx.stroke()

    // Subtitle
    ctx.font='22px -apple-system,sans-serif'
    ctx.fillStyle='#6B7280';ctx.textAlign='center'
    ctx.fillText('Real advice from people',W/2,534)
    ctx.fillText("who've been there.",W/2,562)

    // Green checkmark badge
    ctx.beginPath();ctx.arc(W/2,650,44,0,Math.PI*2)
    ctx.fillStyle='#059669';ctx.fill()
    ctx.fillStyle='#fff';ctx.font='bold 38px -apple-system,sans-serif'
    ctx.textAlign='center';ctx.fillText('✓',W/2,665)

    // Launching text
    ctx.fillStyle='#059669';ctx.font='bold 22px -apple-system,sans-serif'
    ctx.textAlign='center';ctx.fillText("You're early.",W/2,730)
    ctx.fillStyle='#9CA3AF';ctx.font='18px -apple-system,sans-serif'
    ctx.fillText('Launching June 20, 2026',W/2,758)

    const tex=new THREE.CanvasTexture(cv)
    tex.rotation=-Math.PI/2;tex.center.set(0.5,0.5)
    tex.needsUpdate=true;return tex
  },[])

  return {chatTex,revealTex}
}

// ─── 3D: DESK ─────────────────────────────────────────────────────────────
function Desk(){
  return(
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.02,0]} receiveShadow>
      <planeGeometry args={[40,40]}/>
      <meshStandardMaterial color={DESK_COLOR} roughness={0.92}/>
    </mesh>
  )
}

// ─── 3D: NOTEBOOK ─────────────────────────────────────────────────────────
function Notebook(){
  const tex=useNotebookTexture()

  const spirals=useMemo(()=>{const a=[];for(let i=0;i<13;i++)a.push(-1.42+i*0.228);return a},[])

  return(
    <group position={[-1.6,0,0.1]} rotation={[0,0.04,0]}>
      {/* Back cover */}
      <mesh position={[0,-0.038,0]} receiveShadow castShadow>
        <boxGeometry args={[3.0,0.022,4.0]}/>
        <meshStandardMaterial color="#CBBFA8" roughness={0.9}/>
      </mesh>

      {/* Page stack edge — visible from side */}
      <mesh position={[0.05,0,0]} receiveShadow>
        <boxGeometry args={[2.88,0.068,3.96]}/>
        <meshStandardMaterial color="#F8F5EE" roughness={0.95}/>
      </mesh>

      {/* Top page — USE PLANE GEOMETRY for correct UV */}
      <mesh position={[0,0.036,0]} rotation={[-Math.PI/2,0,0]} receiveShadow castShadow>
        <planeGeometry args={[2.95,3.96]}/>
        <meshStandardMaterial map={tex} roughness={0.88} side={THREE.FrontSide}/>
      </mesh>

      {/* Spiral binding */}
      {spirals.map((z,i)=>(
        <group key={i} position={[-1.56,0.03,z]}>
          <mesh rotation={[Math.PI/2,0,0]}>
            <torusGeometry args={[0.07,0.025,8,18]}/>
            <meshStandardMaterial color="#8A7A6A" roughness={0.4} metalness={0.5}/>
          </mesh>
        </group>
      ))}

      {/* Pen */}
      <group position={[1.18,0.06,1.65]} rotation={[0,-0.25,0]}>
        <mesh><cylinderGeometry args={[0.026,0.026,2.0,10]}/><meshStandardMaterial color="#2563EB" roughness={0.4}/></mesh>
        <mesh position={[0,-1.04,0]}><coneGeometry args={[0.026,0.14,10]}/><meshStandardMaterial color="#111" roughness={0.5}/></mesh>
        <mesh position={[0.032,0.62,0]}><boxGeometry args={[0.01,0.85,0.02]}/><meshStandardMaterial color="#1D4ED8" roughness={0.4} metalness={0.3}/></mesh>
      </group>
    </group>
  )
}

// ─── 3D: PHONE ────────────────────────────────────────────────────────────
function Phone({zoomT}){
  const {chatTex,revealTex}=usePhoneTextures()
  const screenRef=useRef()
  const glowRef=useRef()
  const revP=clamp((zoomT-0.78)/0.22,0,1)
  const erv=easeO(revP)

  useFrame(()=>{
    if(screenRef.current){
      screenRef.current.map = erv>0.5 ? revealTex : chatTex
      screenRef.current.emissiveIntensity = lerp(0.12, 0.55, erv)
      screenRef.current.needsUpdate=true
    }
    if(glowRef.current) glowRef.current.material.opacity=erv*0.28
  })

  return(
    <group position={[1.65,0,-0.12]} rotation={[0,-0.05,0]}>
      {/* Body */}
      <RoundedBox args={[1.82,0.076,3.38]} radius={0.085} smoothness={6} castShadow receiveShadow>
        <meshStandardMaterial color="#17171A" roughness={0.22} metalness={0.55}/>
      </RoundedBox>

      {/* Screen bezel */}
      <mesh position={[0,0.04,0]} rotation={[-Math.PI/2,0,0]}>
        <planeGeometry args={[1.68,3.22]}/>
        <meshStandardMaterial color="#0A0A10" roughness={0.08}/>
      </mesh>

      {/* Screen display — PlaneGeometry for correct UV */}
      <mesh position={[0,0.046,0]} rotation={[-Math.PI/2,0,0]}>
        <planeGeometry args={[1.60,3.08]}/>
        <meshStandardMaterial
          ref={screenRef}
          map={chatTex}
          emissive="#223377"
          emissiveIntensity={0.12}
          roughness={0.04}
        />
      </mesh>

      {/* Screen glow */}
      <mesh ref={glowRef} position={[0,0.052,0]} rotation={[-Math.PI/2,0,0]}>
        <planeGeometry args={[1.65,3.14]}/>
        <meshBasicMaterial color="#C8F5D8" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false}/>
      </mesh>

      {/* Side buttons */}
      <mesh position={[0.935,0.01,0.38]}><boxGeometry args={[0.018,0.028,0.30]}/><meshStandardMaterial color="#232328" roughness={0.4} metalness={0.6}/></mesh>
      <mesh position={[-0.935,0.01,-0.22]}><boxGeometry args={[0.018,0.028,0.44]}/><meshStandardMaterial color="#232328" roughness={0.4} metalness={0.6}/></mesh>

      {/* Camera island */}
      <mesh position={[-0.44,0.044,-1.32]}><boxGeometry args={[0.44,0.008,0.40]}/><meshStandardMaterial color="#222225" roughness={0.3} metalness={0.6}/></mesh>

      {/* Screen glow light */}
      <pointLight position={[0,0.4,0]} color="#A7F3D0" intensity={erv*2.5} distance={4}/>
    </group>
  )
}

// ─── 3D: FLOATING PARTICLES ───────────────────────────────────────────────
function Particles(){
  const meshRef=useRef()
  const N=24
  const data=useMemo(()=>{
    const pos=[],rot=[],spd=[],sz=[]
    for(let i=0;i<N;i++){
      pos.push((Math.random()-0.5)*10,Math.random()*2+0.05,(Math.random()-0.5)*8)
      rot.push(Math.random()*Math.PI,Math.random()*Math.PI,Math.random()*Math.PI)
      spd.push(0.002+Math.random()*0.003)
      sz.push(0.032+Math.random()*0.05,0.001,0.048+Math.random()*0.06)
    }
    return{pos,rot,spd,sz}
  },[])
  const p=useRef([...data.pos]),r=useRef([...data.rot])
  const dum=useMemo(()=>new THREE.Object3D(),[])
  useFrame(()=>{
    if(!meshRef.current)return
    for(let i=0;i<N;i++){
      p.current[i*3+1]+=data.spd[i]
      if(p.current[i*3+1]>3.2)p.current[i*3+1]=0.05
      r.current[i*3]+=0.005;r.current[i*3+1]+=0.003
      dum.position.set(p.current[i*3],p.current[i*3+1],p.current[i*3+2])
      dum.rotation.set(r.current[i*3],r.current[i*3+1],r.current[i*3+2])
      dum.scale.set(data.sz[i*3],data.sz[i*3+1],data.sz[i*3+2])
      dum.updateMatrix();meshRef.current.setMatrixAt(i,dum.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate=true
  })
  return(
    <instancedMesh ref={meshRef} args={[null,null,N]}>
      <boxGeometry args={[1,1,1]}/>
      <meshStandardMaterial color="#D8D0C0" roughness={1} transparent opacity={0.5}/>
    </instancedMesh>
  )
}

// ─── 3D: DESK ITEMS ───────────────────────────────────────────────────────
function DeskItems(){
  return(
    <group>
      {/* Eraser */}
      <mesh position={[-3.0,0.03,1.0]} rotation={[0,0.25,0]} castShadow>
        <boxGeometry args={[0.52,0.055,0.22]}/><meshStandardMaterial color="#FAC8C8" roughness={0.9}/>
      </mesh>
      {/* Coin */}
      <mesh position={[3.0,0.01,1.3]} rotation={[-Math.PI/2,0,0.15]}>
        <cylinderGeometry args={[0.13,0.13,0.014,20]}/><meshStandardMaterial color="#C8A438" roughness={0.35} metalness={0.75}/>
      </mesh>
      {/* Crumpled paper */}
      <mesh position={[-3.2,0.07,-0.8]} castShadow>
        <icosahedronGeometry args={[0.21,1]}/><meshStandardMaterial color="#E8E4D8" roughness={1}/>
      </mesh>
      {/* Subtly-colored brochure */}
      <group position={[2.4,0.01,1.7]} rotation={[0,-0.35,0]}>
        <mesh castShadow><boxGeometry args={[1.25,0.016,0.9]}/><meshStandardMaterial color="#E8EBF4" roughness={0.85}/></mesh>
        <mesh position={[0,0.014,0]}><boxGeometry args={[1.19,0.002,0.86]}/><meshStandardMaterial color="#D8DCF0" roughness={0.9}/></mesh>
      </group>
    </group>
  )
}

// ─── 3D: CAMERA ───────────────────────────────────────────────────────────
function CamRig({zoomT,mouseRef}){
  const {camera}=useThree()
  const sY=useRef(CAM_START),sX=useRef(0),sZ=useRef(0)
  const sLX=useRef(0),sLZ=useRef(0)

  useFrame(()=>{
    const ez=ease(zoomT)
    const tY=lerp(CAM_START,CAM_END,ez)
    const str=lerp(0.65,0.03,ez)
    sY.current=lerp(sY.current,tY,0.055)
    sX.current=lerp(sX.current,mouseRef.current.x*str,0.04)
    sZ.current=lerp(sZ.current,mouseRef.current.y*str*0.45,0.04)

    // Drift lookAt toward phone as we zoom
    const lx=lerp(0,1.65*0.35,ez)
    const lz=lerp(0,-0.12*0.2,ez)
    sLX.current=lerp(sLX.current,lx,0.04)
    sLZ.current=lerp(sLZ.current,lz,0.04)

    camera.position.set(sX.current,sY.current,sZ.current)

    // CRITICAL: set up vector to avoid gimbal lock when looking straight down
    camera.up.set(0,0,1)
    camera.lookAt(sLX.current,0,sLZ.current)
  })
  return null
}

// ─── 3D: LIGHTS ───────────────────────────────────────────────────────────
function Lights(){
  return(
    <>
      <ambientLight color="#FFF8F0" intensity={1.0}/>
      <directionalLight color="#FFF5E0" intensity={2.8} position={[5,10,4]}
        castShadow shadow-mapSize={[2048,2048]}
        shadow-camera-left={-8} shadow-camera-right={8}
        shadow-camera-top={8}  shadow-camera-bottom={-8}
        shadow-camera-near={0.5} shadow-camera-far={30} shadow-bias={-0.001}/>
      <directionalLight color="#DDE8FF" intensity={0.55} position={[-6,6,-4]}/>
      <directionalLight color="#FFF0D0" intensity={0.15} position={[0,-3,0]}/>
    </>
  )
}

// ─── 3D: SCENE ────────────────────────────────────────────────────────────
function Scene({zoomT,mouseRef}){
  return(
    <>
      <color attach="background" args={[DESK_COLOR]}/>
      <Lights/>
      <CamRig zoomT={zoomT} mouseRef={mouseRef}/>
      <Desk/>
      <Notebook/>
      <Phone zoomT={zoomT}/>
      <DeskItems/>
      <Particles/>
      <ContactShadows position={[0,0.001,0]} opacity={0.2} scale={18} blur={2.8} far={3} color="#B0A090"/>
      <EffectComposer>
        <Bloom mipmapBlur intensity={0.2} luminanceThreshold={0.9} luminanceSmoothing={0.5}/>
        <Vignette eskil={false} offset={0.2} darkness={0.42}/>
      </EffectComposer>
    </>
  )
}

// ─── HTML: LOADER ─────────────────────────────────────────────────────────
function Loader({onDone}){
  const [n,setN]=useState(0)
  useEffect(()=>{
    const s=Date.now(),d=2200
    const id=setInterval(()=>{const p=Math.min((Date.now()-s)/d*100,100);setN(Math.round(p));if(p>=100){clearInterval(id);onDone()}},30)
    return()=>clearInterval(id)
  },[]) // eslint-disable-line
  return(
    <div style={{position:'fixed',inset:0,zIndex:300,background:DESK_COLOR,
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:20}}>
      <div style={{fontFamily:'Syne,sans-serif',fontSize:30,fontWeight:800,color:'#111'}}>
        og<span style={{color:'#059669'}}>senior</span>
      </div>
      <div style={{width:180,height:2,background:'#E5E7EB',borderRadius:2}}>
        <div style={{width:`${n}%`,height:'100%',background:'linear-gradient(90deg,#059669,#f59e0b)',borderRadius:2,transition:'width 0.04s'}}/>
      </div>
      <p style={{fontFamily:'DM Sans,sans-serif',fontSize:13,color:'#9CA3AF'}}>{n}%</p>
    </div>
  )
}

// ─── HTML: NAV ────────────────────────────────────────────────────────────
function Nav({cd}){
  const [sc,setSc]=useState(false)
  useEffect(()=>{const fn=()=>setSc(window.scrollY>20);window.addEventListener('scroll',fn,{passive:true});return()=>window.removeEventListener('scroll',fn)},[])
  return(
    <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,
      display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 48px',
      background:sc?'rgba(245,240,232,0.95)':'transparent',
      backdropFilter:sc?'blur(12px)':'none',
      borderBottom:sc?'1px solid rgba(0,0,0,0.06)':'none',transition:'all 0.3s'}}>
      <span style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:800,color:'#111'}}>
        og<span style={{color:'#059669'}}>senior</span>
      </span>
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <span style={{display:'inline-block',width:7,height:7,borderRadius:'50%',background:'#059669',animation:'ogpulse 2s ease-in-out infinite'}}/>
        <span style={{fontFamily:'DM Sans,sans-serif',fontSize:13,color:'#6B7280'}}>
          Launching June 20 · {cd.d}d {String(cd.h).padStart(2,'0')}h away
        </span>
      </div>
    </nav>
  )
}

// ─── HTML: OVERLAY TEXT ───────────────────────────────────────────────────
function ZoomText({zoomT}){
  const a=OVERLAY_TEXTS.find(t=>zoomT>=t.from&&zoomT<t.to)
  if(!a) return null
  const op=clamp((zoomT-a.from)/0.1,0,1)*clamp((a.to-zoomT)/0.08,0,1)
  return(
    <div style={{position:'absolute',bottom:'12%',left:0,right:0,textAlign:'center',
      zIndex:10,pointerEvents:'none',opacity:op}}>
      <div style={{display:'inline-block',background:'rgba(245,240,232,0.80)',
        backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',
        border:'1px solid rgba(0,0,0,0.05)',borderRadius:16,padding:'14px 30px'}}>
        <p style={{fontFamily:'Syne,sans-serif',fontSize:'clamp(14px,2vw,21px)',
          fontWeight:700,color:'#111',lineHeight:1.5,whiteSpace:'pre-line'}}>{a.text}</p>
      </div>
    </div>
  )
}

// ─── HTML: CTA ────────────────────────────────────────────────────────────
function ZoomCTA({zoomT}){
  const op=clamp((zoomT-0.92)/0.08,0,1)
  if(op===0) return null
  return(
    <div style={{position:'absolute',bottom:'6%',left:0,right:0,
      display:'flex',flexDirection:'column',alignItems:'center',gap:14,
      zIndex:15,opacity:op,transform:`translateY(${lerp(18,0,op)}px)`,
      pointerEvents:op>0.5?'auto':'none'}}>
      <h1 style={{fontFamily:'Syne,sans-serif',fontSize:'clamp(26px,4.5vw,50px)',
        fontWeight:800,color:'#111',letterSpacing:'-0.03em',lineHeight:1.05,
        textAlign:'center',textShadow:'0 2px 20px rgba(245,240,232,0.95)'}}>
        Ask before you choose.
      </h1>
      <p style={{fontFamily:'DM Sans,sans-serif',fontSize:'clamp(13px,1.6vw,16px)',
        color:'#6B7280',textAlign:'center',maxWidth:400,lineHeight:1.7,
        background:'rgba(245,240,232,0.75)',backdropFilter:'blur(8px)',
        padding:'8px 18px',borderRadius:10}}>
        Real advice from people who've been there —<br/>
        before you choose your college, branch, or career.
      </p>
      <div style={{display:'flex',gap:10,flexWrap:'wrap',justifyContent:'center'}}>
        {[
          {label:"I'm a Student",    color:'#059669',rgb:'5,150,105',  href:`${FRONTEND}/?role=student`},
          {label:"Become an Insider",color:'#D97706',rgb:'217,119,6',  href:`${FRONTEND}/?role=insider`},
          {label:"Become a Mentor",  color:'#7C3AED',rgb:'124,58,237', href:`${FRONTEND}/?role=mentor`},
        ].map(b=>(
          <a key={b.label} href={b.href} target="_blank" rel="noopener noreferrer"
            style={{fontFamily:'Syne,sans-serif',fontSize:13.5,fontWeight:700,
              color:b.color,border:`2px solid ${b.color}`,borderRadius:12,
              padding:'10px 20px',textDecoration:'none',
              background:`rgba(${b.rgb},0.08)`,backdropFilter:'blur(8px)',transition:'all 0.2s'}}
            onMouseEnter={e=>{e.currentTarget.style.background=b.color;e.currentTarget.style.color='#fff'}}
            onMouseLeave={e=>{e.currentTarget.style.background=`rgba(${b.rgb},0.08)`;e.currentTarget.style.color=b.color}}>
            {b.label}
          </a>
        ))}
      </div>
      <div style={{animation:'ogbounce 2s ease-in-out infinite',display:'flex',
        flexDirection:'column',alignItems:'center',gap:2,marginTop:4}}>
        <span style={{fontFamily:'DM Sans,sans-serif',fontSize:10.5,color:'#9CA3AF',
          letterSpacing:'0.1em',textTransform:'uppercase'}}>scroll to explore</span>
        <span style={{fontSize:14,color:'#9CA3AF'}}>↓</span>
      </div>
    </div>
  )
}

// ─── HTML: SCROLL HINT ────────────────────────────────────────────────────
function ScrollHint({zoomT}){
  const op=clamp(1-zoomT/0.1,0,1)
  if(op===0) return null
  return(
    <div style={{position:'absolute',bottom:'5.5%',left:'50%',transform:'translateX(-50%)',
      display:'flex',flexDirection:'column',alignItems:'center',gap:8,
      pointerEvents:'none',zIndex:10,opacity:op}}>
      <span style={{fontFamily:'DM Sans,sans-serif',fontSize:11,color:'#9CA3AF',letterSpacing:'0.12em',textTransform:'uppercase'}}>scroll to zoom in</span>
      <div style={{width:22,height:36,border:'1.5px solid #C8C0B8',borderRadius:11,display:'flex',justifyContent:'center',paddingTop:5}}>
        <div style={{width:3,height:6,background:'#B0A898',borderRadius:2,animation:'ogscroll 1.8s ease-in-out infinite'}}/>
      </div>
    </div>
  )
}

// ─── HTML: HERO ───────────────────────────────────────────────────────────
function Hero({zoomT,setZoomT,mouseRef}){
  const ref=useRef()
  useEffect(()=>{
    const el=ref.current;if(!el)return
    const onW=(e)=>{
      if(Z.released)return;e.preventDefault()
      Z.target=clamp(Z.target+e.deltaY*0.0015,0,1)
      if(Z.target>=1)Z.released=true
    }
    let ty=0
    const onTS=(e)=>{ty=e.touches[0].clientY}
    const onTM=(e)=>{
      if(Z.released)return;e.preventDefault()
      Z.target=clamp(Z.target+(ty-e.touches[0].clientY)*0.0028,0,1)
      ty=e.touches[0].clientY;if(Z.target>=1)Z.released=true
    }
    el.addEventListener('wheel',onW,{passive:false})
    el.addEventListener('touchstart',onTS,{passive:true})
    el.addEventListener('touchmove',onTM,{passive:false})
    let raf;const tick=()=>{Z.t=lerp(Z.t,Z.target,0.065);setZoomT(Z.t);raf=requestAnimationFrame(tick)}
    raf=requestAnimationFrame(tick)
    return()=>{cancelAnimationFrame(raf);el.removeEventListener('wheel',onW);el.removeEventListener('touchstart',onTS);el.removeEventListener('touchmove',onTM)}
  },[setZoomT])

  return(
    <div ref={ref} style={{position:'relative',width:'100vw',height:'100vh',overflow:'hidden',flexShrink:0}}>
      <Canvas shadows
        gl={{antialias:true,powerPreference:'high-performance'}}
        dpr={[1,1.5]}
        camera={{fov:52,position:[0,CAM_START,0],near:0.1,far:80,up:[0,0,1]}}
        style={{position:'absolute',inset:0,width:'100%',height:'100%'}}>
        <Suspense fallback={null}>
          <Scene zoomT={zoomT} mouseRef={mouseRef}/>
        </Suspense>
      </Canvas>
      <ZoomText   zoomT={zoomT}/>
      <ZoomCTA    zoomT={zoomT}/>
      <ScrollHint zoomT={zoomT}/>
    </div>
  )
}

// ─── HTML: 2D SECTIONS ────────────────────────────────────────────────────
const F={
  display:{fontFamily:'Syne,sans-serif',fontWeight:800,letterSpacing:'-0.025em',lineHeight:1.12,color:'#111'},
  body:{fontFamily:'DM Sans,sans-serif',fontSize:15.5,color:'#6B7280',lineHeight:1.72},
  eyebrow:{fontFamily:'DM Sans,sans-serif',fontSize:12,fontWeight:600,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:12},
  wrap:{maxWidth:1060,margin:'0 auto',padding:'0 24px'},
}

function ProblemSection(){
  const cards=[
    {icon:'⚠️',title:'Advice with conflicts of interest',accent:'#EF4444',
     body:"Traditional counsellors are paid by colleges to send students there. Their incentive was never your future — it was their commission."},
    {icon:'🔇',title:'Silence from the people who matter',accent:'#F59E0B',
     body:"You messaged seniors on LinkedIn, WhatsApp, Reddit. Most never replied. The ones who did gave vague answers. Nobody had skin in the game."},
    {icon:'📅',title:'Outdated, biased, wrong',accent:'#7C3AED',
     body:"Google results from 2019. YouTube videos from coaching institutes with an agenda. Nobody telling you what's actually true right now."},
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
            <div key={i} style={{background:'#fff',border:'1px solid #F3F4F6',
              borderLeft:`4px solid ${c.accent}`,borderRadius:16,padding:'28px 24px',
              boxShadow:'0 2px 12px rgba(0,0,0,0.04)'}}>
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
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',
          border:'1px solid #F3F4F6',borderRadius:20,overflow:'hidden',marginBottom:60}}>
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
        <div style={{position:'relative',maxWidth:720,margin:'0 auto',borderRadius:20,overflow:'hidden',
          aspectRatio:'16/9',boxShadow:'0 20px 60px rgba(0,0,0,0.1)',border:'1px solid #F3F4F6'}}>
          <iframe width="100%" height="100%"
            src="https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1"
            title="Why we built OgSenior" frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen style={{position:'absolute',inset:0,width:'100%',height:'100%'}}/>
        </div>
      </div>
    </section>
  )
}

function RoleCard({r}){
  const[hov,setHov]=useState(false)
  return(
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      onClick={()=>window.open(r.href,'_blank')}
      style={{background:hov?`rgba(${r.rgb},0.04)`:'#fff',
        border:`1px solid ${hov?r.color:'#F3F4F6'}`,borderRadius:18,padding:'28px 24px',
        transition:'all 0.3s ease',transform:hov?'translateY(-4px)':'none',
        boxShadow:hov?`0 12px 32px rgba(${r.rgb},0.12)`:'0 2px 8px rgba(0,0,0,0.04)',
        display:'flex',flexDirection:'column',cursor:'pointer'}}>
      <span style={{display:'inline-block',alignSelf:'flex-start',
        background:`rgba(${r.rgb},0.12)`,color:r.color,
        fontFamily:'Syne,sans-serif',fontSize:10.5,fontWeight:700,
        letterSpacing:'0.12em',textTransform:'uppercase',
        padding:'3px 10px',borderRadius:100,marginBottom:16}}>{r.label}</span>
      <h3 style={{fontFamily:'Syne,sans-serif',fontSize:20,fontWeight:800,color:'#111',
        marginBottom:10,lineHeight:1.28,flexGrow:1,whiteSpace:'pre-line'}}>{r.headline}</h3>
      <p style={{...F.body,fontSize:14,marginBottom:20}}>{r.body}</p>
      <div style={{borderTop:'1px solid #F3F4F6',paddingTop:16,marginBottom:18}}>
        {r.stats.map((st,i)=>(
          <div key={i} style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
            <div style={{width:5,height:5,borderRadius:'50%',background:r.color,flexShrink:0}}/>
            <span style={{fontFamily:'DM Sans,sans-serif',fontSize:13,color:'#9CA3AF'}}>{st}</span>
          </div>
        ))}
      </div>
      <a href={r.href} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}
        style={{display:'block',textAlign:'center',textDecoration:'none',
          color:hov?'#fff':r.color,background:hov?r.color:'transparent',
          border:`1.5px solid ${r.color}`,borderRadius:10,padding:'11px',
          fontFamily:'Syne,sans-serif',fontSize:13.5,fontWeight:700,transition:'all 0.2s'}}>
        {r.cta} →
      </a>
    </div>
  )
}

function RolesSection(){
  const roles=[
    {key:'student',label:'Student',color:'#059669',rgb:'5,150,105',
     headline:'Real advice\nbefore you choose.',
     body:"Before you pick a college, a branch, a career — talk to someone who's already living it. Verified. Accountable. Real.",
     stats:['Sessions from ₹99','Verified Insiders & Mentors','Same-day response'],
     cta:'Join as a Student',href:`${FRONTEND}/?role=student`},
    {key:'insider',label:'Insider',color:'#D97706',rgb:'217,119,6',
     headline:'Your experience\nis worth money.',
     body:"You've navigated what thousands of students are figuring out. Your knowledge of placements, college life — it has real value.",
     stats:['₹80–120 per session','1–2 hrs/week minimum','Paid weekly to UPI'],
     cta:'Become an Insider',href:`${FRONTEND}/?role=insider`},
    {key:'mentor',label:'Mentor',color:'#7C3AED',rgb:'124,58,237',
     headline:'Your industry\nknowledge matters.',
     body:"Tell students what you wish someone had told you. Earn consistently on the side without competing with what you're building.",
     stats:['₹150–300 per session','Set your own schedule','Strictly vetted students'],
     cta:'Become a Mentor',href:`${FRONTEND}/?role=mentor`},
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
  const submit=()=>{
    if(!form.email.includes('@'))return
    setForm(f=>({...f,busy:true}))
    // TODO: fetch('/api/waitlist',{method:'POST',body:JSON.stringify({email:form.email,role:form.role})})
    setTimeout(()=>setForm(f=>({...f,busy:false,done:true})),900)
  }
  const ticks=[{v:cd.d,l:'Days',c:'#059669'},{v:cd.h,l:'Hours',c:'#D97706'},{v:cd.m,l:'Mins',c:'#7C3AED'},{v:cd.s,l:'Secs',c:'rgba(255,255,255,0.3)'}]
  return(
    <section style={{background:'#111',padding:'100px 24px'}}>
      <div style={{maxWidth:500,margin:'0 auto',textAlign:'center'}}>
        <p style={{...F.eyebrow,color:'rgba(255,255,255,0.3)'}}>Going live in</p>
        <div style={{display:'flex',gap:8,justifyContent:'center',marginBottom:44,alignItems:'flex-start'}}>
          {ticks.map((tk,i)=>(
            <div key={i} style={{display:'flex',alignItems:'flex-start',gap:8}}>
              {i>0&&<div style={{fontFamily:'Syne,sans-serif',fontSize:'clamp(20px,4vw,42px)',fontWeight:300,color:'rgba(255,255,255,0.12)',lineHeight:1.05}}>:</div>}
              <div style={{textAlign:'center',minWidth:50}}>
                <div style={{fontFamily:'Syne,sans-serif',fontSize:'clamp(24px,4.5vw,50px)',fontWeight:800,color:tk.c,lineHeight:1,letterSpacing:'-0.02em'}}>{String(tk.v).padStart(2,'0')}</div>
                <div style={{fontFamily:'DM Sans,sans-serif',fontSize:10,color:'rgba(255,255,255,0.28)',textTransform:'uppercase',letterSpacing:'0.1em',marginTop:4}}>{tk.l}</div>
              </div>
            </div>
          ))}
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
            <input type="email" placeholder="your@email.com" value={form.email}
              onChange={e=>setForm(f=>({...f,email:e.target.value}))}
              onKeyDown={e=>e.key==='Enter'&&submit()}
              onFocus={()=>setFoc(true)} onBlur={()=>setFoc(false)}
              style={{background:'rgba(255,255,255,0.06)',border:`1.5px solid ${foc?'#059669':'rgba(255,255,255,0.1)'}`,borderRadius:10,padding:'12px 16px',fontFamily:'DM Sans,sans-serif',fontSize:15,color:'#fff',width:'100%',transition:'border-color 0.2s'}}/>
            <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}
              style={{background:'rgba(255,255,255,0.06)',border:'1.5px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'12px 16px',fontFamily:'DM Sans,sans-serif',fontSize:15,color:'rgba(255,255,255,0.5)',width:'100%',cursor:'pointer'}}>
              <option value="student">I'm a Student</option>
              <option value="insider">I'm an Insider (current student)</option>
              <option value="mentor">I'm a Mentor (professional)</option>
            </select>
            <button onClick={submit} disabled={form.busy}
              style={{background:'linear-gradient(135deg,#059669,#D97706)',border:'none',borderRadius:10,padding:'13px',fontFamily:'Syne,sans-serif',fontSize:14,fontWeight:700,color:'#fff',cursor:form.busy?'wait':'pointer',opacity:form.busy?0.7:1,transition:'opacity 0.2s',letterSpacing:'0.02em',boxShadow:'0 4px 20px rgba(5,150,105,0.3)'}}>
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
      <span style={{fontFamily:'DM Sans,sans-serif',fontSize:13,color:'rgba(255,255,255,0.3)'}}>
        "Ask before you choose." · June 20, 2026
      </span>
      <span style={{fontFamily:'DM Sans,sans-serif',fontSize:12,color:'rgba(255,255,255,0.18)'}}>Built in India 🇮🇳</span>
    </footer>
  )
}

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────
function GlobalStyles(){
  useEffect(()=>{
    if(document.getElementById('og-gs'))return
    const s=document.createElement('style');s.id='og-gs'
    s.textContent=`@keyframes ogpulse{0%,100%{opacity:.3}50%{opacity:1}}@keyframes ogscroll{0%,100%{transform:translateY(0);opacity:.3}50%{transform:translateY(6px);opacity:1}}@keyframes ogbounce{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}`
    document.head.appendChild(s)
    return()=>{const e=document.getElementById('og-gs');if(e)e.remove()}
  },[]);return null
}

// ─── APP ──────────────────────────────────────────────────────────────────
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
      <ProblemSection/>
      <HowItWorksSection/>
      <RolesSection/>
      <WaitlistSection cd={countdown}/>
      <Footer/>
    </>
  )
}
