# deployment.md — Deployment & Operational Run Guide

**Project:** KnitTrack Tiruppur — Knitwear Exporter's Production Order Tracking System  
**Client:** Company A, Tiruppur (Knitwear Exporter to UK and EU Buyers, Turnover ₹95–110 Crore)  
**Framework:** React 19 + Express + SQLite (better-sqlite3) Full-Stack Application  
**GitHub Repository:** https://github.com/Subha23456/Knitwear-exporter-s-production-order-tracking-app-with-buyer-view/  
**Live Application URL:** https://ais-pre-a2bkzzm4scpewhcprbh3ck-235016284191.asia-southeast1.run.app  

---

## 1. Prerequisites

Before installing, ensure your environment meets the following requirements:
- **Node.js:** version 18.x, 20.x, or 22.x+ (`node -v`)
- **npm:** version 9.x or 10.x+ (`npm -v`)
- **Operating System:** Linux, macOS, or Windows (WSL2 recommended)
- **Git:** version 2.x+ (`git -v`)

---

## 2. Step-by-Step Local Installation

### Step 1: Clone the GitHub Repository
```bash
git clone https://github.com/Subha23456/Knitwear-exporter-s-production-order-tracking-app-with-buyer-view.git
cd Knitwear-exporter-s-production-order-tracking-app-with-buyer-view
```

### Step 2: Install Project Dependencies
```bash
npm install
```
This installs:
- Core runtime: `react`, `react-dom`, `express`, `better-sqlite3`, `@google/genai`, `lucide-react`, `dotenv`.
- Developer tooling: `typescript`, `vite`, `tsx`, `@tailwindcss/vite`, `vitest`.

### Step 3: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(See Section 5 for the exact list of environment variable names).*

### Step 4: Run Automated Verification Tests
```bash
npm test
```
Executes all 24 Vitest test cases covering:
- Mathematical run-rate calculations and working day counting excluding Sundays.
- Status classification thresholds (Green $\ge 100\%$, Amber $80\%\text{--}99\%$, Red $< 80\%$).
- Tamil floor note NLP classification and fallback handling.
- Strict multi-tenant buyer isolation (Buyer B vs Buyer C data segregation).
- Immutable date-change compliance audit trail creation.
- Supervisor delay warning quarantine and merchandiser gatekeeping.

### Step 5: Start Development Server
```bash
npm run dev
```
The application will start on:
`http://localhost:3000`

---

## 3. Database Architecture & Setup

- **Storage Engine:** SQLite embedded database via `better-sqlite3`.
- **Location:** `data/knittrack.db`
- **Configuration:** Initialized with `PRAGMA journal_mode = WAL;` and `PRAGMA foreign_keys = ON;`.
- **Automatic Initialization:** The application automatically creates the `data/` directory and creates all tables on first startup (`users`, `sessions`, `orders`, `milestones`, `daily_logs`, `date_change_audits`).
- **Seed Data:** Populates the exact three demo orders required by the client brief (`B-PO-88213`, `B-PO-88240`, `C-PO-0488`) and the five authorized user accounts.
- **Manual Reset (MD Only):** An authorized Managing Director can trigger a database reset via the UI or by deleting `data/knittrack.db` and restarting the application.

---

## 4. Production Build & Deployment

### Step 1: TypeScript Lint Check
```bash
npm run lint
```
Runs `tsc --noEmit` to verify type safety across all components and server modules.

### Step 2: Production Client Build
```bash
npm run build
```
Compiles client assets with Vite into `dist/` (`dist/index.html`, `dist/assets/`).

### Step 3: Launch Production Server
```bash
npm start
```
Starts the Node.js production server (`node server.ts`) listening on port 3000 (or `process.env.PORT`), serving the production client bundle and `/api/*` endpoints.

### Container / Cloud Run Deployment:
```bash
# Dockerfile build & run
docker build -t knittrack .
docker run -p 3000:3000 -e PORT=3000 knittrack
```

---

## 5. Environment Variables

The application references the following environment variables (defined in `.env.example`). Never commit secret keys or production credentials to the repository.

| Variable Name | Purpose | Required / Optional |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Server-side Gemini 3.8 Flash API key for Tamil note translation & root-cause categorization. | Optional (app has built-in offline NLP fallback) |
| `PORT` | HTTP port on which the Express server listens (default: 3000). | Optional (defaults to 3000) |
| `APP_URL` | Self-referential URL where the applet is hosted on Cloud Run. | Injected by Cloud Run / AI Studio |
| `NODE_ENV` | Environment mode (`development` or `production`). | Optional |

---

## 6. Reviewer Demo Login Details

The application includes a **Login Screen** and a **1-Click Quick Demo Sign-In** with the following safe credentials:

| Role / Persona | Name | Email | Password | Primary Screen / Destination |
| :--- | :--- | :--- | :--- | :--- |
| **Senior Merchandiser** | Priya Rajan | `priya.rajan@companya-knits.com` | `tiruppur123` | **Production Order Board**<br>Access: Create POs, review TNA schedules, inspect run-rate proofs, audit AI Tamil translations, and approve buyer delay warnings. |
| **Floor Supervisor** | Murugan Kandasamy (முருகன்) | `murugan.unit1@companya-knits.com` | `tiruppur123` | **Floor Supervisor Mobile (தமிழ்)**<br>Access: Mobile touch steppers (+100, +250, +500), Tamil audio/text note input, offline queue & 1-tap sync. |
| **Buyer (Company B - UK)** | John Smith | `j.smith@companyb-retail.co.uk` | `tiruppur123` | **Buyer Portal (Company B POs only)**<br>Access: Strict multi-tenant isolation, sees ONLY Company B orders (`B-PO-88213`, `B-PO-88240`), zero access to other buyers, milestone tracking, verified QC photos, CSV export. |
| **Buyer (Company C - Germany)** | Hans Weber | `h.weber@companyc-textil.de` | `tiruppur123` | **Buyer Portal (Company C POs only)**<br>Access: Strict multi-tenant isolation, sees ONLY Company C orders (`C-PO-0488`), zero access to other buyers. |
| **Managing Director** | K. Shanmugam | `ks@companya-knits.com` | `tiruppur123` | **Executive Financial Dashboard**<br>Access: ₹1.08 Crore annual loss tracking, ₹3.50L air freight + 5% discount risks, season targets. |

---

## 7. Troubleshooting Guide

| Issue | Likely Cause | Solution |
| :--- | :--- | :--- |
| `Error: listen EADDRINUSE: address already in use 0.0.0.0:3000` | Another process is occupying port 3000. | Stop the existing process: `fuser -k 3000/tcp` or start with `PORT=3005 npm run dev`. |
| `SQLite database is locked` | Concurrent write lock held. | The app uses WAL mode (`journal_mode = WAL`). Ensure write permissions on `data/` directory. |
| `Gemini API key missing or rate-limited` | `GEMINI_API_KEY` not configured. | The system automatically engages its deterministic Tamil NLP classifier (`src/utils/tamilDictionary.ts`). Zero app crashes. |
| `Buyer receives HTTP 404 for an order` | Tenant isolation policy working as intended. | Buyers can only view orders where `buyerId` matches their authenticated session. |
| `Offline queue not syncing` | Browser localStorage disabled or cleared. | Verify browser storage permissions; use the "Sync Offline" button in the navigation bar. |
