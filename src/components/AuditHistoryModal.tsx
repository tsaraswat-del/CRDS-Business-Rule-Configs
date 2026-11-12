import React from 'react';
import { STMBusinessRule } from '../types/stm';
import { X, History, UserCheck, ShieldCheck, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface AuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  rule: STMBusinessRule | null;
}

export const AuditHistoryModal: React.FC<AuditHistoryModalProps> = ({
  isOpen,
  onClose,
  rule,
}) => {
  if (!isOpen || !rule) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white w-full max-w-2xl rounded-lg shadow-xl border border-slate-300 overflow-hidden flex flex-col max-h-[85vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#1f242d] text-white flex items-center justify-between border-b border-[#323947]">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-rose-400" />
            <h3 className="font-bold text-sm tracking-tight">
              4-Eye Audit Trail & History: {rule.ccy.join(', ')} ({rule.id})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Rule Summary */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <span className="text-slate-500 block">Currency:</span>
              <strong className="font-mono text-slate-900">{rule.ccy.join(', ')}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Indices:</span>
              <strong className="font-mono text-slate-900">{rule.indices.join(', ')}</strong>
            </div>
            <div>
              <span className="text-slate-500 block">Current Status:</span>
              <strong className={`px-1.5 py-0.2 rounded inline-block text-[11px] ${
                rule.recordStatus === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {rule.recordStatus}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">Fixing Page:</span>
              <strong className="font-mono text-slate-900">{rule.fixingPage || 'NA'}</strong>
            </div>
          </div>
          <div className="mt-2 text-slate-600 truncate">
            <span className="text-slate-500">Products:</span> {rule.productTypes.join(', ')}
          </div>
        </div>

        {/* History Timeline */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Chronological Audit Events
          </h4>

          <div className="relative border-l-2 border-slate-200 ml-3 space-y-5 py-1">
            {/* Created event */}
            <div className="relative pl-6">
              <span className="absolute -left-2 top-0.5 w-3.5 h-3.5 rounded-full bg-blue-500 ring-4 ring-white flex items-center justify-center" />
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">Created by Maker</span>
                  <span className="text-slate-400 font-mono text-[11px]">{rule.createdOn}</span>
                </div>
                <div className="text-slate-600 mt-0.5">
                  Maker User: <strong className="font-mono text-blue-700">{rule.createdBy}</strong>
                </div>
                <div className="text-slate-500 mt-1 italic text-[11px]">
                  &quot;Submitted initial Settle to Market parameters via CRDS utility screen&quot;
                </div>
              </div>
            </div>

            {/* Modified events if any */}
            {rule.updatedBy && (
              <div className="relative pl-6">
                <span className="absolute -left-2 top-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 ring-4 ring-white flex items-center justify-center" />
                <div className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">Modified by Analyst</span>
                    <span className="text-slate-400 font-mono text-[11px]">{rule.updatedOn}</span>
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    Updated By: <strong className="font-mono text-amber-700">{rule.updatedBy}</strong>
                  </div>
                  <div className="text-slate-500 mt-1 italic text-[11px]">
                    &quot;Updated parameter config; status transitioned to Modified (awaiting Checker approval)&quot;
                  </div>
                </div>
              </div>
            )}

            {/* Approved event if any */}
            {rule.approvedBy && (
              <div className="relative pl-6">
                <span className="absolute -left-2 top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-4 ring-white flex items-center justify-center" />
                <div className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">4-Eye Verification Approved</span>
                    <span className="text-slate-400 font-mono text-[11px]">{rule.approvedOn}</span>
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    Checker Approver: <strong className="font-mono text-emerald-700">{rule.approvedBy}</strong>
                  </div>
                  <div className="text-slate-500 mt-1 italic text-[11px]">
                    &quot;Verified against MarkitWire STM rate schedule; status transitioned to Approved for production clearing.&quot;
                  </div>
                </div>
              </div>
            )}

            {/* Rejection if any */}
            {rule.recordStatus === 'Rejected' && (
              <div className="relative pl-6">
                <span className="absolute -left-2 top-0.5 w-3.5 h-3.5 rounded-full bg-rose-500 ring-4 ring-white flex items-center justify-center" />
                <div className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-rose-900">Rejected by Checker</span>
                  </div>
                  <div className="text-rose-700 mt-1 italic text-[11px]">
                    Reason: {rule.rejectionReason || 'Non-compliant configuration'}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-white hover:bg-slate-900 rounded text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
