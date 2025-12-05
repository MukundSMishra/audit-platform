import React, { useState, useEffect } from 'react';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
// FIX: Added 'FileText' to the imports
import { ShieldCheck, Loader2, Database, LogOut, ArrowLeft, ChevronLeft, ChevronRight, Menu, FileText } from 'lucide-react';

// Services
import { supabase } from './services/supabaseClient';
import AuditCard from './components/AuditCard';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
// Risk scoring
import { computeSessionScore } from './utils/riskScoring';
import riskWeights from './config/riskWeights.json';
// Act registry
import { getActData, getActById } from './data/actRegistry';

function App() {
  const [session, setSession] = useState(null);
  
  // Navigation State
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [factoryName, setFactoryName] = useState(null);
  const [selectedActId, setSelectedActId] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); 
  const [isSidebarOpen, setSidebarOpen] = useState(true);

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
        setCurrentSessionId(null); 
        setFactoryName(null);
        setSelectedActId(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // 1. FETCH DATA - Load from JSON based on selected act
  useEffect(() => {
    if (!session || !currentSessionId || !selectedActId) return;

    const fetchAuditSession = async () => {
      setLoading(true);
      try {
        // Load questions from the appropriate JSON file based on act_id
        const questions = getActData(selectedActId);

        const { data: savedAnswers } = await supabase
          .from('session_answers')
          .select('*')
          .eq('session_id', currentSessionId);

        if (questions) {
          setAuditData(questions);
          const answerMap = {};
          if (savedAnswers) {
            savedAnswers.forEach(row => {
              answerMap[row.question_id] = { 
                status: row.status, 
                evidenceUrl: row.evidence_url,
                comment: row.remarks 
              };
            });
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
  }, [session, currentSessionId, selectedActId]);

  // Recompute risk score whenever answers or questions change
  useEffect(() => {
    if (!auditData || auditData.length === 0) { setRiskScore(0); return; }
    setRiskScore(computeSessionScore(auditData, answers, riskWeights));
  }, [auditData, answers]);

  // 2. UPDATE ANSWER
  const handleUpdateAnswer = async (questionId, newAnswerData) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: newAnswerData
    }));

    const { error } = await supabase
      .from('session_answers')
      .upsert({ 
        session_id: currentSessionId,
        question_id: questionId, 
        status: newAnswerData.status,
        evidence_url: newAnswerData.evidenceUrl,
        remarks: newAnswerData.comment,
        updated_at: new Date()
      }, { onConflict: 'session_id, question_id' });

    if (error) console.error("Save error:", error);
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

  if (!session) return <Login />;
  
  if (!currentSessionId) return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="font-bold text-xl flex items-center gap-2"><ShieldCheck className="text-blue-600"/> AuditAI</h1>
        <button onClick={() => { supabase.auth.signOut(); setSession(null); }} className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-2"><LogOut size={16}/> Sign Out</button>
      </div>
      <Dashboard 
        userEmail={session.user.email} 
        onStartAudit={(id, name, actId) => { 
          setCurrentSessionId(id); 
          setFactoryName(name);
          setSelectedActId(actId);
        }} 
      />
    </div>
  );

  if (loading) return <div className="flex h-screen items-center justify-center gap-3 text-blue-600"><Loader2 className="animate-spin" size={32} /><span className="font-bold text-lg">Loading Exam Mode...</span></div>;

  const currentQuestion = auditData[currentQuestionIndex];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      
      {/* SIDEBAR NAVIGATION */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} bg-white border-r border-gray-200 flex-shrink-0 transition-all duration-300 flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Question Map</h2>
          <div className="text-xs font-mono bg-white px-2 py-1 rounded border border-gray-200 text-gray-500">
            {Object.keys(answers).length} / {auditData.length}
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
           <button onClick={() => setCurrentSessionId(null)} className="w-full py-2 text-gray-500 hover:text-gray-900 text-sm flex items-center justify-center gap-2 transition-colors">
             <ArrowLeft size={16}/> Exit to Dashboard
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
                {selectedActId && (
                  <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    {getActById(selectedActId)?.shortName}
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
                onUpdateAnswer={handleUpdateAnswer}
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
            onClick={nextQuestion}
            disabled={currentQuestionIndex === auditData.length - 1}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-all shadow-md hover:shadow-lg ${currentQuestionIndex === auditData.length - 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5'}`}
          >
            Next <ChevronRight size={20} />
          </button>
        </div>

      </div>
    </div>
  );
}

export default App;