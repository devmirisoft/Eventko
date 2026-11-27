"use client";

import { useId, useRef, useState, type ComponentProps, type MouseEvent, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "./actions";
import { Avatar, Icon, Logo, Menu, type IconName } from "./ui";

export type NavLink = [href: string, label: string, icon: IconName, badge?: number];
type User = { name: string; role: string; src?: string; isAdmin: boolean };

// links inside a popover menu/sheet: close it on click (the shell stays mounted across navigations)
const hideOnLink = (e: MouseEvent<HTMLElement>) => {
  if ((e.target as Element).closest("a")) (e.currentTarget.closest("[popover]") as HTMLElement | null)?.hidePopover();
};

const LogoutButton = ({ className, label = "Log out" }: { className: string; label?: string }) => (
  <form action={logout}>
    <button className={`${className} w-full`}><Icon n="logout" /><span className="label">{label}</span></button>
  </form>
);

// AppShell. lg+: plum sidebar; md-lg: the same sidebar as an icon rail; phones: bottom tabs + a "More" sheet.
// Only plain, non-sensitive fields come in as props.
export function Shell({ links, tabs, user, children }: { links: NavLink[]; tabs: NavLink[]; user: User; children: ReactNode }) {
  const raw = usePathname();
  const path = raw.startsWith("/approvals") ? "/members" + raw : raw; // approvals live under Members
  // longest matching prefix wins
  const active = [...links, ...tabs].filter(([h]) => path === h || path.startsWith(h + "/")).sort((a, b) => b[0].length - a[0].length)[0];
  const cur = (h: string) => (active?.[0] === h ? "page" : undefined);
  const more = links.filter(([h]) => !tabs.some(([t]) => t === h));

  return (
    <div className="md:flex">
      {/* Sidebar */}
      <aside className="sticky top-0 z-40 hidden h-dvh shrink-0 flex-col bg-plum p-3 text-white md:flex md:w-[76px] lg:w-64 lg:p-4">
        <Link href="/dashboard" aria-label="Eventko home" className="flex h-12 items-center px-1 max-lg:justify-center [&_.logo-words]:max-lg:hidden"><Logo dark /></Link>
        <nav aria-label="Main" className="-mx-3 mt-6 flex flex-1 flex-col gap-1 overflow-y-auto px-3 lg:-mx-4 lg:px-4">
          {links.map(([href, label, icon, badge]) => (
            <Link key={href} href={href} title={label} aria-current={cur(href)} className="side-link">
              <Icon n={icon} />
              <span className="max-lg:sr-only">{label}</span>
              {!!badge && <span className="ml-auto rounded-full bg-gold px-1.5 text-[11px] leading-5 font-bold text-plum max-lg:absolute max-lg:top-1 max-lg:right-1">{badge}<span className="sr-only"> pending</span></span>}
              <Pending />
            </Link>
          ))}
        </nav>
        <LogoutButton className="side-link cursor-pointer [&_.label]:max-lg:sr-only" />
      </aside>

      <div className="min-w-0 flex-1">
        {/* TopNavigation */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" aria-label="Home" className="md:hidden [&_.logo-words]:hidden"><Logo /></Link>
          <p className="truncate text-base font-semibold">{active?.[1] ?? "Eventko"}</p>
          <div className="ml-auto flex items-center gap-2">
            {user.isAdmin && (
              <form action="/members" role="search" className="relative hidden w-64 md:block xl:w-80">
                <Icon n="search" className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint" />
                <input name="q" type="search" placeholder="Search members" aria-label="Search members" className="input h-10 bg-surface pl-10" />
              </form>
            )}
            <Menu
              id="account-menu"
              label="Account menu"
              className="flex cursor-pointer items-center gap-2 rounded-full p-1 transition-colors hover:bg-surface lg:pr-3"
              trigger={<>
                <Avatar name={user.name} src={user.src} className="size-9 text-xs" />
                <span className="hidden max-w-40 truncate text-sm font-semibold lg:block">{user.name.split(" ")[0]}</span>
                <Icon n="chevron" className="hidden size-4 text-muted lg:block" />
              </>}
            >
              <div onClick={hideOnLink}>
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <Avatar name={user.name} src={user.src} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{user.name}</p>
                    <p className="truncate text-xs text-muted">{user.role}</p>
                  </div>
                </div>
                <div className="menu-sep" />
                <Link href="/settings" className="menu-item"><Icon n="settings" className="size-4" />Profile &amp; settings</Link>
                {user.isAdmin && <Link href="/approvals" className="menu-item"><Icon n="userCheck" className="size-4" />Member requests</Link>}
                <div className="menu-sep" />
                <LogoutButton className="menu-item text-bad-ink hover:bg-bad/8 hover:text-bad-ink [&_svg]:size-4" />
              </div>
            </Menu>
          </div>
        </header>

        <main className="page-in mx-auto max-w-6xl px-4 pt-6 pb-28 sm:px-6 md:pb-12 lg:px-8">{children}</main>
      </div>

      {/* MobileNavigation: bottom tabs + "More" sheet with everything else */}
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="grid grid-cols-5">
          {tabs.map(([href, label, icon]) => (
            <li key={href}>
              <Link href={href} aria-current={cur(href)} className="flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted transition-colors aria-[current=page]:text-accent">
                <Icon n={icon} className="size-[22px]" />{label}
              </Link>
            </li>
          ))}
          <li>
            <button popoverTarget="more-menu" aria-current={more.some(([h]) => cur(h)) ? "page" : undefined} className="flex h-16 w-full cursor-pointer flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted aria-[current=page]:text-accent">
              <Icon n="menu" className="size-[22px]" />More
            </button>
          </li>
        </ul>
      </nav>
      <div id="more-menu" popover="auto" aria-label="More pages" className="menu md:hidden" onClick={hideOnLink}>
        <span aria-hidden className="mx-auto mb-3 block h-1 w-10 rounded-full bg-line" />
        {more.map(([href, label, icon, badge]) => (
          <Link key={href} href={href} aria-current={cur(href)} className="menu-item aria-[current=page]:bg-tint aria-[current=page]:text-accent">
            <Icon n={icon} />{label}
            {!!badge && <span className="ml-auto rounded-full bg-gold/20 px-2 text-xs font-bold text-gold-ink">{badge} pending</span>}
          </Link>
        ))}
        <div className="menu-sep" />
        <LogoutButton className="menu-item text-bad-ink hover:bg-bad/8 hover:text-bad-ink" />
      </div>
    </div>
  );
}

// spinner on the nav link being navigated to (no loading.js: its fallback would turn auth redirects into streamed 200s)
function Pending() {
  const { pending } = useLinkStatus();
  return <span aria-hidden className={`size-3.5 shrink-0 rounded-full border-2 border-white/25 border-t-white max-lg:absolute max-lg:bottom-1 max-lg:right-1 lg:ml-auto ${pending ? "animate-spin" : "invisible"}`} />;
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
        className="absolute inset-y-0 right-0 grid w-12 cursor-pointer place-items-center rounded-r-ctl text-faint transition-colors hover:text-ink"
      >
        <Icon n={show ? "eyeOff" : "eye"} />
      </button>
    </div>
  );
}

// File input for a member photo. Center-crops to a 320px square JPEG in the browser and swaps it into the input,
// so uploads stay ~20 KB (well under the 1 MB server action limit) whatever the phone camera produced.
export function PhotoInput({ name, src }: { name: string; src?: string }) {
  const [preview, setPreview] = useState(src);
  return (
    <label className="field sm:col-span-2">
      Photo
      <span className="flex items-center gap-4">
        <Avatar name={name} src={preview} className="size-16 text-base" />
        <input
          type="file"
          name="photo"
          accept="image/*"
          className="min-w-0 text-sm font-normal text-muted file:mr-3 file:h-9 file:cursor-pointer file:rounded-ctl file:border file:border-line file:bg-white file:px-3.5 file:text-xs file:font-semibold file:text-ink hover:file:border-line-strong hover:file:text-accent"
          onChange={async (e) => {
            const input = e.currentTarget;
            const file = input.files?.[0];
            input.setCustomValidity("");
            if (!file) return setPreview(src);
            try {
              const img = await createImageBitmap(file);
              const side = Math.min(img.width, img.height);
              const c = document.createElement("canvas");
              c.width = c.height = 320;
              c.getContext("2d")!.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 320, 320);
              const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.85));
              if (!blob) throw 0;
              const dt = new DataTransfer();
              dt.items.add(new File([blob], "photo.jpg", { type: "image/jpeg" }));
              input.files = dt.files; // setting .files doesn't fire change again
              setPreview(URL.createObjectURL(blob));
            } catch {
              input.setCustomValidity("Couldn't read this image. Try a JPEG or PNG.");
              input.reportValidity();
            }
          }}
        />
      </span>
      <span className="hint">Shown on the profile and the organization hierarchy. Leave empty to keep the current photo.</span>
    </label>
  );
}

// Submit button: disables itself while its form's server action runs. `ask` adds a ConfirmationDialog first
// (native <dialog>: focus trap + Esc for free); confirming re-submits with this button as the submitter, so its
// formAction still applies.
export function Btn({ ask, disabled, ...props }: ComponentProps<"button"> & { ask?: string }) {
  const { pending } = useFormStatus();
  const dlg = useRef<HTMLDialogElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const id = useId();
  return (
    <>
      <button
        {...props}
        ref={btn}
        disabled={pending || disabled}
        aria-busy={pending}
        onClick={ask ? (e) => { e.preventDefault(); dlg.current?.showModal(); } : undefined}
      />
      {ask && (
        <dialog ref={dlg} role="alertdialog" aria-labelledby={id} className="modal md:max-w-sm">
          <div className="flex gap-3">
            <span className="chip bg-bad/8 text-bad-ink"><Icon n="alert" /></span>
            <div className="min-w-0 pt-0.5">
              <h2 id={id} className="font-semibold">Are you sure?</h2>
              <p className="mt-1 text-sm text-muted">{ask}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => dlg.current?.close()} className="btn btn-ghost">Cancel</button>
            <button type="button" onClick={() => { dlg.current?.close(); btn.current?.form?.requestSubmit(btn.current); }} className="btn btn-danger">Confirm</button>
          </div>
        </dialog>
      )}
    </>
  );
}
