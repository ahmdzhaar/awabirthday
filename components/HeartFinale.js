'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Great_Vibes } from 'next/font/google'

const greatVibes = Great_Vibes({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
})

// Foto dari assets/foto, diubah ke webp: /finale/NN.webp (maks 1000px) dan /finale/thumb/NN.webp (320px persegi).
// [lebar, tinggi] versi besar dipakai agar galeri tidak "loncat" saat gambar dimuat ketika auto-scroll.
const FINALE_SIZES = [
  [750, 1000], [750, 1000], [563, 1000], [659, 1000], [563, 1000], [680, 1000], [750, 1000],
  [750, 1000], [600, 1000], [750, 1000], [1000, 562], [1000, 750], [1000, 750], [750, 1000],
  [741, 1000], [563, 1000], [563, 1000], [563, 1000], [563, 1000], [563, 1000], [563, 1000],
  [563, 1000], [563, 1000], [750, 1000], [750, 1000], [666, 1000], [563, 1000],
]
const GALLERY = FINALE_SIZES.map(([w, h], i) => {
  const id = String(i + 1).padStart(2, '0')
  return { src: `/finale/${id}.webp`, thumb: `/finale/thumb/${id}.webp`, w, h }
})
const PHOTOS = GALLERY.map(p => p.thumb)

const AUTO_SCROLL_SPEED = 30      // px per detik
const AUTO_SCROLL_START = 2500    // jeda setelah judul muncul sebelum mulai bergulir
const AUTO_SCROLL_RESUME = 4000   // lanjut bergulir setelah pembaca berhenti menyentuh/menggulir
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
  const scrollRef = useRef(null)
  const targetPos = useMemo(() => heartPositions(PHOTOS.length), [])
  const { container: containerSize, card: cardSize } = useHeartSize()

  // Auto-scroll pelan ke bawah setelah hati selesai terbentuk.
  // Berhenti sejenak saat pembaca menyentuh/menggulir sendiri, lalu lanjut dari posisi terakhir.
  useEffect(() => {
    if (!titleVisible) return
    const el = scrollRef.current
    if (!el) return
    let raf
    let last = null
    let pos = el.scrollTop
    let pausedUntil = performance.now() + AUTO_SCROLL_START
    const pause = () => { pausedUntil = performance.now() + AUTO_SCROLL_RESUME }
    const tick = (t) => {
      const dt = last === null ? 0 : Math.min(64, t - last)
      last = t
      if (t < pausedUntil) {
        pos = el.scrollTop
      } else {
        pos += (AUTO_SCROLL_SPEED * dt) / 1000
        el.scrollTop = pos
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 1) return // sudah sampai bawah
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const opts = { passive: true }
    const events = ['wheel', 'touchstart', 'touchmove', 'pointerdown', 'keydown']
    events.forEach(ev => el.addEventListener(ev, pause, opts))
    return () => {
      cancelAnimationFrame(raf)
      events.forEach(ev => el.removeEventListener(ev, pause, opts))
    }
  }, [titleVisible])

  // Bingkai foto muncul perlahan ketika masuk layar
  useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target) }
      })
    }, { root, rootMargin: '0px 0px -8% 0px' })
    root.querySelectorAll('.hf-frame').forEach(f => io.observe(f))
    return () => io.disconnect()
  }, [])

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
      <style>{GALLERY_CSS}</style>
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

      <div className="hf-scroll" ref={scrollRef}>
      <div style={{
        width: '100%', minHeight: '100dvh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 'clamp(4px, 1vh, 10px)',
        padding: '16px', paddingTop: '8vh',
        boxSizing: 'border-box',
        position: 'relative',
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

        <p className={`hf-down ${titleVisible ? 'is-on' : ''}`} aria-hidden="true">
          kenangan kita ↓
        </p>
      </div>

      {/* Galeri: setiap foto dalam bingkainya sendiri */}
      <section className="hf-gallery">
        <h2 className={`${greatVibes.className} hf-gallery-title`}>Kenangan Kita</h2>
        <div className="hf-grid">
          {GALLERY.map((p, i) => (
            <figure
              key={p.src}
              className={`hf-frame hf-v${i % FRAME_STYLES}`}
              style={{ '--tilt': `${ORGANIC_ROTATIONS[i % ORGANIC_ROTATIONS.length] * 0.35}deg` }}
            >
              <div className="hf-mat">
                <img
                  src={p.src}
                  alt={`Kenangan ${i + 1}`}
                  width={p.w}
                  height={p.h}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <figcaption className={greatVibes.className}>
                {POLAROID_LABELS[i % POLAROID_LABELS.length]}
              </figcaption>
            </figure>
          ))}
        </div>
        <p className={`${greatVibes.className} hf-end`}>Happy 19th Birthday, Nazwa ♥</p>
      </section>
      </div>
    </>
  )
}

// Jumlah gaya bingkai (.hf-v0 … .hf-v5), dipakai bergiliran
const FRAME_STYLES = 6

const GALLERY_CSS = `
  .hf-scroll {
    position: fixed; inset: 0; z-index: 10;
    overflow-x: hidden; overflow-y: auto;
    -webkit-overflow-scrolling: touch; overscroll-behavior: contain;
    scrollbar-width: none;
  }
  .hf-scroll::-webkit-scrollbar { display: none; }

  .hf-down {
    position: absolute; left: 0; right: 0; bottom: max(14px, env(safe-area-inset-bottom));
    margin: 0; text-align: center;
    font-family: Georgia, 'Times New Roman', serif; font-style: italic;
    font-size: 13px; letter-spacing: .08em; color: rgba(255,214,232,.75);
    opacity: 0; transition: opacity 1.2s ease 1.2s;
    pointer-events: none;
  }
  .hf-down.is-on { opacity: 1; animation: hfBob 2.4s ease-in-out 2.4s infinite; }

  .hf-gallery {
    width: min(1180px, 100%); margin: 0 auto;
    padding: clamp(24px, 6vh, 64px) clamp(16px, 4vw, 40px) clamp(64px, 14vh, 140px);
    box-sizing: border-box;
  }
  .hf-gallery-title {
    margin: 0 0 clamp(20px, 4vh, 40px); text-align: center; font-weight: 400;
    font-size: clamp(36px, 9vw, 64px); line-height: 1.1; color: #fff0f6;
    text-shadow: 0 0 18px rgba(255,182,213,.85), 0 0 40px rgba(255,80,160,.45);
  }
  .hf-grid { columns: 2; column-gap: clamp(14px, 3.5vw, 28px); }
  @media (min-width: 720px)  { .hf-grid { columns: 3; } }
  @media (min-width: 1100px) { .hf-grid { columns: 4; } }

  /* Bingkai: kayu-emas tipis, alas putih, sedikit miring seperti dipajang */
  .hf-frame {
    break-inside: avoid; -webkit-column-break-inside: avoid;
    display: block; margin: 0 0 clamp(18px, 4vw, 30px);
    padding: clamp(6px, 1.4vw, 10px);
    background: linear-gradient(135deg, #f6d9a5 0%, #b98a4c 28%, #f3d39a 52%, #9c6b33 78%, #e9c88d 100%);
    border-radius: 3px;
    box-shadow:
      0 14px 30px rgba(0,0,0,.55),
      0 2px 6px rgba(0,0,0,.4),
      inset 0 0 0 1px rgba(255,255,255,.35),
      inset 0 0 6px rgba(80,40,10,.55);
    opacity: 0; transform: translateY(26px) rotate(var(--tilt)) scale(.97);
    transition: opacity .9s ease, transform .9s cubic-bezier(.2,.8,.2,1);
  }
  .hf-frame.is-in { opacity: 1; transform: rotate(var(--tilt)); }
  .hf-mat {
    background: #fbf6ef;
    padding: clamp(6px, 1.6vw, 12px);
    box-shadow: inset 0 0 0 1px rgba(120,80,40,.25), inset 0 2px 8px rgba(0,0,0,.18);
  }
  .hf-mat img {
    display: block; width: 100%; height: auto;
    box-shadow: 0 0 0 1px rgba(0,0,0,.08);
  }
  .hf-frame figcaption {
    margin: 0; padding: 4px 0 2px; text-align: center;
    background: #fbf6ef; color: #3a2430;
    font-size: clamp(15px, 3.6vw, 20px); line-height: 1.2;
  }
  .hf-frame { position: relative; }
  .hf-frame::before, .hf-frame::after { pointer-events: none; }

  /* v0 — emas klasik (gaya dasar di atas) */

  /* v1 — polaroid dengan selotip washi merah muda bermotif hati */
  .hf-v1 {
    margin-top: 14px;
    background: #fffdf9; padding: clamp(7px, 1.6vw, 11px) clamp(7px, 1.6vw, 11px) 0;
    border-radius: 2px;
    box-shadow: 0 16px 30px rgba(0,0,0,.5), 0 2px 5px rgba(0,0,0,.35);
  }
  .hf-v1 .hf-mat { background: none; padding: 0; box-shadow: none; }
  .hf-v1 figcaption { background: none; padding: 8px 0 10px; color: #c2185b; }
  .hf-v1::before {
    content: ''; position: absolute; top: -12px; left: 50%;
    width: 46%; height: 24px; transform: translateX(-50%) rotate(-3deg);
    background:
      radial-gradient(circle at 6px 6px, rgba(255,255,255,.75) 1.6px, transparent 2px) 0 0 / 12px 12px,
      linear-gradient(90deg, rgba(255,128,180,.82), rgba(255,170,205,.82));
    box-shadow: 0 1px 3px rgba(0,0,0,.25);
    clip-path: polygon(2% 0, 98% 6%, 100% 50%, 97% 100%, 3% 94%, 0 50%);
  }

  /* v2 — beludru merah-muda tua dengan hati emas di keempat sudut */
  .hf-v2 {
    padding: clamp(10px, 2.2vw, 16px);
    background:
      radial-gradient(120% 120% at 30% 20%, #b0305f 0%, #7a1c43 55%, #4a0f28 100%);
    border-radius: 6px;
    box-shadow: 0 16px 32px rgba(0,0,0,.55), inset 0 0 0 2px rgba(255,214,140,.55), inset 0 0 14px rgba(0,0,0,.5);
  }
  .hf-v2 .hf-mat { background: #fff6f9; box-shadow: inset 0 0 0 1px rgba(176,48,95,.35); }
  .hf-v2 figcaption { background: #fff6f9; color: #9b1f50; }
  /* Hati emas di keempat sudut: 2 dari bingkai, 2 dari alas (alas tidak diposisikan, jadi ikut bingkai) */
  .hf-v2::before, .hf-v2::after, .hf-v2 .hf-mat::before, .hf-v2 .hf-mat::after {
    content: '\\2665'; position: absolute;
    font-size: clamp(11px, 2.4vw, 15px); line-height: 1; color: #f3d08a;
    text-shadow: 0 0 6px rgba(255,200,120,.7);
  }
  .hf-v2::before { top: 3px; left: 4px; }
  .hf-v2::after { top: 3px; right: 4px; }
  .hf-v2 .hf-mat::before { bottom: 3px; left: 4px; }
  .hf-v2 .hf-mat::after { bottom: 3px; right: 4px; }

  /* v3 — renda putih dengan jahitan putus-putus */
  .hf-v3 {
    padding: clamp(10px, 2vw, 14px);
    background: #fffaf6;
    border-radius: 4px;
    /* tepi bergelombang atas & bawah seperti renda */
    -webkit-mask:
      radial-gradient(circle 5px at 7px 5px, #000 98%, transparent) 0 0 / 14px 10px repeat-x,
      linear-gradient(#000, #000) 0 5px / 100% calc(100% - 10px) no-repeat,
      radial-gradient(circle 5px at 7px 5px, #000 98%, transparent) 0 100% / 14px 10px repeat-x;
            mask:
      radial-gradient(circle 5px at 7px 5px, #000 98%, transparent) 0 0 / 14px 10px repeat-x,
      linear-gradient(#000, #000) 0 5px / 100% calc(100% - 10px) no-repeat,
      radial-gradient(circle 5px at 7px 5px, #000 98%, transparent) 0 100% / 14px 10px repeat-x;
    box-shadow: none;
  }
  .hf-v3 .hf-mat {
    background: #fffaf6; padding: clamp(6px, 1.4vw, 9px);
    box-shadow: none; outline: 2px dashed rgba(214,120,160,.7); outline-offset: -4px;
  }
  .hf-v3 figcaption { background: #fffaf6; color: #b0305f; padding-bottom: 6px; }

  /* v4 — kayu gelap dengan peniti hati merah di atas */
  .hf-v4 {
    margin-top: 12px;
    padding: clamp(8px, 1.8vw, 13px);
    background:
      repeating-linear-gradient(92deg, rgba(255,255,255,.04) 0 2px, transparent 2px 7px),
      linear-gradient(135deg, #6b3f26, #3e2316 60%, #5a331e);
    border-radius: 3px;
    box-shadow: 0 16px 30px rgba(0,0,0,.6), inset 0 0 0 1px rgba(255,220,180,.18), inset 0 0 10px rgba(0,0,0,.6);
  }
  .hf-v4 .hf-mat { background: #f7efe4; }
  .hf-v4 figcaption { background: #f7efe4; color: #5a331e; }
  .hf-v4::before {
    content: '\\2665'; position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
    font-size: 24px; line-height: 1; color: #e0245e;
    text-shadow: 0 2px 4px rgba(0,0,0,.55), 0 0 10px rgba(255,60,120,.6);
    z-index: 2;
  }

  /* v5 — neon merah muda bercahaya */
  .hf-v5 {
    padding: clamp(6px, 1.4vw, 9px);
    background: rgba(20,0,20,.55);
    border: 2px solid #ff69b4; border-radius: 16px;
    box-shadow: 0 0 10px rgba(255,105,180,.9), 0 0 26px rgba(255,20,147,.55), inset 0 0 12px rgba(255,105,180,.45);
    animation: hfNeon 3.2s ease-in-out infinite;
  }
  .hf-v5 .hf-mat { background: none; padding: 0; box-shadow: none; border-radius: 10px; overflow: hidden; }
  .hf-v5 figcaption {
    background: none; color: #ffd1e6; padding: 6px 0 2px;
    text-shadow: 0 0 8px rgba(255,105,180,.95);
  }
  @keyframes hfNeon {
    0%,100% { box-shadow: 0 0 10px rgba(255,105,180,.9), 0 0 26px rgba(255,20,147,.55), inset 0 0 12px rgba(255,105,180,.45); }
    50%     { box-shadow: 0 0 16px rgba(255,105,180,1), 0 0 40px rgba(255,20,147,.75), inset 0 0 16px rgba(255,105,180,.6); }
  }
  .hf-end {
    margin: clamp(20px, 5vh, 48px) 0 0; text-align: center;
    font-size: clamp(30px, 8vw, 54px); color: #fff0f6;
    text-shadow: 0 0 18px rgba(255,182,213,.85), 0 0 40px rgba(255,80,160,.45);
  }
  @keyframes hfBob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(5px) } }
`
