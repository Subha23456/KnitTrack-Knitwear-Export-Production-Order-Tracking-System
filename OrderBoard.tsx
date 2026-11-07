import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { calculateRunRate } from '../utils/runRate';
import { SafeImage } from './SafeImage';
import { 
  Filter, 
  Search, 
  AlertTriangle, 
  Calculator, 
  Calendar, 
  Clock, 
  Eye, 
  Sparkles, 
  History, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface OrderBoardProps {
  orders: Order[];
  onOpenMathModal: (order: Order) => void;
  onOpenAIReviewModal: (order: Order) => void;
  onOpenDateChangeModal: (order: Order) => void;
  onOpenNewOrder: () => void;
}

export const OrderBoard: React.FC<OrderBoardProps> = ({
  orders,
  onOpenMathModal,
  onOpenAIReviewModal,
  onOpenDateChangeModal,
  onOpenNewOrder,
}) => {
  const [buyerFilter, setBuyerFilter] = useState<string>('all');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Apply filters
  const filteredOrders = orders.filter((o) => {
    const rr = calculateRunRate(o);
    if (buyerFilter !== 'all' && o.buyerId !== buyerFilter) return false;
    if (unitFilter !== 'all' && !o.unit.toLowerCase().includes(unitFilter.toLowerCase())) return false;
    if (statusFilter !== 'all' && rr.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchPo = o.poNumber.toLowerCase().includes(q);
      const matchStyle = o.styleDescription.toLowerCase().includes(q);
      const matchBuyer = o.buyerName.toLowerCase().includes(q);
      if (!matchPo && !matchStyle && !matchBuyer) return false;
    }
    return true;
  });

  // Calculate high-level counters
  const totalPieces = orders.reduce((acc, o) => acc + o.totalQuantity, 0);
  const totalDone = orders.reduce((acc, o) => acc + o.totalQuantityDone, 0);
  const atRiskCount = orders.filter((o) => calculateRunRate(o).status !== 'green').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* KPI Stat Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
          <span className="text-xs text-slate-500 font-medium block">Active Export Orders</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-2xl font-bold text-slate-900">{orders.length}</span>
            <span className="text-xs text-slate-400">orders</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">Tiruppur Units 1, 2, 3</span>
        </div>

        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
          <span className="text-xs text-slate-500 font-medium block">Production Progress</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-2xl font-bold text-indigo-700">
              {Math.round((totalDone / (totalPieces || 1)) * 100)}%
            </span>
            <span className="text-xs font-mono text-slate-500">
              ({totalDone.toLocaleString()} / {totalPieces.toLocaleString()})
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">Total pieces completed</span>
        </div>

        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
          <span className="text-xs text-slate-500 font-medium block">At-Risk Orders (Red / Amber)</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-2xl font-bold text-rose-600">{atRiskCount}</span>
            <span className="text-xs text-slate-400">orders flagged</span>
          </div>
          <span className="text-[11px] text-rose-600/80 block mt-1">Run-rate deficit detected</span>
        </div>

        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4">
          <span className="text-xs text-slate-500 font-medium block">Early Warning Window</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-mono text-2xl font-bold text-emerald-700">14 Days</span>
            <span className="text-xs text-slate-400">advance notice</span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">Prevents air-freight panic</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Buyer Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-500 font-medium">Buyer:</span>
            <select
              aria-label="Buyer Filter"
              value={buyerFilter}
              onChange={(e) => setBuyerFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Buyers (UK & EU)</option>
              <option value="buyer-b-uk">Company B (UK)</option>
              <option value="buyer-c-de">Company C (Germany)</option>
            </select>
          </div>

          {/* Unit Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-500 font-medium">Unit:</span>
            <select
              aria-label="Unit Filter"
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Units</option>
              <option value="Unit 1">Unit 1 (Kangeyam Rd)</option>
              <option value="Unit 2">Unit 2 (Angeripalayam)</option>
              <option value="Unit 3">Unit 3 (Netaji Apparel Park)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <span className="text-slate-500 font-medium">Status:</span>
            <select
              aria-label="Status Filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Traffic Lights</option>
              <option value="green">Green (On Track)</option>
              <option value="amber">Amber (Tight Margin)</option>
              <option value="red">Red (Critical Slip)</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search PO, style, buyer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 w-full md:w-56"
          />
        </div>
      </div>

      {/* Orders Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">PO & Style</th>
                <th className="py-3 px-3">Buyer & Unit</th>
                <th className="py-3 px-3">Stage Progress</th>
                <th className="py-3 px-3 text-right">Target / Done</th>
                <th className="py-3 px-3 text-right">Ex-Factory</th>
                <th className="py-3 px-3 text-right">Daily Run Rate</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No production orders match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const rr = calculateRunRate(order);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* PO & Style */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <SafeImage
                            src={order.garmentImageUrl}
                            alt={order.styleDescription}
                            className="w-10 h-10 rounded-md border border-slate-200 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-slate-900 text-xs">
                                {order.poNumber}
                              </span>
                              {order.hasUnconfirmedDelayWarning && (
                                <span
                                  title="Unconfirmed floor delay note awaits merchandiser approval"
                                  className="w-2 h-2 rounded-full bg-amber-500"
                                />
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 truncate block max-w-[200px]">
                              {order.styleDescription}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Buyer & Unit */}
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-800 block">{order.buyerName}</span>
                        <span className="text-[11px] text-slate-400 block">{order.unit}</span>
                      </td>

                      {/* Current Stage & Progress bar */}
                      <td className="py-3 px-3">
                        <div className="w-36">
                          <div className="flex justify-between items-center text-[10px] text-slate-600 mb-1">
                            <span className="font-semibold text-slate-900">{order.currentStage}</span>
                            <span className="font-mono">
                              {Math.round((order.totalQuantityDone / order.totalQuantity) * 100)}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                rr.status === 'green'
                                  ? 'bg-emerald-500'
                                  : rr.status === 'amber'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.round((order.totalQuantityDone / order.totalQuantity) * 100)
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Target / Done */}
                      <td className="py-3 px-3 text-right font-mono">
                        <span className="font-bold text-slate-900">
                          {order.totalQuantityDone.toLocaleString()}
                        </span>
                        <span className="text-slate-400"> / {order.totalQuantity.toLocaleString()}</span>
                      </td>

                      {/* Ex-Factory */}
                      <td className="py-3 px-3 text-right font-mono">
                        <span className="font-medium text-slate-800">{order.exFactoryDate}</span>
                        <span className="text-[10px] text-slate-400 block">
                          {rr.workingDaysRemaining} working days
                        </span>
                      </td>

                      {/* Run Rate (Req vs Actual) */}
                      <td className="py-3 px-3 text-right font-mono">
                        <div className="text-[11px]">
                          <span className="text-indigo-700 font-semibold">
                            {rr.requiredDailyRunRate.toLocaleString()}
                          </span>
                          <span className="text-slate-400"> req / </span>
                          <span
                            className={
                              rr.currentDailyRunRate < rr.requiredDailyRunRate
                                ? 'text-rose-600 font-bold'
                                : 'text-emerald-600 font-medium'
                            }
                          >
                            {rr.currentDailyRunRate.toLocaleString()}
                          </span>
                          <span className="text-slate-400"> pcs</span>
                        </div>
                      </td>

                      {/* Status Traffic Light Badge */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onOpenMathModal(order)}
                          title="Click to see run-rate maths"
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider transition-transform active:scale-95 ${
                            rr.status === 'green'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : rr.status === 'amber'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          <span>{rr.status}</span>
                          {rr.projectedSlipDays > 0 && (
                            <span className="font-mono font-semibold">(+{rr.projectedSlipDays}d)</span>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Math inspection button */}
                          <button
                            onClick={() => onOpenMathModal(order)}
                            title="Inspect Run-Rate Mathematical Proof"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          >
                            <Calculator className="w-4 h-4" />
                          </button>

                          {/* AI Review & Delay Gate button */}
                          <button
                            onClick={() => onOpenAIReviewModal(order)}
                            title="Review Floor Supervisor Notes & Confirm Buyer Delay Notice"
                            className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors relative"
                          >
                            <Sparkles className="w-4 h-4" />
                            {order.hasUnconfirmedDelayWarning && (
                              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
                            )}
                          </button>

                          {/* Date revision with compliance audit trail */}
                          <button
                            onClick={() => onOpenDateChangeModal(order)}
                            title="Revise Ex-Factory Date (Compliance Audit Trail)"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Orders Card View (Strictly responsive for 360px - 430px screens) */}
      <div className="block md:hidden space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-slate-400 text-xs border border-slate-200">
            No production orders match the current filter criteria.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const rr = calculateRunRate(order);
            const isRed = rr.status === 'red';
            const isAmber = rr.status === 'amber';
            const statusColor = isRed
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : isAmber
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200';

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3"
              >
                {/* Header: Thumbnail + PO + Status Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <SafeImage
                      src={order.garmentImageUrl}
                      alt={order.styleDescription}
                      className="w-12 h-12 rounded-lg border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {order.poNumber}
                        </span>
                        {order.hasUnconfirmedDelayWarning && (
                          <span
                            title="Unconfirmed floor delay note awaits merchandiser approval"
                            className="w-2 h-2 rounded-full bg-amber-500 shrink-0"
                          />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
                        {order.styleDescription}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {order.buyerName} · {order.unit}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenMathModal(order)}
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border shrink-0 ${statusColor}`}
                  >
                    {rr.status} {rr.projectedSlipDays > 0 ? `(+${rr.projectedSlipDays}d)` : ''}
                  </button>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800">
                      Stage: {order.currentStage}
                    </span>
                    <span className="font-mono text-slate-600 font-medium">
                      {order.totalQuantityDone.toLocaleString()} / {order.totalQuantity.toLocaleString()} pcs ({Math.round((order.totalQuantityDone / order.totalQuantity) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        rr.status === 'green'
                          ? 'bg-emerald-500'
                          : rr.status === 'amber'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((order.totalQuantityDone / order.totalQuantity) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Key Metrics Strip */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Ex-Factory Date</span>
                    <span className="font-mono font-medium text-slate-800">
                      {order.exFactoryDate}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {rr.workingDaysRemaining} working days left
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Daily Run Rate</span>
                    <span className="font-mono font-semibold text-indigo-700">
                      {rr.requiredDailyRunRate.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {' '}req / {rr.currentDailyRunRate.toLocaleString()} actual
                    </span>
                  </div>
                </div>

                {/* Mobile Action Buttons (Touch Friendly min-h-[44px]) */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => onOpenMathModal(order)}
                    className="min-h-[44px] flex items-center justify-center gap-1 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                  >
                    <Calculator className="w-3.5 h-3.5 text-slate-500" />
                    <span>Run-Rate</span>
                  </button>
                  <button
                    onClick={() => onOpenAIReviewModal(order)}
                    className="min-h-[44px] flex items-center justify-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors relative"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>AI Review</span>
                    {order.hasUnconfirmedDelayWarning && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 absolute top-2 right-2" />
                    )}
                  </button>
                  <button
                    onClick={() => onOpenDateChangeModal(order)}
                    className="min-h-[44px] flex items-center justify-center gap-1 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                  >
                    <History className="w-3.5 h-3.5 text-slate-500" />
                    <span>Revise Date</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
