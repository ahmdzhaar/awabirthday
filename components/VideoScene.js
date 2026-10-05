'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const SRC = '/video/nyanyi.mp4'
const POSTER = '/video/nyanyi-poster.jpg'
const BACKDROP = '/photobook/02.webp'
const TITLE = 'Lagu Untukmu'
const NEXT_COUNTDOWN = 10

function fmt(t) {
  if (!isFinite(t) || t < 0) t = 0
  const m = Math.floor(t / 60)
  const s = Math.floor(t % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function Logo() {
  return (
    <div className="vs-badge">
      <span className="vs-n">N</span>
      <span className="vs-orig">ORIGINAL</span>
    </div>
  )
}

export default function VideoScene({ onPlayStart, onDone }) {
  const videoRef = useRef(null)
  const hideRef = useRef(null)
  const leftRef = useRef(false)
  const [mode, setMode] = useState('title') // title | player
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [controls, setControls] = useState(true)
  const [ended, setEnded] = useState(false)
  const [countdown, setCountdown] = useState(NEXT_COUNTDOWN)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  const leave = useCallback(() => {
    if (leftRef.current) return
    leftRef.current = true
    videoRef.current?.pause()
    setVisible(false)
    setTimeout(() => onDone?.(), 600)
  }, [onDone])

  const pokeControls = useCallback(() => {
    setControls(true)
    clearTimeout(hideRef.current)
    hideRef.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) setControls(false)
    }, 3000)
  }, [])

  const play = () => {
    const v = videoRef.current
    if (!v) return
    // Musik latar dihentikan begitu video diputar
    onPlayStart?.()
    setMode('player')
    setEnded(false)
    v.play().catch(() => {})
    pokeControls()
  }

  const togglePlay = (e) => {
    e?.stopPropagation()
    const v = videoRef.current
    if (!v) return
    if (v.paused) { onPlayStart?.(); v.play().catch(() => {}) } else v.pause()
    pokeControls()
  }

  const seekBy = (e, sec) => {
    e.stopPropagation()
    const v = videoRef.current
    if (!v) return
    v.currentTime = Math.min(Math.max(0, v.currentTime + sec), v.duration || 0)
    pokeControls()
  }

  const seekTo = (e) => {
    e.stopPropagation()
    const v = videoRef.current
    if (!v || !v.duration) return
    const r = e.currentTarget.getBoundingClientRect()
    const x = (e.touches?.[0]?.clientX ?? e.clientX) - r.left
    v.currentTime = Math.min(Math.max(0, x / r.width), 1) * v.duration
    pokeControls()
  }

  const fullscreen = (e) => {
    e.stopPropagation()
    const v = videoRef.current
    const box = v?.parentElement
    if (!v) return
    if (document.fullscreenElement) document.exitFullscreen?.()
    else if (box?.requestFullscreen) box.requestFullscreen().catch(() => {})
    else v.webkitEnterFullscreen?.() // iOS Safari
  }

  // Hitung mundur ke scene berikutnya setelah video selesai
  useEffect(() => {
    if (!ended) return
    setCountdown(NEXT_COUNTDOWN)
    const id = setInterval(() => setCountdown(c => {
      if (c <= 1) { clearInterval(id); leave(); return 0 }
      return c - 1
    }), 1000)
    return () => clearInterval(id)
  }, [ended, leave])

  useEffect(() => () => clearTimeout(hideRef.current), [])

  useEffect(() => {
    const v = videoRef.current
    if (v && v.readyState >= 1 && isFinite(v.duration)) setDuration(v.duration)
  }, [])

  const progress = duration ? (time / duration) * 100 : 0
  const bufPct = duration ? (buffered / duration) * 100 : 0

  return (
    <div className="scene vs-root" style={{ opacity: visible ? 1 : 0 }}>
      <style>{CSS}</style>

      {/* ── Halaman judul ── */}
      <div className={`vs-hero ${mode === 'title' ? '' : 'is-hidden'}`}>
        <div className="vs-backdrop" style={{ backgroundImage: `url(${BACKDROP})` }} />
        <div className="vs-shade" />
        <div className="vs-info">
          <Logo />
          <h1 className="vs-title">{TITLE}</h1>
          <div className="vs-meta">
            <span className="vs-match">100% Cocok</span>
            <span>2026</span>
            <span className="vs-age">19+</span>
            <span>1m 35s</span>
            <span className="vs-hd">HD</span>
          </div>
          <p className="vs-desc">
            Sebuah lagu sederhana, dinyanyikan dengan sepenuh hati beserta potongan
            kenangan kita berdua, untuk Putri Nazwa di hari ulang tahunnya yang ke-19.
          </p>
          <p className="vs-cast"><b>Dibintangi:</b> kamu &amp; aku</p>
          <div className="vs-buttons">
            <button className="vs-btn vs-play" onClick={play}>
              <svg viewBox="0 0 24 24" width="22" height="22"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor" /></svg>
              Putar
            </button>
            <button className="vs-btn vs-more" onClick={leave}>
              <svg viewBox="0 0 24 24" width="20" height="20"><path d="M5 5l7 7-7 7M13 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Lewati
            </button>
          </div>
        </div>
      </div>

      {/* ── Pemutar ── */}
      <div
        className={`vs-player ${mode === 'player' ? 'is-on' : ''} ${controls || !playing ? 'show-ui' : ''}`}
        onClick={pokeControls}
        onMouseMove={pokeControls}
      >
        <video
          ref={videoRef}
          src={SRC}
          poster={POSTER}
          playsInline
          preload="metadata"
          className="vs-video"
          onPlay={() => { setPlaying(true); setEnded(false) }}
          onPause={() => { setPlaying(false); setControls(true) }}
          onEnded={() => { setPlaying(false); setEnded(true); setControls(true) }}
          onTimeUpdate={(e) => {
            const v = e.currentTarget
            setTime(v.currentTime)
            // Metadata bisa sudah termuat sebelum listener React terpasang, jadi ambil durasi di sini juga
            if (isFinite(v.duration)) setDuration(v.duration)
          }}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onDurationChange={(e) => setDuration(e.currentTarget.duration)}
          onProgress={(e) => {
            const b = e.currentTarget.buffered
            if (b.length) setBuffered(b.end(b.length - 1))
          }}
        />

        <div className="vs-top">
          <button className="vs-icon" onClick={(e) => { e.stopPropagation(); videoRef.current?.pause(); setMode('title') }} aria-label="Kembali">
            <svg viewBox="0 0 24 24" width="26" height="26"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div className="vs-now">
            <span className="vs-now-sub">Untuk Putri Nazwa</span>
            <span className="vs-now-title">{TITLE}</span>
          </div>
        </div>

        {!playing && !ended && mode === 'player' && (
          <button className="vs-bigplay" onClick={togglePlay} aria-label="Putar">
            <svg viewBox="0 0 24 24" width="44" height="44"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor" /></svg>
          </button>
        )}

        <div className="vs-bottom" onClick={(e) => e.stopPropagation()}>
          <div className="vs-bar" onClick={seekTo}>
            <div className="vs-bar-buf" style={{ width: `${bufPct}%` }} />
            <div className="vs-bar-fill" style={{ width: `${progress}%` }} />
            <div className="vs-bar-knob" style={{ left: `${progress}%` }} />
          </div>
          <div className="vs-row">
            <button className="vs-icon" onClick={togglePlay} aria-label={playing ? 'Jeda' : 'Putar'}>
              {playing
                ? <svg viewBox="0 0 24 24" width="28" height="28"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" /></svg>
                : <svg viewBox="0 0 24 24" width="28" height="28"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor" /></svg>}
            </button>
            <button className="vs-icon" onClick={(e) => seekBy(e, -10)} aria-label="Mundur 10 detik">
              <svg viewBox="0 0 24 24" width="26" height="26"><path d="M12 5V2L7 6l5 4V7a6 6 0 1 1-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><text x="12" y="16.5" fontSize="6.5" textAnchor="middle" fill="currentColor" fontWeight="700">10</text></svg>
            </button>
            <button className="vs-icon" onClick={(e) => seekBy(e, 10)} aria-label="Maju 10 detik">
              <svg viewBox="0 0 24 24" width="26" height="26"><path d="M12 5V2l5 4-5 4V7a6 6 0 1 0 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><text x="12" y="16.5" fontSize="6.5" textAnchor="middle" fill="currentColor" fontWeight="700">10</text></svg>
            </button>
            <span className="vs-time">{fmt(time)} / {fmt(duration)}</span>
            <span className="vs-spacer" />
            <span className="vs-row-title">{TITLE}</span>
            <span className="vs-spacer" />
            <button className="vs-icon" onClick={fullscreen} aria-label="Layar penuh">
              <svg viewBox="0 0 24 24" width="24" height="24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
            </button>
          </div>
        </div>

        {ended && (
          <div className="vs-endcard" onClick={(e) => e.stopPropagation()}>
            <p className="vs-end-label">Berikutnya</p>
            <p className="vs-end-title">Sebuah hati untukmu ♥</p>
            <div className="vs-end-buttons">
              <button className="vs-btn vs-play" onClick={leave}>
                <svg viewBox="0 0 24 24" width="20" height="20"><path d="M7 4.5v15l12.5-7.5z" fill="currentColor" /></svg>
                Lanjut ({countdown})
              </button>
              <button className="vs-btn vs-more" onClick={(e) => { setEnded(false); togglePlay(e) }}>Putar ulang</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const CSS = `
  .vs-root {
    z-index: 10; background: #000; overflow: hidden;
    transition: opacity .6s ease;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #fff;
  }
  .vs-root button { font-family: inherit; }

  /* ── Hero ── */
  .vs-hero { position: absolute; inset: 0; transition: opacity .5s ease, transform .6s ease; }
  .vs-hero.is-hidden { opacity: 0; transform: scale(1.04); pointer-events: none; }
  .vs-backdrop {
    position: absolute; inset: 0;
    background-size: cover; background-position: center 30%;
    animation: vsKen 22s ease-in-out infinite alternate;
  }
  .vs-shade {
    position: absolute; inset: 0;
    background:
      linear-gradient(77deg, rgba(0,0,0,.92) 0%, rgba(0,0,0,.55) 45%, rgba(0,0,0,.05) 85%),
      linear-gradient(0deg, #000 0%, rgba(0,0,0,.6) 28%, transparent 60%);
  }
  .vs-info {
    position: absolute; left: clamp(18px, 5vw, 64px); right: 18px;
    bottom: clamp(48px, 12vh, 120px);
    max-width: 560px;
    animation: vsRise .9s .2s cubic-bezier(.2,.8,.2,1) both;
  }
  .vs-badge { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
  .vs-n {
    font-family: 'Bebas Neue', Impact, 'Arial Black', sans-serif;
    font-weight: 900; font-size: 30px; line-height: 1; color: #e50914;
    transform: scaleY(1.25); text-shadow: 0 2px 6px rgba(0,0,0,.6);
  }
  .vs-orig { font-size: 12px; letter-spacing: .35em; color: #ddd; font-weight: 700; }
  .vs-title {
    margin: 0 0 12px;
    font-family: 'Playfair Display', Georgia, serif; font-weight: 900;
    font-size: clamp(40px, 11vw, 76px); line-height: .95; letter-spacing: -.01em;
    text-shadow: 0 4px 18px rgba(0,0,0,.6);
  }
  .vs-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; font-size: 14px; color: #ddd; margin-bottom: 12px; }
  .vs-match { color: #46d369; font-weight: 700; }
  .vs-age { border: 1px solid rgba(255,255,255,.55); padding: 0 6px; font-size: 12px; }
  .vs-hd { border: 1px solid rgba(255,255,255,.55); border-radius: 3px; padding: 0 4px; font-size: 10px; font-weight: 700; }
  .vs-desc { margin: 0 0 8px; font-size: clamp(14px, 3.6vw, 17px); line-height: 1.45; color: #f2f2f2; text-shadow: 0 1px 4px rgba(0,0,0,.6); }
  .vs-cast { margin: 0 0 18px; font-size: 13px; color: #aaa; }
  .vs-cast b { color: #777; font-weight: 400; }
  .vs-buttons { display: flex; gap: 10px; flex-wrap: wrap; }
  .vs-btn {
    display: inline-flex; align-items: center; gap: 8px;
    border: 0; border-radius: 4px; cursor: pointer;
    padding: 10px 24px 10px 18px; font-size: 17px; font-weight: 700;
    transition: background .2s ease, transform .15s ease;
  }
  .vs-btn:active { transform: scale(.97); }
  .vs-play { background: #fff; color: #000; }
  .vs-play:hover { background: rgba(255,255,255,.78); }
  .vs-more { background: rgba(109,109,110,.7); color: #fff; }
  .vs-more:hover { background: rgba(109,109,110,.45); }

  /* ── Player ── */
  .vs-player {
    position: absolute; inset: 0; background: #000;
    opacity: 0; pointer-events: none; transition: opacity .5s ease;
  }
  .vs-player.is-on { opacity: 1; pointer-events: auto; }
  .vs-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; background: #000; }
  .vs-top, .vs-bottom, .vs-bigplay { opacity: 0; transition: opacity .35s ease; pointer-events: none; }
  /* Hanya aktif saat pemutar tampil, supaya kontrol yang tak terlihat tidak menutupi tombol di halaman judul */
  .vs-player.is-on.show-ui .vs-top,
  .vs-player.is-on.show-ui .vs-bottom,
  .vs-player.is-on.show-ui .vs-bigplay { opacity: 1; pointer-events: auto; }
  .vs-player:not(.show-ui) { cursor: none; }
  .vs-top {
    position: absolute; top: 0; left: 0; right: 0;
    display: flex; align-items: center; gap: 10px;
    padding: max(14px, env(safe-area-inset-top)) 16px 40px;
    background: linear-gradient(rgba(0,0,0,.75), transparent);
  }
  .vs-now { display: flex; flex-direction: column; line-height: 1.2; }
  .vs-now-sub { font-size: 12px; color: #bbb; }
  .vs-now-title { font-size: 17px; font-weight: 700; }
  .vs-icon {
    background: none; border: 0; color: #fff; cursor: pointer;
    width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center;
    border-radius: 50%; transition: transform .15s ease, background .2s ease;
  }
  .vs-icon:hover { background: rgba(255,255,255,.1); transform: scale(1.08); }
  .vs-bigplay {
    position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
    width: 84px; height: 84px; border-radius: 50%; border: 0; cursor: pointer;
    background: rgba(0,0,0,.5); color: #fff;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 0 2px rgba(255,255,255,.85);
  }
  .vs-bottom {
    position: absolute; left: 0; right: 0; bottom: 0;
    padding: 46px 14px max(12px, env(safe-area-inset-bottom));
    background: linear-gradient(transparent, rgba(0,0,0,.85));
  }
  .vs-bar { position: relative; height: 18px; cursor: pointer; margin: 0 6px 4px; }
  .vs-bar::before, .vs-bar-buf, .vs-bar-fill {
    content: ''; position: absolute; left: 0; top: 7px; height: 4px; border-radius: 2px;
  }
  .vs-bar::before { right: 0; background: rgba(255,255,255,.25); }
  .vs-bar-buf { background: rgba(255,255,255,.4); }
  .vs-bar-fill { background: #e50914; }
  .vs-bar-knob {
    position: absolute; top: 2px; width: 14px; height: 14px; margin-left: -7px;
    border-radius: 50%; background: #e50914; box-shadow: 0 0 6px rgba(0,0,0,.6);
  }
  .vs-row { display: flex; align-items: center; gap: 2px; }
  .vs-time { font-size: 13px; color: #ddd; margin-left: 6px; font-variant-numeric: tabular-nums; }
  .vs-spacer { flex: 1; }
  .vs-row-title { font-size: 14px; font-weight: 700; color: #eee; white-space: nowrap; }
  @media (max-width: 520px) { .vs-row-title { display: none; } }

  .vs-endcard {
    position: absolute; right: 16px; bottom: 96px; left: 16px;
    margin-left: auto; max-width: 340px;
    padding: 16px; border-radius: 8px;
    background: rgba(20,20,20,.88); box-shadow: 0 10px 30px rgba(0,0,0,.6);
    animation: vsRise .5s ease both;
  }
  .vs-end-label { margin: 0; font-size: 12px; letter-spacing: .1em; text-transform: uppercase; color: #aaa; }
  .vs-end-title { margin: 4px 0 12px; font-size: 18px; font-weight: 700; }
  .vs-end-buttons { display: flex; gap: 8px; flex-wrap: wrap; }
  .vs-end-buttons .vs-btn { font-size: 15px; padding: 8px 16px 8px 12px; }

  @keyframes vsKen { from { transform: scale(1.04) } to { transform: scale(1.14) translateY(-2%) } }
  @keyframes vsRise { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
`
