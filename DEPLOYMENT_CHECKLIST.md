# ✅ Submit for Review - Setup Checklist

## Pre-Deployment Checklist

### 🗄️ Database Setup
- [ ] Open Supabase Dashboard
- [ ] Navigate to SQL Editor
- [ ] Copy contents of `CREATE_AI_REVIEW_REPORTS_TABLE.sql`
- [ ] Execute the SQL
- [ ] Verify table creation:
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_name = 'ai_review_reports';
  ```
- [ ] Expected result: 1 row returned

### 🐍 Python AI Agent Setup
- [ ] Install Python dependencies:
  ```bash
  pip install fastapi uvicorn pydantic
  ```
- [ ] Start the AI Agent:
  ```bash
  python python_ai_agent_example.py
  ```
- [ ] Verify it's running:
  ```bash
  curl http://127.0.0.1:8000
  ```
- [ ] Expected response:
  ```json
  {"status": "online", "service": "Audit AI Agent", ...}
  ```
- [ ] Keep terminal open (agent must stay running)

### 🌐 Frontend Setup
- [ ] No additional dependencies needed (all using existing packages)
- [ ] Start React dev server:
  ```bash
  npm run dev
  ```
- [ ] Verify no build errors
- [ ] Check browser console for errors

## Testing Checklist

### 🧪 Basic Flow Test
- [ ] Login to the platform
- [ ] Select a client/factory
- [ ] Choose audit type (Regulatory)
- [ ] Select at least one act
- [ ] Answer 3-5 questions (enough to test)
- [ ] Mark all questions answered
- [ ] Click "Complete & Review" on last question
- [ ] Verify: Redirects to SubmitForReview screen
- [ ] Check: Summary statistics are correct
- [ ] Click "Submit for AI Review"
- [ ] Verify: Loading state shows
- [ ] Check: Success message appears
- [ ] Verify: Auto-redirects to dashboard after 3 seconds

### 🔍 Database Verification
After submitting, check:

```sql
-- 1. Check report was saved
SELECT * FROM ai_review_reports 
ORDER BY created_at DESC 
LIMIT 1;

-- Expected: 1 row with your batch_id and report_data

-- 2. Check session was updated
SELECT id, status, completed_at 
FROM audit_sessions 
WHERE id = 'your-session-id';

-- Expected: status = 'Completed', completed_at is populated
```

### 🌐 API Testing
Test the AI Agent independently:

```bash
# Create test_payload.json
{
  "batch_id": "test_batch_001",
  "session_id": "test-session-uuid",
  "company_name": "Test Factory",
  "location": "Mumbai, Maharashtra",
  "submitted_at": "2025-01-01T00:00:00.000Z",
  "audit_items": [
    {
      "audit_item_id": "test_q1",
      "question_text": "Test question?",
      "legal_text": "Test legal requirement",
      "risk_level": "High",
      "category": "Safety",
      "workflow_type": "manual_observation",
      "intern_verdict": "Compliant",
      "intern_comment": "All good",
      "evidence_url": null,
      "applicability_reason": null,
      "is_applicable": true
    }
  ]
}

# Send test request
curl -X POST http://127.0.0.1:8000/submit-audit-batch \
  -H "Content-Type: application/json" \
  -d @test_payload.json

# Expected: 200 OK with compliance analysis
```

### 🎯 Progress Screen Test
- [ ] Start an audit
- [ ] Answer some (but not all) questions
- [ ] Navigate to Progress screen
- [ ] Verify: "Submit for Review" button does NOT appear
- [ ] Complete all remaining questions
- [ ] Return to Progress screen
- [ ] Verify: "Submit for Review" button DOES appear
- [ ] Click it
- [ ] Verify: Same submission flow works

### ⚠️ Error Handling Test
1. **AI Agent Offline:**
   - [ ] Stop the Python AI Agent
   - [ ] Try to submit audit
   - [ ] Expected: Error message about connection failure
   - [ ] Restart AI Agent
   - [ ] Retry submission
   - [ ] Expected: Should work now

2. **Network Issues:**
   - [ ] Open DevTools Network tab
   - [ ] Throttle to "Slow 3G"
   - [ ] Submit audit
   - [ ] Expected: Longer loading, but should succeed

3. **Incomplete Audit:**
   - [ ] Skip some questions
   - [ ] Try to navigate to submit screen
   - [ ] Expected: Can still submit (only answered items sent)
   - [ ] Warning message about unanswered questions

## Browser Console Checks

### ✅ Expected Logs (Success)
```javascript
[SubmitForReview] Submitting payload: {...}
[SubmitForReview] AI Agent response: {...}
[Submit Success] AI Report received: {...}
[Submit Success] AI report saved successfully
```

### ❌ Error Logs to Watch For
```javascript
// Network error
Failed to fetch
// Database error
[Submit Success] Error saving AI report: {...}
// Validation error
[SubmitForReview] Error submitting: {...}
```

## Post-Deployment Monitoring

### Day 1: Initial Monitoring
- [ ] Monitor AI Agent logs for incoming requests
- [ ] Check `ai_review_reports` table for new entries
- [ ] Verify RLS policies allow proper access
- [ ] Check for any console errors reported by users

### Week 1: Usage Analysis
- [ ] Count total submissions:
  ```sql
  SELECT COUNT(*) FROM ai_review_reports;
  ```
- [ ] Check average processing time (AI Agent logs)
- [ ] Review error rates
- [ ] Gather user feedback

### Month 1: Performance Review
- [ ] Database query performance
- [ ] AI Agent response times
- [ ] User satisfaction with feature
- [ ] Identify improvement areas

## Rollback Plan

If issues occur:

### Quick Rollback (Frontend Only)
```javascript
// In App.jsx, comment out the submit-review screen
/*
if (currentScreen === 'submit-review') {
  return <SubmitForReview ... />;
}
*/

// Change completion button to old behavior
// In App.jsx line ~1230
onClick: () => {
  alert('All audits completed!');
  setCurrentScreen('dashboard');
}
```

### Full Rollback
1. Revert changes to `App.jsx` and `AuditProgress.jsx`
2. Remove `SubmitForReview.jsx`
3. Keep database table (won't affect existing features)
4. Stop AI Agent

## Production Readiness

### Before Going Live:
- [ ] Replace demo AI Agent with production implementation
- [ ] Add authentication to AI Agent endpoint
- [ ] Set up proper logging and monitoring
- [ ] Configure production URLs (not localhost)
- [ ] Test with real audit data
- [ ] Train users on new feature
- [ ] Prepare support documentation
- [ ] Set up error alerting
- [ ] Configure backup for `ai_review_reports` table

### Production Configuration:
```javascript
// Update in SubmitForReview.jsx
const AI_AGENT_URL = process.env.VITE_AI_AGENT_URL || 'http://127.0.0.1:8000';

const response = await fetch(`${AI_AGENT_URL}/submit-audit-batch`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${yourAuthToken}` // Add auth
  },
  body: JSON.stringify(payload)
});
```

## Success Criteria

✅ **Feature is working when:**
- Submission completes without errors
- Report data is saved to database
- Users can see their submitted audits
- AI Agent processes requests < 5 seconds
- Error rate < 1%
- User satisfaction > 80%

## Support Resources

📄 **Documentation:**
- `SUBMIT_FOR_REVIEW_FEATURE.md` - Detailed feature docs
- `QUICK_START_SUBMIT_REVIEW.md` - Setup guide
- `ARCHITECTURE_DIAGRAM.md` - System architecture

🐛 **Debugging:**
- Browser DevTools Console
- AI Agent terminal logs
- Supabase logs dashboard
- Network tab in DevTools

📞 **Get Help:**
- Check console logs first
- Review error messages carefully
- Test with curl to isolate issues
- Check database directly

---

**Last Updated:** December 30, 2025
**Version:** 1.0.0
**Status:** Ready for Testing ✅
