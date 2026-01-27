/**
 * WMS Putaway Rules Execution Engine
 * Implements the Two-Phase Funnel Model from PRD Section 5
 *
 * Phase 1: Hard Constraints (Filter) - All must pass (AND logic)
 * Phase 2: Preferences (Sorter) - First match wins (OR logic with fall-through)
 */

/**
 * Main entry point for putaway execution
 * @param {Object} product - Product attributes
 * @param {string} transactionType - Transaction type (e.g., "Inbound PO")
 * @param {Array} locations - All available locations
 * @param {Array} constraints - Active constraint rules
 * @param {Array} preferences - Active preference rules (sorted by priority)
 * @param {Object} cartContext - Cart consolidation context { cartId, lastPutLocation }
 * @returns {Object} - { success, assignedLocation, winningPreference, logs, error }
 */
export function executePutaway(product, transactionType, locations, constraints, preferences, cartContext = {}) {
  const logs = [];

  // Phase 0: Initialization
  logs.push({
    phase: 0,
    type: 'info',
    message: `Starting putaway for ${product.sku_id}`,
    details: {
      transactionType,
      initialCandidates: locations.length,
      cartId: cartContext.cartId
    }
  });

  // Filter to active, non-full locations
  let validLocations = locations.filter(loc => loc.bin_status !== 'FULL' && !loc.locked);

  logs.push({
    phase: 0,
    type: 'info',
    message: `After filtering FULL/locked bins: ${validLocations.length} candidates`,
    details: { filtered: locations.length - validLocations.length }
  });

  // Phase 1: Execute Hard Constraints
  const phase1Result = executeConstraints(product, transactionType, validLocations, constraints, logs);

  if (!phase1Result.success) {
    return {
      success: false,
      logs,
      error: phase1Result.error
    };
  }

  validLocations = phase1Result.validLocations;

  // Phase 2: Execute Preferences
  const phase2Result = executePreferences(
    product,
    transactionType,
    validLocations,
    preferences,
    cartContext,
    logs
  );

  return phase2Result;
}

/**
 * Phase 1: Hard Constraints Execution
 * All active constraints must pass (AND logic)
 */
function executeConstraints(product, transactionType, locations, constraints, logs) {
  logs.push({
    phase: 1,
    type: 'info',
    message: `Phase 1: Hard Constraints (${locations.length} candidates)`,
    details: {}
  });

  let validLocations = [...locations];

  // Get active constraints in scope
  const activeConstraints = constraints.filter(c =>
    c.enabled && isInScope(c.scope, transactionType)
  );

  if (activeConstraints.length === 0) {
    logs.push({
      phase: 1,
      type: 'info',
      message: 'No active constraints - all locations remain valid',
      details: {}
    });
  }

  // Apply each constraint
  for (const constraint of activeConstraints) {
    // Check if product matches constraint criteria
    const productMatches = evaluateCriteria(constraint.productCriteria, product);

    if (!productMatches) {
      logs.push({
        phase: 1,
        type: 'skip',
        ruleId: constraint.id,
        ruleName: constraint.name,
        message: 'Product criteria mismatch - skipped',
        details: {}
      });
      continue;
    }

    // Apply location filter
    const beforeCount = validLocations.length;

    if (constraint.action === 'limit_to') {
      // Whitelist: Keep only matching locations
      validLocations = validLocations.filter(loc =>
        evaluateCriteria(constraint.locationCriteria, loc)
      );
    } else {
      // Blacklist: Remove matching locations
      validLocations = validLocations.filter(loc =>
        !evaluateCriteria(constraint.locationCriteria, loc)
      );
    }

    const afterCount = validLocations.length;

    logs.push({
      phase: 1,
      type: 'filter',
      ruleId: constraint.id,
      ruleName: constraint.name,
      message: `Applied ${constraint.action}`,
      details: {
        action: constraint.action,
        before: beforeCount,
        after: afterCount,
        dropped: beforeCount - afterCount
      }
    });

    // Early exit if no locations remain
    if (validLocations.length === 0) {
      break;
    }
  }

  logs.push({
    phase: 1,
    type: 'info',
    message: `Phase 1 complete: ${validLocations.length} valid locations remaining`,
    details: { remaining: validLocations.length }
  });

  if (validLocations.length === 0) {
    return {
      success: false,
      error: 'No valid locations after Hard Constraints'
    };
  }

  return {
    success: true,
    validLocations
  };
}

/**
 * Phase 2: Preferences Execution
 * Try preferences in priority order (OR logic with fall-through)
 */
function executePreferences(product, transactionType, locations, preferences, cartContext, logs) {
  logs.push({
    phase: 2,
    type: 'info',
    message: `Phase 2: Preferences (${locations.length} candidates)`,
    details: {}
  });

  // Get active preferences in scope, sorted by priority
  const activePreferences = preferences
    .filter(p => p.enabled && isInScope(p.scope, transactionType))
    .sort((a, b) => a.priority - b.priority);

  if (activePreferences.length === 0) {
    logs.push({
      phase: 2,
      type: 'fail',
      message: 'No active preferences defined',
      details: {}
    });
    return {
      success: false,
      logs,
      error: 'No active preferences configured'
    };
  }

  // Try each preference in order
  for (const preference of activePreferences) {
    logs.push({
      phase: 2,
      type: 'attempt',
      ruleId: preference.id,
      ruleName: preference.name,
      priority: preference.priority,
      message: `Checking preference #${preference.priority}`,
      details: {}
    });

    // Check if product matches preference criteria
    const productMatches = evaluateCriteria(preference.productCriteria, product);

    if (!productMatches) {
      logs.push({
        phase: 2,
        type: 'skip',
        message: 'Product criteria mismatch - skipped',
        details: {}
      });
      continue;
    }

    // Cart Consolidation Check (Follow the Leader)
    if (preference.cartConsolidation && cartContext.lastPutLocation) {
      const lastLoc = locations.find(loc => loc.id === cartContext.lastPutLocation);

      if (lastLoc && hasCapacity(lastLoc, product)) {
        logs.push({
          phase: 2,
          type: 'success',
          message: `Follow the Leader: Selected ${lastLoc.id} (Last Put Location)`,
          details: { locationId: lastLoc.id, cartId: cartContext.cartId }
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
          message: 'Last Put Location unavailable or full - falling back to normal logic',
          details: {}
        });
      }
    }

    // Normal Scope Filtering
    let candidates = locations.filter(loc =>
      evaluateCriteria(preference.locationCriteria, loc)
    );

    if (candidates.length === 0) {
      logs.push({
        phase: 2,
        type: 'fail',
        message: 'Scope found 0 candidates - fall through to next preference',
        details: {}
      });
      continue;
    }

    logs.push({
      phase: 2,
      type: 'info',
      message: `Found ${candidates.length} candidates matching scope`,
      details: { candidateCount: candidates.length }
    });

    // Apply Sorting
    if (preference.orderBy?.primary?.field) {
      candidates = sortLocations(candidates, preference.orderBy, product);

      const top3 = candidates.slice(0, 3).map(c => c.id);
      logs.push({
        phase: 2,
        type: 'info',
        message: `Sorted by ${preference.orderBy.primary.field} (${preference.orderBy.primary.direction})`,
        details: {
          primarySort: preference.orderBy.primary.field,
          secondarySort: preference.orderBy.secondary?.field,
          top3Candidates: top3
        }
      });
    }

    // Select top location
    const selectedLocation = candidates[0];

    logs.push({
      phase: 2,
      type: 'success',
      message: `Selected ${selectedLocation.id}`,
      details: {
        locationId: selectedLocation.id,
        zone: selectedLocation.zone_id,
        level: selectedLocation.location_level
      }
    });

    return {
      success: true,
      assignedLocation: selectedLocation,
      winningPreference: preference,
      logs
    };
  }

  // All preferences exhausted
  logs.push({
    phase: 2,
    type: 'fail',
    message: 'All preferences exhausted with no matches',
    details: {}
  });

  return {
    success: false,
    logs,
    error: 'All preferences exhausted (Fall-through complete)'
  };
}

/**
 * Evaluate criteria (product or location) against target object
 * Returns true if ALL criteria match (AND logic)
 */
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
        if (!Array.isArray(ruleValue) || ruleValue.length !== 2) return false;
        return Number(actualValue) >= Number(ruleValue[0]) &&
               Number(actualValue) <= Number(ruleValue[1]);

      case 'in':
        if (Array.isArray(ruleValue)) {
          return ruleValue.includes(actualValue);
        }
        return false;

      case 'exists':
        return actualValue !== null &&
               actualValue !== undefined &&
               actualValue !== '';

      default:
        return false;
    }
  });
}

/**
 * Check if transaction type is in scope
 */
function isInScope(ruleScope, transactionType) {
  if (!ruleScope || ruleScope.length === 0) return true;
  return ruleScope.includes('Any') || ruleScope.includes(transactionType);
}

/**
 * Check if location has capacity for product
 */
function hasCapacity(location, product) {
  // Simplified capacity check
  // In production, this would check volumetric fit, weight limits, etc.
  return location.bin_status !== 'FULL' && location.utilization_percent < 95;
}

/**
 * Sort locations by preference strategies
 */
function sortLocations(locations, orderBy, product) {
  return locations.sort((a, b) => {
    // Primary sort
    if (orderBy.primary?.field) {
      const primaryDiff = compareByStrategy(
        a, b,
        orderBy.primary.field,
        orderBy.primary.direction,
        product
      );

      if (primaryDiff !== 0) return primaryDiff;
    }

    // Secondary sort (tie-breaker)
    if (orderBy.secondary?.field) {
      const secondaryDiff = compareByStrategy(
        a, b,
        orderBy.secondary.field,
        orderBy.secondary.direction,
        product
      );

      if (secondaryDiff !== 0) return secondaryDiff;
    }

    // Final tie-breaker: location_id ASC (deterministic)
    return a.id.localeCompare(b.id);
  });
}

/**
 * Compare two locations by a specific strategy
 */
function compareByStrategy(locA, locB, strategy, direction, product) {
  let scoreA, scoreB;

  switch (strategy) {
    case 'expiry_affinity':
      // Check if location has same lot/expiry
      scoreA = locA.current_contents.some(c => c.lot_id === product.lot_id) ? 1 : 0;
      scoreB = locB.current_contents.some(c => c.lot_id === product.lot_id) ? 1 : 0;
      break;

    case 'sku_match':
      // Check if location has same SKU
      scoreA = locA.current_contents.some(c => c.sku_id === product.sku_id) ? 1 : 0;
      scoreB = locB.current_contents.some(c => c.sku_id === product.sku_id) ? 1 : 0;
      break;

    case 'merchant_affinity':
      // Check if location has same merchant
      scoreA = locA.current_contents.some(c => c.merchant_id === product.merchant_id) ? 1 : 0;
      scoreB = locB.current_contents.some(c => c.merchant_id === product.merchant_id) ? 1 : 0;
      break;

    case 'bin_utilization_desc':
      // Sort by utilization DESC (fill most full first)
      scoreA = locA.utilization_percent;
      scoreB = locB.utilization_percent;
      direction = 'desc'; // Force DESC
      break;

    case 'bin_utilization_asc':
      // Sort by utilization ASC (fill least full first)
      scoreA = locA.utilization_percent;
      scoreB = locB.utilization_percent;
      direction = 'asc'; // Force ASC
      break;

    case 'distance_shipping':
      // Sort by distance to shipping (closer = better)
      scoreA = locA.distance_shipping;
      scoreB = locB.distance_shipping;
      break;

    case 'cluster_merchant':
      // Calculate merchant density in aisle
      scoreA = calculateMerchantDensity(locA, product.merchant_id);
      scoreB = calculateMerchantDensity(locB, product.merchant_id);
      break;

    case 'location_level_asc':
      // Sort by level ASC (bottom levels first)
      scoreA = locA.location_level;
      scoreB = locB.location_level;
      direction = 'asc'; // Force ASC
      break;

    case 'bin_capacity_asc':
      // Sort by capacity ASC (smallest bins first)
      scoreA = locA.bin_capacity;
      scoreB = locB.bin_capacity;
      direction = 'asc'; // Force ASC
      break;

    default:
      return 0;
  }

  const diff = scoreA - scoreB;
  return direction === 'asc' ? diff : -diff;
}

/**
 * Calculate merchant density in aisle (for cluster_merchant strategy)
 * Returns count of same-merchant items in the same aisle
 */
function calculateMerchantDensity(location, merchantId) {
  // Simplified: Just check if current contents match merchant
  // In production, this would query all bins in same aisle
  return location.current_contents.filter(c => c.merchant_id === merchantId).length;
}
