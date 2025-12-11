// Central registry for all available acts
import factoriesActData from './factoriesAct.json';
import maharashtraFactoriesRulesData from './factoriesRule.json';
import codeOnWagesData from './codeOnWages.json';

export const AVAILABLE_ACTS = [
  {
    id: 'factories_act_1948',
    name: 'The Factories Act, 1948',
    description: 'Central Act for factory safety, health, and welfare',
    table: 'factories_act_checklist',
    data: factoriesActData,
    shortName: 'Factories Act'
  },
  {
    id: 'maharashtra_factories_rules_1963',
    name: 'Maharashtra Factories Rules, 1963',
    description: 'State-specific rules for Maharashtra factories',
    table: 'maharashtra_factories_rules_checklist',
    data: maharashtraFactoriesRulesData,
    shortName: 'MH Factory Rules'
  },
  {
    id: 'code_on_wages_2019',
    name: 'The Code on Wages, 2019',
    description: 'Central Act for wage standards, equal remuneration, and payment regulations',
    table: 'code_on_wages_checklist',
    data: codeOnWagesData,
    shortName: 'Code on Wages'
  }
];

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
