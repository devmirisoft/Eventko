import { notFound } from "next/navigation";
import { Event, Member } from "@/lib/db";
import { auth } from "@/lib/auth";
import { deleteEvent, saveEvent } from "../../actions";
import { Btn } from "../../client";
import { Avatar, Back, Badge, DateTile, Empty, EventCover, EventFields, Icon, fmt, photoUrl, plural, today } from "../../ui";

export default async function EventDetail({ params }: PageProps<"/events/[id]">) {
  const viewer = await auth();
  const { id } = await params;
  const [e, members] = await Promise.all([
    Event.findById(id).lean(),
    Member.find({ status: "approved" }, "name memberCode photoAt").sort("name").lean(),
  ]);
  if (!e) notFound();
  const going = e.attendees.map(String);
  const attending = members.filter((m) => going.includes(String(m._id)));
  const t = +today();
  const status = +e.date > t ? "upcoming" : +e.date === t ? "ongoing" : "completed";

  return (
    <>
      <Back href="/events">All events</Back>

      <article className="card overflow-hidden p-0">
        <div className="relative">
          <EventCover id={id} d={e.date} done={status === "completed"} className="h-40 sm:h-52" />
          <DateTile d={e.date} muted={status === "completed"} className="absolute bottom-0 left-5 size-16 translate-y-1/2 shadow-card sm:left-6" />
        </div>
        <div className="px-5 pt-12 pb-5 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge s={status} />
            {going.includes(String(viewer._id)) && <Badge s="going" label="You're going" />}
          </div>
          <h1 className="mt-2 break-words">{e.title}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span className="flex items-center gap-1.5"><Icon n="calendar" className="size-4" />{fmt(e.date)}</span>
            <span className="flex items-center gap-1.5"><Icon n="pin" className="size-4" />{e.venue || "Venue to be announced"}</span>
            <span className="flex items-center gap-1.5"><Icon n="users" className="size-4" />{plural(going.length, "attendee")}</span>
          </p>
          {e.description && <p className="mt-4 max-w-2xl text-sm leading-relaxed whitespace-pre-line">{e.description}</p>}
        </div>
      </article>

      {viewer.isAdmin ? (
        <form action={saveEvent.bind(null, id)} className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="card p-5 sm:p-6">
            <h2 className="mb-4 font-semibold">Event details</h2>
            <div className="grid gap-4 sm:grid-cols-2"><EventFields e={e} /></div>
          </section>
          <section className="card p-5 sm:p-6">
            <h2 className="font-semibold">Attending members</h2>
            <p className="mb-4 text-sm text-muted">Tick who&apos;s going, then save.</p>
            <div className="grid max-h-[28rem] gap-1.5 overflow-y-auto sm:grid-cols-2">
              {members.map((m) => (
                <label key={String(m._id)} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-ctl border border-transparent px-3 py-2 text-sm transition hover:bg-surface has-checked:border-accent/30 has-checked:bg-tint">
                  <input type="checkbox" name="attendees" value={String(m._id)} defaultChecked={going.includes(String(m._id))} className="size-4 accent-accent" />
                  <Avatar name={m.name} src={photoUrl(m)} className="size-7 text-[10px]" />
                  <span className="min-w-0 flex-1 truncate">{m.name}</span>
                  <span className="font-mono text-xs text-muted">{m.memberCode}</span>
                </label>
              ))}
            </div>
          </section>
          {/* Save first in the DOM: Enter in a field submits via the first button, which must not be Delete */}
          <div className="flex flex-col gap-3 sm:flex-row-reverse sm:justify-between lg:col-span-2">
            <Btn className="btn">Save changes</Btn>
            <Btn formAction={deleteEvent.bind(null, id)} formNoValidate ask={`Delete "${e.title}"?`} className="btn btn-red"><Icon n="trash" className="size-4" />Delete event</Btn>
          </div>
        </form>
      ) : (
        <section className="card mt-6">
          <h2 className="mb-4 font-semibold">Who&apos;s going ({going.length})</h2>
          {attending.length ? (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {attending.map((m) => (
                <li key={String(m._id)} className="flex items-center gap-3">
                  <Avatar name={m.name} src={photoUrl(m)} className="size-9 text-xs" />
                  <span className="truncate text-sm font-medium">{m.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty icon="users" title="No attendees yet" />
          )}
        </section>
      )}
    </>
  );
}
