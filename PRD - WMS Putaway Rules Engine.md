Project Name: Putaway Logic Configuration (The "Funnel" Engine)
Version: 3.0
Status: Draft

## 1. Executive Summary

The current WMS putaway logic is rigid. To support a multi-client B2B/B2C warehouse, we require a configurable **Putaway Rules Engine**. This engine acts as a **Single Logical Engine** handling all types of putaway transactions (Inbound PO, Replenishment, Returns) through contextual rules.

It adopts a **Two-Phase Funnel** model to balance compliance with optimization:
- **Hard Constraints**: Non-negotiable rules that filter out illegal locations.
- **Preferences**: Prioritized strategies that select the best location from the remaining candidates.

To enable continuous improvement without the complexity of proactive conflict detection, the system includes a **Defect Logging System** that records runtime exceptions where the engine fails to produce usable recommendations or where stowers override system guidance.

**Target Users**:
- **WMS Subject Matter Experts (Process Engineers)**: Configure rules and tune based on defect feedback
- **Operations Managers**: Monitor putaway performance and troubleshoot operational issues in real-time

**Core Principle**: Never block warehouse work. When rules fail to produce valid locations, stowers can override with reason codes. The defect log provides visibility into these exceptions, enabling data-driven rule refinement.

## 2. Architectural Concepts

### 2.1 The "Two-Phase Funnel" Execution

- **Hard Constraints (The Filter):** Starts with *All Locations* and removes any location that violates an active rule. All active constraints apply simultaneously (Implicit AND). If the result is 0 locations, the Putaway fails.
- **Preferences (The Sorter):** Takes the "Valid Locations" from Phase 1 and selects the *best* one. The system attempts Preference #1; if no valid locations match or exist, it falls through to Preference #2, and so on.

### 2.2 Rule Scope (Transaction Context)

Every rule (in both phases) must define its **Scope**. The user must specify which Transaction Types the rule applies to.

| Value | Description |
| ----- | ----------- |
| Any | Applies to all transaction types |
| Inbound PO | Receiving from purchase orders |
| Replenishment | Moving inventory from reserve to pick locations |
| Customer Return | Processing returned items |
| Inventory Transfer | Warehouse-to-warehouse transfers |

### 2.3 Field Evaluation Timing

Fields in the Master Data Dictionary are evaluated at different times:

| Evaluation Time    | Fields                                                                        | Description                                                        |
| ------------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Configuration Time | `zone_id`, `location_group_id`, `storage_type`, `location_level`, `temp_zone` | Static location attributes that don't change frequently            |
| Execution Time     | `bin_status`, `single_merchant_only`                                          | Dynamic attributes evaluated when the putaway request is processed |

### 2.4 Iterative Cart Processing ("Follow the Leader")

For Inbound Carts containing multiple items, the engine runs **iteratively** (one item at a time) per stower session.

#### 2.4.1 Key Definitions

| Term              | Definition                                                                                      |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| Cart ID           | Virtual cart identifier that groups items being put away together                               |
| Stower            | The associate performing the putaway operation                                                  |
| Last Put Location | The bin where the previous item from the same cart was assigned                                 |

#### 2.4.2 Cart Consolidation Behavior

When a preference has `cartConsolidation: TRUE`:

1. **First item in cart**: No "Last Put Location" exists → Apply normal locationCriteria + orderBy logic
2. **Subsequent items**:
   - If Last Put Location exists AND passes all hard constraints AND has capacity → Select it
   - Otherwise → Fall back to normal locationCriteria + orderBy logic within the same preference

**Note**: To optimize travel distance for subsequent items, configure "Proximity to Last Location" as an orderBy field (primary or secondary). This will sort candidate locations by distance from the Last Put Location when available.

#### 2.4.3 Concurrency

Cart consolidation applies to a single stower's session. Multiple stowers working from the same cart ID operate independently with their own Last Put Location tracking.

## 3. Master Data Dictionary

### 3.1 Product Criteria (The Trigger)

Defines the "IF" condition. Users can combine multiple fields using **AND** logic.

| Field Name | Type | Operators | Description |
| ---------- | ---- | --------- | ----------- |
| `merchant_id` | String | `=` | Client isolation. Example: "Pact inventory must go to Zone 3." |
| `inventory_status` | Enum | `=` | Quality control routing. Values: `GOOD`, `DAMAGED`, `QUARANTINE`, `RETURNED` |
| `pack_type` | Enum | `=` | Physical form factor. Values: `UNIT`, `CASE`, `PALLET` |
| `abc_code` | Enum | `=` | Velocity classification. Values: `A`, `B`, `C` |
| `is_oversized` | Boolean | `=` | Large item flag (threshold defined in product master). Example: "Oversized items must go to Floor Storage." |
| `weight` | Decimal | `>`, `>=`, `<`, `<=`, `between` | Unit weight in system-configured UOM. Example: "Items > 20kg must go to Level 1." |
| `hazmat_class` | Enum | `=` | Hazardous materials classification. Values: `NONE`, `FLAMMABLE`, `CORROSIVE`, `TOXIC`, `OXIDIZER` |
| `temp_zone` | Enum | `=` | Temperature requirement. Values: `AMBIENT`, `CHILLED`, `FROZEN` |
| `sku_id` | String | `=`, `in` | SKU-level exceptions. Example: "SKU-123 is high theft; put in Security Cage." |
| `is_lot_controlled` | Boolean | `=` | Whether product requires lot/expiry tracking for FEFO. |

**Note**: When `is_lot_controlled = TRUE`, the system requires lot/expiry input from the associate before generating a location recommendation.

### 3.2 Location Criteria (The Scope/Filter)

Defines the target locations. Users can combine multiple fields using **AND** logic.

| Field Name             | Type    | Operators                  | Action             | Description                                                                 |
| ---------------------- | ------- | -------------------------- | ------------------ | --------------------------------------------------------------------------- |
| `zone_id`              | List    | `in`                       | Limit To / Exclude | Physical zoning. Example: "Target Zone A."                                  |
| `location_group_id`    | List    | `in`                       | Limit To / Exclude | Logical grouping across zones. Example: "Target Flammable Cabinet."         |
| `storage_type`         | Enum    | `=`                        | Limit To / Exclude | Physical equipment type. Values: `BIN`, `SHELF`, `RACK`, `FLOOR`            |
| `location_level`       | Integer | `=`, `<=`, `>=`, `between` | Limit To / Exclude | Vertical position (1 = ground). Example: "Heavy items → Level <= 2."        |
| `bin_status`           | Enum    | `=`                        | Limit To           | Current occupancy. Values: `EMPTY`, `PARTIAL`. Evaluated at execution time. |
| `temp_zone`            | Enum    | `=`                        | Limit To / Exclude | Location temperature capability. Values: `AMBIENT`, `CHILLED`, `FROZEN`     |
| `single_merchant_only` | Boolean | `=`                        | Limit To           | When TRUE, exclude bins containing other merchants' inventory.              |
| `aisle_id`             | String  | `=`, `in`                  | Limit To / Exclude | Aisle identifier for clustering and congestion management.                  |

**Notes**:
- List fields (`zone_id`, `location_group_id`) use OR logic within the list (location in Zone-A OR Zone-B)
- A location can belong to multiple location groups
- `FULL` bins are automatically excluded from candidates

## 4. Phase Configuration Rules

### 4.1 Hard Constraints (The "Must Do" Rules)

- **Logic:** Implicit AND (All active rules must pass)
- **Action Types:** `Limit To` (whitelist) or `Exclude` (blacklist)

**Configuration:**
- **Trigger:** Select fields from Section 3.1 (Product Criteria)
- **Filter:** Select fields from Section 3.2 (Location Criteria)
- **Action:** Choose `Limit To` or `Exclude`

### 4.2 Preferences (The "Should Do" Rules)

- **Logic:** Sequential OR (Priority 1 → Priority 2 → Fall-through)
- **Priority:** Numeric value (1, 2, 3...). No duplicate priorities allowed. Users reorder via drag-and-drop.

**Configuration:**
- **Trigger:** Select fields from Section 3.1 (Product Criteria)
- **Location Criteria:** Select fields from Section 3.2 (Location Criteria)
- **Order By:** Select strategies from Section 4.3 (supports primary + secondary)
- **Cart Consolidation:** Optional flag to enable "Follow the Leader" behavior

### 4.3 Order By (Sorting Strategies)

Applicable to Preferences only. Strategies are **soft preferences**—they sort candidates but do not exclude them.

| Strategy Name                  | Logic Description                                                                                      | Use Case                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------ | -------------------------- |
| **Prioritize Same Lot/Expiry** | Sort bins containing same Lot/Expiry to top. Requires `is_lot_controlled = TRUE` and lot/expiry input. | FEFO integrity             |
| **Prioritize Same SKU**        | Sort bins containing same SKU to top.                                                                  | Consolidation              |
| **Prioritize Same Merchant**   | Sort bins containing same merchant's inventory to top.                                                 | Soft merchant clustering   |
| **Fill Most Full (Top-off)**   | Sort by Utilization % DESC.                                                                            | Maximize space utilization |
| **Fill Least Full (Spread)**   | Sort by Utilization % ASC.                                                                             | Avoid congestion           |
| **Closest to Shipping Dock**   | Sort by dock proximity score ASC (lower = closer).                                                     | Fast mover optimization    |
| **Cluster by Merchant**        | Sort by count of same-merchant items in the aisle DESC. Requires `aisle_id` on locations.              | Organic merchant zones     |
| **Proximity to Last Location** | Sort by distance from Last Put Location ASC. | Travel optimization |
| **Fill Bottom Levels First**   | Sort by Location Level ASC.                                                                            | Ergonomics / Safety        |
| **Smallest Bin First**         | Sort by Bin Capacity ASC.                                                                              | Space optimization         |

**Composite Strategies**: When primary and secondary Order By are configured, sort by primary first, then by secondary for ties.

**Tie-Breaker**: When all configured strategies result in ties, sort by `location_id ASC` for deterministic results.

**Notes**:
- "Prioritize Same Lot/Expiry" and "Prioritize Same SKU" are soft preferences—bins without matching lot/SKU are sorted lower, not excluded
- "Cluster by Merchant" calculates a density score based on neighboring bins in the same aisle; for new merchants with no existing inventory, this has no effect
- "Proximity to Last Location" requires cart context with Last Put Location; when unavailable (first item in cart), this orderBy is skipped
- "Closest to Shipping Dock" uses a `dock_proximity_score` configured per location (1 = nearest)

## 5. Logical Flow

The system executes the Putaway Logic in the following sequence for every inventory unit/LPN:

```
1. INITIALIZE
   └─ L = All active, non-locked, non-full storage locations

2. EXECUTE HARD CONSTRAINTS
   │
   ├─ For each active Constraint C (where Transaction Scope matches):
   │   │
   │   ├─ Does product match C.ProductCriteria? (AND logic)
   │   │   │
   │   │   ├─ YES: Apply C.LocationFilter to L
   │   │   │       - If Action = "Limit To": L = L ∩ FilteredLocations
   │   │   │       - If Action = "Exclude": L = L - FilteredLocations
   │   │   │
   │   │   └─ NO: Skip this constraint
   │   │
   │   └─ Continue to next constraint
   │
   └─ Result: L contains only "Legal Candidates"
      └─ If L is empty:
          ├─ LOG DEFECT (type: ZERO_LOCATIONS, failure_point: Phase 1, rule_trace)
          ├─ PROMPT stower: "No valid locations. Select reason and scan location."
          ├─ VALIDATE scanned location (not full, not locked)
          └─ COMPLETE putaway with actual_location → TERMINATE

3. EXECUTE PREFERENCES
   │
   ├─ Sort active Preferences by Priority ASC
   │
   ├─ For each Preference P (where Transaction Scope matches):
   │   │
   │   ├─ Does product match P.ProductCriteria? (AND logic)
   │   │   │
   │   │   ├─ NO: Skip to next preference
   │   │   │
   │   │   └─ YES:
   │   │       │
   │   │       ├─ If P.CartConsolidation = TRUE:
   │   │       │   │
   │   │       │   ├─ Last Put Location exists for this Cart+Stower?
   │   │       │   │   │
   │   │       │   │   ├─ YES: Is it in L and has capacity?
   │   │       │   │   │   ├─ YES → Assign to Last Put Location → GOTO STOWER SCAN
   │   │       │   │   │   └─ NO → Continue to standard check below
   │   │       │   │   │
   │   │       │   │   └─ NO: Continue to standard check below
   │   │       │   │
   │   │       │
   │   │       ├─ STANDARD CHECK:
   │   │       │   ├─ L' = Apply P.LocationCriteria to L
   │   │       │   ├─ Sort L' using P.OrderBy (primary, then secondary)
   │   │       │   ├─ Apply tie-breaker (location_id ASC)
   │   │       │   │
   │   │       │   ├─ L' has candidates?
   │   │       │   │   ├─ YES → Assign top location → Update Last Put Location → GOTO STOWER SCAN
   │   │       │   │   └─ NO → Fall through to next preference
   │   │       │
   │   └─ Continue to next preference
   │
   └─ All preferences exhausted:
       ├─ LOG DEFECT (type: ZERO_LOCATIONS, failure_point: Phase 2, rule_trace)
       ├─ PROMPT stower: "No valid locations. Select reason and scan location."
       ├─ VALIDATE scanned location (not full, not locked)
       └─ COMPLETE putaway with actual_location → TERMINATE

4. STOWER SCAN
   │
   ├─ Display recommended_location to stower
   ├─ Stower scans location
   │
   ├─ IF actual_location == recommended_location:
   │   ├─ COMPLETE putaway → SUCCESS
   │   └─ Create soft reservation for Cart+Stower session
   │
   └─ IF actual_location != recommended_location:
       ├─ PROMPT stower: "You scanned a different location. Why?"
       ├─ Stower selects reason code
       ├─ VALIDATE scanned location (not full, not locked)
       ├─ LOG DEFECT (type: STOWER_OVERRIDE, recommended_location, actual_location, reason_code)
       └─ COMPLETE putaway with actual_location → SUCCESS
```

**Important Notes**:
- Users should configure a catch-all preference (e.g., lowest priority, no product criteria, targets any empty bin) to minimize zero-location failures
- Capacity check is not included in this version (see Out of Scope)
- System never blocks putaway work - stowers can always scan a location with reason code

## 6. Defect Logging and Observability

### 6.1 What is a Defect?

A defect is any putaway attempt where the rules engine did not successfully guide the stower to a location. Two types exist:

#### 6.1.1 Zero Valid Locations (Engine Failure)

**Definition**: The putaway engine cannot recommend any location for a given product.

**Causes**:
- **Phase 1 Failure**: Hard constraints eliminate all candidate locations (L becomes empty)
- **Phase 2 Failure**: No preferences match the product, or all matching preferences have zero candidates

**Stower Experience**:
- System displays: "No valid locations found. Please scan any available location."
- Stower must:
  1. Select a reason code (required dropdown)
  2. Scan the chosen location
  3. System validates basic safety (bin not full, not locked)
  4. Putaway completes

**Reason Codes** (predefined list):
- Bin damaged/blocked
- Congestion/traffic
- Closer to staging area
- Better ergonomics
- Other (free text)

#### 6.1.2 Stower Override (Guidance Ignored)

**Definition**: The putaway engine recommended a location, but the stower scanned a different location.

**Stower Experience**:
- System displays: "Recommended: BIN-A-01-05"
- Stower scans different location (e.g., BIN-A-02-10)
- System prompts: "You scanned a different location. Why?" (required dropdown)
- Stower selects reason code (same list as above)
- System validates basic safety
- Putaway completes

### 6.2 Data Model

#### 6.2.1 Defect Record Schema

Each defect record captures the following fields:

| Field Name | Type | Description |
| ---------- | ---- | ----------- |
| `defect_id` | UUID | Unique identifier |
| `timestamp` | Datetime | When the putaway attempt occurred |
| `defect_type` | Enum | `ZERO_LOCATIONS` or `STOWER_OVERRIDE` |
| `transaction_type` | Enum | `Inbound PO`, `Replenishment`, `Customer Return`, etc. |
| `stower_id` | String | Associate performing the putaway |
| `product_id` | String | SKU being put away |
| `matched_constraints` | Array | List of constraint rule IDs that matched this product |
| `matched_preference` | String | Preference rule ID that matched (null if Phase 2 failed) |
| `valid_locations` | Array | Location IDs that passed all filters (empty if ZERO_LOCATIONS) |
| `recommended_location` | String | Top location after Order By sorting (null if ZERO_LOCATIONS) |
| `actual_location` | String | Location where stower actually put the item |
| `override_reason_code` | Enum | Reason selected by stower (null if no override) |
| `override_reason_text` | String | Free text if reason code = "Other" |
| `rule_trace` | JSON | Execution details (which rules eliminated locations, which preferences were attempted) |

#### 6.2.2 Rule Trace Structure

**For Zero-Location Defects (Phase 1 Failure):**
```json
{
  "phase1_result": {
    "initial_location_count": 500,
    "constraints_applied": [
      {
        "rule_id": "CONS-001",
        "rule_name": "Merchant Zones",
        "action": "Limit To",
        "locations_after": 120
      },
      {
        "rule_id": "CONS-005",
        "rule_name": "Heavy Item Safety",
        "action": "Limit To",
        "locations_after": 0
      }
    ],
    "final_location_count": 0,
    "failure_point": "Phase 1"
  },
  "phase2_result": null
}
```

**For Zero-Location Defects (Phase 2 Failure):**
```json
{
  "phase1_result": {
    "initial_location_count": 500,
    "final_location_count": 200
  },
  "phase2_result": {
    "preferences_attempted": [
      {
        "priority": 1,
        "rule_id": "PREF-003",
        "rule_name": "FEFO Placement",
        "matched": false,
        "reason": "Product not lot-controlled"
      },
      {
        "priority": 2,
        "rule_id": "PREF-004",
        "rule_name": "SKU Consolidation",
        "matched": true,
        "candidates_found": 0,
        "reason": "No locations match location criteria"
      }
    ],
    "failure_point": "Phase 2"
  }
}
```

#### 6.2.3 Data Retention

- **Retention Period**: Rolling 90-day window
- **Automatic Cleanup**: Defects older than 90 days are archived and purged from active database
- **Archive Strategy**: (Out of scope for V1 - no long-term storage)

### 6.3 Defect UI

#### 6.3.1 Access Control

**Who Can View**: Operations Managers and WMS SMEs (anyone with rule configuration or operational oversight permissions)

**No Role-Based Filtering**: All users see the same defect list (no tiered access)

#### 6.3.2 Defect List View

**Layout**: Simple table displaying individual defect records (no aggregation or grouping)

**Columns**:
- Timestamp
- Defect Type (badge: "Zero Locations" or "Override")
- Product ID / SKU
- Transaction Type
- Stower
- Recommended Location (blank if Zero Locations)
- Actual Location
- Override Reason

**Sorting**: Default sort by timestamp descending (newest first)

**Filtering**:
- Date range picker (default: last 7 days)
- Defect type filter (Zero Locations / Override / All)
- Transaction type filter
- Product search (SKU or product attributes)
- Stower search

**Pagination**: 50 records per page

#### 6.3.3 Defect Detail View

Clicking a row opens a detail panel showing:

**Product Context**:
- Full product attributes (merchant, pack type, ABC code, weight, hazmat, temp zone, etc.)

**Rule Execution Trace** (for Zero-Location defects):
- Phase 1: Which constraints matched, how many locations remained after each
- Phase 2: Which preferences were attempted, why they failed
- Visual representation (e.g., "500 locations → 120 → 0")

**Location Context**:
- Recommended location (if applicable): Zone, storage type, level, current status
- Actual location: Same details
- Valid locations list: All candidate locations that passed filters (expandable list)

**Override Context** (for Override defects):
- Reason code selected by stower
- Free text (if "Other" was selected)

**Actions**: None (view-only)

#### 6.3.4 Real-Time Dashboard (Operations)

**Purpose**: Live monitoring of putaway performance

**Metrics**:
- Defect count today (current shift)
- Defect rate: (defects / total putaways) %
- Breakdown by type: Zero Locations vs. Override
- Top 5 products by defect count today

**Chart**: Defect trend over last 24 hours (hourly buckets)

**Live Feed**: Last 10 defects with one-line summary

#### 6.3.5 Historical Reports (SMEs)

**Purpose**: Trend analysis for rule tuning

**Pre-built Reports**:
1. **Defect Summary by Day**: Daily defect counts and rates over selected period
2. **Top Defect Products**: Products with highest defect counts
3. **Top Override Reasons**: Frequency distribution of reason codes
4. **Rule Performance**: Which rules appear most often in Zero-Location traces

**Export**: CSV download for offline analysis

### 6.4 Stower UI Changes

**Current State**: System shows recommended location, stower scans location

**New State**:
- If recommendation exists: Show recommended location + allow different scan with reason code prompt
- If no recommendation: Show "No valid locations" message, require reason code before scan

**Mobile UX** (Handheld Device):
```
┌─────────────────────────────┐
│ Putaway Task                │
│ SKU: ABC-123                │
│ Qty: 1 Unit                 │
│                             │
│ Recommended Location:       │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━┓   │
│ ┃   BIN-A-01-05         ┃   │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━┛   │
│                             │
│ Scan Location: [________]   │
│                             │
│ [Confirm]                   │
└─────────────────────────────┘
```

If scanned location ≠ recommended:
```
┌─────────────────────────────┐
│ Override Confirmation       │
│                             │
│ Recommended: BIN-A-01-05    │
│ You scanned: BIN-B-03-12    │
│                             │
│ Why are you using a         │
│ different location?         │
│                             │
│ [ Select Reason ▼ ]         │
│   - Bin damaged/blocked     │
│   - Congestion/traffic      │
│   - Closer to staging       │
│   - Better ergonomics       │
│   - Other                   │
│                             │
│ [Cancel]  [Confirm Override]│
└─────────────────────────────┘
```

## 7. Out of Scope

### 7.1 Capacity and Volumetric Checks
- **Bin capacity validation**: Checking if recommended bin can physically fit the item
- **Volumetric calculations**: L×W×H based bin fitting
- **Weight capacity validation**: Checking location weight limits

### 7.2 Advanced Analytics
- **Aggregated defect patterns**: e.g., "47 overrides for SKU-123 in Zone-A"
- **Machine learning**: Predict rule failures or suggest rule changes
- **Automated rule suggestions**: System-generated recommendations based on defect patterns

### 7.3 Defect Management Actions
- **Acknowledge/dismiss defects**: Mark defects as reviewed
- **Assign defects**: Assign to specific engineers for resolution
- **Link to tickets**: Connect defects to rule change tickets

### 7.4 Long-Term Data Retention
- **Archive beyond 90 days**: Long-term storage of defect data
- **Historical trend analysis**: Beyond 90-day retention window

### 7.5 Automated Alerting
- **Slack/email notifications**: When defect rate spikes
- **Threshold-based alerts**: For specific products or zones

### 7.6 Defect Resolution Workflow
- **Guided flow**: From defect to rule editing
- **A/B testing**: Test rule changes before full deployment
- **Impact simulation**: Preview rule changes before deployment

### 7.7 Version Control
- **Rule versioning**: Change history
- **Rollback capability**: Revert to previous rule configurations
- **Staged deployment**: Draft → production promotion

### 7.8 Advanced Product Criteria
- **Dimension-based rules**: L×W×H comparisons for precise bin fitting
- **Product category/type**: Broad classification rules
- **True best-fit algorithm**: (bin capacity - item size) optimization

## 8. FAQ

**Q1: Should we use separate engines for Inbound PO, Replenishment, and Returns?**

No. We use a single engine with a Transaction Scope field. This avoids redundancy. For example, a safety rule like "Max Weight 20kg on high shelves" applies to all transactions. A single engine ensures this safety rule is configured once and enforced globally, whereas separate engines would require triple maintenance and increase the risk of safety gaps.

**Q2: How do we handle "Cart Consolidation" (keeping multiple items from the same cart together)?**

We use an iterative "Follow the Leader" strategy with a preference-level `cartConsolidation` flag. The engine processes one item at a time per stower. The first item finds the best bin based on normal preference logic. Subsequent items check if the Last Put Location is still valid; if so, they're assigned there. If not (bin full or violates constraints), they fall back to normal preference logic. This gracefully handles overflows without failing.

**Q3: Why is the "Funnel" Model (Constraint vs. Preference) better than a "Rule Block" Model?**

It decouples Safety from Strategy. In a Rule Block model, safety constraints must be repeated inside every strategy rule. If a user creates a new "Fast Mover" rule but forgets to add the "Hazmat Exclusions," they create a safety violation. In the Funnel Model, Safety is a global "Hard Constraint" (Phase 1) that runs first. No matter what Strategy (Phase 2) is chosen, it is physically impossible for the system to select an illegal bin.

**Q4: Why are SKU Mix Limits and Lot Mixing not in the Rules Engine?**

These are static physical or item-level constraints, not dynamic rules. A bin's capacity (e.g., "Max 3 SKUs") is defined by its physical size and master data. Forcing a user to configure this in a Rules Engine creates a risk of data conflict (e.g., Rule says "Max 5" but Bin Master says "Max 3"). The engine respects these limits implicitly via Master Data checks.

**Q5: Why is a Rule-Based System better suited than Mathematical Optimization (Black Box)?**

- **Transparency:** Operations needs to know *why* an item went to a specific bin (e.g., "Because Rule 1 failed"). Optimization solvers return opaque scores (e.g., "Score: 0.84") that are impossible to debug/audit.
- **Agility:** Warehouse strategies change seasonally. A rule-based system allows a Super User to drag-and-drop "Fill Empty Bins" to Priority 1 during Peak Season. Optimization solvers require complex weight retuning that usually demands code deployment.
- **Resilience:** Solvers are fragile; if data (dimensions) is slightly off, they often fail to find a solution. Heuristic rules naturally "fall through" to the next best option, ensuring work continues.

**Q6: Why do we prefer "Prioritize Same Lot/SKU" in Order By rather than Location Criteria?**

Using them in Location Criteria creates a "Hard Filter" (e.g., "ONLY show bins with this SKU"). If no such bin exists, the rule fails immediately. Using them in Order By is softer and more opportunistic (e.g., "Try to find a bin with this SKU first; if not, finding an empty bin in the same zone is acceptable"). This reduces the number of fallback rules needed.

**Q7: How does "Cluster by Merchant" work?**

This strategy calculates a "Merchant Density Score" for the aisle of each candidate bin. It ranks bins higher if their neighbors already store items from the same merchant. This allows the warehouse to naturally form "Merchant Zones" over time without strictly hard-coding "Merchant A = Aisle 10" in the configuration, allowing for flexible growth. For new merchants with no existing inventory, this strategy has no effect and falls through to secondary sorting.

**Q8: Why doesn't the system check bin capacity before recommending a location?**

Capacity validation (volumetric fit, weight limits) is deferred to a future phase. In V1, the system assumes that location candidates derived from constraints and preferences can physically accommodate the item. Users should configure constraints (e.g., "Pallets → Rack storage type only") to implicitly enforce fit. Full capacity checking requires dimension data on both products and locations, which adds complexity.

**Q9: What happens if a product's ABC code changes?**

ABC codes are typically recalculated periodically based on velocity data. When a product's ABC code changes, only new putaway is affected—existing inventory in the warehouse doesn't automatically move. This is expected behavior; relocating existing inventory would be handled by a separate slotting optimization process.

**Q10: Why not detect conflicts proactively at configuration time?**

Proactive conflict detection is technically complex (requires evaluating all active products against all rule combinations) and creates UX challenges (how do users resolve abstract conflicts before seeing real-world impact?). The defect logging approach shifts complexity from prediction to observation. SMEs tune rules based on actual operational failures, not theoretical scenarios.

**Q11: Won't allowing stowers to override create chaos?**

No. The system still validates basic safety (bin not full, not locked). Overrides with reason codes provide valuable feedback about why recommendations don't work in practice. If override rates are high, it signals that rules need tuning, not that stowers are making bad decisions.

**Q12: How do SMEs know which rules to fix when they see defects?**

The rule trace in each defect record shows exactly which constraints eliminated locations or which preferences failed to find candidates. SMEs can see patterns (e.g., "Constraint XYZ appears in 80% of Zero-Location defects") and prioritize tuning high-impact rules.

**Q13: What if the defect list gets overwhelmed with thousands of records?**

Filtering by date range, product, and defect type keeps the list manageable. The real-time dashboard highlights current issues. For deeper analysis, SMEs can export to CSV. If volume becomes unmanageable, it indicates systemic rule problems that need immediate attention.

**Q14: Why 90-day retention instead of keeping all historical data?**

Defect data is high-volume and primarily used for recent trend analysis. Keeping 90 days balances operational needs (see seasonal patterns, compare week-over-week) with database costs. Long-term archival can be added later if business need emerges.

**Q15: Why is "Proximity to Last Location" an orderBy (tie-breaker) instead of a Preference with priority?**

**The Trade-off**: Should travel distance override business rules like zone optimization, utilization, or FEFO compliance?

**Option A - Proximity as Preference Priority**: If Priority 1 is "Minimize Travel," the engine selects ANY nearby location and never evaluates lower priorities (zone placement, utilization). Result: Fast movers go to Reserve Zone, high-value items scattered randomly—business strategy undermined.

**Option B - Proximity as OrderBy (Chosen)**: Preferences enforce business rules (e.g., Priority 1: Fill Golden Zone), then orderBy optimizes within those rules (e.g., 1st: Utilization DESC, 2nd: Proximity ASC). When multiple Golden Zone bins have similar utilization (~90%), proximity breaks the tie.

**Rationale**: Travel distance is an **optimization within constraints**, not a constraint itself. Strategic placement (zones, FEFO, utilization) wins first, then proximity refines the choice among equally good options. This balances warehouse strategy with operational efficiency. Users can still make proximity dominant by placing it as the 1st orderBy if their operation prioritizes speed over strategic placement.

**Q16: What happens when a cart has partial fills (e.g., 12 of 20 items fit in first location)? Won't the engine continue using "Fill Most Full" for remaining items instead of optimizing for proximity?**

Yes, this is expected behavior that prioritizes business rules over operational convenience. Consider a scenario where items 1-12 fill BIN-A-001, and items 13-20 require new placement. When the engine processes item #13 with `lastPutLocation = BIN-A-001`, the configured preference determines behavior. If the preference is "Fill Most Full" with no proximity in the orderBy stack, the engine ranks all valid candidates by utilization percentage descending. If BIN-B-045 (50 meters away) has 95% utilization while BIN-A-002 (adjacent) has 60% utilization, the engine selects BIN-B-045. The stower walks across the warehouse, contradicting the intuition that cart-based work should cluster spatially.

This behavior is correct by design because the preference encodes the primary business objective—space efficiency. Proximity is deliberately a secondary optimization controlled via orderBy configuration. If travel efficiency is critical for partial-fill scenarios, configure the preference to place proximity first: `OrderBy: [Proximity to Last Location, Fill Most Full]`. This makes proximity the primary sort criterion, selecting BIN-A-002 (adjacent, 60% full) over BIN-B-045 (distant, 95% full) when both are valid. The system is explicit, not implicit: users encode operational intent through configuration choices. For operations requiring "finish this bin first" logic, cart consolidation with "Prioritize Same SKU" attempts sticky-bin behavior before proximity-optimized fallbacks, though true bin-filling workflows may require scanning logic changes outside the engine's scope.

**Q17: How does the system detect missing merchant configuration? Without explicit rules, inventory disperses across zones with no warning until defects appear.**

Detection is reactive through defect logging, not proactive validation, and this is an intentional design choice. Consider a scenario where Merchant X onboards with 500 SKUs. No merchant-specific constraints exist in the engine. Generic preferences apply—ABC-A products flow to the Golden Zone, ABC-C products to Reserve—based purely on velocity classification. Items scatter across zones following ABC logic without merchant clustering. The warehouse operates for two weeks before an operations manager notices Merchant X inventory is dispersed across 12 aisles, complicating replenishment and pick-path efficiency. The issue surfaces through operational observation or defect review, not system alerts.

This reactive approach is chosen because proactive detection requires the system to know which merchants "should" have dedicated rules—an unknowable intent. Not all merchants require dedicated zones; many share generic space by design. For example, small DTC brands might intentionally use shared Golden Zone space for their fast movers, while a large B2B client requires isolated zones for contractual or operational reasons. The system cannot infer this distinction from merchant master data alone. Instead, defect patterns reveal intent gaps organically. If Merchant X inventory triggers 50 stower overrides in week one with reason code "BETTER_ORGANIZATION," the defect log surfaces a clear pattern. SMEs review the trace, recognize missing merchant clustering rules, and create a constraint: `merchant_id = 'Merchant_X' → zone_id IN ['Zone_5']`. Future putaways follow the new rule immediately.

Configuration governance is fundamentally a process problem, not a system automation problem. Merchant onboarding checklists should mandate rule configuration before first receipt if dedicated zones exist. Defect monitoring can alert when new merchant_id values appear in override logs, signaling potential configuration gaps. Rule templates for common merchant patterns (e.g., "New DTC merchant → Zone X, Fill Least Full") accelerate setup. Phase 1 deliberately omits proactive "missing rule" detection because defining what constitutes a "missing" rule requires business context the system lacks. Future phases could add alerts based on merchant master data flags (e.g., `requires_dedicated_zone = TRUE`), but this introduces master data dependencies and false positives that complicate rather than clarify operations.

**Q18: What happens when a location is zone-correct but physically can't fit the item? Won't this cause overrides and mask root causes?**

Yes, this is a known Phase 1 limitation that will cause overrides masking physical incompatibility as the root cause. Consider a 12x20x20-inch bulk item requiring putaway. The engine evaluates constraints (zone, velocity tier) and preferences (utilization, proximity), recommending BIN-C-045, a middle-tier shelf in the correct reserve zone with 80% utilization. The recommendation is strategically correct—reserve zone for slow movers, high utilization for space efficiency. However, BIN-C-045's middle shelf has 15-inch vertical clearance; the 20-inch item physically cannot fit. The stower scans the recommended location, receives a system error or physically observes the mismatch, and overrides to BIN-C-012, a lower-tier shelf with 24-inch clearance. The defect log captures this as a stower override with reason code "BIN_TOO_SMALL," but the trace shows all rules executed correctly—zone matched, utilization prioritized, proximity considered. The defect data doesn't reveal that the root cause is missing dimension validation, not rule misconfiguration.

Capacity validation is deferred to future phases because it introduces significant data and computational complexity. Volumetric fit requires complete dimension data (length, width, height) for all products and locations, which many warehouses lack, especially for new or infrequent SKUs arriving without full specifications. Beyond dimensions, volumetric fit involves orientation logic (can a 12x20x8 item rotate to 20x12x8?), mixed-SKU stacking calculations (how does the new item fit alongside existing bin contents?), and weight-bearing limits for shelving structures. These calculations are non-trivial and add latency to real-time putaway decisions. Phase 1 assumes locations derived from constraints and preferences can physically accommodate items, relying on SMEs to encode fit logic implicitly through rule configuration.

Practical mitigations exist for Phase 1 deployments. Instead of generic "SHELF" storage types, define granular types in location master data: `SHELF_LOWER` (0-18" clearance), `SHELF_MIDDLE` (18-36"), `SHELF_UPPER` (36-60"). Configure constraints mapping product attributes to compatible storage types: `height > 18" → storage_type IN [SHELF_LOWER, FLOOR]` or `weight > 50kg → location_level <= 1` for ground-level placement. Monitor defect logs for `BIN_TOO_SMALL` override patterns by product category; high volumes signal missing constraints requiring tuning. For example, if 80% of "Bulk Household" category overrides cite fit issues, create a constraint: `product_category = 'Bulk_Household' → storage_type IN [SHELF_LOWER, FLOOR]`. This approach trades perfect fit validation for operational simplicity, accepting occasional overrides as feedback signals rather than errors. Future phases can introduce volumetric checks in Phase 1 (Constraints) that filter incompatible bins before preferences evaluate candidates, eliminating fit-related overrides at the cost of dimension data requirements and increased system complexity.

**Q19: Doesn't encoding zones in individual rules (vs. merchant-to-zone mapping table) make changes difficult? With hundreds of merchants, updating zones requires touching dozens of rules.**

Yes, this is an intentional trade-off favoring flexibility and operational transparency over maintenance convenience. Consider a warehouse with three merchants sharing Zone 3: Merchant A has 5 rules referencing `zone_id = 'ZONE_3'`, Merchant B has 3 rules, and Merchant C has 8 rules—totaling 16 rules across three merchants. If Zone 3 is renamed to Zone 5 or these merchants relocate during a facility reconfiguration, SMEs must manually update all 16 rules. The risk of partial updates is real: if an SME updates 12 rules but misses 4, the system exhibits inconsistent behavior where some Merchant A products route to Zone 5 (updated rules) while others still target the non-existent Zone 3 (stale rules), causing zero-location defects or operational confusion.

This rule-level encoding is chosen over centralized merchant-to-zone mapping tables because it prioritizes explicitness and per-rule flexibility. Each rule is self-contained and human-readable: an SME viewing "Merchant A Units Constraint" sees `zone_id = 'ZONE_3'` directly embedded in the configuration, not `zone_id = LOOKUP(merchant_zone_map, merchant_id)` requiring cross-referencing external tables. Debugging is straightforward—when Merchant A putaway fails, the rule trace shows exactly which zone constraint applied without requiring mapping table inspection. More critically, rule-level encoding supports nuanced logic that mapping tables cannot express. Merchant A might require units to flow to Zone 3 (pick zone), cases to Zone 5 Reserve (bulk storage), and pallets to Zone 6 VNA (vertical narrow aisle). A single merchant-to-zone row in a mapping table cannot encode this pack-type-dependent routing; rule-level configuration naturally supports such complexity through multiple constraints differentiated by product criteria.

Zone relocations are operationally infrequent—quarterly at most for established facilities—making the maintenance cost acceptable in exchange for rule transparency. Mitigation strategies further reduce burden: consistent rule naming conventions like "Merchant_A_Units_Zone3" enable bulk find-replace operations in rule export/import workflows. Future phases can introduce bulk edit tooling where SMEs execute "Update all rules where `zone_id = 'ZONE_3'` → `zone_id = 'ZONE_5'`" in a single operation, eliminating manual per-rule updates. When onboarding similar merchants, SMEs clone existing rule templates and update only merchant_id values, reducing repetitive configuration. For operations with stable zone assignments and low customization needs—such as warehouses with few merchants and simple routing—centralized mapping tables could be reconsidered in future phases, though this sacrifices the flexibility and debuggability that rule-level encoding provides. The design deliberately accepts higher maintenance cost for complex configurations as the price of operational transparency and per-rule expressiveness.

## Appendix A: Configuration Library (Business Requirements Map)

This section maps specific business requirements into the PRD format.

### A.1 Hard Constraint Configuration (Phase 1)

| Rule Name | Product Criteria | Location Filter | Action |
| --------- | ---------------- | --------------- | ------ |
| Merchant Zones | `merchant_id = 'Pact'` AND `pack_type = 'UNIT'` | `zone_id IN ['Zone_3']` | Limit To |
| Full LP Routing | `pack_type IN ['CASE', 'PALLET']` | `zone_id IN ['Reserve_VNA', 'B2B_Racks']` | Limit To |
| Oversized Items | `is_oversized = TRUE` | `zone_id IN ['Oversized_Zone']` | Limit To |
| Hazmat Safety | `hazmat_class != 'NONE'` | `zone_id IN ['Hazmat_Cage']` | Limit To |
| Heavy Item Safety | `weight > 20` | `location_level <= 2` | Limit To |
| Damaged Routing | `inventory_status = 'DAMAGED'` | `zone_id IN ['QC_Zone']` | Limit To |
| Returns Processing | `inventory_status = 'RETURNED'` | `zone_id IN ['Returns_Zone']` | Limit To |
| Temperature Control | `temp_zone = 'FROZEN'` | `temp_zone = 'FROZEN'` | Limit To |

### A.2 Preference Configuration (Phase 2)

| Priority | Rule Name | Product Criteria | Location Criteria | Order By | Cart Consolidation |
| -------- | --------- | ---------------- | ----------------- | -------- | ------------------ |
| 1 | Cart Consolidation | *(All)* | *(All Valid)* | Prioritize Same SKU | TRUE |
| 2 | FEFO Placement | `is_lot_controlled = TRUE` | `bin_status = 'PARTIAL'` | 1. Prioritize Same Lot/Expiry, 2. Fill Most Full | FALSE |
| 3 | SKU Consolidation | `pack_type = 'CASE'` | *(All Valid)* | 1. Prioritize Same SKU, 2. Fill Most Full | FALSE |
| 4 | Velocity Steering - Fast | `abc_code = 'A'` | `zone_id IN ['Zone_A_Golden']` | Closest to Shipping Dock | FALSE |
| 5 | Velocity Steering - Standard | `abc_code = 'B'` | `zone_id IN ['Zone_B_Standard']` | Closest to Shipping Dock | FALSE |
| 6 | Velocity Steering - Slow | `abc_code = 'C'` | `zone_id IN ['Zone_C_Reserve']` | Fill Most Full | FALSE |
| 7 | Suggest Empty (Catch-All) | *(All)* | `bin_status = 'EMPTY'` | Closest to Shipping Dock | FALSE |
