import { useState } from 'react';
import { Box, Settings, Play, AlertTriangle } from 'lucide-react';
import { RulesProvider, useRules } from './context/RulesContext';
import ConfigurationView from './components/ConfigurationView';
import SimulatorView from './components/SimulatorView';
import DefectsView from './components/DefectsView';

function AppContent() {
  const [activeTab, setActiveTab] = useState('config');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Box className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-xl font-bold">WMS Putaway Rules Engine</h1>
            <p className="text-xs text-slate-400">PRD v3.0 • Defect Logging System</p>
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
            onClick={() => setActiveTab('defects')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'defects'
                ? 'bg-orange-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Defects
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
        {activeTab === 'defects' && <DefectsView />}
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
