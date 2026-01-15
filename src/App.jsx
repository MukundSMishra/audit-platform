import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// Services
import { supabase } from './services/supabaseClient';
import { checkUserRole } from './utils/authHelpers';

// Components
import Login from './components/Login';

// Layouts
import InternPortal from './layouts/InternPortal';
import AdminPortal from './components/admin/AdminPortal';

function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);

  // AUTH Check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) { 
        setUserRole(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Check user role after authentication
  useEffect(() => {
    const checkRole = async () => {
      if (session) {
        setRoleLoading(true);
        const role = await checkUserRole();
        // Normalize role: trim whitespace and convert to lowercase
        const cleanRole = role ? role.trim().toLowerCase() : null;
        setUserRole(cleanRole);
        console.log('User role:', cleanRole);
        setRoleLoading(false);
      } else {
        setUserRole(null);
        setRoleLoading(false);
      }
    };
    checkRole();
  }, [session]);

  // Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserRole(null);
  };

  // ============================================================================
  // ROUTER - Redirect to appropriate portal based on role
  // ============================================================================
  
  // Not authenticated
  if (!session) return <Login />;
  
  // Loading role
  if (roleLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Admin Portal
  if (userRole === 'admin') {
    return <AdminPortal 
      userEmail={session.user.email} 
      onLogout={handleLogout} 
    />;
  }

  // Intern Portal
  if (userRole === 'intern') {
    return (
      <InternPortal 
        session={session} 
        userRole={userRole} 
        onLogout={handleLogout} 
      />
    );
  }

  // Fallback for invalid or missing role
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-6 bg-white rounded-xl border border-slate-200">
        <h2 className="text-2xl font-black text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-6">No role assigned to your account. Please contact support.</p>
        <button
          onClick={handleLogout}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default App;