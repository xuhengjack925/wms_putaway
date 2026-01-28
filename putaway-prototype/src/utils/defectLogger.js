/**
 * Defect Logger Utility
 *
 * Handles logging and retrieval of putaway defects (runtime failures and stower overrides).
 * Uses localStorage for persistence.
 */

const STORAGE_KEY = 'putaway_defects';
const DEFAULT_RETENTION_DAYS = 90;

// Defect Types
export const DefectType = {
  ZERO_LOCATIONS: 'ZERO_LOCATIONS',    // No valid locations found
  STOWER_OVERRIDE: 'STOWER_OVERRIDE'   // Stower manually overrode recommendation
};

// Failure Point (for ZERO_LOCATIONS defects)
export const FailurePoint = {
  PHASE_1: 'PHASE_1',  // Failed during constraint filtering
  PHASE_2: 'PHASE_2'   // Passed constraints but no preferences matched
};

// Override Reason Codes (for STOWER_OVERRIDE defects)
export const OverrideReasonCodes = [
  { code: 'LOCATION_FULL', label: 'Recommended location is full' },
  { code: 'LOCATION_DAMAGED', label: 'Recommended location is damaged' },
  { code: 'PROXIMITY_PREFERENCE', label: 'Chosen location is closer' },
  { code: 'BATCH_CONSOLIDATION', label: 'Consolidating with existing batch' },
  { code: 'OTHER', label: 'Other reason' }
];

/**
 * Generates a simple UUID v4
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Logs a defect to localStorage
 *
 * @param {Object} defectData - The defect data to log
 * @param {string} defectData.defectType - Type of defect (DefectType)
 * @param {string} defectData.productId - Product ID
 * @param {string} defectData.transactionType - Transaction type
 * @param {string} [defectData.failurePoint] - Failure point (for ZERO_LOCATIONS)
 * @param {Array} [defectData.rule_trace] - Rule trace (for ZERO_LOCATIONS)
 * @param {string} [defectData.stowerId] - Stower ID (for STOWER_OVERRIDE)
 * @param {string} [defectData.overrideReason] - Override reason code (for STOWER_OVERRIDE)
 * @param {Array} [defectData.valid_locations] - Valid locations (for STOWER_OVERRIDE)
 * @param {string} [defectData.recommended_location] - Recommended location (for STOWER_OVERRIDE)
 * @param {string} [defectData.actual_location] - Actual location chosen (for STOWER_OVERRIDE)
 * @returns {Object} The logged defect with id and timestamp
 */
export function logDefect(defectData) {
  const defect = {
    id: generateUUID(),
    timestamp: new Date().toISOString(),
    ...defectData
  };

  const defects = getDefects();
  defects.push(defect);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defects));
  } catch (error) {
    console.error('Failed to log defect to localStorage:', error);
    // Could implement fallback storage strategy here
  }

  return defect;
}

/**
 * Retrieves all defects from localStorage
 *
 * @returns {Array} Array of defect records
 */
export function getDefects() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to retrieve defects from localStorage:', error);
    return [];
  }
}

/**
 * Clears all defects from localStorage (for testing)
 */
export function clearDefects() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear defects from localStorage:', error);
  }
}

/**
 * Filters defects based on provided criteria
 *
 * @param {Object} filters - Filter criteria
 * @param {string} [filters.defectType] - Filter by defect type
 * @param {string} [filters.productId] - Filter by product ID
 * @param {string} [filters.transactionType] - Filter by transaction type
 * @param {string} [filters.stowerId] - Filter by stower ID
 * @param {Object} [filters.dateRange] - Filter by date range
 * @param {Date|string} [filters.dateRange.start] - Start date
 * @param {Date|string} [filters.dateRange.end] - End date
 * @returns {Array} Filtered defects
 */
export function filterDefects(filters = {}) {
  let defects = getDefects();

  if (filters.defectType) {
    defects = defects.filter(d => d.defectType === filters.defectType);
  }

  if (filters.productId) {
    defects = defects.filter(d => d.productId === filters.productId);
  }

  if (filters.transactionType) {
    defects = defects.filter(d => d.transactionType === filters.transactionType);
  }

  if (filters.stowerId) {
    defects = defects.filter(d => d.stowerId === filters.stowerId);
  }

  if (filters.dateRange) {
    const start = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
    const end = filters.dateRange.end ? new Date(filters.dateRange.end) : null;

    defects = defects.filter(d => {
      const defectDate = new Date(d.timestamp);
      if (start && defectDate < start) return false;
      if (end && defectDate > end) return false;
      return true;
    });
  }

  return defects;
}

/**
 * Retrieves defects within the retention period
 *
 * @param {number} days - Number of days to look back (default: 90)
 * @returns {Array} Defects within retention period
 */
export function getDefectsWithinRetention(days = DEFAULT_RETENTION_DAYS) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return filterDefects({
    dateRange: {
      start: cutoffDate
    }
  });
}
