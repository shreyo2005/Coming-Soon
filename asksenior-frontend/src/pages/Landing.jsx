import React, { useState, useEffect } from 'react'

import { useCountdown } from '../utils/useCountdown'

import { Loader } from '../components/ui/Loader'
import { Nav } from '../components/ui/Nav'
import { Footer } from '../components/ui/Footer'
import { Hero } from '../components/hero/Hero'
import { ProblemSection, HowItWorksSection, RolesSection, WaitlistSection } from '../components/sections/Sections'

function GlobalStyles() {
  useEffect(() => {
    if (document.getElementById('og-gs')) return
    const s = document.createElement('style'); s.id = 'og-gs'
    s.textContent = `
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
      html{scroll-behavior:smooth}
      body{background:#F5F0E8;overflow-x:hidden}
      @keyframes ogpulse{0%,100%{opacity:.3}50%{opacity:1}}
      @keyframes ogscroll{0%,100%{transform:translateY(0);opacity:.3}50%{transform:translateY(6px);opacity:1}}
      @keyframes ogbounce{0%,100%{transform:translateY(0)}50%{transform:translateY(5px)}}
    `
    document.head.appendChild(s)
    return () => { const e = document.getElementById('og-gs'); if (e) e.remove() }
  }, []); return null
}

export default function Landing({ go, skipHero = false }) {
  const [scrollT, setScrollT] = useState(skipHero ? 1 : 0)
  const [loaded, setLoaded] = useState(false)
  const countdown = useCountdown()

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    const html = document.documentElement;
    const prevScrollBehavior = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    document.body.style.overflow = 'auto';

    const t = setTimeout(() => {
      if (prevScrollBehavior) {
        html.style.scrollBehavior = prevScrollBehavior;
      } else {
        html.style.removeProperty('scroll-behavior');
      }
    }, 50);

    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <GlobalStyles />
      {!loaded && <Loader onDone={() => setLoaded(true)} />}
      <Nav cd={countdown} scrollT={scrollT} />
      <div id="og-hero">
        <Hero scrollT={scrollT} setScrollT={setScrollT} go={go} skipHero={skipHero} />
      </div>
      <ProblemSection />
      <HowItWorksSection />
      <RolesSection go={go} />
      <WaitlistSection cd={countdown} go={go} />
      <Footer go={go} />
    </>
  )
}