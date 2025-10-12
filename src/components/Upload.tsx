// src/components/Upload.tsx
import { useState, useRef } from "react";
import type { FormEvent } from "react";
import { useAuth } from "../auth/useAuth";
import { uploadPhoto } from "../services/photos";

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useAuth();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;

    setSubmitting(true);
    setError(null);
    setUploadedUrl(null);

    try {
      const { url } = await uploadPhoto(file, user?.uid);
      setUploadedUrl(url);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Upload failed");
    } finally {
      setSubmitting(false);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section className="mb-6  mt-2">
      <div className="mx-auto max-w-[350px] rounded-2xl shadow-md border border-gray-200 bg-white">
        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-4">
          <div>
            <input
              ref={inputRef}
              id="image"
              name="image"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:font-medium file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
            />
            <p className="mt-2 text-xs text-gray-500">
              PNG, JPG, or GIF (max ~10MB)
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          {uploadedUrl && (
            <div className="text-sm text-green-700 break-all">
              Uploaded:{" "}
              <a
                href={uploadedUrl}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Open
              </a>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setError(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="px-4 py-1 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
              disabled={!file || submitting}
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={!file || submitting}
              className="px-4 py-1 rounded-lg bg-[#F74211] text-white hover:bg-[#d63c0e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? "Uploading…" : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
