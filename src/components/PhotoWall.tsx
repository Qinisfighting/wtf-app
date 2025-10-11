/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { deleteObject, ref as storageRef } from "firebase/storage";
import { db, storage } from "../firebase";
import { type Photo } from "../types";

export default function PhotoWall() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    setError(null);

    if (!db) {
      setError("Firestore is not initialized. Check your firebase.ts export.");
      setLoading(false);
      return;
    }

    const q = query(collection(db, "photos"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: Photo[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            url: data.url,
            createdAt: data.createdAt ?? null,
          };
        });
        setPhotos(items);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError(err.message || "Failed to load photos.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  async function handleDelete(p: Photo) {
    if (!p?.id || !p?.url) return;

    const ok = window.confirm("Delete this photo?");
    if (!ok) return;

    setDeletingIds((s) => new Set(s).add(p.id));
    try {
      // Use storageRef with the file path or URL.
      const fileRef = storageRef(storage, p.url);
      await deleteObject(fileRef);

      await deleteDoc(doc(db, "photos", p.id));
    } catch (err: any) {
      console.error(err);
      alert(`Failed to delete: ${err?.message ?? err}`);
    } finally {
      setDeletingIds((s) => {
        const n = new Set(s);
        n.delete(p.id);
        return n;
      });
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Photo Wall</h2>

      {loading && <div className="text-sm text-gray-500">Loading photos…</div>}
      {error && <div className="text-sm text-red-600">Error: {error}</div>}
      {!loading && !error && photos.length === 0 && (
        <div className="text-sm text-gray-500">No photos yet.</div>
      )}

      <div
        className="
          grid gap-3
          [grid-template-columns:repeat(auto-fill,minmax(160px,1fr))]
          sm:[grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]
        "
      >
        {photos.map((p) => {
          const isDeleting = deletingIds.has(p.id);
          return (
            <figure
              key={p.id}
              className="relative group overflow-hidden rounded-lg shadow bg-white"
            >
              <img
                src={p.url}
                alt="Uploaded"
                className="w-full h-44 sm:h-56 object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                loading="lazy"
              />

              <button
                type="button"
                onClick={() => handleDelete(p)}
                disabled={isDeleting}
                aria-label="Delete photo"
                className="
                            absolute top-2 right-2 z-10
                            rounded-md p-0.5 text-sm border shadow
                            bg-white/90
                            opacity-100
                            sm:opacity-0 sm:group-hover:opacity-100
                            group-focus-within:opacity-100 focus:opacity-100 active:opacity-100
                            transition-opacity
                            disabled:opacity-60
                          "
                title={isDeleting ? "Deleting…" : "Delete"}
              >
                🗑️
              </button>

              {p.createdAt && (
                <figcaption className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs px-2 py-1">
                  {p.createdAt.toDate().toLocaleString()}
                </figcaption>
              )}
            </figure>
          );
        })}
      </div>
    </div>
  );
}
