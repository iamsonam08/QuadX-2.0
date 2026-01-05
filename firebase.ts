
// Fix: Import from @firebase/app and @firebase/firestore directly to resolve compiler errors for missing named exports
import { initializeApp, getApps, getApp } from "@firebase/app";
import { getFirestore } from "@firebase/firestore";

// Firebase configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyD3a1MOzBR33CY3xcKi8Ss2XQuBzW-Br-k",
  authDomain: "quad-x-db161.firebaseapp.com",
  projectId: "quad-x-db161",
  storageBucket: "quad-x-db161.firebasestorage.app",
  messagingSenderId: "977777072612",
  appId: "1:977777072612:web:ba920656ef021a58f3cff1",
  measurementId: "G-JLLB3XL59V"
};

// Initialize Firebase using the Modular SDK pattern
// This avoids the "no export named default" error by using named imports
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Export the Firestore instance using modular getFirestore
export const db = getFirestore(app);
