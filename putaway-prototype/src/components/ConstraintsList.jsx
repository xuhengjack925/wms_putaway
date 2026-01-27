import { useState } from 'react';
import { Plus, Shield, Edit2, Trash2 } from 'lucide-react';
import { useRules } from '../context/RulesContext';
import RuleBuilderModal from './RuleBuilderModal';
import Toast from './Toast';
import ConfirmDialog from './ConfirmDialog';

export default function ConstraintsList() {
  const { constraints, addConstraint, updateConstraint, deleteConstraint } = useRules();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleAddNew = () => {
    setEditingRule(null);
    setIsModalOpen(true);
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  const handleSave = (ruleData) => {
    if (editingRule) {
      updateConstraint(editingRule.id, ruleData);
      setToast({ message: 'Constraint updated successfully', type: 'success' });
    } else {
      addConstraint(ruleData);
      setToast({ message: 'Constraint created successfully', type: 'success' });
    }
    setIsModalOpen(false);
    setEditingRule(null);
  };

  const handleDeleteRequest = (rule) => {
    setConfirmDelete(rule);
  };

  const handleDeleteConfirm = () => {
    if (confirmDelete) {
      deleteConstraint(confirmDelete.id);
      setToast({ message: 'Constraint deleted', type: 'success' });
      setConfirmDelete(null);
    }
  };

  const toggleEnabled = (rule) => {
    updateConstraint(rule.id, { enabled: !rule.enabled });
    setToast({
      message: `Constraint ${!rule.enabled ? 'enabled' : 'disabled'}`,
      type: 'success'
    });
  };

  if (constraints.length === 0) {
    return (
      <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center bg-white">
        <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 mb-2">
          No hard constraints defined
        </h3>
        <p className="text-slate-500 mb-6">
          Constraints filter out illegal or unsafe locations. Without constraints, all
          locations are candidates.
        </p>
        <button
          onClick={handleAddNew}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-2 mx-auto"
        >
          <Plus className="w-4 h-4" />
          Add First Constraint
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {constraints.map(constraint => (
        <div
          key={constraint.id}
          className="bg-white border-l-4 border-l-red-500 rounded-lg shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3 flex-1">
              <Shield className="w-5 h-5 text-red-500" />
              <div className="flex-1">
                <h3 className="font-bold text-lg text-slate-800">
                  {constraint.name}
                </h3>
                <div className="flex gap-2 text-xs mt-1">
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">
                    Scope: {constraint.scope.join(', ')}
                  </span>
                  <button
                    onClick={() => toggleEnabled(constraint)}
                    className={`px-2 py-0.5 rounded font-medium cursor-pointer transition-colors ${
                      constraint.enabled
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {constraint.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(constraint)}
                className="text-slate-400 hover:text-blue-600 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteRequest(constraint)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Preview logic (simplified for now) */}
          <div className="mt-4 text-sm text-slate-600">
            <span className="font-semibold">IF:</span>{' '}
            {constraint.productCriteria.length === 0
              ? 'All products'
              : constraint.productCriteria
                  .map(c => `${c.field} ${c.operator} ${c.value}`)
                  .join(' AND ')}
            <br />
            <span className="font-semibold">THEN:</span> {constraint.action} locations where{' '}
            {constraint.locationCriteria.length === 0
              ? 'all locations'
              : constraint.locationCriteria
                  .map(c => `${c.field} ${c.operator} ${c.value}`)
                  .join(' AND ')}
          </div>
        </div>
      ))}

      <button
        onClick={handleAddNew}
        className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-slate-400 hover:text-slate-800 flex items-center justify-center gap-2 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Constraint
      </button>

      {/* Rule Builder Modal */}
      <RuleBuilderModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRule(null);
        }}
        rule={editingRule}
        onSave={handleSave}
        mode="constraint"
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Constraint"
        message={`Are you sure you want to delete "${confirmDelete?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setConfirmDelete(null)}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
