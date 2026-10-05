'use client'

export default function MusicBtn({ playing, onToggle }) {
  return (
    <div
      id="music-btn"
      onClick={onToggle}
      className={playing ? 'playing' : ''}
      style={{ position: 'fixed', top: 14, right: 14, zIndex: 9999, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,20,147,.15)', border: '1px solid rgba(255,105,180,.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all .3s', backdropFilter: 'blur(10px)' }}
    >
      {playing ? (
        <svg width="16" height="16" fill="#ff69b4" viewBox="0 0 24 24">
          <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
        </svg>
      ) : (
        <svg width="16" height="16" fill="#ff69b4" viewBox="0 0 24 24">
          <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3z"/>
        </svg>
      )}
    </div>
  )
}
