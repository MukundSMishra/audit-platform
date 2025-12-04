# Risk Scoring Implementation - Verification Guide

## Overview
A comprehensive weighted risk scoring system has been implemented to calculate audit compliance scores from 0-100, where high-risk items contribute more to the overall score.

## Implementation Components

### 1. Risk Configuration (`src/config/riskWeights.json`)
Centralized configuration for all risk scoring parameters:

```json
{
  "Critical": 5,      // Highest risk weight
  "High": 4,          // High risk weight
  "Medium": 3,        // Medium risk weight
  "Low": 2,           // Low risk weight
  "statusFactors": {
    "Non-Compliant": 1.0,    // Full contribution to risk score
    "Delayed": 0.5,          // Half contribution (needs follow-up)
    "Compliant": 0,          // No contribution to risk score
    "Not Applicable": 0      // Not applicable items don't contribute
  },
  "penalty": {
    "enable": false,
    "maxFactor": 2.0,
    "logBase": 10
  }
}
```

### 2. Risk Scoring Utilities (`src/utils/riskScoring.js`)

#### Key Functions:

**`getBaseWeight(riskLevel, config)`**
- Maps risk level strings to numeric weights
- Features:
  - Whitespace trimming
  - Case-insensitive matching with fallback
  - Console warnings for unmatched levels
  - Returns 1 as default for unknown levels

**`getPenaltyFactor(penaltyDetails, config)`**
- Applies optional log-based penalty modulation based on fine amounts
- Default: 1.0 (no modulation)
- Can scale up to 2.0 if penalties are configured

**`computeQuestionWeight(item, config)`**
- Calculates individual question weight = baseWeight × penaltyFactor
- Logs with format: `[Risk Weight Debug] {ID} | Level:"{level}" | BaseWeight:{base} | Penalty:{penalty} | Final:{weight}`
- Used to assign risk-based weight to each question

**`getStatusFactor(status, statusFactors)`**
- Converts observation status to contribution multiplier:
  - Non-Compliant: 1.0 (full risk)
  - Delayed: 0.5 (partial risk, needs follow-up)
  - Compliant: 0 (no risk)
  - Not Applicable: 0 (not evaluated)

**`computeSessionScore(auditData, answers, config)`**
- Aggregates all question contributions into a single 0-100 score
- Formula: `(sumOfContributions / maxPossibleWeight) × 100`
- Logs summary with table:
  ```
  [Risk Score Summary] Applicable Questions: X | Max Possible: Y | Raw Score: Z | Final Score: W/100
  ```

### 3. App Component Integration (`src/App.jsx`)

**Risk Score Display in Top Bar:**
- Shows "Risk Score: X / 100" with dynamic color coding
- Green (0-33): Low risk
- Amber (34-66): Medium risk
- Red (67-100): High risk

**Real-time Updates:**
- Risk score recomputes whenever answers change
- Reflects immediate impact of status changes on overall compliance

### 4. Question Card Display (`src/components/AuditCard.jsx`)

**Risk Information in Header:**
- Risk level badge: Shows "Critical/High/Medium/Low Risk" with color coding
- Weight indicator: Displays "Weight: X" directly below risk level
- Located in top-right corner for immediate visibility

**Per-Question Contribution:**
- Located in Observation Status section
- Shows "Contribution: X.XX" based on weight × status factor
- Updates dynamically as status changes
- When Non-Compliant: shows full contribution value
- When Delayed: shows 50% of weight value
- When Compliant: shows 0 contribution

**Verification Logging:**
- Logs first 5 questions on page load
- Format: `[AuditCard Verification] ID:{id} | Risk Label:"{level}" | Base Weight:{weight} | Status:"{status}" | Contribution:{contribution}`

## How to Verify Implementation

### Step 1: Open Browser DevTools Console
1. Run the app: `npm run dev`
2. Open http://localhost:5173
3. Press `F12` to open DevTools
4. Go to the **Console** tab

### Step 2: Review Risk Score Logs
Look for log entries in this order:

**On Page Load:**
```
[AuditCard Verification] ID:FACT-06-01 | Risk Label:"Critical" | Base Weight:5 | Status:"null" | Contribution:0
[AuditCard Verification] ID:FACT-07-01 | Risk Label:"High" | Base Weight:4 | Status:"null" | Contribution:0
[AuditCard Verification] ID:FACT-108(0)-01 | Risk Label:"Low" | Base Weight:2 | Status:"null" | Contribution:0
```

**When Computing Score:**
```
[Risk Weight Debug] FACT-06-01 | Level:"Critical" | BaseWeight:5 | Penalty:1.00 | Final:5.00
[Risk Weight Debug] FACT-07-01 | Level:"High" | BaseWeight:4 | Penalty:1.00 | Final:4.00
[Risk Weight Debug] FACT-08-01 | Level:"Medium" | BaseWeight:3 | Penalty:1.00 | Final:3.00
```

**Final Score Calculation:**
```
[Risk Score Summary] Applicable Questions: 39 | Max Possible: 156.78 | Raw Score: 52.45 | Final Score: 34/100
```

### Step 3: Verify Visual Display

**Top Bar Risk Score Badge:**
- Located in header next to session date
- Format: "Risk Score: X / 100"
- Green background if X ≤ 33
- Amber background if 34 ≤ X ≤ 66
- Red background if X ≥ 67

**Question Cards:**
- Open any question card
- In top-right header, see: "{Risk} Risk" badge with "Weight: X" below it
- In Observation Status section, see: "Contribution: X.XX"

### Step 4: Validate Risk-Status Calculations

Change a question's status and verify:

**Example: FACT-06-01 (Critical Risk, Weight=5)**
- Non-Compliant → Contribution: 5.00 (full weight)
- Delayed → Contribution: 2.50 (50% of weight)
- Compliant → Contribution: 0 (no contribution)

**Example: FACT-08-01 (Medium Risk, Weight=3)**
- Non-Compliant → Contribution: 3.00
- Delayed → Contribution: 1.50
- Compliant → Contribution: 0

### Step 5: Check Risk Label Accuracy

Verify displayed risk labels match Supabase data:

1. Go to https://supabase.com
2. Open your project's `factories_act_checklist` table
3. Click on any question row
4. Check the `risk_level` column value
5. Find that same question in the app
6. Verify the badge shows the correct risk level

**Expected matches:**
- "Critical" → Critical Risk (rose background)
- "High" → High Risk (orange background)
- "Medium" → Medium Risk (amber background)
- "Low" → Low Risk (blue background)

## Scoring Algorithm Explanation

### Weight Assignment
Each question gets a base weight based on its risk level:
- Critical = 5 (highest impact on score)
- High = 4
- Medium = 3
- Low = 2 (lowest impact on score)

### Status Factor Application
Each observation status has a multiplier:
- **Non-Compliant** (1.0): Full risk materialized
  - Contribution = Weight × 1.0
- **Delayed** (0.5): Partial risk, being addressed
  - Contribution = Weight × 0.5
- **Compliant** (0): No risk
  - Contribution = Weight × 0
- **Not Applicable** (0): Not evaluated
  - Contribution = 0

### Score Normalization
```
Final Score = (Sum of all question contributions / Max possible score) × 100
```

**Example:**
- 10 questions, all Critical (weight 5 each)
- Max possible = 10 × 5 = 50
- If 8 are Non-Compliant, 2 are Compliant:
  - Raw contribution = (8 × 5) + (2 × 0) = 40
  - Final Score = (40 / 50) × 100 = 80 / 100

## Verification Checklist

- [ ] Risk Score badge displays in top bar
- [ ] Risk Score changes color correctly based on value (green/amber/red)
- [ ] Question cards show weight in header
- [ ] Question cards show contribution in status section
- [ ] Console logs show correct risk level mappings
- [ ] Console logs show weight calculations
- [ ] Changing status updates contribution value
- [ ] Risk Score updates when any question status changes
- [ ] Non-Compliant items contribute full weight
- [ ] Delayed items contribute 50% of weight
- [ ] Compliant items contribute 0
- [ ] Risk levels match Supabase database

## Files Modified

```
src/config/riskWeights.json              - NEW: Risk configuration
src/utils/riskScoring.js                 - NEW: Scoring utilities
src/App.jsx                              - MODIFIED: Add risk score display + computation
src/components/AuditCard.jsx             - MODIFIED: Add weight/contribution display + logging
```

## Git Commits

```
cf407d1 - Improve risk scoring: normalize risk levels, add case-insensitive matching, debug logging
76c710d - Risk scoring: add config + utils; compute session score; show badge; per-question badges
```

## Next Steps

### To test the implementation:
1. Start the dev server: `npm run dev`
2. Open http://localhost:5173
3. Log in with your credentials
4. Start an audit session
5. Open DevTools Console (F12)
6. Answer some questions with different statuses
7. Verify console logs show correct weights and contributions
8. Check that Risk Score badge updates in real-time

### To deploy:
```bash
git push origin main
# Deploy your frontend using your chosen platform
```

### Future Enhancements:
1. **Persistence**: Save final risk_score to `audit_sessions` table
2. **Reports**: Generate compliance report showing risk breakdown by section
3. **Trends**: Track risk scores across multiple audit sessions
4. **Recommendations**: Auto-suggest focus areas based on high-risk non-compliant items
5. **Thresholds**: Define acceptable risk score ranges by factory type

