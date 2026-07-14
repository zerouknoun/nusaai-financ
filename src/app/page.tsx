"use client";

import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { ref, onValue, push, serverTimestamp } from 'firebase/database';
import {
  Wallet, TrendingUp, TrendingDown, Activity, Bot, PieChart,
  Home as HomeIcon, Settings, CreditCard, Plus, X
} from 'lucide-react';

export default function Home() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Makanan',
    amount: '',
    type: 'out'
  });

  // Ambil data dari Firebase secara Realtime
  useEffect(() => {
    if (!db) return; // Mencegah error jika firebase belum dikonfigurasi dengan benar
    const txRef = ref(db, 'transactions');
    const unsubscribe = onValue(txRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Format object object menjadi array
        const formattedData = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        // Urutkan dari yang terbaru
        formattedData.sort((a, b) => b.timestamp - a.timestamp);
        setTransactions(formattedData);
      } else {
        setTransactions([]);
      }
    });

    return () => unsubscribe();
  }, []);

  // Hitung total saldo, pemasukan, pengeluaran
  const pemasukan = transactions.filter(t => t.type === 'in').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const pengeluaran = transactions.filter(t => t.type === 'out').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const saldo = pemasukan - pengeluaran;

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) {
      alert("Database belum terhubung (cek konfigurasi Firebase di .env.local)");
      return;
    }
    
    try {
      await push(ref(db, 'transactions'), {
        ...formData,
        amount: Number(formData.amount),
        timestamp: Date.now(), // Menggunakan timestamp client sementara
      });
      setIsModalOpen(false);
      setFormData({ name: '', category: 'Makanan', amount: '', type: 'out' });
    } catch (error) {
      console.error("Error adding transaction: ", error);
      alert("Gagal menambah transaksi.");
    }
  };

  // Format ke Rupiah
  const formatRp = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  return (
    <div className="flex h-screen bg-neutral-900 text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-neutral-950 border-r border-neutral-800 p-6 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="flex items-center gap-3 mb-10 text-emerald-400">
            <Activity className="w-8 h-8" />
            <h1 className="text-xl font-bold tracking-tight text-white">NusaAI <span className="text-emerald-400 font-light">Finance</span></h1>
          </div>
          <nav className="space-y-2">
            {[
              { name: 'Dashboard', icon: HomeIcon, active: true },
              { name: 'Transaksi', icon: CreditCard, active: false },
              { name: 'Analisis', icon: PieChart, active: false },
              { name: 'Pengaturan', icon: Settings, active: false },
            ].map((item) => (
              <a key={item.name} href="#" className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${item.active ? 'bg-emerald-500/10 text-emerald-400 font-medium' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'}`}>
                <item.icon className="w-5 h-5" />
                {item.name}
              </a>
            ))}
          </nav>
        </div>
        
        <div className="bg-gradient-to-tr from-emerald-900/40 to-emerald-900/10 p-5 rounded-2xl border border-emerald-800/30">
          <div className="flex items-center gap-3 mb-2">
            <Bot className="text-emerald-400 w-6 h-6" />
            <h3 className="font-semibold">AI Assistant</h3>
          </div>
          <p className="text-xs text-neutral-400 mb-4 leading-relaxed">AI siap menganalisis pola pengeluaran Anda.</p>
          <button className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold rounded-lg text-sm transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            Tanya AI
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-semibold mb-1">Ringkasan Keuangan</h2>
            <p className="text-neutral-400">Terhubung secara realtime dengan Firebase 🔥</p>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-emerald-500 text-neutral-950 px-5 py-2.5 rounded-full font-bold hover:bg-emerald-400 transition-transform active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Plus className="w-5 h-5" />
            Catat Transaksi
          </button>
        </header>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-neutral-800/50 backdrop-blur-xl p-6 rounded-3xl border border-neutral-700/50 hover:bg-neutral-800 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-500/20 text-blue-400 rounded-2xl"><Wallet className="w-6 h-6" /></div>
            </div>
            <p className="text-neutral-400 text-sm mb-1">Total Saldo</p>
            <h3 className="text-3xl font-bold tracking-tight">{formatRp(saldo)}</h3>
          </div>
          <div className="bg-neutral-800/50 backdrop-blur-xl p-6 rounded-3xl border border-neutral-700/50 hover:bg-neutral-800 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl"><TrendingUp className="w-6 h-6" /></div>
            </div>
            <p className="text-neutral-400 text-sm mb-1">Total Pemasukan</p>
            <h3 className="text-3xl font-bold tracking-tight text-emerald-400">{formatRp(pemasukan)}</h3>
          </div>
          <div className="bg-neutral-800/50 backdrop-blur-xl p-6 rounded-3xl border border-neutral-700/50 hover:bg-neutral-800 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-red-500/20 text-red-400 rounded-2xl"><TrendingDown className="w-6 h-6" /></div>
            </div>
            <p className="text-neutral-400 text-sm mb-1">Total Pengeluaran</p>
            <h3 className="text-3xl font-bold tracking-tight text-red-400">{formatRp(pengeluaran)}</h3>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-neutral-800/30 backdrop-blur-md border border-neutral-700/50 p-6 rounded-3xl mb-10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Transaksi Terakhir</h3>
          </div>
          <div className="space-y-5">
            {transactions.length === 0 ? (
              <p className="text-neutral-500 text-center py-5">Belum ada transaksi. Tambahkan sekarang!</p>
            ) : transactions.map((trx) => (
              <div key={trx.id} className="flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${trx.type === 'in' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-700 text-neutral-300'}`}>
                    {trx.type === 'in' ? <TrendingUp className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{trx.name}</h4>
                    <p className="text-xs text-neutral-500">{trx.category} • {new Date(trx.timestamp).toLocaleDateString('id-ID', {day: 'numeric', month:'short'})}</p>
                  </div>
                </div>
                <span className={`font-semibold text-sm ${trx.type === 'in' ? 'text-emerald-400' : 'text-white'}`}>
                  {trx.type === 'in' ? '+' : '-'} {formatRp(trx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modal Tambah Transaksi */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-700 w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Catat Transaksi</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Jenis Transaksi</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setFormData({...formData, type: 'out'})} className={`py-2.5 rounded-xl font-medium transition-colors border ${formData.type === 'out' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-neutral-800 border-transparent text-neutral-400 hover:bg-neutral-700'}`}>Pengeluaran</button>
                  <button type="button" onClick={() => setFormData({...formData, type: 'in'})} className={`py-2.5 rounded-xl font-medium transition-colors border ${formData.type === 'in' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-neutral-800 border-transparent text-neutral-400 hover:bg-neutral-700'}`}>Pemasukan</button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-1">Nama / Keterangan</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-white" placeholder="Contoh: Beli Kopi" />
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-1">Kategori</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-white appearance-none">
                  {formData.type === 'out' ? (
                    <>
                      <option>Makanan & Minuman</option>
                      <option>Transportasi</option>
                      <option>Hiburan</option>
                      <option>Tagihan</option>
                    </>
                  ) : (
                    <>
                      <option>Gaji</option>
                      <option>Bonus</option>
                      <option>Investasi</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm text-neutral-400 mb-1">Nominal (Rp)</label>
                <input required type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-white" placeholder="Contoh: 25000" />
              </div>

              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold py-3.5 rounded-xl mt-4 transition-colors">
                Simpan Transaksi
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
