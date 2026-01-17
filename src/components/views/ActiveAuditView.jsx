import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Save, LogOut, ChevronDown, Loader2 } from 'lucide-react';
import AuditCard from '../AuditCard';
import { getActById } from '../../data/actRegistry';

/**
 * ActiveAuditView - Pure presentation component for the audit interface
 * Handles rendering only, all logic is managed by parent (InternPortal)
 * 
 * @param {Object} props
 * @param {Array} props.auditData - Array of question objects
 * @param {Object} props.answers - Map of question_id to answer data
 * @param {number} props.currentQuestionIndex - Current question index
 * @param {number} props.currentActIndex - Current act index
 * @param {Array} props.selectedActIds - Array of selected act IDs
 * @param {Function} props.onUpdateAnswer - Handler for answer updates
 * @param {Function} props.onNextQuestion - Navigate to next question
 * @param {Function} props.onPrevQuestion - Navigate to previous question
 * @param {Function} props.onSaveProgress - Save progress handler
 * @param {Function} props.onSaveAndExit - Save and exit handler
 * @param {Function} props.onFinishAct - Handler for completing current act
 * @param {Function} props.onJumpToQuestion - Jump to specific question index
 * @param {boolean} props.loading - Loading state
 * @param {boolean} props.isReady - Data ready state
 */
export default function ActiveAuditView({
  auditData,
  answers,
  currentQuestionIndex,
  currentActIndex,
  selectedActIds,
  onUpdateAnswer,
  onNextQuestion,
  onPrevQuestion,
  onSaveProgress,
  onSaveAndExit,
  onFinishAct,
  onJumpToQuestion,
  loading,
  isReady
}) {
  const [isMapOpen, setIsMapOpen] = useState(false);

  // Derived values
  const currentActId = selectedActIds && selectedActIds.length > 0 ? selectedActIds[currentActIndex] : null;
  const currentActData = currentActId ? getActById(currentActId) : null;
  const currentQuestion = auditData && auditData.length > 0 ? auditData[currentQuestionIndex] : null;
  const isLastQuestion = auditData && auditData.length > 0 ? currentQuestionIndex === auditData.length - 1 : false;
  const isLastAct = selectedActIds && selectedActIds.length > 0 ? currentActIndex === selectedActIds.length - 1 : false;
  const answeredCount = Object.keys(answers).length;

  // Show loader if explicitly loading OR if data hasn't arrived yet
  if (loading || !isReady || !auditData || auditData.length === 0) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center gap-3 text-blue-600">
        <Loader2 className="animate-spin" size={32} />
        <span className="font-bold text-lg">Loading Audit Questions...</span>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      {/* ========================================================================
          AUDIT CONTROL RIBBON - Status, Question Map, Actions
          ======================================================================== */}
      <div className="w-full bg-white border-b border-gray-200">
        <div className="px-6 py-3 flex justify-between items-center">
          {/* Left Section: Status */}
          <div className="flex items-center gap-4">
            <div className="text-sm font-bold text-gray-800">
              Question {currentQuestionIndex + 1} of {auditData.length}
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <div className="text-sm text-gray-500">
              {answeredCount} Answered
            </div>
          </div>

          {/* Right Section: Actions */}
          <div className="flex items-center gap-2">
            {/* Question Map Toggle */}
            <button
              onClick={() => setIsMapOpen(!isMapOpen)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 rounded-lg transition"
            >
              {isMapOpen ? 'Hide' : 'Show'} Question Map
              <ChevronDown size={16} className={`transition-transform ${isMapOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Save Button */}
            <button
              onClick={() => onSaveProgress(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition"
            >
              <Save size={16} />
              Save
            </button>

            {/* Save & Exit Button */}
            <button 
              onClick={onSaveAndExit}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition"
            >
              <LogOut size={16} />
              Save & Exit
            </button>
          </div>
        </div>

        {/* ========================================================================
            QUESTION MAP - Expandable grid showing all questions
            ======================================================================== */}
        {isMapOpen && (
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-10 gap-2">
                {auditData.map((q, idx) => {
                  const isAnswered = answers[q.id]?.status;
                  const isActive = idx === currentQuestionIndex;
                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        onJumpToQuestion(idx);
                        setIsMapOpen(false);
                      }}
                      className={`h-10 w-10 rounded-lg text-xs font-bold transition-all flex items-center justify-center
                        ${isActive ? 'ring-2 ring-blue-600 ring-offset-1 z-10 scale-105' : 'hover:scale-105'}
                        ${isAnswered 
                          ? (answers[q.id].status === 'Non-Compliant' 
                              ? 'bg-red-100 text-red-700 border border-red-200' 
                              : answers[q.id].status === 'Delayed'
                                ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                : 'bg-emerald-100 text-emerald-700 border border-emerald-200') 
                          : 'bg-white text-gray-400 border border-gray-200 hover:border-gray-300'
                        }
                      `}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================
          AUDIT CARD CONTAINER - Main question display
          ======================================================================== */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-8 flex justify-center bg-gray-100/50">
        <div className="w-full max-w-5xl mx-auto h-fit pb-10">
          {currentQuestion && (
            <AuditCard 
              key={currentQuestion.id}
              item={currentQuestion}
              index={currentQuestionIndex}
              answerData={answers[currentQuestion.id]}
              onUpdateAnswer={onUpdateAnswer}
            />
          )}

          {/* ========================================================================
              BOTTOM NAVIGATION FOOTER - Previous/Next buttons
              ======================================================================== */}
          <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20 mt-6 flex justify-between items-center rounded-t-xl">
            {/* Previous Button */}
            <button
              onClick={onPrevQuestion}
              disabled={currentQuestionIndex === 0 && currentActIndex === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                currentQuestionIndex === 0 && currentActIndex === 0
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-slate-700 hover:bg-slate-100 border border-slate-200 hover:border-slate-300'
              }`}
            >
              <ArrowLeft size={20} />
              <span>Previous</span>
            </button>

            {/* Next / Finish Button */}
            <button
              onClick={onFinishAct}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95"
            >
              <span>
                {isLastQuestion && isLastAct ? 'Finish Audit' : 'Next Question'}
              </span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
