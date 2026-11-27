import Link from "next/link";
import { Event, Member } from "@/lib/db";
import { auth } from "@/lib/auth";
import { deleteEvent, saveEvent } from "../actions";
import { Btn } from "../client";
import { Empty, EventCard, EventFields, Icon, Modal, PageHeader, Tabs, photoUrl, today } from "../ui";

export default async function Events({ searchParams }: PageProps<"/events">) {
  const m = await auth();
  const show = String((await searchParams).show ?? "");
  const events = await Event.find().sort("date").lean();
  // faces for the "going" stacks: one query for everyone attending anything
  const people = await Member.find({ _id: { $in: events.flatMap((e) => e.attendees) }, status: "approved" }, "name photoAt").lean();
  const face = new Map(people.map((p) => [String(p._id), { name: p.name, src: photoUrl(p) }]));

  // dates are UTC midnight and events have no end date, so "ongoing" means today's
  const t = +today();
  const status = (d: Date) => (+d > t ? "upcoming" : +d === t ? "ongoing" : "completed");
  const live = events.filter((e) => +e.date >= t);
  const past = events.filter((e) => +e.date < t).reverse(); // newest first
  const tabs = [
    ["", "All", [...live, ...past]],
    ["upcoming", "Upcoming", live.filter((e) => +e.date > t)],
    ["ongoing", "Ongoing", live.filter((e) => +e.date === t)],
    ["completed", "Completed", past],
  ] as const;
  const [cur, label, shown] = tabs.find(([k]) => k === show) ?? tabs[0];

  return (
    <>
      <PageHeader title="Events" sub="Discover what's on and who's going.">
        {m.isAdmin && <button popoverTarget="new-event" className="btn"><Icon n="plus" className="size-4" />Create event</button>}
      </PageHeader>

      <div className="mb-5">
        <Tabs label="Filter events" items={tabs.map(([k, text, list]) => [k ? `/events?show=${k}` : "/events", `${text} (${list.length})`, k === cur])} />
      </div>

      {shown.length ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((e) => {
            const id = String(e._id);
            return (
              <li key={id}>
                <EventCard e={e} status={status(e.date)} people={e.attendees.flatMap((a: unknown) => face.get(String(a)) ?? [])}>
                  {m.isAdmin && (
                    <>
                      <Link href={`/events/${id}`} aria-label={`Edit ${e.title}`} title="Edit" className="icon-btn size-9"><Icon n="pencil" className="size-4" /></Link>
                      <form action={deleteEvent.bind(null, id)}>
                        <Btn ask={`Delete "${e.title}"?`} aria-label={`Delete ${e.title}`} title="Delete" className="icon-btn size-9 hover:bg-bad/8 hover:text-bad-ink"><Icon n="trash" className="size-4" /></Btn>
                      </form>
                    </>
                  )}
                </EventCard>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="card"><Empty icon="calendar" title={cur ? `No ${label.toLowerCase()} events` : "No events yet"} /></div>
      )}

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
