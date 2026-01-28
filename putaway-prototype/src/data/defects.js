/**
 * Sample Defect Data
 *
 * Contains realistic examples of putaway defects for testing and demonstration.
 * These can be loaded into localStorage for UI development.
 */

import { DefectType, FailurePoint, STORAGE_KEY } from '../utils/defectLogger';

// Helper to generate timestamps relative to now
const hoursAgo = (hours) => {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
};

export const sampleDefects = [
  {
    defect_id: 'def-001',
    timestamp: hoursAgo(2),
    defect_type: DefectType.ZERO_LOCATIONS,
    failure_point: FailurePoint.PHASE_1,
    product_id: 'PROD-12345',
    transaction_type: 'Inbound PO',
    rule_trace: [
      {
        rule_id: 'constraint-001',
        rule_name: 'Hazmat Segregation',
        rule_type: 'constraint',
        action: 'limit_to',
        product_matched: true,
        locations_before: 150,
        locations_after: 0
      }
    ],
    product_attributes: {
      hazmat_class: 'CLASS_3_FLAMMABLE',
      abc_code: 'A',
      is_oversized: false
    }
  },
  {
    defect_id: 'def-002',
    timestamp: hoursAgo(5),
    defect_type: DefectType.STOWER_OVERRIDE,
    product_id: 'PROD-67890',
    transaction_type: 'Inbound PO',
    stower_id: 'STOWER-42',
    override_reason: 'CONGESTION',
    override_reason_text: 'Slot A-001 appeared available in system but was physically full',
    valid_locations: ['LOC-A-001', 'LOC-A-002', 'LOC-B-015'],
    recommended_location: 'LOC-A-001',
    actual_location: 'LOC-B-015',
    winning_preference: 'Fill by Utilization (High to Low)',
    product_attributes: {
      abc_code: 'A',
      storage_type: 'Pallet Rack'
    }
  },
  {
    defect_id: 'def-003',
    timestamp: hoursAgo(8),
    defect_type: DefectType.ZERO_LOCATIONS,
    failure_point: FailurePoint.PHASE_2,
    product_id: 'PROD-11122',
    transaction_type: 'Replenishment',
    rule_trace: [
      {
        rule_id: 'constraint-001',
        rule_name: 'Zone Restriction',
        rule_type: 'constraint',
        action: 'limit_to',
        product_matched: true,
        locations_before: 150,
        locations_after: 45
      },
      {
        rule_id: 'pref-001',
        rule_name: 'Prefer Lower Levels',
        rule_type: 'preference',
        priority: 1,
        product_matched: true,
        candidates_found: 0
      }
    ],
    product_attributes: {
      abc_code: 'A',
      storage_type: 'Pallet Rack'
    }
  }
];

/**
 * Loads sample defects into localStorage
 * Useful for development and testing
 */
export function loadSampleDefects() {
  try {
    const existingData = localStorage.getItem(STORAGE_KEY);
    const existingDefects = existingData ? JSON.parse(existingData) : [];

    // Avoid duplicates - only add if ID doesn't exist
    const existingIds = new Set(existingDefects.map(d => d.defect_id));
    const newDefects = sampleDefects.filter(d => !existingIds.has(d.defect_id));

    if (newDefects.length > 0) {
      const updatedDefects = [...existingDefects, ...newDefects];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDefects));
      console.log(`Loaded ${newDefects.length} sample defects into localStorage`);
    } else {
      console.log('Sample defects already exist in localStorage');
    }
  } catch (error) {
    console.error('Failed to load sample defects:', error);
  }
}
