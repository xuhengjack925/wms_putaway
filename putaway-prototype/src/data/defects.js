/**
 * Sample Defect Data
 *
 * Contains realistic examples of putaway defects for testing and demonstration.
 * These can be loaded into localStorage for UI development.
 */

import { DefectType, FailurePoint } from '../utils/defectLogger';

// Helper to generate timestamps relative to now
const hoursAgo = (hours) => {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
};

export const sampleDefects = [
  {
    id: 'def-001',
    timestamp: hoursAgo(2),
    defectType: DefectType.ZERO_LOCATIONS,
    failurePoint: FailurePoint.PHASE_1,
    productId: 'PROD-12345',
    transactionType: 'Inbound PO',
    rule_trace: [
      {
        phase: 1,
        rule_id: 'constraint-001',
        rule_name: 'Hazmat Segregation',
        rule_type: 'Hard Constraint',
        condition: {
          if: { hazmat_class: 'CLASS_3_FLAMMABLE' },
          then: { zone_id: ['ZONE-HAZ'] }
        },
        locations_before: 150,
        locations_after: 0,
        eliminated_count: 150,
        reason: 'No locations in required hazmat zone'
      }
    ],
    context: {
      warehouse_id: 'WH-001',
      total_locations_available: 150,
      active_constraints: ['constraint-001', 'constraint-002'],
      product_attributes: {
        hazmat_class: 'CLASS_3_FLAMMABLE',
        abc_code: 'A',
        is_oversized: false
      }
    }
  },
  {
    id: 'def-002',
    timestamp: hoursAgo(5),
    defectType: DefectType.STOWER_OVERRIDE,
    productId: 'PROD-67890',
    transactionType: 'Inbound PO',
    stowerId: 'STOWER-42',
    overrideReason: 'CONGESTION',
    valid_locations: ['LOC-A-001', 'LOC-A-002', 'LOC-B-015'],
    recommended_location: 'LOC-A-001',
    actual_location: 'LOC-B-015',
    context: {
      warehouse_id: 'WH-001',
      recommendation_score: 0.92,
      override_notes: 'Slot A-001 appeared available in system but was physically full',
      product_attributes: {
        abc_code: 'A',
        storage_type: 'Pallet Rack'
      }
    }
  },
  {
    id: 'def-003',
    timestamp: hoursAgo(8),
    defectType: DefectType.ZERO_LOCATIONS,
    failurePoint: FailurePoint.PHASE_2,
    productId: 'PROD-11122',
    transactionType: 'Replenishment',
    rule_trace: [
      {
        phase: 1,
        rule_id: 'constraint-001',
        rule_name: 'Zone Restriction',
        rule_type: 'Hard Constraint',
        condition: {
          if: { abc_code: 'A' },
          then: { zone_id: ['ZONE-PICK'] }
        },
        locations_before: 150,
        locations_after: 45,
        eliminated_count: 105,
        reason: 'Limited to pick zone for A items'
      },
      {
        phase: 2,
        rule_id: 'pref-001',
        rule_name: 'Prefer Lower Levels',
        rule_type: 'Preference',
        priority: 1,
        condition: {
          if: { abc_code: 'A' },
          then: { location_level: ['LEVEL_1', 'LEVEL_2'] }
        },
        locations_before: 45,
        locations_after: 0,
        eliminated_count: 45,
        reason: 'No locations found at preferred levels (all higher levels)'
      }
    ],
    context: {
      warehouse_id: 'WH-001',
      total_locations_available: 150,
      locations_after_constraints: 45,
      active_preferences: ['pref-001'],
      product_attributes: {
        abc_code: 'A',
        storage_type: 'Pallet Rack'
      },
      failure_analysis: 'All valid locations are on higher levels (3-5), but preference rule requires levels 1-2'
    }
  }
];

/**
 * Loads sample defects into localStorage
 * Useful for development and testing
 */
export function loadSampleDefects() {
  try {
    const existingData = localStorage.getItem('putaway_defects');
    const existingDefects = existingData ? JSON.parse(existingData) : [];

    // Avoid duplicates - only add if ID doesn't exist
    const existingIds = new Set(existingDefects.map(d => d.id));
    const newDefects = sampleDefects.filter(d => !existingIds.has(d.id));

    if (newDefects.length > 0) {
      const updatedDefects = [...existingDefects, ...newDefects];
      localStorage.setItem('putaway_defects', JSON.stringify(updatedDefects));
      console.log(`Loaded ${newDefects.length} sample defects into localStorage`);
    } else {
      console.log('Sample defects already exist in localStorage');
    }
  } catch (error) {
    console.error('Failed to load sample defects:', error);
  }
}
