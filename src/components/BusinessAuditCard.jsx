import React from 'react';
import { Briefcase, ArrowRight, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const BusinessAuditCard = ({ onStart }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      {/* Header with Badge */}
      <div className="relative p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-b border-purple-100">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
              <Briefcase className="text-white" size={32} strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">Business Risk Audit</h3>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-gray-700 mt-4 leading-relaxed">
          Comprehensive assessment of Sales & Purchase contracts against Indian Contract Act 1872 and financial risk controls.
        </p>
      </div>

      {/* Key Coverage Areas */}
      <div className="p-6 border-b border-gray-100">
        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
          Key Coverage Areas
        </h4>
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-gray-700">
            <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <span className="text-sm font-medium">Legal Compliance (Contract Act 1872)</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <span className="text-sm font-medium">Financial Risk & Pricing Controls</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <span className="text-sm font-medium">Operational SLA Performance</span>
          </div>
          <div className="flex items-center gap-3 text-gray-700">
            <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <span className="text-sm font-medium">Vendor/Customer Due Diligence</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="p-6 bg-gray-50">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle size={16} className="text-purple-600" />
              <div className="text-2xl font-bold text-gray-900">0</div>
            </div>
            <div className="text-xs text-gray-600 font-medium">Audits</div>
          </div>
          <div className="text-center border-l border-r border-gray-200">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertTriangle size={16} className="text-red-600" />
              <div className="text-2xl font-bold text-gray-900">0</div>
            </div>
            <div className="text-xs text-gray-600 font-medium">Critical Risks</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock size={16} className="text-orange-600" />
              <div className="text-2xl font-bold text-gray-900">0</div>
            </div>
            <div className="text-xs text-gray-600 font-medium">Pending</div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="p-6 bg-white">
        <button
          onClick={onStart}
          className="group w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-6 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-md hover:shadow-xl flex items-center justify-center gap-2"
        >
          Start Contract Audit
          <ArrowRight 
            size={20} 
            className="transform transition-transform duration-300 group-hover:translate-x-1" 
          />
        </button>
      </div>
    </div>
  );
};

export default BusinessAuditCard;
