import React, { useState, useRef } from 'react';
import { BookOpen, Shield, Check, Camera, Loader2, CheckCircle, Ban, AlertCircle, XCircle, ChevronDown } from 'lucide-react';
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

const AuditCard = ({ item, index, answerData, onUpdateAnswer }) => {
  const fileInputRef = useRef(null);
  const aiFileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [aiUploading, setAiUploading] = useState(false);
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

  const handleMarkNotApplicable = () => {
    if (!applicabilityReason.trim()) {
      alert('Please provide a reason for non-applicability.');
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
      alert('Upload Failed');
    } finally {
      setUploading(false);
    }
  };

  const handleAiEvidenceUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setAiUploading(true);
      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `uploads/${item.id}/${fileName}`;
      const { error } = await supabase.storage.from('audit-evidence').upload(filePath, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('audit-evidence').getPublicUrl(filePath);
      onUpdateAnswer(item.id, { ...answerData, evidenceUrl: publicUrl, status: 'submitted_for_ai', missingEvidenceReason: null });
    } catch (err) {
      console.error('AI Evidence upload failed:', err);
      alert('Upload Failed: ' + err.message);
    } finally {
      setAiUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-col font-sans">
      <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-blue-50/30">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <span className="text-gray-400 font-extrabold uppercase tracking-widest text-[10px]">SECTION</span>
            <span className="bg-white border border-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded shadow-sm">{item.category}</span>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-wide shadow-md ring-1 transition-all ${riskColors[displayRiskLevel] || riskColors.Medium}`}>
            <Shield size={14} strokeWidth={3} />
            <span>{displayRiskLevel} Risk</span>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center shrink-0">
            <span className="text-4xl font-black bg-gradient-to-br from-blue-500 to-indigo-600 bg-clip-text text-transparent">{index + 1}</span>
            <span className="text-[9px] font-extrabold text-slate-400 uppercase mt-1">Topic</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-extrabold text-slate-900 leading-tight">{item.question_text || item.question}</h2>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-gradient-to-br from-slate-50 to-gray-50 p-6">
        <div className="bg-white border-2 border-slate-200 rounded-xl shadow-md p-6">
          {currentSlide === 1 && (
            <div className="space-y-6">
              {/* Part A: Legal Mandate (Full Width) */}
              <div className="p-5 bg-slate-100 border border-slate-300 rounded-xl shadow-sm">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">📜 Legal Mandate</p>
                <p className="text-base font-extrabold text-slate-900 mb-3">{item.section_reference || 'Mandate Reference'}</p>
                <p className="text-sm text-slate-800 leading-relaxed">{item.legal_text || 'Legal documentation will be displayed here.'}</p>
              </div>
              
              {/* Part B: 2-Column Grid (Applicability Criteria + Compliance Burden) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                  <p className="text-xs font-bold text-indigo-700 uppercase">🎯 Applicability Criteria</p>
                  <p className="text-sm text-slate-800 mt-3 leading-relaxed">{item.applicability_criteria || 'Criteria not specified'}</p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-xs font-bold text-blue-700 uppercase">⚡ Compliance Burden</p>
                  <p className="text-base font-extrabold text-slate-900 mt-1">{item.question_text || item.question}</p>
                </div>
              </div>

              <div className="p-5 bg-slate-900 text-white rounded-xl border border-slate-800 space-y-4">
                <p className="text-sm font-semibold">Does this Compliance Burden apply to this site?</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={handleMarkApplicable}
                    className={`w-full py-4 px-4 rounded-lg border-2 font-bold text-lg transition-all ${
                      isApplicable ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-800 shadow' : 'border-slate-200 bg-white text-slate-800 hover:border-emerald-300 hover:bg-emerald-50/50'
                    }`}
                  >
                    YES, It Applies
                  </button>
                  <button
                    onClick={() => setApplicabilityChoice('no')}
                    className={`w-full py-4 px-4 rounded-lg border-2 font-bold text-lg transition-all ${
                      !isApplicable ? 'border-rose-400 bg-gradient-to-br from-rose-50 to-red-50 text-rose-800 shadow' : 'border-slate-200 bg-white text-slate-800 hover:border-rose-300 hover:bg-rose-50/60'
                    }`}
                  >
                    NO, Not Applicable
                  </button>
                </div>

                {applicabilityChoice === 'no' && (
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-100">Reason for Non-Applicability</label>
                    <textarea
                      className="w-full rounded-lg border-2 border-slate-200 bg-white text-sm text-slate-800 p-3 focus:ring-2 focus:ring-rose-300 focus:border-rose-300 outline-none transition-all"
                      rows="3"
                      placeholder="Explain why this requirement does not apply to this site."
                      value={applicabilityReason}
                      onChange={(e) => setApplicabilityReason(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleMarkNotApplicable}
                        disabled={!applicabilityReason.trim()}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                          applicabilityReason.trim() ? 'bg-gradient-to-r from-slate-800 to-slate-900 text-white hover:shadow-lg' : 'bg-slate-600/50 text-slate-200 cursor-not-allowed'
                        }`}
                      >
                        <Check size={16} strokeWidth={3} />
                        Mark as N/A
                      </button>
                    </div>
                  </div>
                )}

                {isApplicable && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setCurrentSlide(2)}
                      className="px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold shadow hover:from-indigo-600 hover:to-blue-700 transition-all flex items-center gap-2"
                    >
                      Next: Upload Evidence
                      <ChevronDown size={16} className="-rotate-90" strokeWidth={3} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentSlide === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-indigo-700 uppercase">Evidence & Validation</p>
                  <h3 className="text-lg font-extrabold text-slate-900">Prove Compliance for: {(item.question_text || item.question || '').slice(0, 100)}</h3>
                </div>
                <button onClick={() => setCurrentSlide(1)} className="text-sm font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-2">
                  <ChevronDown size={14} className="rotate-90" />
                  Back to Legal Context
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-xl space-y-3">
                  <p className="text-xs font-bold text-indigo-700 uppercase">What to capture</p>
                  {isManualObservation ? (
                    (item.intern_action_guide?.inspection_steps || item.simplified_guidance?.split('\n') || ['Follow standard inspection procedures']).map((step, idx) => (
                      <div key={idx} className="flex gap-3 bg-white border border-indigo-100 rounded-lg p-3">
                        <span className="text-xs font-bold text-indigo-700">{idx + 1}</span>
                        <p className="text-sm text-slate-800 leading-relaxed">{typeof step === 'string' ? step : step}</p>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="bg-white border border-indigo-100 rounded-lg p-3">
                        <p className="text-xs font-bold text-indigo-700 uppercase">Document Required</p>
                        <p className="text-base font-bold text-slate-900 mt-1">{item.capture_instructions?.document_name || 'Evidence Document'}</p>
                        <p className="text-sm text-slate-700 mt-2 leading-relaxed">{item.capture_instructions?.instruction || 'Please capture clear evidence for AI verification.'}</p>
                      </div>
                      {item.capture_instructions?.title && (
                        <div className="bg-white border border-indigo-100 rounded-lg p-3">
                          <p className="text-xs font-bold text-indigo-700 uppercase">Additional Instructions</p>
                          <p className="text-sm text-slate-800 mt-1">{item.capture_instructions.title}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col gap-4">
                  {isManualObservation ? (
                    <div className="space-y-4">
                      <p className="text-sm font-bold text-slate-800">Upload Evidence (optional)</p>
                      <div
                        className={`border-2 border-dashed rounded-lg p-4 cursor-pointer transition-all ${
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
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm font-bold text-slate-800">Upload Evidence for AI Verification</p>
                      <div
                        className={`border-2 border-dashed rounded-lg p-5 cursor-pointer transition-all flex flex-col items-center justify-center ${
                          evidenceUrl ? 'border-purple-400 bg-purple-50' : 'border-purple-200 bg-purple-50/40 hover:border-purple-400'
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
                          <div className="text-center space-y-2">
                            <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow">
                              <CheckCircle size={30} className="text-white" />
                            </div>
                            <p className="text-sm font-bold text-purple-900">Evidence Submitted</p>
                            <a
                              href={evidenceUrl}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs font-bold text-indigo-700 hover:underline"
                            >
                              View
                            </a>
                          </div>
                        ) : (
                          <div className="text-center space-y-2">
                            {aiUploading ? (
                              <Loader2 size={32} className="animate-spin text-purple-600 mx-auto" />
                            ) : (
                              <Camera size={28} className="text-purple-600 mx-auto" />
                            )}
                            <p className="text-xs text-slate-700">Images & PDF accepted</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <p className="text-sm font-bold text-slate-800">Is evidence available?</p>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => {
                              setIsEvidenceAvailable('yes');
                              setMissingEvidenceReason(null);
                              onUpdateAnswer(item.id, { ...answerData, missingEvidenceReason: null, status: null });
                            }}
                            className={`py-3 rounded-lg border-2 font-bold transition-all ${
                              isEvidenceAvailable === 'yes' ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300'
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setIsEvidenceAvailable('no')}
                            className={`py-3 rounded-lg border-2 font-bold transition-all ${
                              isEvidenceAvailable === 'no' ? 'border-rose-400 bg-rose-50 text-rose-800' : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-rose-300'
                            }`}
                          >
                            No
                          </button>
                        </div>

                        {isEvidenceAvailable === 'no' && (
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
                                    isSelected ? 'border-rose-400 bg-rose-50 text-rose-800' : 'border-slate-200 bg-white hover:border-rose-300'
                                  }`}
                                >
                                  <span className={`w-9 h-9 rounded-full flex items-center justify-center ${isSelected ? 'bg-rose-500' : 'bg-slate-100'}`}>
                                    <option.icon size={18} className={isSelected ? 'text-white' : 'text-slate-600'} />
                                  </span>
                                  <span className="text-sm font-semibold">{option.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <p className="text-sm font-bold text-slate-800">Final Status</p>
                    <div className="grid grid-cols-2 gap-3">
                      {['Compliant', 'Non-Compliant'].map((label) => {
                        const selected = currentStatus === label;
                        return (
                          <button
                            key={label}
                            onClick={() => handleStatusClick(label)}
                            className={`py-3 rounded-lg border-2 font-bold transition-all ${selected ? statusStyles[label] : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300'}`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-bold text-slate-800">Auditor Comment</p>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditCard;