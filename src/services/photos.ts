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
  type UploadMetadata,
} from "firebase/storage";
import { db, storage } from "../firebase";
import { type PhotoDoc } from "../types";

/** A stable content hash for filenames to cache immutably. */
async function hashFile(file: File): Promise<string> {
  try {
    const buf = await file.arrayBuffer();
    const digest = await crypto.subtle.digest("SHA-1", buf);
    const bytes = Array.from(new Uint8Array(digest));
    return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return `ts-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .slice(2)}`;
  }
}

/** Normalize extension from filename or contentType. */
function detectExt(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName) return fromName;
  const ct = (file.type || "").toLowerCase();
  if (ct.includes("jpeg")) return "jpg";
  if (ct.includes("png")) return "png";
  if (ct.includes("webp")) return "webp";
  if (ct.includes("avif")) return "avif";
  return "bin";
}

/** Upload a photo with long-lived, immutable cache headers. */
export async function uploadPhoto(file: File, userId: string | undefined) {
  const uid = userId ?? "anonymous";
  const ext = detectExt(file);
  const fileHash = await hashFile(file);

  // Cache-safe, content-addressed path
  const objectPath = `photos/${uid}/${fileHash}.${ext}`;
  const objectRef = storageRef(storage, objectPath);

  const metadata: UploadMetadata = {
    cacheControl: "public, max-age=31536000, immutable",
    contentType: file.type || undefined,
  };

  await uploadBytes(objectRef, file, metadata);
  const url = await getDownloadURL(objectRef);

  // Define the write-shape so TypeScript doesn’t force a Timestamp here.
  const newDoc: Omit<PhotoDoc, "id" | "createdAt"> & { createdAt: unknown } = {
    url,
    createdAt: serverTimestamp(), // FieldValue on write; will be Timestamp on read
    uid,
    storagePath: objectPath,
    originalName: file.name,
    size: file.size,
    type: file.type,
    // variants: { w320: "", w640: "", w1024: "", w1600: "" }, // if/when you have them
  };

  const docRef = await addDoc(collection(db, "photos"), newDoc);
  return { id: docRef.id, url };
}

/** Fetch photos (optionally just for one user) with pagination */
export async function fetchPhotos(opts?: {
  userId?: string;
  pageSize?: number; // default 20
  after?: QueryDocumentSnapshot<DocumentData> | null;
}) {
  const { userId, pageSize = 20, after = null } = opts ?? {};

  const col = collection(db, "photos");
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
      variants: (data.variants ?? undefined) as
        | PhotoDoc["variants"]
        | undefined,
    };
  });

  const cursor = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;

  return {
    items,
    cursor,
    hasMore: snap.size === pageSize,
  };
}

/** Delete a photo by document id (removes Storage object first, then Firestore doc) */
export async function deletePhoto(docId: string) {
  const docRef = doc(db, "photos", docId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;

  const data = snap.data();
  const path = data.storagePath as string | undefined;

  if (path) {
    try {
      await deleteObject(storageRef(storage, path));
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code !== "storage/object-not-found") throw err;
    }
  }

  await deleteDoc(docRef);
}
