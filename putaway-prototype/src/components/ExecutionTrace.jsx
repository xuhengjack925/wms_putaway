import { CheckCircle, XCircle, Info, Filter, Target, AlertTriangle } from 'lucide-react';

const LOG_TYPE_CONFIG = {
  info: {
    icon: Info,
    color: 'text-slate-500',
    bg: 'bg-slate-50',
    border: 'border-slate-200'
  },
  filter: {
    icon: Filter,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200'
  },
  attempt: {
    icon: Target,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200'
  },
  success: {
    icon: CheckCircle,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200'
  },
  fail: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200'
  },
  skip: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200'
  }
};

export default function ExecutionTrace({ logs }) {
  const groupedLogs = logs.reduce((acc, log) => {
    const phase = log.phase ?? 'other';
    if (!acc[phase]) acc[phase] = [];
    acc[phase].push(log);
    return acc;
  }, {});

  const phases = Object.keys(groupedLogs).sort((a, b) => Number(a) - Number(b));

  const getPhaseLabel = (phase) => {
    switch (String(phase)) {
      case '0': return 'Initialization';
      case '1': return 'Phase 1: Hard Constraints';
      case '2': return 'Phase 2: Preferences';
      default: return 'Other';
    }
  };

  const getPhaseColor = (phase) => {
    switch (String(phase)) {
      case '0': return 'bg-slate-100 text-slate-700';
      case '1': return 'bg-red-100 text-red-700';
      case '2': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-4 max-h-[calc(100vh-240px)] overflow-y-auto pr-2">
      {phases.map(phase => (
        <div key={phase} className="space-y-2">
          {/* Phase Header */}
          <div className={`px-3 py-1.5 rounded-lg font-bold text-xs uppercase ${getPhaseColor(phase)}`}>
            {getPhaseLabel(phase)}
          </div>

          {/* Phase Logs */}
          <div className="space-y-2">
            {groupedLogs[phase].map((log, idx) => {
              const config = LOG_TYPE_CONFIG[log.type] || LOG_TYPE_CONFIG.info;
              const Icon = config.icon;

              return (
                <div
                  key={idx}
                  className={`border rounded-lg p-3 ${config.bg} ${config.border}`}
                >
                  <div className="flex items-start gap-2">
                    <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-slate-800 font-medium">
                        {log.ruleName && (
                          <span className="font-bold">[{log.ruleName}] </span>
                        )}
                        {log.message}
                      </div>

                      {/* Details */}
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-2 text-xs text-slate-600 space-y-1">
                          {Object.entries(log.details).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="font-semibold capitalize">
                                {key.replace(/_/g, ' ')}:
                              </span>
                              <span className="font-mono">
                                {Array.isArray(value) ? value.join(', ') : String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Priority Badge */}
                      {log.priority !== undefined && (
                        <div className="mt-2">
                          <span className="inline-block bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">
                            Priority #{log.priority}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
