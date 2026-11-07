import type { Order, RunRateCalculation, OrderStatus } from '../types.ts';

/**
 * Calculates working days between two dates, excluding Sundays.
 * (Tiruppur knitwear factories run Monday through Saturday).
 */
export function getWorkingDays(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 1;
  }

  if (start > end) {
    return 0;
  }

  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay();
    // 0 = Sunday
    if (dayOfWeek !== 0) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Adds N working days (excluding Sundays) to a starting date.
 */
export function addWorkingDays(startDate: Date, workingDays: number): Date {
  const result = new Date(startDate);
  let daysAdded = 0;

  if (workingDays <= 0) {
    return result;
  }

  while (daysAdded < workingDays) {
    result.setDate(result.getDate() + 1);
    if (result.getDay() !== 0) {
      daysAdded++;
    }
  }

  return result;
}

/**
 * Computes run-rate projection and financial risk assessment for an order.
 * Current reference date for evaluation is 2026-11-06 (matching prompt context).
 * 
 * Rules specified in brief:
 * - Remaining Quantity = Total Quantity - Completed Quantity
 * - Working Days Remaining = Days between today and ex-factory, excluding Sundays
 * - Required Daily Production = Remaining Quantity / Working Days Remaining
 * - Actual Daily Production = Average completed quantity per working day using recent daily logs
 * - Projected Completion Days = Remaining Quantity / Actual Daily Production
 * - Projected Completion Date = Today + Projected Completion Days in working days
 * 
 * Transparent initial status rules:
 * - Green: actual daily output meets or exceeds required daily output (or remaining quantity is 0)
 * - Amber: actual output is 80% to less than 100% of required output
 * - Red: actual output is below 80% of required output, or the ex-factory date has passed with unfinished quantity
 */
export function calculateRunRate(
  order: Order,
  referenceDateStr: string = '2026-11-06'
): RunRateCalculation {
  const today = new Date(referenceDateStr);
  const exFactory = new Date(order.exFactoryDate);

  const targetQuantity = order.totalQuantity;
  const totalCompleted = order.totalQuantityDone || 0;
  const remainingQuantity = Math.max(0, targetQuantity - totalCompleted);

  // Total calendar days remaining
  const calendarDiffTime = exFactory.getTime() - today.getTime();
  const calendarDaysRemaining = Math.ceil(calendarDiffTime / (1000 * 60 * 60 * 24));

  // Working days remaining (excluding Sundays)
  const workingDaysRemaining = today > exFactory ? 0 : getWorkingDays(referenceDateStr, order.exFactoryDate);

  // Required Daily Run Rate
  const requiredDailyRunRate =
    remainingQuantity === 0
      ? 0
      : workingDaysRemaining > 0
      ? Math.ceil(remainingQuantity / workingDaysRemaining)
      : remainingQuantity;

  // Actual Daily Production from recent daily logs (last 3 entries)
  const logs = [...(order.dailyLogs || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let currentDailyRunRate = 0;
  if (logs.length > 0) {
    const recentLogs = logs.slice(0, 3);
    const sum = recentLogs.reduce((acc, log) => acc + log.quantityDoneToday, 0);
    currentDailyRunRate = Math.round(sum / recentLogs.length);
  } else {
    // If no logs yet, baseline assumption
    currentDailyRunRate = 0;
  }

  // Safe divisor for projected working days
  const safeDivRate = currentDailyRunRate > 0 ? currentDailyRunRate : 1;

  // Projected Completion Days
  const projectedWorkingDaysToFinish =
    remainingQuantity === 0 ? 0 : Math.ceil(remainingQuantity / safeDivRate);

  // Projected Completion Date
  const projectedCompletionObj =
    remainingQuantity === 0 ? today : addWorkingDays(today, projectedWorkingDaysToFinish);
  const projectedCompletionDate = projectedCompletionObj.toISOString().split('T')[0];

  // Number of days ahead or behind schedule (+ = slip/behind, - = ahead)
  const projectedSlipDays =
    remainingQuantity === 0
      ? 0
      : Math.ceil(
          (projectedCompletionObj.getTime() - exFactory.getTime()) / (1000 * 60 * 60 * 24)
        );

  // Capacity variance % ((current - required) / required) * 100
  const capacityVariancePercent =
    requiredDailyRunRate > 0
      ? Math.round(((currentDailyRunRate - requiredDailyRunRate) / requiredDailyRunRate) * 100)
      : remainingQuantity === 0
      ? 0
      : -100;

  // Transparent Initial Status Rules:
  let status: OrderStatus = 'green';
  if (remainingQuantity === 0) {
    status = 'green';
  } else if (workingDaysRemaining <= 0 && remainingQuantity > 0) {
    status = 'red'; // ex-factory date has passed with unfinished quantity
  } else if (requiredDailyRunRate === 0) {
    status = 'green';
  } else {
    const ratio = currentDailyRunRate / requiredDailyRunRate;
    if (ratio >= 1.0) {
      status = 'green';
    } else if (ratio >= 0.80) {
      status = 'amber';
    } else {
      status = 'red';
    }
  }

  // Financial risk exposure
  // Client brief figures: ₹3.50L per air-freight shipment; 5% buyer discount on late order
  const orderValue = order.orderValueINR || order.totalQuantity * (order.fobPricePerPieceINR || 175);
  let potentialAirFreightRiskINR = 0;
  let potentialDiscountRiskINR = 0;

  if (status === 'red') {
    potentialAirFreightRiskINR = 350000; // ₹3.50 lakh air freight penalty
    potentialDiscountRiskINR = Math.round(orderValue * 0.05); // 5% late penalty
  } else if (status === 'amber') {
    potentialDiscountRiskINR = Math.round(orderValue * 0.05); // 5% risk buffer
  }

  const explanation =
    status === 'red'
      ? `Critical Run-rate Deficit: Actual output (${currentDailyRunRate.toLocaleString()} pcs/day) is below 80% of required output (${requiredDailyRunRate.toLocaleString()} pcs/day over ${workingDaysRemaining} working days). Projected delay is +${projectedSlipDays} days past ex-factory date (${order.exFactoryDate}). Air freight risk: ₹3.50L.`
      : status === 'amber'
      ? `Tight Schedule Warning: Actual output (${currentDailyRunRate.toLocaleString()} pcs/day) is between 80% and 99% of required output (${requiredDailyRunRate.toLocaleString()} pcs/day). Narrow buffer with +${projectedSlipDays} days potential delay.`
      : `Production On Schedule: Actual output (${currentDailyRunRate.toLocaleString()} pcs/day) meets or exceeds required output (${requiredDailyRunRate.toLocaleString()} pcs/day). Projected to complete on or ahead of ex-factory date.`;

  return {
    targetQuantity,
    totalCompleted,
    remainingQuantity,
    daysRemaining: calendarDaysRemaining,
    workingDaysRemaining,
    requiredDailyRunRate,
    currentDailyRunRate,
    projectedWorkingDaysToFinish,
    projectedCompletionDate,
    projectedSlipDays,
    status,
    capacityVariancePercent,
    potentialAirFreightRiskINR,
    potentialDiscountRiskINR,
    explanation,
  };
}
