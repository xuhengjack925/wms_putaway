import { useState } from 'react';
import { Shield, Target, Plus, ArrowDownWideNarrow, HelpCircle } from 'lucide-react';
import { useRules } from '../context/RulesContext';
import ConstraintsList from './ConstraintsList';
import PreferencesList from './PreferencesList';
import Tooltip from './Tooltip';

export default function ConfigurationView() {
  const [activePhase, setActivePhase] = useState('constraints');
  const { constraints, preferences } = useRules();

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* Sidebar: Execution Funnel */}
      <div className="col-span-3 space-y-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h2 className="font-semibold text-slate-700">Execution Funnel</h2>
          </div>

          <div className="p-2 space-y-2">
            {/* Phase 1: Hard Constraints */}
            <button
              onClick={() => setActivePhase('constraints')}
              className={`w-full text-left p-4 rounded-lg flex items-center gap-3 transition-colors ${
                activePhase === 'constraints'
                  ? 'bg-red-50 border-red-200 border text-red-900'
                  : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  activePhase === 'constraints'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                1
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <span className="block font-semibold">Hard Constraints</span>
                  <Tooltip content="Non-negotiable rules that filter out illegal or unsafe locations. All constraints are applied together (AND logic).">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  </Tooltip>
                </div>
                <span className="text-xs opacity-75">
                  {constraints.filter(c => c.enabled).length} active
                </span>
              </div>
            </button>

            {/* Visual Arrow */}
            <div className="flex justify-center">
              <ArrowDownWideNarrow className="text-slate-300 w-5 h-5" />
            </div>

            {/* Phase 2: Preferences */}
            <button
              onClick={() => setActivePhase('preferences')}
              className={`w-full text-left p-4 rounded-lg flex items-center gap-3 transition-colors ${
                activePhase === 'preferences'
                  ? 'bg-emerald-50 border-emerald-200 border text-emerald-900'
                  : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  activePhase === 'preferences'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                2
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1">
                  <span className="block font-semibold">Preferences</span>
                  <Tooltip content="Prioritized strategies that rank remaining locations. Rules are tried in order until one succeeds (OR logic).">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  </Tooltip>
                </div>
                <span className="text-xs opacity-75">
                  {preferences.filter(p => p.enabled).length} active
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="col-span-9 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {activePhase === 'constraints' ? (
                <span className="flex items-center gap-2">
                  <Shield className="w-6 h-6 text-red-600" />
                  Hard Constraints
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Target className="w-6 h-6 text-emerald-600" />
                  Preferences
                </span>
              )}
            </h2>
            <p className="text-slate-500">
              {activePhase === 'constraints'
                ? 'Non-negotiable rules (AND Logic). All active constraints must pass.'
                : 'Prioritized strategies (OR Logic). First matching preference wins.'}
            </p>
          </div>
        </div>

        {/* Rules List */}
        {activePhase === 'constraints' ? (
          <ConstraintsList />
        ) : (
          <PreferencesList />
        )}
      </div>
    </div>
  );
}
