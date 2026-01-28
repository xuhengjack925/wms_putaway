import { ArrowDown, Plus, Trash2, HelpCircle, Lock } from 'lucide-react';
import Tooltip from './Tooltip';
import { SORT_STRATEGIES } from '../types';

export default function OrderBySelector({ orderBy, onChange, disabled = false }) {
  // Ensure orderBy is always an array
  const orderByArray = Array.isArray(orderBy) ? orderBy : [];

  const handleFieldChange = (index, value) => {
    const newOrderBy = [...orderByArray];
    newOrderBy[index] = { field: value };
    onChange(newOrderBy);
  };

  const addOrderBy = () => {
    onChange([...orderByArray, { field: '' }]);
  };

  const removeOrderBy = (index) => {
    const newOrderBy = orderByArray.filter((_, i) => i !== index);
    onChange(newOrderBy);
  };

  // Get available strategies (exclude already selected ones)
  const getAvailableStrategies = (currentIndex) => {
    const selectedFields = orderByArray
      .map((o, i) => i !== currentIndex ? o.field : null)
      .filter(Boolean);
    return SORT_STRATEGIES.filter(s => !selectedFields.includes(s.value));
  };

  const getOrdinalLabel = (index) => {
    const ordinals = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'];
    return ordinals[index] || `${index + 1}th`;
  };

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
          <Tooltip content="Locations are ranked by these criteria in order. The first criteria is most important. Each strategy has its inherent direction built in.">
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
        {/* Render each orderBy field */}
        {orderByArray.map((orderByItem, index) => {
          const availableStrategies = getAvailableStrategies(index);
          return (
            <div key={index} className="bg-white rounded-lg border border-blue-200 p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-blue-600">
                  {getOrdinalLabel(index).toUpperCase()} PRIORITY
                </span>
                <button
                  onClick={() => removeOrderBy(index)}
                  disabled={disabled}
                  className="ml-auto text-slate-400 hover:text-red-500 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <select
                value={orderByItem.field}
                onChange={e => handleFieldChange(index, e.target.value)}
                disabled={disabled}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Select Strategy...</option>
                {availableStrategies.map(s => (
                  <option key={s.value} value={s.value}>
                    {s.label}{s.requiresCartContext ? ' (requires cart context)' : ''}
                  </option>
                ))}
              </select>

              {/* Strategy Description */}
              {orderByItem.field && (
                <>
                  <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded">
                    {SORT_STRATEGIES.find(s => s.value === orderByItem.field)?.description}
                  </div>
                  {SORT_STRATEGIES.find(s => s.value === orderByItem.field)?.requiresCartContext && (
                    <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded flex items-start gap-2">
                      <HelpCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Cart Context Required:</strong> This strategy only applies when processing cart transactions with lastPutLocation coordinates. If cart context is missing, this preference will be skipped and the engine will cascade to the next enabled preference.
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        {/* Add OrderBy Button */}
        <button
          onClick={addOrderBy}
          disabled={disabled}
          className="w-full py-2 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:border-blue-400 hover:bg-blue-100 flex items-center justify-center gap-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add Sort Strategy
        </button>

        {/* Help Text */}
        {!disabled && orderByArray.length === 0 && (
          <div className="text-xs text-slate-500 italic">
            Sort strategies determine which location is selected when multiple candidates match. If no sort is defined, a random valid location will be chosen.
          </div>
        )}
      </div>
    </div>
  );
}
