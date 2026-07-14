// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "").trim(),
  authDomain: (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "").trim(),
  databaseURL: (process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "").trim(),
  projectId: (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "").trim(),
  storageBucket: (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "").trim(),
  messagingSenderId: (process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "").trim(),
  appId: (process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "").trim()
};

// Initialize Firebase with try-catch to prevent app crash if config is missing
let app;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (error) {
  console.error("Firebase initialization error", error);
}

// Initialize services (Realtime Database & Auth)
// Cek URL valid agar tidak muncul FATAL ERROR dari Firebase
const isUrlValid = firebaseConfig.databaseURL && firebaseConfig.databaseURL.startsWith("http");
export const db = app && isUrlValid ? getDatabase(app, firebaseConfig.databaseURL) : null;

// Hindari error "invalid-api-key" jika apiKey kosong (karena kita belum butuh fitur Login)
export const auth = app && firebaseConfig.apiKey ? getAuth(app) : null;
