import Link from "next/link";
import { redirect } from "next/navigation";
import { me } from "@/lib/auth";
import { login } from "./actions";
import { Btn, PasswordInput } from "./client";
import { Icon } from "./ui";

export default async function Login({ searchParams }: PageProps<"/">) {
  if (await me()) redirect("/dashboard");
  const { error } = await searchParams;

  return (
    <div className="grid min-h-[calc(100dvh-6rem)] place-items-center">
      <div className="card w-full max-w-sm p-6 sm:p-8">
        <span className="grid size-14 place-items-center rounded-2xl bg-surface text-gold shadow-soft"><Icon n="logo" className="size-7" /></span>
        <h1 className="mt-6">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Sign in to manage members, payments and events.</p>

        {error && <p role="alert" className="err mt-5"><Icon n="alert" className="size-5 shrink-0" />{error}</p>}

        <form action={login} className="mt-6 space-y-4">
          <label className="field">
            Phone number
            <input name="phone" type="tel" required autoComplete="username" className="input" />
          </label>
          <div className="field">
            <label htmlFor="password">Password</label>
            <PasswordInput id="password" name="password" required autoComplete="current-password" />
          </div>
          <Btn className="btn mt-2 w-full">Sign in</Btn>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          New here? <Link href="/members/new" className="link">Create new member</Link>
        </p>
      </div>
    </div>
  );
}
