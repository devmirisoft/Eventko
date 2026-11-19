import Link from "next/link";
import { Member, Role, nextCode } from "@/lib/db";
import { me } from "@/lib/auth";
import { Back, Icon, PageHeader } from "../../ui";
import NewMemberForm from "./form";

export default async function NewMember({ searchParams }: PageProps<"/members/new">) {
  const viewer = await me(); // public page; also connects the db
  if ((await searchParams).sent) {
    return (
      <div className="grid min-h-[calc(100dvh-6rem)] place-items-center">
        <div className="card w-full max-w-sm p-8 text-center">
          <span className="chip mx-auto size-16 text-ok"><Icon n="check" className="size-7" /></span>
          <h1 className="mt-6">Sent for approval</h1>
          <p className="mt-2 text-sm text-muted">An admin will review the registration before the member can log in.</p>
          <Link href="/" className="btn mt-6 w-full">Back to login</Link>
        </div>
      </div>
    );
  }

  const [roles, members] = await Promise.all([Role.find().sort("_id").lean(), Member.find({}, "memberCode").lean()]);
  const codes = members.map((m) => m.memberCode);

  return (
    <div className="mx-auto max-w-3xl">
      {!viewer && <Back href="/">Back to login</Back>}
      <PageHeader title="Create new member" sub="New members are reviewed by an admin before they can log in." />
      <NewMemberForm
        roles={roles.map((r) => ({ id: String(r._id), name: r.name }))}
        codes={Object.fromEntries(roles.map((r) => [String(r._id), nextCode(r.codePrefix, codes)]))}
        cancel={viewer?.isAdmin ? "/members" : viewer ? "/dashboard" : "/"}
      />
    </div>
  );
}
