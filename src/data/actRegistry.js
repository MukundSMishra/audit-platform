// Central registry for all available acts

// ============================================
// MODERN LABOUR CODES (2019-2020)
// ============================================
import codeOnWagesData from './codeOnWages.json';
import codeOnSocialSecurityData from './codeOnSocialSecurity.json';
import codeOnOccupationalSafetyData from './codeONOccupationalSafety.json';
import codeOnIndustrialDisputeData from './codeONIndustrialDispute.json';

// ============================================
// CENTRAL LABOUR ACTS (Chronological)
// ============================================
import factoriesActData from './factoriesAct.json';
import childLabourActData from './childLabourAct.json';
import sexualHarassmentActData from './sexualHarrasement.json';

// ============================================
// ENVIRONMENTAL ACTS (Chronological)
// ============================================
import waterActData from './waterAct.json';
import airActData from './airAct.json';
import environmentProtectionActData from './environmentProtectionAct.json';
import hazardousWasteManagementData from './hazardousWasteManagement.json';

// ============================================
// MAHARASHTRA STATE ACTS (Chronological)
// ============================================
import maharashtraLabourWelfareFundActData from './maharashtraLabourWelfareFundAct.json';
import maharashtraFactoriesRulesData from './factoriesRule.json';
import maharashtraManualLabourActData from './maharashtraManualLabourAct.json';
import maharashtraFireSafetyActData from './maharashtraFireSafetyAct.json';

export const AVAILABLE_ACTS = [
  // ============================================
  // MODERN LABOUR CODES (2019-2020)
  // ============================================
  {
    id: 'code_on_wages_2019',
    name: 'The Code on Wages, 2019',
    description: 'Comprehensive law for wage standards, equal remuneration, payment regulations, and minimum wages',
    table: 'code_on_wages_checklist',
    data: codeOnWagesData,
    shortName: 'Code on Wages',
    year: 2019,
    type: 'act'
  },
  {
    id: 'code_on_social_security_2020',
    name: 'The Code on Social Security, 2020',
    description: 'Consolidates laws related to EPF, ESI, gratuity, maternity benefits, and social security schemes',
    table: 'code_on_social_security_checklist',
    data: codeOnSocialSecurityData,
    shortName: 'Social Security Code',
    year: 2020,
    type: 'act'
  },
  {
    id: 'code_on_occupational_safety_2020',
    name: 'The Occupational Safety, Health and Working Conditions Code, 2020',
    description: 'Consolidates laws on workplace safety, health, and working conditions for all establishments',
    table: 'code_on_occupational_safety_checklist',
    data: codeOnOccupationalSafetyData,
    shortName: 'OSH Code',
    year: 2020,
    type: 'act'
  },
  {
    id: 'code_on_industrial_relations_2020',
    name: 'The Industrial Relations Code, 2020',
    description: 'Consolidates laws relating to trade unions, industrial disputes, and employment conditions',
    table: 'code_on_industrial_relations_checklist',
    data: codeOnIndustrialDisputeData,
    shortName: 'IR Code',
    year: 2020,
    type: 'act'
  },

  // ============================================
  // CENTRAL LABOUR ACTS (Chronological)
  // ============================================
  {
    id: 'factories_act_1948',
    name: 'The Factories Act, 1948',
    description: 'Central Act for factory safety, health, welfare, and working conditions',
    table: 'factories_act_checklist',
    data: factoriesActData,
    shortName: 'Factories Act',
    year: 1948,
    type: 'act'
  },
  {
    id: 'child_labour_act_1986',
    name: 'The Child and Adolescent Labour (Prohibition and Regulation) Act, 1986',
    description: 'Prohibits employment of children below 14 years and regulates working conditions of adolescents',
    table: 'child_labour_act_checklist',
    data: childLabourActData,
    shortName: 'Child Labour Act',
    year: 1986,
    type: 'act'
  },
  {
    id: 'sexual_harassment_act_2013',
    name: 'The Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013',
    description: 'Provides protection against sexual harassment of women at workplace and prevention mechanisms',
    table: 'sexual_harassment_act_checklist',
    data: sexualHarassmentActData,
    shortName: 'POSH Act',
    year: 2013,
    type: 'act'
  },

  // ============================================
  // ENVIRONMENTAL ACTS (Chronological)
  // ============================================
  {
    id: 'water_act_1974',
    name: 'The Water (Prevention and Control of Pollution) Act, 1974',
    description: 'Prevention and control of water pollution; regulates discharge of effluents into water bodies',
    table: 'water_act_checklist',
    data: waterActData,
    shortName: 'Water Act',
    year: 1974,
    type: 'act'
  },
  {
    id: 'air_act_1981',
    name: 'The Air (Prevention and Control of Pollution) Act, 1981',
    description: 'Prevention, control and abatement of air pollution; regulates emissions from industries',
    table: 'air_act_checklist',
    data: airActData,
    shortName: 'Air Act',
    year: 1981,
    type: 'act'
  },
  {
    id: 'environment_protection_act_1986',
    name: 'The Environment (Protection) Act, 1986',
    description: 'Umbrella legislation for environmental protection and regulation of pollution',
    table: 'environment_protection_act_checklist',
    data: environmentProtectionActData,
    shortName: 'EPA',
    year: 1986,
    type: 'act'
  },
  {
    id: 'hazardous_waste_rules_2016',
    name: 'Hazardous and Other Wastes (Management and Transboundary Movement) Rules, 2016',
    description: 'Regulation of hazardous waste generation, collection, storage, transportation, and disposal',
    table: 'hazardous_waste_rules_checklist',
    data: hazardousWasteManagementData,
    shortName: 'Hazardous Waste Rules',
    year: 2016,
    type: 'rules'
  },

  // ============================================
  // MAHARASHTRA STATE ACTS (Chronological)
  // ============================================
  {
    id: 'maharashtra_labour_welfare_fund_act_1953',
    name: 'The Maharashtra Labour Welfare Fund Act, 1953',
    description: 'State-level welfare fund for labour welfare activities; contribution requirements',
    table: 'maharashtra_labour_welfare_fund_checklist',
    data: maharashtraLabourWelfareFundActData,
    shortName: 'MH Labour Welfare Fund',
    year: 1953,
    type: 'act'
  },
  {
    id: 'maharashtra_factories_rules_1963',
    name: 'Maharashtra Factories Rules, 1963',
    description: 'State-specific rules for Maharashtra factories under the Factories Act',
    table: 'maharashtra_factories_rules_checklist',
    data: maharashtraFactoriesRulesData,
    shortName: 'MH Factory Rules',
    year: 1963,
    type: 'rules'
  },
  {
    id: 'maharashtra_manual_labour_act_1969',
    name: 'The Maharashtra Mathadi, Hamal and Other Manual Workers (Regulation of Employment and Welfare) Act, 1969',
    description: 'Regulation of employment and welfare of manual workers in Maharashtra',
    table: 'maharashtra_manual_labour_act_checklist',
    data: maharashtraManualLabourActData,
    shortName: 'MH Manual Workers Act',
    year: 1969,
    type: 'act'
  },
  {
    id: 'maharashtra_fire_safety_act_2006',
    name: 'The Maharashtra Fire Prevention and Life Safety Measures Act, 2006',
    description: 'Fire prevention, life safety measures, and fire fighting installations in buildings',
    table: 'maharashtra_fire_safety_act_checklist',
    data: maharashtraFireSafetyActData,
    shortName: 'MH Fire Safety Act',
    year: 2006,
    type: 'act'
  }
];

// Helper functions to filter by type
export const getActsByType = (type) => {
  return AVAILABLE_ACTS.filter(act => act.type === type);
};

export const getAllActs = () => {
  return AVAILABLE_ACTS.filter(act => act.type === 'act');
};

export const getAllRules = () => {
  return AVAILABLE_ACTS.filter(act => act.type === 'rules');
};

export const getActById = (actId) => {
  return AVAILABLE_ACTS.find(act => act.id === actId);
};

export const getActData = (actId) => {
  const act = getActById(actId);
  if (!act) return [];
  
  // Normalize the data: add 'id' field from 'audit_item_id' for compatibility
  return act.data.map(item => ({
    ...item,
    id: item.audit_item_id
  }));
};
