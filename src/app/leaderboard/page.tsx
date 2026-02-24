import { desc } from "drizzle-orm"

import { db } from "@/lib/db"
import { benchmarks, hardware } from "@/lib/db/schema"

export default async function LeaderboardPage() {
  const rows = await db
    .select({
      id: hardware.id,
      brand: hardware.brand,
      name: hardware.name,
      vramGb: hardware.vramGb,
      bestTokensPerSecond: benchmarks.tokensPerSecond,
    })
    .from(benchmarks)
    .innerJoin(hardware, hardware.id.eq(benchmarks.hardwareId))
    .orderBy(desc(benchmarks.tokensPerSecond))
    .limit(50)

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">
          Hardware ranked by best observed tokens per second across benchmarks.
        </p>
      </header>

      <section className="overflow-x-auto rounded-md border bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-3 py-2 font-medium">Rank</th>
              <th className="px-3 py-2 font-medium">Hardware</th>
              <th className="px-3 py-2 font-medium">VRAM (GB)</th>
              <th className="px-3 py-2 font-medium">Best tok/s</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.id} className="border-b last:border-0">
                <td className="px-3 py-2 text-xs">{index + 1}</td>
                <td className="px-3 py-2 text-xs">
                  {row.brand} {row.name}
                </td>
                <td className="px-3 py-2 text-xs">{row.vramGb ?? "—"}</td>
                <td className="px-3 py-2 text-xs">
                  {row.bestTokensPerSecond.toFixed(1)}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  className="px-3 py-6 text-center text-xs text-muted-foreground"
                  colSpan={4}
                >
                  No benchmarks yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  )
}

