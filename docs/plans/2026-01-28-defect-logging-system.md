# Defect Logging System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace conflict detection with runtime defect logging system based on PRD v3.0 Section 6

**Architecture:** Remove proactive conflict detection (ConflictsView, conflictDetection.js). Add defect logging to execution engine that records zero-location failures and stower overrides. Build DefectsView UI to display, filter, and analyze defects with detailed execution traces.

**Tech Stack:** React, Lucide icons, Tailwind CSS, Vite

---

## Task 1: Create Defect Data Model and Storage

**Files:**
- Create: `putaway-prototype/src/utils/defectLogger.js`
- Create: `putaway-prototype/src/data/defects.js`

**Step 1: Create defect logger utility**

```javascript
/**
 * Defect Logger for WMS Putaway Rules Engine
 * Implements PRD v3.0 Section 6.2 - Data Model
 */

/**
 * Defect Types
 */
export const DefectType = {
  ZERO_LOCATIONS: 'ZERO_LOCATIONS',
  STOWER_OVERRIDE: 'STOWER_OVERRIDE'
};

/**
 * Failure Points
 */
export const FailurePoint = {
  PHASE_1: 'Phase 1',
  PHASE_2: 'Phase 2'
};

/**
 * Override Reason Codes (PRD Section 6.1.1)
 */
export const OverrideReasonCodes = [
  { code: 'BIN_DAMAGED', label: 'Bin damaged/blocked' },
  { code: 'CONGESTION', label: 'Congestion/traffic' },
  { code: 'CLOSER_STAGING', label: 'Closer to staging area' },
  { code: 'BETTER_ERGONOMICS', label: 'Better ergonomics' },
  { code: 'OTHER', label: 'Other' }
];

/**
 * Log a defect record
 * @param {Object} defectData - Defect information
 * @returns {Object} - Created defect record
 */
export function logDefect(defectData) {
  const defect = {
    defect_id: generateUUID(),
    timestamp: new Date().toISOString(),
    ...defectData
  };

  // Store in memory (in production, this would POST to backend)
  const existingDefects = getDefects();
  existingDefects.push(defect);
  localStorage.setItem('putaway_defects', JSON.stringify(existingDefects));

  return defect;
}

/**
 * Get all defects from storage
 * @returns {Array} - Array of defect records
 */
export function getDefects() {
  const stored = localStorage.getItem('putaway_defects');
  return stored ? JSON.parse(stored) : [];
}

/**
 * Clear all defects (for testing)
 */
export function clearDefects() {
  localStorage.removeItem('putaway_defects');
}

/**
 * Filter defects by criteria
 * @param {Object} filters - { defectType, dateRange, productId, transactionType, stowerId }
 * @returns {Array} - Filtered defect records
 */
export function filterDefects(filters = {}) {
  let defects = getDefects();

  if (filters.defectType) {
    defects = defects.filter(d => d.defect_type === filters.defectType);
  }

  if (filters.productId) {
    defects = defects.filter(d =>
      d.product_id.toLowerCase().includes(filters.productId.toLowerCase())
    );
  }

  if (filters.transactionType) {
    defects = defects.filter(d => d.transaction_type === filters.transactionType);
  }

  if (filters.stowerId) {
    defects = defects.filter(d =>
      d.stower_id.toLowerCase().includes(filters.stowerId.toLowerCase())
    );
  }

  if (filters.dateRange) {
    const { start, end } = filters.dateRange;
    defects = defects.filter(d => {
      const defectDate = new Date(d.timestamp);
      return defectDate >= start && defectDate <= end;
    });
  }

  // Sort by timestamp descending (newest first)
  return defects.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

/**
 * Get defects within last N days (for retention simulation)
 * @param {number} days - Number of days to retain
 * @returns {Array} - Defects within retention period
 */
export function getDefectsWithinRetention(days = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return getDefects().filter(d => new Date(d.timestamp) >= cutoffDate);
}

// Helper: Generate UUID
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
```

**Step 2: Create sample defect data**

Create: `putaway-prototype/src/data/defects.js`

```javascript
/**
 * Sample defect data for testing
 * PRD Section 6.2 - Defect Record Schema
 */

export const sampleDefects = [
  {
    defect_id: 'def-001',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    defect_type: 'ZERO_LOCATIONS',
    transaction_type: 'Inbound PO',
    stower_id: 'STW-105',
    product_id: 'SKU-HAZ-789',
    matched_constraints: ['CONS-001', 'CONS-005'],
    matched_preference: null,
    valid_locations: [],
    recommended_location: null,
    actual_location: 'BIN-Z-01-03',
    override_reason_code: 'OTHER',
    override_reason_text: 'Manual assignment due to system failure',
    rule_trace: {
      phase1_result: {
        initial_location_count: 500,
        constraints_applied: [
          {
            rule_id: 'CONS-001',
            rule_name: 'Merchant Zones',
            action: 'Limit To',
            locations_after: 120
          },
          {
            rule_id: 'CONS-005',
            rule_name: 'Heavy Item Safety',
            action: 'Limit To',
            locations_after: 0
          }
        ],
        final_location_count: 0,
        failure_point: 'Phase 1'
      },
      phase2_result: null
    }
  },
  {
    defect_id: 'def-002',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    defect_type: 'STOWER_OVERRIDE',
    transaction_type: 'Inbound PO',
    stower_id: 'STW-107',
    product_id: 'SKU-PACT-456',
    matched_constraints: ['CONS-001'],
    matched_preference: 'PREF-004',
    valid_locations: ['BIN-A-01-05', 'BIN-A-02-10', 'BIN-A-03-15'],
    recommended_location: 'BIN-A-01-05',
    actual_location: 'BIN-A-02-10',
    override_reason_code: 'CONGESTION',
    override_reason_text: null,
    rule_trace: null
  },
  {
    defect_id: 'def-003',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    defect_type: 'ZERO_LOCATIONS',
    transaction_type: 'Replenishment',
    stower_id: 'STW-112',
    product_id: 'SKU-FAST-123',
    matched_constraints: [],
    matched_preference: null,
    valid_locations: [],
    recommended_location: null,
    actual_location: 'BIN-B-05-20',
    override_reason_code: 'BIN_DAMAGED',
    override_reason_text: null,
    rule_trace: {
      phase1_result: {
        initial_location_count: 200,
        final_location_count: 200
      },
      phase2_result: {
        preferences_attempted: [
          {
            priority: 1,
            rule_id: 'PREF-003',
            rule_name: 'FEFO Placement',
            matched: false,
            reason: 'Product not lot-controlled'
          },
          {
            priority: 2,
            rule_id: 'PREF-004',
            rule_name: 'SKU Consolidation',
            matched: true,
            candidates_found: 0,
            reason: 'No locations match location criteria'
          }
        ],
        failure_point: 'Phase 2'
      }
    }
  }
];
```

**Step 3: Commit**

```bash
git add putaway-prototype/src/utils/defectLogger.js putaway-prototype/src/data/defects.js
git commit -m "feat: add defect logging data model and sample data"
```

---

## Task 2: Update Execution Engine to Log Defects

**Files:**
- Modify: `putaway-prototype/src/utils/executionEngine.js`

**Step 1: Import defect logger**

Add at top of file:

```javascript
import { logDefect, DefectType, FailurePoint } from './defectLogger.js';
```

**Step 2: Update Phase 1 failure handling**

Find the Phase 1 failure return (around line 110-120) and replace:

```javascript
if (validLocations.length === 0) {
  logs.push({
    phase: 1,
    type: 'error',
    message: 'Phase 1 Failed: No valid locations after constraints',
    details: {}
  });

  return {
    success: false,
    error: 'No valid locations after constraints',
    logs
  };
}
```

With:

```javascript
if (validLocations.length === 0) {
  logs.push({
    phase: 1,
    type: 'error',
    message: 'Phase 1 Failed: No valid locations after constraints',
    details: {}
  });

  // Log defect (PRD Section 6.1.1 - Zero Valid Locations)
  const ruleTrace = {
    phase1_result: {
      initial_location_count: locations.length,
      constraints_applied: activeConstraints.map(c => ({
        rule_id: c.id,
        rule_name: c.name || 'Unnamed Constraint',
        action: c.action,
        locations_after: 0 // Would track per-constraint in production
      })),
      final_location_count: 0,
      failure_point: FailurePoint.PHASE_1
    },
    phase2_result: null
  };

  // In real system, this would trigger stower UI to prompt for reason code + manual scan
  // For now, we'll simulate with default values
  logDefect({
    defect_type: DefectType.ZERO_LOCATIONS,
    transaction_type: transactionType,
    stower_id: 'SIMULATED', // Would come from session context
    product_id: product.sku_id,
    matched_constraints: activeConstraints.map(c => c.id),
    matched_preference: null,
    valid_locations: [],
    recommended_location: null,
    actual_location: null, // Would be set after stower scans
    override_reason_code: null,
    override_reason_text: null,
    rule_trace: ruleTrace
  });

  return {
    success: false,
    error: 'No valid locations after constraints',
    logs,
    defectLogged: true
  };
}
```

**Step 3: Update Phase 2 failure handling**

Find the Phase 2 exhaustion return (around line 250-260) and replace:

```javascript
logs.push({
  phase: 2,
  type: 'error',
  message: 'Phase 2 Failed: All preferences exhausted',
  details: {}
});

return {
  success: false,
  error: 'No matching preference',
  logs
};
```

With:

```javascript
logs.push({
  phase: 2,
  type: 'error',
  message: 'Phase 2 Failed: All preferences exhausted',
  details: {}
});

// Log defect (PRD Section 6.1.1 - Zero Valid Locations, Phase 2 failure)
const ruleTrace = {
  phase1_result: {
    initial_location_count: locations.length,
    final_location_count: validLocations.length
  },
  phase2_result: {
    preferences_attempted: activePreferences.map(p => ({
      priority: p.priority,
      rule_id: p.id,
      rule_name: p.name || 'Unnamed Preference',
      matched: matchesProductCriteria(product, p.productCriteria),
      candidates_found: 0,
      reason: 'No locations match location criteria'
    })),
    failure_point: FailurePoint.PHASE_2
  }
};

logDefect({
  defect_type: DefectType.ZERO_LOCATIONS,
  transaction_type: transactionType,
  stower_id: 'SIMULATED',
  product_id: product.sku_id,
  matched_constraints: constraints.filter(c => c.enabled && isInScope(c.scope, transactionType)).map(c => c.id),
  matched_preference: null,
  valid_locations: [],
  recommended_location: null,
  actual_location: null,
  override_reason_code: null,
  override_reason_text: null,
  rule_trace: ruleTrace
});

return {
  success: false,
  error: 'No matching preference',
  logs,
  defectLogged: true
};
```

**Step 4: Add override simulation function**

Add at end of file:

```javascript
/**
 * Simulate stower override (for testing defect logging)
 * In production, this would be triggered by stower scanning different location
 * @param {Object} executionResult - Result from executePutaway
 * @param {string} actualLocation - Location stower scanned
 * @param {string} reasonCode - Override reason code
 * @param {string} reasonText - Free text if reasonCode = 'OTHER'
 */
export function simulateStowerOverride(executionResult, product, transactionType, actualLocation, reasonCode, reasonText = null) {
  if (!executionResult.success || !executionResult.assignedLocation) {
    return; // No override possible if no recommendation
  }

  if (executionResult.assignedLocation.location_id === actualLocation) {
    return; // Not an override if same location
  }

  // Log override defect (PRD Section 6.1.2)
  logDefect({
    defect_type: DefectType.STOWER_OVERRIDE,
    transaction_type: transactionType,
    stower_id: 'SIMULATED',
    product_id: product.sku_id,
    matched_constraints: executionResult.matchedConstraints || [],
    matched_preference: executionResult.winningPreference?.id || null,
    valid_locations: executionResult.validLocations?.map(l => l.location_id) || [],
    recommended_location: executionResult.assignedLocation.location_id,
    actual_location: actualLocation,
    override_reason_code: reasonCode,
    override_reason_text: reasonText,
    rule_trace: null
  });
}
```

**Step 5: Commit**

```bash
git add putaway-prototype/src/utils/executionEngine.js
git commit -m "feat: integrate defect logging into execution engine"
```

---

## Task 3: Create DefectsView Component

**Files:**
- Create: `putaway-prototype/src/components/DefectsView.jsx`

**Step 1: Create main DefectsView component**

```jsx
import { useState, useMemo } from 'react';
import { Calendar, Filter, Download, AlertCircle, FileWarning } from 'lucide-react';
import { getDefects, filterDefects, DefectType, OverrideReasonCodes } from '../utils/defectLogger';
import DefectDetailPanel from './DefectDetailPanel';

export default function DefectsView() {
  const [selectedDefect, setSelectedDefect] = useState(null);
  const [filters, setFilters] = useState({
    defectType: '',
    productId: '',
    transactionType: '',
    stowerId: '',
    dateRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
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
      new Date(d.timestamp).toLocaleString(),
      d.defect_type,
      d.product_id,
      d.transaction_type,
      d.stower_id,
      d.recommended_location || 'N/A',
      d.actual_location || 'N/A',
      d.override_reason_code || 'N/A'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `putaway-defects-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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
              value={filters.defectType}
              onChange={(e) => setFilters({ ...filters, defectType: e.target.value })}
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
              value={filters.productId}
              onChange={(e) => setFilters({ ...filters, productId: e.target.value })}
              placeholder="SKU-123..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Transaction Type
            </label>
            <select
              value={filters.transactionType}
              onChange={(e) => setFilters({ ...filters, transactionType: e.target.value })}
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
              value={filters.stowerId}
              onChange={(e) => setFilters({ ...filters, stowerId: e.target.value })}
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
                    start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
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
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
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
                      {defect.override_reason_code
                        ? OverrideReasonCodes.find(r => r.code === defect.override_reason_code)?.label || defect.override_reason_code
                        : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {defects.length > 50 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Showing {Math.min(50, defects.length)} of {defects.length} defects
            </p>
            <div className="text-sm text-slate-500">
              Pagination: 50 records per page (PRD Section 6.3.2)
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
```

**Step 2: Commit**

```bash
git add putaway-prototype/src/components/DefectsView.jsx
git commit -m "feat: create DefectsView component with filtering and table"
```

---

## Task 4: Create DefectDetailPanel Component

**Files:**
- Create: `putaway-prototype/src/components/DefectDetailPanel.jsx`

**Step 1: Create detail panel component**

```jsx
import { X, AlertCircle, FileWarning, ChevronRight } from 'lucide-react';
import { DefectType, OverrideReasonCodes } from '../utils/defectLogger';

export default function DefectDetailPanel({ defect, onClose }) {
  const isZeroLocation = defect.defect_type === DefectType.ZERO_LOCATIONS;

  return (
    <div className="fixed inset-y-0 right-0 w-2/3 bg-white shadow-2xl border-l border-slate-200 overflow-y-auto z-50">
      {/* Header */}
      <div className="sticky top-0 bg-slate-900 text-white p-6 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            {isZeroLocation ? (
              <FileWarning className="w-6 h-6 text-red-400" />
            ) : (
              <AlertCircle className="w-6 h-6 text-yellow-400" />
            )}
            Defect Details
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            {defect.defect_id} • {new Date(defect.timestamp).toLocaleString()}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Product Context */}
        <section>
          <h4 className="text-lg font-semibold text-slate-800 mb-3">Product Context</h4>
          <div className="bg-slate-50 p-4 rounded-lg space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-600 mb-1">Product ID</p>
                <p className="text-sm font-mono font-medium text-slate-900">{defect.product_id}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Transaction Type</p>
                <p className="text-sm text-slate-900">{defect.transaction_type}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Stower</p>
                <p className="text-sm font-mono text-slate-900">{defect.stower_id}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Defect Type</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  isZeroLocation
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {isZeroLocation ? 'Zero Locations' : 'Stower Override'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Rule Execution Trace (for Zero-Location defects) */}
        {isZeroLocation && defect.rule_trace && (
          <section>
            <h4 className="text-lg font-semibold text-slate-800 mb-3">Rule Execution Trace</h4>

            {/* Phase 1 Result */}
            {defect.rule_trace.phase1_result && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
                <h5 className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm">
                    1
                  </span>
                  Phase 1: Hard Constraints
                </h5>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-600">Initial candidates:</span>
                    <span className="font-bold text-slate-900">
                      {defect.rule_trace.phase1_result.initial_location_count} locations
                    </span>
                  </div>

                  {defect.rule_trace.phase1_result.constraints_applied?.map((constraint, idx) => (
                    <div key={idx} className="flex items-center gap-2 pl-4">
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-700">
                        After <span className="font-medium">{constraint.rule_name}</span> ({constraint.action}):
                      </span>
                      <span className={`font-bold text-sm ${
                        constraint.locations_after === 0 ? 'text-red-600' : 'text-slate-900'
                      }`}>
                        {constraint.locations_after} locations
                      </span>
                    </div>
                  ))}

                  <div className="flex items-center gap-2 text-sm pt-2 border-t border-red-200">
                    <span className="text-red-700 font-medium">Final result:</span>
                    <span className="font-bold text-red-900">
                      {defect.rule_trace.phase1_result.final_location_count} locations
                    </span>
                    {defect.rule_trace.phase1_result.failure_point === 'Phase 1' && (
                      <span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded-full font-bold">
                        FAILED HERE
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Phase 2 Result */}
            {defect.rule_trace.phase2_result && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <h5 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-sm">
                    2
                  </span>
                  Phase 2: Preferences
                </h5>

                <div className="space-y-2">
                  {defect.rule_trace.phase2_result.preferences_attempted?.map((pref, idx) => (
                    <div key={idx} className="bg-white p-3 rounded border border-yellow-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-900">
                          Priority {pref.priority}: {pref.rule_name}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          pref.matched
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {pref.matched ? 'Matched' : 'Skipped'}
                        </span>
                      </div>
                      {pref.matched && (
                        <div className="text-xs text-slate-600">
                          Candidates found: <span className="font-bold text-red-600">{pref.candidates_found}</span>
                          {pref.reason && ` • ${pref.reason}`}
                        </div>
                      )}
                      {!pref.matched && pref.reason && (
                        <div className="text-xs text-slate-600">{pref.reason}</div>
                      )}
                    </div>
                  ))}

                  {defect.rule_trace.phase2_result.failure_point === 'Phase 2' && (
                    <div className="mt-3 px-3 py-2 bg-yellow-600 text-white text-sm rounded font-medium">
                      ⚠️ All preferences exhausted - No valid locations
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        {/* Location Context */}
        <section>
          <h4 className="text-lg font-semibold text-slate-800 mb-3">Location Context</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-xs text-slate-600 mb-2">Recommended Location</p>
              <p className="text-lg font-mono font-bold text-slate-900">
                {defect.recommended_location || 'None (Zero Locations)'}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-xs text-slate-600 mb-2">Actual Location</p>
              <p className="text-lg font-mono font-bold text-green-700">
                {defect.actual_location || 'Not yet scanned'}
              </p>
            </div>
          </div>

          {/* Valid Locations List */}
          {defect.valid_locations && defect.valid_locations.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-slate-600 mb-2">
                Valid locations ({defect.valid_locations.length}):
              </p>
              <div className="bg-slate-50 p-3 rounded-lg max-h-40 overflow-y-auto">
                <div className="flex flex-wrap gap-2">
                  {defect.valid_locations.map((loc, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono text-slate-700"
                    >
                      {loc}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Override Context */}
        {!isZeroLocation && (
          <section>
            <h4 className="text-lg font-semibold text-slate-800 mb-3">Override Context</h4>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-600 mb-1">Reason Code</p>
                  <p className="text-sm font-medium text-slate-900">
                    {OverrideReasonCodes.find(r => r.code === defect.override_reason_code)?.label || defect.override_reason_code}
                  </p>
                </div>
                {defect.override_reason_text && (
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Additional Details</p>
                    <p className="text-sm text-slate-700 italic">{defect.override_reason_text}</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Matched Rules */}
        <section>
          <h4 className="text-lg font-semibold text-slate-800 mb-3">Matched Rules</h4>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-slate-600 mb-2">Constraints Applied:</p>
              <div className="flex flex-wrap gap-2">
                {defect.matched_constraints.length === 0 ? (
                  <span className="text-sm text-slate-500 italic">None</span>
                ) : (
                  defect.matched_constraints.map((ruleId, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                    >
                      {ruleId}
                    </span>
                  ))
                )}
              </div>
            </div>

            {defect.matched_preference && (
              <div>
                <p className="text-sm text-slate-600 mb-2">Winning Preference:</p>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                  {defect.matched_preference}
                </span>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add putaway-prototype/src/components/DefectDetailPanel.jsx
git commit -m "feat: create DefectDetailPanel with rule trace visualization"
```

---

## Task 5: Update App Navigation

**Files:**
- Modify: `putaway-prototype/src/App.jsx`

**Step 1: Import DefectsView**

Replace import of ConflictsView with DefectsView:

```javascript
import DefectsView from './components/DefectsView';
```

**Step 2: Update tab switcher**

Replace the "Conflicts" tab with "Defects" tab:

```jsx
<button
  onClick={() => setActiveTab('defects')}
  className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
    activeTab === 'defects'
      ? 'bg-red-600 text-white'
      : 'text-slate-400 hover:text-white'
  }`}
>
  <AlertTriangle className="w-4 h-4" />
  Defects
</button>
```

**Step 3: Update main content rendering**

Replace ConflictsView with DefectsView:

```jsx
{activeTab === 'defects' && <DefectsView />}
```

**Step 4: Remove conflicts state**

Remove the useRules conflicts reference and totalConflicts calculation:

```javascript
// Remove these lines:
const { conflicts } = useRules();
const totalConflicts = conflicts.selfConflicts.length + conflicts.interRuleConflicts.length;
const errorCount = [...conflicts.selfConflicts, ...conflicts.interRuleConflicts].filter(c => c.severity === 'error').length;

// Remove the badge logic from Defects button (or update to show defect count)
```

**Step 5: Update header version**

```jsx
<p className="text-xs text-slate-400">PRD v3.0 • Defect Logging System</p>
```

**Step 6: Commit**

```bash
git add putaway-prototype/src/App.jsx
git commit -m "feat: replace conflicts tab with defects tab"
```

---

## Task 6: Update SimulatorView to Include Override Simulation

**Files:**
- Modify: `putaway-prototype/src/components/SimulatorView.jsx`

**Step 1: Add import for override simulation**

```javascript
import { simulateStowerOverride } from '../utils/executionEngine';
import { OverrideReasonCodes } from '../utils/defectLogger';
```

**Step 2: Add override simulation UI**

After the execution result is displayed (find the ResultCard component), add an override simulation section:

```jsx
{result.success && (
  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
    <h4 className="font-semibold text-slate-800 mb-3">Simulate Stower Override</h4>
    <p className="text-sm text-slate-600 mb-3">
      Test defect logging by simulating a stower scanning a different location
    </p>

    <div className="flex gap-3">
      <input
        type="text"
        placeholder="Actual location (e.g., BIN-X-01-01)"
        className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm"
        id="override-location"
      />
      <select
        className="px-3 py-2 border border-slate-300 rounded-md text-sm"
        id="override-reason"
      >
        {OverrideReasonCodes.map(reason => (
          <option key={reason.code} value={reason.code}>
            {reason.label}
          </option>
        ))}
      </select>
      <button
        onClick={() => {
          const location = document.getElementById('override-location').value;
          const reason = document.getElementById('override-reason').value;
          if (location && location !== result.assignedLocation.location_id) {
            simulateStowerOverride(result, product, transactionType, location, reason);
            toast.success('Override defect logged!');
          } else {
            toast.error('Location must be different from recommended');
          }
        }}
        className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm font-medium"
      >
        Log Override
      </button>
    </div>
  </div>
)}
```

**Step 3: Commit**

```bash
git add putaway-prototype/src/components/SimulatorView.jsx
git commit -m "feat: add override simulation to simulator view"
```

---

## Task 7: Load Sample Defects on App Start

**Files:**
- Modify: `putaway-prototype/src/main.jsx`

**Step 1: Import sample defects and logger**

```javascript
import { sampleDefects } from './data/defects';
import { logDefect, clearDefects } from './utils/defectLogger';
```

**Step 2: Load sample data**

Add before ReactDOM.createRoot:

```javascript
// Load sample defects on first run
if (!localStorage.getItem('putaway_defects')) {
  sampleDefects.forEach(defect => {
    // Log each sample defect (without generating new IDs)
    localStorage.setItem('putaway_defects', JSON.stringify(sampleDefects));
  });
  console.log('✅ Loaded', sampleDefects.length, 'sample defects');
}
```

**Step 3: Commit**

```bash
git add putaway-prototype/src/main.jsx
git commit -m "feat: load sample defects on app initialization"
```

---

## Task 8: Remove Conflict Detection Files

**Files:**
- Delete: `putaway-prototype/src/utils/conflictDetection.js`
- Delete: `putaway-prototype/src/components/ConflictsView.jsx`
- Delete: `putaway-prototype/src/components/ConflictPanel.jsx`

**Step 1: Delete conflict detection files**

```bash
git rm putaway-prototype/src/utils/conflictDetection.js
git rm putaway-prototype/src/components/ConflictsView.jsx
git rm putaway-prototype/src/components/ConflictPanel.jsx
```

**Step 2: Commit**

```bash
git commit -m "refactor: remove conflict detection system"
```

---

## Task 9: Update RulesContext to Remove Conflicts

**Files:**
- Modify: `putaway-prototype/src/context/RulesContext.jsx`

**Step 1: Remove conflict detection logic**

Find and remove all references to:
- `conflicts` state
- `detectConflicts()` function
- Conflict detection imports from `utils/conflictDetection.js`

**Step 2: Remove from provider value**

Remove `conflicts` from the context provider value.

**Step 3: Commit**

```bash
git add putaway-prototype/src/context/RulesContext.jsx
git commit -m "refactor: remove conflict detection from RulesContext"
```

---

## Task 10: Update README

**Files:**
- Modify: `putaway-prototype/README.md`

**Step 1: Update README**

Replace conflict detection section with defect logging section:

```markdown
## Features

### ✅ Phase 1 Prototype (PRD v3.0)

- **Hard Constraints Configuration**: Define non-negotiable location filters
- **Preferences Configuration**: Priority-based location selection strategies
- **Order By Strategies**: 9 sorting strategies (FEFO, SKU consolidation, fill strategies, etc.)
- **Execution Engine**: Two-Phase Funnel Model implementation
- **Simulator**: Test rules against product scenarios
- **Defect Logging**: Runtime exception tracking
  - Zero valid locations (Phase 1/Phase 2 failures)
  - Stower overrides with reason codes
  - Detailed execution traces
  - Filtering and CSV export

### 🚧 Future Phases

- Stower mobile UI for override capture
- Real-time dashboard metrics
- Historical reports and analytics
- Backend API integration
- 90-day retention and archival

## Navigation

- **Configuration**: Define constraints and preferences
- **Defects**: View and analyze runtime exceptions
- **Simulator**: Test putaway scenarios

## Defect Logging

The system records two types of defects:

1. **Zero Valid Locations**: When the engine cannot recommend any location
   - Tracks which rules eliminated locations
   - Shows failure point (Phase 1 or Phase 2)
   - Requires stower to manually select location with reason code

2. **Stower Override**: When stower scans a different location than recommended
   - Captures override reason code
   - Records both recommended and actual locations
   - Tracks which rules were involved

All defects include:
- Product context
- Rule execution trace
- Location details
- Override reason (if applicable)

Retention: Rolling 90-day window (simulated in localStorage)
```

**Step 2: Commit**

```bash
git add putaway-prototype/README.md
git commit -m "docs: update README for defect logging system"
```

---

## Task 11: Final Testing and Build

**Step 1: Test the application**

```bash
cd putaway-prototype
npm run dev
```

Manual test checklist:
- [ ] Defects tab displays sample defects
- [ ] Filtering works (defect type, product, transaction, stower, date range)
- [ ] Clicking defect opens detail panel
- [ ] Detail panel shows rule trace for zero-location defects
- [ ] CSV export downloads file
- [ ] Simulator can log override defects
- [ ] Execution engine logs defects on zero-location failures

**Step 2: Build for production**

```bash
npm run build
```

Expected: Clean build with no errors

**Step 3: Test production build**

```bash
npm run preview
```

Expected: App works correctly in production mode

**Step 4: Commit**

```bash
git add .
git commit -m "test: verify defect logging system functionality"
```

---

## Task 12: Deploy to GitHub Pages

**Step 1: Build and deploy**

```bash
npm run build
git add dist -f
git commit -m "build: production build for GitHub Pages"
git push origin main
```

**Step 2: Verify deployment**

Visit: https://xuhengjack925.github.io/wms_putaway/

Expected: Defect logging system working on live site

**Step 3: Final commit**

```bash
git commit -m "deploy: defect logging system to GitHub Pages" --allow-empty
git push origin main
```

---

## Summary

This plan transforms the prototype from proactive conflict detection to reactive defect logging:

**Removed:**
- Conflict detection algorithm
- ConflictsView UI
- Inter-rule and self-conflict analysis

**Added:**
- Defect data model (zero-locations + stower override)
- DefectLogger utility with localStorage persistence
- DefectsView with filtering, stats dashboard, and CSV export
- DefectDetailPanel with rule trace visualization
- Integration into execution engine
- Override simulation in Simulator

**Benefits:**
- Simpler UX (no abstract conflicts to resolve)
- Real-world feedback from actual putaway attempts
- Clear action items for SMEs (which rules cause failures)
- Never blocks warehouse work (stowers can always override)

**Alignment with PRD v3.0:**
- Section 6.1: Defect types implemented
- Section 6.2: Data model and rule trace structure
- Section 6.3: Defect UI (list, detail, filters, reports)
- Section 5: Updated logical flow with defect logging hooks
