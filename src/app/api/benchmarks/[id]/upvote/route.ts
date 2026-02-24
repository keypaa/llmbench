import { NextResponse } from "next/server"
import { and, eq, sql } from "drizzle-orm"

import { db } from "@/lib/db"
import { benchmarkUpvotes, benchmarks, reputationEvents } from "@/lib/db/schema"

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params

  const userId = "anonymous"

  const [existing] = await db
    .select()
    .from(benchmarkUpvotes)
    .where(
      and(
        eq(benchmarkUpvotes.benchmarkId, id),
        eq(benchmarkUpvotes.userId, userId),
      ),
    )
    .limit(1)

  if (existing) {
    await db
      .delete(benchmarkUpvotes)
      .where(
        and(
          eq(benchmarkUpvotes.benchmarkId, id),
          eq(benchmarkUpvotes.userId, userId),
        ),
      )

    await db
      .update(benchmarks)
      .set({ upvotes: sql`${benchmarks.upvotes} - 1` })
      .where(eq(benchmarks.id, id))

    return NextResponse.json({ upvoted: false })
  }

  await db.insert(benchmarkUpvotes).values({
    benchmarkId: id,
    userId,
  })

  const [updated] = await db
    .update(benchmarks)
    .set({ upvotes: sql`${benchmarks.upvotes} + 1` })
    .where(eq(benchmarks.id, id))
    .returning()

  if (updated) {
    await db.insert(reputationEvents).values({
      userId: updated.userId,
      eventType: "upvote_received",
      points: 2,
      referenceId: updated.id,
    })
  }

  return NextResponse.json({ upvoted: true })
}

