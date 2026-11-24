import Link from "next/link";
import { Event, Meeting, Member, upcoming } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Badge, DateTile, Empty, Stat, fmt, inr, plural, today, total } from "../ui";

export default async function Dashboard() {
  const m = await auth();
  const [members, events, meetings, approved] = await Promise.all([
    m.isAdmin ? Member.find({}, "name memberCode status payments createdAt").sort("-createdAt").lean() : [m],
    Event.find({ date: { $gte: today() } }, "title date venue").sort("date").lean(),
    Meeting.find({}, "title date destination notes").sort("-date -createdAt").limit(3).lean(),
    // ponytail: scans every approved member each load; fine for a club, move to an aggregation if it reaches tens of thousands
    Member.find({ status: "approved" }, "name roleId dateOfBirth anniversaryDate").populate("roleId", "name").lean(),
  ]);
  const celebrations = upcoming(approved, today());
  const pays = members.flatMap((x) => x.payments);
  const pending = members.filter((x) => x.status === "pending");
  const dueCount = pays.filter((p) => p.status === "due").length;
  const my = m.isAdmin ? "" : "My ";

  const stats = [
    ...(m.isAdmin
      ? [
          { label: "Total members", value: members.filter((x) => x.status === "approved").length, icon: "users", color: "accent" },
          { label: "Pending approvals", value: pending.length, icon: "clock", color: "gold" },
        ] as const
      : []),
    { label: "Upcoming events", value: events.length, icon: "calendar", color: "ink", sub: events[0] && `Next: ${fmt(events[0].date)}` },
    { label: `${my}Total paid`, value: inr(total(pays, "paid")), icon: "wallet", color: "ok" },
    { label: `${my}Total due`, value: inr(total(pays, "due")), icon: "receipt", color: "warn", sub: dueCount ? `${plural(dueCount, "payment")} due` : "All settled" },
  ] as const;
  // phones: 2 columns, a lone last card spans both. lg: 6-col grid -> 3 + 2 for admins, 3 in a row for members.
  const span = (i: number) => `${i === stats.length - 1 && stats.length % 2 ? "col-span-2" : ""} ${stats.length === 5 && i > 2 ? "lg:col-span-3" : "lg:col-span-2"}`;

  const recentPays = [...m.payments].sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 4);

  return (
    <>
      <h1 className="mb-6">Welcome, {m.name.split(" ")[0]}</h1>

      <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-6">
        {stats.map((s, i) => <Stat key={s.label} {...s} className={span(i)} />)}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Upcoming events</h2>
            <Link href="/events" className="link text-sm">View all</Link>
          </div>
          {events.length ? (
            <ul>
              {events.slice(0, 4).map((e) => (
                <li key={String(e._id)}>
                  <Link href={`/events/${e._id}`} className="-mx-2 flex items-center gap-4 rounded-xl p-2 transition-colors hover:bg-white/40">
                    <DateTile d={e.date} />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{e.title}</p>
                      {e.venue && <p className="truncate text-sm text-muted">{e.venue}</p>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty icon="calendar" title="No upcoming events" />
          )}
        </section>

        {m.isAdmin ? (
          <section className="card">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold">Awaiting approval</h2>
              <Link href="/approvals" className="link text-sm">Review</Link>
            </div>
            {pending.length ? (
              <ul className="divide-y divide-line">
                {pending.slice(0, 4).map((x) => (
                  <li key={String(x._id)} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{x.name}</p>
                      <p className="text-sm text-muted">{x.memberCode} · {fmt(x.createdAt)}</p>
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
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-semibold">Recent payments</h2>
              <Link href={`/members/${m._id}/payments`} className="link text-sm">View all</Link>
            </div>
            {recentPays.length ? (
              <ul className="divide-y divide-line">
                {recentPays.map((p) => (
                  <li key={String(p._id)} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.type || "Payment"}</p>
                      <p className="text-sm text-muted">{fmt(p.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold tabular-nums">{inr(p.amount)}</p>
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

        <section className="card lg:col-span-2">
          <h2 className="mb-2 font-semibold">Upcoming Birthdays &amp; Anniversaries <span className="text-sm font-normal text-muted">(next 30 days)</span></h2>
          {celebrations.length ? (
            <ul className="grid gap-x-6 md:grid-cols-2">
              {celebrations.map(({ m: x, type, date, left }) => (
                // today's row: gold tint + "Today" label, so it doesn't rely on colour alone
                <li key={`${x._id}-${type}`} className={`-mx-2 flex items-center gap-4 rounded-xl p-2 ${left ? "" : "bg-gold/15"}`}>
                  <DateTile d={date} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{x.name}</p>
                    <p className="truncate text-sm text-muted">{x.roleId?.name} · {type}</p>
                  </div>
                  <span className={`shrink-0 text-sm tabular-nums ${left ? "text-muted" : "font-semibold text-warn-ink"}`}>
                    {left === 0 ? "Today" : left === 1 ? "Tomorrow" : `${left} days left`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty icon="calendar" title="Nothing in the next 30 days" />
          )}
        </section>

        <section className="card lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Recent meetings</h2>
            <Link href="/meetings" className="link text-sm">View all</Link>
          </div>
          {meetings.length ? (
            <ul className="grid gap-x-6 md:grid-cols-3">
              {meetings.map((x) => (
                <li key={String(x._id)}>
                  <Link href="/meetings" className="-mx-2 flex items-start gap-4 rounded-xl p-2 transition-colors hover:bg-white/40">
                    <DateTile d={x.date} muted />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{x.title}</p>
                      {x.destination && <p className="truncate text-sm text-muted">{x.destination}</p>}
                      {x.notes && <p className="mt-0.5 line-clamp-1 text-xs text-muted">{x.notes}</p>}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty icon="meeting" title="No meetings yet" />
          )}
        </section>
      </div>
    </>
  );
}
