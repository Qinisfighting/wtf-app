import { Timestamp } from "@firebase/firestore";

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
