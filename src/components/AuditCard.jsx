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
  const [applicabilityReason, setApplicabilityReason] = useState(answerData?.applicabilityReason || '');
  const [isEvidenceAvailable, setIsEvidenceAvailable] = useState(answerData?.missingEvidenceReason ? 'no' : null);
  const [missingEvidenceReason, setMissingEvidenceReason] = useState(answerData?.missingEvidenceReason || null);
  
  // Slide navigation state (2-slide interface)
  const [currentSlide, setCurrentSlide] = useState(1);
  
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

      {/* BODY CONTAINER */}
      <div className="flex flex-col flex-1">
      {/* 2-SLIDE SPLIT-VIEW CONTAINER */}
      <div className="w-full p-6 bg-gradient-to-br from-slate-50 to-gray-50">
        <div className="w-full bg-white border-2 border-slate-300 rounded-xl p-6 shadow-md">
          
          {/* SLIDE 1: APPLICABILITY GATE (2-Column Split-View) */}
          {currentSlide === 1 && (
            <div className="w-full">
              {/* Section Header */}
              <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                <span>🛡️</span>
                <span>Applicability Assessment</span>
              </h3>
              
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
              
              {/* LEFT COLUMN: Applicability Criteria Context */}
              <div className="h-full">
                <div className="h-full p-5 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info size={20} className="text-blue-600 shrink-0 mt-0.5" strokeWidth={2.5} />
                    <div>
                      <h4 className="text-sm font-bold text-blue-900 mb-2">Applicability Criteria</h4>
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {item.applicability_criteria || "This requirement applies to all facilities unless specifically exempted by regulation."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Decision Interface */}
              <div className="h-full flex flex-col">
                {/* Question Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <AlertCircle size={24} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-extrabold text-slate-900">Is this Applicable?</h3>
                    <p className="text-xs text-slate-600 mt-1">Review the criteria and decide</p>
                  </div>
                </div>

                {/* YES/NO Buttons */}
                <div className="flex gap-4 mb-4">
                  <button
                    onClick={() => {
                      if (isApplicable) return;
                      handleToggle();
                    }}
                    className={`flex-1 py-4 px-6 rounded-xl border-2 font-bold text-base transition-all ${
                      isApplicable
                        ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 text-green-700 shadow-md'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isApplicable ? 'border-green-600 bg-green-600' : 'border-slate-400'
                      }`}>
                        {isApplicable && <Check size={14} className="text-white" strokeWidth={3} />}
                      </div>
                      <span>YES</span>
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      if (!isApplicable) return;
                      handleToggle();
                    }}
                    className={`flex-1 py-4 px-6 rounded-xl border-2 font-bold text-base transition-all ${
                      !isApplicable
                        ? 'border-rose-500 bg-gradient-to-br from-rose-50 to-red-50 text-rose-700 shadow-md'
                        : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        !isApplicable ? 'border-rose-600 bg-rose-600' : 'border-slate-400'
                      }`}>
                        {!isApplicable && <X size={14} className="text-white" strokeWidth={3} />}
                      </div>
                      <span>NO</span>
                    </div>
                  </button>
                </div>

                {/* Conditional: Proceed Button (YES) or Reason Textarea (NO) */}
                {isApplicable && (
                  <div className="mt-auto flex justify-end animate-in slide-in-from-top-2 duration-300">
                    <button
                      onClick={() => setCurrentSlide(2)}
                      className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg flex items-center gap-2"
                    >
                      Yes, Applicable
                      <ChevronDown size={18} className="rotate-[-90deg]" strokeWidth={3} />
                    </button>
                  </div>
                )}

                {!isApplicable && (
                  <div className="mt-auto animate-in slide-in-from-top-2 duration-300">
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Why is it not applicable?
                    </label>
                    <textarea
                      className="w-full bg-white border-2 border-slate-300 rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-rose-400 focus:border-rose-300 outline-none transition-all placeholder-slate-400 text-slate-700 resize-none"
                      rows="3"
                      placeholder="Explain why this requirement does not apply..."
                      value={applicabilityReason}
                      onChange={(e) => setApplicabilityReason(e.target.value)}
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
              </div>

              
              {/* Progress Indicator - Bottom Center */}
              <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-slate-200">
                {[1, 2].map((slide) => (
                  <div
                    key={slide}
                    className={`h-2 rounded-full transition-all ${
                      slide === currentSlide ? 'w-8 bg-gradient-to-r from-blue-500 to-purple-600' : 'w-2 bg-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* SLIDE 2: COMPLIANCE VERIFICATION */}
          {currentSlide === 2 && (
            <div className="w-full">
              {/* Section Header */}
              <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                <span>{isManualObservation ? '🕵️' : '📄'}</span>
                <span>{isManualObservation ? 'Compliance Verification' : 'Evidence Collection'}</span>
              </h3>
              
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4 duration-300">
              
              {/* LEFT COLUMN: Guidance/Requirements */}
              <div className="h-full">
                <div className="h-full bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                  {isManualObservation ? (
                    /* Manual Observation: Inspection Steps */
                    <>
                      <div className="flex items-center gap-2 mb-4">
                        <CheckSquare size={20} className="text-blue-600" strokeWidth={2.5} />
                        <h4 className="text-base font-bold text-blue-900">🕵️ Inspection Guide</h4>
                      </div>
                      <div className="space-y-3">
                        {(item.intern_action_guide?.inspection_steps || item.simplified_guidance?.split('\n') || ['Follow standard inspection procedures']).map((step, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all group">
                            <div className="w-7 h-7 rounded-full border-2 border-blue-300 group-hover:border-blue-600 group-hover:bg-blue-600 flex items-center justify-center shrink-0 mt-0.5 bg-white transition-all">
                              <span className="text-xs font-bold text-blue-600 group-hover:text-white transition-all">{idx + 1}</span>
                            </div>
                            <p className="text-sm text-slate-700 leading-relaxed font-medium flex-1">
                              {typeof step === 'string' ? step : step}
                            </p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    /* AI Evidence: Requirements */
                    <>
                      <div className="flex items-center gap-2 mb-4">
                        <FileText size={20} className="text-purple-600" strokeWidth={2.5} />
                        <h4 className="text-base font-bold text-purple-900">📄 Required Evidence</h4>
                      </div>
                      <div className="bg-white border border-purple-200 p-5 rounded-lg mb-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles size={18} className="text-purple-600" strokeWidth={2.5} />
                          <span className="text-xs font-bold text-purple-700 uppercase">Document Required</span>
                        </div>
                        <p className="text-lg font-extrabold text-slate-900 mb-2">
                          {item.capture_instructions?.document_name || 'Evidence Document'}
                        </p>
                        <p className="text-sm text-slate-700 leading-relaxed">
                          {item.capture_instructions?.instruction || 'Please capture clear evidence for AI verification.'}
                        </p>
                      </div>
                      {item.capture_instructions?.title && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                          <p className="text-xs font-bold text-indigo-700 mb-2 uppercase">Additional Instructions</p>
                          <p className="text-sm text-slate-700 font-medium">
                            {item.capture_instructions.title}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Action Interface */}
              <div className="h-full flex flex-col">
                
                {isManualObservation ? (
                  /* MANUAL OBSERVATION: Direct Compliance Buttons (No availability check) */
                  <div className="flex-1">
                    {/* Compliance Buttons */}
                    <>
                        <h4 className="text-sm font-bold text-slate-700 mb-4">Select Compliance Status</h4>
                        <div className="grid grid-cols-1 gap-3 mb-4">
                          {[
                            { label: 'Compliant', color: 'emerald', gradient: 'from-emerald-500 to-teal-600', icon: CheckCircle },
                            { label: 'Non-Compliant', color: 'rose', gradient: 'from-rose-500 to-pink-600', icon: XCircle }
                          ].map((opt) => {
                            const isSelected = currentStatus === opt.label;
                            return (
                              <button
                                key={opt.label}
                                onClick={() => {
                                  onUpdateAnswer(item.id, { 
                                    ...answerData, 
                                    status: isSelected ? null : opt.label 
                                  });
                                }}
                                className={`relative flex items-center justify-center gap-3 py-5 px-6 rounded-xl border-2 transition-all duration-300 ${
                                  isSelected
                                    ? `border-${opt.color}-500 bg-gradient-to-br ${opt.gradient} shadow-lg` 
                                    : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50 bg-white'
                                }`}
                              >
                                <opt.icon 
                                  size={28} 
                                  strokeWidth={2.5} 
                                  className={isSelected ? 'text-white' : 'text-slate-400'}
                                />
                                <span className={`font-bold text-base ${isSelected ? 'text-white' : 'text-slate-700'}`}>
                                  {opt.label}
                                </span>
                                {isSelected && (
                                  <div className="absolute top-2 right-2">
                                    <Check size={18} className="text-white" strokeWidth={3} />
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Remarks for Non-Compliant */}
                        {currentStatus === 'Non-Compliant' && (
                          <div className="mb-4 animate-in slide-in-from-top-2 duration-300">
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                              Non-Compliance Remarks
                            </label>
                            <textarea
                              className="w-full bg-white border-2 border-slate-300 rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-rose-400 focus:border-rose-300 outline-none transition-all placeholder-slate-400 text-slate-700 resize-none"
                              rows="3"
                              placeholder="Describe the non-compliance observed..."
                              value={comment}
                              onChange={(e) => onUpdateAnswer(item.id, { ...answerData, comment: e.target.value })}
                            />
                          </div>
                        )}

                        {/* Optional Evidence Upload */}
                        {(currentStatus === 'Compliant' || currentStatus === 'Non-Compliant') && (
                          <div className="pt-4 border-t border-slate-200">
                            <div className="flex items-center gap-2 mb-3">
                              <Camera size={16} className="text-slate-600" />
                              <span className="text-sm font-bold text-slate-700">Attach Evidence (Optional)</span>
                            </div>
                            <div 
                              className={`border-2 border-dashed rounded-lg p-4 cursor-pointer transition-all ${
                                evidenceUrl ? 'border-green-400 bg-green-50' : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
                              }`} 
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,.pdf" />
                              {evidenceUrl ? (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle size={20} className="text-green-600" />
                                    <span className="text-sm font-medium text-green-700">Evidence Uploaded</span>
                                  </div>
                                  <a href={evidenceUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline font-bold">View</a>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center gap-2 text-slate-500">
                                  {uploading ? (
                                    <>
                                      <Loader2 size={16} className="animate-spin" />
                                      <span className="text-xs">Uploading...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Upload size={16} />
                                      <span className="text-xs font-medium">Click to Upload</span>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    </div>
                ) : (
                  /* AI EVIDENCE WORKFLOW: Availability check -> Upload or Reason */
                  <>
                    {/* Evidence Availability Question */}
                    <div className="mb-6">
                      <label className="block text-base font-bold text-slate-900 mb-4">
                        Is evidence/observation available?
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => {
                            setIsEvidenceAvailable('yes');
                            setMissingEvidenceReason(null);
                            onUpdateAnswer(item.id, { ...answerData, missingEvidenceReason: null, status: null });
                          }}
                          className={`py-4 px-6 rounded-xl border-2 font-bold transition-all ${
                            isEvidenceAvailable === 'yes'
                              ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 text-green-700 shadow-md'
                              : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isEvidenceAvailable === 'yes' ? 'border-green-600 bg-green-600' : 'border-slate-400'
                            }`}>
                              {isEvidenceAvailable === 'yes' && <Check size={14} className="text-white" strokeWidth={3} />}
                            </div>
                            <span>YES</span>
                          </div>
                        </button>
                        <button
                          onClick={() => setIsEvidenceAvailable('no')}
                          className={`py-4 px-6 rounded-xl border-2 font-bold transition-all ${
                            isEvidenceAvailable === 'no'
                              ? 'border-rose-500 bg-gradient-to-br from-rose-50 to-red-50 text-rose-700 shadow-md'
                              : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isEvidenceAvailable === 'no' ? 'border-rose-600 bg-rose-600' : 'border-slate-400'
                            }`}>
                              {isEvidenceAvailable === 'no' && <X size={14} className="text-white" strokeWidth={3} />}
                            </div>
                            <span>NO</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* If YES: AI Upload Widget */}
                    {isEvidenceAvailable === 'yes' && (
                      <div className="flex-1 animate-in slide-in-from-top-2 duration-300">
                        <h4 className="text-sm font-bold text-slate-700 mb-4">Upload Evidence for AI Verification</h4>
                        <div 
                          className={`border-3 border-dashed rounded-xl cursor-pointer transition-all duration-300 flex flex-col items-center justify-center p-8 ${
                            evidenceUrl 
                              ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-indigo-50' 
                              : 'border-purple-300 bg-purple-50/50 hover:bg-purple-50 hover:border-purple-400'
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
                              <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-xl">
                                <CheckCircle size={40} className="text-white" strokeWidth={2.5} />
                              </div>
                              <p className="text-lg font-bold text-purple-900 mb-2">Evidence Submitted</p>
                              <p className="text-xs text-slate-600 mb-3">AI verification in progress</p>
                              <div className="flex gap-2 justify-center">
                                <a 
                                  href={evidenceUrl} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="px-3 py-1.5 bg-white border-2 border-purple-400 rounded-lg text-xs font-bold text-purple-700 hover:bg-purple-50 transition-all"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  View
                                </a>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); aiFileInputRef.current?.click(); }}
                                  className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg text-xs font-bold hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md"
                                >
                                  Re-upload
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {aiUploading ? (
                                <div className="text-center">
                                  <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-xl">
                                    <Loader2 size={40} className="animate-spin text-white" />
                                  </div>
                                  <p className="text-base font-bold text-purple-900">Uploading...</p>
                                </div>
                              ) : (
                                <div className="text-center">
                                  <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-white border-4 border-purple-400 flex items-center justify-center shadow-xl">
                                    <Camera size={36} className="text-purple-500" strokeWidth={2.5} />
                                  </div>
                                  <p className="text-base font-bold text-slate-900 mb-2">Upload Proof</p>
                                  <p className="text-xs text-slate-600 mb-3">Drag & drop or click to browse</p>
                                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-purple-300 rounded-lg text-xs text-slate-600 font-bold">
                                    <FileText size={14} />
                                    <span>{item.ui_config?.accepted_formats || 'Images & PDF'}</span>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* If NO: Reason Selector */}
                    {isEvidenceAvailable === 'no' && (
                      <div className="flex-1 animate-in slide-in-from-top-2 duration-300">
                        <p className="text-sm text-slate-600 mb-4 font-medium">
                          Select the reason why evidence is not available. This will mark the item as <span className="font-bold text-rose-600">Non-Compliant</span>.
                        </p>
                        
                        <div className="grid grid-cols-1 gap-3 mb-4">
                          {[
                            { id: 'not_maintained', label: 'Document Not Maintained', icon: Ban },
                            { id: 'access_denied', label: 'Access Denied', icon: AlertCircle },
                            { id: 'not_produced', label: 'Not Produced / Lost', icon: XCircle }
                          ].map((option) => {
                            const isSelected = missingEvidenceReason === option.label;
                            return (
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
                                className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                                  isSelected
                                    ? 'border-rose-500 bg-gradient-to-br from-rose-50 to-red-50 shadow-md'
                                    : 'border-slate-200 bg-white hover:border-rose-300 hover:bg-rose-50'
                                }`}
                              >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                  isSelected ? 'bg-rose-500' : 'bg-slate-100'
                                }`}>
                                  <option.icon 
                                    size={20} 
                                    className={isSelected ? 'text-white' : 'text-slate-500'} 
                                    strokeWidth={2.5} 
                                  />
                                </div>
                                <p className={`text-sm font-bold ${
                                  isSelected ? 'text-rose-700' : 'text-slate-700'
                                }`}>
                                  {option.label}
                                </p>
                              </button>
                            );
                          })}
                        </div>

                        {/* Reset Button */}
                        {missingEvidenceReason && (
                          <div className="p-3 bg-rose-50 border-2 border-rose-200 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-bold text-rose-700">Status: Non-Compliant</p>
                                <p className="text-xs text-slate-600 mt-1">Reason: {missingEvidenceReason}</p>
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
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
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

                {/* Back Button */}
                <div className="mt-auto pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setCurrentSlide(1)}
                    className="px-5 py-2.5 bg-white border-2 border-slate-300 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center gap-2"
                  >
                    <ChevronDown size={16} className="rotate-90" strokeWidth={3} />
                    Back
                  </button>
                </div>
              </div>
              </div>
              
              {/* Progress Indicator - Bottom Center */}
              <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-slate-200">
                {[1, 2].map((slide) => (
                  <div
                    key={slide}
                    className={`h-2 rounded-full transition-all ${
                      slide === currentSlide ? 'w-8 bg-gradient-to-r from-blue-500 to-purple-600' : 'w-2 bg-slate-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* FOOTER: Collapsible Sections */}
      <div className="border-t border-gray-200 p-6 space-y-3 bg-slate-50">
        
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

    </div>
  );
};

export default AuditCard;