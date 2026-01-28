# Proximity-Based OrderBy Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add "Proximity to Last Location" as a configurable orderBy field for travel distance optimization in cart processing.

**Architecture:** Add new orderBy strategy that calculates distance from stower's last putaway location. Only applies when cart context exists (not first item). Distance calculation uses existing location distance service.

**Tech Stack:** React 19, Vite 7, JavaScript (no build changes)

---

## Task 1: Update PRD Section 2.4 - Cart Processing Behavior

**Files:**
- Modify: `PRD - WMS Putaway Rules Engine.md:48-79`

**Step 1: Update Section 2.4.2 to explain proximity as orderBy**

Replace lines 62-68 with new cart consolidation behavior that describes proximity as an orderBy option instead of automatic behavior:

```markdown
#### 2.4.2 Cart Consolidation Behavior

When a preference has `cartConsolidation: TRUE`:

1. **First item in cart**: No "Last Put Location" exists → Apply normal locationCriteria + orderBy logic
2. **Subsequent items**:
   - If Last Put Location exists AND passes all hard constraints AND has capacity → Select it
   - Otherwise → Fall back to normal locationCriteria + orderBy logic within the same preference

**Note**: To optimize travel distance for subsequent items, configure "Proximity to Last Location" as an orderBy field (primary or secondary). This will sort candidate locations by distance from the Last Put Location when available.
```

**Step 2: Commit**

```bash
git add "PRD - WMS Putaway Rules Engine.md"
git commit -m "docs: update cart consolidation to reference proximity orderBy

Co-Authored-By: Claude (arn:aws:bedrock:us-east-1:013986332596:application-inference-profile/i0kkhs4vacaj) <noreply@anthropic.com>"
```

---

## Task 2: Update PRD Section 4.3 - Add Proximity OrderBy Strategy

**Files:**
- Modify: `PRD - WMS Putaway Rules Engine.md:145-169`

**Step 1: Add proximity strategy to the OrderBy table**

Insert new row after "Cluster by Merchant" (before "Fill Bottom Levels First"):

```markdown
| **Proximity to Last Location** | Sort by distance(location, last_put_location) ASC. Only applies when Last Put Location exists (not first item in cart). | Travel optimization |
```

**Step 2: Update tie-breaker note**

Update line 163 to clarify proximity behavior:

```markdown
**Tie-Breaker**: When all configured strategies result in ties, sort by `location_id ASC` for deterministic results.

**Notes**:
- "Prioritize Same Lot/Expiry" and "Prioritize Same SKU" are soft preferences—bins without matching lot/SKU are sorted lower, not excluded
- "Cluster by Merchant" calculates a density score based on neighboring bins in the same aisle; for new merchants with no existing inventory, this has no effect
- "Closest to Shipping Dock" uses a `dock_proximity_score` configured per location (1 = nearest)
- "Proximity to Last Location" requires cart context with Last Put Location; when unavailable (first item in cart), this orderBy is skipped
```

**Step 3: Commit**

```bash
git add "PRD - WMS Putaway Rules Engine.md"
git commit -m "docs: add proximity to last location orderBy strategy

Co-Authored-By: Claude (arn:aws:bedrock:us-east-1:013986332596:application-inference-profile/i0kkhs4vacaj) <noreply@anthropic.com>"
```

---

## Task 3: Add Proximity Strategy to types.js

**Files:**
- Modify: `putaway-prototype/src/types.js:142-191`

**Step 1: Add proximity_last_location to SORT_STRATEGIES**

Insert after 'cluster_merchant' strategy (around line 180):

```javascript
  {
    value: 'proximity_last_location',
    label: 'Proximity to Last Location',
    description: 'Sort by distance from last put location (travel optimization)',
    requiresCartContext: true
  },
```

**Step 2: Commit**

```bash
cd putaway-prototype
git add src/types.js
git commit -m "feat: add proximity to last location sort strategy

Co-Authored-By: Claude (arn:aws:bedrock:us-east-1:013986332596:application-inference-profile/i0kkhs4vacaj) <noreply@anthropic.com>"
```

---

## Task 4: Add Distance Calculation to Mock Locations

**Files:**
- Modify: `putaway-prototype/src/data/locations.js`

**Step 1: Read current locations structure**

```bash
cd putaway-prototype
cat src/data/locations.js | head -50
```

Expected: Array of location objects with zone_id, coordinates, etc.

**Step 2: Add calculateDistance utility function**

Add at top of file before location exports:

```javascript
/**
 * Calculate Euclidean distance between two locations
 * Uses x, y coordinates from location objects
 * @returns {number} Distance in meters (mock scale: 1 unit = 1 meter)
 */
export function calculateDistance(locA, locB) {
  if (!locA || !locB) return Infinity;

  const dx = (locA.x_coord || 0) - (locB.x_coord || 0);
  const dy = (locA.y_coord || 0) - (locB.y_coord || 0);

  return Math.sqrt(dx * dx + dy * dy);
}
```

**Step 3: Ensure mock locations have x_coord, y_coord**

If locations don't have coordinates, add them based on zone and aisle:

```javascript
// Example coordinate assignment logic
// Zone A: x = 0-100, Zone B: x = 100-200, etc.
// Aisle within zone: y = aisle_number * 10
```

**Step 4: Commit**

```bash
git add src/data/locations.js
git commit -m "feat: add distance calculation utility for locations

Co-Authored-By: Claude (arn:aws:bedrock:us-east-1:013986332596:application-inference-profile/i0kkhs4vacaj) <noreply@anthropic.com>"
```

---

## Task 5: Implement Proximity Sorting in Execution Engine

**Files:**
- Modify: `putaway-prototype/src/utils/executionEngine.js:466-565`

**Step 1: Import calculateDistance**

Add to imports at top of file:

```javascript
import { calculateDistance } from '../data/locations';
```

**Step 2: Add proximity case to compareByStrategy**

Insert after 'bin_capacity_asc' case (around line 560):

```javascript
    case 'proximity_last_location':
      // Sort by distance from last put location
      // Only applies when cartContext.lastPutLocation exists
      if (!product._cartContext?.lastPutLocation) {
        // No last location - treat all as equal (skip this orderBy)
        return 0;
      }

      const lastLocation = product._cartContext._lastLocationObject;
      if (!lastLocation) {
        return 0;
      }

      scoreA = calculateDistance(locA, lastLocation);
      scoreB = calculateDistance(locB, lastLocation);
      direction = 'asc'; // Closer is better
      break;
```

**Step 3: Update runPutaway to pass location object in cartContext**

Find the section where cartContext is used (around line 261) and enhance it to include the location object:

```javascript
    if (preference.cartConsolidation && cartContext.lastPutLocation) {
      const lastLoc = locations.find(loc => loc.id === cartContext.lastPutLocation);

      // Store location object for proximity calculations
      product._cartContext = {
        lastPutLocation: cartContext.lastPutLocation,
        _lastLocationObject: lastLoc
      };
```

**Step 4: Commit**

```bash
git add src/utils/executionEngine.js
git commit -m "feat: implement proximity to last location sorting

Co-Authored-By: Claude (arn:aws:bedrock:us-east-1:013986332596:application-inference-profile/i0kkhs4vacaj) <noreply@anthropic.com>"
```

---

## Task 6: Add Proximity Test Scenario

**Files:**
- Modify: `putaway-prototype/src/data/testScenarios.js`

**Step 1: Add new test scenario**

Add scenario at end of array:

```javascript
  {
    id: 11,
    name: 'Cart Processing: Proximity Optimization',
    description: 'Subsequent items in cart prefer nearby locations to minimize travel',
    product: {
      sku_id: 'PROD-PROX-01',
      merchant_id: 'MERCH-A',
      abc_code: 'B',
      pack_type: 'UNIT',
      inventory_status: 'GOOD',
      hazmat_class: 'NONE',
      temp_zone: 'AMBIENT',
      weight: 5,
      is_oversized: false,
      is_lot_controlled: false
    },
    transactionType: 'Inbound PO',
    cartContext: {
      cartId: 'CART-PROX-001',
      lastPutLocation: 'LOC-A-001' // Stower just put item in Zone A
    },
    requiredRules: [
      {
        type: 'preference',
        priority: 1,
        productCriteria: [{ field: 'abc_code', operator: '=', value: 'B' }],
        locationCriteria: [],
        orderBy: {
          primary: { field: 'bin_utilization_desc', direction: 'desc' },
          secondary: { field: 'proximity_last_location', direction: 'asc' }
        },
        cartConsolidation: false
      }
    ],
    expectedBehavior: 'Should select high-utilization bin closest to LOC-A-001 (Zone A). If multiple bins have similar utilization, proximity breaks the tie.',
    tags: ['cart-processing', 'proximity', 'travel-optimization']
  }
```

**Step 2: Commit**

```bash
git add src/data/testScenarios.js
git commit -m "test: add proximity optimization test scenario

Co-Authored-By: Claude (arn:aws:bedrock:us-east-1:013986332596:application-inference-profile/i0kkhs4vacaj) <noreply@anthropic.com>"
```

---

## Task 7: Update UI to Show Proximity Requirement

**Files:**
- Modify: `putaway-prototype/src/components/ConfigurationView.jsx`

**Step 1: Find orderBy dropdown rendering**

Search for where SORT_STRATEGIES is mapped to dropdown options.

**Step 2: Add disabled state and tooltip for proximity when no cart context**

```javascript
{SORT_STRATEGIES.map(strategy => (
  <option
    key={strategy.value}
    value={strategy.value}
    disabled={strategy.requiresCartContext && !simulationHasCartContext}
  >
    {strategy.label}
    {strategy.requiresCartContext ? ' (requires cart context)' : ''}
  </option>
))}
```

**Step 3: Add helper text**

Below orderBy dropdowns, add note:

```jsx
{(preference.orderBy?.primary?.field === 'proximity_last_location' ||
  preference.orderBy?.secondary?.field === 'proximity_last_location') && (
  <p className="text-xs text-amber-600 mt-1">
    ⚠️ Proximity to Last Location requires cart context (not first item in cart)
  </p>
)}
```

**Step 4: Commit**

```bash
git add src/components/ConfigurationView.jsx
git commit -m "ui: add proximity field with cart context requirement hint

Co-Authored-By: Claude (arn:aws:bedrock:us-east-1:013986332596:application-inference-profile/i0kkhs4vacaj) <noreply@anthropic.com>"
```

---

## Task 8: Update README

**Files:**
- Modify: `putaway-prototype/README.md:28-48`

**Step 1: Add proximity to features list**

Update the features section to mention proximity:

```markdown
✅ **Rule Configuration**
- Hard Constraints with 10 product fields, 8 location fields
- Preferences with priority ordering (drag-and-drop)
- 10 sorting strategies including proximity-based travel optimization
- Cart Consolidation ("Follow the Leader")
- Enable/disable toggles
- Real-time rule preview
```

**Step 2: Update test scenarios list**

Add new scenario:

```markdown
11. Cart Processing: Proximity Optimization
```

**Step 3: Commit**

```bash
cd ..
git add putaway-prototype/README.md
git commit -m "docs: update README with proximity feature

Co-Authored-By: Claude (arn:aws:bedrock:us-east-1:013986332596:application-inference-profile/i0kkhs4vacaj) <noreply@anthropic.com>"
```

---

## Task 9: Build and Deploy

**Files:**
- Modify: `putaway-prototype/dist/` (production build)

**Step 1: Build production version**

```bash
cd putaway-prototype
npm run build
```

Expected: dist/ folder with optimized assets

**Step 2: Force add dist folder**

```bash
git add -f dist
git commit -m "build: production build with proximity feature

Co-Authored-By: Claude (arn:aws:bedrock:us-east-1:013986332596:application-inference-profile/i0kkhs4vacaj) <noreply@anthropic.com>"
```

**Step 3: Push to GitHub**

```bash
cd ..
git push origin main
```

Expected: GitHub Actions workflow triggers and deploys to GitHub Pages

**Step 4: Verify deployment**

Wait for workflow completion:

```bash
gh run watch
```

Then verify site:

```bash
curl -I https://xuhengjack925.github.io/wms_putaway/
```

Expected: HTTP 200

---

## Summary

**What we built:**
- Added "Proximity to Last Location" as 10th orderBy strategy
- Only applies when cart context exists (not first item)
- Uses Euclidean distance calculation from location coordinates
- Configurable as primary or secondary sort
- Gracefully degrades when no last location available

**PRD changes:**
- Updated Section 2.4.2 to reference proximity as orderBy option
- Added proximity strategy to Section 4.3 OrderBy table
- Added notes about cart context requirement

**Prototype changes:**
- Added proximity strategy to types.js
- Implemented calculateDistance utility
- Added proximity case to compareByStrategy
- Enhanced cartContext to pass location object
- Added test scenario #11
- UI shows requirement hint for cart context
- Updated README

**Design decisions:**
- Proximity is opt-in (configurable) not automatic
- Returns 0 (equal) when no cart context → skips to next orderBy
- Uses ASC direction (closer = better)
- Works with any preference, not just cartConsolidation
