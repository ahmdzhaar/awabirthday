'use client'
import { useEffect, useRef } from 'react'

export default function CursorEffect() {
  const cursorRef = useRef(null)
  const trailRef = useRef(null)
  const posRef = useRef({ x: -100, y: -100 })

  useEffect(() => {
    const cursor = cursorRef.current
    const trail = trailRef.current
    if (!cursor || !trail) return
    let last = 0
    let rafId = null

    const updateCursor = () => {
      const { x, y } = posRef.current
      cursor.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`
      rafId = requestAnimationFrame(updateCursor)
    }

    const move = (e) => {
      posRef.current = { x: e.clientX, y: e.clientY }

      const now = Date.now()
      if (now - last > 80) {
        last = now
        const sp = document.createElement('div')
        sp.style.cssText = `
          position:fixed;
          left:${e.clientX}px;
          top:${e.clientY}px;
          width:${4 + Math.random() * 4}px;
          height:${4 + Math.random() * 4}px;
          border-radius:50%;
          pointer-events:none;
          background:${Math.random() > .5 ? '#ff69b4' : '#ffb6c1'};
          transform:translate(-50%,-50%);
          animation:sparkleTrail ${.3 + Math.random() * .3}s ease forwards;
          z-index:99998;
        `
        trail.appendChild(sp)
        setTimeout(() => sp.remove(), 650)
      }
    }

    rafId = requestAnimationFrame(updateCursor)
    window.addEventListener('pointermove', move, { passive: true })

    return () => {
      window.removeEventListener('pointermove', move)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <>
      <div
        ref={cursorRef}
        id="custom-cursor"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '22px',
          height: '22px',
          pointerEvents: 'none',
          zIndex: 99999,
          willChange: 'transform',
        }}
      >
        <svg viewBox="0 0 100 90" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 6px #ff1493)' }}>
          <path d="M50,82C50,82 5,52 5,28C5,13 16,4 28,4C37,4 45,9 50,17C55,9 63,4 72,4C84,4 95,13 95,28C95,52 50,82 50,82Z" fill="#ff69b4"/>
        </svg>
      </div>
      <div ref={trailRef} id="cursor-trail-container" />
    </>
  )
}
