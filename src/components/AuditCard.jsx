import React, { useState, useRef } from 'react';
import { Camera, Info, Check, X, Clock, Ban, Loader2, BookOpen, MessageSquare, ChevronDown, ChevronUp, AlertCircle, FileCheck, Paperclip, CheckCircle, XCircle, FileText } from 'lucide-react';
import { uploadEvidence } from '../services/storageClient';

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
        <div className="flex gap-6 mb-8">
          <div className="flex flex-col items-center shrink-0">
            <span className="text-4xl font-black text-slate-200 select-none leading-none tracking-tighter">
              {index + 1}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">Query</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 leading-snug tracking-tight">
            {item.question_text}
          </h2>
        </div>

        {/* 3. APPLICABILITY BLOCK */}
        <div className="mb-8 bg-slate-50 p-5 rounded-xl border border-slate-100">
          <div className="flex justify-between items-start gap-4 mb-4">
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Applicability Condition</h4>
              <ul className="list-disc list-outside ml-4 space-y-1">
                {getBullets(item.applicability_criteria || "Standard Factory Rule").map((point, i) => (
                  <li key={i} className="text-sm text-slate-700 font-medium">{point}</li>
                ))}
              </ul>
            </div>
            
            {/* Toggle Switch */}
            <div className="flex flex-col items-end gap-2 shrink-0 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-gray-400">Applicable?</span>
              <div 
                onClick={handleToggle}
                className={`w-12 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${isApplicable ? 'bg-blue-600' : 'bg-slate-200'}`}
              >
                <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${isApplicable ? 'translate-x-5' : ''}`}></div>
              </div>
            </div>
          </div>
        </div>

        {/* CORE WORKFLOW (Only if Applicable) */}
        {isApplicable && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-8">
            
            {/* 4. OBSERVATION STATUS (Buttons Row) */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                Observation Status
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Compliant', color: 'emerald', icon: CheckCircle },
                  { label: 'Non-Compliant', color: 'rose', icon: XCircle },
                  { label: 'Delayed', color: 'amber', icon: Clock }
                ].map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() => handleStatusClick(opt.label)}
                    className={`flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl border transition-all group
                      ${currentStatus === opt.label 
                        ? `bg-${opt.color}-50 border-${opt.color}-500 text-${opt.color}-900 ring-1 ring-${opt.color}-500 shadow-sm` 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                  >
                    <opt.icon size={24} strokeWidth={2} className={currentStatus === opt.label ? `text-${opt.color}-600` : 'text-slate-300 group-hover:text-slate-400'}/>
                    <span className="font-bold text-xs uppercase tracking-wide">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. AUDIT GUIDELINES */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Audit Guidelines</h4>
              <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400"></div>
                <ol className="space-y-3">
                  {getBullets(item.simplified_guidance).map((step, i) => (
                    <li key={i} className="text-sm text-blue-900 flex gap-3 items-start leading-relaxed">
                      <span className="font-bold text-blue-500 text-xs mt-0.5 bg-blue-100 px-1.5 rounded">{i+1}</span>
                      {step}.
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* 6. EVIDENCE GUIDELINES */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Evidence Guidelines</h4>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                
                {/* Methodology */}
                <div className="flex gap-4 items-center border-b border-slate-200 pb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase min-w-[100px]">Methodology</span>
                  <span className="text-xs font-bold text-slate-800 bg-white px-3 py-1 rounded border border-slate-200 shadow-sm">
                    {item.evidence_required?.methodology || "Direct Observation"}
                  </span>
                </div>

                {/* Compliance Proof */}
                <div className="flex gap-4 items-start">
                  <span className="text-xs font-bold text-emerald-600 uppercase min-w-[100px] mt-0.5">If Compliant</span>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.evidence_required?.compliance_proof || "Upload photo of compliant condition."}
                  </p>
                </div>

                {/* Delay Proof */}
                <div className="flex gap-4 items-start">
                  <span className="text-xs font-bold text-amber-600 uppercase min-w-[100px] mt-0.5">If Delayed</span>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.evidence_required?.delay_proof || "Upload proof of work order or application."}
                  </p>
                </div>
              </div>
            </div>

            {/* 7. UPLOAD INTERFACE */}
            <div>
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                {item.evidence_required?.mandatory ? <span className="text-rose-600">Upload Required</span> : "Upload (Optional)"}
              </h4>
              
              <div className={`border-2 border-dashed rounded-xl transition-all relative overflow-hidden group
                ${evidenceUrl ? 'border-emerald-400 bg-emerald-50/20' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/10'}`}>
                
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,.pdf" />
                
                <div className="p-8 flex flex-col items-center justify-center text-center cursor-pointer" onClick={() => fileInputRef.current.click()}>
                  {evidenceUrl ? (
                    <div className="animate-in zoom-in duration-300">
                      <div className="bg-emerald-100 p-3 rounded-full w-fit mx-auto mb-3 text-emerald-600 ring-4 ring-emerald-50">
                        <Check size={28} strokeWidth={3} />
                      </div>
                      <p className="text-emerald-900 font-bold text-sm mb-2">Evidence Secured</p>
                      <div className="flex gap-3 justify-center">
                        <a href={evidenceUrl} target="_blank" rel="noreferrer" className="text-xs bg-white border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-50" onClick={(e) => e.stopPropagation()}>View</a>
                        <button className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-700">Replace</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-white p-4 rounded-full text-slate-400 shadow-sm border border-slate-100 mb-3 group-hover:text-blue-500 group-hover:scale-110 transition-all">
                        {uploading ? <Loader2 size={28} className="animate-spin"/> : <Paperclip size={28} />}
                      </div>
                      <p className="text-sm font-bold text-slate-700 mb-1 group-hover:text-blue-600 transition-colors">
                        Click to Attach Evidence
                      </p>
                      <p className="text-xs text-slate-400 font-medium">Supports Images & PDF</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Comment Box */}
            <div>
               <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Auditor Comments</h4>
               <div className="relative">
                  <div className="absolute top-3 left-3 text-slate-400"><MessageSquare size={16}/></div>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all placeholder-slate-400 font-medium text-slate-700 resize-none"
                    rows="2"
                    placeholder="Add observations or remarks..."
                    value={comment}
                    onChange={(e) => onUpdateAnswer(item.id, { ...answerData, comment: e.target.value })}
                  />
               </div>
            </div>

          </div>
        )}

        {/* 8. LEGAL REFERENCES */}
        <div className="mt-12 pt-6 border-t border-slate-100">
          <button 
            onClick={() => setIsLegalExpanded(!isLegalExpanded)}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors w-full group"
          >
            <BookOpen size={14} className="group-hover:text-blue-500"/>
            Legal References
            {isLegalExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
          </button>
          
          {isLegalExpanded && (
            <div className="mt-4 p-6 bg-slate-900 rounded-xl text-slate-300 text-xs font-mono leading-relaxed shadow-inner border border-slate-800 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2 mb-3 text-emerald-400 font-bold uppercase tracking-widest text-[10px] border-b border-slate-700 pb-2">
                <FileText size={12}/> Act Reference
              </div>
              <p className="opacity-90">
                {item.legal_text || `(Full legal text for ${item.section_reference} will be displayed here)`}
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AuditCard;