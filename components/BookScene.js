'use client'

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import HTMLFlipBook from 'react-pageflip'

// Halaman isi hasil render dari PDF photobook (rasio 4:5)
const PHOTO_COUNT = 18
const PHOTO_PAGES = Array.from({ length: PHOTO_COUNT }, (_, i) =>
  `/photobook/${String(i + 1).padStart(2, '0')}.webp`)
const COVER_INSET = '/photobook/cover-inset.webp'

// Sampul depan + 18 halaman isi + sampul belakang = 20 (genap), sehingga
// spread-nya berisi halaman PDF (1,2) (3,4) ... (17,18) seperti pasangan di PDF.
const PAGES = [
  { type: 'cover' },
  ...PHOTO_PAGES.map(src => ({ type: 'content', src })),
  { type: 'back' },
]
const TOTAL = PAGES.length

const RATIO = 1.25        // tinggi / lebar halaman
const PAD = 0.045         // tebal sampul (case) di sekeliling halaman, relatif ke lebar halaman
const STACK = 0.03        // tebal maksimum tumpukan kertas

const isTouchDevice = () => window.matchMedia('(pointer: coarse)').matches

// Masuk layar penuh + kunci orientasi landscape (Android). iOS tidak mendukung,
// jadi pemanggil jatuh ke mode putar CSS.
async function tryLockLandscape() {
  const attempt = (async () => {
    try {
      const el = document.documentElement
      if (!document.fullscreenElement && el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' })
      await screen.orientation?.lock?.('landscape')
    } catch (e) {}
  })()
  // Di sebagian browser janji lock() tak pernah selesai; jangan sampai buku ikut menunggu
  await Promise.race([attempt, new Promise(r => setTimeout(r, 900))])
}

function releaseLandscape() {
  try { screen.orientation?.unlock?.() } catch (e) {}
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
}

// Selalu tampil sebagai buku terbuka dua halaman, di HP sekalipun.
// forced = pembaca meminta mode menyamping; kalau layar masih tegak, isi scene diputar 90°.
function computeLayout(forced) {
  const rotated = forced && window.innerWidth < window.innerHeight
  const vw = rotated ? window.innerHeight : window.innerWidth
  const vh = rotated ? window.innerWidth : window.innerHeight
  const availW = vw - (vw < 600 ? 10 : 24)
  // Sisakan ruang untuk teks petunjuk (+ tombol putar di perangkat sentuh)
  const availH = vh * (forced ? 0.9 : 0.8) - (isTouchDevice() ? 86 : 40)
  const raw = Math.min(availW / (2 + PAD * 2 + STACK * 2), availH / (RATIO + PAD * 2), 520)

  const w = Math.max(100, Math.floor(raw))
  const h = Math.floor(w * RATIO)
  const pad = Math.round(w * PAD)
  const stack = Math.max(2, Math.round(w * STACK))
  return {
    rotated, vw, vh,
    w, h, pad, stack,
    outerW: pad * 2 + stack * 2 + w * 2,
    outerH: h + pad * 2,
    bookLeft: pad + stack,
  }
}

const Page = forwardRef(function Page({ page, index }, ref) {
  const hard = page.type !== 'content'
  // Halaman ganjil ada di kiri spread (jilid di sisi kanannya)
  const gutter = index % 2 === 1 ? 'r' : 'l'

  return (
    <div ref={ref} data-density={hard ? 'hard' : 'soft'} className={`pb-page${hard ? ' pb-hard' : ''}`}>
      {page.type === 'cover' && (
        <div className="pb-cloth pb-cover">
          <span className="pb-hinge pb-hinge-l" />
          <div className="pb-foil">
            <p className="pb-cover-kicker">Happy Birthday</p>
            <div className="pb-cover-photo">
              <img src={COVER_INSET} alt="" draggable={false} />
            </div>
            <p className="pb-cover-name">Putri Nazwa</p>
            <p className="pb-cover-sub">the 19th chapter</p>
          </div>
        </div>
      )}

      {page.type === 'back' && (
        <div className="pb-cloth pb-backcover">
          <span className="pb-hinge pb-hinge-r" />
          <div className="pb-foil pb-foil-back">
            <p className="pb-back-heart">♥</p>
            <p className="pb-back-text">with all my love</p>
          </div>
        </div>
      )}

      {page.type === 'content' && (
        <>
          <img src={page.src} alt={`Halaman ${index}`} draggable={false}
            decoding="async" className="pb-img" />
          <span className={`pb-paper pb-gutter-${gutter}`} />
        </>
      )}
    </div>
  )
})

function preload(src) {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = img.onerror = () => resolve()
    img.src = src
    img.decode?.().then(resolve, resolve)
  })
}

export default function BookScene({ onDone }) {
  const bookRef = useRef(null)
  const doneRef = useRef(false)
  const [layout, setLayout] = useState(null)
  const [ready, setReady] = useState(false)
  const [page, setPage] = useState(0)
  const [busy, setBusy] = useState(false)
  const [tapped, setTapped] = useState(false)
  const [forced, setForced] = useState(false)
  const forcingRef = useRef(false)
  const pageRef = useRef(0)
  const swipeRef = useRef(null)
  const flipAreaRef = useRef(null)

  useEffect(() => {
    setLayout(computeLayout(forced))
    // Hanya bereaksi pada perubahan lebar/orientasi; perubahan tinggi akibat
    // address bar HP yang muncul-hilang saat menggeser tidak boleh me-reset buku.
    let lastW = window.innerWidth
    let lastLandscape = window.innerWidth > window.innerHeight
    const onResize = () => {
      const landscape = window.innerWidth > window.innerHeight
      if (window.innerWidth === lastW && landscape === lastLandscape) return
      lastW = window.innerWidth
      lastLandscape = landscape
      setLayout(computeLayout(forced))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [forced])

  // Kembalikan orientasi & keluar layar penuh saat meninggalkan photobook
  useEffect(() => () => { if (forcingRef.current) releaseLandscape() }, [])

  // Tombol putar hanya untuk perangkat layar sentuh (HP/tablet)
  const [touch, setTouch] = useState(false)
  useEffect(() => { setTouch(isTouchDevice()) }, [])

  // Tombol putar: masuk/keluar mode menyamping. Kalau layar masih tegak, isi scene diputar CSS.
  const toggleLandscape = async (e) => {
    e.stopPropagation()
    if (forced) {
      forcingRef.current = false
      releaseLandscape()
      setForced(false)
      return
    }
    forcingRef.current = true
    await tryLockLandscape()
    setForced(true)
  }

  // Saat isi scene diputar CSS, koordinat sentuhan react-pageflip jadi salah,
  // jadi ketuk & geser ditangani sendiri. Sumbu-x buku = sumbu-y layar.
  const onRotPointerDown = (e) => {
    swipeRef.current = e.target.closest('.pb-rotate') ? null : { y: e.clientY, t: Date.now() }
  }
  const onRotPointerUp = (e) => {
    const start = swipeRef.current
    swipeRef.current = null
    const flip = bookRef.current?.pageFlip()
    if (!start || !flip || busy) return
    const dy = e.clientY - start.y
    if (Math.abs(dy) > 30) {
      if (dy < 0) flip.flipNext()
      else if (pageRef.current > 0) flip.flipPrev()
      return
    }
    if (pageRef.current >= TOTAL - 1) return // sampul belakang ditangani handleBackTap
    if (pageRef.current === 0) { flip.flipNext(); return }
    const r = flipAreaRef.current?.getBoundingClientRect()
    if (!r) return
    const f = (e.clientY - r.top) / r.height
    if (f >= 0.5) flip.flipNext()
    else flip.flipPrev()
  }

  // Muat semua halaman di depan supaya halaman berikutnya sudah siap saat digeser
  useEffect(() => {
    let alive = true
    const all = Promise.all([COVER_INSET, ...PHOTO_PAGES].map(preload))
    const timeout = new Promise(r => setTimeout(r, 5000))
    Promise.race([all, timeout]).then(() => alive && setReady(true))
    return () => { alive = false }
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      const flip = bookRef.current?.pageFlip()
      if (!flip) return
      if (e.key === 'ArrowRight') flip.flipNext()
      if (e.key === 'ArrowLeft') flip.flipPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleFlip = useCallback((e) => { pageRef.current = e.data; setPage(e.data) }, [])
  const handleState = useCallback((e) => setBusy(e.data !== 'read'), [])

  // Children harus stabil: react-pageflip memuat ulang semua halaman
  // setiap kali children berubah, yang membuat animasi balik halaman rusak.
  const pages = useMemo(() => PAGES.map((p, i) => (
    <Page key={i} page={p} index={i} />
  )), [])

  const isCover = page === 0
  const isEnd = page >= TOTAL - 1
  const isOpen = !isCover && !isEnd

  const handleBackTap = () => {
    if (!isEnd || tapped) return
    setTapped(true)
    if (!doneRef.current) {
      doneRef.current = true
      setTimeout(() => onDone?.(), 900)
    }
  }

  if (!layout) return null
  const { rotated, vw, vh, w, h, pad, stack, outerW, outerH, bookLeft } = layout

  // Buku tertutup digeser supaya sampulnya berada di tengah
  const shift = isCover ? -w / 2 : isEnd ? w / 2 : 0
  const progress = (page) / (TOTAL - 1)
  const leftStack = isOpen ? Math.max(2, Math.round(stack * progress)) : 0
  const rightStack = isOpen ? Math.max(2, Math.round(stack * (1 - progress))) : 0

  return (
    <>
      <style>{CSS}</style>

      <div className="scene" style={{ zIndex: 10 }}>
      <div
        className={`pb-frame${rotated ? ' is-rotated' : ''}`}
        style={rotated ? { width: vw, height: vh } : undefined}
        onPointerDown={rotated ? onRotPointerDown : undefined}
        onPointerUp={rotated ? onRotPointerUp : undefined}
      >
        <div style={{
          opacity: ready ? 1 : 0,
          transition: 'opacity 500ms ease-out',
          animation: ready && isCover && !busy ? 'pbFloat 3.5s ease-in-out infinite' : 'none',
        }}>
          <div className="pb-stage" style={{
            '--pw': `${w}px`,
            width: outerW, height: outerH,
            transform: `translateX(${shift}px)`,
          }}>
            {/* Sampul keras di belakang halaman (terlihat saat buku terbuka) */}
            <div className={`pb-cloth pb-case ${isOpen ? 'is-open' : ''}`}>
              <span className="pb-spine-crease" style={{ left: bookLeft + w }} />
            </div>

            {/* Tebal tumpukan kertas di tepi kiri & kanan */}
            <span className="pb-stack pb-stack-l" style={{
              top: pad + 3, height: h - 6,
              left: bookLeft - leftStack, width: leftStack,
            }} />
            <span className="pb-stack pb-stack-r" style={{
              top: pad + 3, height: h - 6,
              left: bookLeft + w * 2, width: rightStack,
            }} />

            <div ref={flipAreaRef} style={{ position: 'absolute', left: bookLeft, top: pad, width: w * 2, height: h }}>
              <HTMLFlipBook
                key={`${w}-${rotated}`}
                ref={bookRef}
                startPage={pageRef.current}
                useMouseEvents={!rotated}
                width={w}
                height={h}
                size="fixed"
                showCover
                usePortrait={false}
                mobileScrollSupport={false}
                drawShadow
                maxShadowOpacity={0.45}
                flippingTime={850}
                swipeDistance={20}
                startZIndex={2}
                onFlip={handleFlip}
                onChangeState={handleState}
              >
                {pages}
              </HTMLFlipBook>

              {isEnd && (
                <div onClick={handleBackTap} style={{
                  position: 'absolute', top: 0, bottom: 0, left: 0, width: w,
                  zIndex: 30, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {tapped && <div className="pb-tap-frame" />}
                  {tapped && ['❤️', '💕', '💗', '💖', '✨'].map((em, i) => (
                    <div key={i} style={{
                      position: 'absolute', fontSize: '1.6rem', pointerEvents: 'none',
                      animation: `heartBurst${i} 1.2s ease-out forwards`,
                    }}>{em}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="pb-hint">
          {!ready ? 'menyiapkan photobook...'
            : isCover ? 'geser atau ketuk sisi kanan buku untuk membuka...'
            : isEnd ? (tapped ? '' : 'ketuk buku untuk melanjutkan ♥')
            : `${page}–${page + 1} / ${TOTAL - 2}`}
        </p>

        {touch && ready && (
          <button
            type="button"
            className={`pb-rotate${forced ? ' is-on' : ''}`}
            onClick={toggleLandscape}
            aria-label={forced ? 'Kembalikan ke tampilan tegak' : 'Putar ke tampilan menyamping'}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <rect x="7" y="2.5" width="10" height="19" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8"
                transform={forced ? undefined : 'rotate(90 12 12)'} />
              <path d="M19.5 8.5a8 8 0 0 0-5-5M14.5 3.5l.2 2.6M14.5 3.5l2.5-.6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            {forced ? 'Tampilan tegak' : 'Putar layar'}
          </button>
        )}
      </div>
      </div>
    </>
  )
}

const CSS = `
  .pb-frame {
    width: 100%; height: 100dvh;
    display: flex; flex-direction: column;
    justify-content: center; align-items: center; gap: 16px;
  }
  /* Layar HP masih tegak: putar isi 90° searah jarum jam supaya dibaca dengan HP dimiringkan */
  .pb-frame.is-rotated {
    position: fixed; left: 50%; top: 50%;
    gap: 10px;
    transform: translate(-50%, -50%) rotate(90deg);
    animation: pbRotIn .5s ease both;
    touch-action: none;
  }
  @keyframes pbRotIn {
    from { opacity: 0; transform: translate(-50%, -50%) rotate(90deg) scale(.92) }
    to   { opacity: 1; transform: translate(-50%, -50%) rotate(90deg) scale(1) }
  }

  .pb-stage {
    position: relative;
    transition: transform 750ms cubic-bezier(.25,.8,.25,1);
    touch-action: none;
  }

  /* Kain sampul */
  .pb-cloth {
    background-color: #5b1a33;
    background-image:
      repeating-linear-gradient(45deg, rgba(255,255,255,.025) 0 1px, transparent 1px 3px),
      repeating-linear-gradient(-45deg, rgba(0,0,0,.06) 0 1px, transparent 1px 3px),
      radial-gradient(120% 90% at 30% 20%, #7a2645 0%, #5b1a33 55%, #3d0f22 100%);
  }
  .pb-case {
    position: absolute; inset: 0;
    border-radius: calc(var(--pw) * .02);
    box-shadow:
      0 calc(var(--pw) * .06) calc(var(--pw) * .12) rgba(0,0,0,.55),
      0 2px 6px rgba(0,0,0,.4),
      inset 0 0 0 1px rgba(255,255,255,.07),
      inset 0 0 calc(var(--pw) * .05) rgba(0,0,0,.45);
    opacity: 0; transform: scale(.985);
    transition: opacity 450ms ease, transform 450ms ease;
  }
  .pb-case.is-open { opacity: 1; transform: scale(1); }
  .pb-spine-crease {
    position: absolute; top: 0; bottom: 0;
    width: calc(var(--pw) * .09); transform: translateX(-50%);
    background: linear-gradient(90deg, transparent, rgba(0,0,0,.45) 40%, rgba(255,255,255,.06) 50%, rgba(0,0,0,.45) 60%, transparent);
  }

  /* Tumpukan kertas */
  .pb-stack {
    position: absolute; z-index: 1;
    background: repeating-linear-gradient(90deg, #f3eee4 0 1px, #cfc6b6 1px 2px);
    box-shadow: 0 1px 2px rgba(0,0,0,.35);
    transition: width 600ms ease, left 600ms ease;
  }
  .pb-stack-l { border-radius: 2px 0 0 2px; }
  .pb-stack-r { border-radius: 0 2px 2px 0; }

  /* Halaman */
  .pb-page { background: #f4f2ee; overflow: hidden; }
  .pb-page.pb-hard { background: transparent; }

  .pb-img {
    position: absolute; inset: 0;
    width: 100%; height: 100%; object-fit: cover; display: block;
    user-select: none; pointer-events: none;
  }
  .pb-paper { position: absolute; inset: 0; pointer-events: none; }
  .pb-gutter-l {
    background:
      linear-gradient(90deg, rgba(0,0,0,.28) 0%, rgba(0,0,0,.08) 4%, transparent 11%),
      linear-gradient(270deg, rgba(0,0,0,.06), transparent 3%);
  }
  .pb-gutter-r {
    background:
      linear-gradient(270deg, rgba(0,0,0,.28) 0%, rgba(0,0,0,.08) 4%, transparent 11%),
      linear-gradient(90deg, rgba(0,0,0,.06), transparent 3%);
  }

  /* Sampul depan & belakang */
  .pb-cover, .pb-backcover {
    position: absolute; inset: 0;
    border-radius: 0 calc(var(--pw) * .02) calc(var(--pw) * .02) 0;
    box-shadow: inset 0 0 calc(var(--pw) * .06) rgba(0,0,0,.5);
  }
  .pb-backcover { border-radius: calc(var(--pw) * .02) 0 0 calc(var(--pw) * .02); }
  .pb-hinge {
    position: absolute; top: 0; bottom: 0; width: calc(var(--pw) * .025);
  }
  .pb-hinge-l {
    left: calc(var(--pw) * .055);
    background: linear-gradient(90deg, rgba(0,0,0,.35), rgba(255,255,255,.08), rgba(0,0,0,.25));
  }
  .pb-hinge-r {
    right: calc(var(--pw) * .055);
    background: linear-gradient(90deg, rgba(0,0,0,.25), rgba(255,255,255,.08), rgba(0,0,0,.35));
  }
  .pb-foil {
    position: absolute;
    top: calc(var(--pw) * .09); bottom: calc(var(--pw) * .09);
    left: calc(var(--pw) * .14); right: calc(var(--pw) * .08);
    border: 1px solid rgba(232,196,120,.75);
    outline: 1px solid rgba(232,196,120,.35);
    outline-offset: calc(var(--pw) * .012);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: calc(var(--pw) * .035);
    text-align: center;
  }
  .pb-foil-back { left: calc(var(--pw) * .08); right: calc(var(--pw) * .14); }
  .pb-cover-kicker {
    margin: 0;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: calc(var(--pw) * .055);
    letter-spacing: .28em; text-transform: uppercase;
    color: #e8c478;
    text-shadow: 0 1px 0 rgba(0,0,0,.5);
  }
  .pb-cover-photo {
    width: 78%;
    padding: calc(var(--pw) * .018);
    background: #f4f2ee;
    box-shadow: 0 3px 10px rgba(0,0,0,.45), inset 0 0 0 1px rgba(0,0,0,.08);
    transform: rotate(-1.5deg);
  }
  .pb-cover-photo img { display: block; width: 100%; height: auto; pointer-events: none; }
  .pb-cover-name {
    margin: 0;
    font-family: 'Dancing Script', cursive;
    font-size: calc(var(--pw) * .12);
    line-height: 1;
    color: #f0d08c;
    text-shadow: 0 1px 0 rgba(0,0,0,.55), 0 0 18px rgba(240,208,140,.25);
  }
  .pb-cover-sub, .pb-back-text {
    margin: 0;
    font-family: Georgia, 'Times New Roman', serif; font-style: italic;
    font-size: calc(var(--pw) * .04);
    color: rgba(232,196,120,.8);
  }
  .pb-back-heart { margin: 0; font-size: calc(var(--pw) * .1); color: #e8c478; line-height: 1; }

  .pb-tap-frame {
    position: absolute; inset: 0; pointer-events: none;
    border: 3px solid #ff69b4;
    box-shadow: 0 0 30px rgba(255,105,180,.8), inset 0 0 30px rgba(255,105,180,.3);
    animation: pbFrameIn .5s cubic-bezier(.34,1.56,.64,1) forwards;
  }
  .pb-rotate {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 16px; border-radius: 999px; cursor: pointer;
    border: 1px solid rgba(255,182,217,.55);
    background: rgba(255,20,147,.14); color: #ffd1e6;
    font-family: Georgia, 'Times New Roman', serif; font-size: 13px; letter-spacing: .03em;
    backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
    transition: background .2s ease, transform .15s ease;
  }
  .pb-rotate:active { transform: scale(.96); }
  .pb-rotate.is-on { background: rgba(255,255,255,.1); border-color: rgba(255,255,255,.35); color: #fff; }
  .pb-hint {
    margin: 0; min-height: 20px;
    color: rgba(255,182,217,.85);
    font-family: 'Dancing Script', cursive; font-size: 16px;
    animation: pbHint 2.2s ease-in-out infinite;
    pointer-events: none; text-align: center; padding: 0 16px;
  }

  @keyframes pbFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
  @keyframes pbHint { 0%,100% { opacity: .5 } 50% { opacity: 1 } }
  @keyframes pbFrameIn { 0% { opacity: 0; transform: scale(.92) } 100% { opacity: 1; transform: scale(1) } }
  @keyframes heartBurst0 { 0%{transform:translate(0,0) scale(1);opacity:1} 100%{transform:translate(-60px,-80px) scale(0.3);opacity:0} }
  @keyframes heartBurst1 { 0%{transform:translate(0,0) scale(1);opacity:1} 100%{transform:translate(60px,-80px) scale(0.3);opacity:0} }
  @keyframes heartBurst2 { 0%{transform:translate(0,0) scale(1);opacity:1} 100%{transform:translate(-80px,20px) scale(0.3);opacity:0} }
  @keyframes heartBurst3 { 0%{transform:translate(0,0) scale(1);opacity:1} 100%{transform:translate(80px,20px) scale(0.3);opacity:0} }
  @keyframes heartBurst4 { 0%{transform:translate(0,0) scale(1);opacity:1} 100%{transform:translate(0px,-100px) scale(0.3);opacity:0} }
`
