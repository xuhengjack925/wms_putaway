import { AlertTriangle, XCircle, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useRules } from '../context/RulesContext';
import { getProductionImpactConflicts } from '../utils/conflictDetection';

export default function ConflictPanel() {
  const { conflicts, constraints, preferences } = useRules();
  const [expandedConflicts, setExpandedConflicts] = useState(new Set());
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'production'

  const toggleConflict = (conflictKey) => {
    const newExpanded = new Set(expandedConflicts);
    if (newExpanded.has(conflictKey)) {
      newExpanded.delete(conflictKey);
    } else {
      newExpanded.add(conflictKey);
    }
    setExpandedConflicts(newExpanded);
  };

  // Get conflicts based on filter
  const displayConflicts = filterMode === 'production'
    ? getProductionImpactConflicts(conflicts, constraints, preferences)
    : conflicts;

  const allConflictsList = [
    ...displayConflicts.selfConflicts,
    ...displayConflicts.interRuleConflicts,
    ...displayConflicts.deadPreferences
  ];

  // Sort by severity (error first) then by affected product count
  allConflictsList.sort((a, b) => {
    if (a.severity !== b.severity) {
      return a.severity === 'error' ? -1 : 1;
    }
    return b.affectedProductCount - a.affectedProductCount;
  });

  const errorCount = allConflictsList.filter(c => c.severity === 'error').length;
  const warningCount = allConflictsList.filter(c => c.severity === 'warning').length;

  if (allConflictsList.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-green-800 text-sm">No Conflicts Detected</h3>
            <p className="text-green-700 text-xs mt-0.5">
              All rules are configured correctly with no conflicts or warnings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {/* Summary Header */}
      <div className={`border rounded-lg p-4 mb-3 ${
        errorCount > 0 ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              errorCount > 0 ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              {errorCount > 0 ? (
                <XCircle className="w-5 h-5 text-red-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className={`font-bold text-sm ${
                errorCount > 0 ? 'text-red-800' : 'text-yellow-800'
              }`}>
                {allConflictsList.length} Conflict{allConflictsList.length !== 1 ? 's' : ''} Detected
              </h3>
              <p className={`text-xs mt-1 ${
                errorCount > 0 ? 'text-red-700' : 'text-yellow-700'
              }`}>
                {errorCount > 0 && `${errorCount} error${errorCount !== 1 ? 's' : ''}`}
                {errorCount > 0 && warningCount > 0 && ', '}
                {warningCount > 0 && `${warningCount} warning${warningCount !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>

          {/* Filter Toggle */}
          <div className="flex gap-1 bg-white rounded-lg border border-slate-200 p-0.5">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                filterMode === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterMode('production')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                filterMode === 'production'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Production Impact
            </button>
          </div>
        </div>
      </div>

      {/* Conflict List */}
      <div className="space-y-2">
        {allConflictsList.map((conflict, index) => {
          const conflictKey = `${conflict.type}-${index}`;
          const isExpanded = expandedConflicts.has(conflictKey);

          return (
            <div
              key={conflictKey}
              className={`border rounded-lg overflow-hidden ${
                conflict.severity === 'error'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              {/* Conflict Header */}
              <button
                onClick={() => toggleConflict(conflictKey)}
                className="w-full p-4 flex items-start gap-3 hover:bg-white/50 transition-colors"
              >
                <div className="flex-shrink-0 mt-0.5">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  )}
                </div>
                <div className="flex-shrink-0">
                  {conflict.severity === 'error' ? (
                    <XCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className={`font-semibold text-sm ${
                    conflict.severity === 'error' ? 'text-red-800' : 'text-yellow-800'
                  }`}>
                    {conflict.message}
                  </div>
                  <div className={`text-xs mt-1 ${
                    conflict.severity === 'error' ? 'text-red-700' : 'text-yellow-700'
                  }`}>
                    {conflict.affectedProductCount} product{conflict.affectedProductCount !== 1 ? 's' : ''} affected
                    {conflict.affectedProductExamples && conflict.affectedProductExamples.length > 0 && (
                      <span className="ml-2 font-mono">
                        ({conflict.affectedProductExamples.join(', ')})
                      </span>
                    )}
                  </div>
                </div>
                <div className={`flex-shrink-0 px-2 py-1 rounded text-xs font-bold uppercase ${
                  conflict.severity === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {conflict.severity}
                </div>
              </button>

              {/* Conflict Details (Expanded) */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-slate-200/50">
                  <div className="bg-white rounded-lg p-3 text-xs space-y-2">
                    {/* Type Badge */}
                    <div className="flex gap-2 items-center">
                      <span className="font-semibold text-slate-600">Type:</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono">
                        {conflict.type}
                      </span>
                    </div>

                    {/* Involved Rules */}
                    {conflict.ruleName && (
                      <div>
                        <span className="font-semibold text-slate-600">Rule:</span>
                        <span className="ml-2 text-slate-700">{conflict.ruleName}</span>
                      </div>
                    )}
                    {conflict.ruleNames && (
                      <div>
                        <span className="font-semibold text-slate-600">Conflicting Rules:</span>
                        <ul className="ml-4 mt-1 list-disc list-inside">
                          {conflict.ruleNames.map((name, i) => (
                            <li key={i} className="text-slate-700">{name}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Details */}
                    {conflict.details && (
                      <div className="mt-3 pt-3 border-t border-slate-200">
                        <span className="font-semibold text-slate-600 block mb-2">Technical Details:</span>
                        <pre className="text-xs bg-slate-50 p-2 rounded overflow-x-auto text-slate-700 font-mono">
                          {JSON.stringify(conflict.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
