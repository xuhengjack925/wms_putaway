import { TRANSACTION_TYPES } from '../types';

export default function TransactionScopeSelector({ selected, onChange }) {
  const toggleScope = (value) => {
    if (value === 'Any') {
      // Selecting "Any" deselects everything else
      onChange(['Any']);
    } else {
      // Selecting a specific type
      let newScope = selected.filter(s => s !== 'Any');

      if (newScope.includes(value)) {
        // Deselecting - remove it
        newScope = newScope.filter(s => s !== value);
      } else {
        // Selecting - add it
        newScope = [...newScope, value];
      }

      // If nothing selected, default to "Any"
      if (newScope.length === 0) {
        newScope = ['Any'];
      }

      onChange(newScope);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {TRANSACTION_TYPES.map(t => {
        const isSelected = selected.includes(t.value) || (t.value !== 'Any' && selected.includes('Any'));
        const isAny = t.value === 'Any';

        return (
          <button
            key={t.value}
            type="button"
            onClick={() => toggleScope(t.value)}
            className={`px-3 py-2 rounded-full text-sm font-medium border transition-all ${
              isSelected
                ? isAny
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-blue-100 border-blue-300 text-blue-800'
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
