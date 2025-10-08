import { useState } from "react";
import { useAuth } from "../auth/useAuth";

type Props = {
  className?: string;
  label?: string;
};

export default function Logout({ className = "", label = "Logout" }: Props) {
  const { user, loading, logout } = useAuth();
  const [busy, setBusy] = useState(false);

  const canClick = !!user && !loading && !busy;

  async function handleClick() {
    if (!canClick) return;
    setBusy(true);
    try {
      await logout(); // AuthProvider will switch UI back to <Login />
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!canClick}
      className={`px-2 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      aria-disabled={!canClick}
    >
      {busy ? "Signing out…" : label}
    </button>
  );
}
