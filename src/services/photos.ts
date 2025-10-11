// src/services/photos.ts
import {
  addDoc,
  collection,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit as qlimit,
  getDocs,
  startAfter as startAfterFn,
  type QueryDocumentSnapshot,
  type DocumentData,
  doc,
  getDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "../firebase";
import { type PhotoDoc } from "../types";

// export type PhotoDoc = {
//   id: string;
//   url: string;
//   createdAt: Timestamp | null;
//   uid?: string;
//   storagePath?: string;
//   originalName?: string;
//   size?: number;
//   type?: string;
// };

/** Existing upload — unchanged */
export async function uploadPhoto(file: File, userId: string | undefined) {
  const uid = userId ?? "anonymous";
  const ext = file.name.split(".").pop() ?? "bin";
  const objectPath = `photos/${uid}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const objectRef = storageRef(storage, objectPath);
  await uploadBytes(objectRef, file);

  const url = await getDownloadURL(objectRef);

  const docRef = await addDoc(collection(db, "photos"), {
    url,
    createdAt: serverTimestamp(),
    uid,
    storagePath: objectPath,
    originalName: file.name,
    size: file.size,
    type: file.type,
  });

  return { id: docRef.id, url };
}

/** Fetch photos (optionally just for one user) with pagination */
export async function fetchPhotos(opts?: {
  userId?: string; // filter by owner (optional)
  pageSize?: number; // default 20
  after?: QueryDocumentSnapshot<DocumentData> | null; // pagination cursor
}) {
  const { userId, pageSize = 20, after = null } = opts ?? {};

  const col = collection(db, "photos");
  // Order by createdAt desc; add where(uid==...) if provided
  let q = query(col, orderBy("createdAt", "desc"), qlimit(pageSize));

  if (userId) {
    q = query(
      col,
      where("uid", "==", userId),
      orderBy("createdAt", "desc"),
      qlimit(pageSize)
    );
  }

  if (after) {
    q = query(q, startAfterFn(after));
  }

  const snap = await getDocs(q);

  const items: PhotoDoc[] = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      url: data.url as string,
      createdAt: (data.createdAt as Timestamp) ?? null,
      uid: data.uid as string | undefined,
      storagePath: data.storagePath as string | undefined,
      originalName: data.originalName as string | undefined,
      size: data.size as number | undefined,
      type: data.type as string | undefined,
    };
  });

  const cursor = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;

  return {
    items,
    cursor, // pass this back into fetchPhotos({ after: cursor })
    hasMore: snap.size === pageSize,
  };
}

/** Delete a photo by document id (removes Storage object first, then Firestore doc) */
export async function deletePhoto(docId: string) {
  const docRef = doc(db, "photos", docId);
  const snap = await getDoc(docRef);

  if (!snap.exists()) {
    // nothing to do
    return;
  }

  const data = snap.data();
  const path = data.storagePath as string | undefined;

  // 1) Try delete storage object (ignore if already gone)
  if (path) {
    try {
      await deleteObject(storageRef(storage, path));
    } catch (err: unknown) {
      if (
        !(
          typeof err === "object" &&
          err !== null &&
          "code" in err &&
          (err as { code?: string }).code === "storage/object-not-found"
        )
      ) {
        throw err;
      }
    }
  }

  // 2) Remove the Firestore document
  await deleteDoc(docRef);
}
