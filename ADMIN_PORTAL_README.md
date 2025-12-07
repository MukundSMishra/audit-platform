# Admin Portal - Setup Guide

## Overview
The Admin Portal is a comprehensive management system for monitoring interns, assigning audits, tracking progress, and managing client subscriptions.

## Features Implemented

### ✅ Phase 1 - Core Features
1. **Admin Dashboard**
   - Overview metrics (interns, clients, audits)
   - Recent activity feed
   - Top performing interns
   - Quick action buttons

2. **Intern Management**
   - Create/Edit intern accounts
   - View performance metrics
   - Activate/Deactivate accounts
   - Search and filter functionality

3. **Client Management**
   - Add/Edit client companies
   - Subscription tier management
   - Factory count tracking
   - Payment tracking integration ready

4. **Database Schema**
   - User profiles with role-based access
   - Client and factory tables
   - Audit assignments system
   - Activity logging
   - Row Level Security (RLS) policies

### 🚧 Phase 2 - Upcoming Features
- Audit Assignment Interface
- Real-time Progress Monitoring
- Reports & Analytics Dashboard
- Notification System
- Client Portal

## Database Setup

### Step 1: Run the Migration
Execute the SQL migration file in your Supabase project:

```bash
# File: ADMIN_PORTAL_SCHEMA.sql
```

This will create all necessary tables:
- `user_profiles` - Extended user information with roles
- `clients` - Client companies with subscription management
- `factories` - Factory master data
- `audit_assignments` - Assignment tracking
- `payment_records` - Payment and invoice tracking
- `activity_logs` - Audit trail

### Step 2: Create First Admin User

1. Sign up a user through Supabase Auth (or use existing)
2. Get the user's UUID from Supabase Auth dashboard
3. Run this SQL to make them an admin:

```sql
INSERT INTO public.user_profiles (id, email, full_name, role, is_active)
VALUES ('your-user-uuid-here', 'admin@yourcompany.com', 'Admin Name', 'admin', true);
```

### Step 3: Test Database Access

```sql
-- Verify admin profile exists
SELECT * FROM public.user_profiles WHERE role = 'admin';

-- Test RLS policies (as admin)
SELECT * FROM public.clients;
SELECT * FROM public.user_profiles WHERE role = 'intern';
```

## Accessing Admin Portal

### Option 1: URL-based Access (Recommended)
Add this check in your App.jsx:

```javascript
import AdminPortal from './components/admin/AdminPortal';
import { checkUserRole } from './utils/authHelpers';

const [userRole, setUserRole] = useState(null);

useEffect(() => {
  const checkRole = async () => {
    const role = await checkUserRole();
    setUserRole(role);
  };
  if (session) checkRole();
}, [session]);

// In your render logic:
if (userRole === 'admin') {
  return <AdminPortal userEmail={session.user.email} onLogout={handleLogout} />;
}
```

### Option 2: Separate Routes
Use React Router:

```javascript
<Routes>
  <Route path="/admin/*" element={<AdminPortal />} />
  <Route path="/*" element={<InternApp />} />
</Routes>
```

## User Roles

### Admin
- Full access to all features
- Can create/manage interns
- Can manage clients and subscriptions
- Can assign audits
- Can view all reports and analytics

### Intern (Auditor)
- Can only access assigned audits
- Cannot see other interns' work
- No access to admin dashboard
- Limited to audit execution interface

### Client (Future)
- Can view their own audit reports
- Track subscription status
- Download reports

## Security Features

### Row Level Security (RLS)
All tables have RLS enabled with policies:
- Admins can view/edit everything
- Interns can only see their assigned work
- Clients can only see their own data

### Activity Logging
Every critical action is logged:
- User who performed action
- Action type (created, updated, assigned, etc.)
- Timestamp
- Additional context in JSONB

### Example Activity Log
```javascript
await supabase.rpc('log_activity', {
  p_action: 'assigned_audit',
  p_entity_type: 'audit',
  p_entity_id: auditId,
  p_details: { intern_id: internId, due_date: '2025-12-15' }
});
```

## API Endpoints

### Intern Management
```javascript
// Get all interns
const { data } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('role', 'intern');

// Create intern
const { data } = await supabase.auth.signUp({ email, password });
await supabase.from('user_profiles').insert([{
  id: data.user.id,
  email, role: 'intern', ...
}]);

// Update intern
await supabase
  .from('user_profiles')
  .update({ full_name, phone, ... })
  .eq('id', internId);
```

### Client Management
```javascript
// Get all clients with factory count
const { data } = await supabase
  .from('clients')
  .select('*, factories(count)');

// Create client
const { data } = await supabase
  .from('clients')
  .insert([{ company_name, subscription_tier, ... }]);
```

### Dashboard Metrics
```javascript
// Get active interns count
const { count } = await supabase
  .from('user_profiles')
  .select('*', { count: 'exact' })
  .eq('role', 'intern')
  .eq('is_active', true);

// Get active audits
const { count } = await supabase
  .from('audit_sessions')
  .select('*', { count: 'exact' })
  .in('status', ['In Progress', 'Planning']);
```

## Subscription Tiers

### Trial
- 5 audits
- 30 days validity
- 1 user

### Basic
- 20 audits/month
- Basic reporting
- 3 users

### Professional
- 100 audits/month
- Advanced analytics
- 10 users
- Priority support

### Enterprise
- Unlimited audits
- Custom integrations
- Unlimited users
- Dedicated support

## Troubleshooting

### Issue: Admin can't see data
**Solution:** Check RLS policies are created correctly:
```sql
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
```

### Issue: User profile doesn't exist
**Solution:** Create profile automatically after signup:
```javascript
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session) {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (!data) {
      // Create profile
      await createUserProfile(session.user.id, session.user.email);
    }
  }
});
```

### Issue: Can't create intern accounts
**Solution:** Admin needs service_role key for creating auth users. Use Supabase Admin API or server-side function.

## Performance Optimization

### Indexes Created
- `idx_user_profiles_role` - Fast role filtering
- `idx_clients_subscription_status` - Quick subscription queries
- `idx_assignments_assigned_to` - Efficient assignment lookup
- `idx_activity_logs_created_at` - Fast activity feed

### Caching Strategy
- Dashboard metrics: Cache for 5 minutes
- User lists: Cache until mutation
- Activity logs: Real-time (no cache)

## Next Steps

1. **Test Database Migration**
   - Run ADMIN_PORTAL_SCHEMA.sql in Supabase
   - Create first admin user
   - Verify RLS policies

2. **Integrate with App**
   - Add role check in App.jsx
   - Route to AdminPortal for admin users
   - Keep existing app for interns

3. **Create Sample Data**
   - Add 2-3 test interns
   - Add 2 test clients
   - Create sample assignments

4. **Test Features**
   - Create/edit intern
   - Create/edit client
   - View dashboard metrics
   - Check activity logs

## Support

For issues or questions:
- Check Supabase logs for database errors
- Review browser console for client errors
- Verify RLS policies in Supabase dashboard
- Check user_profiles table exists and has data

---

**Version:** 1.0.0  
**Last Updated:** December 7, 2025
