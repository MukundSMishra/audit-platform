# Code on Wages Integration - Testing & Verification Guide

## ✅ Quick Verification Checklist

### 1. Portal Selection (Frontend)
- [ ] Start the React app: `npm run dev`
- [ ] Log in to the portal
- [ ] Go to "Audit Type Selection" → "Regulatory Risk Audit"
- [ ] Go to "Select Compliance Acts & Rules"
- [ ] **Verify:** "Code on Wages, 2019" appears in the list ✓
- [ ] Click the checkbox next to "Code on Wages, 2019"
- [ ] Verify the selection counter updates

### 2. Dynamic Loading (Frontend)
- [ ] Select "Code on Wages, 2019" and click "Start Audit"
- [ ] Enter factory details
- [ ] **Verify:** Questions load from `codeOnWages.json` appear
- [ ] Verify first question shows a CW-2019-SEC- prefixed item ID
- [ ] Navigate through questions (Next/Previous buttons work)
- [ ] **Check Console:** No errors about missing data

### 3. Multi-Act Selection (Frontend)
- [ ] Go back to act selector
- [ ] Select BOTH "Code on Wages, 2019" AND "OSH Code, 2020"
- [ ] Click "Start Audit"
- [ ] **Verify:** Progress screen shows both acts
- [ ] Click on "Code on Wages" tab
- [ ] **Verify:** Questions are CW-2019-SEC- prefixed
- [ ] Click on "OSH Code" tab
- [ ] **Verify:** Questions are OSHWC-SEC- prefixed

### 4. Answer Submission (Frontend)
- [ ] Fill in a few audit items for Code on Wages
- [ ] Save progress (Portal should auto-save)
- [ ] Navigate to OSH Code
- [ ] Fill in a few items there
- [ ] Click "Submit for Review" button
- [ ] **Verify:** Data is being sent to backend

---

## 🧪 Backend Testing (Master Audit Orchestrator)

### Setup
```bash
# 1. Copy MASTER_AUDIT_ORCHESTRATOR_EXAMPLE.py to your Universal_Subject_Expert_Agent project
cp MASTER_AUDIT_ORCHESTRATOR_EXAMPLE.py /path/to/universal-agent/src/api.py

# 2. Install dependencies (if needed)
pip install fastapi uvicorn pydantic python-dateutil

# 3. Start the backend
cd /path/to/universal-agent
python -m uvicorn src.api:app --host 127.0.0.1 --port 8000 --reload
```

### Test Case 1: Single-Act Audit (Code on Wages Only)

**Request Payload:**
```python
import requests
import json

batch_payload = {
    "batch_id": "test_cw_001",
    "session_id": "session_123",
    "company_name": "Test Factory",
    "location": "Mumbai, Maharashtra",
    "submitted_at": "2025-01-09T10:00:00Z",
    "audit_items": [
        {
            "audit_item_id": "CW-2019-SEC-03",
            "question_text": "Equal remuneration test",
            "legal_text": "Section 3(1)...",
            "risk_level": "High",
            "category": "Remuneration & Equality",
            "workflow_type": "ai_evidence",
            "intern_verdict": "Compliant",
            "intern_comment": "Equal wages verified",
            "evidence_url": "https://...",
            "is_applicable": True
        },
        {
            "audit_item_id": "CW-2019-SEC-05",
            "question_text": "Minimum wages test",
            "legal_text": "Section 5...",
            "risk_level": "Critical",
            "category": "Minimum Wages",
            "workflow_type": "ai_evidence",
            "intern_verdict": "Non-Compliant",
            "intern_comment": "Wages below minimum",
            "evidence_url": "https://...",
            "is_applicable": True
        }
    ]
}

# Send to backend
response = requests.post(
    'http://localhost:8000/run-master-audit',
    json=batch_payload
)

result = response.json()
print(json.dumps(result, indent=2))
```

**Expected Response:**
```json
{
  "batch_id": "test_cw_001",
  "session_id": "session_123",
  "company_name": "Test Factory",
  "location": "Mumbai, Maharashtra",
  "act_scores": {
    "Code on Wages, 2019": {
      "score": 70,
      "critical": 1,
      "high": 0,
      "items_analyzed": 2
    }
  },
  "overall_compliance_score": 70,
  "agents_invoked": ["Code on Wages, 2019"],
  "total_findings": 2,
  "critical_findings": 1,
  "high_risk_findings": 0,
  "findings": [
    {
      "item_id": "CW-2019-SEC-03",
      "status": "Compliant",
      "category": "Remuneration & Equality",
      "severity": "High"
    },
    {
      "item_id": "CW-2019-SEC-05",
      "status": "Non-Compliant",
      "category": "Minimum Wages",
      "severity": "Critical"
    }
  ],
  "recommendations": [
    "Address 1 non-compliance findings",
    "Focus on 1 critical items"
  ]
}
```

**Verification:**
- [x] `act_scores` has only "Code on Wages, 2019" (safety is null/absent)
- [x] `overall_compliance_score` = wages score (70)
- [x] `agents_invoked` = ["Code on Wages, 2019"]
- [x] Both CW- prefixed items were processed

### Test Case 2: Multi-Act Audit (Both Code on Wages + OSH Code)

**Request Payload:**
```python
batch_payload = {
    "batch_id": "test_multi_001",
    "session_id": "session_456",
    "company_name": "Test Factory",
    "location": "Mumbai, Maharashtra",
    "submitted_at": "2025-01-09T10:05:00Z",
    "audit_items": [
        # Wages items
        {
            "audit_item_id": "CW-2019-SEC-03",
            "question_text": "Equal remuneration",
            "legal_text": "Section 3(1)...",
            "risk_level": "High",
            "category": "Remuneration",
            "workflow_type": "ai_evidence",
            "intern_verdict": "Compliant",
            "is_applicable": True
        },
        # Safety items
        {
            "audit_item_id": "OSHWC-SEC-03-01",
            "question_text": "Workplace hazard control",
            "legal_text": "Section 3...",
            "risk_level": "Critical",
            "category": "Hazard Control",
            "workflow_type": "manual_observation",
            "intern_verdict": "Non-Compliant",
            "is_applicable": True
        }
    ]
}
```

**Expected Response:**
```json
{
  "act_scores": {
    "Code on Wages, 2019": {
      "score": 85,
      "critical": 0,
      "high": 0,
      "items_analyzed": 1
    },
    "OSH Code, 2020": {
      "score": 75,
      "critical": 1,
      "high": 0,
      "items_analyzed": 1
    }
  },
  "overall_compliance_score": 80,  // (85 + 75) / 2
  "agents_invoked": ["Code on Wages, 2019", "OSH Code, 2020"],
  "critical_findings": 1,
  "total_findings": 2
}
```

**Verification:**
- [x] `act_scores` has BOTH acts with their respective scores
- [x] `overall_compliance_score` = average of both (80)
- [x] `agents_invoked` lists both acts
- [x] CW- items routed to wages agent
- [x] OSHWC- items routed to safety agent

### Test Case 3: Single-Act Audit (OSH Code Only)

**Request Payload:**
```python
batch_payload = {
    "batch_id": "test_osh_001",
    "session_id": "session_789",
    "audit_items": [
        {
            "audit_item_id": "OSHWC-SEC-05-01",
            "risk_level": "Critical",
            ...
        }
    ]
}
```

**Expected Response:**
```json
{
  "act_scores": {
    "OSH Code, 2020": {
      "score": 65,
      ...
    }
  },
  "overall_compliance_score": 65,  // OSH score only
  "agents_invoked": ["OSH Code, 2020"]
}
```

**Verification:**
- [x] No Code on Wages in `act_scores`
- [x] `overall_compliance_score` = OSH score (no averaging)
- [x] Wages agent was NOT invoked

---

## 🔍 Console Logging Verification

When you run the master orchestrator, check for these log messages:

### Successful Multi-Act Run:
```
============================================================
🚀 MASTER AUDIT ORCHESTRATOR - Starting
   Batch ID: test_multi_001
   Company: Test Factory
   Items: 2
============================================================

📊 Partition Summary:
   💰 Wages items: 1
   🛡️  Safety items: 1
   ❓ Other items: 0

📄 Routed to Wages Agent: CW-2019-SEC-03
🛡️  Routed to Safety Agent: OSHWC-SEC-03-01

🚀 Invoking wages_expert...
   Items to analyze: 1
   ✅ Score: 85%
   📊 Findings: 1 items analyzed

🚀 Invoking safety_expert...
   Items to analyze: 1
   ✅ Score: 75%
   📊 Findings: 1 items analyzed

🔀 Synthesizing results...
💰 Wages Expert: 85%
🛡️  Safety Expert: 75%
📊 Overall Score: 80%
✨ Report Ready: 2 findings, X recommendations

============================================================
✅ MASTER AUDIT COMPLETE
============================================================
```

### Single-Act Run (Wages Only):
```
📊 Partition Summary:
   💰 Wages items: 2
   🛡️  Safety items: 0
   ❓ Other items: 0

🚀 Invoking wages_expert...
   (safety_expert is NOT invoked)

🔀 Synthesizing results...
💰 Wages Expert: 70%
📊 Overall Score: 70%  ← Note: Not averaged
```

---

## 🐛 Troubleshooting

### Issue: "Unknown prefix in audit items"

**Check:**
```python
# In the console logs, you should see:
📄 Routed to Wages Agent: CW-2019-SEC-XX
🛡️  Routed to Safety Agent: OSHWC-SEC-XX

# If you see:
❓ Unknown prefix: WG-2019-SEC-XX  ← Wrong prefix!
```

**Fix:** Verify the portal is sending items with correct prefixes:
- Code on Wages items: **CW-2019-SEC-** 
- OSH Code items: **OSHWC-SEC-**

### Issue: "Overall score not averaged correctly"

**Check:** The synthesis logic should average when BOTH agents are present:
```python
# Should be: (wages_score + safety_score) / 2
# Not: just wages_score
```

**Verify in logs:**
- If both agents invoked → should see averaging
- If only one agent invoked → should use that score only

### Issue: "Synthesis produces incorrect final_report structure"

**Check:** Verify response matches `MasterAuditResponse` model:
```python
# Must have these top-level fields:
- batch_id
- session_id
- company_name
- location
- act_scores          # Dict of {act_name: score_obj}
- overall_compliance_score
- agents_invoked      # List of act names
- findings
- recommendations
```

---

## 📊 Data Flow Verification

### Full End-to-End Test

1. **Portal (Frontend)**
   ```
   User selects Code on Wages → Portal loads codeOnWages.json
   ```

2. **Submit (Frontend)**
   ```
   User clicks "Submit for Review" 
   → SubmitForReview.jsx sends to http://localhost:8000/invoke-agent
   ```

3. **Backend Receives**
   ```
   invoke-agent endpoint receives work_order
   → Routes to run_master_audit()
   ```

4. **Partition (Backend)**
   ```
   run_master_audit() partitions items
   → CW-2019-SEC-* items → wages_expert
   ```

5. **Agent Processing (Backend)**
   ```
   wages_expert processes items
   → Returns compliance_score, findings, recommendations
   ```

6. **Synthesis (Backend)**
   ```
   synthesize_results() merges all results
   → Creates unified report
   ```

7. **Response (Backend)**
   ```
   Returns MasterAuditResponse to frontend
   ```

8. **Save (Frontend)**
   ```
   SubmitForReview.jsx saves to Supabase ai_review_reports table
   ```

**Verification:** All steps complete without errors

---

## ✨ Summary

Run these checks to verify integration:
1. ✅ Code on Wages selectable in portal
2. ✅ Questions load dynamically from JSON
3. ✅ Backend partitions items by prefix (CW- vs OSHWC-)
4. ✅ Single-act audits produce single score
5. ✅ Multi-act audits produce averaged score
6. ✅ Synthesis creates correct report structure
7. ✅ Report saves to Supabase

All tests passing = **Integration Complete!** 🎉
