# WMS Putaway Rules Engine - Phase 1 Prototype

**Version:** PRD v3.0
**Status:** Phase 1 Complete - Defect Logging System
**Date:** January 2026

## Overview

High-fidelity interactive prototype implementing the WMS Putaway Rules Engine Two-Phase Funnel Model for warehouse putaway decision-making.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Architecture: Two-Phase Funnel

**Phase 1: Hard Constraints** (Filter - AND Logic)
All active constraints must pass. Eliminates illegal/unsafe locations.

**Phase 2: Preferences** (Sorter - OR Logic with Fall-through)
Try each preference in priority order. Selects optimal location from valid candidates.

## Features

✅ **Rule Configuration**
- Hard Constraints with 10 product fields, 8 location fields
- Preferences with priority ordering (drag-and-drop)
- 9 sorting strategies with primary/secondary tie-breaking
- Cart Consolidation ("Follow the Leader")
- Enable/disable toggles
- Real-time rule preview

✅ **Defect Logging System**
- Captures Zero Valid Locations failures (Phase 1 and Phase 2)
- Records Stower Override events with reason codes
- Detailed rule execution traces
- Filterable defect history with search
- CSV export for analysis
- 90-day retention window

✅ **Execution Simulator**
- 10 pre-configured test scenarios
- Visual scenario builder
- Phase-by-phase execution trace
- Success/failure result cards
- Override simulation with reason codes

✅ **Mock Data**
- 50 warehouse locations across 6 zones
- 10 diverse test products
- Pre-loaded sample rules from PRD
- 3 realistic sample defects

## Test Scenarios

1. Happy Path: Fast Mover to Golden Zone
2. Hard Constraint: Heavy Item Safety
3. Hard Constraint: Hazmat Isolation
4. Cart Consolidation: Follow the Leader
5. Lot Affinity: FEFO Consolidation
6. Temperature Zone Matching
7. Customer Return Flow
8. Merchant Clustering
9. Edge Case: Super Heavy Item (100kg)
10. Edge Case: Multiple Hazmat Classes

## Technology Stack

- React 19 + Vite 7
- Tailwind CSS 4
- Context API + localStorage
- Lucide React icons

## Navigation

**Configuration Tab** - Configure constraints and preferences
**Defects Tab** - View defect history and analytics
**Simulator Tab** - Test putaway scenarios and simulate overrides

## Defect Logging

The system captures two types of defects:

### 1. Zero Valid Locations (Engine Failures)

Occurs when the engine cannot recommend any location:
- **Phase 1 Failure**: All constraints eliminated all locations
- **Phase 2 Failure**: No preferences found candidates in valid locations

**Captured Data:**
- Product and transaction details
- Complete rule trace showing which rules eliminated locations
- Product attributes that triggered rules
- Timestamp of failure

### 2. Stower Override (Guidance Ignored)

Occurs when stower rejects engine recommendation:
- Stower selects different location than recommended
- Must provide reason code: Bin Damaged, Congestion, Closer to Staging, Better Ergonomics, Other
- Optional free-text notes

**Captured Data:**
- Recommended location vs actual location used
- Override reason and notes
- Valid locations available at decision time
- Winning preference rule that selected the recommendation

## File Structure

```
src/
├── components/
│   ├── DefectsView.jsx           # Defect list and analytics
│   ├── DefectDetailPanel.jsx     # Individual defect details
│   ├── ConfigurationView.jsx     # Rule configuration
│   └── SimulatorView.jsx         # Execution simulator
├── context/
│   └── RulesContext.jsx          # State management
├── data/
│   ├── defects.js                # Sample defect data
│   └── testScenarios.js          # Pre-configured scenarios
├── utils/
│   ├── executionEngine.js        # Two-phase funnel + defect logging
│   └── defectLogger.js           # Defect persistence layer
└── types.js                      # Constants and field definitions
```

## Key Files

- `src/utils/executionEngine.js` - Two-phase funnel algorithm with integrated defect logging
- `src/utils/defectLogger.js` - Defect recording and retrieval with localStorage
- `src/components/DefectsView.jsx` - Defect analytics dashboard
- `src/components/DefectDetailPanel.jsx` - Rule trace visualization
- `src/context/RulesContext.jsx` - State management with localStorage
- `src/data/testScenarios.js` - Pre-configured scenarios
- `src/data/defects.js` - Sample defect data for testing