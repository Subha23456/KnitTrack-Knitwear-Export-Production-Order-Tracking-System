import React from 'react';
import { Order } from '../types';
import { calculateRunRate } from '../utils/runRate';
import { X, Calculator, AlertTriangle, CheckCircle, TrendingDown, Clock, AlertCircle } from 'lucide-react';

interface RunRateModalProps {
  order: Order | null;
  onClose: () => void;
  onConfirmWarning?: (order: Order) => void;
  isMerchandiser?: boolean;
}

export const RunRateModal: React.FC<RunRateModalProps> = ({
  order,
  onClose,
  onConfirmWarning,
  isMerchandiser,
}) => {
  if (!order) return null;

  const rr = calculateRunRate(order);

  const getStatusBadge = (status: 'green' | 'amber' | 'red') => {
    switch (status) {
      case 'green':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            ON TRACK (GREEN)
          </span>
        );
      case 'amber':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            TIGHT MARGIN (AMBER)
          </span>
        );
      case 'red':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-md">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            CRITICAL DELAY (RED)
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 text-slate-900">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                {order.poNumber}
              </span>
              <span className="text-xs text-slate-500">· {order.buyerName}</span>
              {getStatusBadge(rr.status)}
            </div>
            <h3 className="text-base font-bold text-slate-900">{order.styleDescription}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Unit: {order.unit} · Ex-Factory: <span className="font-mono font-medium">{order.exFactoryDate}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* The Math Formula Card */}
        <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4 text-slate-700" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Run-Rate Delay Mathematics (Formula Breakdown)
            </h4>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center my-3">
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Target Qty</span>
              <span className="font-mono text-base font-bold text-slate-900">
                {rr.targetQuantity.toLocaleString()}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Total Completed</span>
              <span className="font-mono text-base font-bold text-slate-900">
                {rr.totalCompleted.toLocaleString()}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Remaining Qty</span>
              <span className="font-mono text-base font-bold text-indigo-700">
                {rr.remainingQuantity.toLocaleString()}
              </span>
            </div>
            <div className="bg-white p-2.5 rounded border border-slate-200">
              <span className="text-[11px] text-slate-500 block">Working Days Left</span>
              <span className="font-mono text-base font-bold text-slate-900">
                {rr.workingDaysRemaining} days
              </span>
            </div>
          </div>

          {/* Mathematical Proof Comparison */}
          <div className="space-y-2 text-xs font-mono bg-white p-3 rounded border border-slate-200 mt-2">
            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-600">1. Required Daily Output Rate (Remaining / Working Days):</span>
              <span className="font-bold text-slate-900">
                {rr.remainingQuantity.toLocaleString()} / {rr.workingDaysRemaining} ={' '}
                <span className="text-indigo-600">{rr.requiredDailyRunRate.toLocaleString()} pcs/day</span>
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-600">2. Current Actual Floor Rate (3-Day Log Average):</span>
              <span className={`font-bold ${rr.currentDailyRunRate < rr.requiredDailyRunRate ? 'text-rose-600' : 'text-emerald-600'}`}>
                {rr.currentDailyRunRate.toLocaleString()} pcs/day
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-600">3. Capacity Variance:</span>
              <span className={`font-bold ${rr.capacityVariancePercent < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {rr.capacityVariancePercent > 0 ? `+${rr.capacityVariancePercent}` : rr.capacityVariancePercent}%
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-100">
              <span className="text-slate-600">4. Projected Days to Complete (Remaining / Actual Rate):</span>
              <span className="font-bold text-slate-900">
                {rr.remainingQuantity.toLocaleString()} / {rr.currentDailyRunRate.toLocaleString()} ={' '}
                <span className="text-indigo-600">{rr.projectedWorkingDaysToFinish} working days</span>
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-slate-600">5. Projected Completion vs Ex-Factory Date:</span>
              <span className="font-bold text-slate-900">
                {rr.projectedCompletionDate} (
                <span className={rr.projectedSlipDays > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                  {rr.projectedSlipDays > 0 ? `+${rr.projectedSlipDays} days late` : `${Math.abs(rr.projectedSlipDays)} days buffer`}
                </span>
                )
              </span>
            </div>
          </div>
        </div>

        {/* Narrative Explanation */}
        <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed">
          <p className="font-semibold text-slate-900 mb-0.5">Production Intelligence Diagnosis:</p>
          <p>{rr.explanation}</p>
        </div>

        {/* Financial Risk Exposure Section */}
        <div className="mt-4 border-t border-slate-100 pt-3">
          <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Client Financial Exposure (Company A Risk Model)
          </h5>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/50">
              <span className="text-slate-600 block mb-0.5">Air Freight Surcharge Risk</span>
              <span className="font-mono text-sm font-bold text-rose-700">
                ₹{rr.potentialAirFreightRiskINR.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                (Standard sea container missed; emergency flight to UK/EU)
              </span>
            </div>

            <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/50">
              <span className="text-slate-600 block mb-0.5">Buyer 5% Late Discount Penalty</span>
              <span className="font-mono text-sm font-bold text-amber-700">
                ₹{rr.potentialDiscountRiskINR.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                (5% contractual price deduction on ₹{order.orderValueINR.toLocaleString()} order)
              </span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Calculated as of today (excluding factory Sundays)
          </span>
          <div className="flex items-center gap-2">
            {isMerchandiser && (rr.status === 'red' || rr.status === 'amber') && onConfirmWarning && (
              <button
                onClick={() => {
                  onClose();
                  onConfirmWarning(order);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Review & Confirm Buyer Warning
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
