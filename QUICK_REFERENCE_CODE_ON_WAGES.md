# Code on Wages Integration - Quick Reference Card

## 📋 Portal Status: ✅ LIVE

**The Code on Wages, 2019 is now selectable in your Audit Portal!**

---

## 🎯 What Users See

1. Start Audit → Select Audit Type
2. Choose "Regulatory Risk Audit"
3. Select Acts & Rules → **"Code on Wages, 2019" is now available** ✓
4. Fill out 40+ wage compliance questions
5. Submit for Review → Report generated

---

## 🔧 Technical Integration (Backend)

### Item ID Prefixes

| Act | Prefix | Example | Agent |
|-----|--------|---------|-------|
| Code on Wages, 2019 | `CW-2019-SEC-` | CW-2019-SEC-03 | wages_expert |
| OSH Code, 2020 | `OSHWC-SEC-` | OSHWC-SEC-03-01 | safety_expert |

### Routing Logic

```python
# In your run_master_audit() function:
if item_id.startswith('CW-2019-SEC-'):
    wages_items.append(item)
elif item_id.startswith('OSHWC-SEC-'):
    safety_items.append(item)
```

### Synthesis Logic

```
Single-Act (Wages Only):
  overall_score = wages_score

Single-Act (Safety Only):
  overall_score = safety_score

Multi-Act (Both):
  overall_score = (wages_score + safety_score) / 2
```

---

## 📁 Documentation Files

| File | Use | Time |
|------|-----|------|
| **CODE_ON_WAGES_INTEGRATION.md** | Reference guide | 10 min read |
| **MASTER_AUDIT_ORCHESTRATOR_EXAMPLE.py** | Copy & implement | 20 min adapt |
| **TESTING_GUIDE_CODE_ON_WAGES.md** | Verify setup | 15 min test |
| **This Card** | Quick lookup | 2 min skim |

---

## ⚡ 5-Minute Backend Setup

```bash
# 1. Copy implementation
cp MASTER_AUDIT_ORCHESTRATOR_EXAMPLE.py src/api.py

# 2. Update agent invocation
# In invoke_specialist_agent():
#   - Replace mock with your wages_expert.run()
#   - Replace mock with your safety_expert.run()

# 3. Start server
python -m uvicorn src.api:app --host 127.0.0.1 --port 8000

# 4. Test single-act
# Use test case from TESTING_GUIDE_CODE_ON_WAGES.md

# 5. Test multi-act
# Verify averaging works: (score1 + score2) / 2
```

---

## ✅ Pre-Launch Checklist

- [x] Code on Wages enabled in portal (`actRegistry.js`)
- [x] JSON schema verified (40+ CW-2019-SEC- items)
- [x] Multi-act selection working
- [ ] Backend orchestrator implemented
- [ ] Specialist agents integrated
- [ ] Single-act audit tested
- [ ] Multi-act audit tested
- [ ] Report saves to Supabase

---

## 🚀 Launch Commands

### Start Portal
```bash
npm run dev
# Opens at http://localhost:5173
```

### Start Backend
```bash
cd /path/to/universal-agent
python -m uvicorn src.api:app --host 127.0.0.1 --port 8000
```

### Verify Backend Ready
```bash
curl http://localhost:8000/
# Should return: {"status": "online", ...}
```

---

## 📊 Example Request/Response

### Request (Frontend sends)
```json
{
  "batch_id": "batch_123",
  "audit_items": [
    {"audit_item_id": "CW-2019-SEC-03", ...},
    {"audit_item_id": "CW-2019-SEC-05", ...},
    {"audit_item_id": "OSHWC-SEC-03-01", ...}
  ]
}
```

### Response (Backend returns)
```json
{
  "overall_compliance_score": 80,
  "act_scores": {
    "Code on Wages, 2019": {"score": 75},
    "OSH Code, 2020": {"score": 85}
  },
  "agents_invoked": ["wages_expert", "safety_expert"],
  "findings": [...],
  "recommendations": [...]
}
```

---

## 🔍 Debugging

### No Code on Wages in Portal?
- Check: `src/data/actRegistry.js` line 51
- Should be: `id: 'code_on_wages_2019'`
- Not commented out!

### Items not routing to wages_expert?
- Check: Item ID prefix is `CW-2019-SEC-`
- Check: run_master_audit() includes CW check
- Debug: Look for "📄 Routed to Wages Agent:" in logs

### Overall score not averaged?
- Check: Both wages_results and safety_results exist
- Check: synthesis_results() averages correctly
- Debug: Look for "💰 Wages Expert:" and "🛡️ Safety Expert:" in logs

---

## 📞 Key Functions

### Portal (React)
- `getActData()` - Loads questions from JSON
- `ActSelector` - Multi-act selection UI
- `SubmitForReview` - Sends to backend

### Backend (Python)
- `run_master_audit()` - Main orchestrator
- `partition_audit_items()` - Split by prefix
- `invoke_specialist_agent()` - Call agents
- `synthesize_results()` - Merge results

---

## 💾 Database

Reports saved to: `ai_review_reports` table

Columns:
- `batch_id` - Unique batch identifier
- `act_scores` - Per-act compliance scores
- `overall_compliance_score` - Averaged score
- `agents_invoked` - Which agents ran
- `findings` - All findings
- `recommendations` - Merged recommendations

---

## 🎯 Success Criteria

✅ Portal shows Code on Wages in act selector  
✅ User can select and audit Code on Wages  
✅ Questions load from codeOnWages.json  
✅ User can submit for review  
✅ Backend receives CW-2019-SEC- items  
✅ wages_expert agent processes items  
✅ Report synthesized with act_scores  
✅ Report saved to Supabase  

**All checkmarks = Ready for Production** 🚀

---

## 📚 Full Documentation

For complete details, see:
- **CODE_ON_WAGES_FINAL_SUMMARY.md** - Overview
- **CODE_ON_WAGES_INTEGRATION.md** - Deep dive
- **MASTER_AUDIT_ORCHESTRATOR_EXAMPLE.py** - Implementation
- **TESTING_GUIDE_CODE_ON_WAGES.md** - Testing

---

**Status: ✅ Integration Complete - Ready for Backend Configuration**

*Last Updated: January 9, 2026*
