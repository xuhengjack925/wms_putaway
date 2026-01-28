import { CheckCircle, XCircle, MapPin, Award, Package } from 'lucide-react';

export default function ResultCard({ result }) {
  if (!result) return null;

  const { success, assignedLocation, winningPreference, error } = result;

  if (!success) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-bold text-lg text-red-800 mb-2">Putaway Failed</h3>
            <p className="text-red-700 text-sm">{error}</p>
            <div className="mt-4 bg-red-100 border border-red-200 rounded p-3 text-xs text-red-800">
              <p className="font-semibold mb-1">Common Causes:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>All locations filtered out by Hard Constraints</li>
                <li>No active Preferences configured</li>
                <li>All Preferences exhausted without finding candidates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
      <div className="flex items-start gap-3 mb-4">
        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-bold text-lg text-green-800">Putaway Successful</h3>
        </div>
      </div>

      {/* Assigned Location */}
      <div className="bg-white border border-green-200 rounded-lg p-4 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="w-4 h-4 text-green-600" />
          <span className="text-xs font-bold text-slate-500 uppercase">Assigned Location</span>
        </div>
        <div className="font-bold text-2xl text-slate-800 font-mono">
          {assignedLocation.id}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
          <div>
            <span className="font-semibold">Zone:</span> {assignedLocation.zone_id}
          </div>
          <div>
            <span className="font-semibold">Level:</span> {assignedLocation.location_level}
          </div>
          <div>
            <span className="font-semibold">Type:</span> {assignedLocation.storage_type}
          </div>
          <div>
            <span className="font-semibold">Aisle:</span> {assignedLocation.aisle_id}
          </div>
          <div>
            <span className="font-semibold">Utilization:</span> {assignedLocation.utilization_percent}%
          </div>
          <div>
            <span className="font-semibold">Distance:</span> {assignedLocation.distance_shipping}m
          </div>
        </div>
      </div>

      {/* Winning Preference */}
      {winningPreference && (
        <div className="bg-white border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-500 uppercase">Winning Preference</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-emerald-100 text-emerald-700 w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs">
              #{winningPreference.priority}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm text-slate-800">
                {winningPreference.name}
              </div>
              <div className="text-xs text-slate-500">
                {winningPreference.orderBy && winningPreference.orderBy.length > 0 && (
                  <span>Sorted by {winningPreference.orderBy.map(o => o.field).filter(Boolean).join(', ')}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Contents Preview */}
      {assignedLocation.current_contents && assignedLocation.current_contents.length > 0 && (
        <div className="mt-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-3 h-3 text-slate-500" />
            <span className="text-xs font-bold text-slate-500 uppercase">
              Current Contents ({assignedLocation.current_contents.length} items)
            </span>
          </div>
          <div className="space-y-1">
            {assignedLocation.current_contents.slice(0, 3).map((item, idx) => (
              <div key={idx} className="text-xs text-slate-600 flex justify-between">
                <span className="font-mono">{item.sku_id}</span>
                <span className="text-slate-500">Qty: {item.quantity}</span>
              </div>
            ))}
            {assignedLocation.current_contents.length > 3 && (
              <div className="text-xs text-slate-400 italic">
                + {assignedLocation.current_contents.length - 3} more items
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
