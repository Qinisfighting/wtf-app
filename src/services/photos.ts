import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, storage } from "../firebase";

export async function uploadPhoto(file: File, userId: string | undefined) {
  const uid = userId ?? "anonymous";
  const ext = file.name.split(".").pop() ?? "bin";
  const objectPath = `photos/${uid}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  // 1) Upload to Storage
  const objectRef = ref(storage, objectPath);
  await uploadBytes(objectRef, file);

  // 2) Get public download URL
  const url = await getDownloadURL(objectRef);

  // 3) Save Firestore doc with url + createdAt
  const docRef = await addDoc(collection(db, "photos"), {
    url,
    createdAt: serverTimestamp(),
    uid, // optional: helps querying per user
    storagePath: objectPath, // optional: handy for deletes
    originalName: file.name, // optional metadata
    size: file.size, // optional
    type: file.type, // optional
  });

  return { id: docRef.id, url };
}
