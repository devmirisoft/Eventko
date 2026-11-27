import { Legacy, Member, Role } from "@/lib/db";
import { auth } from "@/lib/auth";
import { deleteLegacy, saveLegacy } from "../actions";
import { Btn } from "../client";
import { Alert, Avatar, Empty, Icon, Modal, PageHeader, Tabs, photoUrl } from "../ui";

const TABS = [["", "Full story"], ["founders", "Founding members"], ["presidents", "Past presidents"]] as const;
const LABEL = { founder: "founding member", past_president: "past president" } as const;
type Kind = keyof typeof LABEL;

// The organization's story (admin): founding members and past presidents on one timeline, grouped by year.
// The current President is whoever holds the top role, shown last and not editable here.
export default async function History({ searchParams }: PageProps<"/history">) {
  await auth(true);
  const sp = await searchParams;
  const tab = sp.tab === "founders" || sp.tab === "presidents" ? sp.tab : "";
  const error = sp.error ? String(sp.error) : undefined;

  const top = await Role.findOne({ parentId: null }).sort("_id").lean();
  const [rows, members, current] = await Promise.all([
    Legacy.find().populate("memberId", "name memberCode photoAt").sort("fromYear toYear name").lean(),
    Member.find({}, "name memberCode").sort("name").lean(),
    top ? Member.find({ roleId: top._id, status: "approved" }, "name memberCode photoAt").lean() : [],
  ]);
  type Row = (typeof rows)[number];

  const name = (r: Row) => r.memberId?.name ?? r.name;
  const founders = rows.filter((r) => r.type === "founder");
  const presidents = rows.filter((r) => r.type === "past_president");
  const years = rows.map((r) => r.fromYear).filter(Boolean);
  const founded = years.length ? Math.min(...years) : null;

  const shown = tab === "founders" ? founders : tab === "presidents" ? presidents : rows;
  // year groups, oldest first; entries without a year after them; today's President last
  const groups = new Map<string, Row[]>();
  for (const r of [...shown.filter((r) => r.fromYear), ...shown.filter((r) => !r.fromYear)]) {
    const k = r.fromYear ? String(r.fromYear) : "Year not recorded";
    groups.set(k, [...(groups.get(k) ?? []), r]);
  }
  const now = tab === "founders" ? [] : current;

  const errBox = <Alert className="mb-4">{error}</Alert>;
  const fields = (type: Kind, r?: Row) => (
    <>
      <label className="field">
        Name
        <input name="who" list="member-options" required autoComplete="off" placeholder="Type a name or pick a member"
          defaultValue={r ? (r.memberId ? `${r.memberId.name} (${r.memberId.memberCode})` : r.name) : ""} className="input" />
        <span className="hint">Pick from the suggestions to link an existing member, or type any name.</span>
      </label>
      {type === "past_president" ? (
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

  const card = (r: Row) => {
    const pres = r.type === "past_president";
    return (
      <li key={String(r._id)} className="card flex gap-3 p-4">
        <Avatar name={name(r)} src={r.memberId ? photoUrl(r.memberId) : undefined} className="size-12" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{name(r)}</p>
          <p className={`mt-0.5 flex items-center gap-1 text-xs font-semibold ${pres ? "text-accent" : "text-gold-ink"}`}>
            <Icon n={pres ? "award" : "flag"} className="size-3.5" />
            {pres ? `President · ${r.fromYear ?? "—"}–${r.toYear ?? "—"}` : "Founding member"}
          </p>
          {r.memberId && <p className="mt-0.5 font-mono text-xs text-muted">{r.memberId.memberCode}</p>}
          {r.note && <p className="mt-2 text-sm text-muted">{r.note}</p>}
        </div>
        <div className="flex shrink-0 gap-1">
          <button popoverTarget={`legacy-${r._id}`} aria-label={`Edit ${name(r)}`} title="Edit" className="icon-btn size-9"><Icon n="pencil" className="size-4" /></button>
          <form action={deleteLegacy.bind(null, r.type, String(r._id))}>
            <Btn ask={`Remove ${name(r)} from ${pres ? "past presidents" : "founding members"}?`} aria-label={`Remove ${name(r)}`} title="Remove" className="icon-btn size-9 hover:bg-bad/8 hover:text-bad-ink"><Icon n="trash" className="size-4" /></Btn>
          </form>
        </div>
      </li>
    );
  };

  return (
    <>
      <PageHeader title="Organization history" sub="Our story, from the founding members to today">
        <button popoverTarget="legacy-new-founder" className="btn btn-ghost"><Icon n="flag" className="size-4" />Add founder</button>
        <button popoverTarget="legacy-new-past_president" className="btn"><Icon n="award" className="size-4" />Add president</button>
      </PageHeader>
      <Alert>{error}</Alert>

      {rows.length > 0 && (
        <section className="card mb-6 flex flex-wrap items-center gap-x-10 gap-y-4 bg-plum p-6 text-white">
          <div>
            <p className="eyebrow text-gold">{founded ? "Since" : "Our story"}</p>
            <p className="font-serif text-4xl font-bold">{founded ?? "—"}</p>
          </div>
          <dl className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
            {founded && <div><dt className="text-white/60">Years</dt><dd className="text-xl font-bold tabular-nums">{new Date().getFullYear() - founded}</dd></div>}
            <div><dt className="text-white/60">Founding members</dt><dd className="text-xl font-bold tabular-nums">{founders.length}</dd></div>
            <div><dt className="text-white/60">Past presidents</dt><dd className="text-xl font-bold tabular-nums">{presidents.length}</dd></div>
          </dl>
        </section>
      )}

      <div className="mb-6">
        <Tabs label="History sections" items={TABS.map(([t, label]) => [t ? `/history?tab=${t}` : "/history", label, tab === t])} />
      </div>

      {!groups.size && !now.length ? (
        <div className="card">
          <Empty icon="history" title="No history recorded yet">Add founding members and past presidents. Link existing members, or type the name of anyone who isn&apos;t one.</Empty>
        </div>
      ) : (
        // timeline: one dot per year on a line down the left
        <ol className="ml-2 border-l-2 border-line pl-8 sm:ml-4">
          {[...groups].map(([year, list]) => (
            <li key={year} className="relative pb-8">
              <span aria-hidden className="absolute top-2 -left-[41px] size-4 rounded-full border-4 border-surface bg-accent" />
              <h2 className={year.length === 4 ? "font-serif text-2xl font-bold text-accent" : "pt-1 text-sm font-semibold text-muted"}>{year}</h2>
              <ul className="mt-3 grid gap-3 md:grid-cols-2">{list.map(card)}</ul>
            </li>
          ))}
          {now.length > 0 && (
            <li className="relative">
              <span aria-hidden className="absolute top-2 -left-[41px] size-4 rounded-full border-4 border-surface bg-gold" />
              <h2 className="font-serif text-2xl font-bold text-gold-ink">Today</h2>
              <ul className="mt-3 grid gap-3 md:grid-cols-2">
                {now.map((m) => (
                  <li key={String(m._id)} className="card flex gap-3 border-gold/40 p-4">
                    <Avatar name={m.name} src={photoUrl(m)} className="size-12" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{m.name} <span className="ml-1 rounded-full bg-gold/20 px-2 py-0.5 text-[11px] font-bold text-gold-ink">Current</span></p>
                      <p className="mt-0.5 text-xs font-semibold text-accent">Holds the {top?.name} role</p>
                      <p className="mt-0.5 font-mono text-xs text-muted">{m.memberCode}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          )}
        </ol>
      )}
      <p className="mt-6 text-sm text-muted">The current President is whoever holds the top role in the hierarchy.</p>

      <datalist id="member-options">
        {members.map((m) => <option key={String(m._id)} value={`${m.name} (${m.memberCode})`} />)}
      </datalist>

      {rows.map((r) => (
        // key includes the editable fields: a successful save remounts the modal, closing it
        <Modal key={String(r._id) + JSON.stringify([r.name, r.memberId?._id, r.fromYear, r.toYear, r.note])} id={`legacy-${r._id}`} title={`Edit ${name(r)}`}>
          {errBox}
          <form action={saveLegacy.bind(null, r.type, String(r._id))} className="space-y-4">
            {fields(r.type, r)}
            <Btn className="btn w-full">Save changes</Btn>
          </form>
        </Modal>
      ))}
      {(["founder", "past_president"] as const).map((type) => (
        // keyed on that type's count: a successful add remounts it, which closes the modal
        <Modal key={type + (type === "founder" ? founders : presidents).length} id={`legacy-new-${type}`} title={`Add ${LABEL[type]}`}>
          {errBox}
          <form action={saveLegacy.bind(null, type, null)} className="space-y-4">
            {fields(type)}
            <Btn className="btn w-full">Add {LABEL[type]}</Btn>
          </form>
        </Modal>
      ))}
    </>
  );
}
