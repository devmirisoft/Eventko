import type { ReactNode } from "react";
import { Legacy, Member, Role } from "@/lib/db";
import { deleteLegacy, saveLegacy } from "../actions";
import { Btn } from "../client";
import { Empty, Icon, Modal, PageHeader, plural } from "../ui";

// "Founding members" / "Past presidents" tabs of /hierarchy (admin only; the page checks).
export default async function LegacyTab({ type, tabs, error }: { type: "founder" | "past_president"; tabs: ReactNode; error?: string }) {
  const pres = type === "past_president";
  const top = pres ? await Role.findOne({ parentId: null }).sort("_id").lean() : null;
  const [rows, members, current] = await Promise.all([
    Legacy.find({ type }).populate("memberId", "name memberCode phone").sort(pres ? "-toYear -fromYear" : "fromYear name").lean(),
    Member.find({}, "name memberCode").sort("name").lean(),
    top ? Member.find({ roleId: top._id, status: "approved" }, "name memberCode phone").lean() : [],
  ]);
  type Row = (typeof rows)[number];

  // the current President = whoever holds the top role; shown first, not editable here
  const list = [
    ...current.map((m) => ({ _id: `current-${m._id}`, name: m.name, memberId: m, fromYear: null, toYear: "Present", note: `Holds the ${top?.name} role`, current: true })),
    ...rows,
  ];
  const name = (r: Row) => r.memberId?.name ?? r.name;
  const code = (r: Row) => (r.memberId ? <span className="font-mono text-xs">{r.memberId.memberCode}</span> : <span className="text-muted">—</span>);
  const label = pres ? "past president" : "founding member";

  const errBox = error && <p role="alert" className="err mb-4"><Icon n="alert" className="size-5 shrink-0" />{error}</p>;

  const fields = (r?: Row) => (
    <>
      <label className="field">
        Name
        <input name="who" list="member-options" required autoComplete="off" placeholder="Type a name or pick a member"
          defaultValue={r ? (r.memberId ? `${r.memberId.name} (${r.memberId.memberCode})` : r.name) : ""} className="input" />
        <span className="hint">Pick from the suggestions to link an existing member, or type any name.</span>
      </label>
      {pres ? (
        <div className="grid grid-cols-2 gap-4">
          <label className="field">Term from<input name="fromYear" type="number" inputMode="numeric" min="1900" max="2100" required defaultValue={r?.fromYear ?? ""} className="input" /></label>
          <label className="field">Term to<input name="toYear" type="number" inputMode="numeric" min="1900" max="2100" required defaultValue={r?.toYear ?? ""} className="input" /></label>
        </div>
      ) : (
        <label className="field">Joined / founded year<input name="fromYear" type="number" inputMode="numeric" min="1900" max="2100" defaultValue={r?.fromYear ?? ""} className="input" /></label>
      )}
      <label className="field">Note<textarea name="note" rows={2} defaultValue={r?.note} placeholder="Optional" className="input" /></label>
    </>
  );

  const actions = (r: Row, cls = "") =>
    !r.current && (
      <div className={`flex gap-2 ${cls}`}>
        <button popoverTarget={`legacy-${r._id}`} aria-label={`Edit ${name(r)}`} title="Edit" className="icon-btn size-9"><Icon n="pencil" className="size-4" /></button>
        <form action={deleteLegacy.bind(null, type, String(r._id))}>
          <Btn ask={`Remove ${name(r)} from ${pres ? "past presidents" : "founding members"}?`} aria-label={`Remove ${name(r)}`} title="Remove" className="icon-btn size-9 hover:text-bad-ink"><Icon n="trash" className="size-4" /></Btn>
        </form>
      </div>
    );

  const currentTag = <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-white">Current</span>;
  const cols: [string, (r: Row) => ReactNode, string?][] = pres
    ? [["Term from", (r) => r.fromYear ?? "—"], ["Term to", (r) => r.toYear ?? "—"], ["Member code", code]]
    : [["Phone", (r) => r.memberId?.phone ?? "—"], ["Member code", code], ["Joined / founded", (r) => r.fromYear ?? "—"]];

  return (
    <>
      <PageHeader title={pres ? "Past presidents" : "Founding members"} sub={plural(rows.length, label)}>
        <button popoverTarget="legacy-new" className="btn"><Icon n="plus" className="size-4" />Add {label}</button>
      </PageHeader>
      {tabs}
      {error && <p role="alert" className="err mb-6"><Icon n="alert" className="size-5 shrink-0" />{error}</p>}

      {!list.length ? (
        <div className="card">
          <Empty icon={pres ? "award" : "users"} title={`No ${label}s yet`}>Add people who aren&apos;t members by name, or link existing members.</Empty>
        </div>
      ) : (
        <>
          <div className="card hidden overflow-x-auto px-2 py-1 lg:block">
            <table className="tbl">
              <thead>
                <tr><th>Name</th>{cols.map(([h]) => <th key={h}>{h}</th>)}<th>Note</th><th><span className="sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={String(r._id)} className={r.current ? "bg-sage/70 hover:bg-sage/70" : ""}>
                    <td className="font-medium">{name(r)}{r.current && currentTag}</td>
                    {cols.map(([h, cell]) => <td key={h} className="text-muted">{cell(r)}</td>)}
                    <td className="w-full max-w-0 truncate text-muted">{r.note || "—"}</td>
                    <td>{actions(r, "justify-end")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
            {list.map((r) => (
              <article key={String(r._id)} className={`card p-4 ${r.current ? "bg-sage" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{name(r)}{r.current && currentTag}</p>
                    <p className="mt-1 text-sm text-muted">
                      {pres ? `${r.fromYear ?? "—"} – ${r.toYear ?? "—"}` : r.fromYear ? `Since ${r.fromYear}` : "Year not set"}
                      {r.memberId && <> · <span className="font-mono text-xs">{r.memberId.memberCode}</span></>}
                      {!pres && r.memberId?.phone && <> · {r.memberId.phone}</>}
                    </p>
                  </div>
                  {actions(r)}
                </div>
                {r.note && <p className="mt-2 text-sm text-muted">{r.note}</p>}
              </article>
            ))}
          </div>
        </>
      )}
      {pres && <p className="mt-4 text-sm text-muted">The current President is whoever holds the top role in the role tree.</p>}

      <datalist id="member-options">
        {members.map((m) => <option key={String(m._id)} value={`${m.name} (${m.memberCode})`} />)}
      </datalist>

      {rows.map((r) => (
        // key includes the editable fields: a successful save remounts the modal, closing it
        <Modal key={String(r._id) + JSON.stringify([r.name, r.memberId?._id, r.fromYear, r.toYear, r.note])} id={`legacy-${r._id}`} title={`Edit ${name(r)}`}>
          {errBox}
          <form action={saveLegacy.bind(null, type, String(r._id))} className="space-y-4">
            {fields(r)}
            <Btn className="btn w-full">Save changes</Btn>
          </form>
        </Modal>
      ))}
      <Modal key={rows.length} id="legacy-new" title={`Add ${label}`}>
        {errBox}
        <form action={saveLegacy.bind(null, type, null)} className="space-y-4">
          {fields()}
          <Btn className="btn w-full">Add {label}</Btn>
        </form>
      </Modal>
    </>
  );
}
