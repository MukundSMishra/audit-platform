# Audit Platform - Company-First Workflow

## Overview
The audit platform has been redesigned to follow a company-centric workflow where auditors select a company first, then choose which compliance acts to audit for that company, and finally conduct the audits sequentially.

## New Workflow

### Screen 1: Dashboard (Company Selection)
**Purpose:** Create or select a factory/company to audit

**User Steps:**
1. Click "Start New Factory Audit"
2. Enter:
   - Factory Name (required)
   - Location (required)
   - License Number (optional)
3. Click "Next: Choose Acts"

**Output:** Company record created with status "Planning"

---

### Screen 2: Act Selector (Multi-Act Selection)
**Purpose:** Choose which compliance acts to audit for the selected company

**Component:** `src/components/ActSelector.jsx`

**Features:**
- Shows all available acts with:
  - Act name and short name (e.g., "Factories Act")
  - Description
  - Number of audit items
- Checkboxes for multi-selection
- Summary showing total audit items across selected acts
- Visual breakdown by act

**User Steps:**
1. Review factory details at top: "📍 Factory Name" and location
2. Select one or more acts by clicking the card or checkbox
3. View summary of audit items (e.g., "202 audit items across 2 selected acts")
4. Click "Start Audit for X Acts" button

**Output:** Selected act IDs stored; audit flow begins

---

### Screen 3: Audit View (Question by Question)
**Purpose:** Conduct the actual compliance audit

**Key Components:**
- **Left Sidebar:** Question navigation grid with progress indicators
- **Top Bar:** Factory name, current act info with progress (e.g., "Factories Act (1/2)")
- **Main Area:** Full audit question card with details
- **Bottom Bar:** Navigation between questions and acts

**Features:**
1. **Question-by-Question Navigation**
   - Grid showing all questions with color coding:
     - Gray: Unanswered
     - Red: Non-Compliant
     - Orange: Delayed
     - Green: Compliant
   - Click any question to jump to it
   - Progress counter: "15 / 95" (answered/total)

2. **Act-Aware Progress Tracking**
   - Sidebar shows: "Current Act" with short name and progress (e.g., "1 of 2 acts")
   - Top bar displays: "Factories Act (1/2)" showing which act and position
   - Each question answered for current act is tracked separately

3. **Act Transitions**
   - When reaching the last question of an act:
     - Bottom "Next" button changes to "Next Act" (green) if more acts remain
     - Shows confirmation: "Factories Act audit complete. Ready to audit the next act?"
   - On confirmation: Questions reset, next act loads
   - Answers for previous acts are preserved in database

4. **Completion Flow**
   - After final question of final act:
     - Button shows "Complete All"
     - Confirmation asks to review answers
     - Can exit to dashboard

5. **Navigation Features**
   - "Back to Acts" button in sidebar to return to act selector
   - Exit to Dashboard button (via sidebar)
   - Risk Score badge showing real-time compliance risk
   - Generate PDF report of current answers

---

## Data Model

### Session Management
- **audit_sessions table:**
  - `id`: Session identifier
  - `factory_name`: Company name
  - `location`: Company location
  - `license_number`: Optional factory license
  - `status`: "Planning" | "In Progress" | "Completed"
  - `user_id`: Auditor (from auth)
  - `created_at`: When session started

- **session_answers table:**
  - `session_id`: Link to audit_sessions
  - `act_id`: **NEW** - Which act this answer belongs to
  - `question_id`: Question being answered
  - `status`: "Compliant" | "Non-Compliant" | "Delayed" | null
  - `evidence_url`: Evidence file URL
  - `remarks`: Auditor notes

### Act Registry
Located in `src/data/actRegistry.js`:

```javascript
AVAILABLE_ACTS = [
  {
    id: 'factories_act_1948',
    name: 'The Factories Act, 1948',
    shortName: 'Factories Act',
    description: '...',
    data: [95 items from JSON]
  },
  {
    id: 'maharashtra_factories_rules_1963',
    name: 'Maharashtra Factories Rules, 1963',
    shortName: 'MH Factory Rules',
    description: '...',
    data: [102 items from JSON]
  }
]
```

---

## State Management (App.jsx)

### Navigation States
```javascript
const [currentScreen, setCurrentScreen] = useState('dashboard');
// Values: 'dashboard' | 'act-selector' | 'audit'

const [currentSessionId, setCurrentSessionId] = useState(null);
const [factoryName, setFactoryName] = useState(null);
const [factoryLocation, setFactoryLocation] = useState(null);

const [selectedActIds, setSelectedActIds] = useState([]); // Multiple acts!
const [currentActIndex, setCurrentActIndex] = useState(0); // Which one we're on
```

### Screen Flow
```
┌─────────────┐
│  Dashboard  │  Select company
│             │  ↓
└──────┬──────┘
       │
       ↓
┌──────────────────┐
│  Act Selector    │  Choose which acts (1+ acts)
│                  │  ↓
└──────┬───────────┘
       │
       ↓
┌──────────────────────────┐
│  Audit View (Act 1)      │  Answer questions for Act 1
│  - Load Act 1 questions  │  ↓
│  - Save answers with     │  "Next Act" button
│    act_id = Act 1        │  ↓
└──────┬───────────────────┘
       │
       ↓
┌──────────────────────────┐
│  Audit View (Act 2)      │  Answer questions for Act 2
│  - Load Act 2 questions  │  ↓
│  - Save answers with     │  "Complete All" button
│    act_id = Act 2        │  ↓
└──────┬───────────────────┘
       │
       ↓
┌─────────────────────┐
│  Back to Dashboard  │  Session complete or resume later
└─────────────────────┘
```

---

## Key Improvements Over Previous Design

### Before
- ❌ Act was selected BEFORE company creation
- ❌ One company = one act only
- ❌ No way to audit multiple acts for same company
- ❌ Act selector was deeply integrated into company form

### After
- ✅ Company created first (standalone)
- ✅ Multiple acts can be selected for one company
- ✅ Acts audited sequentially with progress tracking
- ✅ Each answer tagged with act_id for proper organization
- ✅ Easy to resume and audit additional acts later
- ✅ Clean separation of concerns (Dashboard → ActSelector → Audit)

---

## Frontend Components

### Updated Components
1. **Dashboard.jsx** - Company creation/selection only
2. **App.jsx** - Main orchestration with 3-screen flow
3. **AuditCard.jsx** - Individual question display (unchanged)

### New Components
1. **ActSelector.jsx** - Multi-act selection interface

---

## Backend Requirements

### Database Changes
The `session_answers` table needs a new column:

```sql
ALTER TABLE session_answers 
ADD COLUMN act_id TEXT;

-- Add unique constraint for act-specific answers
ALTER TABLE session_answers 
ADD CONSTRAINT unique_session_question_act 
UNIQUE(session_id, question_id, act_id);
```

This ensures:
- Each answer is associated with specific act
- No duplicate answers for same question across different acts
- Easy filtering of answers by act

---

## Testing Checklist

- [ ] Create new company in Dashboard
- [ ] Verify ActSelector shows all acts with checkboxes
- [ ] Select multiple acts (e.g., both Factories Act and MH Rules)
- [ ] Verify audit starts with Act 1
- [ ] Answer questions for Act 1 (verify status colors update)
- [ ] Reach last question, verify "Next Act" button appears
- [ ] Click "Next Act", confirm transition to Act 2
- [ ] Verify Act 1 answers are preserved
- [ ] Answer Act 2 questions
- [ ] Reach last question of Act 2, verify "Complete All" appears
- [ ] Click "Complete All", verify session completion
- [ ] Check Supabase: verify session_answers has act_id for each answer

---

## Future Enhancements

1. **Act Completion Tracking**
   - Track which acts are completed for each session
   - Show progress bar: "2 of 2 acts completed"
   - Allow resuming specific acts

2. **Comparative Reports**
   - Compare compliance across multiple acts
   - Show which act has highest risk

3. **Batch Operations**
   - Start audits for same company across multiple facilities
   - Template acts for quick selection

4. **Act Custom Ordering**
   - Let auditors reorder acts before auditing
   - Audit priority-based

---

## File Changes Summary

```
src/
├── App.jsx                          (MODIFIED) - 3-screen workflow
├── components/
│   ├── Dashboard.jsx                (MODIFIED) - Company only
│   ├── ActSelector.jsx              (NEW) - Multi-act selection
│   └── AuditCard.jsx                (unchanged)
├── data/
│   └── actRegistry.js               (existing) - Act definitions
└── config/
    └── riskWeights.json             (existing) - Risk configuration

database/
├── audit_sessions                   (existing) - Company sessions
├── session_answers                  (MODIFIED) - Add act_id column
└── (future) act_audit_sessions      (PLANNED) - Detailed progress tracking
```

---

## Git Commits
- **0f2dd42**: "Implement company-first audit workflow: Dashboard -> Act Selector -> Audit"

---
