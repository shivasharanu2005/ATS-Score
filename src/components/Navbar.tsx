import React from 'react';
import {
  Briefcase, Users, LayoutDashboard, BarChart3, Settings,
  Plus, LogOut, Sparkles, Building2
} from 'lucide-react';
import { User } from '../types/ats';

interface NavbarProps {
  currentTab: 'dashboard' | 'jobs' | 'candidates' | 'analytics' | 'settings';
  onTabChange: (tab: 'dashboard' | 'jobs' | 'candidates' | 'analytics' | 'settings') => void;
  user: User;
  onLogout: () => void;
  onOpenCreateJob: () => void;
  onOpenUpload: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  user,
  onLogout,
  onOpenCreateJob,
  onOpenUpload
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Org Brand */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onTabChange('dashboard')}>
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                ATS
              </div>
              <div>
                <span className="font-extrabold text-slate-900 tracking-tight text-sm">
                  AI ATS
                </span>
                <span className="text-[10px] text-slate-400 block -mt-0.5">
                  Smart Screening
                </span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-100/80 px-2.5 py-1 rounded-md border border-slate-200/60">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium text-slate-700">{user.organizationName}</span>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1">
            <button
              onClick={() => onTabChange('dashboard')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentTab === 'dashboard'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </button>

            <button
              onClick={() => onTabChange('jobs')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentTab === 'jobs'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Jobs
            </button>

            <button
              onClick={() => onTabChange('candidates')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentTab === 'candidates'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Candidates
            </button>

            <button
              onClick={() => onTabChange('analytics')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentTab === 'analytics'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Analytics
            </button>

            <button
              onClick={() => onTabChange('settings')}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                currentTab === 'settings'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>
          </nav>

          {/* Quick Actions & User Meta */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenCreateJob}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              New Job
            </button>

            <div className="h-6 w-px bg-slate-200" />

            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                {user.name[0]}
              </div>
              <div className="hidden md:block text-left">
                <span className="block text-xs font-bold text-slate-800 leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] text-slate-400 block -mt-0.5">
                  {user.role}
                </span>
              </div>
              <button
                onClick={onLogout}
                title="Sign out"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
