import React, { useState, useRef } from 'react';
import { Camera, Info, Check, X, Clock, Ban, Loader2, BookOpen, MessageSquare, ChevronDown, ChevronUp, AlertCircle, FileCheck, Paperclip, CheckCircle, XCircle, FileText, Upload, Sparkles, CheckSquare, Shield, AlertTriangle, RotateCcw } from 'lucide-react';
import { uploadEvidence } from '../services/storageClient';
import { supabase } from '../services/supabaseClient';
import { computeQuestionWeight, getStatusFactor } from '../utils/riskScoring';
import riskWeights from '../config/riskWeights.json';

const AuditCard = ({ item, index, answerData, onUpdateAnswer }) => {
  const fileInputRef = useRef(null);
  const aiFileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [aiUploading, setAiUploading] = useState(false);
  const [isLegalExpanded, setIsLegalExpanded] = useState(false);
  const [isApplicabilityExpanded, setIsApplicabilityExpanded] = useState(false);
  const [applicabilityReason, setApplicabilityReason] = useState(answerData?.applicabilityReason || '');
  const [isEvidenceAvailable, setIsEvidenceAvailable] = useState(answerData?.missingEvidenceReason ? 'no' : null);
  const [missingEvidenceReason, setMissingEvidenceReason] = useState(answerData?.missingEvidenceReason || null);
  
  // Determine workflow type
  const isAiEvidence = item.workflow_type === 'ai_evidence';
  const isManualObservation = !isAiEvidence; // default or explicit 'manual_observation'

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
  
  // Verify risk level and log
  const riskLevel = item?.risk_level || item?.risk_profile?.severity_level || 'Unknown';
  const displayRiskLevel = String(riskLevel).trim();
  
  // Log verification info on first render of this item
  React.useMemo(() => {
    if (!item?.id || !window.__auditCardLog) window.__auditCardLog = new Set();
    if (!window.__auditCardLog.has(item.id) && window.__auditCardLog.size < 5) {
      console.log(`[AuditCard Verification] ID:${item.id} | Risk Label:"${displayRiskLevel}" | Base Weight:${baseWeight} | Status:"${currentStatus}" | Contribution:${contribution}`);
      window.__auditCardLog.add(item.id);
    }
  }, [item?.id]);

  const handleToggle = () => {
    if (isApplicable) {
      onUpdateAnswer(item.id, { ...answerData, status: 'Not Applicable', evidenceUrl: null });
    } else {
      onUpdateAnswer(item.id, { ...answerData, status: null, applicabilityReason: '' });
      setApplicabilityReason('');
    }
  };

  const handleSaveNotApplicable = () => {
    if (!applicabilityReason.trim()) {
      alert('Please provide a reason why this is not applicable.');
      return;
    }
    onUpdateAnswer(item.id, { 
      ...answerData, 
      status: 'Not Applicable', 
      applicabilityReason: applicabilityReason.trim(),
      evidenceUrl: null 
    });
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

  const handleAiEvidenceUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setAiUploading(true);
      
      // Upload to Supabase Storage
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `uploads/${item.id}/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('audit-evidence')
        .upload(filePath, file);
      
      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('audit-evidence')
        .getPublicUrl(filePath);
      
      // Update answer with evidence URL and AI status
      onUpdateAnswer(item.id, { 
        ...answerData, 
        evidenceUrl: publicUrl,
        status: 'submitted_for_ai',
        missingEvidenceReason: null
      });
      
    } catch (error) {
      console.error('AI Evidence upload failed:', error);
      alert('Upload Failed: ' + error.message);
    } finally {
      setAiUploading(false);
    }
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
    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-col font-sans">
      
      {/* HEADER: Act Name, Risk Badge & Question (Full Width) */}
      <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-blue-50/30">
        {/* Top Row: Section & Risk */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 font-extrabold uppercase tracking-widest text-[10px]">SECTION</span>
            <span className="bg-white border border-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded shadow-sm">
              {item.category}
            </span>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wide shadow-md ring-1 transition-all ${riskColors[displayRiskLevel]}`}>
            <Shield size={14} strokeWidth={3} />
            <span>{displayRiskLevel} Risk</span>
            <span className="text-xs">|</span>
            <span>Score: {baseWeight}</span>
          </div>
        </div>

        {/* Question Text */}
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center shrink-0">
            <span className="text-4xl font-black bg-gradient-to-br from-blue-500 to-purple-600 bg-clip-text text-transparent">
              {index + 1}
            </span>
            <span className="text-[9px] font-extrabold text-slate-400 uppercase mt-1">Query</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-extrabold text-slate-900 leading-tight">
              {item.question_text}
            </h2>
          </div>
        </div>
      </div>

      {/* ZONE B: THE GATE - Applicability Toggle */}
      <div className="bg-gray-50 border-y border-gray-200 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-md">
              <AlertCircle size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-slate-800">Applicable to this firm?</span>
              <span className="text-xs text-slate-600 mt-1">Read these guidelines to decide if this audit question is applicable to the firm.</span>
            </div>
          </div>
          
          {/* Yes/No Segmented Control */}
          <div className="flex items-center bg-white border-2 border-slate-300 rounded-lg overflow-hidden shadow-sm">
            <button
              onClick={() => {
                if (!isApplicable) handleToggle();
              }}
              className={`px-6 py-2.5 text-sm font-bold transition-all ${
                isApplicable
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              YES
            </button>
            <button
              onClick={() => {
                if (isApplicable) handleToggle();
              }}
              className={`px-6 py-2.5 text-sm font-bold transition-all border-l-2 border-slate-300 ${
                !isApplicable
                  ? 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              NO
            </button>
          </div>
        </div>

        {/* Not Applicable Reason Input */}
        {!isApplicable && (
          <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Why is it not applicable?
            </label>
            <textarea
              className="w-full bg-white border-2 border-slate-300 rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-red-400 focus:border-red-300 outline-none transition-all placeholder-slate-400 text-slate-700 resize-none"
              rows="3"
              placeholder="Explain why this requirement does not apply to this site..."
              value={applicabilityReason}
              onChange={(e) => setApplicabilityReason(e.target.value)}
              required
            />
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleSaveNotApplicable}
                className="px-6 py-2.5 bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-lg text-sm font-bold hover:from-slate-800 hover:to-black transition-all shadow-md flex items-center gap-2"
              >
                <Check size={16} strokeWidth={3} />
                Save & Skip
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ZONE C: THE WORKSPACE - Two-Column Grid (Only if Applicable) */}
      {isApplicable && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 animate-in fade-in slide-in-from-top-4 duration-500">
        
        {/* LEFT COLUMN: Guidance Panel */}
        <div className="bg-slate-50 rounded-xl border-2 border-slate-200 p-6 flex flex-col">
          {isManualObservation ? (
            /* Manual Observation Checklist */
            <>
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-300">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <CheckSquare size={20} className="text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-extrabold text-slate-800">
                  Inspection Checklist
                </h3>
              </div>
              <div className="space-y-3 flex-1">
                {(item.intern_action_guide?.inspection_steps || item.simplified_guidance?.split('\n') || []).map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all group">
                    <div className="w-6 h-6 rounded border-2 border-slate-300 group-hover:border-blue-500 flex items-center justify-center shrink-0 mt-0.5 bg-white group-hover:bg-blue-50 transition-all">
                      <Check size={14} className="text-transparent group-hover:text-blue-600 transition-all" strokeWidth={3} />
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium flex-1">
                      {typeof step === 'string' ? step : step}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* AI Evidence Instructions */
            <>
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-purple-300">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <FileText size={20} className="text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-extrabold text-slate-800">
                  Required Evidence
                </h3>
              </div>
              <div className="flex-1 space-y-4">
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={16} className="text-purple-600" strokeWidth={2.5} />
                    <span className="text-xs font-bold text-purple-700 uppercase">Document Required</span>
                  </div>
                  <p className="text-base font-extrabold text-slate-900 mb-3">
                    {item.capture_instructions?.document_name || 'Evidence Document'}
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {item.capture_instructions?.instruction || 'Please capture clear evidence for AI verification.'}
                  </p>
                </div>
                {item.capture_instructions?.title && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <p className="text-xs font-bold text-purple-700 mb-1 uppercase">Instructions</p>
                    <p className="text-sm text-slate-700 font-medium">
                      {item.capture_instructions.title}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN: Action Zone */}
        <div className="flex flex-col">
          {isManualObservation ? (
            /* Compliance Status Buttons */
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                  <FileCheck size={20} className="text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-extrabold text-slate-800">
                  Compliance Status
                </h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4 mb-6">
                {[
                  { label: 'Compliant', color: 'emerald', gradient: 'from-emerald-400 to-teal-500', bgLight: 'from-emerald-50 to-teal-50', icon: CheckCircle },
                  { label: 'Non-Compliant', color: 'rose', gradient: 'from-rose-400 to-pink-500', bgLight: 'from-rose-50 to-pink-50', icon: XCircle },
                  { label: 'Delayed', color: 'amber', gradient: 'from-amber-400 to-orange-500', bgLight: 'from-amber-50 to-orange-50', icon: Clock }
                ].map((opt) => {
                  const isSelected = currentStatus === opt.label;
                  return (
                    <button
                      key={opt.label}
                      onClick={() => {
                        if (isSelected) {
                          onUpdateAnswer(item.id, { ...answerData, status: null });
                        } else {
                          onUpdateAnswer(item.id, { ...answerData, status: opt.label });
                        }
                      }}
                      className={`relative flex items-center justify-between gap-4 py-4 px-6 rounded-xl border-2 transition-all duration-300 group overflow-hidden touch-manipulation min-h-[72px]
                        ${isSelected
                          ? `border-${opt.color}-400 shadow-lg scale-[1.02]` 
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-md hover:scale-[1.01] bg-white'
                        }`}
                    >
                      {isSelected && (
                        <div className={`absolute inset-0 bg-gradient-to-br ${opt.bgLight} opacity-90`}></div>
                      )}
                      
                      <div className="relative flex items-center gap-4 flex-1">
                        <div className={`p-3 rounded-lg transition-all duration-300 ${
                          isSelected 
                            ? `bg-gradient-to-br ${opt.gradient} shadow-md` 
                            : 'bg-slate-50 group-hover:bg-slate-100'
                        }`}>
                          <opt.icon 
                            size={28} 
                            strokeWidth={2.5} 
                            className={`transition-all duration-300 ${
                              isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'
                            }`}
                          />
                        </div>
                        
                        <span className={`font-bold text-base uppercase tracking-wide transition-colors duration-300 ${
                          isSelected ? `text-${opt.color}-700` : 'text-slate-600 group-hover:text-slate-800'
                        }`}>
                          {opt.label}
                        </span>
                      </div>
                      
                      {isSelected && (
                        <div className={`relative w-6 h-6 rounded-full bg-gradient-to-br ${opt.gradient} flex items-center justify-center shadow-md animate-in zoom-in duration-300`}>
                          <Check size={14} className="text-white" strokeWidth={4} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Upload Evidence (for Compliant/Delayed) */}
              {(currentStatus === 'Compliant' || currentStatus === 'Delayed') && (
                <div className="mt-auto">
                  <div className="flex items-center gap-2 mb-3">
                    <Camera size={16} className="text-slate-600" />
                    <span className="text-sm font-bold text-slate-700">Attach Evidence</span>
                  </div>
                  <div className={`border-2 border-dashed rounded-lg p-4 cursor-pointer transition-all hover:border-slate-400 ${
                    evidenceUrl ? 'border-green-300 bg-green-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
                  }`} onClick={() => fileInputRef.current?.click()}>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,.pdf" />
                    {evidenceUrl ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Check size={18} className="text-green-600" />
                          <span className="text-sm font-medium text-green-700">Evidence Uploaded</span>
                        </div>
                        <a href={evidenceUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">View</a>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 text-slate-500">
                        {uploading ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            <span className="text-sm">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload size={18} />
                            <span className="text-sm font-medium">Click to Upload</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* AI Evidence Upload Widget */
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <Upload size={20} className="text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-extrabold text-slate-800">
                  Upload Proof
                </h3>
              </div>

              {/* Radio Button Group: Is the evidence available? */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Is the evidence available?
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setIsEvidenceAvailable('yes');
                      setMissingEvidenceReason(null);
                      onUpdateAnswer(item.id, { ...answerData, missingEvidenceReason: null, status: null });
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg transition-all ${
                      isEvidenceAvailable === 'yes'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isEvidenceAvailable === 'yes' ? 'border-green-600' : 'border-slate-400'
                    }`}>
                      {isEvidenceAvailable === 'yes' && (
                        <div className="w-3 h-3 rounded-full bg-green-600"></div>
                      )}
                    </div>
                    <span className="font-bold">Yes</span>
                  </button>
                  <button
                    onClick={() => setIsEvidenceAvailable('no')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg transition-all ${
                      isEvidenceAvailable === 'no'
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      isEvidenceAvailable === 'no' ? 'border-rose-600' : 'border-slate-400'
                    }`}>
                      {isEvidenceAvailable === 'no' && (
                        <div className="w-3 h-3 rounded-full bg-rose-600"></div>
                      )}
                    </div>
                    <span className="font-bold">No</span>
                  </button>
                </div>
              </div>

              {/* Conditional Rendering based on isEvidenceAvailable */}
              {isEvidenceAvailable === 'yes' && (
                <div 
                  className={`flex-1 border-3 border-dashed rounded-xl cursor-pointer transition-all duration-300 flex flex-col items-center justify-center p-8 ${
                    evidenceUrl 
                      ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50' 
                      : 'border-purple-300 bg-purple-50/30 hover:bg-purple-50/50 hover:border-purple-400'
                  }`}
                  onClick={() => !evidenceUrl && aiFileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={aiFileInputRef} 
                    className="hidden" 
                    onChange={handleAiEvidenceUpload} 
                    accept={item.ui_config?.accepted_formats || 'image/*,.pdf'} 
                  />
                  
                  {evidenceUrl ? (
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <CheckCircle size={40} className="text-white" strokeWidth={2.5} />
                      </div>
                      <p className="text-lg font-bold text-purple-900 mb-2">Evidence Submitted</p>
                      <p className="text-sm text-slate-600 mb-4">AI verification in progress</p>
                      <div className="flex gap-2 justify-center">
                        <a 
                          href={evidenceUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-4 py-2 bg-white border border-purple-300 rounded-lg text-sm font-bold text-purple-700 hover:bg-purple-50 transition-all"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View File
                        </a>
                        <button 
                          onClick={() => aiFileInputRef.current?.click()}
                          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg text-sm font-bold hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md"
                        >
                          Re-upload
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {aiUploading ? (
                        <div className="text-center">
                          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
                            <Loader2 size={40} className="animate-spin text-white" />
                          </div>
                          <p className="text-base font-bold text-purple-900">Uploading to AI...</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white border-4 border-purple-300 flex items-center justify-center shadow-lg">
                            <Camera size={36} className="text-purple-500" strokeWidth={2.5} />
                          </div>
                          <p className="text-lg font-bold text-slate-800 mb-2">Upload Proof</p>
                          <p className="text-sm text-slate-600 mb-4">Drag & drop or click to browse</p>
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-600">
                            <FileText size={14} />
                            <span>{item.ui_config?.accepted_formats || 'Images & PDF'}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Radio Buttons for Missing Evidence Reasons */}
              {isEvidenceAvailable === 'no' && (
                <div className="flex-1 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-sm text-slate-600 mb-4">
                    Please select the reason why evidence is not available. This will mark the item as <span className="font-bold text-rose-600">Non-Compliant</span>.
                  </p>
                  
                  {[
                    { 
                      id: 'not_maintained',
                      label: 'Document Not Maintained',
                      description: 'Required document is not being maintained by the facility'
                    },
                    { 
                      id: 'access_denied',
                      label: 'Access Denied by Client',
                      description: 'Client refused to provide access to the document'
                    },
                    { 
                      id: 'not_produced',
                      label: 'Not Produced / Lost',
                      description: 'Document was lost or cannot be produced at this time'
                    }
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => {
                        setMissingEvidenceReason(option.label);
                        onUpdateAnswer(item.id, {
                          ...answerData,
                          status: 'Non-Compliant',
                          missingEvidenceReason: option.label,
                          evidenceUrl: null
                        });
                      }}
                      className={`w-full text-left p-4 border-2 rounded-xl transition-all group ${
                        missingEvidenceReason === option.label
                          ? 'border-rose-500 bg-rose-50'
                          : 'border-slate-200 hover:border-rose-400 hover:bg-rose-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                          missingEvidenceReason === option.label
                            ? 'border-rose-500 bg-rose-500'
                            : 'border-slate-300 group-hover:border-rose-500'
                        }`}>
                          {missingEvidenceReason === option.label && (
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`font-bold mb-1 transition-colors ${
                            missingEvidenceReason === option.label
                              ? 'text-rose-700'
                              : 'text-slate-800 group-hover:text-rose-700'
                          }`}>
                            {option.label}
                          </p>
                          <p className="text-xs text-slate-500 group-hover:text-slate-600">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}

                  {/* Undo Button */}
                  {missingEvidenceReason && (
                    <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-rose-700 mb-1">Status: Non-Compliant</p>
                          <p className="text-xs text-slate-600">Reason: {missingEvidenceReason}</p>
                        </div>
                        <button
                          onClick={() => {
                            setMissingEvidenceReason(null);
                            setIsEvidenceAvailable(null);
                            onUpdateAnswer(item.id, {
                              ...answerData,
                              status: null,
                              missingEvidenceReason: null
                            });
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
                        >
                          <RotateCcw size={14} />
                          Reset
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      )}

      {/* FOOTER: Collapsible Sections */}
      <div className="border-t border-gray-200 p-6 space-y-3 bg-slate-50">
        
        {/* Applicability Accordion */}
        <button 
          onClick={() => setIsApplicabilityExpanded(!isApplicabilityExpanded)}
          className="flex items-center justify-between w-full p-4 bg-white rounded-lg border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-3">
            <Info size={18} className="text-blue-600" strokeWidth={2.5} />
            <span className="font-bold text-sm text-slate-700 group-hover:text-blue-700">Applicability Conditions</span>
          </div>
          <ChevronDown size={18} className={`text-slate-400 transition-transform ${isApplicabilityExpanded ? 'rotate-180' : ''}`} />
        </button>
        
        {isApplicabilityExpanded && (
          <div className="p-4 bg-white rounded-lg border border-blue-200 animate-in slide-in-from-top-2 duration-300">
            <p className="text-sm text-slate-700 leading-relaxed">
              {item.applicability_criteria || "Standard Factory Rule"}
            </p>
          </div>
        )}

        {/* Legal References Accordion */}
        <button 
          onClick={() => setIsLegalExpanded(!isLegalExpanded)}
          className="flex items-center justify-between w-full p-4 bg-white rounded-lg border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-3">
            <BookOpen size={18} className="text-indigo-600" strokeWidth={2.5} />
            <span className="font-bold text-sm text-slate-700 group-hover:text-indigo-700">Legal References</span>
          </div>
          <ChevronDown size={18} className={`text-slate-400 transition-transform ${isLegalExpanded ? 'rotate-180' : ''}`} />
        </button>
        
        {isLegalExpanded && (
          <div className="p-4 bg-white rounded-lg border border-indigo-200 animate-in slide-in-from-top-2 duration-300">
            <div className="mb-2">
              <span className="text-xs font-bold text-indigo-700 uppercase">Section Reference</span>
              <p className="text-sm font-bold text-slate-800 mt-1">{item.section_reference || 'N/A'}</p>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed mt-3">
              {item.legal_text || 'Legal documentation will be displayed here.'}
            </p>
          </div>
        )}

        {/* Auditor Comments */}
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={16} className="text-slate-600" />
            <span className="text-sm font-bold text-slate-700">Auditor Comments</span>
          </div>
          <textarea 
            className="w-full bg-white border border-slate-200 rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-300 outline-none transition-all placeholder-slate-400 text-slate-700 resize-none"
            rows="2"
            placeholder="Add your observations or notes..."
            value={comment}
            onChange={(e) => onUpdateAnswer(item.id, { ...answerData, comment: e.target.value })}
          />
        </div>
      </div>

    </div>
  );
};

export default AuditCard;
