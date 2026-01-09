import React, { useState } from 'react';
import { Customer } from '@/lib/types';
import { Card } from './ui/Card';
import { Plus, Edit2, Trash2, Users, Search, X, ShoppingCart, Phone, MapPin, Mail } from 'lucide-react';

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

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Cari nama, telepon, atau email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Tambah Pelanggan
        </button>
      </div>

      {/* Customer Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
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
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
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
                        <Phone size={14} /> {customer.phone}
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
              <h2 className="text-xl font-bold text-slate-800">
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nama pelanggan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Telepon <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
    </div>
  );
};