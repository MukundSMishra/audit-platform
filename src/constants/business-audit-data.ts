// ============================================================================
// BUSINESS RISK AUDIT - CONSTANTS & INITIAL STATE
// ============================================================================
// Default values and initial state for Business Risk Audit module
// Includes legal references mapped to Indian Contract Act 1872
// ============================================================================

import {
  IBusinessRiskAudit,
  IChecklistItem,
  IBasicContractInfo,
  IDocumentationGovernance,
  IFinancialRisk,
  ILegalCompliance,
  IOperationalPerformance,
  ICounterpartyRisk,
  ILifecycleManagement,
  IRiskHeatMap,
  AuditStatus,
  ContractType,
  PartyType,
  ComplianceStatus
} from '../types/business-audit';

// --- HELPER FUNCTION TO CREATE CHECKLIST ITEMS ---

/**
 * Factory function to create a checklist item with default values
 */
const createChecklistItem = (
  id: string,
  question: string,
  legalReference?: string
): IChecklistItem => ({
  id,
  question,
  isCompliant: false,
  complianceStatus: ComplianceStatus.PENDING_REVIEW,
  findings: '',
  severity: undefined,
  evidenceUrls: [],
  remarks: legalReference || '',
  reviewedBy: undefined,
  reviewedAt: undefined
});

// --- INITIAL CHECKLIST STATES ---

/**
 * A. Documentation & Governance
 * Maps to Indian Contract Act sections for contract validity and execution
 */
export const INITIAL_DOCUMENTATION_GOVERNANCE: IDocumentationGovernance = {
  executionStatus: createChecklistItem(
    'doc-execution',
    'Is the contract executed with free consent and competent signatories?',
    'Section 10 & 11 (Competency & Free Consent)'
  ),
  versionControl: createChecklistItem(
    'doc-version',
    'Is the agreement certain and not void for uncertainty?',
    'Section 29 (Void for Uncertainty)'
  ),
  digitalRepository: createChecklistItem(
    'doc-repository',
    'Is contract stored in a central digital repository with proper access controls?',
    'Best Practice - Document Management'
  ),
  signatoryVerification: createChecklistItem(
    'doc-signatory',
    'Are agents/signatories authorized to bind the principal?',
    'Section 188 (Agent Authority)'
  ),
  stampDuty: createChecklistItem(
    'doc-stamp',
    'Is stamp duty paid as per Indian Stamp Act provisions?',
    'Indian Stamp Act, 1899'
  ),
  annexureCompleteness: createChecklistItem(
    'doc-annexure',
    'Are all annexures, schedules, and exhibits properly attached and referenced?',
    'Best Practice - Contractual Completeness'
  )
};

/**
 * B. Financial Risk
 * Evaluates consideration, payment terms, and financial obligations
 */
export const INITIAL_FINANCIAL_RISK: IFinancialRisk = {
  pricingAccuracy: createChecklistItem(
    'fin-pricing',
    'Is the consideration (price) clearly defined and valid?',
    'Section 25 (Agreement without consideration is void)'
  ),
  paymentTerms: createChecklistItem(
    'fin-payment',
    'Are payment milestones, schedules, and modes of payment clearly documented?',
    'Section 73 (Compensation for loss or damage)'
  ),
  penaltiesInterest: createChecklistItem(
    'fin-penalties',
    'Are penalty/liquidated damage clauses reasonable?',
    'Section 74 (Compensation for breach with penalty)'
  ),
  currencyRisk: createChecklistItem(
    'fin-currency',
    'Is foreign exchange exposure documented and hedging mechanisms in place?',
    'FEMA (Foreign Exchange Management Act)'
  ),
  budgetAlignment: createChecklistItem(
    'fin-budget',
    'Does the contract value align with sanctioned budget and financial approvals?',
    'Internal Financial Controls'
  ),
  taxCompliance: createChecklistItem(
    'fin-tax',
    'Are GST, TDS, and other tax provisions correctly incorporated?',
    'GST Act 2017, Income Tax Act 1961'
  ),
  priceEscalation: createChecklistItem(
    'fin-escalation',
    'Is price revision/escalation mechanism clearly defined and formulaic?',
    'Best Practice - Price Adjustment Clauses'
  )
};

/**
 * C. Legal & Compliance
 * Ensures adherence to Indian Contract Act and statutory requirements
 */
export const INITIAL_LEGAL_COMPLIANCE: ILegalCompliance = {
  contractActCompliance: createChecklistItem(
    'legal-act',
    'Is the contract lawful and not opposed to public policy?',
    'Section 23 (Lawful consideration and object)'
  ),
  disputeResolution: createChecklistItem(
    'legal-dispute',
    'Does the contract restrict legal proceedings (Arbitration exception)?',
    'Section 28 (Restraint of legal proceedings)'
  ),
  terminationClauses: createChecklistItem(
    'legal-termination',
    'Are termination rights, notice periods, and exit liabilities clearly defined?',
    'Section 39 (Effect of rescission of voidable contract)'
  ),
  jurisdiction: createChecklistItem(
    'legal-jurisdiction',
    'Is governing law and jurisdiction for dispute resolution clearly stated?',
    'Code of Civil Procedure, 1908'
  ),
  indemnityClause: createChecklistItem(
    'legal-indemnity',
    'Is there a valid Indemnity clause?',
    'Section 124 (Contract of Indemnity)'
  ),
  confidentialityNDA: createChecklistItem(
    'legal-nda',
    'Is confidentiality and non-disclosure clause adequate and enforceable?',
    'Section 27 (Restraint of trade exceptions)'
  ),
  forceMajeure: createChecklistItem(
    'legal-force-majeure',
    'Is Force Majeure (Doctrine of Frustration) included?',
    'Section 56 (Agreement to do impossible act)'
  ),
  intellectualProperty: createChecklistItem(
    'legal-ip',
    'Are intellectual property rights clearly assigned or licensed?',
    'Indian Copyright Act, Patents Act, Trademarks Act'
  )
};

/**
 * D. Operational & Performance
 * Tracks service delivery, quality standards, and performance obligations
 */
export const INITIAL_OPERATIONAL_PERFORMANCE: IOperationalPerformance = {
  deliveryTimelines: createChecklistItem(
    'ops-delivery',
    'Are delivery timelines defined (Time is of the essence)?',
    'Section 55 (Effect of failure to perform at fixed time)'
  ),
  slaCompliance: createChecklistItem(
    'ops-sla',
    'Are Service Level Agreements (SLAs) with measurable KPIs defined?',
    'Best Practice - Performance Standards'
  ),
  qualityStandards: createChecklistItem(
    'ops-quality',
    'Are quality testing, inspection, and acceptance criteria documented?',
    'Best Practice - Quality Assurance'
  ),
  changeManagement: createChecklistItem(
    'ops-change',
    'Is change request and variation order process clearly defined?',
    'Best Practice - Scope Change Management'
  ),
  warrantyClauses: createChecklistItem(
    'ops-warranty',
    'Are warranty, guarantee, and defect liability periods specified?',
    'Sale of Goods Act, 1930 - Implied Warranties'
  ),
  performanceReviews: createChecklistItem(
    'ops-reviews',
    'Are obligations to perform clearly stated?',
    'Section 37 (Obligation of parties)'
  )
};

/**
 * E. Counterparty Risk
 * Assesses financial stability and creditworthiness of the other party
 */
export const INITIAL_COUNTERPARTY_RISK: ICounterpartyRisk = {
  creditworthiness: createChecklistItem(
    'cp-credit',
    'Is counterparty credit rating assessed and acceptable?',
    'Best Practice - Credit Risk Assessment'
  ),
  financialStability: createChecklistItem(
    'cp-financial',
    'Are financial statements, turnover, and net worth reviewed?',
    'Best Practice - Financial Due Diligence'
  ),
  marketReputation: createChecklistItem(
    'cp-reputation',
    'Is market reputation, track record, and references verified?',
    'Best Practice - Vendor/Customer Evaluation'
  ),
  pastPerformance: createChecklistItem(
    'cp-performance',
    'Is historical performance and past contract compliance reviewed?',
    'Best Practice - Performance History'
  ),
  insuranceCoverage: createChecklistItem(
    'cp-insurance',
    'Does counterparty have adequate insurance (liability, professional indemnity)?',
    'Best Practice - Risk Transfer via Insurance'
  ),
  regulatoryCompliance: createChecklistItem(
    'cp-regulatory',
    'Are necessary licenses, registrations, and statutory compliances verified?',
    'Various Acts - Licensing Requirements'
  )
};

/**
 * F. Lifecycle Management
 * Handles renewal, exit, and post-termination obligations
 */
export const INITIAL_LIFECYCLE_MANAGEMENT: ILifecycleManagement = {
  renewalDateTracking: createChecklistItem(
    'lm-renewal',
    'Is renewal date tracked with automated alerts and approval workflows?',
    'Best Practice - Contract Lifecycle Management'
  ),
  exitStrategy: createChecklistItem(
    'lm-exit',
    'Is exit/transition plan and knowledge transfer documented?',
    'Best Practice - Exit Management'
  ),
  dataReturnClause: createChecklistItem(
    'lm-data',
    'Are data return, destruction, and confidentiality post-termination obligations clear?',
    'IT Act 2000, Data Protection Laws'
  ),
  postTerminationObligations: createChecklistItem(
    'lm-post-term',
    'Are surviving obligations (warranties, indemnities) beyond termination defined?',
    'Best Practice - Post-Termination Rights'
  ),
  archivalProcedure: createChecklistItem(
    'lm-archival',
    'Is contract archived with required retention period as per policy?',
    'Best Practice - Document Retention Policy'
  )
};

// --- INITIAL RISK HEAT MAP ---

export const INITIAL_RISK_HEAT_MAP: IRiskHeatMap = {
  high: 0,
  medium: 0,
  low: 0,
  critical: 0,
  total: 0,
  categoryBreakdown: [
    { categoryName: 'Documentation & Governance', high: 0, medium: 0, low: 0, critical: 0, total: 0 },
    { categoryName: 'Financial Risk', high: 0, medium: 0, low: 0, critical: 0, total: 0 },
    { categoryName: 'Legal & Compliance', high: 0, medium: 0, low: 0, critical: 0, total: 0 },
    { categoryName: 'Operational Performance', high: 0, medium: 0, low: 0, critical: 0, total: 0 },
    { categoryName: 'Counterparty Risk', high: 0, medium: 0, low: 0, critical: 0, total: 0 },
    { categoryName: 'Lifecycle Management', high: 0, medium: 0, low: 0, critical: 0, total: 0 }
  ],
  overallRiskLevel: 'LOW'
};

// --- INITIAL BASIC CONTRACT INFO ---

export const INITIAL_BASIC_CONTRACT_INFO: IBasicContractInfo = {
  contractId: '',
  contractName: '',
  contractType: ContractType.SALES,
  
  ourCompany: {
    name: '',
    type: PartyType.CUSTOMER,
    address: '',
    contactPerson: '',
    email: '',
    phone: '',
    gstin: '',
    pan: ''
  },
  
  counterParty: {
    name: '',
    type: PartyType.VENDOR,
    address: '',
    contactPerson: '',
    email: '',
    phone: '',
    gstin: '',
    pan: ''
  },
  
  contractValue: 0,
  currency: 'INR',
  
  startDate: new Date(),
  endDate: new Date(),
  tenure: '',
  
  renewalTerms: {
    isRenewable: false,
    renewalPeriod: '',
    noticePeriod: '',
    renewalConditions: '',
    autoRenewal: false
  },
  
  signatories: [],
  
  contractFilePath: '',
  createdAt: new Date(),
  updatedAt: new Date(),
  uploadedBy: ''
};

// --- MAIN INITIAL STATE ---

/**
 * Complete Initial State for Business Risk Audit
 * Ready to be used in React components or state management
 */
export const INITIAL_AUDIT_STATE: Omit<IBusinessRiskAudit, 'auditId'> = {
  // Basic Information
  basicInfo: INITIAL_BASIC_CONTRACT_INFO,
  
  // Audit Metadata
  auditStatus: AuditStatus.NOT_STARTED,
  auditStartDate: new Date(),
  auditCompletionDate: undefined,
  auditorName: '',
  auditorId: '',
  reviewerName: undefined,
  reviewerId: undefined,
  
  // Checklist Categories
  checklists: {
    documentationGovernance: INITIAL_DOCUMENTATION_GOVERNANCE,
    financialRisk: INITIAL_FINANCIAL_RISK,
    legalCompliance: INITIAL_LEGAL_COMPLIANCE,
    operationalPerformance: INITIAL_OPERATIONAL_PERFORMANCE,
    counterpartyRisk: INITIAL_COUNTERPARTY_RISK,
    lifecycleManagement: INITIAL_LIFECYCLE_MANAGEMENT
  },
  
  // Risk Summary
  riskHeatMap: INITIAL_RISK_HEAT_MAP,
  
  // Overall Assessment
  overallFindings: '',
  recommendations: [],
  
  // Timestamps
  createdAt: new Date(),
  updatedAt: new Date(),
  
  // Optional fields
  reportGeneratedAt: undefined,
  reportUrl: undefined
};

// --- AUDIT SECTION METADATA (FOR UI RENDERING) ---

/**
 * Section metadata for step-by-step wizard UI
 */
export interface IAuditSectionMeta {
  key: keyof IBusinessRiskAudit['checklists'];
  title: string;
  description: string;
  icon: string; // For UI icons
  itemCount: number;
}

export const AUDIT_SECTIONS: IAuditSectionMeta[] = [
  {
    key: 'documentationGovernance',
    title: 'A. Documentation & Governance',
    description: 'Contract execution, version control, and document management',
    icon: 'FileText',
    itemCount: 6
  },
  {
    key: 'financialRisk',
    title: 'B. Financial Risk',
    description: 'Pricing, payment terms, penalties, and tax compliance',
    icon: 'DollarSign',
    itemCount: 7
  },
  {
    key: 'legalCompliance',
    title: 'C. Legal & Compliance',
    description: 'Indian Contract Act adherence and regulatory compliance',
    icon: 'Scale',
    itemCount: 8
  },
  {
    key: 'operationalPerformance',
    title: 'D. Operational & Performance',
    description: 'Delivery timelines, SLAs, and quality standards',
    icon: 'TrendingUp',
    itemCount: 6
  },
  {
    key: 'counterpartyRisk',
    title: 'E. Counterparty Risk',
    description: 'Financial stability and creditworthiness assessment',
    icon: 'Users',
    itemCount: 6
  },
  {
    key: 'lifecycleManagement',
    title: 'F. Lifecycle Management',
    description: 'Renewal tracking, exit strategy, and archival',
    icon: 'RefreshCw',
    itemCount: 5
  }
];

// --- HELPER CONSTANTS ---

/**
 * Risk severity weights for score calculation
 */
export const RISK_SEVERITY_WEIGHTS = {
  CRITICAL: 10,
  HIGH: 5,
  MEDIUM: 2,
  LOW: 1
};

/**
 * Compliance status display colors (for UI)
 */
export const COMPLIANCE_STATUS_COLORS = {
  COMPLIANT: 'green',
  NON_COMPLIANT: 'red',
  PARTIAL: 'yellow',
  NOT_APPLICABLE: 'gray',
  PENDING_REVIEW: 'blue'
};
