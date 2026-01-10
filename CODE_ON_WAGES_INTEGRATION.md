# Code on Wages, 2019 Integration Guide

## 🎯 Status: COMPLETE

The Code on Wages has been successfully integrated into your Audit Portal. This document details what was done and the required API configuration.

---

## ✅ Part 1: Portal Selection & Dynamic Loading

### What Was Done

#### 1. **Registry Update** - `src/data/actRegistry.js`
The Code on Wages, 2019 has been **uncommented and activated**:

```javascript
{
  id: 'code_on_wages_2019',
  name: 'The Code on Wages, 2019',
  description: 'Comprehensive law for wage standards, equal remuneration, payment regulations, and minimum wages',
  table: 'code_on_wages_checklist',
  data: codeOnWagesData,
  shortName: 'Code on Wages',
  year: 2019,
  type: 'act'
}
```

#### 2. **Dynamic Loading** - `src/App.jsx` (Already Configured)
The system automatically:
- Loads questions from `codeOnWages.json` when Code on Wages is selected
- Uses the `getActData()` function which maps `audit_item_id` to `id`
- Normalizes data for consistent UI rendering
- Saves/restores progress per act using `act_question_indices`

**How it works:**
```jsx
// In App.jsx, the flow is:
const currentActId = selectedActIds[currentActIndex]; // 'code_on_wages_2019'
const questions = getActData(currentActId); // Loads from codeOnWages.json
// Questions are then rendered by AuditCard component
```

#### 3. **Audit Selector** - `src/components/ActSelector.jsx` (Already Configured)
The Act Selector component already:
- Displays all available acts from `AVAILABLE_ACTS`
- Allows multi-act selection (user can pick both Code on Wages AND OSH Code)
- Properly filters acts vs. rules
- Handles "Select All" / "Deselect All" operations

**Result:** Users can now select "Code on Wages, 2019" from the act selection screen.

---

## 📋 Part 2: API Routing Configuration (Universal_Subject_Expert_Agent)

### Item ID Prefixes

Your schema uses prefixed item IDs to route to different specialist agents:

| Prefix | Act | Target Agent | Example |
|--------|-----|--------------|---------|
| **CW-2019-SEC-** | Code on Wages, 2019 | `wages_expert` | CW-2019-SEC-03, CW-2019-SEC-05 |
| **OSHWC-SEC-** | OSH Code, 2020 | `safety_expert` | OSHWC-SEC-03-01, OSHWC-SEC-05-01 |

### API Configuration - `src/api.py` (Universal_Subject_Expert_Agent)

#### **Required Function: `run_master_audit()`**

```python
"""
Universal Master Audit Orchestrator
Routes items to appropriate subject-matter expert agents
"""

def run_master_audit(batch_data):
    """
    Main orchestrator function for audit processing
    
    Args:
        batch_data: {
            'batch_id': str,
            'session_id': str,
            'company_name': str,
            'location': str,
            'audit_items': [
                {
                    'audit_item_id': 'CW-2019-SEC-03',  # Prefix determines routing
                    'question_text': str,
                    'legal_text': str,
                    'risk_level': str,
                    'category': str,
                    'workflow_type': 'manual_observation' | 'ai_evidence',
                    'intern_verdict': str,
                    'intern_comment': str,
                    'evidence_url': str,
                    ...
                }
            ]
        }
    """
    
    # Step 1: Partition items by agent
    wages_items = []
    safety_items = []
    other_items = []
    
    for item in batch_data['audit_items']:
        item_id = item['audit_item_id']
        
        if item_id.startswith('CW-2019-SEC-'):
            wages_items.append(item)
        elif item_id.startswith('OSHWC-SEC-'):
            safety_items.append(item)
        else:
            other_items.append(item)
    
    # Step 2: Route to specialist agents (if non-empty)
    wages_results = None
    safety_results = None
    
    if wages_items:
        wages_results = invoke_agent(
            agent_name='wages_expert',
            task_type='audit_analysis',
            items=wages_items,
            context={
                'batch_id': batch_data['batch_id'],
                'company_name': batch_data['company_name'],
                'location': batch_data['location']
            }
        )
        print(f"✅ Wages Expert processed {len(wages_items)} items")
    
    if safety_items:
        safety_results = invoke_agent(
            agent_name='safety_expert',
            task_type='audit_analysis',
            items=safety_items,
            context={
                'batch_id': batch_data['batch_id'],
                'company_name': batch_data['company_name'],
                'location': batch_data['location']
            }
        )
        print(f"✅ Safety Expert processed {len(safety_items)} items")
    
    # Step 3: SYNTHESIS - Merge results
    final_report = synthesize_results(
        wages_results=wages_results,
        safety_results=safety_results,
        other_items=other_items,
        batch_data=batch_data
    )
    
    return final_report
```

#### **Synthesis Function: `synthesize_results()`**

```python
def synthesize_results(wages_results, safety_results, other_items, batch_data):
    """
    Merge results from both agents into unified report
    Handles cases where only one act was audited
    """
    
    # Initialize merged findings
    all_findings = []
    compliance_scores = {}
    recommendations = []
    
    # === Extract Wages Results (if available) ===
    if wages_results:
        all_findings.extend(wages_results.get('findings', []))
        
        wages_score = wages_results.get('overall_compliance_score', 0)
        compliance_scores['Code on Wages, 2019'] = {
            'score': wages_score,
            'critical': wages_results.get('critical_findings', 0),
            'high': wages_results.get('high_risk_findings', 0),
            'items_analyzed': len(wages_results.get('analyzed_items', []))
        }
        recommendations.extend(wages_results.get('recommendations', []))
        
        print(f"📊 Wages Score: {wages_score}%")
    
    # === Extract Safety Results (if available) ===
    if safety_results:
        all_findings.extend(safety_results.get('findings', []))
        
        safety_score = safety_results.get('overall_compliance_score', 0)
        compliance_scores['OSH Code, 2020'] = {
            'score': safety_score,
            'critical': safety_results.get('critical_findings', 0),
            'high': safety_results.get('high_risk_findings', 0),
            'items_analyzed': len(safety_results.get('analyzed_items', []))
        }
        recommendations.extend(safety_results.get('recommendations', []))
        
        print(f"📊 Safety Score: {safety_score}%")
    
    # === Compute Overall Score ===
    # Average of scores if both agents ran, use single score if only one
    if wages_results and safety_results:
        overall_score = (
            compliance_scores['Code on Wages, 2019']['score'] + 
            compliance_scores['OSH Code, 2020']['score']
        ) / 2
    elif wages_results:
        overall_score = compliance_scores['Code on Wages, 2019']['score']
    elif safety_results:
        overall_score = compliance_scores['OSH Code, 2020']['score']
    else:
        overall_score = 0
    
    # === Build Unified Report ===
    final_report = {
        'batch_id': batch_data['batch_id'],
        'session_id': batch_data['session_id'],
        'company_name': batch_data['company_name'],
        'location': batch_data['location'],
        'submitted_at': batch_data['submitted_at'],
        
        # Compliance Breakdown
        'act_scores': compliance_scores,  # Per-act scores
        'overall_compliance_score': overall_score,
        
        # Findings Summary
        'total_findings': len(all_findings),
        'critical_findings': sum(1 for f in all_findings if f.get('severity') == 'Critical'),
        'high_risk_findings': sum(1 for f in all_findings if f.get('severity') == 'High'),
        'medium_risk_findings': sum(1 for f in all_findings if f.get('severity') == 'Medium'),
        'low_risk_findings': sum(1 for f in all_findings if f.get('severity') == 'Low'),
        
        # Detailed Results
        'findings': all_findings,
        'recommendations': list(set(recommendations)),  # Deduplicate
        
        # Agent Details
        'agents_invoked': [
            act for act in ['Code on Wages, 2019', 'OSH Code, 2020'] 
            if compliance_scores.get(act) is not None
        ],
        
        'processing_timestamp': datetime.now().isoformat()
    }
    
    print(f"\n🎯 Final Report Generated:")
    print(f"   Overall Score: {overall_score}%")
    print(f"   Acts Analyzed: {', '.join(final_report['agents_invoked'])}")
    print(f"   Total Findings: {final_report['total_findings']}")
    
    return final_report
```

---

## 🔄 Part 3: Frontend Data Flow (Already Configured)

### How SubmitForReview Works

When user clicks "Submit for Review" in the portal:

1. **Data Collection** (`src/components/SubmitForReview.jsx`):
   ```javascript
   // Collects ALL answers for selected acts
   const workOrder = {
     agent_id: "universal_master_audit",  // or route to your master orchestrator
     task_type: "audit_report",
     payload: {
       batch_id: sessionId,
       audit_items: allAnswers  // Contains items with CW- and OSHWC- prefixes
     }
   };
   ```

2. **API Route**:
   ```
   POST http://localhost:8000/invoke-agent
   or
   POST http://127.0.0.1:8000/run-master-audit
   ```

3. **Backend Processing**:
   - Master audit function receives payload
   - Partitions items by prefix (CW-2019-SEC- vs OSHWC-SEC-)
   - Routes to appropriate agents
   - Synthesizes results
   - Returns unified report

4. **Report Storage** (`src/components/SubmitForReview.jsx`):
   ```javascript
   // Saves to Supabase ai_review_reports table
   await supabase
     .from('ai_review_reports')
     .insert([report]);
   ```

---

## 📊 Synthesis Logic - Detailed Example

### Scenario: User selects BOTH Code on Wages AND OSH Code

**Input Batch:**
```json
{
  "batch_id": "batch_2025_001",
  "audit_items": [
    { "audit_item_id": "CW-2019-SEC-03", "status": "Compliant", ... },
    { "audit_item_id": "CW-2019-SEC-05", "status": "Non-Compliant", ... },
    { "audit_item_id": "OSHWC-SEC-03-01", "status": "Compliant", ... },
    { "audit_item_id": "OSHWC-SEC-05-01", "status": "Delayed", ... }
  ]
}
```

**Partitioning:**
```
Wages Items (2):
  - CW-2019-SEC-03 ✓
  - CW-2019-SEC-05

Safety Items (2):
  - OSHWC-SEC-03-01 ✓
  - OSHWC-SEC-05-01 ⏱️
```

**Agent Results:**
```
Wages Expert Result:
  - overall_compliance_score: 75%
  - critical_findings: 1
  - recommendations: ["Address wage equity..."]

Safety Expert Result:
  - overall_compliance_score: 85%
  - high_risk_findings: 1
  - recommendations: ["Improve PPE compliance..."]
```

**Final Merged Report:**
```json
{
  "act_scores": {
    "Code on Wages, 2019": {
      "score": 75,
      "critical": 1,
      "high": 0,
      "items_analyzed": 2
    },
    "OSH Code, 2020": {
      "score": 85,
      "critical": 0,
      "high": 1,
      "items_analyzed": 2
    }
  },
  "overall_compliance_score": 80,  // (75 + 85) / 2
  "agents_invoked": [
    "Code on Wages, 2019",
    "OSH Code, 2020"
  ],
  "recommendations": [
    "Address wage equity...",
    "Improve PPE compliance..."
  ]
}
```

### Scenario: User selects ONLY Code on Wages

If only Wages items are present:
- `run_master_audit()` skips the safety expert invocation
- `synthesize_results()` detects single-act mode
- Returns report with only `Code on Wages, 2019` act_score
- `overall_compliance_score` = wages score (no averaging)

---

## 🔧 Implementation Checklist

### Phase 1: Portal (✅ COMPLETE)
- [x] Uncomment Code on Wages in actRegistry.js
- [x] Verify codeOnWages.json is properly formatted
- [x] Confirm all items have CW-2019-SEC- prefix
- [x] Test act selection in UI

### Phase 2: API Configuration (⏳ TO DO - In Your Universal_Subject_Expert_Agent Project)
- [ ] Implement `run_master_audit()` function in `src/api.py`
- [ ] Implement `synthesize_results()` function in `src/api.py`
- [ ] Create `wages_expert` agent if not exists
- [ ] Create `safety_expert` agent if not exists
- [ ] Update `/invoke-agent` endpoint routing logic
- [ ] Add route handler for multi-act batch processing

### Phase 3: Testing
- [ ] Test single-act audit (Code on Wages only)
- [ ] Test single-act audit (OSH Code only)
- [ ] Test multi-act audit (both selected)
- [ ] Verify synthesis produces correct overall_score
- [ ] Verify report saves to Supabase ai_review_reports

---

## 📝 Required Code Changes (Your Backend)

### In `src/api.py` (Universal_Subject_Expert_Agent):

```python
# Add these imports
from typing import Dict, List, Optional

# Add route handler
@app.post("/run-master-audit")
async def run_master_audit_handler(batch_data: dict):
    """
    Main orchestrator for multi-act audits
    Routes to specialist agents based on item prefix
    """
    try:
        result = run_master_audit(batch_data)
        return {
            "status": "success",
            "batch_id": batch_data.get('batch_id'),
            "report": result
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

# Implement the functions from Part 2 section above
```

---

## 🚀 Deployment Steps

1. **Portal Ready** ✅ (Code on Wages now selectable)
2. **Configure Backend** (Add `run_master_audit()` to Universal_Subject_Expert_Agent)
3. **Start Backend Server**:
   ```bash
   cd your-universal-agent-directory
   python -m uvicorn src.api:app --host 127.0.0.1 --port 8000
   ```
4. **Test End-to-End**:
   - Select Code on Wages in portal
   - Complete audit
   - Click "Submit for Review"
   - Verify agent receives partition correctly
   - Check Supabase for saved report

---

## 📞 Troubleshooting

### Issue: "CW-2019-SEC- items not recognized by agent"
**Solution:** Verify `run_master_audit()` function includes:
```python
if item_id.startswith('CW-2019-SEC-'):
    wages_items.append(item)
```

### Issue: "Agent returns only one act's score"
**Solution:** Ensure `synthesize_results()` handles both `wages_results` and `safety_results` being non-None

### Issue: "Score not merged correctly"
**Solution:** Check the averaging logic in synthesis:
```python
overall_score = (wages_score + safety_score) / 2  # Both must be valid numbers
```

---

## ✨ Summary

**What's Done:**
- ✅ Code on Wages integrated into portal selection
- ✅ codeOnWages.json loaded dynamically
- ✅ Item ID prefix scheme: CW-2019-SEC- ready for routing
- ✅ Synthesis logic pattern documented

**What You Need to Do:**
- Add `run_master_audit()` and `synthesize_results()` to your Universal_Subject_Expert_Agent
- Update your backend routing to handle multi-act batches
- Test the end-to-end flow

The portal is ready. Your backend just needs the orchestration logic! 🎯
