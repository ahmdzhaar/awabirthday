'use client'

import { useEffect, useRef } from 'react'

const HEART_CHARS = ['♥', '♡', '❤', '✦', '✧', '◆', '◇', '★', '✿', '❋', '•', '·']
const WORDS = ['HAPPY', 'BIRTHDAY', 'TO', 'NAZWA']
const RAIN_COLORS = ['#ff69b4', '#e0006f', '#9b0050', '#ff1493', '#c2185b']

function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t }
function easeIn(t) { return t * t * t }

function sampleFromCanvas(offCanvas, stepSize) {
  const { width: w, height: h } = offCanvas
  const { data } = offCanvas.getContext('2d').getImageData(0, 0, w, h)
  const pts = []
  for (let py = 0; py < h; py += stepSize)
    for (let px = 0; px < w; px += stepSize)
      if (data[(py * w + px) * 4 + 3] > 100)
        pts.push({ dx: px - w / 2, dy: py - h / 2 })
  return pts
}

function sampleText(text, canvasWidth, canvasHeight, isCountdown) {
  const off = document.createElement('canvas')
  off.width = canvasWidth
  off.height = canvasHeight
  const c = off.getContext('2d')
  const maxWidth = canvasWidth * 0.88 

  let fontSize = isCountdown 
    ? Math.min(canvasWidth * 0.45, canvasHeight * 0.4)  
    : Math.min(canvasWidth * 0.35, canvasHeight * 0.3)

  c.font = `900 ${fontSize}px "Arial Black", Impact, sans-serif`
  while (c.measureText(text).width > maxWidth && fontSize > 20) {
    fontSize -= 2
    c.font = `900 ${fontSize}px "Arial Black", Impact, sans-serif`
  }

  c.textAlign = 'center'
  c.textBaseline = 'middle'
  c.fillStyle = '#fff'
  c.fillText(text, canvasWidth / 2, canvasHeight / 2)
  const step = canvasWidth < 600 ? 4 : 6
  return sampleFromCanvas(off, step)
}

function sampleHeart(canvasWidth, canvasHeight) {
  const off = document.createElement('canvas')
  off.width = canvasWidth
  off.height = canvasHeight
  const c = off.getContext('2d')
  const cx = canvasWidth / 2, cy = canvasHeight / 2
  const minDim = Math.min(canvasWidth, canvasHeight)
  const s = minDim * 0.022

  c.fillStyle = '#fff'
  c.beginPath()
  for (let i = 0; i <= 360; i++) {
    const t = (i * Math.PI) / 180
    const x = cx + s * 16 * Math.pow(Math.sin(t), 3)
    const y = cy - s * (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t))
    i === 0 ? c.moveTo(x, y) : c.lineTo(x, y)
  }
  c.closePath()
  c.fill()
  const step = canvasWidth < 600 ? 4 : canvasWidth < 1024 ? 5 : 6
  return sampleFromCanvas(off, step)
}

function matchParticles(src, dst) {
  const result = []
  const srcLen = src.length
  const dstLen = dst.length
  const maxLen = Math.max(srcLen, dstLen)
  for (let i = 0; i < maxLen; i++) {
    const from = src[i % srcLen]
    const to = dst[i % dstLen]
    result.push({
      fromDx: from.dx,
      fromDy: from.dy,
      toDx: to.dx + (Math.random() - 0.5) * 2,
      toDy: to.dy + (Math.random() - 0.5) * 2,
    })
  }
  return result
}

export default function MatrixScene({ onDone }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const timersRef = useRef([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let running = true
    let width = 0, height = 0, dpr = 1, fontSize = 12
    let drops = []
    let cachedGrd = null
    let bursts = []

    let morphPts = []
    let morphT = 1
    let morphing = false
    let morphStart = 0
    let morphDone = null
    let currentPts = []
    let presampled = null
    let isCountdownPhase = false

    const MORPH_MS   = 170
    const HOLD_COUNT = 1200
    const HOLD_WORD  = 1600
    const HOLD_LAST  = 2000
    const HOLD_HEART = 2000

    let pSize = 2.0 

    const addTimer = (fn, ms) => {
      const id = setTimeout(fn, ms)
      timersRef.current.push(id)
      return id
    }

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      fontSize = Math.max(10, Math.min(13, Math.floor(width / 45)))

      const colSpacing = fontSize * 0.42
      const baseColCount = Math.ceil(width / colSpacing) + 6
      const cols = isCountdownPhase ? Math.max(8, Math.floor(baseColCount * 0.25)) : Math.floor(baseColCount * 0.75)
      const adjustedSpacing = width / cols

      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0) 
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, width, height)

      cachedGrd = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width*0.5)
      cachedGrd.addColorStop(0, 'rgba(160,0,70,0.07)')
      cachedGrd.addColorStop(1, 'rgba(0,0,0,0)')

      drops = Array.from({ length: cols }, (_, i) => ({
        y: Math.random() > 0.4 ? Math.random() * -height * 1.5 : Math.random() * height * 0.5,
        speed: fontSize * (0.25 + Math.random() * 0.4),
        length: Math.floor(height / fontSize * (0.6 + Math.random() * 0.4)),
        x: i * adjustedSpacing,
        chars: Array.from({ length: 60 }, () => HEART_CHARS[Math.floor(Math.random() * HEART_CHARS.length)]),
        charTick: 0,
      }))

      pSize = width < 600 ? 1.3 : 2.5
      presampled = {
        countdown: {
          3: sampleText('3', width, height, true),
          2: sampleText('2', width, height, true),
          1: sampleText('1', width, height, true),
        },
        words: WORDS.map(w => sampleText(w, width, height, false)),
        heart: sampleHeart(width, height),
      }
    }

    const spawnBurst = () => {
      const count = 28
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i / count) + (Math.random() - 0.5) * 0.3
        const speed = 55 + Math.random() * 85
        bursts.push({
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 1.4 + Math.random() * 1.8,
          born: performance.now(),
          life: 320 + Math.random() * 120,
        })
      }
    }

    const morphTo = (nextPts, holdMs, cb) => {
      if (!nextPts) return;
      morphPts = matchParticles(currentPts.length ? currentPts : nextPts, nextPts)
      morphing = true
      morphT = 0
      morphStart = performance.now()
      morphDone = () => {
        currentPts = nextPts
        spawnBurst()
        addTimer(cb, holdMs)
      }
    }

    const drawBursts = (now) => {
      bursts = bursts.filter(b => {
        const age = now - b.born
        if (age > b.life) return false
        const t = age / b.life
        const alpha = 1 - easeIn(t)
        const cx = width / 2, cy = height / 2
        ctx.globalAlpha = alpha * 0.85
        ctx.shadowBlur = 5
        ctx.shadowColor = '#ff66b2'
        ctx.fillStyle = '#ff66b2'
        ctx.beginPath()
        ctx.arc(cx + b.vx * t * 0.5, cy + b.vy * t * 0.5, b.size * (1 - t * 0.4), 0, Math.PI * 2)
        ctx.fill()
        return true
      })
      ctx.globalAlpha = 1; ctx.shadowBlur = 0
    }

    const drawParticles = (now) => {
      const cx = width / 2, cy = height / 2

      if (morphing) {
        const elapsed = now - morphStart
        const t = Math.min(1, elapsed / MORPH_MS)
        morphT = easeInOut(t)

        if (t >= 1) {
          morphing = false
          morphDone?.()
          morphDone = null
        }

        const pulse = 0.92 + 0.08 * Math.sin(now / 120)
        const shadowFade = t < 0.5 ? (1 - t / 0.5) : 0
        const shadowIntensity = (isCountdownPhase ? 8 : 18) * shadowFade
        ctx.shadowBlur = shadowIntensity > 0.1 ? shadowIntensity : 0
        ctx.shadowColor = shadowFade > 0 ? '#ff007f' : 'transparent'
        ctx.fillStyle = '#ffccee'
        ctx.globalAlpha = pulse * 0.9
        ctx.beginPath()
        morphPts.forEach(p => {
          const x = p.fromDx + (p.toDx - p.fromDx) * morphT
          const y = p.fromDy + (p.toDy - p.fromDy) * morphT
          ctx.moveTo(cx + x + pSize, cy + y)
          ctx.arc(cx + x, cy + y, pSize, 0, Math.PI * 2)
        })
        ctx.fill()
        ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'

      } else if (currentPts.length) {
        const pulse = 0.94 + 0.06 * Math.sin(now / 140)
        ctx.shadowBlur = 0
        ctx.shadowColor = 'transparent'
        ctx.fillStyle = '#ffccee'
        ctx.globalAlpha = pulse * 0.9
        ctx.beginPath()
        currentPts.forEach(p => {
        ctx.fillRect(cx + p.dx - pSize, cy + p.dy - pSize, pSize * 2, pSize * 2)
        })
        ctx.fill()
        ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'
      }
    }

    const drawRain = () => {
      ctx.shadowBlur = 0
      ctx.shadowColor =  'transparent'

      ctx.font = `900 ${fontSize + 4}px monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      drops.forEach(drop => {
        drop.charTick++
        if (drop.charTick % 8 === 0)
          drop.chars[0] = HEART_CHARS[Math.floor(Math.random() * HEART_CHARS.length)]
        for (let j = 0; j < drop.length; j++) {
          const y = drop.y - j * fontSize
          if (y < -fontSize || y > height + fontSize) continue
          const ratio = j / drop.length
          ctx.globalAlpha = j === 0 ? 1 : Math.max(0.03, 1 - ratio * 1.1)
          if (j === 0) { ctx.fillStyle = '#ffe0f0' }
          else if (ratio < 0.12) { ctx.fillStyle = '#ffb3d9' }
          else if (ratio < 0.3) { ctx.fillStyle = RAIN_COLORS[0] }
          else if (ratio < 0.6) { ctx.fillStyle = RAIN_COLORS[1] }
          else { ctx.fillStyle = RAIN_COLORS[2] }
          ctx.fillText(drop.chars[(j + drop.charTick) % drop.chars.length], drop.x, y)
        }
        drop.y += drop.speed
        if (drop.y - drop.length * fontSize > height) {
          drop.y = -fontSize * (0.5 + Math.random() * 5)
          drop.speed = fontSize * (0.25 + Math.random() * 0.4)
          drop.length = Math.floor(height / fontSize * (0.6 + Math.random() * 0.4))
        }
      })
      ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'
    }

    const draw = () => {
      if (!running) return
      const now = performance.now()
      ctx.fillStyle = 'rgba(0,0,0,0.07)'
      ctx.fillRect(0, 0, width, height)
      ctx.globalAlpha = 1
      ctx.shadowBlur = 0
      ctx.shadowColor = 'transparent'
      
      if (cachedGrd) { ctx.fillStyle = cachedGrd; ctx.fillRect(0, 0, width, height) }
      drawRain()
      drawParticles(now)
      drawBursts(now)
      rafRef.current = requestAnimationFrame(draw)
    }

    const runWords = (idx) => {
      if (!presampled) return;
      isCountdownPhase = false
      const hold = idx === WORDS.length - 1 ? HOLD_LAST : HOLD_WORD
      morphTo(presampled.words[idx], hold, () => {
        if (idx < WORDS.length - 1) {
          runWords(idx + 1)
        } else {
          morphTo(presampled.heart, HOLD_HEART, () => {
            running = false
            canvas.style.transition = 'opacity 1.2s ease'
            canvas.style.opacity = '0'
            addTimer(() => onDone?.(), 1200)
          })
        }
      })
    }

    const runCountdown = (num) => {
      if (!presampled) return;
      isCountdownPhase = true
      morphTo(presampled.countdown[num], HOLD_COUNT, () => {
        if (num > 1) runCountdown(num - 1)
        else runWords(0)
      })
    }

    document.fonts.ready.then(() => {
      if (!running) return;

      resize() 
      draw()
      window.addEventListener('resize', resize)
      addTimer(() => runCountdown(3), 1600)
    })

    return () => {
      running = false
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafRef.current)
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [onDone])

  return (
    <div className="scene w-screen h-screen fixed inset-0 overflow-hidden bg-black" style={{ zIndex: 10 }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed', 
          inset: 0, 
          zIndex: 2,
          display: 'block', 
          opacity: 1,
          transition: 'opacity 0.9s ease',
          width: '100vw',
          height: '100vh',
        }}
      />
    </div>
  )
}

