import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Member, Role } from "@/lib/db";
import { auth } from "@/lib/auth";
import { deleteRole, saveRole } from "../actions";
import { Btn } from "../client";
import { Alert, Avatar, AvatarGroup, Empty, Icon, Modal, PageHeader, photoUrl, plural } from "../ui";

export default async function Hierarchy({ searchParams }: PageProps<"/hierarchy">) {
  await auth(true);
  const sp = await searchParams;
  // founders / past presidents moved to /history; keep old links working
  if (sp.tab === "founders" || sp.tab === "presidents") redirect(`/history?tab=${sp.tab}`);
  const error = sp.error ? String(sp.error) : undefined;

  const [roles, members] = await Promise.all([Role.find().sort("_id").lean(), Member.find({}, "name roleId status photoAt").sort("name").lean()]);

  // parentId null -> "null", so kids(null) gives the top level
  const kids = (pid: unknown) => roles.filter((r) => String(r.parentId) === String(pid));

  const errBox = <Alert className="mb-4">{error}</Alert>;

  const roleFields = (r?: (typeof roles)[number]) => (
    <>
      <label className="field">Role name<input name="name" defaultValue={r?.name} required className="input" /></label>
      <label className="field">
        Code prefix
        <input name="codePrefix" defaultValue={r?.codePrefix} required className="input font-mono uppercase" />
        <span className="hint">Used for new member codes, e.g. MGR-0001.</span>
      </label>
      <label className="field">
        Reports to
        <select name="parentId" defaultValue={String(r?.parentId ?? "")} className="input">
          <option value="">— Top level —</option>
          {roles.filter((x) => String(x._id) !== String(r?._id)).map((x) => <option key={String(x._id)} value={String(x._id)}>{x.name}</option>)}
        </select>
      </label>
    </>
  );

  const tree = (pid: unknown, depth = 0): ReactNode => {
    const list = kids(pid);
    if (!list.length) return null;
    return (
      <ul>
        {list.map((r) => {
          const id = String(r._id);
          const assigned = members.filter((m) => String(m.roleId) === id);
          // the card shows approved holders; pending applicants still block deletion below
          const holders = assigned.filter((m) => m.status === "approved");
          const subs = kids(r._id).length;
          // "LGB Members", "Committee Members": a headcount card with a face stack. Every other role shows its holder.
          const group = /member/i.test(r.name);
          // mirrors deleteRole's server-side checks, so Delete only shows when it can succeed
          const blocked = assigned.length ? "Reassign its members first." : subs ? "Move or delete its sub-roles first." : "";
          const faces = holders.map((h) => ({ name: h.name, src: photoUrl(h) }));
          return (
            // key includes the editable fields so a successful save remounts the node, closing its modal
            <li key={`${id}${r.name}${r.codePrefix}${r.parentId}`}>
              <div className={`role card p-4 text-left ${group ? "bg-gold/8" : ""}`}>
                {/* min-h-14 fixes the row height, so the phone tree's connector (--elbow in globals.css) hits its centre */}
                <div className="flex min-h-14 items-center gap-3">
                  {!holders.length ? (
                    <span className="chip size-14 bg-surface text-faint"><Icon n="user" className="size-6" /></span>
                  ) : holders.length === 1 && !group ? (
                    <Avatar name={holders[0].name} src={faces[0].src} className="size-14 text-base ring-2 ring-white" />
                  ) : (
                    <AvatarGroup people={faces} max={3} className="size-10 text-xs" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{r.name}</p>
                    <p className="truncate text-sm text-muted">{holders.length === 1 && !group ? holders[0].name : holders.length ? plural(holders.length, "member") : "Vacant"}</p>
                  </div>
                  <span className={`shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold ${depth ? "bg-tint text-accent" : "bg-accent text-white"}`}>{r.codePrefix}</span>
                </div>

                {holders.length > 1 && (
                  <details className="group mt-3">
                    <summary className="inline-flex items-center gap-1 rounded-md text-xs font-semibold text-accent">
                      <Icon n="chevron" className="size-3.5 transition-transform group-open:rotate-180" />
                      <span className="group-open:hidden">Show members</span><span className="hidden group-open:inline">Hide members</span>
                    </summary>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {holders.map((h) => <span key={String(h._id)} className="rounded-full bg-tint px-2.5 py-0.5 text-xs">{h.name}</span>)}
                    </div>
                  </details>
                )}

                <div className="mt-3 flex items-center gap-1 border-t border-line pt-3">
                  {subs > 0 && (
                    <label className="toggle flex h-11 cursor-pointer items-center gap-1 rounded-[8px] pr-2 text-xs font-medium text-muted hover:text-ink lg:h-9">
                      <input type="checkbox" className="sr-only" aria-label={`Collapse sub-roles of ${r.name}`} />
                      <Icon n="chevron" className="size-4" />
                      {plural(subs, "sub-role")}
                    </label>
                  )}
                  <div className="ml-auto flex gap-1">
                    <button popoverTarget={`role-${id}`} aria-label={`Edit ${r.name}`} title="Edit" className="icon-btn max-lg:size-11 lg:size-9"><Icon n="pencil" className="size-4" /></button>
                    {!blocked && (
                      <form action={deleteRole.bind(null, id)}>
                        <Btn ask={`Delete the role "${r.name}"?`} aria-label={`Delete ${r.name}`} title="Delete" className="icon-btn hover:bg-bad/8 hover:text-bad-ink max-lg:size-11 lg:size-9"><Icon n="trash" className="size-4" /></Btn>
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
      <PageHeader title="Hierarchy & roles" sub={`Designations, reporting lines and who holds them · ${plural(roles.length, "role")}`}>
        <button popoverTarget="role-new" className="btn"><Icon n="plus" className="size-4" />Add role</button>
      </PageHeader>
      <Alert>{error}</Alert>

      <div className="card bg-surface/50 p-3 sm:p-6 lg:overflow-x-auto lg:p-10">
        <div className="org lg:w-max lg:min-w-full">
          {tree(null) ?? <Empty icon="network" title="No roles yet">Add a top-level role to start the hierarchy.</Empty>}
        </div>
      </div>
      <p className="mt-4 text-sm text-muted">Collapse a branch with its arrow. Use the pencil to rename a role, change its prefix or move it under another role. Wide trees scroll sideways.</p>

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
