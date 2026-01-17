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
import ActiveAuditView from '../components/views/ActiveAuditView';

// Custom Hooks
import { useAuditSession } from '../hooks/useAuditSession';

// Risk scoring
import { computeSessionScore } from '../utils/riskScoring';
import riskWeights from '../config/riskWeights.json';

// Act registry
import { getActData, getActById } from '../data/actRegistry';

// Storage key for auto-save persistence
const STORAGE_KEY = 'sha_intern_session_v1';

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
  const [migrationComplete, setMigrationComplete] = useState(false); // Track if DB migration is done
  
  // Initialization Guard State
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Exit Guard State
  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // ============================================================================
  // AUDIT SESSION HOOK - Manages all audit data and operations
  // ============================================================================
  const auditSession = useAuditSession(currentSessionId, selectedActIds, currentActIndex);

  // Derived audit UI state for navbar
  const isAuditActive = viewState === 'active-audit' || currentScreen === 'audit';
  const currentActId = auditSession.currentActId;
  const currentActData = currentActId ? getActById(currentActId) : null;
  const isLastQuestion = auditSession.isLastQuestion;
  const isLastAct = auditSession.isLastAct;

  // Auto-Restore State on Mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        console.log('[InternPortal] Restoring state from localStorage:', state);
        
        setViewState(state.viewState || 'dashboard');
        setDashboardTab(state.dashboardTab || 'new');
        setCurrentSessionId(state.currentSessionId || null);
        setCurrentScreen(state.currentScreen || 'dashboard');
        setCurrentStep(state.currentStep || 'dashboard');
        setFactoryName(state.factoryName || null);
        setCurrentActIndex(state.currentActIndex || 0);
        
        if (state.selectedActIds && state.selectedActIds.length > 0) {
          setSelectedActIds(state.selectedActIds);
        }
      } catch (err) {
        console.error('[InternPortal] Error restoring state:', err);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    
    // Mark initialization complete (whether we restored state or not)
    setIsInitialized(true);
  }, []);

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

  // Auto-Save State to localStorage
  useEffect(() => {
    // Guard: Don't save until initialization is complete
    if (!isInitialized) return;
    
    const stateToSave = {
      viewState,
      dashboardTab,
      currentSessionId,
      currentScreen,
      currentStep,
      factoryName,
      currentActIndex,
      selectedActIds,
      currentQuestionIndex: auditSession.currentQuestionIndex
    };
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      console.log('[InternPortal] State saved to localStorage');
    } catch (err) {
      console.error('[InternPortal] Error saving state:', err);
    }
  }, [isInitialized, viewState, dashboardTab, currentSessionId, currentScreen, currentStep, factoryName, currentActIndex, selectedActIds, auditSession.currentQuestionIndex]);

  // Auto-save progress every 30 seconds
  useEffect(() => {
    if (currentScreen !== 'audit' || !currentSessionId) return;

    const autoSaveInterval = setInterval(() => {
      auditSession.saveProgress(false); // Silent auto-save
    }, 30000); // 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [currentScreen, currentSessionId, currentActIndex, auditSession]);

  // 1. UPDATE ANSWER - Delegate to hook with auto-save
  const handleUpdateAnswer = async (questionId, newAnswerData) => {
    await auditSession.updateAnswer(questionId, newAnswerData);
    
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

  // 2. NAVIGATION HELPERS
  const nextAct = () => {
    if (currentActIndex < selectedActIds.length - 1) {
      setCurrentActIndex(prev => prev + 1);
      auditSession.setAnswers({}); // Clear answers for new act
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

    // 1. Clear persisted state
    localStorage.removeItem(STORAGE_KEY);

    // 2. Reset Session State
    setCurrentSessionId(null);
    setFactoryName(null);
    setFactoryLocation(null);
    setSelectedActIds([]);

    // 3. Navigate to Dashboard -> Completed Tab
    setViewState('dashboard');
    setCurrentStep('dashboard');
    setDashboardTab('completed'); // <--- Switches the tab automatically

    // 4. Optional: Show Success Modal
    // alert('Audit moved to Completed History'); 
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
      localStorage.removeItem(STORAGE_KEY);
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
      // Note: current_question_index is now managed by useAuditSession hook
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
          onTabChange={setDashboardTab}
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
          company={{ 
            company_name: factoryName, 
            location: factoryLocation 
          }}
          auditData={auditSession.auditData}
          answers={auditSession.answers}
          selectedActs={selectedActIds}
          onSubmitSuccess={handleFinalSubmit}
          onCancel={() => setCurrentScreen('audit')}
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
      // Guard against premature rendering - ensure session is loaded
      if (!currentSessionId) {
        return (
          <div className="flex h-[calc(100vh-64px)] items-center justify-center gap-3 text-blue-600">
            <Loader2 className="animate-spin" size={32} />
            <span className="font-bold text-lg">Loading Session...</span>
          </div>
        );
      }

      return (
        <ActiveAuditView
          auditData={auditSession.auditData}
          answers={auditSession.answers}
          currentQuestionIndex={auditSession.currentQuestionIndex}
          currentActIndex={currentActIndex}
          selectedActIds={selectedActIds}
          onUpdateAnswer={handleUpdateAnswer}
          onNextQuestion={auditSession.nextQuestion}
          onPrevQuestion={auditSession.prevQuestion}
          onSaveProgress={auditSession.saveProgress}
          onSaveAndExit={async () => {
            await auditSession.saveProgress(true);
            localStorage.removeItem(STORAGE_KEY);
            setViewState('dashboard');
            setCurrentStep('dashboard');
            setCurrentScreen('dashboard');
          }}
          onFinishAct={async () => {
            if (auditSession.isLastQuestion) {
              await auditSession.saveProgress(false);
              if (isLastAct) {
                setCurrentScreen('submit-review');
              } else {
                if (window.confirm(`${currentActData?.shortName} audit complete. Ready to audit the next act?`)) {
                  nextAct();
                }
              }
            } else {
              auditSession.nextQuestion();
            }
          }}
          onJumpToQuestion={auditSession.jumpToQuestion}
          loading={auditSession.loading}
          isReady={auditSession.isReady}
        />
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
          onSave: () => auditSession.saveProgress(true),
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
