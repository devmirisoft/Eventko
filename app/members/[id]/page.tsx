import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Event, Member, Role } from "@/lib/db";
import { auth } from "@/lib/auth";
import { updateMember } from "../../actions";
import { Btn, PhotoInput } from "../../client";
import { Alert, Avatar, Back, Badge, DateTile, Empty, Icon, MemberDateFields, cap, dayMonth, fmt, inr, photoUrl, plural, today, total } from "../../ui";

// Member profile (admin): social-style header, involvement, then the edit form
export default async function MemberProfile({ params, searchParams }: PageProps<"/members/[id]">) {
  await auth(true);
  const { id } = await params;
  const { error } = await searchParams;
  const [m, roles, events] = await Promise.all([
    Member.findById(id).lean(),
    Role.find().sort("_id").lean(),
    Event.find({ attendees: id }, "title date").sort("-date").lean(),
  ]);
  if (!m) notFound();
  const role = roles.find((r) => String(r._id) === String(m.roleId));
  const parent = role?.parentId && roles.find((r) => String(r._id) === String(role.parentId));
  const due = total(m.payments, "due");

  const facts: [string, ReactNode][] = [
    ["Status", <Badge key="s" s={m.status} />],
    ["Member since", fmt(m.createdAt)],
    ["Total paid", inr(total(m.payments, "paid"))],
    ["Total due", <span key="d" className={due ? "text-warn-ink" : ""}>{inr(due)}</span>],
  ];

  return (
    <>
      <Back href="/members">Members</Back>

      <section className="card overflow-hidden p-0">
        <div aria-hidden className="relative h-28 bg-plum sm:h-36">
          <Icon n="logo" className="absolute top-5 right-5 size-6 text-gold/70" />
        </div>
        <div className="px-5 pb-5 sm:px-6">
          <div className="flex items-end justify-between gap-3">
            <Avatar name={m.name} src={photoUrl(m)} className="relative -mt-12 size-24 text-2xl ring-4 ring-white" />
            <div className="flex gap-2 pt-3">
              <a href={`tel:${m.phone}`} className="btn btn-ghost max-sm:px-3" aria-label={`Call ${m.name}`}><Icon n="phone" className="size-4" /><span className="max-sm:hidden">Call</span></a>
              <Link href={`/members/${id}/payments`} className="btn btn-ghost"><Icon n="wallet" className="size-4" />Payments</Link>
            </div>
          </div>
          <h1 className="mt-3 break-words">{m.name}</h1>
          <p className="text-sm text-muted">{role?.name ?? "No designation"} · <span className="font-mono">{m.memberCode}</span> · {m.phone}</p>
          <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-5 sm:grid-cols-4">
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs font-medium text-muted">{k}</dt>
                <dd className="mt-1 font-semibold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section aria-labelledby="edit-title">
          <h2 id="edit-title" className="mb-3 font-semibold">Edit details</h2>
          <Alert className="mb-4">{error && String(error)}</Alert>
          <form action={updateMember.bind(null, id)} className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            <PhotoInput name={m.name} src={photoUrl(m)} />
            <label className="field">Full name<input name="name" defaultValue={m.name} required className="input" /></label>
            <label className="field">Phone number<input name="phone" type="tel" inputMode="numeric" defaultValue={m.phone} required className="input" /></label>
            <label className="field">
              Designation
              <select name="roleId" defaultValue={String(m.roleId)} className="input">
                {roles.map((r) => <option key={String(r._id)} value={String(r._id)}>{r.name}</option>)}
              </select>
            </label>
            <label className="field">Member code<input name="memberCode" defaultValue={m.memberCode} required className="input font-mono uppercase" /></label>
            <MemberDateFields m={m} />
            <label className="field">
              Status
              <select name="status" defaultValue={m.status} className="input">
                {["pending", "approved", "rejected"].map((s) => <option key={s} value={s}>{cap(s)}</option>)}
              </select>
            </label>
            <div className="mt-2 flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
              <Link href="/members" className="btn btn-ghost">Cancel</Link>
              <Btn className="btn">Save changes</Btn>
            </div>
          </form>
        </section>

        <aside className="space-y-6">
          <section className="card">
            <h2 className="mb-3 font-semibold">Role &amp; involvement</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3"><span className="chip size-9"><Icon n="network" className="size-4" /></span><span><span className="block text-xs text-muted">Designation</span><span className="font-medium">{role?.name ?? "—"}</span></span></li>
              {parent && <li className="flex items-center gap-3"><span className="chip size-9"><Icon n="users" className="size-4" /></span><span><span className="block text-xs text-muted">Reports to</span><span className="font-medium">{parent.name}</span></span></li>}
              {(m.dateOfBirth || m.anniversaryDate) && <li className="flex items-center gap-3"><span className="chip size-9"><Icon n="calendar" className="size-4" /></span><span><span className="block text-xs text-muted">Birthday · Anniversary</span><span className="font-medium">{dayMonth(m.dateOfBirth)} · {dayMonth(m.anniversaryDate)}</span></span></li>}
            </ul>
          </section>

          <section className="card">
            <h2 className="font-semibold">Event participation</h2>
            <p className="mb-3 text-sm text-muted">{plural(events.length, "event")}</p>
            {events.length ? (
              <ul className="-mx-2">
                {events.slice(0, 6).map((e) => (
                  <li key={String(e._id)}>
                    <Link href={`/events/${e._id}`} className="flex items-center gap-3 rounded-ctl p-2 transition-colors hover:bg-surface">
                      <DateTile d={e.date} muted={e.date < today()} className="size-12" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{e.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty icon="calendar" title="No events yet" />
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
