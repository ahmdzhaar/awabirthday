'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

const TITLE = 'Happy 19th birthday, cintaku.'

const BODY = `nda terasa sekarang kamu sudah resmi menginjak usia 19 tahun. Dan nggak terasa juga, perjalanan kita sudah berjalan hampir dua tahun lamanya. Waktu rasanya berputar begitu cepat, tapi setiap momen, cerita, dan tawa yang kita bagi, meski sering kali hanya lewat vc dan telpon namun selalu terasa luar biasa berharga buat aku. Terima kasih sudah menjadi sosok yang begitu luar biasa, rumah paling nyaman saat duniaku sedang ramai, dan seseorang yang kehadirannya selalu berhasil menenangkan pikiranku.

Aku tahu betul rasanya menjalani hubungan jarak jauh ini nggak selalu mudah. Ada rindu yang harus ditahan, dan kesibukan kuliahmu yang menguras banyak tenaga serta pikiran. Tapi melihat kegigihan dan semangatmu mengejar mimpi di bangku kuliah bikin aku sangat bangga punya kamu. Jarak yang membentang di antara kita justru makin membuktikan betapa kuatnya rasa ini, dan betapa berartinya kamu di setiap langkah hidupku.

Di babak baru umur 19 ini, doaku selalu menyertai setiap langkahmu. Semoga perkuliahanmu diberi kelancaran, tugas-tugas, laprak dan ujianmu dimudahkan, serta semua hal baik yang selama ini kamu perjuangkan bisa tercapai satu per satu. Tetap jaga kesehatan dan jangan terlalu keras pada dirimu sendiri saat lelah ya. Ingat, sejauh apa pun jaraknya, hatiku selalu ada di sampingmu untuk mendukung dan mendengar semua ceritamu.

Tetaplah jadi pribadi yang menggemaskan, berhati lembut, dan ceria seperti yang selalu aku kenal. ayo terus jaga komitmen ini, berproses bareng, dan menanti hari di mana kita nggak perlu lagi berjarak. Selamat ulang tahun yang ke-19, sayangku. Aku sayang kamu selalu, hari ini dan seterusnya.`

const FULL = `${TITLE}\n\n${BODY}`
const TITLE_END = TITLE.length

// Batas ukuran huruf isi surat (px) saat dicocokkan ke layar
const FS_MIN = 9
const FS_MAX = 21

// Jeda per karakter: lebih lama di tanda baca supaya terasa seperti sedang menulis
function delayFor(ch) {
  if (ch === '\n') return 380
  if (ch === '.' || ch === '!' || ch === '?') return 260
  if (ch === ',') return 140
  return 26 + Math.random() * 22
}

function Letter({ title, body, typingTitle, done, showPen }) {
  return (
    <>
      <h1 className="lt-title">
        {title}
        {showPen && typingTitle && <span className="lt-pen" />}
      </h1>
      <div className="lt-body">
        {body.split('\n\n').map((para, i, arr) => (
          <p key={i}>
            {para}
            {showPen && !typingTitle && !done && i === arr.length - 1 && <span className="lt-pen" />}
          </p>
        ))}
      </div>
      {done && <p className="lt-sign">dari abang tercinta ♥</p>}
    </>
  )
}

export default function LetterScene({ onDone }) {
  const [count, setCount] = useState(0)
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [fontSize, setFontSize] = useState(null)
  const paperRef = useRef(null)
  const measureRef = useRef(null)
  const timerRef = useRef(null)
  const done = count >= FULL.length

  // Cari ukuran huruf terbesar yang membuat seluruh surat muat satu layar tanpa scroll.
  // Diukur dari salinan tersembunyi berisi teks lengkap, jadi tata letak tidak bergeser saat mengetik.
  const fit = useCallback(() => {
    const paper = paperRef.current
    const m = measureRef.current
    if (!paper || !m) return
    const avail = paper.clientHeight
    let lo = FS_MIN, hi = FS_MAX
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2
      m.style.setProperty('--fs', mid + 'px')
      if (m.scrollHeight <= avail) lo = mid
      else hi = mid
    }
    m.style.removeProperty('--fs')
    setFontSize(Math.floor(lo * 10) / 10)
  }, [])

  useLayoutEffect(() => {
    fit()
    const ro = new ResizeObserver(fit)
    if (paperRef.current) ro.observe(paperRef.current)
    document.fonts?.ready.then(fit)
    return () => ro.disconnect()
  }, [fit])

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  // Mesin ketik
  useEffect(() => {
    if (!visible || done) return
    timerRef.current = setTimeout(() => setCount(c => c + 1),
      count === 0 ? 900 : delayFor(FULL[count - 1]))
    return () => clearTimeout(timerRef.current)
  }, [visible, count, done])

  const finish = () => {
    if (done) return
    clearTimeout(timerRef.current)
    setCount(FULL.length)
  }

  const next = () => {
    if (leaving) return
    setLeaving(true)
    setTimeout(() => onDone?.(), 700)
  }

  const title = FULL.slice(0, Math.min(count, TITLE_END))
  const body = count > TITLE_END ? FULL.slice(TITLE_END, count).replace(/^\n+/, '') : ''
  const typingTitle = count <= TITLE_END

  return (
    <div className="scene" style={{
      zIndex: 10, display: 'flex', flexDirection: 'column',
      justifyContent: 'center', alignItems: 'center',
      height: '100dvh', padding: '20px 16px 8px', boxSizing: 'border-box',
      opacity: visible && !leaving ? 1 : 0,
      transition: 'opacity .7s ease',
    }}>
      <style>{CSS}</style>

      <div
        className="lt-paper"
        ref={paperRef}
        onClick={finish}
        style={{ '--fs': fontSize ? `${fontSize}px` : undefined, visibility: fontSize ? 'visible' : 'hidden' }}
      >
        <div className="lt-text">
          <Letter title={title} body={body} typingTitle={typingTitle} done={done} showPen />
        </div>
        <div className="lt-text lt-measure" ref={measureRef} aria-hidden="true">
          <Letter title={TITLE} body={BODY} typingTitle={false} done showPen={false} />
        </div>
      </div>

      <div className="lt-actions">
        {done ? (
          <button className="lt-next" onClick={next}>Lanjut ♥</button>
        ) : (
          <p className="lt-hint">ketuk tulisan untuk menampilkan semuanya</p>
        )}
      </div>
    </div>
  )
}

const CSS = `
  .lt-paper {
    --fs: 16px;
    position: relative;
    flex: 1 1 auto; min-height: 0;
    width: min(760px, 100%);
    max-height: 820px;
    overflow: hidden;
    animation: ltIn .9s cubic-bezier(.2,.8,.2,1) both;
    cursor: text;
  }
  .lt-text { position: absolute; left: 0; right: 0; top: 0; }
  .lt-measure { visibility: hidden; pointer-events: none; }
  .lt-title {
    margin: 0 0 .9em; padding: 0 44px; /* ruang untuk tombol musik di pojok */
    font-family: 'Special Elite', 'Courier Prime', 'Courier New', monospace; font-weight: 400;
    font-size: min(calc(var(--fs) * 1.6), 34px); line-height: 1.25;
    color: #fff; text-align: center;
    text-shadow: 0 2px 12px rgba(0,0,0,.7);
  }
  .lt-body p {
    margin: 0 0 .75em;
    font-family: 'Courier Prime', 'Courier New', monospace; font-weight: 400;
    font-size: var(--fs); line-height: 1.6; letter-spacing: -.01em;
    color: rgba(255,255,255,.94);
    text-indent: 2.5em;
    text-shadow: 0 1px 8px rgba(0,0,0,.85);
    white-space: pre-wrap;
  }
  .lt-sign {
    margin: .2em 0 0; text-align: right;
    font-family: 'Special Elite', 'Courier Prime', monospace;
    font-size: calc(var(--fs) * 1.1); color: #fff;
    text-shadow: 0 1px 8px rgba(0,0,0,.85);
    animation: ltFade .8s ease both;
  }
  .lt-pen {
    display: inline-block; width: .55em; height: 2px; margin-left: 2px;
    vertical-align: -.15em; background: #fff;
    animation: ltBlink .8s steps(1) infinite;
  }
  .lt-actions { flex: none; min-height: 56px; display: flex; align-items: center; justify-content: center; margin-top: 10px; }
  .lt-hint {
    margin: 0; color: rgba(255,255,255,.6);
    font-family: 'Courier Prime', monospace; font-size: 13px; letter-spacing: .04em;
    animation: ltPulse 2.2s ease-in-out infinite;
  }
  .lt-next {
    border: 0; cursor: pointer;
    padding: 12px 34px; border-radius: 999px;
    font-family: 'Dancing Script', cursive; font-size: 22px; font-weight: 700;
    color: #fff; background: linear-gradient(135deg, #ff5fa2, #c2185b);
    box-shadow: 0 8px 24px rgba(255,64,140,.45);
    animation: ltFade .6s ease both;
  }
  @keyframes ltIn { from { opacity: 0; transform: translateY(18px) } to { opacity: 1; transform: none } }
  @keyframes ltFade { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
  @keyframes ltBlink { 50% { opacity: 0 } }
  @keyframes ltPulse { 0%,100% { opacity: .5 } 50% { opacity: 1 } }
`
