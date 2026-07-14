"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, get, set } from "firebase/database";
import { Activity, User, Briefcase, CheckCircle2 } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [name, setName] = useState("");
  const [job, setJob] = useState("");

  useEffect(() => {
    if (!auth || !db) return;
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
      } else {
        setUser(currentUser);
        // Cek apakah data profil sudah ada di database
        const userRef = ref(db as any, `users/${currentUser.uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data.name) setName(data.name);
          if (data.job) setJob(data.job);
        }
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    
    setIsSaving(true);
    try {
      const userRef = ref(db as any, `users/${user.uid}`);
      await set(userRef, {
        name,
        job,
        email: user.email,
        updatedAt: new Date().toISOString()
      });
      // Setelah simpan, arahkan ke Dashboard
      router.push("/");
    } catch (error) {
      console.error("Gagal menyimpan profil:", error);
      alert("Terjadi kesalahan saat menyimpan profil.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="h-screen w-screen bg-neutral-950 flex items-center justify-center text-emerald-400"><Activity className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-neutral-900 p-5 rounded-full border border-neutral-800 shadow-2xl mb-4 relative group">
            <User className="w-12 h-12 text-emerald-400" />
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <span className="text-[10px] text-white font-medium">Ubah Foto</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Atur <span className="text-emerald-400 font-light">Profil</span>
          </h1>
          <p className="text-neutral-400 mt-2 text-sm text-center px-4">
            Beritahu kami sedikit tentang diri Anda agar AI bisa melayani Anda lebih baik.
          </p>
        </div>

        <div className="bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 p-8 rounded-3xl shadow-2xl">
          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">
                Nama Lengkap / Panggilan
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-neutral-500" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3.5 pl-11 pr-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  placeholder="Nama Anda"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">
                Pekerjaan / Status
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Briefcase className="h-5 w-5 text-neutral-500" />
                </div>
                <input
                  type="text"
                  value={job}
                  onChange={(e) => setJob(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3.5 pl-11 pr-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  placeholder="Mis: Mahasiswa, Freelancer, dll"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 mt-8 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-70 disabled:active:scale-100"
            >
              {isSaving ? (
                "Menyimpan..."
              ) : (
                <>
                  Simpan & Lanjutkan
                  <CheckCircle2 className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
