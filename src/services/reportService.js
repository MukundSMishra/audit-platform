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

/**
 * Fetch all audit sessions with summary data
 * Groups submissions by session_id and returns array of session summaries
 * @returns {Promise<Array>} Array of session summary objects sorted by date descending
 */
export async function fetchAllAuditSessions() {
  try {
    // Fetch all submissions from the audit_agent_submissions table
    const { data: submissions, error } = await supabase
      .from('audit_agent_submissions')
      .select('session_id, client_id, analyzed_at, ai_score, ai_status');

    if (error) {
      console.error('[Report Service] Error fetching audit sessions:', error);
      return [];
    }

    if (!submissions || submissions.length === 0) {
      console.warn('[Report Service] No audit sessions found');
      return [];
    }

    // Group submissions by session_id
    const sessionMap = new Map();

    submissions.forEach(submission => {
      const sessionId = submission.session_id;

      if (!sessionMap.has(sessionId)) {
        // Create new session entry with first submission data
        sessionMap.set(sessionId, {
          session_id: sessionId,
          client_id: submission.client_id,
          analyzed_at: submission.analyzed_at,
          scores: [],
          statuses: [],
        });
      }

      // Collect scores and statuses for averaging/aggregation
      if (submission.ai_score != null) {
        sessionMap.get(sessionId).scores.push(submission.ai_score);
      }

      if (submission.ai_status) {
        sessionMap.get(sessionId).statuses.push(submission.ai_status);
      }
    });

    // Convert map to array and format as required
    const sessions = Array.from(sessionMap.values()).map(session => {
      // Calculate average score
      const score = session.scores.length > 0
        ? Math.round(session.scores.reduce((a, b) => a + b, 0) / session.scores.length)
        : 0;

      // Determine status (use most common or latest status)
      const status = session.statuses.length > 0
        ? session.statuses[session.statuses.length - 1]
        : 'Pending';

      // Format date from analyzed_at
      const date = session.analyzed_at
        ? new Date(session.analyzed_at).toISOString().split('T')[0]
        : null;

      return {
        session_id: session.session_id,
        client_id: session.client_id,
        date: date,
        score: score,
        status: status,
      };
    });

    // Sort by date descending (newest first)
    sessions.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(b.date) - new Date(a.date);
    });

    console.log('[Report Service] Fetched and grouped audit sessions:', {
      total_sessions: sessions.length,
      total_submissions: submissions.length,
    });

    return sessions;

  } catch (error) {
    console.error('[Report Service] Unexpected error fetching all audit sessions:', error);
    return [];
  }
}
