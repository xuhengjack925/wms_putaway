import { Package, ShoppingCart, Sparkles } from 'lucide-react';
import { TEST_PRODUCTS } from '../data/mockData';
import { TEST_SCENARIOS } from '../data/testScenarios';
import { TRANSACTION_TYPES } from '../types';

export default function ScenarioBuilder({
  selectedProduct,
  onProductSelect,
  transactionType,
  onTransactionTypeChange,
  cartContext,
  onCartContextChange
}) {
  const handleLoadScenario = (scenarioId) => {
    const scenario = TEST_SCENARIOS.find(s => s.id === scenarioId);
    if (scenario) {
      onProductSelect(scenario.product);
      onTransactionTypeChange(scenario.transactionType);
      onCartContextChange(scenario.cartContext);
    }
  };

  return (
    <div className="space-y-6">
      {/* Preset Scenarios */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
        <label className="block text-xs font-bold text-purple-700 uppercase mb-2 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Quick Load Scenario
        </label>
        <select
          onChange={e => e.target.value && handleLoadScenario(e.target.value)}
          defaultValue=""
          className="w-full border border-purple-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none bg-white"
        >
          <option value="">-- Select a test scenario --</option>
          {TEST_SCENARIOS.map(scenario => (
            <option key={scenario.id} value={scenario.id}>
              {scenario.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-purple-600 mt-2">
          Pre-configured scenarios demonstrating specific rules and edge cases
        </p>
      </div>

      {/* Transaction Type */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
          Transaction Type
        </label>
        <select
          value={transactionType}
          onChange={e => onTransactionTypeChange(e.target.value)}
          className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          {TRANSACTION_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Product Selection */}
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
          <Package className="w-3 h-3 inline mr-1" />
          Select Product
        </label>
        <div className="space-y-2">
          {TEST_PRODUCTS.map(product => (
            <button
              key={product.sku_id}
              onClick={() => onProductSelect(product)}
              className={`w-full text-left border rounded-lg p-3 transition-all ${
                selectedProduct?.sku_id === product.sku_id
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="font-semibold text-sm text-slate-800">{product.sku_id}</div>
              <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                <div>Merchant: {product.merchant_id}</div>
                <div>ABC: {product.abc_code} | Status: {product.inventory_status}</div>
                <div>Weight: {product.weight} kg | Temp: {product.temp_zone}</div>
                {product.is_oversized && <span className="text-orange-600 font-medium">Oversized</span>}
                {product.hazmat_class && <span className="text-red-600 font-medium ml-2">Hazmat: {product.hazmat_class}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Consolidation Context */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <label className="block text-xs font-bold text-slate-500 uppercase mb-3">
          <ShoppingCart className="w-3 h-3 inline mr-1" />
          Cart Context (Optional)
        </label>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-slate-600 mb-1">Cart ID</label>
            <input
              type="text"
              value={cartContext.cartId || ''}
              onChange={e => onCartContextChange({ ...cartContext, cartId: e.target.value || null })}
              placeholder="e.g., CART-001"
              className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Last Put Location</label>
            <input
              type="text"
              value={cartContext.lastPutLocation || ''}
              onChange={e => onCartContextChange({ ...cartContext, lastPutLocation: e.target.value || null })}
              placeholder="e.g., A01-01-01"
              className="w-full border border-slate-300 rounded p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              Used for "Follow the Leader" cart consolidation
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
