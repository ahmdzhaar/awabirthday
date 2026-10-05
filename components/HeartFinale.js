'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Great_Vibes } from 'next/font/google'

const greatVibes = Great_Vibes({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
})

const BASE_PHOTOS = [
  '/photobook/02.webp',
  '/photobook/07.webp',
  '/photobook/09.webp',
  '/photobook/10.webp',
  '/photobook/13.webp',
  '/photobook/15.webp',
  '/photobook/17.webp',
  '/photobook/18.webp',
]

const PHOTOS = Array.from({ length: 24 }, (_, i) => BASE_PHOTOS[i % BASE_PHOTOS.length])
const FALLBACKS = ['♡', '✦', '♥', '✧']
const POLAROID_LABELS = [
  'happy birthday', 'with love', 'love you ♥', 'forever ♥',
  'my sunshine', 'my dear', 'smile ♥', 'stay sweet',
]

function heartPositions(n) {
  const positions = []
  const outerCount = 16
  for (let i = 0; i < outerCount; i++) {
    const t = (i / outerCount) * 2 * Math.PI
    const x = 16 * Math.sin(t) ** 3
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
    positions.push({
      x: x * 2.6 + 50,
      y: y * 2.45 + 50,
      rotate: Math.sin(i * 1.73) * 12 + Math.cos(i * 0.91) * 6,
    })
  }
  const innerCount = n - outerCount
  for (let i = 0; i < innerCount; i++) {
    const t = (i / innerCount) * 2 * Math.PI + 0.3
    const x = 16 * Math.sin(t) ** 3
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
    positions.push({
      x: x * 1.3 + 50,
      y: y * 1.2 + 50,
      rotate: Math.cos(i * 2.1) * 8 + Math.sin(i * 1.4) * 6,
    })
  }
  return positions
}

let lastPopTime = 0
function plasPop() {
  const now = Date.now()
  if (now - lastPopTime < 80) return
  lastPopTime = now
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    const t = ac.currentTime
    osc.connect(gain); gain.connect(ac.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(520 + Math.random() * 280, t)
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.1)
    gain.gain.setValueAtTime(0.06, t)
    gain.gain.linearRampToValueAtTime(0, t + 0.12)
    osc.start(t); osc.stop(t + 0.12)
    setTimeout(() => ac.close(), 200)
  } catch (e) {}
}

function launchConfetti(canvas) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const colors = ['#ffffff', '#ff66b2', '#ff007f', '#b30059', '#ffd1e8', '#ffda79', '#c084fc']
  let raf
  canvas.style.opacity = '1'
  canvas.width = Math.floor(window.innerWidth * dpr)
  canvas.height = Math.floor(window.innerHeight * dpr)
  canvas.style.width = `${window.innerWidth}px`
  canvas.style.height = `${window.innerHeight}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const count = window.innerWidth < 768 ? 60 : 120
  const parts = Array.from({ length: count }, () => ({
    x: window.innerWidth * 0.5 + (Math.random() - 0.5) * 100,
    y: window.innerHeight * 0.45 + (Math.random() - 0.5) * 60,
    vx: (Math.random() - 0.5) * 6,
    vy: -3 - Math.random() * 4,
    gravity: 0.055 + Math.random() * 0.045,
    size: 5 + Math.random() * 9,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * 360,
    rotV: (Math.random() - 0.5) * 9,
    life: 1,
    circle: Math.random() > 0.5,
  }))
  const draw = () => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
    parts.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vy += p.gravity
      p.rot += p.rotV; p.life -= 0.006
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180)
      ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color
      if (p.circle) { ctx.beginPath(); ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2); ctx.fill() }
      else ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
      ctx.restore()
    })
    if (parts.some(p => p.life > 0 && p.y < window.innerHeight + 40))
      raf = requestAnimationFrame(draw)
  }
  draw()
  setTimeout(() => { cancelAnimationFrame(raf); canvas.style.opacity = '0' }, 5000)
}

function useHeartSize() {
  const [sizes, setSizes] = useState({ container: 400, card: 64 })
  useEffect(() => {
    const calc = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const isLandscape = vw > vh
      const uiHeight = isLandscape ? 120 : 220
      const availH = vh - uiHeight
      const availW = vw - 32
      const maxSize = vw >= 768 ? 560 : availW
      const container = Math.floor(Math.min(availW, availH, maxSize))
      const card = Math.min(96, Math.max(48, Math.floor(container * 0.155)))
      setSizes({ container, card })
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])
  return sizes
}

const ORGANIC_ROTATIONS = [-7, 3, -2, 6, -5, 4, -8, 2, 5, -3, 7, -4, 1, -6, 3, -1,
                            6, -5, 2, -7, 4, -3, 8, -2]

function PhotoCard({ src, targetX, targetY, delay, rotate, fallback, cardSize, index, visible }) {
  const [imgErr, setImgErr] = useState(false)
  const [hovered, setHovered] = useState(false)
  const organicRotate = rotate + ORGANIC_ROTATIONS[index % ORGANIC_ROTATIONS.length]

  useEffect(() => {
    if (!visible) return
    const id = setTimeout(plasPop, 60)
    return () => clearTimeout(id)
  }, [visible])
  if (!visible) return null

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute',
        width: cardSize,
        height: cardSize,
        left: `calc(${targetX}% - ${cardSize / 2}px)`,
        top: `calc(${targetY}% - ${cardSize / 2}px)`,
        borderRadius: Math.round(cardSize * 0.10),
        overflow: 'hidden',
        border: '3px solid rgba(255,255,255,.97)',
        boxShadow: hovered
          ? `0 ${Math.round(cardSize*0.18)}px ${Math.round(cardSize*0.35)}px rgba(0,0,0,.75),
             0 0 22px rgba(255,0,127,.9),
             0 0 44px rgba(255,102,178,.5)`
          : `0 ${Math.round(cardSize*0.12)}px ${Math.round(cardSize*0.25)}px rgba(0,0,0,.65),
             0 2px 6px rgba(0,0,0,.5),
             0 0 12px rgba(255,0,127,.4)`,
        opacity: 0,
        animation: `popIn 0.45s cubic-bezier(0.175,0.885,0.32,1.275) forwards`,
        transform: hovered ? `scale(1.12) rotate(0deg)` : `scale(1) rotate(${organicRotate}deg)`,
        transition: 'box-shadow .3s ease, transform .3s cubic-bezier(0.34,1.2,0.64,1)',
        willChange: 'transform',
        '--card-rotate': `${organicRotate}deg`,
        zIndex: hovered ? 50 : 20,
        background: '#fdf6f0',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
      }}
    >
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {src && !imgErr ? (
          <img
            src={src}
            alt=""
            onError={() => setImgErr(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ff66b2',
            background: 'linear-gradient(135deg, rgba(255,102,178,.26), rgba(255,0,127,.12))',
            fontSize: Math.round(cardSize * 0.38),
          }}>{fallback}</div>
        )}
      </div>

      {/* AREA TEXT POLAROID YANG SUDAH DI-TUNING AKURASI DAN KETAHANANNYA */}
      <div style={{
        height: Math.round(cardSize * 0.26),
        background: '#fdf6f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, paddingBottom: 4,
      }}>
        <p className={greatVibes.className} style={{
          margin: 0, 
          color: '#111111',
          fontSize: Math.max(13, Math.round(cardSize * 0.23)), 
          lineHeight: '1.2', 
          userSelect: 'none', 
          pointerEvents: 'none',
          WebkitFontSmoothing: 'antialiased', 
          MozOsxFontSmoothing: 'grayscale',  
          textShadow: '0.2px 0 0px #111, -0.2px 0 0px #111', 
        }}>
          {POLAROID_LABELS[index % POLAROID_LABELS.length]}
        </p>
      </div>
    </div>
  )
}

export default function HeartFinale() {
  const [titleVisible, setTitleVisible] = useState(false)
  const [isBeating, setIsBeating] = useState(false)
  const [visibleCount, setVisibleCount] = useState(0)
  const confettiRef = useRef(null)
  const targetPos = useMemo(() => heartPositions(PHOTOS.length), [])
  const { container: containerSize, card: cardSize } = useHeartSize()

  useEffect(() => {
    const BATCH = 4
    const INTERVAL = 120
    let count = 0
    const interval = setInterval(() => {
      count += BATCH
      setVisibleCount(Math.min(count, PHOTOS.length))
      if (count >= PHOTOS.length) clearInterval(interval)
    }, INTERVAL)
  
    const allDone = (PHOTOS.length / BATCH) * INTERVAL + 300
    const t1 = setTimeout(() => setTitleVisible(true), allDone)
    const t2 = setTimeout(() => launchConfetti(confettiRef.current), allDone + 400)
    const t3 = setTimeout(() => setIsBeating(true), allDone + 800)

    return () => {
      clearInterval(interval)
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3)
    }
  }, [])

  return (
    <>
      <style>{`
        @keyframes popIn {
          0%   { opacity: 0; transform: scale(0) rotate(0deg); }
          60%  { opacity: 1; transform: scale(1.1) rotate(var(--card-rotate)); }
          100% { opacity: 1; transform: scale(1)   rotate(var(--card-rotate)); }
        }
        @keyframes heartbeat {
          0%,100% { transform: scale(1); }
          14%     { transform: scale(1.03); }
          28%     { transform: scale(1); }
          42%     { transform: scale(1.02); }
          56%     { transform: scale(1); }
        }
        @keyframes subtlePulse {
          0%,100% { opacity: .55; transform: translateY(0); }
          50%     { opacity: .8;  transform: translateY(-2px); }
        }
      `}</style>

      <canvas ref={confettiRef} style={{
        position: 'fixed', inset: 0, zIndex: 16,
        pointerEvents: 'none', opacity: 0, transition: 'opacity .65s ease',
      }} />

      <div style={{
        width: '100%', minHeight: '100dvh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 'clamp(4px, 1vh, 10px)',
        padding: '16px', paddingTop: '8vh',
        boxSizing: 'border-box',
      }}>
        {/* Title */}
        <div style={{
          zIndex: 25, textAlign: 'center',
          opacity: titleVisible ? 1 : 0,
          transform: titleVisible ? 'translateY(0)' : 'translateY(-8px)',
          transition: 'opacity 1.5s ease-in, transform 1.5s cubic-bezier(.25,.8,.25,1)',
          willChange: 'transform, opacity',
        }}>
          <p className={greatVibes.className} style={{
            color: '#fff0f6',
            fontSize: 'clamp(32px, 9vw, 62px)',
            fontWeight: 400, margin: 0,
            lineHeight: 1.2, letterSpacing: '0.02em',
            textShadow: [
              '0 0 18px rgba(255,182,213,0.9)',
              '0 0 36px rgba(255,80,160,0.55)',
              '0 0 72px rgba(255,0,100,0.25)',
              '0 2px 4px rgba(0,0,0,0.6)',
            ].join(', '),
            animation: titleVisible ? 'subtlePulse 5s ease-in-out infinite' : 'none',
          }}>
            Happy Birthday Nazwa
          </p>
        </div>

        {/* Heart container */}
        <div style={{
          position: 'relative',
          width: containerSize, height: containerSize,
          flexShrink: 0,
          willChange: 'transform',
          animation: isBeating ? 'heartbeat 2.8s ease-in-out infinite' : 'none',
        }}>
          <svg
            style={{
              position: 'absolute', width: '100%', height: '100%',
              top: 0, left: 0, opacity: 0.12, zIndex: 5, pointerEvents: 'none',
              filter: 'drop-shadow(0 0 52px rgba(255,0,127,.95))',
            }}
            viewBox="0 0 200 200"
          >
            <defs>
              <radialGradient id="hg" cx="50%" cy="42%" r="60%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="45%" stopColor="#ff007f" />
                <stop offset="100%" stopColor="#b30059" />
              </radialGradient>
            </defs>
            <path
              d="M100,175C100,175 12,115 12,58C12,28 33,10 58,10C74,10 88,18 100,36C112,18 126,10 142,10C167,10 188,28 188,58C188,115 100,175 100,175Z"
              fill="url(#hg)"
            />
          </svg>

          {PHOTOS.map((photo, i) => (
            <PhotoCard
              key={`${photo}-${i}`}
              src={photo}
              targetX={targetPos[i].x}
              targetY={targetPos[i].y}
              rotate={targetPos[i].rotate}
              delay={0}
              fallback={FALLBACKS[i % FALLBACKS.length]}
              cardSize={cardSize}
              index={i}
              visible={i < visibleCount}
            />
          ))}
        </div>
      </div>
    </>
  )
}
