# Phase 1: Core Rule Configuration UI - Design Document

**Date:** 2026-01-27
**Version:** 1.0
**Status:** Approved
**PRD Reference:** PRD - WMS Putaway Rules Engine v2.1

## Executive Summary

This design document specifies the Phase 1 prototype for the WMS Putaway Rules Engine Configuration UI. The prototype implements core functionality from the PRD including the two-phase funnel model, complete rule builder, and execution simulator. This is a high-fidelity interactive prototype suitable for stakeholder validation, user testing, and engineering reference.

**Scope:** Phase 1 focuses on foundational features with full interactivity. Advanced features (conflict detection, bulk operations) are deferred to later phases.

## Design Principles

1. **Transparency over automation** - Users see exactly what rules will do before activation
2. **Funnel model reinforcement** - Visual design constantly reminds users of Phase 1 (AND) → Phase 2 (OR) logic
3. **Progressive disclosure** - Simple cases remain simple; complexity available when needed
4. **Fail-safe defaults** - Rules cannot be saved in invalid states; catch-all preferences recommended

## 1. Overall Layout & Navigation

### Layout Architecture

The prototype uses a **tabbed workspace model** with three main views:

**1. Configuration View** (Primary workspace)
- **Left Sidebar:** "Execution Funnel" visualization showing Phase 1 → Phase 2 flow
  - Clickable phase selectors (Hard Constraints / Preferences)
  - Always visible to reinforce two-phase mental model
  - Phase numbers match PRD terminology
- **Main Content Area:** Rule cards with inline viewing and modal editing
- **Top Header:**
  - Application title: "WMS Putaway Rules Engine"
  - Tab switcher: Configuration | Simulator
  - Global stats: Active rules count, last modified timestamp

**2. Simulator View**
- **Left Panel (400px fixed):** Test scenario builder
  - Product attribute input form
  - Transaction type selector
  - Cart ID for Follow the Leader testing
  - "Run Simulation" CTA button
- **Right Panel (flexible):** Execution trace with phase-by-phase breakdown
  - Result card (success/failure)
  - Scrollable logic trace timeline

**3. Master Data View** (Future phase - not in scope)

### Navigation Pattern

- Users switch between Configuration and Simulator via **persistent top-level tabs**
- Within Configuration, toggle between "Hard Constraints" and "Preferences" using sidebar phase selectors
- Modal overlays for rule editing (full-screen, escapable)

### Key Design Rationale

**Why tabbed navigation?**
- Clear mental model: "Configure rules" vs "Test rules"
- Prevents context switching errors (editing while simulating)
- Matches PRD's logical separation of concerns

**Why sidebar funnel?**
- Visual reinforcement of the two-phase execution model (PRD Section 2.1)
- Always visible to remind users of AND (constraints) vs OR (preferences) logic
- Direct navigation without hunting for tabs

**Why inline cards vs list view?**
- Faster scanning for power users (WMS experts)
- Better overview of all rules at once
- Rule logic visible without clicking

## 2. Hard Constraints Configuration

### Constraint Rule Card Structure

Each constraint displays as a **horizontal card** (white background, red left border accent, subtle shadow on hover).

**Visual Zones (left to right):**

**Zone 1: Rule Identity** (left 25%)
- Shield icon (red, 20px)
- Rule name (bold, 18px, editable on click)
- Enable/disable toggle switch (prominent, green when active)
- Transaction scope pills (compact, e.g., "Any", "Inbound PO + Returns")
- Conflict indicator badge (Phase 3 - placeholder in Phase 1)

**Zone 2: IF Product Matches** (25%, light gray background)
- Section label: "IF" with layers icon (small, uppercase, slate-600)
- List of product criteria with AND badges between them
- Each criterion displayed as: `field operator value`
  - Example: "weight > 20"
  - Monospace font for values
  - Compact chips (white background, border)
- Empty state: "All Products" (italic, gray)

**Zone 3: THEN Filter/Action** (35%, light red background)
- Section label: "THEN" with filter icon
- Action type badge: "Limit To" (blue) or "Exclude" (red)
- List of location criteria with AND badges
- Each criterion: `field operator value`
  - Example: "location_level ≤ 2"
- Empty state: "All Locations" (italic, gray)

**Zone 4: Actions** (right 15%)
- Edit button (pencil icon, blue on hover)
- Delete button (trash icon, red on hover)
- Three-dot menu (future: duplicate, export)

### Constraint Rule Builder Modal

**Trigger:** Clicking "Add Constraint" button (top-right) or Edit icon on existing card

**Modal Structure:** Full-screen overlay (90vh height, max-width 1200px, centered)

**Header:**
- Title: "New Hard Constraint" or "Edit: [Rule Name]"
- Close button (X icon, top-right)

**Body (scrollable, 6 sections):**

**1. Rule Identification**
- Rule Name input (required, text field, placeholder: "e.g., Heavy Item Safety")
- Description textarea (optional, 2 rows, placeholder: "Why this rule exists...")

**2. Transaction Scope**
- Label: "Applies To Transaction Types"
- Pill multi-select interface:
  - 5 pills: "Any/All" | "Inbound PO" | "Replenishment" | "Customer Return" | "Inventory Transfer"
  - "Any/All" is exclusive (selecting it deselects others)
  - Selecting specific type auto-deselects "Any/All"
  - Visual: Selected pills solid blue, unselected outlined gray
  - At least one must be selected

**3. Product Criteria (IF Section)**
- Section header: "IF Product Matches (AND Logic)" with help icon tooltip
- Tooltip text: "All conditions must be true for this rule to apply"
- Condition rows (vertically stacked):
  - Each row: [Field Dropdown] [Operator Dropdown] [Value Input] [Remove Icon]
  - "AND" badge between rows (visual only, not interactive)
- "+ Add Condition" button at bottom
- Empty state: Dashed border box with quick-add suggestions
  - Example chips: "+ Heavy items (>20kg)", "+ Hazmat products", "+ Oversized"
  - Clicking chip auto-fills condition

**4. Location Criteria (THEN Section)**
- Section header: "THEN Filter Locations (AND Logic)"
- Action selector (radio buttons, prominent):
  - ◉ Limit To (whitelist) - default
  - ◯ Exclude (blacklist)
- Condition rows (same pattern as Product Criteria)
- "+ Add Filter" button
- Empty state with quick-add: "+ Ground level only", "+ Temperature controlled"

**5. Rule Preview Panel**
- Collapsible section (expanded by default)
- Header: "Rule Preview" with eye icon
- Natural language summary:
  ```
  "Heavy Item Safety"

  When receiving Any transaction:
  IF weight > 20kg
  THEN only allow locations where location_level ≤ 2

  ⚠️ This is a HARD CONSTRAINT - locations not matching will be excluded.
  ```
- Updates in real-time as user edits

**6. Validation Messages**
- Red banner for errors (e.g., "Rule name is required")
- Yellow banner for warnings (e.g., "This rule has no product criteria - will apply to all items")

**Footer:**
- Cancel button (left, ghost style)
- Save button (right, primary blue, disabled until valid)

### Field Configuration Details

**Product Criteria Fields** (PRD Section 3.1):

| Field | Type | Operators | Value Input |
|-------|------|-----------|-------------|
| merchant_id | String | =, !=, in | Text input or multi-select |
| inventory_status | Enum | = | Dropdown: GOOD, DAMAGED, QUARANTINE, RETURNED |
| pack_type | Enum | = | Dropdown: UNIT, CASE, PALLET |
| abc_code | Enum | = | Dropdown: A, B, C |
| is_oversized | Boolean | = | Toggle: Yes/No |
| weight | Number | >, >=, <, <=, between | Number input with "kg" label |
| hazmat_class | Enum | = | Dropdown: NONE, FLAMMABLE, CORROSIVE, TOXIC, OXIDIZER |
| temp_zone | Enum | = | Dropdown: AMBIENT, CHILLED, FROZEN |
| sku_id | String | =, in | Text input or multi-select |
| is_lot_controlled | Boolean | = | Toggle: Yes/No |

**Location Criteria Fields** (PRD Section 3.2):

| Field | Type | Operators | Value Input | Action Support |
|-------|------|-----------|-------------|----------------|
| zone_id | List | in | Multi-select dropdown | Limit To / Exclude |
| location_group_id | List | in | Multi-select dropdown | Limit To / Exclude |
| storage_type | Enum | = | Dropdown: BIN, SHELF, RACK, FLOOR | Limit To / Exclude |
| location_level | Number | =, <=, >=, between | Number input | Limit To / Exclude |
| bin_status | Enum | = | Dropdown: EMPTY, PARTIAL | Limit To only |
| temp_zone | Enum | = | Dropdown: AMBIENT, CHILLED, FROZEN | Limit To / Exclude |
| single_merchant_only | Boolean | = | Toggle: Yes/No | Limit To only |
| aisle_id | String | =, in | Text input or multi-select | Limit To / Exclude |

**Dynamic Behavior:**
- When field is selected, appropriate operator options appear
- When operator is selected, appropriate value input appears
- "between" operator shows two value inputs (min/max)
- "in" operator shows multi-select or tag input
- "exists" operator disables value input

### Constraint List View

**Empty State:**
- Dashed border container
- Icon: Shield with plus sign
- Text: "No hard constraints defined"
- Subtext: "Constraints filter out illegal or unsafe locations. Without constraints, all locations are candidates."
- "Add First Constraint" button (primary CTA)

**Populated State:**
- Vertical stack of constraint cards (8px gap)
- Sorted by: Recently modified first (or user-draggable in future)
- Hover effects: Shadow intensifies, Edit/Delete buttons appear
- Batch actions header (future): "Select All", "Disable All", "Export"

## 3. Preferences Configuration

### Preference Rule Card Structure

Extends constraint card structure with priority management.

**Visual Zones (left to right):**

**Zone 0: Priority & Drag Handle** (leftmost, 60px)
- Drag handle icon (vertical grip, 6 dots, cursor: grab)
- Priority badge (large circular badge, green background, white text)
  - Displays: "#1", "#2", "#3", etc.
  - Size: 40px diameter

**Zone 1: Rule Identity** (20%, green left border accent)
- Same as constraints but green theme
- Target icon instead of shield

**Zone 2: IF Product Matches** (20%, light gray)
- Same as constraints

**Zone 3: THEN Target Scope** (25%, light green background)
- Section label: "THEN Target" with target icon
- Location criteria list (no action selector - always inclusive)
- Special badge if cartConsolidation=true:
  - "Follow the Leader" pill (blue, icon: footsteps)
  - Tooltip: "Will attempt to use Last Put Location from cart"

**Zone 4: THEN Sort By** (25%, light blue background)
- Section label: "Sort By" with arrow-down icon
- Primary sort display: "Strategy Name ↑ ASC" or "↓ DESC"
- Secondary sort display (if present): "then Strategy Name ↓ DESC"
- Disabled state: Gray background, text: "Single target - sorting disabled"
  - Appears when Follow the Leader is active

**Zone 5: Actions** (right 10%)
- Up/Down arrow buttons (visible on hover)
  - Up disabled on priority=1
  - Down disabled on last priority
- Edit/Delete buttons

### Priority Management

**Drag-and-Drop Interaction:**

1. User grabs drag handle (cursor changes to grabbing)
2. Card lifts with shadow and slight rotation
3. Drop zones appear between other cards (2px blue line)
4. On drop:
   - Cards reorder with smooth animation (300ms ease)
   - Priority numbers auto-renumber (1, 2, 3...)
   - Toast notification: "Priority updated: [Rule Name] is now #X"

**Keyboard Alternative:**

- Arrow buttons visible on card hover
- Click up: Swaps with previous preference
- Click down: Swaps with next preference
- Keyboard shortcuts: Cmd/Ctrl + Up/Down when card focused
- Same animation and feedback as drag-and-drop

**Visual Feedback:**
- Dragging card: 50% opacity, blue border
- Valid drop zone: Blue highlight bar (2px, animated pulse)
- Invalid drop zone: Red highlight (e.g., between constraints)

### Preference Rule Builder Modal

Extends constraint builder with preference-specific sections.

**Header:** "New Preference" or "Edit: [Rule Name]"

**Body Sections:**

**1. Rule Identification** (same as constraints)

**2. Transaction Scope** (same as constraints)

**3. Product Criteria** (same as constraints)

**4. Location Criteria - Preferences Version**
- Section header: "THEN Target Scope (AND Logic)"
- No "Action" selector (always inclusive filtering)
- Condition rows (same pattern)
- **Cart Consolidation Toggle:**
  - Prominent toggle switch
  - Label: "Enable Cart Consolidation (Follow the Leader)"
  - Help icon with tooltip: "First item uses normal logic. Subsequent items from same cart try Last Put Location first, then fall back to normal logic."
  - When enabled: Shows info banner explaining behavior

**5. Order By Configuration**
- Section header: "THEN Sort By"
- Disabled state when cartConsolidation=true:
  - Gray background, locked icon
  - Text: "Sorting disabled - Follow the Leader targets a single specific location"

**Primary Sort:**
- Dropdown: Select strategy from 9 options (PRD Section 4.3)
- Direction toggle: ASC ↑ / DESC ↓ (visual toggle switch)

**Secondary Sort (optional):**
- "+ Add Secondary Sort" link (appears after primary selected)
- Same dropdown (excludes already-selected primary)
- Same direction toggle
- Remove icon to delete secondary

**Strategy Options:**
1. Prioritize Same Lot/Expiry (requires is_lot_controlled=true on product)
2. Prioritize Same SKU
3. Prioritize Same Merchant
4. Fill Most Full (Top-off)
5. Fill Least Full (Spread)
6. Closest to Shipping Dock
7. Cluster by Merchant (requires aisle_id on locations)
8. Fill Bottom Levels First
9. Smallest Bin First

Each option has help icon with tooltip explaining use case (from PRD 4.3).

**6. Rule Preview Panel**
- Natural language summary including sort logic:
  ```
  "Fast Mover Optimization"

  When receiving Inbound PO:
  IF abc_code = A
  THEN target locations where zone_id = zone_golden
  SORT BY Closest to Shipping Dock (ascending), then Fill Most Full (descending)

  ℹ️ This is a PREFERENCE (Priority #3) - will be tried after higher priorities fail.
  ```

**Footer:** Same as constraints (Cancel / Save)

### Preference List View

**Empty State:**
- Icon: List with numbers
- Text: "No preferences defined"
- Subtext: "Preferences rank valid locations and select the best match. Add at least one catch-all preference to avoid putaway failures."
- "Add First Preference" button

**Populated State:**
- Vertical stack ordered by priority (non-negotiable sort)
- Priority numbers prominently displayed
- Visual separator lines between cards
- Drag handles always visible (not just on hover)
- Recommended catch-all warning:
  - If no catch-all exists (empty product criteria + empty scope): Yellow banner at bottom
  - Text: "⚠️ No catch-all preference found. Consider adding a fallback preference (no criteria) to prevent putaway failures."
  - "Add Catch-All" quick action button

## 4. Execution Simulator

### Purpose
Allow users to test putaway logic with sample products before deploying rules to production. Provides step-by-step trace showing exactly how the engine evaluated constraints and preferences.

### Layout

**Left Panel: Test Scenario Builder** (400px fixed width, light blue background)

**Header:**
- Icon: Beaker/Flask
- Title: "Test Scenario"
- Reset button (clears form)

**Product Input Form:**

Organized into collapsible accordion sections (all expanded by default):

**1. Transaction Context**
- Transaction Type dropdown (required)
  - Options: Inbound PO, Replenishment, Customer Return, Inventory Transfer
  - Large, prominent (affects rule scope matching)
- Cart ID text input (optional, for Follow the Leader testing)
  - Placeholder: "e.g., CART-123"

**2. Product Identity**
- SKU ID text input (display only, not matched by rules in Phase 1)
  - Default: "TEST-SKU-001"
- Merchant ID text input
  - Placeholder: "e.g., Nike, Pact, Zara"

**3. Physical Attributes**
- Pack Type dropdown: Unit | Case | Pallet
- Weight number input (kg)
  - Slider + number input combo (0-100kg range)
- Is Oversized toggle: Yes | No
- Temp Zone dropdown: Ambient | Chilled | Frozen

**4. Classification**
- ABC Code dropdown: A | B | C
- Inventory Status dropdown: GOOD | DAMAGED | QUARANTINE | RETURNED
- Hazmat Class dropdown: NONE | FLAMMABLE | CORROSIVE | TOXIC | OXIDIZER

**5. Special Attributes**
- Is Lot Controlled toggle: Yes | No
  - When Yes: Shows additional inputs for Lot # and Expiry Date (optional, for display in trace)

**Actions:**
- "Run Simulation" button (primary blue, full width, sticky at bottom)
  - Icon: Play button
  - Text: "Run Putaway Simulation"
- "Save Scenario" button (ghost, for future: reusable test cases)

### Right Panel: Execution Trace (flexible width, white background)

**Initial State (before first run):**
- Empty state illustration (engine icon, faded)
- Text: "Configure a test scenario and run simulation"

**Result State (after run):**

**1. Result Card** (top, prominent, full width)

**Success State:**
- Green background gradient
- Icon: Large checkmark circle
- Title: "Putaway Task Generated" (bold, 24px)
- Assigned Location: Large text showing location ID
  - Example: "BIN-142 (Zone: Golden | Level: 2 | Status: Partial)"
- Winning Strategy badge: Shows which preference matched
  - Example: "Matched by: #2 Fast Mover Optimization"
- Location details card (expandable):
  - Current contents (if partial): "Contains: Nike SKU-789 (qty: 5)"
  - Capacity remaining: "40% available"
  - Distance metrics: "15m to shipping dock"

**Failure State:**
- Red background gradient
- Icon: Large warning triangle
- Title: "Putaway Failed" (bold, 24px)
- Error message (dynamic based on failure point):
  - "No valid locations after Hard Constraints" (Phase 1 failure)
  - "All preferences exhausted with no matches" (Phase 2 failure)
- Troubleshooting suggestions:
  - "Review constraint rules to ensure valid locations exist"
  - "Add a catch-all preference with no criteria"

**2. Logic Trace Timeline** (scrollable, accordion sections)

**Phase 0: Initialization**
- Header: "Initialization" with info icon
- Content:
  - "Starting putaway for TEST-SKU-001"
  - "Transaction Type: Inbound PO"
  - "Initial candidates: 127 locations"

**Phase 1: Hard Constraints**
- Header: "Phase 1: Hard Constraints" (red accent, shield icon)
- Subheader: "All constraints must pass (AND Logic)"

Each active constraint shows as a sub-card:

**Constraint Card Structure:**
- Constraint name with shield icon
- Status badge:
  - "Out of Scope" (gray) - transaction type mismatch
  - "Criteria Mismatch" (gray) - product doesn't match
  - "Applied" (red) - filter was applied

If Applied, show:
- Matched criteria list: "✓ weight (25kg) > 20"
- Filter action: "Action: Limit To location_level ≤ 2"
- Result: "Filtered 127 → 89 locations (-38)"
- Progress bar visualization: Red bar showing reduction

**Phase 1 Summary:**
- "Hard Constraints Complete"
- "Valid candidates remaining: 89 locations"
- If 0: Red warning "FAILED: No valid locations"

**Phase 2: Preferences** (only shown if Phase 1 succeeded)
- Header: "Phase 2: Preferences" (green accent, target icon)
- Subheader: "Evaluated in priority order (OR Logic - first match wins)"

Each preference attempt shows as a sub-card:

**Preference Card Structure:**
- Priority badge + preference name
- Status badge:
  - "Out of Scope" (gray)
  - "Criteria Mismatch" (gray)
  - "No Candidates" (yellow warning) - scope filtered to 0
  - "Matched & Selected" (green checkmark) - winner

If evaluated (not out of scope):
- Matched criteria: "✓ abc_code = A"
- Scope filtering: "Targeted zone_id=zone_golden: 23 candidates"
- If Follow the Leader active:
  - "Cart Consolidation: Checking Last Put Location for CART-123"
  - "Last Put Location: BIN-142 (valid, has capacity) → Selected"
  OR
  - "Last Put Location: Not found or full → Fallback to normal logic"
- If normal sorting:
  - "Sorted by: Closest to Shipping Dock (ASC)"
  - "Top 3 candidates: BIN-142 (score: 15m), BIN-087 (score: 18m), BIN-201 (score: 22m)"
  - "Selected: BIN-142"

**Phase 2 Summary:**
- "Putaway Complete"
- "Winning Preference: #2 Fast Mover Optimization"

### Interactive Features

**Hover Interactions:**
- Hover on matched criteria: Highlights corresponding value in input form
- Hover on location ID: Shows mini-map tooltip (if location data available)
- Hover on constraint/preference name: Shows full rule details in tooltip

**Click Interactions:**
- Click on winning preference: Scrolls to that rule in Configuration tab
- Click on "Adjust Rules" link: Switches to Configuration tab with relevant phase selected
- Click "Re-run" button: Keeps scenario, re-executes with current rules

**Visual Enhancements:**
- Smooth scroll to result card after execution
- Loading spinner during simulation (simulated 500ms delay for realism)
- Animated counters for location counts (counting down effect)
- Confetti animation on first successful simulation (delight factor)

## 5. Technical Implementation Specifications

### Technology Stack

**Core Framework:**
- React 18+ with Hooks
- Vite for build tooling (fast HMR, optimized builds)

**Styling:**
- Tailwind CSS 3.x for utility-first styling
- Custom design tokens for colors, spacing, shadows
- CSS Grid and Flexbox for layouts
- CSS transitions for animations (300ms ease-in-out standard)

**Component Library:**
- Lucide React for icons (tree-shakeable, consistent style)
- Headless UI for accessible modals, dropdowns, toggles
- React Beautiful DnD for drag-and-drop (preferences priority)

**State Management:**
- React Context for global rule state (constraints, preferences)
- Local state for UI-only concerns (modal open/closed, active tab)
- LocalStorage for persistence (auto-save on change, restore on load)

**Data Validation:**
- Zod for runtime schema validation (ensure rules match expected shape)
- Custom validation hooks for business logic (e.g., "at least one scope selected")

### Data Model

**Global State Shape:**
```javascript
{
  constraints: Constraint[],
  preferences: Preference[],
  masterData: {
    zones: Zone[],
    locations: Location[],
    products: Product[] // Simplified for Phase 1
  },
  uiState: {
    activeTab: 'config' | 'simulator',
    activePhase: 'constraints' | 'preferences',
    editingRule: Rule | null
  },
  simulatorState: {
    lastScenario: ProductScenario | null,
    lastResult: SimulationResult | null
  }
}
```

**Constraint Schema:**
```typescript
interface Constraint {
  id: string; // UUID v4
  name: string;
  enabled: boolean;
  scope: TransactionType[]; // ['Any'] or ['Inbound PO', ...]
  productCriteria: Criterion[];
  locationCriteria: Criterion[];
  action: 'limit_to' | 'exclude';
  createdAt: ISO8601String;
  updatedAt: ISO8601String;
}

interface Criterion {
  field: string; // Field name from PRD 3.1 or 3.2
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'between' | 'in' | 'exists';
  value: string | number | boolean | string[]; // Type depends on field
}

type TransactionType =
  | 'Any'
  | 'Inbound PO'
  | 'Replenishment'
  | 'Customer Return'
  | 'Inventory Transfer';
```

**Preference Schema:**
```typescript
interface Preference {
  id: string;
  name: string;
  enabled: boolean;
  priority: number; // 1, 2, 3... (unique, sequential)
  scope: TransactionType[];
  productCriteria: Criterion[];
  locationCriteria: Criterion[];
  cartConsolidation: boolean;
  orderBy: {
    primary: SortStrategy | null;
    secondary: SortStrategy | null;
  };
  createdAt: ISO8601String;
  updatedAt: ISO8601String;
}

interface SortStrategy {
  field: SortField;
  direction: 'asc' | 'desc';
}

type SortField =
  | 'expiry_affinity'
  | 'sku_match'
  | 'merchant_affinity'
  | 'bin_utilization'
  | 'distance_shipping'
  | 'distance_source'
  | 'cluster_merchant'
  | 'location_level'
  | 'bin_capacity';
```

**Location Schema (Master Data):**
```typescript
interface Location {
  id: string; // BIN-001
  zone_id: string;
  location_group_id: string[];
  storage_type: 'BIN' | 'SHELF' | 'RACK' | 'FLOOR';
  location_level: number; // 1 = ground
  bin_status: 'EMPTY' | 'PARTIAL' | 'FULL';
  temp_zone: 'AMBIENT' | 'CHILLED' | 'FROZEN';
  aisle_id: string;
  // Metrics for sorting
  distance_shipping: number; // meters
  bin_capacity: number; // cubic meters
  utilization_percent: number; // 0-100
  current_contents: {
    merchant_id: string;
    sku_id: string;
    lot_id?: string;
    quantity: number;
  }[];
}
```

### Execution Engine Algorithm

**Function: executePutaway(product, locations, constraints, preferences)**

```typescript
interface ExecutionResult {
  success: boolean;
  assignedLocation?: Location;
  winningPreference?: Preference;
  logs: ExecutionLog[];
  error?: string;
}

interface ExecutionLog {
  phase: 0 | 1 | 2;
  type: 'info' | 'filter' | 'attempt' | 'skip' | 'fail' | 'success';
  ruleId?: string;
  ruleName?: string;
  message: string;
  details?: Record<string, any>;
}
```

**Phase 1 Implementation (Constraints):**

```javascript
function executeConstraints(product, transactionType, locations, constraints) {
  let validLocations = locations.filter(loc =>
    loc.bin_status !== 'FULL' && !loc.locked
  );

  const logs = [{
    phase: 0,
    type: 'info',
    message: `Starting putaway: ${product.sku_id}`,
    details: { initialCandidates: validLocations.length }
  }];

  const activeConstraints = constraints.filter(c =>
    c.enabled && isInScope(c.scope, transactionType)
  );

  for (const constraint of activeConstraints) {
    const productMatches = evaluateCriteria(
      constraint.productCriteria,
      product
    );

    if (!productMatches) {
      logs.push({
        phase: 1,
        type: 'skip',
        ruleId: constraint.id,
        ruleName: constraint.name,
        message: 'Product criteria mismatch'
      });
      continue;
    }

    const beforeCount = validLocations.length;

    validLocations = validLocations.filter(loc => {
      const locationMatches = evaluateCriteria(
        constraint.locationCriteria,
        loc
      );

      if (constraint.action === 'limit_to') {
        return locationMatches; // Keep only matching
      } else {
        return !locationMatches; // Remove matching
      }
    });

    const afterCount = validLocations.length;

    logs.push({
      phase: 1,
      type: 'filter',
      ruleId: constraint.id,
      ruleName: constraint.name,
      message: `Applied ${constraint.action}`,
      details: {
        before: beforeCount,
        after: afterCount,
        dropped: beforeCount - afterCount
      }
    });
  }

  if (validLocations.length === 0) {
    return {
      success: false,
      logs,
      error: 'No valid locations after Hard Constraints'
    };
  }

  return { validLocations, logs };
}
```

**Phase 2 Implementation (Preferences):**

```javascript
function executePreferences(product, transactionType, validLocations, preferences, cartContext) {
  const logs = [...previousLogs];

  const activePreferences = preferences
    .filter(p => p.enabled && isInScope(p.scope, transactionType))
    .sort((a, b) => a.priority - b.priority);

  for (const preference of activePreferences) {
    logs.push({
      phase: 2,
      type: 'attempt',
      ruleId: preference.id,
      ruleName: preference.name,
      message: `Checking priority #${preference.priority}`
    });

    const productMatches = evaluateCriteria(
      preference.productCriteria,
      product
    );

    if (!productMatches) {
      logs.push({
        phase: 2,
        type: 'skip',
        message: 'Product criteria mismatch'
      });
      continue;
    }

    // Cart Consolidation Check
    if (preference.cartConsolidation && cartContext.lastPutLocation) {
      const lastLoc = validLocations.find(
        loc => loc.id === cartContext.lastPutLocation
      );

      if (lastLoc && hasCapacity(lastLoc, product)) {
        logs.push({
          phase: 2,
          type: 'success',
          message: `Follow the Leader: Selected ${lastLoc.id}`
        });

        return {
          success: true,
          assignedLocation: lastLoc,
          winningPreference: preference,
          logs
        };
      } else {
        logs.push({
          phase: 2,
          type: 'info',
          message: 'Last Put Location unavailable, falling back'
        });
      }
    }

    // Normal Scope Filtering
    let candidates = validLocations.filter(loc =>
      evaluateCriteria(preference.locationCriteria, loc)
    );

    if (candidates.length === 0) {
      logs.push({
        phase: 2,
        type: 'fail',
        message: 'Scope found 0 candidates'
      });
      continue;
    }

    // Apply Sorting
    if (preference.orderBy.primary) {
      candidates = sortLocations(
        candidates,
        preference.orderBy,
        product
      );

      logs.push({
        phase: 2,
        type: 'info',
        message: `Sorted ${candidates.length} candidates`,
        details: {
          primarySort: preference.orderBy.primary.field,
          top3: candidates.slice(0, 3).map(c => c.id)
        }
      });
    }

    const selectedLocation = candidates[0];

    logs.push({
      phase: 2,
      type: 'success',
      message: `Selected ${selectedLocation.id}`
    });

    return {
      success: true,
      assignedLocation: selectedLocation,
      winningPreference: preference,
      logs
    };
  }

  return {
    success: false,
    logs,
    error: 'All preferences exhausted with no matches'
  };
}
```

**Helper: evaluateCriteria**

```javascript
function evaluateCriteria(criteria, targetObject) {
  if (!criteria || criteria.length === 0) return true; // No criteria = always match

  return criteria.every(criterion => {
    const actualValue = targetObject[criterion.field];
    const ruleValue = criterion.value;

    switch (criterion.operator) {
      case '=':
        return String(actualValue) === String(ruleValue);
      case '!=':
        return String(actualValue) !== String(ruleValue);
      case '>':
        return Number(actualValue) > Number(ruleValue);
      case '>=':
        return Number(actualValue) >= Number(ruleValue);
      case '<':
        return Number(actualValue) < Number(ruleValue);
      case '<=':
        return Number(actualValue) <= Number(ruleValue);
      case 'between':
        return Number(actualValue) >= Number(ruleValue[0])
            && Number(actualValue) <= Number(ruleValue[1]);
      case 'in':
        return Array.isArray(ruleValue)
          ? ruleValue.includes(actualValue)
          : false;
      case 'exists':
        return actualValue !== null
            && actualValue !== undefined
            && actualValue !== '';
      default:
        return false;
    }
  });
}
```

**Helper: sortLocations**

```javascript
function sortLocations(locations, orderBy, product) {
  return locations.sort((a, b) => {
    // Primary sort
    const primaryDiff = compareByStrategy(
      a, b,
      orderBy.primary.field,
      orderBy.primary.direction,
      product
    );

    if (primaryDiff !== 0) return primaryDiff;

    // Secondary sort (if configured)
    if (orderBy.secondary) {
      const secondaryDiff = compareByStrategy(
        a, b,
        orderBy.secondary.field,
        orderBy.secondary.direction,
        product
      );

      if (secondaryDiff !== 0) return secondaryDiff;
    }

    // Tie-breaker: location_id ASC
    return a.id.localeCompare(b.id);
  });
}

function compareByStrategy(locA, locB, strategy, direction, product) {
  let scoreA, scoreB;

  switch (strategy) {
    case 'expiry_affinity':
      scoreA = locA.current_contents.some(c => c.lot_id === product.lot_id) ? 1 : 0;
      scoreB = locB.current_contents.some(c => c.lot_id === product.lot_id) ? 1 : 0;
      break;
    case 'sku_match':
      scoreA = locA.current_contents.some(c => c.sku_id === product.sku_id) ? 1 : 0;
      scoreB = locB.current_contents.some(c => c.sku_id === product.sku_id) ? 1 : 0;
      break;
    case 'merchant_affinity':
      scoreA = locA.current_contents.some(c => c.merchant_id === product.merchant_id) ? 1 : 0;
      scoreB = locB.current_contents.some(c => c.merchant_id === product.merchant_id) ? 1 : 0;
      break;
    case 'bin_utilization':
      scoreA = locA.utilization_percent;
      scoreB = locB.utilization_percent;
      break;
    case 'distance_shipping':
      scoreA = locA.distance_shipping;
      scoreB = locB.distance_shipping;
      break;
    case 'location_level':
      scoreA = locA.location_level;
      scoreB = locB.location_level;
      break;
    case 'bin_capacity':
      scoreA = locA.bin_capacity;
      scoreB = locB.bin_capacity;
      break;
    case 'cluster_merchant':
      // Simplified: count same-merchant items in aisle
      scoreA = calculateMerchantDensity(locA, product.merchant_id);
      scoreB = calculateMerchantDensity(locB, product.merchant_id);
      break;
    default:
      return 0;
  }

  const diff = scoreA - scoreB;
  return direction === 'asc' ? diff : -diff;
}
```

### State Management & Persistence

**LocalStorage Schema:**
```javascript
{
  "putaway_rules_v1": {
    "constraints": [...],
    "preferences": [...],
    "lastModified": "2026-01-27T10:30:00Z"
  }
}
```

**Auto-save Strategy:**
- Debounced save on any rule change (500ms delay)
- Optimistic UI updates (immediate feedback, save happens async)
- Save indicator in header (green checkmark when synced, spinner when saving)
- Error handling: If save fails, show toast and retry with exponential backoff

**Import/Export:**
- Export button: Downloads JSON file with all rules
- Import button: File upload, validates schema, shows preview before applying
- Share link: Generates base64-encoded URL parameter (future enhancement)

### Performance Considerations

**Phase 1 Target Metrics:**
- Rule card render: <50ms per card
- Modal open: <100ms
- Drag-and-drop response: <16ms (60fps)
- Simulation execution: <500ms for 1000 locations, 20 rules
- Initial page load: <2s (including rule restoration)

**Optimization Strategies:**
- React.memo for rule cards (prevent unnecessary re-renders)
- Virtualized list for 100+ locations in simulator
- Web Workers for heavy simulation (move algorithm off main thread)
- Debounced validation in rule builder (don't validate on every keystroke)
- Lazy load icons (code-split lucide-react imports)

### Accessibility (WCAG 2.1 AA Compliance)

**Keyboard Navigation:**
- Tab order: Header → Sidebar → Rule cards → Actions
- Arrow keys: Navigate between rule cards
- Enter/Space: Toggle enable/disable, open modals
- Escape: Close modals, cancel drag operations
- Cmd+S: Save current rule (in modal)

**Screen Reader Support:**
- ARIA labels on all interactive elements
- Live regions for toast notifications (aria-live="polite")
- Role="dialog" on modals with aria-labelledby
- Status announcements on simulation results

**Visual Accessibility:**
- Color contrast ratios: 4.5:1 minimum for text
- Not relying on color alone (icons + labels for status)
- Focus indicators: 2px blue outline on all focusable elements
- Text resizing: Supports up to 200% zoom without horizontal scroll

**Reduced Motion:**
- Respect prefers-reduced-motion media query
- Disable animations (use instant transitions instead)
- No auto-playing confetti or heavy visual effects

## 6. Mock Data Strategy

### Sample Rules (Pre-populated)

**Hard Constraints:**
1. "Heavy Item Safety" - weight > 20kg → location_level ≤ 2
2. "Hazmat Isolation" - hazmat_class != NONE → zone_id IN [Hazmat_Cage]
3. "Temperature Control" - temp_zone = FROZEN → temp_zone = FROZEN
4. "Merchant Separation" - merchant_id = Pact → zone_id IN [Zone_3]

**Preferences:**
1. "Cart Consolidation (All)" - Any → cart_consolidation=true
2. "FEFO Placement" - is_lot_controlled=true → bin_status=PARTIAL, sort by expiry_affinity + bin_utilization
3. "Fast Mover Golden Zone" - abc_code=A → zone_id IN [Zone_A_Golden], sort by distance_shipping
4. "Catch-All Fallback" - (no criteria) → bin_status=EMPTY, sort by distance_shipping

### Sample Locations (50 generated)

**Zone Distribution:**
- Zone_A_Golden: 10 locations (bins 1-10)
- Zone_B_Standard: 20 locations (bins 11-30)
- Zone_C_Reserve: 15 locations (bins 31-45)
- Hazmat_Cage: 3 locations (bins 46-48)
- Zone_Frozen: 2 locations (bins 49-50)

**Location Attributes:**
- Varied levels (1-5)
- Mixed status (30% empty, 60% partial, 10% full)
- Realistic distance metrics (10-100m to shipping)
- Some pre-populated with merchant inventory for affinity testing

### Sample Products (Test Scenarios)

**Pre-configured Test Cases:**
1. "Heavy Pallet" - 50kg, Pallet, Pact merchant
2. "Fast Mover Unit" - 5kg, Unit, ABC=A, Nike merchant
3. "Frozen Item" - 10kg, Case, temp_zone=FROZEN
4. "Hazmat Product" - 8kg, Unit, hazmat_class=FLAMMABLE
5. "Lot-Controlled Item" - 3kg, Unit, is_lot_controlled=true, lot_id=LOT-ABC-123

**Quick-load buttons in simulator:**
- Clicking test case auto-fills form
- Allows rapid testing of different scenarios

## 7. Future Phase Roadmap

### Phase 2: Advanced Features (Weeks 2-3)
- Composite sorting with tie-breaker visualization
- All 9 Order By strategies fully implemented
- Follow the Leader with session tracking
- Rule templates library
- Bulk rule operations (enable/disable multiple)
- Rule duplication

### Phase 3: Conflict Detection (Weeks 4-5)
- Self-conflict detection algorithm
- Inter-rule conflict detection
- Dead preference warnings
- Conflict resolution interface
- Side-by-side rule comparison
- Location browser (master data viewer)
- Impact metrics (affected product counts)
- Async simulation of background detection

### Phase 4: Production Readiness (Week 6)
- Rule versioning and history
- Audit trail (who changed what when)
- Role-based access control (viewer vs editor)
- Staged deployment (draft vs published)
- A/B testing framework (compare rule sets)
- Performance dashboard (rule hit rates, avg execution time)
- Integration API specs (REST endpoints for backend)

## 8. Success Criteria

### Phase 1 Completion Criteria

**Functional:**
- ✅ User can create, edit, delete constraints with all PRD fields
- ✅ User can create, edit, delete preferences with all PRD fields
- ✅ User can reorder preferences via drag-and-drop or arrows
- ✅ User can enable/disable rules with immediate effect
- ✅ User can run simulator with custom product scenarios
- ✅ Simulator shows correct execution trace per PRD logic
- ✅ Rules persist across page reloads
- ✅ Export/import rules as JSON

**User Experience:**
- ✅ Interface is intuitive for first-time users (max 5min to create first rule)
- ✅ Power users can manage 20+ rules efficiently
- ✅ Validation prevents invalid rule configurations
- ✅ Error messages are clear and actionable
- ✅ Simulation results are easy to understand (non-technical users can interpret)

**Technical:**
- ✅ All interactions respond within 100ms
- ✅ No console errors or warnings
- ✅ Works in Chrome, Firefox, Safari (latest versions)
- ✅ Responsive design supports 1280px-1920px screen widths
- ✅ Code is documented and maintainable

### Validation Approach

**Stakeholder Demo:**
- Walk through 3 real-world scenarios from Appendix A (PRD)
- Show constraint filtering, preference ranking, trace output
- Collect feedback on UI clarity and workflow efficiency

**User Testing:**
- 5 WMS operators create rules for their own use cases (no guidance)
- Measure: Time to first rule, errors made, satisfaction score (1-10)
- Target: Average 4min to first rule, <2 errors, 8+ satisfaction

**Engineering Review:**
- Code review for architecture, performance, maintainability
- Verify execution logic matches PRD Section 5 exactly
- Stress test with 50 rules, 1000 locations (must complete <1s)

## 9. Open Questions & Decisions Needed

### Deferred to Implementation
1. **Master data source:** Where do zones, location_groups, locations come from? (Mock in Phase 1, API in future)
2. **Real-time updates:** If another user changes rules, how to sync? (Not in scope for Phase 1)
3. **Mobile support:** Is mobile UI needed? (No - warehouse planners use desktop)
4. **Localization:** Multi-language support? (No - English only in Phase 1)

### Design Clarifications Needed
1. **Rule naming conflicts:** Should we prevent duplicate names? (Recommendation: Allow but warn)
2. **Transaction scope "Any":** Does it include future transaction types? (Yes - explicitly documented)
3. **Empty sort strategy:** Is it valid to have no orderBy in preferences? (Yes - random selection from scope)
4. **Simulator cart context:** How to specify Last Put Location for testing? (Add "Previous Cart Assignments" section in form)

## 10. Appendix: Component Hierarchy

```
App
├── Header
│   ├── Logo
│   ├── TabSwitcher
│   └── StatusIndicator
├── ConfigurationView
│   ├── Sidebar (Funnel)
│   │   ├── PhaseButton (Constraints)
│   │   └── PhaseButton (Preferences)
│   └── MainContent
│       ├── PhaseHeader
│       │   ├── Title
│       │   ├── Description
│       │   └── AddButton
│       └── RuleList
│           ├── ConstraintCard (multiple)
│           │   ├── RuleIdentity
│           │   ├── ProductCriteria
│           │   ├── LocationCriteria
│           │   └── Actions
│           └── PreferenceCard (multiple)
│               ├── DragHandle
│               ├── PriorityBadge
│               ├── RuleIdentity
│               ├── ProductCriteria
│               ├── LocationCriteria
│               ├── SortStrategy
│               └── Actions
├── SimulatorView
│   ├── ScenarioBuilder
│   │   ├── TransactionTypeSelector
│   │   ├── ProductForm
│   │   │   ├── IdentitySection
│   │   │   ├── PhysicalSection
│   │   │   ├── ClassificationSection
│   │   │   └── SpecialSection
│   │   └── RunButton
│   └── ExecutionTrace
│       ├── ResultCard
│       └── LogTimeline
│           ├── Phase0Log
│           ├── Phase1Log (multiple)
│           └── Phase2Log (multiple)
└── Modals
    ├── RuleBuilderModal
    │   ├── Header
    │   ├── Body
    │   │   ├── RuleIdentitySection
    │   │   ├── TransactionScopeSection
    │   │   ├── ProductCriteriaSection
    │   │   ├── LocationCriteriaSection
    │   │   ├── OrderBySection (preferences only)
    │   │   └── RulePreviewPanel
    │   └── Footer
    ├── ConfirmDeleteDialog
    └── ToastNotification
```

## 11. Conclusion

This design provides a complete blueprint for Phase 1 implementation of the WMS Putaway Rules Engine Configuration UI. The design prioritizes:

1. **Clarity** - Two-phase funnel is visually prominent throughout the interface
2. **Efficiency** - Power users can manage complex rule sets without friction
3. **Safety** - Validation prevents invalid configurations; simulator allows safe testing
4. **Scalability** - Architecture supports Phases 2-4 without major refactoring

**Next Steps:**
1. Review and approve this design document
2. Set up development environment (Vite + React + Tailwind)
3. Implement core components (4-5 days)
4. Integrate execution engine (2-3 days)
5. User testing and refinement (2 days)
6. Stakeholder demo and sign-off

**Estimated Timeline:** 10-12 business days for Phase 1 completion

---

**Document Status:** Ready for Implementation
**Approval Required From:** Product Owner, Engineering Lead, UX Stakeholder
