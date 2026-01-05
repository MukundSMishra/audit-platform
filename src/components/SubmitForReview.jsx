import React, { useState } from 'react';
import { Send, Loader2, CheckCircle, AlertCircle, FileCheck, Database } from 'lucide-react';

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
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Count stats
  const totalQuestions = auditData.length;
  const answeredQuestions = Object.keys(answers).length;
  const compliantCount = Object.values(answers).filter(a => a.status === 'Compliant').length;
  const nonCompliantCount = Object.values(answers).filter(a => a.status === 'Non-Compliant').length;
  const delayedCount = Object.values(answers).filter(a => a.status === 'Delayed').length;
  const notApplicableCount = Object.values(answers).filter(a => a.status === 'Not Applicable').length;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Construct Work Order object for Universal Agentic Workflow
      const workOrder = {
        agent_id: "safety_expert",
        task_type: "audit_report",
        payload: {
          batch_id: sessionId
        }
      };

      console.log('[SubmitForReview] Submitting work order:', workOrder);

      // Send to Universal Agent Endpoint
      const response = await fetch('http://localhost:8000/invoke-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workOrder)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[SubmitForReview] Agent response:', result);

      // Success!
      setSuccessMessage('Audit submitted successfully! Redirecting to dashboard...');
      
      // Call success callback
      if (onSubmitSuccess) {
        onSubmitSuccess(result);
      }

      // Navigate to Dashboard after short delay
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);

    } catch (err) {
      console.error('[SubmitForReview] Error submitting:', err);
      setError(err.message || 'Failed to submit audit for review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 flex items-center justify-center">
      <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-4">
            <FileCheck className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Submit Audit for AI Review
          </h1>
          <p className="text-gray-600">
            📍 {company.company_name || company.name} • {company.location}
          </p>
        </div>

        {/* Stats Summary */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Audit Summary</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{totalQuestions}</div>
              <div className="text-xs text-gray-600 mt-1">Total Questions</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">{answeredQuestions}</div>
              <div className="text-xs text-gray-600 mt-1">Answered</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{compliantCount}</div>
              <div className="text-xs text-gray-600 mt-1">Compliant</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{nonCompliantCount}</div>
              <div className="text-xs text-gray-600 mt-1">Non-Compliant</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{delayedCount}</div>
              <div className="text-xs text-gray-600 mt-1">Delayed</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">{notApplicableCount}</div>
              <div className="text-xs text-gray-600 mt-1">Not Applicable</div>
            </div>
          </div>
        </div>

        {/* Acts Summary */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-gray-700 mb-3">Acts Audited:</h3>
          <div className="flex flex-wrap gap-2">
            {selectedActs.map(act => (
              <span 
                key={act.id} 
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold"
              >
                {act.shortName}
              </span>
            ))}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-bold text-red-900 mb-1">Submission Failed</h4>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-start gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h4 className="font-bold text-green-900 mb-1">Success!</h4>
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
          <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
            <Database size={16} />
            What happens next?
          </h4>
          <ul className="text-blue-800 text-sm space-y-1.5">
            <li>• Your audit data will be sent to the AI Agent for analysis</li>
            <li>• The AI will review evidence and generate compliance reports</li>
            <li>• Manual observations will be cross-verified with legal requirements</li>
            <li>• Results will be saved to your database for record-keeping</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={submitting || answeredQuestions === 0}
            className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Submitting...
              </>
            ) : (
              <>
                <Send size={20} />
                Submit for AI Review
              </>
            )}
          </button>
        </div>

        {/* Warning if incomplete */}
        {answeredQuestions < totalQuestions && (
          <div className="mt-4 text-center text-sm text-amber-600">
            ⚠️ Note: You have {totalQuestions - answeredQuestions} unanswered questions. 
            Only answered items will be submitted.
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmitForReview;
