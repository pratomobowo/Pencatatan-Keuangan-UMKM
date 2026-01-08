import { GoogleGenAI } from "@google/genai";
import { Transaction } from "@/lib/types";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey });

export const analyzeBusiness = async (transactions: Transaction[]): Promise<string> => {
  if (transactions.length === 0) {
    return "Belum ada data transaksi untuk dianalisis. Silakan tambahkan pencatatan keuangan Pasarantar Anda terlebih dahulu.";
  }

  // Prepare data summary for the AI to reduce token usage and improve focus
  const summary = transactions.reduce((acc, curr) => {
    if (!acc[curr.type]) acc[curr.type] = 0;
    acc[curr.type] += curr.amount;
    return acc;
  }, {} as Record<string, number>);

  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 50); // Analyze last 50 transactions to keep context manageable

  const prompt = `
    Bertindaklah sebagai konsultan bisnis profesional untuk 'Pasarantar', sebuah bisnis UMKM yang bergerak di bidang penjualan dan pengiriman protein segar (Ikan, Seafood, Ayam, Daging) dari pasar ke rumah pelanggan.
    
    Saya akan memberikan data keuangan ringkas dan daftar transaksi terakhir.
    
    Tugas Anda adalah memberikan analisis spesifik untuk model bisnis "Fresh Food Delivery":
    1. **Analisis Margin & HPP**: Perhatikan rasio antara 'Belanja Pasar' dan Penjualan. Apakah margin cukup sehat untuk menutupi risiko barang busuk (penyusutan)?
    2. **Efisiensi Operasional**: Analisis biaya 'Packaging & Es' serta 'Bensin/Transport'. Apakah biaya pengiriman terlalu tinggi dibandingkan pendapatan Ongkir?
    3. **Saran Strategis**: Berikan ide taktis untuk meningkatkan penjualan (misal: bundling paket seafood) atau penghematan (misal: rute kurir).
    4. Gunakan Bahasa Indonesia yang profesional, menyemangati, dan mudah dimengerti (Format Markdown).
    
    Data Ringkasan:
    ${JSON.stringify(summary, null, 2)}
    
    Daftar Transaksi Terakhir (Maks 50):
    ${JSON.stringify(recentTransactions, null, 2)}
    
    Berikan analisis yang mendalam dan dapat langsung dipraktekkan oleh pemilik Pasarantar.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    return response.text || "Maaf, tidak dapat menghasilkan analisis saat ini.";
  } catch (error) {
    console.error("Error analyzing business:", error);
    return "Terjadi kesalahan saat menghubungi asisten AI. Pastikan koneksi internet Anda lancar.";
  }
};