import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getKevFeed, type KevFeed, type KevFeedOk, type KevRow } from "@/lib/kev";
import { cn } from "@/lib/utils";

const POLL_MS = 45_000;
const CISA_CATALOG = "https://www.cisa.gov/known-exploited-vulnerabilities-catalog";
const NEWEST_LIMIT = 8;
const WATCH_LIMIT = 10;
const DUE_DAYS = 14;

type CatalogFilter = "all" | "week" | "ransomware" | "due";
type WatchMode = "due" | "ransomware";

export function KevFeed({ initial }: { initial: KevFeed }) {
  const [feed, setFeed] = useState<KevFeed>(initial);
  const [now, setNow] = useState<number | null>(null);
  const [lastPoll, setLastPoll] = useState<number | null>(null);
  const [utc, setUtc] = useState<string>("");

  useEffect(() => {
    const start = Date.now();
    setNow(start);
    setLastPoll(start);
    setUtc(formatUtc(new Date()));
    const tick = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      setUtc(formatUtc(new Date(t)));
    }, 1000);
    const poll = window.setInterval(() => {
      void getKevFeed().then((next) => {
        setFeed(next);
        setLastPoll(Date.now());
      });
    }, POLL_MS);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(poll);
    };
  }, []);

  if (!feed || typeof feed !== "object" || !("ok" in feed)) {
    return (
      <section id="kev" className="mx-auto max-w-[1200px] px-4 pb-16 sm:px-6 sm:pb-24">
        <Frame>
          <div className="p-6">
            <PaneLabel live={false} name="KEV 1.1" tag="loading" />
            <p className="mt-4 text-sm text-muted">Pulling the CISA KEV catalog…</p>
          </div>
        </Frame>
      </section>
    );
  }

  if (!feed.ok) {
    return (
      <section id="kev" className="mx-auto max-w-[1200px] px-4 pb-16 sm:px-6 sm:pb-24">
        <Frame>
          <div className="p-6">
            <PaneLabel live={false} name="KEV 1.1" tag="offline" />
            <p className="mt-6 text-sm text-muted">{feed.error}</p>
            <button
              type="button"
              className="mt-4 h-10 px-4 text-[11px] tracking-[0.12em] text-fg uppercase shadow-[0_0_0_1px_rgba(243,243,240,0.22)]"
              onClick={() => void getKevFeed().then(setFeed)}
            >
              Retry
            </button>
          </div>
        </Frame>
      </section>
    );
  }

  return (
    <LiveCatalog feed={feed} now={now} lastPoll={lastPoll} utc={utc} />
  );
}

function LiveCatalog({
  feed,
  now,
  lastPoll,
  utc,
}: {
  feed: KevFeedOk;
  now: number | null;
  lastPoll: number | null;
  utc: string;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CatalogFilter>("all");
  const [watch, setWatch] = useState<WatchMode>("due");
  const [openId, setOpenId] = useState<string | null>(null);

  const today = feed.fetchedAt.slice(0, 10);
  const weekAgo = shiftDay(today, -7);
  const dueHorizon = shiftDay(today, DUE_DAYS);

  const newest = useMemo(() => feed.rows.slice(0, NEWEST_LIMIT), [feed.rows]);
  const dueSoon = useMemo(
    () =>
      feed.rows
        .filter((r) => r.dueDate && r.dueDate >= today && r.dueDate <= dueHorizon)
        .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
        .slice(0, WATCH_LIMIT),
    [feed.rows, today, dueHorizon],
  );
  const ransom = useMemo(
    () => feed.rows.filter((r) => r.ransomware).slice(0, WATCH_LIMIT),
    [feed.rows],
  );
  const watchRows = watch === "due" ? dueSoon : ransom;

  const catalogRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return feed.rows.filter((r) => {
      if (filter === "week" && r.dateAdded < weekAgo) return false;
      if (filter === "ransomware" && !r.ransomware) return false;
      if (filter === "due" && !(r.dueDate && r.dueDate >= today && r.dueDate <= dueHorizon)) {
        return false;
      }
      if (!q) return true;
      return (
        r.cveId.toLowerCase().includes(q) ||
        r.vendor.toLowerCase().includes(q) ||
        r.product.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q)
      );
    });
  }, [feed.rows, filter, query, weekAgo, today, dueHorizon]);

  const age = now && lastPoll ? Math.max(0, Math.floor((now - lastPoll) / 1000)) : null;
  const next = age === null ? null : Math.max(0, Math.ceil(POLL_MS / 1000 - age));
  const released = feed.dateReleased.slice(0, 10);
  const live = !feed.stale;

  return (
    <section id="kev" className="mx-auto max-w-[1200px] px-4 pb-16 sm:px-6 sm:pb-24">
      <Frame>
        <div className="flex flex-col gap-2 border-b border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <PaneLabel live={live} name="KEV 1.1" tag={live ? (feed.source === "mirror" ? "mirror" : "live") : "stale"} />
          <p className="text-[11px] tracking-wide text-muted">
            v{feed.catalogVersion} · {feed.count.toLocaleString("en-US")} in catalog · {released}
            {utc ? ` · ${utc} UTC` : ""}
          </p>
        </div>

        <Ticker rows={newest} />

        <div className="grid lg:h-[min(78vh,720px)] lg:grid-cols-2 lg:grid-rows-[minmax(240px,0.42fr)_minmax(280px,1fr)]">
          <PulsePane
            feed={feed}
            age={age}
            next={next}
            live={live}
          />
          <NewestPane rows={newest} today={today} />
          <WatchPane
            mode={watch}
            setMode={setWatch}
            rows={watchRows}
            dueCount={feed.dueSoonCount}
            ransomCount={feed.ransomwareCount}
          />
          <CatalogPane
            rows={catalogRows}
            total={feed.count}
            query={query}
            setQuery={setQuery}
            filter={filter}
            setFilter={setFilter}
            openId={openId}
            setOpenId={setOpenId}
            today={today}
          />
        </div>
      </Frame>
    </section>
  );
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden bg-elevated shadow-[0_0_0_1px_rgba(243,243,240,0.12)]">{children}</div>
  );
}

function PaneLabel({ live, name, tag }: { live: boolean; name: string; tag: string }) {
  return (
    <div className="flex items-center gap-2 text-[10px] tracking-[0.16em] text-muted uppercase">
      <span
        className={cn("size-1.5 rounded-full", live ? "bg-ok kev-live" : "bg-warn")}
      />
      <span>{name}</span>
      <span className={live ? "text-ok" : "text-warn"}>{tag}</span>
    </div>
  );
}

function PulsePane({
  feed,
  age,
  next,
  live,
}: {
  feed: KevFeedOk;
  age: number | null;
  next: number | null;
  live: boolean;
}) {
  return (
    <div className="flex min-h-[220px] min-w-0 flex-col overflow-hidden border-b border-line p-5 lg:h-full lg:border-r">
      <div className="flex items-center justify-between text-[10px] tracking-[0.16em] text-muted uppercase">
        <span>PULSE 1.1</span>
        <span className={live ? "text-ok" : "text-warn"}>{live ? "CISA" : "STALE"}</span>
      </div>
      <p className="mt-8 font-mono text-5xl tabular-nums tracking-tight text-fg sm:text-6xl">
        {feed.count.toLocaleString("en-US")}
      </p>
      <p className="mt-2 text-sm text-muted">known exploited in the wild</p>
      <div className="mt-auto grid grid-cols-3 gap-3 pt-8">
        <Stat k="Added (7d)" v={String(feed.addedThisWeek)} />
        <Stat k="Due (14d)" v={String(feed.dueSoonCount)} />
        <Stat k="Ransomware" v={String(feed.ransomwareCount)} />
      </div>
      <p className="mt-4 text-[10px] tracking-wide text-faint">
        {age === null ? "polling CISA…" : `polled ${formatAge(age)} · next ${next}s`}
      </p>
    </div>
  );
}

function NewestPane({ rows, today }: { rows: KevRow[]; today: string }) {
  return (
    <div className="flex min-h-[220px] min-w-0 flex-col overflow-hidden border-b border-line p-5 lg:h-full">
      <div className="flex items-center justify-between text-[10px] tracking-[0.16em] text-muted uppercase">
        <span>NEWEST 1.1</span>
        <span>DATE ADDED</span>
      </div>
      <ul className="mt-4 min-h-0 flex-1 overflow-auto">
        {rows.map((row) => (
          <li
            key={row.cveId}
            className="flex min-w-0 items-baseline gap-3 border-b border-line py-2 last:border-b-0"
          >
            <span className="w-[7.4rem] shrink-0 font-mono text-[12px] text-cyan">{row.cveId}</span>
            <span className="min-w-0 flex-1 truncate text-sm text-fg">
              <span className="text-muted">{row.vendor}</span>
              {row.product ? ` / ${row.product}` : ""}
            </span>
            <span className="shrink-0 text-[11px] tabular-nums text-faint">
              {row.dateAdded === today ? <span className="text-hot">TODAY</span> : row.dateAdded}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WatchPane({
  mode,
  setMode,
  rows,
  dueCount,
  ransomCount,
}: {
  mode: WatchMode;
  setMode: (m: WatchMode) => void;
  rows: KevRow[];
  dueCount: number;
  ransomCount: number;
}) {
  return (
    <div className="flex max-h-[320px] min-h-[260px] min-w-0 flex-col overflow-hidden border-b border-line p-5 lg:h-full lg:max-h-none lg:border-r lg:border-b-0">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] tracking-[0.16em] text-muted uppercase">
        <span>WATCH 1.1</span>
        <div className="flex gap-1">
          <FilterBtn active={mode === "due"} onClick={() => setMode("due")}>
            Due {dueCount}
          </FilterBtn>
          <FilterBtn active={mode === "ransomware"} onClick={() => setMode("ransomware")}>
            Ransom {ransomCount}
          </FilterBtn>
        </div>
      </div>
      <ul className="mt-4 min-h-0 flex-1 overflow-auto">
        {rows.map((row) => (
          <li key={row.cveId} className="flex min-w-0 items-baseline gap-3 border-b border-line py-2 last:border-b-0">
            <span className="w-[7.4rem] shrink-0 font-mono text-[12px] text-cyan">{row.cveId}</span>
            <span className="min-w-0 flex-1 truncate text-sm text-fg">
              <span className="text-muted">{row.vendor}</span>
              {row.product ? ` / ${row.product}` : ""}
            </span>
            <span className="shrink-0 text-[11px] tabular-nums text-faint">
              {mode === "due" ? row.dueDate : row.dateAdded}
            </span>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="py-6 text-sm text-muted">Nothing in this watch list.</li>
        )}
      </ul>
    </div>
  );
}

function CatalogPane({
  rows,
  total,
  query,
  setQuery,
  filter,
  setFilter,
  openId,
  setOpenId,
  today,
}: {
  rows: KevRow[];
  total: number;
  query: string;
  setQuery: (q: string) => void;
  filter: CatalogFilter;
  setFilter: (f: CatalogFilter) => void;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  today: string;
}) {
  return (
    <div className="flex max-h-[480px] min-h-[320px] min-w-0 flex-col overflow-hidden p-5 lg:h-full lg:max-h-none">
      <div className="flex items-center justify-between text-[10px] tracking-[0.16em] text-muted uppercase">
        <span>CATALOG 1.1</span>
        <span>
          {rows.length.toLocaleString("en-US")}
          {rows.length !== total ? ` / ${total.toLocaleString("en-US")}` : ""}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="CVE, vendor, product"
          className="h-9 min-w-0 flex-1 bg-bg px-3 font-mono text-xs text-fg outline-none placeholder:text-faint shadow-[0_0_0_1px_rgba(243,243,240,0.16)] focus:shadow-[0_0_0_1px_rgba(212,91,182,0.7)]"
          aria-label="Search KEV catalog"
          autoComplete="off"
          suppressHydrationWarning
        />
        <FilterBtn active={filter === "all"} onClick={() => setFilter("all")}>
          All
        </FilterBtn>
        <FilterBtn active={filter === "week"} onClick={() => setFilter("week")}>
          7d
        </FilterBtn>
        <FilterBtn active={filter === "due"} onClick={() => setFilter("due")}>
          Due
        </FilterBtn>
        <FilterBtn active={filter === "ransomware"} onClick={() => setFilter("ransomware")}>
          Ransom
        </FilterBtn>
      </div>
      <ul className="term-scroll mt-3 min-h-0 flex-1 overflow-auto">
        {rows.slice(0, 80).map((row) => (
          <KevItem
            key={row.cveId}
            row={row}
            open={openId === row.cveId}
            onToggle={() => setOpenId(openId === row.cveId ? null : row.cveId)}
            today={today}
          />
        ))}
        {rows.length > 80 && (
          <li className="px-1 py-3 text-[11px] text-faint">
            Showing 80 of {rows.length.toLocaleString("en-US")}. Narrow the search.
          </li>
        )}
        {rows.length === 0 && (
          <li className="px-1 py-8 text-sm text-muted">No entries in this filter.</li>
        )}
      </ul>
      <div className="mt-3 flex items-center justify-between gap-3 text-[10px] tracking-wide text-faint">
        <span>Active known-exploited vulnerabilities · CISA KEV</span>
        <a href={CISA_CATALOG} target="_blank" rel="noreferrer" className="text-muted hover:text-hot">
          cisa.gov catalog
        </a>
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.14em] text-muted uppercase">{k}</p>
      <p className="mt-1 font-mono text-xl tabular-nums text-fg">{v}</p>
    </div>
  );
}

function FilterBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 px-2.5 text-[10px] tracking-[0.12em] uppercase",
        active ? "bg-fg text-bg" : "text-muted shadow-[0_0_0_1px_rgba(243,243,240,0.16)] hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}

function Ticker({ rows }: { rows: KevRow[] }) {
  const text = rows.map((r) => `${r.cveId}  ${r.vendor} ${r.product}`).join("   ·   ");
  if (!text) return null;
  return (
    <div className="overflow-x-hidden border-b border-line py-2">
      <p className="kev-ticker whitespace-nowrap font-mono text-[11px] text-cyan">
        {text}   ·   {text}
      </p>
    </div>
  );
}

function KevItem({
  row,
  open,
  onToggle,
  today,
}: {
  row: KevRow;
  open: boolean;
  onToggle: () => void;
  today: string;
}) {
  return (
    <li className="border-b border-line">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex min-h-11 w-full items-baseline gap-3 py-2.5 text-left"
      >
        <span className="shrink-0 font-mono text-[12px] text-cyan">{row.cveId}</span>
        <span className="min-w-0 flex-1 truncate text-sm text-fg">
          <span className="text-muted">{row.vendor}</span>
          {row.product ? ` / ${row.product}` : ""}
        </span>
        <span className="flex shrink-0 items-center gap-2 text-[11px] tabular-nums text-faint">
          {row.dateAdded === today && <span className="text-hot">NEW</span>}
          {row.ransomware && <span className="text-bad">RANSOM</span>}
          {row.dateAdded}
        </span>
      </button>
      {open && (
        <div className="space-y-3 pb-4">
          <p className="text-sm text-fg">{row.name}</p>
          <p className="text-sm leading-relaxed text-muted">
            {row.description || "No description in the KEV entry."}
          </p>
          {row.action && <p className="text-xs leading-relaxed text-faint">Required action: {row.action}</p>}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] tracking-wide text-faint">
            <span>Added {row.dateAdded}</span>
            {row.dueDate && <span>Due {row.dueDate}</span>}
            <a
              href={`https://nvd.nist.gov/vuln/detail/${row.cveId}`}
              target="_blank"
              rel="noreferrer"
              className="text-hot hover:underline"
            >
              NVD →
            </a>
            <a
              href={`${CISA_CATALOG}?search_api_fulltext=${encodeURIComponent(row.cveId)}`}
              target="_blank"
              rel="noreferrer"
              className="text-hot hover:underline"
            >
              CISA →
            </a>
          </div>
        </div>
      )}
    </li>
  );
}

function formatAge(seconds: number): string {
  if (seconds < 60) return `${seconds}s ago`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

function formatUtc(d: Date): string {
  return d.toISOString().slice(11, 19);
}

function shiftDay(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
