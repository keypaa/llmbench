import Link from "next/link"
import { notFound } from "next/navigation"

import { fetchBenchmarkById } from "@/lib/db/queries/benchmarks"

interface BenchmarkDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function BenchmarkDetailPage(
  props: BenchmarkDetailPageProps,
) {
  const { id } = await props.params
  const row = await fetchBenchmarkById(id)

  if (!row) {
    notFound()
  }

  const { benchmark, hardware, model } = row

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="space-y-1">
        <p className="text-xs text-muted-foreground">
          <Link href="/benchmarks" className="underline underline-offset-4">
            Benchmarks
          </Link>{" "}
          / Detail
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">
          {model?.name} on {hardware?.brand} {hardware?.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {benchmark.quantization} · {benchmark.engine} ·{" "}
          {benchmark.tokensPerSecond?.toFixed(1)} tok/s
        </p>
      </header>

      <section className="grid gap-4 rounded-md border bg-card p-4 text-sm md:grid-cols-2">
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground">
            Hardware
          </h2>
          <dl className="space-y-1">
            <DetailRow label="Type" value={hardware?.type} />
            <DetailRow label="VRAM (GB)" value={hardware?.vramGb?.toString()} />
            <DetailRow
              label="System RAM (GB)"
              value={benchmark.systemRamGb?.toString()}
            />
            <DetailRow label="OS" value={benchmark.os} />
            <DetailRow label="Driver" value={benchmark.driverVersion} />
          </dl>
        </div>

        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground">
            Model & Engine
          </h2>
          <dl className="space-y-1">
            <DetailRow label="Model" value={model?.name} />
            <DetailRow label="Family" value={model?.family} />
            <DetailRow label="Quantization" value={benchmark.quantization} />
            <DetailRow label="Engine" value={benchmark.engine} />
            <DetailRow
              label="Parallel requests"
              value={benchmark.parallelRequests?.toString()}
            />
          </dl>
        </div>
      </section>

      <section className="grid gap-4 rounded-md border bg-card p-4 text-sm">
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground">
            Results
          </h2>
          <dl className="space-y-1">
            <DetailRow
              label="Tokens per second"
              value={benchmark.tokensPerSecond?.toFixed(1)}
            />
            <DetailRow
              label="Prompt tokens per second"
              value={benchmark.promptTokensPerSecond?.toFixed(1)}
            />
            <DetailRow
              label="TTFT (ms)"
              value={benchmark.timeToFirstTokenMs?.toFixed(0)}
            />
            <DetailRow
              label="Context size"
              value={benchmark.contextSize?.toString()}
            />
            <DetailRow
              label="Upvotes"
              value={benchmark.upvotes?.toString()}
            />
          </dl>
        </div>
        <div className="space-y-2">
          <h2 className="text-xs font-semibold uppercase text-muted-foreground">
            Notes
          </h2>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {benchmark.notes || "No notes provided."}
          </p>
        </div>
      </section>
    </main>
  )
}

interface DetailRowProps {
  label: string
  value?: string | null
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-xs font-medium">
        {value ?? <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  )
}

