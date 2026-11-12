import React from 'react';
import { NavItemKey } from './Sidebar';
import { ArrowRight, Sliders, ExternalLink } from 'lucide-react';

interface OtherScreenProps {
  screenKey: NavItemKey;
  onNavigateToSTM: () => void;
}

export const OtherScreen: React.FC<OtherScreenProps> = ({ screenKey, onNavigateToSTM }) => {
  const getScreenTitle = (key: NavItemKey) => {
    switch (key) {
      case 'field_config': return 'Field Config';
      case 'relationship': return 'Relationship Setup';
      case 'bulk_operations': return 'Bulk Operations';
      case 'file_status': return 'File Status Monitor';
      case 'roles_permissions': return 'Roles & Permissions';
      case 'audit_logs': return 'Audit Logs';
      case 'institutions': return 'Institutions Management';
      case 'business_organisations': return 'Business Organisations';
      case 'users_management': return 'Users Management';
      case 'funds': return 'Funds Configuration';
      case 'accounts': return 'Accounts Directory';
      default: return 'CRDS Workspace';
    }
  };

  return (
    <div className="flex-1 bg-white p-8 flex flex-col items-center justify-center text-center">
      <div className="max-w-xl p-8 border border-slate-200 rounded-lg bg-slate-50/60 shadow-xs">
        <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <Sliders className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          {getScreenTitle(screenKey)}
        </h2>
        <p className="text-xs text-slate-600 mb-6">
          This CRDS module is part of party relationships and core directory settings. To access the new Settle to Market assessment rules and FX/Rates parameter screen with 4-Eye Maker-Checker approval:
        </p>

        <button
          onClick={onNavigateToSTM}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#d81b60] hover:bg-[#c2185b] text-white rounded font-semibold text-xs shadow-sm transition-all"
        >
          <span>Open STM Business Rules Config</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
