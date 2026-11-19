import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import { Meeting, searchRe } from "@/lib/db";
import { auth } from "@/lib/auth";
import { deleteMeeting, saveMeeting } from "../actions";
import { Btn } from "../client";
import { Empty, Icon, Modal, PageHeader, day, fmt, plural } from "../ui";

export default async function Meetings({ searchParams }: PageProps<"/meetings">) {
  const viewer = await auth();
  const admin = viewer.isAdmin;
  const q = String((await searchParams).q ?? "");
  const filter = q ? { $or: [{ title: searchRe(q) }, { destination: searchRe(q) }] } : {};
  const meetings = await Meeting.find(filter).sort("-date -createdAt").lean();
  type M = (typeof meetings)[number];

  const fields = (x?: M) => (
    <>
      <label className="field">Date<input name="date" type="date" required defaultValue={day(x?.date ?? new Date())} className="input" /></label>
      <label className="field">Destination<input name="destination" defaultValue={x?.destination} placeholder="Where it happened" className="input" /></label>
      <label className="field sm:col-span-2">Meeting name / objective<input name="title" required defaultValue={x?.title} className="input" /></label>
      <label className="field sm:col-span-2">Notes<textarea name="notes" rows={7} defaultValue={x?.notes} className="input" /></label>
    </>
  );

  // the title button's ::after covers the whole row/card, so clicking anywhere opens the notes
  const opener = (x: M, children: ReactNode, cls = "") => (
    <button popoverTarget={`notes-${x._id}`} className={`cursor-pointer text-left after:absolute after:inset-0 hover:text-accent ${cls}`}>{children}</button>
  );

  const actions = (x: M, cls = "") =>
    admin && (
      <div className={`relative z-10 flex gap-2 ${cls}`}>
        <button popoverTarget={`edit-${x._id}`} aria-label={`Edit ${x.title}`} title="Edit" className="icon-btn size-9"><Icon n="pencil" className="size-4" /></button>
        <form action={deleteMeeting.bind(null, String(x._id))}>
          <Btn ask={`Delete "${x.title}"?`} aria-label={`Delete ${x.title}`} title="Delete" className="icon-btn size-9 hover:text-bad-ink"><Icon n="trash" className="size-4" /></Btn>
        </form>
      </div>
    );

  return (
    <>
      <PageHeader title="Meetings" sub={`${plural(meetings.length, "meeting")}${q ? " found" : ""}`}>
        {admin && <button popoverTarget="new-meeting" className="btn"><Icon n="plus" className="size-4" />New meeting</button>}
      </PageHeader>

      <form role="search" className="well mb-6 flex flex-wrap items-center gap-2 p-2 [&_.input]:shadow-none">
        <div className="relative min-w-0 basis-full sm:flex-1 sm:basis-auto">
          <Icon n="search" className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint" />
          <input name="q" defaultValue={q} placeholder="Search name or destination" aria-label="Search meetings" className="input bg-transparent pl-10" />
        </div>
        <button className="btn">Search</button>
        {q && <Link href="/meetings" className="btn btn-ghost">Clear</Link>}
      </form>

      {!meetings.length ? (
        <div className="card">
          <Empty icon="meeting" title="No meetings found">{q ? "Try a different search." : "Meetings you record will appear here."}</Empty>
        </div>
      ) : (
        <>
          <div className="card hidden overflow-x-auto px-2 py-1 lg:block">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Date</th><th>Destination</th><th>Meeting name / objective</th><th>Notes</th>
                  {admin && <th><span className="sr-only">Actions</span></th>}
                </tr>
              </thead>
              <tbody>
                {meetings.map((x) => (
                  <tr key={String(x._id)} className="relative">
                    <td className="text-muted">{fmt(x.date)}</td>
                    <td className="text-muted">{x.destination || "—"}</td>
                    <td className="font-medium">{opener(x, x.title)}</td>
                    {/* w-full + max-w-0: the notes column takes the leftover width and truncates to one line */}
                    <td className="w-full max-w-0 truncate text-muted">{x.notes || "—"}</td>
                    {admin && <td>{actions(x, "justify-end")}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
            {meetings.map((x) => (
              <article key={String(x._id)} className="card relative p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs text-muted">{fmt(x.date)}{x.destination && ` · ${x.destination}`}</p>
                    {opener(x, x.title, "mt-1 font-semibold")}
                  </div>
                  {actions(x)}
                </div>
                {x.notes && <p className="mt-2 truncate text-sm text-muted">{x.notes}</p>}
              </article>
            ))}
          </div>
        </>
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
              </p>
              <div className="well mt-4 rounded-xl p-4 text-sm leading-relaxed break-words whitespace-pre-line">
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
        // keyed on the count: a successful add remounts it, which closes the modal
        <Modal key={meetings.length} id="new-meeting" title="New meeting">
          <form action={saveMeeting.bind(null, null)} className="grid gap-4 sm:grid-cols-2">
            {fields()}
            <Btn className="btn mt-2 sm:col-span-2">Create meeting</Btn>
          </form>
        </Modal>
      )}
    </>
  );
}
