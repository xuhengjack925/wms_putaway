import { useState } from 'react';
import { Plus, Target, Edit2, Trash2, GripVertical, MoveUp, MoveDown, AlertTriangle } from 'lucide-react';
import { useRules } from '../context/RulesContext';
import PreferenceBuilderModal from './PreferenceBuilderModal';
import Toast from './Toast';
import ConfirmDialog from './ConfirmDialog';

export default function PreferencesList() {
  const { preferences, addPreference, updatePreference, deletePreference, movePreference, reorderPreferences } = useRules();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [draggedIdx, setDraggedIdx] = useState(null);

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
      updatePreference(editingRule.id, ruleData);
      setToast({ message: 'Preference updated successfully', type: 'success' });
    } else {
      addPreference(ruleData);
      setToast({ message: 'Preference created successfully', type: 'success' });
    }
    setIsModalOpen(false);
    setEditingRule(null);
  };

  const handleDeleteRequest = (rule) => {
    setConfirmDelete(rule);
  };

  const handleDeleteConfirm = () => {
    if (confirmDelete) {
      deletePreference(confirmDelete.id);
      setToast({ message: 'Preference deleted', type: 'success' });
      setConfirmDelete(null);
    }
  };

  const toggleEnabled = (rule) => {
    updatePreference(rule.id, { enabled: !rule.enabled });
    setToast({
      message: `Preference ${!rule.enabled ? 'enabled' : 'disabled'}`,
      type: 'success'
    });
  };

  const handleMove = (index, direction) => {
    movePreference(index, direction);
    setToast({ message: 'Priority updated', type: 'success' });
  };

  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === index) return;

    reorderPreferences(draggedIdx, index);
    setToast({ message: 'Priority updated', type: 'success' });
    setDraggedIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  // Check if catch-all exists
  const hasCatchAll = preferences.some(
    p => p.enabled && p.productCriteria.length === 0 && p.locationCriteria.length === 0
  );

  if (preferences.length === 0) {
    return (
      <div className="border-2 border-dashed border-slate-200 rounded-xl p-12 text-center bg-white">
        <Target className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-700 mb-2">
          No preferences defined
        </h3>
        <p className="text-slate-500 mb-6">
          Preferences rank valid locations and select the best match. Add at least one
          catch-all preference to avoid putaway failures.
        </p>
        <button
          onClick={handleAddNew}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 flex items-center gap-2 mx-auto"
        >
          <Plus className="w-4 h-4" />
          Add First Preference
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Warning if no catch-all */}
      {!hasCatchAll && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-semibold text-yellow-800 text-sm">No catch-all preference found</h4>
            <p className="text-yellow-700 text-sm mt-1">
              Consider adding a fallback preference (no criteria) to prevent putaway failures when no other preference matches.
            </p>
          </div>
        </div>
      )}

      {preferences.map((preference, idx) => (
        <div
          key={preference.id}
          draggable
          onDragStart={(e) => handleDragStart(e, idx)}
          onDragOver={(e) => handleDragOver(e, idx)}
          onDrop={(e) => handleDrop(e, idx)}
          onDragEnd={handleDragEnd}
          className={`bg-white border-l-4 border-l-emerald-500 rounded-lg shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all relative group ${
            draggedIdx === idx ? 'opacity-50 ring-2 ring-blue-400' : ''
          }`}
        >
          {/* Drag Handle */}
          <div className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
            <GripVertical className="w-5 h-5" />
          </div>

          {/* Up/Down Arrows */}
          <div className="absolute left-[-28px] top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleMove(idx, 'up')}
              disabled={idx === 0}
              className="p-1 bg-white border border-slate-200 rounded text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <MoveUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleMove(idx, 'down')}
              disabled={idx === preferences.length - 1}
              className="p-1 bg-white border border-slate-200 rounded text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <MoveDown className="w-4 h-4" />
            </button>
          </div>

          <div className="flex justify-between items-start pl-6">
            <div className="flex items-center gap-3 flex-1">
              <div className="bg-emerald-100 text-emerald-700 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm">
                #{preference.priority}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-slate-800">
                  {preference.name}
                </h3>
                <div className="flex gap-2 text-xs mt-1 flex-wrap">
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">
                    Scope: {preference.scope.join(', ')}
                  </span>
                  <button
                    onClick={() => toggleEnabled(preference)}
                    className={`px-2 py-0.5 rounded font-medium cursor-pointer transition-colors ${
                      preference.enabled
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {preference.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(preference)}
                className="text-slate-400 hover:text-blue-600 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteRequest(preference)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Preview logic */}
          <div className="mt-4 text-sm text-slate-600 pl-6">
            <span className="font-semibold">IF:</span>{' '}
            {preference.productCriteria.length === 0
              ? 'All products'
              : preference.productCriteria
                  .map(c => `${c.field} ${c.operator} ${c.value}`)
                  .join(' AND ')}
            <br />
            <span className="font-semibold">THEN TARGET:</span>{' '}
            {preference.locationCriteria.length === 0
              ? 'all locations'
              : preference.locationCriteria
                  .map(c => `${c.field} ${c.operator} ${c.value}`)
                  .join(' AND ')}
            {preference.orderBy && preference.orderBy.length > 0 && (
              <>
                <br />
                <span className="font-semibold">SORT BY:</span>{' '}
                {preference.orderBy.map(o => o.field).filter(Boolean).join(', ')}
              </>
            )}
          </div>
        </div>
      ))}

      <button
        onClick={handleAddNew}
        className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:border-slate-400 hover:text-slate-800 flex items-center justify-center gap-2 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Preference
      </button>

      {/* Preference Builder Modal */}
      <PreferenceBuilderModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingRule(null);
        }}
        rule={editingRule}
        onSave={handleSave}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Delete Preference"
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
