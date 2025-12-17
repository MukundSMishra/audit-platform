// ============================================================================
// BUSINESS RISK AUDIT - TYPE DEFINITIONS
// ============================================================================
// Module for assessing Sales and Purchase contracts
// Covers: Customer Contracts (Sales) and Vendor Contracts (Purchase)
// ============================================================================

// --- ENUMS ---

/**
 * Contract Type Classification
 */
export enum ContractType {
  SALES = 'SALES',
  PURCHASE = 'PURCHASE',
  AMC = 'AMC', // Annual Maintenance Contract
  SERVICE = 'SERVICE',
  SUPPLY = 'SUPPLY',
  OTHER = 'OTHER'
}

/**
 * Audit Status Lifecycle
 */
export enum AuditStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  UNDER_REVIEW = 'UNDER_REVIEW',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED'
}

/**
 * Risk Severity Levels for Non-Compliance
 */
export enum RiskSeverity {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  CRITICAL = 'CRITICAL' // Optional for extremely severe issues
}

/**
 * Compliance Status
 */
export enum ComplianceStatus {
  COMPLIANT = 'COMPLIANT',
  NON_COMPLIANT = 'NON_COMPLIANT',
  PARTIAL = 'PARTIAL',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  PENDING_REVIEW = 'PENDING_REVIEW'
}

/**
 * Contract Party Type
 */
export enum PartyType {
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
  CONTRACTOR = 'CONTRACTOR',
  SUPPLIER = 'SUPPLIER'
}

// --- CORE INTERFACES ---

/**
 * Reusable Checklist Item Structure
 * Used across all audit categories for standardized assessment
 */
export interface IChecklistItem {
  id: string;
  question: string;
  isCompliant: boolean;
  complianceStatus?: ComplianceStatus;
  findings: string; // Auditor's detailed observations
  severity?: RiskSeverity; // Only populated if non-compliant
  evidenceUrls?: string[]; // Links to supporting documents
  remarks?: string; // Additional notes
  reviewedBy?: string; // Auditor name/ID
  reviewedAt?: Date;
  legalReference?: string; // e.g., "Indian Contract Act Section 73"
}

/**
 * Contract Party Information
 */
export interface IContractParty {
  name: string;
  type: PartyType;
  address?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  gstin?: string; // GST Identification Number (India)
  pan?: string; // Permanent Account Number (India)
}

/**
 * Signatory Information
 */
export interface ISignatory {
  name: string;
  designation: string;
  authority: string; // e.g., "Board Resolution dated 01-Jan-2025"
  signedDate?: Date;
  isVerified: boolean;
}

/**
 * Renewal Terms
 */
export interface IRenewalTerms {
  isRenewable: boolean;
  renewalPeriod?: string; // e.g., "1 Year", "6 Months"
  noticePeriod?: string; // e.g., "90 days"
  renewalConditions?: string;
  autoRenewal?: boolean;
}

// --- SECTION A: BASIC CONTRACT INFORMATION ---

/**
 * Section A - Basic Contract Information
 * Captures fundamental contract details before checklist assessments
 */
export interface IBasicContractInfo {
  contractId: string;
  contractName: string;
  contractType: ContractType;
  
  // Parties
  ourCompany: IContractParty; // The auditing company
  counterParty: IContractParty; // Customer or Vendor
  
  // Financial
  contractValue: number;
  currency: string; // e.g., "INR", "USD"
  
  // Timeline
  startDate: Date;
  endDate: Date;
  tenure: string; // e.g., "2 Years", "36 Months"
  
  // Renewal
  renewalTerms: IRenewalTerms;
  
  // Signatories
  signatories: ISignatory[];
  
  // Metadata
  contractFilePath?: string; // Path to stored contract document
  createdAt: Date;
  updatedAt: Date;
  uploadedBy?: string;
}

// --- CHECKLIST CATEGORIES ---

/**
 * B. Documentation & Governance
 * Assesses contract execution, version control, and document management
 */
export interface IDocumentationGovernance {
  executionStatus: IChecklistItem; // Is contract fully executed by all parties?
  versionControl: IChecklistItem; // Are amendments tracked and documented?
  digitalRepository: IChecklistItem; // Is contract stored in central repository?
  signatoryVerification: IChecklistItem; // Are signatory authorities verified (Board Resolution/PoA)?
  stampDuty: IChecklistItem; // Is stamp duty paid and documented?
  annexureCompleteness: IChecklistItem; // Are all annexures/schedules attached?
}

/**
 * C. Scope & Deliverables (Optional - for detailed assessments)
 */
export interface IScopeDeliverables {
  scopeClarity: IChecklistItem; // Is scope of work clearly defined?
  deliverablesIdentified: IChecklistItem; // Are deliverables/milestones listed?
  exclusionsDefined: IChecklistItem; // Are exclusions explicitly stated?
  performanceMetrics: IChecklistItem; // Are KPIs/SLAs defined?
}

/**
 * D. Financial Risk
 * Evaluates pricing, payment terms, and financial exposures
 */
export interface IFinancialRisk {
  pricingAccuracy: IChecklistItem; // Is pricing structure clear and mathematically correct?
  paymentTerms: IChecklistItem; // Are payment milestones and schedules defined?
  penaltiesInterest: IChecklistItem; // Are late payment penalties/interest clauses present?
  currencyRisk: IChecklistItem; // Is FX exposure documented (for foreign currency)?
  budgetAlignment: IChecklistItem; // Does contract value align with approved budget?
  taxCompliance: IChecklistItem; // Are GST/TDS clauses included?
  priceEscalation: IChecklistItem; // Is price revision mechanism defined?
}

/**
 * E. Legal & Compliance
 * Ensures adherence to Indian Contract Act and regulatory requirements
 */
export interface ILegalCompliance {
  contractActCompliance: IChecklistItem; // Compliance with Indian Contract Act 1872 (Sec 10, 23)?
  disputeResolution: IChecklistItem; // Is arbitration/dispute resolution clause present?
  terminationClauses: IChecklistItem; // Are termination rights clearly defined?
  jurisdiction: IChecklistItem; // Is governing law and jurisdiction stated?
  indemnityClause: IChecklistItem; // Is indemnity clause present and balanced?
  confidentialityNDA: IChecklistItem; // Is confidentiality/NDA clause included?
  forceMajeure: IChecklistItem; // Is force majeure clause present?
  intellectualProperty: IChecklistItem; // Are IP rights clearly assigned/licensed?
}

/**
 * F. Operational & Performance
 * Tracks delivery, quality, and service level adherence
 */
export interface IOperationalPerformance {
  deliveryTimelines: IChecklistItem; // Are delivery timelines realistic and tracked?
  slaCompliance: IChecklistItem; // Are SLAs being met (if applicable)?
  qualityStandards: IChecklistItem; // Are quality testing/inspection procedures defined?
  changeManagement: IChecklistItem; // Is change request process documented?
  warrantyClauses: IChecklistItem; // Are warranty/guarantee terms specified?
  performanceReviews: IChecklistItem; // Are periodic review mechanisms in place?
}

/**
 * G. Counterparty Risk
 * Assesses vendor/customer financial stability and reputation
 */
export interface ICounterpartyRisk {
  creditworthiness: IChecklistItem; // Is counterparty credit rating assessed?
  financialStability: IChecklistItem; // Are financial statements reviewed?
  marketReputation: IChecklistItem; // Is market reputation verified?
  pastPerformance: IChecklistItem; // Is historical performance reviewed (if repeat business)?
  insuranceCoverage: IChecklistItem; // Does counterparty have adequate insurance?
  regulatoryCompliance: IChecklistItem; // Are necessary licenses/registrations valid?
}

/**
 * H. Exit & Lifecycle Management
 * Handles contract closure, renewal, and archival
 */
export interface ILifecycleManagement {
  renewalDateTracking: IChecklistItem; // Is renewal date tracked with alerts?
  exitStrategy: IChecklistItem; // Is exit/transition plan documented?
  dataReturnClause: IChecklistItem; // Are data return/destruction terms clear?
  postTerminationObligations: IChecklistItem; // Are post-contract obligations defined?
  archivalProcedure: IChecklistItem; // Is contract archived as per policy?
}

// --- RISK AGGREGATION ---

/**
 * Category-wise Risk Count
 */
export interface ICategoryRiskCount {
  categoryName: string;
  high: number;
  medium: number;
  low: number;
  critical?: number;
  total: number;
}

/**
 * Risk Heat Map - Overall Summary
 * Aggregates risk counts across all categories
 */
export interface IRiskHeatMap {
  high: number;
  medium: number;
  low: number;
  critical: number;
  total: number;
  categoryBreakdown: ICategoryRiskCount[];
  overallRiskLevel: 'HIGH' | 'MEDIUM' | 'LOW'; // Computed based on critical/high counts
}

// --- MAIN AUDIT INTERFACE ---

/**
 * Complete Business Risk Audit Structure
 * Encompasses all sections and metadata
 */
export interface IBusinessRiskAudit {
  auditId: string;
  
  // Section A - Basic Info
  basicInfo: IBasicContractInfo;
  
  // Audit Metadata
  auditStatus: AuditStatus;
  auditStartDate: Date;
  auditCompletionDate?: Date;
  auditorName: string;
  auditorId: string;
  reviewerName?: string;
  reviewerId?: string;
  
  // Checklist Categories (Sections B-H)
  checklists: {
    documentationGovernance: IDocumentationGovernance;
    scopeDeliverables?: IScopeDeliverables; // Optional
    financialRisk: IFinancialRisk;
    legalCompliance: ILegalCompliance;
    operationalPerformance: IOperationalPerformance;
    counterpartyRisk: ICounterpartyRisk;
    lifecycleManagement: ILifecycleManagement;
  };
  
  // Risk Summary
  riskHeatMap: IRiskHeatMap;
  
  // Overall Assessment
  overallFindings: string;
  recommendations: string[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Optional fields
  reportGeneratedAt?: Date;
  reportUrl?: string;
}

// --- UTILITY TYPES ---

/**
 * Request payload for creating new audit
 */
export interface ICreateAuditRequest {
  contractId: string;
  contractName: string;
  contractType: ContractType;
  auditorId: string;
  auditorName: string;
}

/**
 * Request payload for updating audit progress
 */
export interface IUpdateAuditRequest {
  auditId: string;
  auditStatus?: AuditStatus;
  checklists?: Partial<IBusinessRiskAudit['checklists']>;
  overallFindings?: string;
  recommendations?: string[];
}

/**
 * Filter criteria for audit listing
 */
export interface IAuditFilter {
  contractType?: ContractType;
  auditStatus?: AuditStatus;
  auditorId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  riskLevel?: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Audit Summary for Dashboard/List View
 */
export interface IAuditSummary {
  auditId: string;
  contractName: string;
  contractType: ContractType;
  counterPartyName: string;
  contractValue: number;
  auditStatus: AuditStatus;
  overallRiskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  criticalCount: number;
  highCount: number;
  auditStartDate: Date;
  auditorName: string;
}
