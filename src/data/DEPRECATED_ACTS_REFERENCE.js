// ============================================
// DEPRECATED ACTS - REFERENCE ONLY
// ============================================
// This file contains acts that have been superseded by newer legislation
// but are kept for historical reference and potential future use

import factoriesActData from './factoriesAct.json';

/**
 * FACTORIES ACT, 1948
 * Status: SUPERSEDED by The Occupational Safety, Health and Working Conditions Code, 2020
 * Reason for deprecation: The new OSH Code consolidates and replaces 13 central labour laws
 * including the Factories Act, 1948
 * Date deprecated: 2020 (Code enacted)
 * Transition note: Organizations should now comply with OSH Code 2020 instead
 */
export const FACTORIES_ACT_1948 = {
  id: 'factories_act_1948',
  name: 'The Factories Act, 1948',
  description: 'Central Act for factory safety, health, welfare, and working conditions',
  table: 'factories_act_checklist',
  data: factoriesActData,
  shortName: 'Factories Act',
  year: 1948,
  type: 'act',
  status: 'DEPRECATED',
  supersededBy: 'code_on_occupational_safety_2020',
  deprecationYear: 2020,
  notes: 'This act has been consolidated into the OSH Code 2020 along with 12 other central labour laws. While still valuable for reference, audits should now be conducted under the OSH Code framework.'
};

// Export all deprecated acts as an array for easy access
export const DEPRECATED_ACTS = [
  FACTORIES_ACT_1948
];

// Helper function to get a deprecated act by ID
export const getDeprecatedActById = (actId) => {
  return DEPRECATED_ACTS.find(act => act.id === actId);
};

// Helper function to check if an act has been deprecated and find its replacement
export const getReplacementAct = (deprecatedActId) => {
  const deprecatedAct = getDeprecatedActById(deprecatedActId);
  return deprecatedAct ? deprecatedAct.supersededBy : null;
};
