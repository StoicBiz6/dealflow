import { useState, useEffect } from 'react'
import { STAGES, SECTORS } from '../lib/constants'

const EMPTY = {
  company_name: '', stage: 'Sourced', raise_amount: '', valuation: '',
  sector: '', deal_owner: '', website: '', notes: '',
}

const inputStyle = {
  background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px',
  color: '#f0f0f0', padding: '8px 10px', fontFamily: 'DM Mono, monospace',
  fontSize: '13px', outline: 'none', width: '100%',
}

export default function DealModal({ deal, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    if (deal && deal.id) {
      setForm({
        ...deal,
        raise_amount: deal.raise_amount != null ? deal.raise_amount / 1_000_000 : '',
        valuation: deal.valuation != null ? deal.valuation / 1_000_000 : '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [deal])

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      ...(deal?.id ? { id: deal.id } : {}),
      company_name: form.company_name,
      stage: form.stage,
      sector: form.sector,
      deal_owner: form.deal_owner,
      website: form.website,
      notes: form.notes,
      raise_amount: form.raise_amount !== '' ? parseFloat(form.raise_amount) * 1_000_000 : null,
      valuation: form.valuation !== '' ? parseFloat(form.valuation) * 1_000_000 : null,
    }
    onSave(payload)
  }

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: '#111111', border: '1px solid #2a2a2a', borderRadius: '12px',
        width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid #1f1f1f',
        }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 600, color: '#f0f0f0' }}>
            {deal?.id ? 'Edit Deal' : 'New Deal'}
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '20px', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          <label style={labelStyle}>Company Name *</label>
          <input required value={form.company_name} onChange={set('company_name')} placeholder="Acme Corp" style={inputStyle} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Stage</label>
              <select value={form.stage} onChange={set('stage')} style={inputStyle}>
                {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Sector</label>
              <select value={form.sector} onChange={set('sector')} style={inputStyle}>
                <option value="">—</option>
                {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Raise Amount ($M)</label>
              <input type="number" step="0.1" min="0" value={form.raise_amount} onChange={set('raise_amount')} placeholder="e.g. 10" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Valuation ($M)</label>
              <input type="number" step="0.1" min="0" value={form.valuation} onChange={set('valuation')} placeholder="e.g. 50" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Deal Owner</label>
              <input value={form.deal_owner} onChange={set('deal_owner')} placeholder="Your name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Website</label>
              <input type="url" value={form.website} onChange={set('website')} placeholder="https://..." style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Notes</label>
            <textarea value={form.notes} onChange={set('notes')} rows={3} placeholder="Any notes..." style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px' }}>
            <button type="button" onClick={onClose} style={ghostBtn}>Cancel</button>
            <button type="submit" style={primaryBtn}>{deal?.id ? 'Save Changes' : 'Add Deal'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'block', fontSize: '11px', color: '#555',
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px',
}

const baseBtn = {
  fontFamily: 'DM Mono, monospace', fontSize: '13px', cursor: 'pointer',
  padding: '8px 18px', borderRadius: '6px', border: '1px solid', transition: 'opacity 0.15s',
}
const primaryBtn = { ...baseBtn, background: '#7c6af7', borderColor: '#7c6af7', color: '#fff' }
const ghostBtn = { ...baseBtn, background: 'transparent', borderColor: '#2a2a2a', color: '#888' }
