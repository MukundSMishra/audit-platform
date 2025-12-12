# Deprecated Acts Reference

## Overview
This document tracks acts that have been removed from the active audit list but are retained for historical reference and potential future use.

---

## Currently Deprecated Acts

### 1. The Factories Act, 1948

**Status:** DEPRECATED  
**Superseded By:** The Occupational Safety, Health and Working Conditions Code, 2020  
**Date Deprecated:** 2020  
**Reference File:** `src/data/DEPRECATED_ACTS_REFERENCE.js`

#### Reason for Deprecation
The Factories Act, 1948 has been consolidated into the **Occupational Safety, Health and Working Conditions (OSH) Code, 2020**. The OSH Code is one of the four Labour Codes that consolidate and rationalize 29 central labour laws into four comprehensive codes.

The OSH Code replaces 13 labour laws including:
- The Factories Act, 1948
- The Mines Act, 1952
- The Dock Workers (Safety, Health and Welfare) Act, 1986
- The Building and Other Construction Workers (Regulation of Employment and Conditions of Service) Act, 1996
- The Plantations Labour Act, 1951
- And 8 other acts

#### Transition Notes
- **For New Audits:** Use the OSH Code 2020 instead of the Factories Act
- **For Historical Reference:** The Factories Act data is preserved in `factoriesAct.json` and can be accessed via `DEPRECATED_ACTS_REFERENCE.js`
- **Legal Status:** While the OSH Code has been enacted, organizations should verify the official notification date for implementation in their jurisdiction

#### Data Preservation
- **JSON Data:** `src/data/factoriesAct.json` - Contains all audit checklist items
- **Reference Module:** `src/data/DEPRECATED_ACTS_REFERENCE.js` - Contains the full act definition with metadata

---

## How to Access Deprecated Acts

### Programmatic Access
```javascript
import { DEPRECATED_ACTS, getDeprecatedActById, getReplacementAct } from './data/DEPRECATED_ACTS_REFERENCE';

// Get all deprecated acts
const allDeprecated = DEPRECATED_ACTS;

// Get specific deprecated act
const factoriesAct = getDeprecatedActById('factories_act_1948');

// Find replacement for a deprecated act
const replacementId = getReplacementAct('factories_act_1948');
// Returns: 'code_on_occupational_safety_2020'
```

### Manual Access
1. Open `src/data/DEPRECATED_ACTS_REFERENCE.js` to view the act definition
2. Open `src/data/factoriesAct.json` to view the full audit checklist

---

## Future Deprecations

As labour law reforms continue and new codes are implemented, additional acts may be deprecated. When deprecating an act:

1. Move the act definition from `actRegistry.js` to `DEPRECATED_ACTS_REFERENCE.js`
2. Add comprehensive metadata including:
   - Deprecation year
   - Superseding legislation
   - Transition notes
   - Reason for deprecation
3. Update this documentation file
4. Keep the JSON data file intact for reference
5. Commit changes with clear explanation

---

## Related Documentation
- [Labour Code Reforms](https://labour.gov.in/labour-codes)
- [OSH Code 2020 Overview](https://labour.gov.in/osh-code)
- [IMPLEMENTATION_SUMMARY.md](../IMPLEMENTATION_SUMMARY.md)

---

**Last Updated:** December 12, 2025  
**Maintained By:** Audit Platform Development Team
