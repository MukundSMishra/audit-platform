import React, { useState } from 'react';
import { ShieldCheck, TrendingUp, ArrowRight, FileCheck, AlertTriangle, BarChart3, Scale } from 'lucide-react';

const AuditTypeSelector = ({ factoryName, location, onTypeSelected, onBack }) => {
  const [selectedType, setSelectedType] = useState(null);

  const auditTypes = [
    {
      id: 'regulatory',
      name: 'Regulatory Risk Audit',
      icon: Scale,
      description: 'Comprehensive compliance assessment across labour laws, environmental regulations, and state-specific requirements',
      color: 'blue',
      gradient: 'from-blue-500 to-indigo-600',
      bgGradient: 'from-blue-50 to-indigo-50',
      features: [
        '15 Acts & Rules Coverage',
        'Labour Code Compliance',
        'Environmental Standards',
        'State Regulations',
        'Legal Risk Assessment'
      ],
      stats: {
        acts: 15,
        categories: 3,
        items: '4000+'
      }
    },
    {
      id: 'business',
      name: 'Business Risk Audit',
      icon: TrendingUp,
      description: 'Contract risk assessment for Sales & Purchase agreements based on Indian Contract Act, 1872',
      color: 'purple',
      gradient: 'from-purple-500 to-pink-600',
      bgGradient: 'from-purple-50 to-pink-50',
      features: [
        'Compliance with Indian Contract Act, 1872',
        'Financial Leakage & Pricing Controls',
        'SLA & Operational Performance',
        'Vendor/Customer Due Diligence',
        'Legal & Regulatory Compliance'
      ],
      stats: {
        acts: '0',
        categories: 6,
        items: '38'
      }
    }
  ];

  const handleSelect = (typeId) => {
    setSelectedType(typeId);
  };

  const handleContinue = () => {
    if (selectedType) {
      onTypeSelected(selectedType);
    } else {
      alert('Please select an audit type to continue');
    }
  };

  return (
    <div className="w-full px-8 py-6 animate-fade-in">
      
      {/* Header */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-600 p-6 rounded-r-xl">
          <h1 className="text-2xl font-bold text-gray-900">Select Audit Type</h1>
          <p className="text-gray-600 mt-2">Choose the type of audit you want to conduct for this factory</p>
          <div className="mt-4 flex flex-col gap-1 text-sm">
            <p className="text-gray-700 font-semibold"> {factoryName}</p>
            <p className="text-gray-600">{location}</p>
          </div>
        </div>
      </div>

      {/* Audit Type Cards */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {auditTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          const isDisabled = false;
          
          return (
            <div
              key={type.id}
              onClick={() => !isDisabled && handleSelect(type.id)}
              className={`relative group cursor-pointer rounded-2xl border-3 transition-all duration-300 ${
                isDisabled 
                  ? 'opacity-60 cursor-not-allowed border-gray-300 bg-gray-50' 
                  : isSelected
                    ? `border-${type.color}-600 bg-gradient-to-br ${type.bgGradient} shadow-xl scale-105`
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg'
              }`}
              style={isSelected && !isDisabled ? { 
                borderColor: type.color === 'blue' ? '#2563eb' : '#9333ea',
                borderWidth: '3px'
              } : {}}
            >
              {isDisabled && (
                <div className="absolute top-4 right-4 bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full">
                  Coming Soon
                </div>
              )}
              
              {!isDisabled && type.id === 'business' && !isSelected && (
                <div className="absolute top-4 right-4 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  New
                </div>
              )}
              
              {isSelected && !isDisabled && (
                <div className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full p-2 shadow-lg">
                  <FileCheck size={20} strokeWidth={3} />
                </div>
              )}

              <div className="p-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`p-4 rounded-xl bg-gradient-to-br ${type.gradient} text-white shadow-lg`}>
                    <Icon size={32} strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{type.name}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{type.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6 mt-6">
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Acts</div>
                    <div className="text-xl font-bold text-gray-900">{type.stats.acts}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Categories</div>
                    <div className="text-xl font-bold text-gray-900">{type.stats.categories}</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-gray-200">
                    <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Items</div>
                    <div className="text-xl font-bold text-gray-900">{type.stats.items}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Key Coverage Areas</div>
                  {type.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${type.gradient}`}></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {!isDisabled && (
                  <div className="mt-6">
                    <button
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                        isSelected
                          ? `bg-gradient-to-r ${type.gradient} text-white shadow-lg`
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {isSelected ? ' Selected' : 'Select This Audit'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between items-center pt-6 border-t">
        <button
          onClick={onBack}
          className="px-6 py-3 text-gray-600 hover:text-gray-900 font-semibold flex items-center gap-2 transition-colors">
           Back to Dashboard
        </button>

        <button
          onClick={handleContinue}
          disabled={!selectedType}
          className={`px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-all ${
            selectedType
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:scale-105'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}>
          Continue to Act Selection
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default AuditTypeSelector;
