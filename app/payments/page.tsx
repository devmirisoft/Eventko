import Link from "next/link";
import { Member, searchRe } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Avatar, Badge, Empty, FilterBar, PageHeader, SearchBar, Stat, Tabs, fmt, inr, photoUrl, total, withQuery, type Payment } from "../ui";

const TABS = [["", "All records"], ["due", "Member dues"], ["paid", "Paid"]] as const;
const FEES = ["Membership", "Registration"]; // the rest (Donation, Other) is the third tile

// Every member's payments in one place (admin). Recording stays on each member's payments page.
export default async function Payments({ searchParams }: PageProps<"/payments">) {
  await auth(true);
  const sp = await searchParams;
  const s = String(sp.status ?? "");
  const status = s === "due" || s === "paid" ? s : "";
  const q = String(sp.q ?? "");

  const members = await Member.find({ "payments.0": { $exists: true } }, "name memberCode payments photoAt").lean();
  const all = members.flatMap((m) => m.payments.map((p: Payment) => ({ ...p, m }))).sort((a, b) => +new Date(b.date) - +new Date(a.date));
  // tiles always show the whole organization; the search and tab only narrow the list
  const re = q && searchRe(q);
  const rows = all.filter((p) => (!status || p.status === status) && (!re || re.test(p.m.name) || re.test(p.m.memberCode)));
  const paid = all.filter((p) => p.status === "paid");
  const collected = total(paid, "paid");
  const fees = total(paid.filter((p) => FEES.includes(p.type ?? "")), "paid");
  const member = (p: (typeof all)[number]) => <Link href={`/members/${p.m._id}/payments`} className="hover:text-accent">{p.m.name}</Link>;
  const href = (k: string, query = q) => withQuery("/payments", { status: k, q: query });

  return (
    <>
      <PageHeader title="Payments" sub="Dues, collections and every transaction on record" />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        <Stat label="Total collected" value={inr(collected)} icon="wallet" color="ok" sub={`${inr(total(all, "due"))} still due`} className="col-span-2 lg:col-span-1" />
        <Stat label="Membership & registration" value={inr(fees)} icon="users" color="gold" />
        <Stat label="Donations & other" value={inr(collected - fees)} icon="receipt" />
      </div>

      <FilterBar>
        <Tabs label="Payment views" items={TABS.map(([k, label]) => [href(k), label, k === status])} />
        <SearchBar q={q} label="Search payments by member" placeholder="Search member name or code" keep={{ status }} clear={href(status, "")} />
      </FilterBar>

      {!rows.length ? (
        <div className="card"><Empty icon="wallet" title="No payments here">{q ? "Try a different search." : "Payments are recorded from each member's payments page."}</Empty></div>
      ) : (
        <>
          <div className="card hidden overflow-x-auto p-0 md:block">
            <table className="tbl">
              <thead>
                <tr><th>Member</th><th>Purpose</th><th className="num">Amount</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={String(p._id)}>
                    <td>
                      <span className="flex items-center gap-3">
                        <Avatar name={p.m.name} src={photoUrl(p.m)} className="size-8 text-[11px]" />
                        <span><span className="block font-medium">{member(p)}</span><span className="font-mono text-xs text-muted">{p.m.memberCode}</span></span>
                      </span>
                    </td>
                    <td>
                      {p.type || "Payment"}
                      {(p.mode || p.note) && <span className="block max-w-56 truncate text-xs text-muted">{[p.mode, p.note].filter(Boolean).join(" · ")}</span>}
                    </td>
                    <td className="num font-semibold">{inr(p.amount)}</td>
                    <td><Badge s={p.status} /></td>
                    <td className="text-muted">{fmt(p.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-2 md:hidden">
            {rows.map((p) => (
              <li key={String(p._id)} className="card flex items-center gap-3 p-4">
                <Avatar name={p.m.name} src={photoUrl(p.m)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{member(p)}</p>
                  <p className="truncate text-sm text-muted">{p.type || "Payment"} · {fmt(p.date)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-semibold tabular-nums">{inr(p.amount)}</p>
                  <Badge s={p.status} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
