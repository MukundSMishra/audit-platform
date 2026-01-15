import React, { useState, useEffect } from 'react';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { ShieldCheck, Loader2, LogOut, ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ChevronDown, Menu, FileText, SkipBack, Save, Shield, Briefcase, ArrowLeftCircle } from 'lucide-react';

// Services
import { supabase } from '../services/supabaseClient';
import AuditCard from '../components/AuditCard';
import AuditReport from '../components/AuditReport';
import ActSelector from '../components/ActSelector';
import SubmitForReview from '../components/SubmitForReview';
import BusinessAuditWizard from '../components/BusinessAuditWizard';
import BusinessAuditCard from '../components/BusinessAuditCard';
import ContractManagement from '../components/ContractManagement';
import ClientSelector from '../components/shared/ClientSelector';
import ClientManagement from '../components/admin/ClientManagement';
import ReportDashboard from '../components/ReportDashboard';
import TopNavbar from '../components/TopNavbar';
import Modal from '../components/shared/Modal';
import InternDashboard from '../components/InternDashboard';

// Risk scoring
import { computeSessionScore } from '../utils/riskScoring';
import riskWeights from '../config/riskWeights.json';

// Act registry
import { getActData, getActById } from '../data/actRegistry';

export default function InternPortal({ session, userRole, onLogout }) {
  // Top Navigation Bar State
  const [viewState, setViewState] = useState('dashboard'); // 'dashboard' | 'active-audit' | 'reports-list' | 'view-report'
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  
  // Client-Centric Architecture State
  const [selectedClient, setSelectedClient] = useState(null); // Selected client for audit
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'clients'
  const [dashboardTab, setDashboardTab] = useState('new'); // 'new' | 'in-progress' | 'completed'
  
  // Legacy Flow State (to be phased out)
  const [firmDetails, setFirmDetails] = useState({ name: '', location: '', industry: '' });
  const [currentStep, setCurrentStep] = useState('dashboard'); // 'dashboard' | 'details' | 'selection' | 'client-selector' | 'contract-management' | 'business-audit' | 'regulatory-audit'
  const [selectedContract, setSelectedContract] = useState(null); // Contract selected for audit
  const [factoryHistory, setFactoryHistory] = useState([]); // In-progress audits
  
  // Navigation State (for regulatory audit flow)
  const [currentScreen, setCurrentScreen] = useState('dashboard'); // 'dashboard' | 'audit-type' | 'act-selector' | 'progress' | 'audit' | 'business-audit' | 'submit-review'
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [factoryName, setFactoryName] = useState(null);
  const [factoryLocation, setFactoryLocation] = useState(null);
  const [auditType, setAuditType] = useState(null); // 'regulatory' | 'business'
  const [selectedActIds, setSelectedActIds] = useState([]); // Multiple acts
  const [currentActIndex, setCurrentActIndex] = useState(0); // Which act we're currently auditing
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); 
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false); // Track if DB migration is done

  // Audit State
  const [auditData, setAuditData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({}); 
  const [riskScore, setRiskScore] = useState(0);
  
  // Exit Guard State
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Derived audit UI state for navbar
  const isAuditActive = viewState === 'active-audit' || currentScreen === 'audit';
  const currentActId = isAuditActive && selectedActIds.length ? selectedActIds[currentActIndex] : null;
  const currentActData = currentActId ? getActById(currentActId) : null;
  const isLastQuestion = auditData && auditData.length > 0 ? currentQuestionIndex === auditData.length - 1 : false;
  const isLastAct = selectedActIds && selectedActIds.length > 0 ? currentActIndex === selectedActIds.length - 1 : false;

  // Fetch factory history for dashboard
  useEffect(() => {
    const fetchHistory = async () => {
      if (session && currentStep === 'dashboard') {
        const { data } = await supabase
          .from('audit_sessions')
          .select('id, factory_name, location, created_at, status, current_act_index, current_question_index, last_saved_at, act_id')
          .order('created_at', { ascending: false });
        
        if (data) {
          const uniqueFactories = [];
          const seen = new Set();
          data.forEach(session => {
            const key = `${session.factory_name}-${session.location}`;
            if (!seen.has(key)) {
              seen.add(key);
              uniqueFactories.push(session);
            }
          });
          setFactoryHistory(uniqueFactories);
        }
      }
    };
    fetchHistory();
  }, [session, currentStep]);

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

  // Auto-save progress every 30 seconds and on answer changes
  useEffect(() => {
    if (currentScreen !== 'audit' || !currentSessionId) return;

    const autoSaveInterval = setInterval(() => {
      saveProgress(false); // Silent auto-save
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [currentScreen, currentSessionId, currentActIndex, currentQuestionIndex]);

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

  // Save progress when answer is updated
  const handleUpdateAnswerWithProgress = async (questionId, newAnswerData) => {
    await handleUpdateAnswer(questionId, newAnswerData);
    // Auto-save progress after answer (silent)
    setTimeout(() => saveProgress(false), 500);
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

  // FINAL SUBMISSION: Handle post-submission redirect
  const handleFinalSubmit = () => {
    console.log('Audit submitted successfully. Redirecting to Completed tab...');

    // 1. Reset Session State
    setCurrentSessionId(null);
    setFactoryName(null);
    setFactoryLocation(null);
    setSelectedActIds([]);

    // 2. Navigate to Dashboard -> Completed Tab
    setViewState('dashboard');
    setCurrentStep('dashboard');
    setDashboardTab('completed'); // <--- Switches the tab automatically

    // 3. Optional: Show Success Modal
    // alert('Audit moved to Completed History'); 
  };

  // 4. SAVE PROGRESS
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

  // Navigation guard - uses custom confirmation modal
  const initiateNavigationGuard = (actionCallback) => {
    const auditActive = viewState === 'active-audit' || currentScreen === 'audit';
    if (!auditActive) {
      actionCallback();
      return;
    }

    setPendingNavigation(() => actionCallback);
    setShowExitModal(true);
  };

  // Logout handler with guard
  const handleLogoutWithGuard = async () => {
    initiateNavigationGuard(() => {
      onLogout();
    });
  };

  // InternDashboard Handlers
  const handleStartRegulatoryAudit = (session) => {
    console.log('DEBUG: handleStartRegulatoryAudit called with session:', session);
    setCurrentSessionId(session.id);
    setFactoryName(session.factory_name);
    setFactoryLocation(session.location);
    setAuditType('regulatory');
    // Set both viewState and currentScreen for proper rendering
    setViewState('active-audit');
    setCurrentScreen('act-selector'); // Skip audit-type screen, go directly to act selection
    setCurrentStep('regulatory-audit');
  };

  const handleStartBusinessAudit = (session) => {
    console.log('DEBUG: handleStartBusinessAudit called with session:', session);
    setCurrentSessionId(session.id);
    setFactoryName(session.factory_name);
    setFactoryLocation(session.location);
    setAuditType('business');
    // Set both viewState and currentScreen for proper rendering
    setViewState('active-audit');
    setCurrentScreen('business-audit');
    setCurrentStep('business-audit');
  };

  const handleResumeSession = async (session) => {
    console.log('DEBUG: handleResumeSession called with session:', session);
    setCurrentSessionId(session.id);
    setFactoryName(session.factory_name);
    setFactoryLocation(session.location);
    
    // Fetch session data to restore progress
    const { data: sessionData } = await supabase
      .from('audit_sessions')
      .select('act_ids, current_act_index, current_question_index, act_question_indices')
      .eq('id', session.id)
      .single();
    
    if (sessionData?.act_ids) {
      setSelectedActIds(sessionData.act_ids);
      setCurrentActIndex(sessionData.current_act_index || 0);
      setCurrentQuestionIndex(sessionData.current_question_index || 0);
    }
    
    // Set both viewState and currentScreen for proper rendering
    setViewState('active-audit');
    setCurrentScreen('audit');
    setCurrentStep('regulatory-audit');
  };

  const handleViewReport = (sessionId) => {
    setSelectedSessionId(sessionId);
    setViewState('view-report');
  };

  // Navigation handler for TopNavbar with guard
  const handleNavigate = (destination) => {
    initiateNavigationGuard(() => {
      if (destination === 'dashboard') {
        setActiveTab('dashboard');
        setCurrentStep('dashboard');
        setViewState('dashboard');
      } else if (destination === 'clients') {
        setActiveTab('clients');
        setCurrentStep('dashboard');
      } else if (destination === 'reports-list') {
        setViewState('reports-list');
        setCurrentScreen('audit');
      } else if (destination === 'new-audit') {
        setDashboardTab('new');
        setViewState('dashboard');
        setCurrentStep('dashboard');
      } else if (destination === 'in-progress') {
        setDashboardTab('in-progress');
        setViewState('dashboard');
        setCurrentStep('dashboard');
      } else if (destination === 'completed') {
        setDashboardTab('completed');
        setViewState('dashboard');
        setCurrentStep('dashboard');
      }
    });
  };

  // ============================================================================
  // RENDER CONTENT HELPER - All view logic consolidated
  // ============================================================================
  const renderContent = () => {
    // DASHBOARD VIEW (with InternDashboard component)
    if (currentStep === 'dashboard') {
      return (
        <InternDashboard 
          userEmail={session?.user?.email}
          activeTab={dashboardTab}
          onStartRegulatoryAudit={handleStartRegulatoryAudit}
          onStartBusinessAudit={handleStartBusinessAudit}
          onResumeSession={handleResumeSession}
          onViewReport={handleViewReport}
        />
      );
    }

    // CLIENT SELECTOR VIEW
    if (currentStep === 'client-selector') {
      return (
        <div className="max-w-4xl mx-auto">
          <ClientSelector
            onClientSelected={async (client) => {
              setSelectedClient(client);
              
              if (auditType === 'regulatory') {
                // Create audit session for regulatory audit
                try {
                  const { data: { user } } = await supabase.auth.getUser();
                  
                  const { data, error } = await supabase
                    .from('audit_sessions')
                    .insert([{
                      user_id: user.id,
                      client_id: client.id,
                      factory_name: client.company_name,
                      location: `${client.city}, ${client.state}`,
                      status: 'Planning'
                    }])
                    .select()
                    .single();

                  if (error) throw error;
                  
                  setFactoryName(client.company_name);
                  setFactoryLocation(`${client.city}, ${client.state}`);
                  setCurrentSessionId(data.id);
                  setCurrentScreen('act-selector');
                  setCurrentStep('regulatory-audit');
                } catch (error) {
                  console.error('Error creating audit session:', error);
                  alert('Error creating audit session: ' + error.message);
                }
              } else if (auditType === 'business') {
                // Go to contract management for business audit
                setCurrentStep('contract-management');
              }
            }}
            onAddNewClient={() => {
              // Navigate to clients tab
              setActiveTab('clients');
            }}
          />
        </div>
      );
    }

    // CONTRACT MANAGEMENT VIEW
    if (currentStep === 'contract-management') {
      return (
        <ContractManagement
          client={selectedClient}
          firmName={selectedClient?.company_name || firmDetails.name}
          location={selectedClient?.city ? `${selectedClient.city}, ${selectedClient.state}` : firmDetails.location}
          onBack={() => setCurrentStep('client-selector')}
          onStartAudit={(contract) => {
            setSelectedContract(contract);
            setCurrentStep('business-audit');
          }}
        />
      );
    }

    // BUSINESS AUDIT WIZARD VIEW
    if (currentStep === 'business-audit') {
      return (
        <BusinessAuditWizard
          client={selectedClient}
          factoryName={selectedContract?.contractName || selectedClient?.company_name || firmDetails.name}
          location={selectedContract?.contractType || (selectedClient?.city ? `${selectedClient.city}, ${selectedClient.state}` : firmDetails.location)}
          contractDetails={selectedContract}
          onBack={() => {
            setSelectedContract(null);
            setCurrentStep('contract-management');
          }}
        />
      );
    }

    // REGULATORY AUDIT FLOW - Submit for Review
    if (currentScreen === 'submit-review') {
      return (
        <SubmitForReview
          sessionId={currentSessionId}
          factoryName={factoryName}
          factoryLocation={factoryLocation}
          selectedActIds={selectedActIds}
          onSubmitSuccess={handleFinalSubmit}
          onBack={() => setCurrentScreen('audit')}
        />
      );
    }

    // REGULATORY AUDIT FLOW - Act Selector (Business Audit)
    if (currentScreen === 'business-audit') {
      return (
        <BusinessAuditCard
          factoryName={factoryName}
          location={factoryLocation}
          onBack={() => setCurrentScreen('audit-type')}
          onComplete={() => {
            setCurrentScreen('dashboard');
            alert('Business Audit Complete!');
          }}
        />
      );
    }

    // REGULATORY AUDIT FLOW - Act Selector
    if (currentScreen === 'act-selector') {
      return (
        <ActSelector
          factoryName={factoryName}
          location={factoryLocation}
          onActsSelected={(acts) => {
            setSelectedActIds(acts);
            setCurrentActIndex(0);
            setCurrentScreen('audit');
          }}
        />
      );
    }

    // ACTIVE AUDIT VIEW (Regulatory Audit Questions)
    if (currentScreen === 'audit') {
      // Define variables needed for the audit interface
      const currentActId = selectedActIds[currentActIndex];
      const currentActData = getActById(currentActId);
      const currentQuestion = auditData[currentQuestionIndex];

      if (loading) {
        return (
          <div className="flex h-[calc(100vh-64px)] items-center justify-center gap-3 text-blue-600">
            <Loader2 className="animate-spin" size={32} />
            <span className="font-bold text-lg">Loading Audit Questions...</span>
          </div>
        );
      }

      return (
        <div className="w-full flex flex-col">
          {/* Audit Control Ribbon - Consolidated Navigation, Status & Actions */}
          <div className="w-full bg-white border-b border-gray-200">
            <div className="px-6 py-3 flex justify-between items-center">
              {/* Left Section: Status & Navigation */}
              <div className="flex items-center gap-4">
                <div className="text-sm font-bold text-gray-800">
                  Question {currentQuestionIndex + 1} of {auditData.length}
                </div>
                <div className="h-4 w-px bg-gray-300"></div>
                <div className="text-sm text-gray-500">
                  {Object.keys(answers).length} Answered
                </div>
                
                {/* Navigation Buttons */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={prevQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="px-4 py-2 bg-white border border-slate-300 rounded hover:bg-slate-50 font-medium transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    title="Previous Question"
                  >
                    <ChevronLeft size={18} />
                    Previous
                  </button>
                  <button
                    onClick={async () => {
                      if (currentQuestionIndex === auditData.length - 1) {
                        await saveProgress(false);
                        
                        if (currentActIndex === selectedActIds.length - 1) {
                          setCurrentScreen('submit-review');
                        } else {
                          if (window.confirm(`${currentActData?.shortName} audit complete. Ready to audit the next act?`)) {
                            nextAct();
                          }
                        }
                      } else {
                        nextQuestion();
                      }
                    }}
                    className="px-6 py-2 bg-blue-600 text-white border border-blue-700 rounded hover:bg-blue-700 font-medium transition shadow-sm hover:shadow-md flex items-center gap-2"
                    title="Next Question"
                  >
                    {currentQuestionIndex === auditData.length - 1 
                      ? (currentActIndex === selectedActIds.length - 1 
                        ? <>Complete & Review <FileText size={18} /></> 
                        : <>Next Act <ArrowLeft size={18} /></>)
                      : <>Next <ChevronRight size={18} /></>
                    }
                  </button>
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
                  onClick={() => saveProgress(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg transition"
                >
                  <Save size={16} />
                  Save
                </button>

                {/* Save & Exit Button */}
                <button 
                  onClick={async () => {
                    await saveProgress(true);
                    setViewState('dashboard');
                    setCurrentStep('dashboard');
                    setCurrentScreen('dashboard');
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition"
                >
                  <LogOut size={16} />
                  Save & Exit
                </button>
              </div>
            </div>

            {/* Expanded View: Question Grid */}
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
                            setCurrentQuestionIndex(idx);
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

          {/* Audit Card Container - Centered and Wide */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-8 flex justify-center bg-gray-100/50">
            <div className="w-full max-w-5xl mx-auto h-fit pb-10">
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

          {/* Bottom Navigation Bar - REMOVED: Navigation now in top ribbon */}
        </div>
      );
    }

    // REPORTS ARCHIVE VIEW
    if (viewState === 'reports-list') {
      return (
        <div className="max-w-7xl mx-auto">
          <ReportDashboard onViewReport={(sessionId) => {
            setSelectedSessionId(sessionId);
            setViewState('view-report');
          }} />
        </div>
      );
    }

    // VIEW REPORT VIEW
    if (viewState === 'view-report' && selectedSessionId) {
      return (
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => setViewState('reports-list')}
            className="mb-6 flex items-center gap-2 px-4 py-2 rounded-lg text-blue-600 hover:bg-blue-50 font-medium transition-colors border border-blue-200 hover:border-blue-400"
          >
            <ArrowLeftCircle size={18} />
            Back to Reports Archive
          </button>
          <AuditReport sessionId={selectedSessionId} />
        </div>
      );
    }

    // Default fallback
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* TOP NAVIGATION BAR - Always visible */}
      <TopNavbar 
        viewState={viewState}
        activeTab={viewState === 'dashboard' ? dashboardTab : activeTab}
        onNavigate={handleNavigate}
        onLogout={handleLogoutWithGuard}
        userEmail={session?.user?.email}
        userRole={userRole}
        isAuditActive={isAuditActive}
        auditContext={{
          factoryName,
          actShortName: currentActData?.shortName,
          actProgress: `${currentActIndex + 1}/${selectedActIds.length}`
        }}
        auditActions={{
          onSave: () => saveProgress(true),
          showSubmit: isLastQuestion && isLastAct,
          onSubmit: handleFinalSubmit
        }}
      />

      {/* MAIN CONTENT AREA */}
      <main className="pt-16 px-6 py-8">
        {renderContent()}
      </main>

      {/* Exit Guard Modal */}
      <Modal
        isOpen={showExitModal}
        onClose={() => {
          setShowExitModal(false);
          setPendingNavigation(null);
        }}
        onConfirm={() => {
          if (pendingNavigation) pendingNavigation();
          setShowExitModal(false);
          setPendingNavigation(null);
        }}
        title="Audit in Progress"
        message="Are you sure you want to leave? Unsaved progress may be lost."
        type="warning"
        confirmText="Leave Audit"
        cancelText="Stay"
        showCancel
      />

    </div>
  );
}
