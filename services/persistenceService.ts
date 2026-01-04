
import { AppData } from "../types";
import { INITIAL_DATA } from "../constants";

// Using a more persistent public JSON storage (jsonblob.com or similar)
// For this app, we'll use a unique key for QuadX Global Sync
const SYNC_ID = "quadx_global_store_v2";
const STORAGE_ENDPOINT = `https://api.npoint.io/d93547190011c0500155`; 

/**
 * Fetches the global application data from the shared cloud.
 */
export async function fetchGlobalData(): Promise<AppData> {
  try {
    const response = await fetch(STORAGE_ENDPOINT, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    if (!response.ok) throw new Error("Cloud bin not found");
    
    const cloudData = await response.json();
    
    // Validate if the cloud data is a valid QuadX object
    if (cloudData && typeof cloudData === 'object' && cloudData.timetable) {
      console.log("Cloud Sync: Success");
      localStorage.setItem(SYNC_ID, JSON.stringify(cloudData));
      return cloudData as AppData;
    }
    
    throw new Error("Invalid cloud data format");
  } catch (error) {
    console.warn("Sync: Falling back to local/initial data", error);
    const local = localStorage.getItem(SYNC_ID);
    return local ? JSON.parse(local) : INITIAL_DATA;
  }
}

/**
 * Saves and broadcasts data to all computers running this link.
 */
export async function saveGlobalData(data: AppData): Promise<boolean> {
  try {
    // 1. Update local storage first
    localStorage.setItem(SYNC_ID, JSON.stringify(data));

    // 2. Broadcast to cloud
    const response = await fetch(STORAGE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      // Some services use PUT for existing bins
      const putResponse = await fetch(STORAGE_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return putResponse.ok;
    }

    return response.ok;
  } catch (error) {
    console.error("Cloud Broadcast Error:", error);
    return false;
  }
}
