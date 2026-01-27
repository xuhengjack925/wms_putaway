import { OPERATOR_LABELS, PRODUCT_CRITERIA_FIELDS, LOCATION_CRITERIA_FIELDS } from '../types';

export default function RulePreview({ rule, isConstraint }) {
  const getFieldLabel = (field) => {
    const allFields = [...PRODUCT_CRITERIA_FIELDS, ...LOCATION_CRITERIA_FIELDS];
    const found = allFields.find(f => f.value === field);
    return found?.label || field;
  };

  const getOperatorText = (operator) => {
    return OPERATOR_LABELS[operator] || operator;
  };

  const formatValue = (value) => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  };

  const describeCondition = (cond) => {
    if (!cond.field) return null;
    const fieldLabel = getFieldLabel(cond.field);
    const operatorText = getOperatorText(cond.operator);
    const value = formatValue(cond.value);
    return `${fieldLabel} ${operatorText} ${value}`;
  };

  const scopeText = rule.scope?.includes('Any')
    ? 'any transaction type'
    : rule.scope?.join(' or ') || 'no scope';

  const triggers = rule.productCriteria || [];
  const filters = rule.locationCriteria || [];

  return (
    <div className="text-sm space-y-2">
      <div className="font-bold text-slate-800 text-base">
        "{rule.name || 'Untitled Rule'}"
      </div>

      <div className="text-slate-600">
        <span className="text-slate-400">When receiving</span>{' '}
        <span className="font-medium">{scopeText}</span>:
      </div>

      {/* Product Criteria */}
      <div className="text-slate-600">
        <span className="text-blue-600 font-medium">IF</span>{' '}
        {triggers.length > 0 && triggers.filter(t => t.field).length > 0 ? (
          triggers
            .filter(t => t.field)
            .map((t, i) => (
              <span key={i}>
                {i > 0 && <span className="text-slate-400"> AND </span>}
                <span className="bg-blue-50 px-1 rounded">{describeCondition(t)}</span>
              </span>
            ))
        ) : (
          <span className="italic text-slate-400">all items (no conditions)</span>
        )}
      </div>

      {/* Location Criteria */}
      <div className="text-slate-600">
        <span className={`font-medium ${isConstraint ? 'text-red-600' : 'text-emerald-600'}`}>
          THEN
        </span>{' '}
        {filters.length > 0 && filters.filter(f => f.field).length > 0 ? (
          <>
            <span>
              {isConstraint
                ? rule.action === 'exclude'
                  ? 'exclude locations where'
                  : 'only allow locations where'
                : 'target locations where'}
            </span>{' '}
            {filters
              .filter(f => f.field)
              .map((f, i) => (
                <span key={i}>
                  {i > 0 && <span className="text-slate-400"> AND </span>}
                  <span className={`${isConstraint ? 'bg-red-50' : 'bg-emerald-50'} px-1 rounded`}>
                    {describeCondition(f)}
                  </span>
                </span>
              ))}
          </>
        ) : (
          <span className="italic text-slate-400">
            {isConstraint ? 'allow all locations' : 'consider all locations'}
          </span>
        )}
      </div>

      {/* Warning/Info */}
      <div
        className={`mt-3 p-2 rounded text-xs ${
          isConstraint ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'
        }`}
      >
        {isConstraint
          ? 'This is a HARD CONSTRAINT - locations not matching will be excluded from consideration.'
          : 'This is a PREFERENCE - locations will be ranked by these criteria if the conditions match.'}
      </div>
    </div>
  );
}
