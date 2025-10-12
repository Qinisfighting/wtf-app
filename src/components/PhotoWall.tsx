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
      <h2 className="font-kirang text-3xl font-light text-left ml-4 text-stone-600 mb-4">
        what the . . . ?
      </h2>

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
                  border-0 bg-none
                  opacity-100
                  sm:opacity-0 sm:group-hover:opacity-100
                  group-focus-within:opacity-100 focus:opacity-100 active:opacity-100
                  transition-opacity disabled:opacity-60
                "
                title={isDeleting ? "Deleting…" : "Delete"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={24}
                  height={24}
                  viewBox="0 0 24 24"
                >
                  <path
                    fill="#fff"
                    fillRule="evenodd"
                    d="m6.774 6.4l.812 13.648a.8.8 0 0 0 .798.752h7.232a.8.8 0 0 0 .798-.752L17.226 6.4h1.203l-.817 13.719A2 2 0 0 1 15.616 22H8.384a2 2 0 0 1-1.996-1.881L5.571 6.4zM9.5 9h1.2l.5 9H10zm3.8 0h1.2l-.5 9h-1.2zM4.459 2.353l15.757 2.778a.5.5 0 0 1 .406.58L20.5 6.4L3.758 3.448l.122-.69a.5.5 0 0 1 .579-.405m6.29-1.125l3.94.695a.5.5 0 0 1 .406.58l-.122.689l-4.924-.869l.122-.689a.5.5 0 0 1 .579-.406z"
                  ></path>
                </svg>
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
        className="relative z-[101] max-w-[92vw] max-h-[90vh] w-full flex items-center justify-center"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Image */}
        <img
          src={current.url}
          alt=""
          className="w-full h-full object-contain select-none  lg:max-h-[80vh]"
          draggable={false}
        />

        {/* Controls */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-6 right-6  border-0 bg-none cursor:pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={14}
            height={14}
            viewBox="0 0 14 14"
          >
            <path
              fill="#fff"
              fillRule="evenodd"
              d="M1.707.293A1 1 0 0 0 .293 1.707L5.586 7L.293 12.293a1 1 0 1 0 1.414 1.414L7 8.414l5.293 5.293a1 1 0 0 0 1.414-1.414L8.414 7l5.293-5.293A1 1 0 0 0 12.293.293L7 5.586z"
              clipRule="evenodd"
            ></path>
          </svg>
        </button>

        {/* Prev / Next arrows (hidden if only one image) */}
        {photos.length > 1 && (
          <>
            <button
              onClick={onPrev}
              aria-label="Previous"
              className="absolute left-6 top-1/2 -translate-y-1/2  border-0 bg-none cursor:pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={20}
                height={20}
                viewBox="0 0 24 24"
              >
                <path
                  fill="#fff"
                  d="M12.727 3.687a1 1 0 1 0-1.454-1.374l-8.5 9a1 1 0 0 0 0 1.374l8.5 9.001a1 1 0 1 0 1.454-1.373L4.875 12z"
                ></path>
              </svg>
            </button>
            <button
              onClick={onNext}
              aria-label="Next"
              className="absolute right-6 top-1/2 -translate-y-1/2  border-0 bg-none cursor:pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={20}
                height={20}
                viewBox="0 0 24 24"
              >
                <path
                  fill="#fff"
                  transform="translate(24 0) scale(-1 1)"
                  d="M12.727 3.687a1 1 0 1 0-1.454-1.374l-8.5 9a1 1 0 0 0 0 1.374l8.5 9.001a1 1 0 1 0 1.454-1.373L4.875 12z"
                />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
