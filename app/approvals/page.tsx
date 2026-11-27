import { Member } from "@/lib/db";
import { auth } from "@/lib/auth";
import { setStatus } from "../actions";
import { Btn } from "../client";
import { Avatar, Back, Badge, Empty, Icon, PageHeader, Tabs, cap, fmt, inr, photoUrl, plural } from "../ui";

const statuses = ["pending", "approved", "rejected"] as const;

// Membership requests (admin). Pending by default; approved / rejected tabs for looking back (a rejected one can still be approved).
export default async function Approvals({ searchParams }: PageProps<"/approvals">) {
  await auth(true);
  const sp = String((await searchParams).status ?? "");
  const status = statuses.find((s) => s === sp) ?? "pending";
  const all = await Member.find({ isAdmin: { $ne: true } }, "name phone memberCode status payments createdAt photoAt roleId").populate("roleId", "name").sort("createdAt").lean();
  const rows = all.filter((m) => m.status === status);
  if (status !== "pending") rows.reverse(); // history: newest first

  // one form per member; each button picks its own action. Reject asks first.
  const decide = (m: (typeof all)[number], cls = "") => {
    const id = String(m._id);
    return m.status === "approved" ? null : (
      <form className={`flex gap-2 ${cls}`}>
        <Btn formAction={setStatus.bind(null, id, "approved")} className="btn btn-green btn-sm flex-1"><Icon n="check" className="size-4" />Approve</Btn>
        {m.status === "pending" && <Btn formAction={setStatus.bind(null, id, "rejected")} ask={`Reject ${m.name}? They won't be able to log in.`} className="btn btn-red btn-sm flex-1"><Icon n="x" className="size-4" />Reject</Btn>}
      </form>
    );
  };
  const first = (m: (typeof all)[number]) => {
    const p = m.payments[0];
    return p ? <span className="inline-flex items-center gap-2 tabular-nums">{inr(p.amount)} <Badge s={p.status} /></span> : <span className="text-muted">—</span>;
  };
  const pendingCount = all.filter((m) => m.status === "pending").length;

  return (
    <>
      <Back href="/members">Members</Back>
      <PageHeader title="Membership requests" sub={pendingCount ? `${plural(pendingCount, "application")} awaiting review` : "No applications waiting"} />
      <div className="mb-5">
        <Tabs label="Filter requests" items={statuses.map((s) => [s === "pending" ? "/approvals" : `/approvals?status=${s}`, `${cap(s)} (${all.filter((m) => m.status === s).length})`, s === status])} />
      </div>

      {!rows.length ? (
        <div className="card">
          {status === "pending"
            ? <Empty icon="userCheck" title="All caught up">No one is waiting for approval. New registrations will show up here.</Empty>
            : <Empty icon="users" title={`No ${status} members`} />}
        </div>
      ) : (
        <>
          <div className="card hidden overflow-x-auto p-0 lg:block">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Applicant</th><th>Designation</th><th>Code</th><th>First payment</th><th>Applied</th><th>Status</th><th><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={String(m._id)}>
                    <td>
                      <span className="flex items-center gap-3">
                        <Avatar name={m.name} src={photoUrl(m)} className="size-9 text-xs" />
                        <span><span className="block font-semibold">{m.name}</span><span className="text-xs text-muted tabular-nums">{m.phone}</span></span>
                      </span>
                    </td>
                    <td className="text-muted">{m.roleId?.name}</td>
                    <td className="font-mono text-xs">{m.memberCode}</td>
                    <td>{first(m)}</td>
                    <td className="text-muted">{fmt(m.createdAt)}</td>
                    <td><Badge s={m.status} /></td>
                    <td className="w-56">{decide(m, "justify-end")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
            {rows.map((m) => (
              <article key={String(m._id)} className="card p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={m.name} src={photoUrl(m)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{m.name}</p>
                    <p className="truncate text-sm text-muted">{m.roleId?.name}</p>
                  </div>
                  <Badge s={m.status} />
                </div>
                <dl className="well mt-3 grid grid-cols-2 gap-3 px-4 py-3 text-sm">
                  <div><dt className="text-xs text-muted">Code · phone</dt><dd className="truncate"><span className="font-mono">{m.memberCode}</span> · {m.phone}</dd></div>
                  <div><dt className="text-xs text-muted">Applied</dt><dd>{fmt(m.createdAt)}</dd></div>
                  <div className="col-span-2"><dt className="text-xs text-muted">First payment</dt><dd>{first(m)}</dd></div>
                </dl>
                {decide(m, "mt-3 [&_.btn]:h-11")}
              </article>
            ))}
          </div>
        </>
      )}
    </>
  );
}
