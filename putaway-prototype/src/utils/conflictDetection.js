/**
 * Rule Conflict Detection System
 * Implements PRD Section 6: Rule Conflict Detection and Resolution
 *
 * Conflict Types (per PRD 6.5.1):
 * 1. Self-Conflict: Single rule with zero location intersection (reported per rule)
 * 2. Inter-Rule Conflict: Multiple constraints with overlapping criteria but zero location intersection (reported per rule pair)
 */

/**
 * Detect all conflicts in the rule set
 * @param {Array} constraints - All constraint rules
 * @param {Array} preferences - All preference rules (not used - preferences cannot conflict)
 * @param {Array} locations - All warehouse locations
 * @param {Array} products - Active products (in production, this would be from backend)
 * @returns {Object} - { selfConflicts, interRuleConflicts }
 */
export function detectAllConflicts(constraints, preferences, locations, products) {
  const conflicts = {
    selfConflicts: [],
    interRuleConflicts: []
  };

  // 1. Detect self-conflicts in constraints
  constraints.forEach(constraint => {
    const selfConflict = detectSelfConflict(constraint, locations, products);
    if (selfConflict) {
      conflicts.selfConflicts.push(selfConflict);
    }
  });

  // 2. Detect inter-rule conflicts between constraints
  for (let i = 0; i < constraints.length; i++) {
    for (let j = i + 1; j < constraints.length; j++) {
      const interConflict = detectInterRuleConflict(
        constraints[i],
        constraints[j],
        locations,
        products
      );
      if (interConflict) {
        conflicts.interRuleConflicts.push(interConflict);
      }
    }
  }

  return conflicts;
}

/**
 * Detect self-conflict within a single rule
 * A rule has a self-conflict if its location criteria result in zero matching locations
 */
function detectSelfConflict(rule, locations, products) {
  // Only check enabled rules
  if (!rule.enabled) return null;

  // Check if location criteria result in zero locations
  const matchingLocations = filterLocationsByCriteria(locations, rule.locationCriteria);

  if (matchingLocations.length === 0) {
    // Check if any active products match this rule's product criteria
    const affectedProducts = products.filter(product =>
      matchesProductCriteria(product, rule.productCriteria)
    );

    if (affectedProducts.length > 0) {
      return {
        type: 'self',
        severity: 'error',
        ruleId: rule.id,
        ruleName: rule.name,
        affectedProductCount: affectedProducts.length,
        affectedProductExamples: affectedProducts.slice(0, 3).map(p => p.sku_id),
        message: `Rule "${rule.name}" has location criteria that match zero locations`,
        details: {
          locationCriteria: rule.locationCriteria,
          productCriteria: rule.productCriteria
        }
      };
    }
  }

  return null;
}

/**
 * Detect inter-rule conflict between two constraint rules
 * Conflict exists when:
 * 1. Rules have overlapping product criteria
 * 2. Combined location filters result in zero location intersection
 * 3. At least one active product matches both rules
 */
function detectInterRuleConflict(ruleA, ruleB, locations, products) {
  // Only check if both rules are enabled
  if (!ruleA.enabled || !ruleB.enabled) return null;

  // Find products that match BOTH rules' product criteria
  const overlappingProducts = products.filter(product =>
    matchesProductCriteria(product, ruleA.productCriteria) &&
    matchesProductCriteria(product, ruleB.productCriteria)
  );

  if (overlappingProducts.length === 0) {
    // No products affected by both rules - no conflict
    return null;
  }

  // Get locations after applying Rule A
  let locationsAfterA = filterLocationsByCriteria(locations, ruleA.locationCriteria);
  if (ruleA.action === 'exclude') {
    locationsAfterA = locations.filter(loc =>
      !filterLocationsByCriteria([loc], ruleA.locationCriteria).length
    );
  }

  // Get locations after applying Rule B
  let locationsAfterB = filterLocationsByCriteria(locations, ruleB.locationCriteria);
  if (ruleB.action === 'exclude') {
    locationsAfterB = locations.filter(loc =>
      !filterLocationsByCriteria([loc], ruleB.locationCriteria).length
    );
  }

  // Find intersection
  const intersection = locationsAfterA.filter(locA =>
    locationsAfterB.some(locB => locA.id === locB.id)
  );

  if (intersection.length === 0) {
    return {
      type: 'inter-rule',
      severity: 'error',
      ruleIds: [ruleA.id, ruleB.id],
      ruleNames: [ruleA.name, ruleB.name],
      affectedProductCount: overlappingProducts.length,
      affectedProductExamples: overlappingProducts.slice(0, 3).map(p => p.sku_id),
      message: `Rules "${ruleA.name}" and "${ruleB.name}" have zero location overlap for ${overlappingProducts.length} product(s)`,
      details: {
        ruleA: {
          name: ruleA.name,
          action: ruleA.action,
          locationCriteria: ruleA.locationCriteria,
          productCriteria: ruleA.productCriteria
        },
        ruleB: {
          name: ruleB.name,
          action: ruleB.action,
          locationCriteria: ruleB.locationCriteria,
          productCriteria: ruleB.productCriteria
        }
      }
    };
  }

  return null;
}


/**
 * Filter locations by criteria
 */
function filterLocationsByCriteria(locations, criteria) {
  if (!criteria || criteria.length === 0) return locations;

  return locations.filter(location => {
    return criteria.every(criterion => {
      const actualValue = location[criterion.field];
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
            // Handle multi-select fields (zone_id, location_group_id)
            if (Array.isArray(actualValue)) {
              return actualValue.some(val => ruleValue.includes(val));
            }
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
  });
}

/**
 * Check if product matches criteria
 */
function matchesProductCriteria(product, criteria) {
  if (!criteria || criteria.length === 0) return true;

  return criteria.every(criterion => {
    const actualValue = product[criterion.field];
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
 * Get conflict summary for a specific rule
 * Returns conflicts that involve this rule
 */
export function getConflictsForRule(ruleId, allConflicts) {
  const ruleConflicts = [];

  // Check self-conflicts
  allConflicts.selfConflicts.forEach(conflict => {
    if (conflict.ruleId === ruleId) {
      ruleConflicts.push(conflict);
    }
  });

  // Check inter-rule conflicts
  allConflicts.interRuleConflicts.forEach(conflict => {
    if (conflict.ruleIds.includes(ruleId)) {
      ruleConflicts.push(conflict);
    }
  });

  return ruleConflicts;
}

/**
 * Get production impact conflicts (all involved rules are enabled)
 * Per PRD 6.5.3: Only show conflicts where all involved rules are currently enabled
 */
export function getProductionImpactConflicts(allConflicts, constraints, preferences) {
  const allRules = [...constraints, ...preferences];
  const getRuleById = (id) => allRules.find(r => r.id === id);

  return {
    selfConflicts: allConflicts.selfConflicts.filter(conflict => {
      const rule = getRuleById(conflict.ruleId);
      return rule && rule.enabled;
    }),
    interRuleConflicts: allConflicts.interRuleConflicts.filter(conflict => {
      return conflict.ruleIds.every(id => {
        const rule = getRuleById(id);
        return rule && rule.enabled;
      });
    })
  };
}
