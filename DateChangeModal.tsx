import React, { useState } from 'react';
import { Order } from '../types';
import { updateExFactoryDate } from '../services/api';
import { X, Calendar, History, CheckCircle2 } from 'lucide-react';

interface DateChangeModalProps {
  order: Order | null;
  onClose: () => void;
  onOrderUpdated: (updated: Order) => void;
  authorizedByName: string;
}

export const DateChangeModal: React.FC<DateChangeModalProps> = ({
  order,
  onClose,
  onOrderUpdated,
  authorizedByName,
}) => {
  if (!order) return null;

  const [newDate, setNewDate] = useState<string>(order.exFactoryDate);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg('Audit trail compliance requires an explicit reason for date revision.');
      return;
    }

    if (newDate === order.exFactoryDate) {
      setErrorMsg('Please select a different revised date.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const updated = await updateExFactoryDate(
        order.id,
        newDate,
        reason
      );
      onOrderUpdated(updated);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update date');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 text-slate-900">
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                {order.poNumber}
              </span>
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                Compliance Audit Trail
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Revise Ex-Factory Date & Log Audit Record
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              EU & UK buyer compliance teams log every schedule change permanently.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 rounded-lg">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
            <div>
              <span className="text-slate-500 block">Current Ex-Factory Date:</span>
              <span className="font-mono text-sm font-bold text-slate-800">
                {order.exFactoryDate}
              </span>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">Buyer:</span>
              <span className="font-semibold text-slate-800">{order.buyerName}</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
              New Revised Ex-Factory Date
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
              className="w-full font-mono text-sm font-bold bg-slate-50 border border-slate-300 rounded-md p-2 text-indigo-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
              Justification & Change Reason (Mandatory Audit Requirement)
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Buyer approved 3-day extension due to yarn mill dye-lot strike-off delay..."
              required
              className="w-full bg-slate-50 border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wide mb-1">
              Authorized Sign-Off
            </label>
            <input
              type="text"
              readOnly
              value={authorizedByName || 'Priya Rajan (Senior Merchandiser)'}
              className="w-full bg-slate-100 border border-slate-200 rounded-md p-2 text-slate-600 font-medium cursor-not-allowed"
            />
          </div>

          {/* Past Audits on this order */}
          {order.dateChangeAudits.length > 0 && (
            <div className="border-t border-slate-100 pt-3">
              <span className="font-bold text-slate-700 uppercase tracking-wide block mb-1.5 flex items-center gap-1">
                <History className="w-3.5 h-3.5" />
                Previous Audit History ({order.dateChangeAudits.length})
              </span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {order.dateChangeAudits.map((a) => (
                  <div key={a.id} className="p-2 bg-slate-50 rounded border border-slate-200 text-[11px]">
                    <div className="flex justify-between font-mono font-medium text-slate-700">
                      <span>{a.previousValue} → {a.newValue}</span>
                      <span className="text-slate-400">{new Date(a.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{a.reason}</p>
                    <span className="text-[10px] text-slate-400">By: {a.authorizedBy}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Saving Audit...' : 'Save & Append to Audit Trail'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
