import React, { useState, useEffect, useMemo } from 'react';
import { STMBusinessRule, UserPersona, LegApplicability } from '../types/stm';
import { 
  X, 
  Check, 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  Plus, 
  Trash2, 
  HelpCircle,
  Clock,
  CheckCircle2,
  Lock,
  ArrowRight,
  Info,
  Calendar
} from 'lucide-react';
import { 
  XCCY_PRODUCTS, 
  FX_PRODUCTS,
  ISO_CURRENCIES, 
  MW_ELIGIBLE_INDICES, 
  FIXING_PAGES,
  FX_MIN_TENORS,
  FX_MAX_TENORS,
  RATES_MIN_TENORS,
  RATES_MAX_TENORS,
  COMMON_TENORS,
  isValidTenor,
  normalizeTenor,
  describeTenor,
  tenorToDays
} from '../data/mockData';

interface RuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ruleData: Partial<STMBusinessRule>, isNew: boolean) => void;
  onApprove: (ruleId: string, comment?: string) => void;
  onReject: (ruleId: string, reason: string) => void;
  onSwitchUserToChecker: () => void;
  editingRule: STMBusinessRule | null;
  currentUser: UserPersona;
}

export const RuleModal: React.FC<RuleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onApprove,
  onReject,
  onSwitchUserToChecker,
  editingRule,
  currentUser,
}) => {
  // Form fields
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [ccy1, setCcy1] = useState<string>('USD');
  const [ccy2, setCcy2] = useState<string>('EUR');
  const [selectedIndices, setSelectedIndices] = useState<string[]>([]);
  const [fixedLeg, setFixedLeg] = useState<LegApplicability>('Yes');
  const [floatingLeg, setFloatingLeg] = useState<LegApplicability>('Yes');
  const [minTenor, setMinTenor] = useState<string>('1D');
  const [maxTenor, setMaxTenor] = useState<string>('2Y');
  const [fixingPage, setFixingPage] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  // Search & custom inputs inside dropdowns
  const [ccy1Search, setCcy1Search] = useState('');
  const [ccy2Search, setCcy2Search] = useState('');
  const [indexSearch, setIndexSearch] = useState('');
  const [customIndexInput, setCustomIndexInput] = useState('');
  const [showCustomIndex, setShowCustomIndex] = useState(false);

  // Validation
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [fourEyeAlert, setFourEyeAlert] = useState<string | null>(null);

  // Derived product state rules
  const isXccyBasisSwapSelected = selectedProducts.includes('Cross Currency Basis Swap');
  const isFixedFixedSelected = selectedProducts.includes('Fixed Fixed Swap');
  const isFxSelected = selectedProducts.some(p => FX_PRODUCTS.includes(p));
  const isRatesOnly = selectedProducts.every(p => !FX_PRODUCTS.includes(p));

  // 1. Legs: Fixed and floating legs NOT applicable for FX products (Spot, Forward, Swap)
  // 2. CCY 2: Allowed ONLY for FX products (to form a pair). Disabled for Rates products (single CCY only to map to relationship index config).
  // 3. Indices: Non-mandatory if Fixed Fixed swap or FX product is selected
  const isIndicesMandatory = !isFixedFixedSelected && !isFxSelected;

  // Custom indices dynamically added by user for the chosen currency
  const [customIndices, setCustomIndices] = useState<string[]>([]);

  // Currencies chosen for the current rule:
  // For Rates products: single CCY (ccy1)
  // For FX products: both ccy1 and ccy2
  const chosenCcys = useMemo<string[]>(() => {
    if (isFxSelected) {
      return [ccy1, ccy2].filter((c: string): c is string => Boolean(c && c !== 'NA'));
    }
    return [ccy1].filter(Boolean) as string[];
  }, [isFxSelected, ccy1, ccy2]);

  // Check if an index belongs to the chosen currency (or currencies)
  const isIndexMatchingChosenCcy = (indexName: string) => {
    if (indexName === 'NA') return true;
    const upper = indexName.toUpperCase();
    return chosenCcys.some((c: string) => upper.startsWith(`${c.toUpperCase()}-`));
  };

  // Filter eligible indices strictly to those corresponding to the chosen currency
  const indicesForChosenCcy = useMemo<string[]>(() => {
    const combined = [...MW_ELIGIBLE_INDICES, ...customIndices];
    const unique = Array.from(new Set(combined));
    return unique.filter((idx: string) => isIndexMatchingChosenCcy(idx));
  }, [chosenCcys, customIndices]);

  // Initialize or reset form
  useEffect(() => {
    if (editingRule) {
      setSelectedProducts([...editingRule.productTypes]);
      setCcy1(editingRule.ccy1 || editingRule.ccy[0] || 'USD');
      setCcy2(editingRule.ccy2 || (editingRule.ccy.length > 1 ? editingRule.ccy[1] : 'NA'));
      setSelectedIndices([...editingRule.indices]);
      setFixedLeg(editingRule.fixedLeg || 'Yes');
      setFloatingLeg(editingRule.floatingLeg || 'Yes');
      setMinTenor(editingRule.minTenor || '1D');
      setMaxTenor(editingRule.maxTenor || '2Y');
      setFixingPage(editingRule.fixingPage || '');
      setDescription(editingRule.description || '');
    } else {
      // Defaults for new rule
      setSelectedProducts(['Cross Currency Basis Swap']);
      setCcy1('USD');
      setCcy2('NA');
      setSelectedIndices(['USD-SOFR']);
      setFixedLeg('Yes');
      setFloatingLeg('Yes');
      setMinTenor('1M');
      setMaxTenor('5Y');
      setFixingPage('Reuters-USDCADFIXM=WM');
      setDescription('');
    }
    setValidationErrors([]);
    setFourEyeAlert(null);
    setShowRejectInput(false);
    setRejectionReason('');
  }, [editingRule, isOpen]);

  // Adjust leg applicability and CCY2 when product selection changes
  useEffect(() => {
    if (isFxSelected) {
      // FX products: legs not applicable, CCY2 enabled, Tenors default to 1D / 2Y
      setFixedLeg('NA');
      setFloatingLeg('NA');
      if (ccy2 === 'NA' || !ccy2) {
        setCcy2('EUR');
      }
      if (!editingRule) {
        setMinTenor('1D');
        setMaxTenor('2Y');
      }
    } else {
      // Rates products: legs applicable, CCY2 disabled (single CCY only), Tenors default to 1M / 10Y
      if (fixedLeg === 'NA') setFixedLeg('Yes');
      if (floatingLeg === 'NA') setFloatingLeg('Yes');
      setCcy2('NA');
      if (!editingRule && minTenor === '1D') {
        setMinTenor('1M');
        setMaxTenor('10Y');
      }
    }
  }, [isFxSelected]);

  // Automatically sync fixingPage if XCCY Basis Swap is toggled off
  useEffect(() => {
    if (!isXccyBasisSwapSelected) {
      setFixingPage('NA');
    } else if (fixingPage === 'NA' || !fixingPage) {
      setFixingPage('Reuters-USDCADFIXM=WM');
    }
  }, [isXccyBasisSwapSelected]);

  // Whenever the chosen currency changes, sanitize selected indices so they strictly match the newly chosen currency
  useEffect(() => {
    if (!isOpen) return;
    setSelectedIndices((prev) => {
      // Keep selected indices that match the new chosen currency
      const valid = prev.filter(idx => isIndexMatchingChosenCcy(idx));
      if (valid.length > 0) return valid;
      // If indices are optional (Fixed Fixed Swap / FX), default to ['NA']
      if (!isIndicesMandatory) {
        return ['NA'];
      }
      // If indices are mandatory, select the first available standard index for this currency
      const firstMatch = MW_ELIGIBLE_INDICES.find(idx => idx !== 'NA' && isIndexMatchingChosenCcy(idx));
      return firstMatch ? [firstMatch] : ['NA'];
    });
  }, [ccy1, ccy2, isFxSelected, isIndicesMandatory, isOpen]);

  if (!isOpen) return null;

  const isEditing = Boolean(editingRule);

  // 4-Eye check logic:
  // Is the current user the creator or modifier?
  const isMakerOfThisRecord = editingRule && (
    editingRule.createdBy === currentUser.email || 
    editingRule.updatedBy === currentUser.email
  );

  // Can the current user approve?
  const canApprove = isEditing && !isMakerOfThisRecord && currentUser.role === 'Checker';

  // Toggle selection helpers
  const toggleProduct = (prod: string) => {
    if (selectedProducts.includes(prod)) {
      if (selectedProducts.length > 1) {
        setSelectedProducts(selectedProducts.filter(p => p !== prod));
      }
    } else {
      setSelectedProducts([...selectedProducts, prod]);
    }
  };

  const toggleIndex = (idx: string) => {
    if (idx === 'NA') {
      setSelectedIndices(['NA']);
      return;
    }
    let newIndices = selectedIndices.filter(i => i !== 'NA');
    if (newIndices.includes(idx)) {
      newIndices = newIndices.filter(i => i !== idx);
    } else {
      newIndices.push(idx);
    }
    setSelectedIndices(newIndices);
  };

  const handleAddCustomIndex = () => {
    let trimmed = customIndexInput.trim().toUpperCase();
    if (!trimmed) return;
    // Auto-prefix with ccy1 if user didn't type the CCY- prefix
    const hasCcyPrefix = chosenCcys.some((c: string) => trimmed.startsWith(`${c.toUpperCase()}-`));
    if (!hasCcyPrefix && trimmed !== 'NA') {
      trimmed = `${ccy1.toUpperCase()}-${trimmed}`;
    }
    if (!customIndices.includes(trimmed)) {
      setCustomIndices(prev => [...prev, trimmed]);
    }
    if (!selectedIndices.includes(trimmed)) {
      setSelectedIndices(prev => [...prev.filter(i => i !== 'NA'), trimmed]);
    }
    setCustomIndexInput('');
    setShowCustomIndex(false);
  };

  const validate = () => {
    const errors: string[] = [];
    if (selectedProducts.length === 0) {
      errors.push('Please select at least one Product Type.');
    }
    if (!ccy1 || ccy1.trim() === '') {
      errors.push('Please select CCY 1 (Base Currency).');
    }
    if (isFxSelected && (!ccy2 || ccy2 === 'NA' || ccy2.trim() === '')) {
      errors.push('Please select CCY 2 (Counter Currency) for FX product pair.');
    }
    if (isFxSelected && ccy1 === ccy2) {
      errors.push('CCY 1 and CCY 2 cannot be the same currency in an FX pair.');
    }
    // Check indices requirement:
    if (isIndicesMandatory) {
      const validIndices = selectedIndices.filter(i => i && i !== '' && i !== 'NA');
      if (validIndices.length === 0) {
        errors.push(`Indices selection is mandatory for ${selectedProducts.join(', ')} (indices are optional only for Fixed Fixed Swap and FX products).`);
      }
    }

    // Validate that selected indices only belong to the chosen currency
    if (selectedIndices.length > 0) {
      const mismatchedIndices = selectedIndices.filter(i => !isIndexMatchingChosenCcy(i));
      if (mismatchedIndices.length > 0) {
        errors.push(`Selected index (${mismatchedIndices.join(', ')}) does not belong to chosen currency ${chosenCcys.join(' / ')}. Only indices for ${chosenCcys.join(' / ')} can be selected.`);
      }
    }

    // Validate Tenor convention: any positive number followed by D, W, M, or Y
    const trimmedMin = minTenor.trim();
    const trimmedMax = maxTenor.trim();

    if (!trimmedMin) {
      errors.push('Min Tenor is required (e.g. 1D, 2D, 1W, 1M, 1Y).');
    } else if (!isValidTenor(trimmedMin)) {
      errors.push(`Min Tenor '${trimmedMin}' is invalid. Please follow the <number>[D|W|M|Y] convention (e.g., 1D, 15D, 3W, 6M, 18M, 2Y).`);
    }

    if (!trimmedMax) {
      errors.push('Max Tenor is required (e.g. 2Y, 5Y, 10Y, 30Y).');
    } else if (!isValidTenor(trimmedMax)) {
      errors.push(`Max Tenor '${trimmedMax}' is invalid. Please follow the <number>[D|W|M|Y] convention (e.g., 2Y, 5Y, 10Y, 30Y).`);
    }

    if (isValidTenor(trimmedMin) && isValidTenor(trimmedMax)) {
      const minDays = tenorToDays(trimmedMin);
      const maxDays = tenorToDays(trimmedMax);
      if (minDays > maxDays) {
        errors.push(`Min Tenor (${normalizeTenor(trimmedMin)}) cannot be greater than Max Tenor (${normalizeTenor(trimmedMax)}).`);
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Handler for Save
  const handleSave = () => {
    if (!validate()) return;

    const finalIndices = selectedIndices.length > 0 ? selectedIndices : ['NA'];
    const finalFixingPage = isXccyBasisSwapSelected ? (fixingPage.trim() || 'NA') : 'NA';
    const finalCcy2 = isFxSelected ? ccy2 : 'NA';
    const finalCcy = isFxSelected && ccy2 !== 'NA' ? [ccy1, ccy2] : [ccy1];
    const finalFixedLeg = isFxSelected ? 'NA' : fixedLeg;
    const finalFloatingLeg = isFxSelected ? 'NA' : floatingLeg;

    onSave({
      productTypes: selectedProducts,
      ccy1,
      ccy2: finalCcy2,
      ccy: finalCcy,
      indices: finalIndices,
      fixedLeg: finalFixedLeg,
      floatingLeg: finalFloatingLeg,
      minTenor: normalizeTenor(minTenor),
      maxTenor: normalizeTenor(maxTenor),
      fixingPage: finalFixingPage,
      description,
    }, !isEditing);
  };

  // Handler for Approve
  const handleApproveClick = () => {
    if (!isEditing) {
      setFourEyeAlert('A rule must first be saved and submitted by a Maker before it can be approved.');
      return;
    }

    if (!editingRule) return;

    if (isMakerOfThisRecord) {
      setFourEyeAlert(`4-Eye Violation: You (${currentUser.email}) created or modified this rule. Maker cannot approve their own changes under CRDS regulatory compliance rules.`);
      return;
    }

    if (currentUser.role !== 'Checker') {
      setFourEyeAlert(`Role Restriction: User ${currentUser.email} has role '${currentUser.role}'. Only authorized Checkers (e.g. pqr@osttra.com) can approve.`);
      return;
    }

    onApprove(editingRule.id, 'Approved via CRDS 4-Eye verification screen');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div 
        className="bg-white w-full max-w-5xl rounded-lg shadow-2xl border border-slate-300 flex flex-col max-h-[94vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Modal Window Header */}
        <div className="px-6 py-3.5 bg-[#1f242d] text-white flex items-center justify-between border-b border-[#323947]">
          <div className="flex items-center gap-3">
            <div className="bg-[#9c1844] text-white text-[11px] font-bold px-2 py-0.5 rounded-xs tracking-wider uppercase">
              CRDS SETUP
            </div>
            <h2 id="modal-title" className="text-base font-bold text-white tracking-tight">
              {editingRule ? `Edit STM Business Rule: ${editingRule.id}` : 'New Business Rule - STM FX & Rates Config'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* 4-Eye Role indicator inside modal */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] bg-[#2b323e] border border-[#3f4757]">
              <span className="text-slate-400">Acting As:</span>
              <span className="font-semibold text-slate-100">{currentUser.email}</span>
              <span className={`px-1.5 py-0.2 rounded font-bold text-[10px] ${
                currentUser.role === 'Checker' ? 'bg-emerald-800 text-emerald-200' : 'bg-amber-800 text-amber-200'
              }`}>
                {currentUser.role}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4-Eye Governance Notice Bar */}
        <div className="px-6 py-2 bg-slate-100 border-b border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-700">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>4-Eye Maker-Checker Rule:</strong> Parameters entered here will be saved as <strong>Added</strong> or <strong>Modified</strong>. Final Settle to Market activation requires approval by an independent Checker.
            </span>
          </div>

          {isMakerOfThisRecord && (
            <span className="text-amber-800 font-medium bg-amber-100 px-2 py-0.5 rounded border border-amber-300 text-[11px] flex items-center gap-1">
              <Lock className="w-3 h-3" /> You are Maker of this record
            </span>
          )}
        </div>

        {/* 4-Eye Violation Alert if triggered */}
        {fourEyeAlert && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-300 rounded-md text-xs text-amber-950 flex items-start justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-amber-900">4-Eye Check Security Notice</div>
                <div className="mt-0.5 text-amber-800">{fourEyeAlert}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onSwitchUserToChecker}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-[11px] flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <span>Switch to Checker (pqr@osttra.com)</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                onClick={() => setFourEyeAlert(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold px-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mx-6 mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800">
            <ul className="list-disc list-inside space-y-0.5">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Modal Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* ROW 1: Product Type | Currency Setup (CCY1 & CCY2) | Indices */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Product Type */}
            <div className="border border-slate-300 rounded-md p-3.5 bg-white shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Product Type <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  {selectedProducts.length} selected
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2.5">
                Select Rates or FX Products
              </p>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {XCCY_PRODUCTS.map((prod) => {
                  const isChecked = selectedProducts.includes(prod);
                  const isFx = FX_PRODUCTS.includes(prod);
                  return (
                    <label
                      key={prod}
                      className={`flex items-start justify-between p-1.5 rounded cursor-pointer text-xs transition-colors ${
                        isChecked ? 'bg-blue-50 text-blue-950 font-medium' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleProduct(prod)}
                          className="mt-0.5 h-3.5 w-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <span className="leading-snug">{prod}</span>
                      </div>
                      <span className={`text-[10px] px-1 rounded border font-semibold ${
                        isFx 
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                          : 'text-indigo-700 bg-indigo-50 border-indigo-200'
                      }`}>
                        {isFx ? 'FX' : 'Rates'}
                      </span>
                    </label>
                  );
                })}
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => setSelectedProducts(['Cross Currency Basis Swap'])}
                  className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                >
                  Rates Mode
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProducts(['FX Spot'])}
                  className="text-emerald-600 hover:text-emerald-800 font-medium cursor-pointer"
                >
                  FX Mode
                </button>
              </div>
            </div>

            {/* 2. Currency Setup: CCY 1 (Single CCY for Rates) and CCY 2 (Only for FX pairs, Disabled for Rates) */}
            <div className="border border-slate-300 rounded-md p-3.5 bg-white shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Currency Setup <span className="text-rose-500">*</span>
                  </label>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                    isFxSelected 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  }`}>
                    {isFxSelected ? 'FX Pair Mode' : 'Rates Single CCY'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  {isFxSelected 
                    ? 'Specify CCY 1 and CCY 2 to configure FX Pair' 
                    : 'Single CCY only for Rates (CCY 2 disabled to ensure relationship index mapping)'}
                </p>

                {/* CCY 1: Base Currency */}
                <div className="space-y-1 mb-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      CCY 1 {isFxSelected ? '(Base)' : '(Rates Currency)'} <span className="text-rose-500">*</span>
                    </span>
                    <span className="font-mono text-blue-700 font-bold">{ccy1}</span>
                  </div>
                  <select
                    value={ccy1}
                    onChange={(e) => setCcy1(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded font-mono font-bold bg-white text-slate-900 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    {ISO_CURRENCIES.map(c => (
                      <option key={c.code} value={c.code}>
                        {c.code} - {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CCY 2: Counter Currency (Enabled for FX, Disabled for Rates) */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">
                      CCY 2 (Counter Currency)
                    </span>
                    {isFxSelected ? (
                      <span className="font-mono text-emerald-700 font-bold">{ccy2}</span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-1 rounded">
                        Disabled (Rates)
                      </span>
                    )}
                  </div>

                  <select
                    disabled={!isFxSelected}
                    value={isFxSelected ? ccy2 : 'NA'}
                    onChange={(e) => setCcy2(e.target.value)}
                    className={`w-full px-2.5 py-1.5 text-xs border rounded font-mono font-bold transition-colors ${
                      isFxSelected 
                        ? 'bg-white border-slate-300 text-slate-900 cursor-pointer focus:ring-1 focus:ring-emerald-500' 
                        : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {!isFxSelected ? (
                      <option value="NA">NA - Disabled for Rates (Single CCY only)</option>
                    ) : (
                      ISO_CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.code} - {c.name}
                        </option>
                      ))
                    )}
                  </select>

                  <p className="text-[10px] text-slate-500 mt-1">
                    {isFxSelected 
                      ? `Selected Pair: ${ccy1} / ${ccy2}` 
                      : 'Disabled for XCCY basis swap, Fixed fixed swap, and Cross currency IRS to link CCY to relationship config.'}
                  </p>
                </div>
              </div>

              {/* Quick Pair Pills for FX */}
              {isFxSelected && (
                <div className="mt-2.5 pt-2 border-t border-slate-200">
                  <span className="text-[10px] text-slate-500 block mb-1 font-semibold uppercase">
                    Common FX Pairs:
                  </span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {[
                      ['EUR', 'USD'], ['USD', 'JPY'], ['GBP', 'USD'], 
                      ['AUD', 'USD'], ['USD', 'INR'], ['USD', 'THB']
                    ].map(([c1, c2]) => (
                      <button
                        key={`${c1}/${c2}`}
                        type="button"
                        onClick={() => {
                          setCcy1(c1);
                          setCcy2(c2);
                        }}
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                          ccy1 === c1 && ccy2 === c2
                            ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                            : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {c1}/{c2}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Indices: STRICTLY FILTERED AS PER CHOSEN CURRENCY */}
            <div className="border border-slate-300 rounded-md p-3.5 bg-white shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Indices
                  </label>
                  {isIndicesMandatory ? (
                    <span className="text-rose-500 font-bold">*</span>
                  ) : (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200 font-semibold">
                      Optional
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500">
                  {selectedIndices.length} selected
                </span>
              </div>
              
              <p className="text-[11px] text-slate-500 mb-2">
                {isIndicesMandatory 
                  ? 'Mandatory for Cross Currency Basis Swap / IRS' 
                  : 'Optional for Fixed Fixed Swap & FX products (can be NA)'}
              </p>

              {/* CCY Filter Status Bar */}
              <div className="flex items-center justify-between mb-2 px-2 py-1 bg-emerald-50/70 border border-emerald-200 rounded text-[11px] text-emerald-950">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span>Filtered to CCY: <strong className="font-mono text-emerald-900 font-bold">{chosenCcys.join(' / ')}</strong></span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold font-mono">
                  {indicesForChosenCcy.filter((i: string) => i !== 'NA').length} indices
                </span>
              </div>

              {/* Search or Quick add */}
              <div className="flex items-center gap-1.5 mb-2">
                <input
                  type="text"
                  placeholder={`Filter ${chosenCcys.join('/')} indices...`}
                  value={indexSearch}
                  onChange={(e) => setIndexSearch(e.target.value)}
                  className="w-full px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowCustomIndex(!showCustomIndex)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded text-xs text-slate-700 font-medium whitespace-nowrap cursor-pointer"
                  title={`Add new custom index for ${ccy1}`}
                >
                  + Custom
                </button>
              </div>

              {/* Custom Index Input Form */}
              {showCustomIndex && (
                <div className="p-2 mb-2 bg-emerald-50 border border-emerald-200 rounded text-xs space-y-1.5">
                  <div className="font-semibold text-emerald-900 text-[11px]">
                    Add New Index for {chosenCcys.join(' / ')}:
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder={`e.g. ${ccy1}-CUSTOM or CUSTOM`}
                      value={customIndexInput}
                      onChange={(e) => setCustomIndexInput(e.target.value)}
                      className="flex-1 px-2 py-0.5 text-xs border border-emerald-300 rounded uppercase font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomIndex}
                      className="px-2 py-0.5 bg-emerald-700 text-white rounded text-xs font-medium cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  <div className="text-[9.5px] text-emerald-700">
                    Will be auto-prefixed with <strong>{ccy1}-</strong> to enforce currency match.
                  </div>
                </div>
              )}

              {/* Notice when no standard indices exist for the chosen currency */}
              {indicesForChosenCcy.filter((idx: string) => idx !== 'NA').length === 0 && (
                <div className="p-2.5 mb-1.5 bg-amber-50/80 border border-amber-200 rounded text-xs text-amber-900 space-y-0.5">
                  <div className="font-semibold">No standard MW indices for {chosenCcys.join(' / ')}</div>
                  <p className="text-[10.5px] text-amber-800">
                    Select <strong>NA</strong> below or click <strong>+ Custom</strong> to add a new index prefixed with <code>{ccy1}-</code>.
                  </p>
                </div>
              )}

              {/* Indices checklist - ONLY FOR CHOSEN CCY */}
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1 flex-1">
                {indicesForChosenCcy
                  .filter((idx: string) => idx.toLowerCase().includes(indexSearch.toLowerCase()))
                  .map((idx: string) => {
                    const isChecked = selectedIndices.includes(idx);
                    return (
                      <label
                        key={idx}
                        className={`flex items-center gap-2 p-1 rounded cursor-pointer text-xs ${
                          isChecked ? 'bg-blue-50 text-blue-900 font-medium' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleIndex(idx)}
                          className="h-3.5 w-3.5 text-blue-600 rounded border-slate-300"
                        />
                        <span className="font-mono text-xs">{idx}</span>
                        {idx === 'NA' && (
                          <span className="text-[10px] text-slate-400 italic">(Fixed-Fixed / FX)</span>
                        )}
                      </label>
                    );
                  })}
              </div>

              {/* Selected summary */}
              <div className="mt-2 pt-1.5 border-t border-slate-200 text-[11px] text-slate-600 truncate flex items-center justify-between">
                <span className="truncate">Selected: <strong className="font-mono">{selectedIndices.join(', ') || 'None (NA)'}</strong></span>
                {!isIndicesMandatory && (
                  <button
                    type="button"
                    onClick={() => setSelectedIndices(['NA'])}
                    className="text-slate-500 hover:text-slate-800 text-[10px] underline shrink-0 ml-1 cursor-pointer"
                  >
                    Set NA
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ROW 2: Tenor Limits (Min & Max) | Fixed & Floating Legs (NA for FX) | Fixing Page */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-t border-slate-200 pt-5">
            {/* 1. Min Tenor and Max Tenor (Manual entry with D, W, M, Y convention) */}
            <div className="border border-slate-300 rounded-md p-3.5 bg-white shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tenor Range (Min / Max)</span>
                </label>
                <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-semibold border border-blue-200">
                  D / W / M / Y Convention
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2.5">
                Manual entry enabled. Enter any positive number followed by <strong>D</strong> (Days), <strong>W</strong> (Weeks), <strong>M</strong> (Months), or <strong>Y</strong> (Years).
              </p>

              {/* Datalists for autocomplete suggestions without restricting custom values */}
              <datalist id="common-tenors-suggestions">
                {COMMON_TENORS.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>

              <div className="grid grid-cols-2 gap-3">
                {/* Min Tenor Manual Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Min Tenor <span className="text-rose-500">*</span>
                    </label>
                    {isValidTenor(minTenor) ? (
                      <span className="text-[10px] text-emerald-700 font-semibold truncate">
                        {describeTenor(minTenor)}
                      </span>
                    ) : minTenor ? (
                      <span className="text-[10px] text-amber-700 font-medium">Invalid</span>
                    ) : null}
                  </div>
                  <input
                    type="text"
                    list="common-tenors-suggestions"
                    value={minTenor}
                    onChange={(e) => setMinTenor(e.target.value.toUpperCase())}
                    placeholder="e.g. 1D, 2D, 1M"
                    className={`w-full px-2.5 py-1.5 text-xs border rounded font-mono font-bold bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors uppercase ${
                      !minTenor || isValidTenor(minTenor) 
                        ? 'border-slate-300' 
                        : 'border-amber-400 bg-amber-50/40'
                    }`}
                  />
                  <div className="text-[9.5px] text-slate-400 mt-1">
                    FX default: 1D or 2D
                  </div>
                </div>

                {/* Max Tenor Manual Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Max Tenor <span className="text-rose-500">*</span>
                    </label>
                    {isValidTenor(maxTenor) ? (
                      <span className="text-[10px] text-emerald-700 font-semibold truncate">
                        {describeTenor(maxTenor)}
                      </span>
                    ) : maxTenor ? (
                      <span className="text-[10px] text-amber-700 font-medium">Invalid</span>
                    ) : null}
                  </div>
                  <input
                    type="text"
                    list="common-tenors-suggestions"
                    value={maxTenor}
                    onChange={(e) => setMaxTenor(e.target.value.toUpperCase())}
                    placeholder="e.g. 2Y, 5Y, 10Y"
                    className={`w-full px-2.5 py-1.5 text-xs border rounded font-mono font-bold bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors uppercase ${
                      !maxTenor || isValidTenor(maxTenor) 
                        ? 'border-slate-300' 
                        : 'border-amber-400 bg-amber-50/40'
                    }`}
                  />
                  <div className="text-[9.5px] text-slate-400 mt-1">
                    FX default: 2Y
                  </div>
                </div>
              </div>

              {/* Tenor Quick Chips & Presets */}
              <div className="mt-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                  <span>Quick Presets:</span>
                  <span className="text-[9.5px] text-slate-400">or type any custom value</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {isFxSelected ? (
                    <>
                      <button
                        type="button"
                        onClick={() => { setMinTenor('1D'); setMaxTenor('2Y'); }}
                        className={`text-[10px] px-1.5 py-0.5 rounded border font-mono cursor-pointer transition-colors ${
                          minTenor === '1D' && maxTenor === '2Y' ? 'bg-emerald-600 text-white border-emerald-600 font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        1D - 2Y
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMinTenor('2D'); setMaxTenor('2Y'); }}
                        className={`text-[10px] px-1.5 py-0.5 rounded border font-mono cursor-pointer transition-colors ${
                          minTenor === '2D' && maxTenor === '2Y' ? 'bg-emerald-600 text-white border-emerald-600 font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        2D - 2Y
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMinTenor('1W'); setMaxTenor('1Y'); }}
                        className={`text-[10px] px-1.5 py-0.5 rounded border font-mono cursor-pointer transition-colors ${
                          minTenor === '1W' && maxTenor === '1Y' ? 'bg-emerald-600 text-white border-emerald-600 font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        1W - 1Y
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => { setMinTenor('1M'); setMaxTenor('10Y'); }}
                        className={`text-[10px] px-1.5 py-0.5 rounded border font-mono cursor-pointer transition-colors ${
                          minTenor === '1M' && maxTenor === '10Y' ? 'bg-blue-600 text-white border-blue-600 font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        1M - 10Y
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMinTenor('3M'); setMaxTenor('30Y'); }}
                        className={`text-[10px] px-1.5 py-0.5 rounded border font-mono cursor-pointer transition-colors ${
                          minTenor === '3M' && maxTenor === '30Y' ? 'bg-blue-600 text-white border-blue-600 font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        3M - 30Y
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMinTenor('6M'); setMaxTenor('5Y'); }}
                        className={`text-[10px] px-1.5 py-0.5 rounded border font-mono cursor-pointer transition-colors ${
                          minTenor === '6M' && maxTenor === '5Y' ? 'bg-blue-600 text-white border-blue-600 font-bold' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        6M - 5Y
                      </button>
                    </>
                  )}
                  {/* Additional quick single buttons */}
                  <button
                    type="button"
                    onClick={() => setMinTenor('15D')}
                    className="text-[9.5px] px-1.5 py-0.5 rounded border border-dashed border-slate-300 text-slate-500 hover:text-slate-800 font-mono"
                    title="Set Min Tenor to 15 Days"
                  >
                    +15D
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaxTenor('18M')}
                    className="text-[9.5px] px-1.5 py-0.5 rounded border border-dashed border-slate-300 text-slate-500 hover:text-slate-800 font-mono"
                    title="Set Max Tenor to 18 Months"
                  >
                    +18M
                  </button>
                  <button
                    type="button"
                    onClick={() => setMaxTenor('7Y')}
                    className="text-[9.5px] px-1.5 py-0.5 rounded border border-dashed border-slate-300 text-slate-500 hover:text-slate-800 font-mono"
                    title="Set Max Tenor to 7 Years"
                  >
                    +7Y
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Fixed & Floating Legs (NOT APPLICABLE FOR FX PRODUCTS) */}
            <div className={`border rounded-md p-3.5 shadow-xs transition-colors ${
              isFxSelected 
                ? 'border-slate-200 bg-slate-50 opacity-90' 
                : 'border-slate-300 bg-white'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Leg Assessment Rules
                </label>
                {isFxSelected ? (
                  <span className="text-[10px] text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded font-semibold">
                    NA (FX Products)
                  </span>
                ) : (
                  <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 font-semibold">
                    Applicable (Rates)
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-500 mb-2.5">
                {isFxSelected 
                  ? 'Fixed and Floating legs are not applicable for FX products (Spot, Forward, Swap)' 
                  : 'Select leg inclusion for Rates Settle to Market calculation'}
              </p>

              {isFxSelected ? (
                <div className="p-2.5 bg-slate-100 border border-slate-200 rounded text-center text-xs text-slate-600 font-medium">
                  <div>Fixed Leg: <strong>NA</strong> &middot; Floating Leg: <strong>NA</strong></div>
                  <div className="text-[10.5px] text-slate-400 mt-1">Legs are non-applicable for FX products.</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Fixed Leg Toggle */}
                  <div>
                    <div className="text-[11px] font-semibold text-slate-700 mb-1">Fixed Leg:</div>
                    <div className="flex items-center gap-2">
                      {(['Yes', 'No'] as const).map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFixedLeg(val)}
                          className={`flex-1 py-1 px-2 rounded border text-xs font-semibold cursor-pointer transition-all ${
                            fixedLeg === val 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Floating Leg Toggle */}
                  <div>
                    <div className="text-[11px] font-semibold text-slate-700 mb-1">Floating Leg:</div>
                    <div className="flex items-center gap-2">
                      {(['Yes', 'No'] as const).map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setFloatingLeg(val)}
                          className={`flex-1 py-1 px-2 rounded border text-xs font-semibold cursor-pointer transition-all ${
                            floatingLeg === val 
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Fixing Page: ENABLED ONLY for Cross Currency Basis Swap */}
            <div className={`border rounded-md p-3.5 shadow-xs transition-colors ${
              isXccyBasisSwapSelected 
                ? 'border-slate-300 bg-white' 
                : 'border-slate-200 bg-slate-50 opacity-90'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Fixing Page
                </label>
                {isXccyBasisSwapSelected ? (
                  <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 font-semibold">
                    Enabled (XCCY Basis)
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded font-medium">
                    Disabled
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-500 mb-2">
                {isXccyBasisSwapSelected 
                  ? 'Select Reuters fixing page for Cross Currency Basis Swap' 
                  : 'Enabled only when Cross Currency Basis Swap is selected'}
              </p>

              <select
                disabled={!isXccyBasisSwapSelected}
                value={fixingPage}
                onChange={(e) => setFixingPage(e.target.value)}
                className={`w-full px-2.5 py-1.5 text-xs border rounded font-mono transition-colors focus:ring-1 focus:ring-emerald-500 focus:outline-none ${
                  isXccyBasisSwapSelected 
                    ? 'bg-white border-slate-300 text-slate-900 cursor-pointer' 
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {!isXccyBasisSwapSelected ? (
                  <option value="NA">NA (Disabled - XCCY Basis Swap not selected)</option>
                ) : (
                  FIXING_PAGES.map((fp) => (
                    <option key={fp} value={fp}>{fp}</option>
                  ))
                )}
              </select>

              <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1">
                <Info className="w-3 h-3 text-slate-400 shrink-0" />
                <span>
                  {isXccyBasisSwapSelected 
                    ? 'Matches Reuters fixing pages (Reuters-AUDFIX, etc.)' 
                    : 'Select "Cross Currency Basis Swap" to enable.'}
                </span>
              </div>
            </div>
          </div>

          {/* Description & Business Justification */}
          <div className="border border-slate-300 rounded-md p-3.5 bg-white">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
              Business Justification / Audit Notes
            </label>
            <textarea
              rows={2}
              placeholder="State the business rationale for this configuration (e.g. relationship index mapping, clearing compliance, tenor boundaries)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Reject Reason Input (Visible when Checker chooses to reject) */}
          {showRejectInput && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-md text-xs space-y-2">
              <label className="block font-bold text-rose-900">
                Enter 4-Eye Rejection Reason:
              </label>
              <textarea
                rows={2}
                placeholder="Reason for rejecting this rule configuration..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full p-2 border border-rose-300 rounded text-xs bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectInput(false)}
                  className="px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-700 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!rejectionReason.trim()) {
                      alert('Please provide a rejection reason');
                      return;
                    }
                    if (editingRule) {
                      onReject(editingRule.id, rejectionReason.trim());
                    }
                  }}
                  className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-semibold cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Window Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>Status:</span>
            <strong className="text-slate-800">
              {editingRule ? editingRule.recordStatus : 'Draft (Will be set to Added)'}
            </strong>
            {editingRule && editingRule.createdOn && (
              <span className="text-slate-400">· Created {editingRule.createdOn} by {editingRule.createdBy}</span>
            )}
          </div>

          {/* Right Action Buttons: Save (green), Approve (green) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 rounded shadow-2xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {/* Checker Reject button */}
            {canApprove && !showRejectInput && (
              <button
                type="button"
                onClick={() => setShowRejectInput(true)}
                className="px-3.5 py-2 text-xs font-semibold text-rose-700 hover:text-white hover:bg-rose-600 border border-rose-300 rounded shadow-2xs transition-colors cursor-pointer"
              >
                Reject
              </button>
            )}

            {/* Save Button in Green */}
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-[#28a745] hover:bg-[#218838] active:bg-[#1e7e34] text-white font-semibold text-xs tracking-wide rounded shadow-sm hover:shadow transition-all focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              title="Save rule parameters (Updates status to Added or Modified)"
            >
              Save
            </button>

            {/* Approve Button in Green with 4-Eye Enforcement */}
            <button
              type="button"
              onClick={handleApproveClick}
              className={`px-5 py-2 font-semibold text-xs tracking-wide rounded shadow-sm transition-all flex items-center gap-1.5 ${
                canApprove
                  ? 'bg-[#28a745] hover:bg-[#218838] text-white shadow-sm cursor-pointer'
                  : 'bg-emerald-100 text-emerald-800/80 border border-emerald-300 cursor-pointer hover:bg-emerald-200'
              }`}
              title={
                !isEditing
                  ? 'Save record first, then submit for 4-Eye approval'
                  : isMakerOfThisRecord
                  ? '4-Eye Rule: Maker cannot self-approve. Switch to Checker.'
                  : 'Approve this business rule (Checker)'
              }
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Approve</span>
              {isMakerOfThisRecord && (
                <Lock className="w-3 h-3 text-emerald-800 ml-0.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
