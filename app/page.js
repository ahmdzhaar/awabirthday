'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import MusicBtn from '../components/MusicBtn'

const SpaceBg = dynamic(() => import('../components/SpaceBg'), { ssr: false })
const CursorEffect = dynamic(() => import('../components/CursorEffect'), { ssr: false })
const SplashScene = dynamic(() => import('../components/SplashScene'), { ssr: false })
const MatrixScene = dynamic(() => import('../components/MatrixScene'), { ssr: false })
const LetterScene = dynamic(() => import('../components/LetterScene'), { ssr: false })
const BookScene = dynamic(() => import('../components/BookScene'), { ssr: false })
const VideoScene = dynamic(() => import('../components/VideoScene'), { ssr: false })
const HeartFinale = dynamic(() => import('../components/HeartFinale'), {
  ssr: false,
  loading: () => null,
})

// 0 splash, 1 matrix, 2 surat, 3 photobook, 4 video, 5 hati
const TOTAL = 6
const FINALE = 5
const VIDEO = 4

let audioUnlocked = false
function unlockAudio() {
  if (audioUnlocked) return
  audioUnlocked = true
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    const t = ac.currentTime
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(100, t)
    gain.gain.setValueAtTime(0, t)
    osc.start(t)
    osc.stop(t + 0.001)
    setTimeout(() => { try { ac.close() } catch (e) {} }, 100)
  } catch (e) {}
}

function spawnBurst(x, y) {
  const symbols = ['❤️', '💕', '✨', '💗', '⭐', '🌸']
  const count = 5 + Math.floor(Math.random() * 3)
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div')
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.8
    const speed = 60 + Math.random() * 90
    const dx = Math.cos(angle) * speed
    const dy = Math.sin(angle) * speed
    const size = 14 + Math.random() * 12
    const sym = symbols[Math.floor(Math.random() * symbols.length)]
    el.textContent = sym
    el.style.cssText = `
      position:fixed;left:${x}px;top:${y}px;
      font-size:${size}px;pointer-events:none;z-index:99996;
      transform:translate(-50%,-50%);
      animation:burstFly 0.8s ease-out forwards;
      --dx:${dx}px;--dy:${dy}px;
    `
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 850)
  }
}

function triggerGlitch() {
  const body = document.body
  body.classList.add('glitch-active')
  setTimeout(() => body.classList.remove('glitch-active'), 320)
}

function AudioController({ audioRef, onReady, hidden }) {
  const [playing, setPlaying] = useState(false)
  const [visible, setVisible] = useState(false)
  const resumeRef = useRef(false)

  useEffect(() => {
    onReady({
      start: () => {
        unlockAudio()
        if (!audioRef.current) return
        audioRef.current.volume = 0.35
        audioRef.current
          .play()
          .then(() => { setPlaying(true); setVisible(true) })
          .catch(() => {})
      },
      show: () => setVisible(true),
      unlockAudio: unlockAudio,
      // Hentikan musik latar (mis. saat video diputar), ingat apakah tadi sedang berbunyi
      pause: () => {
        const a = audioRef.current
        if (!a || a.paused) return
        resumeRef.current = true
        a.pause()
        setPlaying(false)
      },
      resume: () => {
        const a = audioRef.current
        if (!a || !resumeRef.current) return
        resumeRef.current = false
        a.play().then(() => setPlaying(true)).catch(() => {})
      },
    })
  }, [onReady])

  const toggle = () => {
    if (!audioRef.current) return
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {})
    }
  }

  if (!visible || hidden) return null
  return <MusicBtn playing={playing} onToggle={toggle} />
}

export default function Home() {
  const [scene, setScene] = useState(0)
  const [renderedScene, setRenderedScene] = useState(0)
  const [fadeOpacity, setFadeOpacity] = useState(0)
  const audioRef = useRef(null)
  const audioCtrlRef = useRef(null)
  const sceneRef = useRef(0)
  const fadingRef = useRef(false)

  useEffect(() => {
    sceneRef.current = scene
  }, [scene])

  useEffect(() => {
    const handler = (e) => {
      unlockAudio()
      if (sceneRef.current === 1 || sceneRef.current === VIDEO) return
      if (fadingRef.current) return
      const x = e.clientX ?? e.touches?.[0]?.clientX
      const y = e.clientY ?? e.touches?.[0]?.clientY
      if (x !== undefined) spawnBurst(x, y)
    }
    window.addEventListener('click', handler)
    window.addEventListener('touchend', handler)
    return () => {
      window.removeEventListener('click', handler)
      window.removeEventListener('touchend', handler)
    }
  }, [])

  useEffect(() => {
    if (scene !== FINALE) return
    const interval = setInterval(() => {
      const el = document.createElement('div')
      el.style.cssText = `position:fixed;pointer-events:none;font-size:1.4rem;bottom:0;left:${Math.random() * 100}vw;z-index:9999;animation:miniFloat 3s ease-out forwards;`
      el.textContent = ['❤️', '💕', '💗', '💖'][Math.floor(Math.random() * 4)]
      document.body.appendChild(el)
      setTimeout(() => el.remove(), 3200)
    }, 500)
    return () => clearInterval(interval)
  }, [scene])

  useEffect(() => {
    if (renderedScene === VIDEO) {
      import('../components/HeartFinale').catch(() => {})
    }
  }, [renderedScene])

  const goScene = useCallback((n) => {
    if (n < 0 || n >= TOTAL) return

    if (n === FINALE) {
      fadingRef.current = true
      setScene(FINALE)
      setFadeOpacity(1)
      setTimeout(() => setRenderedScene(FINALE), 350)
      setTimeout(() => {
        setFadeOpacity(0)
        fadingRef.current = false
      }, 700)
      return
    }

    triggerGlitch()
    setScene(n)
    setRenderedScene(n)
  }, [])

  return (
    <>
      <SpaceBg />
      <CursorEffect />
      <audio ref={audioRef} loop src="/music/bg.mp3" preload="auto" />
      <AudioController audioRef={audioRef} hidden={renderedScene === VIDEO} onReady={(ctrl) => { audioCtrlRef.current = ctrl }} />

      {renderedScene === 0 && (
        <SplashScene onEnter={() => { audioCtrlRef.current?.start(); goScene(1) }} />
      )}
      {renderedScene === 1 && <MatrixScene onDone={() => goScene(2)} />}
      {renderedScene === 2 && <LetterScene onDone={() => goScene(3)} />}
      {renderedScene === 3 && <BookScene onDone={() => goScene(VIDEO)} />}
      {renderedScene === VIDEO && (
        <VideoScene
          onPlayStart={() => audioCtrlRef.current?.pause()}
          onDone={() => { audioCtrlRef.current?.resume(); goScene(FINALE) }}
        />
      )}
      {renderedScene === FINALE && <HeartFinale />}

      <div style={{
        position: 'fixed', inset: 0,
        zIndex: 99999,
        background: '#000',
        opacity: fadeOpacity,
        pointerEvents: fadeOpacity > 0 ? 'all' : 'none',
        transition: fadeOpacity === 1
          ? 'opacity 350ms ease-in'
          : 'opacity 500ms ease-out',
        willChange: 'opacity',
      }} />

      <style>{`
        .glitch-active::after {
          content: '';
          position: fixed;
          inset: 0;
          z-index: 99990;
          pointer-events: none;
          background: rgba(255, 20, 147, 0.08);
        }
      `}</style>
    </>
  )
}

