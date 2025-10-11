// src/components/Login.tsx
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function Login() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const email = import.meta.env.VITE_FIREBASE_USER_EMAIL as string;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!email)
        throw new Error("Missing configured email for password login.");
      await signInWithEmailAndPassword(auth, email, password);
      // No navigate(): App will re-render to Upload + PhotoWall after auth state changes.
    } catch (err: unknown) {
      type FirebaseAuthError = { code: string };
      const code =
        typeof err === "object" && err !== null && "code" in err
          ? (err as FirebaseAuthError).code
          : "";
      setError(mapFirebaseError(code));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-12 mx-auto w-full lg:w-[1/2]">
      <h2 className="text-xl font-bold mb-6 whitespace-normal text-center m-auto">
        Are you one of the crazy{" "}
        <span className="text-[#F74211] text-3xl">Q</span>s? prove it...
      </h2>

      <form
        className="sm:w-1/2 grid grid-cols-1 sm:grid-cols-[1fr,auto] items-center gap-4 w-full m-auto"
        onSubmit={handleLogin}
      >
        <input
          onFocus={() => setError("")}
          onChange={(e) => setPassword(e.target.value)}
          id="password"
          type="password"
          name="password"
          className="border border-gray-300 rounded px-3 py-2 w-full"
          placeholder="Enter password"
        />
        <button
          type="submit"
          className="bg-[#F74211] text-white rounded px-4 h-[42px] hover:bg-[#d63c0e] transition-colors font-medium"
          disabled={loading}
        >
          {loading ? "ENTERING…" : "ENTER"}
        </button>
        {error && <p className="text-red-500">{error}</p>}
      </form>
    </div>
  );
}

function mapFirebaseError(code: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid PIN";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    default:
      return "Login failed. Please try again.";
  }
}
