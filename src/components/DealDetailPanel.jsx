import { useState, useEffect, useCallback } from 'react'
import { STAGE_COLORS } from '../lib/constants'
import { formatCurrency } from '../lib/utils'

const s = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 100,
    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
  },
  panel: {
    position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 101,
    width: '480px', background: '#0f0f0f', borderLeft: '1px solid #1f1f1f',
    display: 'flex', flexDirection: 'column', overflowY: 'auto',
  },
  panelClass: 'detail-panel',
  header: {
    padding: '20px 24px', borderBottom: '1px solid #1a1a1a',
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    position: 'sticky', top: 0, background: '#0f0f0f', zIndex: 1,
  },
  section: { padding: '20px 24px', borderBottom: '1px solid #1a1a1a' },
  label: {
    fontSize: '10px', color: '#444', textTransform: 'uppercase',
    letterSpacing: '0.07em', marginBottom: '8px', display: 'block',
  },
  row: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' },
  key: { color: '#555', fontSize: '12px' },
  val: { color: '#ccc', fontSize: '12px', fontWeight: 500 },
  input: {
    background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px',
    color: '#e5e5e5', fontSize: '12px', padding: '7px 10px',
    fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box',
  },
  addBtn: {
    background: 'none', border: '1px dashed #2a2a2a', borderRadius: '6px',
    color: '#555', cursor: 'pointer', fontSize: '12px', padding: '7px 12px',
    width: '100%', textAlign: 'left', fontFamily: 'inherit',
  },
  chip: (active) => ({
    background: active ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
    color: active ? '#4ade80' : '#f87171',
    border: `1px solid ${active ? '#166534' : '#991b1b'}`,
    borderRadius: '4px', fontSize: '10px', padding: '2px 8px', cursor: 'pointer',
    fontFamily: 'inherit',
  }),
  iconBtn: {
    background: 'none', border: 'none', color: '#333', cursor: 'pointer',
    fontSize: '14px', padding: '2px 6px', borderRadius: '4px',
  },
  aiBtn: {
    background: 'rgba(124,106,247,0.1)', border: '1px solid #4a3fa0',
    color: '#9d8fff', borderRadius: '6px', padding: '6px 14px',
    cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit',
  },
}

function BuyerRow({ buyer, onChange, onRemove }) {
  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
      <input
        style={{ ...s.input, flex: 1 }}
        value={buyer.name}
        onChange={e => onChange({ ...buyer, name: e.target.value })}
        placeholder="Buyer name"
      />
      <button style={s.chip(buyer.status === 'Active')} onClick={() => onChange({ ...buyer, status: buyer.status === 'Active' ? 'Passed' : 'Active' })}>
        {buyer.status}
      </button>
      <button style={s.iconBtn} onClick={onRemove} onMouseEnter={e => e.currentTarget.style.color = '#f87171'} onMouseLeave={e => e.currentTarget.style.color = '#333'}>×</button>
    </div>
  )
}

function ContactRow({ contact, onChange, onRemove }) {
  return (
    <div style={{ background: '#141414', border: '1px solid #1f1f1f', borderRadius: '8px', padding: '12px', marginBottom: '8px', position: 'relative' }}>
      <button style={{ ...s.iconBtn, position: 'absolute', top: 8, right: 8 }} onClick={onRemove} onMouseEnter={e => e.currentTarget.style.color = '#f87171'} onMouseLeave={e => e.currentTarget.style.color = '#333'}>×</button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
        <input style={s.input} value={contact.firm} onChange={e => onChange({ ...contact, firm: e.target.value })} placeholder="Firm name" />
        <input style={s.input} value={contact.name} onChange={e => onChange({ ...contact, name: e.target.value })} placeholder="Contact name" />
      </div>
      <input style={{ ...s.input, marginBottom: '8px' }} value={contact.email} onChange={e => onChange({ ...contact, email: e.target.value })} placeholder="email@firm.com" />
      <input style={s.input} value={contact.notes} onChange={e => onChange({ ...contact, notes: e.target.value })} placeholder="Notes..." />
    </div>
  )
}

export default function DealDetailPanel({ deal, onClose, onEdit, onUpdate }) {
  const colors = STAGE_COLORS[deal.stage] || STAGE_COLORS['Sourced']
  const [buyers, setBuyers] = useState(deal.buyers || [])
  const [contacts, setContacts] = useState(deal.contacts || [])
  const [timeline, setTimeline] = useState(deal.timeline_to_close || '')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

  // Auto-save buyers/contacts/timeline when they change
  const save = useCallback((updates) => {
    onUpdate(deal.id, updates)
  }, [deal.id, onUpdate])

  useEffect(() => { save({ buyers }) }, [buyers])
  useEffect(() => { save({ contacts }) }, [contacts])
  useEffect(() => { if (timeline !== (deal.timeline_to_close || '')) save({ timeline_to_close: timeline || null }) }, [timeline])

  const addBuyer = () => setBuyers(b => [...b, { id: crypto.randomUUID(), name: '', status: 'Active' }])
  const updateBuyer = (id, val) => setBuyers(b => b.map(x => x.id === id ? val : x))
  const removeBuyer = (id) => setBuyers(b => b.filter(x => x.id !== id))

  const addContact = () => setContacts(c => [...c, { id: crypto.randomUUID(), firm: '', name: '', email: '', notes: '' }])
  const updateContact = (id, val) => setContacts(c => c.map(x => x.id === id ? val : x))
  const removeContact = (id) => setContacts(c => c.filter(x => x.id !== id))

  const generateContacts = async () => {
    setAiLoading(true)
    setAiError('')
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deal }),
      })
      const data = await res.json()
      if (data.error) { setAiError(data.error); return }
      const withIds = data.contacts.map(c => ({ ...c, id: crypto.randomUUID(), notes: c.notes || '' }))
      setContacts(c => [...c, ...withIds])
    } catch {
      setAiError('Failed to generate contacts.')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <>
      <div style={s.overlay} onClick={onClose} />
      <div style={s.panel} className="detail-panel">
        {/* Header */}
        <div style={s.header}>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '20px', fontWeight: 700, color: '#f0f0f0', marginBottom: '6px' }}>
              {deal.company_name}
            </div>
            <span style={{
              background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
              borderRadius: '4px', padding: '2px 10px', fontSize: '11px',
            }}>
              {deal.stage}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onEdit} style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#aaa', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontSize: '12px', fontFamily: 'inherit' }}>
              Edit
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '0 4px' }}>×</button>
          </div>
        </div>

        {/* Deal Info */}
        <div style={s.section}>
          <span style={s.label}>Deal Info</span>
          {deal.raise_amount && <div style={s.row}><span style={s.key}>Raise</span><span style={s.val}>{formatCurrency(deal.raise_amount)}</span></div>}
          {deal.valuation && <div style={s.row}><span style={s.key}>Valuation</span><span style={s.val}>{formatCurrency(deal.valuation)}</span></div>}
          {deal.sector && <div style={s.row}><span style={s.key}>Sector</span><span style={s.val}>{deal.sector}</span></div>}
          {deal.deal_owner && <div style={s.row}><span style={s.key}>Owner</span><span style={s.val}>{deal.deal_owner}</span></div>}
          {deal.website && <div style={s.row}><span style={s.key}>Website</span><a href={deal.website} target="_blank" rel="noopener noreferrer" style={{ ...s.val, color: '#9d8fff' }}>{deal.website}</a></div>}
          {deal.notes && <div style={{ color: '#555', fontSize: '12px', marginTop: '4px', lineHeight: 1.6 }}>{deal.notes}</div>}

          <div style={{ marginTop: '14px' }}>
            <span style={s.label}>Timeline to Close</span>
            <input
              type="date"
              style={s.input}
              value={timeline}
              onChange={e => setTimeline(e.target.value)}
            />
          </div>
        </div>

        {/* Buyers */}
        <div style={s.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={s.label}>Buyers</span>
            <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#555' }}>
              <span style={{ color: '#4ade80' }}>● {buyers.filter(b => b.status === 'Active').length} Active</span>
              <span style={{ color: '#f87171' }}>● {buyers.filter(b => b.status === 'Passed').length} Passed</span>
            </div>
          </div>
          {buyers.map(b => (
            <BuyerRow key={b.id} buyer={b} onChange={val => updateBuyer(b.id, val)} onRemove={() => removeBuyer(b.id)} />
          ))}
          <button style={s.addBtn} onClick={addBuyer}>+ Add Buyer</button>
        </div>

        {/* Contacts */}
        <div style={s.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={s.label}>Recommended Contacts</span>
            <button style={s.aiBtn} onClick={generateContacts} disabled={aiLoading}>
              {aiLoading ? 'Generating...' : '✦ AI Suggest'}
            </button>
          </div>
          {aiError && <div style={{ color: '#f87171', fontSize: '12px', marginBottom: '8px' }}>{aiError}</div>}
          {contacts.map(c => (
            <ContactRow key={c.id} contact={c} onChange={val => updateContact(c.id, val)} onRemove={() => removeContact(c.id)} />
          ))}
          <button style={s.addBtn} onClick={addContact}>+ Add Contact</button>
        </div>
      </div>
    </>
  )
}
