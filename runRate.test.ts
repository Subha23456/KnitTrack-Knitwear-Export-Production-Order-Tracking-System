import { describe, it, expect } from 'vitest';
import { calculateRunRate, getWorkingDays, addWorkingDays } from '../utils/runRate.ts';
import type { Order } from '../types.ts';

describe('Run-Rate Delay Calculation Engine', () => {
  const baseOrder: Order = {
    id: 'test-order-1',
    poNumber: 'TEST-PO-001',
    buyerId: 'buyer-b-uk',
    buyerName: 'Company B (UK)',
    styleDescription: 'Test Polo',
    productType: 'Polo',
    garmentImageUrl: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400',
    unit: 'Unit 1',
    totalQuantity: 10000,
    totalQuantityDone: 5000,
    fobPricePerPieceINR: 200,
    orderValueINR: 2000000,
    orderDate: '2026-11-01',
    exFactoryDate: '2026-11-20',
    currentStage: 'Stitching',
    status: 'green',
    colors: [],
    milestones: [],
    dailyLogs: [],
    dateChangeAudits: [],
    merchandiserId: 'user-merchandiser-1',
    merchandiserName: 'Priya Rajan',
    hasUnconfirmedDelayWarning: false,
  };

  it('correctly calculates working days excluding Sundays', () => {
    // 2026-11-06 (Friday) to 2026-11-09 (Monday)
    // Friday (Nov 6), Saturday (Nov 7), Sunday (Nov 8 - skip), Monday (Nov 9)
    // Total working days = 3
    const days = getWorkingDays('2026-11-06', '2026-11-09');
    expect(days).toBe(3);
  });

  it('adds working days correctly skipping Sundays', () => {
    // Friday Nov 6 + 2 working days => Saturday Nov 7, Monday Nov 9
    const startDate = new Date('2026-11-06T00:00:00Z');
    const result = addWorkingDays(startDate, 2);
    // Nov 9 is Monday
    expect(result.getUTCDay()).toBe(1); // 1 = Monday
  });

  it('computes Green status when actual daily output meets or exceeds required', () => {
    // Total: 12,000, Done: 6,800 => Remaining: 5,200
    // Ex-factory: 2026-11-20. Reference: 2026-11-06 (13 working days)
    // Required: 5200 / 13 = 400 pcs/day
    // Recent logs average: 500 pcs/day (500 >= 400 => Green)
    const order: Order = {
      ...baseOrder,
      poNumber: 'B-PO-88213',
      totalQuantity: 12000,
      totalQuantityDone: 6800,
      exFactoryDate: '2026-11-20',
      dailyLogs: [
        {
          id: 'log-1',
          orderId: 'b-po-88213',
          date: '2026-11-05',
          stage: 'Stitching',
          quantityDoneToday: 520,
          supervisorId: 'sup-1',
          supervisorName: 'Murugan',
          unit: 'Unit 1',
          merchandiserReviewStatus: 'confirmed',
          isSharedWithBuyer: true,
          createdAt: '2026-11-05T12:00:00Z',
        },
        {
          id: 'log-2',
          orderId: 'b-po-88213',
          date: '2026-11-04',
          stage: 'Stitching',
          quantityDoneToday: 480,
          supervisorId: 'sup-1',
          supervisorName: 'Murugan',
          unit: 'Unit 1',
          merchandiserReviewStatus: 'confirmed',
          isSharedWithBuyer: true,
          createdAt: '2026-11-04T12:00:00Z',
        },
      ],
    };

    const result = calculateRunRate(order, '2026-11-06');
    expect(result.remainingQuantity).toBe(5200);
    expect(result.workingDaysRemaining).toBe(13);
    expect(result.requiredDailyRunRate).toBe(400);
    expect(result.currentDailyRunRate).toBe(500);
    expect(result.status).toBe('green');
    expect(result.potentialAirFreightRiskINR).toBe(0);
  });

  it('computes Amber status when actual output is between 80% and 99% of required', () => {
    // Total: 8,000, Done: 5,200 => Remaining: 2,800
    // Ex-factory: 2026-11-12. Reference: 2026-11-06 (6 working days)
    // Required: 2800 / 6 = 467 pcs/day
    // Actual average: 390 pcs/day => 390 / 467 = 83.5% (Amber)
    const order: Order = {
      ...baseOrder,
      poNumber: 'B-PO-88240',
      totalQuantity: 8000,
      totalQuantityDone: 5200,
      exFactoryDate: '2026-11-12',
      dailyLogs: [
        {
          id: 'log-3',
          orderId: 'b-po-88240',
          date: '2026-11-05',
          stage: 'Finishing',
          quantityDoneToday: 390,
          supervisorId: 'sup-1',
          supervisorName: 'Murugan',
          unit: 'Unit 1',
          merchandiserReviewStatus: 'confirmed',
          isSharedWithBuyer: true,
          createdAt: '2026-11-05T12:00:00Z',
        },
      ],
    };

    const result = calculateRunRate(order, '2026-11-06');
    expect(result.remainingQuantity).toBe(2800);
    expect(result.workingDaysRemaining).toBe(6);
    expect(result.requiredDailyRunRate).toBe(467);
    expect(result.currentDailyRunRate).toBe(390);
    expect(result.status).toBe('amber');
    expect(result.potentialAirFreightRiskINR).toBe(0); // Not red yet
    expect(result.potentialDiscountRiskINR).toBeGreaterThan(0); // 5% late discount risk
  });

  it('computes Red status when actual output is below 80% of required', () => {
    // Total: 10,000, Done: 3,100 => Remaining: 6,900
    // Ex-factory: 2026-11-28. Reference: 2026-11-06 (20 working days)
    // Required: 6900 / 20 = 345 pcs/day
    // Actual average: 177 pcs/day => 177 / 345 = 51.3% (< 80% => Red)
    const order: Order = {
      ...baseOrder,
      poNumber: 'C-PO-0488',
      totalQuantity: 10000,
      totalQuantityDone: 3100,
      exFactoryDate: '2026-11-28',
      dailyLogs: [
        {
          id: 'log-4',
          orderId: 'c-po-0488',
          date: '2026-11-05',
          stage: 'Printing',
          quantityDoneToday: 177,
          supervisorId: 'sup-2',
          supervisorName: 'Karthik',
          unit: 'Subcontract Unit',
          merchandiserReviewStatus: 'confirmed',
          isSharedWithBuyer: true,
          createdAt: '2026-11-05T12:00:00Z',
        },
      ],
    };

    const result = calculateRunRate(order, '2026-11-06');
    expect(result.remainingQuantity).toBe(6900);
    expect(result.workingDaysRemaining).toBe(20);
    expect(result.requiredDailyRunRate).toBe(345);
    expect(result.currentDailyRunRate).toBe(177);
    expect(result.status).toBe('red');
    expect(result.potentialAirFreightRiskINR).toBe(350000); // ₹3.50L air freight risk triggered
  });

  it('handles zero working days safely when ex-factory date has passed with unfinished quantity', () => {
    const expiredOrder: Order = {
      ...baseOrder,
      totalQuantity: 10000,
      totalQuantityDone: 8000, // 2000 remaining
      exFactoryDate: '2026-11-01', // Date has passed relative to 2026-11-06
    };

    const result = calculateRunRate(expiredOrder, '2026-11-06');
    expect(result.workingDaysRemaining).toBe(0);
    expect(result.remainingQuantity).toBe(2000);
    expect(result.status).toBe('red');
  });

  it('handles completed orders (zero remaining quantity) safely with green status', () => {
    const completedOrder: Order = {
      ...baseOrder,
      totalQuantity: 10000,
      totalQuantityDone: 10000,
      exFactoryDate: '2026-11-20',
    };

    const result = calculateRunRate(completedOrder, '2026-11-06');
    expect(result.remainingQuantity).toBe(0);
    expect(result.requiredDailyRunRate).toBe(0);
    expect(result.status).toBe('green');
    expect(result.projectedSlipDays).toBe(0);
  });

  it('handles orders with zero production logs safely without division by zero', () => {
    const freshOrder: Order = {
      ...baseOrder,
      totalQuantity: 5000,
      totalQuantityDone: 0,
      dailyLogs: [],
    };

    expect(() => calculateRunRate(freshOrder, '2026-11-06')).not.toThrow();
    const result = calculateRunRate(freshOrder, '2026-11-06');
    expect(result.remainingQuantity).toBe(5000);
    expect(result.currentDailyRunRate).toBe(0);
    expect(result.status).toBe('red');
  });
});
