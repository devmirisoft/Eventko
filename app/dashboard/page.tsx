import Link from "next/link";
import { Event, Meeting, Member, upcoming } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ActivityItem, Avatar, AvatarGroup, Badge, DateTile, Empty, Icon, SectionHead, activity, fmt, inr, photoUrl, plural, today, total, type IconName, type Payment } from "../ui";

// Home / Community
export default async function Home() {
  const m = await auth();
  const admin = !!m.isAdmin;
  const [members, events, meetings, newEvents, approved] = await Promise.all([
    admin ? Member.find({}, "name memberCode status payments createdAt photoAt").sort("-createdAt").lean() : [m],
    Event.find({ date: { $gte: today() } }, "title date venue attendees").sort("date").lean(),
    Meeting.find({}, "title notes createdAt").sort("-createdAt").limit(8).lean(),
    Event.find({}, "title date description createdAt").sort("-createdAt").limit(8).lean(),
    // ponytail: scans every approved member each load; fine for a club, move to an aggregation if it reaches tens of thousands
    Member.find({ status: "approved" }, "name dateOfBirth anniversaryDate photoAt createdAt").sort("-createdAt").lean(),
  ]);
  const celebrations = upcoming(approved, today());
  const pays = members.flatMap((x) => x.payments.map((p: Payment) => ({ ...p, m: x })));
  const pending = members.filter((x) => x.status === "pending");
  const dueCount = pays.filter((p) => p.status === "due").length;
  // members see events, meetings and their own payments; admins also see registrations and everyone's payments
  const feed = activity({ members: admin ? members : [], pays, meetings, events: newEvents });

  // ponytail: greeting uses IST (the org is in India); pass the viewer's zone from the browser if members go abroad
  const hour = +new Intl.DateTimeFormat("en", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format();
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const stats: [string, string | number, string?][] = admin
    ? [["Members", approved.length], ["Pending requests", pending.length], ["Upcoming events", events.length], ["Collected", inr(total(pays, "paid"))]]
    : [["Upcoming events", events.length], ["My total paid", inr(total(pays, "paid"))], ["My total due", inr(total(pays, "due")), dueCount ? plural(dueCount, "payment") : "All settled"]];
  const quick: [string, string, IconName][] = admin
    ? [["/members/new", "Add member", "userPlus"], ["/approvals", "Review requests", "userCheck"], ["/events", "Events", "calendar"], ["/meetings", "Meetings", "meeting"]]
    : [[`/members/${m._id}/payments`, "My payments", "wallet"], ["/events", "Events", "calendar"], ["/meetings", "Meetings", "meeting"], ["/settings", "Profile", "user"]];
  const recentPays = [...m.payments].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 3);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0 space-y-6">
        {/* welcome */}
        <section className="card overflow-hidden p-0">
          <div className="flex flex-wrap items-center gap-4 bg-plum px-5 py-6 text-white sm:px-6">
            <Avatar name={m.name} src={photoUrl(m)} className="size-14 text-base ring-2 ring-white/20" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white/65">{hello}</p>
              <h1 className="truncate text-white">{m.name.split(" ")[0]} <span aria-hidden>👋</span></h1>
              <p className="mt-0.5 text-sm text-white/65">Here&apos;s what&apos;s happening in the community.</p>
            </div>
            {admin && approved.length > 0 && (
              <Link href="/members" className="flex items-center gap-3 rounded-full bg-white/8 py-1.5 pr-4 pl-1.5 text-sm font-medium transition-colors hover:bg-white/12">
                <AvatarGroup people={approved.map((x) => ({ name: x.name, src: photoUrl(x) }))} count={approved.length} className="size-8 text-[11px] ring-plum!" />
                {plural(approved.length, "member")}
              </Link>
            )}
          </div>
          <dl className="grid grid-cols-2 divide-line border-b border-line sm:auto-cols-fr sm:grid-flow-col sm:divide-x">
            {stats.map(([label, value, sub]) => (
              <div key={label} className="px-5 py-4 sm:px-6">
                <dt className="text-xs font-medium text-muted">{label}</dt>
                <dd className="text-lg font-bold tabular-nums">{value}{sub && <span className="ml-1.5 text-xs font-medium text-muted">{sub}</span>}</dd>
              </div>
            ))}
          </dl>
          <nav aria-label="Quick actions" className="flex flex-wrap gap-2 p-4 sm:px-6">
            {quick.map(([href, label, icon]) => (
              <Link key={href} href={href} className="btn btn-soft btn-sm shrink-0"><Icon n={icon} className="size-4" />{label}</Link>
            ))}
          </nav>
        </section>

        {/* story-style strip: today's people get a gold ring and a "today" label, so it isn't colour alone */}
        {celebrations.length > 0 && (
          <section className="card">
            <h2 className="mb-4 text-sm font-semibold">Birthdays &amp; anniversaries <span className="font-normal text-muted">· next 30 days</span></h2>
            <ul className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
              {celebrations.map(({ m: x, type, date, left }) => (
                <li key={`${x._id}-${type}`} title={`${x.name} · ${type} · ${fmt(date)}`} className="w-19 shrink-0 text-center">
                  <span className={`mx-auto grid size-16 rounded-full p-0.5 ${left ? "bg-secondary" : "bg-gold"}`}>
                    <Avatar name={x.name} src={photoUrl(x)} className="size-full border-2 border-white" />
                  </span>
                  <p className="mt-2 truncate text-xs font-medium">{x.name}</p>
                  <p className="text-[11px] leading-tight text-muted">
                    {type}<br />
                    <span className={left ? "" : "font-semibold text-warn-ink"}>{left === 0 ? "today" : left === 1 ? "tomorrow" : `in ${left} days`}</span>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <aside className="space-y-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <section className="card">
          <SectionHead title="Upcoming events" href="/events" />
          {events.length ? (
            <ul className="-mx-2">
              {events.slice(0, 4).map((e) => (
                <li key={String(e._id)}>
                  <Link href={`/events/${e._id}`} className="flex items-center gap-3 rounded-ctl p-2 transition-colors hover:bg-surface">
                    <DateTile d={e.date} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{e.title}</p>
                      {e.venue && <p className="flex items-center gap-1 text-sm text-muted"><Icon n="pin" className="size-3.5 shrink-0" /><span className="truncate">{e.venue}</span></p>}
                      {e.attendees.length > 0 && <p className="mt-0.5 text-xs font-semibold text-accent">{e.attendees.length} going</p>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty icon="calendar" title="No upcoming events" />
          )}
        </section>

        {admin ? (
          <section className="card">
            <SectionHead title="Member requests" href="/approvals" cta="Review" />
            {pending.length ? (
              <ul className="space-y-3">
                {pending.slice(0, 4).map((x) => (
                  <li key={String(x._id)} className="flex items-center gap-3">
                    <Avatar name={x.name} src={photoUrl(x)} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{x.name}</p>
                      <p className="text-xs text-muted">Applied {fmt(x.createdAt)}</p>
                    </div>
                    <Badge s="pending" />
                  </li>
                ))}
              </ul>
            ) : (
              <Empty icon="userCheck" title="All caught up">No registrations are waiting for review.</Empty>
            )}
          </section>
        ) : (
          <section className="card">
            <SectionHead title="Recent payments" href={`/members/${m._id}/payments`} />
            {recentPays.length ? (
              <ul className="divide-y divide-line">
                {recentPays.map((p) => (
                  <li key={String(p._id)} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.type || "Payment"}</p>
                      <p className="text-xs text-muted">{fmt(p.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums">{inr(p.amount)}</p>
                      <Badge s={p.status} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty icon="wallet" title="No payments yet" />
            )}
          </section>
        )}
      </aside>

      <section className="min-w-0 lg:col-start-1">
        <SectionHead title="Community activity" href={admin ? "/reports" : undefined} cta="Reports" />
        {feed.length ? (
          <ul className="space-y-3">
            {feed.map((a, i) => <li key={i} className="card lift p-4"><ActivityItem a={a} /></li>)}
          </ul>
        ) : (
          <div className="card"><Empty icon="clock" title="Nothing here yet">New events, meetings and payments will show up here.</Empty></div>
        )}
      </section>
    </div>
  );
}
