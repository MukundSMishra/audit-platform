import weightsConfig from '../config/riskWeights.json';

export function getBaseWeight(level, cfg = weightsConfig) {
  if (!level) {
    console.warn('[Risk Scoring] No risk level provided, defaulting to weight 1');
    return 1;
  }
  
  // Normalize: trim whitespace
  const normalized = String(level).trim();
  
  // Try exact match first
  if (cfg[normalized]) {
    return cfg[normalized];
  }
  
  // Try case-insensitive match as fallback
  const lowerLevel = normalized.toLowerCase();
  for (const key in cfg) {
    if (key.toLowerCase() === lowerLevel && key !== 'statusFactors' && key !== 'penalty') {
      return cfg[key];
    }
  }
  
  console.warn(`[Risk Scoring] Risk level "${normalized}" not found in config. Using weight 1. Available: Critical(5), High(4), Medium(3), Low(2)`);
  return 1;
}

export function getPenaltyFactor(penaltyDetails, penaltyCfg = weightsConfig.penalty) {
  if (!penaltyCfg?.usePenaltyModulation) return 1;
  const amount = penaltyDetails?.fine_amount_max_inr;
  if (!amount || typeof amount !== 'number') return 1;
  const factor = 1 + Math.log10(1 + amount) / 2; // gentle scale
  const maxFactor = penaltyCfg?.maxFactor ?? 2;
  return Math.min(factor, maxFactor);
}

export function computeQuestionWeight(item, cfg = weightsConfig) {
  const level = item?.risk_level || item?.risk_profile?.severity_level;
  const base = getBaseWeight(level, cfg);
  const penalty = getPenaltyFactor(item?.risk_profile?.penalty_details, cfg?.penalty);
  const weight = base * penalty;
  
  // Debug logging - sample first few items
  if (item?.id && !window.__riskScoringLogged) {
    if (!window.__riskScoringLoggedItems) window.__riskScoringLoggedItems = new Set();
    if (window.__riskScoringLoggedItems.size < 10) {
      console.log(`[Risk Weight Debug] ${item.id} | Level:"${level}" | BaseWeight:${base} | Penalty:${penalty.toFixed(2)} | Final:${weight.toFixed(2)}`);
      window.__riskScoringLoggedItems.add(item.id);
    }
  }
  
  return Math.round(weight * 100) / 100;
}

export function getStatusFactor(status, statusCfg = weightsConfig.statusFactors) {
  return statusCfg?.[status] ?? 0;
}

export function computeSessionScore(auditData, answers, cfg = weightsConfig) {
  if (!Array.isArray(auditData)) return 0;
  const applicable = auditData.filter(q => (answers[q.id]?.status ?? null) !== 'Not Applicable');
  const maxTotal = applicable.reduce((sum, q) => sum + computeQuestionWeight(q, cfg), 0);
  if (maxTotal <= 0) return 0;
  const raw = applicable.reduce((sum, q) => {
    const status = answers[q.id]?.status;
    const sf = getStatusFactor(status, cfg.statusFactors);
    return sum + computeQuestionWeight(q, cfg) * sf;
  }, 0);
  
  const score = Math.round((raw / maxTotal) * 100);
  
  // Log score calculation summary
  if (applicable.length > 0 && !window.__riskScoreSummaryLogged) {
    console.log(`[Risk Score Summary] Applicable Questions: ${applicable.length} | Max Possible: ${Math.round(maxTotal * 100) / 100} | Raw Score: ${Math.round(raw * 100) / 100} | Final Score: ${score}/100`);
    console.table(applicable.map(q => ({
      'Question ID': q.id,
      'Risk Level': q.risk_level || q?.risk_profile?.severity_level,
      'Weight': computeQuestionWeight(q, cfg),
      'Status': answers[q.id]?.status || 'Pending',
      'Contribution': (computeQuestionWeight(q, cfg) * getStatusFactor(answers[q.id]?.status, cfg.statusFactors)).toFixed(2)
    })));
    window.__riskScoreSummaryLogged = true;
  }
  
  return score;
}

/**
 * Compute risk score for a specific act
 * @param {Array} actQuestions - Questions belonging to a specific act
 * @param {Object} answers - Answer data for all questions
 * @param {Object} cfg - Risk weights configuration
 * @returns {Object} { score: number, applicable: number, total: number, completed: number }
 */
export function computeActScore(actQuestions, answers, cfg = weightsConfig) {
  if (!Array.isArray(actQuestions) || actQuestions.length === 0) {
    return { score: 0, applicable: 0, total: actQuestions?.length || 0, completed: 0, maxWeight: 0, rawScore: 0 };
  }
  
  const applicable = actQuestions.filter(q => (answers[q.id]?.status ?? null) !== 'Not Applicable');
  const completed = applicable.filter(q => answers[q.id]?.status && answers[q.id].status !== null);
  
  const maxTotal = applicable.reduce((sum, q) => sum + computeQuestionWeight(q, cfg), 0);
  
  if (maxTotal <= 0) {
    return { score: 0, applicable: applicable.length, total: actQuestions.length, completed: completed.length, maxWeight: 0, rawScore: 0 };
  }
  
  const raw = applicable.reduce((sum, q) => {
    const status = answers[q.id]?.status;
    const sf = getStatusFactor(status, cfg.statusFactors);
    return sum + computeQuestionWeight(q, cfg) * sf;
  }, 0);
  
  const score = Math.round((raw / maxTotal) * 100);
  
  return {
    score,
    applicable: applicable.length,
    total: actQuestions.length,
    completed: completed.length,
    maxWeight: Math.round(maxTotal * 100) / 100,
    rawScore: Math.round(raw * 100) / 100
  };
}

/**
 * Compute overall weighted average score across multiple acts
 * @param {Array} selectedActs - Array of act objects with their data
 * @param {Object} answers - Answer data for all questions
 * @param {Object} cfg - Risk weights configuration
 * @returns {Object} { overallScore, actScores: [{actId, actName, score, weight, ...}], totalItems, completedItems }
 */
export function computeMultiActScore(selectedActs, answers, cfg = weightsConfig) {
  if (!Array.isArray(selectedActs) || selectedActs.length === 0) {
    return { 
      overallScore: 0, 
      actScores: [], 
      totalItems: 0, 
      completedItems: 0,
      applicableItems: 0,
      totalWeight: 0 
    };
  }
  
  const actScores = selectedActs.map(act => {
    const actResult = computeActScore(act.data, answers, cfg);
    return {
      actId: act.id,
      actName: act.name,
      actShortName: act.shortName,
      actType: act.type,
      ...actResult
    };
  });
  
  // Calculate weighted average based on number of applicable items in each act
  const totalApplicable = actScores.reduce((sum, act) => sum + act.applicable, 0);
  const totalCompleted = actScores.reduce((sum, act) => sum + act.completed, 0);
  const totalQuestions = actScores.reduce((sum, act) => sum + act.total, 0);
  const totalWeight = actScores.reduce((sum, act) => sum + act.maxWeight, 0);
  
  // Weighted average: each act contributes proportionally to its applicable items
  const overallScore = totalApplicable > 0
    ? Math.round(actScores.reduce((sum, act) => {
        const weight = act.applicable / totalApplicable;
        return sum + (act.score * weight);
      }, 0))
    : 0;
  
  return {
    overallScore,
    actScores,
    totalItems: totalQuestions,
    applicableItems: totalApplicable,
    completedItems: totalCompleted,
    totalWeight: Math.round(totalWeight * 100) / 100
  };
}

/**
 * Get risk level category based on score
 * @param {number} score - Risk score (0-100)
 * @returns {string} Risk level: Critical, High, Medium, Low
 */
export function getRiskLevel(score) {
  if (score >= 80) return 'Low';
  if (score >= 60) return 'Medium';
  if (score >= 40) return 'High';
  return 'Critical';
}

/**
 * Get category-wise risk breakdown (Labour, Environmental, State)
 * @param {Array} actScores - Array of act scores from computeMultiActScore
 * @returns {Object} Category breakdown with scores
 */
export function getCategoryBreakdown(actScores) {
  const categories = {
    labour: { name: 'Labour Compliance', acts: [], avgScore: 0 },
    environmental: { name: 'Environmental Compliance', acts: [], avgScore: 0 },
    state: { name: 'State Regulations', acts: [], avgScore: 0 }
  };
  
  actScores.forEach(act => {
    const actName = act.actName.toLowerCase();
    if (actName.includes('code on') || actName.includes('labour') || actName.includes('child') || actName.includes('sexual') || actName.includes('factories')) {
      categories.labour.acts.push(act);
    } else if (actName.includes('water') || actName.includes('air') || actName.includes('environment') || actName.includes('hazardous')) {
      categories.environmental.acts.push(act);
    } else if (actName.includes('maharashtra')) {
      categories.state.acts.push(act);
    } else {
      // Default to labour for others
      categories.labour.acts.push(act);
    }
  });
  
  // Calculate average score for each category
  Object.keys(categories).forEach(key => {
    const cat = categories[key];
    if (cat.acts.length > 0) {
      const totalApplicable = cat.acts.reduce((sum, act) => sum + act.applicable, 0);
      cat.avgScore = totalApplicable > 0
        ? Math.round(cat.acts.reduce((sum, act) => {
            const weight = act.applicable / totalApplicable;
            return sum + (act.score * weight);
          }, 0))
        : 0;
    }
  });
  
  return categories;
}
