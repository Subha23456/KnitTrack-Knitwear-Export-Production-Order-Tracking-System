import React, { useState } from 'react';
import { Order, ProductionStage } from '../types';
import { calculateRunRate } from '../utils/runRate';
import { SafeImage } from './SafeImage';
import { 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  History, 
  ShieldCheck, 
  Image as ImageIcon,
  FileSpreadsheet,
  Printer
} from 'lucide-react';

interface BuyerPortalProps {
  orders: Order[];
  buyerName: string;
  buyerOrganization: string;
}

export const BuyerPortal: React.FC<BuyerPortalProps> = ({
  orders,
  buyerName,
  buyerOrganization,
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];

  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('knittrack_auth_token');
      const res = await fetch(`/api/export/buyer-report${token ? `?token=${encodeURIComponent(token)}` : ''}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to generate export report');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TexTrack_Weekly_Report_${selectedOrder?.buyerId || 'Export'}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error('Export error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!selectedOrder) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center bg-white rounded-xl border border-slate-200">
        <h3 className="text-base font-bold text-slate-800">No active production orders found</h3>
        <p className="text-xs text-slate-500 mt-1">
          Your sourcing orders will appear here once allocated by Company A merchandising.
        </p>
      </div>
    );
  }

  const rr = calculateRunRate(selectedOrder);

  // Filter supervisor logs to ONLY those approved/confirmed for buyer release
  const buyerVisibleLogs = selectedOrder.dailyLogs.filter(
    (l) => l.isSharedWithBuyer || l.merchandiserReviewStatus === 'confirmed'
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Buyer Welcome Strip */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded">
              {buyerOrganization}
            </span>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Isolated Buyer Portal
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Sourcing & Production Order Status
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Logged in as {buyerName} · Real-time factory floor progress direct from Tiruppur units.
          </p>
        </div>

        {/* Export & Print actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Weekly Excel / CSV Export</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Order Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {orders.map((o) => (
          <button
            key={o.id}
            onClick={() => setSelectedOrderId(o.id)}
            className={`px-4 py-2.5 rounded-lg border text-left transition-all shrink-0 ${
              selectedOrderId === o.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold">{o.poNumber}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  o.status === 'green'
                    ? 'bg-emerald-400'
                    : o.status === 'amber'
                    ? 'bg-amber-400'
                    : 'bg-rose-400'
                }`}
              />
            </div>
            <p className="text-[11px] truncate max-w-[180px] mt-0.5 opacity-90">{o.styleDescription}</p>
          </button>
        ))}
      </div>

      {/* Selected Order Primary Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Progress & Milestones */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Order Key Metrics */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <span className="font-mono text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Purchase Order: {selectedOrder.poNumber}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {selectedOrder.styleDescription}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedOrder.productType}</p>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-500 block">Ex-Factory Dispatch:</span>
                <span className="font-mono text-base font-bold text-slate-900">
                  {selectedOrder.exFactoryDate}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  ({rr.workingDaysRemaining} working days left)
                </span>
              </div>
            </div>

            {/* Overall Stage & Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between items-center text-xs mb-1.5 font-medium">
                <span className="text-slate-600">
                  Current Stage: <span className="font-bold text-slate-900">{selectedOrder.currentStage}</span>
                </span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedOrder.totalQuantityDone.toLocaleString()} / {selectedOrder.totalQuantity.toLocaleString()} pcs (
                  {Math.round((selectedOrder.totalQuantityDone / selectedOrder.totalQuantity) * 100)}%)
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    selectedOrder.status === 'green'
                      ? 'bg-emerald-500'
                      : selectedOrder.status === 'amber'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((selectedOrder.totalQuantityDone / selectedOrder.totalQuantity) * 100)
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Confirmed Merchandiser Delay Notice (if published) */}
            {selectedOrder.confirmedBuyerWarning && (
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Production Schedule Advisory (Verified by Merchandiser)</span>
                </div>
                <p className="text-amber-800 font-medium">
                  {selectedOrder.confirmedBuyerWarning.warningText}
                </p>
                <div className="pt-1.5 border-t border-amber-200/60 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-amber-700">
                  <span>Mitigation Plan: {selectedOrder.confirmedBuyerWarning.mitigationPlan}</span>
                  <span className="font-mono mt-1 sm:mt-0">
                    Signed by: {selectedOrder.confirmedBuyerWarning.merchandiserName}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Card: TNA Milestone Roadmap */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-600" />
              Time-and-Action (TNA) Milestone Execution
            </h4>

            <div className="space-y-3">
              {selectedOrder.milestones.map((m, idx) => {
                const isCurrent = m.stage === selectedOrder.currentStage;
                const isCompleted = m.status === 'completed';

                return (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-lg border transition-all ${
                      isCurrent
                        ? 'border-indigo-300 bg-indigo-50/30 ring-1 ring-indigo-200'
                        : isCompleted
                        ? 'border-slate-200 bg-slate-50/50'
                        : 'border-slate-100 bg-white opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : isCurrent
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {isCompleted ? '✓' : idx + 1}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-900">{m.stage}</span>
                          <span className="text-[11px] text-slate-500 block">Unit: {m.responsibleUnit}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono text-xs font-medium text-slate-700 block">
                          Target: {m.targetStartDate} to {m.targetEndDate}
                        </span>
                        {m.actualEndDate && (
                          <span className="text-[11px] text-emerald-700 font-mono block">
                            Completed: {m.actualEndDate}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress bar for in-progress stage */}
                    {isCurrent && (
                      <div className="mt-2.5 pt-2 border-t border-indigo-100/60">
                        <div className="flex justify-between text-[11px] font-mono text-slate-600 mb-1">
                          <span>Progress: {m.completedQuantity.toLocaleString()} pcs</span>
                          <span>Target: {m.targetQuantity.toLocaleString()} pcs</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round((m.completedQuantity / m.targetQuantity) * 100)
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Garment Spec, Photos, and Date Change Compliance Audit */}
        <div className="space-y-6">
          {/* Garment Image & Spec Card */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-slate-600" />
              Approved Garment Visual
            </h4>
            <SafeImage
              src={selectedOrder.garmentImageUrl}
              alt={selectedOrder.styleDescription}
              fallbackSrc="/images/fallback_garment.svg"
              className="aspect-square rounded-lg border border-slate-200 mb-3"
            />
            <div className="space-y-1 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Order Quantity:</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedOrder.totalQuantity.toLocaleString()} pcs
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Allocated Unit:</span>
                <span className="font-medium text-slate-800">{selectedOrder.unit}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Order Placement:</span>
                <span className="font-mono text-slate-700">{selectedOrder.orderDate}</span>
              </div>
            </div>
          </div>

          {/* Compliance Date Change Audit Log (Crucial Brief Requirement!) */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-600" />
                Date Change Compliance Log
              </h4>
              <span className="text-[11px] font-mono text-slate-400">
                {selectedOrder.dateChangeAudits.length} revisions
              </span>
            </div>

            {selectedOrder.dateChangeAudits.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No schedule date revisions recorded. Original target holds.
              </p>
            ) : (
              <div className="space-y-2.5">
                {selectedOrder.dateChangeAudits.map((a) => (
                  <div key={a.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between font-mono font-bold text-slate-800">
                      <span>
                        {a.previousValue} → <span className="text-indigo-700">{a.newValue}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        {new Date(a.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-snug">{a.reason}</p>
                    <span className="text-[10px] text-slate-400 block pt-0.5">
                      Sign-off: {a.authorizedBy}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Factory Floor Inspection Photos (Verified only) */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Verified Production Floor Photos
            </h4>
            {buyerVisibleLogs.filter((l) => l.photoUrl).length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                Daily floor QC photos are undergoing inspection sign-off.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {buyerVisibleLogs
                  .filter((l) => l.photoUrl)
                  .map((l) => (
                    <div key={l.id} className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                      <SafeImage
                        src={l.photoUrl}
                        alt="Floor QC"
                        fallbackSrc="/images/fallback_factory.svg"
                        className="w-full h-24"
                      />
                      <div className="p-1.5 text-[10px] text-slate-600 font-mono">
                        {l.date} · {l.stage}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
