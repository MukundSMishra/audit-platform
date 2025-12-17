import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { MapPin, Calendar, PlayCircle, ChevronRight, FileText, Building, ArrowRight, Loader2, Plus } from 'lucide-react';

const FactoryHistorySection = ({ firmName, onSelectFactory }) => {
  const [history, setHistory] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newFactory, setNewFactory] = useState({ name: '', location: '', license: '' });

  useEffect(() => {
    fetchHistory();
  }, []);

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

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Create a factory/company record
      const { data, error } = await supabase
        .from('audit_sessions')
        .insert([{
          user_id: user.id,
          factory_name: newFactory.name,
          location: newFactory.location,
          license_number: newFactory.license,
          status: 'Planning'
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Callback to parent
      onSelectFactory(data.id, data.factory_name, data.location);
      setShowForm(false);
      setNewFactory({ name: '', location: '', license: '' });
      fetchHistory();

    } catch (error) {
      alert("Error creating factory record: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (history.length === 0 && !showForm) {
    return null; // Don't show empty section
  }

  return (
    <div className="max-w-6xl mx-auto px-8 pt-8">
      {/* Add New Factory Button */}
      {!showForm && (
        <button 
          onClick={() => setShowForm(true)}
          className="group relative w-full overflow-hidden rounded-2xl bg-white p-6 text-left shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-lg hover:border-blue-300 hover:-translate-y-1 mb-8"
        >
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white shadow-inner">
                <Plus size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">Start New Factory Audit</h3>
                <p className="mt-1 text-sm text-gray-500 max-w-lg leading-relaxed">
                  Register a new factory for regulatory compliance audit
                </p>
              </div>
            </div>
            
            <div className="hidden sm:flex items-center gap-2 text-sm font-bold text-blue-600 opacity-60 transform translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
              Begin <ArrowRight size={18} />
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 transition-opacity group-hover:opacity-100"></div>
        </button>
      )}

      {/* Factory Form */}
      {showForm && (
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                  value={newFactory.name}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                  onChange={e => setNewFactory({...newFactory, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Location</label>
                <input 
                  placeholder="e.g. Jamshedpur, Jharkhand" 
                  required
                  value={newFactory.location}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                  onChange={e => setNewFactory({...newFactory, location: e.target.value})}
                />
              </div>
            </div>
            
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">License Number <span className="text-gray-400 font-normal">(Optional)</span></label>
                <input 
                  placeholder="e.g. LIC-2024-9988"
                  value={newFactory.license}
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
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <>Next: Choose Acts <ArrowRight size={18}/></>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Factory History */}
      {history.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-px bg-gray-200 flex-1"></div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">In Progress Factory Audits</span>
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
                  onClick={() => onSelectFactory(session.id, session.factory_name, session.location)}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default FactoryHistorySection;
