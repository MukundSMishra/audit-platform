import React, { useState, useEffect } from 'react';
import { fetchAllAuditSessions } from '../services/reportService';

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
      const data = await fetchAllAuditSessions();
      setSessions(data || []);
      setLoading(false);
    };

    loadSessions();
  }, []);

  // Filter sessions based on search and date filters
  useEffect(() => {
    let filtered = sessions;

    // Filter by client ID (case-insensitive substring match)
    if (searchClient.trim()) {
      filtered = filtered.filter(session =>
        session.client_id?.toLowerCase().includes(searchClient.toLowerCase())
      );
    }

    // Filter by date
    if (filterDate) {
      filtered = filtered.filter(session => session.date === filterDate);
    }

    setFilteredSessions(filtered);
  }, [sessions, searchClient, filterDate]);

  /**
   * Get color-coded badge based on compliance score
   */
  const getScoreBadgeColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  /**
   * Format score display
   */
  const formatScore = (score) => {
    return score ? `${score}%` : 'N/A';
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
                Search Client
              </label>
              <input
                type="text"
                placeholder="Enter client ID..."
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
              Search Client
            </label>
            <input
              type="text"
              placeholder="Enter client ID..."
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
                Date
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Client ID
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Compliance Score
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
                key={session.session_id}
                className="hover:bg-gray-50 transition-colors"
              >
                {/* Date Column */}
                <td className="px-6 py-4 text-sm text-gray-900">
                  {session.date || 'N/A'}
                </td>

                {/* Client ID Column */}
                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                  {session.client_id || 'Unknown'}
                </td>

                {/* Compliance Score Column (Color-coded badge) */}
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`inline-block px-3 py-1 rounded-full font-semibold ${getScoreBadgeColor(
                      session.score
                    )}`}
                  >
                    {formatScore(session.score)}
                  </span>
                </td>

                {/* Status Column */}
                <td className="px-6 py-4 text-sm">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {session.status || 'Pending'}
                  </span>
                </td>

                {/* Action Column - View Report Button */}
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => handleViewReport(session.session_id)}
                    className="inline-flex items-center justify-center p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                    title="View Report"
                    aria-label="View Report"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
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
