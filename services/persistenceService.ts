
import { 
  collection, 
  onSnapshot, 
  doc, 
  getDoc, 
  setDoc, 
  deleteDoc, 
  addDoc,
  query,
  DocumentData,
  QuerySnapshot
} from "@firebase/firestore";
import { db } from "../firebase";
import { AppData, TimetableEntry, AttendanceRecord, ScholarshipItem, CampusEvent, ExamSchedule, InternshipItem, Announcement, Complaint } from "../types";
import { INITIAL_DATA } from "../constants";

// Collection Names
export const COLLECTIONS = {
  ATTENDANCE: "attendance",
  TIMETABLE: "timetable",
  SCHOLARSHIPS: "scholarships",
  EVENTS: "events",
  EXAMS: "exams",
  INTERNSHIPS: "internships",
  ANNOUNCEMENTS: "announcements",
  COMPLAINTS: "complaints",
  CONFIG: "config" 
};

/**
 * Sets up a real-time aggregator listener for all campus collections.
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
    { coll: COLLECTIONS.EVENTS, key: 'events' as keyof AppData },
    { coll: COLLECTIONS.EXAMS, key: 'exams' as keyof AppData },
    { coll: COLLECTIONS.INTERNSHIPS, key: 'internships' as keyof AppData },
    { coll: COLLECTIONS.ANNOUNCEMENTS, key: 'announcements' as keyof AppData },
    { coll: COLLECTIONS.COMPLAINTS, key: 'complaints' as keyof AppData },
  ];

  listeners.forEach(({ coll, key }) => {
    const q = query(collection(db, coll));
    const unsub = onSnapshot(q, (snapshot) => handleSnapshot(key, snapshot));
    unsubscribers.push(unsub);
  });

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
 * Saves extracted items to a specific collection.
 */
export async function saveExtractedItems(category: string, items: any[]): Promise<void> {
  const collectionName = mapCategoryToCollection(category);
  if (!collectionName) {
    console.error("Mapping failed for category:", category);
    return;
  }

  console.log(`Saving ${items.length} items to ${collectionName}...`);

  for (const item of items) {
    try {
      const { id, ...data } = item;
      if (id) {
        await setDoc(doc(db, collectionName, id), data);
      } else {
        await addDoc(collection(db, collectionName), data);
      }
    } catch (err) {
      console.error("Firestore Save Error:", err);
    }
  }
}

/**
 * Deletes a specific item from a collection.
 */
export async function deleteItemFromCloud(category: string, id: string): Promise<void> {
  const collectionName = mapCategoryToCollection(category);
  if (!collectionName) return;
  await deleteDoc(doc(db, collectionName, id));
}

/**
 * Updates global campus settings (Map, etc.)
 */
export async function saveGlobalConfig(config: Partial<AppData>): Promise<void> {
  const configDoc = doc(db, COLLECTIONS.CONFIG, "main");
  await setDoc(configDoc, config, { merge: true });
}

/**
 * Map UI/AI categories to Firestore collections.
 */
function mapCategoryToCollection(category: string): string | null {
  const normalized = category.toUpperCase();
  
  if (normalized.includes('TIMETABLE')) return COLLECTIONS.TIMETABLE;
  if (normalized.includes('SCHOLARSHIP')) return COLLECTIONS.SCHOLARSHIPS;
  if (normalized.includes('EVENT')) return COLLECTIONS.EVENTS;
  if (normalized.includes('EXAM')) return COLLECTIONS.EXAMS;
  if (normalized.includes('INTERNSHIP')) return COLLECTIONS.INTERNSHIPS;
  if (normalized.includes('ATTENDANCE')) return COLLECTIONS.ATTENDANCE;
  if (normalized.includes('ANNOUNCEMENT')) return COLLECTIONS.ANNOUNCEMENTS;
  if (normalized.includes('COMPLAINT')) return COLLECTIONS.COMPLAINTS;
  
  return null;
}
