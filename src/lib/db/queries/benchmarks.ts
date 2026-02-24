import { and, desc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { benchmarks, hardware, models } from "@/lib/db/schema"

export interface BenchmarkListFilters {
  hardwareId?: string
  modelId?: string
  engine?: string
  os?: string
  sort?: "tps_desc" | "date_desc" | "upvotes_desc"
  limit?: number
}

const DEFAULT_LIMIT = 20

export async function fetchBenchmarks(filters: BenchmarkListFilters = {}) {
  const whereClauses = [eq(benchmarks.status, "verified")]

  if (filters.hardwareId) {
    whereClauses.push(eq(benchmarks.hardwareId, filters.hardwareId))
  }

  if (filters.modelId) {
    whereClauses.push(eq(benchmarks.modelId, filters.modelId))
  }

  if (filters.engine) {
    whereClauses.push(eq(benchmarks.engine, filters.engine))
  }

  if (filters.os) {
    whereClauses.push(eq(benchmarks.os, filters.os))
  }

  const orderBy =
    filters.sort === "upvotes_desc"
      ? desc(benchmarks.upvotes)
      : filters.sort === "date_desc"
        ? desc(benchmarks.createdAt)
        : desc(benchmarks.tokensPerSecond)

  const rows = await db
    .select({
      benchmark: benchmarks,
      hardware,
      model: models,
    })
    .from(benchmarks)
    .leftJoin(hardware, eq(benchmarks.hardwareId, hardware.id))
    .leftJoin(models, eq(benchmarks.modelId, models.id))
    .where(and(...whereClauses))
    .orderBy(orderBy)
    .limit(filters.limit ?? DEFAULT_LIMIT)

  return rows
}

export async function fetchBenchmarkById(id: string) {
  const [row] = await db
    .select({
      benchmark: benchmarks,
      hardware,
      model: models,
    })
    .from(benchmarks)
    .leftJoin(hardware, eq(benchmarks.hardwareId, hardware.id))
    .leftJoin(models, eq(benchmarks.modelId, models.id))
    .where(eq(benchmarks.id, id))
    .limit(1)

  return row ?? null
}

