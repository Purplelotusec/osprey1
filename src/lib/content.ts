export const NEWS = [
  {
    date: "Sep 19, 2026",
    kicker: "Osprey News",
    title: "Introducing Osprey: Security Visibility for the Software Supply Chain",
    href: "/blog/introducing-osprey",
  },
  {
    date: "Sep 19, 2026",
    kicker: "Changelog 0.1.0",
    title: "cra-guard-core is now Osprey. The CLI alias is cra.",
    href: "https://github.com/Purplelotusec/Osprey",
  },
] as const;

export const FEATURES = [
  {
    k: "KEV detection",
    d: "Cross-checks every SBOM component against CISA’s Known Exploited Vulnerabilities catalog — the 1% that hackers are using right now.",
  },
  {
    k: "Confidence tiers",
    d: "high is a PURL-backed exact match. low is a name/vendor coincidence. Never panic over a string collision.",
  },
  {
    k: "Version intelligence",
    d: "OSV decides whether your installed version is actually affected — not whether the package ever had a CVE.",
  },
  {
    k: "Remote auditing",
    d: "Point cra at owner/repo. No clone. Private repos take a GitHub token.",
  },
  {
    k: "SBOM signing",
    d: "Ed25519 signatures in a DSSE envelope, with tamper detection, so the inventory is verifiable.",
  },
  {
    k: "CI-ready",
    d: "JSON results, GitHub Actions job summaries, inline annotations, SARIF, and --fail-on-high for the gate.",
  },
] as const;

export const FAQ = [
  {
    q: "What is Osprey? What is cra?",
    a: "Osprey is an open-source CLI for software supply chain visibility. cra is the command. It builds a Software Bill of Materials from your project, cross-checks every component against the CISA KEV catalog, and tells you which dependencies are actively exploited in the wild — not merely “have a CVE.”",
  },
  {
    q: "How is this different from a CVE scanner?",
    a: "Most tooling stops at “this package has a CVE.” That produces tickets and trains teams to ignore the output. Osprey narrows the question to the one that matters for triage: is this specific component, at this specific version, known to be exploited right now?",
  },
  {
    q: "What are confidence tiers?",
    a: "CISA KEV entries use free-text vendor and product names, not machine-precise CPE ranges. high means a PURL-backed exact product match. low means a name/vendor match only. Do not trigger automated regulatory or incident clocks on low-confidence matches.",
  },
  {
    q: "How does version intelligence work?",
    a: "For npm packages, OSV advisories determine whether your installed version is affected, not_affected, or unknown. unknown is never treated as affected. exploitationStatus: known_exploited comes from CISA KEV independently of the OSV check, so the two signals stay separated.",
  },
  {
    q: "Does Osprey make me CRA compliant?",
    a: "No. Osprey is not a CRA compliance or regulatory reporting platform, and its output is not intended to be presented to an auditor as proof of compliance. It is a technical visibility layer — know what you ship, identify affected components, check exploitation status, investigate and respond.",
  },
  {
    q: "What lockfiles are supported?",
    a: "package-lock.json (npm v1–v3) and exact-pinned requirements.txt (Python). No yarn.lock, pnpm-lock.yaml, poetry.lock, go.sum, or Cargo.lock yet. Version intelligence via OSV is npm-only for now.",
  },
  {
    q: "Can I audit a GitHub repo without cloning it?",
    a: "Yes. cra --url owner/repo, or a full GitHub URL, including branch and subdirectory. Private repositories need GITHUB_TOKEN or --github-token.",
  },
  {
    q: "Can Osprey still get things wrong?",
    a: "Yes — that is why it grades matches. low-confidence hits are name collisions until a human says otherwise. unknown version status is never treated as affected. We would rather Osprey under-claim than over-claim.",
  },
] as const;

export const VERSION_ROWS = [
  { status: "affected", meaning: "OSV evidence covers the installed version" },
  { status: "not_affected", meaning: "Available evidence excludes the installed version" },
  { status: "unknown", meaning: "Evidence couldn't be established — never treated as affected" },
] as const;
