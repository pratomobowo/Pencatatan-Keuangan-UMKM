import React, { useState } from 'react';
import { Customer, Order } from '@/lib/types';
import { Card } from './ui/Card';
import { Plus, Edit2, Trash2, Users, Search, MapPin, Phone, User, ShoppingBag, ChevronDown, ChevronUp, ShoppingCart } from 'lucide-react';

interface CustomerManagerProps {
  customers: Customer[];
  orders?: Order[]; // Optional for backward compatibility, but we will pass it
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onQuickOrder?: (customerId: string) => void; // Added Prop
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export const CustomerManager: React.FC<CustomerManagerProps> = ({
  customers,
  orders = [],
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onQuickOrder
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Customer>({
    id: '',
    name: '',
    phone: '',
    address: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      onUpdateCustomer(formData);
      setIsEditing(false);
    } else {
      onAddCustomer({
        ...formData,
        id: crypto.randomUUID(),
        totalSpent: 0
      });
    }
    setFormData({ id: '', name: '', phone: '', address: '', notes: '' });
  };

  const handleEdit = (customer: Customer) => {
    setFormData(customer);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({ id: '', name: '', phone: '', address: '', notes: '' });
  };

  const toggleHistory = (customerId: string) => {
    if (expandedCustomerId === customerId) {
      setExpandedCustomerId(null);
    } else {
      setExpandedCustomerId(customerId);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Customer List */}
      <div className="lg:col-span-2 order-2 lg:order-1">
        <Card className="h-full">
          <div className="flex flex-col gap-4 mb-6">
            <h3 className="text-lg font-medium text-slate-800">Data Pelanggan</h3>
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari nama atau no hp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Belum ada data pelanggan.</p>
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const customerOrders = orders.filter(o => o.customerId === c.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                const isExpanded = expandedCustomerId === c.id;

                return (
                  <div key={c.id} className="bg-white border border-slate-200 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="p-4 flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">{c.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                            <Phone size={14} /> {c.phone || '-'}
                          </div>
                          <div className="flex items-start gap-2 text-sm text-slate-500 mt-1">
                            <MapPin size={14} className="mt-0.5 shrink-0" /> <span className="line-clamp-2">{c.address || '-'}</span>
                          </div>
                          <div className="mt-3 flex items-center gap-4">
                            <button
                              onClick={() => toggleHistory(c.id)}
                              className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              {isExpanded ? 'Tutup Riwayat' : 'Lihat Riwayat'}
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>

                            {/* Quick Order Button Integration */}
                            {onQuickOrder && (
                              <button
                                onClick={() => onQuickOrder(c.id)}
                                className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded hover:bg-emerald-100 flex items-center gap-1 transition-colors"
                              >
                                <ShoppingCart size={12} /> Buat Order
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row sm:flex-col items-end justify-between sm:justify-center gap-2 pl-12 sm:pl-0">
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Total Belanja</p>
                          <p className="font-semibold text-emerald-600">{formatCurrency(c.totalSpent || 0)}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(c)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => onDeleteCustomer(c.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Order History Expansion */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50 p-4 rounded-b-lg animate-fade-in">
                        <h5 className="text-xs font-medium text-slate-500 uppercase mb-3 flex items-center gap-2">
                          <ShoppingBag size={14} /> 5 Transaksi Terakhir
                        </h5>
                        {customerOrders.length === 0 ? (
                          <p className="text-sm text-slate-400 italic">Belum ada riwayat transaksi.</p>
                        ) : (
                          <div className="space-y-2">
                            {customerOrders.slice(0, 5).map(order => (
                              <div key={order.id} className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 text-sm">
                                <div>
                                  <span className="font-medium text-slate-700">{new Date(order.date).toLocaleDateString('id-ID')}</span>
                                  <span className="mx-2 text-slate-300">|</span>
                                  <span className="text-slate-600">{order.items.length} Item ({order.items.map(i => i.productName).join(', ')})</span>
                                </div>
                                <div className="font-semibold text-slate-800">
                                  {formatCurrency(order.grandTotal)}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      {/* Form */}
      <div className="lg:col-span-1 order-1 lg:order-2">
        <div className="sticky top-6">
          <Card title={isEditing ? "Edit Pelanggan" : "Tambah Pelanggan"}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-700 mb-1">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                  <input
                    required
                    type="text"
                    placeholder="Contoh: Bu Siti"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-1">Nomor WhatsApp/HP</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="0812..."
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-1">Alamat Lengkap</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-slate-400 w-4 h-4" />
                  <textarea
                    rows={3}
                    placeholder="Jalan, No Rumah, Patokan..."
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-1">Catatan (Preferensi)</label>
                <input
                  type="text"
                  placeholder="Misal: Suka ikan dipotong kecil"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
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
                  <Users size={18} />
                  {isEditing ? 'Update' : 'Simpan'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};