import React, { useState, useRef } from 'react';
import { Camera, AlertTriangle, Info, Check, X, Clock, Ban } from 'lucide-react';
import RiskBadge from './RiskBadge';

const AuditCard = ({ item, index, currentStatus, onUpdateStatus }) => {
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files[0]) setFileName(e.target.files[0].name);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 transition-all hover:shadow-md">
      
      {/* HEADER */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{item.meta_data.source_act}</span>
            <span className="text-gray-300">•</span>
            <span className="text-xs font-semibold text-gray-600">{item.meta_data.section_reference}</span>
          </div>
          <h3 className="text-sm font-bold text-gray-800">{item.meta_data.category}</h3>
        </div>
        <RiskBadge level={item.risk_profile.severity_level} />
      </div>

      {/* BODY */}
      <div className="p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-3 leading-snug">
          <span className="text-gray-400 mr-2">#{index + 1}</span>
          {item.audit_content.question_text}
        </h2>

        {/* GUIDANCE */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex gap-3">
          <Info className="text-blue-500 shrink-0" size={20} />
          <div className="text-sm text-blue-800">
            <span className="font-bold block mb-1 text-xs uppercase opacity-70">Guidance:</span>
            {item.audit_content.simplified_guidance}
          </div>
        </div>

        {/* BUTTONS */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { label: 'Compliant', icon: Check, color: 'green' },
            { label: 'Non-Compliant', icon: X, color: 'red' },
            { label: 'Delayed', icon: Clock, color: 'blue' },
            { label: 'Not Applicable', icon: Ban, color: 'gray' }
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={() => onUpdateStatus(item.audit_item_id, opt.label)}
              className={`py-3 px-4 rounded-lg text-sm font-medium border transition-all flex items-center justify-center gap-2
                ${currentStatus === opt.label 
                  ? `bg-${opt.color}-50 border-${opt.color}-500 text-${opt.color}-700 ring-1 ring-${opt.color}-500`
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
            >
              <opt.icon size={16} />
              {opt.label}
            </button>
          ))}
        </div>

        {/* UPLOAD & PENALTY LOGIC */}
        {(currentStatus === 'Non-Compliant' || item.evidence_requirements.mandatory) && (
          <div className="animate-fade-in space-y-4 border-t pt-4 border-dashed border-gray-200">
            
            {currentStatus === 'Non-Compliant' && (
              <div className="bg-red-50 p-3 rounded border border-red-100 text-xs text-red-800 flex gap-3 items-start">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Liability Alert:</strong>
                  Fine: ₹{item.risk_profile.penalty_details.fine_amount_max_inr?.toLocaleString()} • 
                  Jail: {item.risk_profile.penalty_details.imprisonment_term}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center bg-gray-50 p-3 rounded border border-gray-200">
              <div className="text-xs text-gray-600">
                <span className="font-bold text-gray-900">Required:</span> {item.evidence_requirements.instruction}
                {fileName && <div className="text-green-600 font-bold mt-1">✓ {fileName}</div>}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
              <button 
                onClick={() => fileInputRef.current.click()}
                className="bg-gray-900 text-white text-xs px-4 py-2 rounded flex items-center gap-2 hover:bg-black transition-colors"
              >
                <Camera size={14} /> Upload
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditCard;