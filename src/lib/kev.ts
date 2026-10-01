import { createServerFn } from "@tanstack/react-start";

export type KevRow = {
  cveId: string;
  vendor: string;
  product: string;
  name: string;
  dateAdded: string;
  dueDate?: string;
  ransomware: boolean;
  description: string;
  action?: string;
};

export type KevFeedOk = {
  ok: true;
  catalogVersion: string;
  dateReleased: string;
  count: number;
  ransomwareCount: number;
  addedThisWeek: number;
  dueSoonCount: number;
  fetchedAt: string;
  stale: boolean;
  source: "cisa" | "mirror";
  rows: KevRow[];
};

export type KevFeedErr = {
  ok: false;
  error: string;
};

export type KevFeed = KevFeedOk | KevFeedErr;

export const getKevFeed = createServerFn({ method: "POST" }).handler(
  async (): Promise<KevFeed> => {
    const { loadKevFeed } = await import("./kev.server.ts");
    return loadKevFeed();
  },
);
