import React, { useState } from 'react';
import { Transaction, TransactionType, CATEGORIES } from '@/lib/types';
import { Card } from './ui/Card';
import { Plus, Trash2, Filter, Search } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'LIST' | 'FORM'>('LIST');
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
    // Reset basic fields but keep date
    setFormData(prev => ({ ...prev, amount: '', description: '' }));
    setActiveTab('LIST');
  };

  const handleTypeChange = (type: TransactionType) => {
    setFormData(prev => ({
      ...prev,
      type,
      category: CATEGORIES[type][0]
    }));
  };

  const filteredTransactions = transactions
    .filter(t => filterType === 'ALL' || t.type === filterType)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Transaction List */}
      <div className="lg:col-span-2 order-2 lg:order-1">
        <Card className="h-full min-h-[500px]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-lg font-medium text-slate-800">Riwayat Transaksi</h3>
            <div className="flex gap-2">
              <select
                className="bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="ALL">Semua Jenis</option>
                <option value={TransactionType.INCOME}>Pemasukan</option>
                <option value={TransactionType.EXPENSE}>Pengeluaran</option>
                <option value={TransactionType.CAPITAL}>Modal</option>
              </select>
              <button
                onClick={() => setActiveTab('FORM')}
                className="hidden lg:none sm:flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Plus size={16} /> Tambah
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Tanggal</th>
                  <th scope="col" className="px-4 py-3 font-medium">Kategori</th>
                  <th scope="col" className="px-4 py-3 font-medium">Keterangan</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Jumlah</th>
                  <th scope="col" className="px-4 py-3 text-center font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      Tidak ada transaksi yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t) => (
                    <tr key={t.id} className="bg-white border-b hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">
                        {new Date(t.date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                          ${t.type === TransactionType.INCOME ? 'bg-emerald-100 text-emerald-800' :
                            t.type === TransactionType.EXPENSE ? 'bg-rose-100 text-rose-800' : 'bg-blue-100 text-blue-800'}`}>
                          {t.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate" title={t.description}>
                        {t.description || '-'}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium 
                        ${t.type === TransactionType.INCOME ? 'text-emerald-600' :
                          t.type === TransactionType.EXPENSE ? 'text-rose-600' : 'text-blue-600'}`}>
                        {t.type === TransactionType.EXPENSE ? '-' : '+'}{formatCurrency(t.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => onDeleteTransaction(t.id)}
                          className="text-slate-400 hover:text-rose-600 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Add Transaction Form (Mobile: Conditional, Desktop: Sticky) */}
      <div className={`lg:col-span-1 order-1 lg:order-2 ${activeTab === 'LIST' ? 'hidden lg:block' : 'block'}`}>
        <div className="sticky top-6">
          <Card title="Catat Transaksi Baru">
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
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-1">Kategori</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900"
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
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-1">Keterangan (Opsional)</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm text-slate-900"
                  placeholder="Contoh: Pembayaran invoice #123"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('LIST')}
                  className="lg:hidden flex-1 py-2.5 px-5 text-sm font-medium text-slate-700 bg-white rounded-lg border border-slate-300 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300"
                >
                  Simpan Transaksi
                </button>
              </div>

            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};