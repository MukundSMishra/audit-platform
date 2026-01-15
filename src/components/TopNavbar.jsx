import React from 'react';
import { ShieldCheck, LogOut, Home, FileText, Users, Clock, CheckCircle, ClipboardList } from 'lucide-react';

/**
 * TopNavbar Component
 * Fixed navigation bar at the top of the application
 */
export default function TopNavbar({
  viewState,
  activeTab,
  onNavigate,
  onLogout,
  userEmail,
  userRole,
  isAuditActive = false,
  auditContext = {}
}) {
  const { factoryName, actShortName, actProgress } = auditContext || {};

  return (
    <nav className="h-16 w-full fixed top-0 left-0 z-50 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center justify-between w-full gap-6">
        
        {/* Left Side: Context or Navigation */}
        {isAuditActive ? (
          // Audit Mode: Breadcrumb-style context with dividers
          <div className="flex items-center gap-4">
            {/* Item 1: Portal Brand */}
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-blue-600" />
              <span className="font-bold text-slate-900">SHA Innovations</span>
            </div>

            {/* Divider */}
            <div className="h-5 w-px bg-slate-300"></div>

            {/* Item 2: Client Name */}
            {factoryName && (
              <>
                <span className="font-medium text-slate-700">{factoryName}</span>
                
                {/* Divider */}
                <div className="h-5 w-px bg-slate-300"></div>
              </>
            )}

            {/* Item 3: Act Name */}
            {actShortName && (
              <>
                <span className="font-medium text-blue-700">{actShortName}</span>
                
                {/* Divider */}
                <div className="h-5 w-px bg-slate-300"></div>
              </>
            )}

            {/* Item 4: Sequence Badge */}
            {actProgress && (
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                {actProgress}
              </span>
            )}
          </div>
        ) : (
          // Normal Mode: Logo + Navigation
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <ShieldCheck size={28} className="text-blue-600" />
              <h1 className="text-xl font-black text-slate-900">SHA Innovations</h1>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-6">
              {/* Intern Navigation: Three Dashboard Tabs */}
              {userRole !== 'admin' && (
                <>
                  <button
                    onClick={() => onNavigate('new-audit')}
                    className={`flex items-center gap-2 px-1 py-4 transition-all ${
                      activeTab === 'new'
                        ? 'text-blue-600 font-bold border-b-2 border-blue-600 rounded-none'
                        : 'text-slate-500 font-medium hover:text-slate-800'
                    }`}
                  >
                    <ClipboardList size={18} />
                    <span>Assigned</span>
                  </button>

                  <button
                    onClick={() => onNavigate('in-progress')}
                    className={`flex items-center gap-2 px-1 py-4 transition-all ${
                      activeTab === 'in-progress'
                        ? 'text-blue-600 font-bold border-b-2 border-blue-600 rounded-none'
                        : 'text-slate-500 font-medium hover:text-slate-800'
                    }`}
                  >
                    <Clock size={18} />
                    <span>In Progress</span>
                  </button>

                  <button
                    onClick={() => onNavigate('completed')}
                    className={`flex items-center gap-2 px-1 py-4 transition-all ${
                      activeTab === 'completed'
                        ? 'text-blue-600 font-bold border-b-2 border-blue-600 rounded-none'
                        : 'text-slate-500 font-medium hover:text-slate-800'
                    }`}
                  >
                    <CheckCircle size={18} />
                    <span>Completed</span>
                  </button>
                </>
              )}

              {/* Admin Navigation */}
              {userRole === 'admin' && (
                <>
                  <button
                    onClick={() => onNavigate('dashboard')}
                    className={`flex items-center gap-2 px-1 py-4 transition-all ${
                      activeTab === 'dashboard' || viewState === 'dashboard' || viewState === 'active-audit'
                        ? 'text-blue-600 font-bold border-b-2 border-blue-600 rounded-none'
                        : 'text-slate-500 font-medium hover:text-slate-800'
                    }`}
                  >
                    <Home size={18} />
                    <span>Audit Workspace</span>
                  </button>

                  <button
                    onClick={() => onNavigate('clients')}
                    className={`flex items-center gap-2 px-1 py-4 transition-all ${
                      activeTab === 'clients'
                        ? 'text-blue-600 font-bold border-b-2 border-blue-600 rounded-none'
                        : 'text-slate-500 font-medium hover:text-slate-800'
                    }`}
                  >
                    <Users size={18} />
                    <span>Clients</span>
                  </button>

                  <button
                    onClick={() => onNavigate('reports-list')}
                    className={`flex items-center gap-2 px-1 py-4 transition-all ${
                      viewState === 'reports-list' || viewState === 'view-report'
                        ? 'text-blue-600 font-bold border-b-2 border-blue-600 rounded-none'
                        : 'text-slate-500 font-medium hover:text-slate-800'
                    }`}
                  >
                    <FileText size={18} />
                    <span>Reports Archive</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Right Side: User Profile & Sign Out */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Normal Mode: Display User Email */}
          {!isAuditActive && userEmail && (
            <span className="text-sm text-slate-600 hidden sm:inline">{userEmail}</span>
          )}
          
          {/* Sign Out Button - Icon-only in audit mode, full button otherwise */}
          {isAuditActive ? (
            <button
              onClick={onLogout}
              className="p-2 rounded-lg text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition-all border border-slate-200 hover:border-rose-200"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut size={18} />
            </button>
          ) : (
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-full text-sm font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center gap-2 border border-slate-200 hover:border-rose-200"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          )}
        </div>
      </div>

    </nav>
  );
}
