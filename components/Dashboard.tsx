import React, { useMemo } from 'react';
import { Transaction, TransactionType, FinancialSummary, Product } from '@/lib/types';
import { Card } from './ui/Card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, AlertTriangle, Package } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  summary: FinancialSummary;
  products?: Product[]; // Added prop
}

const COLORS = ['#10B981', '#F43F5E', '#3B82F6', '#F59E0B'];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
};

export const Dashboard: React.FC<DashboardProps> = ({ transactions, summary, products = [] }) => {

  const chartData = useMemo(() => {
    // Group by month (simple version)
    const grouped = transactions.reduce((acc, t) => {
      const date = new Date(t.date);
      const key = `${date.toLocaleString('id-ID', { month: 'short' })} ${date.getDate()}`;

      if (!acc[key]) acc[key] = { name: key, income: 0, expense: 0 };

      if (t.type === TransactionType.INCOME) acc[key].income += t.amount;
      if (t.type === TransactionType.EXPENSE) acc[key].expense += t.amount;

      return acc;
    }, {} as Record<string, any>);

    // Sort by date roughly (taking last 7 days active)
    return Object.values(grouped).slice(-7);
  }, [transactions]);

  const expenseCategoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === TransactionType.EXPENSE);
    const grouped = expenses.reduce((acc, t) => {
      if (!acc[t.category]) acc[t.category] = 0;
      acc[t.category] += t.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(grouped).map(key => ({
      name: key,
      value: grouped[key]
    }));
  }, [transactions]);

  // Inventory Logic
  const lowStockProducts = useMemo(() => {
    return products.filter(p => (p.stock || 0) <= 5).sort((a, b) => (a.stock || 0) - (b.stock || 0));
  }, [products]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Changed from dark slate to blue brand color */}
        <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-none shadow-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-blue-100 text-sm">Saldo Kas</span>
            <Wallet className="w-5 h-5 text-blue-200" />
          </div>
          <div className="text-2xl font-semibold">{formatCurrency(summary.balance)}</div>
          <div className="text-xs text-blue-200 mt-2">Total Aset Likuid</div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-sm">Laba Bersih</span>
            <TrendingUp className={`w-5 h-5 ${summary.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
          </div>
          <div className={`text-2xl font-semibold ${summary.netProfit >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
            {formatCurrency(summary.netProfit)}
          </div>
          <div className="text-xs text-slate-400 mt-2">Pendapatan - Pengeluaran</div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-sm">Pemasukan</span>
            <div className="p-1.5 bg-emerald-100 rounded-full">
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-emerald-600">{formatCurrency(summary.totalIncome)}</div>
          <div className="text-xs text-slate-400 mt-2">Total Pendapatan</div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-500 text-sm">Pengeluaran</span>
            <div className="p-1.5 bg-rose-100 rounded-full">
              <ArrowDownRight className="w-4 h-4 text-rose-600" />
            </div>
          </div>
          <div className="text-2xl font-semibold text-rose-600">{formatCurrency(summary.totalExpense)}</div>
          <div className="text-xs text-slate-400 mt-2">Total Beban Operasional</div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Charts */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Arus Kas (7 Hari Terakhir)" className="min-h-[350px]">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis hide />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Pemasukan" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Pengeluaran" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Inventory Alert - ONLY SHOW IF LOW STOCK */}
          {lowStockProducts.length > 0 && (
            <Card title="Peringatan Stok Menipis" className="border-l-4 border-l-rose-500">
              <div className="space-y-3">
                {lowStockProducts.map(p => (
                  <div key={p.id} className="flex justify-between items-center p-3 bg-rose-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-full text-rose-500">
                        <AlertTriangle size={18} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{p.name}</p>
                        <p className="text-xs text-rose-600">Perlu restock segera</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-semibold text-rose-600">{p.stock}</span>
                      <span className="text-xs text-slate-500 ml-1">{p.unit}</span>
                    </div>
                  </div>
                ))}
                <div className="text-center pt-2">
                  <p className="text-xs text-slate-400">Silakan masuk ke menu <b>Data Produk</b> untuk melakukan Restock (Belanja Pasar).</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Pie Chart & other widgets */}
        <div className="space-y-6">
          <Card title="Komposisi Pengeluaran" className="min-h-[350px]">
            <div className="h-[280px] w-full flex flex-col items-center justify-center">
              {expenseCategoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expenseCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-slate-400 text-sm text-center">Belum ada data pengeluaran</div>
              )}
            </div>
          </Card>

          {/* Mini Inventory Summary */}
          <Card className="bg-slate-800 text-white">
            <div className="flex items-center gap-3 mb-4">
              <Package className="text-blue-400" />
              <h3 className="font-medium">Ringkasan Gudang</h3>
            </div>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-slate-400 text-sm">Total Jenis Produk</p>
                <p className="text-2xl font-semibold">{products.length}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm">Produk Stok Aman</p>
                <p className="text-xl font-medium text-emerald-400">{products.filter(p => (p.stock || 0) > 5).length}</p>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};