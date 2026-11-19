import Link from "next/link";
import { notFound } from "next/navigation";
import { Member, Role } from "@/lib/db";
import { auth } from "@/lib/auth";
import { updateMember } from "../../actions";
import { Btn } from "../../client";
import { Back, Icon, PageHeader } from "../../ui";

export default async function EditMember({ params, searchParams }: PageProps<"/members/[id]">) {
  await auth(true);
  const { id } = await params;
  const { error } = await searchParams;
  const [m, roles] = await Promise.all([Member.findById(id).lean(), Role.find().sort("_id").lean()]);
  if (!m) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Back href="/members">Members</Back>
      <PageHeader title="Edit member" sub={<>{m.name} · <span className="font-mono">{m.memberCode}</span></>}>
        <Link href={`/members/${id}/payments`} className="btn btn-ghost"><Icon n="wallet" className="size-4" />Payments</Link>
      </PageHeader>
      {error && <p role="alert" className="err mb-6"><Icon n="alert" className="size-5 shrink-0" />{error}</p>}
      <form action={updateMember.bind(null, id)} className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-8">
        <label className="field">Full name<input name="name" defaultValue={m.name} required className="input" /></label>
        <label className="field">Phone number<input name="phone" type="tel" inputMode="numeric" defaultValue={m.phone} required className="input" /></label>
        <label className="field">
          Designation
          <select name="roleId" defaultValue={String(m.roleId)} className="input">
            {roles.map((r) => <option key={String(r._id)} value={String(r._id)}>{r.name}</option>)}
          </select>
        </label>
        <label className="field">Member code<input name="memberCode" defaultValue={m.memberCode} required className="input font-mono uppercase" /></label>
        <label className="field">
          Status
          <select name="status" defaultValue={m.status} className="input">
            {["pending", "approved", "rejected"].map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
          </select>
        </label>
        <div className="mt-4 flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
          <Link href="/members" className="btn btn-ghost">Cancel</Link>
          <Btn className="btn">Save changes</Btn>
        </div>
      </form>
    </div>
  );
}
