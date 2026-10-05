'use client'
import { useEffect, useRef, useState } from 'react'

export default function SplashScene({ onEnter }) {
  const containerRef = useRef(null)
  const cursorRef = useRef(null)
  const trailRef = useRef(null)
  const [stars, setStars] = useState([])
  const [visible, setVisible] = useState(false)
  const textRef = useRef(null)
  let lastTrail = useRef(0)
  const fullText = 'For Putri Nazwa'

  useEffect(() => {
    setStars(Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      dur: Math.random() * 2 + 1.5,
      delay: Math.random() * 2,
    })))

    const el = containerRef.current
    if (!el) return
    el.style.opacity = '0'
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 1.2s ease'
      el.style.opacity = '1'
    })
    setTimeout(() => setVisible(true), 400)

    const move = (e) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + 'px'
        cursorRef.current.style.top = e.clientY + 'px'
      }
      const now = Date.now()
      if (now - lastTrail.current > 45 && trailRef.current) {
        lastTrail.current = now
        const sp = document.createElement('div')
        sp.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;width:${4 + Math.random() * 5}px;height:${4 + Math.random() * 5}px;border-radius:50%;pointer-events:none;background:${Math.random() > .5 ? '#ff69b4' : '#ffb6c1'};transform:translate(-50%,-50%);animation:sparkleTrail ${.35 + Math.random() * .35}s ease forwards;z-index:99998;`
        trailRef.current.appendChild(sp)
        setTimeout(() => sp.remove(), 700)
      }
    }
    window.addEventListener('mousemove', move)
    return () => window.removeEventListener('mousemove', move)
  }, [])

  useEffect(() => {
    if (!visible || !textRef.current) return
    const el = textRef.current
    el.textContent = ''
    let index = 0
    const interval = setInterval(() => {
      if (index < fullText.length) {
        el.textContent = fullText.slice(0, index + 1)
        index++
      } else {
        clearInterval(interval)
      }
    }, 80)
    return () => clearInterval(interval)
  }, [visible])

  const handleClick = () => {
    const el = containerRef.current
    if (!el) return
    el.style.transition = 'opacity .7s ease, transform .7s ease'
    el.style.opacity = '0'
    el.style.transform = 'scale(1.06)'
    setTimeout(onEnter, 720)
  }

  return (
    <>
      <div ref={cursorRef} id="custom-cursor">
        <svg viewBox="0 0 100 90">
          <path d="M50,82C50,82 5,52 5,28C5,13 16,4 28,4C37,4 45,9 50,17C55,9 63,4 72,4C84,4 95,13 95,28C95,52 50,82 50,82Z" fill="#ff69b4"/>
        </svg>
      </div>
      <div ref={trailRef} id="cursor-trail-container" />

      <div
        ref={containerRef}
        onClick={handleClick}
        className="scene splash-bg"
        style={{ zIndex: 100, cursor: 'pointer', opacity: 0, overflow: 'hidden', transform: 'translateZ(0)' }}
      >

        {/* Floating particles */}
        {[
          { left: '15%', size: 5, delay: 0, duration: 8 },
          { left: '35%', size: 6, delay: 1.2, duration: 10 },
          { left: '55%', size: 4, delay: 0.5, duration: 9 },
          { left: '75%', size: 7, delay: 2.1, duration: 11 },
        ].map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: p.left,
              bottom: '-20px',
              width: p.size + 'px',
              height: p.size + 'px',
              borderRadius: '50%',
              background: i % 2 === 0 ? 'rgba(255,105,180,0.35)' : 'rgba(200,100,200,0.35)',
              pointerEvents: 'none',
              animation: `floatUp ${p.duration}s ease-in infinite`,
              animationDelay: p.delay + 's',
              willChange: 'transform, opacity',
              zIndex: 2,
            }}
          />
        ))}
        {stars.map(s => (
          <div key={s.id} className="star" style={{
            left: s.x + '%', top: s.y + '%',
            width: s.size + 'px', height: s.size + 'px',
            '--dur': s.dur + 's', '--delay': s.delay + 's'
          }} />
        ))}

        {/* Ambient glow blobs */}
        <div style={{
          position: 'absolute', width: '60vw', height: '60vw', maxWidth: 500, maxHeight: 500,
          borderRadius: '50%', top: '10%', left: '50%', transform: 'translateX(-50%)',
          background: 'radial-gradient(circle, rgba(255,20,147,.13) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 1,
          animation: 'ambientPulse 5s ease-in-out infinite',
        }} />

        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 'clamp(14px,3.5vw,28px)',
          position: 'relative', zIndex: 10, 
          padding: '0 clamp(20px, 6vw, 60px)',
        }}>

          {/* Judul utama */}
          <div style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.9s ease 0.25s',
            textAlign: 'center',
          }}>
            <h1 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(30px, 7.5vw, 72px)',
              lineHeight: 1.15,
              textAlign: 'center',
              color: '#ffffff',
              textShadow: '0 0 40px rgba(255,105,180,.9), 0 0 80px rgba(255,20,147,.5)',
              margin: 0,
              letterSpacing: '-0.01em',
            }}>
              I Hope You Like<br />
              <span style={{
                background: 'linear-gradient(90deg, #fff 0%, #ffb6d9 25%, #ff69b4 50%, #ffb6d9 75%, #fff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                backgroundSize: '200% 100%',
                animation: 'shimmer 3.5s ease-in-out infinite',
                willChange: 'background-position',
              }}>
                This Little Something
              </span>
            </h1>
          </div>

            {/* Subtitle */}
            <div style={{
              opacity: 0,
              animation: 'fadeSlideUp 0.9s ease 1.15s forwards',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              width: '100%',
            }}>
            <div style={{ width: 40, height: 1, background: 'linear-gradient(to right, transparent, rgba(255,182,217,.6))' }} />
           <p
            ref={textRef}
            style={{
              color: '#ffb6d9',
              textShadow: '0 0 12px rgba(255,105,180,.6)',
              fontFamily: "'Dancing Script', cursive",
              fontSize: 'clamp(14px, 3vw, 20px)',
              letterSpacing: '.1em',
              margin: 0,
              whiteSpace: 'nowrap',
            }}
          />
            <div style={{ width: 40, height: 1, background: 'linear-gradient(to left, transparent, rgba(255,182,217,.6))' }} />
          </div>

          {/* Tap indicator */}
          <div style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0) translateZ(0)' : 'translateY(14px) translateZ(0)',
            transition: 'all 0.9s ease 0.65s',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
            marginTop: 'clamp(4px, 1.5vw, 12px)',
          }}>
            
            {/* Teks tap */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <p style={{
                color: '#ffe0f0',
                textShadow: '0 0 16px #ff69b4, 0 0 32px rgba(255,20,147,.5)',
                animation: 'breathe 3s ease-in-out infinite',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 'clamp(9px, 1.8vw, 11px)',
                letterSpacing: '0.25em',
                textTransform: 'uppercase',
                margin: 0,
                willChange: 'opacity, transform',
              }}>
                Tap anywhere to begin
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-tap {
          0%, 100% { opacity: 1; letter-spacing: .35em; }
          50% { opacity: 0.5; letter-spacing: .45em; }
        }
        @keyframes ambientPulse {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: .7; }
          50% { transform: translateX(-50%) scale(1.12); opacity: 1; }
        }
        @keyframes arrowBounce {
          0%, 100% { transform: translateY(0); opacity: .6; }
          50% { transform: translateY(5px); opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: 200% center; }
          50% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes breathe {
          0%, 100% { opacity: 0.4; letter-spacing: 0.2em; }
          50% { opacity: 1; letter-spacing: 0.3em; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0px); opacity: 0.6; }
          50% { transform: translateY(6px); opacity: 1; }
        }
        @keyframes floatUp {
          0% {
            transform: translateY(0) translateX(0);
            opacity: 0.35;
          }
          10% {
            opacity: 0.45;
          }
          90% {
            opacity: 0.1;
          }
          100% {
            transform: translateY(-100vh) translateX(calc((Math.random() - 0.5) * 60px));
            opacity: 0;
          }
        }
        @keyframes sparkleTrail {
          to {
            opacity: 0;
            transform: translateY(-20px);
          }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
          }
      `}</style>
    </>
  )
}