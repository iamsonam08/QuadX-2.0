
// Fix: Import from @firebase/firestore directly to ensure modular exports are found by the compiler
import { doc, onSnapshot, getDoc, setDoc } from "@firebase/firestore";
import { db } from "../firebase";
import { AppData } from "../types";
import { INITIAL_DATA } from "../constants";

const SYNC_ID = "quadx_v4_firebase_sync";

/**
 * Sets up a real-time listener for the global campus data.
 * Adopts Modular SDK (v9+) syntax for robust real-time synchronization.
 */
export function subscribeToGlobalData(onUpdate: (data: AppData) => void): () => void {
  // Create a document reference using the modular doc() function
  const docRef = doc(db, "quadx", "main");
  
  // onSnapshot is now a top-level function in the modular SDK
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const cloudData = docSnap.data() as AppData;
      if (cloudData && typeof cloudData === 'object' && Array.isArray(cloudData.timetable)) {
        localStorage.setItem(SYNC_ID, JSON.stringify(cloudData));
        onUpdate(cloudData);
      }
    } else {
      console.log("Sync: No remote data found. Using local or initial data.");
      onUpdate(getLocalFallback());
    }
  }, (error) => {
    console.error("Firestore Subscription Error:", error);
  });
}

/**
 * Fetches the latest campus data from Firebase Firestore (One-time fetch).
 */
export async function fetchGlobalData(): Promise<AppData> {
  try {
    const docRef = doc(db, "quadx", "main");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const cloudData = docSnap.data() as AppData;
      if (cloudData && typeof cloudData === 'object' && Array.isArray(cloudData.timetable)) {
        localStorage.setItem(SYNC_ID, JSON.stringify(cloudData));
        return cloudData;
      }
    }
    return getLocalFallback();
  } catch (error) {
    console.error("Critical Cloud Fetch Error:", error);
    return getLocalFallback();
  }
}

/**
 * Broadcasts data to every student computer via Firebase.
 */
export async function saveGlobalData(data: AppData): Promise<boolean> {
  try {
    localStorage.setItem(SYNC_ID, JSON.stringify(data));
    const docRef = doc(db, "quadx", "main");
    // setDoc is used for one-time writes in the modular SDK
    await setDoc(docRef, data);
    console.log("Global Broadcast: Deployment Successful via Firebase! 🔥");
    return true;
  } catch (error) {
    console.error("Broadcast: Firebase Connection Failed.", error);
    return false;
  }
}

function getLocalFallback(): AppData {
  const local = localStorage.getItem(SYNC_ID);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (parsed && typeof parsed === 'object' && parsed.timetable) {
        return parsed;
      }
    } catch (e) {
      console.warn("Local storage cache is corrupted.");
    }
  }
  return INITIAL_DATA;
}
