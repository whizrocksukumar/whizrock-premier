import React, { useState, useEffect } from 'react';
import { Search, RotateCcw, Package, DollarSign, AlertCircle, Plus, Trash2, ChevronDown } from 'lucide-react';

export default function InsulationCalculator() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [sections, setSections] = useState([
    {
      id: 1,
      name: 'Section 1',
      productId: null,
      areaNeeded: '',
      wastePercent: 10,
      results: null,
    }
  ]);
  const [totalResults, setTotalResults] = useState(null);
  const [nextSectionId, setNextSectionId] = useState(2);

  // Fetch products from Supabase on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Recalculate whenever sections change
  useEffect(() => {
    calculateAll();
  }, [sections, products]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(
        'https://syyzrgybeqnyjfqealnv.supabase.co/rest/v1/products?select=id,sku,product_description,category,application_type,r_value,thickness_mm,insulation_width,bale_size_sqm,retail_price,pack_price&is_active=eq.true&is_labour=eq.false&order=category,r_value',
        {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5eXpyZ3liZXFuYWpmaXFlYWxudiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzMyNDQ5NjMxLCJleHAiOjE3NDgwMDc2MzF9.dsgaLuZ_cqGlGUklv5jmG3_pXrGR0gQB_8O0j9TRY4o',
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data);
      setLoadingProducts(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoadingProducts(false);
    }
  };

  const calculateSectionResults = (section) => {
    if (!section.productId || !section.areaNeeded) return null;

    const product = products.find(p => p.id === section.productId);
    if (!product) return null;

    const area = parseFloat(section.areaNeeded);
    const waste = parseFloat(section.wastePercent);
    const baleSize = product.bale_size_sqm || 1;
    const packPrice = product.pack_price || 0;
    const retailPrice = product.retail_price || 0;

    // Calculations
    const areaWithWaste = area * (1 + waste / 100);
    const packsRequired = Math.ceil(areaWithWaste / baleSize);
    const totalCoverageProvided = packsRequired * baleSize;
    const excessMaterial = totalCoverageProvided - areaWithWaste;
    const totalCost = packsRequired * packPrice;
    const costPerSqm = totalCoverageProvided > 0 ? totalCost / totalCoverageProvided : 0;

    return {
      area,
      wastePercent: waste,
      areaWithWaste: parseFloat(areaWithWaste.toFixed(2)),
      baleSize,
      packsRequired,
      totalCoverageProvided: parseFloat(totalCoverageProvided.toFixed(2)),
      excessMaterial: parseFloat(excessMaterial.toFixed(2)),
      retailPrice,
      packPrice,
      totalCost: parseFloat(totalCost.toFixed(2)),
      costPerSqm: parseFloat(costPerSqm.toFixed(2)),
      product,
    };
  };

  const calculateAll = () => {
    // Calculate results for each section
    const updatedSections = sections.map(section => ({
      ...section,
      results: calculateSectionResults(section),
    }));
    setSections(updatedSections);

    // Calculate totals
    const validResults = updatedSections
      .filter(s => s.results !== null)
      .map(s => s.results);

    if (validResults.length > 0) {
      const totalArea = validResults.reduce((sum, r) => sum + r.area, 0);
      const totalAreaWithWaste = validResults.reduce((sum, r) => sum + r.areaWithWaste, 0);
      const totalPacks = validResults.reduce((sum, r) => sum + r.packsRequired, 0);
      const totalCost = validResults.reduce((sum, r) => sum + r.totalCost, 0);

      setTotalResults({
        totalArea: parseFloat(totalArea.toFixed(2)),
        totalAreaWithWaste: parseFloat(totalAreaWithWaste.toFixed(2)),
        totalWaste: parseFloat((totalAreaWithWaste - totalArea).toFixed(2)),
        totalPacks,
        totalCost: parseFloat(totalCost.toFixed(2)),
        itemCount: validResults.length,
      });
    } else {
      setTotalResults(null);
    }
  };

  const handleSectionChange = (id, field, value) => {
    setSections(
      sections.map(section =>
        section.id === id ? { ...section, [field]: value } : section
      )
    );
  };

  const handleAddSection = () => {
    setSections([
      ...sections,
      {
        id: nextSectionId,
        name: `Section ${nextSectionId}`,
        productId: null,
        areaNeeded: '',
        wastePercent: 10,
        results: null,
      },
    ]);
    setNextSectionId(nextSectionId + 1);
  };

  const handleRemoveSection = (id) => {
    if (sections.length > 1) {
      setSections(sections.filter(s => s.id !== id));
    }
  };

  const handleReset = () => {
    setSections([
      {
        id: 1,
        name: 'Section 1',
        productId: null,
        areaNeeded: '',
        wastePercent: 10,
        results: null,
      }
    ]);
    setTotalResults(null);
    setNextSectionId(2);
  };

  const getProductsByCategory = () => {
    const categories = {};
    products.forEach(product => {
      if (!categories[product.category]) {
        categories[product.category] = [];
      }
      categories[product.category].push(product);
    });
    return categories;
  };

  const productsByCategory = getProductsByCategory();

  if (loadingProducts) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Insulation Calculator</h1>
          <p className="text-gray-600">Calculate material requirements for multiple sections with different products</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Sections */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Sections</h2>
                <button
                  onClick={handleAddSection}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition flex items-center gap-1"
                  title="Add new section"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sections.map((section, index) => (
                  <div
                    key={section.id}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition ${
                      section.results
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <input
                        type="text"
                        value={section.name}
                        onChange={(e) => handleSectionChange(section.id, 'name', e.target.value)}
                        className="font-medium text-sm bg-transparent border-b border-gray-300 w-full mr-2"
                      />
                      {sections.length > 1 && (
                        <button
                          onClick={() => handleRemoveSection(section.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {section.results && (
                      <div className="text-xs space-y-1 mt-2 pt-2 border-t border-green-200">
                        <p className="text-gray-700">
                          <strong>{section.results.packsRequired}</strong> packs
                        </p>
                        <p className="text-green-700 font-medium">
                          ${section.results.totalCost.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleReset}
                className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset All
              </button>
            </div>
          </div>

          {/* Middle Panel - Input Forms */}
          <div className="lg:col-span-2 space-y-4">
            {sections.map((section) => (
              <div key={section.id} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <input
                    type="text"
                    value={section.name}
                    onChange={(e) => handleSectionChange(section.id, 'name', e.target.value)}
                    placeholder="e.g., Ceiling, External Walls..."
                    className="flex-1 text-lg font-semibold text-gray-800 border-b-2 border-gray-200 focus:border-blue-500 focus:outline-none pb-1 transition"
                  />
                </div>

                {/* Product Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Package className="inline w-4 h-4 mr-2" />
                    Select Product
                  </label>
                  <select
                    value={section.productId || ''}
                    onChange={(e) => handleSectionChange(section.id, 'productId', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choose a product...</option>
                    {Object.entries(productsByCategory).map(([category, categoryProducts]) => (
                      <optgroup key={category} label={category}>
                        {categoryProducts.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.sku} - {product.r_value} ({product.application_type})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>

                  {section.productId && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      {(() => {
                        const selectedProduct = products.find(p => p.id === section.productId);
                        return selectedProduct ? (
                          <div>
                            <p className="font-medium text-blue-900">{selectedProduct.sku}</p>
                            <p className="text-xs text-blue-700 mt-1">{selectedProduct.product_description}</p>
                            <div className="text-xs text-blue-600 mt-2 space-y-1">
                              <p>R-Value: <strong>{selectedProduct.r_value}</strong></p>
                              <p>Bale: <strong>{selectedProduct.bale_size_sqm}m²</strong> | Pack Price: <strong>${selectedProduct.pack_price}</strong></p>
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}
                </div>

                {/* Area Needed */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Area Needed (m²)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={section.areaNeeded}
                    onChange={(e) => handleSectionChange(section.id, 'areaNeeded', e.target.value)}
                    placeholder="100"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Waste Factor */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Waste Factor (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={section.wastePercent}
                    onChange={(e) => handleSectionChange(section.id, 'wastePercent', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            ))}

            {/* Add Section Button */}
            <button
              onClick={handleAddSection}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Another Section
            </button>
          </div>

          {/* Right Panel - Results */}
          <div className="lg:col-span-1">
            <div className="space-y-4 sticky top-6">
              {/* Individual Section Results */}
              {sections.map((section) =>
                section.results ? (
                  <div key={section.id} className="bg-white rounded-lg shadow-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3 text-sm">{section.name}</h4>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base Area:</span>
                        <span className="font-medium">{section.results.area.toFixed(2)} m²</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">With Waste:</span>
                        <span className="font-medium text-blue-600">{section.results.areaWithWaste.toFixed(2)} m²</span>
                      </div>
                      
                      <div className="border-t border-gray-200 my-2 pt-2">
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-600">Packs:</span>
                          <span className="font-bold text-lg text-green-600">{section.results.packsRequired}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Coverage:</span>
                          <span>{section.results.totalCoverageProvided.toFixed(2)} m²</span>
                        </div>
                        <div className="flex justify-between text-xs text-amber-600">
                          <span>Buffer:</span>
                          <span>{section.results.excessMaterial.toFixed(2)} m²</span>
                        </div>
                      </div>

                      <div className="border-t border-gray-200 my-2 pt-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cost:</span>
                          <span className="font-bold text-green-700">${section.results.totalCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Per Pack:</span>
                          <span>${section.results.packPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null
              )}

              {/* Total Results */}
              {totalResults && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg shadow-lg p-4">
                  <h4 className="font-bold text-green-900 mb-4">TOTAL SUMMARY</h4>
                  
                  <div className="space-y-3">
                    <div className="bg-white rounded p-3">
                      <p className="text-xs text-gray-600 mb-1">Total Area</p>
                      <p className="text-2xl font-bold text-gray-800">{totalResults.totalArea.toFixed(2)} m²</p>
                    </div>

                    <div className="bg-white rounded p-3">
                      <p className="text-xs text-gray-600 mb-1">With Waste ({totalResults.totalWaste.toFixed(2)} m²)</p>
                      <p className="text-2xl font-bold text-blue-600">{totalResults.totalAreaWithWaste.toFixed(2)} m²</p>
                    </div>

                    <div className="bg-white rounded p-3 border-2 border-green-300">
                      <p className="text-xs text-green-700 font-medium mb-1">Total Packs Required</p>
                      <p className="text-3xl font-bold text-green-700">{totalResults.totalPacks}</p>
                    </div>

                    <div className="bg-white rounded p-3 border-2 border-emerald-400">
                      <p className="text-xs text-emerald-700 font-medium mb-1">Total Cost</p>
                      <p className="text-3xl font-bold text-emerald-700">${totalResults.totalCost.toFixed(2)}</p>
                    </div>

                    <div className="text-xs text-gray-600 bg-white rounded p-3">
                      <p className="mb-1">Items: {totalResults.itemCount}</p>
                    </div>
                  </div>
                </div>
              )}

              {!totalResults && sections.some(s => s.productId) && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                  <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  <p className="text-sm text-amber-700">Complete all sections to see totals</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
