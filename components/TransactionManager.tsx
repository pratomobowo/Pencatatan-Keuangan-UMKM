import React, { useState } from 'react';
import { Transaction, TransactionType, CATEGORIES } from '@/lib/types';
import { Card } from './ui/Card';
import { Plus, Trash2, Search, X } from 'lucide-react';

interface TransactionManagerProps {
  transactions: Transaction[];
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export const TransactionManager: React.FC<TransactionManagerProps> = ({
  transactions,
  onAddTransaction,
  onDeleteTransaction
}) => {
  const [showFormModal, setShowFormModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: TransactionType.INCOME,
    amount: '',
    category: CATEGORIES[TransactionType.INCOME][0],
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTransaction({
      date: new Date(formData.date).toISOString(),
      type: formData.type,
      amount: parseFloat(formData.amount),
      category: formData.category,
      description: formData.description
    });
    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: TransactionType.INCOME,
      amount: '',
      category: CATEGORIES[TransactionType.INCOME][0],
      description: ''
    });
    setShowFormModal(false);
  };

  const handleTypeChange = (type: TransactionType) => {
    setFormData(prev => ({
      ...prev,
      type,
      category: CATEGORIES[type][0]
    }));
  };

  const handleCancel = () => {
    setShowFormModal(false);
    // Reset form
    setFormData({
      date: new Date().toISOString().split('T')[0],
      type: TransactionType.INCOME,
      amount: '',
      category: CATEGORIES[TransactionType.INCOME][0],
      description: ''
    });
  };

  const filteredTransactions = transactions
    .filter(t => filterType === 'ALL' || t.type === filterType)
    .filter(t =>
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 max-w-md w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Cari keterangan atau kategori..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <select
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm flex-1 sm:flex-none"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">Semua Jenis</option>
            <option value={TransactionType.INCOME}>Pemasukan</option>
            <option value={TransactionType.EXPENSE}>Pengeluaran</option>
            <option value={TransactionType.CAPITAL}>Modal</option>
          </select>
          <button
            onClick={() => setShowFormModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            <Plus size={20} />
            Tambah Transaksi
          </button>
        </div>
      </div>

      {/* Transaction Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Tanggal</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Kategori</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Keterangan</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Jumlah</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    Tidak ada transaksi yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                      {new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium 
                        ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-800' :
                          t.type === TransactionType.EXPENSE ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'}`}>
                        {t.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={t.description}>
                      {t.description || '-'}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold 
                      ${t.type === TransactionType.INCOME ? 'text-emerald-600' :
                        t.type === TransactionType.EXPENSE ? 'text-rose-600' : 'text-blue-600'}`}>
                      {t.type === TransactionType.EXPENSE ? '-' : '+'}{formatCurrency(t.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => onDeleteTransaction(t.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Item Count */}
        {filteredTransactions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200 text-sm text-slate-500">
            Menampilkan {filteredTransactions.length} dari {transactions.length} transaksi
          </div>
        )}
      </Card>

      {/* Add Transaction Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-white">
              <h2 className="text-xl font-bold text-slate-800">
                Tambah Transaksi
              </h2>
              <button
                onClick={handleCancel}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-1">Jenis Transaksi</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[TransactionType.INCOME, TransactionType.EXPENSE, TransactionType.CAPITAL].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleTypeChange(type)}
                        className={`py-2 px-1 text-xs font-medium rounded-lg border text-center transition-all
                          ${formData.type === type
                            ? 'bg-slate-800 text-white border-slate-800'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                      >
                        {type === TransactionType.INCOME ? 'Pemasukan' : type === TransactionType.EXPENSE ? 'Pengeluaran' : 'Modal'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    {CATEGORIES[formData.type].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-1">Jumlah (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-700 mb-1">Keterangan (Opsional)</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                    placeholder="Contoh: Pembayaran invoice #123"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};