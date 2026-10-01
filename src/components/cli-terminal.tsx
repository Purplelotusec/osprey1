import { useCallback, useEffect, useRef, useState } from "react";
import { PRESET_COMMANDS, runCommand, TONE_CLASS, type TermLine } from "@/lib/osprey-cli";
import { cn } from "@/lib/utils";

interface ShownLine {
  id: number;
  text: string;
  tone?: TermLine["tone"];
  kind: "out" | "in";
}

let seq = 0;

export function CliTerminal({ autoRun = true }: { autoRun?: boolean }) {
  const [lines, setLines] = useState<ShownLine[]>([
    { id: ++seq, kind: "out", tone: "dim", text: "osprey 0.1.0 — cra demo tty" },
    { id: ++seq, kind: "out", tone: "dim", text: "Type a command or click a preset. Try `cra --help`." },
    { id: ++seq, kind: "out", tone: "dim", text: "" },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [exit, setExit] = useState<number | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const cancel = useRef(false);
  const started = useRef(false);

  const scrollToEnd = useCallback(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const exec = useCallback(
    async (raw: string) => {
      const command = raw.trim();
      if (!command || busy) return;
      cancel.current = false;
      setBusy(true);
      setExit(null);
      setHistory((h) => (h[h.length - 1] === command ? h : [...h, command].slice(-40)));
      setHistIdx(-1);
      setInput("");
      setLines((prev) => [
        ...prev,
        { id: ++seq, kind: "in", tone: "prompt", text: `~/acme-web $ ${command}` },
      ]);

      const result = runCommand(command);
      if (result.clear) {
        setLines([
          { id: ++seq, kind: "out", tone: "dim", text: "osprey 0.1.0 — cra demo tty" },
        ]);
        setBusy(false);
        return;
      }

      for (const ln of result.lines) {
        if (cancel.current) break;
        if (ln.delayMs > 0) {
          await new Promise((r) => setTimeout(r, ln.delayMs));
        }
        if (cancel.current) break;
        setLines((prev) => [...prev, { id: ++seq, kind: "out", tone: ln.tone, text: ln.text }]);
      }
      setExit(result.exitCode);
      setBusy(false);
      requestAnimationFrame(scrollToEnd);
    },
    [busy, scrollToEnd],
  );

  useEffect(() => {
    scrollToEnd();
  }, [lines, scrollToEnd]);

  useEffect(() => {
    if (!autoRun || started.current) return;
    started.current = true;
    const t = window.setTimeout(() => {
      void exec("cra --path .");
    }, 600);
    return () => window.clearTimeout(t);
  }, [autoRun, exec]);

  function onKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void exec(input);
      return;
    }
    if (e.key === "c" && e.ctrlKey) {
      e.preventDefault();
      cancel.current = true;
      setBusy(false);
      setLines((prev) => [...prev, { id: ++seq, kind: "out", tone: "dim", text: "^C" }]);
      return;
    }
    if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([{ id: ++seq, kind: "out", tone: "dim", text: "osprey 0.1.0 — cra demo tty" }]);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!history.length) return;
      const next = histIdx < 0 ? history.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(next);
      setInput(history[next] ?? "");
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (histIdx < 0) return;
      const next = histIdx + 1;
      if (next >= history.length) {
        setHistIdx(-1);
        setInput("");
      } else {
        setHistIdx(next);
        setInput(history[next] ?? "");
      }
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const hit = PRESET_COMMANDS.find((c) => c.command.startsWith(input) && c.command !== input);
      if (hit) setInput(hit.command);
    }
  }

  return (
    <div
      className="flex h-full min-h-[420px] flex-col bg-elevated shadow-[0_0_0_1px_rgba(243,243,240,0.12)]"
      onClick={() => field.current?.focus()}
    >
      <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2 text-[11px] tracking-wide text-muted">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-bad/80" />
          <span className="size-2 rounded-full bg-warn/80" />
          <span className="size-2 rounded-full bg-ok/80" />
          <span className="ml-2 text-fg">cra — osprey 0.1.0</span>
        </div>
        <span className="hidden sm:inline">/demo/acme-web</span>
      </div>

      <div
        ref={scroller}
        className="term-scroll min-h-0 flex-1 overflow-auto px-3 py-3 font-mono text-[12px] leading-[1.65] sm:text-[13px]"
      >
        {lines.map((ln) => (
          <pre
            key={ln.id}
            className={cn(
              "m-0 whitespace-pre-wrap break-words font-mono",
              TONE_CLASS[ln.tone ?? "default"],
            )}
          >
            {ln.text.length ? ln.text : " "}
          </pre>
        ))}
        <div className="mt-1 flex items-center gap-2 font-mono text-[12px] sm:text-[13px]">
          <span className="text-hot shrink-0">~/acme-web $</span>
          <input
            ref={field}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            disabled={busy}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
            aria-label="Osprey CLI command"
            className="min-w-0 flex-1 bg-transparent text-fg outline-none placeholder:text-faint"
            placeholder={busy ? "running…" : "cra --path ."}
          />
          {!busy && <span className="caret" aria-hidden />}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 border-t border-line px-3 py-2">
        {PRESET_COMMANDS.map((p) => (
          <button
            key={p.command}
            type="button"
            disabled={busy}
            onClick={() => void exec(p.command)}
            className="h-8 px-2 text-[10px] tracking-wide text-muted shadow-[0_0_0_1px_rgba(243,243,240,0.14)] transition-colors duration-150 hover:text-fg hover:shadow-[0_0_0_1px_rgba(212,91,182,0.7)] disabled:opacity-40"
          >
            {p.label}
          </button>
        ))}
        {exit !== null && (
          <span className={cn("ml-auto text-[10px] tracking-wide", exit === 0 ? "text-ok" : "text-bad")}>
            exit {exit}
          </span>
        )}
      </div>
    </div>
  );
}
