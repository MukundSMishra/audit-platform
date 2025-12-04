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
