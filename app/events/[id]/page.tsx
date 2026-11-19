import { notFound } from "next/navigation";
import { Event, Member } from "@/lib/db";
import { auth } from "@/lib/auth";
import { deleteEvent, saveEvent } from "../../actions";
import { Btn } from "../../client";
import { Back, DateTile, Empty, EventFields, Icon, fmt, initials, plural, today } from "../../ui";

export default async function EventDetail({ params }: PageProps<"/events/[id]">) {
  const viewer = await auth();
  const { id } = await params;
  const [e, members] = await Promise.all([
    Event.findById(id).lean(),
    Member.find({ status: "approved" }, "name memberCode").sort("name").lean(),
  ]);
  if (!e) notFound();
  const going = e.attendees.map(String);
  const attending = members.filter((m) => going.includes(String(m._id)));

  return (
    <div className="mx-auto max-w-3xl">
      <Back href="/events">All events</Back>

      <div className="card flex gap-4 p-5 sm:gap-5 sm:p-6">
        <DateTile d={e.date} muted={e.date < today()} />
        <div className="min-w-0">
          <h1 className="break-words">{e.title}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span className="flex items-center gap-1"><Icon n="calendar" className="size-4" />{fmt(e.date)}</span>
            {e.venue && <span className="flex items-center gap-1"><Icon n="pin" className="size-4" />{e.venue}</span>}
            <span className="flex items-center gap-1"><Icon n="users" className="size-4" />{plural(going.length, "attendee")}</span>
          </p>
          {e.description && <p className="mt-3 text-sm whitespace-pre-line">{e.description}</p>}
        </div>
      </div>

      {viewer.isAdmin ? (
        <form action={saveEvent.bind(null, id)} className="card mt-6 space-y-8 p-5 sm:p-8">
          <section>
            <h2 className="mb-4 font-semibold">Event details</h2>
            <div className="grid gap-4 sm:grid-cols-2"><EventFields e={e} /></div>
          </section>
          <section>
            <h2 className="mb-4 font-semibold">Attending members</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {members.map((m) => (
                <label key={String(m._id)} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-sm transition hover:shadow-soft has-checked:bg-sage has-checked:shadow-pressed">
                  <input type="checkbox" name="attendees" value={String(m._id)} defaultChecked={going.includes(String(m._id))} className="size-4 accent-accent" />
                  <span className="min-w-0 flex-1 truncate">{m.name}</span>
                  <span className="font-mono text-xs text-muted">{m.memberCode}</span>
                </label>
              ))}
            </div>
          </section>
          {/* Save first in the DOM: Enter in a field submits via the first button, which must not be Delete */}
          <div className="flex flex-col gap-3 sm:flex-row-reverse sm:justify-between">
            <Btn className="btn">Save changes</Btn>
            <Btn formAction={deleteEvent.bind(null, id)} formNoValidate ask={`Delete "${e.title}"?`} className="btn btn-red"><Icon n="trash" className="size-4" />Delete event</Btn>
          </div>
        </form>
      ) : (
        <section className="card mt-6">
          <h2 className="mb-4 font-semibold">Attending members ({going.length})</h2>
          {attending.length ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {attending.map((m) => (
                <li key={String(m._id)} className="flex items-center gap-3">
                  <span className="avatar size-9 text-xs">{initials(m.name)}</span>
                  <span className="truncate text-sm font-medium">{m.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty icon="users" title="No attendees yet" />
          )}
        </section>
      )}
    </div>
  );
}
