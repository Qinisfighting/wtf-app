import { useState } from "react";
import { useAuth } from "../auth/useAuth";
import logoutIcon from "../assets/logout.png";

type Props = {
  className?: string;
  size?: number; // px
  title?: string;
};

export default function Logout({
  className = "",
  size = 32,
  title = "Sign out",
}: Props) {
  const { user, loading, logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const canClick = !!user && !loading && !busy;

  async function handleClick() {
    if (!canClick) return;
    setBusy(true);
    try {
      await logout();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!canClick}
      className={`mx-auto my-6 cursor-pointer rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:translate-x-1 ${className}`}
      aria-label={title}
      title={title}
    >
      {/* Hide from screen readers since we have aria-label above */}
      <img
        src={logoutIcon}
        alt=""
        aria-hidden="true"
        style={{ width: size, height: size }}
        className={busy ? "animate-pulse" : ""}
      />
      <span className="sr-only">{title}</span>
    </button>
  );
}
