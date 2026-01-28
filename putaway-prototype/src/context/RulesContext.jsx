import { createContext, useContext, useState, useEffect } from 'react';

const RulesContext = createContext();

const STORAGE_KEY = 'putaway_rules_v1';

// Helper to generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Default rules (sample from PRD Appendix A)
const DEFAULT_CONSTRAINTS = [
  {
    id: generateId(),
    name: 'Heavy Item Safety',
    enabled: true,
    scope: ['Any'],
    productCriteria: [
      { field: 'weight', operator: '>', value: 20 }
    ],
    locationCriteria: [
      { field: 'location_level', operator: '<=', value: 2 }
    ],
    action: 'limit_to',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: generateId(),
    name: 'Hazmat Isolation',
    enabled: true,
    scope: ['Any'],
    productCriteria: [
      { field: 'hazmat_class', operator: '!=', value: 'NONE' }
    ],
    locationCriteria: [
      { field: 'zone_id', operator: 'in', value: ['Hazmat_Cage'] }
    ],
    action: 'limit_to',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // DEMO: Self-conflict - Frozen items need non-existent "Deep Freeze" zone
  {
    id: generateId(),
    name: 'Demo: Deep Freeze Required',
    enabled: true,
    scope: ['Any'],
    productCriteria: [
      { field: 'temp_zone', operator: '=', value: 'FROZEN' }
    ],
    locationCriteria: [
      { field: 'zone_id', operator: 'in', value: ['Zone_Deep_Freeze'] } // This zone doesn't exist!
    ],
    action: 'limit_to',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // DEMO: Inter-rule conflict - A items must be in Golden Zone AND level 1 only (conflicting with Heavy Item Safety)
  {
    id: generateId(),
    name: 'Demo: A Items Level 1 Only',
    enabled: true,
    scope: ['Any'],
    productCriteria: [
      { field: 'abc_code', operator: '=', value: 'A' }
    ],
    locationCriteria: [
      { field: 'location_level', operator: '=', value: 1 }
    ],
    action: 'limit_to',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // DEMO: Another inter-rule conflict - Heavy A items (>20kg AND abc=A) caught between two rules
  {
    id: generateId(),
    name: 'Demo: Premium Storage for A Items',
    enabled: true,
    scope: ['Any'],
    productCriteria: [
      { field: 'abc_code', operator: '=', value: 'A' }
    ],
    locationCriteria: [
      { field: 'location_level', operator: '>=', value: 3 } // Conflicts with Heavy Item Safety (<=2)
    ],
    action: 'limit_to',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const DEFAULT_PREFERENCES = [
  {
    id: generateId(),
    name: 'Cart Consolidation',
    enabled: true,
    priority: 1,
    scope: ['Inbound PO'],
    productCriteria: [],
    locationCriteria: [],
    cartConsolidation: true,
    orderBy: {
      primary: null,
      secondary: null
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: generateId(),
    name: 'FEFO Placement',
    enabled: true,
    priority: 2,
    scope: ['Any'],
    productCriteria: [
      { field: 'is_lot_controlled', operator: '=', value: true }
    ],
    locationCriteria: [
      { field: 'bin_status', operator: '=', value: 'PARTIAL' }
    ],
    cartConsolidation: false,
    orderBy: {
      primary: { field: 'expiry_affinity', direction: 'desc' },
      secondary: { field: 'bin_utilization_desc', direction: 'desc' }
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: generateId(),
    name: 'Fast Mover Golden Zone',
    enabled: true,
    priority: 3,
    scope: ['Any'],
    productCriteria: [
      { field: 'abc_code', operator: '=', value: 'A' }
    ],
    locationCriteria: [
      { field: 'zone_id', operator: 'in', value: ['Zone_A_Golden'] }
    ],
    cartConsolidation: false,
    orderBy: {
      primary: { field: 'distance_shipping', direction: 'asc' },
      secondary: null
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: generateId(),
    name: 'General Fallback (Catch-All)',
    enabled: true,
    priority: 4,
    scope: ['Any'],
    productCriteria: [],
    locationCriteria: [
      { field: 'bin_status', operator: '=', value: 'EMPTY' }
    ],
    cartConsolidation: false,
    orderBy: {
      primary: { field: 'distance_shipping', direction: 'asc' },
      secondary: null
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export function RulesProvider({ children }) {
  const [constraints, setConstraints] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setConstraints(parsed.constraints || DEFAULT_CONSTRAINTS);
        setPreferences(parsed.preferences || DEFAULT_PREFERENCES);
      } else {
        setConstraints(DEFAULT_CONSTRAINTS);
        setPreferences(DEFAULT_PREFERENCES);
      }
    } catch (error) {
      console.error('Failed to load rules from localStorage:', error);
      setConstraints(DEFAULT_CONSTRAINTS);
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage whenever rules change
  useEffect(() => {
    if (!isLoaded) return;

    try {
      const data = {
        constraints,
        preferences,
        lastModified: new Date().toISOString()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save rules to localStorage:', error);
    }
  }, [constraints, preferences, isLoaded]);

  // Constraint operations
  const addConstraint = (constraint) => {
    const newConstraint = {
      ...constraint,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setConstraints([...constraints, newConstraint]);
    return newConstraint;
  };

  const updateConstraint = (id, updates) => {
    setConstraints(constraints.map(c =>
      c.id === id
        ? { ...c, ...updates, updatedAt: new Date().toISOString() }
        : c
    ));
  };

  const deleteConstraint = (id) => {
    setConstraints(constraints.filter(c => c.id !== id));
  };

  // Preference operations
  const addPreference = (preference) => {
    const newPref = {
      ...preference,
      id: generateId(),
      priority: preferences.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setPreferences([...preferences, newPref]);
    return newPref;
  };

  const updatePreference = (id, updates) => {
    setPreferences(preferences.map(p =>
      p.id === id
        ? { ...p, ...updates, updatedAt: new Date().toISOString() }
        : p
    ));
  };

  const deletePreference = (id) => {
    const filtered = preferences.filter(p => p.id !== id);
    // Renumber priorities
    const renumbered = filtered.map((p, index) => ({
      ...p,
      priority: index + 1
    }));
    setPreferences(renumbered);
  };

  const reorderPreferences = (startIndex, endIndex) => {
    const result = Array.from(preferences);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    // Renumber priorities
    const renumbered = result.map((p, index) => ({
      ...p,
      priority: index + 1
    }));

    setPreferences(renumbered);
  };

  const movePreference = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === preferences.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    reorderPreferences(index, newIndex);
  };

  const value = {
    constraints,
    preferences,
    isLoaded,
    addConstraint,
    updateConstraint,
    deleteConstraint,
    addPreference,
    updatePreference,
    deletePreference,
    reorderPreferences,
    movePreference
  };

  return (
    <RulesContext.Provider value={value}>
      {children}
    </RulesContext.Provider>
  );
}

export function useRules() {
  const context = useContext(RulesContext);
  if (!context) {
    throw new Error('useRules must be used within RulesProvider');
  }
  return context;
}
