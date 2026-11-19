import Link from "next/link";
import { Event } from "@/lib/db";
import { auth } from "@/lib/auth";
import { deleteEvent, saveEvent } from "../actions";
import { Btn } from "../client";
import { DateTile, Empty, EventFields, Icon, Modal, PageHeader, plural, today } from "../ui";

export default async function Events() {
  const m = await auth();
  const events = await Event.find().sort("date").lean();
  const t = today();
  const upcoming = events.filter((e) => e.date >= t);
  const past = events.filter((e) => e.date < t).reverse();

  const list = (title: string, items: typeof events, isPast = false) => (
    <section className="mb-10">
      <h2 className="mb-4 font-semibold">{title} <span className="font-normal text-muted">({items.length})</span></h2>
      {items.length ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((e) => (
            <article key={String(e._id)} className="card flex gap-4 p-4 transition duration-200 hover:-translate-y-0.5">
              <DateTile d={e.date} muted={isPast} />
              <div className="flex min-w-0 flex-1 flex-col">
                <h3 className="truncate font-semibold"><Link href={`/events/${e._id}`} className="hover:text-accent">{e.title}</Link></h3>
                {e.venue && <p className="flex items-center gap-1 truncate text-xs text-muted"><Icon n="pin" className="size-3.5 shrink-0" />{e.venue}</p>}
                {e.description && <p className="mt-2 line-clamp-2 text-sm text-muted">{e.description}</p>}
                <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                  <span className="flex items-center gap-1.5 text-xs text-muted"><Icon n="users" className="size-4" />{plural(e.attendees.length, "attendee")}</span>
                  <div className="flex gap-2">
                    <Link href={`/events/${e._id}`} className="btn btn-ghost btn-sm">{m.isAdmin ? "Edit" : "View"}</Link>
                    {m.isAdmin && (
                      <form action={deleteEvent.bind(null, String(e._id))}>
                        <Btn ask={`Delete "${e.title}"?`} aria-label={`Delete ${e.title}`} title="Delete" className="icon-btn size-9 hover:text-bad-ink"><Icon n="trash" className="size-4" /></Btn>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="card"><Empty icon="calendar" title={isPast ? "No past events" : "No upcoming events"} /></div>
      )}
    </section>
  );

  return (
    <>
      <PageHeader title="Events" sub={`${upcoming.length} upcoming · ${past.length} past`}>
        {m.isAdmin && <button popoverTarget="new-event" className="btn"><Icon n="plus" className="size-4" />New event</button>}
      </PageHeader>
      {list("Upcoming events", upcoming)}
      {list("Past events", past, true)}

      {m.isAdmin && (
        // a successful create redirects to the event page, so this unmounts on its own
        <Modal id="new-event" title="New event">
          <form action={saveEvent.bind(null, null)} className="grid gap-4 sm:grid-cols-2">
            <EventFields />
            <Btn className="btn mt-2 sm:col-span-2">Create event</Btn>
          </form>
        </Modal>
      )}
    </>
  );
}
