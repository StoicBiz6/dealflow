export const STAGES = [
  'Sourced',
  'Investor Targeting',
  'Diligence',
  'Term Sheet',
  'Negotiation',
  'Closed',
  'Passed',
]

export const STAGE_COLORS = {
  'Sourced':             { bg: 'rgba(100,100,100,0.15)', text: '#888888', border: '#333333' },
  'Investor Targeting':  { bg: 'rgba(124,106,247,0.12)', text: '#9d8fff', border: '#4a3fa0' },
  'Diligence':           { bg: 'rgba(59,130,246,0.12)',  text: '#60a5fa', border: '#1e40af' },
  'Term Sheet':          { bg: 'rgba(234,179,8,0.12)',   text: '#facc15', border: '#854d0e' },
  'Negotiation':         { bg: 'rgba(249,115,22,0.12)',  text: '#fb923c', border: '#9a3412' },
  'Closed':              { bg: 'rgba(34,197,94,0.12)',   text: '#4ade80', border: '#166534' },
  'Passed':              { bg: 'rgba(239,68,68,0.12)',   text: '#f87171', border: '#991b1b' },
}

export const SECTORS = [
  'Technology', 'Gaming', 'Media & Entertainment', 'Hospitality',
  'Sports', 'Healthcare', 'Consumer', 'Finance', 'Real Estate', 'Other',
]

export const SEED_DEALS = [
  { company_name: 'Gaming Intelligence', stage: 'Investor Targeting', raise_amount: 2000000,   sector: 'Gaming',               deal_owner: 'Me', notes: '' },
  { company_name: 'Play',                stage: 'Investor Targeting', raise_amount: 55000000,  sector: 'Gaming',               deal_owner: 'Me', notes: '' },
  { company_name: 'Ritz Carlton - Tanzania', stage: 'Diligence',      raise_amount: 62000000,  sector: 'Hospitality',          deal_owner: 'Me', notes: '' },
  { company_name: 'Pinto',               stage: 'Investor Targeting', raise_amount: 40000000,  sector: 'Technology',           deal_owner: 'Me', notes: '' },
  { company_name: 'Formula 1',           stage: 'Diligence',          raise_amount: 300000000, sector: 'Sports',               deal_owner: 'Me', notes: '' },
  { company_name: 'Canary',              stage: 'Diligence',          raise_amount: 40000000,  sector: 'Technology',           deal_owner: 'Me', notes: '' },
  { company_name: 'Amblin Production',   stage: 'Sourced',            raise_amount: 1000000000,sector: 'Media & Entertainment', deal_owner: 'Me', notes: '' },
  { company_name: 'Fortitude',           stage: 'Diligence',          raise_amount: 60000000,  sector: 'Technology',           deal_owner: 'Me', notes: '' },
  { company_name: 'Clay',                stage: 'Sourced',            raise_amount: 15000000,  sector: 'Technology',           deal_owner: 'Me', notes: '' },
  { company_name: 'HC Startup',          stage: 'Investor Targeting', raise_amount: 10000000,  sector: 'Healthcare',           deal_owner: 'Me', notes: '' },
  { company_name: 'Starbucks',           stage: 'Investor Targeting', raise_amount: 2000000000,sector: 'Consumer',             deal_owner: 'Me', notes: '' },
]
