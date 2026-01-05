
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  DocumentData,
  QuerySnapshot
} from "@firebase/firestore";
import { db } from "../firebase";
import { AppData } from "../types";
import { INITIAL_DATA } from "../constants";

// Collection Names - Aligned with requested architecture
export const COLLECTIONS = {
  ATTENDANCE: "attendance",
  TIMETABLE: "timetable",
  SCHOLARSHIPS: "scholarships",
  EXAMS: "exam_notices",
  INTERNSHIPS: "internships",
  BROADCASTS: "broadcasts",
  COMPLAINTS: "complaints",
  CONFIG: "config" 
};

/**
 * Recursively removes undefined values from an object.
 * Firestore does not support 'undefined', only 'null' or omitting the field.
 */
function cleanData(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => cleanData(v));
  } else if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => [k, cleanData(v)])
    );
  }
  return obj;
}

/**
 * Sets up real-time listeners for all categorized collections.
 */
export function subscribeToGlobalData(onUpdate: (data: AppData) => void): () => void {
  const state: AppData = { ...INITIAL_DATA };
  const unsubscribers: (() => void)[] = [];

  const handleSnapshot = (key: keyof AppData, snapshot: QuerySnapshot<DocumentData>) => {
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    (state[key] as any) = items;
    onUpdate({ ...state });
  };

  const listeners = [
    { coll: COLLECTIONS.ATTENDANCE, key: 'attendance' as keyof AppData },
    { coll: COLLECTIONS.TIMETABLE, key: 'timetable' as keyof AppData },
    { coll: COLLECTIONS.SCHOLARSHIPS, key: 'scholarships' as keyof AppData },
    { coll: COLLECTIONS.EXAMS, key: 'exams' as keyof AppData },
    { coll: COLLECTIONS.INTERNSHIPS, key: 'internships' as keyof AppData },
    { coll: COLLECTIONS.BROADCASTS, key: 'broadcasts' as keyof AppData },
    { coll: COLLECTIONS.COMPLAINTS, key: 'complaints' as keyof AppData },
  ];

  listeners.forEach(({ coll, key }) => {
    const q = query(collection(db, coll), orderBy("uploadedAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => handleSnapshot(key, snapshot), (err) => {
      // Fallback if index isn't created yet or order fails
      onSnapshot(collection(db, coll), (snapshot) => handleSnapshot(key, snapshot));
    });
    unsubscribers.push(unsub);
  });

  // Config listener for Map/Global Settings
  const configDoc = doc(db, COLLECTIONS.CONFIG, "main");
  const unsubConfig = onSnapshot(configDoc, (snap) => {
    if (snap.exists()) {
      const config = snap.data();
      state.campusMapImage = config.campusMapImage;
      state.rawKnowledge = config.rawKnowledge || [];
      onUpdate({ ...state });
    }
  });
  unsubscribers.push(unsubConfig);

  return () => unsubscribers.forEach(u => u());
}

/**
 * Saves items to a specific collection with mandatory metadata.
 */
export async function saveCategorizedItems(collectionName: string, items: any[]): Promise<void> {
  console.log(`Routing ${items.length} items to collection: ${collectionName}`);

  for (const item of items) {
    try {
      const { id, ...data } = item;
      const finalData = cleanData({
        ...data,
        uploadedAt: serverTimestamp(),
        uploadedBy: "admin"
      });

      if (id) {
        await setDoc(doc(db, collectionName, id), finalData);
      } else {
        await addDoc(collection(db, collectionName), finalData);
      }
    } catch (err) {
      console.error("Firestore Save Error:", err);
    }
  }
}

/**
 * Deletes a specific item from a collection.
 */
export async function deleteItemFromCloud(collectionName: string, id: string): Promise<void> {
  await deleteDoc(doc(db, collectionName, id));
}

/**
 * Updates global campus settings.
 */
export async function saveGlobalConfig(config: Partial<AppData>): Promise<void> {
  const configDoc = doc(db, COLLECTIONS.CONFIG, "main");
  await setDoc(configDoc, cleanData(config), { merge: true });
}
