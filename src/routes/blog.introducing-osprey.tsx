import type { ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter, SiteNav } from "@/components/site-nav";

export const Route = createFileRoute("/blog/introducing-osprey")({
  component: IntroducingOsprey,
  head: () => ({
    meta: [
      { title: "Introducing Osprey: Security Visibility for the Software Supply Chain" },
      {
        name: "description",
        content:
          "Osprey generates and signs SBOMs, cross-checks them against the CISA KEV catalog, and gives teams a technical visibility layer that supports EU CRA vulnerability workflows.",
      },
    ],
  }),
});

function IntroducingOsprey() {
  return (
    <div className="site-grid min-h-screen">
      <SiteNav />
      <article className="mx-auto max-w-[720px] px-4 pb-20 pt-14 sm:px-6">
        <Link
          to="/"
          className="text-[11px] tracking-[0.14em] text-hot uppercase hover:underline"
        >
          ← All notes
        </Link>
        <p className="mt-8 text-[11px] tracking-[0.16em] text-hot uppercase">Product Launch</p>
        <h1 className="mt-4 text-3xl tracking-[-0.04em] text-fg sm:text-4xl">
          Introducing Osprey: Security Visibility for the Software Supply Chain
        </h1>
        <p className="mt-4 border-b border-line pb-8 text-[11px] tracking-[0.1em] text-muted uppercase">
          Sep 19, 2026 · 5 min read · Purple Lotus
        </p>

        <div className="space-y-5 pt-10 text-sm leading-[1.9] text-muted">
          <p>
            Today we're launching <span className="text-fg">Osprey</span>, our open-source CLI (
            <code className="bg-elevated px-1 text-cyan">cra</code>) for software supply chain
            visibility. You can find it on GitHub at{" "}
            <a
              href="https://github.com/Purplelotusec/Osprey"
              className="text-hot hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Purplelotusec/Osprey
            </a>
            .
          </p>
          <p>
            Osprey builds a Software Bill of Materials (SBOM) from your project, cross-checks every
            component against the <span className="text-fg">CISA Known Exploited Vulnerabilities (KEV)</span>{" "}
            catalog, and tells you which dependencies are <em>actively exploited in the wild</em> — not
            merely “have a CVE.”
          </p>

          <h2 className="pt-6 text-2xl tracking-[-0.02em] text-fg">The Problem We Built It For</h2>
          <p>
            Most vulnerability tooling stops at “this package has a CVE.” That produces a lot of
            tickets and very little prioritization: a scanner that flags every CVE in your
            dependency tree, regardless of whether it's actually being exploited, trains teams to
            ignore the output. Osprey narrows the question to the one that actually matters for
            triage —{" "}
            <span className="text-fg">
              is this specific component, at this specific version, known to be exploited right now?
            </span>
          </p>

          <h2 className="pt-6 text-2xl tracking-[-0.02em] text-fg">What Osprey Does</h2>
          <ul className="space-y-3">
            <Li title="KEV detection">cross-checks every component against CISA's KEV catalog.</Li>
            <Li title="Confidence tiers">
              <code className="text-cyan">high</code> (PURL-backed exact match) vs.{" "}
              <code className="text-cyan">low</code> (name/vendor match only), so you're never told
              to panic over a coincidental name match.
            </Li>
            <Li title="Version intelligence">
              uses{" "}
              <a href="https://osv.dev" className="text-hot hover:underline">
                OSV
              </a>{" "}
              to determine whether your <em>installed</em> version is actually affected, rather than
              flagging the whole package.
            </Li>
            <Li title="Remote auditing">audit a GitHub repository without cloning it.</Li>
            <Li title="SBOM signing">Ed25519 signatures in a DSSE envelope, with tamper detection.</Li>
            <Li title="Alerting">a Slack-compatible webhook, batched into one message per run.</Li>
            <Li title="CI-ready">GitHub Actions job summary, inline annotations, and SARIF output.</Li>
          </ul>

          <h2 className="pt-6 text-2xl tracking-[-0.02em] text-fg">How It Works</h2>
          <pre className="overflow-x-auto bg-elevated p-4 font-mono text-xs leading-7 text-cyan">{`Software / Repository
        ↓
   Dependencies
        ↓
       SBOM
        ↓
 Vulnerability Analysis
        ↓
    CISA KEV Match
        ↓
  Security Signal
        ↓
 Investigate & Respond`}</pre>
          <p>
            Instead of treating every vulnerability as the same, Osprey adds context around the
            software component, affected version, and known exploitation status.
          </p>

          <h3 className="pt-4 text-xl text-fg">Running it</h3>
          <p>
            A single command runs the whole pipeline: generate the SBOM, poll the KEV catalog,
            cross-check components, and report.
          </p>
          <pre className="overflow-x-auto bg-elevated p-4 font-mono text-xs text-cyan">
            cra --path /path/to/your/project
          </pre>
          <p>Or point it at a GitHub repository directly, without cloning it locally:</p>
          <pre className="overflow-x-auto bg-elevated p-4 font-mono text-xs text-cyan">cra --url owner/repo</pre>
          <p>
            When something is found, Osprey names the CVE, the exact affected component and version,
            and whether the OSV evidence actually covers your installed version — not just the
            package name:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-[11px] tracking-[0.1em] text-muted uppercase">
                  <th className="py-2 font-normal">versionStatus</th>
                  <th className="py-2 font-normal">Meaning</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-line">
                  <td className="py-2 font-mono text-cyan">affected</td>
                  <td className="py-2">OSV evidence covers the installed version</td>
                </tr>
                <tr className="border-b border-line">
                  <td className="py-2 font-mono text-cyan">not_affected</td>
                  <td className="py-2">Available evidence excludes the installed version</td>
                </tr>
                <tr className="border-b border-line">
                  <td className="py-2 font-mono text-cyan">unknown</td>
                  <td className="py-2">Evidence couldn't be established — never treated as affected</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            <code className="text-cyan">exploitationStatus: "known_exploited"</code> comes from CISA
            KEV independently of the OSV version check, so the two signals stay clearly separated
            rather than blended into one confidence-eroding score.
          </p>

          <h2 className="pt-6 text-2xl tracking-[-0.02em] text-fg">Why CISA KEV Matters</h2>
          <p>
            Vulnerability scanners can produce large numbers of findings. The{" "}
            <span className="text-fg">CISA Known Exploited Vulnerabilities (KEV) Catalog</span> provides
            an additional signal by tracking vulnerabilities known to have been exploited in the wild.
          </p>
          <p>
            Osprey correlates that information with the dependencies found in a project, helping
            teams identify when actively exploited vulnerabilities may affect software they build or
            ship.
          </p>

          <h2 className="pt-6 text-2xl tracking-[-0.02em] text-fg">How Osprey Supports the EU CRA</h2>
          <p>
            The <span className="text-fg">EU Cyber Resilience Act (CRA)</span> introduces requirements
            around cybersecurity, vulnerability handling, security updates, and vulnerability
            reporting for products with digital elements.
          </p>
          <p>
            The CRA creates a need for organizations to have visibility into vulnerabilities
            affecting their products and to respond to applicable actively exploited vulnerabilities
            through the relevant reporting process.
          </p>
          <p>
            Osprey is <span className="text-fg">not a CRA compliance or regulatory reporting platform</span>
            , and its output is not intended to be relied on, or presented to an auditor, as proof of
            compliance on its own. Instead, it provides a technical visibility layer that can
            support the workflow:
          </p>
          <pre className="overflow-x-auto bg-elevated p-4 font-mono text-xs leading-7 text-cyan">{`Know what you ship
        ↓
Identify affected components
        ↓
Check exploitation status
        ↓
Investigate and respond
        ↓
Support your security process`}</pre>
          <p>Mapped against specific CRA themes, that looks like:</p>
          <ul className="list-disc space-y-3 pl-5">
            <li>
              <span className="text-fg">Vulnerability handling</span> — the KEV cross-check plus OSV
              version intelligence is the “is one of these components vulnerable, is it being
              exploited, does it affect us” workflow, not a raw CVE count.
            </li>
            <li>
              <span className="text-fg">Documentation integrity</span> — SBOM signing (Ed25519 in a
              DSSE envelope) gives the SBOM tamper detection, so the artifact is verifiable rather
              than taken on trust.
            </li>
            <li>
              <span className="text-fg">Evidence of response</span> — the CI-ready output (job
              summaries, annotations, SARIF, a versioned JSON result) gives you a record of what was
              checked, when, and what was found.
            </li>
          </ul>

          <blockquote className="border-l-2 border-hot bg-hot/10 px-5 py-4 font-sans text-lg leading-snug text-fg">
            Know what you ship. Know what is affected. Know what is being exploited.
          </blockquote>
          <p>
            Osprey brings software inventory and exploitation intelligence together so security
            teams can act with better context.
          </p>

          <h2 className="pt-6 text-2xl tracking-[-0.02em] text-fg">Built to Be Honest About Its Own Limits</h2>
          <p>We'd rather Osprey under-claim than over-claim. A few things worth knowing before you rely on it:</p>
          <ul className="list-disc space-y-3 pl-5">
            <li>
              Lockfile coverage today is <code className="text-cyan">package-lock.json</code> (npm)
              and exact-pinned <code className="text-cyan">requirements.txt</code> (Python) — no yarn,
              pnpm, poetry, Go, or Cargo yet.
            </li>
            <li>
              <code className="text-cyan">low</code>-confidence matches are name/vendor matches only,
              since CISA KEV's fields are free text rather than machine-precise CPE ranges.
            </li>
            <li>Version intelligence via OSV is npm-only for now.</li>
            <li>
              Signing uses local Ed25519 keys rather than Sigstore keyless signing or a transparency
              log.
            </li>
          </ul>

          <h2 className="pt-6 text-2xl tracking-[-0.02em] text-fg">Get Started</h2>
          <pre className="overflow-x-auto bg-elevated p-4 font-mono text-xs leading-7 text-cyan">{`git clone https://github.com/Purplelotusec/Osprey
cd Osprey
npm install
npm link

cra --path .`}</pre>
          <p>
            For CI, add <code className="text-cyan">--fail-on-high</code> to exit non-zero only on
            high-confidence, actively exploited matches:
          </p>
          <pre className="overflow-x-auto bg-elevated p-4 font-mono text-xs text-cyan">
            cra --path . --fail-on-high --output results.json
          </pre>
          <p>
            <a href="https://github.com/Purplelotusec/Osprey" className="text-hot hover:underline">
              View Osprey on GitHub →
            </a>
          </p>
          <p className="pt-6 text-xs italic leading-relaxed text-faint">
            This article is for general educational and product-information purposes. Osprey does
            not by itself establish CRA compliance, and it is not intended to be relied on — or
            presented to an auditor — as proof of compliance. Organizations should assess their
            specific obligations against the applicable EU legislation, standards, and official
            guidance.
          </p>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}

function Li({ title, children }: { title: string; children: ReactNode }) {
  return (
    <li className="pl-1">
      <span className="text-fg">{title}</span> — {children}
    </li>
  );
}
