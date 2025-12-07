import React, { useState } from 'react';
import AdminDashboard from './AdminDashboard';
import InternManagement from './InternManagement';
import ClientManagement from './ClientManagement';
import { 
  LayoutDashboard, Users, Building2, ClipboardCheck, 
  BarChart3, Settings, LogOut, Menu, X 
} from 'lucide-react';

const AdminPortal = ({ userEmail, onLogout }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-600' },
    { id: 'interns', label: 'Interns', icon: Users, color: 'text-purple-600' },
    { id: 'clients', label: 'Clients', icon: Building2, color: 'text-emerald-600' },
    { id: 'assignments', label: 'Assignments', icon: ClipboardCheck, color: 'text-amber-600' },
    { id: 'reports', label: 'Reports', icon: BarChart3, color: 'text-rose-600' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'text-gray-600' }
  ];

  const NavItem = ({ item }) => {
    const isActive = currentView === item.id;
    const Icon = item.icon;

    return (
      <button
        onClick={() => setCurrentView(item.id)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
          isActive
            ? 'bg-blue-50 text-blue-700 font-bold shadow-sm'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <Icon 
          size={20} 
          className={`${isActive ? item.color : 'text-gray-400 group-hover:text-gray-600'}`}
          strokeWidth={isActive ? 2.5 : 2}
        />
        <span className={`${isActive ? 'font-bold' : 'font-medium'}`}>
          {item.label}
        </span>
        {isActive && (
          <div className="ml-auto w-2 h-2 rounded-full bg-blue-600"></div>
        )}
      </button>
    );
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <AdminDashboard userEmail={userEmail} />;
      case 'interns':
        return <InternManagement />;
      case 'clients':
        return <ClientManagement />;
      case 'assignments':
        return (
          <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <ClipboardCheck className="mx-auto text-gray-300 mb-4" size={64} />
                <h2 className="text-2xl font-black text-gray-900 mb-2">Assignments Module</h2>
                <p className="text-gray-500">Coming soon! This will allow you to assign audits to interns.</p>
              </div>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <BarChart3 className="mx-auto text-gray-300 mb-4" size={64} />
                <h2 className="text-2xl font-black text-gray-900 mb-2">Reports & Analytics</h2>
                <p className="text-gray-500">Coming soon! View detailed analytics and generate reports.</p>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
              <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                <Settings className="mx-auto text-gray-300 mb-4" size={64} />
                <h2 className="text-2xl font-black text-gray-900 mb-2">System Settings</h2>
                <p className="text-gray-500">Coming soon! Configure system preferences and settings.</p>
              </div>
            </div>
          </div>
        );
      default:
        return <AdminDashboard userEmail={userEmail} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-50 ${
        sidebarOpen ? 'w-64' : 'w-0'
      } overflow-hidden`}>
        
        {/* Logo Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <span className="text-white font-black text-sm">A</span>
            </div>
            <span className="font-black text-gray-900">Admin Portal</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Minimize sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map(item => (
            <NavItem key={item.id} item={item} />
          ))}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">
              {userEmail?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-gray-900 truncate">Admin</div>
              <div className="text-xs text-gray-500 truncate">{userEmail}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-bold hover:bg-red-100 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${
        sidebarOpen ? 'lg:ml-64' : 'ml-0'
      }`}>
        
        {/* Header with Menu Toggle */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(true)}
            className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${
              sidebarOpen ? 'invisible' : 'visible'
            }`}
            title="Expand sidebar"
          >
            <Menu size={24} />
          </button>
          <span className="font-black text-gray-900 lg:hidden">Admin Portal</span>
          <div className="w-10"></div>
        </div>

        {/* Content Area */}
        <div className="h-full overflow-y-auto">
          {renderContent()}
        </div>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminPortal;
