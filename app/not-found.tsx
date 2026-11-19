import Link from "next/link";
import { Empty } from "./ui";

export default function NotFound() {
  return (
    <div className="card mx-auto mt-10 max-w-md">
      <Empty icon="search" title="Page not found">It may have been deleted, or the link is wrong.</Empty>
      <Link href="/dashboard" className="btn mb-4 w-full">Go to dashboard</Link>
    </div>
  );
}
