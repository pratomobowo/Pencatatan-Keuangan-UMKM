import React, { useState } from 'react';
import { CostComponent, Product } from '@/lib/types';
import { Card } from './ui/Card';
import { Plus, Trash2, Save, Calculator, ArrowRight, Package, Box, Layers, Tag } from 'lucide-react';

interface HPPCalculatorProps {
  savedComponents: CostComponent[];
  onAddCostComponent: (cost: CostComponent) => void;
  onDeleteCostComponent: (id: string) => void;
  onSaveProduct: (product: Product) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export const HPPCalculator: React.FC<HPPCalculatorProps> = ({
  savedComponents,
  onAddCostComponent,
  onDeleteCostComponent,
  onSaveProduct
}) => {
  // State for adding new Component to Library
  const [newComponent, setNewComponent] = useState<Omit<CostComponent, 'id'>>({
    name: '',
    cost: 0,
    unit: 'pcs'
  });

  // State for Current Product Calculation
  const [calcForm, setCalcForm] = useState({
    productName: '',
    productUnit: 'pack',
    baseMaterialName: '',
    baseMaterialCost: 0,
    shrinkagePercent: 0,
    marginPercent: 30,
    addedComponents: [] as { id: string; name: string; cost: number; qty: number }[] // Components used in this specific calculation
  });

  // --- Logic for Component Library ---
  const handleAddComponent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComponent.name || newComponent.cost <= 0) return;

    onAddCostComponent({
      ...newComponent,
      id: crypto.randomUUID()
    });
    setNewComponent({ name: '', cost: 0, unit: 'pcs' });
  };

  // --- Logic for Calculation Form ---
  const addComponentToCalculation = (component: CostComponent) => {
    setCalcForm(prev => ({
      ...prev,
      addedComponents: [
        ...prev.addedComponents,
        { id: component.id, name: component.name, cost: component.cost, qty: 1 }
      ]
    }));
  };

  const removeComponentFromCalculation = (index: number) => {
    setCalcForm(prev => ({
      ...prev,
      addedComponents: prev.addedComponents.filter((_, i) => i !== index)
    }));
  };

  const updateComponentQty = (index: number, qty: number) => {
    setCalcForm(prev => {
      const updated = [...prev.addedComponents];
      updated[index] = { ...updated[index], qty };
      return { ...prev, addedComponents: updated };
    });
  };

  // --- The Core Math ---
  const calculateResult = () => {
    const shrinkageCost = calcForm.baseMaterialCost * (calcForm.shrinkagePercent / 100);
    const costAfterShrinkage = calcForm.baseMaterialCost + shrinkageCost;

    const componentsTotalCost = calcForm.addedComponents.reduce((acc, curr) => acc + (curr.cost * curr.qty), 0);

    const totalHPP = costAfterShrinkage + componentsTotalCost;
    const profit = totalHPP * (calcForm.marginPercent / 100);
    const sellingPrice = totalHPP + profit;
    const roundedPrice = Math.ceil(sellingPrice / 500) * 500;

    return { shrinkageCost, costAfterShrinkage, componentsTotalCost, totalHPP, profit, sellingPrice, roundedPrice };
  };

  const handleSaveToCatalog = () => {
    const { totalHPP, roundedPrice } = calculateResult();

    if (!calcForm.productName) {
      alert("Nama Produk harus diisi!");
      return;
    }

    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: calcForm.productName,
      unit: calcForm.productUnit,
      costPrice: totalHPP,
      price: roundedPrice,
      stock: 0
    };

    onSaveProduct(newProduct);
    alert(`Produk "${calcForm.productName}" berhasil disimpan ke Katalog!`);

    // Reset Form (optional)
    setCalcForm({
      productName: '',
      productUnit: 'pack',
      baseMaterialName: '',
      baseMaterialCost: 0,
      shrinkagePercent: 0,
      marginPercent: 30,
      addedComponents: []
    });
  };

  const result = calculateResult();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT COLUMN: Component Library */}
        <div className="lg:col-span-4">
          <Card className="h-full">
            {/* Action Bar */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Database Komponen</h3>
                <p className="text-xs text-slate-500 mt-0.5">Simpan data kemasan, bumbu, atau biaya per-unit.</p>
              </div>
            </div>

            {/* Add Component Form */}
            <form onSubmit={handleAddComponent} className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4">
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="Nama (Misal: Thinwall 800ml)"
                    required
                    value={newComponent.name}
                    onChange={e => setNewComponent({ ...newComponent, name: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Harga Satuan"
                    required
                    min="1"
                    value={newComponent.cost || ''}
                    onChange={e => setNewComponent({ ...newComponent, cost: parseFloat(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Unit"
                    value={newComponent.unit}
                    onChange={e => setNewComponent({ ...newComponent, unit: e.target.value })}
                    className="w-20 p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button type="submit" className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center justify-center gap-1 transition-colors">
                  <Plus size={16} /> Simpan Komponen
                </button>
              </div>
            </form>

            {/* List of Components */}
            <div className="space-y-2 overflow-y-auto max-h-[400px] pr-1">
              {savedComponents.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  Belum ada data komponen.
                </div>
              ) : (
                savedComponents.map(comp => (
                  <div key={comp.id} className="flex justify-between items-center bg-white p-3 border border-slate-100 rounded-lg hover:shadow-sm group">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-50 p-2 rounded text-blue-600">
                        <Box size={16} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-700 text-sm">{comp.name}</p>
                        <p className="text-xs text-slate-500">{formatCurrency(comp.cost)} / {comp.unit}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => addComponentToCalculation(comp)}
                        className="p-1.5 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100"
                        title="Pakai di Kalkulator"
                      >
                        <ArrowRight size={14} />
                      </button>
                      <button
                        onClick={() => onDeleteCostComponent(comp.id)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Calculator Form */}
        <div className="lg:col-span-8">
          <Card>
            {/* Action Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Calculator className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">Perakitan Harga Modal (HPP)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Rakit bahan baku + komponen = Harga Modal</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Side of Form: Inputs */}
              <div className="space-y-6">
                {/* Product Identity */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Tag size={14} /> Identitas Produk
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-slate-700">Nama Produk Jadi</label>
                      <input
                        type="text"
                        className="w-full mt-1 p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Misal: Ikan Gurame Fillet 500gr"
                        value={calcForm.productName}
                        onChange={e => setCalcForm({ ...calcForm, productName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-700">Satuan Jual</label>
                      <select
                        className="w-full mt-1 p-2.5 border border-slate-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                        value={calcForm.productUnit}
                        onChange={e => setCalcForm({ ...calcForm, productUnit: e.target.value })}
                      >
                        <option value="pack">pack</option>
                        <option value="kg">kg</option>
                        <option value="ekor">ekor</option>
                        <option value="porsi">porsi</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Main Material */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Package size={14} /> Bahan Baku Utama
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-slate-700">Nama Bahan Mentah</label>
                      <input
                        type="text"
                        className="w-full mt-1 p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Misal: Ikan Gurame Hidup (1kg)"
                        value={calcForm.baseMaterialName}
                        onChange={e => setCalcForm({ ...calcForm, baseMaterialName: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-slate-700">Harga Beli</label>
                        <input
                          type="number"
                          min="0"
                          className="w-full mt-1 p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={calcForm.baseMaterialCost || ''}
                          onChange={e => setCalcForm({ ...calcForm, baseMaterialCost: parseFloat(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className="text-sm text-slate-700">Susut (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          className="w-full mt-1 p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={calcForm.shrinkagePercent}
                          onChange={e => setCalcForm({ ...calcForm, shrinkagePercent: parseFloat(e.target.value) })}
                        />
                      </div>
                    </div>
                    {result.shrinkageCost > 0 && (
                      <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
                        *Biaya naik <span className="font-semibold">{formatCurrency(result.shrinkageCost)}</span> akibat penyusutan.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side of Form: Components & Summary */}
              <div className="flex flex-col h-full">
                {/* Added Components List */}
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm mb-6 flex-grow">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                    <Layers size={14} /> Komponen Tambahan
                  </h4>

                  {calcForm.addedComponents.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-lg">
                      <p className="text-xs">Klik tombol panah di menu kiri<br />untuk menambahkan Thinwall, Plastik, dll.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {calcForm.addedComponents.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100 text-sm">
                          <div>
                            <span className="font-medium text-slate-700">{item.name}</span>
                            <span className="text-xs text-slate-500 block">@ {formatCurrency(item.cost)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min="1"
                              className="w-14 p-1.5 text-center border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                              value={item.qty}
                              onChange={(e) => updateComponentQty(idx, parseFloat(e.target.value))}
                            />
                            <button
                              onClick={() => removeComponentFromCalculation(idx)}
                              className="text-slate-400 hover:text-rose-500"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="text-right pt-2 border-t border-slate-100">
                        <span className="text-xs text-slate-500">Total Komponen:</span>
                        <span className="text-sm font-semibold text-slate-700 ml-2">{formatCurrency(result.componentsTotalCost)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Final Calculation Summary */}
                <div className="bg-slate-900 text-white p-5 rounded-xl shadow-lg">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm text-slate-300">
                      <span>Total HPP (Modal Bersih)</span>
                      <span className="font-semibold text-white">{formatCurrency(result.totalHPP)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm text-emerald-400">
                      <span className="flex items-center gap-2">
                        Margin Profit
                        <input
                          type="number"
                          className="w-12 bg-slate-800 border border-slate-600 rounded text-center text-white"
                          value={calcForm.marginPercent}
                          onChange={(e) => setCalcForm({ ...calcForm, marginPercent: parseFloat(e.target.value) })}
                        /> %
                      </span>
                      <span>+ {formatCurrency(result.profit)}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-700">
                    <p className="text-center text-slate-400 text-xs uppercase tracking-widest mb-1">Rekomendasi Harga Jual</p>
                    <h1 className="text-center text-3xl font-semibold text-blue-400">{formatCurrency(result.roundedPrice)}</h1>
                  </div>

                  <button
                    onClick={handleSaveToCatalog}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    <Save size={18} /> Simpan ke Katalog Produk
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};