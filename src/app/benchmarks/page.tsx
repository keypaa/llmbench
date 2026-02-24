import Link from "next/link"

import { fetchBenchmarks } from "@/lib/db/queries/benchmarks"

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function BenchmarksPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams

  const sortParam = typeof params.sort === "string" ? params.sort : undefined

  const rows = await fetchBenchmarks({
    hardwareId:
      typeof params.hardwareId === "string" ? params.hardwareId : undefined,
    modelId: typeof params.modelId === "string" ? params.modelId : undefined,
    engine: typeof params.engine === "string" ? params.engine : undefined,
    os: typeof params.os === "string" ? params.os : undefined,
    sort:
      sortParam === "date_desc" || sortParam === "upvotes_desc"
        ? sortParam
        : "tps_desc",
  })

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Benchmarks
        </h1>
        <p className="text-sm text-muted-foreground">
          Showing verified benchmarks. Filters and richer UI will be added next.
        </p>
      </header>

      <section className="overflow-x-auto rounded-md border bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="px-3 py-2 font-medium">Hardware</th>
              <th className="px-3 py-2 font-medium">Model</th>
              <th className="px-3 py-2 font-medium">Quant</th>
              <th className="px-3 py-2 font-medium">Engine</th>
              <th className="px-3 py-2 font-medium">tok/s</th>
              <th className="px-3 py-2 font-medium">OS</th>
              <th className="px-3 py-2 font-medium">Votes</th>
              <th className="px-3 py-2 font-medium">Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ benchmark, hardware, model }) => (
              <tr key={benchmark.id} className="border-b last:border-0">
                <td className="px-3 py-2">
                  {hardware?.brand} {hardware?.name}
                </td>
                <td className="px-3 py-2">{model?.name}</td>
                <td className="px-3 py-2">{benchmark.quantization}</td>
                <td className="px-3 py-2">{benchmark.engine}</td>
                <td className="px-3 py-2">
                  {benchmark.tokensPerSecond?.toFixed(1)}
                </td>
                <td className="px-3 py-2">{benchmark.os}</td>
                <td className="px-3 py-2">{benchmark.upvotes}</td>
                <td className="px-3 py-2">
                  <Link
                    href={`/benchmarks/${benchmark.id}`}
                    className="text-xs font-medium text-primary underline underline-offset-4"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  className="px-3 py-6 text-center text-sm text-muted-foreground"
                  colSpan={8}
                >
                  No verified benchmarks yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  )
}

