import Link from "next/link"
import { desc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { benchmarks } from "@/lib/db/schema"

export default async function ModerationQueuePage() {
  const rows = await db
    .select()
    .from(benchmarks)
    .where(eq(benchmarks.status, "pending"))
    .orderBy(desc(benchmarks.createdAt))
    .limit(50)

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Moderation queue
        </h1>
        <p className="text-sm text-muted-foreground">
          Simple read-only view of pending benchmarks. Mutation actions can be
          added later.
        </p>
      </header>

      <section className="overflow-x-auto rounded-md border bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-3 py-2 font-medium">ID</th>
              <th className="px-3 py-2 font-medium">Engine</th>
              <th className="px-3 py-2 font-medium">tok/s</th>
              <th className="px-3 py-2 font-medium">Created</th>
              <th className="px-3 py-2 font-medium">Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((benchmark) => (
              <tr key={benchmark.id} className="border-b last:border-0">
                <td className="px-3 py-2 text-xs">{benchmark.id}</td>
                <td className="px-3 py-2 text-xs">{benchmark.engine}</td>
                <td className="px-3 py-2 text-xs">
                  {benchmark.tokensPerSecond.toFixed(1)}
                </td>
                <td className="px-3 py-2 text-xs">
                  {benchmark.createdAt?.toISOString().slice(0, 10)}
                </td>
                <td className="px-3 py-2 text-xs">
                  <Link
                    href={`/benchmarks/${benchmark.id}`}
                    className="text-primary underline underline-offset-4"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  className="px-3 py-6 text-center text-xs text-muted-foreground"
                  colSpan={5}
                >
                  No pending benchmarks.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  )
}

