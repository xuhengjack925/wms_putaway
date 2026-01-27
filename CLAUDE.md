# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a WMS (Warehouse Management System) Putaway Rules Engine project containing UI prototypes for configuring warehouse putaway logic. The prototypes demonstrate different approaches to configuring where incoming inventory should be stored.

## Running the Prototypes

All prototypes are static HTML/CSS/JS applications with no build process:

```bash
# Open any prototype directly in browser
open wms-putaway-prototype/index.html
open prototype-hybrid/index.html
open prototype-tree-based/index.html
```

## Architecture

### Core Concept: Two-Phase Funnel Model

The engine processes putaway decisions in two phases:

1. **Phase 1 - Hard Constraints (Filter)**: Non-negotiable rules that eliminate illegal locations. All active constraints apply simultaneously (AND logic). If result is 0 locations, putaway fails.

2. **Phase 2 - Preferences (Sorter)**: Prioritized strategies that select the best location from valid candidates. Evaluated sequentially (OR logic with fall-through).

### Prototype Variants

**wms-putaway-prototype/** - Main implementation of the PRD
- `engine.js` - Core `PutawayEngine` class implementing the Two-Phase Funnel
- `data.js` - Sample warehouse data (zones, locations, products, rules)
- `app.js` - UI controller and rendering logic

**prototype-hybrid/** - Real-time conflict detection approach
- Traditional rule configuration with immediate validation
- Impact simulation before rule activation

**prototype-tree-based/** - Decision tree approach
- Attribute-driven tree builder (conflict-free by design)
- Mutually exclusive paths guarantee no overlapping rules

### Key Engine Components (wms-putaway-prototype/engine.js)

- `PutawayEngine.runPutaway(product, transactionType)` - Main entry point
- `executeConstraints()` - Phase 1 execution
- `executePreferences()` - Phase 2 execution with priority cascade
- `detectConflicts()` - Rule conflict analysis

### Data Model

**Product Criteria** (triggers rule matching):
- merchant_id, inventory_status, pack_type, abc_code, is_oversized, weight, hazmat_class, is_lot_expiry_required

**Location Criteria** (filters/targets locations):
- zone_id, storage_type, location_level, bin_status

**Transaction Scopes**: Any, Inbound PO, Replenishment, Customer Return, Inventory Transfer

## PRD Reference

The complete product requirements are in `PRD - WMS Putaway Rules Engine.md`. Key design decisions:
- Single engine with Transaction Scope (vs separate engines per transaction type)
- Rule-based system (vs mathematical optimization) for transparency and auditability
- "Follow the Leader" cart processing for iterative case assignment
