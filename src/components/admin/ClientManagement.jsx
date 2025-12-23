import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import Modal from '../shared/Modal';
import { 
  Building2, Plus, Search, Edit2, MapPin, Mail, Phone,
  Calendar, CheckCircle, XCircle, AlertCircle, Loader2,
  ArrowLeft, Save, Factory, TrendingUp, Shield, Briefcase
} from 'lucide-react';

const ClientManagement = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
    audit_types: []
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*, factories(count)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate at least one audit type is selected
    if (!formData.audit_types || formData.audit_types.length === 0) {
      alert('Please select at least one audit type');
      return;
    }
    
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (editingClient) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingClient.id);

        if (error) throw error;

        await supabase.rpc('log_activity', {
          p_action: 'updated_client',
          p_entity_type: 'client',
          p_entity_id: editingClient.id,
          p_details: { company_name: formData.company_name }
        });

        setSuccessMessage('Client updated successfully!');
        setShowSuccessModal(true);
      } else {
        // Create new client
        const { data, error } = await supabase
          .from('clients')
          .insert([{
            ...formData,
            created_by: user.id
          }])
          .select()
          .single();

        if (error) throw error;

        await supabase.rpc('log_activity', {
          p_action: 'created_client',
          p_entity_type: 'client',
          p_entity_id: data.id,
          p_details: { company_name: formData.company_name }
        });

        setSuccessMessage('Client created successfully!');
        setShowSuccessModal(true);
      }

      handleCancelForm();
      fetchClients();
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Error saving client: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      company_name: client.company_name || '',
      contact_person: client.contact_person || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      city: client.city || '',
      state: client.state || '',
      pincode: client.pincode || '',
      gstin: client.gstin || '',
      audit_types: Array.isArray(client.audit_types) ? client.audit_types : (client.audit_type ? [client.audit_type] : [])
    });
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingClient(null);
    setFormData({
      company_name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      gstin: '',
      audit_types: []
    });
  };

  const toggleAuditType = (auditType) => {
    setFormData(prevData => {
      const currentTypes = prevData.audit_types || [];
      const isSelected = currentTypes.includes(auditType);
      
      if (isSelected) {
        // Deselect: remove from array
        return { ...prevData, audit_types: currentTypes.filter(type => type !== auditType) };
      } else {
        // Select: add to array
        return { ...prevData, audit_types: [...currentTypes, auditType] };
      }
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      trial: 'bg-blue-100 text-blue-700 border-blue-200',
      expired: 'bg-red-100 text-red-700 border-red-200',
      cancelled: 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return styles[status] || styles.trial;
  };

  const getTierBadge = (tier) => {
    const styles = {
      trial: 'bg-slate-100 text-slate-700',
      basic: 'bg-blue-100 text-blue-700',
      professional: 'bg-purple-100 text-purple-700',
      enterprise: 'bg-amber-100 text-amber-700'
    };
    return styles[tier] || styles.trial;
  };

  const filteredClients = clients.filter(client =>
    client.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (showForm) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={handleCancelForm}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-bold mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to List
          </button>

          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h2 className="text-2xl font-black text-gray-900 mb-6">
              {editingClient ? 'Edit Client' : 'Add New Client'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Company Information</h3>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="ABC Manufacturing Ltd."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Contact Person</label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">GSTIN</label>
                    <input
                      type="text"
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="22AAAAA0000A1Z5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="contact@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Address</h3>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Street Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    placeholder="Building name, street, area"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Mumbai"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Maharashtra"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Pincode</label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="400001"
                    />
                  </div>
                </div>
              </div>

              {/* Audit Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Audit Configuration</h3>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-3">
                    Audit Types * <span className="text-gray-500 font-normal text-xs">(Select one or more)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => toggleAuditType('regulatory')}
                      className={`p-4 rounded-xl border-2 transition-all relative ${
                        formData.audit_types?.includes('regulatory')
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {formData.audit_types?.includes('regulatory') && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="text-blue-600" size={20} strokeWidth={3} />
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${
                          formData.audit_types?.includes('regulatory') ? 'bg-blue-500' : 'bg-gray-200'
                        }`}>
                          <Shield className={formData.audit_types?.includes('regulatory') ? 'text-white' : 'text-gray-500'} size={24} />
                        </div>
                        <span className={`font-bold text-lg ${
                          formData.audit_types?.includes('regulatory') ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          Regulatory Risk
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 text-left">Labour laws, environmental regulations & state-specific compliance</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleAuditType('business')}
                      className={`p-4 rounded-xl border-2 transition-all relative ${
                        formData.audit_types?.includes('business')
                          ? 'border-purple-500 bg-purple-50 shadow-md'
                          : 'border-gray-300 hover:border-purple-300'
                      }`}
                    >
                      {formData.audit_types?.includes('business') && (
                        <div className="absolute top-2 right-2">
                          <CheckCircle className="text-purple-600" size={20} strokeWidth={3} />
                        </div>
                      )}
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${
                          formData.audit_types?.includes('business') ? 'bg-purple-500' : 'bg-gray-200'
                        }`}>
                          <Briefcase className={formData.audit_types?.includes('business') ? 'text-white' : 'text-gray-500'} size={24} />
                        </div>
                        <span className={`font-bold text-lg ${
                          formData.audit_types?.includes('business') ? 'text-purple-700' : 'text-gray-700'
                        }`}>
                          Business Risk
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 text-left">Contract compliance & Indian Contract Act 1872 assessment</p>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  {editingClient ? 'Update' : 'Create'} Client
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Modal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          handleCancelForm();
          fetchClients();
        }}
        title="Success!"
        message={successMessage}
        type="success"
        confirmText="OK"
      />

      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
              <Building2 size={28} className="text-emerald-600" />
              Client Management
            </h1>
            <p className="text-gray-500 mt-1">{clients.length} total clients</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-md"
          >
            <Plus size={20} />
            Add Client
          </button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Client Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-emerald-600" size={40} />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Building2 className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No clients found</h3>
            <p className="text-gray-500 mb-6">Add your first client to get started</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700"
            >
              Add First Client
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredClients.map(client => (
              <div
                key={client.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-xl">
                        {client.company_name?.charAt(0).toUpperCase()}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{client.company_name}</h3>
                        <div className="flex flex-wrap items-center gap-2">
                          {client.audit_types && client.audit_types.length > 0 && (
                            client.audit_types.map(type => (
                              <span key={type} className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                                type === 'regulatory' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                              }`}>
                                {type === 'regulatory' ? <Shield size={12} /> : <Briefcase size={12} />}
                                {type.toUpperCase()}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm text-gray-600">
                      {client.contact_person && (
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-gray-400" />
                          <span>{client.contact_person}</span>
                        </div>
                      )}
                      {client.email && (
                        <a 
                          href={`mailto:${client.email}`}
                          className="flex items-center gap-2 p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 hover:text-blue-700 transition-colors"
                          title={`Send email to ${client.email}`}
                        >
                          <Mail size={16} />
                          <span className="text-xs font-medium">Email</span>
                        </a>
                      )}
                      {client.phone && (
                        <a 
                          href={`tel:${client.phone}`}
                          className="flex items-center gap-2 p-1.5 hover:bg-green-50 rounded-lg text-green-600 hover:text-green-700 transition-colors"
                          title={`Call ${client.phone}`}
                        >
                          <Phone size={16} />
                          <span className="text-xs font-medium">{client.phone}</span>
                        </a>
                      )}
                      {client.city && (
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-gray-400" />
                          {client.city}, {client.state}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleEdit(client)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default ClientManagement;
