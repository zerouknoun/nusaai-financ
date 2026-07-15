"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Capacitor, registerPlugin } from '@capacitor/core';
const WidgetPlugin = registerPlugin<any>('WidgetPlugin');
import { Preferences } from '@capacitor/preferences';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, onValue, push, update, remove } from 'firebase/database';
import {
  Wallet, TrendingUp, TrendingDown, Activity, Bot, PieChart,
  Home as HomeIcon, Settings, CreditCard, Plus, X, LogOut, User, Download, Edit2, Trash2
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Makanan',
    amount: '',
    type: 'out'
  });
  const [editId, setEditId] = useState<string | null>(null);

  // State AI
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // State PWA Install
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // PWA Install Prompt Listener
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("Sistem otomatis belum siap atau Anda menggunakan browser yang butuh cara manual (seperti Safari di iPhone).\n\nCara Manual:\n- iPhone (Safari): Tekan tombol 'Share' (Bagikan) di bawah layar, lalu pilih 'Add to Home Screen' (Tambahkan ke Layar Utama).\n- Android/Chrome: Tekan ikon titik tiga di kanan atas browser, lalu pilih 'Install App' atau 'Add to Home Screen'.");
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  // Cek Status Login menggunakan Firebase Auth
  useEffect(() => {
    if (!auth || !db) {
      setIsCheckingAuth(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        // Jika belum login, redirect ke /login
        router.push("/login");
      } else {
        setUser(currentUser);
        // Cek apakah pengguna sudah memiliki profil di database
        const { get } = await import("firebase/database");
        const userRef = ref(db as any, `users/${currentUser.uid}`);
        const snapshot = await get(userRef);
        
        if (!snapshot.exists() || !snapshot.val().name) {
          // Pengguna baru atau belum mengatur profil, lempar ke /profile
          router.push("/profile");
        } else {
          // Pengguna lama, simpan data profil dan izinkan masuk
          setProfile(snapshot.val());
          setIsCheckingAuth(false);
        }
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Ambil data dari Firebase secara Realtime
  useEffect(() => {
    if (!db || isCheckingAuth || !user) return; 
    const txRef = ref(db as any, `transactions/${user.uid}`);
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
  }, [isCheckingAuth, user]);

  // Hitung total saldo, pemasukan, pengeluaran
  const pemasukan = transactions.filter(t => t.type === 'in').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const pengeluaran = transactions.filter(t => t.type === 'out').reduce((acc, curr) => acc + Number(curr.amount), 0);
  const saldo = pemasukan - pengeluaran;

  // Simpan data ke Capacitor Preferences (Android SharedPreferences) untuk dibaca Widget
  useEffect(() => {
    const saveToPreferences = async () => {
      try {
        await Preferences.set({ key: 'widget_is_logged_in', value: 'true' });
        await Preferences.set({ key: 'widget_saldo', value: saldo.toString() });
        await Preferences.set({ key: 'widget_pemasukan', value: pemasukan.toString() });
        await Preferences.set({ key: 'widget_pengeluaran', value: pengeluaran.toString() });
        
        if (Capacitor.isNativePlatform()) {
          try {
            await WidgetPlugin.updateWidget();
          } catch(e) {
            console.error("Widget update error", e);
          }
        }
      } catch (e) {
        console.error('Failed to save to Preferences', e);
      }
    };
    if (!isCheckingAuth && user) {
      saveToPreferences();
    }
  }, [saldo, pemasukan, pengeluaran, isCheckingAuth, user]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db) {
      alert("Database belum terhubung (cek konfigurasi Firebase di .env.local)");
      return;
    }
    
    try {
      if (editId) {
        await update(ref(db as any, `transactions/${user.uid}/${editId}`), {
          ...formData,
          amount: Number(formData.amount),
        });
      } else {
        await push(ref(db as any, `transactions/${user.uid}`), {
          ...formData,
          amount: Number(formData.amount),
          timestamp: Date.now(), // Menggunakan timestamp client sementara
        });
      }
      setIsModalOpen(false);
      setEditId(null);
      setFormData({ name: '', category: 'Makanan', amount: '', type: 'out' });
    } catch (error) {
      console.error("Error adding transaction: ", error);
      alert("Gagal menyimpan transaksi.");
    }
  };

  const handleEdit = (trx: any) => {
    setFormData({
      name: trx.name,
      category: trx.category,
      amount: trx.amount.toString(),
      type: trx.type
    });
    setEditId(trx.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
      try {
        await remove(ref(db as any, `transactions/${user.uid}/${id}`));
      } catch (error) {
        alert("Gagal menghapus transaksi.");
      }
    }
  };

  // Format ke Rupiah
  const formatRp = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
  };

  const handleLogout = async () => {
    try {
      await Preferences.set({ key: 'widget_is_logged_in', value: 'false' });
      await Preferences.set({ key: 'widget_saldo', value: '0' });
      await Preferences.set({ key: 'widget_pemasukan', value: '0' });
      await Preferences.set({ key: 'widget_pengeluaran', value: '0' });
      
      if (Capacitor.isNativePlatform()) {
        try {
          await WidgetPlugin.updateWidget();
        } catch(e) {
          console.error("Widget update error", e);
        }
      }
    } catch (e) {
      console.error(e);
    }
    
    if (auth) {
      await signOut(auth);
    }
    router.push("/login");
  };

  // Handler AI
  const handleAnalyze = async () => {
    setIsAiModalOpen(true);
    setIsAnalyzing(true);
    setAiAnalysis("");
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions, profile })
      });
      const data = await response.json();
      if (data.analysis) {
        setAiAnalysis(data.analysis);
      } else {
        setAiAnalysis(data.error || "Gagal mendapatkan analisis dari AI.");
      }
    } catch (e) {
      setAiAnalysis("Terjadi kesalahan jaringan saat menghubungi AI.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        
        const response = await fetch('/api/scan-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType: file.type })
        });
        const data = await response.json();
        
        if (data.amount) {
          setFormData(prev => ({
            ...prev,
            amount: data.amount,
            category: data.category || prev.category,
            type: 'out',
            name: 'Pindai Struk Otomatis'
          }));
        } else {
          alert("Gagal memindai struk. " + (data.error || ""));
        }
        setIsScanning(false);
      };
    } catch (err) {
      console.error(err);
      alert("Error memindai struk.");
      setIsScanning(false);
    }
  };

  // Tampilkan layar kosong saat sedang mengecek login untuk menghindari efek berkedip
  if (isCheckingAuth) {
    return <div className="h-screen w-screen bg-neutral-950"></div>;
  }

  return (
    <div className="flex h-screen bg-neutral-900 text-white font-sans overflow-hidden">
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" />
      )}
      
      {/* Sidebar */}
      <aside className={`w-64 bg-neutral-950 border-r border-neutral-800 p-6 flex flex-col justify-between fixed md:relative z-50 h-full transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div>
          <div className="flex items-center gap-3 mb-10 text-emerald-400">
            <Activity className="w-8 h-8" />
            <h1 className="text-xl font-bold tracking-tight text-white">NusaAI <span className="text-emerald-400 font-light">Finance</span></h1>
          </div>
          <nav className="space-y-2">
            {[
              { name: 'Dashboard', icon: HomeIcon, active: true, href: '/' },
              { name: 'Transaksi', icon: CreditCard, active: false, href: '/transaksi' },
              { name: 'Profil', icon: User, active: false, href: '/profile' },
              { name: 'Pengaturan', icon: Settings, active: false, href: '#' },
            ].map((item) => (
              <a key={item.name} href={item.href} className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${item.active ? 'bg-emerald-500/10 text-emerald-400 font-medium' : 'text-neutral-400 hover:bg-neutral-900 hover:text-white'}`}>
                <item.icon className="w-5 h-5" />
                {item.name}
              </a>
            ))}
          </nav>
        </div>
        
        <div className="mt-auto">
          {profile && (
            <div className="flex items-center gap-3 px-4 py-3 mb-4 bg-neutral-900/50 rounded-xl border border-neutral-800">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                {profile.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{profile.name}</p>
                <p className="text-xs text-neutral-400">{profile.job || 'Pengguna NusaAI'}</p>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-tr from-emerald-900/40 to-emerald-900/10 p-5 rounded-2xl border border-emerald-800/30 mb-4">
            <div className="flex items-center gap-3 mb-2">
              <Bot className="text-emerald-400 w-6 h-6" />
              <h3 className="font-semibold">AI Assistant</h3>
            </div>
            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">AI siap menganalisis pola pengeluaran Anda.</p>
            <button onClick={handleAnalyze} className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold rounded-lg text-sm transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              Tanya AI
            </button>
          </div>
          
          <button onClick={handleInstallClick} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors font-medium mb-4 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <Download className="w-5 h-5" />
            Install Aplikasi
          </button>

          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-medium">
            <LogOut className="w-5 h-5" />
            Keluar (Logout)
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div className="flex justify-between items-center w-full md:w-auto">
            <div>
              <h2 className="text-3xl font-semibold mb-1">Ringkasan</h2>
              <p className="text-sm md:text-base text-neutral-400">Terhubung secara realtime 🔥</p>
            </div>
            <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-white bg-neutral-800 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
            </button>
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
                <div className="flex items-center gap-4">
                  <span className={`font-semibold text-sm ${trx.type === 'in' ? 'text-emerald-400' : 'text-white'}`}>
                    {trx.type === 'in' ? '+' : '-'} {formatRp(trx.amount)}
                  </span>
                  <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(trx)} className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded-md transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(trx.id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-md transition-colors" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
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
              <h3 className="text-xl font-bold">{editId ? 'Edit Transaksi' : 'Catat Transaksi'}</h3>
              <button onClick={() => { setIsModalOpen(false); setEditId(null); setFormData({ name: '', category: 'Makanan', amount: '', type: 'out' }); }} className="text-neutral-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            {/* AI Scanner Button */}
            <div className="mb-6 p-4 bg-gradient-to-r from-emerald-900/40 to-blue-900/40 border border-emerald-500/20 rounded-xl relative overflow-hidden">
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-emerald-400 text-sm flex items-center gap-2">
                    <Bot className="w-4 h-4" /> AI Scanner Struk
                  </h4>
                  <p className="text-xs text-neutral-400 mt-1">Otomatis baca struk Anda.</p>
                </div>
                <label className="cursor-pointer bg-emerald-500 text-black px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-400 transition-colors">
                  {isScanning ? 'Membaca...' : 'Upload Foto'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleScanReceipt} disabled={isScanning} />
                </label>
              </div>
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
                {editId ? 'Simpan Perubahan' : 'Simpan Transaksi'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal AI Analysis */}
      {isAiModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-700 w-full max-w-2xl rounded-3xl p-6 md:p-8 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400"><Bot className="w-6 h-6" /></div>
                <h3 className="text-xl font-bold">NusaAI Financial Advisor</h3>
              </div>
              <button onClick={() => setIsAiModalOpen(false)} className="text-neutral-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 text-sm md:text-base text-neutral-300 leading-relaxed whitespace-pre-wrap">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <Activity className="w-8 h-8 text-emerald-400 animate-spin" />
                  <p className="text-neutral-400 animate-pulse">Sedang menganalisis kebiasaan finansial Anda...</p>
                </div>
              ) : (
                aiAnalysis
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
