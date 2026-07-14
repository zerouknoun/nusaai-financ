"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, onValue, update, remove } from 'firebase/database';
import {
  Wallet, TrendingUp, TrendingDown, Activity, Bot, PieChart,
  Home as HomeIcon, Settings, CreditCard, X, LogOut, User, Download, Filter, Edit2, Trash2
} from 'lucide-react';

export default function TransactionsPage() {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Filter state
  const [filterType, setFilterType] = useState('all'); // 'all', 'in', 'out'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Makanan',
    amount: '',
    type: 'out'
  });

  // Cek Status Login menggunakan Firebase Auth
  useEffect(() => {
    if (!auth || !db) {
      setIsCheckingAuth(false);
      return;
    }
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        const { get } = await import("firebase/database");
        const userRef = ref(db as any, `users/${currentUser.uid}`);
        const snapshot = await get(userRef);
        
        if (!snapshot.exists() || !snapshot.val().name) {
          router.push("/profile");
        } else {
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
        const formattedData = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        formattedData.sort((a, b) => b.timestamp - a.timestamp);
        setTransactions(formattedData);
      } else {
        setTransactions([]);
      }
    });

    return () => unsubscribe();
  }, [isCheckingAuth, user]);

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
    }
    router.push("/login");
  };

  const formatRp = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
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

  const handleUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !editId) return;
    
    try {
      await update(ref(db as any, `transactions/${user.uid}/${editId}`), {
        ...formData,
        amount: Number(formData.amount),
      });
      setIsModalOpen(false);
      setEditId(null);
      setFormData({ name: '', category: 'Makanan', amount: '', type: 'out' });
    } catch (error) {
      alert("Gagal menyimpan transaksi.");
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(trx => {
    if (filterType === 'all') return true;
    return trx.type === filterType;
  });

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
              { name: 'Dashboard', icon: HomeIcon, active: false, href: '/' },
              { name: 'Transaksi', icon: CreditCard, active: true, href: '/transaksi' },
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

          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors font-medium">
            <LogOut className="w-5 h-5" />
            Keluar (Logout)
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto relative">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-semibold mb-1">Semua Transaksi</h2>
            <p className="text-sm md:text-base text-neutral-400">Kelola riwayat keuangan Anda</p>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-white bg-neutral-800 rounded-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
          </button>
        </header>

        {/* Filter & Content */}
        <div className="bg-neutral-800/30 backdrop-blur-md border border-neutral-700/50 p-6 rounded-3xl mb-10 min-h-[500px]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div className="flex items-center gap-2 bg-neutral-900 p-1.5 rounded-xl border border-neutral-700">
              <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === 'all' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'}`}>Semua</button>
              <button onClick={() => setFilterType('in')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === 'in' ? 'bg-emerald-500/20 text-emerald-400' : 'text-neutral-400 hover:text-white'}`}>Pemasukan</button>
              <button onClick={() => setFilterType('out')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === 'out' ? 'bg-red-500/20 text-red-400' : 'text-neutral-400 hover:text-white'}`}>Pengeluaran</button>
            </div>
            <div className="flex items-center gap-2 text-neutral-400 text-sm">
              <Filter className="w-4 h-4" />
              Total: {filteredTransactions.length} Data
            </div>
          </div>
          
          <div className="space-y-4">
            {filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-neutral-500">
                <CreditCard className="w-12 h-12 mb-4 opacity-50" />
                <p>Tidak ada transaksi untuk ditampilkan.</p>
              </div>
            ) : filteredTransactions.map((trx) => (
              <div key={trx.id} className="flex justify-between items-center group p-4 bg-neutral-900/50 rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-all">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${trx.type === 'in' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {trx.type === 'in' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-base">{trx.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-1 bg-neutral-800 rounded-md text-neutral-400">{trx.category}</span>
                      <span className="text-xs text-neutral-500">• {new Date(trx.timestamp).toLocaleString('id-ID', {day: 'numeric', month:'short', year:'numeric', hour: '2-digit', minute: '2-digit'})}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-bold text-lg ${trx.type === 'in' ? 'text-emerald-400' : 'text-white'}`}>
                    {trx.type === 'in' ? '+' : '-'} {formatRp(trx.amount)}
                  </span>
                  <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(trx)} className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors" title="Edit"><Edit2 className="w-5 h-5" /></button>
                    <button onClick={() => handleDelete(trx.id)} className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors" title="Hapus"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Modal Edit Transaksi */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-700 w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Edit Transaksi</h3>
              <button onClick={() => { setIsModalOpen(false); setEditId(null); setFormData({ name: '', category: 'Makanan', amount: '', type: 'out' }); }} className="text-neutral-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <form onSubmit={handleUpdateTransaction} className="space-y-4">
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
                Simpan Perubahan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
