// Transaction Types
export const TRANSACTION_TYPES = [
  { value: 'Any', label: 'Any / All' },
  { value: 'Inbound PO', label: 'Inbound PO' },
  { value: 'Replenishment', label: 'Replenishment' },
  { value: 'Customer Return', label: 'Customer Return' },
  { value: 'Inventory Transfer', label: 'Inventory Transfer' }
];

// Product Criteria Fields (PRD Section 3.1)
export const PRODUCT_CRITERIA_FIELDS = [
  {
    value: 'merchant_id',
    label: 'Merchant ID',
    type: 'string',
    operators: ['=', '!=', 'in']
  },
  {
    value: 'inventory_status',
    label: 'Inventory Status',
    type: 'enum',
    operators: ['='],
    options: ['GOOD', 'DAMAGED', 'QUARANTINE', 'RETURNED']
  },
  {
    value: 'pack_type',
    label: 'Pack Type',
    type: 'enum',
    operators: ['='],
    options: ['UNIT', 'CASE', 'PALLET']
  },
  {
    value: 'abc_code',
    label: 'ABC Code',
    type: 'enum',
    operators: ['='],
    options: ['A', 'B', 'C']
  },
  {
    value: 'is_oversized',
    label: 'Is Oversized',
    type: 'boolean',
    operators: ['=']
  },
  {
    value: 'weight',
    label: 'Weight (kg)',
    type: 'number',
    operators: ['>', '>=', '<', '<=', 'between']
  },
  {
    value: 'hazmat_class',
    label: 'Hazmat Class',
    type: 'enum',
    operators: ['=', '!='],
    options: ['NONE', 'FLAMMABLE', 'CORROSIVE', 'TOXIC', 'OXIDIZER']
  },
  {
    value: 'temp_zone',
    label: 'Temperature Zone',
    type: 'enum',
    operators: ['='],
    options: ['AMBIENT', 'CHILLED', 'FROZEN']
  },
  {
    value: 'sku_id',
    label: 'SKU ID',
    type: 'string',
    operators: ['=', 'in']
  },
  {
    value: 'is_lot_controlled',
    label: 'Lot/Expiry Controlled',
    type: 'boolean',
    operators: ['=']
  }
];

// Location Criteria Fields (PRD Section 3.2)
export const LOCATION_CRITERIA_FIELDS = [
  {
    value: 'zone_id',
    label: 'Zone ID',
    type: 'list',
    operators: ['in'],
    supportsExclude: true
  },
  {
    value: 'location_group_id',
    label: 'Location Group',
    type: 'list',
    operators: ['in'],
    supportsExclude: true
  },
  {
    value: 'storage_type',
    label: 'Storage Type',
    type: 'enum',
    operators: ['='],
    options: ['BIN', 'SHELF', 'RACK', 'FLOOR'],
    supportsExclude: true
  },
  {
    value: 'location_level',
    label: 'Location Level',
    type: 'number',
    operators: ['=', '<=', '>=', 'between'],
    supportsExclude: true
  },
  {
    value: 'bin_status',
    label: 'Bin Status',
    type: 'enum',
    operators: ['='],
    options: ['EMPTY', 'PARTIAL'],
    supportsExclude: false // Only Limit To
  },
  {
    value: 'temp_zone',
    label: 'Temperature Zone',
    type: 'enum',
    operators: ['='],
    options: ['AMBIENT', 'CHILLED', 'FROZEN'],
    supportsExclude: true
  },
  {
    value: 'single_merchant_only',
    label: 'Single Merchant Only',
    type: 'boolean',
    operators: ['='],
    supportsExclude: false // Only Limit To
  },
  {
    value: 'aisle_id',
    label: 'Aisle ID',
    type: 'string',
    operators: ['=', 'in'],
    supportsExclude: true
  }
];

// Sort Strategies (PRD Section 4.3)
export const SORT_STRATEGIES = [
  {
    value: 'expiry_affinity',
    label: 'Prioritize Same Lot/Expiry',
    description: 'Sort bins with same lot/expiry to top (FEFO integrity)',
    requiresLotControl: true
  },
  {
    value: 'sku_match',
    label: 'Prioritize Same SKU',
    description: 'Sort bins with same SKU to top (consolidation)'
  },
  {
    value: 'merchant_affinity',
    label: 'Prioritize Same Merchant',
    description: 'Sort bins with same merchant inventory to top'
  },
  {
    value: 'bin_utilization_desc',
    label: 'Fill Most Full (Top-off)',
    description: 'Sort by utilization DESC (maximize space)'
  },
  {
    value: 'bin_utilization_asc',
    label: 'Fill Least Full (Spread)',
    description: 'Sort by utilization ASC (avoid congestion)'
  },
  {
    value: 'distance_shipping',
    label: 'Closest to Shipping Dock',
    description: 'Sort by dock proximity (fast mover optimization)'
  },
  {
    value: 'cluster_merchant',
    label: 'Cluster by Merchant',
    description: 'Sort by merchant density in aisle (organic zones)',
    requiresAisle: true
  },
  {
    value: 'location_level_asc',
    label: 'Fill Bottom Levels First',
    description: 'Sort by level ASC (ergonomics/safety)'
  },
  {
    value: 'bin_capacity_asc',
    label: 'Smallest Bin First',
    description: 'Sort by capacity ASC (space optimization)'
  }
];

// Operator labels for human-readable display
export const OPERATOR_LABELS = {
  '=': 'is',
  '!=': 'is not',
  '>': 'is greater than',
  '>=': 'is greater than or equal to',
  '<': 'is less than',
  '<=': 'is less than or equal to',
  'between': 'is between',
  'in': 'is in',
  'exists': 'exists'
};

// Rule action types
export const RULE_ACTIONS = {
  LIMIT_TO: 'limit_to',
  EXCLUDE: 'exclude'
};
