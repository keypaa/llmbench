import { NextResponse } from "next/server"
import { and, avg, desc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { benchmarks } from "@/lib/db/schema"
import { benchmarkSubmitSchema } from "@/lib/validators/benchmarks"

export async function GET() {
  const rows = await db
    .select()
    .from(benchmarks)
    .where(eq(benchmarks.status, "verified"))
    .orderBy(desc(benchmarks.tokensPerSecond))
    .limit(50)

  return NextResponse.json(rows)
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null)

  const parseResult = benchmarkSubmitSchema.safeParse(json)

  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parseResult.error.format() },
      { status: 400 },
    )
  }

  const data = parseResult.data

  const combinationWhere = and(
    eq(benchmarks.hardwareId, data.hardwareId),
    eq(benchmarks.modelId, data.modelId),
    eq(benchmarks.quantization, data.quantization),
  )

  const [stats] = await db
    .select({
      medianTokensPerSecond: avg(benchmarks.tokensPerSecond),
    })
    .from(benchmarks)
    .where(and(eq(benchmarks.status, "verified"), combinationWhere))

  let status: "pending" | "verified" | "rejected" | "flagged" = "pending"

  if (stats?.medianTokensPerSecond) {
    const median = stats.medianTokensPerSecond
    if (
      data.tokensPerSecond > median * 3 ||
      data.tokensPerSecond < median * 0.3
    ) {
      status = "flagged"
    }
  }

  const [inserted] = await db
    .insert(benchmarks)
    .values({
      userId: "anonymous",
      hardwareId: data.hardwareId,
      systemRamGb: data.systemRamGb,
      modelId: data.modelId,
      quantization: data.quantization,
      engine: data.engine,
      engineVersion: data.engineVersion,
      engineParams: data.engineParams,
      tokensPerSecond: data.tokensPerSecond,
      promptTokensPerSecond: data.promptTokensPerSecond,
      timeToFirstTokenMs: data.timeToFirstTokenMs,
      parallelRequests: data.parallelRequests ?? 1,
      contextSize: data.contextSize,
      os: data.os,
      driverVersion: data.driverVersion,
      notes: data.notes,
      sourceUrl: data.sourceUrl,
      status,
      importSource: "manual",
    })
    .returning()

  return NextResponse.json(inserted, { status: 201 })
}

