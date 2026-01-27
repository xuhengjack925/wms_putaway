# WMS Putaway Rules Engine - Phase 1 Prototype

**Version:** PRD v2.1
**Status:** Phase 1 Complete
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

✅ **Execution Simulator**
- 10 pre-configured test scenarios
- Visual scenario builder
- Phase-by-phase execution trace
- Success/failure result cards

✅ **Mock Data**
- 50 warehouse locations across 6 zones
- 10 diverse test products
- Pre-loaded sample rules from PRD

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

## File Structure

```
src/
├── components/        # UI components
├── context/          # State management
├── data/             # Mock data and scenarios
├── utils/            # Execution engine
└── types.js          # Constants and field definitions
```

## Key Files

- `src/utils/executionEngine.js` - Two-phase funnel algorithm
- `src/context/RulesContext.jsx` - State management with localStorage
- `src/data/testScenarios.js` - Pre-configured scenarios
- `src/components/SimulatorView.jsx` - Simulator layout