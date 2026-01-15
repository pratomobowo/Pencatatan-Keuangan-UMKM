import React, { useState, useEffect } from 'react';
import { X, Sparkles, Loader2, Check, AlertCircle, Edit2, Trash2, ArrowRight } from 'lucide-react';
import { Card } from '../ui/Card';

const PRODUCT_UNITS = [
    'kg',
    'gr',
    'ikat',
    'pack',
    'pcs', // pieces
    'ekor',
    'porsi',
    'bungkus',
    'box', // box/kardus
    'tray', // tray/piring
    'liter',
    'butir',
    'sisir', // pisang
    'ruas', // jahe/lengkuas
    'batang', // sereh
];

interface AIProduct {
    name: string;
    qty: number;
    unit: string;
    price: number;
    category: string;
    categoryId?: string; // Links to real DB category
    description?: string;
}

interface Category {
    id: string;
    name: string;
    slug: string;
}

interface AIProductImporterProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const AIProductImporter: React.FC<AIProductImporterProps> = ({ onClose, onSuccess }) => {
    const [rawText, setRawText] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [parsedProducts, setParsedProducts] = useState<AIProduct[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [step, setStep] = useState<'input' | 'review'>('input');
    const [error, setError] = useState<string | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/admin/categories');
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data);
                }
            } catch (err) {
                console.error('Failed to fetch categories:', err);
            }
        };
        fetchCategories();
    }, []);

    const findBestCategory = (aiCategory: string) => {
        if (!aiCategory || categories.length === 0) return '';

        const lowerAI = aiCategory.toLowerCase();
        // Exact slug match
        const slugMatch = categories.find(c => c.slug === lowerAI);
        if (slugMatch) return slugMatch.id;

        // Name partial match
        const nameMatch = categories.find(c => c.name.toLowerCase().includes(lowerAI) || lowerAI.includes(c.name.toLowerCase()));
        if (nameMatch) return nameMatch.id;

        // Default to first if really needed, or empty
        return '';
    };

    const handleParse = async () => {
        if (!rawText.trim()) return;

        setIsParsing(true);
        setError(null);
        try {
            const response = await fetch('/api/ai/parse-products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: rawText }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Gagal memproses AI');
            }

            const data = await response.json();

            // Map AI Products to include categoryId match
            const mappedProducts = (data.products as AIProduct[]).map(p => ({
                ...p,
                categoryId: findBestCategory(p.category) || (categories.length > 0 ? categories[0].id : '')
            }));

            setParsedProducts(mappedProducts);
            setStep('review');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsParsing(false);
        }
    };

    const handleUpdateProduct = (index: number, field: keyof AIProduct, value: any) => {
        const newProducts = [...parsedProducts];
        newProducts[index] = { ...newProducts[index], [field]: value };
        setParsedProducts(newProducts);
    };

    const handleRemoveProduct = (index: number) => {
        setParsedProducts(parsedProducts.filter((_, i) => i !== index));
    };

    const handleNormalize = (index: number) => {
        const product = parsedProducts[index];
        if (product.qty <= 0) return;

        // Calculate price per 1 unit
        const pricePerUnit = Math.round(product.price / product.qty);

        const newProducts = [...parsedProducts];
        newProducts[index] = {
            ...newProducts[index],
            qty: 1,
            price: pricePerUnit
        };
        setParsedProducts(newProducts);
    };

    const handleSaveAll = async () => {
        setIsSaving(true);
        setError(null);
        try {
            const response = await fetch('/api/admin/products/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ products: parsedProducts }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Gagal menyimpan produk');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const isProductValid = (p: AIProduct) => {
        return p.name.trim().length > 0 && p.qty > 0 && p.price >= 0;
    };

    const hasInvalidProducts = parsedProducts.some(p => !isProductValid(p));

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">AI Product Importer</h2>
                            <p className="text-sm text-slate-500">Tambah banyak produk sekaligus bantuan Minsar AI</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 text-sm">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}

                    {step === 'input' ? (
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-700">
                                <p className="font-semibold mb-1">Tips Format:</p>
                                <p>Tempel daftar produk Anda di bawah. Contoh:</p>
                                <code className="block mt-2 bg-white/50 p-2 rounded border border-blue-200 text-xs">
                                    Cabe keriting merah 1/4 20.000<br />
                                    Bawang merah 1/4 15.000<br />
                                    Jagung manis 1kg 15.000
                                </code>
                            </div>
                            <textarea
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                                placeholder="Pahing, tempel list produknya di sini ya..."
                                className="w-full h-80 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-orange-500 focus:border-orange-500 text-sm resize-none"
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-sm text-green-700 flex justify-between items-center">
                                <p>Minsar berhasil menemukan <b>{parsedProducts.length}</b> produk. Silakan cek kembali datanya sebelum disimpan.</p>
                                <button
                                    onClick={() => setStep('input')}
                                    className="text-[10px] uppercase font-bold tracking-wider underline hover:text-green-800"
                                >
                                    Ulangi Input
                                </button>
                            </div>

                            <div className="border rounded-xl overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold text-slate-700">Nama Produk</th>
                                            <th className="px-4 py-3 font-semibold text-slate-700 w-32">Qty & Unit</th>
                                            <th className="px-4 py-3 font-semibold text-slate-700">Harga</th>
                                            <th className="px-4 py-3 font-semibold text-slate-700">Kategori</th>
                                            <th className="px-4 py-3 font-semibold text-slate-700 text-center">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {parsedProducts.map((p, idx) => {
                                            const isNameInvalid = !p.name.trim();
                                            const isQtyInvalid = p.qty <= 0;
                                            const isPriceInvalid = p.price < 0;
                                            // Check if unit is NOT in the allowed list
                                            const isUnitInvalid = !PRODUCT_UNITS.includes(p.unit);

                                            return (
                                                <tr key={idx} className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="text"
                                                            value={p.name}
                                                            placeholder="Nama Produk (Wajib)"
                                                            onChange={(e) => handleUpdateProduct(idx, 'name', e.target.value)}
                                                            className={`w-full bg-transparent border-none p-1 focus:ring-1 rounded ${isNameInvalid ? 'ring-1 ring-rose-500 bg-rose-50 placeholder:text-rose-400' : 'focus:ring-orange-500'}`}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex gap-1">
                                                                <input
                                                                    type="number"
                                                                    step="0.001"
                                                                    value={p.qty}
                                                                    placeholder="Qty"
                                                                    onChange={(e) => handleUpdateProduct(idx, 'qty', Number(e.target.value))}
                                                                    className={`w-16 bg-transparent border-none p-1 focus:ring-1 rounded text-right ${isQtyInvalid ? 'ring-1 ring-rose-500 bg-rose-50' : 'focus:ring-orange-500'}`}
                                                                />
                                                                <select
                                                                    value={p.unit}
                                                                    onChange={(e) => handleUpdateProduct(idx, 'unit', e.target.value)}
                                                                    className={`w-20 bg-transparent border-none p-1 focus:ring-1 rounded text-xs ${isUnitInvalid ? 'ring-1 ring-rose-500 bg-rose-50 text-rose-600 font-bold' : 'focus:ring-orange-500'}`}
                                                                    title={isUnitInvalid ? "Unit tidak dikenal. Mohon perbaiki." : ""}
                                                                >
                                                                    {PRODUCT_UNITS.map(u => (
                                                                        <option key={u} value={u}>{u}</option>
                                                                    ))}
                                                                    {/* Show invalid unit as an option so it's visible */}
                                                                    {isUnitInvalid && (
                                                                        <option value={p.unit} className="text-rose-500 bg-rose-50">
                                                                            ? {p.unit}
                                                                        </option>
                                                                    )}
                                                                </select>
                                                            </div>

                                                            {/* Convert Button (Show if qty != 1) */}
                                                            {p.qty !== 1 && p.qty > 0 && (
                                                                <button
                                                                    onClick={() => handleNormalize(idx)}
                                                                    className="flex items-center gap-1 text-[10px] text-blue-600 font-medium hover:underline bg-blue-50 px-1.5 py-0.5 rounded self-start"
                                                                    title={`Ubah jadi 1 ${p.unit} (Harga: Rp ${(p.price / p.qty).toLocaleString('id-ID')})`}
                                                                >
                                                                    <ArrowRight size={10} />
                                                                    Jadi 1 {p.unit}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <input
                                                            type="number"
                                                            value={p.price}
                                                            onChange={(e) => handleUpdateProduct(idx, 'price', Number(e.target.value))}
                                                            className={`w-24 bg-transparent border-none p-1 focus:ring-1 rounded ${isPriceInvalid ? 'ring-1 ring-rose-500 bg-rose-50' : 'focus:ring-orange-500'}`}
                                                        />
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <td className="px-4 py-2">
                                                            <select
                                                                value={p.categoryId || ''}
                                                                onChange={(e) => {
                                                                    const catId = e.target.value;
                                                                    const catName = categories.find(c => c.id === catId)?.name || '';
                                                                    // Update both ID and Name for display/logic
                                                                    const newProducts = [...parsedProducts];
                                                                    newProducts[idx] = {
                                                                        ...newProducts[idx],
                                                                        categoryId: catId,
                                                                        category: catName
                                                                    };
                                                                    setParsedProducts(newProducts);
                                                                }}
                                                                className="w-full bg-transparent border-none p-1 focus:ring-1 focus:ring-orange-500 rounded text-xs"
                                                            >
                                                                <option value="">Pilih Kategori</option>
                                                                {categories.map((c) => (
                                                                    <option key={c.id} value={c.id}>
                                                                        {c.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-2 text-center">
                                                            <button
                                                                onClick={() => handleRemoveProduct(idx)}
                                                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t bg-slate-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        disabled={isParsing || isSaving}
                        className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 disabled:opacity-50"
                    >
                        Batal
                    </button>
                    {step === 'input' ? (
                        <button
                            onClick={handleParse}
                            disabled={isParsing || !rawText.trim()}
                            className="flex items-center gap-2 px-8 py-2.5 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-200 disabled:opacity-50 disabled:grayscale"
                        >
                            {isParsing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                            {isParsing ? 'Sedang Memproses...' : 'Proses dengan AI'}
                        </button>
                    ) : (
                        <button
                            onClick={handleSaveAll}
                            disabled={isSaving || parsedProducts.length === 0 || hasInvalidProducts}
                            className="flex items-center gap-2 px-8 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 disabled:opacity-50 disabled:grayscale"
                        >
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                            {isSaving ? 'Menyimpan...' : `Simpan ${parsedProducts.length} Produk`}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
