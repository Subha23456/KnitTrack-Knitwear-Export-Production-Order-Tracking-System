import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../server/db.ts';
import type { User } from '../types.ts';

describe('Security, Multi-Tenant Buyer Isolation & Audit Trail', () => {
  const buyerB: User = {
    id: 'user-buyer-b',
    name: 'John Smith',
    role: 'buyer',
    email: 'j.smith@companyb-retail.co.uk',
    organization: 'Company B (UK)',
    buyerId: 'buyer-b-uk',
  };

  const buyerC: User = {
    id: 'user-buyer-c',
    name: 'Hans Weber',
    role: 'buyer',
    email: 'h.weber@companyc-textil.de',
    organization: 'Company C (Germany)',
    buyerId: 'buyer-c-de',
  };

  const merchandiser: User = {
    id: 'user-merchandiser-1',
    name: 'Priya Rajan',
    role: 'merchandiser',
    email: 'priya.rajan@companya-knits.com',
    organization: 'Company A (Tiruppur)',
  };

  const supervisor: User = {
    id: 'user-supervisor-1',
    name: 'Murugan Kandasamy',
    role: 'supervisor',
    email: 'murugan.unit1@companya-knits.com',
    organization: 'Unit 1 (Kangeyam Rd)',
    unit: 'Unit 1 (Kangeyam Rd)',
  };

  it('enforces strict multi-tenant buyer isolation: Buyer B cannot see Buyer C orders in list', () => {
    const ordersForB = db.getOrders(buyerB);
    expect(ordersForB.length).toBeGreaterThan(0);
    // Every order returned MUST belong to buyer-b-uk
    ordersForB.forEach((order) => {
      expect(order.buyerId).toBe('buyer-b-uk');
      expect(order.poNumber).not.toBe('C-PO-0488');
    });
  });

  it('enforces strict multi-tenant buyer isolation: Buyer C cannot see Buyer B orders in list', () => {
    const ordersForC = db.getOrders(buyerC);
    expect(ordersForC.length).toBeGreaterThan(0);
    // Every order returned MUST belong to buyer-c-de
    ordersForC.forEach((order) => {
      expect(order.buyerId).toBe('buyer-c-de');
      expect(order.poNumber).not.toBe('B-PO-88213');
      expect(order.poNumber).not.toBe('B-PO-88240');
    });
  });

  it('blocks cross-tenant direct order ID access: Buyer B direct access to Buyer C order returns null', () => {
    // b-po-88213 belongs to Buyer B, c-po-0488 belongs to Buyer C
    const result = db.getOrderById('c-po-0488', buyerB);
    expect(result).toBeNull();
  });

  it('blocks cross-tenant direct order ID access: Buyer C direct access to Buyer B order returns null', () => {
    const result = db.getOrderById('b-po-88213', buyerC);
    expect(result).toBeNull();
  });

  it('allows Merchandiser full cross-tenant visibility across all buyers', () => {
    const allOrders = db.getOrders(merchandiser);
    const buyerIds = new Set(allOrders.map((o) => o.buyerId));
    expect(buyerIds.has('buyer-b-uk')).toBe(true);
    expect(buyerIds.has('buyer-c-de')).toBe(true);
  });

  it('creates an immutable date change audit record when ex-factory date is updated', () => {
    const testOrder = db.getOrderById('b-po-88213', merchandiser);
    expect(testOrder).not.toBeNull();
    const oldDate = testOrder!.exFactoryDate;
    const newDate = '2026-11-25';
    const reason = 'Buyer requested delay due to warehouse expansion';

    const updated = db.updateExFactoryDate('b-po-88213', newDate, reason, merchandiser.name, merchandiser);
    expect(updated.exFactoryDate).toBe(newDate);

    // Verify audit trail record was created
    const audits = db.getDateChangeAudits('b-po-88213');
    expect(audits.length).toBeGreaterThan(0);
    const latestAudit = audits[0];
    expect(latestAudit.previousValue).toBe(oldDate);
    expect(latestAudit.newValue).toBe(newDate);
    expect(latestAudit.reason).toBe(reason);
    expect(latestAudit.authorizedBy).toBe(merchandiser.name);

    // Revert date back for demo cleanliness
    db.updateExFactoryDate('b-po-88213', oldDate, 'Revert to original schedule for testing', merchandiser.name, merchandiser);
  });

  it('quarantines delay warnings until explicitly approved by merchandiser', () => {
    // 1. Initial state check on b-po-88240
    const orderBefore = db.getOrderById('b-po-88240', merchandiser)!;

    // 2. Add supervisor daily log with delay issue
    const { order: orderAfterLog } = db.addDailyLog(
      'b-po-88240',
      {
        orderId: 'b-po-88240',
        date: '2026-11-06',
        stage: 'Finishing',
        quantityDoneToday: 150, // Low output causing delay
        supervisorId: supervisor.id,
        supervisorName: supervisor.name,
        unit: 'Unit 1 (Kangeyam Rd)',
        originalNoteTamil: 'பாக்கிங் அட்டைப்பெட்டி தட்டுப்பாடு',
        englishTranslation: 'Shortage of packing cartons',
        aiReasonCategory: 'Trims & Accessories Shortage',
        aiConfidence: 0.94,
        merchandiserReviewStatus: 'pending_review',
        isSharedWithBuyer: false,
      },
      supervisor
    );

    // Warning is quarantined: hasUnconfirmedDelayWarning is true
    expect(orderAfterLog.hasUnconfirmedDelayWarning).toBe(true);

    // Buyer inspecting the order still does NOT see an unconfirmed warning
    const buyerViewBeforeApproval = db.getOrderById('b-po-88240', buyerB)!;
    // Buyer should not receive unconfirmed warning as public note
    expect(buyerViewBeforeApproval.dailyLogs.find((l) => l.originalNoteTamil === 'பாக்கிங் அட்டைப்பெட்டி தட்டுப்பாடு')?.isSharedWithBuyer).toBe(false);

    // 3. Merchandiser confirms warning with professional mitigation plan
    const approvedOrder = db.confirmBuyerWarning(
      'b-po-88240',
      'Finishing pace adjusted by +2 days due to packaging cartons restocking',
      'Overtime shift arranged for Saturday; all packing completed by Monday',
      merchandiser,
      '2026-11-14'
    );

    expect(approvedOrder.hasUnconfirmedDelayWarning).toBe(false);
    expect(approvedOrder.confirmedBuyerWarning).toBeDefined();
    expect(approvedOrder.confirmedBuyerWarning?.merchandiserName).toBe(merchandiser.name);
  });

  it('rejects invalid or unauthorized operations gracefully', () => {
    // Buyer cannot update ex-factory dates
    expect(() => {
      db.updateExFactoryDate('b-po-88213', '2026-12-01', 'Unauthorized change', buyerB.name, buyerB);
    }).toThrow();
  });
});
