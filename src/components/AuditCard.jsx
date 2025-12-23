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
  
  // Wizard state management
  const [currentStep, setCurrentStep] = useState(1);
  const [showAiHelp, setShowAiHelp] = useState(false);
  
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
          {/* Step Indicator */}
          <div className="flex flex-col items-end shrink-0">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Step {currentStep} of 3</span>
            <div className="flex gap-1.5 mt-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 rounded-full transition-all ${
                    step === currentStep ? 'w-8 bg-gradient-to-r from-blue-500 to-purple-600' : 'w-1.5 bg-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* WIZARD CONTAINER: Conditional 3-Step View */}
      <div className="p-6 bg-gradient-to-br from-slate-50 to-gray-50">
        <div className="bg-white border-2 border-slate-300 rounded-xl p-6 shadow-md">
          
          {/* STEP 1: APPLICABILITY */}
          {currentStep === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Applicability Criteria Display */}
              <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
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

              {/* Main Question */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <AlertCircle size={24} className="text-white" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-extrabold text-slate-900">Is this applicable to the facility?</h3>
                  <p className="text-xs text-slate-600 mt-1">Review the criteria above and determine applicability</p>
                </div>
              </div>

              {/* YES/NO Buttons */}
              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => {
                    if (isApplicable) {
                      // Already applicable, do nothing
                      return;
                    }
                    handleToggle(); // Toggle to applicable
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
                    if (!isApplicable) {
                      // Already not applicable, do nothing
                      return;
                    }
                    handleToggle(); // Toggle to not applicable
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

              {/* If YES is selected: Show Proceed button */}
              {isApplicable && (
                <div className="mt-6 flex justify-end animate-in slide-in-from-top-2 duration-300">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl text-sm font-bold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg flex items-center gap-2"
                  >
                    Continue to Step 2
                    <ChevronDown size={18} className="rotate-[-90deg]" strokeWidth={3} />
                  </button>
                </div>
              )}

              {/* If NO is selected: Show Reason Input */}
              {!isApplicable && (
                <div className="mt-6 animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Why is it not applicable?
                  </label>
                  <textarea
                    className="w-full bg-white border-2 border-slate-300 rounded-lg py-3 px-4 text-sm focus:ring-2 focus:ring-rose-400 focus:border-rose-300 outline-none transition-all placeholder-slate-400 text-slate-700 resize-none"
                    rows="3"
                    placeholder="Explain why this requirement does not apply to this facility..."
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
          )}

          {/* STEP 2: UNDERSTANDING (Placeholder) */}
          {currentStep === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <BookOpen size={40} className="text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Step 2: Understanding</h3>
                <p className="text-slate-600 mb-6">Content Coming Soon</p>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-300 transition-all"
                >
                  ← Back to Step 1
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: EXECUTION (Placeholder) */}
          {currentStep === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                  <CheckSquare size={40} className="text-white" strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Step 3: Execution</h3>
                <p className="text-slate-600 mb-6">Content Coming Soon</p>
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-2.5 bg-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-300 transition-all"
                >
                  ← Back to Step 2
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

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
