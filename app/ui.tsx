// Shared bits. No server imports here: client components (form, shell) use these too.
import type { ReactNode } from "react";
import Link from "next/link";

type Pay = { amount: number; status: string };

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

// Lucide icon paths (ISC licence), inlined so there's no icon dependency.
const paths = {
  dashboard: <><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  userPlus: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></>,
  userCheck: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="m16 11 2 2 4-4" /></>,
  network: <><rect x="16" y="16" width="6" height="6" rx="1" /><rect x="2" y="16" width="6" height="6" rx="1" /><rect x="9" y="2" width="6" height="6" rx="1" /><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3M12 12V8" /></>,
  calendar: <><path d="M8 2v4M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></>,
  logo: <><path d="M8 2v4M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18m-12 6 2 2 4-4" /></>,
  wallet: <><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" /><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" /></>,
  receipt: <><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" /><path d="M14 8H8M16 12H8M13 16H8" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5M21 12H9" /></>,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  plus: <path d="M5 12h14M12 5v14" />,
  pencil: <><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" /><path d="m15 5 4 4" /></>,
  trash: <><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  back: <path d="m12 19-7-7 7-7M19 12H5" />,
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

const tone: Record<string, string> = {
  approved: "bg-ok/15 text-ok-ink before:bg-ok",
  paid: "bg-ok/15 text-ok-ink before:bg-ok",
  pending: "bg-warn/20 text-warn-ink before:bg-warn",
  due: "bg-warn/20 text-warn-ink before:bg-warn",
  rejected: "bg-bad/15 text-bad-ink before:bg-bad",
};

// text + dot, so status never relies on colour alone
export const Badge = ({ s }: { s: string }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize before:size-1.5 before:rounded-full ${tone[s]}`}>{s}</span>
);

const iconTone = { accent: "text-accent", gold: "text-gold", ink: "text-ink", ok: "text-ok", warn: "text-warn" };

export const Stat = ({ label, value, icon, color = "accent", sub, className = "" }: {
  label: string; value: string | number; icon: IconName; color?: keyof typeof iconTone; sub?: string; className?: string;
}) => (
  <div className={`card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5 ${className}`}>
    <span className={`chip size-10 sm:size-12 ${iconTone[color]}`}><Icon n={icon} /></span>
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted sm:text-sm">{label}</p>
      <p className="truncate text-lg font-semibold tabular-nums sm:text-2xl">{value}</p>
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
    {children && <div className="flex flex-wrap gap-3">{children}</div>}
  </div>
);

export const Back = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link href={href} className="link mb-3 inline-flex items-center gap-1.5 text-sm"><Icon n="back" className="size-4" />{children}</Link>
);

export const Empty = ({ icon, title, children }: { icon: IconName; title: string; children?: ReactNode }) => (
  <div className="flex flex-col items-center px-6 py-12 text-center">
    <span className="chip size-14 text-faint"><Icon n={icon} className="size-6" /></span>
    <p className="mt-4 font-semibold">{title}</p>
    {children && <p className="mt-1 max-w-xs text-sm text-muted">{children}</p>}
  </div>
);

// Native popover = Esc / click-outside to close, no JS. Open with <button popoverTarget={id}>.
export const Modal = ({ id, title, children }: { id: string; title: string; children: ReactNode }) => (
  <div id={id} popover="auto" role="dialog" aria-labelledby={`${id}-title`} className="modal">
    <div className="mb-5 flex items-center justify-between gap-3">
      <h2 id={`${id}-title`} className="text-lg font-semibold">{title}</h2>
      <button popoverTarget={id} popoverTargetAction="hide" aria-label="Close" className="icon-btn size-9"><Icon n="x" className="size-4" /></button>
    </div>
    {children}
  </div>
);

export const DateTile = ({ d, muted = false }: { d: Date; muted?: boolean }) => (
  <div className="well grid size-14 shrink-0 place-content-center text-center leading-none">
    <span className={`text-[11px] font-semibold tracking-wider uppercase ${muted ? "text-muted" : "text-accent"}`}>
      {new Date(d).toLocaleDateString("en-IN", { month: "short", timeZone: "UTC" })}
    </span>
    <span className="mt-1 text-xl font-bold">{new Date(d).getUTCDate()}</span>
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
