import Link from "next/link";
import { Member, Role, nextCode } from "@/lib/db";
import { me } from "@/lib/auth";
import { AuthCard, Icon, PageHeader } from "../../ui";
import NewMemberForm, { JoinForm } from "./form";

// registration status timeline markers
const marker = { done: "bg-accent text-white", current: "bg-white ring-2 ring-gold", next: "border-2 border-line bg-white" };

export default async function NewMember({ searchParams }: PageProps<"/members/new">) {
  const viewer = await me(); // public page; also connects the db
  const { sent } = await searchParams; // submission time in ms, set by createMember's redirect
  if (sent) {
    const at = new Date(Number(sent)).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
    const steps = [
      ["done", "Application submitted", at],
      ["current", "Under review", "An admin is checking your details."],
      ["next", "Approved", "You'll be able to log in to the member portal."],
    ] as const;
    return (
      <AuthCard>
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-tint text-accent"><Icon n="check" className="size-7" /></span>
        <h1 className="mt-4 text-center text-2xl font-bold">Application received</h1>
        <p className="mt-1 text-center text-sm text-muted">Thanks for applying. You&apos;ll get access as soon as an admin approves it.</p>

        <ol className="mt-8">
          {steps.map(([state, title, sub], i) => (
            <li key={title} aria-current={state === "current" ? "step" : undefined} className="relative flex gap-4 pb-7 last:pb-0">
              {i < steps.length - 1 && <span aria-hidden className={`absolute top-9 bottom-1 left-4 w-0.5 -translate-x-1/2 ${state === "done" ? "bg-accent/40" : "bg-line"}`} />}
              <span aria-hidden className={`grid size-8 shrink-0 place-items-center rounded-full ${marker[state]}`}>
                {state === "done" ? <Icon n="check" className="size-4" /> : <span className={`size-2.5 rounded-full ${state === "current" ? "bg-gold" : "bg-line"}`} />}
              </span>
              <div className="pt-1">
                <p className={`text-sm font-semibold ${state === "next" ? "text-muted" : ""}`}>
                  {title}<span className="sr-only"> ({state === "done" ? "done" : state === "current" ? "in progress" : "not yet"})</span>
                </p>
                <p className="text-sm text-muted">{sub}</p>
              </div>
            </li>
          ))}
        </ol>

        <Link href="/?login" className="btn btn-ghost mt-8 w-full">Back to login</Link>
      </AuthCard>
    );
  }

  const [roles, members] = await Promise.all([Role.find().sort("_id").lean(), Member.find({}, "memberCode").lean()]);
  const codes = members.map((m) => m.memberCode);
  const options = roles.map((r) => ({ id: String(r._id), name: r.name }));
  if (!viewer) return <AuthCard><JoinForm roles={options} /></AuthCard>;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Add a member" sub="New members are reviewed by an admin before they can log in." />
      <NewMemberForm
        roles={options}
        codes={Object.fromEntries(roles.map((r) => [String(r._id), nextCode(r.codePrefix, codes)]))}
        cancel={viewer.isAdmin ? "/members" : "/dashboard"}
      />
    </div>
  );
}
