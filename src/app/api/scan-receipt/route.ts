import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API Key belum dikonfigurasi' }, { status: 500 });
    }

    const { imageBase64, mimeType } = await req.json();
    
    if (!imageBase64) {
      return NextResponse.json({ error: 'Tidak ada gambar yang diunggah' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Anda adalah asisten pembaca struk otomatis (OCR) cerdas.
Tugas Anda adalah membaca gambar struk yang diberikan dan mengambil dua informasi utama:
1. Total Harga (amount): Cari nominal akhir/Total dari struk tersebut. Pastikan ini hanya angka mutlak (tanpa titik, tanpa koma, tanpa Rp). Contoh: Jika Rp 50.000, tulis 50000. Jika tidak ada, tulis 0.
2. Kategori (category): Berdasarkan nama toko atau jenis struk, tebak salah satu kategori ini: "Makanan", "Transportasi", "Hiburan", "Tagihan", atau "Lainnya".

Keluarkan hasil ANDA HANYA dalam format JSON persis seperti ini (tanpa backticks, tanpa format markdown, hanya JSON murni):
{"amount": "50000", "category": "Makanan"}`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType || 'image/jpeg' 
        }
      }
    ]);
    
    const response = await result.response;
    let text = response.text().trim();
    
    // Membersihkan format markdown jika model tetap mengembalikannya
    if (text.startsWith('\`\`\`json')) {
      text = text.replace('\`\`\`json', '').replace('\`\`\`', '').trim();
    } else if (text.startsWith('\`\`\`')) {
      text = text.replace('\`\`\`', '').replace('\`\`\`', '').trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch(e) {
      console.error("Gagal parse JSON dari AI:", text);
      parsed = { amount: "0", category: "Lainnya" };
    }

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("AI Scan Error:", error);
    return NextResponse.json({ error: 'Gagal memindai struk' }, { status: 500 });
  }
}
