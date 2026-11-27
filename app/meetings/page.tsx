import { Fragment, type ReactNode } from "react";
import { Meeting, searchRe } from "@/lib/db";
import { auth } from "@/lib/auth";
import { deleteMeeting, saveMeeting } from "../actions";
import { Btn } from "../client";
import { Badge, DateTile, Empty, FilterBar, Icon, Modal, PageHeader, SearchBar, Tabs, day, fmt, today, withQuery } from "../ui";

const month = (d: Date) => new Date(d).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" });

export default async function Meetings({ searchParams }: PageProps<"/meetings">) {
  const viewer = await auth();
  const admin = viewer.isAdmin;
  const sp = await searchParams;
  const q = String(sp.q ?? "");
  const show = ["upcoming", "completed"].includes(String(sp.show)) ? String(sp.show) : "";
  const filter = q ? { $or: [{ title: searchRe(q) }, { destination: searchRe(q) }] } : {};
  const all = await Meeting.find(filter).sort("-date -createdAt").lean();
  type M = (typeof all)[number];

  // today's meeting still counts as upcoming (dates are UTC midnight, no times)
  const t = +today();
  const status = (d: Date) => (+d >= t ? "upcoming" : "completed");
  const meetings = show ? all.filter((x) => status(x.date) === show) : all;
  // calendar-style: grouped under month headings, newest month first
  const groups = new Map<string, M[]>(); // not Map.groupBy: the server runs Node 20
  for (const x of meetings) groups.set(month(x.date), [...(groups.get(month(x.date)) ?? []), x]);
  const href = (s: string, query = q) => withQuery("/meetings", { q: query, show: s });
  const tabs = [["", "All"], ["upcoming", "Upcoming"], ["completed", "Completed"]].map(([k, label]): [string, string, boolean] => [
    href(k),
    `${label} (${k ? all.filter((x) => status(x.date) === k).length : all.length})`,
    k === show,
  ]);

  const fields = (x?: M) => (
    <>
      <label className="field">Date<input name="date" type="date" required defaultValue={day(x?.date ?? new Date())} className="input" /></label>
      <label className="field">Location<input name="destination" defaultValue={x?.destination} placeholder="Where it happens" className="input" /></label>
      <label className="field sm:col-span-2">Meeting name / objective<input name="title" required defaultValue={x?.title} className="input" /></label>
      <label className="field sm:col-span-2">Notes<textarea name="notes" rows={7} defaultValue={x?.notes} className="input" /></label>
    </>
  );

  // the title button's ::after covers the whole row, so clicking anywhere opens the notes
  const opener = (x: M, children: ReactNode, cls = "") => (
    <button popoverTarget={`notes-${x._id}`} className={`cursor-pointer text-left after:absolute after:inset-0 hover:text-accent ${cls}`}>{children}</button>
  );

  return (
    <>
      <PageHeader title="Meetings" sub="Meeting records, objectives and key decisions.">
        {admin && <button popoverTarget="new-meeting" className="btn"><Icon n="plus" className="size-4" />Add meeting</button>}
      </PageHeader>

      <FilterBar>
        <Tabs label="Filter meetings" items={tabs} />
        <SearchBar q={q} label="Search meetings" placeholder="Search name or location" keep={{ show }} clear={href(show, "")} />
      </FilterBar>

      {!meetings.length ? (
        <div className="card">
          <Empty icon="meeting" title="No meetings found">{q || show ? "Try a different search or tab." : "Meetings you record will appear here."}</Empty>
        </div>
      ) : (
        <div className="space-y-6">
          {[...groups].map(([label, list]) => (
            <section key={label}>
              <h2 className="eyebrow mb-2.5">{label}</h2>
              <ul className="space-y-2.5">
                {list.map((x) => {
                  const st = status(x.date);
                  return (
                    <li key={String(x._id)} className="card lift relative flex items-center gap-4 p-4">
                      <DateTile d={x.date} muted={st === "completed"} />
                      <div className="min-w-0 flex-1">
                        {opener(x, x.title, "block max-w-full truncate font-semibold")}
                        <p className="flex items-center gap-1 truncate text-sm text-muted">
                          <Icon n="pin" className="size-3.5 shrink-0" />{x.destination || "No location"}
                        </p>
                        {x.notes && <p className="mt-0.5 truncate text-xs text-muted">{x.notes}</p>}
                        <span className="mt-1.5 block sm:hidden"><Badge s={st} /></span>
                      </div>
                      <span className="hidden sm:block"><Badge s={st} /></span>
                      {admin && (
                        <div className="relative z-10 flex gap-1">
                          <button popoverTarget={`edit-${x._id}`} aria-label={`Edit ${x.title}`} title="Edit" className="icon-btn size-9"><Icon n="pencil" className="size-4" /></button>
                          <form action={deleteMeeting.bind(null, String(x._id))}>
                            <Btn ask={`Delete "${x.title}"?`} aria-label={`Delete ${x.title}`} title="Delete" className="icon-btn size-9 hover:bg-bad/8 hover:text-bad-ink"><Icon n="trash" className="size-4" /></Btn>
                          </form>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {meetings.map((x) => {
        const id = String(x._id);
        return (
          // key includes the editable fields: a successful save remounts these, closing the modals
          <Fragment key={id + JSON.stringify([x.date, x.destination, x.title, x.notes])}>
            <Modal id={`notes-${id}`} title={x.title}>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                <span className="flex items-center gap-1"><Icon n="calendar" className="size-4" />{fmt(x.date)}</span>
                {x.destination && <span className="flex items-center gap-1"><Icon n="pin" className="size-4" />{x.destination}</span>}
                <Badge s={status(x.date)} />
              </p>
              <div className="well mt-4 p-4 text-sm leading-relaxed break-words whitespace-pre-line">
                {x.notes || <span className="text-muted">No notes recorded.</span>}
              </div>
              {admin && <button popoverTarget={`edit-${id}`} className="btn btn-ghost mt-4 w-full"><Icon n="pencil" className="size-4" />Edit meeting</button>}
            </Modal>
            {admin && (
              <Modal id={`edit-${id}`} title="Edit meeting">
                <form action={saveMeeting.bind(null, id)} className="grid gap-4 sm:grid-cols-2">
                  {fields(x)}
                  <Btn className="btn mt-2 sm:col-span-2">Save changes</Btn>
                </form>
              </Modal>
            )}
          </Fragment>
        );
      })}

      {admin && (
        // keyed on the total count (not the filtered one): a successful add remounts it, which closes the modal
        <Modal key={all.length} id="new-meeting" title="New meeting">
          <form action={saveMeeting.bind(null, null)} className="grid gap-4 sm:grid-cols-2">
            {fields()}
            <Btn className="btn mt-2 sm:col-span-2">Create meeting</Btn>
          </form>
        </Modal>
      )}
    </>
  );
}
