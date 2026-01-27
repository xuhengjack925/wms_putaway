/**
 * Pre-configured test scenarios for demonstrating putaway logic
 * Each scenario tests specific rules and edge cases from the PRD
 */

export const TEST_SCENARIOS = [
  {
    id: 'scenario-1',
    name: 'Happy Path: Fast Mover to Golden Zone',
    description: 'ABC-A product should be routed to Golden Zone with optimal picking location',
    product: {
      sku_id: 'TEST-FAST-001',
      merchant_id: 'Nike',
      pack_type: 'UNIT',
      weight: 5,
      abc_code: 'A',
      is_oversized: false,
      hazmat_class: 'NONE',
      temp_zone: 'AMBIENT',
      inventory_status: 'GOOD',
      is_lot_controlled: false,
      lot_id: null
    },
    transactionType: 'Inbound PO',
    cartContext: { cartId: null, lastPutLocation: null },
    expectedBehavior: 'Should match Fast Mover preference (Priority #2), route to Zone A Golden, sorted by distance_shipping'
  },
  {
    id: 'scenario-2',
    name: 'Hard Constraint: Heavy Item Safety',
    description: 'Heavy pallet must go to ground level (≤2) for safety',
    product: {
      sku_id: 'TEST-HEAVY-001',
      merchant_id: 'Pact',
      pack_type: 'PALLET',
      weight: 50,
      abc_code: 'C',
      is_oversized: true,
      hazmat_class: 'NONE',
      temp_zone: 'AMBIENT',
      inventory_status: 'GOOD',
      is_lot_controlled: false,
      lot_id: null
    },
    transactionType: 'Inbound PO',
    cartContext: { cartId: null, lastPutLocation: null },
    expectedBehavior: 'Heavy Item Safety constraint filters to level ≤2 only'
  },
  {
    id: 'scenario-3',
    name: 'Hard Constraint: Hazmat Isolation',
    description: 'Flammable product must be isolated to Hazmat Cage',
    product: {
      sku_id: 'TEST-HAZ-001',
      merchant_id: 'ChemCorp',
      pack_type: 'UNIT',
      weight: 8,
      abc_code: 'B',
      is_oversized: false,
      hazmat_class: 'FLAMMABLE',
      temp_zone: 'AMBIENT',
      inventory_status: 'GOOD',
      is_lot_controlled: false,
      lot_id: null
    },
    transactionType: 'Inbound PO',
    cartContext: { cartId: null, lastPutLocation: null },
    expectedBehavior: 'Hazmat Isolation constraint limits to Hazmat_Cage zone only'
  },
  {
    id: 'scenario-4',
    name: 'Cart Consolidation: Follow the Leader',
    description: 'Second item in cart should follow first item to same location',
    product: {
      sku_id: 'TEST-FAST-001',
      merchant_id: 'Nike',
      pack_type: 'UNIT',
      weight: 5,
      abc_code: 'A',
      is_oversized: false,
      hazmat_class: 'NONE',
      temp_zone: 'AMBIENT',
      inventory_status: 'GOOD',
      is_lot_controlled: false,
      lot_id: null
    },
    transactionType: 'Inbound PO',
    cartContext: { cartId: 'CART-001', lastPutLocation: 'BIN-005' },
    expectedBehavior: 'Cart Consolidation preference checks BIN-005 first, uses it if available'
  },
  {
    id: 'scenario-5',
    name: 'Lot Affinity: FEFO Consolidation',
    description: 'Lot-controlled item with existing lot should consolidate',
    product: {
      sku_id: 'TEST-LOT-001',
      merchant_id: 'PharmaCo',
      pack_type: 'UNIT',
      weight: 3,
      abc_code: 'A',
      is_oversized: false,
      hazmat_class: 'NONE',
      temp_zone: 'CHILLED',
      inventory_status: 'GOOD',
      is_lot_controlled: true,
      lot_id: 'LOT-A-3'
    },
    transactionType: 'Inbound PO',
    cartContext: { cartId: null, lastPutLocation: null },
    expectedBehavior: 'Should prefer locations with same lot_id (LOT-A-3) via expiry_affinity sort'
  },
  {
    id: 'scenario-6',
    name: 'Temperature Zone Matching',
    description: 'Frozen product must go to frozen temperature zone',
    product: {
      sku_id: 'TEST-FROZEN-001',
      merchant_id: 'FoodCo',
      pack_type: 'CASE',
      weight: 10,
      abc_code: 'B',
      is_oversized: false,
      hazmat_class: 'NONE',
      temp_zone: 'FROZEN',
      inventory_status: 'GOOD',
      is_lot_controlled: true,
      lot_id: 'LOT-2026-01-15'
    },
    transactionType: 'Inbound PO',
    cartContext: { cartId: null, lastPutLocation: null },
    expectedBehavior: 'Frozen Zone Temperature Match preference should route to Zone_Frozen'
  },
  {
    id: 'scenario-7',
    name: 'Customer Return Flow',
    description: 'Damaged return should go to Returns Zone',
    product: {
      sku_id: 'TEST-DAMAGED-001',
      merchant_id: 'Nike',
      pack_type: 'UNIT',
      weight: 4,
      abc_code: 'B',
      is_oversized: false,
      hazmat_class: 'NONE',
      temp_zone: 'AMBIENT',
      inventory_status: 'DAMAGED',
      is_lot_controlled: false,
      lot_id: null
    },
    transactionType: 'Customer Return',
    cartContext: { cartId: null, lastPutLocation: null },
    expectedBehavior: 'Returns Handling preference should route DAMAGED inventory to Returns_Zone'
  },
  {
    id: 'scenario-8',
    name: 'Merchant Clustering',
    description: 'Pact product should cluster with other Pact inventory',
    product: {
      sku_id: 'TEST-PACT-002',
      merchant_id: 'Pact',
      pack_type: 'CASE',
      weight: 12,
      abc_code: 'B',
      is_oversized: false,
      hazmat_class: 'NONE',
      temp_zone: 'AMBIENT',
      inventory_status: 'GOOD',
      is_lot_controlled: false,
      lot_id: null
    },
    transactionType: 'Inbound PO',
    cartContext: { cartId: null, lastPutLocation: null },
    expectedBehavior: 'Should prefer locations with high Pact density via merchant_affinity or cluster_merchant'
  },
  {
    id: 'scenario-9',
    name: 'Edge Case: Super Heavy Item',
    description: 'Very heavy item (100kg) should go to ground level only',
    product: {
      sku_id: 'TEST-HEAVY-002',
      merchant_id: 'BuildSupply',
      pack_type: 'PALLET',
      weight: 100,
      abc_code: 'C',
      is_oversized: true,
      hazmat_class: 'NONE',
      temp_zone: 'AMBIENT',
      inventory_status: 'GOOD',
      is_lot_controlled: false,
      lot_id: null
    },
    transactionType: 'Inbound PO',
    cartContext: { cartId: null, lastPutLocation: null },
    expectedBehavior: 'Heavy Item Safety constraint should strictly limit to level ≤2'
  },
  {
    id: 'scenario-10',
    name: 'Edge Case: Multiple Hazmat Classes',
    description: 'Corrosive hazmat should also go to Hazmat Cage',
    product: {
      sku_id: 'TEST-HAZ-002',
      merchant_id: 'ChemCorp',
      pack_type: 'UNIT',
      weight: 6,
      abc_code: 'B',
      is_oversized: false,
      hazmat_class: 'CORROSIVE',
      temp_zone: 'AMBIENT',
      inventory_status: 'GOOD',
      is_lot_controlled: false,
      lot_id: null
    },
    transactionType: 'Inbound PO',
    cartContext: { cartId: null, lastPutLocation: null },
    expectedBehavior: 'Hazmat Isolation should apply to any hazmat_class != NONE'
  }
];
