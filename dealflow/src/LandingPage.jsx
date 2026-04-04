import { useState, useEffect } from 'react'

const STAGES = ['Sourced', 'Investor Targeting', 'Diligence', 'Term Sheet', 'Negotiation', 'Closed', 'Passed']

const FEATURES = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="1" y="3" width="3" height="12" rx="1" fill="currentColor" opacity="0.3"/>
        <rect x="6" y="6" width="3" height="9" rx="1" fill="currentColor" opacity="0.6"/>
        <rect x="11" y="1" width="3" height="14" rx="1" fill="currentColor"/>
        <rect x="16" y="8" width="2" height="7" rx="1" fill="currentColor" opacity="0.4"/>
      </svg>
    ),
    name: 'Kanban Pipeline',
    desc: 'Drag deals across 7 custom stages. See your entire funnel at a glance — from first contact to close.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
        <path d="M9 9 L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M9 9 L14 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    name: 'KPI Dashboard',
    desc: 'Conversion rates, deal velocity, portfolio value by stage. The numbers that actually matter, surfaced instantly.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <line x1="2" y1="5" x2="16" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="2" y1="9" x2="12" y2="9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
        <line x1="2" y1="13" x2="9" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
      </svg>
    ),
    name: 'List View',
    desc: 'Sort, filter, and scan all deals in a dense table. Perfect for LP updates and quick review sessions.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M2 7h14" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="6" cy="11.5" r="1" fill="currentColor" opacity="0.5"/>
        <circle cx="9" cy="11.5" r="1" fill="currentColor" opacity="0.5"/>
      </svg>
    ),
    name: 'Timeline / Gantt',
    desc: 'Visualize deal close dates across your portfolio. Spot bottlenecks and timeline conflicts at a glance.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 2C6 2 3 5 3 9s3 7 6 7 6-3 6-7-3-7-6-7z" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M9 6v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
    name: 'Market Intelligence',
    desc: 'AI-powered market context for every deal. Buyer universe, sector news, and competitive landscape built in.',
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <rect x="3" y="6" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M6 6V4.5C6 3.1 7.1 2 8.5 2H9.5C10.9 2 12 3.1 12 4.5V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="9" cy="11" r="1.5" fill="currentColor"/>
      </svg>
    ),
    name: 'Private by Design',
    desc: 'Clerk auth with email allowlist. Only the people you choose can see your deals. No exceptions.',
  },
]

const PRICING = [
  {
    name: 'Solo',
    price: '$0',
    period: 'forever',
    desc: 'For individual dealmakers tracking their own pipeline.',
    highlight: false,
    features: [
      '1 workspace',
      'Up to 25 deals',
      'Kanban + List view',
      'KPI dashboard',
      'Supabase sync',
      'Email auth',
    ],
    cta: 'Start free',
    ctaHref: '/sign-up',
  },
  {
    name: 'Pro',
    price: '$49',
    period: 'per month',
    desc: 'For active investors managing multiple deals and teams.',
    highlight: true,
    badge: 'Most popular',
    features: [
      'Unlimited workspaces',
      'Unlimited deals',
      'All views incl. Gantt',
      'AI Market Intelligence',
      'Buyer Universe',
      'Invite collaborators',
      'PDF export',
      'Google Calendar sync',
      'Priority support',
    ],
    cta: 'Get Pro',
    ctaHref: '/sign-up',
  },
  {
    name: 'Fund',
    price: '$199',
    period: 'per month',
    desc: 'For funds and firms with multiple team members.',
    highlight: false,
    features: [
      'Everything in Pro',
      'Up to 10 seats',
      'Team workspaces',
      'Custom pipeline stages',
      'LP report exports',
      'SSO / SAML',
      'Dedicated support',
    ],
    cta: 'Contact us',
    ctaHref: 'mailto:mb@stoicpartner.com',
  },
]

const MOCK_DEALS = [
  { name: 'Meridian AI', sector: 'Enterprise SaaS', tag: 'Series A', tagClass: 'tag-a', col: 0 },
  { name: 'Orbis Labs', sector: 'Deep Tech', tag: 'Seed', tagClass: 'tag-seed', col: 0 },
  { name: 'Vanta Health', sector: 'HealthTech', tag: 'Series A', tagClass: 'tag-a', col: 2 },
  { name: 'Cascade IO', sector: 'Infrastructure', tag: 'Series B', tagClass: 'tag-b', col: 2 },
  { name: 'Forge Systems', sector: 'Dev Tools', tag: 'Growth', tagClass: 'tag-growth', col: 3, highlight: true },
  { name: 'Nova Robotics', sector: 'Hardware + AI', tag: 'Series B', tagClass: 'tag-b', col: 4 },
]

const COLS = ['Sourced', 'Targeting', 'Diligence', 'Term Sheet', 'Negotiation']

export default function LandingPage() {
  const [activeStage, setActiveStage] = useState(1)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setActiveStage(s => (s + 1) % STAGES.length), 2200)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={s.root}>
      <style>{css}</style>

      {/* NAV */}
      <nav style={{ ...s.nav, ...(scrolled ? s.navScrolled : {}) }}>
        <div style={s.logo}>DEAL<span style={s.logoDim}>//</span>FLOW</div>
        <div style={s.navLinks}>
          <a href="#features" style={s.navLink}>Features</a>
          <a href="#pipeline" style={s.navLink}>Pipeline</a>
          <a href="#pricing" style={s.navLink}>Pricing</a>
          <a href="/sign-in" style={s.btnOutline}>Sign in</a>
          <a href="/sign-up" style={s.btnAccent}>Get access →</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={s.hero}>
        <div style={s.heroBg} />
        <div style={s.heroGlow} />
        <div style={s.heroContent}>
          <div style={s.badge}>
            <span style={s.badgeDot} className="pulse-dot" />
            Private deal intelligence
          </div>
          <h1 style={s.h1}>
            Track every deal.<br />
            <span style={s.h1Accent}>Close</span> the{' '}
            <span style={s.h1Dim}>right ones.</span>
          </h1>
          <p style={s.heroSub}>
            A private investment pipeline built for precision. From first contact to term sheet —
            every deal, every stage, total clarity.
          </p>
          <div style={s.heroActions}>
            <a href="/sign-up" style={s.btnPrimary}>Request access →</a>
            <a href="#features" style={s.btnGhost}>See features</a>
          </div>

          {/* Animated pipeline */}
          <div style={s.pipelineRow}>
            {STAGES.map((stage, i) => (
              <div key={stage} style={s.pipelineItem}>
                <div style={{
                  ...s.stageChip,
                  ...(i === activeStage ? s.stageChipActive : {}),
                }}>
                  {stage}
                </div>
                {i < STAGES.length - 1 && <span style={s.stageArrow}>›</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <div style={s.statsBar}>
        {[
          ['7', 'pipeline stages'],
          ['3+', 'views — kanban, kpi, list, gantt'],
          ['∞', 'deals tracked'],
          ['1', 'source of truth'],
        ].map(([num, label]) => (
          <div key={label} style={s.statItem}>
            <div style={s.statNum}><span style={s.statAccent}>{num}</span></div>
            <div style={s.statLabel}>{label}</div>
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <section style={s.section} id="features">
        <div style={s.sectionLabel}>// what you get</div>
        <h2 style={s.sectionTitle}>
          Built for how serious<br />
          <span style={s.dimText}>investors actually work</span>
        </h2>
        <div style={s.featuresGrid}>
          {FEATURES.map(f => (
            <div key={f.name} style={s.featureCard} className="feature-card">
              <div style={s.featureIcon}>{f.icon}</div>
              <div style={s.featureName}>{f.name}</div>
              <div style={s.featureDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* PIPELINE MOCKUP */}
      <section style={s.section} id="pipeline">
        <div style={s.sectionLabel}>// the board</div>
        <h2 style={s.sectionTitle}>
          Your pipeline,<br />
          <span style={s.dimText}>exactly how you see it</span>
        </h2>
        <div style={s.kanbanMock}>
          <div style={s.kanbanBar}>
            <span style={{ ...s.macDot, background: '#ff5f57' }} />
            <span style={{ ...s.macDot, background: '#febc2e' }} />
            <span style={{ ...s.macDot, background: '#28c840' }} />
            <span style={s.kanbanTitle}>DEALFLOW — Pipeline Board</span>
          </div>
          <div style={s.kanbanBoard}>
            {COLS.map((col, ci) => {
              const deals = MOCK_DEALS.filter(d => d.col === ci)
              return (
                <div key={col} style={s.kanbanCol}>
                  <div style={s.colHeader}>
                    <span>{col}</span>
                    <span style={s.colCount}>{deals.length || '—'}</span>
                  </div>
                  {deals.map(d => (
                    <div key={d.name} style={{ ...s.dealCard, ...(d.highlight ? s.dealCardHL : {}) }}>
                      <div style={s.dealName}>{d.name}</div>
                      <div style={s.dealSector}>{d.sector}</div>
                      <span style={{ ...s.dealTag, ...s[d.tagClass] }}>{d.tag}</span>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ ...s.section, ...s.pricingSection }} id="pricing">
        <div style={s.sectionLabel}>// pricing</div>
        <h2 style={s.sectionTitle}>
          Simple, transparent<br />
          <span style={s.dimText}>pricing that scales with you</span>
        </h2>
        <div style={s.pricingGrid}>
          {PRICING.map(plan => (
            <div
              key={plan.name}
              style={{ ...s.pricingCard, ...(plan.highlight ? s.pricingCardHL : {}) }}
              className="pricing-card"
            >
              {plan.badge && <div style={s.pricingBadge}>{plan.badge}</div>}
              <div style={s.planName}>{plan.name}</div>
              <div style={s.planPriceRow}>
                <span style={s.planPrice}>{plan.price}</span>
                <span style={s.planPeriod}> / {plan.period}</span>
              </div>
              <div style={s.planDesc}>{plan.desc}</div>
              <div style={s.divider} />
              <ul style={s.featureList}>
                {plan.features.map(f => (
                  <li key={f} style={s.featureItem}>
                    <span style={s.checkmark}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={plan.ctaHref}
                style={{
                  ...s.planCta,
                  ...(plan.highlight ? s.planCtaHL : {}),
                }}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
        <p style={s.pricingNote}>
          All plans include a 14-day free trial. No credit card required.
        </p>
      </section>

      {/* TECH STACK */}
      <div style={s.techBar}>
        <span style={s.techLabel}>BUILT ON</span>
        {['Supabase', 'Clerk', 'Vercel', 'React', 'Vite'].map(t => (
          <span key={t} style={s.techItem}>{t}</span>
        ))}
      </div>

      {/* CTA */}
      <section style={s.ctaSection}>
        <div style={s.ctaBox}>
          <div style={s.ctaTopLine} />
          <h2 style={s.ctaTitle}>
            Ready to take<br />control of your<br />deal flow?
          </h2>
          <p style={s.ctaSub}>
            Join the invite-only waitlist or sign in<br />if you already have access.
          </p>
          <div style={s.heroActions}>
            <a href="/sign-up" style={s.btnPrimary}>Request access →</a>
            <a href="/sign-in" style={s.btnGhost}>Sign in</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={s.footer}>
        <div style={s.logo}>DEAL<span style={s.logoDim}>//</span>FLOW</div>
        <div style={s.footerText}>Private. Invite-only. Built for dealmakers.</div>
      </footer>
    </div>
  )
}

/* ── Styles ── */
const ACC = '#c8f55a'
const ACC2 = '#a8d840'
const BG = '#0a0a08'
const BG2 = '#111110'
const BG3 = '#1a1a17'
const BORDER = 'rgba(255,255,255,0.07)'
const BORDER2 = 'rgba(255,255,255,0.14)'
const TEXT = '#f0ede8'
const TEXT2 = '#888880'
const TEXT3 = '#444440'
const MONO = "'DM Mono', 'Courier New', monospace"
const SANS = "'Syne', system-ui, sans-serif"

const s = {
  root: { background: BG, color: TEXT, fontFamily: SANS, minHeight: '100vh', overflowX: 'hidden' },

  nav: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 48px', transition: 'background 0.3s, border-color 0.3s', borderBottom: '1px solid transparent' },
  navScrolled: { background: 'rgba(10,10,8,0.9)', backdropFilter: 'blur(12px)', borderColor: BORDER },
  logo: { fontFamily: MONO, fontWeight: 500, fontSize: 15, letterSpacing: '0.12em', color: ACC },
  logoDim: { color: TEXT3 },
  navLinks: { display: 'flex', alignItems: 'center', gap: 28 },
  navLink: { fontFamily: MONO, fontSize: 12, letterSpacing: '0.06em', color: TEXT2, textDecoration: 'none' },
  btnOutline: { fontFamily: MONO, fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', padding: '9px 18px', border: `1px solid ${BORDER2}`, borderRadius: 4, background: 'transparent', color: TEXT, textDecoration: 'none', cursor: 'pointer' },
  btnAccent: { fontFamily: MONO, fontSize: 12, fontWeight: 500, letterSpacing: '0.06em', padding: '9px 18px', border: `1px solid ${ACC}`, borderRadius: 4, background: ACC, color: BG, textDecoration: 'none', cursor: 'pointer' },

  hero: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 48px 80px', position: 'relative', overflow: 'hidden' },
  heroBg: {
    position: 'absolute', inset: 0,
    backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
    backgroundSize: '60px 60px',
    WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%)',
    maskImage: 'radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 100%)',
  },
  heroGlow: { position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, background: `radial-gradient(ellipse, rgba(200,245,90,0.07) 0%, transparent 70%)`, pointerEvents: 'none' },
  heroContent: { position: 'relative', maxWidth: 900, textAlign: 'center' },

  badge: { display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', color: ACC, border: `1px solid rgba(200,245,90,0.25)`, background: 'rgba(200,245,90,0.06)', padding: '6px 16px', borderRadius: 100, marginBottom: 40 },
  badgeDot: { width: 6, height: 6, borderRadius: '50%', background: ACC, display: 'inline-block' },

  h1: { fontFamily: SANS, fontSize: 'clamp(48px, 8vw, 92px)', fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.03em', marginBottom: 32, color: TEXT },
  h1Accent: { color: ACC },
  h1Dim: { color: TEXT3 },
  heroSub: { fontFamily: MONO, fontSize: 15, fontWeight: 300, color: TEXT2, lineHeight: 1.8, maxWidth: 540, margin: '0 auto 52px' },
  heroActions: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, flexWrap: 'wrap' },
  btnPrimary: { fontFamily: MONO, fontSize: 13, fontWeight: 500, letterSpacing: '0.04em', padding: '14px 32px', background: ACC, border: 'none', borderRadius: 4, color: BG, textDecoration: 'none', cursor: 'pointer', display: 'inline-block' },
  btnGhost: { fontFamily: MONO, fontSize: 13, fontWeight: 400, letterSpacing: '0.04em', padding: '14px 32px', background: 'transparent', border: `1px solid ${BORDER2}`, borderRadius: 4, color: TEXT, textDecoration: 'none', cursor: 'pointer', display: 'inline-block' },

  pipelineRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap', marginTop: 64 },
  pipelineItem: { display: 'flex', alignItems: 'center', gap: 6 },
  stageChip: { fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', padding: '5px 12px', borderRadius: 100, border: `1px solid ${BORDER}`, color: TEXT3, transition: 'all 0.4s', whiteSpace: 'nowrap' },
  stageChipActive: { borderColor: 'rgba(200,245,90,0.35)', color: ACC, background: 'rgba(200,245,90,0.07)' },
  stageArrow: { color: TEXT3, fontSize: 11, fontFamily: MONO },

  statsBar: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` },
  statItem: { padding: '48px 40px', textAlign: 'center', borderRight: `1px solid ${BORDER}` },
  statNum: { fontFamily: SANS, fontSize: 48, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 8 },
  statAccent: { color: ACC },
  statLabel: { fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', color: TEXT3 },

  section: { padding: '120px 48px', maxWidth: 1200, margin: '0 auto' },
  sectionLabel: { fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', color: ACC, marginBottom: 20 },
  sectionTitle: { fontFamily: SANS, fontSize: 'clamp(30px, 4vw, 50px)', fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.05, color: TEXT, marginBottom: 64 },
  dimText: { color: TEXT3 },

  featuresGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden', gap: '1px', background: BORDER },
  featureCard: { background: BG, padding: '40px 36px', transition: 'background 0.2s', cursor: 'default' },
  featureIcon: { width: 40, height: 40, borderRadius: 8, background: 'rgba(200,245,90,0.07)', border: '1px solid rgba(200,245,90,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, color: ACC },
  featureName: { fontFamily: SANS, fontSize: 17, fontWeight: 700, color: TEXT, marginBottom: 12, letterSpacing: '-0.01em' },
  featureDesc: { fontFamily: MONO, fontSize: 12, fontWeight: 300, color: TEXT2, lineHeight: 1.8 },

  kanbanMock: { background: BG2, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden', marginTop: 48 },
  kanbanBar: { padding: '14px 22px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 8 },
  macDot: { width: 10, height: 10, borderRadius: '50%', display: 'inline-block' },
  kanbanTitle: { fontFamily: MONO, fontSize: 12, letterSpacing: '0.06em', color: TEXT2, marginLeft: 8 },
  kanbanBoard: { padding: '24px', display: 'flex', gap: 12, overflowX: 'auto' },
  kanbanCol: { flex: '0 0 170px' },
  colHeader: { fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: TEXT3, paddingBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  colCount: { background: BG3, color: TEXT3, fontSize: 10, padding: '2px 7px', borderRadius: 100, fontFamily: MONO },
  dealCard: { background: BG3, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '12px', marginBottom: 8 },
  dealCardHL: { borderColor: 'rgba(200,245,90,0.22)' },
  dealName: { fontFamily: SANS, fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 3 },
  dealSector: { fontFamily: MONO, fontSize: 10, color: TEXT3 },
  dealTag: { display: 'inline-block', fontFamily: MONO, fontSize: 9, padding: '2px 7px', borderRadius: 100, marginTop: 8 },
  'tag-seed': { background: 'rgba(200,245,90,0.1)', color: ACC },
  'tag-a': { background: 'rgba(55,138,221,0.1)', color: '#67a8f0' },
  'tag-b': { background: 'rgba(255,179,64,0.1)', color: '#ffb340' },
  'tag-growth': { background: 'rgba(255,107,74,0.1)', color: '#ff6b4a' },

  pricingSection: { maxWidth: 1200, borderTop: `1px solid ${BORDER}` },
  pricingGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 },
  pricingCard: { background: BG2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '40px 36px', position: 'relative', transition: 'border-color 0.2s' },
  pricingCardHL: { border: `2px solid ${ACC}`, background: BG2 },
  pricingBadge: { position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', background: ACC, color: BG, padding: '4px 14px', borderRadius: 100, whiteSpace: 'nowrap', fontWeight: 500 },
  planName: { fontFamily: MONO, fontSize: 12, letterSpacing: '0.12em', color: TEXT2, marginBottom: 20 },
  planPriceRow: { marginBottom: 12 },
  planPrice: { fontFamily: SANS, fontSize: 48, fontWeight: 800, letterSpacing: '-0.03em', color: TEXT, lineHeight: 1 },
  planPeriod: { fontFamily: MONO, fontSize: 12, color: TEXT3 },
  planDesc: { fontFamily: MONO, fontSize: 12, color: TEXT2, lineHeight: 1.8, marginBottom: 24 },
  divider: { height: 1, background: BORDER, marginBottom: 24 },
  featureList: { listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12 },
  featureItem: { fontFamily: MONO, fontSize: 12, color: TEXT2, display: 'flex', alignItems: 'center', gap: 10 },
  checkmark: { color: ACC, fontSize: 13, flexShrink: 0 },
  planCta: { display: 'block', textAlign: 'center', fontFamily: MONO, fontSize: 13, fontWeight: 500, letterSpacing: '0.04em', padding: '13px 0', border: `1px solid ${BORDER2}`, borderRadius: 4, color: TEXT, textDecoration: 'none', background: 'transparent' },
  planCtaHL: { background: ACC, borderColor: ACC, color: BG },
  pricingNote: { fontFamily: MONO, fontSize: 11, color: TEXT3, textAlign: 'center', letterSpacing: '0.04em' },

  techBar: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, padding: '32px 48px', flexWrap: 'wrap' },
  techLabel: { fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', color: TEXT3 },
  techItem: { fontFamily: MONO, fontSize: 13, color: TEXT3, letterSpacing: '0.06em' },

  ctaSection: { padding: '120px 48px', maxWidth: 800, margin: '0 auto', textAlign: 'center' },
  ctaBox: { background: BG2, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '80px 60px', position: 'relative', overflow: 'hidden' },
  ctaTopLine: { position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 300, height: 1, background: `linear-gradient(90deg, transparent, ${ACC}, transparent)` },
  ctaTitle: { fontFamily: SANS, fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-0.025em', color: TEXT, marginBottom: 20, lineHeight: 1.1 },
  ctaSub: { fontFamily: MONO, fontSize: 13, color: TEXT2, marginBottom: 40, lineHeight: 1.8 },

  footer: { borderTop: `1px solid ${BORDER}`, padding: '40px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' },
  footerText: { fontFamily: MONO, fontSize: 11, color: TEXT3 },
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  .pulse-dot { animation: pulse 2s infinite; }

  .feature-card:hover { background: #161614 !important; }
  .pricing-card:hover { border-color: rgba(255,255,255,0.18) !important; }

  a:hover { opacity: 0.85; }

  @media (max-width: 900px) {
    nav { padding: 16px 24px !important; }
    .hero { padding: 100px 24px 60px !important; }
    .features-grid { grid-template-columns: 1fr !important; }
    .pricing-grid { grid-template-columns: 1fr !important; }
    .stats-bar { grid-template-columns: repeat(2, 1fr) !important; }
  }
`
