import React, { useState, useEffect } from 'react';
import { Order, OrderItem, Product, Customer, ShopOrderStatus } from '@/lib/types';
import { Card } from './ui/Card';
import { Plus, Search, X, Trash2, Eye, CheckCircle, XCircle, Printer, MessageSquare, ShoppingBag, Clock, Package } from 'lucide-react';

interface OrderManagerProps {
  orders: Order[]; // All orders (MANUAL + ONLINE)
  products: Product[];
  customers?: Customer[];
  onAddOrder?: (order: Order) => void;
  onUpdateStatus?: (id: string, status: 'PAID' | 'CANCELLED' | ShopOrderStatus) => void;
  onDeleteOrder?: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  initialCustomerId?: string | null;
  onClearInitialCustomer?: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

const getStatusBadge = (status: string) => {
  const badges: Record<string, { bg: string; text: string; label: string }> = {
    'PENDING': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Menunggu' },
    'PAID': { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Lunas' },
    'CANCELLED': { bg: 'bg-rose-100', text: 'text-rose-800', label: 'Dibatalkan' },
    'CONFIRMED': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Dikonfirmasi' },
    'PREPARING': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Diproses' },
    'SHIPPING': { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Dikirim' },
    'DELIVERED': { bg: 'bg-green-100', text: 'text-green-800', label: 'Selesai' },
  };
  const badge = badges[status] || badges['PENDING'];
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>{badge.label}</span>;
};

export const OrderManager: React.FC<OrderManagerProps> = ({
  orders = [],
  products,
  customers = [],
  onAddOrder,
  onUpdateStatus,
  onDeleteOrder,
  onBulkDelete,
  initialCustomerId,
  onClearInitialCustomer,
}) => {
  const [showFormModal, setShowFormModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Form State
  const [formData, setFormData] = useState<{
    customerId?: string;
    customerName: string;
    customerAddress?: string;
    customerPhone: string;
    date: string;
    items: Omit<OrderItem, 'id' | 'total'>[];
    notes: string;
  }>({
    customerName: '',
    customerAddress: '',
    customerPhone: '',
    date: new Date().toISOString().split('T')[0],
    items: [{ productName: '', qty: 1, unit: 'kg', price: 0 }],
    notes: ''
  });

  // Handle Quick Order from Customer page
  useEffect(() => {
    if (initialCustomerId) {
      const customer = customers.find(c => c.id === initialCustomerId);
      if (customer) {
        setFormData(prev => ({
          ...prev,
          customerId: customer.id,
          customerName: customer.name,
          customerPhone: customer.phone || '',
          customerAddress: customer.address || '',
        }));
        setShowFormModal(true);
        if (onClearInitialCustomer) onClearInitialCustomer();
      }
    }
  }, [initialCustomerId, customers, onClearInitialCustomer]);

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone || '',
        customerAddress: customer.address || '',
      }));
    }
  };

  const handleProductSelect = (index: number, productName: string) => {
    const product = products.find(p => p.name === productName);
    if (product) {
      const newItems = [...formData.items];
      newItems[index] = {
        productName: product.name,
        qty: 1,
        unit: product.unit,
        price: product.price
      };
      setFormData({ ...formData, items: newItems });
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productName: '', qty: 1, unit: 'kg', price: 0 }]
    });
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData({
        ...formData,
        items: formData.items.filter((_, i) => i !== index)
      });
    }
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...formData.items];
    (newItems[index] as any)[field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const itemsWithTotal = formData.items.map(item => ({
      ...item,
      id: crypto.randomUUID(),
      total: item.qty * item.price
    }));

    const subtotal = itemsWithTotal.reduce((sum, item) => sum + item.total, 0);

    const newOrder: Order = {
      id: crypto.randomUUID(),
      orderNumber: `ORD-${Date.now()}`,
      date: new Date(formData.date).toISOString(),
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerAddress: formData.customerAddress,
      items: itemsWithTotal,
      subtotal,
      shippingFee: 0,
      serviceFee: 0,
      grandTotal: subtotal,
      status: 'PENDING',
      notes: formData.notes,
      createdAt: new Date().toISOString(),
    };

    if (onAddOrder) onAddOrder(newOrder);
    handleCancel();
  };

  const handleCancel = () => {
    setShowFormModal(false);
    setFormData({
      customerName: '',
      customerAddress: '',
      customerPhone: '',
      date: new Date().toISOString().split('T')[0],
      items: [{ productName: '', qty: 1, unit: 'kg', price: 0 }],
      notes: ''
    });
  };

  const handleViewInvoice = (order: Order) => {
    setSelectedOrder(order);
    setShowInvoiceModal(true);
  };

  const handlePrintInvoice = () => {
    window.print();
  };

  const sendToWhatsApp = (order: Order) => {
    let message = `*INVOICE PASARANTAR*\n`;
    message += `--------------------------------\n`;
    message += `Halo Kak ${order.customerName},\n`;
    message += `Berikut rincian pesanan Kakak:\n\n`;

    order.items.forEach((item, idx) => {
      message += `${idx + 1}. ${item.productName} (${item.qty} ${item.unit}) - ${formatCurrency(item.total)}\n`;
    });

    message += `\nSubtotal: ${formatCurrency(order.subtotal)}\n`;
    if (order.shippingMethod === 'PICKUP') {
      message += `Ongkir: GRATIS (Pickup Mandiri)\n`;
    } else if (order.shippingFee && order.shippingFee > 0) {
      message += `Ongkir: ${formatCurrency(order.shippingFee)}\n`;
    }

    if (order.discount && order.discount > 0) {
      message += `Diskon: -${formatCurrency(order.discount)}\n`;
    }

    message += `*TOTAL: ${formatCurrency(order.grandTotal)}*\n`;
    message += `--------------------------------\n`;

    if (order.shippingMethod === 'PICKUP') {
      message += `Silakan ambil pesanan Anda atau kirim driver ke toko. Terima kasih! 🙏\n`;
    } else {
      message += `Mohon ditunggu pengirimannya ya kak. Terima kasih! 🙏\n`;
    }

    const encodedMessage = encodeURIComponent(message);
    let phone = order.customerPhone || '';
    if (phone.startsWith('08')) {
      phone = '62' + phone.substring(1);
    }
    phone = phone.replace(/[^0-9]/g, '');

    if (phone.length < 5) {
      window.open(`https://api.whatsapp.com/send?text=${encodedMessage}`, '_blank');
    } else {
      window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
    }
  };

  const totalOrders = orders.length;
  const unprocessedOrdersCount = orders.filter(o => ['PENDING', 'CONFIRMED'].includes(o.status)).length;
  const inProcessOrdersCount = orders.filter(o => ['PREPARING', 'SHIPPING'].includes(o.status)).length;
  const completedOrdersCount = orders.filter(o => ['DELIVERED'].includes(o.status)).length;
  const filteredOrders = orders
    .filter(o => statusFilter === 'ALL' || o.status === statusFilter)
    .filter(o =>
      o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customerPhone || '').includes(searchTerm)
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredOrders.map(o => o.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleDeleteBulk = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Hapus ${selectedIds.length} pesanan terpilih?`)) {
      if (onBulkDelete) {
        await onBulkDelete(selectedIds);
        setSelectedIds([]);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orders */}
        <Card className="p-0 overflow-hidden border-none shadow-sm group">
          <div className="bg-indigo-600 p-4 sm:p-5 flex items-center justify-between text-white transition-all hover:brightness-105">
            <div>
              <p className="text-indigo-100 text-[11px] font-medium uppercase tracking-wider">Order Masuk</p>
              <h3 className="text-2xl sm:text-3xl font-semibold mt-1.5">{totalOrders}</h3>
            </div>
            <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/20">
              <ShoppingBag className="text-white" size={24} />
            </div>
          </div>
        </Card>

        {/* Unprocessed */}
        <Card className="p-0 overflow-hidden border-none shadow-sm group">
          <div className="bg-orange-500 p-4 sm:p-5 flex items-center justify-between text-white transition-all hover:brightness-105">
            <div>
              <p className="text-orange-50 text-[11px] font-medium uppercase tracking-wider">Belum Diproses</p>
              <h3 className="text-2xl sm:text-3xl font-semibold mt-1.5">{unprocessedOrdersCount}</h3>
            </div>
            <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/20">
              <Clock className="text-white" size={24} />
            </div>
          </div>
        </Card>

        {/* In Process */}
        <Card className="p-0 overflow-hidden border-none shadow-sm group">
          <div className="bg-blue-500 p-4 sm:p-5 flex items-center justify-between text-white transition-all hover:brightness-105">
            <div>
              <p className="text-blue-50 text-[11px] font-medium uppercase tracking-wider">Sedang Diproses</p>
              <h3 className="text-2xl sm:text-3xl font-semibold mt-1.5">{inProcessOrdersCount}</h3>
            </div>
            <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/20">
              <Package className="text-white" size={24} />
            </div>
          </div>
        </Card>

        {/* Completed */}
        <Card className="p-0 overflow-hidden border-none shadow-sm group">
          <div className="bg-emerald-500 p-4 sm:p-5 flex items-center justify-between text-white transition-all hover:brightness-105">
            <div>
              <p className="text-emerald-50 text-[11px] font-medium uppercase tracking-wider">Selesai</p>
              <h3 className="text-2xl sm:text-3xl font-semibold mt-1.5">{completedOrdersCount}</h3>
            </div>
            <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/20">
              <CheckCircle className="text-white" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        {/* Search and Filters - Inside Card */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex-1 max-w-md w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Cari nomor order, nama, atau telepon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {selectedIds.length > 0 && (
              <button
                onClick={handleDeleteBulk}
                className="flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors whitespace-nowrap"
              >
                <Trash2 size={18} />
                Hapus ({selectedIds.length})
              </button>
            )}
            <select
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm flex-1 sm:flex-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Semua Status</option>
              <option value="PENDING">Menunggu</option>
              <option value="PAID">Lunas</option>
              <option value="CANCELLED">Dibatalkan</option>
              <option value="CONFIRMED">Dikonfirmasi</option>
              <option value="PREPARING">Diproses</option>
              <option value="SHIPPING">Dikirim</option>
              <option value="DELIVERED">Selesai</option>
            </select>
            <button
              onClick={() => setShowFormModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              <Plus size={20} />
              Order Baru
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left w-10">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    onChange={handleSelectAll}
                    checked={filteredOrders.length > 0 && selectedIds.length === filteredOrders.length}
                  />
                </th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">No. Order</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Tanggal</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Pelanggan</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Metode</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-700">Items</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-slate-700">Total</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">Status</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-700">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                    Tidak ada pesanan yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${selectedIds.includes(order.id) ? 'bg-blue-50/50' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={selectedIds.includes(order.id)}
                        onChange={() => handleSelectOne(order.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{order.orderNumber}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {new Date(order.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{order.customerName}</p>
                      <p className="text-xs text-slate-500">{order.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${order.shippingMethod === 'PICKUP' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {order.shippingMethod === 'PICKUP' ? 'Pickup' : 'Kurir'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <p className="text-sm">{order.items.length} item(s)</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatCurrency(order.grandTotal)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewInvoice(order)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                          title="Lihat Invoice"
                        >
                          <Eye size={16} />
                        </button>
                        {order.status === 'PENDING' && onUpdateStatus && (
                          <button
                            onClick={() => onUpdateStatus(order.id, 'PAID')}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors"
                            title="Tandai Lunas"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        {order.status !== 'CANCELLED' && onUpdateStatus && (
                          <button
                            onClick={() => onUpdateStatus(order.id, 'CANCELLED')}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Batalkan"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                        {onDeleteOrder && (
                          <button
                            onClick={() => {
                              if (confirm('Hapus pesanan ini?')) onDeleteOrder(order.id);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Item Count */}
        {
          filteredOrders.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 text-sm text-slate-500">
              Menampilkan {filteredOrders.length} dari {orders.length} pesanan
            </div>
          )
        }
      </Card >

      {/* Add Order Modal */}
      {
        showFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-white">
                <h2 className="text-xl font-bold text-slate-800">Tambah Pesanan Baru</h2>
                <button
                  onClick={handleCancel}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Customer Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm text-slate-700 mb-1">Pilih Pelanggan (Opsional)</label>
                      <select
                        value={formData.customerId || ''}
                        onChange={(e) => handleCustomerSelect(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                      >
                        <option value="">-- Pelanggan Baru --</option>
                        {customers.map(c => (
                          <option key={c.id} value={c.id}>{c.name} {c.phone ? `(${c.phone})` : ''}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-slate-700 mb-1">Nama Pelanggan *</label>
                      <input
                        type="text"
                        required
                        value={formData.customerName}
                        onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-slate-700 mb-1">Telepon *</label>
                      <input
                        type="tel"
                        required
                        value={formData.customerPhone}
                        onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm text-slate-700 mb-1">Alamat</label>
                      <input
                        type="text"
                        value={formData.customerAddress || ''}
                        onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
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
                  </div>

                  {/* Items */}
                  <div>
                    <label className="block text-sm text-slate-700 mb-2">Produk</label>
                    <div className="space-y-2">
                      {formData.items.map((item, index) => (
                        <div key={index} className="flex gap-2">
                          <select
                            value={item.productName}
                            onChange={(e) => handleProductSelect(index, e.target.value)}
                            className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-sm"
                            required
                          >
                            <option value="">Pilih Produk</option>
                            {products.map(p => (
                              <option key={p.id} value={p.name}>{p.name} - {formatCurrency(p.price)}/{p.unit}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={item.qty}
                            onChange={(e) => updateItem(index, 'qty', parseFloat(e.target.value))}
                            className="w-20 p-2 border border-slate-300 rounded-lg text-sm"
                            placeholder="Qty"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                            disabled={formData.items.length === 1}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addItem}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Tambah Item
                    </button>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm text-slate-700 mb-1">Catatan</label>
                    <textarea
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                    />
                  </div>

                  {/* Subtotal Preview */}
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-600">Subtotal:</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {formatCurrency(formData.items.reduce((sum, item) => sum + (item.qty * item.price), 0))}
                    </p>
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
                      Simpan Pesanan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )
      }

      {/* Invoice Modal */}
      {
        showInvoiceModal && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b bg-white print:hidden">
                <h2 className="text-xl font-bold text-slate-800">Invoice</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => sendToWhatsApp(selectedOrder)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Kirim ke WhatsApp"
                  >
                    <MessageSquare size={20} />
                  </button>
                  <button
                    onClick={handlePrintInvoice}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Print"
                  >
                    <Printer size={20} />
                  </button>
                  <button
                    onClick={() => setShowInvoiceModal(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="p-8">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-slate-900">INVOICE</h1>
                  <p className="text-slate-600">{selectedOrder.orderNumber}</p>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Pelanggan:</p>
                    <p className="font-semibold text-slate-900">{selectedOrder.customerName}</p>
                    <p className="text-sm text-slate-600">{selectedOrder.customerPhone}</p>
                    {selectedOrder.customerAddress && (
                      <p className="text-sm text-slate-600">{selectedOrder.customerAddress}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500 mb-1">Tanggal:</p>
                    <p className="font-semibold text-slate-900">
                      {new Date(selectedOrder.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-sm mt-2">{getStatusBadge(selectedOrder.status)}</p>
                    <div className="mt-2 flex items-center justify-end gap-1 capitalize">
                      <span className="text-[10px] text-slate-500">Metode:</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${selectedOrder.shippingMethod === 'PICKUP' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                        {selectedOrder.shippingMethod === 'PICKUP' ? 'Pickup Mandiri' : 'Antar Kurir'}
                      </span>
                    </div>
                  </div>
                </div>

                <table className="w-full mb-6">
                  <thead>
                    <tr className="border-b-2 border-slate-300">
                      <th className="text-left py-2 text-sm font-semibold text-slate-700">Item</th>
                      <th className="text-center py-2 text-sm font-semibold text-slate-700">Qty</th>
                      <th className="text-right py-2 text-sm font-semibold text-slate-700">Harga</th>
                      <th className="text-right py-2 text-sm font-semibold text-slate-700">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, idx) => (
                      <React.Fragment key={idx}>
                        <tr className="border-b border-slate-200">
                          <td className="py-2 text-slate-900">{item.productName}</td>
                          <td className="py-2 text-center text-slate-600">{item.qty} {item.unit}</td>
                          <td className="py-2 text-right text-slate-600">{formatCurrency(item.price)}</td>
                          <td className="py-2 text-right font-semibold text-slate-900">{formatCurrency(item.total)}</td>
                        </tr>
                        {(item as any).note && (
                          <tr className="border-b border-slate-100">
                            <td colSpan={4} className="py-1 px-2">
                              <div className="flex items-start gap-2 bg-amber-50 p-2 rounded text-xs text-amber-800">
                                <MessageSquare size={12} className="shrink-0 mt-0.5" />
                                <span>{(item as any).note}</span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end">
                  <div className="w-64">
                    <div className="flex justify-between py-2">
                      <span className="text-slate-600">Subtotal:</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(selectedOrder.subtotal)}</span>
                    </div>
                    {selectedOrder.shippingFee && selectedOrder.shippingFee > 0 && (
                      <div className="flex justify-between py-2">
                        <span className="text-slate-600">Ongkir:</span>
                        <span className="font-semibold text-slate-900">{formatCurrency(selectedOrder.shippingFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 border-t-2 border-slate-300">
                      <span className="font-bold text-slate-900">TOTAL:</span>
                      <span className="font-bold text-xl text-slate-900">{formatCurrency(selectedOrder.grandTotal)}</span>
                    </div>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500 mb-1">Catatan:</p>
                    <p className="text-slate-700">{selectedOrder.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};