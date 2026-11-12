import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavItemKey } from './components/Sidebar';
import { STMGrid } from './components/STMGrid';
import { RuleModal } from './components/RuleModal';
import { AuditHistoryModal } from './components/AuditHistoryModal';
import { FourEyeHelpModal } from './components/FourEyeHelpModal';
import { OtherScreen } from './components/OtherScreen';
import { STMBusinessRule, UserPersona } from './types/stm';
import { INITIAL_STM_RULES, USER_PERSONAS } from './data/mockData';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
}

export default function App() {
  // Load rules from localStorage or fallback to initial data
  const [rules, setRules] = useState<STMBusinessRule[]>(() => {
    try {
      const saved = localStorage.getItem('osttra_stm_rules_v3');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return INITIAL_STM_RULES;
  });

  // Current active persona (Defaults to Maker for demonstration)
  const [currentUser, setCurrentUser] = useState<UserPersona>(USER_PERSONAS[0]);

  // Navigation
  const [activeNavItem, setActiveNavItem] = useState<NavItemKey>('stm_business_rules');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Modals
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<STMBusinessRule | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyRule, setHistoryRule] = useState<STMBusinessRule | null>(null);

  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<ToastMessage | null>({
    id: 'welcome',
    type: 'info',
    title: 'CRDS STM Business Rules Screen Utility',
    message: 'Add FX & Rates parameters directly via screen. 4-Eye Maker-Checker governance active.',
  });

  // Persist rules
  useEffect(() => {
    try {
      localStorage.setItem('osttra_stm_rules_v3', JSON.stringify(rules));
    } catch {
      // ignore
    }
  }, [rules]);

  // Format date helper: DD-MM-YYYY
  const getFormattedDate = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const getFormattedDateTime = () => {
    const d = new Date();
    const dateStr = getFormattedDate();
    const timeStr = d.toTimeString().split(' ')[0];
    return `${dateStr} ${timeStr}`;
  };

  const showToast = (type: 'success' | 'warning' | 'info', title: string, message: string) => {
    setToast({
      id: Date.now().toString(),
      type,
      title,
      message,
    });
  };

  // Handlers for Rules
  const handleOpenNewRule = () => {
    setEditingRule(null);
    setIsRuleModalOpen(true);
  };

  const handleEditRule = (rule: STMBusinessRule) => {
    setEditingRule(rule);
    setIsRuleModalOpen(true);
  };

  const handleReviewRule = (rule: STMBusinessRule) => {
    setEditingRule(rule);
    setIsRuleModalOpen(true);
  };

  const handleViewHistory = (rule: STMBusinessRule) => {
    setHistoryRule(rule);
    setIsHistoryModalOpen(true);
  };

  // Save Rule (Maker Action)
  const handleSaveRule = (ruleData: Partial<STMBusinessRule>, isNew: boolean) => {
    const today = getFormattedDate();
    const timestamp = getFormattedDateTime();

    if (isNew) {
      const newId = `stm-${String(rules.length + 1).padStart(3, '0')}`;
      const newRule: STMBusinessRule = {
        id: newId,
        productTypes: ruleData.productTypes || ['Cross Currency Basis Swap'],
        ccy1: ruleData.ccy1 || 'USD',
        ccy2: ruleData.ccy2 || 'NA',
        ccy: ruleData.ccy || ['USD'],
        indices: ruleData.indices || ['NA'],
        floatingLeg: ruleData.floatingLeg || 'Yes',
        fixedLeg: ruleData.fixedLeg || 'Yes',
        minTenor: ruleData.minTenor || '1D',
        maxTenor: ruleData.maxTenor || '2Y',
        fixingPage: ruleData.fixingPage || 'NA',
        description: ruleData.description || '',
        createdBy: currentUser.email,
        createdOn: today,
        recordStatus: 'Added',
        history: [
          {
            action: 'Created',
            user: currentUser.email,
            timestamp,
            comment: `Rule submitted with products: ${ruleData.productTypes?.join(', ')}`,
          },
        ],
      };

      setRules([newRule, ...rules]);
      setIsRuleModalOpen(false);
      showToast(
        'success',
        'Rule Saved (Status: Added)',
        `New rule created by ${currentUser.email}. Pending 4-Eye Checker authorization before live assessment.`
      );
    } else if (editingRule) {
      const updatedRule: STMBusinessRule = {
        ...editingRule,
        productTypes: ruleData.productTypes || editingRule.productTypes,
        ccy1: ruleData.ccy1 || editingRule.ccy1 || 'USD',
        ccy2: ruleData.ccy2 !== undefined ? ruleData.ccy2 : editingRule.ccy2,
        ccy: ruleData.ccy || editingRule.ccy,
        indices: ruleData.indices || editingRule.indices,
        floatingLeg: ruleData.floatingLeg || editingRule.floatingLeg,
        fixedLeg: ruleData.fixedLeg || editingRule.fixedLeg,
        minTenor: ruleData.minTenor || editingRule.minTenor || '1D',
        maxTenor: ruleData.maxTenor || editingRule.maxTenor || '2Y',
        fixingPage: ruleData.fixingPage || editingRule.fixingPage,
        description: ruleData.description || editingRule.description,
        updatedBy: currentUser.email,
        updatedOn: today,
        recordStatus: 'Modified',
        history: [
          ...(editingRule.history || []),
          {
            action: 'Modified',
            user: currentUser.email,
            timestamp,
            comment: `Modified parameters by ${currentUser.email}`,
          },
        ],
      };

      setRules(rules.map(r => r.id === editingRule.id ? updatedRule : r));
      setIsRuleModalOpen(false);
      showToast(
        'warning',
        'Rule Updated (Status: Modified)',
        `Rule ${editingRule.id} modified by ${currentUser.email}. Requires independent Checker review to re-approve.`
      );
    }
  };

  // Approve Rule (Checker Action)
  const handleApproveRule = (ruleId: string, comment = 'Approved via 4-Eye review') => {
    const target = rules.find(r => r.id === ruleId);
    if (!target) return;

    // 4-Eye Maker-Checker enforcement
    const isMaker = target.createdBy === currentUser.email || target.updatedBy === currentUser.email;
    if (isMaker) {
      showToast(
        'warning',
        '4-Eye Self-Approval Blocked',
        `User ${currentUser.email} cannot approve their own rule. Switch to Paul Quinn (pqr@osttra.com) or another authorized Checker.`
      );
      return;
    }

    if (currentUser.role !== 'Checker') {
      showToast(
        'warning',
        'Checker Privileges Required',
        `Current user ${currentUser.email} has role '${currentUser.role}'. Only Checkers can authorize Settle to Market rules.`
      );
      return;
    }

    const today = getFormattedDate();
    const timestamp = getFormattedDateTime();

    const updatedRules = rules.map((r) => {
      if (r.id === ruleId) {
        return {
          ...r,
          recordStatus: 'Approved' as const,
          approvedBy: currentUser.email,
          approvedOn: today,
          history: [
            ...(r.history || []),
            {
              action: 'Approved' as const,
              user: currentUser.email,
              timestamp,
              comment,
            },
          ],
        };
      }
      return r;
    });

    setRules(updatedRules);
    setIsRuleModalOpen(false);
    showToast(
      'success',
      'Rule Approved Successfully',
      `Rule ${target.id} (${target.ccy.join(', ')}) approved by Checker ${currentUser.email}. Now active for Settle to Market assessment.`
    );
  };

  // Bulk Approve Rules (Checker Action)
  const handleBulkApproveRules = (ruleIds: string[], comment: string) => {
    if (currentUser.role !== 'Checker') {
      showToast(
        'warning',
        'Checker Privileges Required',
        `Current user ${currentUser.email} has role '${currentUser.role}'. Only Checkers can authorize Settle to Market rules.`
      );
      return;
    }

    const today = getFormattedDate();
    const timestamp = getFormattedDateTime();
    let approvedCount = 0;
    let blockedSelfApprovalCount = 0;

    const updatedRules = rules.map((r) => {
      if (ruleIds.includes(r.id)) {
        // Enforce 4-Eye Maker-Checker constraint
        const isMaker = r.createdBy === currentUser.email || r.updatedBy === currentUser.email;
        if (isMaker) {
          blockedSelfApprovalCount++;
          return r;
        }

        if (r.recordStatus === 'Approved') {
          return r; // already approved
        }

        approvedCount++;
        return {
          ...r,
          recordStatus: 'Approved' as const,
          approvedBy: currentUser.email,
          approvedOn: today,
          history: [
            ...(r.history || []),
            {
              action: 'Approved' as const,
              user: currentUser.email,
              timestamp,
              comment: comment.trim() || 'Bulk 4-Eye authorization approved',
            },
          ],
        };
      }
      return r;
    });

    setRules(updatedRules);

    if (approvedCount > 0) {
      showToast(
        'success',
        'Bulk 4-Eye Approval Successful',
        `Successfully authorized ${approvedCount} business rule(s) under Checker ${currentUser.email}.${
          blockedSelfApprovalCount > 0
            ? ` (${blockedSelfApprovalCount} rule(s) skipped due to 4-Eye Maker self-approval block)`
            : ''
        }`
      );
    } else if (blockedSelfApprovalCount > 0) {
      showToast(
        'warning',
        '4-Eye Self-Approval Blocked',
        `Could not approve selected rules because you created or modified them. Maker cannot self-approve under 4-Eye rules.`
      );
    }
  };

  // Reject Rule (Checker Action)
  const handleRejectRule = (ruleId: string, reason: string) => {
    const target = rules.find(r => r.id === ruleId);
    if (!target) return;

    const today = getFormattedDate();
    const timestamp = getFormattedDateTime();

    const updatedRules = rules.map((r) => {
      if (r.id === ruleId) {
        return {
          ...r,
          recordStatus: 'Rejected' as const,
          rejectionReason: reason,
          history: [
            ...(r.history || []),
            {
              action: 'Rejected' as const,
              user: currentUser.email,
              timestamp,
              comment: reason,
            },
          ],
        };
      }
      return r;
    });

    setRules(updatedRules);
    setIsRuleModalOpen(false);
    showToast(
      'warning',
      'Rule Rejected',
      `Rule ${target.id} was rejected by ${currentUser.email}. Reason: ${reason}`
    );
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Product Type',
      'CCY 1',
      'CCY 2',
      'CCY Pair / CCY',
      'Min Tenor',
      'Max Tenor',
      'Indices',
      'Floating leg',
      'Fixed leg',
      'Fixing Page',
      'Created by',
      'Created on',
      'Updated by',
      'updated on',
      'Approved by',
      'Approved on',
      'Record status',
    ];

    const rows = rules.map(r => [
      `"${r.productTypes.join('; ')}"`,
      r.ccy1 || r.ccy[0] || '',
      r.ccy2 || (r.ccy.length > 1 ? r.ccy[1] : 'NA'),
      `"${r.ccy.join(' / ')}"`,
      r.minTenor || '1D',
      r.maxTenor || '2Y',
      `"${r.indices.join('; ')}"`,
      r.floatingLeg || 'NA',
      r.fixedLeg || 'NA',
      r.fixingPage || 'NA',
      r.createdBy,
      r.createdOn,
      r.updatedBy || '',
      r.updatedOn || '',
      r.approvedBy || '',
      r.approvedOn || '',
      r.recordStatus,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `OSTTRA_CRDS_STM_Rules_${getFormattedDate()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('info', 'Export Completed', 'Downloaded STM Business Rules as CSV file.');
  };

  // Quick switch helpers for 4-eye testing
  const switchToMaker = () => {
    setCurrentUser(USER_PERSONAS[0]); // Maker xyx@osttra.com
    showToast('info', 'Switched Persona', 'Logged in as Maker (xyx@osttra.com). You can create and edit rules.');
  };

  const switchToChecker = () => {
    setCurrentUser(USER_PERSONAS[2]); // Checker pqr@osttra.com
    showToast('info', 'Switched Persona', 'Logged in as Checker (pqr@osttra.com). You can review and approve pending rules.');
  };

  const pendingCount = rules.filter(r => r.recordStatus === 'Added' || r.recordStatus === 'Modified' || r.recordStatus === 'Pending Approval').length;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#f8fafc] overflow-hidden text-slate-800">
      {/* Top Header Bar */}
      <Header
        currentUser={currentUser}
        onSelectUser={setCurrentUser}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenFourEyeHelp={() => setIsHelpModalOpen(true)}
      />

      {/* Main Container: Sidebar + Content */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Sidebar matching Image 1 with 'STM Business Rules Config' under Setup */}
        <Sidebar
          isOpen={sidebarOpen}
          activeItem={activeNavItem}
          onSelectItem={setActiveNavItem}
          pendingCount={pendingCount}
        />

        {/* Viewport content area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
          {activeNavItem === 'stm_business_rules' ? (
            <STMGrid
              rules={rules}
              currentUser={currentUser}
              onOpenNewRule={handleOpenNewRule}
              onEditRule={handleEditRule}
              onReviewRule={handleReviewRule}
              onViewHistory={handleViewHistory}
              onQuickApprove={(rule) => handleApproveRule(rule.id)}
              onBulkApprove={handleBulkApproveRules}
              onExportCSV={handleExportCSV}
              onOpenFourEyeHelp={() => setIsHelpModalOpen(true)}
            />
          ) : (
            <OtherScreen
              screenKey={activeNavItem}
              onNavigateToSTM={() => setActiveNavItem('stm_business_rules')}
            />
          )}
        </main>
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md bg-white border border-slate-200 rounded-lg shadow-xl p-3.5 flex items-start gap-3 animate-in slide-in-from-bottom-2 duration-200">
          {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
          {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
          {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0 text-xs">
            <div className="font-bold text-slate-900">{toast.title}</div>
            <div className="text-slate-600 mt-0.5 leading-relaxed">{toast.message}</div>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* New / Edit Business Rule Form Window (Matching Image 3) */}
      <RuleModal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        onSave={handleSaveRule}
        onApprove={handleApproveRule}
        onReject={handleRejectRule}
        onSwitchUserToChecker={switchToChecker}
        editingRule={editingRule}
        currentUser={currentUser}
      />

      {/* 4-Eye Audit History Log Modal */}
      <AuditHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        rule={historyRule}
      />

      {/* 4-Eye Help & Instructions Modal */}
      <FourEyeHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
        onSwitchToMaker={switchToMaker}
        onSwitchToChecker={switchToChecker}
      />
    </div>
  );
}
