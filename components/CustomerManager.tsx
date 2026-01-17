import React, { useState } from 'react';
import { Customer } from '@/lib/types';
import { Card } from './ui/Card';
import { Plus, Edit2, Trash2, Users, Search, X, ShoppingCart, Phone, MapPin, Mail, Eye, Loader2, Clock, Star, CreditCard } from 'lucide-react';

interface CustomerManagerProps {
  customers: Customer[]; // All customers (POS + Online)
  onAddCustomer?: (customer: Customer) => void;
  onUpdateCustomer?: (id: string, customer: Customer) => void;
  onDeleteCustomer?: (id: string) => void;
  onQuickOrder?: (customerId: string) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export const CustomerManager: React.FC<CustomerManagerProps> = ({
  customers = [],
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onQuickOrder,
}) => {
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<Customer>({
    id: '',
    name: '',
    phone: '',
    address: '',
    email: '',
    notes: '',
    totalSpent: 0,
    orderCount: 0,
  });

  // Detail modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const handleOpenModal = (customer?: Customer) => {
    if (customer) {
      setFormData(customer);
      setIsEditing(true);
    } else {
      setFormData({
        id: '',
        name: '',
        phone: '',
        address: '',
        email: '',
        notes: '',
        totalSpent: 0,
        orderCount: 0,
      });
      setIsEditing(false);
    }
    setShowFormModal(true);
  };

  const handleCloseModal = () => {
    setShowFormModal(false);
    setIsEditing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && onUpdateCustomer && formData.id) {
      onUpdateCustomer(formData.id, formData);
    } else if (onAddCustomer) {
      onAddCustomer({
        ...formData,
        id: crypto.randomUUID(),
        totalSpent: 0,
        orderCount: 0,
      });
    }
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus pelanggan ini?')) {
      if (onDeleteCustomer) onDeleteCustomer(id);
    }
  };

  const handleViewDetail = async (customerId: string) => {
    setShowDetailModal(true);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/shop-customers/${customerId}`);
      if (res.ok) {
        const data = await res.json();
        setDetailCustomer(data);
      }
    } catch (error) {
      console.error('Error fetching customer detail:', error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm)) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Customer Table Card */}
      <Card>
        {/* Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Data Pelanggan</h3>
            <p className="text-xs text-slate-500 mt-0.5">Kelola data pelanggan POS dan Online.</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            Tambah Pelanggan
          </button>
        </div>

        {/* Filter/Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama, telepon, atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Info Text */}
        <div className="text-xs text-slate-500 mb-4">
          Menampilkan {filteredCustomers.length} dari {customers.length} pelanggan
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Nama</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Kontak</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Alamat</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Total Belanja</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">Order</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500">Belum ada pelanggan</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{customer.name}</p>
                          {customer.email && (
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Mail size={12} /> {customer.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-700 flex items-center gap-1">
                        <Phone size={14} /> {customer.phone || '-'}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-600 flex items-start gap-1 max-w-xs">
                        <MapPin size={14} className="mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{customer.address || '-'}</span>
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-semibold text-slate-900">{formatCurrency(customer.totalSpent || 0)}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-semibold text-sm">
                        {customer.orderCount || 0}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1">
                        {onQuickOrder && (
                          <button
                            onClick={() => onQuickOrder(customer.id)}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                            title="Quick Order"
                          >
                            <ShoppingCart size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => handleViewDetail(customer.id)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Lihat Detail"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleOpenModal(customer)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
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
      </Card>

      {/* Modal Form */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-white">
              <h2 className="text-lg font-semibold text-slate-800">
                {isEditing ? 'Edit Pelanggan' : 'Tambah Pelanggan'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nama <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nama pelanggan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Telepon
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="08xxxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Alamat
                </label>
                <textarea
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Alamat lengkap"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Catatan
                </label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  placeholder="Catatan tambahan"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isEditing ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-white">
              <h2 className="text-lg font-semibold text-slate-800">Detail Pelanggan</h2>
              <button onClick={() => { setShowDetailModal(false); setDetailCustomer(null); }} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"><X size={24} /></button>
            </div>
            {loadingDetail ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
            ) : detailCustomer ? (
              <div className="p-6 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl">{detailCustomer.name?.charAt(0).toUpperCase()}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900">{detailCustomer.name}</h3>
                    <div className="mt-2 space-y-1">
                      {detailCustomer.email && <p className="text-sm text-slate-600 flex items-center gap-2"><Mail size={14} /> {detailCustomer.email}</p>}
                      {detailCustomer.phone && <p className="text-sm text-slate-600 flex items-center gap-2"><Phone size={14} /> {detailCustomer.phone}</p>}
                    </div>
                  </div>
                  <div className="text-right"><p className="text-xs text-slate-500">Terdaftar</p><p className="text-sm font-medium text-slate-700">{new Date(detailCustomer.createdAt).toLocaleDateString('id-ID')}</p></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4 text-center"><CreditCard className="w-6 h-6 text-slate-400 mx-auto mb-2" /><p className="text-lg font-bold text-slate-900">{formatCurrency(Number(detailCustomer.totalSpent) || 0)}</p><p className="text-xs text-slate-500">Total Belanja</p></div>
                  <div className="bg-slate-50 rounded-lg p-4 text-center"><ShoppingCart className="w-6 h-6 text-slate-400 mx-auto mb-2" /><p className="text-lg font-bold text-slate-900">{detailCustomer._count?.orders || 0}</p><p className="text-xs text-slate-500">Total Order</p></div>
                  <div className="bg-slate-50 rounded-lg p-4 text-center"><Star className="w-6 h-6 text-amber-400 mx-auto mb-2" /><p className="text-lg font-bold text-slate-900">{detailCustomer.points || 0}</p><p className="text-xs text-slate-500">Loyalty Points</p></div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2"><MapPin size={16} /> Alamat Tersimpan ({detailCustomer.addresses?.length || 0})</h4>
                  {detailCustomer.addresses?.length > 0 ? (
                    <div className="space-y-3">{detailCustomer.addresses.map((addr: any) => (<div key={addr.id} className="bg-slate-50 rounded-lg p-3 border border-slate-100"><p className="font-semibold text-slate-800 text-sm flex items-center gap-2">{addr.label || 'Alamat'}{addr.isDefault && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Default</span>}</p><p className="text-sm text-slate-600 mt-1">{addr.recipientName} • {addr.phone}</p><p className="text-sm text-slate-500 mt-1">{addr.fullAddress}</p></div>))}</div>
                  ) : <p className="text-sm text-slate-500 italic">Belum ada alamat tersimpan</p>}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2"><Clock size={16} /> Order Terakhir</h4>
                  {detailCustomer.orders?.length > 0 ? (
                    <div className="space-y-2">{detailCustomer.orders.map((order: any) => (<div key={order.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"><div><p className="text-sm font-medium text-slate-800">#{order.orderNumber}</p><p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString('id-ID')}</p></div><div className="text-right"><p className="text-sm font-semibold text-slate-900">{formatCurrency(Number(order.grandTotal))}</p><span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{order.status}</span></div></div>))}</div>
                  ) : <p className="text-sm text-slate-500 italic">Belum ada order</p>}
                </div>
              </div>
            ) : <div className="py-12 text-center text-slate-500">Gagal memuat data</div>}
          </div>
        </div>
      )}
    </div>
  );
};