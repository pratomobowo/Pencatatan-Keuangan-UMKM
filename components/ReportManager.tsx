import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, Order, Product } from '@/lib/types';
import { Card } from './ui/Card';
import { Printer, Calendar, TrendingUp, TrendingDown, DollarSign, Package, AlertCircle } from 'lucide-react';

interface ReportManagerProps {
  transactions: Transaction[];
  orders: Order[];
  products: Product[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export const ReportManager: React.FC<ReportManagerProps> = ({ transactions, orders, products }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // --- Financial Calculations ---
  const reportData = useMemo(() => {
    // Filter transactions by month/year
    const monthlyTx = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
    });

    const monthlyOrders = orders.filter(o => {
      const d = new Date(o.date);
      return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear && o.status === 'PAID';
    });

    // 1. Revenue
    const revenue = monthlyTx
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((acc, t) => acc + t.amount, 0);

    // 2. COGS (HPP) - Specifically "Belanja Pasar"
    const cogs = monthlyTx
      .filter(t => t.type === TransactionType.EXPENSE && t.category.includes('Belanja Pasar'))
      .reduce((acc, t) => acc + t.amount, 0);

    // 3. Operational Expenses (OpEx) - All other expenses
    const opex = monthlyTx
      .filter(t => t.type === TransactionType.EXPENSE && !t.category.includes('Belanja Pasar'))
      .reduce((acc, t) => acc + t.amount, 0);

    // 4. Gross Profit
    const grossProfit = revenue - cogs;

    // 5. Net Profit
    const netProfit = grossProfit - opex;

    // 6. Metrics
    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
    const avgOrderValue = monthlyOrders.length > 0 ? revenue / monthlyOrders.length : 0;

    // 7. Product Performance (From Orders)
    const productStats: Record<string, { qty: number, total: number }> = {};
    monthlyOrders.forEach(order => {
      order.items.forEach(item => {
        if (!productStats[item.productName]) {
          productStats[item.productName] = { qty: 0, total: 0 };
        }
        productStats[item.productName].qty += item.qty;
        productStats[item.productName].total += item.total;
      });
    });

    const topProducts = Object.entries(productStats)
      .map(([name, stat]) => ({ name, ...stat }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      revenue,
      cogs,
      grossProfit,
      opex,
      netProfit,
      grossMargin,
      netMargin,
      avgOrderValue,
      orderCount: monthlyOrders.length,
      topProducts
    };
  }, [transactions, orders, selectedMonth, selectedYear]);

  // Inventory Valuation (Realtime, not historical)
  const inventoryValue = useMemo(() => {
    return products.reduce((acc, p) => acc + ((p.stock || 0) * (p.costPrice || 0)), 0);
  }, [products]);

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6">
      {/* Controls Card */}
      <Card className="no-print">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Laporan Bulanan</h3>
            <p className="text-xs text-slate-500 mt-0.5">Atur periode laporan keuangan bulanan.</p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            <Printer size={16} /> Cetak Laporan
          </button>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Bulan:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="p-2 border border-slate-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500"
            >
              {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-700">Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="p-2 border border-slate-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* Report Container Card */}
      <Card id="printable-report" className="p-8">
        {/* Header Report Action Bar */}
        <div className="text-center border-b-2 border-slate-800 pb-6 mb-8">
          <h1 className="text-2xl font-semibold text-slate-900 mb-1">LAPORAN LABA RUGI</h1>
          <p className="text-slate-500 font-medium text-sm">Pasarantar - Fresh Protein Delivery</p>
          <p className="text-xs text-slate-400 mt-2">Periode: {months[selectedMonth]} {selectedYear}</p>
        </div>

        {/* P&L Statement */}
        <div className="mb-10">
          <h4 className="text-sm font-semibold text-slate-700 mb-4 border-l-4 border-blue-600 pl-3">Rincian Keuangan</h4>

          <div className="space-y-2 text-sm">
            {/* Revenue */}
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600 font-medium">Total Pendapatan (Omzet)</span>
              <span className="font-semibold text-slate-800">{formatCurrency(reportData.revenue)}</span>
            </div>

            {/* HPP */}
            <div className="flex justify-between items-center py-2 border-b border-slate-100 text-rose-600">
              <span className="flex items-center gap-2">
                (-) Harga Pokok Penjualan (HPP / Belanja Pasar)
              </span>
              <span>({formatCurrency(reportData.cogs)})</span>
            </div>

            {/* Gross Profit */}
            <div className="flex justify-between items-center py-3 bg-slate-50 px-3 rounded-lg font-medium mt-2">
              <span className="text-slate-700">Laba Kotor (Gross Profit)</span>
              <span className={reportData.grossProfit >= 0 ? "text-blue-600" : "text-rose-600"}>
                {formatCurrency(reportData.grossProfit)}
              </span>
            </div>

            {/* OpEx */}
            <div className="flex justify-between items-center py-2 border-b border-slate-100 text-orange-600 mt-2">
              <span>(-) Biaya Operasional (Gaji, Bensin, Packaging)</span>
              <span>({formatCurrency(reportData.opex)})</span>
            </div>

            {/* Net Profit */}
            <div className="flex justify-between items-center py-4 bg-slate-900 text-white px-4 rounded-lg text-lg font-semibold mt-6 shadow-sm">
              <span>LABA BERSIH (Net Profit)</span>
              <span className={reportData.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}>
                {formatCurrency(reportData.netProfit)}
              </span>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2 text-slate-500 mb-1 text-xs font-medium">
              <TrendingUp size={14} /> Margin Laba Bersih
            </div>
            <div className={`text-xl font-semibold ${reportData.netMargin >= 15 ? 'text-emerald-600' : reportData.netMargin > 0 ? 'text-yellow-600' : 'text-rose-600'}`}>
              {reportData.netMargin.toFixed(1)}%
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Target sehat: &gt;15%</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2 text-slate-500 mb-1 text-xs font-medium">
              <Package size={14} /> Nilai Aset Stok (Saat Ini)
            </div>
            <div className="text-xl font-semibold text-blue-600">
              {formatCurrency(inventoryValue)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Uang dalam bentuk barang</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2 text-slate-500 mb-1 text-xs font-medium">
              <DollarSign size={14} /> Rata-rata Keranjang
            </div>
            <div className="text-xl font-semibold text-slate-700">
              {formatCurrency(reportData.avgOrderValue)}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">{reportData.orderCount} Transaksi bulan ini</p>
          </div>
        </div>

        {/* Top Products */}
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-4 border-l-4 border-emerald-500 pl-3">Produk Terlaris Bulan Ini</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-2 border-b border-slate-200">Nama Produk</th>
                  <th className="px-4 py-2 text-right border-b border-slate-200">Terjual</th>
                  <th className="px-4 py-2 text-right border-b border-slate-200">Total Omzet</th>
                </tr>
              </thead>
              <tbody>
                {reportData.topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-slate-400">Belum ada penjualan bulan ini.</td>
                  </tr>
                ) : (
                  reportData.topProducts.map((p, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-2.5 font-medium text-slate-800">{p.name}</td>
                      <td className="px-4 py-2.5 text-right">{p.qty}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-emerald-600">{formatCurrency(p.total)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alert/Advice Section */}
        <div className="mt-8 p-4 bg-orange-50 rounded-lg border border-orange-100 flex gap-3 text-xs text-orange-800">
          <AlertCircle className="shrink-0 w-4 h-4 mt-0.5" />
          <div>
            <strong className="font-semibold text-sm block mb-1">Catatan Analisis:</strong>
            <ul className="list-disc pl-4 space-y-1">
              {reportData.netProfit < 0 && <li>Bisnis mengalami kerugian bulan ini. Cek kembali pengeluaran operasional atau sesuaikan harga jual.</li>}
              {reportData.grossMargin < 20 && reportData.revenue > 0 && <li>Margin kotor rendah (&lt;20%). Hati-hati dengan HPP (Harga Pasar) yang naik atau penyusutan barang.</li>}
              {inventoryValue > reportData.revenue && <li>Stok barang menumpuk lebih besar dari omzet bulanan. Waspada cashflow macet di barang.</li>}
              {reportData.netProfit > 0 && <li>Bisnis dalam kondisi untung. Pertahankan efisiensi.</li>}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};