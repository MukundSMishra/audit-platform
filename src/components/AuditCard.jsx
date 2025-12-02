import React, { useState, useRef } from 'react';
import { Camera, Info, Check, X, Clock, Ban, Loader2, BookOpen, MessageSquare, ChevronDown, ChevronUp, AlertCircle, FileCheck, Paperclip, CheckCircle, XCircle, FileText } from 'lucide-react';
import { uploadEvidence } from '../services/storageClient';
import { computeQuestionWeight, getStatusFactor } from '../utils/riskScoring';
import riskWeights from '../config/riskWeights.json';

const AuditCard = ({ item, index, answerData, onUpdateAnswer }) => {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [isLegalExpanded, setIsLegalExpanded] = useState(false);

  // States
  const currentStatus = answerData?.status || null;
  const evidenceUrl = answerData?.evidenceUrl || null;
  const comment = answerData?.comment || "";
  // Toggle Logic
  const isApplicable = currentStatus !== 'Not Applicable';

  // Computed risk weight and contribution (after applicability known)
  const baseWeight = computeQuestionWeight(item, riskWeights);
  const statusFactor = getStatusFactor(currentStatus, riskWeights.statusFactors);
  const contribution = isApplicable ? Math.round(baseWeight * statusFactor * 100) / 100 : 0;

  const handleToggle = () => {
    if (isApplicable) {
      onUpdateAnswer(item.id, { ...answerData, status: 'Not Applicable', evidenceUrl: null });
    } else {
      onUpdateAnswer(item.id, { ...answerData, status: null });
    }
  };

  const handleStatusClick = (status) => {
    onUpdateAnswer(item.id, { ...answerData, status });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadEvidence(file, item.id);
      onUpdateAnswer(item.id, { ...answerData, evidenceUrl: url });
    } catch (error) { alert("Upload Failed"); } 
    finally { setUploading(false); }
  };

  // Helper: Split text by newlines or periods for bullet points
  const getBullets = (text) => {
    if (!text) return [];
    return text.split(/\n|\. /).filter(t => t.trim().length > 3);
  };

  const riskColors = {
    'Critical': 'bg-rose-50 text-rose-700 border-rose-100 ring-1 ring-rose-200',
    'High': 'bg-orange-50 text-orange-700 border-orange-100 ring-1 ring-orange-200',
    'Medium': 'bg-amber-50 text-amber-700 border-amber-100 ring-1 ring-amber-200',
    'Low': 'bg-blue-50 text-blue-700 border-blue-100 ring-1 ring-blue-200'
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-col h-full ring-1 ring-gray-100 font-sans">
      
      {/* 1. HEADER: Section & Risk */}
      <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-3">
          <span className="text-gray-400 font-extrabold uppercase tracking-widest text-[10px]">SECTION</span>
          <span className="bg-white border border-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded shadow-sm">
            {item.category}
          </span>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide shadow-sm ${riskColors[item.risk_level]}`}>
          {item.risk_level} Risk
        </div>
      </div>

      <div className="p-8 flex-1 overflow-y-auto">
        
        {/* 2. QUESTION */}
        <div className="relative mb-8 group">
          <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          
          <div className="flex gap-6 items-start">
            <div className="flex flex-col items-center shrink-0 relative">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
                <span className="relative text-5xl font-black bg-gradient-to-br from-slate-300 via-slate-200 to-slate-300 bg-clip-text text-transparent select-none leading-none tracking-tighter group-hover:from-blue-400 group-hover:via-purple-500 group-hover:to-pink-500 transition-all duration-300">
                  {index + 1}
                </span>
              </div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase mt-2 tracking-wider">Query</span>
            </div>
            
            <div className="flex-1 pt-1">
              <div className="flex items-start gap-3 mb-2">
                <div className="bg-blue-100 text-blue-700 p-1.5 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 shadow-sm">
                  <AlertCircle size={18} strokeWidth={2.5} />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 leading-tight tracking-tight group-hover:text-blue-900 transition-colors duration-300">
                  {item.question_text}
                </h2>
              </div>
              <div className="h-1 w-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-3 group-hover:w-32 transition-all duration-500"></div>
            </div>
          </div>
        </div>

        {/* 3. APPLICABILITY BLOCK */}
        <div className="mb-8 relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 shadow-sm hover:shadow-md transition-all duration-300">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
          
          <div className="p-6">
            <div className="flex justify-between items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-blue-500 p-1 rounded">
                    <Info size={12} className="text-white" strokeWidth={3} />
                  </div>
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Applicability Conditions</h4>
                </div>
                <ul className="space-y-2.5">
                  {getBullets(item.applicability_criteria || "Standard Factory Rule").map((point, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-slate-700 font-medium leading-relaxed">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Toggle Switch */}
              <div className="flex flex-col items-end gap-3 shrink-0 bg-white p-4 rounded-xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-2">
                  {isApplicable ? (
                    <Check size={14} className="text-emerald-600" strokeWidth={3} />
                  ) : (
                    <Ban size={14} className="text-slate-400" strokeWidth={3} />
                  )}
                  <span className="text-[11px] font-extrabold uppercase text-slate-700 tracking-wide">
                    {isApplicable ? 'Applicable' : 'Not Applicable'}
                  </span>
                </div>
                <div 
                  onClick={handleToggle}
                  className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 shadow-inner ${
                    isApplicable 
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 shadow-emerald-200' 
                      : 'bg-slate-300 hover:bg-slate-400'
                  }`}
                >
                  <div className={`bg-white w-6 h-6 rounded-full shadow-lg transform transition-transform duration-300 flex items-center justify-center ${
                    isApplicable ? 'translate-x-6' : ''
                  }`}>
                    {isApplicable ? (
                      <Check size={12} className="text-emerald-600" strokeWidth={4} />
                    ) : (
                      <X size={12} className="text-slate-400" strokeWidth={4} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CORE WORKFLOW (Only if Applicable) */}
        {isApplicable && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-500 space-y-8">
            
            {/* 4. AUDIT GUIDELINES */}
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-md">
                  <BookOpen size={18} className="text-white" strokeWidth={2.5} />
                </div>
                <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                  Audit Guidelines
                </h4>
                <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent"></div>
              </div>
              
              <div className="relative overflow-hidden rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/80 via-slate-50 to-blue-50/80 shadow-md hover:shadow-lg transition-all duration-300">
                <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-indigo-400"></div>
                
                <div className="p-6 pl-8">
                  <ol className="space-y-4">
                    {getBullets(item.simplified_guidance).map((step, i) => (
                      <li key={i} className="flex gap-4 items-start group hover:translate-x-1 transition-transform duration-200">
                        <div className="flex flex-col items-center gap-1 shrink-0">
                          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 text-white text-xs font-extrabold shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
                            {i + 1}
                          </span>
                          {i < getBullets(item.simplified_guidance).length - 1 && (
                            <div className="w-px h-6 bg-gradient-to-b from-blue-200 to-transparent"></div>
                          )}
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed font-medium pt-1 flex-1">
                          {step}.
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>

            {/* 5. OBSERVATION STATUS (Buttons Row) */}
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-md">
                  <FileCheck size={18} className="text-white" strokeWidth={2.5} />
                </div>
                <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                  Observation Status
                </h4>
                <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent"></div>
                  {/* Risk badges */}
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Weight: {baseWeight}</span>
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${
                      contribution > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>Contribution: {contribution}</span>
                  </div>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Compliant', color: 'emerald', gradient: 'from-emerald-400 to-teal-500', bgLight: 'from-emerald-50 to-teal-50', icon: CheckCircle },
                  { label: 'Non-Compliant', color: 'rose', gradient: 'from-rose-400 to-pink-500', bgLight: 'from-rose-50 to-pink-50', icon: XCircle },
                  { label: 'Delayed', color: 'amber', gradient: 'from-amber-400 to-orange-500', bgLight: 'from-amber-50 to-orange-50', icon: Clock }
                ].map((opt) => {
                  const isSelected = currentStatus === opt.label;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => handleStatusClick(opt.label)}
                      className={`relative flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-lg border-2 transition-all duration-300 group overflow-hidden
                        ${isSelected
                          ? `border-${opt.color}-400 shadow-md scale-105` 
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-sm hover:scale-102 bg-white'
                        }`}
                    >
                      {/* Background gradient for selected state */}
                      {isSelected && (
                        <div className={`absolute inset-0 bg-gradient-to-br ${opt.bgLight} opacity-90`}></div>
                      )}
                      
                      {/* Icon with animation */}
                      <div className={`relative p-2 rounded-lg transition-all duration-300 ${
                        isSelected 
                          ? `bg-gradient-to-br ${opt.gradient} shadow-sm` 
                          : 'bg-slate-50 group-hover:bg-slate-100'
                      }`}>
                        <opt.icon 
                          size={22} 
                          strokeWidth={2.5} 
                          className={`transition-all duration-300 ${
                            isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        />
                      </div>
                      
                      {/* Label */}
                      <span className={`font-bold text-[11px] uppercase tracking-wide transition-colors duration-300 relative ${
                        isSelected ? `text-${opt.color}-700` : 'text-slate-600 group-hover:text-slate-800'
                      }`}>
                        {opt.label}
                      </span>
                      
                      {/* Selection indicator */}
                      {isSelected && (
                        <div className={`absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-gradient-to-br ${opt.gradient} flex items-center justify-center shadow-sm animate-in zoom-in duration-300`}>
                          <Check size={12} className="text-white" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. EVIDENCE GUIDELINES */}
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-md">
                  <FileText size={18} className="text-white" strokeWidth={2.5} />
                </div>
                <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                  Evidence Guidelines
                </h4>
                <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent"></div>
              </div>
              
              <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-6 rounded-xl border border-slate-200 shadow-md space-y-4 hover:shadow-lg transition-all duration-300">
                
                {/* Methodology */}
                <div className="flex gap-4 items-center p-4 bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
                      <AlertCircle size={18} className="text-white" strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Methodology</span>
                      <span className="text-sm font-extrabold text-slate-900">
                        {item.evidence_required?.methodology || "Direct Observation"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Compliance Proof */}
                <div className="flex gap-4 items-start p-4 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 rounded-lg border border-emerald-200 hover:border-emerald-300 transition-all duration-300 group">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <CheckCircle size={18} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">If Compliant</span>
                      <div className="h-px flex-1 bg-emerald-200"></div>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      {item.evidence_required?.compliance_proof || "Upload photo of compliant condition."}
                    </p>
                  </div>
                </div>

                {/* Delay Proof */}
                <div className="flex gap-4 items-start p-4 bg-gradient-to-br from-amber-50/80 to-orange-50/50 rounded-lg border border-amber-200 hover:border-amber-300 transition-all duration-300 group">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-300">
                    <Clock size={18} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">If Delayed</span>
                      <div className="h-px flex-1 bg-amber-200"></div>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium">
                      {item.evidence_required?.delay_proof || "Upload proof of work order or application."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 7. UPLOAD INTERFACE */}
            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center shadow-md">
                  <Camera size={18} className="text-white" strokeWidth={2.5} />
                </div>
                <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                  {item.evidence_required?.mandatory ? (
                    <span className="flex items-center gap-2">
                      Evidence Upload
                      <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold border border-rose-200">Required</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Evidence Upload
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">Optional</span>
                    </span>
                  )}
                </h4>
                <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent"></div>
              </div>
              
              <div className={`relative border-2 border-dashed rounded-lg transition-all overflow-hidden group cursor-pointer shadow-sm hover:shadow-md duration-300
                ${evidenceUrl 
                  ? 'border-emerald-300 bg-gradient-to-br from-emerald-50/70 to-teal-50/70' 
                  : 'border-slate-300 hover:border-blue-400 bg-gradient-to-br from-slate-50 to-blue-50/30 hover:from-blue-50/40 hover:to-indigo-50/40'
                }`}>
                
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,.pdf" />
                
                <div className="p-6 flex flex-col items-center justify-center text-center" onClick={() => fileInputRef.current.click()}>
                  {evidenceUrl ? (
                    <div className="animate-in zoom-in duration-500">
                      <div className="relative mb-3">
                        <div className="absolute inset-0 bg-emerald-300 blur-lg opacity-20"></div>
                        <div className="relative bg-gradient-to-br from-emerald-400 to-teal-500 p-3 rounded-lg w-fit mx-auto text-white shadow-md">
                          <Check size={24} strokeWidth={2.5} />
                        </div>
                      </div>
                      <p className="text-emerald-800 font-bold text-sm mb-1.5 uppercase tracking-wide">Evidence Secured</p>
                      <p className="text-slate-600 text-xs mb-4 font-medium">File successfully uploaded and attached</p>
                      <div className="flex gap-2 justify-center">
                        <a 
                          href={evidenceUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-1.5 text-xs bg-white border border-emerald-300 text-emerald-700 px-3 py-1.5 rounded-md font-bold hover:bg-emerald-50 hover:border-emerald-400 shadow-sm hover:shadow-md transition-all duration-300" 
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileText size={14} />
                          View File
                        </a>
                        <button className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1.5 rounded-md font-bold hover:from-emerald-600 hover:to-teal-700 shadow-sm hover:shadow-md transition-all duration-300">
                          <Paperclip size={14} />
                          Replace
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="relative mb-3">
                        {uploading ? (
                          <>
                            <div className="absolute inset-0 bg-blue-300 blur-lg opacity-20"></div>
                            <div className="relative bg-gradient-to-br from-blue-400 to-indigo-500 p-3 rounded-lg shadow-md">
                              <Loader2 size={24} className="animate-spin text-white"/>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-slate-300 blur-lg opacity-10 group-hover:bg-blue-300 group-hover:opacity-20 transition-all duration-300"></div>
                            <div className="relative bg-white p-3 rounded-lg text-slate-400 shadow-sm border border-slate-200 group-hover:border-blue-300 group-hover:text-blue-500 group-hover:scale-105 transition-all duration-300">
                              <Paperclip size={24} strokeWidth={2.5} />
                            </div>
                          </>
                        )}
                      </div>
                      <p className="text-sm font-bold text-slate-700 mb-1.5 group-hover:text-blue-600 transition-colors uppercase tracking-wide">
                        {uploading ? 'Uploading...' : 'Click to Attach Evidence'}
                      </p>
                      <p className="text-xs text-slate-500 font-medium mb-3">Drag & drop or click to browse</p>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white/80 px-3 py-1.5 rounded-md border border-slate-200">
                        <FileText size={12} />
                        <span className="font-medium">Supports: Images & PDF files</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 8. LEGAL REFERENCES */}
        <div className="mt-12 pt-8 border-t border-slate-200">
          <button 
            onClick={() => setIsLegalExpanded(!isLegalExpanded)}
            className="flex items-center gap-3 text-sm font-bold text-slate-600 hover:text-blue-600 uppercase tracking-wide transition-all duration-300 w-full group bg-slate-50 hover:bg-blue-50 p-4 rounded-lg border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-md"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
              <BookOpen size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="flex-1 text-left">Legal References & Documentation</span>
            <div className={`transform transition-transform duration-300 ${isLegalExpanded ? 'rotate-180' : ''}`}>
              <ChevronDown size={18} strokeWidth={2.5} />
            </div>
          </button>
          
          {isLegalExpanded && (
            <div className="mt-5 p-6 bg-gradient-to-br from-slate-100 via-blue-50/30 to-slate-100 rounded-xl text-slate-700 text-sm leading-relaxed shadow-md border border-slate-200 animate-in slide-in-from-top-4 duration-500 overflow-hidden relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-400"></div>
              
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-200">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-sm">
                  <FileText size={20} className="text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-wide">Act Reference</div>
                  <div className="text-sm font-bold text-slate-800 mt-1">{item.section_reference || 'Legal Documentation'}</div>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                <p className="text-slate-700 leading-relaxed font-medium">
                  {item.legal_text || `(Full legal text for ${item.section_reference} will be displayed here)`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 9. AUDITOR COMMENTS (Only if Applicable) */}
        {isApplicable && (
          <div className="mt-6 relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-md">
                <MessageSquare size={18} className="text-white" strokeWidth={2.5} />
              </div>
              <h4 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
                Auditor Comments
              </h4>
              <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent"></div>
            </div>
            
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-300 to-indigo-300 rounded-lg opacity-0 group-focus-within:opacity-15 blur transition-opacity duration-300"></div>
              <div className="relative">
                <div className="absolute top-3 left-3 text-slate-400 group-focus-within:text-blue-500 transition-colors duration-300">
                  <MessageSquare size={16} strokeWidth={2.5} />
                </div>
                <textarea 
                  className="w-full bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 rounded-lg py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-300 focus:bg-white outline-none transition-all placeholder-slate-400 font-medium text-slate-700 resize-none shadow-sm focus:shadow-md"
                  rows="2"
                  placeholder="Add your observations, remarks, or notes here..."
                  value={comment}
                  onChange={(e) => onUpdateAnswer(item.id, { ...answerData, comment: e.target.value })}
                />
                <div className="absolute bottom-2 right-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  {comment.length} chars
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AuditCard;