import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API Key belum dikonfigurasi' }, { status: 500 });
    }

    const { transactions, profile } = await req.json();

    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const prompt = `Anda adalah seorang Konsultan Keuangan Cerdas untuk sebuah aplikasi bernama NusaAI Finance.
Profil Pengguna: ${profile?.name || 'Pengguna'}, Pekerjaan: ${profile?.job || 'Tidak diketahui'}.

Data Transaksi Bulan Ini (JSON):
${JSON.stringify(transactions)}

Tugas Anda:
Berikan analisis singkat dan gaya bahasa yang ramah (seperti ngobrol dengan teman yang jago finansial).
Analisis harus mencakup:
1. Ringkasan Pemasukan vs Pengeluaran.
2. Kebiasaan atau kategori pengeluaran terbesar yang perlu diwaspadai.
3. 2-3 Tips atau Strategi Finansial spesifik yang bisa dilakukan bulan depan berdasarkan data di atas.

Jangan gunakan markdown panjang yang rumit, cukup gunakan paragraf dan list biasa yang rapi. Jangan gunakan tag HTML.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ analysis: text });
  } catch (error: any) {
    console.error("AI Analysis Error:", error);
    return NextResponse.json({ error: 'Gagal menganalisis data' }, { status: 500 });
  }
}
