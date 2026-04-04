import { useState } from 'react'
import { STAGE_COLORS } from '../lib/constants'

const today = new Date().toISOString().split('T')[0]

// ─── Single task row ─────────────────────────────────────────────────────────
function TaskRow({ task, onToggle, onRemove }) {
  const [hovered, setHovered] = useState(false)
  const isOverdue = !task.done && task.due && task.due < today
  const isDueToday = !task.done && task.due === today

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '9px 16px', borderBottom: '1px solid #161616',
        background: hovered ? '#151515' : 'transparent', transition: 'background 0.1s',
      }}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        style={{
          width: 16, height: 16, borderRadius: '4px', flexShrink: 0,
          background: task.done ? '#7c6af7' : 'transparent',
          border: `1px solid ${task.done ? '#7c6af7' : '#333'}`,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, transition: 'all 0.15s',
        }}
      >
        {task.done && <span style={{ color: '#fff', fontSize: '9px', lineHeight: 1 }}>✓</span>}
      </button>

      {/* Task text */}
      <span style={{
        flex: 1, fontSize: '13px',
        color: task.done ? '#3a3a3a' : '#ccc',
        textDecoration: task.done ? 'line-through' : 'none',
      }}>
        {task.text}
      </span>

      {/* Due date */}
      {task.due && (
        <span style={{
          fontFamily: 'DM Mono, monospace', fontSize: '10px', flexShrink: 0,
          color: isOverdue ? '#f87171' : isDueToday ? '#facc15' : '#444',
        }}>
          {isOverdue && '⚠ '}{task.due}
        </span>
      )}

      {/* Delete button */}
      {hovered && (
        <button
          onClick={onRemove}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', padding: '0 2px', lineHeight: 1, color: '#333' }}
          onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
          onMouseLeave={e => e.currentTarget.style.color = '#333'}
        >
          ×
        </button>
      )}
    </div>
  )
}

// ─── Main view ───────────────────────────────────────────────────────────────
export default function TasksView({ deals, onUpdateDealTasks, onOpenDeal }) {
  const [filter, setFilter] = useState('pending') // 'pending' | 'all' | 'done'
  const [addingFor, setAddingFor] = useState(null)    // deal.id
  const [newTaskText, setNewTaskText] = useState({})  // { [dealId]: string }
  const [showAll, setShowAll] = useState(false)       // show deals with no matching tasks

  // Build per-deal data
  const dealData = deals.map(d => {
    const allTasks = d.tasks || []
    const filteredTasks = filter === 'all' ? allTasks
      : filter === 'pending' ? allTasks.filter(t => !t.done)
      : allTasks.filter(t => t.done)
    const overdueCount = filteredTasks.filter(t => !t.done && t.due && t.due < today).length
    return { ...d, allTasks, filteredTasks, overdueCount }
  })

  // Which deals to show: those with matching tasks, OR currently adding, OR showAll
  const visibleDeals = dealData
    .filter(d => d.filteredTasks.length > 0 || addingFor === d.id || showAll)
    .sort((a, b) => {
      if (b.overdueCount !== a.overdueCount) return b.overdueCount - a.overdueCount
      const aPending = a.allTasks.filter(t => !t.done).length
      const bPending = b.allTasks.filter(t => !t.done).length
      return bPending - aPending
    })

  const totalShown = dealData.reduce((s, d) => s + d.filteredTasks.length, 0)
  const totalOverdue = dealData.reduce((s, d) => s + d.overdueCount, 0)
  const dealsWithTasks = dealData.filter(d => d.filteredTasks.length > 0).length

  const toggleTask = (deal, taskId) => {
    const next = deal.allTasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t)
    onUpdateDealTasks(deal.id, next)
  }

  const removeTask = (deal, taskId) => {
    const next = deal.allTasks.filter(t => t.id !== taskId)
    onUpdateDealTasks(deal.id, next)
  }

  const addTask = (deal) => {
    const text = (newTaskText[deal.id] || '').trim()
    setAddingFor(null)
    setNewTaskText(prev => ({ ...prev, [deal.id]: '' }))
    if (!text) return
    const next = [...deal.allTasks, { id: crypto.randomUUID(), text, done: false, due: '' }]
    onUpdateDealTasks(deal.id, next)
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '18px', fontWeight: 700, color: '#f0f0f0', margin: 0 }}>
            Tasks
          </h2>
          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: '2px', background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: '6px', padding: '2px' }}>
            {[['pending', 'Pending'], ['all', 'All'], ['done', 'Done']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                style={{
                  background: filter === val ? '#1e1e1e' : 'transparent',
                  border: 'none', borderRadius: '4px',
                  color: filter === val ? '#e0e0e0' : '#555',
                  cursor: 'pointer', fontFamily: 'DM Mono, monospace',
                  fontSize: '11px', padding: '4px 12px',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  transition: 'all 0.12s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {totalOverdue > 0 && (
            <span style={{ color: '#f87171', fontSize: '11px', fontFamily: 'DM Mono, monospace' }}>
              ⚠ {totalOverdue} overdue
            </span>
          )}
          <span style={{ color: '#444', fontSize: '11px', fontFamily: 'DM Mono, monospace' }}>
            {totalShown} task{totalShown !== 1 ? 's' : ''} · {dealsWithTasks} deal{dealsWithTasks !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Empty state */}
      {visibleDeals.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#444', fontSize: '13px' }}>
          {filter === 'pending' ? '✓  No pending tasks — all caught up' : filter === 'done' ? 'No completed tasks yet' : 'No tasks across any deals'}
        </div>
      )}

      {/* Deal groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {visibleDeals.map(deal => {
          const colors = STAGE_COLORS[deal.stage] || STAGE_COLORS['Sourced']
          const pendingCount = deal.allTasks.filter(t => !t.done).length
          const isAdding = addingFor === deal.id

          return (
            <div key={deal.id} style={{ background: '#111', border: '1px solid #1f1f1f', borderRadius: '10px', overflow: 'hidden' }}>

              {/* Deal header */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '11px 16px',
                  borderBottom: deal.filteredTasks.length > 0 || isAdding ? '1px solid #1a1a1a' : 'none',
                  cursor: 'pointer',
                }}
                onClick={() => onOpenDeal?.(deal)}
                onMouseEnter={e => e.currentTarget.style.background = '#161616'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 600, color: '#e5e5e5' }}>
                    {deal.company_name}
                  </span>
                  <span style={{
                    background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
                    borderRadius: '4px', padding: '1px 7px', fontSize: '10px',
                  }}>
                    {deal.stage}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {pendingCount > 0 && filter !== 'done' && (
                    <span style={{ color: '#444', fontSize: '11px', fontFamily: 'DM Mono, monospace' }}>
                      {pendingCount} pending
                    </span>
                  )}
                  <span style={{ color: '#2a2a2a', fontSize: '11px' }}>→</span>
                </div>
              </div>

              {/* Task list */}
              {deal.filteredTasks.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => toggleTask(deal, task.id)}
                  onRemove={() => removeTask(deal, task.id)}
                />
              ))}

              {/* Add task row */}
              <div style={{ padding: isAdding ? '8px 16px 10px' : '6px 16px 8px' }}>
                {isAdding ? (
                  <input
                    autoFocus
                    value={newTaskText[deal.id] || ''}
                    onChange={e => setNewTaskText(prev => ({ ...prev, [deal.id]: e.target.value }))}
                    onKeyDown={e => {
                      if (e.key === 'Enter') addTask(deal)
                      if (e.key === 'Escape') { setAddingFor(null); setNewTaskText(prev => ({ ...prev, [deal.id]: '' })) }
                    }}
                    onBlur={() => addTask(deal)}
                    placeholder="Task description… (Enter to save)"
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '5px',
                      color: '#e0e0e0', fontSize: '12px', padding: '7px 10px',
                      fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                ) : (
                  <button
                    onClick={e => { e.stopPropagation(); setAddingFor(deal.id) }}
                    style={{
                      background: 'none', border: 'none', color: '#2a2a2a', cursor: 'pointer',
                      fontSize: '12px', padding: '2px 0', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: '5px',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#555'}
                    onMouseLeave={e => e.currentTarget.style.color = '#2a2a2a'}
                  >
                    <span style={{ fontSize: '15px', lineHeight: 1 }}>+</span> Add task
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Show all deals toggle */}
      {!showAll && deals.filter(d => !(d.tasks || []).some(t => filter === 'pending' ? !t.done : filter === 'done' ? t.done : true)).length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            onClick={() => setShowAll(true)}
            style={{
              background: 'none', border: '1px solid #1f1f1f', borderRadius: '6px',
              color: '#444', cursor: 'pointer', fontSize: '11px', padding: '6px 16px',
              fontFamily: 'DM Mono, monospace', letterSpacing: '0.04em',
            }}
          >
            + Add task to another deal
          </button>
        </div>
      )}

      {showAll && (
        <div style={{ textAlign: 'center', marginTop: '12px' }}>
          <button
            onClick={() => setShowAll(false)}
            style={{
              background: 'none', border: 'none', color: '#333', cursor: 'pointer',
              fontSize: '11px', fontFamily: 'DM Mono, monospace',
            }}
          >
            Show less
          </button>
        </div>
      )}

    </div>
  )
}
