// filepath: c:\Users\91701\OneDrive\Desktop\audit-platform\contractAuditTypes.ts
// Enums for Contract Risk Audit Module
export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum AuditStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export enum RiskCategory {
  FINANCIAL = 'FINANCIAL',
  LEGAL = 'LEGAL',
  OPERATIONAL = 'OPERATIONAL',
  COMPLIANCE = 'COMPLIANCE',
  SECURITY = 'SECURITY',
  REPUTATIONAL = 'REPUTATIONAL'
}

export enum AuditType {
  INITIAL = 'INITIAL',
  PERIODIC = 'PERIODIC',
  RENEWAL = 'RENEWAL',
  INCIDENT_DRIVEN = 'INCIDENT_DRIVEN',
  COMPREHENSIVE = 'COMPREHENSIVE'
}

export enum CheckStatus {
  PASS = 'PASS',
  FAIL = 'FAIL',
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  PENDING = 'PENDING'
}

// Reusable Checklist Item Interface
export interface IChecklistItem {
  id: string;
  description: string;
  status: CheckStatus;
  riskLevel?: RiskLevel;
  notes?: string;
  evidence?: string[];
}

// Section-Specific Interfaces
export interface IDocumentationChecklist {
  contractAvailability: IChecklistItem;
  contractCompleteness: IChecklistItem;
  amendmentsTracked: IChecklistItem;
  executionEvidence: IChecklistItem;
  digitalRepository: IChecklistItem;
}

export interface IScopeChecklist {
  scopeClear: IChecklistItem;
  deliverablesIdentified: IChecklistItem;
  exclusionsDefined: IChecklistItem;
  performanceMetrics: IChecklistItem;
}

export interface IFinancialRiskChecklist {
  pricingReviewed: IChecklistItem;
  paymentTermsValidated: IChecklistItem;
  penaltiesIdentified: IChecklistItem;
  budgetAlignment: IChecklistItem;
  currencyRiskAssessed: IChecklistItem;
}

export interface ILegalComplianceChecklist {
  regulatoryCompliance: IChecklistItem;
  jurisdictionVerified: IChecklistItem;
  disputeResolution: IChecklistItem;
  terminationClauses: IChecklistItem;
  intellectualPropertyRights: IChecklistItem;
}

export interface ICounterpartyRiskChecklist {
  creditworthinessAssessed: IChecklistItem;
  reputationVerified: IChecklistItem;
  previousPerformanceReviewed: IChecklistItem;
  financialStabilityChecked: IChecklistItem;
  insuranceCoverage: IChecklistItem;
}

export interface IOperationalPerformanceChecklist {
  kpisDefined: IChecklistItem;
  slaCompliance: IChecklistItem;
  deliveryTimeliness: IChecklistItem;
  qualityStandards: IChecklistItem;
  issueResolution: IChecklistItem;
}

export interface ILifecycleManagementChecklist {
  renewalDateTracked: IChecklistItem;
  noticePeriodIdentified: IChecklistItem;
  exitStrategyDefined: IChecklistItem;
  changeManagementProcess: IChecklistItem;
  archivalProcedure: IChecklistItem;
}

// Risk Summary Interface
export interface IRiskSummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

// Core Interfaces
export interface IAuditor {
  id: string;
  name: string;
  email: string;
  role: string;
  certifications?: string[];
}

export interface IRiskFinding {
  id: string;
  category: RiskCategory;
  level: RiskLevel;
  description: string;
  impact: string;
  likelihood: number;
  mitigation?: string;
  identifiedDate: Date;
  resolvedDate?: Date;
}

export interface IContractDetails {
  contractId: string;
  contractName: string;
  partyName: string;
  contractValue: number;
  startDate: Date;
  endDate: Date;
  contractType: string;
}

export interface IAuditReport {
  reportId: string;
  generatedDate: Date;
  summary: string;
  findings: IRiskFinding[];
  recommendations: string[];
  overallRiskScore: number;
}

export interface IContractRiskAudit {
  auditId: string;
  contract: IContractDetails;
  auditType: AuditType;
  status: AuditStatus;
  auditor: IAuditor;
  scheduledDate: Date;
  completionDate?: Date;
  checklists: {
    documentation: IDocumentationChecklist;
    scope: IScopeChecklist;
    financialRisk: IFinancialRiskChecklist;
    legalCompliance: ILegalComplianceChecklist;
    counterpartyRisk: ICounterpartyRiskChecklist;
    operationalPerformance: IOperationalPerformanceChecklist;
    lifecycleManagement: ILifecycleManagementChecklist;
  };
  riskSummary: IRiskSummary;
  findings: IRiskFinding[];
  report?: IAuditReport;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuditMetrics {
  totalAudits: number;
  completedAudits: number;
  pendingAudits: number;
  averageRiskScore: number;
  criticalFindings: number;
  highRiskContracts: number;
}

export interface ICreateAuditRequest {
  contractId: string;
  auditType: AuditType;
  auditorId: string;
  scheduledDate: Date;
  notes?: string;
}

export interface IUpdateAuditRequest {
  status?: AuditStatus;
  checklists?: Partial<IContractRiskAudit['checklists']>;
  findings?: IRiskFinding[];
  completionDate?: Date;
}

export interface IAuditFilter {
  status?: AuditStatus;
  riskLevel?: RiskLevel;
  auditType?: AuditType;
  dateFrom?: Date;
  dateTo?: Date;
  auditorId?: string;
}