import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

/**
 * ReportDashboard Component
 * Displays all audit sessions in a table format with filtering and search capabilities
 */
export default function ReportDashboard({ onViewReport }) {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchClient, setSearchClient] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Fetch all audit sessions on component mount
  useEffect(() => {
    const loadSessions = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('audit_sessions')
          .select('id, factory_name, location, assigned_to, audit_type, risk_score, status, submitted_at')
          .order('submitted_at', { ascending: false });

        if (error) {
          console.error('Error fetching audit sessions:', error);
          setSessions([]);
        } else {
          setSessions(data || []);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  // Filter sessions based on search and date filters
  useEffect(() => {
    let filtered = sessions;

    // Filter by factory name (case-insensitive substring match)
    if (searchClient.trim()) {
      filtered = filtered.filter(session =>
        session.factory_name?.toLowerCase().includes(searchClient.toLowerCase())
      );
    }

    // Filter by date
    if (filterDate) {
      const filterDateStr = new Date(filterDate).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      filtered = filtered.filter(session => {
        const sessionDateStr = session.submitted_at 
          ? new Date(session.submitted_at).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })
          : null;
        return sessionDateStr === filterDateStr;
      });
    }

    setFilteredSessions(filtered);
  }, [sessions, searchClient, filterDate]);

  /**
   * Get color-coded badge based on risk score
   */
  const getScoreBadgeColor = (score) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    if (score >= 80) return 'bg-red-100 text-red-800'; // High risk = red
    if (score >= 60) return 'bg-orange-100 text-orange-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800'; // Low risk = green
  };

  /**
   * Format date display
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  /**
   * Get status badge based on session status
   */
  const getStatusBadge = (status) => {
    if (status === 'submitted') {
      return (
        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          AI Reviewing...
        </span>
      );
    }
    if (status === 'completed') {
      return (
        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Report Ready
        </span>
      );
    }
    return (
      <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        {status || 'Unknown'}
      </span>
    );
  };

  /**
   * Get audit type badge
   */
  const getTypeBadge = (type) => {
    const displayType = type === 'regulatory' ? 'Regulatory' : type === 'business' ? 'Business' : 'N/A';
    const colorClass = type === 'regulatory' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-purple-100 text-purple-800';
    
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}>
        {displayType}
      </span>
    );
  };

  /**
   * Handle view report button click
   */
  const handleViewReport = (sessionId) => {
    if (onViewReport) {
      onViewReport(sessionId);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Loading audit reports...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (filteredSessions.length === 0 && sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
        <svg
          className="w-24 h-24 text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-gray-500 text-lg font-medium">No audits found</p>
        <p className="text-gray-400 text-sm mt-2">Start by submitting an audit for review</p>
      </div>
    );
  }

  // Empty state with filters applied
  if (filteredSessions.length === 0) {
    return (
      <div className="w-full">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Audit Reports Archive</h2>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Factory Name
              </label>
              <input
                type="text"
                placeholder="Enter factory name..."
                value={searchClient}
                onChange={(e) => setSearchClient(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Date
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
          <svg
            className="w-16 h-16 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-gray-500 text-lg font-medium">No audits match your filters</p>
          <button
            onClick={() => {
              setSearchClient('');
              setFilterDate('');
            }}
            className="mt-4 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Clear Filters
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Audit Reports Archive</h2>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Factory Name
            </label>
            <input
              type="text"
              placeholder="Enter factory name..."
              value={searchClient}
              onChange={(e) => setSearchClient(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-600 mb-4">
          Showing {filteredSessions.length} of {sessions.length} audits
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Client
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Date
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Type
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Risk Score
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Status
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredSessions.map((session) => (
              <tr
                key={session.id}
                className="hover:bg-gray-50 transition-colors"
              >
                {/* Client Column - Factory Name & Location */}
                <td className="px-6 py-4 text-sm">
                  <div className="font-medium text-gray-900">{session.factory_name || 'Unknown'}</div>
                  <div className="text-xs text-gray-500">{session.location || 'N/A'}</div>
                </td>

                {/* Date Column */}
                <td className="px-6 py-4 text-sm text-gray-900">
                  {formatDate(session.submitted_at)}
                </td>

                {/* Type Column - Badge */}
                <td className="px-6 py-4 text-sm">
                  {getTypeBadge(session.audit_type)}
                </td>

                {/* Risk Score Column - Color-coded badge */}
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-block px-3 py-1 rounded-full font-semibold ${getScoreBadgeColor(
                      session.risk_score
                    )}`}
                  >
                    {session.risk_score || 'N/A'}
                  </span>
                </td>

                {/* Status Column - submitted/completed badge */}
                <td className="px-6 py-4 text-sm">
                  {getStatusBadge(session.status)}
                </td>

                {/* Action Column - View Report Button */}
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => handleViewReport(session.id)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  >
                    View Report
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
