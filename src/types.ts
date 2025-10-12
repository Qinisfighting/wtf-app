import { Timestamp } from "@firebase/firestore";
import type { User } from "firebase/auth";

export type Photo = {
  id: string;
  url: string;
  variants?: {
    w320?: string;
    w640?: string;
    w1024?: string;
    w1600?: string;
  };
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
  variants?: {
    w320?: string;
    w640?: string;
    w1024?: string;
    w1600?: string;
  };
};

export type AuthCtx = {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
};

export type LightboxProps = {
  open: boolean;
  photos: {
    variants?: {
      w320?: string;
      w640?: string;
      w1024?: string;
      w1600?: string;
    };
    url: string;
    id: string;
  }[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};
