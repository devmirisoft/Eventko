import type { ReactNode } from "react";
import Link from "next/link";
import { Role } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logout } from "../actions";
import { Avatar, Badge, Icon, PageHeader, dayMonth, fmt, photoUrl, type IconName } from "../ui";

const Section = ({ icon, title, sub, children }: { icon: IconName; title: string; sub: string; children: ReactNode }) => (
  <section className="card grid gap-5 p-5 sm:p-6 md:grid-cols-[13rem_minmax(0,1fr)]">
    <div className="flex gap-3 md:block">
      <span className="chip md:mb-3"><Icon n={icon} className="size-[18px]" /></span>
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="text-sm text-muted">{sub}</p>
      </div>
    </div>
    <div className="min-w-0">{children}</div>
  </section>
);

// Account settings: profile, account details, access and logout. Only what the app already stores and allows.
export default async function Settings() {
  const m = await auth();
  const role = await Role.findById(m.roleId, "name").lean();
  const admin = !!m.isAdmin;
  const info: [string, ReactNode][] = [
    ["Phone", m.phone],
    ["Member code", <span key="c" className="font-mono">{m.memberCode}</span>],
    ["Member since", fmt(m.createdAt)],
    ["Birthday", dayMonth(m.dateOfBirth)],
    ["Anniversary", dayMonth(m.anniversaryDate)],
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader title="Settings" sub="Your profile, account and access" />

      <Section icon="user" title="Profile" sub="How you appear across the community">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={m.name} src={photoUrl(m)} className="size-16 text-lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold">{m.name}</p>
            <p className="truncate text-sm text-muted">{role?.name ?? "—"}</p>
            <Badge s={m.status} className="mt-1.5" />
          </div>
          {admin && <Link href={`/members/${m._id}`} className="btn btn-ghost"><Icon n="pencil" className="size-4" />Edit profile</Link>}
        </div>
        {!admin && <p className="well mt-4 px-4 py-3 text-sm text-muted">To change your name, photo or details, ask an organization admin.</p>}
      </Section>

      <Section icon="receipt" title="Account information" sub="Details on your membership record">
        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          {info.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs font-medium text-muted">{k}</dt>
              <dd className="mt-0.5 font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <Link href={`/members/${m._id}/payments`} className="link mt-5 inline-flex items-center gap-1 text-sm">View my payments <Icon n="right" className="size-4" /></Link>
      </Section>

      <Section icon="shield" title="Access" sub="What your account can do">
        <p className="flex items-center gap-2 font-semibold">{admin ? "Administrator" : "Member"}</p>
        <p className="mt-1 text-sm text-muted">
          {admin
            ? "Manage members and approvals, payments, events, meetings, the hierarchy and the organization's history."
            : "See events, meetings, the community feed and your own payments."}
        </p>
        {admin && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/hierarchy" className="btn btn-soft btn-sm"><Icon n="network" className="size-4" />Hierarchy &amp; roles</Link>
            <Link href="/approvals" className="btn btn-soft btn-sm"><Icon n="userCheck" className="size-4" />Membership requests</Link>
          </div>
        )}
      </Section>

      <Section icon="lock" title="Security" sub="Password and session">
        <p className="text-sm text-muted">Passwords are set by the organization admin. Contact them if you need a new one.</p>
        <form action={logout} className="mt-4">
          <button className="btn btn-red"><Icon n="logout" className="size-4" />Log out</button>
        </form>
      </Section>
    </div>
  );
}
