"use client";

import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "./actions";
import { Icon, initials, type IconName } from "./ui";

export type NavLink = [href: string, label: string, icon: IconName];

// Sidebar on lg+, slide-in drawer below. Only plain, non-sensitive fields come in as props.
export function Shell({ links, user, children }: { links: NavLink[]; user: { name: string; role: string }; children: ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);
  // longest matching prefix wins, so /members/new highlights "Add Member", not "Members"
  const active = links.filter(([h]) => path === h || path.startsWith(h + "/")).sort((a, b) => b[0].length - a[0].length)[0];

  useEffect(() => {
    if (open) firstLink.current?.focus();
  }, [open]);

  const close = () => {
    setOpen(false);
    menuBtn.current?.focus();
  };

  return (
    <div className="lg:flex">
      <div onClick={close} aria-hidden className={`fixed inset-0 z-30 bg-ink/30 transition-opacity duration-200 lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} />

      <aside
        id="nav"
        onKeyDown={(e) => e.key === "Escape" && close()}
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-surface p-4 transition-[translate,visibility] duration-200 lg:visible lg:sticky lg:top-0 lg:h-dvh lg:w-60 lg:shrink-0 lg:translate-x-0 ${open ? "visible translate-x-0" : "invisible -translate-x-full"}`}
      >
        <div className="flex items-center gap-3 px-1 py-1">
          <span className="grid size-10 place-items-center rounded-xl bg-surface text-gold shadow-soft"><Icon n="logo" /></span>
          <span className="font-semibold tracking-tight">Event Manager</span>
          <button onClick={close} aria-label="Close menu" className="icon-btn ml-auto size-9 lg:hidden"><Icon n="x" className="size-4" /></button>
        </div>

        <nav aria-label="Main" className="mt-8 flex flex-col gap-2">
          {links.map(([href, label, icon], i) => (
            <Link
              key={href}
              href={href}
              ref={i ? undefined : firstLink}
              onClick={() => setOpen(false)}
              aria-current={active?.[0] === href ? "page" : undefined}
              className="nav-item"
            >
              <Icon n={icon} />
              {label}
              <Pending />
            </Link>
          ))}
        </nav>

        <form action={logout} className="mt-auto pt-4">
          <button className="nav-item w-full cursor-pointer text-bad-ink hover:text-bad-ink">
            <Icon n="logout" />
            Logout
          </button>
        </form>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 bg-surface/85 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button ref={menuBtn} onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} aria-controls="nav" className="icon-btn size-10 lg:hidden">
            <Icon n="menu" />
          </button>
          <p className="truncate text-base font-semibold sm:text-lg">{active?.[1] ?? "Event Manager"}</p>
          <div className="ml-auto flex min-w-0 items-center gap-3">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.role}</p>
            </div>
            <span className="avatar" title={user.name}>{initials(user.name)}</span>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pt-4 pb-12 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

// spinner on the nav link being navigated to (no loading.js: its fallback would turn auth redirects into streamed 200s)
function Pending() {
  const { pending } = useLinkStatus();
  return <span aria-hidden className={`ml-auto size-3.5 rounded-full border-2 border-line border-t-accent ${pending ? "animate-spin" : "invisible"}`} />;
}

export function PasswordInput(props: ComponentProps<"input">) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={show ? "text" : "password"} className="input pr-12" />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label="Show password"
        aria-pressed={show}
        className="absolute inset-y-0 right-0 grid w-12 cursor-pointer place-items-center rounded-r-xl text-faint transition-colors hover:text-ink"
      >
        <Icon n={show ? "eyeOff" : "eye"} />
      </button>
    </div>
  );
}

// Submit button: disables itself while its form's server action runs; `ask` adds a confirm() step.
export function Btn({ ask, disabled, ...props }: ComponentProps<"button"> & { ask?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      {...props}
      disabled={pending || disabled}
      aria-busy={pending}
      onClick={ask ? (e) => { if (!confirm(ask)) e.preventDefault(); } : undefined}
    />
  );
}
