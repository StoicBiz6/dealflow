import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'

export default function ModeSelectorPage() {
  const { user } = useUser()
  const navigate = useNavigate()
  const [selected, setSelected] = useState(null)

  const firstName = user?.firstName || 'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  function proceed() {
    if (!selected) return
    navigate(selected === 'raise' ? '/' : '/sell/dashboard')
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.wordmark}>DEALFLOW</div>
      <div style={styles.greeting}>{greeting}, {firstName}.</div>
      <div style={styles.sub}>Which platform would you like to open?</div>

      <div style={styles.cards}>
        <button
          style={{ ...styles.card, ...(selected === 'raise' ? styles.cardSelectedRaise : {}) }}
          onClick={() => setSelected('raise')}
        >
          {selected === 'raise' && <div style={styles.check}>✓</div>}
          <div style={{ ...styles.iconWrap, background: '#0d1f35' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 14L7.5 9L10.5 12L14 7L17 10" stroke="#6aabf7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="17" cy="10" r="1.5" fill="#6aabf7"/>
            </svg>
          </div>
          <div style={styles.cardName}>Capital Raise</div>
          <div style={styles.cardDesc}>Track LP relationships, manage your investor pipeline, and monitor fund close progress.</div>
          <div style={styles.tagRow}>
            <span style={styles.tag}>LP pipeline</span>
            <span style={styles.tag}>Soft circles</span>
            <span style={styles.tag}>Commitments</span>
          </div>
        </button>

        <button
          style={{ ...styles.card, ...(selected === 'sell' ? styles.cardSelectedSell : {}) }}
          onClick={() => setSelected('sell')}
        >
          {selected === 'sell' && <div style={{ ...styles.check, background: '#3B6D11' }}>✓</div>}
          <div style={{ ...styles.iconWrap, background: '#0d2014' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="5" width="14" height="10" rx="1.5" stroke="#7bc75e" strokeWidth="1.5"/>
              <path d="M7 9H13M7 12H11" stroke="#7bc75e" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div style={styles.cardName}>Sell Side</div>
          <div style={styles.cardDesc}>Run structured M&A sale processes, manage buyer universes, and track bids to close.</div>
          <div style={styles.tagRow}>
            <span style={styles.tag}>Buyer universe</span>
            <span style={styles.tag}>Bid tracking</span>
            <span style={styles.tag}>Data room</span>
          </div>
        </button>
      </div>

      <button
        style={{ ...styles.cta, ...(selected ? styles.ctaReady : {}) }}
        onClick={proceed}
        disabled={!selected}
      >
        {selected === 'raise' ? 'Open Capital Raise' : selected === 'sell' ? 'Open Sell Side' : 'Select a platform'}
      </button>
    </div>
  )
}

const styles = {
  wrap: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1.5rem',
    background: '#0f0f0f',
    fontFamily: 'inherit',
  },
  wordmark: {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.22em',
    color: '#555',
    marginBottom: '2.5rem',
  },
  greeting: {
    fontSize: 22,
    fontWeight: 500,
    color: '#f0f0f0',
    marginBottom: 6,
  },
  sub: {
    fontSize: 14,
    color: '#888',
    marginBottom: '2.5rem',
  },
  cards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 12,
    width: '100%',
    maxWidth: 560,
    marginBottom: '2rem',
  },
  card: {
    position: 'relative',
    background: '#1a1a1a',
    border: '0.5px solid rgba(255,255,255,0.11)',
    borderRadius: 12,
    padding: '1.75rem 1.5rem',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    textAlign: 'left',
    transition: 'border-color 0.15s',
    fontFamily: 'inherit',
  },
  cardSelectedRaise: {
    border: '1.5px solid #185FA5',
    background: '#0d1f35',
  },
  cardSelectedSell: {
    border: '1.5px solid #3B6D11',
    background: '#0d2014',
  },
  check: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 18,
    height: 18,
    borderRadius: '50%',
    background: '#185FA5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    color: '#fff',
    fontWeight: 700,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: {
    fontSize: 15,
    fontWeight: 500,
    color: '#f0f0f0',
  },
  cardDesc: {
    fontSize: 12,
    color: '#888',
    lineHeight: 1.6,
  },
  tagRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 5,
  },
  tag: {
    fontSize: 10,
    padding: '2px 8px',
    borderRadius: 99,
    border: '0.5px solid rgba(255,255,255,0.11)',
    color: '#555',
  },
  cta: {
    width: '100%',
    maxWidth: 560,
    padding: 13,
    borderRadius: 8,
    border: 'none',
    background: '#2a2a2a',
    color: '#555',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'not-allowed',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  },
  ctaReady: {
    background: '#f0f0f0',
    color: '#0f0f0f',
    cursor: 'pointer',
  },
}
