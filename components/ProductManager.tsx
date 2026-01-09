import React, { useState, useRef, useEffect } from 'react';
import { Product, TransactionType, ProductVariant } from '@/lib/types'; // Import TransactionType
import { Card } from './ui/Card';
import { Plus, Edit2, Trash2, Package, Search, Download, Upload, FileSpreadsheet, TrendingUp, ShoppingBasket, X, ImageIcon, Loader2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ProductManagerProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onAddTransaction: (t: any) => void; // Add this prop
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export const ProductManager: React.FC<ProductManagerProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddTransaction
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [promoFilter, setPromoFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // State for Restock Modal
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockData, setRestockData] = useState({
    qtyToAdd: 0,
    totalCost: 0
  });

  const [formData, setFormData] = useState<Product>({
    id: '',
    name: '',
    description: '',
    unit: 'kg',
    price: 0,
    costPrice: 0,
    stock: 0,
    image: '',
    category: '',
    isPromo: false,
    promoPrice: 0,
    promoDiscount: 0,
    variants: [],
  });



  // --- Handlers for Restocking ---
  const openRestockModal = (product: Product) => {
    setRestockProduct(product);
    setRestockData({ qtyToAdd: 0, totalCost: 0 });
  };

  const closeRestockModal = () => {
    setRestockProduct(null);
  };

  const handleRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct) return;

    // 1. Update Product Stock
    const newStock = (restockProduct.stock || 0) + restockData.qtyToAdd;

    // 2. Optional: Calculate new Weighted Average Cost if price changed, but simple for now
    const updatedProduct = {
      ...restockProduct,
      stock: newStock
    };
    onUpdateProduct(updatedProduct);

    // 3. Create Expense Transaction
    if (restockData.totalCost > 0) {
      onAddTransaction({
        date: new Date().toISOString(),
        type: TransactionType.EXPENSE,
        amount: restockData.totalCost,
        category: 'Belanja Pasar (HPP)',
        description: `Restock ${restockProduct.name} (${restockData.qtyToAdd} ${restockProduct.unit})`
      });
    }

    alert(`Berhasil restock ${restockProduct.name}! Stok bertambah dan biaya tercatat di pengeluaran.`);
    closeRestockModal();
  };


  // --- Handlers for CRUD ---

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      onUpdateProduct(formData);
      setIsEditing(false);
    } else {
      onAddProduct({
        ...formData,
        id: crypto.randomUUID()
      });
    }
    // Reset form
    setFormData({ id: '', name: '', description: '', unit: 'kg', price: 0, costPrice: 0, stock: 0, image: '', category: '', isPromo: false, promoPrice: 0, promoDiscount: 0, variants: [] });
  };

  const handleEdit = (product: Product) => {
    setFormData({
      ...product,
      description: product.description || '',
      costPrice: product.costPrice || 0,
      stock: product.stock || 0,
      image: product.image || '',
      category: product.category || '',
      isPromo: product.isPromo || false,
      promoPrice: product.promoPrice || 0,
      promoDiscount: product.promoDiscount || 0,
      variants: product.variants || [],
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({ id: '', name: '', description: '', unit: 'kg', price: 0, costPrice: 0, stock: 0, image: '', category: '', isPromo: false, promoPrice: 0, promoDiscount: 0, variants: [] });
  };

  // Variant management handlers
  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: `temp-${Date.now()}`,
      productId: formData.id || '',
      unit: '',
      unitQty: 1,
      price: 0,
      costPrice: 0,
      isDefault: (formData.variants?.length || 0) === 0
    };
    setFormData(prev => ({
      ...prev,
      variants: [...(prev.variants || []), newVariant]
    }));
  };

  const removeVariant = (index: number) => {
    setFormData(prev => ({
      ...prev,
      variants: (prev.variants || []).filter((_, i) => i !== index)
    }));
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    setFormData(prev => ({
      ...prev,
      variants: (prev.variants || []).map((v, i) =>
        i === index ? { ...v, [field]: value } : v
      )
    }));
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Gagal mengupload gambar');
        return;
      }

      const data = await response.json();
      setFormData(prev => ({ ...prev, image: data.url }));
    } catch (error) {
      console.error('Upload error:', error);
      alert('Gagal mengupload gambar');
    } finally {
      setIsUploading(false);
      // Reset file input to allow re-selecting same file
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
    }
  };

  // --- Handlers for Import/Export ---

  const handleExport = () => {
    // 1. Prepare data (Rename keys for better readability in Excel)
    const dataToExport = products.map(p => {
      const margin = p.price - (p.costPrice || 0);

      return {
        "Nama Produk": p.name,
        "Satuan": p.unit,
        "Stok Tersedia": p.stock || 0,
        "Harga Modal (HPP)": p.costPrice || 0,
        "Harga Jual": p.price,
        "Estimasi Laba": margin,
        "ID System (Jangan Ubah)": p.id
      };
    });

    // 2. Create Workbook and Worksheet
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Produk");

    // 3. Download File
    XLSX.writeFile(wb, `Pasarantar_Katalog_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const triggerImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        // Get first sheet
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];

        // Convert to JSON
        const data = XLSX.utils.sheet_to_json(ws);

        let addedCount = 0;
        let updatedCount = 0;

        data.forEach((row: any) => {
          // Map Excel columns back to Product Interface
          const name = row['Nama Produk'] || row['Name'] || row['Nama'];
          const unit = row['Satuan'] || row['Unit'];
          const stock = row['Stok Tersedia'] || row['Stok'] || row['Stock'] || row['Qty'];
          const price = row['Harga Jual'] || row['Harga'] || row['Price'] || row['Jual'];
          const costPrice = row['Harga Modal (HPP)'] || row['Harga Modal'] || row['Modal'] || row['HPP'];
          const id = row['ID System (Jangan Ubah)'] || row['ID'];

          if (name && price) {
            const cleanPrice = parseFloat(String(price).replace(/[^0-9.-]+/g, ""));
            const cleanCost = costPrice ? parseFloat(String(costPrice).replace(/[^0-9.-]+/g, "")) : 0;
            const cleanStock = stock ? parseFloat(String(stock).replace(/[^0-9.-]+/g, "")) : 0;

            if (id) {
              // Update existing
              onUpdateProduct({
                id,
                name,
                unit: unit || 'kg',
                price: cleanPrice,
                costPrice: cleanCost,
                stock: cleanStock
              });
              updatedCount++;
            } else {
              // Add new
              onAddProduct({
                id: crypto.randomUUID(),
                name,
                unit: unit || 'kg',
                price: cleanPrice,
                costPrice: cleanCost,
                stock: cleanStock
              });
              addedCount++;
            }
          }
        });

        alert(`Impor Selesai!\n${addedCount} Produk Baru\n${updatedCount} Produk Diupdate`);

        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';

      } catch (error) {
        console.error("Error parsing excel:", error);
        alert("Gagal membaca file Excel. Pastikan format benar.");
      }
    };
    reader.readAsBinaryString(file);
  };

  // Filter products by search, category, and promo
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    const matchesPromo = !promoFilter ||
      (promoFilter === 'promo' && p.isPromo) ||
      (promoFilter === 'regular' && !p.isPromo);
    return matchesSearch && matchesCategory && matchesPromo;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, promoFilter]);

  // Get unique categories from products
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
        {/* Product List */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <Card className="h-full">
            {/* Header & Tools */}
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-slate-800">Katalog Produk & Stok</h3>
                <div className="flex gap-2">
                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImport}
                    accept=".xlsx, .xls"
                    className="hidden"
                  />

                  <button
                    onClick={triggerImport}
                    className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 text-sm font-medium transition-colors border border-emerald-200"
                    title="Upload Excel"
                  >
                    <Upload size={16} /> <span className="hidden sm:inline">Import</span>
                  </button>
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-50 text-slate-700 rounded-lg hover:bg-slate-100 text-sm font-medium transition-colors border border-slate-200"
                    title="Download Excel"
                  >
                    <Download size={16} /> <span className="hidden sm:inline">Export</span>
                  </button>
                </div>
              </div>

              {/* Search Bar and Category Filter */}
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Cari produk..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
                >
                  <option value="">Semua Kategori</option>
                  <option value="ikan-laut">Ikan Laut</option>
                  <option value="seafood">Seafood</option>
                  <option value="ayam">Ayam & Telur</option>
                  <option value="daging-sapi">Daging Sapi</option>
                  <option value="bumbu">Bumbu</option>
                </select>
                <select
                  value={promoFilter}
                  onChange={(e) => setPromoFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 min-w-[120px]"
                >
                  <option value="">Semua Status</option>
                  <option value="promo">Promo</option>
                  <option value="regular">Regular</option>
                </select>
              </div>

              {/* Info: Showing X of Y products */}
              <div className="text-xs text-slate-500">
                Menampilkan {paginatedProducts.length} dari {filteredProducts.length} produk
                {categoryFilter && <span className="ml-1">dalam kategori <b>{categoryFilter}</b></span>}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-3">Nama Produk</th>
                    <th className="px-4 py-3 text-center">Stok</th>
                    <th className="px-4 py-3 text-right">Harga Modal</th>
                    <th className="px-4 py-3 text-right">Harga Jual</th>
                    <th className="px-4 py-3 text-center">Margin</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        {products.length === 0
                          ? (
                            <div className="flex flex-col items-center gap-2">
                              <FileSpreadsheet className="w-8 h-8 text-slate-300" />
                              <p>Belum ada produk.</p>
                              <p className="text-xs">Gunakan tombol <b>Import</b> untuk upload data massal dari Excel.</p>
                            </div>
                          )
                          : "Produk tidak ditemukan."}
                      </td>
                    </tr>
                  ) : (
                    paginatedProducts.map((p) => {
                      const margin = p.price - (p.costPrice || 0);
                      const isLowStock = (p.stock || 0) <= 5;

                      return (
                        <tr key={p.id} className="bg-white border-b hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-slate-900">{p.name}</div>
                              {p.isPromo && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-600 rounded">
                                  PROMO
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">per {p.unit}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${(p.stock || 0) <= 0
                              ? 'bg-rose-100 text-rose-700'
                              : isLowStock
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-slate-100 text-slate-700'
                              }`}>
                              {p.stock || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500">
                            {p.costPrice ? formatCurrency(p.costPrice) : '-'}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-900 font-medium">
                            {formatCurrency(p.price)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {margin > 0 ? (
                              <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">
                                +{formatCurrency(margin)}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">
                                -
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex justify-center gap-1">
                              <button
                                onClick={() => openRestockModal(p)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Belanja Stok (Restock)"
                              >
                                <ShoppingBasket size={16} />
                              </button>
                              <button
                                onClick={() => handleEdit(p)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => onDeleteProduct(p.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                                title="Hapus"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                  Sebelumnya
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      // Show first, last, current, and adjacent pages
                      return page === 1 || page === totalPages ||
                        Math.abs(page - currentPage) <= 1;
                    })
                    .map((page, idx, arr) => (
                      <React.Fragment key={page}>
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <span className="text-slate-400">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}
                </div>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Berikutnya
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </Card>
        </div>

        {/* Form */}
        <div className="lg:col-span-1 order-1 lg:order-2">
          <div className="sticky top-6">
            <Card title={isEditing ? "Edit Produk" : "Tambah Produk Baru"}>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Nama Produk</label>
                  <input
                    required
                    type="text"
                    placeholder="Contoh: Ikan Gurame Hidup"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                {/* Deskripsi Singkat */}
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Deskripsi Singkat</label>
                  <textarea
                    placeholder="Deskripsi produk untuk ditampilkan di toko..."
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                  />
                </div>

                {/* Gambar Produk */}
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Gambar Produk</label>
                  <input
                    type="file"
                    ref={imageInputRef}
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-lg cursor-pointer transition-colors ${formData.image
                      ? 'border-green-300 bg-green-50'
                      : 'border-slate-300 hover:border-blue-400 bg-slate-50'
                      } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    {formData.image ? (
                      <div className="p-2">
                        <img
                          src={formData.image}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <p className="text-xs text-green-600 mt-1 text-center">Klik untuk ganti gambar</p>
                      </div>
                    ) : (
                      <div className="p-4 text-center">
                        {isUploading ? (
                          <Loader2 className="w-8 h-8 mx-auto text-blue-500 animate-spin" />
                        ) : (
                          <ImageIcon className="w-8 h-8 mx-auto text-slate-400" />
                        )}
                        <p className="text-sm text-slate-500 mt-2">
                          {isUploading ? 'Mengupload...' : 'Klik untuk upload gambar'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">PNG, JPG, WebP (maks. 5MB)</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Kategori */}
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Kategori</label>
                  <select
                    value={formData.category || ''}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">Pilih Kategori</option>
                    <option value="ikan-laut">Ikan Laut</option>
                    <option value="seafood">Seafood</option>
                    <option value="ayam">Ayam & Telur</option>
                    <option value="daging-sapi">Daging Sapi</option>
                    <option value="bumbu">Bumbu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-1">Satuan</label>
                  <select
                    value={formData.unit}
                    onChange={e => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="kg">kg</option>
                    <option value="pack">pack</option>
                    <option value="ekor">ekor</option>
                    <option value="gr">gram</option>
                    <option value="ikat">ikat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-1">Stok Saat Ini</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="0"
                      value={formData.stock || ''}
                      onChange={e => setFormData({ ...formData, stock: parseFloat(e.target.value) })}
                      className="flex-1 p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <span className="text-sm text-slate-500">{formData.unit}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-700 mb-1">Harga Modal</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={formData.costPrice || ''}
                      onChange={e => setFormData({ ...formData, costPrice: parseFloat(e.target.value) })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">HPP per unit</p>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-700 mb-1">Harga Jual</label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={formData.price || ''}
                      onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Harga customer</p>
                  </div>
                </div>

                {/* Promo Settings */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={formData.isPromo || false}
                      onChange={e => setFormData({ ...formData, isPromo: e.target.checked })}
                      className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Aktifkan Promo</span>
                  </label>

                  {formData.isPromo && (
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Harga Promo</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={formData.promoPrice || ''}
                          onChange={e => setFormData({ ...formData, promoPrice: parseFloat(e.target.value) })}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-1">Diskon (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="0"
                          value={formData.promoDiscount || ''}
                          onChange={e => setFormData({ ...formData, promoDiscount: parseInt(e.target.value) })}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Variant Editor */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-700">Opsi Satuan</span>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="text-xs px-2.5 py-1.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 flex items-center gap-1 transition-colors"
                    >
                      <Plus size={12} /> Tambah Varian
                    </button>
                  </div>

                  {(formData.variants?.length || 0) === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-3">
                      Belum ada varian. Tambahkan opsi satuan seperti 1kg, 500gr, ekor.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {formData.variants?.map((variant, index) => (
                        <div key={variant.id || index} className="bg-white p-3 rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-slate-500">Varian {index + 1}</span>
                              {index === 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded font-medium">
                                  Default
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeVariant(index)}
                              className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            <div>
                              <label className="block text-[10px] text-slate-500 mb-1">Satuan</label>
                              <input
                                type="text"
                                placeholder="1kg"
                                value={variant.unit}
                                onChange={e => updateVariant(index, 'unit', e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-500 mb-1">Qty Base</label>
                              <input
                                type="number"
                                step="0.1"
                                placeholder="1"
                                value={variant.unitQty || ''}
                                onChange={e => updateVariant(index, 'unitQty', parseFloat(e.target.value))}
                                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-500 mb-1">Harga Modal</label>
                              <input
                                type="number"
                                placeholder="0"
                                value={variant.costPrice || ''}
                                onChange={e => updateVariant(index, 'costPrice', parseFloat(e.target.value))}
                                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-500 mb-1">Harga Jual</label>
                              <input
                                type="number"
                                placeholder="0"
                                value={variant.price || ''}
                                onChange={e => updateVariant(index, 'price', parseFloat(e.target.value))}
                                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Profit Preview */}
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between">
                  <span className="text-xs text-blue-700 font-medium flex items-center gap-1">
                    <TrendingUp size={14} /> Margin Laba
                  </span>
                  <span className="text-sm font-bold text-blue-700">
                    {formatCurrency((formData.price || 0) - (formData.costPrice || 0))}
                  </span>
                </div>

                <div className="pt-4 flex gap-3">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 py-2.5 px-5 text-sm font-medium text-slate-700 bg-white rounded-lg border border-slate-300 hover:bg-slate-50"
                    >
                      Batal
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Package size={18} />
                    {isEditing ? 'Update Produk' : 'Simpan Produk'}
                  </button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>

      {/* Smart Restock Modal */}
      {restockProduct && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fade-in overflow-hidden">
            <div className="bg-blue-600 px-6 py-4 flex justify-between items-center text-white">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <ShoppingBasket size={20} /> Belanja Stok Baru
              </h3>
              <button onClick={closeRestockModal} className="text-blue-100 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="p-6 space-y-5">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800">
                Anda sedang menambahkan stok untuk <strong>{restockProduct.name}</strong>.
                <br />
                <span className="text-xs text-blue-600 mt-1 block">Sistem akan otomatis mengupdate stok dan mencatat pengeluaran.</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-1">
                    Jumlah Beli ({restockProduct.unit})
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    required
                    autoFocus
                    value={restockData.qtyToAdd || ''}
                    onChange={(e) => setRestockData({ ...restockData, qtyToAdd: parseFloat(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-1">
                    Total Uang Keluar (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Total belanja"
                    value={restockData.totalCost || ''}
                    onChange={(e) => setRestockData({ ...restockData, totalCost: parseFloat(e.target.value) })}
                    className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeRestockModal}
                  className="flex-1 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg shadow-lg shadow-blue-200"
                >
                  Konfirmasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </>
  );
};