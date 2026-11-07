import React from 'react';
import { User } from '../types';
import { Factory, ShieldAlert, Wifi, WifiOff, RefreshCw, LogOut, User as UserIcon, Lock } from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  onSwitchUser: (user: User) => void;
  allUsers: User[];
  activeTab: 'board' | 'supervisor' | 'buyer' | 'executive' | 'tdd';
  onSelectTab: (tab: 'board' | 'supervisor' | 'buyer' | 'executive' | 'tdd') => void;
  offlineCount: number;
  onSyncOffline: () => void;
  isSyncing: boolean;
  onOpenNewOrder: () => void;
  onSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSwitchUser,
  allUsers,
  activeTab,
  onSelectTab,
  offlineCount,
  onSyncOffline,
  isSyncing,
  onOpenNewOrder,
  onSignOut,
}) => {
  const isBuyer = currentUser.role === 'buyer';

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
              TT
            </div>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                if (isBuyer) onSelectTab('buyer');
                else onSelectTab('board');
              }}
              className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap"
            >
              TexTrack Tiruppur
            </a>
          </div>

          {/* Zone 2: Navigation Links (Strictly filtered for buyers) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            {!isBuyer && (
              <>
                <button
                  onClick={() => onSelectTab('board')}
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                    activeTab === 'board' ? 'text-slate-950 font-semibold border-b-2 border-slate-900' : ''
                  }`}
                >
                  Production Board
                </button>
                <button
                  onClick={() => onSelectTab('supervisor')}
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                    activeTab === 'supervisor' ? 'text-slate-950 font-semibold border-b-2 border-slate-900' : ''
                  }`}
                >
                  Floor Supervisor Mobile
                </button>
                <button
                  onClick={() => onSelectTab('buyer')}
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                    activeTab === 'buyer' ? 'text-slate-950 font-semibold border-b-2 border-slate-900' : ''
                  }`}
                >
                  Buyer Portal
                </button>
                <button
                  onClick={() => onSelectTab('executive')}
                  className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                    activeTab === 'executive' ? 'text-slate-950 font-semibold border-b-2 border-slate-900' : ''
                  }`}
                >
                  MD Financial View
                </button>
              </>
            )}

            {isBuyer && (
              <button
                onClick={() => onSelectTab('buyer')}
                className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                  activeTab === 'buyer' ? 'text-slate-950 font-semibold border-b-2 border-slate-900' : ''
                }`}
              >
                My Orders & Timeline ({currentUser.organization})
              </button>
            )}

            <button
              onClick={() => onSelectTab('tdd')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-1 cursor-pointer ${
                activeTab === 'tdd' ? 'text-slate-950 font-semibold border-b-2 border-slate-900' : ''
              }`}
            >
              TDD & Deploy Docs
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action & Role Switcher / Sign Out */}
          <div className="flex items-center gap-3 shrink-0">
            {offlineCount > 0 && !isBuyer && (
              <button
                onClick={onSyncOffline}
                disabled={isSyncing}
                title="Sync offline updates queued on mobile"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-amber-900 bg-amber-50 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors whitespace-nowrap shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync {offlineCount} Offline</span>
              </button>
            )}

            {/* Buyer Strict Mode: NEVER show switcher. Show locked badge */}
            {isBuyer ? (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-900">
                <Lock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="truncate max-w-[150px] sm:max-w-[200px]">
                  {currentUser.name} ({currentUser.organization})
                </span>
              </div>
            ) : (
              /* Internal Staff Persona Switcher (Merchandiser, Supervisor, MD) */
              <div className="flex items-center gap-2 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500 hidden sm:inline">User:</span>
                <select
                  aria-label="Switch User Persona"
                  value={currentUser.id}
                  onChange={(e) => {
                    const target = allUsers.find((u) => u.id === e.target.value);
                    if (target) onSwitchUser(target);
                  }}
                  className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer"
                >
                  {allUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {currentUser.role === 'merchandiser' && (
              <button
                onClick={onOpenNewOrder}
                className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
              >
                + New Order
              </button>
            )}

            {/* Sign Out Button */}
            <button
              onClick={onSignOut}
              title="Sign Out to Login Screen"
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar for narrow screens */}
        <div className="flex md:hidden items-center justify-between overflow-x-auto py-2 border-t border-slate-100 text-xs font-medium gap-2">
          {!isBuyer && (
            <>
              <button
                onClick={() => onSelectTab('board')}
                className={`whitespace-nowrap px-2 py-1 rounded cursor-pointer ${activeTab === 'board' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
              >
                Board
              </button>
              <button
                onClick={() => onSelectTab('supervisor')}
                className={`whitespace-nowrap px-2 py-1 rounded cursor-pointer ${activeTab === 'supervisor' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
              >
                Supervisor (தமிழ்)
              </button>
              <button
                onClick={() => onSelectTab('executive')}
                className={`whitespace-nowrap px-2 py-1 rounded cursor-pointer ${activeTab === 'executive' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
              >
                MD Financial
              </button>
            </>
          )}

          <button
            onClick={() => onSelectTab('buyer')}
            className={`whitespace-nowrap px-2 py-1 rounded cursor-pointer ${activeTab === 'buyer' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
          >
            {isBuyer ? 'My Orders' : 'Buyer View'}
          </button>
          <button
            onClick={() => onSelectTab('tdd')}
            className={`whitespace-nowrap px-2 py-1 rounded cursor-pointer ${activeTab === 'tdd' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
          >
            TDD Docs
          </button>
        </div>
      </div>
    </header>
  );
};
