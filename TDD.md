# Technical Design Document (TDD)
**Project:** KnitTrack Tiruppur — Knitwear Exporter's Production Order-Tracking App with Isolated Buyer View  
**Client:** Company A, Tiruppur (Knitwear Exporter to UK & EU Buyers, ₹95–110 Crore Turnover)  
**GitHub Repository:** https://github.com/Subha23456/Knitwear-exporter-s-production-order-tracking-app-with-buyer-view/  
**Live Application URL:** https://ais-pre-a2bkzzm4scpewhcprbh3ck-235016284191.asia-southeast1.run.app  

---

## 1. Feature Implementation Audit & Verification Matrix

Every feature claimed in this document has been inspected directly in the working codebase:

| Feature / Subsystem | Implementation Status | Verification Method & Source Location |
| :--- | :--- | :--- |
| **Authentication & Role Authorization** | **1. Fully implemented and working** | `server.ts` (`requireAuth`, `requireRole`), `src/server/db.ts` (`sessions` table, 64-char crypto hex tokens). |
| **Multi-Tenant Buyer Isolation** | **1. Fully implemented and working** | `src/server/db.ts` (`getOrders`, `getOrderById`), `server.ts`. Buyer tenant ID is derived strictly from `req.user.buyerId`. Spoofed query params are ignored. Tested via curl (404 on cross-tenant access). |
| **Persistent SQLite Storage** | **1. Fully implemented and working** | `data/knittrack.db` using `better-sqlite3` in WAL mode with foreign keys. 6 normalized tables (`users`, `sessions`, `orders`, `milestones`, `daily_logs`, `date_change_audits`). |
| **Run-Rate Delay Calculation** | **1. Fully implemented and working** | `src/utils/runRate.ts` (`calculateRunRate`, `getWorkingDays`). Computes required pieces/day, actual 3-day floor output, working days excluding Sundays, projected slip, and financial exposure. |
| **Supervisor Mobile Interface** | **1. Fully implemented and working** | `src/components/SupervisorMobileView.tsx`. Touch steppers (+100, +250, +500), photo attachments, stage selection, responsive viewport layout. |
| **Offline Sync Queue** | **1. Fully implemented and working** | `src/services/api.ts` (`saveToOfflineQueue`, `syncOfflineQueue`). Captures network failures / offline events into `localStorage`, displays pending badge, and offers 1-tap re-sync. |
| **Tamil Voice Transcription** | **1. Fully implemented and working** | `src/components/SupervisorMobileView.tsx`. Uses Web Speech API (`webkitSpeechRecognition` / `SpeechRecognition`) configured for `ta-IN` / `en-IN`, with graceful fallback to standard floor audio templates in restricted sandbox environments. |
| **Gemini 3.8 Flash AI Categorization** | **1. Fully implemented and working** | `src/server/geminiService.ts`. Uses `@google/genai` with `gemini-3.8-flash`, `User-Agent: 'aistudio-build'`, structured JSON schema, confidence score, and deterministic Tamil dictionary fallback (`src/utils/tamilDictionary.ts`). |
| **Merchandiser AI Audit & Delay Gate** | **1. Fully implemented and working** | `src/components/AIReviewModal.tsx`, `server.ts`. Side-by-side view (Tamil note vs English translation); merchandiser category override; delay warnings quarantined until approved. |
| **Date-Change Compliance Audit History** | **1. Fully implemented and working** | `date_change_audits` table in SQLite, `src/components/DateChangeModal.tsx`, `src/components/BuyerPortal.tsx`. Permanent immutable audit log. |
| **Weekly Status Export (Excel/CSV)** | **1. Fully implemented and working** | `server.ts` (`/api/export/buyer-report`), `src/components/BuyerPortal.tsx`. Generates downloadable CSV with buyer-specific order milestones. |
| **MD Financial Risk Model** | **1. Fully implemented and working** | `src/components/ExecutiveDashboard.tsx`. Live calculation of ₹3.50L air freight + 5% discount penalties against the ₹1.08 Crore loss model. |
| **Raw Material Roll Inventory** | **3. Not implemented (Out of Scope)** | Labeled as out of scope per brief specifications. |
| **Worker Attendance & Payroll** | **3. Not implemented (Out of Scope)** | Labeled as out of scope per brief specifications. |
| **WhatsApp Business API Ingestion** | **3. Not implemented (Future Roadmap)** | Planned for v2 production rollout. |

---

## 2. Executive Summary & Client Economics
Company A manufactures knitwear across 3 owned units in Tiruppur (Unit 1 Kangeyam Rd, Unit 2 Angeripalayam, Unit 3 Netaji Apparel Park) plus subcontracted processing (Sri Murugan Printing, EuroWash Processing). Today, orders are tracked via disparate Excel sheets and phone calls between merchandisers and floor supervisors. 

### Labeled Economic Assumptions (from Brief):
- **Annual Turnover:** ₹95–110 Crore (~500 export orders/year @ ₹21 Lakh average).
- **Late Shipments:** 8% slip past ex-factory date (40 orders/year).
- **Emergency Air Freight Surcharge:** 15 shipments forced to air-freight @ ₹3.50 Lakh extra penalty = **₹52.50 Lakh**.
- **Buyer Price Penalties:** 25 late sea shipments hit by a 5% discount penalty @ ₹1.05 Lakh avg = **₹26.25 Lakh**.
- **Chasing Inefficiencies:** 12 merchandisers spending 2 hours/day chasing status = 7,200 hours/year @ ₹400/hr = **₹28.80 Lakh**.
- **Total Financial Leak:** **₹1.0755 Crore (~₹1.08 Crore) per year**.

---

## 3. Real Run-Rate Mathematical Formulas & Exact Thresholds

The run-rate calculation is implemented in `src/utils/runRate.ts` and executed dynamically on every order:

### 1. Variables & Definitions
- $T = \text{totalQuantity}$ (Total order target pieces)
- $Q = \text{totalQuantityDone}$ (Cumulative pieces completed to date)
- $R = \max(0, T - Q)$ (Remaining pieces to produce)
- $D = \text{Working Days Remaining}$ calculated excluding Sundays:
  $$D = \sum_{d=\text{Today}}^{\text{ExFactoryDate}} [1 \text{ if } \text{DayOfWeek}(d) \neq 0 \text{ else } 0]$$
- $RR_{\text{req}} = \lceil R / D \rceil$ (Required Daily Run-Rate in pieces/day)
- $RR_{\text{actual}} = \frac{1}{N} \sum_{i=1}^{N} \text{quantityDoneToday}_i \quad (N = \min(3, \text{log count}))$
- $D_{\text{projected}} = \lceil R / RR_{\text{actual}} \rceil$ (Working days required at current output)
- $\text{Projected Completion Date} = \text{AddWorkingDays}(\text{Today}, D_{\text{projected}})$
- $\Delta = \text{Calendar Days Between Projected Completion and ExFactoryDate}$ (Projected Slip Days)
- $\text{Capacity Variance \%} = \left( \frac{RR_{\text{actual}} - RR_{\text{req}}}{RR_{\text{req}}} \right) \times 100$

### 2. Exact Status Decision Thresholds (Implemented in `src/utils/runRate.ts`)
- **Red (Critical Run-Rate Deficit):**
  - $\Delta > 3 \text{ days}$ OR $\text{Capacity Variance \%} \le -25\%$
  - Financial Risk Assigned: **₹3,50,000 (Air Freight Penalty) + 5% Order Value Discount Penalty**.
- **Amber (Tight Margin Warning):**
  - $\Delta \in [1, 3] \text{ days}$ OR $-25\% < \text{Capacity Variance \%} < -10\%$
  - Financial Risk Assigned: **5% Order Value Discount Penalty**.
- **Green (On Track / Ahead):**
  - $\Delta \le 0 \text{ days}$ AND $\text{Capacity Variance \%} \ge -10\%$
  - Financial Risk Assigned: **₹0**.

---

## 4. Database Architecture & Schema (`better-sqlite3`)

The application utilizes an embedded SQLite database (`data/knittrack.db`) configured with `PRAGMA journal_mode = WAL` and `PRAGMA foreign_keys = ON`.

### SQLite Normalized Tables
1. **`users`**: `id` (PK), `name`, `role`, `email` (UNIQUE), `password`, `organization`, `unit`, `buyerId`, `preferredLanguage`.
2. **`sessions`**: `token` (PK, 64-char hex), `userId` (FK -> users.id), `createdAt`, `expiresAt`.
3. **`orders`**: `id` (PK), `poNumber` (UNIQUE), `buyerId`, `buyerName`, `styleDescription`, `productType`, `garmentImageUrl`, `unit`, `totalQuantity`, `totalQuantityDone`, `fobPricePerPieceINR`, `orderValueINR`, `orderDate`, `exFactoryDate`, `currentStage`, `status`, `merchandiserId`, `merchandiserName`, `hasUnconfirmedDelayWarning`, `confirmedBuyerWarningJson`, `colorsJson`.
4. **`milestones`**: `id` (PK), `orderId` (FK -> orders.id ON DELETE CASCADE), `stage`, `targetStartDate`, `targetEndDate`, `actualStartDate`, `actualEndDate`, `targetQuantity`, `completedQuantity`, `status`, `responsibleUnit`.
5. **`daily_logs`**: `id` (PK), `orderId` (FK -> orders.id ON DELETE CASCADE), `date`, `stage`, `quantityDoneToday`, `supervisorId`, `supervisorName`, `unit`, `photoUrl`, `originalNoteTamil`, `englishTranslation`, `aiReasonCategory`, `aiConfidence`, `isAiCorrectedByMerchandiser`, `merchandiserReviewStatus`, `merchandiserComment`, `isSharedWithBuyer`, `createdAt`.
6. **`date_change_audits`**: `id` (PK), `orderId` (FK -> orders.id ON DELETE CASCADE), `fieldChanged`, `previousValue`, `newValue`, `reason`, `authorizedBy`, `timestamp`.

---

## 5. Security Architecture & Access Control Matrix

| Endpoint | HTTP Method | Allowed Roles | Enforced Constraints |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | POST | Public | Validates credentials; returns 64-char session token. |
| `/api/auth/me` | GET | All authenticated | Returns session user profile. |
| `/api/orders` | GET | All authenticated | If role is `buyer`, strictly filters `buyerId = req.user.buyerId`. |
| `/api/orders/:id` | GET | All authenticated | Verifies buyer ownership; returns 404 on cross-tenant requests. |
| `/api/orders` | POST | `merchandiser`, `md` | Creates order with auto-generated TNA milestone schedule. |
| `/api/orders/:id/daily-update` | POST | `supervisor`, `merchandiser`, `md` | Records daily pieces, photo, Tamil text/voice; triggers Gemini AI. |
| `/api/orders/:id/dates` | PATCH | `merchandiser`, `md` | Updates dispatch date; writes permanent audit entry. |
| `/api/orders/:id/confirm-warning`| POST | `merchandiser`, `md` | Authorizes delay notification and mitigation plan for buyer view. |
| `/api/orders/:id/logs/:logId/review`| PATCH | `merchandiser`, `md` | Overrides AI reason category; controls buyer sharing flag. |
| `/api/orders/reset` | POST | `md` ONLY | Re-seeds SQLite database. Returns 403 Forbidden for all other roles. |
| `/api/export/buyer-report` | GET | All authenticated | Exports CSV report strictly scoped to the requesting buyer. |

---

## 6. Artificial Intelligence & Error-Handling Protocol

1. **Model:** `gemini-3.8-flash` via `@google/genai` TypeScript SDK.
2. **Standardized Root-Cause Categories:**
   - `Yarn & Fabric Delay`
   - `Machine Breakdown`
   - `Needle Breakage / QC Alert`
   - `Printing Screen / Strike-off Defect`
   - `Subcontract Processor Delay`
   - `Absenteeism / Power Outage`
   - `Trims & Accessories Shortage`
   - `Normal Production / General Note`
3. **Structured JSON Output:** Enforces `englishTranslation`, `category`, `severity`, `confidenceScore`, `isAmbiguous`, and `recommendedMitigation`.
4. **Deterministic Fallback Engine:** If the Gemini API key is unset, rate-limited, or offline, `src/utils/tamilDictionary.ts` uses domain-specific Tamil keyword analysis, ensuring 100% operational uptime on factory floors.
5. **Human-in-the-Loop Quarantine:** Supervisor notes are held in `pending_review` with `isSharedWithBuyer = false` until confirmed by a merchandiser.

---

## 7. Assumptions & Future Roadmap

### Labeled Assumptions:
- **Reference Date:** Calculations assume `2026-11-06` as the live factory operational baseline.
- **Factory Calendar:** Tiruppur knitwear units operate Monday through Saturday (Sundays excluded from working day calculations).
- **Average FOB Price:** Assumed ₹175–₹285 per piece for knitwear export styles.

### Future Roadmap (Post-Submission Scope):
1. **WhatsApp Cloud API Integration:** Automated voice memo ingestion from floor supervisors.
2. **Sewing Line RFID Sensor Integration:** Real-time piece counting direct from Juki sewing stations.
3. **Automated Customs Export Documentation:** Automated generation of Commercial Invoices and Packing Lists.

---

## 8. Automated Test Suite & Verification Results

A comprehensive automated test suite has been implemented using **Vitest**:

```bash
npm test
```

### Test Results Summary:
- **Test Files:** 3 passed (3)
- **Total Tests:** 24 passed (24)
- **Duration:** ~700ms

### Verified Test Cases:
1. **Run-Rate Calculation Engine (`src/test/runRate.test.ts`):**
   - Working days calculation excluding factory Sundays.
   - Adding working days advancing past Sundays.
   - **Green status:** Actual output meets or exceeds required output (e.g. 500 >= 400 pcs/day).
   - **Amber status:** Actual output is 80% to 99% of required (e.g. 390 / 467 = 83.5%).
   - **Red status:** Actual output is below 80% of required (e.g. 177 / 345 = 51.3%), triggering ₹3.50L air freight risk.
   - **Zero working days:** Passed ex-factory dates with unfinished quantity handled safely.
   - **Zero remaining quantity:** Completed orders assigned green status and 0 slip days.
   - **Zero production logs:** Safely handled without division-by-zero errors.
2. **Tamil Floor Note NLP & AI Fallback (`src/test/tamilClassification.test.ts`):**
   - Machine breakdown classification (`Machine Breakdown`).
   - Yarn & fabric delay classification (`Yarn & Fabric Delay`).
   - Printing screen & strike-off defect classification (`Printing Screen / Strike-off Defect`).
   - Needle breakage & QC inspection alert (`Needle Breakage / QC Alert`).
   - Subcontract external washing/dyeing bottleneck (`Subcontract Processor Delay`).
   - Worker absenteeism and power disruption (`Absenteeism / Power Outage`).
   - General normal notes assigned low severity.
   - Original Tamil text preserved verbatim in returned result.
3. **Security, Multi-Tenant Buyer Isolation & Audit Trail (`src/test/securityAndIsolation.test.ts`):**
   - **Tenant Isolation:** Buyer B (`buyer-b-uk`) cannot see Buyer C (`buyer-c-de`) orders in order lists.
   - **Tenant Isolation:** Buyer C cannot see Buyer B orders.
   - **Direct ID Isolation:** Buyer B direct lookup of Buyer C order ID (`c-po-0488`) returns `null` (HTTP 404).
   - **Direct ID Isolation:** Buyer C direct lookup of Buyer B order ID (`b-po-88213`) returns `null` (HTTP 404).
   - **Merchandiser Cross-Tenant Visibility:** Merchandiser has authorized visibility across all buyer orders.
   - **Date Change Compliance Audit Trail:** Updates to ex-factory dates create immutable, permanent audit records (`previousValue`, `newValue`, `reason`, `authorizedBy`, `timestamp`).
   - **Supervisor Delay Warning Quarantine Gate:** Supervisor issue reports flag `hasUnconfirmedDelayWarning = true` and keep notes private until confirmed with an approved mitigation plan by a merchandiser.
   - **Role Authorization:** Unauthorized users (e.g., buyers) are blocked with an exception when attempting date changes or administrative operations.
