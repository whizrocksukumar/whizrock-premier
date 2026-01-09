'use client';

import { useState, useEffect } from 'react';
import { Calculator, Package, AlertTriangle, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Product {
  id: string;
  sku: string;
  product_description: string;
  r_value: string;
  application_type: string;
  bale_size_sqm: number;
  retail_price: number;
  pack_price: number;
  stock_level: number;
}

interface CalculationResult {
  baseArea: number;
  wastePercent: number;
  totalAreaWithWaste: number;
  packsRequired: number;
  totalSqmProvided: number;
  excessSqm: number;
  packPrice: number;
  totalCost: number;
  currentStock: number;
  stockShortfall: number;
}

export default function InsulationCalculatorPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [area, setArea] = useState<string>('');
  const [wastePercent, setWastePercent] = useState<string>('10');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, sku, product_description, r_value, application_type, bale_size_sqm, retail_price, pack_price, stock_level')
        .eq('is_active', true)
        .order('sku');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const filteredProducts = products.filter((p) =>
    searchTerm === '' ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.product_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.r_value.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.application_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateRequirements = () => {
    if (!selectedProduct || !area) return;

    const baseArea = parseFloat(area);
    const waste = parseFloat(wastePercent);

    if (isNaN(baseArea) || isNaN(waste) || baseArea <= 0) return;

    const totalAreaWithWaste = baseArea * (1 + waste / 100);
    const packsRequired = Math.ceil(totalAreaWithWaste / selectedProduct.bale_size_sqm);
    const totalSqmProvided = packsRequired * selectedProduct.bale_size_sqm;
    const excessSqm = totalSqmProvided - totalAreaWithWaste;
    const totalCost = packsRequired * selectedProduct.pack_price;
    const currentStock = selectedProduct.stock_level || 0;
    const stockShortfall = Math.max(0, packsRequired - currentStock);

    setResult({
      baseArea,
      wastePercent: waste,
      totalAreaWithWaste,
      packsRequired,
      totalSqmProvided,
      excessSqm,
      packPrice: selectedProduct.pack_price,
      totalCost,
      currentStock,
      stockShortfall,
    });
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSearchTerm('');
    setResult(null);
  };

  const resetCalculator = () => {
    setSelectedProduct(null);
    setArea('');
    setWastePercent('10');
    setResult(null);
    setSearchTerm('');
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Calculator className="w-8 h-8 text-[#0066CC]" />
          <h1 className="text-3xl font-bold text-gray-900">Insulation Calculator</h1>
        </div>
        <p className="text-gray-600">
          Calculate material requirements, packs needed, and costs for insulation jobs
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Product Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            1. Select Product
          </label>

          {selectedProduct ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">{selectedProduct.sku}</div>
                <div className="text-sm text-gray-600">{selectedProduct.product_description}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {selectedProduct.r_value} • {selectedProduct.application_type} •
                  {selectedProduct.bale_size_sqm}m² per pack
                </div>
              </div>
              <button
                onClick={resetCalculator}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Change
              </button>
            </div>
          ) : (
            <div>
              <input
                type="text"
                placeholder="Search by SKU, product name, R-value, or application..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />

              {searchTerm && (
                <div className="mt-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleProductSelect(product)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{product.sku}</div>
                        <div className="text-sm text-gray-600">{product.product_description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {product.r_value} • {product.application_type}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">No products found</div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Area Input */}
        {selectedProduct && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  2. Enter Area (m²)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g., 100.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  3. Waste Factor (%)
                </label>
                <input
                  type="number"
                  step="1"
                  value={wastePercent}
                  onChange={(e) => setWastePercent(e.target.value)}
                  placeholder="10"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Default: 10% (industry standard)</p>
              </div>
            </div>

            <button
              onClick={calculateRequirements}
              disabled={!area || parseFloat(area) <= 0}
              className="w-full bg-[#0066CC] text-white py-3 rounded-lg hover:bg-[#0052A3] transition disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
            >
              <Calculator className="w-5 h-5" />
              Calculate Requirements
            </button>
          </>
        )}

        {/* Results */}
        {result && selectedProduct && (
          <div className="border-t border-gray-200 pt-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-green-600" />
              Calculation Results
            </h2>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Base Area</div>
                <div className="text-2xl font-bold text-gray-900">{result.baseArea.toFixed(2)} m²</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Area + Waste</div>
                <div className="text-2xl font-bold text-gray-900">{result.totalAreaWithWaste.toFixed(2)} m²</div>
                <div className="text-xs text-gray-500">+{result.wastePercent}% waste</div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-sm text-blue-700 mb-1">Packs Required</div>
                <div className="text-2xl font-bold text-blue-900">{result.packsRequired} packs</div>
                <div className="text-xs text-blue-600">
                  {result.totalSqmProvided.toFixed(2)} m² total coverage
                </div>
              </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-gray-900">Material Breakdown</h3>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-gray-600">Pack Size:</div>
                <div className="font-medium text-gray-900">{selectedProduct.bale_size_sqm} m² per pack</div>

                <div className="text-gray-600">Packs Required:</div>
                <div className="font-medium text-gray-900">{result.packsRequired} packs</div>

                <div className="text-gray-600">Total Coverage:</div>
                <div className="font-medium text-gray-900">{result.totalSqmProvided.toFixed(2)} m²</div>

                <div className="text-gray-600">Buffer Material:</div>
                <div className="font-medium text-green-600">+{result.excessSqm.toFixed(2)} m²</div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200 space-y-3">
              <h3 className="font-semibold text-gray-900">Cost Summary</h3>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-gray-600">Price per Pack:</div>
                <div className="font-medium text-gray-900">${result.packPrice.toFixed(2)}</div>

                <div className="text-gray-600">Number of Packs:</div>
                <div className="font-medium text-gray-900">{result.packsRequired}</div>

                <div className="col-span-2 border-t border-green-300 my-2"></div>

                <div className="text-gray-900 font-semibold">Total Cost:</div>
                <div className="text-2xl font-bold text-green-700">${result.totalCost.toFixed(2)}</div>
              </div>
            </div>

            {/* Stock Status */}
            <div className={`rounded-lg p-4 border ${
              result.stockShortfall > 0
                ? 'bg-red-50 border-red-200'
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-start gap-3">
                {result.stockShortfall > 0 ? (
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className={`font-semibold mb-1 ${
                    result.stockShortfall > 0 ? 'text-red-900' : 'text-green-900'
                  }`}>
                    Stock Status
                  </h3>
                  <div className="text-sm space-y-1">
                    <div className="text-gray-700">
                      Current Stock: <span className="font-medium">{result.currentStock} packs</span>
                    </div>
                    {result.stockShortfall > 0 ? (
                      <div className="text-red-700 font-medium">
                        ⚠️ Stock shortage of {result.stockShortfall} packs
                        ({(result.stockShortfall * selectedProduct.bale_size_sqm).toFixed(2)} m²)
                        <div className="text-xs mt-1">Procurement order needed before job can proceed</div>
                      </div>
                    ) : (
                      <div className="text-green-700 font-medium">
                        ✓ Sufficient stock available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => window.print()}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Print Results
              </button>
              <button
                onClick={resetCalculator}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                New Calculation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Help Text */}
      {!selectedProduct && !searchTerm && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">How to Use</h3>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Search and select an insulation product</li>
            <li>Enter the area in square meters (m²)</li>
            <li>Adjust waste factor if needed (default 10%)</li>
            <li>Click "Calculate Requirements" to see results</li>
          </ol>
        </div>
      )}
    </div>
  );
}
