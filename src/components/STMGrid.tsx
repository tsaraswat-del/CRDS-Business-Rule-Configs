import React, { useState, useMemo } from 'react';
import { STMBusinessRule, UserPersona, RecordStatus } from '../types/stm';
import { XCCY_PRODUCTS } from '../data/mockData';
import { 
  Plus, 
  Download, 
  Search, 
  Filter, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  History, 
  Edit3, 
  Eye, 
  ShieldCheck, 
  ArrowUpDown, 
  RefreshCw, 
  FileSpreadsheet, 
  XCircle, 
  HelpCircle, 
  X, 
  SlidersHorizontal, 
  ChevronDown,
  CheckSquare,
  Square,
  MinusSquare,
  Lock,
  MessageSquare
} from 'lucide-react';

interface STMGridProps {
  rules: STMBusinessRule[];
  currentUser: UserPersona;
  onOpenNewRule: () => void;
  onEditRule: (rule: STMBusinessRule) => void;
  onReviewRule: (rule: STMBusinessRule) => void;
  onViewHistory: (rule: STMBusinessRule) => void;
  onQuickApprove: (rule: STMBusinessRule) => void;
  onBulkApprove: (ruleIds: string[], comment: string) => void;
  onExportCSV: () => void;
  onOpenFourEyeHelp: () => void;
}

export const STMGrid: React.FC<STMGridProps> = ({
  rules,
  currentUser,
  onOpenNewRule,
  onEditRule,
  onReviewRule,
  onViewHistory,
  onQuickApprove,
  onBulkApprove,
  onExportCSV,
  onOpenFourEyeHelp,
}) => {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState<string>('ALL');
  const [ccyFilter, setCcyFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [quickView, setQuickView] = useState<'all' | 'pending' | 'my_records' | 'approved'>('all');

  // Sorting state
  const [sortField, setSortField] = useState<keyof STMBusinessRule | 'productTypes'>('createdOn');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Multi-select state
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);
  const [showBulkApproveModal, setShowBulkApproveModal] = useState(false);
  const [bulkApproveComment, setBulkApproveComment] = useState('Bulk 4-Eye verification approved against MarkitWire STM rate schedule');

  // Distinct currencies and currency pairs in dataset
  const distinctCcys = useMemo(() => {
    const set = new Set<string>();
    rules.forEach(r => {
      r.ccy.forEach(c => set.add(c));
      if (r.ccy.length === 2) {
        set.add(`${r.ccy[0]}/${r.ccy[1]}`);
      }
    });
    return Array.from(set).sort();
  }, [rules]);

  // Check if any filters are active
  const hasActiveFilters = searchTerm.trim() !== '' || productFilter !== 'ALL' || ccyFilter !== 'ALL' || statusFilter !== 'ALL' || quickView !== 'all';

  // Filtered & Sorted rules
  const filteredRules = useMemo(() => {
    const list = rules.filter((rule) => {
      // 1. Quick view tab filter
      if (quickView === 'pending' && rule.recordStatus !== 'Added' && rule.recordStatus !== 'Modified' && rule.recordStatus !== 'Pending Approval') {
        return false;
      }
      if (quickView === 'approved' && rule.recordStatus !== 'Approved') {
        return false;
      }
      if (quickView === 'my_records') {
        const isMyRecord = rule.createdBy === currentUser.email || rule.updatedBy === currentUser.email;
        if (!isMyRecord) return false;
      }

      // 2. Product filter dropdown
      if (productFilter !== 'ALL') {
        const hasProduct = rule.productTypes.some(p => p.toLowerCase().includes(productFilter.toLowerCase()));
        if (!hasProduct) return false;
      }

      // 3. Currency / Currency Pair filter dropdown
      if (ccyFilter !== 'ALL') {
        if (ccyFilter.includes('/')) {
          const [c1, c2] = ccyFilter.split('/');
          const matchesPair = (rule.ccy.includes(c1) && rule.ccy.includes(c2)) || rule.ccy.includes(ccyFilter);
          if (!matchesPair) return false;
        } else {
          if (!rule.ccy.includes(ccyFilter)) {
            return false;
          }
        }
      }

      // 4. Approval status filter dropdown
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'Added' && (rule.recordStatus !== 'Added' && rule.recordStatus !== 'Pending Approval')) {
          return false;
        } else if (statusFilter !== 'Added' && rule.recordStatus !== statusFilter) {
          return false;
        }
      }

      // 5. Search Bar query matching
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase().trim();
        const matchesProduct = rule.productTypes.some(p => p.toLowerCase().includes(query));
        const matchesCcy = rule.ccy.some(c => c.toLowerCase().includes(query)) || rule.ccy.join('/').toLowerCase().includes(query);
        const matchesIndex = rule.indices.some(i => i.toLowerCase().includes(query));
        const matchesCreator = rule.createdBy.toLowerCase().includes(query);
        const matchesUpdater = (rule.updatedBy || '').toLowerCase().includes(query);
        const matchesApprover = (rule.approvedBy || '').toLowerCase().includes(query);
        const matchesFixing = (rule.fixingPage || '').toLowerCase().includes(query);
        const matchesStatus = rule.recordStatus.toLowerCase().includes(query);

        return matchesProduct || matchesCcy || matchesIndex || matchesCreator || matchesUpdater || matchesApprover || matchesFixing || matchesStatus;
      }

      return true;
    });

    // Sorting
    return [...list].sort((a, b) => {
      let valA: string = '';
      let valB: string = '';

      if (sortField === 'productTypes') {
        valA = a.productTypes.join(', ');
        valB = b.productTypes.join(', ');
      } else if (sortField === 'ccy') {
        valA = a.ccy.join(', ');
        valB = b.ccy.join(', ');
      } else if (sortField === 'indices') {
        valA = a.indices.join(', ');
        valB = b.indices.join(', ');
      } else {
        valA = String(a[sortField] || '');
        valB = String(b[sortField] || '');
      }

      const cmp = valA.localeCompare(valB);
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [rules, searchTerm, productFilter, ccyFilter, statusFilter, quickView, sortField, sortDirection, currentUser.email]);

  // Determine eligible rules for Checker approval
  // Rule is eligible if:
  // 1. It is pending approval (Added or Modified)
  // 2. 4-Eye constraint: Current user is NOT the Maker (createdBy or updatedBy)
  const isRuleEligibleForApproval = (rule: STMBusinessRule) => {
    const isPending = rule.recordStatus === 'Added' || rule.recordStatus === 'Modified' || rule.recordStatus === 'Pending Approval';
    const isMaker = rule.createdBy === currentUser.email || rule.updatedBy === currentUser.email;
    return isPending && !isMaker;
  };

  const eligibleRulesInView = useMemo(() => {
    return filteredRules.filter(r => isRuleEligibleForApproval(r));
  }, [filteredRules, currentUser.email]);

  const selectedEligibleRules = useMemo(() => {
    return rules.filter(r => selectedRuleIds.includes(r.id) && isRuleEligibleForApproval(r));
  }, [rules, selectedRuleIds, currentUser.email]);

  // Checkbox toggle helpers
  const handleToggleSelectAll = () => {
    if (selectedRuleIds.length === filteredRules.length && filteredRules.length > 0) {
      setSelectedRuleIds([]);
    } else {
      setSelectedRuleIds(filteredRules.map(r => r.id));
    }
  };

  const handleSelectOnlyPending = () => {
    setSelectedRuleIds(eligibleRulesInView.map(r => r.id));
  };

  const handleToggleSelectRow = (ruleId: string) => {
    if (selectedRuleIds.includes(ruleId)) {
      setSelectedRuleIds(selectedRuleIds.filter(id => id !== ruleId));
    } else {
      setSelectedRuleIds([...selectedRuleIds, ruleId]);
    }
  };

  const handleSort = (field: keyof STMBusinessRule | 'productTypes') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const resetAllFilters = () => {
    setSearchTerm('');
    setProductFilter('ALL');
    setCcyFilter('ALL');
    setStatusFilter('ALL');
    setQuickView('all');
  };

  // Execution of Bulk Approve
  const handleConfirmBulkApprove = () => {
    const idsToApprove = selectedEligibleRules.map(r => r.id);
    if (idsToApprove.length === 0) return;
    onBulkApprove(idsToApprove, bulkApproveComment);
    setShowBulkApproveModal(false);
    setSelectedRuleIds([]);
  };

  // Status counts for tabs
  const pendingCount = rules.filter(r => r.recordStatus === 'Added' || r.recordStatus === 'Modified' || r.recordStatus === 'Pending Approval').length;
  const approvedCount = rules.filter(r => r.recordStatus === 'Approved').length;
  const myCount = rules.filter(r => r.createdBy === currentUser.email || r.updatedBy === currentUser.email).length;

  const isAllSelected = filteredRules.length > 0 && selectedRuleIds.length === filteredRules.length;
  const isPartiallySelected = selectedRuleIds.length > 0 && selectedRuleIds.length < filteredRules.length;

  const getStatusBadge = (status: RecordStatus) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            Approved
          </span>
        );
      case 'Modified':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            Modified
          </span>
        );
      case 'Added':
      case 'Pending Approval':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-300">
            <Clock className="w-3 h-3 text-blue-600" />
            Added
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-900 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" />
            Rejected
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
      {/* Breadcrumb Bar */}
      <div className="px-6 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-500 font-medium">
          <span className="hover:text-slate-800 cursor-pointer">Home</span>
          <span>&gt;</span>
          <span className="hover:text-slate-800 cursor-pointer">Setup</span>
          <span>&gt;</span>
          <span className="text-slate-900 font-semibold">STM Business Rules Config</span>
        </div>
        
        {/* 4-Eye Workflow Hint */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 hidden md:inline">Current Persona:</span>
          <span className="font-semibold text-slate-800">{currentUser.name}</span>
          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
            currentUser.role === 'Checker'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          }`}>
            {currentUser.role}
          </span>
        </div>
      </div>

      {/* Main Page Header with 'Bulk Approve' and 'New Business Rule' buttons */}
      <div className="px-6 py-3.5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>STM Business Rules Config</span>
            <span className="text-xs font-normal text-slate-500 border border-slate-300 rounded px-2 py-0.5">
              FX &amp; Rates Setup
            </span>
          </h1>
          <p className="text-xs text-slate-600 mt-1 max-w-3xl">
            Maintain currency pairs, MarkitWire eligible indices, leg eligibility, and fixing pages for Settle to Market (STM) assessment rules.
            Configure parameters via screen with 4-Eye Maker-Checker governance.
          </p>
        </div>

        {/* Action Buttons: Bulk Approve (Checker action), New Business Rule, CSV download */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* BULK APPROVE BUTTON */}
          <button
            onClick={() => setShowBulkApproveModal(true)}
            disabled={currentUser.role !== 'Checker' || selectedEligibleRules.length === 0}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 font-semibold text-xs tracking-wide rounded shadow-xs transition-all ${
              currentUser.role === 'Checker' && selectedEligibleRules.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm cursor-pointer'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
            title={
              currentUser.role !== 'Checker'
                ? 'Bulk Approval requires Checker role. Switch user to Checker (pqr@osttra.com).'
                : selectedEligibleRules.length === 0
                ? 'Select at least one pending rule to Bulk Approve'
                : `Bulk approve ${selectedEligibleRules.length} selected rule(s) with common comment`
            }
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Bulk Approve</span>
            {selectedEligibleRules.length > 0 && (
              <span className="px-1.5 py-0.2 bg-emerald-800 text-white rounded-full text-[10px] font-bold">
                {selectedEligibleRules.length}
              </span>
            )}
          </button>

          {/* New Business Rule button */}
          <button
            onClick={onOpenNewRule}
            className="group relative inline-flex items-center gap-2 px-4 py-2 bg-[#28a745] hover:bg-[#218838] active:bg-[#1e7e34] text-white font-semibold text-xs tracking-wide rounded shadow-sm hover:shadow transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            title="Create new STM Business Rule (Requires 4-Eye approval)"
          >
            <span className="w-2 h-2 rounded-full bg-rose-400 absolute -top-1 -right-1 ring-2 ring-white animate-pulse" />
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Business Rule</span>
            <span className="hidden lg:inline text-[10px] bg-emerald-900/40 text-emerald-100 px-1.5 py-0.5 rounded font-mono font-normal">
              New Config
            </span>
          </button>

          {/* Download CSV button */}
          <button
            onClick={onExportCSV}
            className="p-2 border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded shadow-xs transition-colors"
            title="Export Grid to CSV"
            aria-label="Export grid data"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4-Eye Notification Banner if pending rules exist for Checker */}
      {currentUser.role === 'Checker' && pendingCount > 0 && (
        <div className="mx-6 mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-md flex items-center justify-between text-xs text-emerald-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Checker Action Required:</strong> There are <strong>{pendingCount} business rules</strong> awaiting 4-Eye authorization. Select rules below to approve individually or in bulk.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setQuickView('pending');
                handleSelectOnlyPending();
              }}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium text-xs whitespace-nowrap cursor-pointer"
            >
              Select Pending ({eligibleRulesInView.length})
            </button>
          </div>
        </div>
      )}

      {/* PRIMARY FILTER & SEARCH BAR SECTION */}
      <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/90 space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-lg text-xs font-medium shrink-0">
            <button
              onClick={() => setQuickView('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                quickView === 'all'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Rules ({rules.length})
            </button>

            <button
              onClick={() => setQuickView('pending')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                quickView === 'pending'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Pending 4-Eye</span>
              {pendingCount > 0 && (
                <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setQuickView('my_records')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                quickView === 'my_records'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Submissions ({myCount})
            </button>

            <button
              onClick={() => setQuickView('approved')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                quickView === 'approved'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Approved ({approvedCount})
            </button>
          </div>

          {/* Search Bar & Dropdown Filters Group */}
          <div className="flex items-center gap-2.5 flex-wrap flex-1 lg:justify-end">
            {/* 1. Enhanced Search Bar */}
            <div className="relative flex-1 sm:w-64 sm:flex-initial">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search product, currency, index, user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 shadow-2xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs p-0.5"
                  title="Clear search query"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* 2. Product Type Filter Dropdown */}
            <div className="relative">
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="pl-2.5 pr-7 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs appearance-none cursor-pointer"
                title="Filter by Product Type"
              >
                <option value="ALL">All Product Types</option>
                {XCCY_PRODUCTS.map((prod) => (
                  <option key={prod} value={prod}>
                    {prod}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* 3. Currency / Currency Pair Filter Dropdown */}
            <div className="relative">
              <select
                value={ccyFilter}
                onChange={(e) => setCcyFilter(e.target.value)}
                className="pl-2.5 pr-7 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs appearance-none cursor-pointer font-mono"
                title="Filter by Currency or Currency Pair"
              >
                <option value="ALL" className="font-sans">All Currencies / Pairs</option>
                {distinctCcys.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* 4. Approval Status Filter Dropdown */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-2.5 pr-7 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs appearance-none cursor-pointer"
                title="Filter by 4-Eye Approval Status"
              >
                <option value="ALL">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Added">Added (Pending Checker)</option>
                <option value="Modified">Modified (Pending Checker)</option>
                <option value="Rejected">Rejected</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            {/* Reset All Filters button */}
            <button
              onClick={resetAllFilters}
              disabled={!hasActiveFilters}
              className={`p-1.5 rounded border transition-colors ${
                hasActiveFilters
                  ? 'text-slate-700 hover:text-slate-900 border-slate-300 bg-white hover:bg-slate-100 cursor-pointer shadow-2xs'
                  : 'text-slate-300 border-slate-200 bg-slate-50 cursor-not-allowed'
              }`}
              title="Reset all search and filter criteria"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ACTIVE FILTER CHIPS STRIP & MULTI-SELECT BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-[11px] text-slate-600">
          <div className="flex items-center gap-2 flex-wrap">
            {hasActiveFilters && (
              <>
                <span className="font-semibold text-slate-500 flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3" />
                  Active Filters:
                </span>

                {searchTerm.trim() !== '' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-800">
                    <span>Keyword: &quot;<strong>{searchTerm}</strong>&quot;</span>
                    <button onClick={() => setSearchTerm('')} className="hover:text-rose-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {productFilter !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-800">
                    <span>Product: <strong>{productFilter}</strong></span>
                    <button onClick={() => setProductFilter('ALL')} className="hover:text-rose-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {ccyFilter !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-800">
                    <span>CCY/Pair: <strong className="font-mono">{ccyFilter}</strong></span>
                    <button onClick={() => setCcyFilter('ALL')} className="hover:text-rose-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {statusFilter !== 'ALL' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-800">
                    <span>Status: <strong>{statusFilter}</strong></span>
                    <button onClick={() => setStatusFilter('ALL')} className="hover:text-rose-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {quickView !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-300 text-slate-800">
                    <span>View: <strong>{quickView === 'pending' ? 'Pending 4-Eye' : quickView === 'my_records' ? 'My Submissions' : 'Approved'}</strong></span>
                    <button onClick={() => setQuickView('all')} className="hover:text-rose-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                <button
                  onClick={resetAllFilters}
                  className="text-rose-600 hover:text-rose-800 font-semibold underline ml-1 cursor-pointer"
                >
                  Clear all
                </button>
              </>
            )}
          </div>

          {/* Selection indicator & Quick Bulk actions */}
          {selectedRuleIds.length > 0 && (
            <div className="flex items-center gap-2 self-start sm:self-auto bg-blue-50 border border-blue-200 px-2.5 py-1 rounded text-blue-900 font-medium">
              <span><strong>{selectedRuleIds.length}</strong> selected</span>
              <span className="text-blue-300">|</span>
              <button
                onClick={handleSelectOnlyPending}
                className="text-blue-700 hover:text-blue-900 underline cursor-pointer"
              >
                Select only pending ({eligibleRulesInView.length})
              </button>
              <span className="text-blue-300">|</span>
              <button
                onClick={() => setSelectedRuleIds([])}
                className="text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Table Grid matching Image 2 with MULTI-SELECT CHECKBOX COLUMN */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full text-left text-xs border-collapse">
          {/* Header Row matching Image 2 with interactive sorting & checkbox */}
          <thead className="bg-[#f1f3f6] text-slate-900 font-bold sticky top-0 z-10 border-b-2 border-slate-900 select-none">
            <tr>
              {/* Checkbox column header */}
              <th className="py-2.5 px-3 border-r border-slate-300 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = isPartiallySelected;
                    }
                  }}
                  onChange={handleToggleSelectAll}
                  className="h-3.5 w-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  title={isAllSelected ? 'Deselect all' : 'Select all visible rules'}
                  aria-label="Select all rules"
                />
              </th>

              <th 
                onClick={() => handleSort('productTypes')}
                className="py-2.5 px-3 border-r border-slate-300 font-bold tracking-tight min-w-[210px] cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span>Product Type</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('ccy')}
                className="py-2.5 px-3 border-r border-slate-300 font-bold tracking-tight min-w-[120px] cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span>CCY / Pair</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 border-r border-slate-300 font-bold tracking-tight min-w-[105px]">
                Tenor (Min - Max)
              </th>
              <th 
                onClick={() => handleSort('indices')}
                className="py-2.5 px-3 border-r border-slate-300 font-bold tracking-tight min-w-[140px] cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span>Indices</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 border-r border-slate-300 font-bold tracking-tight min-w-[90px]">
                Floating leg
              </th>
              <th className="py-2.5 px-3 border-r border-slate-300 font-bold tracking-tight min-w-[80px]">
                Fixed leg
              </th>
              <th className="py-2.5 px-3 border-r border-slate-300 font-bold tracking-tight min-w-[150px]">
                Fixing Page
              </th>
              <th className="py-2.5 px-3 border-r border-slate-300 font-bold tracking-tight min-w-[140px]">
                Created by
              </th>
              <th 
                onClick={() => handleSort('createdOn')}
                className="py-2.5 px-3 border-r border-slate-300 font-bold tracking-tight min-w-[100px] cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span>Created on</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 border-r border-slate-300 font-bold tracking-tight min-w-[140px]">
                Updated by
              </th>
              <th className="py-2.5 px-3 border-r border-slate-300 font-bold tracking-tight min-w-[100px]">
                updated on
              </th>
              <th className="py-2.5 px-3 border-r border-slate-300 font-bold tracking-tight min-w-[140px]">
                Approved by
              </th>
              <th className="py-2.5 px-3 border-r border-slate-300 font-bold tracking-tight min-w-[100px]">
                Approved on
              </th>
              <th 
                onClick={() => handleSort('recordStatus')}
                className="py-2.5 px-3 border-r border-slate-300 font-bold tracking-tight min-w-[120px] cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span>Record status</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>
              <th className="py-2.5 px-3 font-bold tracking-tight min-w-[110px] text-center">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 font-normal text-slate-800">
            {filteredRules.length === 0 ? (
              <tr>
                <td colSpan={15} className="py-12 text-center text-slate-500 bg-slate-50/50">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
                    <FileSpreadsheet className="w-8 h-8 text-slate-300" />
                    <p className="font-semibold text-slate-700">No STM business rules match your search or filter criteria.</p>
                    <p className="text-xs text-slate-500">
                      Try adjusting the product type, currency pair, status filter, or search keywords.
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={resetAllFilters}
                        className="mt-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-semibold"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredRules.map((rule) => {
                const isSelected = selectedRuleIds.includes(rule.id);
                const isMaker = rule.createdBy === currentUser.email || rule.updatedBy === currentUser.email;
                const isEligibleForApproval = isRuleEligibleForApproval(rule);
                const canCheckerApprove = currentUser.role === 'Checker' && isEligibleForApproval;
                const isSelfCreatedPending = isMaker && (rule.recordStatus === 'Added' || rule.recordStatus === 'Modified');

                const isFx = rule.productTypes.some(p => ['FX Spot', 'FX Forward', 'FX Swap'].includes(p));

                return (
                  <tr 
                    key={rule.id}
                    className={`transition-colors group text-[12.5px] ${
                      isSelected ? 'bg-blue-50/70' : 'hover:bg-blue-50/30'
                    }`}
                  >
                    {/* Checkbox column */}
                    <td className="py-2.5 px-3 border-r border-slate-200 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectRow(rule.id)}
                        className="h-3.5 w-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                        aria-label={`Select rule ${rule.id}`}
                      />
                    </td>

                    {/* 1. Product Type */}
                    <td className="py-2.5 px-3 border-r border-slate-200 font-medium text-slate-900">
                      {rule.productTypes.join(', ')}
                    </td>

                    {/* 2. CCY / Pair */}
                    <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-xs">
                      {isFx && rule.ccy2 && rule.ccy2 !== 'NA' ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{rule.ccy1 || rule.ccy[0]} / {rule.ccy2}</span>
                          <span className="text-[9.5px] px-1 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold font-sans">
                            FX Pair
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{rule.ccy1 || rule.ccy[0]}</span>
                          <span className="text-[9.5px] px-1 py-0.2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-semibold font-sans">
                            Single CCY
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Tenor (Min - Max) */}
                    <td className="py-2.5 px-3 border-r border-slate-200 font-mono text-xs tabular-nums text-slate-700">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-medium">
                        {rule.minTenor || '1D'} - {rule.maxTenor || '2Y'}
                      </span>
                    </td>

                    {/* 3. Indices */}
                    <td className="py-2.5 px-3 border-r border-slate-200 text-slate-800 font-mono text-xs">
                      {rule.indices.join(', ')}
                    </td>

                    {/* 4. Floating leg (Not applicable for FX) */}
                    <td className="py-2.5 px-3 border-r border-slate-200 text-slate-800">
                      {isFx || rule.floatingLeg === 'NA' ? (
                        <span className="text-slate-400 font-mono text-[11px] italic bg-slate-100 px-1.5 py-0.5 rounded">
                          NA (FX)
                        </span>
                      ) : (
                        <span className={rule.floatingLeg === 'Yes' ? 'font-medium text-emerald-700' : 'text-slate-500'}>
                          {rule.floatingLeg}
                        </span>
                      )}
                    </td>

                    {/* 5. Fixed leg (Not applicable for FX) */}
                    <td className="py-2.5 px-3 border-r border-slate-200 text-slate-800">
                      {isFx || rule.fixedLeg === 'NA' ? (
                        <span className="text-slate-400 font-mono text-[11px] italic bg-slate-100 px-1.5 py-0.5 rounded">
                          NA (FX)
                        </span>
                      ) : (
                        <span className={rule.fixedLeg === 'Yes' ? 'font-medium text-emerald-700' : 'text-slate-500'}>
                          {rule.fixedLeg}
                        </span>
                      )}
                    </td>

                    {/* 6. Fixing Page */}
                    <td className="py-2.5 px-3 border-r border-slate-200 text-slate-700 font-mono text-xs">
                      {rule.fixingPage || 'NA'}
                    </td>

                    {/* 7. Created by */}
                    <td className="py-2.5 px-3 border-r border-slate-200">
                      <a 
                        href={`mailto:${rule.createdBy}`}
                        className="text-blue-600 hover:text-blue-800 underline truncate block"
                      >
                        {rule.createdBy}
                      </a>
                    </td>

                    {/* 8. Created on */}
                    <td className="py-2.5 px-3 border-r border-slate-200 text-slate-700 font-mono tabular-nums">
                      {rule.createdOn}
                    </td>

                    {/* 9. Updated by */}
                    <td className="py-2.5 px-3 border-r border-slate-200">
                      {rule.updatedBy ? (
                        <a 
                          href={`mailto:${rule.updatedBy}`}
                          className="text-blue-600 hover:text-blue-800 underline truncate block"
                        >
                          {rule.updatedBy}
                        </a>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* 10. updated on */}
                    <td className="py-2.5 px-3 border-r border-slate-200 text-slate-700 font-mono tabular-nums">
                      {rule.updatedOn || <span className="text-slate-300">-</span>}
                    </td>

                    {/* 11. Approved by */}
                    <td className="py-2.5 px-3 border-r border-slate-200">
                      {rule.approvedBy ? (
                        <a 
                          href={`mailto:${rule.approvedBy}`}
                          className="text-blue-600 hover:text-blue-800 underline truncate block"
                        >
                          {rule.approvedBy}
                        </a>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>

                    {/* 12. Approved on */}
                    <td className="py-2.5 px-3 border-r border-slate-200 text-slate-700 font-mono tabular-nums">
                      {rule.approvedOn || <span className="text-slate-300">-</span>}
                    </td>

                    {/* 13. Record status */}
                    <td className="py-2.5 px-3 border-r border-slate-200">
                      {getStatusBadge(rule.recordStatus)}
                    </td>

                    {/* 14. Action buttons: Edit, Review (Checker 4-eye), History */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {canCheckerApprove ? (
                          <button
                            onClick={() => onReviewRule(rule)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
                            title="4-Eye Checker: Review and Approve"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            Approve
                          </button>
                        ) : isSelfCreatedPending ? (
                          <button
                            onClick={() => onReviewRule(rule)}
                            className="px-1.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-[11px] font-medium flex items-center gap-1"
                            title="View your pending submission (Maker cannot self-approve)"
                          >
                            <Eye className="w-3 h-3 text-slate-400" />
                            View
                          </button>
                        ) : (
                          <button
                            onClick={() => onReviewRule(rule)}
                            className="px-1.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-[11px] font-medium flex items-center gap-1"
                            title="View details"
                          >
                            <Eye className="w-3 h-3 text-slate-400" />
                            View
                          </button>
                        )}

                        <button
                          onClick={() => onEditRule(rule)}
                          className="p-1 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded"
                          title="Edit rule parameters (triggers Maker state)"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onViewHistory(rule)}
                          className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                          title="View 4-Eye Audit History"
                        >
                          <History className="w-3.5 h-3.5" />
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

      {/* Grid Footer Bar */}
      <div className="px-6 py-2.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-4">
          <span>Showing <strong>{filteredRules.length}</strong> of <strong>{rules.length}</strong> business rules</span>
          <span className="text-slate-300">|</span>
          <span className="flex items-center gap-1 text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Active Settle to Market rules loaded in memory
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenFourEyeHelp}
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 underline"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            4-Eye Maker-Checker Workflow Policy
          </button>
        </div>
      </div>

      {/* BULK APPROVE CONFIRMATION MODAL */}
      {showBulkApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div 
            className="bg-white w-full max-w-2xl rounded-lg shadow-2xl border border-slate-300 flex flex-col max-h-[90vh] overflow-hidden"
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <div className="px-6 py-3.5 bg-[#1f242d] text-white flex items-center justify-between border-b border-[#323947]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm tracking-tight">
                  Bulk 4-Eye Approval Authorization
                </h3>
              </div>
              <button
                onClick={() => setShowBulkApproveModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Checker Role confirmation bar */}
            <div className="px-6 py-2.5 bg-emerald-50 border-b border-emerald-200 text-xs text-emerald-950 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold">Authorizing Checker:</span>
                <span className="font-mono font-bold text-emerald-800">{currentUser.email}</span>
                <span className="bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-bold text-[10px]">
                  4-Eye Checker
                </span>
              </div>
              <span className="font-bold text-emerald-800">
                {selectedEligibleRules.length} Rule(s) Ready to Authorize
              </span>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <p className="text-slate-600 mb-2">
                  You are about to approve <strong>{selectedEligibleRules.length} Settle to Market business rules</strong> in batch.
                  Once approved, these rules will transition to <strong className="text-emerald-700">Approved</strong> status and take effect for STM clearing assessments.
                </p>

                {/* Selected rules summary preview */}
                <div className="border border-slate-200 rounded-md overflow-hidden max-h-48 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-[11.5px]">
                    <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                      <tr>
                        <th className="py-1.5 px-2.5">ID</th>
                        <th className="py-1.5 px-2.5">Product</th>
                        <th className="py-1.5 px-2.5">CCY / Pair</th>
                        <th className="py-1.5 px-2.5">Tenor</th>
                        <th className="py-1.5 px-2.5">Indices</th>
                        <th className="py-1.5 px-2.5">Maker</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedEligibleRules.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="py-1.5 px-2.5 font-mono font-semibold text-slate-700">{r.id}</td>
                          <td className="py-1.5 px-2.5 truncate max-w-[140px]">{r.productTypes.join(', ')}</td>
                          <td className="py-1.5 px-2.5 font-mono font-bold text-[11px]">
                            {r.ccy2 && r.ccy2 !== 'NA' ? `${r.ccy1 || r.ccy[0]} / ${r.ccy2}` : (r.ccy1 || r.ccy[0])}
                          </td>
                          <td className="py-1.5 px-2.5 font-mono text-[10.5px]">{r.minTenor || '1D'} - {r.maxTenor || '2Y'}</td>
                          <td className="py-1.5 px-2.5 font-mono text-[11px] truncate max-w-[120px]">{r.indices.join(', ')}</td>
                          <td className="py-1.5 px-2.5 text-slate-500 font-mono text-[10.5px]">{r.createdBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Common approval comment input */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Common 4-Eye Approval Comment / Audit Note <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={bulkApproveComment}
                  onChange={(e) => setBulkApproveComment(e.target.value)}
                  placeholder="Enter common verification notes to record across all selected rules..."
                  className="w-full p-2.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />

                {/* Preset comments */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10.5px] text-slate-400">Presets:</span>
                  {[
                    'Bulk 4-Eye verification approved against MarkitWire STM rate schedule',
                    'Production clearing inclusion verified and authorized',
                    'Regular bi-weekly currency/rates maintenance approval'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBulkApproveComment(preset)}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded border border-slate-300"
                    >
                      {preset.slice(0, 32)}...
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <span className="text-slate-500 text-[11px]">
                Compliant with CRDS 4-Eye Maker-Checker audit policy
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkApproveModal(false)}
                  className="px-3.5 py-1.5 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBulkApprove}
                  disabled={!bulkApproveComment.trim() || selectedEligibleRules.length === 0}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded text-xs font-semibold shadow-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authorize All ({selectedEligibleRules.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
