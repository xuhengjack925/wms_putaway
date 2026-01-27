import { useState } from 'react';
import { Box, Settings, Play, AlertTriangle } from 'lucide-react';
import { RulesProvider, useRules } from './context/RulesContext';
import ConfigurationView from './components/ConfigurationView';
import SimulatorView from './components/SimulatorView';
import ConflictsView from './components/ConflictsView';

function AppContent() {
  const [activeTab, setActiveTab] = useState('config');
  const { conflicts } = useRules();

  // Count total conflicts
  const totalConflicts =
    conflicts.selfConflicts.length +
    conflicts.interRuleConflicts.length;

  const errorCount = [
    ...conflicts.selfConflicts,
    ...conflicts.interRuleConflicts
  ].filter(c => c.severity === 'error').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Box className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-xl font-bold">WMS Putaway Rules Engine</h1>
            <p className="text-xs text-slate-400">PRD v2.1 • Phase 1 Prototype</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'config'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            Configuration
          </button>
          <button
            onClick={() => setActiveTab('conflicts')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 relative ${
              activeTab === 'conflicts'
                ? 'bg-red-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Conflicts
            {totalConflicts > 0 && (
              <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                errorCount > 0 ? 'bg-red-500' : 'bg-yellow-500'
              } text-white`}>
                {totalConflicts > 9 ? '9+' : totalConflicts}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'simulator'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-4 h-4" />
            Simulator
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1920px] mx-auto p-6">
        {activeTab === 'config' && <ConfigurationView />}
        {activeTab === 'conflicts' && <ConflictsView />}
        {activeTab === 'simulator' && <SimulatorView />}
      </main>
    </div>
  );
}

function App() {
  return (
    <RulesProvider>
      <AppContent />
    </RulesProvider>
  );
}

export default App;
