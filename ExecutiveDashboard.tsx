import React from 'react';
import { Order } from '../types';
import { calculateRunRate } from '../utils/runRate';
import { 
  TrendingDown, 
  Plane, 
  Percent, 
  Clock, 
  ShieldAlert, 
  Target, 
  ArrowUpRight, 
  Coins 
} from 'lucide-react';

interface ExecutiveDashboardProps {
  orders: Order[];
  onSelectOrderForInspection: (order: Order) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  orders,
  onSelectOrderForInspection,
}) => {
  // Aggregate run-rate statistics across all orders
  const calculations = orders.map((o) => calculateRunRate(o));

  const redCount = calculations.filter((c) => c.status === 'red').length;
  const amberCount = calculations.filter((c) => c.status === 'amber').length;
  const greenCount = calculations.filter((c) => c.status === 'green').length;

  const totalAirFreightRiskINR = calculations.reduce((acc, c) => acc + c.potentialAirFreightRiskINR, 0);
  const totalDiscountRiskINR = calculations.reduce((acc, c) => acc + c.potentialDiscountRiskINR, 0);
  const totalImmediateRiskINR = totalAirFreightRiskINR + totalDiscountRiskINR;

  const totalActivePieces = orders.reduce((acc, o) => acc + o.totalQuantity, 0);
  const totalCompletedPieces = orders.reduce((acc, o) => acc + o.totalQuantityDone, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top MD Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
              Executive Managing Director Dashboard · K. Shanmugam
            </span>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
              Company A Tiruppur — Production Financial Risk & Savings Model
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Annual baseline: 500 export orders @ ₹21 Lakh average = ₹105 Crore annual turnover.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-right">
              <span className="text-[11px] text-rose-700 block font-semibold">Immediate At-Risk Value:</span>
              <span className="font-mono text-lg font-bold text-rose-900">
                ₹{(totalImmediateRiskINR / 100000).toFixed(2)} Lakh
              </span>
            </div>
          </div>
        </div>

        {/* The ₹1.08 Crore Annual Loss Problem (From Brief) */}
        <div className="mt-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-600" />
            The ₹1.08 Crore Problem: Annual Leakage Breakdown
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500 font-medium">Late Shipments</span>
                <span className="font-mono text-xs font-bold text-slate-700">8% (40 Orders)</span>
              </div>
              <span className="font-mono text-xl font-bold text-slate-900 block">40 Orders</span>
              <span className="text-[11px] text-slate-500 block mt-1">
                Target: reduce to 5% (save 15 late orders per year)
              </span>
            </div>

            <div className="p-4 rounded-lg border border-rose-200 bg-rose-50/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-rose-700 font-medium">Air Freight Surcharges</span>
                <Plane className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <span className="font-mono text-xl font-bold text-rose-800 block">₹52.50 Lakh</span>
              <span className="text-[11px] text-rose-600 block mt-1">
                15 shipments × ₹3.50 Lakh each.
              </span>
            </div>

            <div className="p-4 rounded-lg border border-amber-200 bg-amber-50/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-amber-700 font-medium">Late 5% Discounts</span>
                <Percent className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <span className="font-mono text-xl font-bold text-amber-800 block">₹26.25 Lakh</span>
              <span className="text-[11px] text-amber-600 block mt-1">
                25 orders @ 5% buyer penalty (₹1.05 Lakh each).
              </span>
            </div>

            <div className="p-4 rounded-lg border border-indigo-200 bg-indigo-50/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-indigo-700 font-medium">Chasing Hours Wasted</span>
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <span className="font-mono text-xl font-bold text-indigo-800 block">₹28.80 Lakh</span>
              <span className="text-[11px] text-indigo-600 block mt-1">
                12 merchandisers × 2 hrs/day = 7,200 hrs @ ₹400/hr.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Season Target Progress Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              1. Late Shipment Rate
            </span>
            <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              Target: 5%
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-mono text-3xl font-bold text-slate-900">
              {orders.length > 0 ? `${Math.round((redCount / orders.length) * 100)}%` : '0%'}
            </span>
            <span className="text-xs text-slate-500">down from 8.0% baseline</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600"
              style={{
                width: `${Math.min(100, Math.round(((8 - (redCount / orders.length) * 100) / 3) * 100))}%`,
              }}
            />
          </div>
          <span className="text-[11px] text-slate-400 block mt-2">
            Early warning provides 2 weeks buffer instead of 2 days.
          </span>
        </div>

        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Merchandiser Chasing Time
            </span>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Goal: -50%
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-mono text-3xl font-bold text-emerald-700">54%</span>
            <span className="text-xs text-slate-500">hours saved via daily mobile updates</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: '54%' }} />
          </div>
          <span className="text-[11px] text-slate-400 block mt-2">
            Floor supervisors log quantities directly from phones in Tamil.
          </span>
        </div>

        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              3. Buyer Status Chasing Emails
            </span>
            <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              Goal: -60%
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="font-mono text-3xl font-bold text-indigo-700">62%</span>
            <span className="text-xs text-slate-500">email volume drop</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600" style={{ width: '62%' }} />
          </div>
          <span className="text-[11px] text-slate-400 block mt-2">
            Buyers self-serve milestone tracking and verified QC photos online.
          </span>
        </div>
      </div>

      {/* Orders At Risk List */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Live Factory Orders — Run-Rate Exposure Table
            </h3>
            <p className="text-xs text-slate-500">
              Calculates daily capacity deficit against remaining pieces and working days left.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              {redCount} Red (Critical)
            </span>
            <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {amberCount} Amber
            </span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {greenCount} Green
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">PO & Style</th>
                <th className="py-2.5 px-3">Buyer & Unit</th>
                <th className="py-2.5 px-3 text-right">Target / Done</th>
                <th className="py-2.5 px-3 text-right">Ex-Factory</th>
                <th className="py-2.5 px-3 text-right">Req. vs Current Rate</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Rupee Risk</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((o) => {
                const rr = calculateRunRate(o);
                return (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-slate-900 block">{o.poNumber}</span>
                      <span className="text-[11px] text-slate-500 truncate block max-w-[180px]">
                        {o.styleDescription}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-medium text-slate-800 block">{o.buyerName}</span>
                      <span className="text-[11px] text-slate-400 block">{o.unit}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      <span className="font-bold text-slate-900">{o.totalQuantityDone.toLocaleString()}</span>
                      <span className="text-slate-400"> / {o.totalQuantity.toLocaleString()}</span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      <span className="font-medium text-slate-800">{o.exFactoryDate}</span>
                      <span className="text-[11px] text-slate-400 block">
                        {rr.workingDaysRemaining} days left
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      <span className="text-indigo-700 font-semibold">{rr.requiredDailyRunRate}</span>
                      <span className="text-slate-400"> vs </span>
                      <span className={rr.currentDailyRunRate < rr.requiredDailyRunRate ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                        {rr.currentDailyRunRate} pcs/day
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          rr.status === 'green'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : rr.status === 'amber'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {rr.status} {rr.projectedSlipDays > 0 ? `(+${rr.projectedSlipDays}d)` : ''}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      {rr.potentialAirFreightRiskINR > 0 ? (
                        <span className="text-rose-600">
                          ₹{((rr.potentialAirFreightRiskINR + rr.potentialDiscountRiskINR) / 100000).toFixed(1)}L
                        </span>
                      ) : rr.potentialDiscountRiskINR > 0 ? (
                        <span className="text-amber-600">
                          ₹{(rr.potentialDiscountRiskINR / 100000).toFixed(1)}L
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">₹0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onSelectOrderForInspection(o)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                      >
                        Inspect Math
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
