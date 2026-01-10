import React, { useState } from 'react';
import { Transaction } from '@/lib/types';
import { Card } from './ui/Card';
import {
  Sparkles,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  Activity,
  Users,
  Package,
  ChevronRight,
  TrendingDown,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface InfographicData {
  kpis: Array<{
    label: string;
    value: string;
    status: 'positive' | 'neutral' | 'negative';
    description: string;
  }>;
  productAnalysis: {
    topPerforming: string;
    suggestion: string;
    chartData: Array<{ name: string; sales: number }>;
  };
  inventoryHealth: {
    status: 'Aman' | 'Peringatan' | 'Bahaya';
    summary: string;
    actionItems: string[];
  };
  strategicAdvice: Array<{
    title: string;
    content: string;
  }>;
  fullNarrative: string;
}

interface AIAdvisorProps {
  transactions: Transaction[];
}

export const AIAdvisor: React.FC<AIAdvisorProps> = ({ transactions }) => {
  const [data, setData] = useState<{ infographic?: InfographicData; analysis?: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/analysis', {
        method: 'POST',
      });
      const result = await response.json();
      if (result.error) throw new Error(result.error);
      setData(result);
    } catch (err: any) {
      console.error("Analysis Error:", err);
      setError("Gagal mendapatkan analisis AI. Coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'positive': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'negative': return 'text-rose-600 bg-rose-50 border-rose-100';
      default: return 'text-amber-600 bg-amber-50 border-amber-100';
    }
  };

  const getInventoryIcon = (status: string) => {
    switch (status) {
      case 'Bahaya': return <AlertTriangle className="text-rose-500" size={20} />;
      case 'Peringatan': return <AlertCircle className="text-amber-500" size={20} />;
      default: return <CheckCircle2 className="text-emerald-500" size={20} />;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Header */}
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-3 flex items-center gap-3">
              <Sparkles className="text-yellow-400" size={32} />
              AI Business Insights
            </h2>
            <p className="text-slate-300 text-lg max-w-2xl leading-relaxed">
              Dapatkan laporan visual mendalam tentang performa operasional 'Pasarantar'. Temukan pola belanja, optimasi stok, dan strategi pertumbuhan UMKM Anda.
            </p>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="group whitespace-nowrap bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-2xl shadow-2xl transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-3 text-lg"
          >
            {loading ? <RefreshCw className="animate-spin" size={24} /> : <Sparkles className="group-hover:animate-pulse" size={24} />}
            {loading ? 'Menganalisis Data...' : 'Generate Laporan'}
          </button>
        </div>
      </Card>

      {error && (
        <div className="p-6 bg-rose-50 border-2 border-rose-100 rounded-2xl text-rose-700 text-sm font-medium flex items-center gap-3">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {data?.infographic && (
        <div className="space-y-8 pb-12">
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.infographic.kpis.map((kpi, idx) => (
              <Card key={idx} className="p-6 hover:shadow-lg transition-all border-slate-100">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${getStatusColor(kpi.status).split(' ')[1]}`}>
                    {kpi.label.includes('Margin') ? <TrendingUp size={24} className={getStatusColor(kpi.status).split(' ')[0]} /> :
                      kpi.label.includes('Efisiensi') ? <Activity size={24} className={getStatusColor(kpi.status).split(' ')[0]} /> :
                        <Users size={24} className={getStatusColor(kpi.status).split(' ')[0]} />}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(kpi.status)}`}>
                    {kpi.status === 'positive' ? 'Sehat' : kpi.status === 'negative' ? 'Perhatian' : 'Stabil'}
                  </span>
                </div>
                <h4 className="text-slate-500 text-sm font-medium">{kpi.label}</h4>
                <div className="text-3xl font-black text-slate-900 mt-1">{kpi.value}</div>
                <p className="text-slate-400 text-xs mt-3 leading-relaxed">{kpi.description}</p>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chart Widget */}
            <Card className="lg:col-span-8 p-6 flex flex-col min-h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Top Product Performance</h3>
                  <p className="text-sm text-slate-500">Volume penjualan produk protein segar</p>
                </div>
                <div className="bg-blue-50 text-blue-700 p-2 rounded-xl">
                  <TrendingUp size={20} />
                </div>
              </div>

              <div className="flex-1 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.infographic.productAnalysis.chartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={120}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fontWeight: 500, fill: '#64748b' }}
                    />
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="sales" radius={[0, 8, 8, 0]} barSize={24}>
                      {data.infographic.productAnalysis.chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#2563eb' : '#94a3b8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 p-4 bg-slate-50 rounded-2xl flex items-center justify-between border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="size-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-slate-100">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Produk Terlaris</span>
                    <span className="text-sm font-bold text-slate-800">{data.infographic.productAnalysis.topPerforming}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Rekomendasi Bundling</span>
                  <span className="text-xs font-semibold text-blue-600">{data.infographic.productAnalysis.suggestion}</span>
                </div>
              </div>
            </Card>

            {/* Inventory & Strategy */}
            <div className="lg:col-span-4 space-y-6 flex flex-col">
              {/* Inventory Health */}
              <Card className="p-6 border-l-4 border-l-amber-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Package size={20} className="text-amber-600" />
                  </div>
                  <h3 className="font-bold text-slate-800">Inventory Health</h3>
                </div>
                <div className={`flex items-center gap-2 mb-3 px-3 py-1.5 rounded-xl w-fit font-bold text-xs border ${data.infographic.inventoryHealth.status === 'Bahaya' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                    data.infographic.inventoryHealth.status === 'Peringatan' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                  {getInventoryIcon(data.infographic.inventoryHealth.status)}
                  {data.infographic.inventoryHealth.status}
                </div>
                <p className="text-sm text-slate-600 mb-4">{data.infographic.inventoryHealth.summary}</p>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Action Items:</span>
                  {data.infographic.inventoryHealth.actionItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs font-medium text-slate-700 bg-white p-2 rounded-lg shadow-sm border border-slate-50">
                      <ChevronRight size={14} className="text-blue-500 mt-0.5 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Quick Strategy */}
              <div className="flex-1 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 px-2 flex items-center gap-2">
                  <TrendingUp size={16} className="text-blue-600" />
                  Strategic Advice
                </h3>
                {data.infographic.strategicAdvice.map((adv, idx) => (
                  <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 transition-colors group">
                    <h4 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">{adv.title}</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">{adv.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Narrative Fallback */}
          <Card className="p-8 bg-slate-50/50 border-dashed border-2 border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Activity size={20} className="text-slate-400" />
              Detailed Business Report
            </h3>
            <div className="prose prose-slate max-w-none prose-headings:text-slate-800 prose-p:text-slate-600 prose-li:text-slate-600 prose-strong:text-slate-900 prose-sm">
              <ReactMarkdown>{data.infographic.fullNarrative}</ReactMarkdown>
            </div>
          </Card>
        </div>
      )}

      {/* Fallback for Text-only Analysis */}
      {data?.analysis && !data.infographic && (
        <Card className="animate-fade-in border-t-4 border-t-blue-500 p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="size-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Analisis Bisnis</h3>
              <p className="text-xs text-slate-500">Laporan mendalam performa Pasarantar</p>
            </div>
          </div>
          <div className="prose prose-slate max-w-none prose-headings:text-slate-800 prose-p:text-slate-600 prose-li:text-slate-600">
            <ReactMarkdown>{data.analysis}</ReactMarkdown>
          </div>
        </Card>
      )}

      {!data && !loading && (
        <div className="text-center py-24 bg-white rounded-[2rem] border border-dashed border-slate-300 shadow-inner">
          <div className="bg-slate-50 w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-12 group hover:rotate-0 transition-transform duration-500">
            <Activity className="w-12 h-12 text-slate-200 group-hover:text-blue-200" />
          </div>
          <p className="text-xl font-bold text-slate-700">Siap untuk dianalisis, Puh!</p>
          <p className="text-slate-400 mt-2 max-w-xs mx-auto">Klik tombol emas di atas untuk membuat laporan infografik berbasis data aktual.</p>
        </div>
      )}

      {/* Global Disclaimer */}
      {(data?.infographic || data?.analysis) && (
        <div className="pt-4 flex items-center justify-center gap-2 text-sm text-slate-400 italic">
          <AlertCircle className="w-4 h-4" />
          <span>Analisis ini dibuat oleh Deepseek AI. Gunakan sebagai referensi data, bukan saran keuangan mutlak.</span>
        </div>
      )}
    </div>
  );
};