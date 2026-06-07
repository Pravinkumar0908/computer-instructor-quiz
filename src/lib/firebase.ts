import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const isConfigured = typeof process.env.NEXT_PUBLIC_FIREBASE_API_KEY === "string" && process.env.NEXT_PUBLIC_FIREBASE_API_KEY.trim() !== "";

const firebaseConfig = {
  apiKey: isConfigured ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY : "mock-api-key-for-build",
  authDomain: isConfigured ? process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN : "mock-auth-domain-for-build.firebaseapp.com",
  projectId: isConfigured ? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID : "mock-project-id-for-build",
  storageBucket: isConfigured ? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET : "mock-storage-bucket-for-build.appspot.com",
  messagingSenderId: isConfigured ? process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID : "000000000000",
  appId: isConfigured ? process.env.NEXT_PUBLIC_FIREBASE_APP_ID : "1:000000000000:web:0000000000000000000000",
};

// Initialize Firebase (prevent duplicate initialization in dev hot-reload)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
