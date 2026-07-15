"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Mail, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { auth } from "../../lib/firebase";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signInWithCredential } from "firebase/auth";
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) {
      alert("Firebase Auth belum siap (API Key mungkin salah/kosong).");
      return;
    }

    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Jika berhasil, redirect ke dashboard
      router.push("/");
    } catch (error: any) {
      console.error("Login error:", error);
      alert("Gagal masuk. Periksa kembali email dan kata sandi Anda.");
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) return;
    
    setIsLoading(true);

    try {
      if (Capacitor.isNativePlatform()) {
        // Native Android Google Login
        const result = await FirebaseAuthentication.signInWithGoogle({
          clientId: "636550165234-umteocmiojnvc2n1m3sghd4tlp2pk7oa.apps.googleusercontent.com"
        });
        const idToken = result.credential?.idToken;
        
        if (!idToken) throw new Error("ID Token tidak ditemukan dari Google.");

        // Sign in to Firebase Web SDK with the native token
        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
        router.push("/");
      } else {
        // Web Google Login
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        router.push("/");
      }
    } catch (error: any) {
      console.error("Google Login error:", error);
      alert("Gagal masuk dengan Google: " + error.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Ornaments */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 shadow-2xl mb-4">
            <Activity className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            NusaAI <span className="text-emerald-400 font-light">Finance</span>
          </h1>
          <p className="text-neutral-400 mt-2 text-sm text-center">
            Kelola keuangan cerdas Anda bersama AI. Silakan masuk untuk melanjutkan.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-neutral-900/60 backdrop-blur-xl border border-neutral-800 p-8 rounded-3xl shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-400 mb-2">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-neutral-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  placeholder="anda@email.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-neutral-400">
                  Kata Sandi
                </label>
                <a href="#" className="text-xs text-emerald-400 hover:text-emerald-300">
                  Lupa Sandi?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-neutral-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 mt-6 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-70 disabled:active:scale-100"
            >
              {isLoading ? (
                "Memproses..."
              ) : (
                <>
                  Masuk Sekarang
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex-1 h-px bg-neutral-800"></div>
            <span className="text-xs text-neutral-500 font-medium">ATAU</span>
            <div className="flex-1 h-px bg-neutral-800"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full mt-6 bg-white hover:bg-neutral-200 text-black font-bold py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:active:scale-100"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              <path d="M1 1h22v22H1z" fill="none"/>
            </svg>
            Lanjutkan dengan Google
          </button>

          <div className="mt-8 pt-6 border-t border-neutral-800 text-center">
            <p className="text-sm text-neutral-400">
              Belum punya akun?{" "}
              <Link href="/register" className="text-emerald-400 font-medium hover:underline">
                Daftar Gratis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
