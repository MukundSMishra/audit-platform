import React, { useState } from 'react';
import ClientManagement from './ClientManagement';
import AssignmentManager from './AssignmentManager';
import UserManagement from './UserManagement';
import AuditHistory from './AuditHistory';
import AdminNavbar from './AdminNavbar';
import { FileText } from 'lucide-react';

const AdminPortal = ({ userEmail, onLogout }) => {
  const [currentView, setCurrentView] = useState('clients');

  const renderContent = () => {
    switch (currentView) {
      case 'clients':
        return <ClientManagement />;
      
      case 'users':
        return <UserManagement />;
      
      case 'assignments':
        return <AssignmentManager />;
      
      case 'completed':
        return <AuditHistory />;
      
      case 'reports':
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FileText className="mx-auto text-gray-300 mb-4" size={64} />
            <h2 className="text-2xl font-black text-gray-900 mb-2">Synthesized Reports</h2>
            <p className="text-gray-500">Component will be created next. View and download finalized reports.</p>
          </div>
        );
      
      default:
        return <ClientManagement />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Admin Navbar */}
      <AdminNavbar 
        activeTab={currentView}
        onNavigate={setCurrentView}
        userEmail={userEmail}
        onLogout={onLogout}
      />

      {/* Main Content Area with top padding for fixed navbar */}
      <main className="pt-20 px-6">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default AdminPortal;
