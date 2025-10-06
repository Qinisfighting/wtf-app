import { initializeApp } from "firebase/app";
import {
  getAuth,
  //   setPersistence,
  //   browserLocalPersistence,
  //   signInAnonymously,
  //   type UserCredential,
} from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const photosCollection = collection(db, "photos");

// Example function to fetch photos (you can modify as needed)
export async function fetchPhotos() {
  const querySnapshot = await getDocs(photosCollection);
  const photos = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  return photos;
}

// ✅ Ensure persistence + (anon) auth is ready BEFORE any reads
// const authReady: Promise<UserCredential | void> = setPersistence(
//   auth,
//   browserLocalPersistence
// )
//   .then(() => (auth.currentUser ? undefined : signInAnonymously(auth)))
//   .catch((err) => {
//     // If your rules allow public reads, you can ignore; otherwise this will cause reads to fail.
//     console.error("[firebase] Auth init failed:", err);
//   });
