// Shared design-system components. No server imports here: client components (forms, shell) use these too.
// Primitives that are only styling (Button, Input, Select, DataTable, Card) are CSS classes in globals.css:
// btn / btn-ghost / btn-soft / btn-sm / icon-btn, input, field, tbl, card.
import type { ComponentProps, CSSProperties, ReactNode } from "react";
import Link from "next/link";

type Pay = { amount: number; status: string };
// a member's embedded payment (the mongoose models are untyped, so lists annotate with this)
export type Payment = Pay & { _id: unknown; type?: string; mode?: string; date: Date; note?: string };

export const day = (d: Date | string) => new Date(d).toISOString().slice(0, 10);
export const today = () => new Date(day(new Date()));
export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
export const total = (pays: Pay[], status: string) => pays.reduce((t, p) => t + (p.status === status ? p.amount : 0), 0);
// dates are stored as UTC midnight (from <input type="date">), so format in UTC too
export const fmt = (d: Date | string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
// "12 Mar", no year (birthdays, anniversaries); "—" when not set
export const dayMonth = (d?: Date | string | null) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" }) : "—");
export const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
export const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
// ?v= changes with each upload, so the route can cache forever
export const photoUrl = (m: { _id: unknown; photoAt?: Date | null }) => (m.photoAt ? `/members/${m._id}/photo?v=${+new Date(m.photoAt)}` : undefined);
// "/members" + only the non-empty params, for filter links that keep the other filters
export const withQuery = (path: string, params: Record<string, string>) => {
  const qs = String(new URLSearchParams(Object.entries(params).filter(([, v]) => v)));
  return qs ? `${path}?${qs}` : path;
};
const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
// "today", "3 days ago"; a plain date past a month
const ago = (d: Date) => {
  const days = Math.round((+today() - +new Date(day(d))) / 864e5);
  return days > 30 || days < 0 ? fmt(d) : rtf.format(-days, "day");
};

// Lucide icon paths (ISC licence), inlined so there's no icon dependency.
const paths = {
  home: <><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  user: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  userPlus: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></>,
  userCheck: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="m16 11 2 2 4-4" /></>,
  network: <><rect x="16" y="16" width="6" height="6" rx="1" /><rect x="2" y="16" width="6" height="6" rx="1" /><rect x="9" y="2" width="6" height="6" rx="1" /><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3M12 12V8" /></>,
  calendar: <><path d="M8 2v4M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></>,
  logo: <><path d="M8 2v4M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18m-12 6 2 2 4-4" /></>,
  wallet: <><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" /><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" /></>,
  receipt: <><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M14 8H8M16 12H8M13 16H8" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  history: <><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M12 7v5l4 2" /></>,
  settings: <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></>,
  shield: <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></>,
  lock: <><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  flag: <path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528" />,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  more: <><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></>,
  grid: <><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></>,
  list: <path d="M3 12h.01M3 18h.01M3 6h.01M8 12h13M8 18h13M8 6h13" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  plus: <path d="M5 12h14M12 5v14" />,
  pencil: <><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /><path d="m15 5 4 4" /></>,
  trash: <><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  right: <path d="m9 18 6-6-6-6" />,
  back: <path d="m12 19-7-7 7-7M19 12H5" />,
  arrow: <path d="M5 12h14m-7-7 7 7-7 7" />,
  chart: <><path d="M3 3v16a2 2 0 0 0 2 2h16" /><path d="M18 17V9M13 17V5M8 17v-3" /></>,
  eye: <><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49M14.084 14.158a3 3 0 0 1-4.242-4.242" /><path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143M2 2l20 20" /></>,
  pin: <><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></>,
  phone: <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />,
  alert: <><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></>,
  meeting: <><rect width="8" height="4" x="8" y="2" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M12 11h4M12 16h4M8 11h.01M8 16h.01" /></>,
  award: <><path d="m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526" /><circle cx="12" cy="8" r="6" /></>,
};
export type IconName = keyof typeof paths;

export const Icon = ({ n, className = "size-5" }: { n: IconName; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
    {paths[n]}
  </svg>
);

// Brand mark + wordmark. `dark` = on the plum sidebar / hero. Hide the words with [&_.logo-words]:hidden.
export const Logo = ({ dark = false, className = "" }: { dark?: boolean; className?: string }) => (
  <span className={`flex items-center gap-3 ${className}`}>
    <span className={`grid size-10 shrink-0 place-items-center rounded-full text-gold ${dark ? "bg-white/10 ring-1 ring-white/15" : "bg-plum"}`}><Icon n="logo" /></span>
    <span className="logo-words leading-tight">
      <span className={`block font-bold tracking-tight ${dark ? "text-white" : "text-ink"}`}>Eventko</span>
      <span className={`block text-xs ${dark ? "text-white/60" : "text-muted"}`}>Organization</span>
    </span>
  </span>
);

// round avatar: the photo when there is one, else initials
export const Avatar = ({ name, src, className = "" }: { name: string; src?: string; className?: string }) => (
  <span className={`avatar ${className}`}>
    {/* eslint-disable-next-line @next/next/no-img-element -- tiny pre-shrunk photos behind login; the optimizer can't forward the cookie */}
    {src ? <img src={src} alt="" className="size-full object-cover" /> : initials(name)}
  </span>
);

// overlapping faces + "+N"; decorative (callers print the count in words next to it)
export const AvatarGroup = ({ people, count = people.length, max = 4, className = "size-8 text-[11px]" }: {
  people: { name: string; src?: string }[]; count?: number; max?: number; className?: string;
}) => (
  <span aria-hidden className="flex -space-x-1.5">
    {people.slice(0, max).map((p, i) => <Avatar key={i} name={p.name} src={p.src} className={`ring-2 ring-white ${className}`} />)}
    {count > max && <span className={`avatar bg-surface text-muted ring-2 ring-white ${className}`}>+{count - max}</span>}
  </span>
);

const tone: Record<string, string> = {
  approved: "bg-ok/10 text-ok-ink before:bg-ok",
  paid: "bg-ok/10 text-ok-ink before:bg-ok",
  going: "bg-ok/10 text-ok-ink before:bg-ok",
  pending: "bg-warn/12 text-warn-ink before:bg-warn",
  due: "bg-warn/12 text-warn-ink before:bg-warn",
  rejected: "bg-bad/8 text-bad-ink before:bg-bad",
  upcoming: "bg-tint text-accent before:bg-accent",
  ongoing: "bg-ok/10 text-ok-ink before:bg-ok",
  completed: "bg-surface text-muted before:bg-faint",
};

// StatusBadge: compact pill, text + dot, so status never relies on colour alone
export const Badge = ({ s, label = s, className = "" }: { s: string; label?: string; className?: string }) => (
  <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize before:size-1.5 before:rounded-full ${tone[s]} ${className}`}>{label}</span>
);

const iconTone = { accent: "bg-tint text-accent", gold: "bg-gold/15 text-gold-ink", ink: "bg-surface text-ink", ok: "bg-ok/10 text-ok-ink", warn: "bg-warn/12 text-warn-ink" };

// StatCard: compact, icon chip + label + value
export const Stat = ({ label, value, icon, color = "accent", sub, className = "" }: {
  label: string; value: string | number; icon: IconName; color?: keyof typeof iconTone; sub?: string; className?: string;
}) => (
  <div className={`card flex items-center gap-3 p-4 ${className}`}>
    <span className={`chip max-sm:hidden ${iconTone[color]}`}><Icon n={icon} /></span>
    <div className="min-w-0">
      <p className="truncate text-xs font-medium text-muted">{label}</p>
      <p className="truncate text-lg font-bold tabular-nums sm:text-xl">{value}</p>
      {sub && <p className="truncate text-xs text-muted">{sub}</p>}
    </div>
  </div>
);

export const PageHeader = ({ title, sub, children }: { title: ReactNode; sub?: ReactNode; children?: ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div className="min-w-0">
      <h1>{title}</h1>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    </div>
    {children && <div className="flex flex-wrap gap-2.5">{children}</div>}
  </div>
);

// section title inside a page: heading + optional "View all" link
export const SectionHead = ({ title, href, cta = "View all" }: { title: ReactNode; href?: string; cta?: string }) => (
  <div className="mb-3 flex items-center justify-between gap-3">
    <h2 className="font-semibold">{title}</h2>
    {href && <Link href={href} className="link text-sm">{cta}</Link>}
  </div>
);

// Segmented filter tabs. Plain links: the filter lives in the URL, so it survives reloads and back/forward.
export const Tabs = ({ label, items }: { label: string; items: [href: string, text: ReactNode, on: boolean][] }) => (
  <nav aria-label={label} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
    <div className="inline-flex gap-1 rounded-ctl border border-line bg-white p-1">
      {items.map(([href, text, on]) => (
        <Link key={href} href={href} aria-current={on ? "page" : undefined} className="flex h-9 shrink-0 items-center rounded-[8px] px-3.5 text-sm font-medium whitespace-nowrap text-muted transition-colors duration-200 hover:bg-surface hover:text-ink aria-[current=page]:bg-accent aria-[current=page]:text-white">
          {text}
        </Link>
      ))}
    </div>
  </nav>
);

// Tabs + search on one row (desktop), stacked on phones
export const FilterBar = ({ children }: { children: ReactNode }) => (
  <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">{children}</div>
);

// GET search form: keeps the other filters as hidden fields; Clear drops only the query
export const SearchBar = ({ q, label, placeholder, keep = {}, clear }: { q: string; label: string; placeholder: string; keep?: Record<string, string>; clear: string }) => (
  <form role="search" className="flex gap-2 lg:w-md">
    {Object.entries(keep).map(([k, v]) => v && <input key={k} type="hidden" name={k} value={v} />)}
    <div className="relative min-w-0 flex-1">
      <Icon n="search" className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint" />
      <input name="q" type="search" defaultValue={q} placeholder={placeholder} aria-label={label} className="input pl-10" />
    </div>
    <button className="btn btn-ghost max-sm:px-3" aria-label="Search"><Icon n="search" className="size-4 sm:hidden" /><span className="max-sm:hidden">Search</span></button>
    {q && <Link href={clear} className="btn btn-ghost">Clear</Link>}
  </form>
);

export const Back = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link href={href} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-accent"><Icon n="back" className="size-4" />{children}</Link>
);

// EmptyState
export const Empty = ({ icon, title, children }: { icon: IconName; title: string; children?: ReactNode }) => (
  <div className="flex flex-col items-center px-6 py-12 text-center">
    <span className="chip size-14"><Icon n={icon} className="size-6" /></span>
    <p className="mt-4 font-semibold">{title}</p>
    {children && <p className="mt-1 max-w-xs text-sm text-muted">{children}</p>}
  </div>
);

// error notification (server errors come back as ?error= or a returned string)
export const Alert = ({ children, className = "mb-6" }: { children?: ReactNode; className?: string }) =>
  children ? <p role="alert" className={`err ${className}`}><Icon n="alert" className="size-5 shrink-0" />{children}</p> : null;

// Native popover = Esc / click-outside to close, no JS. Open with <button popoverTarget={id}>. Bottom sheet on phones.
export const Modal = ({ id, title, children }: { id: string; title: string; children: ReactNode }) => (
  <div id={id} popover="auto" role="dialog" aria-labelledby={`${id}-title`} className="modal">
    <div className="mb-5 flex items-center justify-between gap-3">
      <h2 id={`${id}-title`} className="text-lg font-semibold">{title}</h2>
      <button popoverTarget={id} popoverTargetAction="hide" aria-label="Close" className="icon-btn size-9"><Icon n="x" className="size-4" /></button>
    </div>
    {children}
  </div>
);

// Dropdown / contextual menu: a button + native popover anchored under it (CSS anchor positioning; centred where
// unsupported), a bottom sheet on phones. Items: <Link className="menu-item">, <a>, or <button> in a <form>.
export const Menu = ({ id, label, trigger, className = "icon-btn size-9", children }: { id: string; label: string; trigger?: ReactNode; className?: string; children: ReactNode }) => (
  <>
    <button popoverTarget={id} aria-label={label} title={label} className={className} style={{ anchorName: `--${id}` } as CSSProperties}>
      {trigger ?? <Icon n="more" />}
    </button>
    <div id={id} popover="auto" aria-label={label} className="menu" style={{ positionAnchor: `--${id}` } as CSSProperties}>{children}</div>
  </>
);

// Login, Join and registration status: centred card on lavender
export const AuthCard = ({ children }: { children: ReactNode }) => (
  <main className="page-in grid min-h-dvh place-items-center bg-tint px-4 py-10">
    <div className="w-full max-w-md">
      <Link href="/" className="mb-6 flex justify-center"><Logo /></Link>
      <div className="card p-6 shadow-hover sm:p-8">{children}</div>
    </div>
  </main>
);

export const AuthHead = ({ h: H = "h1", title, sub }: { h?: "h1" | "h2"; title: string; sub: string }) => (
  <div className="mb-6 text-center">
    <H className="text-2xl font-bold tracking-tight text-ink">{title}</H>
    <p className="mt-1 text-sm text-muted">{sub}</p>
  </div>
);

// +91 and the flag are decoration; only what's typed is submitted (phones are stored as the bare 10 digits).
// SVG flag, not 🇮🇳: Windows renders flag emoji as the letters "IN".
export const PhoneInput = (props: ComponentProps<"input">) => (
  <div className="relative">
    <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 flex items-center gap-2 pl-3.5 text-sm text-ink">
      <svg viewBox="0 0 9 6" className="h-3 w-[18px] rounded-[2px] ring-1 ring-line">
        <path fill="#f93" d="M0 0h9v2H0z" /><path fill="#fff" d="M0 2h9v2H0z" /><path fill="#128807" d="M0 4h9v2H0z" />
        <circle cx="4.5" cy="3" r=".75" fill="none" stroke="#008" strokeWidth=".2" />
      </svg>
      +91
    </span>
    <input type="tel" {...props} className="input pl-[4.75rem]" />
  </div>
);

// calendar badge: month over day
export const DateTile = ({ d, muted = false, className = "" }: { d: Date; muted?: boolean; className?: string }) => (
  <div className={`grid size-14 shrink-0 place-content-center rounded-ctl border border-line bg-white text-center leading-none ${className}`}>
    <span className={`text-[11px] font-bold tracking-wider uppercase ${muted ? "text-muted" : "text-accent"}`}>
      {new Date(d).toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" })}
    </span>
    <span className="mt-1 text-xl font-bold text-ink">{new Date(d).getUTCDate()}</span>
  </div>
);

// Events have no cover photo field, so the cover is a solid brand tone picked from the id, signed with the weekday.
const covers = ["bg-accent", "bg-plum", "bg-accent-hover", "bg-[#3a2850]"];
const coverOf = (id: string) => covers[[...id].reduce((h, c) => h + c.charCodeAt(0), 0) % covers.length];

export const EventCover = ({ id, d, done, className = "h-32" }: { id: string; d: Date; done?: boolean; className?: string }) => (
  <div aria-hidden className={`relative overflow-hidden ${done ? "bg-[#5d566b]" : coverOf(id)} ${className}`}>
    <Icon n="logo" className="absolute top-3.5 right-4 size-5 text-gold/80" />
    <span className="absolute right-4 bottom-3 font-serif text-2xl text-white/35 italic select-none">
      {new Date(d).toLocaleDateString("en-IN", { weekday: "long", timeZone: "UTC" })}
    </span>
  </div>
);

export const EventCard = ({ e, status, people = [], children }: {
  e: { _id: unknown; title: string; date: Date; venue?: string; attendees?: unknown[] };
  status: string; people?: { name: string; src?: string }[]; children?: ReactNode;
}) => {
  const id = String(e._id);
  const going = e.attendees?.length ?? 0;
  return (
    <article className="card lift relative flex flex-col overflow-hidden p-0">
      <div className="relative">
        <EventCover id={id} d={e.date} done={status === "completed"} />
        <DateTile d={e.date} muted={status === "completed"} className="absolute bottom-0 left-4 translate-y-1/2 shadow-card" />
        <Badge s={status} className="absolute top-3 left-3 bg-white!" />
      </div>
      <div className="flex flex-1 flex-col p-4 pt-10">
        <h3 className="line-clamp-2 font-semibold"><Link href={`/events/${id}`} className="after:absolute after:inset-0 hover:text-accent">{e.title}</Link></h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted"><Icon n="pin" className="size-3.5 shrink-0" /><span className="truncate">{e.venue || "Venue to be announced"}</span></p>
        <div className="mt-auto flex items-center gap-2 pt-4 text-xs font-medium text-muted">
          {people.length > 0 && <AvatarGroup people={people} count={going} max={3} className="size-7 text-[10px]" />}
          {going ? `${going} going` : "No registrations yet"}
          {children && <div className="relative z-10 ml-auto flex gap-1">{children}</div>}
        </div>
      </div>
    </article>
  );
};

// Directory card: the whole card opens the profile; `actions` (a Menu) sits above the stretched link
export const MemberCard = ({ m, role, actions }: { m: { _id: unknown; name: string; memberCode: string; status: string; photoAt?: Date | null }; role?: string; actions?: ReactNode }) => (
  <article className="card lift relative flex flex-col items-center overflow-hidden p-0 pb-4 text-center">
    <div aria-hidden className="h-14 w-full bg-tint" />
    <Avatar name={m.name} src={photoUrl(m)} className="-mt-8 size-16 text-base ring-4 ring-white" />
    <h3 className="mt-2 max-w-full truncate px-4 font-semibold"><Link href={`/members/${m._id}`} className="after:absolute after:inset-0 hover:text-accent">{m.name}</Link></h3>
    <p className="max-w-full truncate px-4 text-sm text-muted">{role || "—"}</p>
    <p className="mt-0.5 font-mono text-xs text-muted">{m.memberCode}</p>
    <Badge s={m.status} className="mt-3" />
    {actions && <div className="absolute top-2 right-2 z-10">{actions}</div>}
  </article>
);

// One social-feed entry. Callers pick the container (a card each on Home, rows on Reports).
type Activity = { at: Date; icon: IconName; who?: { name: string; src?: string }; text: ReactNode; body?: string; href: string };

type Who = { _id: unknown; name: string; photoAt?: Date | null };

// Feed built from timestamps already stored (no activity log). ponytail: newest `max` of everything; add a log collection if it needs paging.
export function activity({ members = [], pays = [], meetings = [], events = [] }: {
  members?: (Who & { status: string; createdAt: Date })[];
  pays?: (Payment & { m: Who })[];
  meetings?: { title: string; notes?: string; createdAt: Date }[];
  events?: { _id: unknown; title: string; date: Date; description?: string; createdAt: Date }[];
}, max = 8): Activity[] {
  const who = (m: Who) => ({ name: m.name, src: photoUrl(m) });
  const b = (s: string) => <b className="font-semibold">{s}</b>;
  const items: Activity[] = [
    ...members.map((m) => ({ at: m.createdAt, icon: "userPlus" as const, who: who(m), text: <>{b(m.name)} {m.status === "approved" ? "joined the community" : "applied to join"}</>, href: `/members/${m._id}` })),
    ...pays.filter((p) => p.status === "paid").map((p) => ({ at: p.date, icon: "wallet" as const, who: who(p.m), text: <>{b(p.m.name)} paid {inr(p.amount)}{p.type && ` · ${p.type}`}</>, href: `/members/${p.m._id}/payments` })),
    ...meetings.map((x) => ({ at: x.createdAt, icon: "meeting" as const, text: <>Meeting recorded: {b(x.title)}</>, body: x.notes, href: "/meetings" })),
    ...events.map((x) => ({ at: x.createdAt, icon: "calendar" as const, text: <>New event: {b(x.title)} · {fmt(x.date)}</>, body: x.description, href: `/events/${x._id}` })),
  ];
  return items.sort((a, z) => +new Date(z.at) - +new Date(a.at)).slice(0, max);
}

export const ActivityItem = ({ a }: { a: Activity }) => (
  <div className="relative flex gap-3">
    {a.who ? <Avatar name={a.who.name} src={a.who.src} /> : <span className="chip"><Icon n={a.icon} className="size-[18px]" /></span>}
    <div className="min-w-0 flex-1">
      <p className="text-sm leading-snug"><Link href={a.href} className="after:absolute after:inset-0">{a.text}</Link></p>
      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted"><Icon n={a.icon} className="size-3.5" />{ago(a.at)}</p>
      {a.body && <p className="mt-2 line-clamp-3 text-sm whitespace-pre-line text-muted">{a.body}</p>}
    </div>
  </div>
);

export function PaymentFields() {
  return (
    <>
      <label className="field">Amount (₹)<input name="amount" type="number" inputMode="decimal" min="0" step="any" required placeholder="0" className="input" /></label>
      <label className="field">
        Payment type
        <select name="type" className="input">{["Registration", "Membership", "Donation", "Other"].map((t) => <option key={t}>{t}</option>)}</select>
      </label>
      <label className="field">
        Payment mode
        <select name="mode" className="input">{["Cash", "UPI", "Bank", "Other"].map((t) => <option key={t}>{t}</option>)}</select>
      </label>
      <label className="field">
        Payment status
        <select name="status" className="input"><option value="paid">Paid</option><option value="due">Due</option></select>
      </label>
      <label className="field">Date<input name="date" type="date" defaultValue={day(new Date())} className="input" /></label>
      <label className="field">Note<input name="note" placeholder="Optional" className="input" /></label>
    </>
  );
}

// max = today blocks future dates in the picker; the server checks again (plus anniversary >= birth).
// suppressHydrationWarning: "today" can differ between server and browser around midnight.
export function MemberDateFields({ m }: { m?: { dateOfBirth?: Date | null; anniversaryDate?: Date | null } }) {
  const max = day(new Date());
  const opt = <span className="hint">(optional)</span>;
  return (
    <>
      <label className="field"><span>Date of birth {opt}</span><input name="dateOfBirth" type="date" max={max} defaultValue={m?.dateOfBirth ? day(m.dateOfBirth) : ""} suppressHydrationWarning className="input" /></label>
      <label className="field"><span>Anniversary date {opt}</span><input name="anniversaryDate" type="date" max={max} defaultValue={m?.anniversaryDate ? day(m.anniversaryDate) : ""} suppressHydrationWarning className="input" /></label>
    </>
  );
}

export function EventFields({ e }: { e?: { title: string; date: Date; venue?: string; description?: string } }) {
  return (
    <>
      <label className="field">Title<input name="title" defaultValue={e?.title} required className="input" /></label>
      <label className="field">Date<input name="date" type="date" defaultValue={e && day(e.date)} required className="input" /></label>
      <label className="field sm:col-span-2">Venue<input name="venue" defaultValue={e?.venue} className="input" /></label>
      <label className="field sm:col-span-2">
        Description
        <textarea name="description" defaultValue={e?.description} rows={3} className="input" />
      </label>
    </>
  );
}
