import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Building2, Search, MapPin, Plus, ArrowRight, Loader2, CheckCircle } from 'lucide-react';

const ClientSelector = ({ onClientSelected, onAddNewClient }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .in('subscription_status', ['active', 'trial'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      alert('Error loading clients: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectClient = (client) => {
    setSelectedClient(client);
    onClientSelected(client);
  };

  const filteredClients = clients.filter(client =>
    client.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.contact_person?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className='max-w-4xl mx-auto p-8'>
      <div className='mb-8'>
        <h2 className='text-3xl font-bold text-gray-900 mb-2'>Select Client</h2>
        <p className='text-gray-600'>Choose a client to start the audit</p>
      </div>

      {/* Search Bar */}
      <div className='mb-6 relative'>
        <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400' size={20} />
        <input
          type='text'
          placeholder='Search by firm name, location, or contact person...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg'
        />
      </div>

      {/* Add New Client Button */}
      {onAddNewClient && (
        <div className='mb-6'>
          <button
            onClick={onAddNewClient}
            className='w-full flex items-center justify-center gap-2 px-6 py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-gray-600 hover:text-blue-600 font-medium'
          >
            <Plus size={20} />
            Add New Client
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className='flex justify-center items-center h-64'>
          <Loader2 className='animate-spin text-blue-600' size={40} />
        </div>
      ) : filteredClients.length === 0 ? (
        <div className='bg-white rounded-xl border-2 border-gray-200 p-12 text-center'>
          <Building2 className='mx-auto text-gray-300 mb-4' size={64} />
          <h3 className='text-xl font-bold text-gray-900 mb-2'>No clients found</h3>
          <p className='text-gray-600 mb-6'>
            {searchQuery ? 'Try a different search term' : 'Add your first client to get started'}
          </p>
          {onAddNewClient && (
            <button
              onClick={onAddNewClient}
              className='inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors'
            >
              <Plus size={20} />
              Add First Client
            </button>
          )}
        </div>
      ) : (
        <div className='space-y-3'>
          {filteredClients.map((client) => (
            <div
              key={client.id}
              onClick={() => handleSelectClient(client)}
              className={`bg-white rounded-xl border-2 ${
                selectedClient?.id === client.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              } p-6 cursor-pointer transition-all hover:shadow-lg`}
            >
              <div className='flex items-start justify-between'>
                <div className='flex items-start gap-4 flex-1'>
                  <div className='w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-xl flex-shrink-0'>
                    {client.company_name?.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className='flex-1'>
                    <h3 className='text-xl font-bold text-gray-900 mb-1'>{client.company_name}</h3>
                    
                    <div className='flex flex-wrap items-center gap-4 text-sm text-gray-600'>
                      {client.city && (
                        <div className='flex items-center gap-1'>
                          <MapPin size={14} className='text-gray-400' />
                          {client.city}, {client.state}
                        </div>
                      )}
                      {client.contact_person && (
                        <div className='flex items-center gap-1'>
                          <Building2 size={14} className='text-gray-400' />
                          {client.contact_person}
                        </div>
                      )}
                      {client.industry && (
                        <span className='px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium'>
                          {client.industry}
                        </span>
                      )}
                    </div>

                    {client.enrolled_audits && client.enrolled_audits.length > 0 && (
                      <div className='mt-2 flex gap-2'>
                        {client.enrolled_audits.includes('regulatory') && (
                          <span className='px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold'>
                            Regulatory Audit
                          </span>
                        )}
                        {client.enrolled_audits.includes('business') && (
                          <span className='px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold'>
                            Business Audit
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedClient?.id === client.id && (
                  <CheckCircle className='text-blue-600 flex-shrink-0' size={24} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Continue Button */}
      {selectedClient && (
        <div className='mt-8 flex justify-end'>
          <button
            onClick={() => onClientSelected(selectedClient)}
            className='inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl'
          >
            Continue with {selectedClient.company_name}
            <ArrowRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ClientSelector;
