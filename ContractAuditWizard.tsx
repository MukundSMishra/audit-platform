import React, { useState, useEffect } from 'react';
import { 
  IContractRiskAudit, 
  RiskLevel, 
  CheckStatus, 
  IChecklistItem, 
  AuditStatus, 
  AuditType 
} from './contractAuditTypes';

// --- 1. CONFIGURATION OBJECT (The Bridge between Code & Blueprint) ---
// This maps your generic TypeScript keys to the specific English questions from your PDF.
const AUDIT_SECTIONS = [
  {
    key: 'documentation', // Matches checkList key in types
    title: 'B. Documentation & Governance',
    questions: [
      { id: 'contractAvailability', label: 'Is the executed contract available (signed by both parties)?', tooltip: 'Ref: Indian Contract Act Sec 10 (All agreements are contracts if made by free consent)' },
      { id: 'amendmentsTracked', label: 'Are all amendments/addenda documented?', tooltip: 'Version control is critical for audit trails' },
      { id: 'digitalRepository', label: 'Is contract stored in central repository?', tooltip: '' },
      { id: 'executionEvidence', label: 'Are signatory authorities verified?', tooltip: 'Check Board Resolution or Power of Attorney' }
    ]
  },
  {
    key: 'financialRisk',
    title: 'D. Financial Risk',
    questions: [
      { id: 'pricingReviewed', label: 'Is Pricing structure clear & correct?', tooltip: 'Ambiguity makes contracts void (Sec 29)' },
      { id: 'paymentTermsValidated', label: 'Are Payment terms & adherence defined?', tooltip: '' },
      { id: 'penaltiesIdentified', label: 'Are interest/penalties for late payment included?', tooltip: 'Ref: Indian Contract Act Sec 73 & 74 (Compensation for Breach/Liquidated Damages)' },
      { id: 'currencyRiskAssessed', label: 'Is FX/currency exposure documented?', tooltip: 'Check FEMA compliance if foreign currency involved' }
    ]
  },
  {
    key: 'legalCompliance',
    title: 'E. Legal & Regulatory',
    questions: [
      { id: 'regulatoryCompliance', label: 'Does contract comply with Indian Contract Act 1872?', tooltip: 'Check Sec 10 (Competency), Sec 23 (Lawful Object)' },
      { id: 'disputeResolution', label: 'Is Dispute resolution / arbitration defined?', tooltip: 'Ref: Arbitration & Conciliation Act / Sec 28 (Restraint of Legal Proceedings)' },
      { id: 'terminationClauses', label: 'Are Termination clauses fair and executable?', tooltip: '' },
      { id: 'jurisdictionVerified', label: 'Is the jurisdiction clearly stated?', tooltip: '' }
    ]
  },
  {
    key: 'operationalPerformance',
    title: 'G. Operational & Performance',
    questions: [
       { id: 'deliveryTimeliness', label: 'Goods/services delivered as per contract?', tooltip: ''},
       { id: 'slaCompliance', label: 'SLA/KPI adherence documented?', tooltip: ''},
       { id: 'qualityStandards', label: 'Are quality testing/inspection reports available?', tooltip: ''}
    ]
  }
];

// --- 2. THE COMPONENT ---

const ContractAuditWizard: React.FC = () => {
  // Initial State matching IContractRiskAudit structure
  const [auditState, setAuditState] = useState<Partial<IContractRiskAudit>>({
    status: AuditStatus.IN_PROGRESS,
    auditType: AuditType.PERIODIC,
    checklists: {
      documentation: {}, 
      scope: {}, 
      financialRisk: {}, 
      legalCompliance: {}, 
      counterpartyRisk: {}, 
      operationalPerformance: {}, 
      lifecycleManagement: {}
    } as any, // Cast as any for initial setup ease, strictly typed in logic
    riskSummary: { critical: 0, high: 0, medium: 0, low: 0, total: 0 }
  });

  const [currentStep, setCurrentStep] = useState(0);

  // --- 3. HEATMAP CALCULATION LOGIC ---
  useEffect(() => {
    if (!auditState.checklists) return;

    let stats = { critical: 0, high: 0, medium: 0, low: 0, total: 0 };

    // Loop through all sections
    Object.values(auditState.checklists).forEach((section: any) => {
      Object.values(section).forEach((item: any) => {
        if (item.status === CheckStatus.FAIL) {
          if (item.riskLevel === RiskLevel.HIGH) stats.high++;
          if (item.riskLevel === RiskLevel.MEDIUM) stats.medium++;
          if (item.riskLevel === RiskLevel.LOW) stats.low++;
          if (item.riskLevel === RiskLevel.CRITICAL) stats.critical++;
          stats.total++;
        }
      });
    });

    setAuditState(prev => ({ ...prev, riskSummary: stats }));
  }, [auditState.checklists]);


  // --- 4. HANDLERS ---
  const handleChecklistChange = (
    sectionKey: string, 
    questionId: string, 
    field: keyof IChecklistItem, 
    value: any
  ) => {
    setAuditState(prev => {
      const currentSection = (prev.checklists?.[sectionKey as keyof typeof prev.checklists] || {}) as Record<string, IChecklistItem>;
      const currentItem = currentSection[questionId] || { id: questionId, description: '', status: CheckStatus.PENDING };

      return {
        ...prev,
        checklists: {
          ...prev.checklists,
          [sectionKey]: {
            ...currentSection,
            [questionId]: { ...currentItem, [field]: value }
          }
        } as any
      };
    });
  };

  const activeSection = AUDIT_SECTIONS[currentStep];
  const isLastStep = currentStep === AUDIT_SECTIONS.length; // Last step is Heatmap

  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* Sidebar Stepper */}
      <div className="w-64 bg-white border-r shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Risk Audit</h2>
        <div className="space-y-2">
          {AUDIT_SECTIONS.map((section, index) => (
            <div 
              key={section.key}
              onClick={() => setCurrentStep(index)}
              className={`p-3 rounded cursor-pointer text-sm font-medium ${
                currentStep === index ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {section.title}
            </div>
          ))}
          <div 
            onClick={() => setCurrentStep(AUDIT_SECTIONS.length)}
            className={`p-3 rounded cursor-pointer text-sm font-medium ${
              isLastStep ? 'bg-purple-50 text-purple-700 border-l-4 border-purple-600' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Final Risk Heatmap
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-8 overflow-y-auto">
        
        {/* Render Checklist Steps */}
        {!isLastStep && (
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">{activeSection.title}</h1>
            
            <div className="space-y-6">
              {activeSection.questions.map((q) => {
                // Get current state for this question
                const itemState = (auditState.checklists as any)?.[activeSection.key]?.[q.id] || {};

                return (
                  <div key={q.id} className="border p-4 rounded-lg hover:border-blue-300 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <label className="font-semibold text-gray-700 text-base">{q.label}</label>
                        {q.tooltip && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded cursor-help" title={q.tooltip}>
                            Legal Ref
                          </span>
                        )}
                      </div>
                      
                      {/* Status Dropdown */}
                      <select 
                        className="border rounded p-1 text-sm bg-white"
                        value={itemState.status || CheckStatus.PENDING}
                        onChange={(e) => handleChecklistChange(activeSection.key, q.id, 'status', e.target.value)}
                      >
                        <option value={CheckStatus.PENDING}>Select...</option>
                        <option value={CheckStatus.PASS}>Pass</option>
                        <option value={CheckStatus.FAIL}>Fail</option>
                        <option value={CheckStatus.NOT_APPLICABLE}>N/A</option>
                      </select>
                    </div>

                    {/* Conditional Logic: If Fail, show Risk Level */}
                    {itemState.status === CheckStatus.FAIL && (
                      <div className="mt-3 bg-red-50 p-3 rounded border border-red-100 flex items-center gap-4 animate-fade-in">
                        <span className="text-sm font-bold text-red-700">Risk Assessment:</span>
                        <select 
                          className="border border-red-300 rounded p-1 text-sm text-red-700"
                          value={itemState.riskLevel || ''}
                          onChange={(e) => handleChecklistChange(activeSection.key, q.id, 'riskLevel', e.target.value)}
                        >
                          <option value="">Select Severity...</option>
                          <option value={RiskLevel.LOW}>Low</option>
                          <option value={RiskLevel.MEDIUM}>Medium</option>
                          <option value={RiskLevel.HIGH}>High</option>
                          <option value={RiskLevel.CRITICAL}>Critical</option>
                        </select>
                      </div>
                    )}

                    {/* Findings Text Area */}
                    <textarea 
                      className="w-full mt-3 p-2 border rounded text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                      placeholder="Auditor findings / Evidence notes..."
                      rows={2}
                      value={itemState.notes || ''}
                      onChange={(e) => handleChecklistChange(activeSection.key, q.id, 'notes', e.target.value)}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setCurrentStep(currentStep + 1)}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium"
              >
                Next Section &rarr;
              </button>
            </div>
          </div>
        )}

        {/* Render Final Heatmap Dashboard */}
        {isLastStep && (
          <div className="max-w-4xl mx-auto">
             <h1 className="text-3xl font-bold mb-8 text-gray-800">Audit Risk Summary</h1>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-red-100 p-6 rounded-lg border border-red-200 text-center">
                  <div className="text-4xl font-bold text-red-600">{auditState.riskSummary?.critical || 0}</div>
                  <div className="text-sm text-red-800 font-medium mt-1">Critical Risks</div>
                </div>
                <div className="bg-orange-100 p-6 rounded-lg border border-orange-200 text-center">
                  <div className="text-4xl font-bold text-orange-600">{auditState.riskSummary?.high || 0}</div>
                  <div className="text-sm text-orange-800 font-medium mt-1">High Risks</div>
                </div>
                <div className="bg-yellow-100 p-6 rounded-lg border border-yellow-200 text-center">
                  <div className="text-4xl font-bold text-yellow-600">{auditState.riskSummary?.medium || 0}</div>
                  <div className="text-sm text-yellow-800 font-medium mt-1">Medium Risks</div>
                </div>
                <div className="bg-gray-100 p-6 rounded-lg border border-gray-200 text-center">
                  <div className="text-4xl font-bold text-gray-600">{auditState.riskSummary?.total || 0}</div>
                  <div className="text-sm text-gray-800 font-medium mt-1">Total Issues</div>
                </div>
             </div>

             <div className="bg-white p-8 rounded shadow text-center">
                <h3 className="text-xl font-bold mb-4">Ready to Finalize?</h3>
                <p className="text-gray-600 mb-6">This will generate the PDF report and submit findings to the legal team.</p>
                <button className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg hover:bg-green-700 font-bold shadow-lg">
                  Generate Audit Report
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractAuditWizard;