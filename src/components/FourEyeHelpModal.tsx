import React from 'react';
import { X, ShieldCheck, UserCheck, ArrowRight, CheckCircle2, Lock } from 'lucide-react';

interface FourEyeHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToMaker: () => void;
  onSwitchToChecker: () => void;
}

export const FourEyeHelpModal: React.FC<FourEyeHelpModalProps> = ({
  isOpen,
  onClose,
  onSwitchToMaker,
  onSwitchToChecker,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white w-full max-w-2xl rounded-lg shadow-xl border border-slate-300 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        <div className="px-5 py-3.5 bg-[#1f242d] text-white flex items-center justify-between border-b border-[#323947]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm tracking-tight">
              CRDS 4-Eye Maker-Checker Governance Guide
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-900">
            <strong>What is 4-Eye Verification?</strong>
            <p className="mt-1">
              In financial credit risk and derivatives infrastructure (OSTTRA CRDS), Settle to Market (STM) configurations control how margin, valuation, and settlement rules are assessed. A change made by one person (the <strong>Maker</strong>) must be independently reviewed and approved by a second authorized person (the <strong>Checker</strong>) before taking effect in production.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="border border-amber-200 bg-amber-50/60 rounded-md p-3.5">
              <div className="flex items-center gap-2 font-bold text-amber-900 text-xs mb-1.5">
                <UserCheck className="w-4 h-4 text-amber-600" />
                <span>1. Maker Role (xyx@osttra.com)</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Creates new rules via the green <strong>&quot;+ New Business Rule&quot;</strong> button.</li>
                <li>Selects products, 179 ISO CCYs, indices, legs, and fixing page.</li>
                <li>Clicks <strong>Save</strong> &rarr; Record status becomes <strong>Added</strong> or <strong>Modified</strong>.</li>
                <li className="font-semibold text-rose-700">CANNOT click Approve on their own records (self-approval blocked).</li>
              </ul>
              <div className="mt-3">
                <button
                  onClick={() => {
                    onSwitchToMaker();
                    onClose();
                  }}
                  className="w-full py-1 px-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium text-center"
                >
                  Switch to Maker (xyx@osttra.com)
                </button>
              </div>
            </div>

            <div className="border border-emerald-200 bg-emerald-50/60 rounded-md p-3.5">
              <div className="flex items-center gap-2 font-bold text-emerald-900 text-xs mb-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>2. Checker Role (pqr@osttra.com)</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li>Reviews rules submitted by other team members.</li>
                <li>Verifies rates parameters against MarkitWire & clearing schedules.</li>
                <li>Clicks <strong>Approve</strong> &rarr; Record status becomes <strong>Approved</strong>.</li>
                <li>Can also <strong>Reject</strong> with mandatory reason if parameters fail checks.</li>
              </ul>
              <div className="mt-3">
                <button
                  onClick={() => {
                    onSwitchToChecker();
                    onClose();
                  }}
                  className="w-full py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-center"
                >
                  Switch to Checker (pqr@osttra.com)
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <h4 className="font-bold text-slate-800 mb-1">Key Configuration Rules in this Utility:</h4>
            <ul className="list-disc list-inside space-y-1 text-slate-600 mb-2">
              <li><strong>Products:</strong> Cross Currency Basis Swap, Fixed Fixed Swap, Cross Currency IRS, FX Forward, FX Swap, FX Spot.</li>
              <li><strong>Currency Rules:</strong> Rates products require single CCY (CCY 2 disabled) to map to relationship index configs. FX products require CCY 1 and CCY 2 to configure FX pairs.</li>
              <li><strong>Tenor Boundaries:</strong> Min &amp; Max tenors can be manually entered with any positive number followed by <code>D</code> (Days), <code>W</code> (Weeks), <code>M</code> (Months), or <code>Y</code> (Years) (e.g. <code>1D</code>, <code>15D</code>, <code>3W</code>, <code>18M</code>, <code>2Y</code>, <code>7Y</code>, <code>25Y</code>).</li>
              <li><strong>Legs for FX:</strong> Fixed and Floating legs are locked to <code>NA</code> for FX products (Spot, Forward, Swap).</li>
              <li><strong>Indices Optional:</strong> Indices are non-mandatory when <em>Fixed Fixed Swap</em> or any <em>FX product</em> is selected.</li>
              <li><strong>Fixing Page Dynamic:</strong> Enabled strictly when <em>Cross Currency Basis Swap</em> is selected, loaded with Reuters benchmark pages (<code>Reuters-AUDFIX</code>, <code>Reuters-USDCADFIXM=WM</code>, etc.).</li>
            </ul>
            <h4 className="font-bold text-slate-800 mb-1">How to test 4-Eye Maker-Checker:</h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-600">
              <li>Log in as <strong>xyx@osttra.com (Maker)</strong>.</li>
              <li>Click <strong>&quot;+ New Business Rule&quot;</strong>, select product (e.g. <code>FX Spot</code> or <code>Fixed Fixed Swap</code>), pick currency (e.g. <code>AUD</code> or <code>EUR/USD</code>), and notice indices are optional! Click <strong>Save</strong>.</li>
              <li>Notice that attempting to click <strong>Approve</strong> warns that Maker cannot self-approve.</li>
              <li>Use the user switcher in the top bar to switch to <strong>pqr@osttra.com (Checker)</strong>.</li>
              <li>Click <strong>Approve</strong> on the rule &rarr; Status becomes <strong>Approved</strong> with your email and timestamp logged!</li>
            </ol>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 text-white hover:bg-slate-900 rounded text-xs font-semibold"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
