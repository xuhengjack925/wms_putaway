import { useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import ScenarioBuilder from './ScenarioBuilder';
import ExecutionTrace from './ExecutionTrace';
import ResultCard from './ResultCard';
import { useRules } from '../context/RulesContext';
import { executePutaway } from '../utils/executionEngine';
import { MOCK_LOCATIONS, TEST_PRODUCTS } from '../data/mockData';

export default function SimulatorView() {
  const { constraints, preferences } = useRules();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [transactionType, setTransactionType] = useState('Inbound PO');
  const [cartContext, setCartContext] = useState({ cartId: null, lastPutLocation: null });
  const [executionResult, setExecutionResult] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecute = () => {
    if (!selectedProduct) return;

    setIsExecuting(true);

    // Simulate processing delay for UX
    setTimeout(() => {
      const result = executePutaway(
        selectedProduct,
        transactionType,
        MOCK_LOCATIONS,
        constraints,
        preferences,
        cartContext
      );

      setExecutionResult(result);
      setIsExecuting(false);

      // Update cart context if successful
      if (result.success && cartContext.cartId) {
        setCartContext(prev => ({
          ...prev,
          lastPutLocation: result.assignedLocation.id
        }));
      }
    }, 300);
  };

  const handleReset = () => {
    setSelectedProduct(null);
    setTransactionType('Inbound PO');
    setCartContext({ cartId: null, lastPutLocation: null });
    setExecutionResult(null);
  };

  return (
    <div className="grid grid-cols-2 gap-6 h-full">
      {/* Left Panel: Scenario Builder */}
      <div className="space-y-4">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800">Scenario Builder</h2>
            <button
              onClick={handleReset}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <ScenarioBuilder
            selectedProduct={selectedProduct}
            onProductSelect={setSelectedProduct}
            transactionType={transactionType}
            onTransactionTypeChange={setTransactionType}
            cartContext={cartContext}
            onCartContextChange={setCartContext}
          />

          <button
            onClick={handleExecute}
            disabled={!selectedProduct || isExecuting}
            className="w-full mt-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium transition-colors"
          >
            <Play className="w-4 h-4" />
            {isExecuting ? 'Executing...' : 'Execute Putaway'}
          </button>
        </div>

        {/* Result Card */}
        {executionResult && (
          <ResultCard result={executionResult} />
        )}
      </div>

      {/* Right Panel: Execution Trace */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Execution Trace</h2>
        {executionResult ? (
          <ExecutionTrace logs={executionResult.logs} />
        ) : (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <div className="text-center">
              <Play className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Execute a scenario to see the trace</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
