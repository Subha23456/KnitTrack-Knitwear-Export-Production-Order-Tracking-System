# KnitTrack-Knitwear-Export-Production-Order-Tracking-System
A full-stack knitwear export production tracking system built with React, TypeScript, Node.js and Express. Features include TNA milestone tracking, daily production updates, AI-assisted Tamil issue categorisation, run-rate delay monitoring and a multi-tenant buyer portal.
# KnitTrack – Knitwear Export Production Order Tracking System

**Production Order Tracking with Multi-Tenant Buyer View & AI-Assisted Issue Management**

KnitTrack is a web-based production order tracking solution designed for knitwear export companies in Tiruppur. It helps merchandisers, floor supervisors, and buyers monitor production progress, track milestones, identify potential delays, and improve communication through a centralized platform.

## Project Links
- **Live Application:** https://ais-pre-a2bkzzm4scpewhcprbh3ck-235016284191.asia-southeast1.run.app

## Problem Statement

Knitwear export companies often depend on Excel sheets, phone calls, and manual updates to monitor production orders. This makes it difficult to identify delays, collect accurate production information, and provide timely updates to buyers.

KnitTrack aims to address these challenges by providing a centralized production tracking platform with role-based access, daily updates, milestone monitoring, and AI-assisted issue categorisation.

## Key Features

### 1. Production Order Management
- Create and manage export production orders.
- Maintain PO number, buyer, style, colour, and order quantity.
- Track ex-factory dates and production stages.
- Configure TNA milestones.

### 2. Production Tracking
- Record daily production quantities.
- Monitor stage-wise production progress.
- Capture production updates from floor supervisors.
- Track order completion status.

### 3. Production Status Dashboard
- Green – On Track
- Amber – At Risk
- Red – Delayed

Provides a quick overview of order progress and potential production delays.

### 4. Run-Rate Delay Monitoring
- Calculate remaining production quantity.
- Estimate required daily production.
- Compare required output with actual production.
- Identify orders that may miss their ex-factory dates.

### 5. AI-Assisted Tamil Issue Categorisation
- Support production issue reporting in Tamil.
- Generate English translations and suggested issue categories.
- Use predefined categories for common production problems.
- Allow merchandisers to review AI suggestions before buyer communication.

### 6. Supervisor Mobile Interface
- Mobile-friendly production update interface.
- Quick quantity entry.
- Tamil and English language support.
- Designed for factory-floor usage.

### 7. Multi-Tenant Buyer Portal
- Buyer-specific order visibility.
- Read-only production progress.
- Access to authorised order updates and photos.
- Separation of buyer information.

### 8. Audit and Reporting
- Track production milestone changes.
- Maintain date-change history.
- Support production reporting and buyer communication.

## User Roles

| Role | Responsibilities |
|---|---|
| Merchandiser | Manage orders, monitor production, review issues |
| Supervisor | Submit daily production updates and issue notes |
| Buyer | View authorised order progress and milestones |
| Managing Director | Monitor overall production and business performance |

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS |
| Build Tool | Vite |
| Backend | Node.js, Express.js |
| Database | SQLite |
| AI Integration | Google Gemini API |
| Icons | Lucide Icons |
| Testing | Vitest |

## System Architecture

The application follows a modular client-server architecture.

1. **Presentation Layer:** React-based interfaces for merchandisers, supervisors, buyers, and management.
2. **Application Layer:** Express REST APIs handle order management, production updates, authentication, and reporting.
3. **AI Layer:** AI-assisted Tamil issue categorisation with human review.
4. **Data Layer:** Database storage for users, orders, milestones, production logs, and audit records.

## Project Structure

```text
KnitTrack/
├── src/
│   ├── components/
│   ├── services/
│   ├── utils/
│   ├── test/
│   └── ...
├── data/
├── server.ts
├── package.json
├── vite.config.ts
├── tsconfig.json
├── .env.example
├── TDD.md
├── deployment.md
└── README.md
```

## Installation and Setup

### Prerequisites

- Node.js
- npm
- Git
- Visual Studio Code (recommended)

### Step 1: Clone the Repository

```bash
git clone https://github.com/Subha23456/Knitwear-exporter-s-production-order-tracking-app-with-buyer-view.git
```

### Step 2: Open the Project

```bash
cd Knitwear-exporter-s-production-order-tracking-app-with-buyer-view
```

### Step 3: Install Dependencies

```bash
npm install
```

### Step 4: Configure Environment Variables

Create a `.env` file in the root directory and configure the required values.

```env
GEMINI_API_KEY=your_gemini_api_key
PORT=3000
APP_URL=http://localhost:3000
NODE_ENV=development
```

Never commit API keys or passwords to the repository.

### Step 5: Start the Application

```bash
npm run dev
```

Open the local URL displayed in the terminal.

## Sample Production Orders

| PO Number | Buyer | Product | Quantity | Ex-Factory |
|---|---|---|---:|---|
| B-PO-88213 | Company B | Men's Crew Neck Tee | 12,000 | 20-Nov-2026 |
| B-PO-88240 | Company B | Men's Polo | 8,000 | 12-Nov-2026 |
| C-PO-0488 | Company C | Kids Printed Tee | 10,000 | 28-Nov-2026 |

## Future Enhancements

- Improved offline-first synchronisation.
- Advanced production analytics.
- Tamil voice-to-text enhancements.
- Automated weekly PDF and Excel reports.
- Enhanced production delay prediction.
- Persistent cloud database and image storage.

## Project Objective

KnitTrack aims to improve production visibility, reduce manual follow-ups, identify production delays earlier, and provide buyers with transparent order progress.

**Developed as a production tracking solution for the knitwear export industry in Tiruppur, Tamil Nadu.**
