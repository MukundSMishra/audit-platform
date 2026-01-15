import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import Modal from '../shared/Modal';
import { 
  Search, Building2, Shield, Briefcase, 
  Clock, CheckCircle, AlertCircle, Loader2, Calendar, 
  ChevronDown, Trash2, MapPin, User
} from 'lucide-react';

const AuditHistory = () => {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    onConfirm: null,
    confirmText: '',
    cancelText: 'Close'
  });

  // Fetch all audit sessions on mount
  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_sessions')
        .select('id, factory_name, location, assigned_to, audit_type, audit_period, status, created_at, deadline, last_saved_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAudits(data || []);
    } catch (error) {
      console.error('Error fetching audits:', error);
    } finally {
      setLoading(false);
    }
  };

  // Close modal
  const closeModal = () => {
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  // Show delete confirmation
  const showDeleteConfirm = (id) => {
    setModalConfig({
      isOpen: true,
      type: 'error',
      title: 'Delete Audit Session?',
      message: 'Are you sure you want to delete this audit? This action cannot be undone, but the client record will remain safe.',
      confirmText: 'Yes, Delete Audit',
      cancelText: 'Cancel',
      onConfirm: () => executeDelete(id)
    });
  };

  // Show success message
  const showSuccess = (message) => {
    setModalConfig({
      isOpen: true,
      type: 'success',
      title: 'Success!',
      message: message,
      confirmText: 'OK',
      cancelText: '',
      onConfirm: closeModal
    });
  };

  // Show error message
  const showError = (title, message) => {
    setModalConfig({
      isOpen: true,
      type: 'error',
      title: title,
      message: message,
      confirmText: 'OK',
      cancelText: '',
      onConfirm: closeModal
    });
  };

  // Request delete confirmation
  const requestDelete = (id) => {
    showDeleteConfirm(id);
  };

  // Cancel delete
  const cancelDelete = () => {
    closeModal();
  };

  // Execute deletion
  const executeDelete = async (sessionId) => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('audit_sessions')
        .delete()
        .eq('id', sessionId);
      
      if (error) throw error;
      
      // Update UI - remove deleted audit from state
      setAudits(prev => prev.filter(audit => audit.id !== sessionId));
      setExpandedId(null);
      
      // Show success message
      showSuccess('Audit session deleted successfully.');
    } catch (error) {
      console.error('Error deleting audit:', error);
      showError('Error Deleting Audit', error.message);
    } finally {
      setDeleting(false);
    }
  };

  // Filter audits based on search and filters
  const filteredAudits = audits.filter(audit => {
    // Search filter
    const matchesSearch = !searchQuery || 
      audit.factory_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      audit.assigned_to?.toLowerCase().includes(searchQuery.toLowerCase());

    // Type filter
    const matchesType = typeFilter === 'all' || audit.audit_type === typeFilter;

    // Status filter
    const matchesStatus = statusFilter === 'all' || audit.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Get status badge styling
  const getStatusBadge = (status) => {
    const statusMap = {
      'assigned': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Assigned', icon: AlertCircle },
      'in-progress': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress', icon: Clock },
      'submitted': { bg: 'bg-green-100', text: 'text-green-700', label: 'Submitted', icon: CheckCircle }
    };
    return statusMap[status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status, icon: AlertCircle };
  };

  // Check if deadline is overdue
  const isOverdue = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  // Toggle row expansion
  const toggleRow = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Audit Registry</h1>
          <p className="text-slate-600">Master view of all audit assignments and submissions</p>
        </div>

        {/* Filters & Search Bar */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Search Input */}
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Client or intern..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full h-12 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-900"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Audit Type
              </label>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium text-slate-900 cursor-pointer appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em'
                }}
              >
                <option value="all">All Types</option>
                <option value="regulatory">Regulatory</option>
                <option value="business">Business</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium text-slate-900 cursor-pointer appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em'
                }}
              >
                <option value="all">All Status</option>
                <option value="assigned">Assigned</option>
                <option value="in-progress">In Progress</option>
                <option value="submitted">Submitted</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audits List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-slate-600">Loading audits...</p>
            </div>
          </div>
        ) : filteredAudits.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
            <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-900 mb-2">No audits found</h3>
            <p className="text-slate-600">
              {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'No audit assignments yet'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredAudits.map(audit => {
              const statusBadge = getStatusBadge(audit.status);
              const StatusIcon = statusBadge.icon;
              const isBusinessAudit = audit.audit_type === 'business';
              const deadlineOverdue = isOverdue(audit.deadline);
              const isExpanded = expandedId === audit.id;

              return (
                <div
                  key={audit.id}
                  className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  {/* Top Section - Clickable Trigger */}
                  <div
                    onClick={() => toggleRow(audit.id)}
                    className="flex items-center justify-between gap-4 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    
                    {/* Firm Name & Location */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">{audit.factory_name}</h3>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <MapPin size={12} />
                        <span className="truncate">{audit.location}</span>
                      </div>
                    </div>

                    {/* Audit Type Badge */}
                    <div className="flex-shrink-0">
                      {isBusinessAudit ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                          <Briefcase size={11} />
                          Business
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                          <Shield size={11} />
                          Regulatory
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="flex-shrink-0">
                      <div className={`inline-flex items-center gap-1 px-2.5 py-1 ${statusBadge.bg} ${statusBadge.text} rounded-full text-xs font-bold`}>
                        <StatusIcon size={11} />
                        {statusBadge.label}
                      </div>
                    </div>

                    {/* Deadline */}
                    <div className="flex-shrink-0 w-32 text-right">
                      {audit.deadline ? (
                        <div className={`text-xs font-medium ${deadlineOverdue ? 'text-red-600' : 'text-slate-600'}`}>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Deadline</div>
                          {new Date(audit.deadline).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No deadline</span>
                      )}
                    </div>

                    {/* Chevron Icon */}
                    <div className="flex-shrink-0">
                      <ChevronDown
                        size={20}
                        className={`text-slate-400 transition-transform duration-200 ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Bottom Section - Expandable Details */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50 p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        
                        {/* Intern Avatar/Name */}
                        <div>
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assigned To</div>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                              {audit.assigned_to?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{audit.assigned_to?.split('@')[0] || 'Unknown'}</div>
                              <div className="text-xs text-slate-600">{audit.assigned_to}</div>
                            </div>
                          </div>
                        </div>

                        {/* Audit Period */}
                        <div>
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Audit Period</div>
                          <div className="font-medium text-slate-900 flex items-center gap-2">
                            <Calendar size={16} className="text-slate-400" />
                            <span>{audit.audit_period || 'Not specified'}</span>
                          </div>
                        </div>

                        {/* Created Date */}
                        <div>
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Created</div>
                          <div className="font-medium text-slate-900 flex items-center gap-2">
                            <Clock size={16} className="text-slate-400" />
                            <span>
                              {new Date(audit.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Last Saved */}
                        {audit.last_saved_at && (
                          <div>
                            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Last Saved</div>
                            <div className="font-medium text-slate-900 flex items-center gap-2">
                              <CheckCircle size={16} className="text-slate-400" />
                              <span>
                                {new Date(audit.last_saved_at).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Audit ID */}
                        <div>
                          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Audit ID</div>
                          <div className="font-mono text-xs bg-white px-3 py-2 rounded border border-slate-200 text-slate-900">
                            {audit.id.substring(0, 18)}...
                          </div>
                        </div>
                      </div>

                      {/* Delete Button - Bottom Right */}
                      <div className="flex items-center justify-end pt-4 border-t border-slate-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            requestDelete(audit.id);
                          }}
                          disabled={deleting}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg font-bold transition-colors"
                        >
                          <Trash2 size={16} />
                          Delete Audit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Summary */}
        {!loading && filteredAudits.length > 0 && (
          <div className="mt-6 text-center text-sm text-slate-600">
            Showing {filteredAudits.length} of {audits.length} audits
          </div>
        )}
      </div>

      {/* Unified Modal System */}
      <Modal
        isOpen={modalConfig.isOpen}
        onClose={closeModal}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        onConfirm={modalConfig.onConfirm}
        isLoading={deleting}
      />
    </div>
  );
};

export default AuditHistory;
