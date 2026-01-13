import React, { useState, useEffect, useRef } from 'react';
import { FileText, Loader2, AlertCircle, CheckCircle, XCircle, TrendingUp, Eye } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { fetchAuditSessionReport } from '../services/reportService';

const AuditReport = ({ sessionId = 'default-session-id' }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const reportRef = useRef();

  // Fetch report data on mount
  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      setError(null);
      
      const data = await fetchAuditSessionReport(sessionId);
      
      if (data) {
        setReport(data);
      } else {
        setError('Failed to load audit report. Please try again.');
      }
      
      setLoading(false);
    };

    loadReport();
  }, [sessionId]);

  // PDF Export Handler
  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: `Audit_Report_${sessionId}`,
  });

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 size={48} className="animate-spin text-indigo-600 mx-auto" />
          <p className="text-slate-600 font-semibold">Loading audit report...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg border border-rose-200 p-8 max-w-md text-center">
          <XCircle size={48} className="text-rose-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Report Error</h2>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  const { summary, raw_details } = report;
  
  // Color coding for compliance score
  const getComplianceColor = (score) => {
    if (score >= 90) return { bg: 'bg-emerald-500', text: 'text-emerald-600', ring: 'ring-emerald-200' };
    if (score >= 70) return { bg: 'bg-amber-500', text: 'text-amber-600', ring: 'ring-amber-200' };
    return { bg: 'bg-rose-500', text: 'text-rose-600', ring: 'ring-rose-200' };
  };

  const complianceColors = getComplianceColor(summary.overall_compliance);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Print-friendly wrapper */}
      <div ref={reportRef} className="print:bg-white">
        
        {/* Header */}
        <header className="bg-white border-b border-slate-200 shadow-sm print:shadow-none">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black text-slate-900">SHA Innovations</h1>
              <p className="text-sm text-slate-600 mt-0.5">
                Audit Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-bold text-sm shadow hover:bg-indigo-700 transition-all print:hidden"
            >
              <FileText size={18} />
              Download PDF
            </button>
          </div>
        </header>

        {/* Hero Section - The Scorecard */}
        <section className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              
              {/* Left: Radial Progress Bar */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-64 h-64">
                  {/* SVG Radial Progress */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="8"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeLinecap="round"
                      className={complianceColors.text}
                      strokeDasharray={`${summary.overall_compliance * 2.51} 251.2`}
                    />
                  </svg>
                  {/* Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-5xl font-black ${complianceColors.text}`}>
                      {summary.overall_compliance}%
                    </span>
                    <span className="text-sm font-semibold text-slate-600 mt-1">Compliance</span>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mt-6">Overall Compliance Score</h2>
              </div>

              {/* Right: Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
                {/* Critical Risks */}
                <div className="bg-gradient-to-br from-rose-50 to-rose-100 border border-rose-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-rose-500 flex items-center justify-center shadow">
                      <AlertCircle size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-rose-700">Critical Risks</p>
                      <p className="text-3xl font-black text-rose-900">{summary.critical_risk_count}</p>
                    </div>
                  </div>
                </div>

                {/* Non-Compliant Items */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-amber-500 flex items-center justify-center shadow">
                      <XCircle size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-700">Non-Compliant</p>
                      <p className="text-3xl font-black text-amber-900">{summary.non_compliant_items}</p>
                    </div>
                  </div>
                </div>

                {/* Total Assessed */}
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-indigo-500 flex items-center justify-center shadow">
                      <TrendingUp size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-indigo-700">Total Assessed</p>
                      <p className="text-3xl font-black text-indigo-900">{summary.total_items}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Findings - Compliance Breakdown */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="mb-8">
            <h2 className="text-3xl font-black text-slate-900 mb-2">Compliance Breakdown</h2>
            <p className="text-slate-600">Detailed findings from the audit assessment</p>
          </div>

          <div className="space-y-4">
            {raw_details && raw_details.length > 0 ? (
              raw_details.map((item, index) => (
                <div
                  key={item.id || index}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="p-6 border-b border-slate-200">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-xs font-bold text-slate-500 uppercase">Q{index + 1}</span>
                          {item.status === 'Compliant' && (
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200 flex items-center gap-1">
                              <CheckCircle size={14} />
                              Compliant
                            </span>
                          )}
                          {item.status === 'Non-Compliant' && (
                            <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-bold rounded-full border border-rose-200 flex items-center gap-1">
                              <XCircle size={14} />
                              Non-Compliant
                            </span>
                          )}
                          {item.status === 'Not Applicable' && (
                            <span className="px-3 py-1 bg-slate-100 text-slate-800 text-xs font-bold rounded-full border border-slate-200">
                              N/A
                            </span>
                          )}
                          {item.risk_level && (
                            <span className={`px-2 py-1 text-xs font-bold rounded ${
                              item.risk_level === 'Critical' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              item.risk_level === 'High' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                              item.risk_level === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {item.risk_level} Risk
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                          {item.question_text || 'Question text not available'}
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-4">
                    {/* AI Analysis Box - Only show for Non-Compliant items */}
                    {item.status === 'Non-Compliant' && item.ai_analysis && (
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-bold text-slate-900">🤖 AI Gap Analysis</span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {item.ai_analysis}
                        </p>
                        {item.ai_score != null && (
                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-600">AI Score:</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${
                              item.ai_score >= 80 ? 'bg-emerald-100 text-emerald-800' :
                              item.ai_score >= 60 ? 'bg-amber-100 text-amber-800' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              {item.ai_score}/100
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Evidence Section */}
                    {item.evidence_url && (
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-lg border-2 border-slate-200 overflow-hidden bg-slate-100 flex-shrink-0">
                          <img
                            src={item.evidence_url}
                            alt="Evidence"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-slate-400 text-xs">📄</div>';
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-slate-600 mb-1">Evidence Attached</p>
                          <a
                            href={item.evidence_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                          >
                            <Eye size={14} />
                            View Evidence
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Agent Attribution */}
                    {item.ai_agent_name && (
                      <div className="pt-3 border-t border-slate-200">
                        <p className="text-xs text-slate-500">
                          Analyzed by: <span className="font-semibold text-slate-700">{item.ai_agent_name}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <p className="text-slate-600">No audit findings available for this session.</p>
              </div>
            )}
          </div>
        </section>

        {/* Print Styles */}
        <style jsx>{`
          @media print {
            @page {
              margin: 1cm;
            }
            body {
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }
            .print\\:hidden {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default AuditReport;
