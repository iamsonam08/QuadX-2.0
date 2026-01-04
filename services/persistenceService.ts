import { AppData } from "../types";
import { INITIAL_DATA } from "../constants";

const SYNC_ID = "quadx_global_store_v2";

// KVDB is excellent for this because keys are auto-created on the first PUT/POST.
// Using a unique bucket for QuadX.
const STORAGE_ENDPOINT = `https://kvdb.io/AnV7G8XqX7qX7qX7qX7qX7/quadx_data_v100`;

/**
 * Fetches the global application data from the shared cloud.
 */
export async function fetchGlobalData(): Promise<AppData> {
  try {
    const response = await fetch(STORAGE_ENDPOINT, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json'
      }
    });
    
    // If the key doesn't exist yet (new app instance), handle gracefully
    if (response.status === 404) {
      console.log("Cloud store is fresh. No data found yet.");
      return getLocalFallback();
    }

    if (!response.ok) throw new Error(`Cloud error: ${response.status}`);
    
    const cloudData = await response.json();
    
    // Validate if the cloud data is a valid QuadX object
    if (cloudData && typeof cloudData === 'object' && cloudData.timetable) {
      localStorage.setItem(SYNC_ID, JSON.stringify(cloudData));
      return cloudData as AppData;
    }
    
    return getLocalFallback();
  } catch (error) {
    console.warn("Global Sync Unavailable (Network Error):", error);
    return getLocalFallback();
  }
}

/**
 * Saves and broadcasts data to all computers running this link.
 * The Admin calls this to "Push" updates to everyone.
 */
export async function saveGlobalData(data: AppData): Promise<boolean> {
  try {
    // 1. Update local storage for the admin's machine
    localStorage.setItem(SYNC_ID, JSON.stringify(data));

    // 2. Push to the public cloud for students to fetch
    const response = await fetch(STORAGE_ENDPOINT, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      console.error(`Broadcast failed: ${response.status}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Critical Connection Error during Broadcast:", error);
    return false;
  }
}

function getLocalFallback(): AppData {
  const local = localStorage.getItem(SYNC_ID);
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      console.warn("Local storage corrupted, resetting...");
      return INITIAL_DATA;
    }
  }
  return INITIAL_DATA;
}
