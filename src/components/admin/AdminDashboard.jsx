import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { 
  Users, Building2, ClipboardCheck, TrendingUp, 
  Activity, Calendar, AlertCircle, CheckCircle2, 
  Clock, UserCheck, BarChart3, DollarSign 
} from 'lucide-react';

const AdminDashboard = ({ userEmail }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInterns: 0,
    activeInterns: 0,
    totalClients: 0,
    activeClients: 0,
    totalAudits: 0,
    activeAudits: 0,
    completedAudits: 0,
    pendingAssignments: 0,
    overdueAudits: 0,
    revenueThisMonth: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    // Only fetch once, not on every tab switch
    if (!dataLoaded) {
      fetchDashboardData();
    }
  }, [dataLoaded]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch intern stats
      const { data: interns } = await supabase
        .from('user_profiles')
        .select('id, is_active')
        .eq('role', 'intern');

      // Fetch client stats
      const { data: clients } = await supabase
        .from('clients')
        .select('id, subscription_status');

      // Fetch audit stats
      const { data: audits } = await supabase
        .from('audit_sessions')
        .select('id, status, created_at, completed_at, assigned_intern_id');

      // Fetch assignment stats
      const { data: assignments } = await supabase
        .from('audit_assignments')
        .select('id, status, due_date, assigned_to, completed_at')
        .order('assigned_at', { ascending: false });

      // Fetch recent activity (without join - we'll manually match)
      const { data: activities, error: activityError } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // If we have activities, fetch the user profiles for them
      let activitiesWithUsers = [];
      if (activities && activities.length > 0) {
        const userIds = [...new Set(activities.map(a => a.user_id).filter(Boolean))];
        
        if (userIds.length > 0) {
          const { data: userProfiles } = await supabase
            .from('user_profiles')
            .select('id, full_name, email')
            .in('id', userIds);

          // Create a map for quick lookup
          const userMap = {};
          userProfiles?.forEach(user => {
            userMap[user.id] = user;
          });

          // Attach user profiles to activities
          activitiesWithUsers = activities.map(activity => ({
            ...activity,
            user_profiles: userMap[activity.user_id] || null
          }));
        } else {
          activitiesWithUsers = activities;
        }
      }

      // Calculate stats
      const activeInterns = interns?.filter(i => i.is_active)?.length || 0;
      const activeClients = clients?.filter(c => c.subscription_status === 'active')?.length || 0;
      const activeAudits = audits?.filter(a => a.status === 'In Progress' || a.status === 'Planning')?.length || 0;
      const completedAudits = audits?.filter(a => a.status === 'Completed')?.length || 0;
      const pendingAssignments = assignments?.filter(a => a.status === 'assigned')?.length || 0;
      
      // Calculate overdue audits
      const today = new Date();
      const overdueAudits = assignments?.filter(a => {
        if (a.status !== 'completed' && a.due_date) {
          return new Date(a.due_date) < today;
        }
        return false;
      })?.length || 0;

      // Calculate intern performance
      const internPerformance = {};
      audits?.forEach(audit => {
        if (audit.assigned_intern_id && audit.completed_at) {
          if (!internPerformance[audit.assigned_intern_id]) {
            internPerformance[audit.assigned_intern_id] = { completed: 0, avgTime: [] };
          }
          internPerformance[audit.assigned_intern_id].completed += 1;
          
          const startTime = new Date(audit.created_at);
          const endTime = new Date(audit.completed_at);
          const days = Math.ceil((endTime - startTime) / (1000 * 60 * 60 * 24));
          internPerformance[audit.assigned_intern_id].avgTime.push(days);
        }
      });

      setStats({
        totalInterns: interns?.length || 0,
        activeInterns,
        totalClients: clients?.length || 0,
        activeClients,
        totalAudits: audits?.length || 0,
        activeAudits,
        completedAudits,
        pendingAssignments,
        overdueAudits,
        revenueThisMonth: 0 // TODO: Calculate from payment_records
      });

      setRecentActivity(activitiesWithUsers || []);
      setPerformanceData(Object.entries(internPerformance).map(([id, data]) => ({
        internId: id,
        completed: data.completed,
        avgDays: Math.round(data.avgTime.reduce((a, b) => a + b, 0) / data.avgTime.length)
      })));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setDataLoaded(true);
    }
  };

  const StatCard = ({ icon: Icon, label, value, subtext, color, trend }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-2 rounded-lg ${color} group-hover:scale-110 transition-transform duration-300`}>
              <Icon size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
          </div>
          <div className="text-3xl font-black text-gray-900 mb-1">{value}</div>
          {subtext && <div className="text-sm text-gray-500">{subtext}</div>}
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
            <TrendingUp size={12} />
            {trend}
          </div>
        )}
      </div>
    </div>
  );

  const ActivityItem = ({ activity }) => {
    const actionIcons = {
      'assigned_audit': ClipboardCheck,
      'completed_audit': CheckCircle2,
      'created_client': Building2,
      'added_intern': UserCheck,
      'payment_received': DollarSign
    };
    
    const Icon = actionIcons[activity.action] || Activity;
    const userName = activity.user_profiles?.full_name || activity.user_profiles?.email || 'Unknown User';
    
    return (
      <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <Icon size={16} strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 font-medium">{activity.action.replace(/_/g, ' ')}</p>
          <p className="text-xs text-gray-500 truncate">{userName}</p>
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {new Date(activity.created_at).toLocaleDateString()}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">Welcome back, {userEmail}</p>
            </div>
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors">
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            icon={Users} 
            label="Active Interns" 
            value={stats.activeInterns}
            subtext={`${stats.totalInterns} total`}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <StatCard 
            icon={Building2} 
            label="Active Clients" 
            value={stats.activeClients}
            subtext={`${stats.totalClients} total`}
            color="bg-gradient-to-br from-emerald-500 to-emerald-600"
          />
          <StatCard 
            icon={ClipboardCheck} 
            label="Active Audits" 
            value={stats.activeAudits}
            subtext={`${stats.completedAudits} completed`}
            color="bg-gradient-to-br from-purple-500 to-purple-600"
          />
          <StatCard 
            icon={AlertCircle} 
            label="Pending Assignments" 
            value={stats.pendingAssignments}
            subtext={stats.overdueAudits > 0 ? `${stats.overdueAudits} overdue` : 'All on track'}
            color={stats.overdueAudits > 0 ? "bg-gradient-to-br from-rose-500 to-rose-600" : "bg-gradient-to-br from-amber-500 to-amber-600"}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <Activity size={20} className="text-blue-600" />
                Recent Activity
              </h2>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-bold">View All</button>
            </div>
            <div className="space-y-2">
              {recentActivity.length > 0 ? (
                recentActivity.map(activity => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Activity size={48} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-black text-gray-900 mb-6">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left group">
                <div className="p-2 bg-blue-600 text-white rounded-lg group-hover:scale-110 transition-transform">
                  <Users size={20} />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900">Add Intern</div>
                  <div className="text-xs text-gray-500">Create new auditor account</div>
                </div>
              </button>

              <button className="w-full flex items-center gap-3 p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors text-left group">
                <div className="p-2 bg-emerald-600 text-white rounded-lg group-hover:scale-110 transition-transform">
                  <Building2 size={20} />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900">Add Client</div>
                  <div className="text-xs text-gray-500">Register new company</div>
                </div>
              </button>

              <button className="w-full flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left group">
                <div className="p-2 bg-purple-600 text-white rounded-lg group-hover:scale-110 transition-transform">
                  <ClipboardCheck size={20} />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900">Assign Audit</div>
                  <div className="text-xs text-gray-500">Create new assignment</div>
                </div>
              </button>

              <button className="w-full flex items-center gap-3 p-4 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors text-left group">
                <div className="p-2 bg-amber-600 text-white rounded-lg group-hover:scale-110 transition-transform">
                  <BarChart3 size={20} />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-gray-900">View Reports</div>
                  <div className="text-xs text-gray-500">Analytics & insights</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Top Performers */}
        {performanceData.length > 0 && (
          <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-600" />
              Top Performing Interns
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {performanceData.slice(0, 3).map((perf, idx) => (
                <div key={perf.internId} className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{perf.completed} Audits</div>
                      <div className="text-xs text-gray-500">Avg: {perf.avgDays} days</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
