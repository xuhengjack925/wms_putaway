import { useState } from 'react';
import { AlertTriangle, XCircle, AlertCircle, ChevronDown, ChevronRight, ShieldOff, Edit, Lightbulb } from 'lucide-react';
import { useRules } from '../context/RulesContext';
import { getProductionImpactConflicts } from '../utils/conflictDetection';

export default function ConflictsView() {
  const { conflicts, constraints, preferences, updateConstraint, updatePreference } = useRules();
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

  // Separate and sort conflicts by severity
  const errorConflicts = [
    ...displayConflicts.selfConflicts.filter(c => c.severity === 'error'),
    ...displayConflicts.interRuleConflicts.filter(c => c.severity === 'error')
  ].sort((a, b) => b.affectedProductCount - a.affectedProductCount);

  const warningConflicts = [
    ...displayConflicts.selfConflicts.filter(c => c.severity === 'warning'),
    ...displayConflicts.interRuleConflicts.filter(c => c.severity === 'warning')
  ].sort((a, b) => b.affectedProductCount - a.affectedProductCount);

  const totalConflicts = errorConflicts.length + warningConflicts.length;

  const handleDisableRule = (conflict) => {
    if (conflict.ruleId) {
      // Single rule conflict
      const rule = [...constraints, ...preferences].find(r => r.id === conflict.ruleId);
      if (rule) {
        if (constraints.find(c => c.id === rule.id)) {
          updateConstraint(rule.id, { enabled: false });
        } else {
          updatePreference(rule.id, { enabled: false });
        }
      }
    } else if (conflict.ruleIds && conflict.ruleIds.length > 0) {
      // Inter-rule conflict - disable first rule
      const rule = [...constraints, ...preferences].find(r => r.id === conflict.ruleIds[0]);
      if (rule) {
        if (constraints.find(c => c.id === rule.id)) {
          updateConstraint(rule.id, { enabled: false });
        } else {
          updatePreference(rule.id, { enabled: false });
        }
      }
    }
  };

  const handleNavigateToRule = (conflict) => {
    // Store the rule ID to navigate to
    const ruleId = conflict.ruleId || (conflict.ruleIds && conflict.ruleIds[0]);
    if (ruleId) {
      // Navigate to configuration tab with the rule ID in URL hash
      window.location.hash = `#configuration-rule-${ruleId}`;
      // Trigger a custom event that Configuration view can listen to
      window.dispatchEvent(new CustomEvent('navigate-to-rule', { detail: { ruleId } }));
    }
  };

  const getSuggestion = (conflict) => {
    if (conflict.type === 'self') {
      return "This rule's location criteria match zero locations. Consider relaxing the location criteria or checking if the targeted locations exist in your warehouse.";
    } else if (conflict.type === 'inter-rule') {
      return "These rules have overlapping product criteria but no location overlap. Consider adjusting location criteria in one of the rules to allow valid locations.";
    }
    return "Review the rule criteria and adjust as needed.";
  };

  const renderConflict = (conflict, index, severity) => {
    const conflictKey = `${severity}-${conflict.type}-${index}`;
    const isExpanded = expandedConflicts.has(conflictKey);

    return (
      <div
        key={conflictKey}
        className={`border rounded-lg overflow-hidden transition-all ${
          severity === 'error'
            ? 'bg-red-50 border-red-200'
            : 'bg-yellow-50 border-yellow-200'
        }`}
      >
        {/* Conflict Header */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            <button
              onClick={() => toggleConflict(conflictKey)}
              className="flex-shrink-0 mt-0.5 hover:opacity-70 transition-opacity"
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-slate-600" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-600" />
              )}
            </button>
            <div className="flex-shrink-0">
              {severity === 'error' ? (
                <XCircle className="w-6 h-6 text-red-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className={`font-semibold text-sm mb-1 ${
                severity === 'error' ? 'text-red-800' : 'text-yellow-800'
              }`}>
                {conflict.message}
              </div>
              <div className={`text-xs ${
                severity === 'error' ? 'text-red-700' : 'text-yellow-700'
              }`}>
                <span className="font-medium">{conflict.affectedProductCount} product{conflict.affectedProductCount !== 1 ? 's' : ''} affected</span>
                {conflict.affectedProductExamples && conflict.affectedProductExamples.length > 0 && (
                  <span className="ml-2 font-mono">
                    ({conflict.affectedProductExamples.join(', ')})
                  </span>
                )}
              </div>
            </div>
            <div className={`flex-shrink-0 px-2 py-1 rounded text-xs font-bold uppercase ${
              severity === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-yellow-600 text-white'
            }`}>
              {severity}
            </div>
          </div>

          {/* Actions - Always visible */}
          <div className="mt-3 flex gap-2 ml-8">
            <button
              onClick={() => handleDisableRule(conflict)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
              title="Disable this rule"
            >
              <ShieldOff className="w-3.5 h-3.5" />
              Disable Rule
            </button>
            <button
              onClick={() => handleNavigateToRule(conflict)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
              title="Edit this rule"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit Rule
            </button>
            <button
              onClick={() => toggleConflict(conflictKey)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-white border border-slate-300 hover:bg-slate-50 transition-colors"
              title="View suggestion"
            >
              <Lightbulb className="w-3.5 h-3.5" />
              Suggestion
            </button>
          </div>
        </div>

        {/* Conflict Details (Expanded) */}
        {isExpanded && (
          <div className="px-4 pb-4 pt-2 border-t border-slate-200/50">
            <div className="bg-white rounded-lg p-4 text-sm space-y-3 ml-8">
              {/* Suggestion */}
              <div className="flex gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-700 mb-1">Suggested Resolution:</div>
                  <div className="text-slate-600 text-xs leading-relaxed">
                    {getSuggestion(conflict)}
                  </div>
                </div>
              </div>

              {/* Type Badge */}
              <div className="flex gap-2 items-center text-xs">
                <span className="font-semibold text-slate-600">Type:</span>
                <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono">
                  {conflict.type}
                </span>
              </div>

              {/* Involved Rules */}
              {conflict.ruleName && (
                <div className="text-xs">
                  <span className="font-semibold text-slate-600">Rule:</span>
                  <span className="ml-2 text-slate-700">{conflict.ruleName}</span>
                </div>
              )}
              {conflict.ruleNames && (
                <div className="text-xs">
                  <span className="font-semibold text-slate-600">Conflicting Rules:</span>
                  <ul className="ml-4 mt-1 list-disc list-inside">
                    {conflict.ruleNames.map((name, i) => (
                      <li key={i} className="text-slate-700">{name}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Technical Details */}
              {conflict.details && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <span className="font-semibold text-slate-600 block mb-2 text-xs">Technical Details:</span>
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
  };

  if (totalConflicts === 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Rule Conflicts</h2>
          <p className="text-slate-600">
            Monitor and resolve configuration conflicts to ensure smooth putaway operations.
          </p>
        </div>

        {/* No Conflicts State */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">No Conflicts Detected</h3>
            <p className="text-slate-600 max-w-md">
              All rules are configured correctly with no conflicts or warnings. Your putaway configuration is ready for production use.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Rule Conflicts</h2>
          <p className="text-slate-600">
            {totalConflicts} conflict{totalConflicts !== 1 ? 's' : ''} detected • {errorConflicts.length} error{errorConflicts.length !== 1 ? 's' : ''}, {warningConflicts.length} warning{warningConflicts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex gap-1 bg-white rounded-lg border border-slate-200 p-0.5 shadow-sm">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              filterMode === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Conflicts
          </button>
          <button
            onClick={() => setFilterMode('production')}
            className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
              filterMode === 'production'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Production Impact
          </button>
        </div>
      </div>

      {/* Errors Section */}
      {errorConflicts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-bold text-red-800">
              Errors ({errorConflicts.length})
            </h3>
            <span className="text-sm text-red-700">• Critical issues that will prevent putaway</span>
          </div>
          <div className="space-y-3">
            {errorConflicts.map((conflict, index) => renderConflict(conflict, index, 'error'))}
          </div>
        </div>
      )}

      {/* Warnings Section */}
      {warningConflicts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="text-lg font-bold text-yellow-800">
              Warnings ({warningConflicts.length})
            </h3>
            <span className="text-sm text-yellow-700">• Non-critical issues that may affect optimization</span>
          </div>
          <div className="space-y-3">
            {warningConflicts.map((conflict, index) => renderConflict(conflict, index, 'warning'))}
          </div>
        </div>
      )}
    </div>
  );
}
