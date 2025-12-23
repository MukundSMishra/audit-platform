import React, { useState } from 'react';
import { 
  Plus, 
  FileText, 
  Calendar, 
  DollarSign, 
  Users, 
  Building2, 
  ArrowRight, 
  Edit2, 
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

const ContractManagement = ({ client, firmName, location, onBack, onStartAudit }) => {
  // Use client object if available, fallback to direct props for backward compatibility
  const displayFirmName = client?.company_name || firmName;
  const displayLocation = client?.city ? `${client.city}, ${client.state}` : location;
  
  const [contracts, setContracts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [formData, setFormData] = useState({
    contractName: '',
    contractNumber: '',
    contractType: 'sales',
    partiesInvolved: '',
    contractValue: '',
    contractTenure: '',
    renewalTerms: '',
    contractOwner: '',
    dateOfExecution: '',
    signatories: '',
    auditStatus: 'pending' // pending, in-progress, completed
  });

  const contractTypes = [
    { value: 'sales', label: 'Sales Contract' },
    { value: 'purchase', label: 'Purchase Contract' },
    { value: 'service', label: 'Service Agreement' },
    { value: 'amc', label: 'Annual Maintenance Contract (AMC)' },
    { value: 'annual', label: 'Annual Contract' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddContract = () => {
    if (!formData.contractName || !formData.contractType) {
      alert('Please fill in at least Contract Name and Type');
      return;
    }

    if (editingContract !== null) {
      // Update existing contract
      setContracts(prev => 
        prev.map((contract, index) => 
          index === editingContract ? { ...formData, id: contract.id } : contract
        )
      );
      setEditingContract(null);
    } else {
      // Add new contract
      setContracts(prev => [...prev, { ...formData, id: Date.now() }]);
    }

    // Reset form
    setFormData({
      contractName: '',
      contractNumber: '',
      contractType: 'sales',
      partiesInvolved: '',
      contractValue: '',
      contractTenure: '',
      renewalTerms: '',
      contractOwner: '',
      dateOfExecution: '',
      signatories: '',
      auditStatus: 'pending'
    });
    setShowAddForm(false);
  };

  const handleEditContract = (index) => {
    setFormData(contracts[index]);
    setEditingContract(index);
    setShowAddForm(true);
  };

  const handleDeleteContract = (index) => {
    if (window.confirm('Are you sure you want to delete this contract?')) {
      setContracts(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleStartAuditForContract = (contract, index) => {
    // Update contract status to in-progress
    setContracts(prev => 
      prev.map((c, i) => 
        i === index ? { ...c, auditStatus: 'in-progress' } : c
      )
    );
    onStartAudit(contract);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
            <CheckCircle size={14} />
            Completed
          </span>
        );
      case 'in-progress':
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
            <Clock size={14} />
            In Progress
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-full">
            <AlertCircle size={14} />
            Pending
          </span>
        );
    }
  };

  const getContractTypeLabel = (type) => {
    return contractTypes.find(t => t.value === type)?.label || type;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3">
              <button 
                onClick={onBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <div>
                <h1 className="font-bold text-2xl text-gray-900">Contract Management</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {displayFirmName} • {displayLocation}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Total Contracts</div>
            <div className="text-2xl font-bold text-gray-900">{contracts.length}</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8">
        {/* Add Contract Button */}
        {!showAddForm && (
          <div className="mb-6">
            <button
              onClick={() => {
                setShowAddForm(true);
                setEditingContract(null);
                setFormData({
                  contractName: '',
                  contractNumber: '',
                  contractType: 'sales',
                  partiesInvolved: '',
                  contractValue: '',
                  contractTenure: '',
                  renewalTerms: '',
                  contractOwner: '',
                  dateOfExecution: '',
                  signatories: '',
                  auditStatus: 'pending'
                });
              }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
            >
              <Plus size={20} />
              Add New Contract
            </button>
          </div>
        )}

        {/* Add/Edit Contract Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingContract !== null ? 'Edit Contract' : 'Add New Contract'}
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Contract Name/Number */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Contract Name / Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="contractName"
                  value={formData.contractName}
                  onChange={handleInputChange}
                  placeholder="e.g., Supply Agreement 2024-001"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  required
                />
              </div>

              {/* Contract Number (Optional separate field) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  name="contractNumber"
                  value={formData.contractNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., REF-2024-001"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Contract Type */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="contractType"
                  value={formData.contractType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  required
                >
                  {contractTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Parties Involved */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Parties Involved
                </label>
                <input
                  type="text"
                  name="partiesInvolved"
                  value={formData.partiesInvolved}
                  onChange={handleInputChange}
                  placeholder="e.g., ABC Corp, XYZ Ltd"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Contract Value */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Contract Value (₹)
                </label>
                <input
                  type="text"
                  name="contractValue"
                  value={formData.contractValue}
                  onChange={handleInputChange}
                  placeholder="e.g., 10,00,000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Contract Tenure */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Contract Tenure
                </label>
                <input
                  type="text"
                  name="contractTenure"
                  value={formData.contractTenure}
                  onChange={handleInputChange}
                  placeholder="e.g., 2 years, 12 months"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Renewal/Extension Terms */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Renewal / Extension Terms
                </label>
                <input
                  type="text"
                  name="renewalTerms"
                  value={formData.renewalTerms}
                  onChange={handleInputChange}
                  placeholder="e.g., Auto-renewal, 90 days notice"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Contract Owner (Department) */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Contract Owner (Department)
                </label>
                <input
                  type="text"
                  name="contractOwner"
                  value={formData.contractOwner}
                  onChange={handleInputChange}
                  placeholder="e.g., Procurement, Sales"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Date of Execution */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Date of Execution
                </label>
                <input
                  type="date"
                  name="dateOfExecution"
                  value={formData.dateOfExecution}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>

              {/* Signatories & Authority Verified */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Signatories & Authority
                </label>
                <input
                  type="text"
                  name="signatories"
                  value={formData.signatories}
                  onChange={handleInputChange}
                  placeholder="e.g., John Doe (CEO), Jane Smith (Director)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 mt-8">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingContract(null);
                }}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddContract}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-semibold transition-all shadow-md hover:shadow-lg"
              >
                {editingContract !== null ? 'Update Contract' : 'Add Contract'}
              </button>
            </div>
          </div>
        )}

        {/* Contracts List */}
        {contracts.length === 0 && !showAddForm ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <FileText size={64} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Contracts Added Yet</h3>
            <p className="text-gray-600 mb-6">
              Add contracts to start conducting Business Risk Audits
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
            >
              <Plus size={20} />
              Add Your First Contract
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {contracts.map((contract, index) => (
              <div 
                key={contract.id} 
                className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">
                          {contract.contractName}
                        </h3>
                        {getStatusBadge(contract.auditStatus)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <FileText size={16} />
                          {getContractTypeLabel(contract.contractType)}
                        </span>
                        {contract.contractNumber && (
                          <span>Ref: {contract.contractNumber}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditContract(index)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Contract"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteContract(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Contract"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Contract Details Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {contract.partiesInvolved && (
                      <div className="flex items-start gap-2">
                        <Users size={16} className="text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-xs text-gray-500">Parties</div>
                          <div className="text-sm font-medium text-gray-900">{contract.partiesInvolved}</div>
                        </div>
                      </div>
                    )}
                    {contract.contractValue && (
                      <div className="flex items-start gap-2">
                        <DollarSign size={16} className="text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-xs text-gray-500">Value</div>
                          <div className="text-sm font-medium text-gray-900">₹ {contract.contractValue}</div>
                        </div>
                      </div>
                    )}
                    {contract.contractTenure && (
                      <div className="flex items-start gap-2">
                        <Calendar size={16} className="text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-xs text-gray-500">Tenure</div>
                          <div className="text-sm font-medium text-gray-900">{contract.contractTenure}</div>
                        </div>
                      </div>
                    )}
                    {contract.contractOwner && (
                      <div className="flex items-start gap-2">
                        <Building2 size={16} className="text-gray-400 mt-0.5" />
                        <div>
                          <div className="text-xs text-gray-500">Owner</div>
                          <div className="text-sm font-medium text-gray-900">{contract.contractOwner}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Audit Action Button */}
                  <div className="pt-4 border-t">
                    <button
                      onClick={() => handleStartAuditForContract(contract, index)}
                      disabled={contract.auditStatus === 'completed'}
                      className={`w-full flex items-center justify-center gap-2 font-bold py-3 px-6 rounded-lg transition-all ${
                        contract.auditStatus === 'completed'
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-md hover:shadow-lg'
                      }`}
                    >
                      {contract.auditStatus === 'completed' ? (
                        <>
                          <CheckCircle size={20} />
                          Audit Completed
                        </>
                      ) : contract.auditStatus === 'in-progress' ? (
                        <>
                          Continue Audit
                          <ArrowRight size={20} />
                        </>
                      ) : (
                        <>
                          Start Audit
                          <ArrowRight size={20} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractManagement;
