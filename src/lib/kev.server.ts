import type { KevFeed, KevRow } from "./kev";

const SOURCES: { url: string; source: "cisa" | "mirror" }[] = [
  {
    url: "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json",
    source: "cisa",
  },
  {
    url: "https://raw.githubusercontent.com/cisagov/kev-data/develop/known_exploited_vulnerabilities.json",
    source: "mirror",
  },
  {
    url: "https://raw.githubusercontent.com/aboutcode-org/aboutcode-mirror-kev/main/known_exploited_vulnerabilities.json",
    source: "mirror",
  },
];

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

const CACHE_TTL_MS = 2 * 60 * 1000;
const DUE_SOON_DAYS = 14;

type RawEntry = {
  cveID?: string;
  vendorProject?: string;
  product?: string;
  vulnerabilityName?: string;
  dateAdded?: string;
  shortDescription?: string;
  requiredAction?: string;
  dueDate?: string;
  knownRansomwareCampaignUse?: string;
};

type RawFeed = {
  catalogVersion?: string;
  dateReleased?: string;
  count?: number;
  vulnerabilities?: RawEntry[];
};

type Cache = { at: number; feed: Extract<KevFeed, { ok: true }> };
let cache: Cache | null = null;

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function weekAgoIso(now = new Date()): string {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() - 7);
  return isoDay(d);
}

function dueHorizonIso(now = new Date()): string {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() + DUE_SOON_DAYS);
  return isoDay(d);
}

function toRow(v: RawEntry): KevRow | null {
  if (!v.cveID || !v.dateAdded) return null;
  return {
    cveId: v.cveID,
    vendor: v.vendorProject ?? "",
    product: v.product ?? "",
    name: v.vulnerabilityName ?? "",
    dateAdded: v.dateAdded,
    dueDate: v.dueDate || undefined,
    ransomware: (v.knownRansomwareCampaignUse ?? "").toLowerCase() === "known",
    description: v.shortDescription ?? "",
    action: v.requiredAction || undefined,
  };
}

function buildFeed(
  raw: RawFeed,
  fetchedAt: string,
  stale: boolean,
  source: "cisa" | "mirror",
): Extract<KevFeed, { ok: true }> {
  const rows = (raw.vulnerabilities ?? [])
    .map(toRow)
    .filter((r): r is KevRow => r !== null)
    .sort((a, b) => (a.dateAdded < b.dateAdded ? 1 : a.dateAdded > b.dateAdded ? -1 : 0));

  const fetched = new Date(fetchedAt);
  const since = weekAgoIso(fetched);
  const today = isoDay(fetched);
  const horizon = dueHorizonIso(fetched);

  return {
    ok: true,
    catalogVersion: raw.catalogVersion ?? "—",
    dateReleased: raw.dateReleased ?? fetchedAt,
    count: raw.count ?? rows.length,
    ransomwareCount: rows.filter((r) => r.ransomware).length,
    addedThisWeek: rows.filter((r) => r.dateAdded >= since).length,
    dueSoonCount: rows.filter((r) => r.dueDate && r.dueDate >= today && r.dueDate <= horizon).length,
    fetchedAt,
    stale,
    source,
    rows,
  };
}

async function fetchRaw(): Promise<{ raw: RawFeed; source: "cisa" | "mirror" }> {
  let lastErr: Error | null = null;
  for (const src of SOURCES) {
    try {
      const res = await fetch(src.url, {
        headers: {
          "User-Agent": BROWSER_UA,
          Accept: "application/json,text/plain,*/*",
        },
        signal: AbortSignal.timeout(12_000),
      });
      if (!res.ok) throw new Error(`CISA KEV HTTP ${res.status}`);
      const json = (await res.json()) as RawFeed;
      if (!Array.isArray(json.vulnerabilities)) {
        throw new Error("CISA KEV feed missing vulnerabilities");
      }
      return { raw: json, source: src.source };
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastErr ?? new Error("CISA KEV fetch failed");
}

export async function loadKevFeed(): Promise<KevFeed> {
  const now = Date.now();
  if (cache && now - cache.at < CACHE_TTL_MS) return cache.feed;

  try {
    const { raw, source } = await fetchRaw();
    const feed = buildFeed(raw, new Date().toISOString(), false, source);
    cache = { at: now, feed };
    return feed;
  } catch (err) {
    if (cache) return { ...cache.feed, stale: true };
    return {
      ok: false,
      error: err instanceof Error ? err.message : "CISA KEV fetch failed",
    };
  }
}
