import { useState } from 'react';
import { X, AlertCircle, FileWarning, ChevronRight } from 'lucide-react';
import { DefectType, FailurePoint, OverrideReasonCodes } from '../utils/defectLogger';

export default function DefectDetailPanel({ defect, onClose }) {
  const [showAllLocations, setShowAllLocations] = useState(false);

  if (!defect) return null;

  const isZeroLocation = defect.defectType === DefectType.ZERO_LOCATIONS;
  const isOverride = defect.defectType === DefectType.STOWER_OVERRIDE;

  const validLocationsToShow = showAllLocations
    ? defect.valid_locations
    : defect.valid_locations?.slice(0, 10);

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-2/3 bg-white shadow-2xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isZeroLocation ? (
              <FileWarning className="w-6 h-6 text-red-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            )}
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Defect Details: {defect.id}
              </h2>
              <p className="text-sm text-slate-600">
                {new Date(defect.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Product Context Section */}
          <section>
            <h3 className="text-lg font-semibold text-slate-800 mb-3">Product Context</h3>
            <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-600 uppercase font-semibold mb-1">Product ID</p>
                <p className="text-sm font-mono text-slate-900">{defect.productId}</p>
              </div>
              <div>
                <p className="text-xs text-slate-600 uppercase font-semibold mb-1">Transaction Type</p>
                <p className="text-sm text-slate-900">{defect.transactionType}</p>
              </div>
              {defect.stowerId && (
                <div>
                  <p className="text-xs text-slate-600 uppercase font-semibold mb-1">Stower ID</p>
                  <p className="text-sm font-mono text-slate-900">{defect.stowerId}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-slate-600 uppercase font-semibold mb-1">Defect Type</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  isZeroLocation
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {isZeroLocation ? 'Zero Locations' : 'Stower Override'}
                </span>
              </div>
            </div>

            {/* Product Attributes */}
            {defect.context?.product_attributes && (
              <div className="mt-4 bg-blue-50 rounded-lg p-4">
                <p className="text-xs text-blue-800 uppercase font-semibold mb-2">Product Attributes</p>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(defect.context.product_attributes).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-xs text-blue-700 font-medium capitalize">
                        {key.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm font-mono text-blue-900">
                        {String(value)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Rule Execution Trace Section (ZERO_LOCATIONS only) */}
          {isZeroLocation && defect.rule_trace && (
            <section>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Rule Execution Trace</h3>

              {/* Failure Point Indicator */}
              <div className={`mb-4 p-3 rounded-lg ${
                defect.failurePoint === FailurePoint.PHASE_1
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <p className={`text-sm font-semibold ${
                  defect.failurePoint === FailurePoint.PHASE_1
                    ? 'text-red-800'
                    : 'text-yellow-800'
                }`}>
                  Failure Point: {defect.failurePoint === FailurePoint.PHASE_1 ? 'Phase 1 - Hard Constraints' : 'Phase 2 - Preferences'}
                </p>
                <p className={`text-xs mt-1 ${
                  defect.failurePoint === FailurePoint.PHASE_1
                    ? 'text-red-700'
                    : 'text-yellow-700'
                }`}>
                  {defect.failurePoint === FailurePoint.PHASE_1
                    ? 'No valid locations remained after applying constraints'
                    : 'Constraints passed but no preferences could be satisfied'}
                </p>
              </div>

              {/* Rule Trace Steps */}
              <div className="space-y-3">
                {defect.rule_trace.map((trace, idx) => {
                  const isPhase1 = trace.phase === 1;
                  const isFailureStep = trace.locations_after === 0;

                  return (
                    <div
                      key={idx}
                      className={`rounded-lg border-2 p-4 ${
                        isPhase1
                          ? isFailureStep
                            ? 'bg-red-50 border-red-300'
                            : 'bg-red-50 border-red-200'
                          : isFailureStep
                            ? 'bg-yellow-50 border-yellow-300'
                            : 'bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      {/* Rule Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                              isPhase1
                                ? 'bg-red-200 text-red-800'
                                : 'bg-yellow-200 text-yellow-800'
                            }`}>
                              Phase {trace.phase}
                            </span>
                            <span className="font-semibold text-slate-900">
                              {trace.rule_name}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 font-mono">
                            {trace.rule_id}
                          </p>
                        </div>
                        {trace.priority !== undefined && (
                          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-bold">
                            Priority #{trace.priority}
                          </span>
                        )}
                      </div>

                      {/* Location Counts */}
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-600 font-medium">Before:</span>
                          <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded font-mono text-sm font-bold">
                            {trace.locations_before}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-600 font-medium">After:</span>
                          <span className={`px-2 py-0.5 rounded font-mono text-sm font-bold ${
                            trace.locations_after === 0
                              ? 'bg-red-200 text-red-900'
                              : 'bg-green-200 text-green-900'
                          }`}>
                            {trace.locations_after}
                          </span>
                        </div>
                        {trace.eliminated_count > 0 && (
                          <>
                            <span className="text-slate-400">|</span>
                            <span className="text-xs text-slate-600">
                              Eliminated: <span className="font-bold text-slate-800">{trace.eliminated_count}</span>
                            </span>
                          </>
                        )}
                      </div>

                      {/* Failure Indicator */}
                      {isFailureStep && (
                        <div className={`p-2 rounded ${
                          isPhase1 ? 'bg-red-100' : 'bg-yellow-100'
                        }`}>
                          <p className={`text-sm font-semibold flex items-center gap-2 ${
                            isPhase1 ? 'text-red-800' : 'text-yellow-800'
                          }`}>
                            <AlertCircle className="w-4 h-4" />
                            {trace.reason}
                          </p>
                        </div>
                      )}

                      {/* Condition Details */}
                      {trace.condition && (
                        <div className="mt-3 p-3 bg-white rounded border border-slate-200">
                          <p className="text-xs text-slate-600 font-semibold mb-2">Rule Condition:</p>
                          <div className="space-y-1 text-xs font-mono">
                            <div>
                              <span className="text-purple-600 font-bold">IF:</span>{' '}
                              <span className="text-slate-800">
                                {JSON.stringify(trace.condition.if, null, 2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-blue-600 font-bold">THEN:</span>{' '}
                              <span className="text-slate-800">
                                {JSON.stringify(trace.condition.then, null, 2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Failure Analysis */}
              {defect.context?.failure_analysis && (
                <div className="mt-4 p-4 bg-slate-100 rounded-lg border border-slate-300">
                  <p className="text-xs text-slate-700 uppercase font-semibold mb-1">
                    Failure Analysis
                  </p>
                  <p className="text-sm text-slate-800">
                    {defect.context.failure_analysis}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Location Context Section */}
          {isOverride && (
            <section>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Location Context</h3>
              <div className="space-y-4">
                {/* Recommended vs Actual */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-xs text-green-700 uppercase font-semibold mb-2">
                      Recommended Location
                    </p>
                    <p className="text-lg font-mono font-bold text-green-900">
                      {defect.recommended_location || 'N/A'}
                    </p>
                    {defect.context?.recommendation_score && (
                      <p className="text-xs text-green-700 mt-1">
                        Score: {(defect.context.recommendation_score * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <p className="text-xs text-yellow-700 uppercase font-semibold mb-2">
                      Actual Location (Override)
                    </p>
                    <p className="text-lg font-mono font-bold text-yellow-900">
                      {defect.actual_location || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Valid Locations List */}
                {defect.valid_locations && defect.valid_locations.length > 0 && (
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <p className="text-xs text-slate-700 uppercase font-semibold mb-2">
                      Valid Locations ({defect.valid_locations.length} total)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {validLocationsToShow.map((loc, idx) => (
                        <span
                          key={idx}
                          className={`px-2 py-1 rounded font-mono text-xs ${
                            loc === defect.recommended_location
                              ? 'bg-green-200 text-green-900 font-bold'
                              : loc === defect.actual_location
                                ? 'bg-yellow-200 text-yellow-900 font-bold'
                                : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {loc}
                        </span>
                      ))}
                    </div>
                    {defect.valid_locations.length > 10 && (
                      <button
                        onClick={() => setShowAllLocations(!showAllLocations)}
                        className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        {showAllLocations
                          ? 'Show less'
                          : `Show all ${defect.valid_locations.length} locations`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Override Context Section */}
          {isOverride && defect.overrideReason && (
            <section>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Override Context</h3>
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="mb-3">
                  <p className="text-xs text-yellow-700 uppercase font-semibold mb-1">
                    Reason Code
                  </p>
                  <span className="inline-block px-3 py-1 bg-yellow-200 text-yellow-900 rounded-lg font-semibold text-sm">
                    {OverrideReasonCodes.find(r => r.code === defect.overrideReason)?.label || defect.overrideReason}
                  </span>
                </div>
                {defect.context?.override_notes && (
                  <div>
                    <p className="text-xs text-yellow-700 uppercase font-semibold mb-1">
                      Notes
                    </p>
                    <p className="text-sm text-yellow-900">
                      {defect.context.override_notes}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Matched Rules Section */}
          {defect.context?.active_constraints || defect.context?.active_preferences ? (
            <section>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Matched Rules</h3>
              <div className="space-y-3">
                {defect.context.active_constraints && defect.context.active_constraints.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                    <p className="text-xs text-red-700 uppercase font-semibold mb-2">
                      Applied Constraints
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {defect.context.active_constraints.map((ruleId, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-red-200 text-red-900 rounded font-mono text-xs"
                        >
                          {ruleId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {defect.context.active_preferences && defect.context.active_preferences.length > 0 && (
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                    <p className="text-xs text-emerald-700 uppercase font-semibold mb-2">
                      Applied Preferences
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {defect.context.active_preferences.map((ruleId, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-emerald-200 text-emerald-900 rounded font-mono text-xs"
                        >
                          {ruleId}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          ) : null}

          {/* Debug Context (Warehouse Details) */}
          {defect.context?.warehouse_id && (
            <section>
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Context Details</h3>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-slate-600 uppercase font-semibold mb-1">
                      Warehouse ID
                    </p>
                    <p className="font-mono text-slate-900">{defect.context.warehouse_id}</p>
                  </div>
                  {defect.context.total_locations_available !== undefined && (
                    <div>
                      <p className="text-xs text-slate-600 uppercase font-semibold mb-1">
                        Total Locations Available
                      </p>
                      <p className="font-mono text-slate-900">{defect.context.total_locations_available}</p>
                    </div>
                  )}
                  {defect.context.locations_after_constraints !== undefined && (
                    <div>
                      <p className="text-xs text-slate-600 uppercase font-semibold mb-1">
                        Locations After Constraints
                      </p>
                      <p className="font-mono text-slate-900">{defect.context.locations_after_constraints}</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
