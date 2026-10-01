import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const LINKS = [
  { href: "/#kev", label: "KEV" },
  { href: "/#product", label: "Product" },
  { href: "/#cli", label: "CLI" },
  { href: "/blog/introducing-osprey", label: "Notes" },
  { href: "/#faq", label: "FAQ" },
] as const;

export function SiteNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <Link to="/" className="font-sans text-sm tracking-tight text-fg hover:text-hot">
          Osprey
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[11px] tracking-[0.12em] text-muted uppercase hover:text-hot"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/Purplelotusec/Osprey"
            target="_blank"
            rel="noreferrer"
            className="hidden h-9 items-center px-3 text-[11px] tracking-[0.12em] text-muted uppercase hover:text-hot sm:inline-flex"
          >
            GitHub
          </a>
          <a
            href="/#cli"
            className="inline-flex h-9 items-center bg-fg px-3.5 text-[11px] tracking-[0.12em] text-bg uppercase transition-colors hover:bg-hot hover:text-hot-fg"
          >
            Try the CLI
          </a>
          <button
            type="button"
            className="inline-flex size-9 items-center justify-center text-fg md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-4" strokeWidth={1.75} /> : <Menu className="size-4" strokeWidth={1.75} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-line px-4 py-3 md:hidden">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block py-2 text-xs tracking-[0.12em] text-muted uppercase"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="overflow-hidden px-4 py-10 text-center">
        <p
          className="select-none font-sans text-[clamp(4rem,18vw,14rem)] leading-none tracking-[-0.06em] text-transparent"
          style={{ WebkitTextStroke: "1px color-mix(in oklab, var(--color-fg) 22%, transparent)" }}
        >
          Osprey
        </p>
      </div>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 py-6 text-[11px] tracking-wide text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>Know what you ship. Know what is being exploited. © 2026 PurpleLotus.</p>
        <div className="flex gap-4">
          <a href="https://github.com/Purplelotusec/Osprey" className="hover:text-hot">
            GitHub
          </a>
          <a href="mailto:security@purplelotus.tech" className="hover:text-hot">
            security@purplelotus.tech
          </a>
        </div>
      </div>
    </footer>
  );
}
