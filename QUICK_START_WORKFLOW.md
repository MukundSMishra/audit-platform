# Quick Start: Company-First Audit Workflow

## 🎯 What Changed?

### OLD WORKFLOW ❌
```
Dashboard
  ↓
  • Select Act First
  • Enter Company Details
  • One company = One act only
  • No multi-act audits
```

### NEW WORKFLOW ✅
```
Dashboard (Choose Company)
  ↓ 
Act Selector (Choose Acts - One or Multiple!)
  ↓
Audit View (Audit Acts Sequentially)
  ↓
  Act 1: Answer all questions
    → Next Act button appears at end
  ↓
  Act 2: Answer all questions
    → Complete All button appears
  ↓
Back to Dashboard
```

---

## 🚀 How to Use (Step-by-Step)

### Step 1: Create/Choose Company
**Screen: Dashboard**

```
┌─────────────────────────────────────┐
│  Auditor Dashboard                  │
├─────────────────────────────────────┤
│ [Start New Factory Audit] button    │
│                                     │
│ Previous factories listed below:    │
│ • Factory A, Location X             │
│ • Factory B, Location Y             │
└─────────────────────────────────────┘
```

Click "Start New Factory Audit" or select existing factory:

**Form:**
- Factory Name: "Tata Steel Unit 4" ✓ Required
- Location: "Jamshedpur, Jharkhand" ✓ Required  
- License Number: "LIC-2024-9988" (Optional)

Click **"Next: Choose Acts"** → Go to Step 2

---

### Step 2: Select Compliance Acts
**Screen: Act Selector**

```
┌────────────────────────────────────────────────┐
│ Select Compliance Acts                         │
│ 📍 Tata Steel Unit 4, Jamshedpur, Jharkhand   │
├────────────────────────────────────────────────┤
│                                                │
│ ☐ The Factories Act, 1948                      │
│   Factories Act                                │
│   Central Act for factory safety...            │
│   📌 95 audit items                            │
│                                                │
│ ☐ Maharashtra Factories Rules, 1963            │
│   MH Factory Rules                             │
│   State-specific rules for Maharashtra...      │
│   📌 102 audit items                           │
│                                                │
├────────────────────────────────────────────────┤
│ Total: 197 items across 0 selected acts       │
│                                                │
│ [Cancel]    [Start Audit for 0 Acts]         │
└────────────────────────────────────────────────┘
```

**Actions:**
1. Click cards to select/deselect acts (checkmarks appear)
2. See live summary update: "Total: 197 items across 2 selected acts"
3. Click **"Start Audit for 2 Acts"** → Go to Step 3

---

### Step 3: Conduct Audits
**Screen: Audit View**

```
┌─────────────────────────────────────────────────────────────────┐
│ [☰ Menu] Tata Steel Unit 4                                      │
│ ⊙ Live Session | Factories Act (1/2) | Risk Score: 45 / 100    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ SIDEBAR (left)           │  MAIN AREA (center)                 │
│ ─────────────────────    │  ─────────────────────              │
│ Current Act              │  Q1: Is the factory                 │
│ Factories Act            │  registered with...                 │
│ (1 of 2 acts)            │                                     │
│                          │  Risk Level: Critical               │
│ 15 / 95 answered         │  Weight: 5/5 ⭐⭐⭐⭐⭐             │
│                          │                                     │
│ Question Grid:           │  [Options for answer]               │
│ ┌──┬──┬──┬──┬──┐         │  • Compliant                        │
│ │1✓│2✓│3✓│4 │5 │         │  • Non-Compliant                    │
│ ├──┼──┼──┼──┼──┤         │  • Delayed                          │
│ │6 │7 │8 │9 │10│         │  [Evidence] [Comments]              │
│ └──┴──┴──┴──┴──┘         │                                     │
│ ... (grid continues)     │  [Save]                             │
│                          │                                     │
│ [Back to Acts]           │                                     │
└─────────────────────────────────────────────────────────────────┤
│ [< Previous] Question 3 of 95 [Next >]                         │
└─────────────────────────────────────────────────────────────────┘
```

**While Auditing Act 1:**
- Answer each question (click status, add evidence/comments)
- Question grid shows progress (green = answered)
- Navigate with Previous/Next buttons OR click questions in grid
- Risk score updates in real-time

**When You Reach Last Question of Act 1:**
```
Bottom button changes from:
[Next >]  →  [Next Act ▶]  (GREEN)

Popup asks:
"Factories Act audit complete. 
Ready to audit the next act?"
```

Click **[Next Act]** → Load Act 2 questions

---

### Act 2: Same Process
```
Audit View switches to Act 2:
- Sidebar shows: "MH Factory Rules (2 of 2 acts)"
- New set of 102 questions loads
- All Act 1 answers are saved ✓
- Answer Act 2 questions...
```

**When You Reach Last Question of Act 2:**
```
Bottom button changes from:
[Next >]  →  [Complete All ✓]  (GREEN)

Popup asks:
"You have completed all audit questions. 
Review your answers?"
```

Click **[Complete All]** → Session saved, back to Dashboard

---

## 📊 Data Organization

### Session Level
```
Company:        "Tata Steel Unit 4"
Location:       "Jamshedpur, Jharkhand"
Auditor:        user@company.com
Status:         "In Progress"
Acts Selected:  ["factories_act_1948", "maharashtra_factories_rules_1963"]
```

### Per-Act Tracking
```
Act 1: Factories Act (95 items)
├── Q1: Status = "Compliant", Risk = 5, Contribution = 0
├── Q2: Status = null (unanswered), Risk = 3, Contribution = 0
├── Q3: Status = "Non-Compliant", Risk = 4, Contribution = 4
└── ...

Act 2: MH Factory Rules (102 items)
├── Q1: Status = "Non-Compliant", Risk = 5, Contribution = 5
├── Q2: Status = "Delayed", Risk = 4, Contribution = 2
├── Q3: Status = null, Risk = 2, Contribution = 0
└── ...
```

Each answer tagged with:
- `act_id`: Which act it belongs to
- `question_id`: The specific question
- `status`: The auditor's finding
- `evidence_url`: Supporting document
- `remarks`: Auditor notes

---

## 🔄 Workflow Transitions

```
Screen 1: DASHBOARD
│
├─ Action: "Start New Factory Audit"
├─ Data: Factory Name, Location, License
│
↓
Screen 2: ACT SELECTOR
│
├─ Action: Select 1+ acts
├─ Data: selectedActIds = [act1, act2, ...]
│
↓
Screen 3: AUDIT (Act 1)
│
├─ Action: Answer questions
├─ Data: answers[q_id] = {status, evidence, remarks}
├─ With: act_id = 'factories_act_1948'
│
├─ At Last Q: Click "Next Act"
│
↓
Screen 3: AUDIT (Act 2)
│
├─ Action: Answer questions
├─ Data: answers[q_id] = {status, evidence, remarks}
├─ With: act_id = 'maharashtra_factories_rules_1963'
│
├─ At Last Q: Click "Complete All"
│
↓
Screen 1: DASHBOARD
│
└─ Session saved, back to company selection
```

---

## 🛠️ Technical Details for Developers

### Key Files Modified
```
src/
├── App.jsx                  ← 3-screen orchestration
│   • currentScreen state: 'dashboard' | 'act-selector' | 'audit'
│   • selectedActIds array: Multiple acts!
│   • currentActIndex: Position in array
│
├── components/
│   ├── Dashboard.jsx        ← Company only (no act selector)
│   ├── ActSelector.jsx      ← Multi-act picker (NEW)
│   └── AuditCard.jsx        ← Question display (unchanged)
│
└── data/
    └── actRegistry.js       ← Act definitions (existing)
```

### Database Changes
```sql
ALTER TABLE session_answers 
ADD COLUMN act_id TEXT;  ← NEW! Tracks which act

-- Unique constraint ensures no duplicate answers per act
ALTER TABLE session_answers
ADD CONSTRAINT unique_session_question_act 
UNIQUE(session_id, question_id, act_id);
```

### State Flow
```javascript
// App.jsx states
const [currentScreen, setCurrentScreen] = useState('dashboard');
const [selectedActIds, setSelectedActIds] = useState([]);
const [currentActIndex, setCurrentActIndex] = useState(0);

// Current act is always:
const currentActId = selectedActIds[currentActIndex];

// When navigating to next act:
const nextAct = () => {
  if (currentActIndex < selectedActIds.length - 1) {
    setCurrentActIndex(prev => prev + 1);
  } else {
    // All acts done - return to dashboard
  }
};
```

---

## ✅ Testing Checklist

Run through this to verify everything works:

- [ ] **Dashboard**: Create new company "Test Factory" in "Test City"
- [ ] **ActSelector**: See both acts listed with correct descriptions
- [ ] **ActSelector**: Select only "Factories Act" 
- [ ] **ActSelector**: Change mind, select "MH Factory Rules" instead
- [ ] **ActSelector**: Select BOTH acts
- [ ] **Audit**: See "Factories Act (1/2)" in top bar
- [ ] **Audit**: Answer Q1 with "Compliant"
- [ ] **Audit**: Scroll to last question (Q95)
- [ ] **Audit**: See "Next Act" button (green)
- [ ] **Audit**: Click "Next Act"
- [ ] **Audit**: See "MH Factory Rules (2/2)" in top bar
- [ ] **Audit**: See Q1 (but from MH Rules, different)
- [ ] **Audit**: Scroll to Q102 (last of MH Rules)
- [ ] **Audit**: See "Complete All" button (green)
- [ ] **Audit**: Click "Complete All"
- [ ] **Dashboard**: Back to company list
- [ ] **Supabase**: Query session_answers - see answers for both act_ids

---

## 🎓 Example Audit Session

**Scenario:** Auditing a steel factory against both Factories Act and Maharashtra Rules

```
Time 1: 10:00 AM
• Intern logs in
• Selects "JSW Steel Plant A"
• Chooses both acts (2 acts, 197 total items)
• Starts with Factories Act (95 items)
• Completes 20 questions: 15 Compliant, 5 Non-Compliant
• Clicks "Next Act"

Time 2: 11:30 AM (continues with next act)
• Now on Maharashtra Factories Rules (102 items)
• Completes 30 questions: 25 Compliant, 2 Non-Compliant, 3 Delayed
• Clicks "Complete All"

Result:
✅ Both acts audited
✅ All 52 questions answered
✅ 197 total items covered
✅ Risk score calculated: 42/100
✅ Report ready for review
```

---

## ⚠️ Important Notes

1. **Act Selection is Flexible**
   - You can select 1 act or multiple
   - Acts audit sequentially (one at a time)
   - You see progress: "Act 1 of 3"

2. **Answers are Act-Specific**
   - Same question in different acts tracked separately
   - "Is factory registered?" → Different answer in Act 1 vs Act 2
   - Each answer tagged with `act_id` in database

3. **Progress is Preserved**
   - When switching acts, previous answers saved
   - Can return to Acts to switch order (future feature)

4. **Database Migration Required**
   - Must run SQL: `ALTER TABLE session_answers ADD COLUMN act_id TEXT;`
   - See `MIGRATION_ACT_ID.md` for details

---

## 📞 Support

For questions about the workflow:
- See `WORKFLOW_UPDATE.md` for detailed technical docs
- See `MIGRATION_ACT_ID.md` for database setup
- Check code comments in `App.jsx` for state logic
- Review `ActSelector.jsx` for multi-act selection UI

---

**Commit Hash:** bba6e35
**Status:** ✅ Ready for Testing
