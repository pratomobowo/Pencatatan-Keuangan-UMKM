import React, { useState } from 'react';
import { Transaction } from '@/lib/types';
import { analyzeBusiness } from '@/services/geminiService';
import { Card } from './ui/Card';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIAdvisorProps {
  transactions: Transaction[];
}

export const AIAdvisor: React.FC<AIAdvisorProps> = ({ transactions }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/analysis', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data.analysis);
    } catch (err: any) {
      console.error("Analysis Error:", err);
      setError("Gagal mendapatkan analisis AI. Coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-none">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-yellow-300" />
              Konsultan Bisnis AI
            </h2>
            <p className="text-blue-100 opacity-90 max-w-xl">
              Dapatkan wawasan mendalam tentang kesehatan keuangan UMKM Anda menggunakan kecerdasan buatan. Analisis tren, identifikasi kebocoran anggaran, dan temukan peluang keuntungan.
            </p>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="whitespace-nowrap bg-white text-blue-700 hover:bg-blue-50 font-medium py-3 px-6 rounded-lg shadow-lg transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {loading ? 'Menganalisis...' : 'Analisis Sekarang'}
          </button>
        </div>
      </Card>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {analysis && (
        <Card className="animate-fade-in border-t-4 border-t-indigo-500">
          <div className="prose prose-slate max-w-none prose-headings:text-slate-800 prose-p:text-slate-600 prose-li:text-slate-600">
            <ReactMarkdown>{analysis}</ReactMarkdown>
          </div>
          <div className="mt-8 pt-4 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-400 italic">
            <AlertCircle className="w-4 h-4" />
            <span>Analisis ini dibuat oleh AI (Gemini) berdasarkan data yang Anda masukkan. Gunakan sebagai referensi, bukan satu-satunya dasar pengambilan keputusan.</span>
          </div>
        </Card>
      )}

      {!analysis && !loading && (
        <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
          <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-slate-300" />
          </div>
          <p className="font-medium text-slate-600">Belum ada analisis yang ditampilkan.</p>
          <p className="text-sm mt-1">Klik tombol "Analisis Sekarang" di atas untuk memulai.</p>
        </div>
      )}
    </div>
  );
};