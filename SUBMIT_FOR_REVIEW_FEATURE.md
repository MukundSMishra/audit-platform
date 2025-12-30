# Submit for Review Feature - Documentation

## Overview
The "Submit for Review" feature enables auditors to submit completed audit data to an AI Agent for automated analysis and report generation. This feature integrates seamlessly with the existing audit workflow.

## Architecture

### Components

#### 1. **SubmitForReview Component** (`src/components/SubmitForReview.jsx`)
A full-screen modal that appears after all audit questions are answered.

**Features:**
- Displays audit summary statistics
- Shows completion metrics (compliant, non-compliant, delayed, N/A)
- Lists all audited acts
- Submits data to Python AI Agent
- Handles success/error states
- Auto-saves AI report to Supabase

**Props:**
```javascript
{
  sessionId: string,           // Current audit session ID
  company: object,             // Company details { company_name, location }
  auditData: array,            // All audit questions
  answers: object,             // Answer data keyed by question ID
  selectedActs: array,         // Acts being audited
  onSubmitSuccess: function,   // Callback on successful submission
  onCancel: function          // Callback to return to audit
}
```

### 2. **Integration Points in App.jsx**

**Screen States:**
- Added `'submit-review'` to `currentScreen` state
- Triggers when completing the last question of the last act
- Can also be accessed from AuditProgress when all audits are 100% complete

**Navigation Flow:**
```
Audit (Last Question) → Submit for Review → Dashboard
         ↓                      ↓
    Save Progress     Submit to AI Agent → Save Report
```

### 3. **AuditProgress Enhancement**
Added conditional "Submit for Review" button that appears when:
- Overall progress is 100%
- `onSubmitForReview` callback is provided

## Data Flow

### Payload Schema
The component sends the following JSON structure to the AI Agent:

```json
{
  "batch_id": "batch_{sessionId}_{timestamp}",
  "session_id": "uuid",
  "company_name": "Company Name",
  "location": "City, State",
  "submitted_at": "2025-01-01T00:00:00.000Z",
  "audit_items": [
    {
      "audit_item_id": "question_id",
      "question_text": "Question text...",
      "legal_text": "Legal requirement...",
      "risk_level": "Critical|High|Medium|Low",
      "category": "Category name",
      "workflow_type": "manual_observation|ai_evidence",
      
      // For manual_observation workflow:
      "intern_verdict": "Compliant|Non-Compliant|Delayed",
      "intern_comment": "Auditor notes...",
      "evidence_url": "https://...",
      
      // For ai_evidence workflow:
      "intern_evidence": "Evidence description or URL",
      "missing_evidence_reason": "Reason if N/A",
      
      // Common fields:
      "applicability_reason": "Why this applies...",
      "is_applicable": true
    }
  ]
}
```

### API Endpoint
**URL:** `http://127.0.0.1:8000/submit-audit-batch`
**Method:** POST
**Content-Type:** application/json

### Expected Response
The AI Agent should return a JSON report containing analysis results, compliance scores, recommendations, etc.

## Database Schema

### New Table: `ai_review_reports`
```sql
CREATE TABLE ai_review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id TEXT UNIQUE NOT NULL,
  session_id UUID REFERENCES audit_sessions(id) ON DELETE CASCADE,
  report_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `idx_ai_review_reports_session_id`
- `idx_ai_review_reports_batch_id`
- `idx_ai_review_reports_created_at`

**RLS Policies:**
- Users can view/insert their own reports
- Admins can view all reports

**Migration File:** `CREATE_AI_REVIEW_REPORTS_TABLE.sql`

## Usage Instructions

### For Auditors

1. **Complete Audit Questions**
   - Answer all questions across all selected acts
   - Provide evidence where required
   - Add comments and observations

2. **Submit for Review**
   - Option 1: Click "Complete & Review" on the last question
   - Option 2: Go to Progress screen and click "Submit for Review" button (appears when 100% complete)

3. **Review Summary**
   - Check audit statistics
   - Verify all acts are included
   - Click "Submit for AI Review"

4. **Wait for Processing**
   - The system sends data to AI Agent
   - AI analyzes evidence and generates report
   - Report is automatically saved to database

5. **View Results**
   - Returns to dashboard after 3 seconds
   - Check dashboard for the completed report

### For Developers

#### Running the AI Agent
Ensure your Python AI Agent is running on `http://127.0.0.1:8000`:

```bash
cd your-ai-agent-directory
python -m uvicorn main:app --reload --port 8000
```

#### Database Setup
Run the migration to create the `ai_review_reports` table:

1. Go to Supabase Dashboard → SQL Editor
2. Open `CREATE_AI_REVIEW_REPORTS_TABLE.sql`
3. Execute the SQL

#### Testing the Feature

**Test Payload:**
```javascript
{
  "batch_id": "test_batch_123",
  "session_id": "test-session-uuid",
  "company_name": "Test Company",
  "location": "Mumbai, Maharashtra",
  "submitted_at": "2025-01-01T00:00:00.000Z",
  "audit_items": [
    {
      "audit_item_id": "q1",
      "question_text": "Is fire safety equipment maintained?",
      "legal_text": "Section 38 requires...",
      "risk_level": "High",
      "category": "Safety",
      "workflow_type": "manual_observation",
      "intern_verdict": "Compliant",
      "intern_comment": "Fire extinguishers inspected monthly",
      "evidence_url": null,
      "applicability_reason": null,
      "is_applicable": true
    }
  ]
}
```

**Mock AI Agent Response:**
```python
# In your FastAPI app
@app.post("/submit-audit-batch")
async def submit_audit_batch(payload: dict):
    return {
        "status": "success",
        "batch_id": payload["batch_id"],
        "overall_compliance": 85,
        "critical_findings": 2,
        "recommendations": [
            "Improve documentation for Safety category",
            "Schedule follow-up for delayed items"
        ],
        "report_url": "https://storage.example.com/reports/batch_123.pdf"
    }
```

## Error Handling

### Client-Side Errors
- **No Active Session:** Alert shown, prevents submission
- **Network Error:** Displays error message, allows retry
- **AI Agent Offline:** Shows connection error, check console

### Server-Side Errors
- **Database Save Failure:** Report generated but not saved, console logs error
- **Invalid Payload:** AI Agent returns 400, error displayed

### Recovery
- Failed submissions can be retried
- Progress is auto-saved before submission
- Session data persists for later submission attempts

## Future Enhancements

1. **Offline Support**
   - Queue submissions when AI Agent is unavailable
   - Auto-retry with exponential backoff

2. **Report Preview**
   - Show AI-generated report inline before saving
   - Allow manual edits to report

3. **Batch Operations**
   - Submit multiple sessions at once
   - Bulk export for management review

4. **Email Notifications**
   - Alert users when AI analysis completes
   - Send report summary via email

5. **Report History**
   - View all submitted reports from dashboard
   - Compare reports across time periods

## Troubleshooting

### "Failed to submit audit for review"
**Check:**
- Is Python AI Agent running on port 8000?
- Check browser console for network errors
- Verify payload format matches expected schema

### "AI review completed but failed to save report"
**Check:**
- Is `ai_review_reports` table created?
- Check RLS policies allow current user to insert
- Verify Supabase connection is active

### Submit button not appearing
**Check:**
- Have all questions been answered?
- Is `overallProgress === 100`?
- Check if `onSubmitForReview` prop is passed to AuditProgress

## Related Files

- `src/components/SubmitForReview.jsx` - Main component
- `src/components/AuditProgress.jsx` - Progress screen with submit button
- `src/App.jsx` - Integration and navigation logic
- `CREATE_AI_REVIEW_REPORTS_TABLE.sql` - Database migration

## Contact & Support

For issues or questions about this feature:
1. Check browser console logs (look for `[SubmitForReview]` prefix)
2. Verify AI Agent logs for request/response details
3. Check Supabase logs for database errors
