'use client'
import { useEffect, useRef } from 'react'

export default function SpaceBg() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const cv = canvasRef.current
    const ctx = cv.getContext('2d')
    let raf

    const resize = () => { cv.width = window.innerWidth; cv.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    const stars = Array(260).fill(0).map(() => ({
      x: Math.random() * cv.width,
      y: Math.random() * cv.height,
      r: Math.random() * 2 + 0.3,
      base: Math.random() * 0.7 + 0.15,
      speed: 0.4 + Math.random() * 1.2,
      phase: Math.random() * Math.PI * 2,
      color: Math.random() > 0.85 ? `hsl(${280 + Math.random() * 60},80%,85%)` : '#fff',
    }))
    const shoots = []
    let t = 0

    const draw = () => {
      ctx.clearRect(0, 0, cv.width, cv.height)
      t += 0.016
      ;[
        { x: cv.width * 0.15, y: cv.height * 0.2, r: cv.width * 0.22, c: 'rgba(120,0,200,.06)' },
        { x: cv.width * 0.8,  y: cv.height * 0.6, r: cv.width * 0.18, c: 'rgba(200,0,100,.05)' },
        { x: cv.width * 0.5,  y: cv.height * 0.85,r: cv.width * 0.15, c: 'rgba(0,80,200,.04)'  },
      ].forEach(n => {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r)
        g.addColorStop(0, n.c); g.addColorStop(1, 'transparent')
        ctx.fillStyle = g; ctx.fillRect(0, 0, cv.width, cv.height)
      })

      stars.forEach(s => {
        const tw = s.base + Math.sin(t * s.speed + s.phase) * 0.35
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = s.color; ctx.globalAlpha = Math.max(0.05, tw); ctx.fill()
      })
      ctx.globalAlpha = 1

      if (Math.random() < 0.005) {
        shoots.push({ x: Math.random() * cv.width, y: Math.random() * cv.height * 0.4, vx: 4 + Math.random() * 6, vy: 2 + Math.random() * 4, life: 1 })
      }
      for (let i = shoots.length - 1; i >= 0; i--) {
        const sh = shoots[i]; sh.x += sh.vx; sh.y += sh.vy; sh.life -= 0.025
        if (sh.life <= 0) { shoots.splice(i, 1); continue }
        const g = ctx.createLinearGradient(sh.x - sh.vx * 5, sh.y - sh.vy * 5, sh.x, sh.y)
        g.addColorStop(0, 'transparent'); g.addColorStop(1, `rgba(255,200,255,${sh.life * 0.8})`)
        ctx.beginPath(); ctx.moveTo(sh.x - sh.vx * 5, sh.y - sh.vy * 5); ctx.lineTo(sh.x, sh.y)
        ctx.strokeStyle = g; ctx.lineWidth = 1.5; ctx.stroke()
      }
      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <>
      <div id="space-bg" style={{ position: 'fixed', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse at 20% 30%,#1a003a 0%,#05000f 55%,#000008 100%)' }} />
      <canvas ref={canvasRef} id="space-canvas" style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }} />
    </>
  )
}