import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { db } from './src/server/db.ts';
import { analyzeTamilNote } from './src/server/geminiService.ts';
import { calculateRunRate } from './src/utils/runRate.ts';
import type { User, UserRole } from './src/types.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Enable Cross-Origin Resource Sharing (CORS) for external browser access & iframes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.removeHeader('X-Frame-Options');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Serve public directory and images statically
const publicDir = path.resolve(process.cwd(), 'public');
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
}
app.use('/images', express.static(path.resolve(process.cwd(), 'public', 'images')));
app.use('/src/assets/images', express.static(path.resolve(process.cwd(), 'public', 'images')));

// Extend Express Request with authenticated user
interface AuthenticatedRequest extends Request {
  user?: User;
}

// -----------------------------------------------------------------------------
// Authentication & Authorization Middlewares
// -----------------------------------------------------------------------------
function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      error: 'Authentication required. Please log in or provide a valid Bearer token.',
    });
  }

  const user = db.getUserBySessionToken(token);
  if (!user) {
    return res.status(401).json({
      error: 'Session expired or invalid authentication token. Please log in again.',
    });
  }

  req.user = user;
  next();
}

function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Action requires one of [${allowedRoles.join(', ')}] permissions. Current role is '${req.user.role}'.`,
      });
    }
    next();
  };
}

// -----------------------------------------------------------------------------
// Authentication Endpoints
// -----------------------------------------------------------------------------
app.get('/api/auth/demo-credentials', (req, res) => {
  const credentials = [
    {
      id: 'user-merchandiser-1',
      name: 'Priya Rajan',
      role: 'merchandiser',
      email: 'priya.rajan@companya-knits.com',
      passwordHint: 'tiruppur123',
      organization: 'Company A (Tiruppur)',
      description: 'Senior Merchandiser — Full access to board, order creation, date revision audits, and delay warning gates.',
    },
    {
      id: 'user-supervisor-1',
      name: 'Murugan Kandasamy (முருகன்)',
      role: 'supervisor',
      email: 'murugan.unit1@companya-knits.com',
      passwordHint: 'tiruppur123',
      organization: 'Unit 1 (Kangeyam Rd)',
      description: 'Floor Supervisor — Mobile-first touch interface, Tamil audio/text input, offline queue & sync.',
    },
    {
      id: 'user-buyer-b',
      name: 'John Smith',
      role: 'buyer',
      email: 'j.smith@companyb-retail.co.uk',
      passwordHint: 'tiruppur123',
      organization: 'Company B (UK)',
      description: 'Buyer (UK) — Strictly isolated view of Company B orders, milestone timeline, verified photos, and status export.',
    },
    {
      id: 'user-buyer-c',
      name: 'Hans Weber',
      role: 'buyer',
      email: 'h.weber@companyc-textil.de',
      passwordHint: 'tiruppur123',
      organization: 'Company C (Germany)',
      description: 'Buyer (Germany) — Strictly isolated view of Company C orders; zero access to Company B.',
    },
    {
      id: 'user-md-1',
      name: 'K. Shanmugam',
      role: 'md',
      email: 'ks@companya-knits.com',
      passwordHint: 'tiruppur123',
      organization: 'Company A (Tiruppur)',
      description: 'Managing Director — Executive dashboard, ₹1.08 Cr financial risk tracking, and database admin privileges.',
    },
  ];
  res.json(credentials);
});

app.post('/api/auth/login', (req, res) => {
  const { email, password, userId } = req.body;

  let session: { token: string; user: User } | null = null;

  if (userId) {
    session = db.createSessionForUser(userId);
  } else if (email) {
    session = db.authenticateUser(email, password);
  }

  if (!session) {
    return res.status(401).json({ error: 'Invalid email or password credentials.' });
  }

  res.json(session);
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/logout', requireAuth, (req: AuthenticatedRequest, res) => {
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (token) {
    db.invalidateSession(token);
  }
  res.json({ success: true, message: 'Logged out successfully. Session invalidated on server.' });
});

app.get('/api/users', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json(db.getUsers());
});

// -----------------------------------------------------------------------------
// Orders Endpoints (Protected with Server-Side Tenant Isolation)
// -----------------------------------------------------------------------------
app.get('/api/orders', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const unit = req.query.unit as string;
  const status = req.query.status as string;
  const buyer = req.query.buyer as string;

  // Notice: user is passed directly. If user.role === 'buyer', db.getOrders
  // strictly uses user.buyerId and ignores any spoofed query params!
  const orders = db.getOrders(user, { unit, status, buyer });
  res.json(orders);
});

app.get('/api/orders/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const order = db.getOrderById(req.params.id, user);

  if (!order) {
    return res.status(404).json({
      error: 'Order not found or access denied by multi-tenant security policy.',
    });
  }

  const runRate = calculateRunRate(order);
  res.json({ ...order, runRate });
});

// Order creation: Only Merchandisers and MDs
app.post(
  '/api/orders',
  requireAuth,
  requireRole(['merchandiser', 'md']),
  (req: AuthenticatedRequest, res) => {
    try {
      const newOrder = db.createOrder(req.body, req.user!);
      res.status(201).json(newOrder);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Daily floor update: Supervisors, Merchandisers, MDs
app.post(
  '/api/orders/:id/daily-update',
  requireAuth,
  requireRole(['supervisor', 'merchandiser', 'md']),
  async (req: AuthenticatedRequest, res) => {
    try {
      const orderId = req.params.id;
      const user = req.user!;
      const { stage, quantityDoneToday, photoUrl, originalNoteTamil } = req.body;

      if (!stage || typeof quantityDoneToday !== 'number') {
        return res.status(400).json({ error: 'Stage and quantityDoneToday are required.' });
      }

      // Run AI analysis on the Tamil floor note
      let aiAnalysis = {
        englishTranslation: 'Regular production logged.',
        category: 'Normal Production / General Note',
        confidenceScore: 0.95,
        severity: 'low',
        recommendedMitigation: 'Standard shift inspection.',
      };

      if (originalNoteTamil && originalNoteTamil.trim()) {
        try {
          const analysis = await analyzeTamilNote(originalNoteTamil, stage, user.unit || 'Floor');
          aiAnalysis = {
            englishTranslation: analysis.englishTranslation,
            category: analysis.category,
            confidenceScore: analysis.confidenceScore,
            severity: analysis.severity,
            recommendedMitigation: analysis.recommendedMitigation,
          };
        } catch (e) {
          console.warn('[AI Analysis] Fallback triggered:', e);
        }
      }

      const { order, newLog } = db.addDailyLog(
        orderId,
        {
          orderId,
          date: new Date().toISOString().split('T')[0],
          stage,
          quantityDoneToday,
          supervisorId: user.id,
          supervisorName: user.name,
          unit: user.unit || orderId,
          photoUrl,
          originalNoteTamil: originalNoteTamil || '',
          englishTranslation: aiAnalysis.englishTranslation,
          aiReasonCategory: aiAnalysis.category,
          aiConfidence: aiAnalysis.confidenceScore,
          merchandiserReviewStatus: 'pending_review',
          isSharedWithBuyer: false,
        },
        user
      );

      res.json({
        success: true,
        order,
        newLog,
        aiAnalysis,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Standalone Tamil Note Analysis API (Protected)
app.post('/api/ai/analyze-tamil-note', requireAuth, async (req, res) => {
  try {
    const { note, stage, unit } = req.body;
    const result = await analyzeTamilNote(note || '', stage || 'Stitching', unit || 'Unit 1');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Date revision with immutable audit log: Merchandisers and MDs
app.patch(
  '/api/orders/:id/dates',
  requireAuth,
  requireRole(['merchandiser', 'md']),
  (req: AuthenticatedRequest, res) => {
    try {
      const { newExFactoryDate, reason } = req.body;
      if (!newExFactoryDate) {
        return res.status(400).json({ error: 'newExFactoryDate is required.' });
      }
      const authorizedBy = `${req.user!.name} (${req.user!.role.toUpperCase()})`;
      const updated = db.updateExFactoryDate(req.params.id, newExFactoryDate, reason, authorizedBy, req.user!);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Delay warning confirmation gate: Merchandisers and MDs
app.post(
  '/api/orders/:id/confirm-warning',
  requireAuth,
  requireRole(['merchandiser', 'md']),
  (req: AuthenticatedRequest, res) => {
    try {
      const { warningText, mitigationPlan, revisedExFactoryDate } = req.body;
      const updated = db.confirmBuyerWarning(
        req.params.id,
        warningText,
        mitigationPlan,
        `${req.user!.name} (${req.user!.role})`,
        req.user!,
        revisedExFactoryDate
      );
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Review & override supervisor log: Merchandisers and MDs
app.patch(
  '/api/orders/:id/logs/:logId/review',
  requireAuth,
  requireRole(['merchandiser', 'md']),
  (req: AuthenticatedRequest, res) => {
    try {
      const { reviewStatus, correctedCategory, merchandiserComment, isSharedWithBuyer } = req.body;
      const updated = db.updateDailyLogReview(
        req.params.id,
        req.params.logId,
        reviewStatus || 'confirmed',
        req.user!,
        correctedCategory,
        merchandiserComment,
        isSharedWithBuyer ?? false
      );
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Reset endpoint: Strictly protected by MD role (Never public)
app.post(
  '/api/orders/reset',
  requireAuth,
  requireRole(['md']),
  (req: AuthenticatedRequest, res) => {
    const orders = db.resetToDefaultSeed();
    res.json({ message: 'Database reset to default seed by authorized MD.', orders });
  }
);

// Weekly Status Report Export (Strictly Tenant Protected)
app.get('/api/export/buyer-report', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const orders = db.getOrders(user);

  const headers = [
    'PO Number',
    'Buyer',
    'Style Description',
    'Total Qty',
    'Ex-Factory Date',
    'Current Stage',
    'Qty Done',
    'Remaining Qty',
    'Status',
    'Required Daily Rate',
    'Current Daily Rate',
    'Projected Slip (Days)',
    'Confirmed Buyer Notice',
  ];

  const rows = orders.map((o) => {
    const rr = calculateRunRate(o);
    return [
      `"${o.poNumber}"`,
      `"${o.buyerName}"`,
      `"${o.styleDescription}"`,
      o.totalQuantity,
      o.exFactoryDate,
      `"${o.currentStage}"`,
      o.totalQuantityDone,
      rr.remainingQuantity,
      rr.status.toUpperCase(),
      rr.requiredDailyRunRate,
      rr.currentDailyRunRate,
      rr.projectedSlipDays,
      `"${o.confirmedBuyerWarning?.warningText || 'On schedule'}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const filename = `TexTrack_Weekly_Report_${user.buyerId || user.role}.csv`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvContent);
});

// Health check endpoints for Cloud Run container & uptime monitors
app.get(['/api/health', '/health'], (req, res) => {
  res.status(200).json({ status: 'ok', app: 'knittrack', timestamp: new Date().toISOString() });
});

// Direct Download Endpoints for Assessment Submission Deliverables
app.get('/api/download/submission-zip', (req, res) => {
  const file = path.resolve(process.cwd(), 'KnitTrack_Final_Submission.zip');
  if (fs.existsSync(file)) {
    res.download(file, 'KnitTrack_Final_Submission.zip');
  } else {
    res.status(404).json({ error: 'Submission file not found' });
  }
});

app.get('/api/download/tdd-pdf', (req, res) => {
  const file = path.resolve(process.cwd(), 'KnitTrack_Final_Submission', 'TDD.pdf');
  if (fs.existsSync(file)) {
    res.download(file, 'TDD.pdf');
  } else {
    res.status(404).json({ error: 'TDD.pdf not found' });
  }
});

// Explicit 404 for unhandled API routes so they return JSON instead of falling through to index.html
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
});

// -----------------------------------------------------------------------------
// Development & Production Vite Integration
// -----------------------------------------------------------------------------
async function startServer() {
  const distDir = path.resolve(process.cwd(), 'dist');
  const indexHtml = path.join(distDir, 'index.html');
  const hasDist = fs.existsSync(indexHtml);

  if (process.env.NODE_ENV === 'production' || hasDist) {
    console.log(`[TexTrack Server] Serving production bundle from ${distDir}`);
    app.use(express.static(distDir));
    app.get('*', (req, res) => {
      res.sendFile(indexHtml);
    });
  } else {
    console.log('[TexTrack Server] Running in development mode with Vite middleware');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TexTrack KnitTrack Server] Running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[TexTrack Server] Fatal startup error:', err);
  process.exit(1);
});
