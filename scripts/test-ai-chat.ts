
const testChat = async () => {
    console.log("🧪 Memulai pengetesan Chatbot AI Pasarantar...");

    const messages = [
        { role: 'user', content: 'Halo, saya mau nanya soal ikan tuna.' }
    ];

    try {
        const response = await fetch('http://localhost:3000/api/ai/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ messages }),
        });

        const data = await response.json();

        if (response.ok) {
            console.log("✅ Berhasil mendapatkan respon!");
            console.log("🤖 AI Response:", data.response);
        } else {
            console.error("❌ Gagal mendapatkan respon:", data.error);
            if (data.error === "Konfigurasi AI belum lengkap.") {
                console.warn("⚠️  Saran: Pastikan ARK_API_KEY sudah terpasang di .env dan server sudah di-restart.");
            }
        }
    } catch (error) {
        console.error("❌ Terjadi kesalahan saat fetch:", error);
        console.warn("⚠️  Pastikan server development (npm run dev) sedang berjalan.");
    }
};

testChat();
