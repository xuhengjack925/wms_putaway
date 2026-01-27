import { Plus, Trash2, Layers, ListFilter, ArrowRight, HelpCircle } from 'lucide-react';
import Tooltip from './Tooltip';
import { MOCK_ZONES, MOCK_LOCATION_GROUPS } from '../data/mockData';

export default function CriteriaBuilder({ title, tooltip, criteria, fields, onChange, error, color = 'slate' }) {
  const isRed = color === 'red';
  const isEmerald = color === 'emerald';
  const headerColor = isRed ? 'text-red-600' : isEmerald ? 'text-emerald-600' : 'text-slate-600';
  const bgColor = isRed ? 'bg-red-50' : isEmerald ? 'bg-emerald-50' : 'bg-slate-50';
  const borderColor = isRed ? 'border-red-200' : isEmerald ? 'border-emerald-200' : 'border-slate-200';

  const addCriterion = () => {
    onChange([...criteria, { field: '', operator: '=', value: '' }]);
  };

  const removeCriterion = (index) => {
    onChange(criteria.filter((_, i) => i !== index));
  };

  const updateCriterion = (index, field, value) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], [field]: value };

    // If field changes, reset operator and value
    if (field === 'field') {
      const fieldDef = fields.find(f => f.value === value);
      updated[index].operator = fieldDef?.operators?.[0] || '=';
      updated[index].value = '';
    }

    onChange(updated);
  };

  const getFieldDef = (fieldValue) => {
    return fields.find(f => f.value === fieldValue);
  };

  const renderValueInput = (criterion, index) => {
    const fieldDef = getFieldDef(criterion.field);
    if (!fieldDef) return null;

    const commonClasses = 'flex-1 border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none';

    // Boolean fields
    if (fieldDef.type === 'boolean') {
      return (
        <select
          value={criterion.value}
          onChange={e => updateCriterion(index, 'value', e.target.value === 'true')}
          className={commonClasses}
        >
          <option value="">Select...</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );
    }

    // Enum fields
    if (fieldDef.type === 'enum' && fieldDef.options) {
      return (
        <select
          value={criterion.value}
          onChange={e => updateCriterion(index, 'value', e.target.value)}
          className={commonClasses}
        >
          <option value="">Select...</option>
          {fieldDef.options.map(opt => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    // List fields (zone_id, location_group_id)
    if (fieldDef.type === 'list') {
      const options = fieldDef.value === 'zone_id' ? MOCK_ZONES : MOCK_LOCATION_GROUPS;

      if (criterion.operator === 'in') {
        // Multi-select for 'in' operator
        return (
          <select
            multiple
            value={Array.isArray(criterion.value) ? criterion.value : []}
            onChange={e => {
              const selected = Array.from(e.target.selectedOptions, option => option.value);
              updateCriterion(index, 'value', selected);
            }}
            className={`${commonClasses} h-24`}
            size={4}
          >
            {options.map(opt => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
        );
      }
    }

    // Number fields
    if (fieldDef.type === 'number') {
      if (criterion.operator === 'between') {
        return (
          <div className="flex-1 flex gap-2">
            <input
              type="number"
              value={Array.isArray(criterion.value) ? criterion.value[0] : ''}
              onChange={e => {
                const current = Array.isArray(criterion.value) ? criterion.value : ['', ''];
                updateCriterion(index, 'value', [e.target.value, current[1]]);
              }}
              className={commonClasses}
              placeholder="Min"
            />
            <span className="text-slate-400 self-center">to</span>
            <input
              type="number"
              value={Array.isArray(criterion.value) ? criterion.value[1] : ''}
              onChange={e => {
                const current = Array.isArray(criterion.value) ? criterion.value : ['', ''];
                updateCriterion(index, 'value', [current[0], e.target.value]);
              }}
              className={commonClasses}
              placeholder="Max"
            />
          </div>
        );
      }

      return (
        <input
          type="number"
          value={criterion.value}
          onChange={e => updateCriterion(index, 'value', e.target.value)}
          className={commonClasses}
          placeholder="Enter value"
        />
      );
    }

    // String fields
    return (
      <input
        type="text"
        value={criterion.value}
        onChange={e => updateCriterion(index, 'value', e.target.value)}
        className={commonClasses}
        placeholder="Enter value"
        disabled={criterion.operator === 'exists'}
      />
    );
  };

  return (
    <div className={`rounded-lg border p-4 ${bgColor} ${borderColor}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className={`text-xs font-bold uppercase flex items-center gap-2 ${headerColor}`}>
          {isRed ? (
            <ListFilter className="w-4 h-4" />
          ) : isEmerald ? (
            <ArrowRight className="w-4 h-4" />
          ) : (
            <Layers className="w-4 h-4" />
          )}
          {title}
          {tooltip && (
            <Tooltip content={tooltip}>
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            </Tooltip>
          )}
        </h3>
        <button
          type="button"
          onClick={addCriterion}
          className={`text-xs flex items-center gap-1 font-bold hover:underline ${headerColor}`}
        >
          <Plus className="w-3 h-3" />
          Add Condition
        </button>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-xs">
          {error}
        </div>
      )}

      <div className="space-y-2">
        {criteria.length === 0 && (
          <div className="p-4 border border-dashed border-slate-300 rounded-lg text-center">
            <p className="text-xs text-slate-400 italic mb-2">
              No conditions defined - this rule will apply to all items
            </p>
          </div>
        )}

        {criteria.map((criterion, index) => {
          const fieldDef = getFieldDef(criterion.field);

          return (
            <div key={index} className="flex gap-2 items-start">
              {/* AND Badge */}
              {index > 0 && (
                <span className="text-[10px] font-bold text-slate-400 uppercase w-8 text-center mt-2">
                  AND
                </span>
              )}

              {/* Field Selector */}
              <select
                value={criterion.field}
                onChange={e => updateCriterion(index, 'field', e.target.value)}
                className="flex-1 border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select Field...</option>
                {fields.map(f => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>

              {/* Operator Selector (hidden for boolean fields) */}
              {fieldDef && fieldDef.type !== 'boolean' && (
                <select
                  value={criterion.operator}
                  onChange={e => updateCriterion(index, 'operator', e.target.value)}
                  className="w-24 border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {fieldDef.operators?.map(op => (
                    <option key={op} value={op}>
                      {op}
                    </option>
                  ))}
                </select>
              )}

              {/* Value Input */}
              {renderValueInput(criterion, index)}

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => removeCriterion(index)}
                className="text-slate-400 hover:text-red-500 p-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
