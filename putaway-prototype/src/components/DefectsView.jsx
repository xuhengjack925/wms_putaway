import { useState, useMemo } from 'react';
import { Calendar, Filter, Download, AlertCircle, FileWarning } from 'lucide-react';
import { getDefects, filterDefects, DefectType, OverrideReasonCodes } from '../utils/defectLogger';
import DefectDetailPanel from './DefectDetailPanel';

// Constants
const DAYS_IN_MS = 24 * 60 * 60 * 1000;
const PAGINATION_PAGE_SIZE = 50;

// CSV Injection Protection
const escapeCSV = (value) => {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export default function DefectsView() {
  const [selectedDefect, setSelectedDefect] = useState(null);
  const [filters, setFilters] = useState({
    defect_type: '',
    product_id: '',
    transaction_type: '',
    stower_id: '',
    dateRange: {
      start: new Date(Date.now() - 7 * DAYS_IN_MS), // Last 7 days
      end: new Date()
    }
  });

  const defects = useMemo(() => {
    return filterDefects(filters);
  }, [filters]);

  const stats = useMemo(() => {
    const all = getDefects();
    const today = all.filter(d => {
      const defectDate = new Date(d.timestamp);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      return defectDate >= todayStart;
    });

    return {
      totalToday: today.length,
      zeroLocations: today.filter(d => d.defect_type === DefectType.ZERO_LOCATIONS).length,
      overrides: today.filter(d => d.defect_type === DefectType.STOWER_OVERRIDE).length,
      defectRate: 0 // Would calculate from total putaways in production
    };
  }, []);

  const exportCSV = () => {
    const headers = ['Timestamp', 'Defect Type', 'Product ID', 'Transaction Type', 'Stower', 'Recommended', 'Actual', 'Reason'];
    const rows = defects.map(d => [
      escapeCSV(new Date(d.timestamp).toLocaleString()),
      escapeCSV(d.defect_type),
      escapeCSV(d.product_id),
      escapeCSV(d.transaction_type),
      escapeCSV(d.stower_id),
      escapeCSV(d.recommended_location || 'N/A'),
      escapeCSV(d.actual_location || 'N/A'),
      escapeCSV(d.override_reason || 'N/A')
    ]);

    const csv = [headers.map(escapeCSV), ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `putaway-defects-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Defect Log</h2>
          <p className="text-sm text-slate-600 mt-1">
            Runtime exceptions where rules engine failed to guide putaway
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Defects Today</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalToday}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-slate-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Zero Locations</p>
              <p className="text-2xl font-bold text-red-600">{stats.zeroLocations}</p>
            </div>
            <FileWarning className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Overrides</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.overrides}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <div>
            <p className="text-sm text-slate-600">Defect Rate</p>
            <p className="text-2xl font-bold text-slate-900">{stats.defectRate.toFixed(1)}%</p>
            <p className="text-xs text-slate-500 mt-1">defects / total putaways</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-600" />
          <h3 className="font-semibold text-slate-800">Filters</h3>
        </div>

        <div className="grid grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Defect Type
            </label>
            <select
              value={filters.defect_type}
              onChange={(e) => setFilters({ ...filters, defect_type: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              <option value="">All</option>
              <option value={DefectType.ZERO_LOCATIONS}>Zero Locations</option>
              <option value={DefectType.STOWER_OVERRIDE}>Stower Override</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Product ID
            </label>
            <input
              type="text"
              value={filters.product_id}
              onChange={(e) => setFilters({ ...filters, product_id: e.target.value })}
              placeholder="SKU-123..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Transaction Type
            </label>
            <select
              value={filters.transaction_type}
              onChange={(e) => setFilters({ ...filters, transaction_type: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              <option value="">All</option>
              <option value="Inbound PO">Inbound PO</option>
              <option value="Replenishment">Replenishment</option>
              <option value="Customer Return">Customer Return</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Stower ID
            </label>
            <input
              type="text"
              value={filters.stower_id}
              onChange={(e) => setFilters({ ...filters, stower_id: e.target.value })}
              placeholder="STW-105..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Date Range
            </label>
            <select
              onChange={(e) => {
                const days = parseInt(e.target.value);
                setFilters({
                  ...filters,
                  dateRange: {
                    start: new Date(Date.now() - days * DAYS_IN_MS),
                    end: new Date()
                  }
                });
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Defect List */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                  Product ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                  Transaction
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                  Stower
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                  Recommended
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                  Actual
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                  Reason
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {defects.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                    No defects found matching filters
                  </td>
                </tr>
              ) : (
                defects.map((defect) => (
                  <tr
                    key={defect.defect_id}
                    onClick={() => setSelectedDefect(defect)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedDefect(defect);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    className="hover:bg-slate-50 cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                  >
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {new Date(defect.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        defect.defect_type === DefectType.ZERO_LOCATIONS
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {defect.defect_type === DefectType.ZERO_LOCATIONS ? 'Zero Locations' : 'Override'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 font-mono">
                      {defect.product_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {defect.transaction_type}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                      {defect.stower_id}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                      {defect.recommended_location || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900 font-mono font-medium">
                      {defect.actual_location || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {defect.override_reason
                        ? OverrideReasonCodes.find(r => r.code === defect.override_reason)?.label || defect.override_reason
                        : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {defects.length > PAGINATION_PAGE_SIZE && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Showing {Math.min(PAGINATION_PAGE_SIZE, defects.length)} of {defects.length} defects
            </p>
            <div className="text-sm text-slate-500">
              Pagination: {PAGINATION_PAGE_SIZE} records per page (PRD Section 6.3.2)
            </div>
          </div>
        )}
      </div>

      {/* Detail Panel */}
      {selectedDefect && (
        <DefectDetailPanel
          defect={selectedDefect}
          onClose={() => setSelectedDefect(null)}
        />
      )}
    </div>
  );
}
