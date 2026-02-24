import { eq, sql, sum } from "drizzle-orm"

import { db } from "@/lib/db"
import { benchmarks, reputationEvents } from "@/lib/db/schema"

interface ProfilePageProps {
  params: Promise<{
    userId: string
  }>
}

export default async function ProfilePage(props: ProfilePageProps) {
  const { userId } = await props.params

  const [reputationRow] = await db
    .select({
      total: sum(reputationEvents.points).mapWith(Number),
    })
    .from(reputationEvents)
    .where(eq(reputationEvents.userId, userId))

  const reputation = reputationRow?.total ?? 0

  const userBenchmarks = await db
    .select({
      id: benchmarks.id,
      status: benchmarks.status,
      createdAt: benchmarks.createdAt,
      tokensPerSecond: benchmarks.tokensPerSecond,
      engine: benchmarks.engine,
    })
    .from(benchmarks)
    .where(eq(benchmarks.userId, userId))
    .orderBy(sql`${benchmarks.createdAt} desc`)

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          User profile
        </h1>
        <p className="text-sm text-muted-foreground break-all">{userId}</p>
      </header>

      <section className="rounded-md border bg-card p-4 text-sm">
        <h2 className="text-xs font-semibold uppercase text-muted-foreground">
          Reputation
        </h2>
        <p className="mt-2 text-2xl font-semibold">{reputation}</p>
      </section>

      <section className="rounded-md border bg-card p-4 text-sm">
        <h2 className="text-xs font-semibold uppercase text-muted-foreground">
          Benchmarks
        </h2>
        <ul className="mt-2 space-y-1">
          {userBenchmarks.map((benchmark) => (
            <li
              key={benchmark.id}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <span className="truncate">
                {benchmark.engine} · {benchmark.tokensPerSecond.toFixed(1)} tok/s
              </span>
              <span className="text-muted-foreground">
                {benchmark.status} ·{" "}
                {benchmark.createdAt?.toISOString().slice(0, 10)}
              </span>
            </li>
          ))}
          {userBenchmarks.length === 0 && (
            <li className="text-xs text-muted-foreground">
              No benchmarks submitted yet.
            </li>
          )}
        </ul>
      </section>
    </main>
  )
}

