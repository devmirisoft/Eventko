import { Event, Meeting, Member } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ActivityItem, PageHeader, Stat, activity, day, inr, today, total, type Payment } from "../ui";

type Month = { key: string; short: string; long: string; sum: number };

// Single-series column chart: one hue, no legend (the title names it), hover a column for its value, or open the table.
function Bars({ title, sub, data, show }: { title: string; sub: string; data: Month[]; show: (n: number) => string }) {
  const peak = Math.max(...data.map((x) => x.sum));
  return (
    <section className="card">
      <h2 className="font-semibold">{title}</h2>
      <p className="text-sm text-muted">{sub} · peak {show(peak)}</p>
      <div className="mt-8 flex h-44 items-end gap-0.5 border-b border-line" aria-hidden>
        {data.map((x) => (
          <div key={x.key} className="group relative flex h-full flex-1 items-end">
            <div className="relative mx-auto w-full max-w-7 rounded-t-[4px] bg-accent transition-colors group-hover:bg-accent-hover" style={{ height: `${peak ? (x.sum / peak) * 100 : 0}%` }}>
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2 rounded-[6px] bg-ink px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100">
                {x.long}: {show(x.sum)}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-0.5 text-[11px] text-muted" aria-hidden>
        {data.map((x, i) => <span key={x.key} className={`flex-1 text-center ${i % 2 ? "max-sm:invisible" : ""}`}>{x.short}</span>)}
      </div>
      <details className="mt-4 text-sm">
        <summary className="link">Show as table</summary>
        <table className="tbl mt-2">
          <thead><tr><th>Month</th><th className="num">{title}</th></tr></thead>
          <tbody>{data.map((x) => <tr key={x.key}><td>{x.long}</td><td className="num">{show(x.sum)}</td></tr>)}</tbody>
        </table>
      </details>
    </section>
  );
}

export default async function Reports() {
  await auth(true);
  const [members, events, meetings] = await Promise.all([
    Member.find({}, "name status payments createdAt photoAt").lean(),
    Event.find({}, "title date description attendees createdAt").lean(),
    Meeting.find({}, "title date notes createdAt").lean(),
  ]);
  const year = new Date().getUTCFullYear();
  const thisYear = (d: Date) => new Date(d).getUTCFullYear() === year;
  const approved = members.filter((m) => m.status === "approved");
  const pays = members.flatMap((m) => m.payments.map((p: Payment) => ({ ...p, m })));
  const paid = pays.filter((p) => p.status === "paid");
  const t = +today();

  // last 12 calendar months, oldest first (dates are UTC midnight)
  const now = new Date();
  const months = (): Month[] => Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11 + i, 1));
    const f = (o: Intl.DateTimeFormatOptions) => d.toLocaleDateString("en-IN", { ...o, timeZone: "UTC" });
    return { key: day(d).slice(0, 7), short: f({ month: "short" }), long: f({ month: "long", year: "numeric" }), sum: 0 };
  });
  const bucket = <T,>(rows: T[], at: (r: T) => Date, add: (r: T) => number) => {
    const ms = months();
    for (const r of rows) {
      const mo = ms.find((x) => x.key === day(at(r)).slice(0, 7));
      if (mo) mo.sum += add(r);
    }
    return ms;
  };
  const collectedByMonth = bucket(paid, (p) => p.date, (p) => p.amount);
  const joinedByMonth = bucket(approved, (m) => m.createdAt, () => 1);

  const byType = Object.entries(paid.reduce<Record<string, number>>((s, p) => ({ ...s, [p.type || "Other"]: (s[p.type || "Other"] ?? 0) + p.amount }), {})).sort((a, b) => b[1] - a[1]);
  const collected = total(paid, "paid");
  const due = total(pays, "due");

  const done = events.filter((e) => +e.date < t);
  const avgGoing = done.length ? Math.round(done.reduce((s, e) => s + e.attendees.length, 0) / done.length) : 0;
  const breakdown: [string, string | number][] = [
    ["Upcoming events", events.length - done.length],
    ["Completed events", done.length],
    ["Average attendance (completed)", avgGoing],
    ["Upcoming meetings", meetings.filter((x) => +x.date >= t).length],
    ["Meetings held", meetings.filter((x) => +x.date < t).length],
    ["Outstanding dues", inr(due)],
  ];

  const feed = activity({ members, pays, meetings, events }).map((a) => ({ ...a, body: undefined }));

  return (
    <>
      <PageHeader title="Reports & analytics" sub="Membership, payments, events and meetings at a glance" />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label="Members" value={approved.length} icon="users" sub={`+${approved.filter((m) => thisYear(m.createdAt)).length} joined in ${year}`} />
        <Stat label="Events" value={events.length} icon="calendar" color="gold" sub={`${events.filter((e) => thisYear(e.date)).length} in ${year}`} />
        <Stat label="Meetings" value={meetings.length} icon="meeting" color="ink" sub={`${meetings.filter((x) => thisYear(x.date)).length} in ${year}`} />
        <Stat label="Collected" value={inr(collected)} icon="wallet" color="ok" sub={`${inr(total(paid.filter((p) => thisYear(p.date)), "paid"))} in ${year}`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Bars title="Payments collected" sub="Last 12 months" data={collectedByMonth} show={inr} />

        <section className="card">
          <h2 className="font-semibold">Payment breakdown</h2>
          <p className="text-sm text-muted">Collected, by payment type</p>
          {byType.length ? (
            <ul className="mt-5 space-y-4">
              {byType.map(([type, sum]) => {
                const pct = Math.round((sum / collected) * 100);
                return (
                  <li key={type}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="font-medium">{type}</span>
                      <span className="tabular-nums">{inr(sum)} <span className="text-muted">· {pct}%</span></span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-tint"><div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} /></div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-muted">No payments collected yet.</p>
          )}
        </section>

        <Bars title="New members" sub="Approved members by the month they registered" data={joinedByMonth} show={String} />

        <section className="card">
          <h2 className="font-semibold">Events &amp; meetings</h2>
          <p className="text-sm text-muted">All time</p>
          <dl className="mt-4 divide-y divide-line text-sm">
            {breakdown.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-muted">{k}</dt>
                <dd className="font-semibold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section className="card mt-6">
        <h2 className="font-semibold">Recent activity</h2>
        <p className="text-sm text-muted">The latest registrations, payments, meetings and events</p>
        {feed.length ? (
          <ul className="mt-3 divide-y divide-line">
            {feed.map((a, i) => <li key={i} className="-mx-2 rounded-ctl px-2 py-3 transition-colors hover:bg-surface"><ActivityItem a={a} /></li>)}
          </ul>
        ) : (
          <p className="py-4 text-sm text-muted">Nothing yet.</p>
        )}
      </section>
    </>
  );
}
