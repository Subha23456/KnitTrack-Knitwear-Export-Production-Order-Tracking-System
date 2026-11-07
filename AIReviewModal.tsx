import React, { useState } from 'react';
import { Order, DailyLog } from '../types';
import { reviewDailyLog, confirmDelayWarning } from '../services/api';
import { SafeImage } from './SafeImage';
import { X, Check, Edit2, ShieldAlert, Sparkles, Send, CheckCircle2 } from 'lucide-react';

interface AIReviewModalProps {
  order: Order | null;
  onClose: () => void;
  onOrderUpdated: (updatedOrder: Order) => void;
}

export const AIReviewModal: React.FC<AIReviewModalProps> = ({
  order,
  onClose,
  onOrderUpdated,
}) => {
  if (!order) return null;

  // Find logs that need review or show all logs
  const logs = order.dailyLogs;

  const [selectedLogId, setSelectedLogId] = useState<string>(logs[0]?.id || '');
  const activeLog = logs.find((l) => l.id === selectedLogId) || logs[0];

  const [category, setCategory] = useState<string>(activeLog?.aiReasonCategory || 'Normal Production / General Note');
  const [merchandiserComment, setMerchandiserComment] = useState<string>(activeLog?.merchandiserComment || '');
  const [shareWithBuyer, setShareWithBuyer] = useState<boolean>(activeLog?.isSharedWithBuyer ?? false);
  const [isSavingReview, setIsSavingReview] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Buyer warning release form
  const [showWarningRelease, setShowWarningRelease] = useState<boolean>(order.hasUnconfirmedDelayWarning);
  const [warningText, setWarningText] = useState<string>(
    `Production schedule alert for ${order.poNumber}: Minor delay detected in ${order.currentStage} stage due to floor equipment servicing. Target completion adjusted.`
  );
  const [mitigationPlan, setMitigationPlan] = useState<string>(
    'Double-line overtime authorized on Saturday; parallel line 2 activated to maintain export container dispatch.'
  );
  const [revisedDate, setRevisedDate] = useState<string>(order.exFactoryDate);
  const [isConfirmingWarning, setIsConfirmingWarning] = useState<boolean>(false);

  const categories = [
    'Yarn & Fabric Delay',
    'Machine Breakdown',
    'Needle Breakage / QC Alert',
    'Printing Screen / Strike-off Defect',
    'Subcontract Processor Delay',
    'Absenteeism / Power Outage',
    'Trims & Accessories Shortage',
    'Normal Production / General Note',
  ];

  const handleSaveReview = async () => {
    if (!activeLog) return;
    setIsSavingReview(true);
    setFeedbackMsg(null);
    try {
      const updated = await reviewDailyLog(order.id, activeLog.id, {
        reviewStatus: 'confirmed',
        correctedCategory: category,
        merchandiserComment,
        isSharedWithBuyer: shareWithBuyer,
      });
      setFeedbackMsg('Supervisor note review saved successfully!');
      onOrderUpdated(updated);
    } catch (err: any) {
      setFeedbackMsg(`Error: ${err.message}`);
    } finally {
      setIsSavingReview(false);
    }
  };

  const handleConfirmBuyerWarning = async () => {
    setIsConfirmingWarning(true);
    try {
      const updated = await confirmDelayWarning(order.id, {
        warningText,
        mitigationPlan,
        revisedExFactoryDate: revisedDate,
      });
      setFeedbackMsg('Delay notice confirmed and published to Buyer Portal!');
      onOrderUpdated(updated);
    } catch (err: any) {
      setFeedbackMsg(`Error: ${err.message}`);
    } finally {
      setIsConfirmingWarning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-3xl w-full p-6 text-slate-900">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                {order.poNumber}
              </span>
              <span className="text-xs text-slate-500">· {order.buyerName}</span>
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Merchandiser AI Audit Workflow
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Supervisor Notes Review & Delay Release Control
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Brief requirement: "The original note sits beside the translation, merchandisers can change the category, and warnings reach buyers only after confirmation."
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Review Floor Supervisor Note */}
        {activeLog ? (
          <div className="mt-4 space-y-4">
            {/* Log picker if multiple logs */}
            {logs.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs font-medium text-slate-500 shrink-0">Select Log:</span>
                {logs.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => {
                      setSelectedLogId(l.id);
                      setCategory(l.aiReasonCategory || 'Normal Production / General Note');
                      setMerchandiserComment(l.merchandiserComment || '');
                      setShareWithBuyer(l.isSharedWithBuyer);
                      setFeedbackMsg(null);
                    }}
                    className={`text-xs px-2.5 py-1 rounded-md border whitespace-nowrap transition-colors ${
                      selectedLogId === l.id
                        ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {l.date} · {l.stage} ({l.quantityDoneToday.toLocaleString()} pcs)
                  </button>
                ))}
              </div>
            )}

            {/* Side-by-Side: Original Tamil Note vs AI Translation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column: Original Tamil Floor Note */}
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Original Tamil Supervisor Note
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    By {activeLog.supervisorName}
                  </span>
                </div>
                <div className="p-3 bg-white rounded border border-slate-200 text-sm font-sans text-slate-900 min-h-[90px] leading-relaxed">
                  {activeLog.originalNoteTamil || (
                    <span className="text-slate-400 italic">No text note attached.</span>
                  )}
                </div>
                {activeLog.photoUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <SafeImage
                      src={activeLog.photoUrl}
                      alt="Floor photo"
                      fallbackSrc="/images/fallback_factory.svg"
                      className="w-12 h-12 rounded border border-slate-200 shrink-0"
                    />
                    <span className="text-xs text-slate-500">Floor inspection image attached</span>
                  </div>
                )}
              </div>

              {/* Right Column: AI Translation & Extraction */}
              <div className="p-4 rounded-lg border border-indigo-200 bg-indigo-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-950 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-600" />
                    AI Translation & Confidence
                  </span>
                  {activeLog.aiConfidence && (
                    <span className="text-[11px] font-mono font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">
                      {Math.round(activeLog.aiConfidence * 100)}% Match
                    </span>
                  )}
                </div>
                <div className="p-3 bg-white rounded border border-indigo-100 text-sm text-slate-800 min-h-[90px] leading-relaxed">
                  {activeLog.englishTranslation || activeLog.originalNoteTamil}
                </div>
                {activeLog.isAiCorrectedByMerchandiser && (
                  <span className="text-[11px] text-amber-700 font-medium block mt-1.5">
                    Category previously modified by merchandiser.
                  </span>
                )}
              </div>
            </div>

            {/* Merchandiser Override Controls */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Verified Reason Category (Merchandiser Override)
                  </label>
                  <select
                    aria-label="Verified Reason Category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Share Verified Remarks with Buyer?
                  </label>
                  <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="shareBuyer"
                        checked={shareWithBuyer}
                        onChange={() => setShareWithBuyer(true)}
                        className="text-slate-900"
                      />
                      Yes, publish to Buyer View
                    </label>
                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="shareBuyer"
                        checked={!shareWithBuyer}
                        onChange={() => setShareWithBuyer(false)}
                        className="text-slate-900"
                      />
                      No, internal factory note only
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Merchandiser Internal Follow-Up Remarks
                </label>
                <input
                  type="text"
                  value={merchandiserComment}
                  onChange={(e) => setMerchandiserComment(e.target.value)}
                  placeholder="e.g., Line mechanic replaced bearing; overtime scheduled for tomorrow."
                  className="w-full text-xs bg-white border border-slate-300 rounded-md p-2 text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  Status: {activeLog.merchandiserReviewStatus.toUpperCase()}
                </span>
                <button
                  onClick={handleSaveReview}
                  disabled={isSavingReview}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSavingReview ? 'Saving...' : 'Save & Confirm Review'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs">
            No supervisor updates logged yet for this order.
          </div>
        )}

        {/* Section 2: Confirm Buyer Warning Workflow */}
        <div className="mt-5 border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Buyer Delay Notification Gate (Strict Merchandiser Approval)
              </h4>
            </div>
            <button
              onClick={() => setShowWarningRelease(!showWarningRelease)}
              className="text-xs text-indigo-600 font-semibold hover:underline"
            >
              {showWarningRelease ? 'Collapse' : 'Manage Buyer Notification'}
            </button>
          </div>

          <p className="text-xs text-slate-500 mb-3">
            To prevent buyer panic, raw supervisor delay alerts are gated. The merchandiser must authoritatively confirm the issue and provide a concrete mitigation plan before it shows in the Buyer Portal.
          </p>

          {showWarningRelease && (
            <div className="bg-amber-50/60 border border-amber-200 rounded-lg p-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-amber-900 mb-1">
                  1. Formal Delay Notice to Buyer
                </label>
                <textarea
                  rows={2}
                  value={warningText}
                  onChange={(e) => setWarningText(e.target.value)}
                  className="w-full text-xs bg-white border border-amber-300 rounded p-2 text-slate-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">
                    2. Corrective Mitigation Action Plan
                  </label>
                  <input
                    type="text"
                    value={mitigationPlan}
                    onChange={(e) => setMitigationPlan(e.target.value)}
                    className="w-full text-xs bg-white border border-amber-300 rounded p-2 text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">
                    3. Revised Ex-Factory Date (Optional Buffer)
                  </label>
                  <input
                    type="date"
                    value={revisedDate}
                    onChange={(e) => setRevisedDate(e.target.value)}
                    className="w-full text-xs bg-white border border-amber-300 rounded p-2 text-slate-900 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleConfirmBuyerWarning}
                  disabled={isConfirmingWarning}
                  className="px-4 py-2 text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isConfirmingWarning ? 'Publishing...' : 'Confirm & Publish Warning to Buyer'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Feedback message */}
        {feedbackMsg && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
