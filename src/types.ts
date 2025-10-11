import { Timestamp } from "@firebase/firestore";
import type { User } from "firebase/auth";

export type Photo = {
  id: string;
  url: string;
  createdAt?: Timestamp | null;
};

export type PhotoDoc = {
  id: string;
  url: string;
  createdAt: Timestamp | null;
  uid?: string;
  storagePath?: string;
  originalName?: string;
  size?: number;
  type?: string;
};

export type AuthCtx = {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
};

export type LightboxProps = {
  open: boolean;
  photos: { url: string; id: string }[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};
