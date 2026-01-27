Project Name: Putaway Logic Configuration (The "Funnel" Engine)
Version: 2.1
Status: Draft

## 1. Executive Summary

The current WMS putaway logic is rigid. To support a multi-client B2B/B2C warehouse, we require a configurable **Putaway Rules Engine**. This engine acts as a **Single Logical Engine** handling all types of putaway transactions (Inbound PO, Replenishment, Returns) through contextual rules.

It adopts a **Two-Phase Funnel** model to balance compliance with optimization:
- **Hard Constraints**: Non-negotiable rules that filter out illegal locations.
- **Preferences**: Prioritized strategies that select the best location from the remaining candidates.

**Target Users**: WMS Subject Matter Experts (Process Engineers, Operations Managers) who understand warehouse operations and can configure rules without engineering support.

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

| Evaluation Time | Fields | Description |
| --------------- | ------ | ----------- |
| Configuration Time | `zone_id`, `location_group_id`, `storage_type`, `location_level`, `temp_zone` | Static location attributes that don't change frequently |
| Execution Time | `bin_status` | Dynamic attributes evaluated when the putaway request is processed |

### 2.4 Iterative Cart Processing ("Follow the Leader")

For Inbound Carts containing multiple items, the engine runs **iteratively** (one item at a time) per stower session.

#### 2.4.1 Key Definitions

| Term | Definition |
| ---- | ---------- |
| Cart ID | Virtual cart identifier that groups items being put away together |
| Stower | The associate performing the putaway operation |
| Soft Reservation | Temporary hold on bin capacity after assignment, valid for the duration of the stower's session |
| Last Put Location | The bin where the previous item from the same cart was assigned |

#### 2.4.2 Cart Consolidation Behavior

When a preference has `cartConsolidation: TRUE`:

1. **First item in cart**: No "Last Put Location" exists → Apply normal locationCriteria + orderBy logic
2. **Subsequent items**:
   - If Last Put Location exists AND passes all hard constraints AND has capacity → Select it
   - Otherwise → Fall back to normal locationCriteria + orderBy logic within the same preference

#### 2.4.3 Concurrency

Cart consolidation applies to a single stower's session. Multiple stowers working from the same cart ID operate independently with their own Last Put Location tracking.

#### 2.4.4 Soft Reservation Lifecycle

- **Created**: When a location is assigned to a putaway task
- **Released**: When the putaway is completed, cancelled, or the stower session times out
- **Visibility**: Soft reservations reduce available capacity for subsequent putaway recommendations

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

| Field Name | Type | Operators | Action | Description |
| ---------- | ---- | --------- | ------ | ----------- |
| `zone_id` | List | `in` | Limit To / Exclude | Physical zoning. Example: "Target Zone A." |
| `location_group_id` | List | `in` | Limit To / Exclude | Logical grouping across zones. Example: "Target Flammable Cabinet." |
| `storage_type` | Enum | `=` | Limit To / Exclude | Physical equipment type. Values: `BIN`, `SHELF`, `RACK`, `FLOOR` |
| `location_level` | Integer | `=`, `<=`, `>=`, `between` | Limit To / Exclude | Vertical position (1 = ground). Example: "Heavy items → Level <= 2." |
| `bin_status` | Enum | `=` | Limit To | Current occupancy. Values: `EMPTY`, `PARTIAL`. Evaluated at execution time. |
| `temp_zone` | Enum | `=` | Limit To / Exclude | Location temperature capability. Values: `AMBIENT`, `CHILLED`, `FROZEN` |
| `single_merchant_only` | Boolean | `=` | Limit To | When TRUE, exclude bins containing other merchants' inventory. |
| `aisle_id` | String | `=`, `in` | Limit To / Exclude | Aisle identifier for clustering and congestion management. |

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
| **Fill Bottom Levels First**   | Sort by Location Level ASC.                                                                            | Ergonomics / Safety        |
| **Smallest Bin First**         | Sort by Bin Capacity ASC.                                                                              | Space optimization         |

**Composite Strategies**: When primary and secondary Order By are configured, sort by primary first, then by secondary for ties.

**Tie-Breaker**: When all configured strategies result in ties, sort by `location_id ASC` for deterministic results.

**Notes**:
- "Prioritize Same Lot/Expiry" and "Prioritize Same SKU" are soft preferences—bins without matching lot/SKU are sorted lower, not excluded
- "Cluster by Merchant" calculates a density score based on neighboring bins in the same aisle; for new merchants with no existing inventory, this has no effect
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
      └─ If L is empty → FAIL (No valid locations)

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
   │   │       │   │   │   ├─ YES → Assign to Last Put Location → TERMINATE
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
   │   │       │   │   ├─ YES → Assign top location → Update Last Put Location → TERMINATE
   │   │       │   │   └─ NO → Fall through to next preference
   │   │       │
   │   └─ Continue to next preference
   │
   └─ All preferences exhausted → FAIL (No matching preference)

4. OUTPUT
   │
   ├─ SUCCESS: Return assigned location
   │   └─ Create soft reservation for Cart+Stower session
   │
   └─ FAIL: Return error with reason
       ├─ "No valid locations after constraints" (Phase 2 not reached)
       └─ "No matching preference" (Phase 2 exhausted)
```

**Important Notes**:
- Users should configure a catch-all preference (e.g., lowest priority, no product criteria, targets any empty bin) to avoid failures
- Capacity check is not included in this version (see Out of Scope)
- Audit trail of recommendation vs. actual putaway location is covered in the Stow PRD

## 6. Rule Conflict Detection and Resolution

### 6.1 Conflict Definition

A conflict exists when:
1. One or more rules have location criteria with **zero location intersection**, AND
2. At least one **active product** exists that matches the overlapping product criteria

**Key principle**: Conflicts are only surfaced when real, active products are affected. Theoretical conflicts (where no matching products exist) are not actionable and should not be shown to users.

### 6.2 Conflict Types

#### 6.2.1 Self-Conflict
A single rule with multiple location conditions (e.g., `zone_id`, `location_group_id`, `storage_type`) that result in zero location intersection.

**Example**: A rule specifies `zone_id IN [Zone-3]` AND `location_group_id IN [Hazmat-Cage]`, but no locations in Zone-3 belong to the Hazmat-Cage group.

#### 6.2.2 Inter-Rule Conflict
Multiple constraints with overlapping product criteria whose combined location filters result in zero location intersection.

**Example**:
- Rule A: "Pact products → Limit to Zone 3"
- Rule B: "Hazmat products → Limit to Hazmat Cage"
- Conflict exists only if: (1) Zone 3 and Hazmat Cage have no overlapping locations, AND (2) Pact has active hazmat products

**Note**: Preference rules cannot conflict with other preference rules because only one preference is selected per product (priority-based fall-through).

### 6.3 Detection Triggers

Conflict detection is **event-driven** (no polling). Re-evaluation is triggered by:

| Trigger                                                  | Scope                                                |
| -------------------------------------------------------- | ---------------------------------------------------- |
| Rule save (create/update/delete)                         | Evaluate the saved rule against all other rules      |
| Master data change (zones, location groups, locations)   | Re-evaluate all rules affected by changed data       |
| Product catalog change (new products, attribute updates) | Re-evaluate rules matching affected product criteria |

### 6.4 Detection Algorithm

Given the scale of product catalogs (100K-1M+ products, each with 1-3 pack types), conflict detection runs **asynchronously** in the background:

1. **Trigger received** → Queue conflict detection job
2. **Background process**:
   - For self-conflicts: Compute location intersection of all conditions within the rule
   - For inter-rule conflicts: Identify constraint pairs with overlapping product criteria, compute location intersection
   - Query active products matching conflict criteria to determine real impact
3. **Cache results** → Surface in UI when ready
4. Users are **not blocked** waiting for detection to complete

#### 6.4.1 Active Product Scope
Conflicts are evaluated against **active products** only:
- Products with current inventory
- Products with expected inbound (open POs)

Excluded:
- Obsolete products
- Products with no inventory and no inbound

### 6.5 Conflict Reporting

#### 6.5.1 Granularity

| Conflict Type | Reported As |
| ------------- | ----------- |
| Self-conflict | Per rule |
| Inter-rule conflict | Per rule pair |

#### 6.5.2 Metrics
Each conflict includes:
- **Affected product count**: Number of active products impacted
- **Affected product examples**: Sample SKUs for user reference

Conflicts are **sorted by impact** (product count descending) to help users prioritize resolution.

#### 6.5.3 Conflict Categorization
Users can filter conflicts by:
- **Production Impact**: Conflicts where all involved rules are currently enabled
- **Potential Impact**: Conflicts involving one or more disabled rules

### 6.6 Conflict Indicators

- **Visual Feedback**: Conflicted rules display warning indicators in the rule management interface
- **Conflict Count**: Shows number of conflicting rules and affected products
- **Production Impact Badge**: Clearly indicates whether the conflict affects production (only when all conflicting rules are enabled)

### 6.7 Rule State Management

#### 6.7.1 Enable/Disable Logic
- **Save Always Allowed**: Users can save rules regardless of conflict status
- **Enable Always Allowed**: Users have full manual control to enable/disable any rule
- **No Automatic Disabling**: System never automatically disables rules due to conflicts
- **User Responsibility**: Users decide whether to enable conflicted rules based on system warnings

#### 6.7.2 Rule States
```
ENABLED: Rule is active in putaway logic (user controlled)
DISABLED: Rule is inactive in putaway logic (user controlled)
```

**Note**: Conflict status is tracked separately and does not affect rule enable/disable capability.

### 6.8 Resolution Interface

#### 6.8.1 Warning System
- **Enable Warnings**: When user enables a rule that conflicts with other enabled rules, display warning with impact preview
- **Impact Preview**: Show affected product count and examples
- **User Choice**: Allow user to proceed with full awareness of impact

#### 6.8.2 Resolution Tools
The system provides **information and tools** to help users resolve conflicts, but does not prescribe specific solutions (resolution requires business context the system cannot infer):

| Tool | Purpose |
| ---- | ------- |
| Conflict explanation | Clear description of why the conflict exists (which rules, which criteria) |
| Side-by-side rule view | Compare conflicting rules with criteria highlighted |
| Affected products list | View products impacted by the conflict |
| Location browser | View locations in each zone/group to understand the gap |
| Edit shortcuts | Quick links to edit Rule A, Rule B |

## 7. Out of Scope

### 7.1 Capacity and Volumetric Checks
- **Bin capacity validation**: Checking if recommended bin can physically fit the item
- **Volumetric calculations**: L×W×H based bin fitting
- **Weight capacity validation**: Checking location weight limits

### 7.2 Bulk Operations
- **Mass Conflict Resolution**: Tools to resolve multiple related conflicts simultaneously
- **Rule Prioritization**: Batch assignment of priority levels across rule sets
- **Emergency Override**: Temporary conflict bypass for urgent operational needs

### 7.3 Audit and Reporting
- **Conflict History**: Track when conflicts occurred and how they were resolved
- **Rule Performance**: Monitor which rules are frequently disabled due to conflicts
- **Resolution Analytics**: Identify common conflict patterns for UX improvement

### 7.4 Resolution Guidance
- Automated suggestions for specific ways to resolve each conflict
- Prescriptive recommendations on which rule to modify

### 7.5 Version Control
- Rule versioning and change history
- Rollback to previous rule configurations
- Staged deployment (draft → production)

### 7.6 Advanced Conflict Detection (Future Iteration)
- **Precise "active product" definition**: Refining criteria for which products are included in conflict evaluation
- **Velocity-based prioritization**: Ranking conflicts by product movement volume, not just count
- **Predictive conflicts**: Detecting conflicts for products not yet in catalog (e.g., based on merchant onboarding)

### 7.7 Advanced Product Criteria
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
