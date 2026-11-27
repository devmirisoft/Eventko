import Link from "next/link";
import { redirect } from "next/navigation";
import { me } from "@/lib/auth";
import { Event, Legacy, Meeting, Member } from "@/lib/db";
import { login } from "./actions";
import { Btn, PasswordInput } from "./client";
import { Alert, AuthCard, AuthHead, DateTile, EventCover, Icon, Logo, PhoneInput, fmt, initials, today, type IconName } from "./ui";

const pill = "inline-flex h-12 items-center justify-center gap-2 rounded-ctl px-6 text-sm font-semibold transition duration-150 active:scale-[0.98]";

// "/" for visitors. "/?login" (where the proxy sends logged-out visitors of protected pages) and "/?error=" show the login card.
export default async function Landing({ searchParams }: PageProps<"/">) {
  if (await me()) redirect("/dashboard");
  const sp = await searchParams;
  if ("login" in sp || "error" in sp) return <LoginCard error={sp.error && String(sp.error)} />;

  // Public: counts, upcoming event titles + dates (no venues), and the founder / past-president names admins record as history
  const [members, events, meetings, legacy, next] = await Promise.all([
    Member.countDocuments({ status: "approved" }),
    Event.countDocuments(),
    Meeting.countDocuments(),
    Legacy.find({}, "type name fromYear toYear").sort("fromYear").lean(),
    Event.find({ date: { $gte: today() } }, "title date").sort("date").limit(3).lean(),
  ]);
  const years = legacy.map((l) => l.fromYear).filter(Boolean);
  const founded = years.length ? Math.min(...years) : null;
  const founders = legacy.filter((l) => l.type === "founder");
  const presidents = legacy.filter((l) => l.type === "past_president").slice(-4).reverse();
  const stats: [number, string, IconName][] = [
    [members, "Members", "users"],
    [events, "Events", "calendar"],
    [founded ? new Date().getFullYear() - founded : 0, "Years of legacy", "award"],
    [meetings, "Meetings held", "meeting"],
  ];

  return (
    <div className="bg-surface">
      {/* Hero. Photo goes at public/hero.jpg; the plum glow stands in until it exists. */}
      <section
        className="relative isolate flex min-h-[92dvh] flex-col bg-plum bg-cover bg-center text-white"
        style={{ backgroundImage: "url(/hero.jpg), radial-gradient(circle at 78% 35%, #713b9699, transparent 60%)" }}
      >
        {/* keeps text readable over the photo: flat tint on phones, left + bottom fade from md up */}
        <div aria-hidden className="absolute inset-0 -z-10 bg-plum/75 md:bg-transparent md:bg-[image:linear-gradient(to_right,#1c1729_15%,#1c1729bf_45%,transparent_80%),linear-gradient(to_top,#1c1729,transparent_40%)]" />

        <header className="mx-auto flex w-full max-w-6xl items-center gap-6 px-4 py-5 sm:px-8">
          <Link href="/"><Logo dark /></Link>
          <nav aria-label="Sections" className="ml-auto hidden items-center gap-7 text-sm font-medium text-white/75 md:flex">
            {next.length > 0 && <a href="#events" className="transition-colors hover:text-white">Events</a>}
            {legacy.length > 0 && <a href="#story" className="transition-colors hover:text-white">Our story</a>}
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <Link href="/?login" className="inline-flex h-10 items-center rounded-ctl px-4 text-sm font-semibold ring-1 ring-white/40 transition-colors hover:bg-white/10">Log in</Link>
            <Link href="/members/new" className="hidden h-10 items-center rounded-ctl bg-white px-4 text-sm font-semibold text-plum transition-colors hover:bg-tint sm:inline-flex">Join</Link>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-14 sm:px-8">
          <p className="eyebrow text-gold">A private community{founded ? ` · since ${founded}` : ""}</p>
          <h1 className="mt-4 max-w-2xl font-serif text-4xl leading-[1.1] font-bold text-white sm:text-5xl lg:text-6xl">A community that creates memorable moments</h1>
          <p className="mt-5 max-w-lg text-base text-white/80 sm:text-lg">Connect with members, take part in events and celebrate the people who make our organization what it is.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/members/new" className={`${pill} bg-accent hover:bg-accent-hover`}>Join the organization <Icon n="arrow" className="size-4" /></Link>
            <Link href="/?login" className={`${pill} ring-1 ring-white/50 hover:bg-white/10`}>Member login</Link>
          </div>
        </div>

        {stats.some(([n]) => n > 0) && (
          <ul className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-6 px-4 pb-10 sm:px-8 lg:flex lg:gap-0 lg:divide-x lg:divide-white/15">
            {stats.filter(([n]) => n > 0).map(([n, label, icon]) => (
              <li key={label} className="flex items-center gap-3 lg:px-10 lg:first:pl-0">
                <Icon n={icon} className="size-7 shrink-0 text-gold" />
                <p className="leading-tight">
                  <span className="block text-2xl font-bold tabular-nums">{n}</span>
                  <span className="text-sm text-white/70">{label}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {next.length > 0 && (
        <section id="events" className="mx-auto max-w-6xl scroll-mt-6 px-4 py-16 sm:px-8">
          <p className="eyebrow text-accent">Coming up</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Upcoming events</h2>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {next.map((e) => (
              <li key={String(e._id)} className="card overflow-hidden p-0">
                <div className="relative">
                  <EventCover id={String(e._id)} d={e.date} />
                  <DateTile d={e.date} className="absolute bottom-0 left-4 translate-y-1/2 shadow-card" />
                </div>
                <div className="p-4 pt-10">
                  <h3 className="font-semibold">{e.title}</h3>
                  <p className="mt-1 text-sm text-muted">{fmt(e.date)}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted">Members see venues and who&apos;s going. <Link href="/?login" className="link">Log in</Link></p>
        </section>
      )}

      {legacy.length > 0 && (
        <section id="story" className="border-y border-line bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-8 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <p className="eyebrow text-accent">Our story</p>
              <h2 className="mt-2 font-serif text-3xl font-bold tracking-tight sm:text-4xl">{founded ? `Building moments since ${founded}` : "The people behind our story"}</h2>
              <p className="mt-4 max-w-md text-muted">The founding members who started it, and the presidents who have led it since.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {founders.length > 0 && (
                <div className="card">
                  <p className="flex items-center gap-2 text-sm font-semibold"><Icon n="flag" className="size-4 text-gold" />Founding members</p>
                  <ul className="mt-4 space-y-3">
                    {founders.slice(0, 5).map((f) => (
                      <li key={String(f._id)} className="flex items-center gap-3 text-sm">
                        <span className="avatar size-8 text-[11px]">{initials(f.name)}</span>
                        <span className="min-w-0 flex-1 truncate font-medium">{f.name}</span>
                        {f.fromYear && <span className="text-xs text-muted tabular-nums">{f.fromYear}</span>}
                      </li>
                    ))}
                  </ul>
                  {founders.length > 5 && <p className="mt-3 text-xs text-muted">and {founders.length - 5} more</p>}
                </div>
              )}
              {presidents.length > 0 && (
                <div className="card">
                  <p className="flex items-center gap-2 text-sm font-semibold"><Icon n="award" className="size-4 text-gold" />Past presidents</p>
                  <ol className="mt-4 space-y-3">
                    {presidents.map((p) => (
                      <li key={String(p._id)} className="flex items-center gap-3 text-sm">
                        <span className="avatar size-8 text-[11px]">{initials(p.name)}</span>
                        <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                        <span className="text-xs text-muted tabular-nums">{p.fromYear}–{p.toYear}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-8">
        <div className="flex flex-col items-start gap-6 rounded-card bg-plum p-8 text-white sm:p-10 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold sm:text-3xl">Become part of the story</h2>
            <p className="mt-2 text-white/70">Apply in a minute. An admin reviews every application.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/members/new" className={`${pill} bg-white text-plum hover:bg-tint`}>Join the organization</Link>
            <Link href="/?login" className={`${pill} ring-1 ring-white/40 hover:bg-white/10`}>Member login</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-line py-8 text-center text-sm text-muted">© {new Date().getFullYear()} Eventko Organization</footer>
    </div>
  );
}

function LoginCard({ error }: { error?: string }) {
  return (
    <AuthCard>
      <AuthHead title="Welcome back" sub="Log in to your member account" />
      <Alert className="mb-5">{error}</Alert>
      <form action={login} className="space-y-4">
        <div className="field">
          <label htmlFor="login-phone">Phone number</label>
          {/* type text: the admin login (ADMIN in .env) needn't be a phone number */}
          <PhoneInput id="login-phone" name="phone" type="text" placeholder="9876543210" autoCapitalize="none" autoCorrect="off" spellCheck={false} required autoComplete="username" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <PasswordInput id="password" name="password" placeholder="Your password" required autoComplete="current-password" />
        </div>
        <Btn className="btn w-full">Log in</Btn>
      </form>
      <details className="mt-4 text-center text-sm">
        <summary className="link">Forgot password?</summary>
        <p className="mt-1 text-muted">Contact the organization admin to get a new one.</p>
      </details>
      <p className="mt-6 border-t border-line pt-5 text-center text-sm text-muted">New here? <Link href="/members/new" className="link">Join the organization</Link></p>
    </AuthCard>
  );
}
