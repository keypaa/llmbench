import { NextResponse } from "next/server"
import { desc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { communityNotes } from "@/lib/db/schema"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params

  const notes = await db
    .select()
    .from(communityNotes)
    .where(eq(communityNotes.benchmarkId, id))
    .orderBy(desc(communityNotes.upvotes), desc(communityNotes.createdAt))

  return NextResponse.json(notes)
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params

  const json = await request.json().catch(() => null)
  const content =
    typeof json?.content === "string" ? json.content.trim() : undefined

  if (!content || content.length === 0 || content.length > 280) {
    return NextResponse.json(
      { error: "Note must be between 1 and 280 characters." },
      { status: 400 },
    )
  }

  const userId = "anonymous"

  const [inserted] = await db
    .insert(communityNotes)
    .values({
      benchmarkId: id,
      userId,
      content,
    })
    .returning()

  return NextResponse.json(inserted, { status: 201 })
}

