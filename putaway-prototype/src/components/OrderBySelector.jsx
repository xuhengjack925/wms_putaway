import { ArrowDown, Plus, Trash2, HelpCircle, Lock } from 'lucide-react';
import Tooltip from './Tooltip';
import { SORT_STRATEGIES } from '../types';

export default function OrderBySelector({ orderBy, onChange, disabled = false }) {
  const handlePrimaryChange = (field, value) => {
    onChange({
      ...orderBy,
      primary: { ...orderBy.primary, [field]: value }
    });
  };

  const handleSecondaryChange = (field, value) => {
    onChange({
      ...orderBy,
      secondary: { ...orderBy.secondary, [field]: value }
    });
  };

  const addSecondary = () => {
    onChange({
      ...orderBy,
      secondary: { field: '', direction: 'asc' }
    });
  };

  const removeSecondary = () => {
    onChange({
      ...orderBy,
      secondary: null
    });
  };

  const removePrimary = () => {
    onChange({
      primary: null,
      secondary: null
    });
  };

  // Get available strategies for secondary (exclude primary)
  const availableForSecondary = SORT_STRATEGIES.filter(
    s => !orderBy.primary || s.value !== orderBy.primary.field
  );

  return (
    <div
      className={`rounded-lg border p-4 ${
        disabled ? 'bg-gray-100 border-gray-200 opacity-50' : 'bg-blue-50 border-blue-200'
      }`}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xs font-bold uppercase text-blue-600 flex items-center gap-2">
          <ArrowDown className="w-4 h-4" />
          THEN Sort By
          <Tooltip content="Locations are ranked by these criteria in order. The first criteria is most important. ASC = lowest first, DESC = highest first.">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          </Tooltip>
        </h3>
        {disabled && (
          <span className="text-xs text-gray-600 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Disabled (Follow the Leader active)
          </span>
        )}
      </div>

      {disabled && (
        <div className="text-xs text-red-600 font-semibold mb-2">
          Sorting disabled because "Follow the Leader" targets a single specific bin.
        </div>
      )}

      <div className="space-y-3">
        {/* Primary Sort */}
        {!orderBy.primary ? (
          <button
            onClick={() => onChange({ ...orderBy, primary: { field: '', direction: 'asc' } })}
            disabled={disabled}
            className="w-full py-2 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:border-blue-400 hover:bg-blue-100 flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add Primary Sort
          </button>
        ) : (
          <div className="bg-white rounded-lg border border-blue-200 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-blue-600">PRIMARY</span>
              <button
                onClick={removePrimary}
                disabled={disabled}
                className="ml-auto text-slate-400 hover:text-red-500 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <select
                value={orderBy.primary.field}
                onChange={e => handlePrimaryChange('field', e.target.value)}
                disabled={disabled}
                className="flex-1 border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select Strategy...</option>
                {SORT_STRATEGIES.map(s => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              <select
                value={orderBy.primary.direction}
                onChange={e => handlePrimaryChange('direction', e.target.value)}
                disabled={disabled}
                className="w-28 border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="asc">ASC ↑</option>
                <option value="desc">DESC ↓</option>
              </select>
            </div>

            {/* Strategy Description */}
            {orderBy.primary.field && (
              <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded">
                {SORT_STRATEGIES.find(s => s.value === orderBy.primary.field)?.description}
              </div>
            )}
          </div>
        )}

        {/* Secondary Sort */}
        {orderBy.primary && !orderBy.secondary && (
          <button
            onClick={addSecondary}
            disabled={disabled}
            className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-slate-400 hover:bg-slate-100 flex items-center justify-center gap-2 transition-colors text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="w-3 h-3" />
            Add Secondary Sort (Tie-Breaker)
          </button>
        )}

        {orderBy.secondary && (
          <div className="bg-white rounded-lg border border-slate-200 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-slate-600">SECONDARY</span>
              <button
                onClick={removeSecondary}
                disabled={disabled}
                className="ml-auto text-slate-400 hover:text-red-500 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <select
                value={orderBy.secondary.field}
                onChange={e => handleSecondaryChange('field', e.target.value)}
                disabled={disabled}
                className="flex-1 border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select Strategy...</option>
                {availableForSecondary.map(s => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              <select
                value={orderBy.secondary.direction}
                onChange={e => handleSecondaryChange('direction', e.target.value)}
                disabled={disabled}
                className="w-28 border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="asc">ASC ↑</option>
                <option value="desc">DESC ↓</option>
              </select>
            </div>

            {/* Strategy Description */}
            {orderBy.secondary.field && (
              <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded">
                {SORT_STRATEGIES.find(s => s.value === orderBy.secondary.field)?.description}
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        {!disabled && !orderBy.primary && (
          <div className="text-xs text-slate-500 italic">
            Sort strategies determine which location is selected when multiple candidates match. If no sort is defined, a random valid location will be chosen.
          </div>
        )}
      </div>
    </div>
  );
}
