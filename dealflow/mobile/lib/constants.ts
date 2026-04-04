export const STAGES = [
  "Sourced",
  "Investor Targeting",
  "Diligence",
  "Term Sheet",
  "Negotiation",
  "Closed",
  "Passed",
] as const;

export type Stage = (typeof STAGES)[number];

export const STAGE_COLORS: Record<Stage, string> = {
  Sourced: "#64748b",
  "Investor Targeting": "#7c3aed",
  Diligence: "#2563eb",
  "Term Sheet": "#d97706",
  Negotiation: "#ea580c",
  Closed: "#16a34a",
  Passed: "#dc2626",
};

export const ACTIVE_STAGES: Stage[] = [
  "Sourced",
  "Investor Targeting",
  "Diligence",
  "Term Sheet",
  "Negotiation",
];

export const SECTORS = [
  "Technology",
  "Healthcare",
  "Financial Services",
  "Consumer",
  "Industrial",
  "Real Estate",
  "Energy",
  "Media",
  "Other",
];

export const STAGE_CHECKLISTS: Partial<Record<Stage, string[]>> = {
  "Investor Targeting": [
    "Prepare teaser",
    "Build investor list",
    "Send intro emails",
    "Schedule intro calls",
  ],
  Diligence: [
    "Set up data room",
    "Share financials",
    "Respond to Q&A",
    "Update diligence tracker",
  ],
  "Term Sheet": [
    "Review term sheet",
    "Engage legal counsel",
    "Agree on timeline",
    "Negotiate key terms",
  ],
  Negotiation: [
    "Negotiate final terms",
    "Draft purchase agreement",
    "Finalize fee structure",
    "Confirm logistics",
  ],
  Closed: [
    "Execute closing docs",
    "Send invoice",
    "Request testimonial",
    "Update deal tracker",
  ],
};

export function formatCurrency(n: number | undefined | null): string {
  if (!n) return "$0";
  if (n >= 1_000_000_000)
    return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}
