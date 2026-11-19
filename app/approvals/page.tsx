import { Member } from "@/lib/db";
import { auth } from "@/lib/auth";
import { setStatus } from "../actions";
import { Btn } from "../client";
import { Badge, Empty, Icon, PageHeader, fmt, inr, plural } from "../ui";

export default async function Approvals() {
  await auth(true);
  const pending = await Member.find({ status: "pending" }).populate("roleId", "name").sort("createdAt").lean();

  // one form per member; each button picks its own action. Reject asks first.
  const decide = (id: string, name: string, cls = "") => (
    <form className={`flex gap-2 ${cls}`}>
      <Btn formAction={setStatus.bind(null, id, "approved")} className="btn btn-green btn-sm flex-1"><Icon n="check" className="size-4" />Approve</Btn>
      <Btn formAction={setStatus.bind(null, id, "rejected")} ask={`Reject ${name}? They won't be able to log in.`} className="btn btn-red btn-sm flex-1"><Icon n="x" className="size-4" />Reject</Btn>
    </form>
  );

  return (
    <>
      <PageHeader title="Pending approvals" sub={pending.length ? `${plural(pending.length, "member")} awaiting review` : undefined} />

      {!pending.length ? (
        <div className="card">
          <Empty icon="userCheck" title="All caught up">No members are waiting for approval. New registrations will show up here.</Empty>
        </div>
      ) : (
        <>
          <div className="card hidden overflow-x-auto px-2 py-1 lg:block">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Name</th><th>Phone</th><th>Designation</th><th>Code</th><th className="num">First payment</th>
                  <th>Payment</th><th>Created</th><th><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {pending.map((m) => {
                  const p = m.payments[0];
                  return (
                    <tr key={String(m._id)}>
                      <td className="font-medium">{m.name}</td>
                      <td className="text-muted tabular-nums">{m.phone}</td>
                      <td className="text-muted">{m.roleId?.name}</td>
                      <td className="font-mono text-xs">{m.memberCode}</td>
                      <td className="num">{p ? inr(p.amount) : "—"}</td>
                      <td>{p ? <Badge s={p.status} /> : "—"}</td>
                      <td className="text-muted">{fmt(m.createdAt)}</td>
                      <td>{decide(String(m._id), m.name, "justify-end")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:hidden">
            {pending.map((m) => {
              const p = m.payments[0];
              return (
                <article key={String(m._id)} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{m.name}</p>
                      <p className="truncate text-xs text-muted">{m.roleId?.name}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted">{fmt(m.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted"><span className="font-mono text-ink">{m.memberCode}</span> · {m.phone}</p>
                  <div className="well mt-3 flex items-center justify-between rounded-xl px-4 py-3">
                    <span className="text-xs text-muted">First payment</span>
                    {p ? <span className="flex items-center gap-2 font-semibold tabular-nums">{inr(p.amount)} <Badge s={p.status} /></span> : <span>—</span>}
                  </div>
                  {decide(String(m._id), m.name, "mt-4 [&_.btn]:h-11")}
                </article>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
