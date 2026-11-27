import Link from "next/link";
import { Member, searchRe } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Avatar, Badge, Empty, FilterBar, Icon, MemberCard, Menu, PageHeader, SearchBar, Tabs, cap, inr, photoUrl, plural, total, withQuery } from "../ui";

const statuses = ["approved", "pending", "rejected"];

// Community directory (admin). Grid of cards by default; ?view=list is the denser management list.
export default async function Members({ searchParams }: PageProps<"/members">) {
  await auth(true);
  const sp = await searchParams;
  const q = String(sp.q ?? "");
  const status = statuses.includes(String(sp.status)) ? String(sp.status) : "";
  const view = sp.view === "list" ? "list" : "grid";

  const re = q && searchRe(q);
  const [all, requests] = await Promise.all([
    Member.find(re ? { $or: [{ name: re }, { phone: re }, { memberCode: re }] } : {}).populate("roleId", "name").sort("-createdAt").lean(),
    Member.countDocuments({ status: "pending" }),
  ]);
  // tab counts come from the same searched list as the rows, so they always agree
  const members = status ? all.filter((m) => m.status === status) : all;
  const href = (s: string, query = q, v: string = view) => withQuery("/members", { q: query, status: s, view: v === "list" ? v : "" });
  const tabs = ["", ...statuses].map((s): [string, string, boolean] => [
    href(s),
    `${s ? cap(s) : "All"} (${s ? all.filter((m) => m.status === s).length : all.length})`,
    s === status,
  ]);

  const actions = (m: (typeof all)[number]) => {
    const id = String(m._id);
    return (
      <Menu id={`m-${id}`} label={`Actions for ${m.name}`}>
        <Link href={`/members/${id}`} className="menu-item"><Icon n="user" className="size-4" />Profile &amp; edit</Link>
        <Link href={`/members/${id}/payments`} className="menu-item"><Icon n="wallet" className="size-4" />Payments</Link>
        <a href={`tel:${m.phone}`} className="menu-item"><Icon n="phone" className="size-4" />Call {m.phone}</a>
      </Menu>
    );
  };

  return (
    <>
      <PageHeader title="Members" sub={`${plural(all.length, "member")}${q ? " found" : " in the community"}`}>
        <Link href="/approvals" className="btn btn-ghost">
          <Icon n="userCheck" className="size-4" />Requests
          {requests > 0 && <span className="rounded-full bg-gold/20 px-1.5 text-xs font-bold text-gold-ink">{requests}</span>}
        </Link>
        <Link href="/members/new" className="btn"><Icon n="userPlus" className="size-4" />Add member</Link>
      </PageHeader>

      <FilterBar>
        <Tabs label="Filter by status" items={tabs} />
        <div className="flex gap-2">
          <SearchBar q={q} label="Search members" placeholder="Search name, phone or code" keep={{ status, view: view === "list" ? view : "" }} clear={href(status, "")} />
          <div role="group" aria-label="Layout" className="flex shrink-0 gap-1 rounded-ctl border border-line bg-white p-1">
            {(["grid", "list"] as const).map((v) => (
              <Link key={v} href={href(status, q, v)} aria-current={view === v ? "true" : undefined} aria-label={`${cap(v)} view`} title={`${cap(v)} view`} className="grid size-9 place-items-center rounded-[8px] text-muted transition-colors hover:text-ink aria-[current=true]:bg-tint aria-[current=true]:text-accent">
                <Icon n={v} className="size-4" />
              </Link>
            ))}
          </div>
        </div>
      </FilterBar>

      {!members.length ? (
        <div className="card">
          <Empty icon="users" title="No members found">{q || status ? "Try a different search or tab." : "Members you add will appear here."}</Empty>
        </div>
      ) : view === "grid" ? (
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {members.map((m) => <li key={String(m._id)}><MemberCard m={m} role={m.roleId?.name} actions={actions(m)} /></li>)}
        </ul>
      ) : (
        <ul className="card divide-y divide-line p-0">
          {members.map((m) => {
            const id = String(m._id);
            const due = total(m.payments, "due");
            return (
              <li key={id} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface/60 sm:px-5">
                <Avatar name={m.name} src={photoUrl(m)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold"><Link href={`/members/${id}`} className="hover:text-accent">{m.name}</Link></p>
                  <p className="truncate text-sm text-muted">
                    {m.roleId?.name} · <span className="font-mono text-xs">{m.memberCode}</span>
                    {due > 0 && <span className="font-medium text-warn-ink md:hidden"> · {inr(due)} due</span>}
                  </p>
                </div>
                <a href={`tel:${m.phone}`} className="hidden w-32 shrink-0 text-sm text-muted tabular-nums hover:text-ink lg:block">{m.phone}</a>
                <div className="hidden w-32 shrink-0 text-right text-sm tabular-nums md:block">
                  <p>{inr(total(m.payments, "paid"))} <span className="text-xs text-muted">paid</span></p>
                  <p className={due ? "font-medium text-warn-ink" : "text-muted"}>{inr(due)} <span className="text-xs font-normal text-muted">due</span></p>
                </div>
                <Badge s={m.status} />
                {actions(m)}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
