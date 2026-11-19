import { notFound, redirect } from "next/navigation";
import { Member } from "@/lib/db";
import { auth } from "@/lib/auth";
import { addPayment, markPaid } from "../../../actions";
import { Btn } from "../../../client";
import { Back, Badge, Empty, Icon, Modal, PageHeader, PaymentFields, Stat, fmt, inr, plural, total } from "../../../ui";

export default async function Payments({ params }: PageProps<"/members/[id]/payments">) {
  const viewer = await auth();
  const { id } = await params;
  if (!viewer.isAdmin && String(viewer._id) !== id) redirect("/dashboard");
  const m = await Member.findById(id).lean();
  if (!m) notFound();
  const pays = [...m.payments].sort((a, b) => +new Date(b.date) - +new Date(a.date));
  const dueCount = pays.filter((p) => p.status === "due").length;

  const markBtn = (pid: string, cls = "") => (
    <form action={markPaid.bind(null, id, pid)} className={cls}>
      <Btn className="btn btn-green btn-sm w-full"><Icon n="check" className="size-4" />Mark paid</Btn>
    </form>
  );

  return (
    <>
      {viewer.isAdmin && <Back href="/members">Members</Back>}
      <PageHeader title={m.name} sub={<span className="font-mono">{m.memberCode}</span>}>
        {viewer.isAdmin && <button popoverTarget="add-payment" className="btn"><Icon n="plus" className="size-4" />Add payment</button>}
      </PageHeader>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:gap-5 lg:max-w-2xl">
        <Stat label="Total paid" value={inr(total(m.payments, "paid"))} icon="wallet" color="ok" sub={plural(pays.length - dueCount, "payment")} />
        <Stat label="Total due" value={inr(total(m.payments, "due"))} icon="receipt" color="warn" sub={dueCount ? `${dueCount} outstanding` : "All settled"} />
      </div>

      <h2 className="mb-3 font-semibold">Payment history</h2>
      {!pays.length ? (
        <div className="card"><Empty icon="receipt" title="No payments yet" /></div>
      ) : (
        <>
          <div className="card hidden overflow-x-auto px-2 py-1 md:block">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Date</th><th>Type</th><th>Mode</th><th className="num">Amount</th><th>Status</th><th>Note</th>
                  {viewer.isAdmin && <th><span className="sr-only">Actions</span></th>}
                </tr>
              </thead>
              <tbody>
                {pays.map((p) => (
                  <tr key={String(p._id)}>
                    <td className="text-muted">{fmt(p.date)}</td>
                    <td className="font-medium">{p.type}</td>
                    <td className="text-muted">{p.mode}</td>
                    <td className="num font-semibold">{inr(p.amount)}</td>
                    <td><Badge s={p.status} /></td>
                    <td className="max-w-56 truncate text-muted">{p.note}</td>
                    {viewer.isAdmin && <td className="text-right">{p.status === "due" && markBtn(String(p._id), "inline-block")}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="card divide-y divide-line px-4 py-1 md:hidden">
            {pays.map((p) => (
              <li key={String(p._id)} className="py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{p.type || "Payment"}</p>
                    <p className="text-xs text-muted">{fmt(p.date)} · {p.mode}</p>
                    {p.note && <p className="mt-1 text-xs text-muted">{p.note}</p>}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="font-semibold tabular-nums">{inr(p.amount)}</p>
                    <Badge s={p.status} />
                  </div>
                </div>
                {viewer.isAdmin && p.status === "due" && markBtn(String(p._id), "mt-3 [&_.btn]:h-11")}
              </li>
            ))}
          </ul>
        </>
      )}

      {viewer.isAdmin && (
        // keyed on the payment count: a successful add remounts it, which closes the modal
        <Modal key={pays.length} id="add-payment" title="Add payment">
          <form action={addPayment.bind(null, id)} className="grid gap-4 sm:grid-cols-2">
            <PaymentFields />
            <Btn className="btn mt-2 sm:col-span-2">Add payment</Btn>
          </form>
        </Modal>
      )}
    </>
  );
}
