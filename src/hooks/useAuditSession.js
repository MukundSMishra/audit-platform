import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { getActData } from '../data/actRegistry';
import { computeSessionScore } from '../utils/riskScoring';
import riskWeights from '../config/riskWeights.json';

/**
 * Custom hook for managing audit session state and operations
 * Isolates all data fetching, answer management, and persistence logic
 * 
 * @param {string} sessionId - Current audit session ID
 * @param {Array<string>} actIds - Array of act IDs being audited
 * @param {number} currentActIndex - Index of currently active act
 * @returns {Object} Audit session state and methods
 */
export function useAuditSession(sessionId, actIds, currentActIndex = 0) {
  // Core State
  const [auditData, setAuditData] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [riskScore, setRiskScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false); // NEW: Prevents blank page bug

  // Derived State
  const currentActId = actIds && actIds.length > 0 ? actIds[currentActIndex] : null;
  const isLastQuestion = auditData && auditData.length > 0 ? currentQuestionIndex === auditData.length - 1 : false;
  const isLastAct = actIds && actIds.length > 0 ? currentActIndex === actIds.length - 1 : false;

  // ============================================================================
  // DATA LOADING - Fetch questions and restore progress
  // ============================================================================
  useEffect(() => {
    if (!sessionId || !actIds || actIds.length === 0 || !currentActId) {
      setIsReady(false);
      return;
    }

    const loadSession = async () => {
      setLoading(true);
      setIsReady(false);
      
      try {
        console.log(`[useAuditSession] Loading session ${sessionId}, act ${currentActId}`);

        // 1. Load questions from JSON
        const questions = getActData(currentActId);
        if (!questions || questions.length === 0) {
          console.error(`[useAuditSession] No questions found for act: ${currentActId}`);
          setLoading(false);
          return;
        }

        // 2. Fetch session progress
        const { data: sessionData } = await supabase
          .from('audit_sessions')
          .select('current_act_index, current_question_index, last_saved_at, act_question_indices')
          .eq('id', sessionId)
          .single();

        // 3. Fetch saved answers (with act_id fallback)
        let savedAnswers;
        let answersError;
        
        try {
          const result = await supabase
            .from('session_answers')
            .select('*')
            .eq('session_id', sessionId)
            .eq('act_id', currentActId);
          
          savedAnswers = result.data;
          answersError = result.error;
        } catch (err) {
          answersError = err;
        }

        // Fallback if act_id column doesn't exist
        if (answersError && answersError.message.includes('act_id')) {
          console.warn('[useAuditSession] act_id column missing, falling back to legacy query');
          const { data: legacyAnswers } = await supabase
            .from('session_answers')
            .select('*')
            .eq('session_id', sessionId);
          savedAnswers = legacyAnswers;
        }

        // 4. Set questions
        setAuditData(questions);

        // 5. Restore question index
        let questionIndexToRestore = 0;
        
        if (sessionData && sessionData.current_question_index !== null) {
          // Use per-act index if available, otherwise fall back to global
          if (sessionData.act_question_indices && sessionData.act_question_indices[currentActId] !== undefined) {
            questionIndexToRestore = sessionData.act_question_indices[currentActId];
            console.log(`[useAuditSession] Using per-act index for ${currentActId}: Question ${questionIndexToRestore + 1}`);
          } else {
            questionIndexToRestore = sessionData.current_question_index || 0;
            console.log(`[useAuditSession] Using global index: Question ${questionIndexToRestore + 1}`);
          }
        }
        
        setCurrentQuestionIndex(questionIndexToRestore);

        // 6. Restore answers
        const answerMap = {};
        if (savedAnswers && savedAnswers.length > 0) {
          console.log(`[useAuditSession] Loading ${savedAnswers.length} saved answers for act: ${currentActId}`);
          savedAnswers.forEach(row => {
            answerMap[row.question_id] = { 
              status: row.status, 
              evidenceUrl: row.evidence_url,
              comment: row.remarks 
            };
          });
        } else {
          console.log(`[useAuditSession] No saved answers found for act: ${currentActId}`);
        }
        
        setAnswers(answerMap);

        // 7. Mark as ready
        setIsReady(true);

      } catch (error) {
        console.error('[useAuditSession] Error loading session:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId, currentActId, actIds]);

  // ============================================================================
  // RISK SCORE CALCULATION
  // ============================================================================
  useEffect(() => {
    if (!auditData || auditData.length === 0) {
      setRiskScore(0);
      return;
    }
    setRiskScore(computeSessionScore(auditData, answers, riskWeights));
  }, [auditData, answers]);

  // ============================================================================
  // ANSWER MANAGEMENT
  // ============================================================================
  const updateAnswer = async (questionId, newAnswerData) => {
    console.log(`[useAuditSession] Saving Q${questionId}:`, newAnswerData);
    
    // Update local state immediately
    setAnswers(prev => ({
      ...prev,
      [questionId]: newAnswerData
    }));

    // Prepare data for Supabase
    const saveData = {
      session_id: sessionId,
      question_id: questionId, 
      status: newAnswerData.status || null,
      evidence_url: newAnswerData.evidenceUrl || null,
      remarks: newAnswerData.comment || null,
      updated_at: new Date().toISOString()
    };
    
    // Add act_id if available
    if (currentActId) {
      saveData.act_id = currentActId;
    }
    
    console.log(`[useAuditSession] Saving to DB:`, saveData);

    try {
      const { error } = await supabase
        .from('session_answers')
        .upsert(saveData, { 
          onConflict: currentActId ? 'session_id,question_id,act_id' : 'session_id,question_id'
        });

      if (error) {
        console.error("[useAuditSession] Save error:", error);
        
        if (error.message.includes("act_id") && error.message.includes("schema cache")) {
          alert("Database migration required! The 'act_id' column is missing from session_answers table. Please run the COMPLETE_MIGRATION.sql script.");
        } else {
          console.error("Save failed:", error.message);
        }
      } else {
        console.log(`[useAuditSession] Success for Q${questionId}`);
      }
    } catch (err) {
      console.error("[useAuditSession] Exception:", err);
    }
  };

  // ============================================================================
  // PROGRESS SAVING
  // ============================================================================
  const saveProgress = async (showNotification = true) => {
    if (!sessionId) {
      if (showNotification) alert('No active session found. Please start an audit first.');
      return false;
    }

    try {
      // Fetch existing act_question_indices to preserve progress for all acts
      const { data: existingSession } = await supabase
        .from('audit_sessions')
        .select('act_question_indices')
        .eq('id', sessionId)
        .single();

      // Build per-act question index tracking - MERGE with existing data
      const act_question_indices = existingSession?.act_question_indices || {};
      if (currentActIndex < actIds.length && currentActId) {
        act_question_indices[currentActId] = currentQuestionIndex;
      }

      console.log('[useAuditSession] Saving act_question_indices:', act_question_indices);

      // Try to save with act_ids and per-act tracking first
      let error;
      try {
        const result = await supabase
          .from('audit_sessions')
          .update({
            act_ids: actIds,
            current_act_index: currentActIndex,
            current_question_index: currentQuestionIndex,
            act_question_indices: act_question_indices,
            last_saved_at: new Date().toISOString()
          })
          .eq('id', sessionId);
        error = result.error;
      } catch (err) {
        error = err;
      }

      // Fallback if act_question_indices column doesn't exist
      if (error && error.message?.includes('act_question_indices')) {
        console.warn('[useAuditSession] act_question_indices column not found, saving without it');
        const fallbackResult = await supabase
          .from('audit_sessions')
          .update({
            act_ids: actIds,
            current_act_index: currentActIndex,
            current_question_index: currentQuestionIndex,
            last_saved_at: new Date().toISOString()
          })
          .eq('id', sessionId);
        error = fallbackResult.error;
      }

      // Fallback if act_ids column doesn't exist
      if (error && error.message?.includes('act_ids')) {
        console.warn('[useAuditSession] act_ids column not found, saving without it');
        const fallbackResult2 = await supabase
          .from('audit_sessions')
          .update({
            current_act_index: currentActIndex,
            current_question_index: currentQuestionIndex,
            last_saved_at: new Date().toISOString()
          })
          .eq('id', sessionId);
        error = fallbackResult2.error;
      }

      if (error) {
        console.error('[useAuditSession] Error saving progress:', error);
        if (showNotification) alert('Database not updated. Please run the migration SQL first. Check console for details.');
        return false;
      }

      if (showNotification) {
        // Show success message briefly
        const message = document.createElement('div');
        message.innerHTML = `✅ Progress saved successfully!<br><small>Question ${currentQuestionIndex + 1}, Act ${currentActIndex + 1}</small>`;
        message.style.cssText = `
          position: fixed; top: 20px; right: 20px; z-index: 9999;
          background: #10B981; color: white; padding: 12px 20px;
          border-radius: 8px; font-weight: bold; box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          line-height: 1.4; font-size: 14px;
        `;
        document.body.appendChild(message);
        setTimeout(() => message.remove(), 3000);
      }

      return true;
    } catch (error) {
      console.error('[useAuditSession] Save progress error:', error);
      if (showNotification) alert('Error saving progress. Please try again.');
      return false;
    }
  };

  // ============================================================================
  // NAVIGATION HELPERS
  // ============================================================================
  const nextQuestion = () => {
    if (currentQuestionIndex < auditData.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const jumpToQuestion = (index) => {
    if (index >= 0 && index < auditData.length) {
      setCurrentQuestionIndex(index);
      window.scrollTo(0, 0);
    }
  };

  // ============================================================================
  // RETURN API
  // ============================================================================
  return {
    // State
    auditData,
    answers,
    currentQuestionIndex,
    riskScore,
    loading,
    isReady, // NEW: Only true when data is fully loaded and ready to display
    
    // Derived
    currentActId,
    isLastQuestion,
    isLastAct,
    
    // Methods
    updateAnswer,
    saveProgress,
    nextQuestion,
    prevQuestion,
    jumpToQuestion,
    
    // Direct state setters (for edge cases)
    setAnswers,
    setCurrentQuestionIndex
  };
}
