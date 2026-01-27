// Mock Zones
export const MOCK_ZONES = [
  { id: 'Zone_A_Golden', name: 'Zone A - Golden (Fast Movers)' },
  { id: 'Zone_B_Standard', name: 'Zone B - Standard' },
  { id: 'Zone_C_Reserve', name: 'Zone C - Reserve' },
  { id: 'Hazmat_Cage', name: 'Hazmat Cage' },
  { id: 'Zone_Frozen', name: 'Frozen Zone' },
  { id: 'Returns_Zone', name: 'Returns Processing' }
];

// Mock Location Groups
export const MOCK_LOCATION_GROUPS = [
  { id: 'flammable_storage', name: 'Flammable Storage' },
  { id: 'heavy_duty', name: 'Heavy Duty Racks' },
  { id: 'pick_faces', name: 'Pick Faces' },
  { id: 'bulk_storage', name: 'Bulk Storage' }
];

// Helper to generate mock locations
function generateLocations() {
  const locations = [];
  let id = 1;

  // Zone A - Golden (10 bins)
  for (let i = 0; i < 10; i++) {
    locations.push({
      id: `BIN-${String(id).padStart(3, '0')}`,
      zone_id: 'Zone_A_Golden',
      location_group_id: i < 5 ? ['pick_faces'] : [],
      storage_type: 'SHELF',
      location_level: (i % 3) + 1,
      bin_status: i % 3 === 0 ? 'EMPTY' : 'PARTIAL',
      temp_zone: 'AMBIENT',
      aisle_id: `A${Math.floor(i / 2) + 1}`,
      distance_shipping: 10 + i * 2,
      bin_capacity: 1.0,
      utilization_percent: i % 3 === 0 ? 0 : 40 + (i * 5),
      current_contents: i % 3 !== 0 ? [
        {
          merchant_id: i % 2 === 0 ? 'Nike' : 'Pact',
          sku_id: `SKU-${100 + i}`,
          lot_id: i % 4 === 0 ? `LOT-A-${i}` : null,
          quantity: 5 + i
        }
      ] : []
    });
    id++;
  }

  // Zone B - Standard (20 bins)
  for (let i = 0; i < 20; i++) {
    locations.push({
      id: `BIN-${String(id).padStart(3, '0')}`,
      zone_id: 'Zone_B_Standard',
      location_group_id: [],
      storage_type: i < 10 ? 'SHELF' : 'RACK',
      location_level: (i % 4) + 1,
      bin_status: i % 4 === 0 ? 'EMPTY' : 'PARTIAL',
      temp_zone: 'AMBIENT',
      aisle_id: `B${Math.floor(i / 4) + 1}`,
      distance_shipping: 30 + i * 3,
      bin_capacity: 1.5,
      utilization_percent: i % 4 === 0 ? 0 : 30 + (i * 3),
      current_contents: i % 4 !== 0 ? [
        {
          merchant_id: i % 3 === 0 ? 'Zara' : 'Nike',
          sku_id: `SKU-${200 + i}`,
          lot_id: null,
          quantity: 10 + i
        }
      ] : []
    });
    id++;
  }

  // Zone C - Reserve (15 bins)
  for (let i = 0; i < 15; i++) {
    locations.push({
      id: `BIN-${String(id).padStart(3, '0')}`,
      zone_id: 'Zone_C_Reserve',
      location_group_id: i < 5 ? ['bulk_storage'] : [],
      storage_type: 'RACK',
      location_level: (i % 5) + 1,
      bin_status: i % 5 === 0 ? 'EMPTY' : 'PARTIAL',
      temp_zone: 'AMBIENT',
      aisle_id: `C${Math.floor(i / 5) + 1}`,
      distance_shipping: 80 + i * 4,
      bin_capacity: 3.0,
      utilization_percent: i % 5 === 0 ? 0 : 50 + (i * 2),
      current_contents: i % 5 !== 0 ? [
        {
          merchant_id: 'Pact',
          sku_id: `SKU-${300 + i}`,
          lot_id: null,
          quantity: 50 + i * 5
        }
      ] : []
    });
    id++;
  }

  // Hazmat Cage (3 bins)
  for (let i = 0; i < 3; i++) {
    locations.push({
      id: `BIN-${String(id).padStart(3, '0')}`,
      zone_id: 'Hazmat_Cage',
      location_group_id: ['flammable_storage'],
      storage_type: 'BIN',
      location_level: 1,
      bin_status: i === 0 ? 'EMPTY' : 'PARTIAL',
      temp_zone: 'AMBIENT',
      aisle_id: 'H1',
      distance_shipping: 120,
      bin_capacity: 0.5,
      utilization_percent: i === 0 ? 0 : 60,
      current_contents: i === 0 ? [] : [
        {
          merchant_id: 'ChemCorp',
          sku_id: `SKU-HAZ-${i}`,
          lot_id: null,
          quantity: 2
        }
      ]
    });
    id++;
  }

  // Frozen Zone (2 bins)
  for (let i = 0; i < 2; i++) {
    locations.push({
      id: `BIN-${String(id).padStart(3, '0')}`,
      zone_id: 'Zone_Frozen',
      location_group_id: [],
      storage_type: 'FLOOR',
      location_level: 1,
      bin_status: 'EMPTY',
      temp_zone: 'FROZEN',
      aisle_id: 'F1',
      distance_shipping: 150,
      bin_capacity: 10.0,
      utilization_percent: 0,
      current_contents: []
    });
    id++;
  }

  return locations;
}

export const MOCK_LOCATIONS = generateLocations();

// Sample test products
export const SAMPLE_PRODUCTS = [
  {
    name: 'Heavy Pallet (50kg)',
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
    }
  },
  {
    name: 'Fast Mover Unit (A)',
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
    }
  },
  {
    name: 'Frozen Item (Case)',
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
    }
  },
  {
    name: 'Hazmat Product (Flammable)',
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
    }
  },
  {
    name: 'Lot-Controlled Item (FEFO)',
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
    }
  },
  {
    name: 'Damaged Return',
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
    }
  },
  {
    name: 'Super Heavy Pallet (100kg)',
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
    }
  },
  {
    name: 'Corrosive Hazmat',
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
    }
  },
  {
    name: 'Small Fast Mover (Jewelry)',
    product: {
      sku_id: 'TEST-TINY-001',
      merchant_id: 'LuxeBrand',
      pack_type: 'UNIT',
      weight: 0.5,
      abc_code: 'A',
      is_oversized: false,
      hazmat_class: 'NONE',
      temp_zone: 'AMBIENT',
      inventory_status: 'GOOD',
      is_lot_controlled: false,
      lot_id: null
    }
  },
  {
    name: 'Multi-Merchant Zone Test (Pact)',
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
    }
  }
];

// Export just the product objects for test scenarios
export const TEST_PRODUCTS = SAMPLE_PRODUCTS.map(item => item.product);
