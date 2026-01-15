import React, { useState, useEffect } from 'react';
import { FileText, Download, AlertTriangle, CheckCircle, Shield, Loader2, ArrowLeft } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { supabase } from '../services/supabaseClient';

/**
 * AuditReport Component
 * Displays AI-generated audit insights with summary stats and detailed findings
 */
const AuditReport = ({ sessionId, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState(null);
  const [aiResults, setAiResults] = useState([]);
  const [error, setError] = useState(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Query 1: Fetch session details
        const { data: session, error: sessionError } = await supabase
          .from('audit_sessions')
          .select('factory_name, location, audit_period, created_at')
          .eq('id', sessionId)
          .single();

        if (sessionError) throw new Error(`Session fetch failed: ${sessionError.message}`);

        // Query 2: Fetch all AI results for this session
        const { data: results, error: resultsError } = await supabase
          .from('audit_agent_submissions')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });

        if (resultsError) throw new Error(`AI results fetch failed: ${resultsError.message}`);

        setSessionData(session);
        setAiResults(results || []);
      } catch (err) {
        console.error('[AuditReport] Error fetching data:', err);
        setError(err.message || 'Failed to load report data');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchReportData();
    }
  }, [sessionId]);

  // Calculate summary statistics
  const calculateStats = () => {
    if (!aiResults || aiResults.length === 0) {
      return {
        complianceScore: 0,
        criticalIssues: 0,
        aiConfidence: 0,
        totalItems: 0
      };
    }

    // Compliance Score: Average of all ai_score values
    const scoresWithValues = aiResults.filter(item => item.ai_score != null);
    const complianceScore = scoresWithValues.length > 0
      ? Math.round(scoresWithValues.reduce((sum, item) => sum + item.ai_score, 0) / scoresWithValues.length)
      : 0;

    // Critical Issues: Count where risk_level is 'Critical' AND ai_score < 50
    const criticalIssues = aiResults.filter(
      item => item.risk_level === 'Critical' && item.ai_score != null && item.ai_score < 50
    ).length;

    // AI Confidence: Average of ai_score (same as compliance for now)
    const aiConfidence = complianceScore;

    return {
      complianceScore,
      criticalIssues,
      aiConfidence,
      totalItems: aiResults.length
    };
  };

  // Get color for risk level badge
  const getRiskColor = (riskLevel) => {
    const level = riskLevel?.toLowerCase();
    if (level === 'critical') return 'bg-red-100 text-red-800 border-red-200';
    if (level === 'high') return 'bg-orange-100 text-orange-800 border-orange-200';
    if (level === 'medium') return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  // Get color for category badge
  const getCategoryColor = (category) => {
    const colors = {
      environment: 'bg-emerald-100 text-emerald-800',
      safety: 'bg-blue-100 text-blue-800',
      compliance: 'bg-purple-100 text-purple-800',
      labour: 'bg-pink-100 text-pink-800',
      documentation: 'bg-indigo-100 text-indigo-800'
    };
    return colors[category?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  // Get score color for progress bar
  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Handle PDF download
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SHA Innovations - Audit Report', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Client: ${sessionData?.factory_name || 'Unknown'}`, 14, yPosition);
    
    yPosition += 6;
    doc.text(`Location: ${sessionData?.location || 'N/A'}`, 14, yPosition);
    
    yPosition += 6;
    doc.text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, yPosition);
    
    yPosition += 12;

    // Executive Summary
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 14, yPosition);
    yPosition += 8;

    doc.autoTable({
      startY: yPosition,
      head: [['Metric', 'Value']],
      body: [
        ['Compliance Score', `${stats.complianceScore}%`],
        ['Critical Issues', `${stats.criticalIssues}`],
        ['Total Items Analyzed', `${stats.totalItems}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
      margin: { left: 14, right: 14 }
    });

    yPosition = doc.lastAutoTable.finalY + 12;

    // Findings Table (The Core)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    
    // Check if we need a new page
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = 20;
    }
    
    doc.text('Detailed Findings', 14, yPosition);
    yPosition += 8;

    // Prepare findings data
    const findingsData = aiResults.map((item, index) => {
      return [
        `Q${index + 1}: ${item.question_text || 'N/A'}`,
        item.risk_level || 'Medium',
        item.user_status || 'Not Answered',
        item.ai_analysis || 'No AI analysis available',
        item.ai_score != null ? `${item.ai_score}%` : 'N/A'
      ];
    });

    doc.autoTable({
      startY: yPosition,
      head: [['Question', 'Risk Level', 'Intern Status', 'AI Analysis', 'Score']],
      body: findingsData,
      theme: 'striped',
      headStyles: { 
        fillColor: [59, 130, 246], 
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 35, fontSize: 9 }, // Question
        1: { cellWidth: 20, fontSize: 9, halign: 'center' }, // Risk Level
        2: { cellWidth: 25, fontSize: 9, halign: 'center' }, // Intern Status
        3: { cellWidth: 80, fontSize: 8 }, // AI Analysis (wide, wrap text)
        4: { cellWidth: 15, fontSize: 9, halign: 'center' } // Score
      },
      styles: {
        overflow: 'linebreak',
        cellPadding: 3,
        fontSize: 9
      },
      margin: { left: 14, right: 14 },
      didParseCell: function(data) {
        // Color rows with low scores (< 50) in red
        const rowIndex = data.row.index;
        if (data.section === 'body' && aiResults[rowIndex]) {
          const score = aiResults[rowIndex].ai_score;
          if (score != null && score < 50) {
            data.cell.styles.textColor = [220, 38, 38]; // Red color
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });

    // Footer
    const finalY = doc.lastAutoTable.finalY || yPosition;
    const footerY = pageHeight - 15;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('Generated by SHA Audit Agent', pageWidth / 2, footerY, { align: 'center' });

    // Save the PDF
    const fileName = `Audit_Report_${sessionData?.factory_name?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const stats = calculateStats();

  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading Report...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Report</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          {onBack && (
            <button
              onClick={onBack}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Top Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                  title="Go Back"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <h1 className="text-3xl font-bold text-gray-900">Audit Report</h1>
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-gray-800">
                    {sessionData?.factory_name || 'Unknown Factory'}
                  </p>
                  <p className="text-sm text-gray-600">
                    📍 {sessionData?.location || 'Location N/A'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Audit Period: {sessionData?.audit_period || new Date(sessionData?.created_at).toLocaleDateString() || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              <Download size={20} />
              Download PDF
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Compliance Score */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance Score</p>
                <p className="text-3xl font-bold text-gray-900">{stats.complianceScore}%</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${getScoreColor(stats.complianceScore)}`}
                style={{ width: `${stats.complianceScore}%` }}
              ></div>
            </div>
          </div>

          {/* Critical Issues */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Critical Issues</p>
                <p className="text-3xl font-bold text-gray-900">{stats.criticalIssues}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Requiring immediate attention</p>
          </div>

          {/* AI Confidence */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">AI Confidence</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.aiConfidence >= 80 ? 'High' : stats.aiConfidence >= 60 ? 'Medium' : 'Low'}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Based on {stats.totalItems} items analyzed</p>
          </div>
        </div>

        {/* Detailed Findings */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Detailed Findings
          </h2>

          {aiResults.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No AI analysis results found for this session.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {aiResults.map((item, index) => (
                <div
                  key={item.id || index}
                  className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900 flex-1">
                        {item.question_text || 'Question N/A'}
                      </h3>
                      <span className="text-sm font-semibold text-gray-500 ml-4">
                        #{index + 1}
                      </span>
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(item.category)}`}>
                        {item.category || 'Uncategorized'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRiskColor(item.risk_level)}`}>
                        {item.risk_level || 'Medium'} Risk
                      </span>
                    </div>
                  </div>

                  {/* Intern Input */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Intern Assessment
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-gray-700">Status:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.user_status === 'Compliant' 
                          ? 'bg-green-100 text-green-800'
                          : item.user_status === 'Non-Compliant'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.user_status || 'Not Answered'}
                      </span>
                    </div>
                    {item.user_comment && (
                      <p className="text-sm text-gray-700 italic">"{item.user_comment}"</p>
                    )}
                    {item.evidence_url && (
                      <p className="text-xs text-blue-600 mt-2">
                        📎 Evidence: {item.evidence_url}
                      </p>
                    )}
                  </div>

                  {/* AI Verdict - The Gold */}
                  <div className="mb-4 p-5 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <p className="text-sm font-bold text-blue-900 uppercase tracking-wider">
                        AI Analysis
                      </p>
                    </div>
                    {item.ai_analysis ? (
                      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                        {item.ai_analysis}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500 italic">AI analysis not available</p>
                    )}
                  </div>

                  {/* AI Score Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">AI Confidence Score</span>
                      <span className="text-lg font-bold text-gray-900">
                        {item.ai_score != null ? `${item.ai_score}%` : 'N/A'}
                      </span>
                    </div>
                    {item.ai_score != null && (
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${getScoreColor(item.ai_score)}`}
                          style={{ width: `${item.ai_score}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditReport;
