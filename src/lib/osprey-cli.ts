export type Tone =
  | "default"
  | "dim"
  | "ok"
  | "bad"
  | "warn"
  | "cyan"
  | "bold"
  | "prompt"
  | "hot";

export interface TermLine {
  text: string;
  tone?: Tone;
  delayMs: number;
}

export interface CommandResult {
  lines: TermLine[];
  exitCode: number;
  clear?: boolean;
}

const KEV_COUNT = 1374;
const KEV_AS_OF = "2026-09-24";

function line(text: string, tone: Tone = "default", delayMs = 28): TermLine {
  return { text, tone, delayMs };
}

function blank(delayMs = 40): TermLine {
  return { text: "", delayMs };
}

function section(title: string, delayMs = 50): TermLine[] {
  return [
    blank(80),
    line(title, "bold", delayMs),
    line("─".repeat(Math.min(title.length, 48)), "dim", 12),
  ];
}

function tokenize(input: string): string[] {
  const tokens: string[] = [];
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input))) {
    tokens.push(m[1] ?? m[2] ?? m[3] ?? "");
  }
  return tokens;
}

function flag(args: string[], name: string): boolean {
  return args.includes(name);
}

function opt(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  if (i >= 0 && args[i + 1] && !args[i + 1]!.startsWith("-")) return args[i + 1];
  const long = args.find((a) => a.startsWith(`${name}=`));
  if (long) return long.slice(name.length + 1);
  return undefined;
}

type Scene = "vulnerable" | "clean" | "react" | "unknown-remote";

function resolveScene(args: string[]): { scene: Scene; subject: string; remote: boolean } {
  const url = opt(args, "--url") ?? opt(args, "-u");
  const path = opt(args, "--path") ?? opt(args, "-p");
  if (url && path && path !== ".") {
    return { scene: "vulnerable", subject: "error", remote: false };
  }
  if (url) {
    const short = url.replace(/^https?:\/\/(www\.)?github\.com\//, "");
    if (/facebook\/react/i.test(short)) {
      return { scene: "react", subject: short, remote: true };
    }
    return { scene: "unknown-remote", subject: short, remote: true };
  }
  const p = path ?? ".";
  if (p.includes("clean")) return { scene: "clean", subject: "/demo/clean-app", remote: false };
  return { scene: "vulnerable", subject: p === "." ? "/demo/acme-web" : p, remote: false };
}

function helpCra(): TermLine[] {
  return [
    line("Usage: cra [options]", "bold", 0),
    blank(10),
    line("Audit a project's SBOM against CISA Known Exploited Vulnerabilities (KEV)", "default", 8),
    blank(10),
    line("Options:", "bold", 12),
    line("  -p, --path <dir>          local project directory to audit (default: \".\")", "dim", 6),
    line("  -u, --url <github-url>    GitHub repository to audit", "dim", 6),
    line("  --cache <file>            KEV cache file (default: ~/.osprey/kev-cache.json)", "dim", 6),
    line("  --offline                 use only cached KEV data", "dim", 6),
    line("  --output <file>           write detailed JSON result to file", "dim", 6),
    line("  --verbose                 show detailed output", "dim", 6),
    line("  --fail-on-high            exit with error on high-confidence matches", "dim", 6),
    line("  --show-low                include low-confidence matches (default: true)", "dim", 6),
    line("  --github-token <token>    GitHub token for private repos", "dim", 6),
    line("  --summary                 show only the summary", "dim", 6),
    line("  -h, --help                display help for command", "dim", 6),
    blank(16),
    line("Commands:", "bold", 12),
    line("  cra, cra-audit            full audit: SBOM → KEV → cross-check → report", "dim", 6),
    line("  cra-sbom                  generate (and optionally sign) an SBOM", "dim", 6),
    line("  cra-kev                   check an existing SBOM or project against KEV", "dim", 6),
    line("  cra-report                GitHub Actions job summary, annotations, SARIF", "dim", 6),
    blank(12),
    line("Examples:", "bold", 12),
    line("  cra --path .", "cyan", 6),
    line("  cra --path ./clean-app --summary", "cyan", 6),
    line("  cra --url facebook/react", "cyan", 6),
    line("  cra --path . --verbose --fail-on-high", "cyan", 6),
    line("  cra-sbom --path . --sign --generate-key", "cyan", 6),
  ];
}

function auditVulnerable(opts: {
  verbose: boolean;
  summary: boolean;
  failOnHigh: boolean;
  subject: string;
  remote: boolean;
}): CommandResult {
  const { verbose, summary, failOnHigh, subject, remote } = opts;
  const lines: TermLine[] = [
    line(`Auditing: ${subject}`, "default", 40),
    blank(80),
    line(remote ? "Analyzing repository..." : "Analyzing project...", "dim", 420),
    line("Checking for vulnerabilities...", "dim", 620),
  ];

  if (summary) {
    lines.push(
      blank(180),
      line("✗ 2 VULNERABLE package(s) actively exploited", "bad", 80),
      line("✓ 1 package(s) have CVE but are SAFE (patched)", "ok", 40),
      line("⚠ 1 package(s) with UNKNOWN version status", "warn", 40),
      blank(60),
      line("     Package          Current    CVE              Patched Version", "bold", 40),
      line("  ✗  next             14.2.3     CVE-2025-29927   14.2.25", "bad", 30),
      line("  ✗  protobufjs       6.11.2     CVE-2023-36665   7.2.4", "bad", 30),
      blank(50),
    );
  } else {
    lines.push(
      ...section("Vulnerability Audit", 120),
      line("186 packages checked", "default", 30),
      blank(40),
      line("✗ 2 vulnerable package(s)", "bad", 50),
      line("✓ 1 safe (patched)", "ok", 30),
      line("⚠ 1 unknown", "warn", 30),
      ...section("High Confidence Vulnerabilities", 80),
      blank(20),
      line("1. CVE-2025-29927", "bold", 40),
      line("   Component: next@14.2.3", "cyan", 18),
      line("   PURL: pkg:npm/next@14.2.3", "dim", 12),
      line("   Vulnerability: Next.js middleware authorization bypass", "default", 12),
      line("   Version Status: AFFECTED (14.2.3 is vulnerable)", "bad", 12),
      line("   Product: Next.js (Vercel)", "default", 12),
      line("   Description: Improper authorization in middleware can allow attackers to skip checks.", "dim", 12),
      line("   Required Action: Apply mitigations per vendor instructions or discontinue use", "warn", 12),
      line("   Due Date: 2025-04-14", "default", 12),
      line("   Advisories: GHSA-f82v-jwr5-mffw", "dim", 12),
      blank(16),
      line("   ⚠ REMEDIATION:", "warn", 20),
      line("   Current: 14.2.3 → Upgrade to: 14.2.25+", "default", 12),
      line("   Run: npm install next@14.2.25", "dim", 12),
    );
    if (verbose) {
      lines.push(
        line("   Confidence: high", "dim", 10),
        line("   Matched On: purl", "dim", 10),
        line("   Date Added to KEV: 2025-03-24", "dim", 10),
      );
    }
    lines.push(
      blank(28),
      line("2. CVE-2023-36665", "bold", 40),
      line("   Component: protobufjs@6.11.2", "cyan", 18),
      line("   PURL: pkg:npm/protobufjs@6.11.2", "dim", 12),
      line("   Vulnerability: Prototype pollution in protobufjs", "default", 12),
      line("   Version Status: AFFECTED (6.11.2 is vulnerable)", "bad", 12),
      line("   Product: protobufjs (protobufjs)", "default", 12),
      line("   Required Action: Apply updates per vendor instructions", "warn", 12),
      blank(12),
      line("   ⚠ REMEDIATION:", "warn", 20),
      line("   Current: 6.11.2 → Upgrade to: 7.2.4+", "default", 12),
      line("   Run: npm install protobufjs@7.2.4", "dim", 12),
    );
    if (verbose) {
      lines.push(
        line("   Confidence: high", "dim", 10),
        line("   Matched On: purl", "dim", 10),
        line("   Date Added to KEV: 2023-07-10", "dim", 10),
      );
    }
    lines.push(
      ...section("Low Confidence Matches (Requires Manual Review)", 70),
      blank(16),
      line("1. CVE-2024-21762", "bold", 30),
      line("   Component: node@20.11.1", "cyan", 14),
      line("   Vulnerability: Fortinet FortiOS out-of-bounds write", "default", 12),
      line("   Version Status: UNKNOWN (cannot determine if 20.11.1 is affected)", "warn", 12),
      line("   Note: name/vendor match only — do not trigger incident clocks.", "dim", 14),
    );
    if (verbose) {
      lines.push(
        line("   Confidence: low", "dim", 10),
        line("   Matched On: product-name", "dim", 10),
      );
    }
    lines.push(
      blank(20),
      line("2. CVE-2021-23337 (patched)", "bold", 30),
      line("   Component: lodash@4.17.21", "cyan", 14),
      line("   PURL: pkg:npm/lodash@4.17.21", "dim", 12),
      line("   Version Status: NOT AFFECTED (4.17.21 is safe)", "ok", 12),
      line("   ✓ SAFE: Your current version is not affected by this vulnerability.", "ok", 12),
      ...section("Summary", 50),
      line("Status: FAILED", "bad", 30),
      blank(20),
    );
  }

  lines.push(line("Audit completed in 1.42s", "dim", 80));
  if (failOnHigh) {
    lines.push(
      blank(20),
      line("Found 2 actively exploited vulnerable package(s).", "bad", 20),
    );
  }
  return { lines, exitCode: failOnHigh ? 1 : 0 };
}

function auditClean(opts: {
  verbose: boolean;
  summary: boolean;
  subject: string;
  remote: boolean;
}): CommandResult {
  const { verbose, summary, subject, remote } = opts;
  const n = remote ? 412 : 245;
  const lines: TermLine[] = [
    line(`Auditing: ${subject}`, "default", 40),
    blank(80),
    line(remote ? "Analyzing repository..." : "Analyzing project...", "dim", 380),
    line("Checking for vulnerabilities...", "dim", 540),
  ];
  if (summary) {
    lines.push(
      blank(160),
      line("✓ No active exploitable vulnerabilities detected", "ok", 80),
      blank(20),
    );
  } else {
    lines.push(
      ...section("Vulnerability Audit", 100),
      line(`${n} packages checked`, "default", 30),
      blank(30),
      line("✓ No vulnerabilities found", "ok", 60),
    );
    if (verbose) {
      lines.push(
        blank(20),
        line(`KEV catalog: ${KEV_COUNT} entries (as of ${KEV_AS_OF})`, "dim", 20),
        line("Identity matching: PURL + vendor/product", "dim", 12),
        line("Version intelligence: OSV (npm)", "dim", 12),
        line("Low-confidence matches suppressed in this run: 0", "dim", 12),
        ...section("Summary", 40),
        line("Status: PASSED", "ok", 20),
      );
    }
    lines.push(blank(20));
  }
  lines.push(line("Audit completed in 0.86s", "dim", 70));
  return { lines, exitCode: 0 };
}

function runSbom(args: string[]): CommandResult {
  const sign = flag(args, "--sign");
  const gen = flag(args, "--generate-key");
  const path = opt(args, "--path") ?? opt(args, "-p") ?? ".";
  const lines: TermLine[] = [];
  if (gen) {
    lines.push(
      line("Generated signing keypair:", "ok", 80),
      line("  private: ~/.osprey/sbom-signing-key.pem", "dim", 20),
      line("  public:  ~/.osprey/sbom-signing-key.pem.pub", "dim", 16),
      line("Keep the private key secret — anyone with it can produce SBOMs that verify as yours.", "warn", 24),
      blank(30),
    );
  }
  lines.push(
    line("Detecting ecosystem... npm (package-lock.json)", "dim", 220),
    line("Walking lockfile (v3)...", "dim", 280),
    line(`Generated SBOM for ${path === "." ? "acme-web" : path} — 186 components`, "ok", 160),
    line("sha256: 7c2e91ab0d4f8e11c6a9b4f0e3d17a88c1b0e4f25a91c3d7e6a0b8c4d5e1f297", "dim", 30),
  );
  if (sign) {
    lines.push(
      line('Signed with key "default" at 2026-09-25T11:24:18.000Z', "ok", 80),
      line("Envelope: DSSE (Ed25519) — tamper detection enabled", "dim", 20),
    );
  }
  const out = opt(args, "--output") ?? opt(args, "-o");
  if (out) lines.push(line(`Wrote ${out}`, "dim", 20));
  return { lines, exitCode: 0 };
}

function runKev(args: string[]): CommandResult {
  const offline = flag(args, "--offline");
  const lines: TermLine[] = [
    line(offline ? "Polling CISA KEV... (offline cache)" : "Polling CISA KEV...", "dim", 200),
    line(`Loaded ${KEV_COUNT} KEV entries (as of ${KEV_AS_OF})`, "default", 420),
    line("Cross-checking 186 components...", "dim", 240),
    blank(40),
    line("✗ 2 HIGH confidence match(es)", "bad", 40),
    line("⚠ 1 LOW confidence match(es)", "warn", 24),
    blank(20),
    line("1. CVE-2025-29927  next@14.2.3  AFFECTED  high", "bad", 18),
    line("2. CVE-2023-36665  protobufjs@6.11.2  AFFECTED  high", "bad", 18),
    line("3. CVE-2024-21762  node@20.11.1  UNKNOWN  low", "warn", 18),
  ];
  if (flag(args, "--fail-on-high")) {
    lines.push(
      blank(20),
      line("2 actively exploited vulnerable package(s) — failing per --fail-on-high.", "bad", 20),
    );
    return { lines, exitCode: 1 };
  }
  return { lines, exitCode: 0 };
}

function runReport(): CommandResult {
  return {
    lines: [
      line("Reading last audit result...", "dim", 180),
      line("Wrote GitHub Actions job summary (2 findings)", "ok", 80),
      line("Wrote 2 inline annotations", "ok", 40),
      line("Wrote SARIF to osprey.sarif", "ok", 40),
      blank(12),
      line("::error file=package-lock.json::CVE-2025-29927 next@14.2.3 is AFFECTED (KEV, high)", "bad", 20),
      line("::error file=package-lock.json::CVE-2023-36665 protobufjs@6.11.2 is AFFECTED (KEV, high)", "bad", 20),
    ],
    exitCode: 0,
  };
}

export const PRESET_COMMANDS = [
  { label: "cra --path .", command: "cra --path ." },
  { label: "cra --path ./clean-app --summary", command: "cra --path ./clean-app --summary" },
  { label: "cra --url facebook/react", command: "cra --url facebook/react" },
  { label: "cra --path . --verbose", command: "cra --path . --verbose" },
  { label: "cra-sbom --sign --generate-key", command: "cra-sbom --path . --sign --generate-key" },
  { label: "help", command: "cra --help" },
] as const;

export function runCommand(raw: string): CommandResult {
  const input = raw.trim();
  if (!input) return { lines: [], exitCode: 0 };
  if (input === "clear" || input === "cls") return { lines: [], exitCode: 0, clear: true };

  const tokens = tokenize(input);
  const cmd = tokens[0] ?? "";
  const args = tokens.slice(1);

  if (cmd === "help" || cmd === "man") {
    return { lines: helpCra(), exitCode: 0 };
  }

  if (cmd === "ls") {
    return {
      lines: [
        line("acme-web/", "cyan", 8),
        line("clean-app/", "cyan", 8),
        line("package.json", "default", 8),
        line("package-lock.json", "default", 8),
        line("requirements.txt", "default", 8),
      ],
      exitCode: 0,
    };
  }

  if (cmd === "pwd") {
    return { lines: [line("/demo/acme-web", "default", 0)], exitCode: 0 };
  }

  if (cmd === "whoami") {
    return { lines: [line("osprey-demo", "default", 0)], exitCode: 0 };
  }

  if (cmd === "cat" && args[0] === "package.json") {
    return {
      lines: [
        line("{", "dim", 0),
        line('  "name": "acme-web",', "default", 4),
        line('  "version": "1.4.0",', "default", 4),
        line('  "dependencies": {', "default", 4),
        line('    "next": "14.2.3",', "cyan", 4),
        line('    "lodash": "4.17.21",', "cyan", 4),
        line('    "protobufjs": "6.11.2"', "cyan", 4),
        line("  }", "default", 4),
        line("}", "dim", 4),
      ],
      exitCode: 0,
    };
  }

  if (cmd === "cra-sbom") {
    if (flag(args, "--help") || flag(args, "-h")) {
      return {
        lines: [
          line("Usage: cra-sbom [options]", "bold", 0),
          line("Generate, sign, and store a CycloneDX SBOM for a project", "default", 8),
          blank(8),
          line("  -p, --path <dir>     project directory (default: \".\")", "dim", 6),
          line("  -o, --output <file>  write the SBOM JSON to this file", "dim", 6),
          line("  --sign               sign the SBOM with an Ed25519 key", "dim", 6),
          line("  --generate-key       generate a new signing keypair if missing", "dim", 6),
        ],
        exitCode: 0,
      };
    }
    return runSbom(args);
  }

  if (cmd === "cra-kev") {
    return runKev(args);
  }

  if (cmd === "cra-report") {
    return runReport();
  }

  if (cmd === "cra" || cmd === "cra-audit") {
    if (flag(args, "--help") || flag(args, "-h")) {
      return { lines: helpCra(), exitCode: 0 };
    }
    const url = opt(args, "--url") ?? opt(args, "-u");
    const path = opt(args, "--path") ?? opt(args, "-p");
    if (url && path && path !== ".") {
      return {
        lines: [line("Error: Cannot specify both --url and --path options", "bad", 0)],
        exitCode: 1,
      };
    }
    const { scene, subject, remote } = resolveScene(args);
    const verbose = flag(args, "--verbose");
    const summary = flag(args, "--summary");
    const failOnHigh = flag(args, "--fail-on-high");
    if (scene === "vulnerable") {
      return auditVulnerable({ verbose, summary, failOnHigh, subject, remote });
    }
    if (scene === "react") {
      return auditClean({
        verbose,
        summary,
        subject: "https://github.com/facebook/react",
        remote: true,
      });
    }
    if (scene === "unknown-remote") {
      return auditClean({ verbose, summary, subject, remote: true });
    }
    return auditClean({ verbose, summary, subject, remote });
  }

  return {
    lines: [
      line(`cra: command not found: ${cmd}`, "bad", 0),
      line("Try `cra --help`, `ls`, or click a preset below.", "dim", 8),
    ],
    exitCode: 127,
  };
}

export const TONE_CLASS: Record<Tone, string> = {
  default: "text-fg",
  dim: "text-muted",
  ok: "text-ok",
  bad: "text-bad",
  warn: "text-warn",
  cyan: "text-cyan",
  bold: "text-fg font-medium",
  prompt: "text-hot",
  hot: "text-hot",
};
