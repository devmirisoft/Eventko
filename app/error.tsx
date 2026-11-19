"use client"; // error boundaries must be client components

import { Empty } from "./ui";

export default function Error({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div role="alert" className="card mx-auto mt-10 max-w-md">
      <Empty icon="alert" title="Something went wrong">The page couldn&apos;t be loaded. Please try again.</Empty>
      <button onClick={() => retry()} className="btn mb-4 w-full">Try again</button>
    </div>
  );
}
