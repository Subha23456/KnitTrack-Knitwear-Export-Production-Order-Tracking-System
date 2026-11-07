# KnitTrack Tiruppur — Knitwear Production Order-Tracking System

[![Live Demo](https://img.shields.io/badge/Demo-Live%20App-emerald?style=flat-square)](https://ais-pre-a2bkzzm4scpewhcprbh3ck-235016284191.asia-southeast1.run.app)
[![Repository](https://img.shields.io/badge/GitHub-Subha23456%2FKnitTrack-blue?style=flat-square)](https://github.com/Subha23456/Knitwear-exporter-s-production-order-tracking-app-with-buyer-view/)

Production order-tracking application with isolated buyer views built for **Company A, Tiruppur**, a high-volume knitwear garment exporter to UK and EU retailers (annual turnover ₹95–110 Crore).

---

## The Client's Problem & Financial Exposure

Today, Company A tracks 500 export orders a year via phone calls and fragmented Excel spreadsheets:
- **8% of orders ship late (40 orders/year).**
- **15 orders require emergency air-freight** at ₹3.50 Lakh extra penalty = **₹52.50 Lakh**.
- **25 orders incur a 5% buyer discount penalty** at ₹1.05 Lakh average = **₹26.25 Lakh**.
- **12 merchandisers spend 2 hours a day chasing factory floor status** = 7,200 hours/year @ ₹400 = **₹28.80 Lakh**.
- **Total annual loss:** **₹1.08 Crore per year**.

---

## Core Implemented Capabilities

### 1. Production Order Setup with TNA Milestones
- PO setup with style, product specification, FOB price per piece, and ex-factory dispatch date.
- Colourway and size breakdown matrix (S, M, L, XL) with auto-computed total quantities and order rupee value.
- Automated 8-stage Time-and-Action (TNA) schedule generator (Fabric In-House, Cutting, Printing, Stitching, Washing, Finishing, Final QC, Packing/Ex-Factory) based on standard Tiruppur lead-time proportions.

### 2. Floor Supervisor Mobile Interface (Tamil UI & Offline Queue)
- Mobile-first, touch-friendly UI optimized for low-memory (2–3 GB RAM) floor smartphones.
- **Language Toggle:** Instant switch between English and Tamil (தமிழ்).
- **Tamil Voice & Text Input:** Real Web Speech API recognition in Tamil (`ta-IN`) and English, with offline audio memo recording fallback.
- **AI Categorization (Gemini 3.8 Flash):** Translates Tamil floor notes into English, classifies root causes into 8 standardized apparel categories, and calculates a confidence score.
- **Offline Storage Queue:** Automatically stores submissions locally when factory Wi-Fi or cellular connectivity drops, with a 1-tap background synchronization queue.

### 3. Order Board with Run-Rate Delay Mathematics
- **Traffic Light Indicators:** Green (on track), Amber (tight margin / 1–3 day slip), and Red (critical run-rate deficit / air-freight risk).
- **The Mathematics Breakdown:** Shows the exact working formula:
  - $\text{Remaining Quantity } (R) = \text{Target} - \text{Completed}$
  - $\text{Working Days Remaining } (D) = \text{Days until Ex-Factory excluding factory Sundays}$
  - $\text{Required Daily Run Rate} = R / D$
  - $\text{Current Daily Run Rate} = \text{3-Day average floor output}$
  - $\text{Projected Slip} = \text{Projected Date} - \text{Ex-Factory Date}$
  - $\text{Financial Risk} = \text{Air-freight surcharge (₹3.50L) + 5% late discount exposure}$

### 4. Human-in-the-Loop Merchandiser Delay Gate
- Supervisor Tamil notes and AI-generated English translations display side-by-side.
- Merchandisers can override the reason category and add internal notes.
- **Quarantine Gate:** Delays do NOT reach buyers unverified. Merchandisers must formulate a concrete mitigation plan before publishing to the Buyer Portal.

### 5. Strict Multi-Tenant Buyer Portal & Compliance Audit Trail
- **Server-Enforced Tenant Isolation:** European buyers (e.g., Company B UK, Company C Germany) access only their own orders. Query parameter tampering is strictly rejected.
- **Date Change Compliance History:** Every ex-factory date shift is permanently recorded in the audit trail with the previous date, new date, change justification, author, and timestamp.
- **Verified QC Photos & Status Export:** Buyers can view verified inspection photos and download their Weekly Status Report in Excel/CSV format.

### 6. Executive Managing Director (MD) Financial Risk Dashboard
- Real-time tracking against Company A's ₹1.08 Crore loss problem.
- Progress metrics toward reducing late shipments from 8% to 5%, halving chasing time, and reducing buyer status emails by 60%.

---

## Tech Stack

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Motion.
- **Backend:** Node.js, Express, tsx.
- **Database:** SQLite (`better-sqlite3`) with WAL mode and foreign key constraints.
- **AI Service:** Gemini 3.8 Flash via `@google/genai` TypeScript SDK (with built-in offline NLP fallback).

---

## Installation & Local Run

### Prerequisites
- Node.js 18.x or 20.x+
- npm 9.x+

### Quick Start
```bash
# 1. Clone the repository
git clone https://github.com/Subha23456/Knitwear-exporter-s-production-order-tracking-app-with-buyer-view.git
cd Knitwear-exporter-s-production-order-tracking-app-with-buyer-view

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env

# 4. Run automated tests (24 Vitest test cases)
npm test

# 5. Start the application in development mode
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Production Build & Verification
```bash
npm run lint    # TypeScript check (tsc --noEmit)
npm run build   # Production bundle in dist/
npm start       # Production server (node server.ts)
```

---

## Reviewer Demo Logins

The application includes a 1-click **Role Switcher** in the top navigation bar. You can also sign in using the following demo credentials:

| Persona / Role | Name | Email | Password | Primary Screen |
| :--- | :--- | :--- | :--- | :--- |
| **Senior Merchandiser** | Priya Rajan | `priya.rajan@companya-knits.com` | `tiruppur123` | Production Board |
| **Floor Supervisor** | Murugan Kandasamy (முருகன்) | `murugan.unit1@companya-knits.com` | `tiruppur123` | Supervisor Mobile (தமிழ்) |
| **Buyer (Company B - UK)** | John Smith | `j.smith@companyb-retail.co.uk` | `tiruppur123` | Buyer Portal (B-PO only) |
| **Buyer (Company C - Germany)** | Hans Weber | `h.weber@companyc-textil.de` | `tiruppur123` | Buyer Portal (C-PO only) |
| **Managing Director** | K. Shanmugam | `ks@companya-knits.com` | `tiruppur123` | MD Financial Risk View |

---

## Repository Files
- `/TDD.md`: Technical Design Document.
- `/deployment.md`: Step-by-step deployment and operational manual.
- `/data/knittrack.db`: SQLite database file (created on launch).
