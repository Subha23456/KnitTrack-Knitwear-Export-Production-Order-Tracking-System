import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { INITIAL_ORDERS, INITIAL_USERS } from '../mockData.ts';
import type { Order, User, DailyLog, ProductionStage, Milestone, DateChangeAudit } from '../types.ts';
import { calculateRunRate } from '../utils/runRate.ts';

const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.resolve(process.cwd(), 'data');
const DB_FILE = process.env.DATABASE_PATH ? path.resolve(process.env.DATABASE_PATH) : path.join(DATA_DIR, 'knittrack.db');

export class SQLiteDatabase {
  private db: Database.Database;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    this.db = new Database(DB_FILE);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    this.initTables();
    this.seedIfEmpty();
  }

  private initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        organization TEXT NOT NULL,
        unit TEXT,
        buyerId TEXT,
        preferredLanguage TEXT
      );

      CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        expiresAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        poNumber TEXT UNIQUE NOT NULL,
        buyerId TEXT NOT NULL,
        buyerName TEXT NOT NULL,
        styleDescription TEXT NOT NULL,
        productType TEXT NOT NULL,
        garmentImageUrl TEXT NOT NULL,
        unit TEXT NOT NULL,
        totalQuantity INTEGER NOT NULL,
        fobPricePerPieceINR REAL NOT NULL,
        orderValueINR REAL NOT NULL,
        orderDate TEXT NOT NULL,
        exFactoryDate TEXT NOT NULL,
        currentStage TEXT NOT NULL,
        totalQuantityDone INTEGER NOT NULL,
        status TEXT NOT NULL,
        merchandiserId TEXT NOT NULL,
        merchandiserName TEXT NOT NULL,
        hasUnconfirmedDelayWarning INTEGER NOT NULL DEFAULT 0,
        confirmedBuyerWarningJson TEXT,
        colorsJson TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS milestones (
        id TEXT PRIMARY KEY,
        orderId TEXT NOT NULL,
        stage TEXT NOT NULL,
        targetStartDate TEXT NOT NULL,
        targetEndDate TEXT NOT NULL,
        actualStartDate TEXT,
        actualEndDate TEXT,
        targetQuantity INTEGER NOT NULL,
        completedQuantity INTEGER NOT NULL,
        status TEXT NOT NULL,
        responsibleUnit TEXT NOT NULL,
        FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS daily_logs (
        id TEXT PRIMARY KEY,
        orderId TEXT NOT NULL,
        date TEXT NOT NULL,
        stage TEXT NOT NULL,
        quantityDoneToday INTEGER NOT NULL,
        supervisorId TEXT NOT NULL,
        supervisorName TEXT NOT NULL,
        unit TEXT NOT NULL,
        photoUrl TEXT,
        originalNoteTamil TEXT,
        englishTranslation TEXT,
        aiReasonCategory TEXT,
        aiConfidence REAL,
        isAiCorrectedByMerchandiser INTEGER DEFAULT 0,
        merchandiserReviewStatus TEXT DEFAULT 'pending_review',
        merchandiserComment TEXT,
        isSharedWithBuyer INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS date_change_audits (
        id TEXT PRIMARY KEY,
        orderId TEXT NOT NULL,
        fieldChanged TEXT NOT NULL,
        previousValue TEXT NOT NULL,
        newValue TEXT NOT NULL,
        reason TEXT NOT NULL,
        authorizedBy TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
      );
    `);
  }

  private seedIfEmpty() {
    const userCount = (this.db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
    if (userCount === 0) {
      const insertUser = this.db.prepare(`
        INSERT INTO users (id, name, role, email, password, organization, unit, buyerId, preferredLanguage)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const u of INITIAL_USERS) {
        insertUser.run(
          u.id,
          u.name,
          u.role,
          u.email,
          'tiruppur123', // Standard default demo credential
          u.organization,
          u.unit || null,
          u.buyerId || null,
          u.preferredLanguage || 'en'
        );
      }
    }

    const orderCount = (this.db.prepare('SELECT COUNT(*) as count FROM orders').get() as any).count;
    if (orderCount === 0) {
      this.seedOrders(INITIAL_ORDERS);
    }
  }

  private seedOrders(orders: Order[]) {
    const insertOrder = this.db.prepare(`
      INSERT INTO orders (
        id, poNumber, buyerId, buyerName, styleDescription, productType,
        garmentImageUrl, unit, totalQuantity, fobPricePerPieceINR, orderValueINR,
        orderDate, exFactoryDate, currentStage, totalQuantityDone, status,
        merchandiserId, merchandiserName, hasUnconfirmedDelayWarning,
        confirmedBuyerWarningJson, colorsJson
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMilestone = this.db.prepare(`
      INSERT INTO milestones (
        id, orderId, stage, targetStartDate, targetEndDate,
        actualStartDate, actualEndDate, targetQuantity, completedQuantity,
        status, responsibleUnit
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertLog = this.db.prepare(`
      INSERT INTO daily_logs (
        id, orderId, date, stage, quantityDoneToday, supervisorId,
        supervisorName, unit, photoUrl, originalNoteTamil, englishTranslation,
        aiReasonCategory, aiConfidence, isAiCorrectedByMerchandiser,
        merchandiserReviewStatus, merchandiserComment, isSharedWithBuyer, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertAudit = this.db.prepare(`
      INSERT INTO date_change_audits (
        id, orderId, fieldChanged, previousValue, newValue,
        reason, authorizedBy, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = this.db.transaction((orderList: Order[]) => {
      for (const o of orderList) {
        insertOrder.run(
          o.id,
          o.poNumber,
          o.buyerId,
          o.buyerName,
          o.styleDescription,
          o.productType,
          o.garmentImageUrl,
          o.unit,
          o.totalQuantity,
          o.fobPricePerPieceINR,
          o.orderValueINR,
          o.orderDate,
          o.exFactoryDate,
          o.currentStage,
          o.totalQuantityDone,
          o.status,
          o.merchandiserId,
          o.merchandiserName,
          o.hasUnconfirmedDelayWarning ? 1 : 0,
          o.confirmedBuyerWarning ? JSON.stringify(o.confirmedBuyerWarning) : null,
          JSON.stringify(o.colors)
        );

        for (const m of o.milestones) {
          insertMilestone.run(
            m.id,
            o.id,
            m.stage,
            m.targetStartDate,
            m.targetEndDate,
            m.actualStartDate || null,
            m.actualEndDate || null,
            m.targetQuantity,
            m.completedQuantity,
            m.status,
            m.responsibleUnit
          );
        }

        for (const l of o.dailyLogs) {
          insertLog.run(
            l.id,
            o.id,
            l.date,
            l.stage,
            l.quantityDoneToday,
            l.supervisorId,
            l.supervisorName,
            l.unit,
            l.photoUrl || null,
            l.originalNoteTamil || null,
            l.englishTranslation || null,
            l.aiReasonCategory || null,
            l.aiConfidence || null,
            l.isAiCorrectedByMerchandiser ? 1 : 0,
            l.merchandiserReviewStatus,
            l.merchandiserComment || null,
            l.isSharedWithBuyer ? 1 : 0,
            l.createdAt
          );
        }

        for (const a of o.dateChangeAudits) {
          insertAudit.run(
            a.id,
            o.id,
            a.fieldChanged,
            a.previousValue,
            a.newValue,
            a.reason,
            a.authorizedBy,
            a.timestamp
          );
        }
      }
    });

    transaction(orders);
  }

  // Authentication & Sessions
  public authenticateUser(email: string, password?: string): { token: string; user: User } | null {
    const row = this.db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    if (!row) return null;

    if (password && row.password !== password) {
      return null;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    this.db.prepare('INSERT INTO sessions (token, userId, createdAt, expiresAt) VALUES (?, ?, ?, ?)').run(
      token,
      row.id,
      now.toISOString(),
      expiresAt
    );

    return {
      token,
      user: {
        id: row.id,
        name: row.name,
        role: row.role as any,
        email: row.email,
        organization: row.organization,
        unit: row.unit || undefined,
        buyerId: row.buyerId || undefined,
        preferredLanguage: row.preferredLanguage || 'en',
      },
    };
  }

  public createSessionForUser(userId: string): { token: string; user: User } | null {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!row) return null;

    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    this.db.prepare('INSERT INTO sessions (token, userId, createdAt, expiresAt) VALUES (?, ?, ?, ?)').run(
      token,
      row.id,
      now.toISOString(),
      expiresAt
    );

    return {
      token,
      user: {
        id: row.id,
        name: row.name,
        role: row.role as any,
        email: row.email,
        organization: row.organization,
        unit: row.unit || undefined,
        buyerId: row.buyerId || undefined,
        preferredLanguage: row.preferredLanguage || 'en',
      },
    };
  }

  public getUserBySessionToken(token: string): User | null {
    const session = this.db.prepare('SELECT * FROM sessions WHERE token = ?').get(token) as any;
    if (!session) return null;

    if (new Date(session.expiresAt) < new Date()) {
      this.db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
      return null;
    }

    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(session.userId) as any;
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      role: row.role as any,
      email: row.email,
      organization: row.organization,
      unit: row.unit || undefined,
      buyerId: row.buyerId || undefined,
      preferredLanguage: row.preferredLanguage || 'en',
    };
  }

  public invalidateSession(token: string): boolean {
    const res = this.db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return res.changes > 0;
  }

  public getUsers(): User[] {
    const rows = this.db.prepare('SELECT id, name, role, email, organization, unit, buyerId, preferredLanguage FROM users').all() as any[];
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      role: r.role,
      email: r.email,
      organization: r.organization,
      unit: r.unit || undefined,
      buyerId: r.buyerId || undefined,
      preferredLanguage: r.preferredLanguage || 'en',
    }));
  }

  public getUserById(id: string): User | undefined {
    const r = this.db.prepare('SELECT id, name, role, email, organization, unit, buyerId, preferredLanguage FROM users WHERE id = ?').get(id) as any;
    if (!r) return undefined;
    return {
      id: r.id,
      name: r.name,
      role: r.role,
      email: r.email,
      organization: r.organization,
      unit: r.unit || undefined,
      buyerId: r.buyerId || undefined,
      preferredLanguage: r.preferredLanguage || 'en',
    };
  }

  // Orders Retrieval with Strict Server-Side Buyer Isolation
  public getOrders(user: User, filters?: { buyer?: string; unit?: string; status?: string }): Order[] {
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params: any[] = [];

    // CRITICAL: Strict Multi-Tenant Enforcement!
    // Never trust URL query params for tenant identity.
    if (user.role === 'buyer') {
      if (!user.buyerId) return [];
      sql += ' AND buyerId = ?';
      params.push(user.buyerId);
    } else if (filters?.buyer && filters.buyer !== 'all') {
      sql += ' AND (buyerId = ? OR buyerName LIKE ?)';
      params.push(filters.buyer, `%${filters.buyer}%`);
    }

    if (filters?.unit && filters.unit !== 'all') {
      sql += ' AND unit LIKE ?';
      params.push(`%${filters.unit}%`);
    }

    sql += ' ORDER BY exFactoryDate ASC';

    const orderRows = this.db.prepare(sql).all(...params) as any[];

    return orderRows
      .map((row) => this.assembleOrder(row))
      .filter((o) => {
        if (filters?.status && filters.status !== 'all') {
          return o.status === filters.status;
        }
        return true;
      });
  }

  public getOrderById(orderId: string, user: User): Order | null {
    const row = this.db.prepare('SELECT * FROM orders WHERE id = ? OR LOWER(poNumber) = LOWER(?)').get(orderId, orderId) as any;
    if (!row) return null;

    // Strict Tenant Boundary Check
    if (user.role === 'buyer' && row.buyerId !== user.buyerId) {
      return null;
    }

    return this.assembleOrder(row);
  }

  private assembleOrder(row: any): Order {
    const milestones = (this.db.prepare('SELECT * FROM milestones WHERE orderId = ? ORDER BY targetStartDate ASC').all(row.id) as any[]).map((m) => ({
      id: m.id,
      stage: m.stage as ProductionStage,
      targetStartDate: m.targetStartDate,
      targetEndDate: m.targetEndDate,
      actualStartDate: m.actualStartDate || undefined,
      actualEndDate: m.actualEndDate || undefined,
      targetQuantity: m.targetQuantity,
      completedQuantity: m.completedQuantity,
      status: m.status as any,
      responsibleUnit: m.responsibleUnit,
    }));

    const dailyLogs = (this.db.prepare('SELECT * FROM daily_logs WHERE orderId = ? ORDER BY date DESC, createdAt DESC').all(row.id) as any[]).map((l) => ({
      id: l.id,
      orderId: l.orderId,
      date: l.date,
      stage: l.stage as ProductionStage,
      quantityDoneToday: l.quantityDoneToday,
      supervisorId: l.supervisorId,
      supervisorName: l.supervisorName,
      unit: l.unit,
      photoUrl: l.photoUrl || undefined,
      originalNoteTamil: l.originalNoteTamil || undefined,
      englishTranslation: l.englishTranslation || undefined,
      aiReasonCategory: l.aiReasonCategory || undefined,
      aiConfidence: l.aiConfidence !== null ? l.aiConfidence : undefined,
      isAiCorrectedByMerchandiser: Boolean(l.isAiCorrectedByMerchandiser),
      merchandiserReviewStatus: l.merchandiserReviewStatus as any,
      merchandiserComment: l.merchandiserComment || undefined,
      isSharedWithBuyer: Boolean(l.isSharedWithBuyer),
      createdAt: l.createdAt,
    }));

    const dateChangeAudits = (this.db.prepare('SELECT * FROM date_change_audits WHERE orderId = ? ORDER BY timestamp DESC').all(row.id) as any[]).map((a) => ({
      id: a.id,
      orderId: a.orderId,
      fieldChanged: a.fieldChanged,
      previousValue: a.previousValue,
      newValue: a.newValue,
      reason: a.reason,
      authorizedBy: a.authorizedBy,
      timestamp: a.timestamp,
    }));

    const baseOrder: Order = {
      id: row.id,
      poNumber: row.poNumber,
      buyerId: row.buyerId,
      buyerName: row.buyerName,
      styleDescription: row.styleDescription,
      productType: row.productType,
      garmentImageUrl: row.garmentImageUrl,
      unit: row.unit,
      totalQuantity: row.totalQuantity,
      fobPricePerPieceINR: row.fobPricePerPieceINR,
      orderValueINR: row.orderValueINR,
      orderDate: row.orderDate,
      exFactoryDate: row.exFactoryDate,
      currentStage: row.currentStage as ProductionStage,
      totalQuantityDone: row.totalQuantityDone,
      status: row.status as any,
      colors: JSON.parse(row.colorsJson || '[]'),
      milestones,
      dailyLogs,
      dateChangeAudits,
      merchandiserId: row.merchandiserId,
      merchandiserName: row.merchandiserName,
      hasUnconfirmedDelayWarning: Boolean(row.hasUnconfirmedDelayWarning),
      confirmedBuyerWarning: row.confirmedBuyerWarningJson ? JSON.parse(row.confirmedBuyerWarningJson) : undefined,
    };

    // Recalculate dynamic run-rate status
    const runRate = calculateRunRate(baseOrder);
    return {
      ...baseOrder,
      status: runRate.status,
    };
  }

  public generateTnaTemplate(
    orderDateStr: string,
    exFactoryDateStr: string,
    totalQuantity: number,
    primaryUnit: string
  ): Milestone[] {
    const start = new Date(orderDateStr);
    const end = new Date(exFactoryDateStr);
    const totalDays = Math.max(14, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    const stages: { stage: ProductionStage; unit: string; ratioStart: number; ratioEnd: number }[] = [
      { stage: 'Fabric In-House', unit: 'S2: EuroWash Mills', ratioStart: 0.05, ratioEnd: 0.25 },
      { stage: 'Cutting', unit: primaryUnit, ratioStart: 0.26, ratioEnd: 0.38 },
      { stage: 'Printing', unit: 'S1: Sri Murugan Printing', ratioStart: 0.39, ratioEnd: 0.50 },
      { stage: 'Stitching', unit: primaryUnit, ratioStart: 0.51, ratioEnd: 0.78 },
      { stage: 'Washing', unit: 'S2: EuroWash Mills', ratioStart: 0.79, ratioEnd: 0.85 },
      { stage: 'Finishing', unit: primaryUnit, ratioStart: 0.86, ratioEnd: 0.93 },
      { stage: 'Final QC', unit: `${primaryUnit} QC Dept`, ratioStart: 0.94, ratioEnd: 0.97 },
      { stage: 'Packing', unit: `${primaryUnit} Packing Section`, ratioStart: 0.98, ratioEnd: 1.0 },
    ];

    return stages.map((st, idx) => {
      const sDate = new Date(start.getTime() + Math.floor(totalDays * st.ratioStart) * 86400000);
      const eDate = new Date(start.getTime() + Math.floor(totalDays * st.ratioEnd) * 86400000);

      return {
        id: `ms-gen-${Date.now()}-${idx}`,
        stage: st.stage,
        targetStartDate: sDate.toISOString().split('T')[0],
        targetEndDate: eDate.toISOString().split('T')[0],
        targetQuantity: totalQuantity,
        completedQuantity: 0,
        status: idx === 0 ? 'in_progress' : 'pending',
        responsibleUnit: st.unit,
      };
    });
  }

  public createOrder(data: Partial<Order>, creator: User): Order {
    const totalQty = data.totalQuantity || 5000;
    const fobPrice = data.fobPricePerPieceINR || 175;
    const orderDate = data.orderDate || new Date().toISOString().split('T')[0];
    const exFactory = data.exFactoryDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const primaryUnit = data.unit || 'Unit 1 (Kangeyam Rd)';

    const orderId = `ord-${Date.now()}`;
    const poNumber = data.poNumber || `PO-${Math.floor(10000 + Math.random() * 90000)}`;
    const buyerId = data.buyerId || 'buyer-b-uk';
    const buyerName = data.buyerName || 'Company B (UK)';
    const styleDescription = data.styleDescription || "Men's Basic Tee";
    const productType = data.productType || '100% Combed Cotton Knitwear';
    const garmentImageUrl = data.garmentImageUrl || '/src/assets/images/garment_navy_crew_1793941993724.jpg';
    const currentStage: ProductionStage = data.currentStage || 'Fabric In-House';

    const colors = data.colors && data.colors.length > 0 ? data.colors : [
      {
        colorName: 'Standard Navy',
        hexCode: '#1e293b',
        sizes: [
          { size: 'S' as const, quantity: Math.round(totalQty * 0.2) },
          { size: 'M' as const, quantity: Math.round(totalQty * 0.3) },
          { size: 'L' as const, quantity: Math.round(totalQty * 0.3) },
          { size: 'XL' as const, quantity: Math.round(totalQty * 0.2) },
        ],
      },
    ];

    const milestones = data.milestones && data.milestones.length > 0
      ? data.milestones
      : this.generateTnaTemplate(orderDate, exFactory, totalQty, primaryUnit);

    const transaction = this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO orders (
          id, poNumber, buyerId, buyerName, styleDescription, productType,
          garmentImageUrl, unit, totalQuantity, fobPricePerPieceINR, orderValueINR,
          orderDate, exFactoryDate, currentStage, totalQuantityDone, status,
          merchandiserId, merchandiserName, hasUnconfirmedDelayWarning,
          confirmedBuyerWarningJson, colorsJson
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        orderId,
        poNumber,
        buyerId,
        buyerName,
        styleDescription,
        productType,
        garmentImageUrl,
        primaryUnit,
        totalQty,
        fobPrice,
        totalQty * fobPrice,
        orderDate,
        exFactory,
        currentStage,
        0,
        'green',
        creator.id,
        creator.name,
        0,
        null,
        JSON.stringify(colors)
      );

      const insertMilestone = this.db.prepare(`
        INSERT INTO milestones (
          id, orderId, stage, targetStartDate, targetEndDate,
          actualStartDate, actualEndDate, targetQuantity, completedQuantity,
          status, responsibleUnit
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const m of milestones) {
        insertMilestone.run(
          m.id,
          orderId,
          m.stage,
          m.targetStartDate,
          m.targetEndDate,
          m.actualStartDate || null,
          m.actualEndDate || null,
          m.targetQuantity,
          m.completedQuantity,
          m.status,
          m.responsibleUnit
        );
      }
    });

    transaction();
    return this.getOrderById(orderId, creator)!;
  }

  public addDailyLog(orderId: string, log: Omit<DailyLog, 'id' | 'createdAt'>, user: User): { order: Order; newLog: DailyLog } {
    const order = this.getOrderById(orderId, user);
    if (!order) {
      throw new Error(`Order ${orderId} not found or access denied`);
    }

    const logId = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const createdAt = new Date().toISOString();

    const transaction = this.db.transaction(() => {
      this.db.prepare(`
        INSERT INTO daily_logs (
          id, orderId, date, stage, quantityDoneToday, supervisorId,
          supervisorName, unit, photoUrl, originalNoteTamil, englishTranslation,
          aiReasonCategory, aiConfidence, isAiCorrectedByMerchandiser,
          merchandiserReviewStatus, merchandiserComment, isSharedWithBuyer, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        logId,
        order.id,
        log.date,
        log.stage,
        log.quantityDoneToday,
        user.id,
        user.name,
        log.unit || order.unit,
        log.photoUrl || null,
        log.originalNoteTamil || null,
        log.englishTranslation || null,
        log.aiReasonCategory || null,
        log.aiConfidence || null,
        log.isAiCorrectedByMerchandiser ? 1 : 0,
        log.merchandiserReviewStatus || 'pending_review',
        log.merchandiserComment || null,
        log.isSharedWithBuyer ? 1 : 0,
        createdAt
      );

      // Update milestone
      const milestone = this.db.prepare('SELECT * FROM milestones WHERE orderId = ? AND stage = ?').get(order.id, log.stage) as any;
      if (milestone) {
        const newCompleted = milestone.completedQuantity + log.quantityDoneToday;
        const newStatus = newCompleted >= milestone.targetQuantity ? 'completed' : 'in_progress';
        const actualEndDate = newCompleted >= milestone.targetQuantity ? log.date : milestone.actualEndDate;
        const actualStartDate = milestone.actualStartDate || log.date;

        this.db.prepare(`
          UPDATE milestones
          SET completedQuantity = ?, status = ?, actualStartDate = ?, actualEndDate = ?
          WHERE id = ?
        `).run(newCompleted, newStatus, actualStartDate, actualEndDate, milestone.id);
      }

      // Update total quantity done and stage
      const newTotalDone = Math.min(order.totalQuantity, order.totalQuantityDone + log.quantityDoneToday);
      this.db.prepare(`
        UPDATE orders
        SET totalQuantityDone = ?, currentStage = ?
        WHERE id = ?
      `).run(newTotalDone, log.stage, order.id);
    });

    transaction();

    const updatedOrder = this.getOrderById(order.id, user)!;
    const runRate = calculateRunRate(updatedOrder);

    // Update status and warning flag: quarantined if run-rate deficit OR supervisor reported an unconfirmed issue note
    const hasUnconfirmedDelay =
      runRate.status !== 'green' ||
      Boolean(log.aiReasonCategory && log.aiReasonCategory !== 'Normal Production / General Note') ||
      updatedOrder.dailyLogs.some(
        (l) =>
          l.merchandiserReviewStatus === 'pending_review' &&
          l.aiReasonCategory &&
          l.aiReasonCategory !== 'Normal Production / General Note'
      );

    this.db.prepare('UPDATE orders SET status = ?, hasUnconfirmedDelayWarning = ? WHERE id = ?').run(
      runRate.status,
      hasUnconfirmedDelay ? 1 : 0,
      order.id
    );

    const finalizedOrder = this.getOrderById(order.id, user)!;
    const createdLog = finalizedOrder.dailyLogs.find((l) => l.id === logId)!;

    return { order: finalizedOrder, newLog: createdLog };
  }

  public updateExFactoryDate(
    orderId: string,
    newExFactoryDate: string,
    reason: string,
    authorizedBy: string,
    user: User
  ): Order {
    if (user.role === 'buyer') {
      throw new Error('Unauthorized: Buyers cannot alter production ex-factory dates');
    }

    const order = this.getOrderById(orderId, user);
    if (!order) {
      throw new Error(`Order ${orderId} not found or access denied`);
    }

    const previousValue = order.exFactoryDate;
    const auditId = `audit-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const transaction = this.db.transaction(() => {
      this.db.prepare('UPDATE orders SET exFactoryDate = ? WHERE id = ?').run(newExFactoryDate, order.id);
      this.db.prepare(`
        INSERT INTO date_change_audits (
          id, orderId, fieldChanged, previousValue, newValue,
          reason, authorizedBy, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        auditId,
        order.id,
        'exFactoryDate',
        previousValue,
        newExFactoryDate,
        reason || 'Schedule adjustment',
        authorizedBy,
        timestamp
      );
    });

    transaction();
    const updated = this.getOrderById(order.id, user)!;
    const runRate = calculateRunRate(updated);
    this.db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(runRate.status, order.id);

    return this.getOrderById(order.id, user)!;
  }

  public confirmBuyerWarning(
    orderId: string,
    warningText: string,
    mitigationPlan: string,
    merchandiserNameOrUser: string | User,
    userOrRevisedDate?: User | string,
    revisedExFactoryDate?: string
  ): Order {
    let user: User;
    let merchandiserName: string;
    let finalRevisedDate: string | undefined;

    if (typeof merchandiserNameOrUser === 'string') {
      merchandiserName = merchandiserNameOrUser;
      user = userOrRevisedDate as User;
      finalRevisedDate = revisedExFactoryDate;
    } else {
      user = merchandiserNameOrUser;
      merchandiserName = user.name;
      finalRevisedDate = typeof userOrRevisedDate === 'string' ? userOrRevisedDate : undefined;
    }

    const order = this.getOrderById(orderId, user);
    if (!order) {
      throw new Error(`Order ${orderId} not found or access denied`);
    }

    const confirmedBuyerWarning = {
      warningText,
      confirmedAt: new Date().toISOString(),
      merchandiserName,
      mitigationPlan,
      revisedExFactoryDate: finalRevisedDate,
    };

    this.db.prepare(`
      UPDATE orders
      SET hasUnconfirmedDelayWarning = 0, confirmedBuyerWarningJson = ?
      WHERE id = ?
    `).run(JSON.stringify(confirmedBuyerWarning), order.id);

    if (finalRevisedDate && finalRevisedDate !== order.exFactoryDate) {
      this.updateExFactoryDate(
        order.id,
        finalRevisedDate,
        `Mitigation plan date shift: ${mitigationPlan}`,
        merchandiserName,
        user
      );
    }

    return this.getOrderById(order.id, user)!;
  }

  public getDateChangeAudits(orderId?: string): DateChangeAudit[] {
    let sql = 'SELECT * FROM date_change_audits';
    const params: any[] = [];
    if (orderId) {
      const row = this.db.prepare('SELECT id FROM orders WHERE id = ? OR LOWER(poNumber) = LOWER(?)').get(orderId, orderId) as any;
      const canonicalId = row ? row.id : orderId;
      sql += ' WHERE orderId = ? OR orderId = ?';
      params.push(canonicalId, orderId);
    }
    sql += ' ORDER BY timestamp DESC';
    const rows = this.db.prepare(sql).all(...params) as any[];
    return rows.map((a) => ({
      id: a.id,
      orderId: a.orderId,
      fieldChanged: a.fieldChanged,
      previousValue: a.previousValue,
      newValue: a.newValue,
      reason: a.reason,
      authorizedBy: a.authorizedBy,
      timestamp: a.timestamp,
    }));
  }

  public updateDailyLogReview(
    orderId: string,
    logId: string,
    reviewStatus: 'confirmed' | 'rejected',
    user: User,
    correctedCategory?: string,
    merchandiserComment?: string,
    isSharedWithBuyer: boolean = false
  ): Order {
    const order = this.getOrderById(orderId, user);
    if (!order) {
      throw new Error(`Order ${orderId} not found or access denied`);
    }

    const log = this.db.prepare('SELECT * FROM daily_logs WHERE id = ? AND orderId = ?').get(logId, orderId) as any;
    if (!log) {
      throw new Error(`Log ${logId} not found`);
    }

    const isCorrected = correctedCategory && correctedCategory !== log.aiReasonCategory ? 1 : log.isAiCorrectedByMerchandiser;
    const finalCategory = correctedCategory || log.aiReasonCategory;
    const finalComment = merchandiserComment !== undefined ? merchandiserComment : log.merchandiserComment;

    this.db.prepare(`
      UPDATE daily_logs
      SET merchandiserReviewStatus = ?, aiReasonCategory = ?, isAiCorrectedByMerchandiser = ?,
          merchandiserComment = ?, isSharedWithBuyer = ?
      WHERE id = ?
    `).run(
      reviewStatus,
      finalCategory,
      isCorrected,
      finalComment,
      isSharedWithBuyer ? 1 : 0,
      logId
    );

    return this.getOrderById(orderId, user)!;
  }

  public resetToDefaultSeed(): Order[] {
    const transaction = this.db.transaction(() => {
      this.db.exec(`
        DELETE FROM date_change_audits;
        DELETE FROM daily_logs;
        DELETE FROM milestones;
        DELETE FROM orders;
        DELETE FROM sessions;
      `);
      this.seedOrders(INITIAL_ORDERS);
    });

    transaction();
    const mdUser = this.getUsers().find((u) => u.role === 'md') || this.getUsers()[0];
    return this.getOrders(mdUser);
  }
}

export const db = new SQLiteDatabase();
