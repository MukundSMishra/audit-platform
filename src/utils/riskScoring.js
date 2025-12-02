import weightsConfig from '../config/riskWeights.json';

export function getBaseWeight(level, cfg = weightsConfig) {
  if (!level) return 1;
  return cfg[level] ?? 1;
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
  return Math.round((raw / maxTotal) * 100);
}
