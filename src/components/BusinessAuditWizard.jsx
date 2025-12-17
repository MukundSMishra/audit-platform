import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  DollarSign, 
  Scale, 
  TrendingUp, 
  Users, 
  RefreshCw,
  ChevronRight,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { 
  AUDIT_SECTIONS,
  INITIAL_AUDIT_STATE,
  COMPLIANCE_STATUS_COLORS
} from '../constants/business-audit-data';
import {
  ComplianceStatus,
  RiskSeverity
} from '../types/business-audit';

const ICON_MAP = {
  FileText,
  DollarSign,
  Scale,
  TrendingUp,
  Users,
  RefreshCw
};

const BusinessAuditWizard = ({ factoryName, location, onBack }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [auditState, setAuditState] = useState(INITIAL_AUDIT_STATE);
  const [showRiskHeatMap, setShowRiskHeatMap] = useState(false);

  // Calculate risk summary whenever checklist changes
  useEffect(() => {
    calculateRiskSummary();
  }, [auditState.checklists]);

  const calculateRiskSummary = () => {
    let high = 0, medium = 0, low = 0, critical = 0;
    const categoryBreakdown = [];

    Object.entries(auditState.checklists).forEach(([categoryKey, category]) => {
      let catHigh = 0, catMedium = 0, catLow = 0, catCritical = 0;

      Object.values(category).forEach((item) => {
        if (item.complianceStatus === ComplianceStatus.NON_COMPLIANT && item.severity) {
          switch (item.severity) {
            case RiskSeverity.CRITICAL:
              critical++;
              catCritical++;
              break;
            case RiskSeverity.HIGH:
              high++;
              catHigh++;
              break;
            case RiskSeverity.MEDIUM:
              medium++;
              catMedium++;
              break;
            case RiskSeverity.LOW:
              low++;
              catLow++;
              break;
          }
        }
      });

      const sectionMeta = AUDIT_SECTIONS.find(s => s.key === categoryKey);
      if (sectionMeta) {
        categoryBreakdown.push({
          categoryName: sectionMeta.title,
          high: catHigh,
          medium: catMedium,
          low: catLow,
          critical: catCritical,
          total: catCritical + catHigh + catMedium + catLow
        });
      }
    });

    const total = critical + high + medium + low;
    const overallRiskLevel = critical > 0 || high > 2 ? 'HIGH' : (medium > 5 ? 'MEDIUM' : 'LOW');

    setAuditState(prev => ({
      ...prev,
      riskHeatMap: {
        critical,
        high,
        medium,
        low,
        total,
        categoryBreakdown,
        overallRiskLevel
      }
    }));
  };

  const handleChecklistItemChange = (sectionKey, itemKey, field, value) => {
    setAuditState(prev => ({
      ...prev,
      checklists: {
        ...prev.checklists,
        [sectionKey]: {
          ...prev.checklists[sectionKey],
          [itemKey]: {
            ...prev.checklists[sectionKey][itemKey],
            [field]: value,
            // Auto-clear severity if marked compliant
            ...(field === 'complianceStatus' && value === ComplianceStatus.COMPLIANT ? { severity: undefined } : {})
          }
        }
      }
    }));
  };

  const handleNext = () => {
    if (currentSection < AUDIT_SECTIONS.length - 1) {
      setCurrentSection(currentSection + 1);
    } else {
      setShowRiskHeatMap(true);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const activeSectionMeta = AUDIT_SECTIONS[currentSection];
  const activeSectionData = auditState.checklists[activeSectionMeta.key];
  const SectionIcon = ICON_MAP[activeSectionMeta.icon] || FileText;

  if (showRiskHeatMap) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        {/* Header */}
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Risk Heat Map - Summary</h1>
              <p className="text-sm text-gray-600 mt-1">{factoryName} • {location}</p>
            </div>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Risk Summary Content */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Overall Risk Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-gray-200">
              <div className="text-3xl font-bold text-gray-900">{auditState.riskHeatMap.total}</div>
              <div className="text-sm text-gray-600 mt-1">Total Issues</div>
            </div>
            <div className="bg-red-50 rounded-xl p-6 shadow-sm border-2 border-red-200">
              <div className="text-3xl font-bold text-red-700">{auditState.riskHeatMap.critical}</div>
              <div className="text-sm text-red-600 mt-1">Critical</div>
            </div>
            <div className="bg-orange-50 rounded-xl p-6 shadow-sm border-2 border-orange-200">
              <div className="text-3xl font-bold text-orange-700">{auditState.riskHeatMap.high}</div>
              <div className="text-sm text-orange-600 mt-1">High Risk</div>
            </div>
            <div className="bg-yellow-50 rounded-xl p-6 shadow-sm border-2 border-yellow-200">
              <div className="text-3xl font-bold text-yellow-700">{auditState.riskHeatMap.medium}</div>
              <div className="text-sm text-yellow-600 mt-1">Medium Risk</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-6 shadow-sm border-2 border-blue-200">
              <div className="text-3xl font-bold text-blue-700">{auditState.riskHeatMap.low}</div>
              <div className="text-sm text-blue-600 mt-1">Low Risk</div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Category-wise Risk Breakdown</h2>
            <div className="space-y-4">
              {auditState.riskHeatMap.categoryBreakdown.map((cat, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-800">{cat.categoryName}</span>
                    <span className="text-sm text-gray-600">{cat.total} issues</span>
                  </div>
                  <div className="flex gap-2">
                    {cat.critical > 0 && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded">
                        {cat.critical} Critical
                      </span>
                    )}
                    {cat.high > 0 && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded">
                        {cat.high} High
                      </span>
                    )}
                    {cat.medium > 0 && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded">
                        {cat.medium} Medium
                      </span>
                    )}
                    {cat.low > 0 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">
                        {cat.low} Low
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setShowRiskHeatMap(false)}
              className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to Review
            </button>
            <button
              className="px-8 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg hover:shadow-xl transition-all"
            >
              Generate PDF Report
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r shadow-sm flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-lg font-bold text-gray-900">Business Risk Audit</h2>
          <p className="text-xs text-gray-600 mt-1">{factoryName}</p>
          <p className="text-xs text-gray-500">{location}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {AUDIT_SECTIONS.map((section, idx) => {
            const Icon = ICON_MAP[section.icon] || FileText;
            const isActive = idx === currentSection;
            return (
              <button
                key={section.key}
                onClick={() => setCurrentSection(idx)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} />
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{section.title}</div>
                    <div className="text-xs text-gray-500">{section.itemCount} items</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t">
          <button
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={16} />
            Exit Audit
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Content Header */}
        <div className="bg-white border-b px-8 py-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
              <SectionIcon size={28} />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{activeSectionMeta.title}</h1>
              <p className="text-sm text-gray-600 mt-1">{activeSectionMeta.description}</p>
            </div>
          </div>
        </div>

        {/* Checklist Items */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {Object.entries(activeSectionData).map(([itemKey, item]) => (
              <div key={item.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-blue-300 transition-colors">
                {/* Question */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-lg mb-2">{item.question}</h3>
                    {item.remarks && (
                      <p className="text-xs text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded">
                        📜 {item.remarks}
                      </p>
                    )}
                  </div>
                </div>

                {/* Compliance Status */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Compliance Status</label>
                    <select
                      value={item.complianceStatus || ComplianceStatus.PENDING_REVIEW}
                      onChange={(e) => handleChecklistItemChange(activeSectionMeta.key, itemKey, 'complianceStatus', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={ComplianceStatus.PENDING_REVIEW}>⏳ Pending Review</option>
                      <option value={ComplianceStatus.COMPLIANT}>✅ Compliant</option>
                      <option value={ComplianceStatus.NON_COMPLIANT}>❌ Non-Compliant</option>
                      <option value={ComplianceStatus.PARTIAL}>⚠️ Partial</option>
                      <option value={ComplianceStatus.NOT_APPLICABLE}>➖ Not Applicable</option>
                    </select>
                  </div>

                  {/* Risk Severity (Only if Non-Compliant) */}
                  {item.complianceStatus === ComplianceStatus.NON_COMPLIANT && (
                    <div>
                      <label className="block text-xs font-bold text-red-600 uppercase mb-2">Risk Severity</label>
                      <select
                        value={item.severity || ''}
                        onChange={(e) => handleChecklistItemChange(activeSectionMeta.key, itemKey, 'severity', e.target.value)}
                        className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 bg-red-50"
                      >
                        <option value="">Select Severity...</option>
                        <option value={RiskSeverity.CRITICAL}>🔴 Critical</option>
                        <option value={RiskSeverity.HIGH}>🟠 High</option>
                        <option value={RiskSeverity.MEDIUM}>🟡 Medium</option>
                        <option value={RiskSeverity.LOW}>🔵 Low</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Findings */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Auditor Findings</label>
                  <textarea
                    value={item.findings}
                    onChange={(e) => handleChecklistItemChange(activeSectionMeta.key, itemKey, 'findings', e.target.value)}
                    placeholder="Document your observations, evidence, and recommendations..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="bg-white border-t px-8 py-4 flex justify-between items-center shadow-lg">
          <button
            onClick={handlePrevious}
            disabled={currentSection === 0}
            className="px-6 py-2 text-gray-600 hover:text-gray-900 font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>
          
          <div className="text-sm text-gray-500">
            Section {currentSection + 1} of {AUDIT_SECTIONS.length}
          </div>

          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            {currentSection === AUDIT_SECTIONS.length - 1 ? (
              <>View Risk Summary <CheckCircle2 size={18} /></>
            ) : (
              <>Next <ChevronRight size={18} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessAuditWizard;
