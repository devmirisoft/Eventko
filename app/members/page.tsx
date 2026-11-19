import Link from "next/link";
import { Member, searchRe } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Badge, Empty, Icon, PageHeader, inr, initials, plural, total } from "../ui";

export default async function Members({ searchParams }: PageProps<"/members">) {
  await auth(true);
  const sp = await searchParams;
  const q = String(sp.q ?? "");
  const status = String(sp.status ?? "");

  const filter: Record<string, unknown> = status ? { status } : {};
  if (q) {
    const re = searchRe(q);
    filter.$or = [{ name: re }, { phone: re }, { memberCode: re }];
  }
  const members = await Member.find(filter).populate("roleId", "name").sort("-createdAt").lean();
  const filtered = Boolean(q || status);

  const actions = (id: string, name: string, size = "") => (
    <>
      <Link href={`/members/${id}`} aria-label={`Edit ${name}`} title="Edit" className={`icon-btn ${size}`}><Icon n="pencil" className="size-4" /></Link>
      <Link href={`/members/${id}/payments`} aria-label={`Payments for ${name}`} title="Payments" className={`icon-btn ${size}`}><Icon n="wallet" className="size-4" /></Link>
    </>
  );

  return (
    <>
      <PageHeader title="Members" sub={`${plural(members.length, "member")}${filtered ? " found" : ""}`}>
        <Link href="/members/new" className="btn"><Icon n="userPlus" className="size-4" />Add member</Link>
      </PageHeader>

      {/* recessed toolbar; the controls inside drop their own inset so it reads as one surface */}
      <form role="search" className="well mb-6 flex flex-wrap items-center gap-2 p-2 [&_.input]:shadow-none">
        <div className="relative min-w-0 basis-full sm:flex-1 sm:basis-auto">
          <Icon n="search" className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint" />
          <input name="q" defaultValue={q} placeholder="Search name, phone or code" aria-label="Search members" className="input bg-transparent pl-10" />
        </div>
        <select name="status" defaultValue={status} aria-label="Status" className="input w-auto flex-1 bg-transparent sm:w-44 sm:flex-none">
          <option value="">All statuses</option>
          {["approved", "pending", "rejected"].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
        </select>
        <button className="btn">Search</button>
        {filtered && <Link href="/members" className="btn btn-ghost">Clear</Link>}
      </form>

      {!members.length ? (
        <div className="card">
          <Empty icon="users" title="No members found">{filtered ? "Try a different search or status." : "Members you add will appear here."}</Empty>
        </div>
      ) : (
        <>
          <div className="card hidden overflow-x-auto px-2 py-1 lg:block">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Name</th><th>Designation</th><th>Code</th><th>Phone</th><th>Status</th>
                  <th className="num">Paid</th><th className="num">Due</th><th><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const due = total(m.payments, "due");
                  return (
                    <tr key={String(m._id)}>
                      <td className="font-medium">{m.name}</td>
                      <td className="text-muted">{m.roleId?.name}</td>
                      <td className="font-mono text-xs">{m.memberCode}</td>
                      <td className="text-muted tabular-nums">{m.phone}</td>
                      <td><Badge s={m.status} /></td>
                      <td className="num">{inr(total(m.payments, "paid"))}</td>
                      <td className={`num ${due ? "font-medium text-warn-ink" : "text-muted"}`}>{inr(due)}</td>
                      <td><div className="flex justify-end gap-2">{actions(String(m._id), m.name, "size-9")}</div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
            {members.map((m) => {
              const due = total(m.payments, "due");
              return (
                <article key={String(m._id)} className="card p-4">
                  <div className="flex items-start gap-3">
                    <span className="avatar">{initials(m.name)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{m.name}</p>
                      <p className="truncate text-xs text-muted">{m.roleId?.name} · <span className="font-mono">{m.memberCode}</span></p>
                    </div>
                    <Badge s={m.status} />
                  </div>
                  <dl className="well mt-4 grid grid-cols-2 gap-2 rounded-xl px-4 py-3 text-sm">
                    <div><dt className="text-xs text-muted">Paid</dt><dd className="font-semibold tabular-nums">{inr(total(m.payments, "paid"))}</dd></div>
                    <div><dt className="text-xs text-muted">Due</dt><dd className={`font-semibold tabular-nums ${due ? "text-warn-ink" : ""}`}>{inr(due)}</dd></div>
                  </dl>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <a href={`tel:${m.phone}`} className="flex min-w-0 items-center gap-1.5 text-sm text-muted hover:text-ink">
                      <Icon n="phone" className="size-4 shrink-0" /><span className="truncate tabular-nums">{m.phone}</span>
                    </a>
                    <div className="flex gap-2">{actions(String(m._id), m.name)}</div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
