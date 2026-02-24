import { NextResponse } from "next/server"

import { db } from "@/lib/db"
import { benchmarks } from "@/lib/db/schema"
import { llamaBenchImportSchema } from "@/lib/validators/benchmarks"

export async function POST(request: Request) {
  const json = await request.json().catch(() => null)

  if (!Array.isArray(json)) {
    return NextResponse.json(
      { error: "Expected an array of llama-bench JSON objects" },
      { status: 400 },
    )
  }

  const parsed = json
    .map((item) => llamaBenchImportSchema.safeParse(item))
    .filter((result) => result.success) as {
    success: true
    data: unknown
  }[]

  if (parsed.length === 0) {
    return NextResponse.json(
      { error: "No valid llama-bench entries found" },
      { status: 400 },
    )
  }

  const values = parsed.map(({ data }) => {
    const entry = data as ReturnType<typeof llamaBenchImportSchema.parse>

    return {
      userId: "anonymous",
      hardwareId: "00000000-0000-0000-0000-000000000000",
      modelId: "00000000-0000-0000-0000-000000000000",
      quantization: "unknown",
      engine: "llama-bench",
      tokensPerSecond: entry.avg_ts,
      promptTokensPerSecond: entry.t_pp_ms ? 1000 / entry.t_pp_ms : null,
      importSource: "llama-bench",
      status: "pending" as const,
    }
  })

  const inserted = await db.insert(benchmarks).values(values).returning()

  return NextResponse.json({ count: inserted.length }, { status: 201 })
}

