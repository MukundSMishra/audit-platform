import React, { useState, useRef } from 'react';
import { BookOpen, Shield, Check, Camera, Loader2, CheckCircle, Ban, AlertCircle, XCircle, ChevronDown, Trash2 } from 'lucide-react';
import { uploadEvidence } from '../services/storageClient';
import { supabase } from '../services/supabaseClient';
import { computeQuestionWeight, getStatusFactor } from '../utils/riskScoring';
import riskWeights from '../config/riskWeights.json';

const riskColors = {
  Critical: 'bg-rose-50 text-rose-700 border-rose-100 ring-1 ring-rose-200',
  High: 'bg-orange-50 text-orange-700 border-orange-100 ring-1 ring-orange-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-100 ring-1 ring-amber-200',
  Low: 'bg-blue-50 text-blue-700 border-blue-100 ring-1 ring-blue-200',
};

const statusStyles = {
  Compliant: 'border-emerald-500 bg-emerald-50 text-emerald-800',
  'Non-Compliant': 'border-rose-500 bg-rose-50 text-rose-800',
};

const StatusModal = ({ isOpen, type = 'success', title, message, onClose }) => {
  if (!isOpen) return null;

  const iconMap = {
    success: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    error: { icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
    warning: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
  };

  const { icon: Icon, color, bg } = iconMap[type] || iconMap.success;
  const primaryLabel = type === 'error' ? 'Try Again' : 'Got it';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="flex items-start gap-3">
          <span className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg}`}>
            <Icon className={`${color}`} size={28} />
          </span>
          <div className="flex-1 space-y-1">
            <p className="text-base font-bold text-slate-900 leading-tight">{title}</p>
            <p className="text-sm text-slate-700 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="h-10 px-6 rounded-lg bg-slate-900 text-white font-bold text-sm shadow-sm hover:shadow-md transition-all"
          >
            {primaryLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

const AuditCard = ({ item, index, answerData, onUpdateAnswer }) => {
  const fileInputRef = useRef(null);
  const aiFileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [aiUploading, setAiUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [isValidated, setIsValidated] = useState(false);
  const [statusModal, setStatusModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  const [currentSlide, setCurrentSlide] = useState(1);
  const [applicabilityReason, setApplicabilityReason] = useState(answerData?.applicabilityReason || answerData?.comment || '');
  const [isEvidenceAvailable, setIsEvidenceAvailable] = useState(answerData?.missingEvidenceReason ? 'no' : null);
  const [missingEvidenceReason, setMissingEvidenceReason] = useState(answerData?.missingEvidenceReason || null);

  const isAiEvidence = item.workflow_type === 'ai_evidence';
  const isManualObservation = !isAiEvidence;

  const currentStatus = answerData?.status || null;
  const evidenceUrl = answerData?.evidenceUrl || null;
  const comment = answerData?.comment || '';

  const baseWeight = computeQuestionWeight(item, riskWeights);
  const statusFactor = getStatusFactor(currentStatus, riskWeights.statusFactors);
  const contribution = currentStatus === 'Not Applicable' ? 0 : Math.round(baseWeight * statusFactor * 100) / 100;
  const displayRiskLevel = String(item?.risk_level || item?.risk_profile?.severity_level || 'Unknown').trim();

  const initialChoice = currentStatus === 'Not Applicable' ? 'no' : 'yes';
  const [applicabilityChoice, setApplicabilityChoice] = useState(initialChoice);
  const isApplicable = applicabilityChoice === 'yes';

  const showStatusModal = (type, title, message) => {
    setStatusModal({ isOpen: true, type, title, message });
  };

  const handleMarkNotApplicable = () => {
    if (!applicabilityReason.trim()) {
      showStatusModal('warning', 'Reason required', 'Please provide a reason for non-applicability.');
      return;
    }
    onUpdateAnswer(item.id, {
      ...answerData,
      status: 'Not Applicable',
      comment: applicabilityReason.trim(),
      applicabilityReason: applicabilityReason.trim(),
      evidenceUrl: null,
      missingEvidenceReason: null,
    });
  };

  const handleMarkApplicable = () => {
    setApplicabilityChoice('yes');
    setCurrentSlide(2);
    if (currentStatus === 'Not Applicable') {
      onUpdateAnswer(item.id, {
        ...answerData,
        status: null,
        comment: '',
        applicabilityReason: '',
        missingEvidenceReason: null,
      });
    }
  };

  const handleStatusClick = (status) => {
    const nextStatus = currentStatus === status ? null : status;
    onUpdateAnswer(item.id, { ...answerData, status: nextStatus });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadEvidence(file, item.id);
      onUpdateAnswer(item.id, { ...answerData, evidenceUrl: url });
    } catch (error) {
      showStatusModal('error', 'Upload failed', 'We could not upload your file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleAiEvidenceUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ===== STAGE 1: Local Shield (Before Upload) =====
    const MIN_FILE_SIZE = 5 * 1024; // 5KB
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];

    // Check file size
    if (file.size < MIN_FILE_SIZE) {
      showStatusModal('error', 'File too small', 'Minimum file size is 5KB. Please upload a larger file.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      showStatusModal('error', 'File too large', 'Maximum file size is 10MB. Please upload a smaller file.');
      return;
    }

    // Check file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      showStatusModal('error', 'Invalid file type', 'Please upload images (JPG, PNG, WebP, GIF) or PDF files.');
      return;
    }

    try {
      // Clear previous validation state
      setValidationError(null);
      setIsValidated(false);
      setAiUploading(true);

      // ===== STAGE 2: Remote Gatekeeper (Upload & AI Validation) =====
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `uploads/${item.id}/${fileName}`;
      const { error } = await supabase.storage.from('audit-evidence').upload(filePath, file);
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('audit-evidence').getPublicUrl(filePath);

      // Update UI to show we're validating
      setAiUploading(false);
      setIsValidating(true);

      // Call AI validation endpoint
      try {
        const validationResponse = await fetch('http://localhost:8000/validate-evidence', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            evidence_url: publicUrl,
            audit_item_id: item.id,
            document_name: item.capture_instructions?.document_name || 'Evidence Document',
          }),
        });

        if (!validationResponse.ok) {
          throw new Error(`Validation service error: ${validationResponse.statusText}`);
        }

        const validationData = await validationResponse.json();

        if (validationData.is_valid === false) {
          // Validation failed - show reason and clear evidence
          setValidationError(validationData.reason || 'Document quality check failed. Please retry with a clearer image.');
          showStatusModal('error', 'Quality Check Failed', validationData.reason || 'Please provide a clearer document.');
          
          // Clear evidence state - force retake
          onUpdateAnswer(item.id, {
            ...answerData,
            evidenceUrl: null,
            status: null,
            missingEvidenceReason: null,
          });
          
          setIsValidated(false);
        } else {
          // Validation passed
          setIsValidated(true);
          onUpdateAnswer(item.id, {
            ...answerData,
            evidenceUrl: publicUrl,
            status: 'submitted_for_ai',
            missingEvidenceReason: null,
          });
        }
      } catch (validationErr) {
        console.error('AI validation error:', validationErr);
        // If validation service is unavailable, proceed with upload anyway but warn user
        showStatusModal('warning', 'Validation service unavailable', 'Quality check unavailable, but document uploaded. Proceeding with review.');
        onUpdateAnswer(item.id, {
          ...answerData,
          evidenceUrl: publicUrl,
          status: 'submitted_for_ai',
          missingEvidenceReason: null,
        });
      }
    } catch (err) {
      console.error('AI Evidence upload failed:', err);
      showStatusModal('error', 'Upload failed', err?.message || 'Unexpected error occurred during upload.');
    } finally {
      setAiUploading(false);
      setIsValidating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-col font-sans">
      <StatusModal
        isOpen={statusModal.isOpen}
        type={statusModal.type}
        title={statusModal.title}
        message={statusModal.message}
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
      />

      {/* Question Display Section */}
      <div className="flex-1 bg-gradient-to-br from-slate-50 to-gray-50 p-6">
        {/* Question Header */}
        <div className="mb-6">
          <div className="flex justify-between items-start mb-3">
            <span className="bg-white border border-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded shadow-sm">{item.category}</span>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wide shadow-md ring-1 transition-all ml-auto ${riskColors[displayRiskLevel] || riskColors.Medium}`}>
              <Shield size={14} strokeWidth={3} />
              <span>{displayRiskLevel} Risk</span>
            </div>
          </div>
          <h2 className="text-xl font-bold text-slate-900 leading-relaxed mb-4">{item.question_text || item.question}</h2>
          <div className="p-3 bg-white border border-slate-200 rounded-lg">
            <p className="text-sm font-medium text-slate-900 mb-1">{item.section_reference || 'Legal Reference'}</p>
            <p className="text-xs text-slate-700 leading-relaxed">{item.legal_text || 'Legal documentation will be displayed here.'}</p>
          </div>
        </div>
        <div className="bg-white border-2 border-slate-200 rounded-xl shadow-md p-6">
          {currentSlide === 1 && (
            <div className="space-y-4">
              {/* Applicability Criteria */}
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                <p className="text-xs font-bold text-indigo-700 uppercase mb-2">🎯 Applicability Criteria</p>
                <p className="text-sm text-slate-800 leading-relaxed">{item.applicability_criteria || 'Criteria not specified'}</p>
              </div>

              {/* Decision Section */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <p className="text-sm font-semibold text-slate-900">Does this requirement apply to this firm?</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <button
                    onClick={handleMarkApplicable}
                    className={`w-full py-2.5 px-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                      isApplicable ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-800 shadow' : 'border-slate-300 bg-white text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/50'
                    }`}
                  >
                    YES, Applies
                  </button>
                  <button
                    onClick={() => setApplicabilityChoice('no')}
                    className={`w-full py-2.5 px-3 rounded-lg border-2 font-semibold text-sm transition-all ${
                      !isApplicable ? 'border-rose-400 bg-gradient-to-br from-rose-50 to-red-50 text-rose-800 shadow' : 'border-slate-300 bg-white text-slate-800 hover:border-rose-300 hover:bg-rose-50/60'
                    }`}
                  >
                    NO, Not Applicable
                  </button>
                </div>

                {applicabilityChoice === 'no' && (
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-900">Reason for Non-Applicability</label>
                    <textarea
                      className="w-full rounded-lg border-2 border-slate-200 bg-white text-sm text-slate-800 p-3 focus:ring-2 focus:ring-rose-300 focus:border-rose-300 outline-none transition-all"
                      rows="3"
                      placeholder="Explain why this requirement does not apply to this firm."
                      value={applicabilityReason}
                      onChange={(e) => setApplicabilityReason(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleMarkNotApplicable}
                        disabled={!applicabilityReason.trim()}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                          applicabilityReason.trim() ? 'bg-slate-900 text-white hover:shadow-lg hover:bg-slate-800' : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        <Check size={14} strokeWidth={3} />
                        Mark as N/A
                      </button>
                    </div>
                  </div>
                )}

                {isApplicable && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setCurrentSlide(2)}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-sm font-semibold shadow hover:from-indigo-600 hover:to-blue-700 transition-all flex items-center gap-2"
                    >
                      Next: Evidence
                      <ChevronDown size={14} className="-rotate-90" strokeWidth={3} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentSlide === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-bold text-indigo-700 uppercase">Evidence Collection</p>
                  <h3 className="text-base font-extrabold text-slate-900">Upload Evidence</h3>
                </div>
                <button onClick={() => setCurrentSlide(1)} className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1">
                  <ChevronDown size={12} className="rotate-90" />
                  Back
                </button>
              </div>

              {/* Slide 2 Content Container */}
              <div className="space-y-4">
                {isManualObservation ? (
                  // Manual Observation Workflow
                  <div className="space-y-4">
                    {/* Guidelines Section */}
                    <div className="p-4 bg-white border border-slate-200 rounded-lg">
                      <p className="text-sm font-semibold text-slate-900 mb-3">Inspection Guidelines</p>
                      <div className="space-y-2">
                        {(item.intern_action_guide?.inspection_steps || item.simplified_guidance?.split('\n') || ['Follow standard inspection procedures']).map((step, idx) => (
                          <div key={idx} className="flex gap-3">
                            <span className="font-bold text-indigo-600 shrink-0 text-sm">{idx + 1}.</span>
                            <p className="text-sm text-slate-700">{typeof step === 'string' ? step : step}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Optional Evidence Upload */}
                    <div className="p-4 bg-white border border-slate-200 rounded-lg">
                      <p className="text-sm font-semibold text-slate-800 mb-3">Upload Evidence (Optional)</p>
                      <div
                        className={`border-2 border-dashed rounded-lg p-3 cursor-pointer transition-all ${
                          evidenceUrl ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,.pdf" />
                        {evidenceUrl ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CheckCircle size={20} className="text-emerald-600" />
                              <span className="text-sm font-medium text-emerald-700">Evidence Uploaded</span>
                            </div>
                            <a href={evidenceUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-700 hover:underline font-bold">View</a>
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
                                <Camera size={16} />
                                <span className="text-xs font-medium">Click to Upload</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Compliance Status - Manual Only */}
                    <div className="p-4 bg-white border border-slate-200 rounded-lg">
                      <p className="text-sm font-semibold text-slate-800 mb-3">Compliance Status</p>
                      <div className="grid grid-cols-2 gap-2">
                        {['Compliant', 'Non-Compliant'].map((label) => {
                          const selected = currentStatus === label;
                          return (
                            <button
                              key={label}
                              onClick={() => handleStatusClick(label)}
                              className={`h-12 rounded-lg border-2 font-semibold text-sm transition-all ${selected ? statusStyles[label] : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300'}`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  // AI/Document Proof Workflow
                  <div className="space-y-4">
                    {/* Document Required Section */}
                    <div className="p-4 bg-white border border-slate-200 rounded-lg">
                      <p className="text-sm font-semibold text-slate-900 mb-3">Document Required</p>
                      <p className="text-sm font-semibold text-slate-900 mb-1">{item.capture_instructions?.document_name || 'Evidence Document'}</p>
                      <p className="text-sm text-slate-700">{item.capture_instructions?.instruction || 'Please capture clear evidence for AI verification.'}</p>
                      {item.capture_instructions?.title && (
                        <div className="pt-3 mt-3 border-t border-slate-200">
                          <p className="text-xs font-bold text-slate-600 uppercase mb-1">Additional Instructions</p>
                          <p className="text-sm text-slate-700">{item.capture_instructions.title}</p>
                        </div>
                      )}
                    </div>

                    {/* Step 1: Is evidence available? */}
                    <div className="p-4 bg-white border border-slate-200 rounded-lg">
                      <p className="text-sm font-semibold text-slate-800 mb-3">Is evidence available?</p>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setIsEvidenceAvailable('yes');
                            setMissingEvidenceReason(null);
                            onUpdateAnswer(item.id, { ...answerData, missingEvidenceReason: null, status: null });
                          }}
                          className={`h-12 rounded-lg border-2 font-semibold text-sm transition-all ${
                            isEvidenceAvailable === 'yes' ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300'
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() => setIsEvidenceAvailable('no')}
                          className={`h-12 rounded-lg border-2 font-semibold text-sm transition-all ${
                            isEvidenceAvailable === 'no' ? 'border-rose-400 bg-rose-50 text-rose-800' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-rose-300'
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>

                    {/* Step 2 (Yes): Upload Widget */}
                    {isEvidenceAvailable === 'yes' && (
                      <div className="p-4 bg-white border border-slate-200 rounded-lg">
                        <p className="text-sm font-semibold text-slate-800 mb-3">Upload Evidence for AI Review</p>
                        <div
                          className={`border-2 border-dashed rounded-lg p-4 cursor-pointer transition-all flex flex-col items-center justify-center ${
                            isValidating ? 'border-blue-300 bg-blue-50' : evidenceUrl ? 'border-purple-400 bg-purple-50' : 'border-purple-200 bg-purple-50/40 hover:border-purple-400'
                          }`}
                          onClick={() => !evidenceUrl && !isValidating && aiFileInputRef.current?.click()}
                        >
                          <input
                            type="file"
                            ref={aiFileInputRef}
                            className="hidden"
                            onChange={handleAiEvidenceUpload}
                            accept={item.ui_config?.accepted_formats || 'image/*,.pdf'}
                          />

                          {/* Uploading State */}
                          {aiUploading && !isValidating && (
                            <div className="text-center space-y-2">
                              <Loader2 size={28} className="animate-spin text-purple-600 mx-auto" />
                              <p className="text-sm font-semibold text-slate-700">Uploading...</p>
                            </div>
                          )}

                          {/* Validating State */}
                          {isValidating && (
                            <div className="text-center space-y-2">
                              <Loader2 size={28} className="animate-spin text-blue-600 mx-auto" />
                              <p className="text-sm font-semibold text-slate-700">Analyzing quality...</p>
                              <p className="text-xs text-slate-600">Please wait while AI validates document</p>
                            </div>
                          )}

                          {/* Validated State - Success */}
                          {isValidated && evidenceUrl && (
                            <div className="text-center space-y-2">
                              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow">
                                <CheckCircle size={32} className="text-white" />
                              </div>
                              <p className="text-sm font-semibold text-emerald-900">✅ Quality Verified</p>
                              <p className="text-xs text-emerald-700 font-medium">Document meets quality standards</p>
                              <div className="flex items-center justify-center gap-3">
                                <a
                                  href={evidenceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs font-semibold text-indigo-700 hover:underline"
                                >
                                  View Document
                                </a>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsValidated(false);
                                    setValidationError(null);
                                    onUpdateAnswer(item.id, {
                                      ...answerData,
                                      evidenceUrl: null,
                                      files: [],
                                      status: null,
                                    });
                                  }}
                                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline"
                                  title="Delete and re-upload"
                                >
                                  <Trash2 size={14} />
                                  Remove
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Submitted State (without validation) */}
                          {evidenceUrl && !isValidated && !isValidating && (
                            <div className="text-center space-y-2">
                              <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow">
                                <CheckCircle size={24} className="text-white" />
                              </div>
                              <p className="text-sm font-semibold text-purple-900">Evidence Submitted</p>
                              <div className="flex items-center justify-center gap-3">
                                <a
                                  href={evidenceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs font-semibold text-indigo-700 hover:underline"
                                >
                                  View Document
                                </a>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsValidated(false);
                                    setValidationError(null);
                                    onUpdateAnswer(item.id, {
                                      ...answerData,
                                      evidenceUrl: null,
                                      files: [],
                                      status: null,
                                    });
                                  }}
                                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline"
                                  title="Delete and re-upload"
                                >
                                  <Trash2 size={14} />
                                  Remove
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Ready to Upload State */}
                          {!evidenceUrl && !aiUploading && !isValidating && (
                            <div className="text-center space-y-2">
                              <Camera size={28} className="text-purple-600 mx-auto" />
                              <p className="text-sm text-slate-700">Click to Upload</p>
                              <p className="text-xs text-slate-600">(Images & PDF accepted)</p>
                            </div>
                          )}
                        </div>

                        {/* Validation Error Alert */}
                        {validationError && (
                          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                            <p className="text-xs font-semibold text-rose-900 mb-1">Quality Check Failed</p>
                            <p className="text-xs text-rose-800">{validationError}</p>
                            <p className="text-xs text-rose-700 mt-2 font-medium">Please upload a clearer document to proceed.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 2 (No): Reason Checklist */}
                    {isEvidenceAvailable === 'no' && (
                      <div className="p-4 bg-white border border-slate-200 rounded-lg">
                        <p className="text-sm font-semibold text-slate-800 mb-3">Reason for Missing Evidence</p>
                        <div className="space-y-2">
                          {[{ id: 'not_maintained', label: 'Document Not Maintained', icon: Ban }, { id: 'access_denied', label: 'Access Denied', icon: AlertCircle }, { id: 'not_produced', label: 'Not Produced / Lost', icon: XCircle }].map((option) => {
                            const isSelected = missingEvidenceReason === option.label;
                            return (
                              <button
                                key={option.id}
                                onClick={() => {
                                  setMissingEvidenceReason(option.label);
                                  onUpdateAnswer(item.id, { ...answerData, status: 'Non-Compliant', missingEvidenceReason: option.label, evidenceUrl: null });
                                }}
                                className={`w-full p-3 rounded-lg border-2 flex items-center gap-3 text-left transition-all ${
                                  isSelected ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white hover:border-rose-300'
                                }`}
                              >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 flex-none ${isSelected ? 'bg-rose-500' : 'bg-slate-100'}`}>
                                  <option.icon size={14} className={isSelected ? 'text-white' : 'text-slate-600'} strokeWidth={2} />
                                </span>
                                <span className="text-sm font-semibold">{option.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Auditor Comments - Permanently Below Slide Container */}
      <div className="px-6 py-4 border-t border-gray-100 bg-white">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-800">Auditor Comments</label>
          <textarea
            className="w-full rounded-lg border-2 border-slate-200 bg-white text-sm text-slate-800 p-3 focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 outline-none transition-all"
            rows="3"
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