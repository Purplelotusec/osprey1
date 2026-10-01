import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { CliTerminal } from "@/components/cli-terminal";
import { KevFeed } from "@/components/kev-feed";
import { SiteFooter, SiteNav } from "@/components/site-nav";
import { FAQ, FEATURES, VERSION_ROWS } from "@/lib/content";
import { cn } from "@/lib/utils";
import type { KevFeed as KevFeedData } from "@/lib/kev";

export function HomePage({ kev }: { kev: KevFeedData }) {
  return (
    <div className="site-grid min-h-screen">
      <SiteNav />
      <Hero />
      <KevFeed initial={kev} />
      <Editorial />
      <Compare />
      <Features />
      <CliSection />
      <Pipeline />
      <Faq />
      <Notes />
      <GetStarted />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-24">
      <p className="text-[11px] tracking-[0.18em] text-muted uppercase">OSP.0.1.0 · PurpleLotus</p>
      <h1 className="mt-6 font-sans text-3xl leading-[1.05] tracking-[-0.04em] text-fg sm:text-[clamp(2.2rem,3.8vw,3.6rem)]">
        <span className="flex flex-col gap-3 lg:flex-row lg:items-baseline">
          <span className="shrink-0">Introducing Osprey</span>
          <span className="hidden min-w-8 flex-1 border-b border-dotted border-faint lg:block" />
          <span className="shrink-0">Security beyond CVEs</span>
        </span>
      </h1>
      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
        The CLI that builds an SBOM, cross-checks every component against CISA KEV, and tells you
        which dependencies are actively exploited in the wild — not merely have a CVE.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href="/#cli"
          className="inline-flex h-10 items-center bg-fg px-4 text-[11px] tracking-[0.12em] text-bg uppercase hover:bg-hot hover:text-hot-fg"
        >
          Try the CLI
        </a>
        <a
          href="https://github.com/Purplelotusec/Osprey"
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center px-4 text-[11px] tracking-[0.12em] text-fg uppercase shadow-[0_0_0_1px_rgba(243,243,240,0.22)] hover:text-hot hover:shadow-[0_0_0_1px_rgba(212,91,182,0.9)]"
        >
          View on GitHub
        </a>
      </div>
      <div className="mt-16 flex items-center justify-between text-muted">
        <span>∵</span>
        <span className="text-[11px] tracking-[0.2em] uppercase">Because 99% of vulnerabilities are noise</span>
        <span>∵</span>
      </div>
    </section>
  );
}

function Editorial() {
  return (
    <section id="product" className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6">
      <p className="text-[11px] tracking-[0.18em] text-muted uppercase">We asked a narrower question</p>
      <div className="mt-8 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <h2 className="text-2xl tracking-[-0.03em] text-fg">not every CVE</h2>
        </div>
        <div className="space-y-5 text-sm leading-[1.85] text-muted lg:col-span-8">
          <p>
            Most vulnerability tooling stops at “this package has a CVE.” That produces a lot of
            tickets and very little prioritization: a scanner that flags every CVE in your
            dependency tree, regardless of whether it is actually being exploited, trains teams to
            ignore the output.
          </p>
          <p>
            Osprey narrows the question to the one that actually matters for triage —{" "}
            <span className="text-fg">
              is this specific component, at this specific version, known to be exploited right now?
            </span>
          </p>
        </div>
      </div>

      <div className="mt-16 grid gap-10 sm:grid-cols-3">
        <EditorialCard k="a new signal" t="Known exploited, not merely listed.">
          CISA’s KEV catalog tracks vulnerabilities known to have been exploited in the wild. Osprey
          correlates that with the dependencies found in a project.
        </EditorialCard>
        <EditorialCard k="version-aware" t="The installed version, not the package name.">
          OSV decides whether your installed version is affected, not_affected, or unknown. Unknown
          is never treated as affected.
        </EditorialCard>
        <EditorialCard k="more like triage" t="A security signal your process can act on.">
          Confidence tiers, remediation paths, SARIF, and --fail-on-high. Software can branch on
          the result instead of drowning in a CVE dump.
        </EditorialCard>
      </div>
    </section>
  );
}

function EditorialCard({ k, t, children }: { k: string; t: string; children: string }) {
  return (
    <div className="border-t border-line pt-5">
      <p className="text-[11px] tracking-[0.16em] text-hot uppercase">{k}</p>
      <h3 className="mt-3 text-lg tracking-[-0.02em] text-fg">{t}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted">{children}</p>
    </div>
  );
}

function Compare() {
  return (
    <section id="compare" className="border-y border-line">
      <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6">
        <p className="text-[11px] tracking-[0.18em] text-muted uppercase">Triage, not theater</p>
        <h2 className="mt-4 text-3xl tracking-[-0.04em] text-fg">
          99% of findings are noise.
          <br />
          We find the 1% that matters.
        </h2>
        <p className="mt-4 max-w-xl text-sm text-muted">
          Based on a typical npm lockfile run against CISA KEV — not a count of every CVE in NVD.
        </p>
        <div className="mt-12 grid gap-px bg-line sm:grid-cols-2">
          <div className="bg-bg p-6 sm:p-8">
            <p className="text-[11px] tracking-[0.16em] text-muted uppercase">Osprey</p>
            <p className="mt-6 font-mono text-4xl tabular-nums tracking-tight text-fg">2</p>
            <p className="mt-2 text-sm text-muted">known-exploited, version-affected packages</p>
            <p className="mt-6 text-xs text-faint">Audit completed in 1.42s · exit 1 with --fail-on-high</p>
          </div>
          <div className="bg-bg p-6 sm:p-8">
            <p className="text-[11px] tracking-[0.16em] text-muted uppercase">Typical CVE scanner</p>
            <p className="mt-6 font-mono text-4xl tabular-nums tracking-tight text-muted">1,847</p>
            <p className="mt-2 text-sm text-muted">CVEs flagged, regardless of exploitation</p>
            <p className="mt-6 text-xs text-faint">Hours of triage · most tickets never move</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6">
      <p className="text-[11px] tracking-[0.18em] text-muted uppercase">Built for the gate</p>
      <h2 className="mt-4 max-w-2xl text-2xl tracking-[-0.03em] text-fg sm:text-3xl">
        cra returns a graded signal, so your software can act when confidence is high and escalate
        when it is not.
      </h2>
      <div className="mt-12 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <article key={f.k} className="bg-bg p-6">
            <h3 className="text-sm text-fg">{f.k}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">{f.d}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function CliSection() {
  return (
    <section id="cli" className="border-y border-line bg-elevated/40">
      <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] tracking-[0.18em] text-muted uppercase">Interactive · cra 0.1.0</p>
            <h2 className="mt-3 text-2xl tracking-[-0.03em] text-fg sm:text-3xl">The CLI, in the page.</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted">
              Same commands as the real binary. Audit the demo app, a clean tree, or facebook/react.
              Flags: --verbose, --summary, --fail-on-high. This is a faithful in-browser tty of{" "}
              <a
                className="text-fg underline decoration-line underline-offset-4 hover:text-hot"
                href="https://github.com/Purplelotusec/Osprey"
              >
                Purplelotusec/Osprey
              </a>
              .
            </p>
          </div>
          <p className="text-[11px] tracking-wide text-faint">Enter · ↑ history · Tab complete · Ctrl+C</p>
        </div>
        <CliTerminal />
      </div>
    </section>
  );
}

function Pipeline() {
  const steps = [
    "Software / Repository",
    "Dependencies",
    "SBOM",
    "Vulnerability analysis",
    "CISA KEV match",
    "Security signal",
    "Investigate & respond",
  ];
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6">
      <p className="text-[11px] tracking-[0.18em] text-muted uppercase">How it works</p>
      <h2 className="mt-4 text-2xl tracking-[-0.03em] text-fg">One command, the whole pipeline.</h2>
      <pre className="mt-8 overflow-x-auto bg-elevated p-5 font-mono text-xs leading-7 text-cyan shadow-[0_0_0_1px_rgba(243,243,240,0.12)]">
        {`cra --path /path/to/your/project
cra --url owner/repo
cra --path . --fail-on-high --output results.json`}
      </pre>
      <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s} className="border-t border-line pt-3">
            <span className="text-[10px] tabular-nums text-faint">{String(i + 1).padStart(2, "0")}</span>
            <p className="mt-2 text-sm text-fg">{s}</p>
          </li>
        ))}
      </ol>
      <div className="mt-12 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[11px] tracking-[0.12em] text-muted uppercase">
              <th className="py-3 font-normal">versionStatus</th>
              <th className="py-3 font-normal">Meaning</th>
            </tr>
          </thead>
          <tbody>
            {VERSION_ROWS.map((r) => (
              <tr key={r.status} className="border-b border-line">
                <td className="py-3 font-mono text-cyan">{r.status}</td>
                <td className="py-3 text-muted">{r.meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="border-t border-line">
      <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6">
        <p className="text-[11px] tracking-[0.18em] text-muted uppercase">We give a FAQ</p>
        <h2 className="mt-4 text-2xl tracking-[-0.03em] text-fg">Questions, one at a time.</h2>
        <div className="mt-10 divide-y divide-line border-y border-line">
          {FAQ.map((item, i) => {
            const on = open === i;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpen(on ? -1 : i)}
                  className="flex min-h-11 w-full items-start justify-between gap-4 py-5 text-left"
                  aria-expanded={on}
                >
                  <span className={cn("text-sm sm:text-base", on ? "text-hot" : "text-fg")}>{item.q}</span>
                  <span className="text-muted">{on ? "–" : "+"}</span>
                </button>
                {on ? (
                  <p className="pb-5 text-sm leading-relaxed text-muted">{item.a}</p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Notes() {
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6">
      <p className="text-[11px] tracking-[0.18em] text-muted uppercase">Osprey notes</p>
      <div className="mt-6 grid gap-px bg-line sm:grid-cols-2">
        <Link to="/blog/introducing-osprey" className="bg-bg p-6 hover:bg-elevated">
          <p className="text-[11px] tracking-[0.12em] text-muted uppercase">Sep 19, 2026 · Launch</p>
          <h3 className="mt-3 text-lg text-fg">Introducing Osprey</h3>
          <p className="mt-2 text-sm text-muted">
            Security visibility for the software supply chain. Why KEV, how version status works,
            and what Osprey will not claim about the EU CRA.
          </p>
        </Link>
        <a
          href="https://github.com/Purplelotusec/Osprey"
          target="_blank"
          rel="noreferrer"
          className="bg-bg p-6 hover:bg-elevated"
        >
          <p className="text-[11px] tracking-[0.12em] text-muted uppercase">README · 0.1.0</p>
          <h3 className="mt-3 text-lg text-fg">CLI reference</h3>
          <p className="mt-2 text-sm text-muted">
            cra, cra-sbom, cra-kev, cra-report. Confidence tiers, structured JSON, and the things we
            are honest about not supporting yet.
          </p>
        </a>
      </div>
    </section>
  );
}

function GetStarted() {
  return (
    <section className="bg-hot text-hot-fg">
      <div className="mx-auto max-w-[1200px] px-4 py-20 sm:px-6">
        <p className="text-[11px] tracking-[0.18em] uppercase opacity-70">Get started</p>
        <h2 className="mt-4 text-3xl tracking-[-0.04em] sm:text-4xl">Ship with Osprey.</h2>
        <pre className="mt-8 overflow-x-auto bg-hot-fg/10 p-5 font-mono text-xs leading-7">
          {`git clone https://github.com/Purplelotusec/Osprey
cd Osprey
npm install
npm link
cra --path .`}
        </pre>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="https://github.com/Purplelotusec/Osprey"
            className="inline-flex h-10 items-center bg-hot-fg px-4 text-[11px] tracking-[0.12em] text-hot uppercase"
          >
            Clone the repo
          </a>
          <a
            href="/#cli"
            className="inline-flex h-10 items-center px-4 text-[11px] tracking-[0.12em] uppercase shadow-[0_0_0_1px_currentColor]"
          >
            Run the demo
          </a>
        </div>
      </div>
    </section>
  );
}
