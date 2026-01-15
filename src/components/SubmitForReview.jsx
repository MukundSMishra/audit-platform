import React, { useState } from 'react';
import { Send, Loader2, CheckCircle, AlertCircle, FileCheck, Database } from 'lucide-react';
import { supabase } from '../services/supabaseClient'; // Ensure this path is correct

const SubmitForReview = ({ 
  sessionId, 
  company, 
  auditData, 
  answers, 
  selectedActs,
  onSubmitSuccess,
  onCancel 
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [statusStep, setStatusStep] = useState(''); // 'saving' | 'analyzing' | 'done'
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Count stats
  const totalQuestions = auditData.length;
  const answeredQuestions = Object.keys(answers).length;
  const compliantCount = Object.values(answers).filter(a => a.status === 'Compliant').length;
  const nonCompliantCount = Object.values(answers).filter(a => a.status === 'Non-Compliant').length;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setStatusStep('saving');

    try {
      // 1. SAVE DATA TO SUPABASE
      console.log('[SubmitForReview] Step 1: Saving to DB...');
      const batchId = `BATCH-${Date.now()}`;
      
      const recordsToInsert = auditData.map((item) => {
        const answer = answers[item.id] || {};
        
        // Check for direct string URL first (AuditCard format), then legacy array
        let finalEvidenceUrl = "";
        if (answer.evidenceUrl) {
            finalEvidenceUrl = answer.evidenceUrl;
        } else if (answer.files && answer.files.length > 0) {
            finalEvidenceUrl = answer.files.map(f => f.url || f.name).join(", ");
        }

        return {
            session_id: sessionId,
            batch_id: batchId,
            audit_item_id: item.id,
            question_text: item.question,
            category: item.category || "environment",
            risk_level: item.risk || "Medium",
            legal_text: item.legalRef || "",
            user_status: answer.status || "Not Answered",
            user_comment: answer.comment || "",
            evidence_url: finalEvidenceUrl,
            ai_status: "Pending"
        };
      });

      const { error: dbError } = await supabase
        .from('audit_agent_submissions')
        .insert(recordsToInsert);

      if (dbError) throw new Error(`Database Save Failed: ${dbError.message}`);

      console.log('[SubmitForReview] Updating Session Status...');
      const { error: updateError } = await supabase
        .from('audit_sessions')
        .update({ 
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .eq('id', sessionId);
      if (updateError) throw new Error(`Status Update Failed: ${updateError.message}`);

      // 2. TRIGGER AI AGENT
      setStatusStep('analyzing');
      console.log('[SubmitForReview] Step 2: Triggering AI Agent...');

      // CALL THE NEW ENDPOINT
      const response = await fetch('http://localhost:8000/trigger-ai-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          session_id: sessionId 
        })
      });

      if (!response.ok) {
        throw new Error(`AI Server Error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[SubmitForReview] AI Success:', result);

      setStatusStep('done');
      setSuccessMessage(`Success! AI processed ${result.processed_count} items.`);
      
      setTimeout(() => {
        if (onSubmitSuccess) onSubmitSuccess(result);
      }, 2000);

    } catch (err) {
      console.error('[SubmitForReview] Error:', err);
      setError(err.message || 'Submission Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4">
            <FileCheck className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Audit for AI Review</h1>
          <p className="text-gray-600">📍 {company?.company_name || "Company"} • {company?.location || "Location"}</p>
        </div>

        {/* Status Indicators */}
        {submitting && (
           <div className="mb-8 flex justify-center items-center gap-4">
              <div className={`flex items-center gap-2 ${statusStep === 'saving' ? 'text-blue-600 font-bold' : 'text-green-600'}`}>
                 {statusStep === 'saving' ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                 <span>Saving Data...</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-200"></div>
              <div className={`flex items-center gap-2 ${statusStep === 'analyzing' ? 'text-purple-600 font-bold' : (statusStep === 'done' ? 'text-green-600' : 'text-gray-400')}`}>
                 {statusStep === 'analyzing' ? <Loader2 className="animate-spin" size={20} /> : <Database size={20} />}
                 <span>AI Analysis...</span>
              </div>
           </div>
        )}

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-bold text-red-900">Submission Failed</h4>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-xl flex items-start gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-bold text-green-900">Analysis Complete</h4>
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          </div>
        )}

        <div className="flex gap-4 mt-6">
          <button onClick={onCancel} disabled={submitting} className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-all">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting || answeredQuestions === 0} className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2">
            {submitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
            {submitting ? 'Processing...' : 'Submit for AI Review'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubmitForReview;