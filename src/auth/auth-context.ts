import { createContext } from "react";
import type { User } from "firebase/auth";

export type AuthCtx = {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthCtx | null>(null);
