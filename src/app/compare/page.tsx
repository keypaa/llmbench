import Link from "next/link"

import { fetchBenchmarks } from "@/lib/db/queries/benchmarks"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function ComparePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const idsParam = params.ids
  const ids =
    typeof idsParam === "string"
      ? idsParam.split(",").filter((value) => value.length > 0)
      : []

  const rows =
    ids.length > 0
      ? await fetchBenchmarks()
      : []

  const selected = rows.filter(({ benchmark }) => ids.includes(benchmark.id))

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Compare</h1>
        <p className="text-sm text-muted-foreground">
          Compare up to four benchmarks by ID using{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            ?ids=bench1,bench2
          </code>
          .
        </p>
      </header>

      {selected.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Provide benchmark IDs in the query string to compare results.
        </p>
      ) : (
        <section className="overflow-x-auto rounded-md border bg-card">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-3 py-2 font-medium">Benchmark</th>
                <th className="px-3 py-2 font-medium">Hardware</th>
                <th className="px-3 py-2 font-medium">Model</th>
                <th className="px-3 py-2 font-medium">Quant</th>
                <th className="px-3 py-2 font-medium">Engine</th>
                <th className="px-3 py-2 font-medium">tok/s</th>
                <th className="px-3 py-2 font-medium">TTFT (ms)</th>
              </tr>
            </thead>
            <tbody>
              {selected.map(({ benchmark, hardware, model }) => (
                <tr key={benchmark.id} className="border-b last:border-0">
                  <td className="px-3 py-2 text-xs">
                    <Link
                      href={`/benchmarks/${benchmark.id}`}
                      className="underline underline-offset-4"
                    >
                      {benchmark.id.slice(0, 8)}…
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {hardware?.brand} {hardware?.name}
                  </td>
                  <td className="px-3 py-2 text-xs">{model?.name}</td>
                  <td className="px-3 py-2 text-xs">
                    {benchmark.quantization}
                  </td>
                  <td className="px-3 py-2 text-xs">{benchmark.engine}</td>
                  <td className="px-3 py-2 text-xs">
                    {benchmark.tokensPerSecond.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {benchmark.timeToFirstTokenMs?.toFixed(0) ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  )
}

