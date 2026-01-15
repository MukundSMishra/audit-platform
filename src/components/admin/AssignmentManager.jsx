import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import Modal from '../shared/Modal';
import { 
  ClipboardCheck, Building2, Users, Calendar, 
  Shield, Briefcase, Loader2, CheckCircle
} from 'lucide-react';

const AssignmentManager = () => {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [interns, setInterns] = useState([]);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'OK',
    onConfirm: null
  });
  
  const [formData, setFormData] = useState({
    clientId: '',
    internEmail: '',
    auditType: 'regulatory',
    tenureStart: '',
    tenureEnd: '',
    deadline: ''
  });

  // Fetch clients and interns on mount
  useEffect(() => {
    fetchClients();
    fetchInterns();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, company_name, city, state')
        .order('company_name', { ascending: true });
      
      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchInterns = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, email, full_name')
        .eq('role', 'intern')
        .order('full_name', { ascending: true });
      
      if (error) throw error;
      setInterns(data || []);
    } catch (error) {
      console.error('Error fetching interns:', error);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.clientId) {
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Missing Selection',
        message: 'Please select a client.',
        confirmText: 'OK',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    
    if (!formData.internEmail) {
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Missing Selection',
        message: 'Please select an intern.',
        confirmText: 'OK',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    
    if (!formData.tenureStart || !formData.tenureEnd) {
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Missing Dates',
        message: 'Please enter both start and end dates for the audit period.',
        confirmText: 'OK',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    
    if (new Date(formData.tenureStart) >= new Date(formData.tenureEnd)) {
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Invalid Date Range',
        message: 'End date must be after start date.',
        confirmText: 'OK',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    
    if (!formData.deadline) {
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Missing Deadline',
        message: 'Please select a submission deadline.',
        confirmText: 'OK',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Find selected client and intern
      const selectedClient = clients.find(c => c.id === formData.clientId);
      const selectedIntern = interns.find(i => i.email === formData.internEmail);
      
      if (!selectedClient || !selectedIntern) {
        throw new Error('Selected client or intern not found');
      }
      
      // Combine tenure dates into audit period string
      const auditPeriod = `${formData.tenureStart} to ${formData.tenureEnd}`;
      
      // Insert into audit_sessions
      const { data, error } = await supabase
        .from('audit_sessions')
        .insert([{
          client_id: selectedClient.id,
          factory_name: selectedClient.company_name,
          location: `${selectedClient.city}, ${selectedClient.state}`,
          user_email: selectedIntern.email,
          user_id: selectedIntern.id,
          assigned_to: selectedIntern.email,
          audit_type: formData.auditType,
          audit_period: auditPeriod,
          deadline: formData.deadline,
          status: 'assigned',
          created_at: new Date().toISOString()
        }])
        .select();
      
      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }
      
      console.log('Audit assigned successfully:', data);
      
      // Success - show modal
      setModalConfig({
        isOpen: true,
        type: 'success',
        title: 'Assignment Dispatched',
        message: `Successfully assigned audit to ${selectedIntern.full_name || 'the intern'}.`,
        confirmText: 'Done',
        onConfirm: () => {
          setModalConfig(prev => ({ ...prev, isOpen: false }));
          // Reset form
          setFormData({
            clientId: '',
            internEmail: '',
            auditType: 'regulatory',
            tenureStart: '',
            tenureEnd: '',
            deadline: ''
          });
        }
      });
      
    } catch (error) {
      console.error('Error assigning audit:', error);
      setModalConfig({
        isOpen: true,
        type: 'error',
        title: 'Assignment Failed',
        message: error.message || 'Something went wrong.',
        confirmText: 'Try Again',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedClient = clients.find(c => c.id === formData.clientId);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Centered Card Form */}
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-8 py-6 border-b border-slate-200">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-600 rounded-xl text-white">
                <ClipboardCheck size={28} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">Assign New Audit</h2>
                <p className="text-sm text-slate-600 mt-1">Select a client and an intern to dispatch a new task</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleAssign} className="p-8 space-y-6">
            
            {/* Row 1: Client | Intern */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Select Client */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Client <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <select
                    value={formData.clientId}
                    onChange={e => setFormData({...formData, clientId: e.target.value})}
                    className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium text-slate-900 cursor-pointer appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em'
                    }}
                    required
                  >
                    <option value="">Choose a factory...</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.company_name} ({client.city}, {client.state})
                      </option>
                    ))}
                  </select>
                </div>
                {selectedClient && (
                  <p className="text-xs text-slate-500 mt-2">
                    📍 {selectedClient.city}, {selectedClient.state}
                  </p>
                )}
              </div>

              {/* Select Intern */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Intern <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <select
                    value={formData.internEmail}
                    onChange={e => setFormData({...formData, internEmail: e.target.value})}
                    className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium text-slate-900 cursor-pointer appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em'
                    }}
                    required
                  >
                    <option value="">Choose an intern...</option>
                    {interns.map(intern => (
                      <option key={intern.email} value={intern.email}>
                        {intern.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Row 2: Audit Type | Deadline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Audit Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Audit Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, auditType: 'regulatory'})}
                    className={`h-12 px-4 rounded-lg border-2 font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                      formData.auditType === 'regulatory'
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Shield size={16} />
                    Regulatory
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, auditType: 'business'})}
                    className={`h-12 px-4 rounded-lg border-2 font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                      formData.auditType === 'business'
                        ? 'bg-purple-50 border-purple-500 text-purple-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Briefcase size={16} />
                    Business
                  </button>
                </div>
              </div>

              {/* Submission Deadline */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Submission Deadline <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={e => setFormData({...formData, deadline: e.target.value})}
                    className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium text-slate-900"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Row 3: Audit Tenure (Start & End Dates) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Audit Period (Tenure) <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">Start Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="date"
                      value={formData.tenureStart}
                      onChange={e => setFormData({...formData, tenureStart: e.target.value})}
                      className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium text-slate-900"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">End Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="date"
                      value={formData.tenureEnd}
                      onChange={e => setFormData({...formData, tenureEnd: e.target.value})}
                      className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium text-slate-900"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-slate-200">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Assigning...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Assign Audit
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Unified Modal System */}
      <Modal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
        onConfirm={modalConfig.onConfirm}
      />
    </div>
  );
};

export default AssignmentManager;
