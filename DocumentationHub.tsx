import React, { useState } from 'react';
import { Copy, Check, Download, FileText, Server, ExternalLink } from 'lucide-react';

export const DocumentationHub: React.FC = () => {
  const [activeDoc, setActiveDoc] = useState<'tdd' | 'deploy'>('tdd');
  const [copied, setCopied] = useState<boolean>(false);

  const tddContent = `# Technical Design Document (TDD)
Project: KnitTrack Tiruppur — Knitwear Production Order-Tracking App with Isolated Buyer View
Client: Company A, Tiruppur (Knitwear Exporter to UK & EU Buyers, ₹95–110 Crore Turnover)
Live Application URL: https://ais-pre-a2bkzzm4scpewhcprbh3ck-235016284191.asia-southeast1.run.app
GitHub Repository: https://github.com/Subha23456/Knitwear-exporter-s-production-order-tracking-app-with-buyer-view/

1. Feature Verification & Audit Summary:
- Authentication & Roles: Fully implemented (requireAuth, requireRole, 64-char crypto session tokens in SQLite).
- Multi-Tenant Buyer Isolation: Fully implemented (server derives buyerId strictly from authenticated user; spoofed params ignored).
- SQLite Database: Fully implemented (better-sqlite3 in WAL mode with normalized tables).
- Run-Rate Mathematics: Fully implemented (working days excluding Sundays, 3-day average output, exact rupee risk).
- Supervisor Mobile UI: Fully implemented (Tamil toggle, Web Speech API ta-IN, offline queue & 1-tap sync).
- Gemini 3.8 Flash AI: Fully implemented (structured JSON output with deterministic Tamil fallback).
- Merchandiser Delay Gate: Fully implemented (unconfirmed warnings quarantined until approved).
- Date Change Compliance Audit: Fully implemented (immutable SQLite audit history table).

2. Real Run-Rate Mathematical Formulas:
- Remaining Qty (R) = Target Qty (T) - Total Completed (Q)
- Working Days Remaining (D) = Ex-Factory Date minus Today, excluding Sundays
- Required Daily Rate = Ceiling(R / D)
- Current Daily Rate = 3-Day supervisor log average
- Projected Working Days to Finish = Ceiling(R / Current Rate)
- Projected Slip = Projected Date - Ex-Factory Date
- Capacity Variance % = ((Current Rate - Required Rate) / Required Rate) * 100

3. Exact Status Decision Thresholds:
- Red: Slip > 3 days OR Capacity Variance <= -25% (Risk: ₹3.50L air-freight + 5% discount penalty).
- Amber: Slip in [1, 3] days OR Capacity Variance in (-25%, -10%) (Risk: 5% discount penalty).
- Green: Slip <= 0 days AND Capacity Variance >= -10% (Risk: ₹0).`;

  const deployContent = `# deployment.md — Deployment & Local Run Guide
Framework: React 19 + Express + SQLite (better-sqlite3)
Port: 3000
GitHub Repository: https://github.com/Subha23456/Knitwear-exporter-s-production-order-tracking-app-with-buyer-view/

1. Local Setup Instructions:
   git clone https://github.com/Subha23456/Knitwear-exporter-s-production-order-tracking-app-with-buyer-view.git
   cd Knitwear-exporter-s-production-order-tracking-app-with-buyer-view
   npm install
   cp .env.example .env
   npm run dev

2. Environment Variables:
   - GEMINI_API_KEY (Server-side Gemini 3.8 Flash execution)
   - PORT (Default: 3000)
   - APP_URL (Cloud Run host URL)

3. Reviewer Demo Logins:
   - Senior Merchandiser (Priya Rajan): Full board, order creation, AI review & warning gate.
   - Floor Supervisor (Murugan Kandasamy): Tamil mobile interface, voice note, offline queue & sync.
   - Buyer (Company B UK - John Smith): Strictly B-PO orders, milestone roadmap, photos, CSV export.
   - Buyer (Company C Germany - Hans Weber): Strictly C-PO orders, tenant isolated.
   - Managing Director (K. Shanmugam): Financial risk exposure model (₹1.08 Crore tracker).`;

  const handleCopy = () => {
    const text = activeDoc === 'tdd' ? tddContent : deployContent;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
            Submission Deliverables Hub
          </span>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
            Technical Design Document (TDD) & deployment.md
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Both files are stored in the root repository (/TDD.md and /deployment.md) and viewable below.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setActiveDoc('tdd')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                activeDoc === 'tdd' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              1. TDD (Technical Design)
            </button>
            <button
              onClick={() => setActiveDoc('deploy')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                activeDoc === 'deploy' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              2. deployment.md
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Content Viewer */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap max-h-[600px] overflow-y-auto bg-slate-50/50">
        {activeDoc === 'tdd' ? tddContent : deployContent}
      </div>
    </div>
  );
};
