import React, { useState, useEffect } from 'react';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
// FIX: Added 'FileText' to the imports
import { ShieldCheck, Loader2, Database, LogOut, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Menu, FileText, SkipBack, Save, Shield, Briefcase } from 'lucide-react';

// Services
import { supabase } from './services/supabaseClient';
import AuditCard from './components/AuditCard';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ActSelector from './components/ActSelector';
import AuditProgress from './components/AuditProgress';
import AuditTypeSelector from './components/AuditTypeSelector';
import AdminPortal from './components/admin/AdminPortal';
import BusinessAuditWizard from './components/BusinessAuditWizard';
import BusinessAuditCard from './components/BusinessAuditCard';
import ContractManagement from './components/ContractManagement';
import FactoryHistorySection from './components/FactoryHistorySection';
// Risk scoring
import { computeSessionScore } from './utils/riskScoring';
import riskWeights from './config/riskWeights.json';
// Act registry
import { getActData, getActById } from './data/actRegistry';
// Admin helpers
import { checkUserRole } from './utils/authHelpers';

function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);
  
  // New Firm Details Flow State
  const [firmDetails, setFirmDetails] = useState({ name: '', location: '', industry: '' });
  const [currentStep, setCurrentStep] = useState('details'); // 'details' | 'selection' | 'contract-management' | 'business-audit' | 'regulatory-audit'
  const [selectedContract, setSelectedContract] = useState(null); // Contract selected for audit
  
  // Navigation State (for regulatory audit flow)
  const [currentScreen, setCurrentScreen] = useState('dashboard'); // 'dashboard' | 'audit-type' | 'act-selector' | 'progress' | 'audit' | 'business-audit'
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [factoryName, setFactoryName] = useState(null);
  const [factoryLocation, setFactoryLocation] = useState(null);
  const [auditType, setAuditType] = useState(null); // 'regulatory' | 'business'
  const [selectedActIds, setSelectedActIds] = useState([]); // Multiple acts
  const [currentActIndex, setCurrentActIndex] = useState(0); // Which act we're currently auditing
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); 
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [migrationComplete, setMigrationComplete] = useState(false); // Track if DB migration is done

  // Audit State
  const [auditData, setAuditData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({}); 
  const [riskScore, setRiskScore] = useState(0);

  // 0. AUTH Check
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) { 
        setCurrentScreen('dashboard');
        setCurrentSessionId(null); 
        setFactoryName(null);
        setFactoryLocation(null);
        setSelectedActIds([]);
        setCurrentActIndex(0);
        setUserRole(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Block access to audit screens without authentication
  useEffect(() => {
    if (!session && (currentScreen === 'audit-type' || currentScreen === 'act-selector' || currentScreen === 'audit' || currentScreen === 'progress' || currentScreen === 'business-audit')) {
      setCurrentScreen('dashboard');
      alert('Please login to access the audit portal');
    }
  }, [session, currentScreen]);

  // Check user role after authentication
  useEffect(() => {
    const checkRole = async () => {
      if (session) {
        setRoleLoading(true);
        const role = await checkUserRole();
        setUserRole(role);
        console.log('User role:', role);
        setRoleLoading(false);
      } else {
        setUserRole(null);
        setRoleLoading(false);
      }
    };
    checkRole();
  }, [session]);

  // Check if database migration is complete
  useEffect(() => {
    const checkMigration = async () => {
      try {
        const { data, error } = await supabase
          .from('audit_sessions')
          .select('current_act_index')
          .limit(1);
        
        if (error) {
          if (error.message.includes('column') || error.message.includes('current_act_index')) {
            setMigrationComplete(false);
            console.warn('🚨 Database migration required. Progress saving will not work until migration is complete.');
          }
        } else {
          setMigrationComplete(true);
        }
      } catch (err) {
        console.error('Migration check failed:', err);
        setMigrationComplete(false);
      }
    };
    
    if (session) checkMigration();
  }, [session]);

  // 1. FETCH DATA - Load from JSON based on current act
  useEffect(() => {
    if (!session || !currentSessionId || selectedActIds.length === 0 || currentScreen !== 'audit') return;

    const currentActId = selectedActIds[currentActIndex];

    const fetchAuditSession = async () => {
      setLoading(true);
      try {
        // Load questions from the appropriate JSON file based on current act_id
        const questions = getActData(currentActId);

        // Fetch saved progress from audit_sessions (including per-act question indices)
        const { data: sessionData } = await supabase
          .from('audit_sessions')
          .select('current_act_index, current_question_index, last_saved_at, act_question_indices')
          .eq('id', currentSessionId)
          .single();

        let savedAnswers;
        let answersError;
        
        try {
          const result = await supabase
            .from('session_answers')
            .select('*')
            .eq('session_id', currentSessionId)
            .eq('act_id', currentActId);
          
          savedAnswers = result.data;
          answersError = result.error;
        } catch (err) {
          answersError = err;
        }

        // Handle case where act_id column doesn't exist yet
        if (answersError && answersError.message.includes('act_id')) {
          console.warn('[Data Fetch] act_id column missing, falling back to legacy query');
          const { data: legacyAnswers } = await supabase
            .from('session_answers')
            .select('*')
            .eq('session_id', currentSessionId);
          savedAnswers = legacyAnswers;
        }

        console.log(`[Data Fetch] Query: session_id=${currentSessionId}, act_id=${currentActId}`);

        if (questions) {
          setAuditData(questions);
          
          // Restore progress if resuming session
          if (sessionData && sessionData.current_question_index !== null) {
            // Use per-act question index if available, otherwise fall back to global
            let questionIndexToRestore = sessionData.current_question_index || 0;
            
            if (sessionData.act_question_indices && sessionData.act_question_indices[currentActId] !== undefined) {
              questionIndexToRestore = sessionData.act_question_indices[currentActId];
              console.log(`[Progress Restore] Using per-act index for ${currentActId}: Question ${questionIndexToRestore + 1}`);
            } else {
              console.log(`[Progress Restore] No per-act index found, using global: Question ${questionIndexToRestore + 1}`);
            }
            
            setCurrentQuestionIndex(questionIndexToRestore);
            console.log(`[Progress Restore] Resuming from Question ${questionIndexToRestore + 1}, Act ${currentActIndex + 1}`);
          } else {
            setCurrentQuestionIndex(0); // Reset to first question for new sessions
          }

          const answerMap = {};
          if (savedAnswers) {
            console.log(`[Answer Restore] Loading ${savedAnswers.length} saved answers for act: ${currentActId}`);
            savedAnswers.forEach(row => {
              answerMap[row.question_id] = { 
                status: row.status, 
                evidenceUrl: row.evidence_url,
                comment: row.remarks 
              };
              console.log(`[Answer Restore] Q${row.question_id}: ${row.status || 'null'}`);
            });
            console.log(`[Answer Restore] Loaded answers:`, answerMap);
          } else {
            console.log(`[Answer Restore] No saved answers found for act: ${currentActId}`);
          }
          setAnswers(answerMap);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAuditSession();
  }, [session, currentSessionId, selectedActIds, currentActIndex, currentScreen]);

  // Recompute risk score whenever answers or questions change
  useEffect(() => {
    if (!auditData || auditData.length === 0) { setRiskScore(0); return; }
    setRiskScore(computeSessionScore(auditData, answers, riskWeights));
  }, [auditData, answers]);

  // 2. UPDATE ANSWER
  const handleUpdateAnswer = async (questionId, newAnswerData) => {
    console.log(`[Answer Save] Saving Q${questionId}:`, newAnswerData);
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: newAnswerData
    }));

    const currentActId = selectedActIds[currentActIndex];
    
    // Prepare data for saving - handle missing act_id column gracefully
    const saveData = {
      session_id: currentSessionId,
      question_id: questionId, 
      status: newAnswerData.status || null,
      evidence_url: newAnswerData.evidenceUrl || null,
      remarks: newAnswerData.comment || null,
      updated_at: new Date().toISOString()
    };
    
    // Add act_id only if we're in multi-act mode
    if (currentActId) {
      saveData.act_id = currentActId;
    }
    
    console.log(`[Answer Save] Saving to DB:`, saveData);

    try {
      const { error } = await supabase
        .from('session_answers')
        .upsert(saveData, { 
          onConflict: currentActId ? 'session_id,question_id,act_id' : 'session_id,question_id'
        });

      if (error) {
        console.error("[Answer Save] Error:", error);
        
        // Handle specific missing column error
        if (error.message.includes("act_id") && error.message.includes("schema cache")) {
          alert("Database migration required! The 'act_id' column is missing from session_answers table. Please run the COMPLETE_MIGRATION.sql script.");
          console.error("🚨 MIGRATION REQUIRED: Run COMPLETE_MIGRATION.sql in Supabase to add missing act_id column");
        } else {
          console.error("Save failed:", error.message);
        }
      } else {
        console.log(`[Answer Save] Success for Q${questionId}`);
      }
    } catch (err) {
      console.error("[Answer Save] Exception:", err);
    }
  };

  // 3. NAVIGATION HELPERS
  const nextQuestion = () => {
    if (currentQuestionIndex < auditData.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      window.scrollTo(0,0);
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      window.scrollTo(0,0);
    }
  };

  const nextAct = () => {
    if (currentActIndex < selectedActIds.length - 1) {
      setCurrentActIndex(prev => prev + 1);
      setAnswers({});
    } else {
      // All acts completed
      alert('All audits completed!');
      setCurrentScreen('dashboard');
      setCurrentSessionId(null);
      setSelectedActIds([]);
      setCurrentActIndex(0);
    }
  };

  const goBackToActSelector = () => {
    // Show progress screen when going back from audit (not act-selector)
    setCurrentScreen('progress');
  };

  // 4. GENERATE REPORT
  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text(`Audit Report: ${factoryName}`, 14, 20);
    const rows = auditData.map(item => {
      const record = answers[item.id] || {};
      return [item.id, item.question_text.substring(0,40)+"...", record.status || "Pending", record.comment || "-"];
    });
    autoTable(doc, { head: [['ID', 'Question', 'Status', 'Comment']], body: rows, startY: 30 });
    doc.save('Report.pdf');
  };

  // 5. SAVE PROGRESS
  const saveProgress = async (showNotification = true) => {
    if (!currentSessionId) {
      if (showNotification) alert('No active session found. Please start an audit first.');
      return false;
    }

    try {
      // Fetch existing act_question_indices to preserve progress for all acts
      const { data: existingSession } = await supabase
        .from('audit_sessions')
        .select('act_question_indices')
        .eq('id', currentSessionId)
        .single();

      // Build per-act question index tracking - MERGE with existing data
      const act_question_indices = existingSession?.act_question_indices || {};
      if (currentActIndex < selectedActIds.length) {
        act_question_indices[selectedActIds[currentActIndex]] = currentQuestionIndex;
      }

      console.log('[Save Progress] Saving act_question_indices:', act_question_indices);

      // Try to save with act_ids and per-act tracking first
      let error;
      try {
        const result = await supabase
          .from('audit_sessions')
          .update({
            act_ids: selectedActIds,
            current_act_index: currentActIndex,
            current_question_index: currentQuestionIndex,
            act_question_indices: act_question_indices,
            last_saved_at: new Date().toISOString()
          })
          .eq('id', currentSessionId);
        error = result.error;
      } catch (err) {
        error = err;
      }

      // If act_question_indices column doesn't exist, fall back to saving without it
      if (error && error.message?.includes('act_question_indices')) {
        console.warn('[Save Progress] act_question_indices column not found, saving without it');
        const fallbackResult = await supabase
          .from('audit_sessions')
          .update({
            act_ids: selectedActIds,
            current_act_index: currentActIndex,
            current_question_index: currentQuestionIndex,
            last_saved_at: new Date().toISOString()
          })
          .eq('id', currentSessionId);
        error = fallbackResult.error;
      }

      // If act_ids column doesn't exist, fall back further
      if (error && error.message?.includes('act_ids')) {
        console.warn('[Save Progress] act_ids column not found, saving without it');
        const fallbackResult2 = await supabase
          .from('audit_sessions')
          .update({
            current_act_index: currentActIndex,
            current_question_index: currentQuestionIndex,
            last_saved_at: new Date().toISOString()
          })
          .eq('id', currentSessionId);
        error = fallbackResult2.error;
      }

      if (error) {
        console.error('Error saving progress:', error);
        if (showNotification) alert('Database not updated. Please run the migration SQL first. Check console for details.');
        console.log('🚨 MIGRATION REQUIRED: Run this SQL in Supabase SQL Editor:\n\nALTER TABLE audit_sessions ADD COLUMN IF NOT EXISTS act_ids TEXT[];\nALTER TABLE audit_sessions ADD COLUMN IF NOT EXISTS current_act_index INTEGER DEFAULT 0;\nALTER TABLE audit_sessions ADD COLUMN IF NOT EXISTS current_question_index INTEGER DEFAULT 0;\nALTER TABLE audit_sessions ADD COLUMN IF NOT EXISTS last_saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;');
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
      console.error('Save progress error:', error);
      if (showNotification) alert('Error saving progress. Please try again.');
      return false;
    }
  };

  // Auto-save progress every 30 seconds and on answer changes
  useEffect(() => {
    if (currentScreen !== 'audit' || !currentSessionId) return;

    const autoSaveInterval = setInterval(() => {
      saveProgress(false); // Silent auto-save
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [currentScreen, currentSessionId, currentActIndex, currentQuestionIndex]);

  // Save progress when answer is updated
  const handleUpdateAnswerWithProgress = async (questionId, newAnswerData) => {
    await handleUpdateAnswer(questionId, newAnswerData);
    // Auto-save progress after answer (silent)
    setTimeout(() => saveProgress(false), 500);
  };

  // Handle company selection and progress restoration
  const handleCompanyCreated = async (id, name, location) => {
    setCurrentSessionId(id); 
    setFactoryName(name);
    setFactoryLocation(location);

    // Check if this session has saved progress
    try {
      const { data: sessionData } = await supabase
        .from('audit_sessions')
        .select('current_act_index, current_question_index, act_id, act_ids') // Fetch both old and new fields
        .eq('id', id)
        .single();

      if (sessionData) {
        const actIdsToLoad = sessionData.act_ids || (sessionData.act_id ? [sessionData.act_id] : []);

        if (actIdsToLoad.length > 0 && sessionData.current_question_index !== null) {
          // Session has saved progress - ALWAYS go to progress screen first
          setSelectedActIds(actIdsToLoad);
          setCurrentActIndex(sessionData.current_act_index || 0);
          
          // Restore per-act question index if available
          if (sessionData.act_question_indices && actIdsToLoad[sessionData.current_act_index]) {
            const currentActId = actIdsToLoad[sessionData.current_act_index];
            const savedQuestionIndex = sessionData.act_question_indices[currentActId];
            if (savedQuestionIndex !== undefined && savedQuestionIndex !== null) {
              setCurrentQuestionIndex(savedQuestionIndex);
              console.log(`[Resume] Restored per-act question index: Act ${currentActId} at question ${savedQuestionIndex}`);
            } else {
              setCurrentQuestionIndex(sessionData.current_question_index || 0);
            }
          } else {
            setCurrentQuestionIndex(sessionData.current_question_index || 0);
          }
          
          setCurrentScreen('progress');
          console.log(`[Resume] Restored session with ${actIdsToLoad.length} acts: ${actIdsToLoad.join(', ')}, at act index ${sessionData.current_act_index}`);
        } else {
          // New session or no saved progress - go to audit type selector
          setCurrentScreen('audit-type');
          setSelectedActIds([]);
          setCurrentActIndex(0);
          setAuditType(null);
        }
      } else {
        // Fallback if sessionData is null
        setCurrentScreen('audit-type');
        setSelectedActIds([]);
        setCurrentActIndex(0);
        setAuditType(null);
      }
    } catch (error) {
      console.error('Error checking session progress:', error);
      // Fallback to audit type selector
      setCurrentScreen('audit-type');
      setSelectedActIds([]);
      setCurrentActIndex(0);
      setAuditType(null);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserRole(null);
  };

  if (!session) return <Login />;
  
  // Show loading while checking role
  if (roleLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Show Admin Portal for admin users
  if (session && userRole === 'admin') {
    return <AdminPortal 
      userEmail={session.user.email} 
      onLogout={handleLogout} 
    />;
  }

  // ============================================================================
  // NEW FLOW: FIRM DETAILS → AUDIT SELECTION → AUDIT EXECUTION
  // ============================================================================

  // STEP 1: Firm Details Form
  if (currentStep === 'details') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
              <ShieldCheck className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to AuditAI</h1>
            <p className="text-gray-600">Let's start by capturing your firm details</p>
          </div>

          {/* Form */}
          <form onSubmit={(e) => {
            e.preventDefault();
            if (firmDetails.name && firmDetails.location) {
              setCurrentStep('selection');
            } else {
              alert('Please fill in all required fields');
            }
          }} className="space-y-6">
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Firm / Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={firmDetails.name}
                onChange={(e) => setFirmDetails({ ...firmDetails, name: e.target.value })}
                placeholder="e.g., Tata Steel Ltd."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={firmDetails.location}
                onChange={(e) => setFirmDetails({ ...firmDetails, location: e.target.value })}
                placeholder="e.g., Mumbai, Maharashtra"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Industry / Sector <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                value={firmDetails.industry}
                onChange={(e) => setFirmDetails({ ...firmDetails, industry: e.target.value })}
                placeholder="e.g., Manufacturing, IT Services"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-all"
              >
                Sign Out
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                Continue to Audit Selection
                <ArrowRight size={18} />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // STEP 2: Audit Selection View
  if (currentStep === 'selection') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="font-bold text-xl flex items-center gap-2">
              <ShieldCheck className="text-blue-600"/> AuditAI
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Auditing for: <span className="font-semibold text-gray-900">{firmDetails.name}</span>
              {firmDetails.location && <span className="text-gray-400"> • {firmDetails.location}</span>}
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setCurrentStep('details')}
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Details
            </button>
            <button 
              onClick={handleLogout} 
              className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-2 px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={16}/> Sign Out
            </button>
          </div>
        </div>

        {/* Factory History */}
        <FactoryHistorySection 
          firmName={firmDetails.name}
          onSelectFactory={(sessionId, factoryName, factoryLocation) => {
            setFactoryName(factoryName);
            setFactoryLocation(factoryLocation);
            setCurrentSessionId(sessionId);
            setCurrentScreen('audit-type');
            setCurrentStep('regulatory-audit');
          }}
        />

        {/* Audit Type Cards */}
        <div className="p-8">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Select Audit Type</h2>
            <p className="text-gray-600">Choose the type of audit you want to conduct</p>
          </div>

          <div className="space-y-6">
            {/* Regulatory Risk Audit Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="relative p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-blue-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                      <Shield className="text-white" size={32} strokeWidth={2} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">Regulatory Risk Audit</h3>
                      <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 mt-4 leading-relaxed">
                  Comprehensive compliance assessment across labour laws, environmental regulations, and state-specific requirements.
                </p>
              </div>
              <div className="p-6 border-b border-gray-100">
                <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Key Coverage Areas</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                    <span className="text-sm font-medium">15 Acts & Rules Coverage</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                    <span className="text-sm font-medium">Labour Code Compliance</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                    <span className="text-sm font-medium">Environmental Standards</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                    <span className="text-sm font-medium">Legal Risk Assessment</span>
                  </div>
                </div>
              </div>
              <div className="p-6 bg-white">
                <button
                  onClick={() => {
                    // Set factory details for regulatory flow
                    setFactoryName(firmDetails.name);
                    setFactoryLocation(firmDetails.location);
                    setCurrentScreen('audit-type');
                    setCurrentStep('regulatory-audit');
                  }}
                  className="group w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-xl flex items-center justify-center gap-2"
                >
                  Start Factory Audit
                  <ArrowRight size={20} className="transform transition-transform duration-300 group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Business Risk Audit Card - Use the component */}
            <BusinessAuditCard onStart={() => setCurrentStep('contract-management')} />
          </div>
        </div>
      </div>
    );
  }

  // STEP 3: Contract Management (Before Business Audit)
  if (currentStep === 'contract-management') {
    return (
      <ContractManagement
        firmName={firmDetails.name}
        location={firmDetails.location}
        onBack={() => setCurrentStep('selection')}
        onStartAudit={(contract) => {
          setSelectedContract(contract);
          setCurrentStep('business-audit');
        }}
      />
    );
  }

  // STEP 4: Business Audit Execution
  if (currentStep === 'business-audit') {
    return (
      <BusinessAuditWizard
        factoryName={selectedContract?.contractName || firmDetails.name}
        location={selectedContract?.contractType || firmDetails.location}
        contractDetails={selectedContract}
        onBack={() => {
          setSelectedContract(null);
          setCurrentStep('contract-management');
        }}
      />
    );
  }

  // STEP 3 (Alternative): Regulatory Audit Flow - uses existing screens
  if (currentStep === 'regulatory-audit') {
    // Continue with existing regulatory audit screens
  }

  // ============================================================================
  // EXISTING REGULATORY AUDIT FLOW (Kept for backward compatibility)
  // ============================================================================
  
  // SCREEN 1: Dashboard - Choose Company
  if (currentScreen === 'dashboard') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <h1 className="font-bold text-xl flex items-center gap-2"><ShieldCheck className="text-blue-600"/> AuditAI</h1>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-2"><LogOut size={16}/> Sign Out</button>
        </div>
        <Dashboard 
          userEmail={session.user.email} 
          onCompanyCreated={handleCompanyCreated}
          onStartBusinessAudit={() => {
            // For business audit, we don't need a factory - it's contract-based
            setCurrentScreen('business-audit');
          }}
        />
      </div>
    );
  }

  // SCREEN 2: Progress Overview - Show completion status with percentage bars
  if (currentScreen === 'progress') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <h1 className="font-bold text-xl flex items-center gap-2"><ShieldCheck className="text-blue-600"/> AuditAI</h1>
          <button onClick={() => { supabase.auth.signOut(); setSession(null); }} className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-2"><LogOut size={16}/> Sign Out</button>
        </div>
        <AuditProgress
          company={{ company_name: factoryName, location: factoryLocation }}
          sessionId={currentSessionId}
          selectedActs={selectedActIds.map(actId => {
            const actMetadata = getActById(actId);
            const actQuestions = getActData(actId);
            return {
              id: actId,
              name: actMetadata.name,
              shortName: actMetadata.shortName,
              questions: actQuestions
            };
          })}
          onContinueAudit={async (actIndex) => {
            setCurrentActIndex(actIndex);
            
            // Fetch saved question index for this specific act
            try {
              const { data: sessionData } = await supabase
                .from('audit_sessions')
                .select('act_question_indices')
                .eq('id', currentSessionId)
                .single();
              
              if (sessionData?.act_question_indices && selectedActIds[actIndex]) {
                const actId = selectedActIds[actIndex];
                const savedQuestionIndex = sessionData.act_question_indices[actId];
                if (savedQuestionIndex !== undefined && savedQuestionIndex !== null) {
                  setCurrentQuestionIndex(savedQuestionIndex);
                  console.log(`[Continue Audit] Restored question index for act ${actId}: ${savedQuestionIndex}`);
                } else {
                  setCurrentQuestionIndex(0);
                }
              } else {
                setCurrentQuestionIndex(0);
              }
            } catch (error) {
              console.error('[Continue Audit] Error loading question index:', error);
              setCurrentQuestionIndex(0);
            }
            
            setCurrentScreen('audit');
          }}
          onBackToDashboard={() => setCurrentScreen('dashboard')}
        />
      </div>
    );
  }

  // SCREEN 3: Audit Type Selector - Choose audit type (Regulatory or Business)
  if (currentScreen === 'audit-type') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <h1 className="font-bold text-xl flex items-center gap-2"><ShieldCheck className="text-blue-600"/> AuditAI</h1>
          <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-2"><LogOut size={16}/> Sign Out</button>
        </div>
        <AuditTypeSelector 
          factoryName={factoryName}
          location={factoryLocation}
          onTypeSelected={(type) => {
            setAuditType(type);
            if (type === 'business') {
              setCurrentScreen('business-audit');
            } else {
              setCurrentScreen('act-selector');
            }
          }}
          onBack={() => setCurrentScreen('dashboard')}
        />
      </div>
    );
  }

  // SCREEN 3.5: Business Audit Wizard
  if (currentScreen === 'business-audit') {
    return (
      <BusinessAuditWizard
        factoryName={factoryName || 'Contract Audit'}
        location={factoryLocation || 'Sales & Purchase Contracts'}
        onBack={() => setCurrentScreen('dashboard')}
      />
    );
  }

  // SCREEN 4: Act Selector - Choose which acts to audit (only for new sessions)
  if (currentScreen === 'act-selector') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setCurrentScreen('audit-type')}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="font-bold text-xl flex items-center gap-2"><ShieldCheck className="text-blue-600"/> AuditAI</h1>
          </div>
          <button onClick={() => { supabase.auth.signOut(); setSession(null); }} className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-2"><LogOut size={16}/> Sign Out</button>
        </div>
        <ActSelector 
          factoryName={factoryName}
          location={factoryLocation}
          onActsSelected={async (actIds) => {
            setSelectedActIds(actIds);
            setCurrentActIndex(0);
            
            // Save selected acts to session for progress tracking
            try {
              const { error } = await supabase
                .from('audit_sessions')
                .update({ 
                  act_id: actIds[0], // Keep for backward compatibility
                  act_ids: actIds,   // Save the full array
                  act_question_indices: {}, // Initialize empty per-act tracking
                  status: 'In Progress',
                  current_act_index: 0,
                  current_question_index: 0
                })
                .eq('id', currentSessionId);
              
              if (error) {
                console.error('Error saving act selection:', error);
                alert(`Error saving session: ${error.message}`);
              }
            } catch (error) {
              console.error('Act selection save error:', error);
            }
            
            setCurrentScreen('audit');
          }}
        />
      </div>
    );
  }

  // SCREEN 5: Audit - Conduct the actual audit
  if (currentScreen !== 'audit') return null;

  if (loading) return <div className="flex h-screen items-center justify-center gap-3 text-blue-600"><Loader2 className="animate-spin" size={32} /><span className="font-bold text-lg">Loading Audit Questions...</span></div>;

  const currentActId = selectedActIds[currentActIndex];
  const currentActData = getActById(currentActId);
  const currentQuestion = auditData[currentQuestionIndex];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      
      {/* SIDEBAR NAVIGATION */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} bg-white border-r border-gray-200 flex-shrink-0 transition-all duration-300 flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="mb-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Current Act</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{currentActData?.shortName}</p>
            <p className="text-xs text-gray-500 mt-1">
              {currentActIndex + 1} of {selectedActIds.length} acts
            </p>
          </div>
          <div className="h-px bg-gray-200 mb-3"></div>
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Question Map</h2>
            <div className="text-xs font-mono bg-white px-2 py-1 rounded border border-gray-200 text-gray-500">
              {Object.keys(answers).length} / {auditData.length}
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          <div className="grid grid-cols-5 gap-2">
            {auditData.map((q, idx) => {
              const isAnswered = answers[q.id]?.status;
              const isActive = idx === currentQuestionIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
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
        
        <div className="p-4 border-t border-gray-200 bg-gray-50">
           <button onClick={goBackToActSelector} className="w-full py-2 text-gray-500 hover:text-gray-900 text-sm flex items-center justify-center gap-2 transition-colors border border-gray-200 rounded-lg hover:border-gray-400">
             <SkipBack size={16}/> Back to Acts
           </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors">
              <Menu size={20} />
            </button>
            <div>
              <h1 className="font-bold text-gray-900 text-lg leading-none">{factoryName}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Live Session
                </span>
                {currentActData && (
                  <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {currentActData.shortName} ({currentActIndex + 1}/{selectedActIds.length})
                  </span>
                )}
              </div>
            </div>
          </div>
            <div className="flex gap-3 items-center">
               {/* Risk Score Badge */}
               <div className={`px-3 py-1.5 rounded-lg text-xs font-bold border shadow-sm hidden sm:flex items-center gap-2
                 ${riskScore >= 67 ? 'bg-rose-50 text-rose-700 border-rose-200' : riskScore >= 34 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}
               >
                 <span>Risk Score:</span>
                 <span className="font-extrabold">{riskScore} / 100</span>
               </div>
               
               {/* Save Progress Button */}
               {migrationComplete ? (
                 <button 
                   onClick={() => saveProgress(true)} 
                   className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2"
                 >
                   <Save size={16}/> Save Progress
                 </button>
               ) : (
                 <button 
                   onClick={() => alert('Database migration required. Please run the SQL migration first. Check browser console for instructions.')} 
                   className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow hover:bg-orange-700 transition-all active:scale-95 flex items-center gap-2"
                 >
                   <Save size={16}/> Migration Needed
                 </button>
               )}
               
               {/* Debug: Check Saved Answers */}
               <button 
                 onClick={async () => {
                   const currentActId = selectedActIds[currentActIndex];
                   const { data } = await supabase
                     .from('session_answers')
                     .select('*')
                     .eq('session_id', currentSessionId)
                     .eq('act_id', currentActId);
                   console.log('🔍 Current saved answers:', data);
                   alert(`Found ${data?.length || 0} saved answers. Check console for details.`);
                 }}
                 className="bg-gray-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow hover:bg-gray-700 transition-all"
               >
                 🔍 Debug
               </button>
               
             <button onClick={generatePDF} className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-bold shadow hover:bg-black transition-all active:scale-95 flex items-center gap-2">
               <FileText size={16}/> Report
             </button>
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 flex justify-center bg-gray-100/50">
          <div className="w-full max-w-5xl h-fit pb-10">
            {currentQuestion && (
              <AuditCard 
                key={currentQuestion.id}
                item={currentQuestion}
                index={currentQuestionIndex}
                answerData={answers[currentQuestion.id]}
                onUpdateAnswer={handleUpdateAnswerWithProgress}
              />
            )}
          </div>
        </div>

        {/* Bottom Navigation Bar */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-between items-center shrink-0 z-10">
          <button 
            onClick={prevQuestion}
            disabled={currentQuestionIndex === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${currentQuestionIndex === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50 border border-transparent hover:border-gray-200'}`}
          >
            <ChevronLeft size={20} /> Previous
          </button>

          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-gray-700">Question {currentQuestionIndex + 1}</span>
            <span className="text-xs text-gray-400">of {auditData.length}</span>
          </div>

          <button 
            onClick={() => {
              if (currentQuestionIndex === auditData.length - 1) {
                // Last question of this act
                if (currentActIndex === selectedActIds.length - 1) {
                  // Last act
                  if (window.confirm('You have completed all audit questions. Review your answers?')) {
                    // Could show summary here
                  }
                } else {
                  // More acts to audit
                  if (window.confirm(`${currentActData?.shortName} audit complete. Ready to audit the next act?`)) {
                    nextAct();
                  }
                }
              } else {
                nextQuestion();
              }
            }}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-md hover:shadow-lg ${
              currentQuestionIndex === auditData.length - 1 
                ? 'bg-green-600 hover:bg-green-700 hover:-translate-y-0.5' 
                : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5'
            }`}
          >
            {currentQuestionIndex === auditData.length - 1 
              ? (currentActIndex === selectedActIds.length - 1 
                ? <>Complete All <FileText size={20} /></> 
                : <>Next Act <ArrowLeft size={20} /></>)
              : <>Next <ChevronRight size={20} /></>
            }
          </button>
        </div>

      </div>
    </div>
  );
}

export default App;