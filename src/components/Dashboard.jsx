import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Plus, Building, MapPin, ArrowRight, Loader2, Calendar, FileText, ChevronRight, Shield, Clock, PlayCircle } from 'lucide-react';
import BusinessAuditCard from './BusinessAuditCard';

const Dashboard = ({ onCompanyCreated, onStartBusinessAudit, userEmail }) => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newFactory, setNewFactory] = useState({ name: '', location: '', license: '' });

  useEffect(() => {
    const fetchHistory = async () => {
      // Get unique factories (companies) from sessions with progress info
      const { data } = await supabase
        .from('audit_sessions')
        .select('id, factory_name, location, created_at, status, current_act_index, current_question_index, last_saved_at, act_id')
        .order('created_at', { ascending: false });
      
      if (data) {
        // Group by factory to get unique companies with their latest session info
        const uniqueFactories = [];
        const seen = new Set();
        data.forEach(session => {
          const key = `${session.factory_name}-${session.location}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueFactories.push(session);
          }
        });
        setHistory(uniqueFactories);
      }
    };
    fetchHistory();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Just create a factory/company record - no audit or act yet
      const { data, error } = await supabase
        .from('audit_sessions')
        .insert([{
          user_id: user.id,
          factory_name: newFactory.name,
          location: newFactory.location,
          license_number: newFactory.license,
          status: 'Planning' // Mark as in planning phase, not yet started
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Callback to parent - pass company details only
      onCompanyCreated(data.id, data.factory_name, data.location);
      setShowForm(false);
      setNewFactory({ name: '', location: '', license: '' });

    } catch (error) {
      alert("Error creating company record: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 animate-fade-in">
      
      {/* Header Section */}
      <div className="mb-10 pt-4">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Auditor Dashboard</h1>
        <p className="text-gray-500 mt-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Logged in as <span className="font-medium text-gray-700">{userEmail}</span>
        </p>
      </div>



      {/* --- THE NEW PROFESSIONAL BUTTON --- */}
      {!showForm ? (
        <button 
          onClick={() => setShowForm(true)}
          className="group relative w-full overflow-hidden rounded-2xl bg-white p-8 text-left shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 mb-12"
        >
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-6">
              {/* Elegant Icon Container */}
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white shadow-inner">
                <Plus size={32} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">Start New Factory Audit</h3>
                <p className="mt-2 text-sm text-gray-500 max-w-lg leading-relaxed">
                  Initialize a new compliance checklist session. All data will be automatically synced to the secure cloud vault.
                </p>
              </div>
            </div>
            
            {/* CTA Arrow */}
            <div className="hidden sm:flex items-center gap-2 text-sm font-bold text-blue-600 opacity-60 transform translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
              Begin Session <ArrowRight size={18} />
            </div>
          </div>
          
          {/* Subtle Accent Line */}
          <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 transition-opacity group-hover:opacity-100"></div>
        </button>
      ) : (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-lg font-bold flex items-center gap-3 text-gray-800">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Building size={20}/></div>
              Factory Details
            </h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-sm font-medium">Close</button>
          </div>
          
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Factory Name</label>
                <input 
                  placeholder="e.g. Tata Steel Unit 4" 
                  required
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                  onChange={e => setNewFactory({...newFactory, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Location</label>
                <input 
                  placeholder="e.g. Jamshedpur, Jharkhand" 
                  required
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                  onChange={e => setNewFactory({...newFactory, location: e.target.value})}
                />
              </div>
            </div>
            
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">License Number <span className="text-gray-400 font-normal">(Optional)</span></label>
                <input 
                  placeholder="e.g. LIC-2024-9988" 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                  onChange={e => setNewFactory({...newFactory, license: e.target.value})}
                />
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                {loading ? <Loader2 className="animate-spin" /> : <>Next: Choose Acts <ArrowRight size={18}/></>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History Section */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-px bg-gray-200 flex-1"></div>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Factories</span>
        <div className="h-px bg-gray-200 flex-1"></div>
      </div>
      
      <div className="grid gap-4">
        {history.map(session => {
          const hasProgress = session.current_act_index !== null || session.current_question_index !== null;
          
          const lastSavedText = session.last_saved_at 
            ? `Last saved: ${new Date(session.last_saved_at).toLocaleDateString()} ${new Date(session.last_saved_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
            : '';

          return (
            <div 
              key={session.id} 
              onClick={() => onCompanyCreated(session.id, session.factory_name, session.location)}
              className="group bg-white p-5 rounded-xl border border-gray-100 hover:border-blue-200 flex justify-between items-center cursor-pointer transition-all hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className={`w-2 h-12 rounded-full ${hasProgress ? 'bg-orange-400' : 'bg-blue-400'}`}></div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">{session.factory_name}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1"><MapPin size={12}/> {session.location}</span>
                    <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(session.created_at).toLocaleDateString()}</span>
                  </div>
                  {lastSavedText && (
                    <div className="text-xs text-gray-400 mt-1">{lastSavedText}</div>
                  )}
                </div>
            </div>
            
            <div className="flex items-center gap-6">
                <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide ${
                  hasProgress 
                    ? 'bg-orange-50 text-orange-700 border border-orange-200' 
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {hasProgress ? 'In Progress' : (session.status || 'Registered')}
                </span>
                <div className="p-2 rounded-full text-gray-300 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all">
                  {hasProgress ? <PlayCircle size={20}/> : <ChevronRight size={20}/>}
                </div>
            </div>
          </div>
          );
        })}
        
        {history.length === 0 && (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <FileText className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-400 font-medium">No factories registered yet.</p>
                <p className="text-sm text-gray-400">Create a new factory to get started with audits.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;