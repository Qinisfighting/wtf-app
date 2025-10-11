import { Timestamp } from "@firebase/firestore-types";

export interface Photo {
  url: string;
  createdAt: Timestamp;
}
