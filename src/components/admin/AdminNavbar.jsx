import React from 'react';
import { ShieldCheck, LogOut, Building2, Users, ClipboardCheck, CheckCircle2, FileText } from 'lucide-react';

/**
 * AdminNavbar Component
 * Fixed top navigation bar for admin portal
 */
export default function AdminNavbar({
  activeTab,
  onNavigate,
  userEmail,
  onLogout
}) {
  const navigationItems = [
    { id: 'clients', label: 'Clients', icon: Building2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'assignments', label: 'Assign', icon: ClipboardCheck },
    { id: 'completed', label: 'History', icon: CheckCircle2 },
    { id: 'reports', label: 'Reports', icon: FileText }
  ];

  return (
    <nav className="h-16 w-full fixed top-0 left-0 z-50 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center justify-between w-full gap-6">
        
        {/* Left Group: Logo + Navigation Tabs */}
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <ShieldCheck size={28} className="text-blue-600" />
            <h1 className="text-xl font-black text-slate-900">SHA Innovations</h1>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1">
            {navigationItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-3 h-16 transition-all text-sm font-semibold ${
                    isActive
                      ? 'text-blue-700 border-b-2 border-blue-600 rounded-none'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Group: User Email + Logout */}
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600 font-medium max-w-[200px] truncate hidden lg:block">
            {userEmail}
          </span>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-bold transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
