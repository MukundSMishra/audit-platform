import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { computeMultiActScore, getRiskLevel, getCategoryBreakdown } from '../utils/riskScoring';
import RiskBadge from './RiskBadge';

export default function AuditProgress({ 
  company, 
  sessionId, 
  selectedActs, 
  onContinueAudit, 
  onBackToDashboard 
}) {
  const [progressData, setProgressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overallProgress, setOverallProgress] = useState(0);
  const [riskData, setRiskData] = useState(null);

  useEffect(() => {
    loadProgressData();
  }, [sessionId, selectedActs]);

  const loadProgressData = async () => {
    setLoading(true);
    
    try {
      console.log('[AuditProgress] Loading progress for session:', sessionId);
      console.log('[AuditProgress] Selected acts:', selectedActs);
      
      // Fetch all answers for this session
      const { data: answers, error } = await supabase
        .from('session_answers')
        .select('act_id, question_id, status')
        .eq('session_id', sessionId);

      if (error) {
        console.error('[AuditProgress] Error loading answers:', error);
        setLoading(false);
        return;
      }

      console.log('[AuditProgress] Fetched answers:', answers);

      // Calculate progress for each act
      const progressByAct = selectedActs.map(act => {
        console.log('[AuditProgress] Processing act:', act.id, 'with', act.questions?.length, 'questions');
        const actAnswers = answers?.filter(a => a.act_id === act.id) || [];
        console.log('[AuditProgress] Found', actAnswers.length, 'answers for act:', act.id);
        
        const totalQuestions = act.questions?.length || 0;
        const answeredQuestions = actAnswers.length;
        const completionPercentage = totalQuestions > 0 
          ? Math.round((answeredQuestions / totalQuestions) * 100) 
          : 0;

        // Count status types - handle both formats (Compliant/compliant, Non-Compliant/non_compliant)
        const compliant = actAnswers.filter(a => 
          a.status?.toLowerCase() === 'compliant'
        ).length;
        const nonCompliant = actAnswers.filter(a => 
          a.status?.toLowerCase() === 'non-compliant' || 
          a.status?.toLowerCase() === 'non_compliant'
        ).length;
        const notApplicable = actAnswers.filter(a => 
          a.status?.toLowerCase() === 'not applicable' || 
          a.status?.toLowerCase() === 'not_applicable' ||
          a.status?.toLowerCase() === 'n/a'
        ).length;
        const delayed = actAnswers.filter(a => 
          a.status?.toLowerCase() === 'delayed'
        ).length;

        console.log('[AuditProgress] Status counts:', { compliant, nonCompliant, notApplicable, delayed });

        return {
          actId: act.id,
          actName: act.name,
          actShortName: act.shortName,
          totalQuestions,
          answeredQuestions,
          completionPercentage,
          compliant,
          nonCompliant,
          notApplicable,
          delayed,
          isComplete: answeredQuestions === totalQuestions
        };
      });

      console.log('[AuditProgress] Progress by act:', progressByAct);
      setProgressData(progressByAct);

      // Calculate overall progress
      const totalQuestions = progressByAct.reduce((sum, act) => sum + act.totalQuestions, 0);
      const totalAnswered = progressByAct.reduce((sum, act) => sum + act.answeredQuestions, 0);
      const overall = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;
      setOverallProgress(overall);

      // Calculate risk scores
      const answersMap = {};
      answers?.forEach(a => {
        answersMap[a.question_id] = { status: a.status };
      });
      
      const riskScores = computeMultiActScore(selectedActs, answersMap);
      const categoryBreakdown = getCategoryBreakdown(riskScores.actScores);
      
      setRiskData({
        ...riskScores,
        categoryBreakdown,
        overallRiskLevel: getRiskLevel(riskScores.overallScore)
      });
      
      console.log('[AuditProgress] Risk data:', riskScores);

    } catch (err) {
      console.error('Error calculating progress:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAct = (actIndex) => {
    onContinueAudit(actIndex);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading progress...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBackToDashboard}
            className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Audit Progress</h1>
            <p className="text-gray-600 mb-4">
              📍 {company.company_name} • {company.location}
            </p>
            
            {/* Overall Progress */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
                  <span className="text-2xl font-bold text-indigo-600">{overallProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${overallProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {progressData.reduce((sum, act) => sum + act.answeredQuestions, 0)} of{' '}
                  {progressData.reduce((sum, act) => sum + act.totalQuestions, 0)} questions completed
                </p>
              </div>

              {/* Overall Risk Score */}
              {riskData && (
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Overall Compliance Score</span>
                    <span className="text-2xl font-bold text-blue-600">{riskData.overallScore}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        riskData.overallScore >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                        riskData.overallScore >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                        riskData.overallScore >= 40 ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                        'bg-gradient-to-r from-red-600 to-red-800'
                      }`}
                      style={{ width: `${riskData.overallScore}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-600">
                      {riskData.completedItems} of {riskData.applicableItems} applicable items
                    </p>
                    <RiskBadge level={riskData.overallRiskLevel} />
                  </div>
                </div>
              )}
            </div>

            {/* Category Breakdown */}
            {riskData && riskData.categoryBreakdown && (
              <div className="grid md:grid-cols-3 gap-3">
                {Object.entries(riskData.categoryBreakdown).map(([key, category]) => {
                  if (category.acts.length === 0) return null;
                  return (
                    <div key={key} className="bg-white border-2 border-gray-200 rounded-lg p-3">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        {category.name}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-gray-800">{category.avgScore}%</span>
                        <span className="text-xs text-gray-500">{category.acts.length} acts</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div
                          className={`h-1.5 rounded-full ${
                            category.avgScore >= 80 ? 'bg-green-500' :
                            category.avgScore >= 60 ? 'bg-yellow-500' :
                            category.avgScore >= 40 ? 'bg-orange-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${category.avgScore}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Acts Progress Cards */}
        <div className="space-y-4">
          {progressData.map((act, index) => {
            const actRiskScore = riskData?.actScores.find(score => score.actId === act.actId);
            const actRiskLevel = actRiskScore ? getRiskLevel(actRiskScore.score) : null;
            
            return (
              <div
                key={act.actId}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{act.actName}</h3>
                    <p className="text-sm text-gray-500">{act.actShortName}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    {act.isComplete ? (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                        ✓ Complete
                      </span>
                    ) : (
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                        In Progress
                      </span>
                    )}
                    {actRiskScore && actRiskLevel && (
                      <RiskBadge level={actRiskLevel} />
                    )}
                  </div>
                </div>

                {/* Risk Score for this Act */}
                {actRiskScore && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">Compliance Score</span>
                      <span className="text-xl font-bold text-blue-600">{actRiskScore.score}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          actRiskScore.score >= 80 ? 'bg-green-500' :
                          actRiskScore.score >= 60 ? 'bg-yellow-500' :
                          actRiskScore.score >= 40 ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${actRiskScore.score}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Based on {actRiskScore.completed} answered items (Weight: {actRiskScore.maxWeight})
                    </p>
                  </div>
                )}

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">
                    {act.answeredQuestions} of {act.totalQuestions} questions
                  </span>
                  <span className="text-lg font-bold text-indigo-600">
                    {act.completionPercentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      act.isComplete 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                        : 'bg-gradient-to-r from-blue-500 to-indigo-600'
                    }`}
                    style={{ width: `${act.completionPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Statistics */}
              {act.answeredQuestions > 0 && (
                <div className="flex flex-wrap gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span className="text-gray-600">Compliant: {act.compliant}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    <span className="text-gray-600">Non-Compliant: {act.nonCompliant}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                    <span className="text-gray-600">Delayed: {act.delayed || 0}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                    <span className="text-gray-600">N/A: {act.notApplicable}</span>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={() => handleContinueAct(index)}
                className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                  act.isComplete
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {act.isComplete ? 'Review Audit' : 'Continue Audit'} →
              </button>
            </div>
          );
          })}
        </div>
      </div>
    </div>
  );
}
