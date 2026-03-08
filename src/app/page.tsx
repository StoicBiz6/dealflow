"use client";

import { useState } from "react";

type Stage = "Lead" | "Qualified" | "Proposal" | "Negotiation" | "Closed Won" | "Closed Lost";

interface Deal {
  id: number;
  name: string;
  company: string;
  value: number;
  stage: Stage;
  owner: string;
  updatedAt: string;
}

const STAGES: Stage[] = ["Lead", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];

const STAGE_COLORS: Record<Stage, string> = {
  Lead: "bg-gray-100 text-gray-700 border-gray-200",
  Qualified: "bg-blue-100 text-blue-700 border-blue-200",
  Proposal: "bg-yellow-100 text-yellow-700 border-yellow-200",
  Negotiation: "bg-orange-100 text-orange-700 border-orange-200",
  "Closed Won": "bg-green-100 text-green-700 border-green-200",
  "Closed Lost": "bg-red-100 text-red-700 border-red-200",
};

const STAGE_DOT: Record<Stage, string> = {
  Lead: "bg-gray-400",
  Qualified: "bg-blue-500",
  Proposal: "bg-yellow-500",
  Negotiation: "bg-orange-500",
  "Closed Won": "bg-green-500",
  "Closed Lost": "bg-red-500",
};

const INITIAL_DEALS: Deal[] = [
  { id: 1, name: "Enterprise License", company: "Acme Corp", value: 120000, stage: "Negotiation", owner: "Sarah K.", updatedAt: "2026-03-07" },
  { id: 2, name: "SaaS Expansion", company: "Globex Inc", value: 45000, stage: "Proposal", owner: "James L.", updatedAt: "2026-03-06" },
  { id: 3, name: "Platform Migration", company: "Initech", value: 80000, stage: "Qualified", owner: "Sarah K.", updatedAt: "2026-03-05" },
  { id: 4, name: "Annual Renewal", company: "Umbrella LLC", value: 30000, stage: "Closed Won", owner: "Mike T.", updatedAt: "2026-03-04" },
  { id: 5, name: "New Integration", company: "Dunder Mifflin", value: 15000, stage: "Lead", owner: "James L.", updatedAt: "2026-03-03" },
  { id: 6, name: "Consulting Package", company: "Vandelay Ind.", value: 22000, stage: "Closed Lost", owner: "Mike T.", updatedAt: "2026-03-01" },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default function Home() {
  const [deals, setDeals] = useState<Deal[]>(INITIAL_DEALS);
  const [filterStage, setFilterStage] = useState<Stage | "All">("All");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", company: "", value: "", stage: "Lead" as Stage, owner: "" });

  const filtered = deals.filter((d) => {
    const matchStage = filterStage === "All" || d.stage === filterStage;
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.company.toLowerCase().includes(search.toLowerCase());
    return matchStage && matchSearch;
  });

  const totalPipeline = deals
    .filter((d) => d.stage !== "Closed Lost")
    .reduce((sum, d) => sum + d.value, 0);

  const totalWon = deals
    .filter((d) => d.stage === "Closed Won")
    .reduce((sum, d) => sum + d.value, 0);

  const handleAdd = () => {
    if (!form.name || !form.company || !form.value) return;
    const next: Deal = {
      id: Date.now(),
      name: form.name,
      company: form.company,
      value: Number(form.value),
      stage: form.stage,
      owner: form.owner || "Unassigned",
      updatedAt: new Date().toISOString().slice(0, 10),
    };
    setDeals([next, ...deals]);
    setForm({ name: "", company: "", value: "", stage: "Lead", owner: "" });
    setShowModal(false);
  };

  const moveStage = (id: number, direction: 1 | -1) => {
    setDeals(deals.map((d) => {
      if (d.id !== id) return d;
      const idx = STAGES.indexOf(d.stage);
      const next = STAGES[idx + direction];
      return next ? { ...d, stage: next, updatedAt: new Date().toISOString().slice(0, 10) } : d;
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">DealFlow</span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + New Deal
        </button>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Deals</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">{deals.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Pipeline Value</p>
            <p className="mt-1 text-3xl font-bold text-indigo-600">{formatCurrency(totalPipeline)}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Closed Won</p>
            <p className="mt-1 text-3xl font-bold text-green-600">{formatCurrency(totalWon)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search deals or companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-2 flex-wrap">
            {(["All", ...STAGES] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStage(s as Stage | "All")}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  filterStage === s
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Deal Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Deal</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Company</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Value</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Stage</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Owner</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Updated</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">No deals found.</td>
                </tr>
              )}
              {filtered.map((deal) => (
                <tr key={deal.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-slate-900">{deal.name}</td>
                  <td className="px-5 py-4 text-slate-600">{deal.company}</td>
                  <td className="px-5 py-4 font-semibold text-slate-800">{formatCurrency(deal.value)}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${STAGE_COLORS[deal.stage]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STAGE_DOT[deal.stage]}`} />
                      {deal.stage}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-600">{deal.owner}</td>
                  <td className="px-5 py-4 text-slate-400">{deal.updatedAt}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveStage(deal.id, -1)}
                        disabled={STAGES.indexOf(deal.stage) === 0}
                        className="p-1 rounded hover:bg-slate-200 disabled:opacity-20 text-slate-500 transition-colors"
                        title="Move back"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() => moveStage(deal.id, 1)}
                        disabled={STAGES.indexOf(deal.stage) === STAGES.length - 1}
                        className="p-1 rounded hover:bg-slate-200 disabled:opacity-20 text-slate-500 transition-colors"
                        title="Advance stage"
                      >
                        ›
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Add Deal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Add New Deal</h2>
            <div className="space-y-3">
              <input
                placeholder="Deal name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                placeholder="Company *"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                placeholder="Deal value (USD) *"
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <select
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value as Stage })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {STAGES.map((s) => <option key={s}>{s}</option>)}
              </select>
              <input
                placeholder="Owner"
                value={form.owner}
                onChange={(e) => setForm({ ...form, owner: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-slate-200 text-slate-600 rounded-lg py-2 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2 text-sm font-medium transition-colors"
              >
                Add Deal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
