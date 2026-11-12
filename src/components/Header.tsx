import React, { useState } from 'react';
import { UserPersona } from '../types/stm';
import { USER_PERSONAS } from '../data/mockData';
import { 
  ShieldCheck, 
  UserCheck, 
  HelpCircle, 
  ChevronDown, 
  Menu, 
  X,
  ExternalLink,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface HeaderProps {
  currentUser: UserPersona;
  onSelectUser: (user: UserPersona) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenFourEyeHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSelectUser,
  sidebarOpen,
  onToggleSidebar,
  onOpenFourEyeHelp,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="h-14 bg-[#1e2025] border-b border-[#2d3139] flex items-center justify-between px-3 md:px-5 shrink-0 z-30 select-none text-white">
      {/* Left section: Sidebar toggle + UAT badge + OSTTRA Brand */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded hover:bg-[#2c313a] text-slate-300 hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-rose-500"
          title={sidebarOpen ? 'Collapse menu' : 'Expand menu'}
          aria-label="Toggle navigation menu"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* UAT Environment Pill Badge */}
        <div className="bg-[#9c1844] text-white text-[11px] font-bold tracking-widest px-2.5 py-1 rounded-xs uppercase shadow-sm">
          UAT
        </div>

        {/* OSTTRA Logo Wordmark */}
        <div className="flex items-baseline gap-1.5 border-r border-[#363b46] pr-4 mr-1">
          <span className="font-extrabold text-xl tracking-tight text-white font-sans">
            )STTRA
          </span>
          <span className="text-xs font-semibold tracking-wider text-rose-400 font-mono">
            CRDS
          </span>
        </div>

        {/* Context / Module Name */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
          <span>Credit Risk Directory Service</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-200 font-medium">Settle to Market (STM) Utility</span>
        </div>
      </div>

      {/* Right section: 4-Eye Role indicator + Persona Switcher + 4-Eye Info */}
      <div className="flex items-center gap-2.5">
        {/* 4-Eye Guide button */}
        <button
          onClick={onOpenFourEyeHelp}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-[#2d323c] rounded border border-slate-700/60 transition-colors"
          title="Learn about 4-Eye Maker-Checker Governance"
        >
          <HelpCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>4-Eye Governance</span>
        </button>

        {/* Active Role Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800/90 border border-slate-700">
          <span className="text-slate-400">Role:</span>
          {currentUser.role === 'Checker' ? (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Checker (Approver)
            </span>
          ) : currentUser.role === 'Maker' ? (
            <span className="text-amber-400 font-semibold flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> Maker (Creator)
            </span>
          ) : (
            <span className="text-sky-400 font-semibold flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> Modifier (Editor)
            </span>
          )}
        </div>

        {/* User Switcher Dropdown (Essential for testing 4-Eye check demo) */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-[#2b303a] border border-[#383e4c] text-xs transition-colors"
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
              currentUser.role === 'Checker' 
                ? 'bg-emerald-600 text-white' 
                : currentUser.role === 'Maker' 
                ? 'bg-amber-600 text-white' 
                : 'bg-sky-600 text-white'
            }`}>
              {currentUser.email.substring(0, 2).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <div className="font-semibold text-slate-100 text-xs leading-none">
                {currentUser.email}
              </div>
              <div className="text-[10px] text-slate-400 leading-tight">
                {currentUser.title}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {userDropdownOpen && (
            <div 
              className="absolute right-0 mt-1.5 w-72 bg-[#1e222a] border border-[#343b48] rounded-lg shadow-2xl py-2 z-50 text-slate-200"
              onMouseLeave={() => setUserDropdownOpen(false)}
            >
              <div className="px-3 py-1.5 border-b border-[#2d3340] mb-1">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Simulate 4-Eye User Persona
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  Switch user to test Maker vs Checker approval permissions.
                </div>
              </div>

              {USER_PERSONAS.map((persona) => {
                const isSelected = persona.id === currentUser.id;
                return (
                  <button
                    key={persona.id}
                    onClick={() => {
                      onSelectUser(persona);
                      setUserDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-start gap-2.5 hover:bg-[#282e3a] transition-colors ${
                      isSelected ? 'bg-[#29303d]' : ''
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] mt-0.5 shrink-0 ${
                      persona.role === 'Checker' 
                        ? 'bg-emerald-600 text-white' 
                        : persona.role === 'Maker' 
                        ? 'bg-amber-600 text-white' 
                        : 'bg-sky-600 text-white'
                    }`}>
                      {persona.email.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs text-white truncate">
                          {persona.email}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          persona.role === 'Checker' 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' 
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}>
                          {persona.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {persona.name} · {persona.title}
                      </div>
                    </div>
                  </button>
                );
              })}

              <div className="mt-1 pt-1.5 border-t border-[#2d3340] px-3 py-1 text-[11px] text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>4-Eye Rule: Maker cannot self-approve.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
