/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";
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
import { type Photo, type LightboxProps } from "../types";

export default function PhotoWall() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Lightbox state
  const [isLightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

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

  async function handleDelete(p: Photo, e?: React.MouseEvent) {
    e?.stopPropagation(); // don't open lightbox when clicking trash
    if (!p?.id || !p?.url) return;

    const ok = window.confirm("Delete this photo?");
    if (!ok) return;

    setDeletingIds((s) => new Set(s).add(p.id));
    try {
      const fileRef = storageRef(storage, p.url); // works if you stored full URL; best to store storagePath
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

  const openLightboxAt = useCallback((index: number) => {
    setActiveIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);
  const next = useCallback(
    () => setActiveIndex((i) => (photos.length ? (i + 1) % photos.length : i)),
    [photos.length]
  );
  const prev = useCallback(
    () =>
      setActiveIndex((i) =>
        photos.length ? (i - 1 + photos.length) % photos.length : i
      ),
    [photos.length]
  );

  return (
    <div className="p-4 w-full max-w-5xl mx-auto mb-8">
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
        {photos.map((p, idx) => {
          const isDeleting = deletingIds.has(p.id);
          return (
            <figure
              key={p.id}
              className="relative group overflow-hidden rounded-lg shadow bg-white cursor-zoom-in"
              onClick={() => openLightboxAt(idx)}
            >
              <img
                src={p.url}
                alt="Uploaded"
                className="relative z-0 w-full h-44 sm:h-56 object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                loading="lazy"
              />

              <button
                type="button"
                onClick={(e) => handleDelete(p, e)}
                disabled={isDeleting}
                aria-label="Delete photo"
                className="
                  absolute top-2 right-2 z-20
                  rounded-md p-1 text-sm border shadow bg-white/90
                  opacity-100
                  sm:opacity-0 sm:group-hover:opacity-100
                  group-focus-within:opacity-100 focus:opacity-100 active:opacity-100
                  transition-opacity disabled:opacity-60
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

      {/* Lightbox */}
      <Lightbox
        open={isLightboxOpen}
        photos={photos}
        index={activeIndex}
        onClose={closeLightbox}
        onPrev={prev}
        onNext={next}
      />
    </div>
  );
}

function Lightbox({
  open,
  photos,
  index,
  onClose,
  onPrev,
  onNext,
}: LightboxProps) {
  const hasItems = photos && photos.length > 0;
  const safeIndex = Math.min(
    Math.max(index, 0),
    Math.max(photos.length - 1, 0)
  );
  const current = hasItems ? photos[safeIndex] : null;

  // Close on ESC / Navigate with arrows
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, onNext, onPrev]);

  // Basic swipe detection
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null || touchStartY.current == null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX.current;
    const dy = t.clientY - touchStartY.current;

    // Horizontal, with a little vertical tolerance
    if (Math.abs(dx) > 40 && Math.abs(dy) < 60) {
      if (dx < 0) onNext();
      else onPrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  if (!open || !current) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Content */}
      <div
        className="relative z-[101] max-w-[95vw] max-h-[90vh] w-full flex items-center justify-center p-2"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Image */}
        <img
          src={current.url}
          alt=""
          className="w-full h-full object-contain select-none shadow-lg lg:max-h-[80vh]"
          draggable={false}
        />

        {/* Controls */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-6 right-6 rounded-md  p-1 text-sm bg-white/90 border shadow hover:bg-white"
        >
          ✖
        </button>

        {/* Prev / Next arrows (hidden if only one image) */}
        {photos.length > 1 && (
          <>
            <button
              onClick={onPrev}
              aria-label="Previous"
              className="font-bold absolute left-4 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 bg-white/90 border shadow hover:bg-white"
            >
              ‹
            </button>
            <button
              onClick={onNext}
              aria-label="Next"
              className="font-bold absolute right-4 top-1/2 -translate-y-1/2 rounded-full px-2 py-1 bg-white/90 border shadow hover:bg-white"
            >
              ›
            </button>
          </>
        )}
      </div>
    </div>
  );
}
