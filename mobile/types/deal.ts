export interface Task {
  id: string;
  text: string;
  done: boolean;
  due?: string;
}

export interface Contact {
  id: string;
  name: string;
  title?: string;
  firm?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface Activity {
  id: string;
  type: "call" | "email" | "meeting" | "note";
  note: string;
  date: string;
}

export interface Buyer {
  id: string;
  name: string;
  status: "Active" | "Passed";
  email?: string;
  phone?: string;
  firm?: string;
  notes?: string;
  emailed?: boolean;
}

export interface Document {
  id: string;
  name: string;
  url: string;
  size?: number;
  type?: string;
  uploaded_at?: string;
}

export interface Metrics {
  revenue?: string;
  ebitda?: string;
  ebitda_margin?: string;
  arr?: string;
  growth_rate?: string;
  gross_margin?: string;
  employees?: string;
  founded?: string;
  other?: string;
}

export interface BuyerUniverse {
  name: string;
  type: "PE" | "Strategic" | "Family Office" | "Growth Equity";
  thesis?: string;
  website?: string;
  contact_name?: string;
  contact_title?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface Deal {
  id: string;
  created_at: string;
  updated_at: string;
  company_name: string;
  stage: string;
  sector?: string;
  raise_amount?: number;
  valuation?: number;
  fee_pct?: number;
  deal_owner?: string;
  website?: string;
  notes?: string;
  memo?: string;
  expected_close_date?: string;
  timeline_to_close?: string;
  user_id?: string;
  workspace_id?: string;
  // JSONB fields
  tasks?: Task[];
  activity_log?: Activity[];
  buyers?: Buyer[];
  contacts?: Contact[];
  documents?: Document[];
  metrics?: Metrics;
  score?: Record<string, unknown>;
  buyer_universe?: BuyerUniverse[];
  comments?: unknown[];
  shared_with?: string[];
}
