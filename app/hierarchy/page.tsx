import type { ReactNode } from "react";
import Link from "next/link";
import { Member, Role } from "@/lib/db";
import { auth } from "@/lib/auth";
import { deleteRole, saveRole } from "../actions";
import { Btn } from "../client";
import { Empty, Icon, Modal, PageHeader, plural } from "../ui";
import LegacyTab from "./legacy";

const TABS = [["", "Role tree"], ["founders", "Founding members"], ["presidents", "Past presidents"]] as const;

export default async function Hierarchy({ searchParams }: PageProps<"/hierarchy">) {
  await auth(true);
  const sp = await searchParams;
  const error = sp.error ? String(sp.error) : undefined;
  const tab = String(sp.tab ?? "");

  // tabs are plain links (?tab=), so each one is shareable and needs no JS
  const tabs = (
    // phones: three equal columns whose labels may wrap; sm+: a compact pill row
    <nav aria-label="Hierarchy sections" className="well mb-6 grid grid-cols-3 gap-1 p-1.5 sm:flex sm:w-fit">
      {TABS.map(([t, label]) => (
        <Link key={t} href={t ? `/hierarchy?tab=${t}` : "/hierarchy"} aria-current={tab === t ? "page" : undefined}
          className="nav-item h-auto min-h-11 justify-center px-2 py-2 text-center text-xs leading-tight sm:h-10 sm:min-h-0 sm:px-3.5 sm:text-sm sm:whitespace-nowrap">
          {label}
        </Link>
      ))}
    </nav>
  );
  if (tab === "founders" || tab === "presidents") return <LegacyTab type={tab === "founders" ? "founder" : "past_president"} tabs={tabs} error={error} />;

  const [roles, members] = await Promise.all([Role.find().sort("_id").lean(), Member.find({}, "name roleId").sort("name").lean()]);

  // parentId null -> "null", so kids(null) gives the top level
  const kids = (pid: unknown) => roles.filter((r) => String(r.parentId) === String(pid));

  const errBox = error && <p role="alert" className="err mb-4"><Icon n="alert" className="size-5 shrink-0" />{error}</p>;

  const roleFields = (r?: (typeof roles)[number]) => (
    <>
      <label className="field">Role name<input name="name" defaultValue={r?.name} required className="input" /></label>
      <label className="field">
        Code prefix
        <input name="codePrefix" defaultValue={r?.codePrefix} required className="input font-mono uppercase" />
        <span className="hint">Used for new member codes, e.g. MGR-0001.</span>
      </label>
      <label className="field">
        Parent role
        <select name="parentId" defaultValue={String(r?.parentId ?? "")} className="input">
          <option value="">— Top level —</option>
          {roles.filter((x) => String(x._id) !== String(r?._id)).map((x) => <option key={String(x._id)} value={String(x._id)}>{x.name}</option>)}
        </select>
      </label>
    </>
  );

  // items in `pid`'s list sit at `depth`; roots get a solid emerald prefix, descendants a sage one
  const tree = (pid: unknown, depth = 0): ReactNode => {
    const list = kids(pid);
    if (!list.length) return null;
    return (
      <ul>
        {list.map((r) => {
          const id = String(r._id);
          const names = members.filter((m) => String(m.roleId) === id).map((m) => m.name);
          const subs = kids(r._id).length;
          // mirrors deleteRole's server-side checks, so Delete only shows when it can succeed
          const blocked = names.length ? "Reassign its members first." : subs ? "Move or delete its sub-roles first." : "";
          return (
            // key includes the editable fields so a successful save remounts the node, closing its modal
            <li key={`${id}${r.name}${r.codePrefix}${r.parentId}`}>
              <div className="role card p-4 text-left">
                <div className="flex items-center gap-3">
                  <span className={`min-w-12 shrink-0 rounded-lg px-2 py-1.5 text-center font-mono text-xs font-bold ${depth ? "bg-sage text-accent" : "bg-accent text-white shadow-soft"}`}>
                    {r.codePrefix}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{r.name}</p>
                    <p className="text-xs text-muted">{plural(names.length, "member")}</p>
                  </div>
                </div>

                {names.length > 0 && (
                  <details className="group mt-3">
                    <summary className="inline-flex items-center gap-1 rounded-md text-xs font-medium text-accent">
                      <Icon n="chevron" className="size-3.5 transition-transform group-open:rotate-180" />
                      <span className="group-open:hidden">Show members</span><span className="hidden group-open:inline">Hide members</span>
                    </summary>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {names.map((n, k) => <span key={k} className="rounded-full bg-white/60 px-2.5 py-0.5 text-xs">{n}</span>)}
                    </div>
                  </details>
                )}

                <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
                  {subs > 0 && (
                    <label className="toggle flex h-11 cursor-pointer items-center gap-1 rounded-[10px] pr-2 text-xs font-medium text-muted hover:text-ink lg:h-9">
                      <input type="checkbox" className="sr-only" aria-label={`Collapse sub-roles of ${r.name}`} />
                      <Icon n="chevron" className="size-4" />
                      {plural(subs, "sub-role")}
                    </label>
                  )}
                  <div className="ml-auto flex gap-2">
                    <button popoverTarget={`role-${id}`} aria-label={`Edit ${r.name}`} title="Edit" className="icon-btn lg:size-9"><Icon n="pencil" className="size-4" /></button>
                    {!blocked && (
                      <form action={deleteRole.bind(null, id)}>
                        <Btn ask={`Delete the role "${r.name}"?`} aria-label={`Delete ${r.name}`} title="Delete" className="icon-btn hover:text-bad-ink lg:size-9"><Icon n="trash" className="size-4" /></Btn>
                      </form>
                    )}
                  </div>
                </div>
              </div>

              <Modal id={`role-${id}`} title={`Edit ${r.name}`}>
                {errBox}
                <form action={saveRole.bind(null, id)} className="space-y-4">
                  {roleFields(r)}
                  {blocked && <p className="hint">This role can&apos;t be deleted yet. {blocked}</p>}
                  <Btn className="btn w-full">Save changes</Btn>
                </form>
              </Modal>

              {tree(r._id, depth + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      <PageHeader title="Role hierarchy" sub={`${plural(roles.length, "role")} · ${plural(members.length, "member")}`}>
        <button popoverTarget="role-new" className="btn"><Icon n="plus" className="size-4" />Add role</button>
      </PageHeader>
      {tabs}
      {error &&<p role="alert" className="err mb-6"><Icon n="alert" className="size-5 shrink-0" />{error}</p>}

      <div className="well p-3 sm:p-6 lg:overflow-x-auto lg:p-10">
        <div className="org lg:w-max lg:min-w-full">
          {tree(null) ?? <Empty icon="network" title="No roles yet">Add a top-level role to start the hierarchy.</Empty>}
        </div>
      </div>
      <p className="mt-4 text-sm text-muted">Collapse a branch with its arrow. Use the pencil to rename a role, change its prefix or move it under another parent.</p>

      {/* keyed on the role count: a successful add remounts it, which closes the modal */}
      <Modal key={roles.length} id="role-new" title="Add role">
        {errBox}
        <form action={saveRole.bind(null, null)} className="space-y-4">
          {roleFields()}
          <Btn className="btn w-full">Add role</Btn>
        </form>
      </Modal>
    </>
  );
}
