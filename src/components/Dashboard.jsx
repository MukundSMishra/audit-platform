import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Plus, Building, MapPin, ArrowRight, Loader2, Calendar, FileText, ChevronRight, Shield } from 'lucide-react';
import { AVAILABLE_ACTS } from '../data/actRegistry';

const Dashboard = ({ onStartAudit, userEmail }) => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newFactory, setNewFactory] = useState({ name: '', location: '', license: '', act_id: '' });

  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('audit_sessions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) setHistory(data);
    };
    fetchHistory();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('audit_sessions')
        .insert([{
          user_id: user.id,
          factory_name: newFactory.name,
          location: newFactory.location,
          license_number: newFactory.license,
          act_id: newFactory.act_id,
          status: 'In Progress'
        }])
        .select()
        .single();

      if (error) throw error;
      onStartAudit(data.id, data.factory_name, data.act_id);

    } catch (error) {
      alert("Error starting audit: " + error.message);
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
              New Audit Details
            </h2>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-sm font-medium">Close</button>
          </div>
          
          <form onSubmit={handleCreate} className="space-y-6">
            {/* Act Selection - FIRST FIELD */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
              <label className="block text-sm font-bold text-blue-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Shield size={18} className="text-blue-600"/>
                Select Compliance Act
              </label>
              <select
                required
                value={newFactory.act_id}
                onChange={e => setNewFactory({...newFactory, act_id: e.target.value})}
                className="w-full p-4 bg-white border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-semibold text-gray-700 cursor-pointer hover:border-blue-400"
              >
                <option value="">-- Choose Act / Rules to Audit --</option>
                {AVAILABLE_ACTS.map(act => (
                  <option key={act.id} value={act.id}>
                    {act.name} ({act.data.length} audit items)
                  </option>
                ))}
              </select>
              {newFactory.act_id && (
                <p className="mt-3 text-sm text-blue-700 bg-blue-100 p-3 rounded-lg border border-blue-200">
                  📋 {AVAILABLE_ACTS.find(a => a.id === newFactory.act_id)?.description}
                </p>
              )}
            </div>

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
                {loading ? <Loader2 className="animate-spin" /> : <>Launch Audit <ArrowRight size={18}/></>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History Section */}
      <div className="flex items-center gap-4 mb-6">
        <div className="h-px bg-gray-200 flex-1"></div>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recent Activity</span>
        <div className="h-px bg-gray-200 flex-1"></div>
      </div>
      
      <div className="grid gap-4">
        {history.map(session => {
          const actInfo = AVAILABLE_ACTS.find(act => act.id === session.act_id);
          return (
            <div 
              key={session.id} 
              onClick={() => onStartAudit(session.id, session.factory_name, session.act_id)}
              className="group bg-white p-5 rounded-xl border border-gray-100 hover:border-blue-200 flex justify-between items-center cursor-pointer transition-all hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className={`w-2 h-12 rounded-full ${session.status === 'Completed' ? 'bg-green-500' : 'bg-yellow-400'}`}></div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">{session.factory_name}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1"><MapPin size={12}/> {session.location}</span>
                    <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(session.created_at).toLocaleDateString()}</span>
                    {actInfo && (
                      <span className="flex items-center gap-1 text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        <Shield size={12}/> {actInfo.shortName}
                      </span>
                    )}
                  </div>
                </div>
            </div>
            
            <div className="flex items-center gap-6">
                <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wide ${
                    session.status === 'Completed' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                }`}>
                {session.status}
                </span>
                <div className="p-2 rounded-full text-gray-300 group-hover:text-blue-600 group-hover:bg-blue-50 transition-all">
                  <ChevronRight size={20}/>
                </div>
            </div>
          </div>
          );
        })}
        
        {history.length === 0 && (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                <FileText className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-400 font-medium">No audit history found.</p>
                <p className="text-sm text-gray-400">Your completed sessions will appear here.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;