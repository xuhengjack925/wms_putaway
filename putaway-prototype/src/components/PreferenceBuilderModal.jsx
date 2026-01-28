import { X, Save, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import TransactionScopeSelector from './TransactionScopeSelector';
import CriteriaBuilder from './CriteriaBuilder';
import OrderBySelector from './OrderBySelector';
import RulePreview from './RulePreview';
import { PRODUCT_CRITERIA_FIELDS, LOCATION_CRITERIA_FIELDS } from '../types';

export default function PreferenceBuilderModal({ isOpen, onClose, rule, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    scope: ['Any'],
    productCriteria: [],
    locationCriteria: [],
    cartConsolidation: false,
    orderBy: {
      primary: null,
      secondary: null
    },
    enabled: true
  });

  const [errors, setErrors] = useState({});
  const [showPreview, setShowPreview] = useState(true);

  // Update form data when rule prop changes
  useEffect(() => {
    if (rule) {
      setFormData(rule);
    } else {
      setFormData({
        name: '',
        scope: ['Any'],
        productCriteria: [],
        locationCriteria: [],
        cartConsolidation: false,
        orderBy: {
          primary: null,
          secondary: null
        },
        enabled: true
      });
    }
    setErrors({});
  }, [rule, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Rule name is required';
    }

    if (formData.scope.length === 0) {
      newErrors.scope = 'At least one transaction scope must be selected';
    }

    // Check for incomplete criteria
    const hasIncomplete = (criteria) =>
      criteria.some(c => !c.field || c.value === '' || c.value === null || c.value === undefined);

    if (hasIncomplete(formData.productCriteria)) {
      newErrors.productCriteria = 'Please complete or remove empty product conditions';
    }

    if (hasIncomplete(formData.locationCriteria)) {
      newErrors.locationCriteria = 'Please complete or remove empty location conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSave({
      ...formData,
      updatedAt: new Date().toISOString()
    });
  };

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">
            {rule?.id ? 'Edit' : 'New'} Preference
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Rule Identification */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Rule Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => handleFieldChange('name', e.target.value)}
                className={`w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                  errors.name ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="e.g., Fast Mover Golden Zone"
              />
              {errors.name && (
                <p className="text-red-600 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                Applies To Transaction Types *
              </label>
              <TransactionScopeSelector
                selected={formData.scope}
                onChange={value => handleFieldChange('scope', value)}
              />
              {errors.scope && (
                <p className="text-red-600 text-xs mt-1">{errors.scope}</p>
              )}
            </div>
          </div>

          <hr className="border-slate-200" />

          {/* Product Criteria */}
          <CriteriaBuilder
            title="IF Product Matches (AND Logic)"
            tooltip="All conditions must be true for this rule to apply"
            criteria={formData.productCriteria}
            fields={PRODUCT_CRITERIA_FIELDS}
            onChange={value => handleFieldChange('productCriteria', value)}
            error={errors.productCriteria}
            color="slate"
          />

          {/* Location Criteria */}
          <CriteriaBuilder
            title="THEN Target Scope (AND Logic)"
            tooltip="Locations matching these criteria will be ranked by sort options"
            criteria={formData.locationCriteria}
            fields={LOCATION_CRITERIA_FIELDS}
            onChange={value => handleFieldChange('locationCriteria', value)}
            error={errors.locationCriteria}
            color="emerald"
          />

          {/* Order By */}
          <OrderBySelector
            orderBy={formData.orderBy}
            onChange={value => handleFieldChange('orderBy', value)}
          />

          {/* Rule Preview */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="w-full p-3 bg-slate-50 flex items-center justify-between text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <span className="flex items-center gap-2">
                {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                Rule Preview
              </span>
              <span className="text-xs text-slate-500">
                {showPreview ? 'Hide' : 'Show'}
              </span>
            </button>

            {showPreview && (
              <div className="p-4 bg-white">
                <RulePreview rule={formData} isConstraint={false} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Preference
          </button>
        </div>
      </div>
    </div>
  );
}
