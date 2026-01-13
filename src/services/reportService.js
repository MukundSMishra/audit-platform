import { supabase } from './supabaseClient';

/**
 * Fetch and aggregate audit session data into a structured report
 * @param {string} sessionId - The audit session ID
 * @returns {Promise<Object|null>} Structured report object or null on error
 */
export async function fetchAuditSessionReport(sessionId) {
  try {
    // Fetch all audit agent submissions for this session
    const { data: submissions, error } = await supabase
      .from('audit_agent_submissions')
      .select('*')
      .eq('session_id', sessionId);

    if (error) {
      console.error('[Report Service] Supabase query error:', error);
      return null;
    }

    if (!submissions || submissions.length === 0) {
      console.warn('[Report Service] No submissions found for session:', sessionId);
      return {
        summary: {
          overall_compliance: 0,
          critical_risk_count: 0,
          total_score: 0,
          total_items: 0,
          applicable_items: 0,
          compliant_items: 0,
        },
        agent_breakdown: {},
        raw_details: [],
      };
    }

    // Calculate KPIs
    const applicableItems = submissions.filter(
      (item) => item.status !== 'Not Applicable'
    );
    const compliantItems = submissions.filter(
      (item) => item.status === 'Compliant'
    );
    const criticalRiskNonCompliant = submissions.filter(
      (item) => item.risk_level === 'Critical' && item.status === 'Non-Compliant'
    );

    // Calculate overall compliance percentage
    const overallCompliance = applicableItems.length > 0
      ? Math.round((compliantItems.length / applicableItems.length) * 100)
      : 0;

    // Calculate total score (average of all ai_score values)
    const scoresWithValues = submissions.filter((item) => item.ai_score != null);
    const totalScore = scoresWithValues.length > 0
      ? Math.round(
          scoresWithValues.reduce((sum, item) => sum + item.ai_score, 0) / scoresWithValues.length
        )
      : 0;

    // Group results by ai_agent_name (Multi-Agent Support)
    const agentBreakdown = {};

    submissions.forEach(item => {
      const agentName = item.ai_agent_name || 'Unknown_Agent';

      if (!agentBreakdown[agentName]) {
        agentBreakdown[agentName] = {
          score: 0,
          issues: 0,
          items: [],
          total_items: 0,
          score_count: 0,
        };
      }

      agentBreakdown[agentName].items.push(item);
      agentBreakdown[agentName].total_items++;

      // Track score for averaging
      if (item.ai_score != null) {
        agentBreakdown[agentName].score += item.ai_score;
        agentBreakdown[agentName].score_count++;
      }

      // Count issues (non-compliant items)
      if (item.status === 'Non-Compliant') {
        agentBreakdown[agentName].issues++;
      }
    });

    // Calculate average scores for each agent
    Object.keys(agentBreakdown).forEach(agentName => {
      const agent = agentBreakdown[agentName];
      agent.score = agent.score_count > 0
        ? Math.round(agent.score / agent.score_count)
        : 0;
      // Clean up temporary counter
      delete agent.score_count;
    });

    // Build and return the structured report
    const report = {
      summary: {
        overall_compliance: overallCompliance,
        critical_risk_count: criticalRiskNonCompliant.length,
        total_score: totalScore,
        total_items: submissions.length,
        applicable_items: applicableItems.length,
        compliant_items: compliantItems.length,
        non_compliant_items: submissions.filter((item) => item.status === 'Non-Compliant').length,
        not_applicable_items: submissions.filter((item) => item.status === 'Not Applicable').length,
      },
      agent_breakdown: agentBreakdown,
      raw_details: submissions,
    };

    console.log('[Report Service] Report generated successfully:', {
      session_id: sessionId,
      total_items: report.summary.total_items,
      agents: Object.keys(agentBreakdown).length,
    });

    return report;

  } catch (error) {
    console.error('[Report Service] Unexpected error:', error);
    return null;
  }
}
