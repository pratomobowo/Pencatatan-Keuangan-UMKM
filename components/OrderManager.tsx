import React, { useState, useEffect } from 'react';
import { Order, OrderItem, Product, Customer, ShopOrder, ShopOrderStatus } from '@/lib/types';
import { Card } from './ui/Card';
import { Plus, Trash2, Printer, CheckCircle, Clock, XCircle, ShoppingBag, ArrowLeft, Users, MessageCircle, MapPin, Phone, CreditCard } from 'lucide-react';

interface OrderManagerProps {
  orders: Order[]; // All orders (MANUAL + ONLINE)
  products: Product[];
  customers?: Customer[];
  onAddOrder?: (order: Order) => void;
  onUpdateStatus?: (id: string, status: 'PAID' | 'CANCELLED' | ShopOrderStatus) => void;
  onDeleteOrder?: (id: string) => void;
  initialCustomerId?: string | null;
  onClearInitialCustomer?: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export const OrderManager: React.FC<OrderManagerProps> = ({
  orders = [],
  products,
  customers = [],
  onAddOrder,
  onUpdateStatus,
  onDeleteOrder,
  initialCustomerId,
  onClearInitialCustomer,
}) => {
  const [view, setView] = useState<'LIST' | 'FORM' | 'INVOICE'>('LIST');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Form State - matches website order structure
  const [formData, setFormData] = useState<{
    customerId?: string;
    customerName: string;
    customerAddress?: string;
    customerPhone: string;
    recipientName: string;
    recipientPhone: string;
    shippingAddress: string;
    paymentMethod: string;
    deliveryTime: string;
    date: string;
    items: Omit<OrderItem, 'id' | 'total'>[];
    shippingFee: string;
    serviceFee: string;
    notes: string;
  }>({
    customerName: '',
    customerAddress: '',
    customerPhone: '',
    recipientName: '',
    recipientPhone: '',
    shippingAddress: '',
    paymentMethod: 'CASH',
    deliveryTime: '',
    date: new Date().toISOString().split('T')[0],
    items: [{ productName: '', qty: 1, unit: 'kg', price: 0 }],
    shippingFee: '0',
    serviceFee: '0',
    notes: ''
  });

  // Handle Quick Order Initialization
  useEffect(() => {
    if (initialCustomerId) {
      setView('FORM');
      handleCustomerSelect(initialCustomerId);
      if (onClearInitialCustomer) onClearInitialCustomer();
    }
  }, [initialCustomerId]);

  // --- Form Logic ---

  const handleCustomerSelect = (customerId: string) => {
    if (customerId === 'new') {
      setFormData(prev => ({
        ...prev,
        customerId: undefined,
        customerName: '',
        customerAddress: '',
        customerPhone: ''
      }));
      return;
    }

    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId: customer.id,
        customerName: customer.name,
        customerAddress: customer.address,
        customerPhone: customer.phone,
        notes: customer.notes ? `[Note: ${customer.notes}] ` + (prev.notes || '') : (prev.notes || '')
      }));
    }
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productName: '', qty: 1, unit: 'kg', price: 0 }]
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index: number, field: keyof Omit<OrderItem, 'id' | 'total'>, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  // Logic when selecting a product from dropdown
  const handleProductSelect = (index: number, productId: string) => {
    if (productId === 'custom') {
      // Clear fields for custom entry
      const newItems = [...formData.items];
      newItems[index] = { ...newItems[index], productId: undefined, productName: '', price: 0, unit: 'kg', costPrice: 0 };
      setFormData(prev => ({ ...prev, items: newItems }));
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product) {
      const newItems = [...formData.items];
      newItems[index] = {
        ...newItems[index],
        productId: product.id,
        productName: product.name,
        price: product.price,
        unit: product.unit,
        costPrice: product.costPrice || 0 // Snapshot cost price
      };
      setFormData(prev => ({ ...prev, items: newItems }));
    }
  };

  const calculateTotal = () => {
    const subtotal = formData.items.reduce((acc, item) => acc + (item.qty * item.price), 0);
    const delivery = parseFloat(formData.shippingFee) || 0;
    return subtotal + delivery;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subtotal = formData.items.reduce((acc, item) => acc + (item.qty * item.price), 0);
    const deliveryFee = parseFloat(formData.shippingFee) || 0;

    const newOrder: Order = {
      id: crypto.randomUUID(),
      customerId: formData.customerId,
      customerName: formData.customerName,
      customerAddress: formData.customerAddress,
      customerPhone: formData.customerPhone,
      date: new Date(formData.date).toISOString(),
      items: formData.items.map(item => ({
        ...item,
        id: crypto.randomUUID(),
        total: item.qty * item.price
      })),
      subtotal,
      shippingFee: deliveryFee,
      grandTotal: subtotal + deliveryFee,
      status: 'PENDING',
      notes: formData.notes
    };

    if (onAddOrder) onAddOrder(newOrder);

    // Reset Form
    setFormData({
      customerId: undefined,
      customerName: '',
      customerAddress: '',
      customerPhone: '',
      recipientName: '',
      recipientPhone: '',
      shippingAddress: '',
      paymentMethod: 'CASH',
      deliveryTime: '',
      date: new Date().toISOString().split('T')[0],
      items: [{ productName: '', qty: 1, unit: 'kg', price: 0 }],
      shippingFee: '0',
      serviceFee: '0',
      notes: ''
    });
    setView('LIST');
  };

  const handleViewInvoice = (order: Order) => {
    setSelectedOrder(order);
    setView('INVOICE');
  };

  const sendToWhatsApp = (order: Order) => {
    if (!order) return;

    let message = `*INVOICE PASARANTAR*\n`;
    message += `--------------------------------\n`;
    message += `Halo Kak ${order.customerName},\n`;
    message += `Berikut rincian pesanan Kakak:\n\n`;

    order.items.forEach((item, idx) => {
      message += `${idx + 1}. ${item.productName} (${item.qty} ${item.unit}) - ${formatCurrency(item.total)}\n`;
    });

    message += `\nSubtotal: ${formatCurrency(order.subtotal)}\n`;
    if (order.shippingFee > 0) {
      message += `Ongkir: ${formatCurrency(order.shippingFee)}\n`;
    }
    message += `*TOTAL: ${formatCurrency(order.grandTotal)}*\n`;
    message += `--------------------------------\n`;
    message += `Mohon ditunggu pengirimannya ya kak. Terima kasih! 🙏\n`;
    message += `_Powered by Pasarantar_`;

    // Encode message for URL
    const encodedMessage = encodeURIComponent(message);

    // Check if phone number is valid format for WA me link (remove 0 replace with 62 or keep if +)
    let phone = order.customerPhone || '';
    // Simple cleaner: if starts with 08, replace 0 with 62
    if (phone.startsWith('08')) {
      phone = '62' + phone.substring(1);
    }
    // Remove non-numeric characters
    phone = phone.replace(/[^0-9]/g, '');

    if (phone.length < 5) {
      alert("Nomor HP pelanggan tidak valid untuk WhatsApp. Copy teks manual saja.");
      // We could just open without phone number to let user select contact, but wa.me usually needs number or use api.whatsapp.com/send?text=
      window.open(`https://api.whatsapp.com/send?text=${encodedMessage}`, '_blank');
    } else {
      window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
    }
  };

  // --- Render Functions ---

  const renderInvoice = () => {
    if (!selectedOrder) return null;

    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-4 flex flex-wrap justify-between items-center gap-2 no-print">
          <button onClick={() => setView('LIST')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
            <ArrowLeft size={16} /> Kembali
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => sendToWhatsApp(selectedOrder)}
              className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 shadow-sm"
            >
              <MessageCircle size={16} /> Kirim WA
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 shadow-sm"
            >
              <Printer size={16} /> Cetak
            </button>
          </div>
        </div>

        <div className="bg-white p-8 shadow-lg border border-slate-200 rounded-sm" id="invoice-area">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-6 mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">INVOICE</h1>
              <p className="text-sm text-slate-500">#{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-semibold text-blue-600">Pasarantar</h2>
              <p className="text-sm text-slate-500">Fresh Protein Delivery</p>
              <p className="text-xs text-slate-400 mt-1">
                {new Date(selectedOrder.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="mb-8">
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Ditagihkan Kepada:</h3>
            <p className="text-lg font-medium text-slate-800">{selectedOrder.customerName}</p>
            <p className="text-slate-600">{selectedOrder.customerAddress || '-'}</p>
            <p className="text-slate-600">{selectedOrder.customerPhone}</p>
          </div>

          {/* Items */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 text-xs font-medium text-slate-500 uppercase">Item</th>
                <th className="text-right py-2 text-xs font-medium text-slate-500 uppercase">Jml</th>
                <th className="text-right py-2 text-xs font-medium text-slate-500 uppercase">Harga</th>
                <th className="text-right py-2 text-xs font-medium text-slate-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody>
              {selectedOrder.items.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-50">
                  <td className="py-3 text-slate-700 font-medium">{item.productName}</td>
                  <td className="py-3 text-right text-slate-600">{item.qty} {item.unit}</td>
                  <td className="py-3 text-right text-slate-600">{formatCurrency(item.price)}</td>
                  <td className="py-3 text-right text-slate-800 font-medium">{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex flex-col items-end space-y-2 border-t border-slate-200 pt-4">
            <div className="flex justify-between w-48 text-slate-600">
              <span>Subtotal:</span>
              <span>{formatCurrency(selectedOrder.subtotal)}</span>
            </div>
            <div className="flex justify-between w-48 text-slate-600">
              <span>Ongkir:</span>
              <span>{formatCurrency(selectedOrder.shippingFee)}</span>
            </div>
            <div className="flex justify-between w-48 text-xl font-semibold text-slate-900 pt-2 border-t border-slate-100">
              <span>Total:</span>
              <span>{formatCurrency(selectedOrder.grandTotal)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 text-center text-xs text-slate-400">
            <p>Terima kasih telah berbelanja di Pasarantar!</p>
            <p>Protein segar, langsung dari pasar ke rumah Anda.</p>
          </div>
        </div>
      </div>
    );
  };

  const renderForm = () => (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4">
        <button onClick={() => setView('LIST')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <ArrowLeft size={16} /> Batal & Kembali
        </button>
      </div>
      <Card title="Buat Order Baru">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Info */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Users size={16} /> Data Pelanggan
              </h3>
              {customers.length === 0 && (
                <span className="text-xs text-rose-500">Belum ada data pelanggan tersimpan.</span>
              )}
            </div>

            <div className="mb-4">
              <select
                className="w-full p-2.5 border border-blue-200 bg-white rounded-lg text-sm text-slate-900 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={formData.customerId || 'new'}
                onChange={(e) => handleCustomerSelect(e.target.value)}
              >
                <option value="new">+ Pelanggan Baru (Manual)</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.address}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-700 mb-1">Nama Pelanggan</label>
                <input
                  required
                  type="text"
                  value={formData.customerName}
                  onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full p-2 border rounded-lg text-sm text-slate-900"
                  placeholder="Misal: Bu Siti"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Nomor HP</label>
                <input
                  type="text"
                  value={formData.customerPhone}
                  onChange={e => setFormData({ ...formData, customerPhone: e.target.value })}
                  className="w-full p-2 border rounded-lg text-sm text-slate-900"
                  placeholder="0812..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-slate-700 mb-1">Alamat Pengiriman</label>
                <input
                  type="text"
                  value={formData.customerAddress}
                  onChange={e => setFormData({ ...formData, customerAddress: e.target.value })}
                  className="w-full p-2 border rounded-lg text-sm text-slate-900"
                  placeholder="Jalan, Nomor Rumah, Komplek"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">Tanggal Order</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-2 border rounded-lg text-sm text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm text-slate-700">Item Belanja</label>
              {products.length === 0 && (
                <span className="text-xs text-rose-500 italic">Tips: Tambahkan data di menu 'Data Produk' agar input lebih cepat.</span>
              )}
            </div>

            {formData.items.map((item, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-2 mb-3 items-end p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="flex-grow flex flex-col gap-1">
                  {/* Product Selector */}
                  {products.length > 0 && (
                    <select
                      className="w-full p-2 border rounded-lg text-sm text-slate-900 mb-1"
                      value={item.productId || 'custom'}
                      onChange={(e) => handleProductSelect(idx, e.target.value)}
                    >
                      <option value="custom">-- Input Manual --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Sisa: {p.stock || 0} {p.unit})
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    placeholder="Nama Produk (Manual)"
                    value={item.productName}
                    onChange={e => handleItemChange(idx, 'productName', e.target.value)}
                    className="w-full p-2 border rounded-lg text-sm text-slate-900"
                    required
                  />
                </div>
                <div className="w-20">
                  <span className="text-xs text-slate-500 block mb-1">Jumlah</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Jml"
                    value={item.qty}
                    onChange={e => handleItemChange(idx, 'qty', parseFloat(e.target.value))}
                    className="w-full p-2 border rounded-lg text-sm text-slate-900"
                    required
                  />
                </div>
                <div className="w-24">
                  <span className="text-xs text-slate-500 block mb-1">Satuan</span>
                  <select
                    value={item.unit}
                    onChange={e => handleItemChange(idx, 'unit', e.target.value)}
                    className="w-full p-2 border rounded-lg text-sm text-slate-900"
                  >
                    <option value="kg">kg</option>
                    <option value="pack">pack</option>
                    <option value="gr">gram</option>
                    <option value="ekor">ekor</option>
                  </select>
                </div>
                <div className="w-32">
                  <span className="text-xs text-slate-500 block mb-1">Harga/Unit</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="Harga"
                    value={item.price || ''}
                    onChange={e => handleItemChange(idx, 'price', parseFloat(e.target.value))}
                    className="w-full p-2 border rounded-lg text-sm text-slate-900"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg mb-[1px]"
                  disabled={formData.items.length === 1}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddItem}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
            >
              <Plus size={16} /> Tambah Item Lain
            </button>
          </div>

          <div className="border-t border-slate-200 my-4"></div>

          {/* Footer & Total */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-700 mb-1">Catatan Tambahan</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                className="w-full p-2 border rounded-lg text-sm text-slate-900"
                rows={3}
              />
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="mb-3">
                <label className="block text-sm text-slate-700 mb-1">Biaya Ongkir (Delivery)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.shippingFee}
                  onChange={e => setFormData({ ...formData, shippingFee: e.target.value })}
                  className="w-full p-2 border rounded-lg text-sm text-slate-900"
                />
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                <span className="font-semibold text-lg text-slate-800">Total Tagihan:</span>
                <span className="font-semibold text-xl text-blue-600">{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Simpan Order
            </button>
          </div>
        </form>
      </Card>
    </div>
  );

  const renderList = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Daftar Pesanan</h2>
          <p className="text-sm text-slate-500">Kelola order masuk dari pelanggan.</p>
        </div>
        <button
          onClick={() => setView('FORM')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} /> Order Baru
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Belum ada order masuk.</p>
            <p className="text-sm text-slate-400">Buat order baru untuk mencatat penjualan.</p>
          </div>
        ) : (
          orders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(order => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 mb-1">
                        #{order.id.slice(0, 6)}
                      </span>
                      <h3 className="font-semibold text-slate-800 text-lg">{order.customerName}</h3>
                      <p className="text-sm text-slate-500 flex items-center gap-1">
                        <Clock size={12} /> {new Date(order.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                      </p>
                    </div>
                    <div className="md:hidden">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                        order.status === 'CANCELLED' ? 'bg-slate-100 text-slate-500' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {order.status === 'PAID' ? 'LUNAS' : order.status === 'CANCELLED' ? 'BATAL' : 'BELUM BAYAR'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <ul className="list-disc pl-4 space-y-1">
                      {order.items.slice(0, 2).map((item, i) => (
                        <li key={i}>{item.productName} ({item.qty} {item.unit})</li>
                      ))}
                      {order.items.length > 2 && <li className="list-none text-xs text-slate-400 italic">...dan {order.items.length - 2} item lainnya</li>}
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col justify-between items-end gap-3 min-w-[150px]">
                  <div className="text-right hidden md:block">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${order.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                      order.status === 'CANCELLED' ? 'bg-slate-100 text-slate-500' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {order.status === 'PAID' ? 'LUNAS' : order.status === 'CANCELLED' ? 'BATAL' : 'BELUM BAYAR'}
                    </span>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-400">Total Tagihan</p>
                    <p className="text-lg font-semibold text-blue-600">{formatCurrency(order.grandTotal)}</p>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto">
                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => onUpdateStatus && onUpdateStatus(order.id, 'PAID')}
                        className="flex-1 md:flex-none flex justify-center items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700"
                        title="Tandai Lunas"
                      >
                        <CheckCircle size={14} /> Bayar
                      </button>
                    )}

                    <button
                      onClick={() => handleViewInvoice(order)}
                      className="flex-1 md:flex-none flex justify-center items-center gap-1 px-3 py-1.5 bg-slate-700 text-white rounded text-xs font-medium hover:bg-slate-800"
                      title="Lihat Invoice"
                    >
                      <Printer size={14} /> Invoice
                    </button>

                    {order.status !== 'CANCELLED' && (
                      <button
                        onClick={() => onUpdateStatus && onUpdateStatus(order.id, 'CANCELLED')}
                        className="px-2 py-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded"
                        title="Batalkan Order"
                      >
                        <XCircle size={16} />
                      </button>
                    )}

                    <button
                      onClick={() => onDeleteOrder && onDeleteOrder(order.id)}
                      className="px-2 py-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded"
                      title="Hapus Permanen"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div>
      {view === 'LIST' && renderList()}
      {view === 'FORM' && renderForm()}
      {view === 'INVOICE' && renderInvoice()}
    </div>
  );
};