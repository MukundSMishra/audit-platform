# Submit for Review - Quick Start Guide

## 🚀 Quick Setup (5 Minutes)

### Step 1: Database Setup
Run this SQL in your Supabase SQL Editor:

```bash
# Open Supabase Dashboard → SQL Editor
# Copy and paste the contents of: CREATE_AI_REVIEW_REPORTS_TABLE.sql
# Click "Run"
```

### Step 2: Start the Python AI Agent

```bash
# Install dependencies
pip install fastapi uvicorn pydantic

# Run the example AI agent
python python_ai_agent_example.py

# You should see:
# INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Step 3: Test the Feature

1. **Start your React app:**
   ```bash
   npm run dev
   ```

2. **Complete an audit:**
   - Login to the platform
   - Select a client/factory
   - Choose acts to audit
   - Answer all questions
   - Click "Complete & Review" on the last question

3. **Submit for review:**
   - Review the audit summary
   - Click "Submit for AI Review"
   - Wait for processing (~2-3 seconds)
   - Automatically redirects to dashboard

## 📊 What Happens

```
User Completes Audit
       ↓
Submit for Review Screen (SubmitForReview.jsx)
       ↓
POST to http://127.0.0.1:8000/submit-audit-batch
       ↓
Python AI Agent Analyzes Data
       ↓
Returns JSON Report
       ↓
Save to Supabase (ai_review_reports table)
       ↓
Redirect to Dashboard
```

## 🧪 Test with Mock Data

### Test Endpoint Directly

```bash
# Test the AI Agent is running
curl http://127.0.0.1:8000

# Test with sample payload
curl -X POST http://127.0.0.1:8000/submit-audit-batch \
  -H "Content-Type: application/json" \
  -d '{
    "batch_id": "test_123",
    "session_id": "test-session",
    "company_name": "Test Factory",
    "location": "Mumbai",
    "submitted_at": "2025-01-01T00:00:00.000Z",
    "audit_items": [
      {
        "audit_item_id": "q1",
        "question_text": "Test question",
        "legal_text": "Legal requirement",
        "risk_level": "High",
        "category": "Safety",
        "workflow_type": "manual_observation",
        "intern_verdict": "Compliant",
        "is_applicable": true
      }
    ]
  }'
```

Expected Response:
```json
{
  "status": "success",
  "batch_id": "test_123",
  "overall_compliance_score": 100.0,
  "critical_findings": 0,
  "high_risk_findings": 0,
  "recommendations": [],
  "summary": "...",
  "processed_items": 1,
  "processing_timestamp": "2025-01-01T00:00:00.000Z"
}
```

## 🎯 Key Files Modified

### New Files Created:
1. `src/components/SubmitForReview.jsx` - Main UI component
2. `CREATE_AI_REVIEW_REPORTS_TABLE.sql` - Database migration
3. `python_ai_agent_example.py` - AI Agent example
4. `SUBMIT_FOR_REVIEW_FEATURE.md` - Full documentation

### Modified Files:
1. `src/App.jsx` - Added screen routing and callbacks
2. `src/components/AuditProgress.jsx` - Added submit button

## 🔍 Debugging

### Check if AI Agent is running:
```bash
curl http://127.0.0.1:8000
# Should return: {"status":"online","service":"Audit AI Agent",...}
```

### Check browser console:
Look for logs with `[SubmitForReview]` prefix:
```javascript
[SubmitForReview] Submitting payload: {...}
[SubmitForReview] AI Agent response: {...}
```

### Check Supabase data:
```sql
-- View submitted reports
SELECT * FROM ai_review_reports ORDER BY created_at DESC LIMIT 5;

-- Check table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'ai_review_reports';
```

### Common Issues:

**"Failed to submit" error:**
- ✅ Check AI Agent is running on port 8000
- ✅ Check CORS is enabled in AI Agent
- ✅ Check browser console for network errors

**"Failed to save report" error:**
- ✅ Run the SQL migration (CREATE_AI_REVIEW_REPORTS_TABLE.sql)
- ✅ Check RLS policies allow the current user
- ✅ Verify Supabase connection

**Submit button doesn't appear:**
- ✅ Ensure ALL questions are answered (progress = 100%)
- ✅ Check browser console for React errors
- ✅ Verify you're on the last question of the last act

## 🎨 Customization

### Change AI Agent URL:
Edit `src/components/SubmitForReview.jsx`:
```javascript
const response = await fetch('YOUR_API_URL/submit-audit-batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
```

### Customize Success Message:
Edit `src/App.jsx` in the `onSubmitSuccess` callback:
```javascript
alert('Your custom success message!');
```

### Add More Analytics:
Modify `python_ai_agent_example.py` to include:
- Machine learning models
- Document OCR processing
- Advanced compliance scoring
- PDF report generation

## 📚 Next Steps

1. **Replace the demo AI Agent** with your production implementation
2. **Add authentication** to the AI Agent endpoint
3. **Implement report viewing** in the dashboard
4. **Add email notifications** when reports are ready
5. **Enable batch processing** for multiple audits

## 💡 Pro Tips

- Save progress before submitting (auto-saved)
- Test with 1-2 questions first
- Check AI Agent logs for debugging
- Use Supabase real-time to show processing status
- Add loading states for better UX

## 🆘 Support

For detailed documentation, see:
- `SUBMIT_FOR_REVIEW_FEATURE.md` - Complete feature documentation
- `python_ai_agent_example.py` - AI Agent code with comments
- Browser DevTools Console - Real-time logs

Happy auditing! 🎉
