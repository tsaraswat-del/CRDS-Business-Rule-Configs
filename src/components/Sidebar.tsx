import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  FolderTree, 
  PiggyBank, 
  Network, 
  CreditCard, 
  GitMerge, 
  Settings, 
  FileText, 
  Bell, 
  ChevronDown, 
  ChevronUp, 
  Sliders, 
  Sparkles 
} from 'lucide-react';

export type NavItemKey = 
  | 'institutions'
  | 'business_organisations'
  | 'users_management'
  | 'legacy_organisations'
  | 'legacy_users'
  | 'funds'
  | 'relationship'
  | 'accounts'
  | 'naming_mapping'
  | 'bulk_operations'
  | 'file_status'
  | 'field_config'
  | 'stm_business_rules'
  | 'roles_permissions'
  | 'audit_logs'
  | 'notifications';

interface SidebarProps {
  isOpen: boolean;
  activeItem: NavItemKey;
  onSelectItem: (item: NavItemKey) => void;
  pendingCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  activeItem,
  onSelectItem,
  pendingCount = 0,
}) => {
  const [setupExpanded, setSetupExpanded] = useState(true);
  const [namingExpanded, setNamingExpanded] = useState(false);

  if (!isOpen) return null;

  return (
    <aside className="w-64 bg-[#181a1f] border-r border-[#262930] flex flex-col shrink-0 select-none overflow-y-auto z-20 text-slate-300">
      {/* Sidebar navigation list matching Image 1 */}
      <nav className="py-2 text-[13px] font-medium space-y-0.5">
        <button
          onClick={() => onSelectItem('institutions')}
          className={`w-full text-left px-5 py-2.5 flex items-center justify-between hover:bg-[#22252c] transition-colors ${
            activeItem === 'institutions' ? 'bg-[#d81b60] text-white font-semibold' : 'text-slate-300'
          }`}
        >
          <span>Institutions</span>
        </button>

        <button
          onClick={() => onSelectItem('business_organisations')}
          className={`w-full text-left px-5 py-2.5 flex items-center justify-between hover:bg-[#22252c] transition-colors ${
            activeItem === 'business_organisations' ? 'bg-[#d81b60] text-white font-semibold' : 'text-slate-300'
          }`}
        >
          <span>Business Organisations</span>
        </button>

        <button
          onClick={() => onSelectItem('users_management')}
          className={`w-full text-left px-5 py-2.5 flex items-center justify-between hover:bg-[#22252c] transition-colors ${
            activeItem === 'users_management' ? 'bg-[#d81b60] text-white font-semibold' : 'text-slate-300'
          }`}
        >
          <span>Users Management</span>
        </button>

        <button
          onClick={() => onSelectItem('legacy_organisations')}
          className={`w-full text-left px-5 py-2.5 flex items-center justify-between hover:bg-[#22252c] transition-colors ${
            activeItem === 'legacy_organisations' ? 'bg-[#d81b60] text-white font-semibold' : 'text-slate-300'
          }`}
        >
          <span>Legacy Organisations</span>
        </button>

        <button
          onClick={() => onSelectItem('legacy_users')}
          className={`w-full text-left px-5 py-2.5 flex items-center justify-between hover:bg-[#22252c] transition-colors ${
            activeItem === 'legacy_users' ? 'bg-[#d81b60] text-white font-semibold' : 'text-slate-300'
          }`}
        >
          <span>Legacy Users</span>
        </button>

        <button
          onClick={() => onSelectItem('funds')}
          className={`w-full text-left px-5 py-2.5 flex items-center justify-between hover:bg-[#22252c] transition-colors ${
            activeItem === 'funds' ? 'bg-[#d81b60] text-white font-semibold' : 'text-slate-300'
          }`}
        >
          <span>Funds</span>
        </button>

        <button
          onClick={() => onSelectItem('relationship')}
          className={`w-full text-left px-5 py-2.5 flex items-center justify-between hover:bg-[#22252c] transition-colors ${
            activeItem === 'relationship' ? 'bg-[#d81b60] text-white font-semibold' : 'text-slate-300'
          }`}
        >
          <span>Relationship</span>
        </button>

        <button
          onClick={() => onSelectItem('accounts')}
          className={`w-full text-left px-5 py-2.5 flex items-center justify-between hover:bg-[#22252c] transition-colors ${
            activeItem === 'accounts' ? 'bg-[#d81b60] text-white font-semibold' : 'text-slate-300'
          }`}
        >
          <span>Accounts</span>
        </button>

        {/* Naming / Mapping dropdown */}
        <div>
          <button
            onClick={() => setNamingExpanded(!namingExpanded)}
            className="w-full text-left px-5 py-2.5 flex items-center justify-between hover:bg-[#22252c] transition-colors text-slate-300"
          >
            <span>Naming/Mapping</span>
            {namingExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>
          {namingExpanded && (
            <div className="pl-8 pr-3 py-1 space-y-0.5 text-xs text-slate-400 bg-[#14161b]">
              <button 
                onClick={() => onSelectItem('naming_mapping')}
                className="w-full text-left py-1.5 px-2 rounded hover:text-white"
              >
                Account Mappings
              </button>
              <button 
                onClick={() => onSelectItem('naming_mapping')}
                className="w-full text-left py-1.5 px-2 rounded hover:text-white"
              >
                Code Identifier Maps
              </button>
            </div>
          )}
        </div>

        {/* Setup Section (expanded as in Image 1) */}
        <div>
          <button
            onClick={() => setSetupExpanded(!setupExpanded)}
            className="w-full text-left px-5 py-2.5 flex items-center justify-between hover:bg-[#22252c] transition-colors text-slate-200 font-semibold"
          >
            <span>Setup</span>
            {setupExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-300" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-300" />
            )}
          </button>

          {setupExpanded && (
            <div className="space-y-0.5">
              <button
                onClick={() => onSelectItem('bulk_operations')}
                className={`w-full text-left pl-8 pr-4 py-2 flex items-center justify-between hover:bg-[#22252c] transition-colors ${
                  activeItem === 'bulk_operations' ? 'bg-[#d81b60] text-white font-medium' : 'text-slate-300'
                }`}
              >
                <span>Bulk Operations</span>
              </button>

              <button
                onClick={() => onSelectItem('file_status')}
                className={`w-full text-left pl-8 pr-4 py-2 flex items-center justify-between hover:bg-[#22252c] transition-colors ${
                  activeItem === 'file_status' ? 'bg-[#d81b60] text-white font-medium' : 'text-slate-300'
                }`}
              >
                <span>File Status</span>
              </button>

              <button
                onClick={() => onSelectItem('field_config')}
                className={`w-full text-left pl-8 pr-4 py-2 flex items-center justify-between hover:bg-[#22252c] transition-colors ${
                  activeItem === 'field_config' ? 'bg-[#d81b60] text-white font-semibold' : 'text-slate-300'
                }`}
              >
                <span>Field Config</span>
              </button>

              {/* NEW REQUESTED ITEM: STM Business Rules Config */}
              <button
                onClick={() => onSelectItem('stm_business_rules')}
                className={`w-full text-left pl-8 pr-3 py-2 flex items-center justify-between transition-colors relative ${
                  activeItem === 'stm_business_rules'
                    ? 'bg-[#d81b60] text-white font-bold shadow-inner'
                    : 'text-white hover:bg-[#262933]'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="truncate">STM Business Rules Config</span>
                </div>
                {pendingCount > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    activeItem === 'stm_business_rules'
                      ? 'bg-white text-[#d81b60]'
                      : 'bg-amber-500 text-slate-900'
                  }`}>
                    {pendingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => onSelectItem('roles_permissions')}
                className={`w-full text-left pl-8 pr-4 py-2 flex items-center justify-between hover:bg-[#22252c] transition-colors ${
                  activeItem === 'roles_permissions' ? 'bg-[#d81b60] text-white font-medium' : 'text-slate-300'
                }`}
              >
                <span>Roles & Permissions</span>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => onSelectItem('audit_logs')}
          className={`w-full text-left px-5 py-2.5 flex items-center justify-between hover:bg-[#22252c] transition-colors ${
            activeItem === 'audit_logs' ? 'bg-[#d81b60] text-white font-semibold' : 'text-slate-300'
          }`}
        >
          <span>Audit Logs</span>
        </button>

        <button
          onClick={() => onSelectItem('notifications')}
          className={`w-full text-left px-5 py-2.5 flex items-center justify-between hover:bg-[#22252c] transition-colors ${
            activeItem === 'notifications' ? 'bg-[#d81b60] text-white font-semibold' : 'text-slate-300'
          }`}
        >
          <span>Notifications</span>
        </button>
      </nav>

      {/* Footer Info */}
      <div className="mt-auto p-4 border-t border-[#262930] text-[11px] text-slate-500 space-y-1">
        <div>OSTTRA CRDS Platform</div>
        <div>Release v26.10-STM</div>
      </div>
    </aside>
  );
};
