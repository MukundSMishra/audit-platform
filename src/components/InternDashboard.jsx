import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { Plus, Building, MapPin, ArrowRight, Loader2, Calendar, FileText, ChevronRight, Shield, Clock, PlayCircle, Briefcase, ClipboardList } from 'lucide-react';

const InternDashboard = ({ 
  userEmail,
  activeTab = 'new', // Controlled by parent (InternPortal)
  onStartRegulatoryAudit, 
  onStartBusinessAudit, 
  onResumeSession, 
  onViewReport 
}) => {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [startingSessionId, setStartingSessionId] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Get current authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        console.log('DEBUG: Current User Email:', user?.email);
        
        if (!user) {
          console.warn('DEBUG: No authenticated user found');
          return;
        }
        
        // Fetch all sessions assigned to this user
        console.log('DEBUG: Fetching audit_sessions for:', user.email);
        const { data, error } = await supabase
          .from('audit_sessions')
          .select('id, factory_name, location, created_at, status, current_act_index, current_question_index, last_saved_at, act_id, audit_type, audit_period, license_number, assigned_to')
          .eq('assigned_to', user.email) // Explicitly filter by assigned_to
          .order('created_at', { ascending: false });
        
        // Log fetch result with FULL error details
        if (error) {
          console.error('DEBUG: Supabase Error (Full Details):', {
            message: error.message,
            code: error.code,
            status: error.status,
            details: error.details,
            hint: error.hint
          });
          
          // FALLBACK: Try fetching ALL sessions without filter to test RLS
          console.log('DEBUG: Attempting fallback - fetching ALL audit_sessions (no filter)...');
          const { data: allData, error: allError } = await supabase
            .from('audit_sessions')
            .select('id, factory_name, location, assigned_to, status, user_email')
            .order('created_at', { ascending: false });
          
          if (allError) {
            console.error('DEBUG: Fallback query also failed:', allError.message);
          } else {
            console.log('DEBUG: Fallback SUCCESS - All sessions count:', allData?.length || 0);
            console.log('DEBUG: Fallback data sample:', allData?.slice(0, 3));
            // Try filtering in memory
            const filtered = (allData || []).filter(s => s.assigned_to === user.email);
            console.log('DEBUG: After in-memory filter for', user.email, ':', filtered.length, 'sessions');
            setHistory(filtered);
          }
          return;
        }
        
        console.log('DEBUG: Fetched Data:', data);
        console.log('DEBUG: Total audits fetched:', data?.length || 0);
        
        if (data) {
          setHistory(data);
          // Log breakdown by status
          const breakdown = {
            assigned: data.filter(s => s.status === 'assigned').length,
            inProgress: data.filter(s => s.status === 'in-progress').length,
            submitted: data.filter(s => s.status === 'submitted' || s.status === 'completed').length
          };
          console.log('DEBUG: Status Breakdown:', breakdown);
        }
      } catch (err) {
        console.error('DEBUG: Unexpected error in fetchHistory:', err);
      }
    };
    
    fetchHistory();
  }, []);

  const handleStartAssigned = async (session) => {
    setStartingSessionId(session.id);
    
    try {
      // Update session status to 'in-progress'
      const { data, error } = await supabase
        .from('audit_sessions')
        .update({
          status: 'in-progress'
        })
        .eq('id', session.id)
        .select();

      if (error) {
        console.error('Error updating session:', error);
        throw error;
      }
      
      const updatedSession = data[0];
      console.log('Audit session started:', updatedSession);
      
      // Route to appropriate audit workflow based on audit_type
      if (session.audit_type === 'business') {
        onStartBusinessAudit(updatedSession);
      } else {
        onStartRegulatoryAudit(updatedSession);
      }

    } catch (error) {
      console.error('Error starting audit session:', error);
      alert("Error starting audit session: " + error.message);
    } finally {
      setStartingSessionId(null);
    }
  };

  // Filter history by status with case-insensitive email matching
  const assignedSessions = history.filter(s => {
    const isAssignedStatus = s.status === 'assigned' || s.status === 'pending';
    const isAssignedToMe = s.assigned_to?.toLowerCase() === userEmail?.toLowerCase();
    console.log(`DEBUG: Session ${s.id} - status: ${s.status}, assigned_to: ${s.assigned_to}, userEmail: ${userEmail}, matches: ${isAssignedStatus && isAssignedToMe}`);
    return isAssignedStatus && isAssignedToMe;
  });
  const inProgressSessions = history.filter(s => s.status === 'in-progress');
  const completedSessions = history.filter(s => s.status === 'submitted' || s.status === 'completed');
  
  console.log('DEBUG: Assigned Sessions Count:', assignedSessions.length);
  console.log('DEBUG: In Progress Sessions Count:', inProgressSessions.length);
  console.log('DEBUG: Completed Sessions Count:', completedSessions.length);

  const renderNewAuditTab = () => (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-px bg-gray-200 flex-1"></div>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Assigned Audits</span>
        <div className="h-px bg-gray-200 flex-1"></div>
      </div>
      
      <div className="grid gap-4">
        {assignedSessions.map(session => {
          const isStarting = startingSessionId === session.id;
          
          return (
            <div 
              key={session.id} 
              className="group bg-white p-6 rounded-xl border-2 border-blue-100 hover:border-blue-300 transition-all hover:shadow-lg"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {/* Header: Factory Name & Location */}
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{session.factory_name}</h3>
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin size={14} />
                      <span className="text-sm">{session.location}</span>
                    </div>
                  </div>
                  
                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Audit Period */}
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Audit Period</div>
                      <div className="text-sm text-slate-900 font-medium flex items-center gap-1">
                        <Calendar size={14} className="text-slate-400" />
                        {session.audit_period || 'Not specified'}
                      </div>
                    </div>
                    
                    {/* Audit Type */}
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Audit Type</div>
                      <div>
                        {session.audit_type === 'business' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                            <Briefcase size={12} />
                            Business Risk
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                            <Shield size={12} />
                            Regulatory Risk
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* License Number */}
                    <div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">License No.</div>
                      <div className="text-sm text-slate-900 font-medium">
                        {session.license_number || 'N/A'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Assigned Date */}
                  <div className="text-xs text-slate-400">
                    Assigned on {new Date(session.created_at).toLocaleDateString('en-IN', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </div>
                </div>
                
                {/* Action Button */}
                <div className="ml-6">
                  <button
                    onClick={() => handleStartAssigned(session)}
                    disabled={isStarting}
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isStarting ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Starting...
                      </>
                    ) : (
                      <>
                        <PlayCircle size={18} />
                        Start Audit
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        
        {assignedSessions.length === 0 && (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <ClipboardList className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-400 font-medium">No audits assigned yet.</p>
            <p className="text-sm text-gray-400 mt-1">Your admin will assign audits to you when they're ready.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderInProgressTab = () => (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-px bg-gray-200 flex-1"></div>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">In Progress Audits</span>
        <div className="h-px bg-gray-200 flex-1"></div>
      </div>
      
      <div className="grid gap-4">
        {inProgressSessions.map(session => {
          const lastSavedText = session.last_saved_at 
            ? `Last saved: ${new Date(session.last_saved_at).toLocaleDateString()} ${new Date(session.last_saved_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
            : '';

          return (
            <div 
              key={session.id} 
              className="group bg-white p-5 rounded-xl border border-gray-100 hover:border-orange-200 flex justify-between items-center transition-all hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="w-2 h-12 rounded-full bg-orange-400"></div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">{session.factory_name}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1"><MapPin size={12}/> {session.location}</span>
                    <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(session.created_at).toLocaleDateString()}</span>
                  </div>
                  {lastSavedText && (
                    <div className="text-xs text-gray-400 mt-1">{lastSavedText}</div>
                  )}
                  {session.current_act_index !== null && (
                    <div className="text-xs text-orange-600 font-semibold mt-1">
                      Current Progress: Act {session.current_act_index + 1}, Question {(session.current_question_index || 0) + 1}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onResumeSession(session)}
                  className="px-4 py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-all flex items-center gap-2"
                >
                  <PlayCircle size={16} /> Resume
                </button>
              </div>
            </div>
          );
        })}
        
        {inProgressSessions.length === 0 && (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <Clock className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-400 font-medium">No audits in progress.</p>
            <p className="text-sm text-gray-400">Start an assigned audit to begin working.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderCompletedTab = () => (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-px bg-gray-200 flex-1"></div>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Completed Audits</span>
        <div className="h-px bg-gray-200 flex-1"></div>
      </div>
      
      <div className="grid gap-4">
        {completedSessions.map(session => {
          const lastSavedText = session.last_saved_at 
            ? `Completed: ${new Date(session.last_saved_at).toLocaleDateString()} ${new Date(session.last_saved_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
            : '';

          return (
            <div 
              key={session.id} 
              className="group bg-white p-5 rounded-xl border border-gray-100 hover:border-emerald-200 flex justify-between items-center transition-all hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="w-2 h-12 rounded-full bg-emerald-500"></div>
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
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onViewReport(session.id)}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-all flex items-center gap-2"
                >
                  <FileText size={16} /> View Report
                </button>
              </div>
            </div>
          );
        })}
        
        {completedSessions.length === 0 && (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <FileText className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-400 font-medium">No completed audits yet.</p>
            <p className="text-sm text-gray-400">Complete an audit to view its generated report.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto p-6 animate-fade-in">
      {/* Tab Content */}
      {activeTab === 'new' && renderNewAuditTab()}
      {activeTab === 'in-progress' && renderInProgressTab()}
      {activeTab === 'completed' && renderCompletedTab()}
    </div>
  );
};

export default InternDashboard;
